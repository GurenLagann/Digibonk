import * as THREE from 'three';
import { expect, test } from 'vitest';
import { enableInstanceFrames, setInstanceFrame } from '../../src/render/instanceFrames';

function mesh(count = 5) {
  const tex = new THREE.Texture();
  const m = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex }), count);
  return { m, tex };
}

test('enableInstanceFrames adds a vec2 aFrame attribute per instance and fixes the texture grid', () => {
  const { m, tex } = mesh();
  tex.offset.set(0.3, 0.7);
  enableInstanceFrames(m, 4, 2);
  const a = m.geometry.attributes.aFrame as THREE.InstancedBufferAttribute;
  expect(a).toBeInstanceOf(THREE.InstancedBufferAttribute);
  expect(a.itemSize).toBe(2);
  expect(a.count).toBe(m.count);
  expect(tex.repeat.x).toBeCloseTo(0.25); expect(tex.repeat.y).toBeCloseTo(0.5);
  expect(tex.offset.x).toBe(0); expect(tex.offset.y).toBe(0);
});

test('setInstanceFrame writes the offset at the instance slot and flags the upload', () => {
  const { m } = mesh();
  enableInstanceFrames(m, 4, 2);
  const a = m.geometry.attributes.aFrame as THREE.InstancedBufferAttribute;
  const v = a.version;
  setInstanceFrame(m, 3, { x: 0.25, y: 0.5 });
  expect(a.array[6]).toBeCloseTo(0.25); expect(a.array[7]).toBeCloseTo(0.5);
  expect(a.version).toBeGreaterThan(v); // needsUpdate = true incrementa a versão
});

test('onBeforeCompile replaces the uv_vertex chunk with the per-instance offset', () => {
  const { m } = mesh();
  enableInstanceFrames(m, 4, 2);
  const mat = m.material as THREE.MeshBasicMaterial;
  const shader = { vertexShader: 'void main() {\n#include <uv_vertex>\n}', fragmentShader: '', uniforms: {} } as unknown as THREE.WebGLProgramParametersWithUniforms;
  mat.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
  expect(shader.vertexShader).toContain('aFrame');
  expect(shader.vertexShader).toContain('attribute vec2 aFrame');
  expect(shader.vertexShader).not.toMatch(/^\s*#include <uv_vertex>\s*$/m);
});
