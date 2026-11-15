import * as THREE from 'three';

// Quadro por instância num InstancedMesh com folha compartilhada: a textura fica com repeat de 1 célula
// e offset 0; cada instância soma o próprio offset (aFrame) à UV do map no vertex shader.
export function enableInstanceFrames(mesh: THREE.InstancedMesh, cols: number, rows: number): void {
  const n = mesh.instanceMatrix.count;
  mesh.geometry.setAttribute('aFrame', new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2));
  const mat = mesh.material as THREE.MeshBasicMaterial;
  if (mat.map) { mat.map.repeat.set(1 / cols, 1 / rows); mat.map.offset.set(0, 0); }
  mat.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute vec2 aFrame;\n' + shader.vertexShader.replace('#include <uv_vertex>',
      THREE.ShaderChunk.uv_vertex + '\n#ifdef USE_MAP\n\tvMapUv += aFrame;\n#endif');
  };
  mat.customProgramCacheKey = () => 'instanceFrames';
  mat.needsUpdate = true;
}

export function setInstanceFrame(mesh: THREE.InstancedMesh, i: number, off: { x: number; y: number }): void {
  const a = mesh.geometry.getAttribute('aFrame') as THREE.InstancedBufferAttribute | undefined;
  if (!a) return;
  a.setXY(i, off.x, off.y);
  a.needsUpdate = true;
}
