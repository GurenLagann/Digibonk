import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng } from '../../core/rng';
import { T } from '../../data/tuning';
import { MAP_OBSTACLES } from '../../sim/map';
import { Bag, FadeCrowns, instanced, loadTexture, silhouette, skyTexture, type Crown } from './common';
import type { BiomeView } from './types';

const ID = 'floresta-dw1';
const H = T.MAP_HALF;
const GROUND = 600;

/** copa redonda e fofa: icosaedros agrupados, centrada em x/z */
function crownGeometry(bag: Bag, detail = 1): THREE.BufferGeometry {
  const blobs = [[0, 0, 0, 1], [0.65, -0.25, 0.2, 0.7], [-0.55, -0.2, -0.35, 0.72], [0.1, 0.45, -0.4, 0.6], [-0.2, -0.3, 0.6, 0.62]];
  const parts = blobs.map(([x, y, z, r]) => new THREE.IcosahedronGeometry(r, detail).translate(x, y, z));
  const g = bag.geo(mergeGeometries(parts)!);
  parts.forEach(p => p.dispose());
  g.computeBoundingBox();
  const c = g.boundingBox!.getCenter(new THREE.Vector3());
  g.translate(-c.x, 0, -c.z);
  return g;
}

/** tronco seco com galhos (altura ~4) */
function deadGeometry(bag: Bag): THREE.BufferGeometry {
  const parts = [new THREE.CylinderGeometry(0.16, 0.3, 4, 6).translate(0, 2, 0)];
  for (const [a, y, tilt, len] of [[0, 2.6, 0.9, 1.6], [2.1, 3.1, 0.8, 1.3], [4.2, 2.2, 1.0, 1.2]]) {
    const b = new THREE.CylinderGeometry(0.05, 0.1, len, 5).translate(0, len / 2, 0).rotateZ(-tilt).rotateY(a).translate(0, y, 0);
    parts.push(b);
  }
  const g = bag.geo(mergeGeometries(parts)!);
  parts.forEach(p => p.dispose());
  return g;
}

/** árvore gigante: tronco grosso com raízes abertas (altura 14) */
function giantGeometry(bag: Bag): THREE.BufferGeometry {
  const parts = [new THREE.CylinderGeometry(1.1, 1.9, 14, 10).translate(0, 7, 0)];
  for (let i = 0; i < 6; i++) {
    parts.push(new THREE.CylinderGeometry(0.25, 0.6, 4, 6).translate(0, 2, 0).rotateZ(1.05).rotateY((i / 6) * Math.PI * 2 + 0.3).translate(0, 1.2, 0));
  }
  const g = bag.geo(mergeGeometries(parts)!);
  parts.forEach(p => p.dispose());
  return g;
}

/** trecho de cerca de madeira (2,4 ao longo de x, altura 0,9) */
function fenceGeometry(bag: Bag): THREE.BufferGeometry {
  const parts = [
    new THREE.BoxGeometry(0.14, 0.9, 0.14).translate(-1.1, 0.45, 0), new THREE.BoxGeometry(0.14, 0.9, 0.14).translate(1.1, 0.45, 0),
    new THREE.BoxGeometry(2.4, 0.08, 0.06).translate(0, 0.35, 0), new THREE.BoxGeometry(2.4, 0.08, 0.06).translate(0, 0.7, 0),
  ];
  const g = bag.geo(mergeGeometries(parts)!);
  parts.forEach(p => p.dispose());
  return g;
}

/** tufo de grama: cones finos inclinados */
function tuftGeometry(bag: Bag): THREE.BufferGeometry {
  const parts = [0, 1, 2, 3].map(i => new THREE.ConeGeometry(0.1, 0.55, 4).translate(0, 0.27, 0).rotateZ(0.3).rotateY(i * 1.6));
  const g = bag.geo(mergeGeometries(parts)!);
  parts.forEach(p => p.dispose());
  return g;
}

/** flores: três cabecinhas perto do chão */
function flowerGeometry(bag: Bag): THREE.BufferGeometry {
  const parts = [[0, 0.16, 0], [0.18, 0.12, 0.08], [-0.1, 0.2, -0.14]].map(([x, y, z]) => new THREE.IcosahedronGeometry(0.09, 0).translate(x, y, z));
  const g = bag.geo(mergeGeometries(parts)!);
  parts.forEach(p => p.dispose());
  return g;
}

