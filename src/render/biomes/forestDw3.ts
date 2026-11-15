import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createRng } from '../../core/rng';
import { T } from '../../data/tuning';
import { MAP_OBSTACLES } from '../../sim/map';
import { Bag, FadeCrowns, instanced, loadTexture, silhouette, skyTexture, type Crown } from './common';
import type { BiomeView } from './types';

const ID = 'floresta-dw3';
const H = T.MAP_HALF;
const GROUND = 600;
/** penhasco: distância do centro e lado de cada parede */
const CLIFF = H + 24;
/** tamanho (em unidades do mundo) de um ladrilho da textura da trilha/penhasco */
const TRAIL_TILE = 3, CLIFF_TILE = 8;

function merged(bag: Bag, parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = bag.geo(mergeGeometries(parts)!);
  parts.forEach(p => p.dispose());
  return g;
}

/** copa de pinheiro: três cones empilhados, base em y = 0 (altura ~2,4) */
function pineGeometry(bag: Bag, radial: number): THREE.BufferGeometry {
  return merged(bag, [[1, 1.3, 0.65], [0.78, 1.1, 1.3], [0.55, 0.95, 1.9]].map(([r, h, y]) => new THREE.ConeGeometry(r, h, radial).translate(0, y, 0)));
}

/** cano deitado ao longo de x (comprimento 1, raio 1) com flanges nas pontas */
function pipeGeometry(bag: Bag): THREE.BufferGeometry {
  const parts = [new THREE.CylinderGeometry(1, 1, 1, 12).rotateZ(Math.PI / 2)];
  for (const x of [-0.44, 0.44]) parts.push(new THREE.CylinderGeometry(1.14, 1.14, 0.1, 12).rotateZ(Math.PI / 2).translate(x, 0, 0));
  return merged(bag, parts);
}

/** poste alto com travessa (altura ~5) */
function postGeometry(bag: Bag): THREE.BufferGeometry {
  return merged(bag, [
    new THREE.CylinderGeometry(0.09, 0.13, 5, 6).translate(0, 2.5, 0),
    new THREE.BoxGeometry(1.4, 0.1, 0.1).translate(0, 4.6, 0),
    new THREE.BoxGeometry(0.22, 0.3, 0.22).translate(0, 5.05, 0),
  ]);
}

/** placa baixa: pé e plaquinha (altura ~1) */
function signGeometry(bag: Bag): THREE.BufferGeometry {
  return merged(bag, [new THREE.BoxGeometry(0.1, 0.9, 0.1).translate(0, 0.45, 0), new THREE.BoxGeometry(0.75, 0.4, 0.05).translate(0, 0.78, 0.06)]);
}

/** tufo de grama: cones finos inclinados */
function tuftGeometry(bag: Bag): THREE.BufferGeometry {
  return merged(bag, [0, 1, 2, 3].map(i => new THREE.ConeGeometry(0.09, 0.5, 4).translate(0, 0.25, 0).rotateZ(0.3).rotateY(i * 1.6)));
}

/** trilhas em zigue-zague de borda a borda (semente fixa) */
function trailPaths(r: () => number): [number, number][][] {
  const out: [number, number][][] = [];
  for (let i = 0; i < 6; i++) {
    const alongX = i % 2 === 0, dir = r() < 0.5 ? 1 : -1;
    const lane = (r() * 2 - 1) * (H - 20), amp = 5 + r() * 5;
    const pts: [number, number][] = [];
    for (let t = -H - 20, k = 0; t <= H + 20 + 13; t += 13 + r() * 9, k++) {
      const off = lane + (k % 2 ? amp : -amp) + (r() * 2 - 1) * 2;
      pts.push(alongX ? [t * dir, off] : [off, t * dir]);
    }
    out.push(pts);
  }
  return out;
}

