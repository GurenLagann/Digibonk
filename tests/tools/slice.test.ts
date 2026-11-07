import { backgroundColors, foregroundMask, components, pickBattleFrames, type Image } from '../../tools/sprites/slice.ts';

const pack = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;
const GREEN = pack(0, 200, 0), RED = pack(220, 20, 20), DARK = pack(0, 90, 0), BLUE = pack(0, 120, 140), MAG = pack(255, 0, 255), BLACK = 0;

function canvas(w: number, h: number, fill: number): Image {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { data[i * 4] = fill >> 16; data[i * 4 + 1] = (fill >> 8) & 255; data[i * 4 + 2] = fill & 255; data[i * 4 + 3] = 255; }
  return { w, h, data };
}
function set(img: Image, x: number, y: number, c: number) { const i = (y * img.w + x) * 4; img.data[i] = c >> 16; img.data[i + 1] = (c >> 8) & 255; img.data[i + 2] = c & 255; img.data[i + 3] = 255; }
function rect(img: Image, x0: number, y0: number, w: number, h: number, c: number) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(img, x, y, c); }
function checker(img: Image, x0: number, y0: number, w: number, h: number, a: number, b: number) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(img, x, y, (x + y) % 2 ? a : b); }

test('flat background detected, sprite colors kept', () => {
  const img = canvas(100, 60, GREEN); checker(img, 10, 10, 20, 20, RED, DARK); checker(img, 60, 20, 20, 20, RED, DARK);
  const bg = backgroundColors(img); expect(bg.has(GREEN)).toBe(true); expect(bg.has(RED)).toBe(false); expect(bg.has(DARK)).toBe(false);
});
test('flat-area heuristic keeps sprite colors', () => {
  const img = canvas(100, 60, GREEN); checker(img, 10, 10, 30, 30, RED, GREEN); // sprite has isolated background-colored pixels
  rect(img, 10, 10, 30, 1, RED); rect(img, 10, 39, 30, 1, RED); rect(img, 10, 10, 1, 30, RED); rect(img, 39, 10, 1, 30, RED);
  const bg = backgroundColors(img); const mask = foregroundMask(img, bg);
  const comps = components(mask, img.w, img.h);
  expect(comps).toHaveLength(1); expect(comps[0].rect).toEqual({ x: 10, y: 10, w: 30, h: 30 });
});
test('cell background on outer background', () => {
  const img = canvas(150, 60, BLUE);
  for (const x0 of [5, 55, 105]) { rect(img, x0, 5, 40, 50, MAG); checker(img, x0 + 10, 15, 20, 30, RED, DARK); }
  const bg = backgroundColors(img); expect(bg.has(BLUE) && bg.has(MAG)).toBe(true);
  expect(components(foregroundMask(img, bg), img.w, img.h)).toHaveLength(3);
});
test('thin frame lines are dropped', () => {
  const img = canvas(120, 120, BLUE); rect(img, 10, 10, 80, 1, BLACK); rect(img, 10, 89, 80, 1, BLACK); rect(img, 10, 10, 1, 80, BLACK); rect(img, 89, 10, 1, 80, BLACK);
  expect(components(foregroundMask(img, backgroundColors(img)), img.w, img.h)).toHaveLength(0);
});
test('battle frames: 5 largest in reading order', () => {
  const c = (x: number, y: number, w: number, h: number, pixels: number) => ({ rect: { x, y, w, h }, pixels });
  const comps = [c(300, 10, 40, 40, 1500), c(10, 10, 40, 40, 1400), c(150, 12, 40, 38, 1450), c(10, 100, 40, 40, 1300), c(150, 104, 40, 40, 1350), c(10, 200, 10, 10, 90), c(300, 100, 5, 5, 25)];
  expect(pickBattleFrames(comps).map(k => [k.rect.x, k.rect.y])).toEqual([[10, 10], [150, 12], [300, 10], [10, 100], [150, 104]]);
});

import { extract, buildStrip, rolesFor, buildOne } from '../../tools/sprites/slice.ts';
import { encodePng } from '../../tools/sprites/png.ts';

const alpha = (img: Image, x: number, y: number) => img.data[(y * img.w + x) * 4 + 3];