/** árvore de obstáculo/borda: matriz do tronco e da copa a partir do "tamanho" k */
function treeParts(x: number, z: number, k: number, rot: number, tint: number) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
  const th = 2 * (0.9 + 0.35 * k), cr = 1 + 0.75 * k, cy = th + cr * 0.55;
  const trunk = m.clone().compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(0.7 + 0.4 * k, 0.9 + 0.35 * k, 0.7 + 0.4 * k));
  const crown: Crown = {
    x, y: cy, z, r: cr * 1.25,
    m: m.clone().compose(new THREE.Vector3(x, cy, z), q, new THREE.Vector3(cr, cr * 0.85, cr)),
    c: new THREE.Color().setHSL(0.3 + tint * 0.04, 0.35, 0.75 + tint * 0.15),
  };
  return { trunk, crown };
}

export function buildForestDw1(): BiomeView {
  const bag = new Bag(), group = new THREE.Group();
  group.name = `bioma-${ID}`;
  const rng = createRng(0xd1f0e5), r = rng.next;
  const tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), s = new THREE.Vector3();
  const mat4 = (x: number, y: number, z: number, rot: number, sx: number, sy = sx, sz = sx) =>
    tmp.clone().compose(p.set(x, y, z), q.setFromAxisAngle(up, rot), s.set(sx, sy, sz));

  // texturas e materiais
  const grama = loadTexture(ID, 'grama', GROUND / 5), escura = loadTexture(ID, 'grama-escura', 2);
  const copa = loadTexture(ID, 'copa', 1.5), casca = loadTexture(ID, 'casca'), pedra = loadTexture(ID, 'pedra');
  const crownMat = bag.mat(new THREE.MeshLambertMaterial({ map: copa }));
  const crownFaded = bag.mat(new THREE.MeshLambertMaterial({ map: copa, transparent: true, opacity: 0.3, depthWrite: false }));
  const barkMat = bag.mat(new THREE.MeshLambertMaterial({ map: casca }));
  const deadMat = bag.mat(new THREE.MeshLambertMaterial({ map: casca, color: 0x9a8a7a }));
  const rockMat = bag.mat(new THREE.MeshLambertMaterial({ map: pedra, color: 0xa8c098, flatShading: true }));
  const crownGeo = crownGeometry(bag), trunkGeo = bag.geo(new THREE.CylinderGeometry(0.22, 0.32, 2, 7).translate(0, 1, 0));
  const rockGeo = bag.geo(new THREE.DodecahedronGeometry(1, 0));

  // chão: grama + manchas de grama escura (bem mais escuras que a textura sozinha)
  const ground = new THREE.Mesh(bag.geo(new THREE.PlaneGeometry(GROUND, GROUND)), bag.mat(new THREE.MeshLambertMaterial({ map: grama, color: 0xd8e6cc })));
  ground.rotation.x = -Math.PI / 2; ground.name = 'ground';
  const patchMat = bag.mat(new THREE.MeshLambertMaterial({ map: escura, color: 0x6f8a62, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
  const patchGeo = bag.geo(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2));
  const patches: THREE.Matrix4[] = [];
  for (let i = 0; i < 220; i++) patches.push(mat4((r() * 2 - 1) * (H + 40), 0.02, (r() * 2 - 1) * (H + 40), r() * Math.PI, 3 + r() * 6, 1, 2 + r() * 4));
  group.add(ground, instanced(bag, 'ground-patches', patchGeo, patchMat, patches));

  // obstáculos: árvores de copa redonda e pedras musgosas
  const trunks: THREE.Matrix4[] = [], crowns: Crown[] = [], rocks: THREE.Matrix4[] = [];
  for (const o of MAP_OBSTACLES) {
    if (o.kind === 'tree') {
      const t = treeParts(o.x, o.z, o.r, r() * Math.PI * 2, r() * 2 - 1);
      trunks.push(t.trunk); crowns.push(t.crown);
    } else rocks.push(mat4(o.x, o.r * 0.4, o.z, o.x, o.r, o.r * 0.8, o.r));
  }
  const treeFade = new FadeCrowns(bag, 'tree-crown', crownGeo, crownMat, crownFaded, crowns);
  group.add(instanced(bag, 'tree-trunk', trunkGeo, barkMat, trunks), treeFade.opaque, treeFade.faded, instanced(bag, 'rock', rockGeo, rockMat, rocks));

  // borda: muralha de mata densa além de MAP_HALF, com árvores secas e gigantes nos cantos
  const giants = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sz]) => [sx * (H + 16), sz * (H + 16)] as const);
  // dividida por lado (n/s/e/w) para o frustum culling descartar o que fica atrás da câmera
  const SIDES = ['n', 's', 'e', 'w'] as const;
  const sideOf = (x: number, z: number) => Math.abs(x) > Math.abs(z) ? (x > 0 ? 'e' : 'w') : (z > 0 ? 's' : 'n');
  const bTrunks = Object.fromEntries(SIDES.map(k => [k, [] as THREE.Matrix4[]])), bCrowns = Object.fromEntries(SIDES.map(k => [k, [] as Crown[]]));
  const dead: THREE.Matrix4[] = [];
  for (let gx = -H - 30; gx <= H + 30; gx += 5) for (let gz = -H - 30; gz <= H + 30; gz += 5) {
    const x = gx + (r() * 2 - 1) * 1.8, z = gz + (r() * 2 - 1) * 1.8, m = Math.max(Math.abs(x), Math.abs(z));
    if (m < H + 3 || m > H + 30) continue;
    if (giants.some(([ax, az]) => Math.hypot(ax - x, az - z) < 9)) continue;
    if (r() < 0.1) { dead.push(mat4(x, 0, z, r() * 6.28, 0.9 + r() * 0.6)); continue; }
    const t = treeParts(x, z, 1.4 + r() * 1.2, r() * Math.PI * 2, r() * 2 - 1), k = sideOf(x, z);
    bTrunks[k].push(t.trunk); bCrowns[k].push(t.crown);
  }
  const giantMats = giants.map(([x, z]) => mat4(x, 0, z, r() * 6.28, 1));
  for (const [x, z] of giants) {
    const cr = 7.5;
    bCrowns[sideOf(x, z + 0.01)].push({ x, y: 15, z, r: cr * 1.25, m: mat4(x, 15, z, r() * 6.28, cr, cr * 0.8, cr), c: new THREE.Color().setHSL(0.31, 0.3, 0.7) });
  }
  // copas da borda com poucos polígonos (são ~1000)
  const lowCrownGeo = crownGeometry(bag, 0);
  const borderFades = SIDES.map(k => new FadeCrowns(bag, `border-crown-${k}`, lowCrownGeo, crownMat, crownFaded, bCrowns[k]));
  for (const [i, k] of SIDES.entries()) group.add(instanced(bag, `border-trunk-${k}`, trunkGeo, barkMat, bTrunks[k]), borderFades[i].opaque, borderFades[i].faded);
  group.add(instanced(bag, 'border-dead', deadGeometry(bag), deadMat, dead), instanced(bag, 'border-giant', giantGeometry(bag), barkMat, giantMats));

  // decoração baixa sem colisão (semente fixa, ≥ 2 dos obstáculos)
  // fora do ponto de nascimento (raio 4 em volta de 0,0) e longe dos obstáculos
  const free = (x: number, z: number) => Math.abs(x) <= H - 1 && Math.abs(z) <= H - 1 && Math.hypot(x, z) >= 4 && MAP_OBSTACLES.every(o => Math.hypot(o.x - x, o.z - z) - o.r >= 2.05);
  const scatter = (n: number, fn: (x: number, z: number) => THREE.Matrix4) => {
    const out: THREE.Matrix4[] = [];
    for (let tries = 0; out.length < n && tries < n * 20; tries++) {
      const x = (r() * 2 - 1) * (H - 1), z = (r() * 2 - 1) * (H - 1);
      if (free(x, z)) out.push(fn(x, z));
    }
    return out;
  };
  const tufts = scatter(700, (x, z) => mat4(x, 0, z, r() * 6.28, 0.8 + r() * 0.6));
  const bushes = scatter(120, (x, z) => mat4(x, 0.3, z, r() * 6.28, 0.45 + r() * 0.2, 0.32 + r() * 0.12, 0.45 + r() * 0.2));
  const stumps = scatter(30, (x, z) => mat4(x, 0, z, r() * 6.28, 0.8 + r() * 0.5));
  const pebbles = scatter(60, (x, z) => mat4(x, 0.08, z, r() * 6.28, 0.6 + r() * 0.8, 0.4 + r() * 0.3, 0.6 + r() * 0.8));
  // flores em moitinhas
  const flowers: THREE.Matrix4[] = [], flowerCols: THREE.Color[] = [];
  const palette = [0xffffff, 0xffe14a, 0xff5a5a, 0xff9ad8, 0xb58aff].map(c => new THREE.Color(c));
  for (let tries = 0; flowers.length < 350 && tries < 4000; tries++) {
    const cx = (r() * 2 - 1) * (H - 2), cz = (r() * 2 - 1) * (H - 2), col = palette[Math.floor(r() * palette.length)];
    for (let k = 0, n = 4 + Math.floor(r() * 5); k < n; k++) {
      const x = cx + (r() * 2 - 1) * 1.5, z = cz + (r() * 2 - 1) * 1.5;
      if (free(x, z)) { flowers.push(mat4(x, 0, z, r() * 6.28, 0.8 + r() * 0.5)); flowerCols.push(col); }
    }
  }
  // cercas: carreiras de 3 a 6 trechos
  const fences: THREE.Matrix4[] = [];
  for (let runs = 0, tries = 0; runs < 14 && tries < 400; tries++) {
    const sx = (r() * 2 - 1) * (H - 10), sz = (r() * 2 - 1) * (H - 10), a = r() * Math.PI, n = 3 + Math.floor(r() * 4);
    const dx = Math.cos(a), dz = -Math.sin(a), segs: THREE.Matrix4[] = [];
    let ok = true;
    for (let i = 0; i < n && ok; i++) {
      const cx = sx + dx * (2.4 * i + 1.2), cz = sz + dz * (2.4 * i + 1.2);
      ok = free(cx, cz) && free(cx - dx * 1.2, cz - dz * 1.2) && free(cx + dx * 1.2, cz + dz * 1.2);
      segs.push(mat4(cx, 0, cz, a, 1));
    }
    if (ok) { fences.push(...segs); runs++; }
  }
  const tuftMat = bag.mat(new THREE.MeshLambertMaterial({ color: 0x4f8a3a, flatShading: true }));
  const flowerMesh = instanced(bag, 'decor-flower', flowerGeometry(bag), bag.mat(new THREE.MeshLambertMaterial({ color: 0xffffff })), flowers, true);
  flowerCols.forEach((c, i) => flowerMesh.setColorAt(i, c));
  group.add(
    instanced(bag, 'decor-tuft', tuftGeometry(bag), tuftMat, tufts, true),
    instanced(bag, 'decor-bush', crownGeo, crownMat, bushes, true),
    instanced(bag, 'decor-stump', bag.geo(new THREE.CylinderGeometry(0.45, 0.55, 0.6, 8).translate(0, 0.3, 0)), barkMat, stumps, true),
    instanced(bag, 'decor-pebble', rockGeo, rockMat, pebbles, true),
    instanced(bag, 'decor-fence', fenceGeometry(bag), bag.mat(new THREE.MeshLambertMaterial({ map: casca, color: 0xd0a878 })), fences, true),
    flowerMesh,
  );

  // céu em degradê + silhueta de mata distante (cor puxada para o nevoeiro)
  const fog = 0xa9cfb2, fogC = new THREE.Color(fog), dark = new THREE.Color(0x2e5a34);
  const near = silhouette(bag, r, 230, 10, 28, dark.clone().lerp(fogC, 0.55).getHex());
  const far = silhouette(bag, r, 275, 18, 38, dark.clone().lerp(fogC, 0.78).getHex());
  near.name = 'silhouette-near'; far.name = 'silhouette-far';
  group.add(near, far);
  const background = skyTexture(bag, 0x4f8fcf, fog, 0x5a7a50);

  return {
    group,
    sky: { background, fog },
    // luz mais fechada e esverdeada
    light: { sky: 0xcfe8c0, ground: 0x2c4a24, hemi: 1.15, sun: 0xfff1cc, sunIntensity: 1.05 },
    update(_time, camPos, target) {
      near.position.set(camPos.x, 0, camPos.z); far.position.set(camPos.x, 0, camPos.z);
      treeFade.update(camPos, target);
      for (const f of borderFades) f.update(camPos, target);
    },
    dispose() { bag.dispose(); },
  };
}
