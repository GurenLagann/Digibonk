import * as THREE from 'three';
import { T } from '../../data/tuning';

/** guarda tudo que o bioma cria para o dispose */
export class Bag {
  readonly geos: THREE.BufferGeometry[] = [];
  readonly mats: THREE.Material[] = [];
  readonly texs: THREE.Texture[] = [];
  readonly meshes: THREE.InstancedMesh[] = [];
  geo<G extends THREE.BufferGeometry>(g: G): G { this.geos.push(g); return g; }
  mat<M extends THREE.Material>(m: M): M { this.mats.push(m); return m; }
  tex<X extends THREE.Texture>(t: X): X { this.texs.push(t); return t; }
  inst(m: THREE.InstancedMesh): THREE.InstancedMesh { this.meshes.push(m); return m; }
  dispose() {
    for (const m of this.meshes) m.dispose();
    for (const g of new Set(this.geos)) g.dispose();
    for (const m of new Set(this.mats)) m.dispose();
    for (const t of new Set(this.texs)) t.dispose();
  }
}

/** textura repetível de public/biomas/<bioma>/<nome>.webp */
export function loadTexture(bag: Bag, biome: string, name: string, repeat = 1): THREE.Texture {
  const t = bag.tex(new THREE.TextureLoader().load(`./biomas/${biome}/${name}.webp`));
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** céu em degradê pela elevação (equiretangular: acompanha o olhar, não a tela) */
export function skyTexture(bag: Bag, top: number, horizon: number, bottom: number): THREE.DataTexture {
  const H = 64, W = 2, data = new Uint8Array(W * H * 4);
  const ct = new THREE.Color(top), ch = new THREE.Color(horizon), cb = new THREE.Color(bottom), c = new THREE.Color();
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1); // 0 = olhando para baixo, 1 = para cima
    if (v >= 0.5) c.copy(ch).lerp(ct, smooth(Math.min(1, (v - 0.5) / 0.35)));
    else c.copy(ch).lerp(cb, smooth(Math.min(1, (0.5 - v) / 0.15)));
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      data[i] = Math.round(c.r * 255); data[i + 1] = Math.round(c.g * 255); data[i + 2] = Math.round(c.b * 255); data[i + 3] = 255;
    }
  }
  const t = bag.tex(new THREE.DataTexture(data, W, H));
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** anel de mata distante (sem nevoeiro) com o topo recortado; segue a câmera no plano */
export function silhouette(bag: Bag, rng: () => number, radius: number, base: number, peak: number, color: number): THREE.Mesh {
  const N = 160, pos: number[] = [], idx: number[] = [];
  const phase = rng() * 10;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const bump = 0.5 + 0.25 * Math.sin(a * 7 + phase) + 0.15 * Math.sin(a * 23 + phase * 2) + 0.1 * rng();
    const h = base + (peak - base) * bump;
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius;
    pos.push(x, -8, z, x, h, z);
    if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = bag.geo(new THREE.BufferGeometry());
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, bag.mat(new THREE.MeshBasicMaterial({ color, fog: false, side: THREE.DoubleSide })));
  m.userData.backdrop = true; // fundo, não conta como peça alta no mapa
  m.renderOrder = -1;
  return m;
}

const seg = new THREE.Vector3(), rel = new THREE.Vector3();

/** a esfera (x,y,z,r) encosta no segmento câmera→parceiro? */
export function crownOccludes(cam: THREE.Vector3, target: THREE.Vector3, x: number, y: number, z: number, r: number): boolean {
  seg.subVectors(target, cam);
  rel.set(x - cam.x, y - cam.y, z - cam.z);
  const len2 = seg.lengthSq();
  const t = len2 > 0 ? Math.max(0, Math.min(1, rel.dot(seg) / len2)) : 0;
  return rel.addScaledVector(seg, -t).lengthSq() < r * r;
}

export interface Crown { x: number; y: number; z: number; r: number; m: THREE.Matrix4; c: THREE.Color }

/** copas em dois InstancedMesh: opacas e semitransparentes; update move as que tapam o parceiro */
export class FadeCrowns {
  readonly opaque: THREE.InstancedMesh;
  readonly faded: THREE.InstancedMesh;
  private state: Uint8Array;
  private reach: number;

  constructor(bag: Bag, name: string, geo: THREE.BufferGeometry, mat: THREE.Material, fadedMat: THREE.Material, private crowns: Crown[]) {
    const n = Math.max(1, crowns.length);
    this.opaque = bag.inst(new THREE.InstancedMesh(geo, mat, n)); this.opaque.name = name;
    this.faded = bag.inst(new THREE.InstancedMesh(geo, fadedMat, n)); this.faded.name = `${name}-faded`;
    this.state = new Uint8Array(crowns.length);
    // cor por instância nos dois desde já, para o shader não recompilar na primeira troca
    const white = new THREE.Color(1, 1, 1);
    this.opaque.setColorAt(0, white); this.faded.setColorAt(0, white);
    this.reach = T.CAMERA.DIST + 2 + crowns.reduce((a, c) => Math.max(a, c.r), 0);
    this.write();
  }

  private write() {
    let a = 0, b = 0;
    this.crowns.forEach((c, i) => {
      const mesh = this.state[i] ? this.faded : this.opaque, k = this.state[i] ? b++ : a++;
      mesh.setMatrixAt(k, c.m); mesh.setColorAt(k, c.c);
    });
    this.opaque.count = a; this.faded.count = b;
    for (const m of [this.opaque, this.faded]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }

  update(cam: THREE.Vector3, target: THREE.Vector3) {
    let changed = false;
    this.crowns.forEach((c, i) => {
      const near = Math.abs(c.x - target.x) < this.reach && Math.abs(c.z - target.z) < this.reach;
      const s = near && crownOccludes(cam, target, c.x, c.y, c.z, c.r) ? 1 : 0;
      if (s !== this.state[i]) { this.state[i] = s; changed = true; }
    });
    if (changed) this.write();
  }
}