/** faixa plana sobre o chão seguindo a linha; bordas somem pela transparência dos vértices */
function trailGeometry(bag: Bag, paths: [number, number][][], width: number): THREE.BufferGeometry {
  const across = [-1, -0.6, 0, 0.6, 1], alpha = [0, 0.85, 1, 0.85, 0];
  const pos: number[] = [], uv: number[] = [], col: number[] = [], idx: number[] = [];
  for (const pts of paths) {
    const base = pos.length / 3;
    let dist = 0;
    pts.forEach(([x, z], i) => {
      if (i > 0) dist += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
      // normal na quina: média das normais dos dois trechos (limitada para não esticar demais)
      const [ax, az] = pts[Math.max(0, i - 1)], [bx, bz] = pts[Math.min(pts.length - 1, i + 1)];
      let tx = bx - ax, tz = bz - az; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      let mit = 1;
      if (i > 0 && i < pts.length - 1) {
        const d1 = Math.hypot(x - ax, z - az) || 1, ux = (x - ax) / d1, uz = (z - az) / d1;
        mit = Math.min(1.6, 1 / Math.max(0.3, ux * tx + uz * tz));
      }
      const nx = -tz, nz = tx;
      across.forEach((a, j) => {
        const w = (a * width) / 2 * mit;
        pos.push(x + nx * w, 0.03, z + nz * w);
        uv.push(((a + 1) / 2) * width / TRAIL_TILE, dist / TRAIL_TILE);
        col.push(1, 1, 1, alpha[j]);
      });
      if (i < pts.length - 1) {
        const k = base + i * 5;
        for (let j = 0; j < 4; j++) idx.push(k + j, k + j + 1, k + j + 5, k + j + 1, k + j + 6, k + j + 5);
      }
    });
  }
  const g = bag.geo(new THREE.BufferGeometry());
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** parede de terra recortada, de frente para o centro, no lado k */
function cliffGeometry(bag: Bag, r: () => number, side: 'n' | 's' | 'e' | 'w'): THREE.BufferGeometry {
  const len = CLIFF * 2 + 6, segX = 48, segY = 4, base = 9;
  const g = new THREE.PlaneGeometry(len, base, segX, segY).translate(0, base / 2, 0);
  const p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
  const tops = Array.from({ length: segX + 1 }, () => 3 + r() * 7);
  for (let i = 0; i < p.count; i++) {
    const col = i % (segX + 1), row = Math.floor(i / (segX + 1)); // row 0 = topo
    const h = (segY - row) / segY;
    if (row === 0) p.setY(i, base + tops[col]);
    p.setZ(i, (r() * 2 - 1) * 0.8 * (row > 0 && row < segY ? 1 : 0.3) - h * 1.5); // relevo e leve recuo para cima
    uv.setXY(i, (p.getX(i) + len / 2) / CLIFF_TILE, p.getY(i) / CLIFF_TILE);
  }
  g.computeVertexNormals();
  const rot = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 }[side];
  const [dx, dz] = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[side];
  g.rotateY(rot).translate(dx * CLIFF, 0, dz * CLIFF);
  return bag.geo(g);
}

/** pinheiro de obstáculo/borda a partir do "tamanho" k */
function pineParts(x: number, z: number, k: number, rot: number, tint: number) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
  const th = 1.4 + 0.4 * k, sx = 1 + 0.55 * k, sy = 1.3 + 0.85 * k, y0 = th * 0.55;
  const trunk = m.clone().compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(0.8 + 0.3 * k, th / 2, 0.8 + 0.3 * k));
  const crown: Crown = {
    x, y: y0 + 1.2 * sy, z, r: 1.25 * sy,
    m: m.clone().compose(new THREE.Vector3(x, y0, z), q, new THREE.Vector3(sx, sy, sx)),
    c: new THREE.Color().setHSL(0.27 + tint * 0.03, 0.3, 0.8 + tint * 0.12),
  };
  return { trunk, crown };
}

