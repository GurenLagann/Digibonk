import type { Image, Rect } from './slice.ts';

/** quadros menores que isso são texto, linhas ou sujeira da folha */
const MIN_W = 10, MIN_H = 15;

/**
 * organiza os quadros detectados em fileiras ordenadas por x. Um quadro entra numa fileira quando
 * sobrepõe verticalmente pelo menos metade da própria altura com a faixa dela (Digimon que voa sobe/desce).
 */
export function gridOf(rects: Rect[]): Rect[][] {
  const rows: { top: number; bottom: number; items: Rect[] }[] = [];
  for (const q of [...rects].filter(q => q.w >= MIN_W && q.h >= MIN_H).sort((a, b) => a.y - b.y)) {
    const row = rows.find(rw => Math.min(rw.bottom, q.y + q.h) - Math.max(rw.top, q.y) >= q.h / 2);
    if (row) { row.items.push(q); row.top = Math.min(row.top, q.y); row.bottom = Math.max(row.bottom, q.y + q.h); }
    else rows.push({ top: q.y, bottom: q.y + q.h, items: [q] });
  }
  return rows.sort((a, b) => a.top - b.top).map(rw => rw.items.sort((a, b) => a.x - b.x));
}

/** ampliação inteira sem interpolação (pixel art continua nítida) */
export function scaleNearest(img: Image, k: number): Image {
  const w = img.w * k, h = img.h * k, data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = ((((y / k) | 0) * img.w) + ((x / k) | 0)) * 4;
    data.set(img.data.subarray(s, s + 4), (y * w + x) * 4);
  }
  return { w, h, data };
}
