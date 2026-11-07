import type { Image, Role } from './slice.ts';

/** sprites de V-pet: 2 quadros (passinho), alternados pelo ciclo de idle do jogo */
export const VPET_ROLES: Role[] = ['idle1', 'idle2'];

/** recorta todos os quadros na caixa que une os pixels opacos de todos eles */
export function cropToUnion(frames: Image[]): Image[] {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (const f of frames)
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++)
      if (f.data[(y * f.w + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) return frames.map(() => ({ w: 1, h: 1, data: new Uint8Array(4) }));
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  return frames.map(f => {
    const data = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      const sy = y + y0; if (sy >= f.h) continue;
      const row = f.data.subarray((sy * f.w + x0) * 4, (sy * f.w + Math.min(x1 + 1, f.w)) * 4);
      data.set(row, y * w * 4);
    }
    return { w, h, data };
  });
}
