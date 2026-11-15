import * as THREE from 'three';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { biomeForPhase, buildBiome } from '../../src/render/biomes';
import { crownOccludes } from '../../src/render/biomes/common';
import { MAP_OBSTACLES } from '../../src/sim/map';
import { T } from '../../src/data/tuning';

// sem DOM: o TextureLoader devolve uma textura vazia
beforeEach(() => { vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(() => new THREE.Texture()); });
afterEach(() => vi.restoreAllMocks());

test('biomeForPhase: ímpar = DW1, par = DW3', () => {
  expect([1, 2, 3, 4, 5].map(biomeForPhase)).toEqual(['floresta-dw1', 'floresta-dw3', 'floresta-dw1', 'floresta-dw3', 'floresta-dw1']);
});

test('Floresta DW1: uma instância de árvore por obstáculo tree', () => {
  const b = buildBiome('floresta-dw1');
  const trees = MAP_OBSTACLES.filter(o => o.kind === 'tree').length;
  const trunk = b.group.getObjectByName('tree-trunk') as THREE.InstancedMesh;
  expect(trunk).toBeInstanceOf(THREE.InstancedMesh);
  expect(trunk.count).toBe(trees);
  const crowns = ['tree-crown', 'tree-crown-faded'].map(n => b.group.getObjectByName(n) as THREE.InstancedMesh);
  expect(crowns[0].count + crowns[1].count).toBe(trees);
  const rocks = b.group.getObjectByName('rock') as THREE.InstancedMesh;
  expect(rocks.count).toBe(MAP_OBSTACLES.filter(o => o.kind === 'rock').length);
  expect(b.sky.background).toBeTruthy();
  expect(typeof b.sky.fog).toBe('number');
  b.dispose();
});

test('nada alto (> 1.2) dentro do mapa fora das posições de obstáculo', () => {
  const b = buildBiome('floresta-dw1');
  b.group.updateMatrixWorld(true);
  const box = new THREE.Box3(), m = new THREE.Matrix4(), c = new THREE.Vector3();
  const bad: string[] = [];
  let checked = 0;
  b.group.traverse(o => {
    if (!(o instanceof THREE.Mesh) || o.userData.backdrop) return;
    o.geometry.computeBoundingBox();
    const n = o instanceof THREE.InstancedMesh ? o.count : 1;
    for (let i = 0; i < n; i++) {
      if (o instanceof THREE.InstancedMesh) o.getMatrixAt(i, m); else m.identity();
      box.copy(o.geometry.boundingBox!).applyMatrix4(m).applyMatrix4(o.matrixWorld);
      box.getCenter(c); checked++;
      if (box.max.y <= 1.2 || Math.abs(c.x) > T.MAP_HALF || Math.abs(c.z) > T.MAP_HALF) continue;
      if (!MAP_OBSTACLES.some(ob => Math.hypot(ob.x - c.x, ob.z - c.z) < ob.r + 0.5)) bad.push(`${o.name}#${i} (${c.x.toFixed(1)}, ${c.z.toFixed(1)}) h=${box.max.y.toFixed(2)}`);
    }
  });
  expect(checked).toBeGreaterThan(100); // tem decoração de verdade
  expect(bad).toEqual([]);
  b.dispose();
});

test('decoração afastada ≥ 2 dos obstáculos e igual a cada montagem', () => {
  const pos = (b: ReturnType<typeof buildBiome>) => {
    const out: [number, number][] = [], m = new THREE.Matrix4(), p = new THREE.Vector3();
    b.group.traverse(o => {
      if (!(o instanceof THREE.InstancedMesh) || !o.userData.decor) return;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); p.setFromMatrixPosition(m); out.push([p.x, p.z]); }
    });
    return out;
  };
  const a = buildBiome('floresta-dw1'), b = buildBiome('floresta-dw1');
  const pa = pos(a);
  expect(pa.length).toBeGreaterThan(50);
  expect(pos(b)).toEqual(pa);
  for (const [x, z] of pa) for (const o of MAP_OBSTACLES) expect(Math.hypot(o.x - x, o.z - z) - o.r).toBeGreaterThanOrEqual(2);
  a.dispose(); b.dispose();
});

test('dispose libera geometrias e materiais criados', () => {
  const geo = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
  const mat = vi.spyOn(THREE.Material.prototype, 'dispose');
  const tex = vi.spyOn(THREE.Texture.prototype, 'dispose');
  const b = buildBiome('floresta-dw1');
  const geos = new Set<THREE.BufferGeometry>(), mats = new Set<THREE.Material>();
  b.group.traverse(o => { if (o instanceof THREE.Mesh) { geos.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(x => mats.add(x)); } });
  b.dispose();
  const disposedGeo = new Set(geo.mock.contexts), disposedMat = new Set(mat.mock.contexts);
  for (const g of geos) expect(disposedGeo.has(g)).toBe(true);
  for (const m of mats) expect(disposedMat.has(m)).toBe(true);
  expect(tex).toHaveBeenCalled();
  if (b.sky.background instanceof THREE.Texture) expect(new Set(tex.mock.contexts).has(b.sky.background)).toBe(true);
});

test('crownOccludes: copa perto da linha câmera→parceiro', () => {
  const cam = new THREE.Vector3(0, 4, 8), tgt = new THREE.Vector3(0, 1, 0);
  expect(crownOccludes(cam, tgt, 0, 2.5, 4, 1.5)).toBe(true);   // bem no meio
  expect(crownOccludes(cam, tgt, 6, 2.5, 4, 1.5)).toBe(false);  // ao lado
  expect(crownOccludes(cam, tgt, 0, 2.5, -6, 1.5)).toBe(false); // atrás do parceiro
  expect(crownOccludes(cam, tgt, 0, 4, 9, 1.5)).toBe(true);     // câmera dentro da copa
});

test('update troca copas entre opaca e transparente', () => {
  const b = buildBiome('floresta-dw1');
  const o = MAP_OBSTACLES.find(x => x.kind === 'tree')!;
  const opaque = b.group.getObjectByName('tree-crown') as THREE.InstancedMesh;
  const faded = b.group.getObjectByName('tree-crown-faded') as THREE.InstancedMesh;
  const target = new THREE.Vector3(o.x, 1, o.z - 5), cam = new THREE.Vector3(o.x, 4, o.z + 5);
  b.update(0, cam, target);
  expect(faded.count).toBeGreaterThanOrEqual(1);
  expect((faded.material as THREE.Material).opacity).toBeCloseTo(0.3, 1);
  b.update(0, new THREE.Vector3(500, 4, 500), new THREE.Vector3(500, 1, 492));
  expect(faded.count).toBe(0);
  expect(opaque.count).toBe(MAP_OBSTACLES.filter(x => x.kind === 'tree').length);
  b.dispose();
});
