import * as THREE from 'three';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { biomeForPhase, buildBiome } from '../../src/render/biomes';
import { crownOccludes } from '../../src/render/biomes/common';
import { groundY, isFlat } from '../../src/render/terrain';
import { MAP_OBSTACLES } from '../../src/sim/map';
import { T } from '../../src/data/tuning';
import { MapView } from '../../src/render/map';
import type { BiomeId } from '../../src/render/biomes';

const IDS: BiomeId[] = ['floresta-dw1', 'floresta-dw3', 'fabrica', 'nucleo'];
/** copa com transparência de cada bioma */
const CROWN: Record<BiomeId, string> = { 'floresta-dw1': 'tree-crown', 'floresta-dw3': 'pine-crown', fabrica: 'tank', nucleo: 'gear' };

// sem DOM: o TextureLoader devolve uma textura vazia
beforeEach(() => { vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(() => new THREE.Texture()); });
afterEach(() => vi.restoreAllMocks());

test('biomeForPhase: Floresta DW1 → DW3 → Fábrica → Núcleo → Floresta DW1', () => {
  expect([1, 2, 3, 4, 5].map(biomeForPhase)).toEqual(['floresta-dw1', 'floresta-dw3', 'fabrica', 'nucleo', 'floresta-dw1']);
});

test.each([['fabrica', 'tank', 'machine'], ['nucleo', 'gear', 'console']] as const)('%s: um %s por tree, uma %s por rock; alto na frente do parceiro fica transparente', (id, tall, low) => {
  const b = buildBiome(id);
  expect(b.group.name).toBe(`bioma-${id}`);
  const trees = MAP_OBSTACLES.filter(o => o.kind === 'tree').length, rocks = MAP_OBSTACLES.filter(o => o.kind === 'rock').length;
  const count = (n: string) => (b.group.getObjectByName(n) as THREE.InstancedMesh).count;
  expect(count(tall) + count(`${tall}-faded`)).toBe(trees);
  expect(count(low)).toBe(rocks);
  for (const k of ['n', 's', 'e', 'w']) expect(b.group.children.some(c => c.name.startsWith('border-') && c.name.endsWith(`-${k}`) && (c as THREE.InstancedMesh).count > 5)).toBe(true);
  const o = MAP_OBSTACLES.find(x => x.kind === 'tree')!;
  b.update(0, new THREE.Vector3(o.x, b.height(o.x, o.z) + 4, o.z + 5), new THREE.Vector3(o.x, b.height(o.x, o.z) + 1, o.z - 5));
  expect(count(`${tall}-faded`)).toBeGreaterThanOrEqual(1);
  b.dispose();
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

test.each(IDS)('%s: nada alto (> 1.2) dentro do mapa fora das posições de obstáculo', id => {
  const b = buildBiome(id);
  b.group.updateMatrixWorld(true);
  const box = new THREE.Box3(), m = new THREE.Matrix4(), c = new THREE.Vector3();
  const bad: string[] = [];
  let checked = 0;
  b.group.traverse(o => {
    if (!(o instanceof THREE.Mesh) || o.userData.backdrop || o.name === 'ground' || o.name === 'ground-far' || o.name === 'trail') return; // rentes ao relevo (conferidos vértice a vértice)
    o.geometry.computeBoundingBox();
    const n = o instanceof THREE.InstancedMesh ? o.count : 1;
    for (let i = 0; i < n; i++) {
      if (o instanceof THREE.InstancedMesh) o.getMatrixAt(i, m); else m.identity();
      box.copy(o.geometry.boundingBox!).applyMatrix4(m).applyMatrix4(o.matrixWorld);
      box.getCenter(c); checked++;
      if (box.max.y - b.height(c.x, c.z) <= 1.2 || Math.abs(c.x) > T.MAP_HALF || Math.abs(c.z) > T.MAP_HALF) continue;
      if (!MAP_OBSTACLES.some(ob => Math.hypot(ob.x - c.x, ob.z - c.z) < ob.r + 0.5)) bad.push(`${o.name}#${i} (${c.x.toFixed(1)}, ${c.z.toFixed(1)}) h=${box.max.y.toFixed(2)}`);
    }
  });
  expect(checked).toBeGreaterThan(100); // tem decoração de verdade
  expect(bad).toEqual([]);
  b.dispose();
});

test.each(IDS)('%s: decoração afastada ≥ 2 dos obstáculos e igual a cada montagem', id => {
  const pos = (b: ReturnType<typeof buildBiome>) => {
    const out: [number, number][] = [], m = new THREE.Matrix4(), p = new THREE.Vector3();
    b.group.traverse(o => {
      if (!(o instanceof THREE.InstancedMesh) || !o.userData.decor) return;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); p.setFromMatrixPosition(m); out.push([p.x, p.z]); }
    });
    return out;
  };
  const a = buildBiome(id), b = buildBiome(id);
  const pa = pos(a);
  expect(pa.length).toBeGreaterThan(50);
  expect(pos(b)).toEqual(pa);
  for (const [x, z] of pa) for (const o of MAP_OBSTACLES) expect(Math.hypot(o.x - x, o.z - z) - o.r).toBeGreaterThanOrEqual(2);
  // ponto de nascimento (0,0) livre: nada de toco/moita debaixo do parceiro
  for (const [x, z] of pa) expect(Math.hypot(x, z)).toBeGreaterThanOrEqual(4);
  a.dispose(); b.dispose();
});

