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

export function backgroundColors(img: Image, minShare = 0.04, minFlat = 0.8): Set<number> {
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

/** Recorta `rect` e apaga o fundo: regiões (4-conexas) de cor de fundo que tocam a borda do recorte
 *  ou têm >= minHole pixels. Pixels isolados da cor de fundo (detalhes do sprite) ficam. */
export function extract(img: Image, rect: Rect, bg: Set<number>, minHole = 6, minIsland = 40): Image {
  const { w, h } = rect;
  const out: Image = { w, h, data: new Uint8Array(w * h * 4) };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = ((rect.y + y) * img.w + rect.x + x) * 4, di = (y * w + x) * 4;
    out.data.set(img.data.subarray(si, si + 4), di);
  }
  const isBg = (x: number, y: number) => bg.has(colorAt(out, x, y));
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let start = 0; start < w * h; start++) {
    const sx = start % w, sy = (start - sx) / w;
    if (seen[start] || !isBg(sx, sy)) continue;
    const region: number[] = []; let touches = false;
    stack.push(start); seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!; region.push(p);
      const px = p % w, py = (p - px) / w;
      if (px === 0 || py === 0 || px === w - 1 || py === h - 1) touches = true;
      for (const [nx, ny] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (!seen[q] && isBg(nx, ny)) { seen[q] = 1; stack.push(q); }
      }
    }
    if (touches || region.length >= minHole) for (const p of region) out.data.fill(0, p * 4, p * 4 + 4);
  }
  dropIslands(out, minIsland);
  return out;
}

/** apaga grupos opacos (8-conexos) com menos de `min` pixels — letras de crédito, sujeira */
function dropIslands(img: Image, min: number) {
  const { w, h } = img; const seen = new Uint8Array(w * h); const stack: number[] = [];
  const opaque = (p: number) => img.data[p * 4 + 3] !== 0;
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !opaque(start)) continue;
    const region: number[] = []; stack.push(start); seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!; region.push(p);
      const px = p % w, py = (p - px) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx; if (!seen[q] && opaque(q)) { seen[q] = 1; stack.push(q); }
      }
    }
    if (region.length < min) for (const p of region) img.data.fill(0, p * 4, p * 4 + 4);
  }
}

export function buildStrip(frames: Image[]): { strip: Image; frameW: number; frameH: number } {
  const frameW = Math.max(...frames.map(f => f.w)) + 2, frameH = Math.max(...frames.map(f => f.h)) + 2;
  const strip: Image = { w: frameW * frames.length, h: frameH, data: new Uint8Array(frameW * frames.length * frameH * 4) };
  frames.forEach((f, i) => {
    const ox = i * frameW + Math.floor((frameW - f.w) / 2), oy = frameH - 1 - f.h;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const si = (y * f.w + x) * 4, di = ((oy + y) * strip.w + ox + x) * 4;
      strip.data.set(f.data.subarray(si, si + 4), di);
    }
  });
  return { strip, frameW, frameH };
}

/** como buildStrip, mas em grade de `cols` quadros por linha (o jogo lê `cols` do manifesto) */
export function buildGrid(frames: Image[], cols: number): { strip: Image; frameW: number; frameH: number } {
  const one = buildStrip(frames), { frameW, frameH } = one, rows = Math.ceil(frames.length / cols);
  const w = frameW * cols, h = frameH * rows, data = new Uint8Array(w * h * 4);
  frames.forEach((_, i) => {
    const ox = (i % cols) * frameW, oy = Math.floor(i / cols) * frameH;
    for (let y = 0; y < frameH; y++) {
      const si = (y * one.strip.w + i * frameW) * 4;
      data.set(one.strip.data.subarray(si, si + frameW * 4), ((oy + y) * w + ox) * 4);
    }
  });
  return { strip: { w, h, data }, frameW, frameH };
}

export interface SheetOverride { roles?: Role[]; extraBg?: number[]; minShare?: number; count?: number; ignore?: Rect[] }
export function rolesFor(id: string, overrides: Record<string, SheetOverride>): Role[] {
  return overrides[id]?.roles ?? DEFAULT_ROLES;
}

export function buildOne(id: string, img: Image, overrides: Record<string, SheetOverride>) {
  const o = overrides[id] ?? {};
  const bg = backgroundColors(img, o.minShare);
  for (const c of o.extraBg ?? []) bg.add(c);
  const mask = foregroundMask(img, bg);
  for (const r of o.ignore ?? []) for (let y = r.y; y < Math.min(img.h, r.y + r.h); y++) mask.fill(0, y * img.w + r.x, y * img.w + Math.min(img.w, r.x + r.w));
  const want = o.count ?? DEFAULT_ROLES.length;
  const picked = pickBattleFrames(components(mask, img.w, img.h), want);
  const warnings: string[] = [];
  if (picked.length < want) warnings.push(`${id}: só ${picked.length} poses encontradas`);
  const roles = rolesFor(id, overrides);
  const FALLBACK: Record<Role, Role[]> = { idle1: [], idle2: ['idle1'], idle3: ['idle2', 'idle1'], attack: ['idle1'], hurt: ['idle1'] };
  const indexOf = (r: Role): number => { const i = roles.indexOf(r); if (i >= 0) return i; for (const f of FALLBACK[r]) { const j = roles.indexOf(f); if (j >= 0) return j; } return 0; };
  const order = DEFAULT_ROLES.map(indexOf).map(i => Math.min(i, picked.length - 1));
  const frames = order.map(i => extract(img, picked[i].rect, bg));
  return { ...buildStrip(frames), warnings, order, picked };
}
