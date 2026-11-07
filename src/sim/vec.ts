export const dist2 = (ax: number, az: number, bx: number, bz: number) => (ax - bx) ** 2 + (az - bz) ** 2;
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export function norm(x: number, z: number): [number, number] {
  const l = Math.hypot(x, z);
  return l > 1e-9 ? [x / l, z / l] : [0, 0];
}