test.each(IDS)('%s: dispose libera geometrias e materiais criados', id => {
  const geo = vi.spyOn(THREE.BufferGeometry.prototype, 'dispose');
  const mat = vi.spyOn(THREE.Material.prototype, 'dispose');
  const tex = vi.spyOn(THREE.Texture.prototype, 'dispose');
  const b = buildBiome(id);
  const geos = new Set<THREE.BufferGeometry>(), mats = new Set<THREE.Material>();
  b.group.traverse(o => { if (o instanceof THREE.Mesh) { geos.add(o.geometry); (Array.isArray(o.material) ? o.material : [o.material]).forEach(x => mats.add(x)); } });
  b.dispose();
  const disposedGeo = new Set(geo.mock.contexts), disposedMat = new Set(mat.mock.contexts);
  for (const g of geos) expect(disposedGeo.has(g)).toBe(true);
  for (const m of mats) expect(disposedMat.has(m)).toBe(true);
  // céu é do bioma; as texturas carregadas ficam no cache (não são descartadas)
  const disposedTex = new Set(tex.mock.contexts);
  if (b.sky.background instanceof THREE.Texture) expect(disposedTex.has(b.sky.background)).toBe(true);
  const crown = b.group.getObjectByName(CROWN[id]) as THREE.Mesh;
  expect(disposedTex.has((crown.material as THREE.MeshLambertMaterial).map!)).toBe(false);
});

test('texturas carregadas uma vez por URL entre remontagens', () => {
  const map = (b: ReturnType<typeof buildBiome>) => ((b.group.getObjectByName('tree-crown') as THREE.Mesh).material as THREE.MeshLambertMaterial).map;
  const a = buildBiome('floresta-dw1'); a.dispose();
  const load = THREE.TextureLoader.prototype.load as unknown as ReturnType<typeof vi.fn>;
  load.mockClear();
  const b = buildBiome('floresta-dw1');
  expect(load).not.toHaveBeenCalled();
  expect(map(b)).toBe(map(a));
  b.dispose();
});

