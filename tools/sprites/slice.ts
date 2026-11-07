export interface Image { w: number; h: number; data: Uint8Array } // RGBA
export interface Rect { x: number; y: number; w: number; h: number }
export interface Component { rect: Rect; pixels: number }
export type Role = 'idle1' | 'idle2' | 'idle3' | 'attack' | 'hurt';
export const DEFAULT_ROLES: Role[] = ['idle1', 'idle2', 'idle3', 'attack', 'hurt'];

export const TRANSPARENT = -1;
/** cor RGB empacotada, ou TRANSPARENT quando alfa = 0 */
export function colorAt(img: Image, x: number, y: number): number {
  const i = (y * img.w + x) * 4;
  if (img.data[i + 3] === 0) return TRANSPARENT;
  return (img.data[i] << 16) | (img.data[i + 1] << 8) | img.data[i + 2];
}

export function backgroundColors(img: Image, minShare = 0.04, minFlat = 0.9): Set<number> {
  const count = new Map<number, number>(), flat = new Map<number, number>();
  const { w, h } = img;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = colorAt(img, x, y);
    count.set(c, (count.get(c) ?? 0) + 1);
    const same = (nx: number, ny: number) => nx < 0 || ny < 0 || nx >= w || ny >= h || colorAt(img, nx, ny) === c;
    const k = (same(x - 1, y) ? 1 : 0) + (same(x + 1, y) ? 1 : 0) + (same(x, y - 1) ? 1 : 0) + (same(x, y + 1) ? 1 : 0);
    if (k >= 3) flat.set(c, (flat.get(c) ?? 0) + 1);
  }
  const out = new Set<number>([TRANSPARENT]);
  for (const [c, n] of count) if (n / (w * h) >= minShare && (flat.get(c) ?? 0) / n >= minFlat) out.add(c);
  return out;
}

export function foregroundMask(img: Image, bg: Set<number>): Uint8Array {
  const m = new Uint8Array(img.w * img.h);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) m[y * img.w + x] = bg.has(colorAt(img, x, y)) ? 0 : 1;
  return m;
}

export function components(mask: Uint8Array, w: number, h: number, minPixels = 120, minFill = 0.15): Component[] {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const out: Component[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || seen[start]) continue;
    let sp = 0, n = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
    stack[sp++] = start; seen[start] = 1;
    while (sp) {
      const p = stack[--sp]; const px = p % w, py = (p - px) / w; n++;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (mask[q] && !seen[q]) { seen[q] = 1; stack[sp++] = q; }
      }
    }
    const rect = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    if (n >= minPixels && n / (rect.w * rect.h) >= minFill) out.push({ rect, pixels: n });
  }
  return out;
}

export function pickBattleFrames(comps: Component[], count = 5): Component[] {
  const top = [...comps].sort((a, b) => b.pixels - a.pixels || a.rect.y - b.rect.y || a.rect.x - b.rect.x).slice(0, count);
  const avgH = top.reduce((s, c) => s + c.rect.h, 0) / Math.max(1, top.length);
  const byY = [...top].sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x);
  const rows: Component[][] = [];
  for (const c of byY) {
    const row = rows[rows.length - 1];
    if (row && c.rect.y - row[0].rect.y < avgH * 0.3) row.push(c); else rows.push([c]);
  }
  return rows.flatMap(r => r.sort((a, b) => a.rect.x - b.rect.x));
}
