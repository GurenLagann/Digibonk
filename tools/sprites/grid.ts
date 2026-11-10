import type { Image } from './slice.ts';

/**
 * Folhas em grade (pasta "sprites_andar_correr"): renders de modelos 3D, fundo transparente, células de 256 px,
 * 5 quadros por linha, uma direção por linha. Linhas 0–4 olham para a ESQUERDA (o jogo espelha para a direita):
 * 0 frente, 1 frente-esquerda, 2 esquerda, 3 costas-esquerda, 4 costas. As linhas 5–7 (direita) não são usadas.
 */
export const GRID_SRC = 'assets-src/sprites/grid';
export const GRID_CELL = 256;
export const GRID_COLS = 5;
/** sufixo do papel no jogo para cada linha, de cima para baixo */
export const GRID_DIRS = ['down', 'diagdown', '', 'diagup', 'up'] as const;
/** folhas por Digimon (<id>_<folha>.png) e o papel dos quadros no jogo: idle = parado respirando, defeat = derrota */
export const GRID_KINDS = ['walk', 'run', 'idle', 'defeat'] as const;
export const GRID_ROLE: Record<(typeof GRID_KINDS)[number], string> = { walk: 'walk', run: 'run', idle: 'stand', defeat: 'death' };
export const GRID_IDLE: Record<(typeof GRID_DIRS)[number], string> = { down: 'idledown', diagdown: 'idlediagdown', '': 'idle1', diagup: 'idlediagup', up: 'idleup' };

/** recorta a célula (linha, coluna) da folha */
export function cell(img: Image, row: number, col: number): Image {
  const S = GRID_CELL, data = new Uint8Array(S * S * 4);
  for (let y = 0; y < S; y++) {
    const si = ((row * S + y) * img.w + col * S) * 4;
    data.set(img.data.subarray(si, si + S * 4), y * S * 4);
  }
  return { w: S, h: S, data };
}

/** reduz por média de área (cor ponderada pelo alfa), para não serrilhar os renders 3D */
export function downscale(img: Image, s: number): Image {
  if (s >= 1) return img;
  const w = Math.max(1, Math.round(img.w * s)), h = Math.max(1, Math.round(img.h * s));
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const x0 = Math.floor(x / s), x1 = Math.max(x0 + 1, Math.floor((x + 1) / s));
    const y0 = Math.floor(y / s), y1 = Math.max(y0 + 1, Math.floor((y + 1) / s));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = y0; sy < Math.min(y1, img.h); sy++) for (let sx = x0; sx < Math.min(x1, img.w); sx++) {
      const i = (sy * img.w + sx) * 4, al = img.data[i + 3];
      r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al; a += al; n++;
    }
    const o = (y * w + x) * 4;
    if (a > 0) { data[o] = r / a; data[o + 1] = g / a; data[o + 2] = b / a; }
    data[o + 3] = n ? a / n : 0;
  }
  return { w, h, data };
}
