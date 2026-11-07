import type { Image, Rect } from './slice.ts';

/** quadros menores que isso são texto, linhas ou sujeira da folha */
const MIN_W = 10, MIN_H = 15;

/** organiza os quadros detectados em fileiras (sobreposição vertical) ordenadas por x */
export function gridOf(rects: Rect[]): Rect[][] {
  const rows: { cy: number; h: number; items: Rect[] }[] = [];
  for (const q of [...rects].filter(q => q.w >= MIN_W && q.h >= MIN_H).sort((a, b) => a.y - b.y)) {
    const cy = q.y + q.h / 2;
    const row = rows.find(rw => Math.abs(rw.cy - cy) < Math.min(rw.h, q.h) / 2);
    if (row) row.items.push(q); else rows.push({ cy, h: q.h, items: [q] });
  }
  return rows.sort((a, b) => a.cy - b.cy).map(rw => rw.items.sort((a, b) => a.x - b.x));
}

export function flipH(img: Image): Image {
  const data = new Uint8Array(img.data.length);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++)
    data.set(img.data.subarray((y * img.w + x) * 4, (y * img.w + x) * 4 + 4), (y * img.w + (img.w - 1 - x)) * 4);
  return { w: img.w, h: img.h, data };
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