test('borda dividida por lado, com copas de poucos polígonos', () => {
  const b = buildBiome('floresta-dw1');
  const sides = ['n', 's', 'e', 'w'].map(k => b.group.getObjectByName(`border-crown-${k}`) as THREE.InstancedMesh);
  for (const m of sides) { expect(m).toBeInstanceOf(THREE.InstancedMesh); expect(m.count).toBeGreaterThan(20); }
  const tree = b.group.getObjectByName('tree-crown') as THREE.InstancedMesh;
  expect(sides[0].geometry.attributes.position.count).toBeLessThan(tree.geometry.attributes.position.count / 2);
  b.dispose();
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
  const gy = b.height(o.x, o.z), target = new THREE.Vector3(o.x, gy + 1, o.z - 5), cam = new THREE.Vector3(o.x, gy + 4, o.z + 5);
  b.update(0, cam, target);
  expect(faded.count).toBeGreaterThanOrEqual(1);
  expect((faded.material as THREE.Material).opacity).toBeCloseTo(0.3, 1);
  expect(faded.visible).toBe(true);
  // a esfera de culling tem que ser recalculada com a copa nova (senão some no frustum)
  if (!faded.boundingSphere) faded.computeBoundingSphere();
  expect(faded.boundingSphere!.containsPoint(new THREE.Vector3(o.x, gy + 3, o.z))).toBe(true);
  b.update(0, new THREE.Vector3(500, 4, 500), new THREE.Vector3(500, 1, 492));
  expect(faded.count).toBe(0);
  expect(faded.visible).toBe(false);
  expect(opaque.count).toBe(MAP_OBSTACLES.filter(x => x.kind === 'tree').length);
  b.dispose();
});

test('Floresta DW3: um pinheiro por tree, um objeto metálico por rock', () => {
  const b = buildBiome('floresta-dw3');
  expect(b.group.name).toBe('bioma-floresta-dw3');
  const trees = MAP_OBSTACLES.filter(o => o.kind === 'tree').length, rocks = MAP_OBSTACLES.filter(o => o.kind === 'rock').length;
  const count = (n: string) => (b.group.getObjectByName(n) as THREE.InstancedMesh).count;
  expect(count('pine-trunk')).toBe(trees);
  expect(count('pine-crown') + count('pine-crown-faded')).toBe(trees);
  expect(count('metal-box') + count('metal-pipe')).toBe(rocks);
  expect(count('metal-box')).toBeGreaterThan(0); expect(count('metal-pipe')).toBeGreaterThan(0);
  // trilhas planas, borda de pinheiros por lado e penhasco além do limite
  b.group.updateMatrixWorld(true);
  const trail = b.group.getObjectByName('trail') as THREE.Mesh;
  const tp = trail.geometry.attributes.position;
  for (let i = 0; i < tp.count; i++) expect(tp.getY(i) - b.height(tp.getX(i), tp.getZ(i))).toBeLessThan(0.1);
  for (const k of ['n', 's', 'e', 'w']) {
    expect(count(`border-pine-crown-${k}`)).toBeGreaterThan(20);
    const cliff = b.group.getObjectByName(`cliff-${k}`) as THREE.Mesh;
    cliff.geometry.computeBoundingBox();
    const c = cliff.geometry.boundingBox!.clone().applyMatrix4(cliff.matrixWorld).getCenter(new THREE.Vector3());
    expect(Math.max(Math.abs(c.x), Math.abs(c.z))).toBeGreaterThan(T.MAP_HALF + 3);
  }
  expect(b.light.sunIntensity).toBeGreaterThan(buildBiome('floresta-dw1').light.sunIntensity);
  b.dispose();
});

test('Floresta DW3: pinheiro na frente do parceiro fica transparente', () => {
  const b = buildBiome('floresta-dw3');
  const o = MAP_OBSTACLES.find(x => x.kind === 'tree')!;
  const faded = b.group.getObjectByName('pine-crown-faded') as THREE.InstancedMesh;
  b.update(0, new THREE.Vector3(o.x, b.height(o.x, o.z) + 4, o.z + 5), new THREE.Vector3(o.x, b.height(o.x, o.z) + 1, o.z - 5));
  expect(faded.count).toBeGreaterThanOrEqual(1);
  b.update(0, new THREE.Vector3(500, 4, 500), new THREE.Vector3(500, 1, 492));
  expect(faded.count).toBe(0);
  b.dispose();
});

