import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng } from '../../core/rng';
import { T } from '../../data/tuning';
import { MAP_OBSTACLES } from '../../sim/map';
import { terraces, type HeightFn } from '../terrain';
import { Bag, FadeCrowns, flatDecals, groundMesh, instanced, loadTexture, silhouette, skyTexture, type Crown } from './common';
import type { BiomeView } from './types';

/**
 * Factorial Town (DW1, cenários FACT01–FACT10), em dois biomas:
 *  - "fabrica": o exterior — chapa xadrez, grades enferrujadas, tanques, máquinas, faixas de perigo;
 *  - "nucleo": o miolo — painéis pretos com filetes de neon verde, engrenagens gigantes, consoles.
 * Obstáculos nas mesmas posições do sim (MAP_OBSTACLES): tree → tanque/engrenagem (alto, fica transparente
 * na frente do parceiro), rock → máquina/console. Decoração baixa (≤ 1,2) longe dos obstáculos e do nascimento.
 */
const H = T.MAP_HALF;
const GROUND = 600;
type Side = 'n' | 's' | 'e' | 'w';
const SIDES: Side[] = ['n', 's', 'e', 'w'];
const sideOf = (x: number, z: number): Side => Math.abs(x) > Math.abs(z) ? (x > 0 ? 'e' : 'w') : (z > 0 ? 's' : 'n');

function merged(bag: Bag, parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = bag.geo(mergeGeometries(parts)!);
  parts.forEach(p => p.dispose());
  return g;
}

/** faixa de perigo amarela e preta em diagonal (repetível) */
function hazardTexture(bag: Bag): THREE.DataTexture {
  const W = 32, Hh = 8, data = new Uint8Array(W * Hh * 4);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    const yellow = Math.floor((x + y) / 4) % 2 === 0, i = (y * W + x) * 4;
    data.set(yellow ? [240, 196, 40, 255] : [26, 24, 22, 255], i);
  }
  const t = bag.tex(new THREE.DataTexture(data, W, Hh));
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  return t;
}

/** utilidades de posição comuns aos dois biomas; tudo assentado no relevo `height` */
function helpers(seed: number, height: HeightFn) {
  const rng = createRng(seed), r = rng.next;
  const tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), s = new THREE.Vector3();
  const mat4 = (x: number, y: number, z: number, rot: number, sx: number, sy = sx, sz = sx) =>
    tmp.clone().compose(p.set(x, y + height(x, z), z), q.setFromAxisAngle(up, rot), s.set(sx, sy, sz));
  const free = (x: number, z: number) => Math.abs(x) <= H - 1 && Math.abs(z) <= H - 1 && Math.hypot(x, z) >= 4 && MAP_OBSTACLES.every(o => Math.hypot(o.x - x, o.z - z) - o.r >= 2.05);
  const scatter = (n: number, fn: (x: number, z: number) => THREE.Matrix4) => {
    const out: THREE.Matrix4[] = [];
    for (let tries = 0; out.length < n && tries < n * 20; tries++) {
      const x = (r() * 2 - 1) * (H - 1), z = (r() * 2 - 1) * (H - 1);
      if (free(x, z)) out.push(fn(x, z));
    }
    return out;
  };
  /** placas planas no chão (não são decoração com colisão: ficam rentes) */
  const floorRects = (n: number, minW: number, maxW: number) => {
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < n; i++) out.push(mat4((r() * 2 - 1) * (H + 30), 0, (r() * 2 - 1) * (H + 30), Math.floor(r() * 4) * Math.PI / 2, minW + r() * (maxW - minW), 1, minW + r() * (maxW - minW)));
    return out;
  };
  return { r, mat4, scatter, floorRects };
}

/** plano no chão, 1×1, com polygonOffset para não brigar com o piso */
const decal = (bag: Bag) => bag.geo(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0.015, 0));
const decalMat = (bag: Bag, params: THREE.MeshLambertMaterialParameters) =>
  bag.mat(new THREE.MeshLambertMaterial({ ...params, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));

// ───────────────────────────── Fábrica (exterior) ─────────────────────────────

/** tanque: corpo cilíndrico + domo + pés; raio 1, altura 3 (escalado pelo obstáculo) */
function tankGeometry(bag: Bag): THREE.BufferGeometry {
  const parts = [
    new THREE.CylinderGeometry(1, 1, 2.2, 14).translate(0, 1.5, 0),
    new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 2.6, 0),
    new THREE.CylinderGeometry(1.04, 1.04, 0.12, 14).translate(0, 1.0, 0),
    new THREE.CylinderGeometry(1.04, 1.04, 0.12, 14).translate(0, 2.2, 0),
  ];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    parts.push(new THREE.CylinderGeometry(0.1, 0.12, 0.45, 6).translate(Math.cos(a) * 0.75, 0.22, Math.sin(a) * 0.75));
  }
  return merged(bag, parts);
}

