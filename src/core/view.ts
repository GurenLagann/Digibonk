// Matemática de vista relativa à câmera. yaw 0 = câmera em +z olhando para -z; yaw cresce girando a câmera para +x.
export type ViewFacing = 'side' | 'up' | 'down' | 'diagup' | 'diagdown';

/** Intenção da tela (W = mz -1) → vetor no mundo. */
export function rotateByYaw(mx: number, mz: number, yaw: number): { mx: number; mz: number } {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  return { mx: mx * c + mz * s, mz: -mx * s + mz * c };
}

export function cameraForward(yaw: number): { x: number; z: number } {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

/** Direção no mundo → vista no espaço da câmera (mesmos setores de 45° de movePlayer). */
export function viewFacing(dx: number, dz: number, yaw: number): { facing: ViewFacing; right: boolean } {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const sx = dx * c - dz * s, sz = dx * s + dz * c;
  const a = Math.atan2(Math.abs(sz), Math.abs(sx));
  const facing: ViewFacing = a < Math.PI / 8 ? 'side' : a > (3 * Math.PI) / 8 ? (sz < 0 ? 'up' : 'down') : sz < 0 ? 'diagup' : 'diagdown';
  return { facing, right: sx > 0 };
}

/** (ax, az) a partir do parceiro está fora do cone ±halfAngle em volta do foco da câmera. */
export function outsideView(ax: number, az: number, yaw: number, halfAngle: number): boolean {
  const f = cameraForward(yaw);
  const l = Math.hypot(ax, az);
  if (l < 1e-9) return false;
  const cos = (ax * f.x + az * f.z) / l;
  return Math.acos(Math.max(-1, Math.min(1, cos))) > halfAngle;
}