export function buildForestDw3(): BiomeView {
  const bag = new Bag(), group = new THREE.Group();
  group.name = `bioma-${ID}`;
  const rng = createRng(0xd3f0e5), r = rng.next;
  const tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), s = new THREE.Vector3();
  const mat4 = (x: number, y: number, z: number, rot: number, sx: number, sy = sx, sz = sx) =>
    tmp.clone().compose(p.set(x, y, z), q.setFromAxisAngle(up, rot), s.set(sx, sy, sz));

  // texturas (um repeat por URL: o cache é compartilhado) e materiais
  const grama = loadTexture(ID, 'grama', GROUND / 6), trilha = loadTexture(ID, 'trilha'), pinheiro = loadTexture(ID, 'pinheiro', 2);
  const casca = loadTexture(ID, 'casca'), penhasco = loadTexture(ID, 'penhasco'), metal = loadTexture(ID, 'metal');
  const crownMat = bag.mat(new THREE.MeshLambertMaterial({ map: pinheiro }));
  const crownFaded = bag.mat(new THREE.MeshLambertMaterial({ map: pinheiro, transparent: true, opacity: 0.3, depthWrite: false }));
  const barkMat = bag.mat(new THREE.MeshLambertMaterial({ map: casca, color: 0xb89a7c }));
  // texturas de metal/casca vieram de recortes pequenos: a cor do material carrega o visual
  const boxMat = bag.mat(new THREE.MeshLambertMaterial({ map: metal, color: 0xc4ccd4 }));
  const pipeMat = bag.mat(new THREE.MeshLambertMaterial({ map: metal, color: 0x8fa2b0 }));
  const postMat = bag.mat(new THREE.MeshLambertMaterial({ map: metal, color: 0x7c8890 }));
  const glowMat = bag.mat(new THREE.MeshBasicMaterial({ color: 0x5ae8ff }));
  const trunkGeo = bag.geo(new THREE.CylinderGeometry(0.2, 0.3, 2, 7).translate(0, 1, 0));
  const pineGeo = pineGeometry(bag, 10), boxGeo = bag.geo(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0)), pipeGeo = pipeGeometry(bag);

  // chão claro + trilhas de terra arenosa
  const ground = new THREE.Mesh(bag.geo(new THREE.PlaneGeometry(GROUND, GROUND)), bag.mat(new THREE.MeshLambertMaterial({ map: grama, color: 0xf6f8e4 })));
  ground.rotation.x = -Math.PI / 2; ground.name = 'ground';
  const trail = new THREE.Mesh(trailGeometry(bag, trailPaths(r), 3.4), bag.mat(new THREE.MeshLambertMaterial({
    map: trilha, color: 0xf2e2bc, vertexColors: true, transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  })));
  trail.name = 'trail'; trail.renderOrder = 1;
  group.add(ground, trail);

  // obstáculos: pinheiros nos tree; rock vira caixa ou cano de metal, alguns com poste
  const trunks: THREE.Matrix4[] = [], crowns: Crown[] = [], boxes: THREE.Matrix4[] = [], pipes: THREE.Matrix4[] = [];
  const glows: THREE.Matrix4[] = [], posts: THREE.Matrix4[] = [];
  MAP_OBSTACLES.forEach((o, i) => {
    if (o.kind === 'tree') {
      const t = pineParts(o.x, o.z, o.r, r() * Math.PI * 2, r() * 2 - 1);
      trunks.push(t.trunk); crowns.push(t.crown);
      return;
    }
    const rot = r() * Math.PI;
    if (r() < 0.5) {
      const w = o.r * 1.4, h = o.r * (0.9 + r() * 0.5);
      boxes.push(mat4(o.x, 0, o.z, rot, w, h, w));
      glows.push(mat4(o.x, h * 0.62, o.z, rot, w * 1.02, 0.07, w * 1.02)); // faixa ciano "digital"
    } else {
      const pr = o.r * 0.5;
      pipes.push(mat4(o.x, pr, o.z, rot, o.r * 1.9, pr, pr));
    }
    if (i % 3 === 0) posts.push(mat4(o.x + Math.sin(rot) * o.r * 0.6, 0, o.z + Math.cos(rot) * o.r * 0.6, rot, 1)); // ao lado do cano / saindo da caixa
  });
  const pineFade = new FadeCrowns(bag, 'pine-crown', pineGeo, crownMat, crownFaded, crowns);
  group.add(
    instanced(bag, 'pine-trunk', trunkGeo, barkMat, trunks), pineFade.opaque, pineFade.faded,
    instanced(bag, 'metal-box', boxGeo, boxMat, boxes), instanced(bag, 'metal-pipe', pipeGeo, pipeMat, pipes),
    instanced(bag, 'metal-glow', boxGeo, glowMat, glows),
  );

  // borda: fileiras de pinheiros além de MAP_HALF, postes logo depois do limite e penhasco de terra
  const SIDES = ['n', 's', 'e', 'w'] as const;
  const sideOf = (x: number, z: number) => Math.abs(x) > Math.abs(z) ? (x > 0 ? 'e' : 'w') : (z > 0 ? 's' : 'n');
  const bTrunks = Object.fromEntries(SIDES.map(k => [k, [] as THREE.Matrix4[]])), bCrowns = Object.fromEntries(SIDES.map(k => [k, [] as Crown[]]));
  for (let gx = -CLIFF; gx <= CLIFF; gx += 4.5) for (let gz = -CLIFF; gz <= CLIFF; gz += 4.5) {
    const x = gx + (r() * 2 - 1) * 1.6, z = gz + (r() * 2 - 1) * 1.6, m = Math.max(Math.abs(x), Math.abs(z));
    if (m < H + 4 || m > CLIFF - 2) continue;
    const t = pineParts(x, z, 1.3 + r() * 1.3, r() * Math.PI * 2, r() * 2 - 1), k = sideOf(x, z);
    bTrunks[k].push(t.trunk); bCrowns[k].push(t.crown);
  }
  for (let t = -H; t <= H; t += 16) {
    const d = H + 2.2;
    posts.push(mat4(t, 0, -d, 0, 1), mat4(t, 0, d, 0, 1), mat4(d, 0, t, Math.PI / 2, 1), mat4(-d, 0, t, Math.PI / 2, 1));
  }
  // pinheiros da borda com poucos polígonos (são ~800)
  const lowPineGeo = pineGeometry(bag, 5);
  const borderFades = SIDES.map(k => new FadeCrowns(bag, `border-pine-crown-${k}`, lowPineGeo, crownMat, crownFaded, bCrowns[k]));
  const cliffMat = bag.mat(new THREE.MeshLambertMaterial({ map: penhasco, color: 0xe0c8a4, flatShading: true }));
  for (const [i, k] of SIDES.entries()) {
    const cliff = new THREE.Mesh(cliffGeometry(bag, r, k), cliffMat);
    cliff.name = `cliff-${k}`;
    group.add(instanced(bag, `border-pine-trunk-${k}`, trunkGeo, barkMat, bTrunks[k]), borderFades[i].opaque, borderFades[i].faded, cliff);
  }
  group.add(instanced(bag, 'post', postGeometry(bag), postMat, posts));

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
  const tufts = scatter(650, (x, z) => mat4(x, 0, z, r() * 6.28, 0.8 + r() * 0.6));
  const stumps = scatter(25, (x, z) => mat4(x, 0, z, r() * 6.28, 0.8 + r() * 0.5));
  const signs = scatter(16, (x, z) => mat4(x, 0, z, r() * 6.28, 0.9 + r() * 0.2));
  const scraps = scatter(45, (x, z) => mat4(x, 0, z, r() * 6.28, 0.3 + r() * 0.5, 0.08 + r() * 0.14, 0.3 + r() * 0.4));
  // cabos no chão: correntes de 3 a 5 trechos que mudam de rumo
  const cables: THREE.Matrix4[] = [];
  for (let runs = 0, tries = 0; runs < 28 && tries < 600; tries++) {
    let x = (r() * 2 - 1) * (H - 8), z = (r() * 2 - 1) * (H - 8), a = r() * Math.PI * 2;
    const segs: THREE.Matrix4[] = [];
    let ok = free(x, z);
    for (let i = 0, n = 3 + Math.floor(r() * 3); i < n && ok; i++) {
      const len = 1.5 + r() * 1.5, nx = x + Math.cos(a) * len, nz = z - Math.sin(a) * len;
      ok = free((x + nx) / 2, (z + nz) / 2) && free(nx, nz);
      segs.push(mat4(x, 0, z, a, len, 1, 1));
      x = nx; z = nz; a += (r() * 2 - 1) * 0.7;
    }
    if (ok) { cables.push(...segs); runs++; }
  }
  const cableGeo = bag.geo(new THREE.CylinderGeometry(0.06, 0.06, 1, 5).rotateZ(Math.PI / 2).translate(0.5, 0.06, 0));
  group.add(
    instanced(bag, 'decor-tuft', tuftGeometry(bag), bag.mat(new THREE.MeshLambertMaterial({ color: 0x9cc43c, flatShading: true })), tufts, true),
    instanced(bag, 'decor-stump', bag.geo(new THREE.CylinderGeometry(0.4, 0.5, 0.5, 8).translate(0, 0.25, 0)), barkMat, stumps, true),
    instanced(bag, 'decor-sign', signGeometry(bag), bag.mat(new THREE.MeshLambertMaterial({ map: metal, color: 0xe6c85a })), signs, true),
    instanced(bag, 'decor-scrap', boxGeo, pipeMat, scraps, true),
    instanced(bag, 'decor-cable', cableGeo, bag.mat(new THREE.MeshLambertMaterial({ color: 0x262b32 })), cables, true),
  );

  // céu azul claro + silhueta de pinheiros distantes (cor puxada para o nevoeiro)
  const fog = 0xcfe6f2, fogC = new THREE.Color(fog), dark = new THREE.Color(0x3a6a44);
  const near = silhouette(bag, r, 230, 12, 30, dark.clone().lerp(fogC, 0.5).getHex());
  const far = silhouette(bag, r, 275, 20, 40, dark.clone().lerp(fogC, 0.75).getHex());
  near.name = 'silhouette-near'; far.name = 'silhouette-far';
  group.add(near, far);
  const background = skyTexture(bag, 0x3d8fe0, fog, 0x9fbf6a);

  return {
    group,
    sky: { background, fog },
    // dia claro
    light: { sky: 0xf2fbff, ground: 0x7c8a48, hemi: 1.3, sun: 0xfff8e6, sunIntensity: 1.4 },
    update(_time, camPos, target) {
      near.position.set(camPos.x, 0, camPos.z); far.position.set(camPos.x, 0, camPos.z);
      pineFade.update(camPos, target);
      for (const f of borderFades) f.update(camPos, target);
    },
    dispose() { bag.dispose(); },
  };
}