/** máquina: bloco com tampa e dois canos curtos; base 1×1, altura 1 */
function machineGeometry(bag: Bag): THREE.BufferGeometry {
  return merged(bag, [
    new THREE.BoxGeometry(1, 0.85, 1).translate(0, 0.425, 0),
    new THREE.BoxGeometry(0.9, 0.12, 0.9).translate(0, 0.91, 0),
    new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6).translate(0.3, 1.2, 0.2),
    new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6).translate(-0.25, 1.12, -0.25),
  ]);
}

/** prédio da borda: caixa 1×1×1 (escalada) */
const unitBox = (bag: Bag) => bag.geo(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));

export function buildFactory(): BiomeView {
  const ID = 'fabrica';
  const bag = new Bag(), group = new THREE.Group();
  group.name = `bioma-${ID}`;
  const height = terraces(0xfac701, 1.3, 2, 3);
  const { r, mat4, scatter, floorRects } = helpers(0xfac701, height);

  const chapa = loadTexture(ID, 'chapa', GROUND / 2.5), grade = loadTexture(ID, 'grade', 2);
  const maquina = loadTexture(ID, 'maquina', 1), tanque = loadTexture(ID, 'tanque', 1);
  const hazard = hazardTexture(bag);

  // chão: chapa xadrez + grades enferrujadas + faixas de perigo
  const ground = groundMesh(bag, height, bag.mat(new THREE.MeshLambertMaterial({ map: chapa, color: 0xc4c2ba })), GROUND);
  const d = decal(bag);
  group.add(ground,
    instanced(bag, 'floor-panel', d, decalMat(bag, { map: chapa, color: 0x8e8a80 }), flatDecals(height, floorRects(150, 6, 12)).map(m => { m.elements[13] -= 0.007; return m; })),
    instanced(bag, 'floor-grate', d, decalMat(bag, { map: grade, color: 0xe0c0a0 }), flatDecals(height, floorRects(300, 2.5, 4.5))),
    instanced(bag, 'floor-hazard', d, decalMat(bag, { map: hazard }), flatDecals(height, floorRects(110, 0.6, 1).map(m => m.multiply(new THREE.Matrix4().makeScale(6, 1, 0.8))))));

  // obstáculos: tanques (tree) e máquinas (rock)
  const tankMat = bag.mat(new THREE.MeshLambertMaterial({ map: tanque, color: 0xf0e6dc }));
  const tankFadedMat = bag.mat(new THREE.MeshLambertMaterial({ map: tanque, color: 0xf0e6dc, transparent: true, opacity: 0.3, depthWrite: false }));
  const machineMat = bag.mat(new THREE.MeshLambertMaterial({ map: maquina, color: 0xffffff, emissive: 0x2a2a26 }));
  const bandMat = bag.mat(new THREE.MeshLambertMaterial({ map: hazard }));
  const neonMat = bag.mat(new THREE.MeshBasicMaterial({ color: 0x46ff8a }));
  const tanks: Crown[] = [], machines: THREE.Matrix4[] = [], lights: THREE.Matrix4[] = [], bands: THREE.Matrix4[] = [];
  for (const o of MAP_OBSTACLES) {
    const rot = r() * Math.PI * 2;
    if (o.kind === 'tree') {
      const rad = o.r * 0.95, hs = 1 + o.r * 0.45; // altura 3 × hs
      tanks.push({ x: o.x, y: 1.5 * hs + height(o.x, o.z), z: o.z, r: Math.max(rad, 1.5 * hs) * 1.05, m: mat4(o.x, 0, o.z, rot, rad, hs, rad), c: new THREE.Color().setHSL(0.07, 0.25, 0.85 + r() * 0.15) });
    } else {
      const w = o.r * 1.35, h = 0.8 + o.r * 0.7;
      machines.push(mat4(o.x, 0, o.z, rot, w, h, w * 0.9));
      bands.push(mat4(o.x, 0, o.z, rot, w * 1.03, 0.22, w * 0.93));
      // filete de neon na frente da máquina (detalhe do "núcleo" aparecendo por fora)
      lights.push(mat4(o.x + Math.sin(rot) * w * 0.455, h * 0.6, o.z + Math.cos(rot) * w * 0.455, rot, w * 0.7, 0.06, 0.04));
    }
  }
  const tankFade = new FadeCrowns(bag, 'tank', tankGeometry(bag), tankMat, tankFadedMat, tanks);
  const box = unitBox(bag);
  group.add(tankFade.opaque, tankFade.faded, instanced(bag, 'machine', machineGeometry(bag), machineMat, machines), instanced(bag, 'machine-light', box, neonMat, lights), instanced(bag, 'machine-band', box, bandMat, bands));

  // borda: galpões e chaminés além do limite, por lado (frustum culling)
  const shedMat = bag.mat(new THREE.MeshLambertMaterial({ map: maquina, color: 0xd8dad2, emissive: 0x1e1e1a }));
  const chimMat = bag.mat(new THREE.MeshLambertMaterial({ map: tanque, color: 0xb07a58 }));
  const chimGeo = bag.geo(new THREE.CylinderGeometry(0.8, 1.1, 1, 10).translate(0, 0.5, 0));
  for (const k of SIDES) {
    const sheds: THREE.Matrix4[] = [], chims: THREE.Matrix4[] = [];
    for (let a = -H - 30; a <= H + 30; a += 9) {
      const depth = H + 8 + r() * 14, w = 7 + r() * 5, hgt = 5 + r() * 9;
      const [x, z] = k === 'n' ? [a, -depth] : k === 's' ? [a, depth] : k === 'e' ? [depth, a] : [-depth, a];
      if (sideOf(x, z) !== k) continue;
      sheds.push(mat4(x, 0, z, 0, w, hgt, 6 + r() * 4));
      if (r() < 0.35) chims.push(mat4(x + (r() - 0.5) * 4, hgt, z + (r() - 0.5) * 4, 0, 1, 6 + r() * 8, 1));
    }
    group.add(instanced(bag, `border-shed-${k}`, box, shedMat, sheds), instanced(bag, `border-chimney-${k}`, chimGeo, chimMat, chims));
  }

  // decoração baixa: barris, caixotes, canos no chão, cones
  const barrelMat = bag.mat(new THREE.MeshLambertMaterial({ map: tanque, color: 0xc0603a }));
  const crateMat = bag.mat(new THREE.MeshLambertMaterial({ map: grade, color: 0xc8a070 }));
  const pipeMat = bag.mat(new THREE.MeshLambertMaterial({ map: tanque, color: 0xa86a48 }));
  const coneMat = bag.mat(new THREE.MeshLambertMaterial({ color: 0xff8a1f }));
  group.add(
    instanced(bag, 'decor-barrel', bag.geo(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10).translate(0, 0.45, 0)), barrelMat, scatter(110, (x, z) => mat4(x, 0, z, r() * 6.28, 0.9 + r() * 0.3)), true),
    instanced(bag, 'decor-crate', box, crateMat, scatter(90, (x, z) => mat4(x, 0, z, r() * 6.28, 0.7 + r() * 0.4)), true),
    instanced(bag, 'decor-pipe', bag.geo(new THREE.CylinderGeometry(0.18, 0.18, 1, 8).rotateZ(Math.PI / 2).translate(0, 0.18, 0)), pipeMat, scatter(60, (x, z) => mat4(x, 0, z, r() * 6.28, 2 + r() * 2, 1, 1)), true),
    instanced(bag, 'decor-cone', bag.geo(new THREE.ConeGeometry(0.22, 0.6, 8).translate(0, 0.3, 0)), coneMat, scatter(50, (x, z) => mat4(x, 0, z, 0, 1)), true),
  );

  // céu esfumaçado + silhueta de chaminés/galpões ao longe
  const fog = 0xbfc2b4, fogC = new THREE.Color(fog), dark = new THREE.Color(0x4a4a44);
  const near = silhouette(bag, r, 230, 10, 30, dark.clone().lerp(fogC, 0.5).getHex());
  const far = silhouette(bag, r, 275, 16, 42, dark.clone().lerp(fogC, 0.75).getHex());
  near.name = 'silhouette-near'; far.name = 'silhouette-far';
  group.add(near, far);
  const background = skyTexture(bag, 0x7f9aa0, fog, 0x6a665c);

  return {
    group,
    sky: { background, fog },
    height,
    light: { sky: 0xeef0e4, ground: 0x5a4a3a, hemi: 1.0, sun: 0xfff0d8, sunIntensity: 1.35 },
    update(_time, camPos, target) {
      near.position.set(camPos.x, 0, camPos.z); far.position.set(camPos.x, 0, camPos.z);
      tankFade.update(camPos, target);
    },
    dispose() { bag.dispose(); },
  };
}

