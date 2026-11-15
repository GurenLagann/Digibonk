import * as THREE from 'three';
import { groundY } from './terrain';
import { MOVES } from '../data/moves';
import type { Area } from '../sim/combat';
import type { RunEvent, RunState } from '../sim/run';

const PICKUP_COLORS: Record<string, number> = { xp: 0x4af0ff, card: 0xf0f0ff, item: 0xffd84a, heal: 0xff6a9a, fragment: 0xb06aff, digidata: 0x3cff8a };

class Instanced {
  mesh: THREE.InstancedMesh; private i = 0; private m = new THREE.Matrix4(); private c = new THREE.Color();
  private q = new THREE.Quaternion(); private p = new THREE.Vector3(); private s = new THREE.Vector3();
  constructor(scene: THREE.Scene, geo: THREE.BufferGeometry, mat: THREE.Material, cap: number) {
    this.mesh = new THREE.InstancedMesh(geo, mat, cap);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3);
    this.mesh.frustumCulled = false; scene.add(this.mesh);
  }
  begin() { this.i = 0; }
  add(x: number, y: number, z: number, scale: number, color: number, rotY = 0) {
    if (this.i >= this.mesh.instanceMatrix.count) return;
    this.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rotY);
    this.mesh.setMatrixAt(this.i, this.m.compose(this.p.set(x, y, z), this.q, this.s.set(scale, scale, scale)));
    this.mesh.setColorAt(this.i, this.c.setHex(color));
    this.i++;
  }
  end() { this.mesh.count = this.i; this.mesh.instanceMatrix.needsUpdate = true; if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true; }
}

interface Floater { sprite: THREE.Sprite; life: number; vy: number; tex: THREE.CanvasTexture; ctx: CanvasRenderingContext2D }

export class Vfx {
  private proj: Instanced; private hostile: Instanced; private pickups: Instanced;
  private areaMeshes: THREE.Mesh[] = [];
  /** moldes das áreas, subdivididos para deitar sobre o relevo; cada malha de área tem sua cópia */
  private areaTemplates: Record<Area['shape'], THREE.BufferGeometry> = {
    circle: new THREE.RingGeometry(0, 1, 32, 6).rotateX(-Math.PI / 2),
    cone: new THREE.RingGeometry(0, 1, 16, 6, -Math.PI / 4, Math.PI / 2).rotateX(-Math.PI / 2),
    beam: new THREE.PlaneGeometry(1, 1, 12, 4).rotateX(-Math.PI / 2).translate(0.5, 0, 0),
  };
  private tmpV = new THREE.Vector3();
  private floaters: Floater[] = []; private nextFloater = 0;
  /** ícones dos coletáveis (pixel art do DRA1 em public/itens-dra1) */
  private iconMats = new Map<string, THREE.SpriteMaterial>(); private iconSprites: THREE.Sprite[] = [];