test('MapView.setBiome dw1 → dw3 → dw1 não deixa filhos sobrando', () => {
  // canvas falso para a textura da Zona Digital (sem DOM)
  const ctx = new Proxy({}, { get: () => () => undefined, set: () => true });
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
  try {
    const scene = new THREE.Scene(), view = new MapView(scene);
    const before = scene.children.length;
    const names = () => scene.children.map(c => c.name).filter(n => n.startsWith('bioma-'));
    expect(names()).toEqual(['bioma-floresta-dw1']);
    view.setBiome('floresta-dw3');
    expect(names()).toEqual(['bioma-floresta-dw3']);
    expect(scene.children.length).toBe(before);
    view.setBiome('floresta-dw1');
    expect(names()).toEqual(['bioma-floresta-dw1']);
    expect(scene.children.length).toBe(before);
    // a altura do chão acompanha o bioma montado
    view.setBiome('fabrica');
    const ref = buildBiome('fabrica');
    let probe: [number, number] | null = null;
    for (let x = -90; x <= 90 && !probe; x += 3) for (let z = -90; z <= 90 && !probe; z += 3) if (ref.height(x, z) > 0.5) probe = [x, z];
    expect(probe).not.toBeNull();
    expect(groundY(probe![0], probe![1])).toBe(ref.height(probe![0], probe![1]));
    ref.dispose();
    view.setBiome('floresta-dw1');
  } finally { vi.unstubAllGlobals(); }
});

test('MapView.resetForTitle: depois da Zona Digital, bioma visível e céu/nevoeiro do bioma', () => {
  const ctx = new Proxy({}, { get: () => () => undefined, set: () => true });
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
  try {
    const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x123456, 10, 100);
    const view = new MapView(scene);
    const priv = view as unknown as { inZone: boolean; applySky(): void; view: { group: THREE.Group; sky: { background: unknown; fog: number } } };
    priv.inZone = true; priv.applySky();
    expect(priv.view.group.visible).toBe(false);
    view.resetForTitle();
    expect(priv.view.group.visible).toBe(true);
    expect(scene.background).toBe(priv.view.sky.background);
    expect(scene.fog!.color.getHex()).toBe(priv.view.sky.fog);
  } finally { vi.unstubAllGlobals(); }
});

test.each(IDS)('%s: relevo — altura > 0,5 em algum lugar, malha do chão segue a altura, decalques em trecho plano', id => {
  const b = buildBiome(id);
  let max = 0;
  for (let x = -T.MAP_HALF; x <= T.MAP_HALF; x += 5) for (let z = -T.MAP_HALF; z <= T.MAP_HALF; z += 5) max = Math.max(max, b.height(x, z));
  expect(max).toBeGreaterThan(0.5);
  expect(b.height(0, 0)).toBe(0);
  const ground = b.group.getObjectByName('ground') as THREE.Mesh;
  const pos = ground.geometry.attributes.position;
  for (let i = 0; i < pos.count; i += 997) expect(pos.getY(i)).toBeCloseTo(b.height(pos.getX(i), pos.getZ(i)), 5);
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), e = new THREE.Euler();
  b.group.traverse(o => {
    if (!(o instanceof THREE.InstancedMesh) || !/^(floor-|ground-patches)/.test(o.name)) return;
    const half = o.name === 'ground-patches' ? 1 : 0.5;
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, m); m.decompose(p, q, sc); e.setFromQuaternion(q, 'YXZ');
      expect(isFlat(b.height, p.x, p.z, sc.x * half, sc.z * half, e.y), `${o.name}#${i}`).toBe(true);
    }
  });
  b.dispose();
});

test.each(IDS)('%s: obstáculos assentados no chão (base na altura do relevo)', id => {
  const b = buildBiome(id);
  const name = { 'floresta-dw1': 'tree-trunk', 'floresta-dw3': 'pine-trunk', fabrica: 'machine', nucleo: 'console' }[id];
  const mesh = b.group.getObjectByName(name) as THREE.InstancedMesh, m = new THREE.Matrix4(), p = new THREE.Vector3();
  for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, m); p.setFromMatrixPosition(m); expect(p.y).toBeCloseTo(b.height(p.x, p.z), 5); }
  b.dispose();
});