// ───────────────────────────── Núcleo da fábrica ─────────────────────────────

/** engrenagem em pé: disco com dentes e cubo, eixo em z; raio externo 1 */
function gearGeometry(bag: Bag): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    new THREE.CylinderGeometry(0.85, 0.85, 0.35, 20).rotateX(Math.PI / 2),
    new THREE.CylinderGeometry(0.28, 0.28, 0.6, 10).rotateX(Math.PI / 2),
  ];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    parts.push(new THREE.BoxGeometry(0.22, 0.3, 0.3).translate(0, 0.92, 0).rotateZ(a));
  }
  // pedestal
  parts.push(new THREE.BoxGeometry(0.7, 0.3, 0.7).translate(0, -1, 0));
  return merged(bag, parts.map(p => p.translate(0, 1.15, 0)));
}

/** console: corpo com tampo inclinado; base 1×1 */
function consoleGeometry(bag: Bag): THREE.BufferGeometry {
  return merged(bag, [
    new THREE.BoxGeometry(1, 0.8, 0.8).translate(0, 0.4, 0),
    new THREE.BoxGeometry(1, 0.12, 0.6).rotateX(-0.5).translate(0, 0.9, 0.05),
  ]);
}

export function buildFactoryCore(): BiomeView {
  const ID = 'nucleo';
  const bag = new Bag(), group = new THREE.Group();
  group.name = `bioma-${ID}`;
  const height = terraces(0xc0de06, 1.2, 2, 3);
  const { r, mat4, scatter, floorRects } = helpers(0xc0de06, height);

  const placa = loadTexture(ID, 'placa', GROUND / 8), tecido = loadTexture(ID, 'tecido', 1), engr = loadTexture(ID, 'engrenagens', 1);

  // chão: placas pretas + piso trançado + grade de neon verde rente ao chão
  const ground = groundMesh(bag, height, bag.mat(new THREE.MeshLambertMaterial({ map: placa, color: 0x8c949a })), GROUND);
  const d = decal(bag);
  const neon = bag.mat(new THREE.MeshBasicMaterial({ color: 0x3dff7a, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  const lines: THREE.Matrix4[] = [];
  for (let a = -H; a <= H; a += 12) {
    // trechos tracejados, como os filetes do FACT07
    for (let b = -H; b < H; b += 6) if (r() < 0.55) {
      lines.push(mat4(a, 0.005, b + 3, 0, 0.12, 1, 4.5));
      lines.push(mat4(b + 3, 0.005, a, 0, 4.5, 1, 0.12));
    }
  }
  group.add(ground,
    instanced(bag, 'floor-weave', d, decalMat(bag, { map: tecido, color: 0xb0b8b4 }), flatDecals(height, floorRects(200, 4, 9))),
    instanced(bag, 'floor-neon', d, neon, flatDecals(height, lines)));

  // obstáculos: engrenagens gigantes (tree) e consoles (rock)
  const gearMat = bag.mat(new THREE.MeshLambertMaterial({ map: engr, color: 0x9aa4a0 }));
  const gearFaded = bag.mat(new THREE.MeshLambertMaterial({ map: engr, color: 0x9aa4a0, transparent: true, opacity: 0.3, depthWrite: false }));
  const consoleMat = bag.mat(new THREE.MeshLambertMaterial({ map: engr, color: 0x5a6460 }));
  const screenMat = bag.mat(new THREE.MeshBasicMaterial({ color: 0x46ff8a }));
  const gears: Crown[] = [], consoles: THREE.Matrix4[] = [], screens: THREE.Matrix4[] = [];
  const box = unitBox(bag);
  for (const o of MAP_OBSTACLES) {
    const rot = r() * Math.PI * 2;
    if (o.kind === 'tree') {
      const k = o.r * 0.95 + 0.4; // raio externo ≈ k; altura total ≈ 2,3k
      gears.push({ x: o.x, y: 1.15 * k + height(o.x, o.z), z: o.z, r: 1.25 * k, m: mat4(o.x, 0, o.z, rot, k), c: new THREE.Color().setHSL(0.38, 0.1, 0.8 + r() * 0.2) });
    } else {
      const w = o.r * 1.3, h = 0.8 + o.r * 0.5;
      consoles.push(mat4(o.x, 0, o.z, rot, w, h, w));
      screens.push(mat4(o.x + Math.sin(rot) * w * 0.05, h * 0.95, o.z + Math.cos(rot) * w * 0.05, rot, w * 0.75, 0.04, w * 0.4));
    }
  }
  const gearFade = new FadeCrowns(bag, 'gear', gearGeometry(bag), gearMat, gearFaded, gears);
  group.add(gearFade.opaque, gearFade.faded, instanced(bag, 'console', consoleGeometry(bag), consoleMat, consoles), instanced(bag, 'console-screen', box, screenMat, screens));

  // borda: paredões pretos com filetes verdes e colunas claras, por lado
  const wallMat = bag.mat(new THREE.MeshLambertMaterial({ map: placa, color: 0x3a4044 }));
  const pillarMat = bag.mat(new THREE.MeshLambertMaterial({ color: 0xd8dcd8 }));
  const stripMat = bag.mat(new THREE.MeshBasicMaterial({ color: 0x3dff7a }));
  for (const k of SIDES) {
    const walls: THREE.Matrix4[] = [], pillars: THREE.Matrix4[] = [], strips: THREE.Matrix4[] = [];
    for (let a = -H - 30; a <= H + 30; a += 8) {
      const depth = H + 6 + r() * 4, hgt = 10 + r() * 8;
      const along = k === 'n' || k === 's';
      const [x, z] = k === 'n' ? [a, -depth] : k === 's' ? [a, depth] : k === 'e' ? [depth, a] : [-depth, a];
      if (sideOf(x, z) !== k) continue;
      walls.push(mat4(x, 0, z, 0, along ? 8.2 : 4, hgt, along ? 4 : 8.2));
      if (r() < 0.4) pillars.push(mat4(x + (along ? 3.6 : 0), 0, z + (along ? 0 : 3.6), 0, 1.2, hgt + 2, 1.2));
      const inner = depth - 2.05, [sx, sz] = k === 'n' ? [x, -inner] : k === 's' ? [x, inner] : k === 'e' ? [inner, z] : [-inner, z];
      strips.push(mat4(sx, 1.2 + r() * 3, sz, 0, along ? 6 : 0.1, 0.12, along ? 0.1 : 6));
    }
    group.add(instanced(bag, `border-wall-${k}`, box, wallMat, walls), instanced(bag, `border-pillar-${k}`, box, pillarMat, pillars), instanced(bag, `border-strip-${k}`, box, stripMat, strips));
  }

  // decoração baixa: luminárias verdes, feixes de cabo, respiros, caixas escuras
  const lampMat = bag.mat(new THREE.MeshBasicMaterial({ color: 0x7affb0 }));
  const cableMat = bag.mat(new THREE.MeshLambertMaterial({ color: 0x2a3034 }));
  const crateMat = bag.mat(new THREE.MeshLambertMaterial({ map: engr, color: 0x48524e }));
  const lampGeo = merged(bag, [new THREE.CylinderGeometry(0.08, 0.12, 0.7, 6).translate(0, 0.35, 0), new THREE.SphereGeometry(0.16, 8, 6).translate(0, 0.8, 0)]);
  group.add(
    instanced(bag, 'decor-lamp', lampGeo, lampMat, scatter(70, (x, z) => mat4(x, 0, z, 0, 1)), true),
    instanced(bag, 'decor-cable', bag.geo(new THREE.CylinderGeometry(0.14, 0.14, 1, 6).rotateZ(Math.PI / 2).translate(0, 0.14, 0)), cableMat, scatter(90, (x, z) => mat4(x, 0, z, r() * 6.28, 2.5 + r() * 3, 1, 1)), true),
    instanced(bag, 'decor-crate', box, crateMat, scatter(80, (x, z) => mat4(x, 0, z, r() * 6.28, 0.6 + r() * 0.5, 0.5 + r() * 0.6, 0.6 + r() * 0.5)), true),
  );

  // escuro, com névoa esverdeada e silhueta de máquinas ao longe
  const fog = 0x16261e, fogC = new THREE.Color(fog), dark = new THREE.Color(0x050807);
  const near = silhouette(bag, r, 230, 14, 34, dark.clone().lerp(fogC, 0.4).getHex());
  near.name = 'silhouette-near';
  group.add(near);
  const background = skyTexture(bag, 0x040806, fog, 0x050605);

  return {
    group,
    sky: { background, fog },
    height,
    // luz própria verde: escuro, mas os inimigos continuam legíveis
    light: { sky: 0xb8ffd8, ground: 0x203028, hemi: 1.15, sun: 0xd8ffe8, sunIntensity: 0.75 },
    update(_time, camPos, target) {
      near.position.set(camPos.x, 0, camPos.z);
      gearFade.update(camPos, target);
    },
    dispose() { bag.dispose(); },
  };
}