  constructor(private scene: THREE.Scene) {
    this.proj = new Instanced(scene, new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial(), 1024);
    this.hostile = new Instanced(scene, new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial(), 256);
    this.pickups = new Instanced(scene, new THREE.OctahedronGeometry(0.3), new THREE.MeshLambertMaterial(), 2048);
    for (const k of ['heal', 'item', 'card', 'fragment', 'digidata', 'xp', 'xpbig']) {
      new THREE.TextureLoader().load(`./itens-dra1/${k}.png`, t => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
        this.iconMats.set(k, new THREE.SpriteMaterial({ map: t, transparent: true }));
      }, undefined, () => {});
    }
    for (let i = 0; i < 64; i++) {
      const c = document.createElement('canvas'); c.width = 64; c.height = 32;
      const tex = new THREE.CanvasTexture(c);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
      sprite.scale.set(1.6, 0.8, 1); sprite.visible = false; sprite.renderOrder = 10; scene.add(sprite);
      this.floaters.push({ sprite, life: 0, vy: 0, tex, ctx: c.getContext('2d')! });
    }
  }

  private areaMesh(i: number): THREE.Mesh {
    while (this.areaMeshes.length <= i) {
      // teste de profundidade ligado: a área fica atrás de paredes/sprites; deitada no relevo + polygonOffset para não sumir no chão
      const m = new THREE.Mesh(undefined, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
      m.userData.geos = {};
      this.scene.add(m); this.areaMeshes.push(m);
    }
    return this.areaMeshes[i];
  }

  private drawArea(mesh: THREE.Mesh, a: Area) {
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const color = a.hostile ? 0xff2a2a : MOVES[a.moveId]?.color ?? 0xffffff;
    mat.color.setHex(color);
    const k = Math.max(0, a.life / a.maxLife);
    mat.opacity = a.hostile && a.delay > 0 ? 0.25 + 0.15 * Math.sin(performance.now() / 60) : 0.55 * k;
    mesh.visible = true;
    mesh.position.set(a.x, 0, a.z);
    mesh.rotation.set(0, -Math.atan2(a.dz, a.dx), 0);
    if (a.shape === 'beam') mesh.scale.set(a.length, 1, a.radius * 2);
    else mesh.scale.set(a.radius, 1, a.radius);
    // cópia do molde desta malha; cada vértice vai para a altura do chão onde cai no mundo
    const geos = mesh.userData.geos as Record<string, THREE.BufferGeometry>;
    const tpl = this.areaTemplates[a.shape];
    const geo = (geos[a.shape] ??= tpl.clone());
    mesh.geometry = geo;
    mesh.updateMatrix();
    const src = tpl.attributes.position, dst = geo.attributes.position as THREE.BufferAttribute, v = this.tmpV;
    for (let i = 0; i < src.count; i++) {
      v.set(src.getX(i), 0, src.getZ(i)).applyMatrix4(mesh.matrix);
      dst.setY(i, groundY(v.x, v.z) + 0.06);
    }
    dst.needsUpdate = true;
    geo.computeBoundingSphere();
  }

  private floatNumber(x: number, z: number, n: number) {
    const f = this.floaters[this.nextFloater++ % this.floaters.length];
    const g = f.ctx; g.clearRect(0, 0, 64, 32);
    g.font = 'bold 22px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = '#000'; g.fillStyle = '#fff';
    const t = String(Math.round(n)); g.strokeText(t, 32, 16); g.fillText(t, 32, 16);
    f.tex.needsUpdate = true; f.life = 0.7; f.vy = 2.2;
    f.sprite.position.set(x + (Math.random() - 0.5), groundY(x, z) + 1.6, z); f.sprite.visible = true;
  }

  sync(run: RunState, events: RunEvent[], dt: number, time: number) {
    let numbers = 0;
    for (const e of events) if (e.type === 'hit' && numbers++ < 12) this.floatNumber(e.x, e.z, e.dmg);
    for (const f of this.floaters) {
      if (f.life <= 0) continue;
      f.life -= dt; f.sprite.position.y += f.vy * dt;
      (f.sprite.material as THREE.SpriteMaterial).opacity = Math.min(1, f.life * 3);
      if (f.life <= 0) f.sprite.visible = false;
    }
    this.proj.begin();
    for (const p of run.combat.projectiles) this.proj.add(p.x, groundY(p.x, p.z) + 0.9, p.z, Math.max(0.25, p.radius * 0.7), MOVES[p.moveId]?.color ?? 0xffffff);
    this.proj.end();
    this.hostile.begin();
    for (const h of run.combat.hostiles) this.hostile.add(h.x, groundY(h.x, h.z) + 0.9, h.z, Math.max(0.3, h.radius), MOVES[h.moveId]?.color ?? 0xff3a3a);
    this.hostile.end();
    let ai = 0;
    for (const a of run.combat.areas) this.drawArea(this.areaMesh(ai++), a);
    for (let i = ai; i < this.areaMeshes.length; i++) this.areaMeshes[i].visible = false;
    this.pickups.begin();
    let si = 0;
    for (const p of run.pickups) {
      const key = p.kind === 'xp' && p.value >= 10 ? 'xpbig' : p.kind;
      const mat = this.iconMats.get(key);
      if (mat) {
        let sp = this.iconSprites[si];
        if (!sp) { sp = new THREE.Sprite(mat); this.scene.add(sp); this.iconSprites.push(sp); }
        const sz = key === 'xp' ? 0.55 : key === 'xpbig' ? 0.9 : 1.1;
        sp.material = mat; sp.visible = true; sp.scale.set(sz, sz, 1);
        sp.position.set(p.x, groundY(p.x, p.z) + 0.35 + sz * 0.4 + Math.sin(time * 3 + p.id) * 0.12, p.z); si++;
        continue;
      }
      const big = p.kind === 'xp' ? 0.8 : 1.6;
      this.pickups.add(p.x, groundY(p.x, p.z) + 0.5 + Math.sin(time * 3 + p.id) * 0.12, p.z, big, PICKUP_COLORS[p.kind] ?? 0xffffff, time * 2 + p.id);
    }
    this.pickups.end();
    for (let i = si; i < this.iconSprites.length; i++) this.iconSprites[i].visible = false;
  }
}