test('extract makes background transparent', () => {
  const img = canvas(40, 40, GREEN); rect(img, 10, 10, 20, 20, RED);
  const out = extract(img, { x: 8, y: 8, w: 24, h: 24 }, new Set([GREEN]));
  expect(alpha(out, 0, 0)).toBe(0); expect(alpha(out, 5, 5)).toBe(255);
});
test('extract keeps tiny background-colored details but clears enclosed gaps', () => {
  const img = canvas(60, 60, GREEN); rect(img, 10, 10, 40, 40, RED);
  set(img, 20, 20, GREEN);                 // olho verde isolado → fica
  rect(img, 30, 30, 6, 6, GREEN);          // vão fechado entre braço e corpo → sai
  const out = extract(img, { x: 10, y: 10, w: 40, h: 40 }, new Set([GREEN]));
  expect(alpha(out, 10, 10)).toBe(255); expect(alpha(out, 22, 22)).toBe(0);
});
test('strip aligns frames by bottom-center', () => {
  const a = canvas(10, 20, RED), b = canvas(30, 10, RED);
  const { strip, frameW, frameH } = buildStrip([a, b]);
  expect([frameW, frameH]).toEqual([32, 22]); expect(strip.w).toBe(64);
  expect(alpha(strip, 32 + 1, 20)).toBe(255); expect(alpha(strip, 32 + 1, 21)).toBe(0); expect(alpha(strip, 32 + 1, 10)).toBe(0);
  expect(alpha(strip, 11, 1)).toBe(255); expect(alpha(strip, 10, 1)).toBe(0);
});
test('override reorders roles', () => {
  expect(rolesFor('growlmon', { growlmon: { roles: ['idle1', 'idle2', 'idle3', 'hurt', 'attack'] } })).toEqual(['idle1', 'idle2', 'idle3', 'hurt', 'attack']);
  expect(rolesFor('agumon', {})).toEqual(['idle1', 'idle2', 'idle3', 'attack', 'hurt']);
});
test('build is deterministic and outputs canonical role order', () => {
  const img = canvas(400, 120, BLUE);
  [10, 90, 170, 250, 330].forEach((x, i) => checker(img, x, 20, 40 + i, 60, RED, DARK));
  const a = buildOne('x', img, { x: { roles: ['idle1', 'idle2', 'idle3', 'hurt', 'attack'] } });
  const b = buildOne('x', img, { x: { roles: ['idle1', 'idle2', 'idle3', 'hurt', 'attack'] } });
  expect(encodePng(a.strip).equals(encodePng(b.strip))).toBe(true);
  expect(a.warnings).toEqual([]); expect(a.frameW).toBe(46);
  // 4º componente (largura 43) é 'hurt' → vai para a posição 4 (índice 4) da tira canônica
  expect(a.order).toEqual([0, 1, 2, 4, 3]);
});

test('extract drops small detached islands like stray text', () => {
  const img = canvas(60, 60, GREEN); checker(img, 10, 10, 30, 30, RED, DARK);
  rect(img, 45, 12, 3, 4, BLACK); // 12px "letra" solta dentro do recorte
  const out = extract(img, { x: 8, y: 8, w: 44, h: 36 }, new Set([GREEN]));
  expect(alpha(out, 45 - 8, 12 - 8)).toBe(0); expect(alpha(out, 20 - 8, 20 - 8)).toBe(255);
});
test('ignore rects and a 4-pose sheet reuse frames for missing roles', () => {
  const img = canvas(500, 120, BLUE);
  [10, 90, 170, 250].forEach((x, i) => checker(img, x, 20, 40 + i, 60, RED, DARK));
  rect(img, 400, 10, 90, 90, MAG); checker(img, 410, 20, 70, 70, RED, BLACK); // "selo do ripper", maior que as poses
  const r = buildOne('g', img, { g: { count: 4, roles: ['idle1', 'idle2', 'attack', 'hurt'], ignore: [{ x: 395, y: 0, w: 105, h: 120 }] } });
  expect(r.warnings).toEqual([]);
  expect(r.order).toEqual([0, 1, 1, 2, 3]); // idle3 reaproveita idle2
});
