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

/** cor do contorno que substitui a borda contaminada pelo fundo */
export const DEFRINGE_OUTLINE = [28, 20, 16] as const;

/**
 * JPEG + chroma key deixam a borda puxada para a cor do fundo.
 * Pixels opacos vizinhos de transparência (ou da borda da imagem) com tom puxado para a cor-chave viram contorno escuro.
 */
export function defringe(img: Image, key: readonly number[], minCos = 0.8): Image {
  const { w, h } = img, data = img.data.slice();
  const kg = (key[0] + key[1] + key[2]) / 3, kv = [key[0] - kg, key[1] - kg, key[2] - kg], kn = Math.hypot(...kv);
  const alpha = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h ? 0 : img.data[(y * w + x) * 4 + 3];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (!img.data[i + 3]) continue;
    if (alpha(x - 1, y) && alpha(x + 1, y) && alpha(x, y - 1) && alpha(x, y + 1)) continue;
    // cor puxada na direção da cor-chave (cosseno entre os desvios do cinza)
    const r = img.data[i], g = img.data[i + 1], b = img.data[i + 2], m = (r + g + b) / 3;
    const v = [r - m, g - m, b - m], n = Math.hypot(...v);
    if (n > 12 && (v[0] * kv[0] + v[1] * kv[1] + v[2] * kv[2]) / (n * kn) > minCos) data.set(DEFRINGE_OUTLINE, i);
  }
  return { w, h, data };
}
