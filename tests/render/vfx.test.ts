import * as THREE from 'three';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { setGround } from '../../src/render/terrain';
import { Vfx } from '../../src/render/vfx';
import type { Area } from '../../src/sim/combat';

beforeEach(() => {
  vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation(() => new THREE.Texture());
  const ctx = new Proxy({}, { get: () => () => undefined, set: () => true });
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); setGround(() => 0); });

test.each(['circle', 'cone', 'beam'] as const)('área %s deitada sobre a encosta e com teste de profundidade', shape => {
  const ground = (x: number, z: number) => 0.4 * x + 0.2 * z + Math.sin(z * 0.3);
  setGround(ground);
  const scene = new THREE.Scene(), vfx = new Vfx(scene);
  const a = { x: 10, z: -4, dx: 0.6, dz: 0.8, radius: 3, length: 8, shape, hostile: false, delay: 0, life: 1, maxLife: 1, moveId: 'baby_flame' } as unknown as Area;
  const v = vfx as unknown as { areaMesh(i: number): THREE.Mesh; drawArea(m: THREE.Mesh, a: Area): void };
  const mesh = v.areaMesh(0);
  v.drawArea(mesh, a);
  expect((mesh.material as THREE.MeshBasicMaterial).depthTest).toBe(true);
  mesh.updateMatrixWorld(true);
  const pos = mesh.geometry.attributes.position, w = new THREE.Vector3();
  expect(pos.count).toBeGreaterThan(20);
  for (let i = 0; i < pos.count; i++) {
    w.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
    expect(w.y - ground(w.x, w.z)).toBeCloseTo(0.06, 3);
  }
});
