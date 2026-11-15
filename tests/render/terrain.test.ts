import { expect, test } from 'vitest';
import { groundY, hills, isFlat, setGround, terraces, type HeightFn } from '../../src/render/terrain';
import { T } from '../../src/data/tuning';

const H = T.MAP_HALF;
const grid = (fn: (x: number, z: number) => void, step = 2.5) => { for (let x = -H; x <= H; x += step) for (let z = -H; z <= H; z += step) fn(x, z); };
const GENS: [string, HeightFn][] = [['hills', hills(7, 1.8)], ['terraces', terraces(7, 0.9, 2, 3)]];

test.each(GENS)('%s: limites, nascimento plano, longe plano, determinístico', (_n, f) => {
  let max = 0;
  grid((x, z) => { const y = f(x, z); expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(2.2); max = Math.max(max, y); });
  expect(max).toBeGreaterThan(0.5);
  for (const [x, z] of [[0, 0], [4, 3], [-5, 2], [H + 50, 0], [0, -H - 60], [T.ZONE.CENTER.x, T.ZONE.CENTER.z], [T.ZONE.CENTER.x + 20, 10]]) expect(f(x, z)).toBe(0);
  expect(f(37.3, -12.1)).toBe(f(37.3, -12.1));
});

test('hills: inclinação suave (≤ 0,6)', () => {
  const f = hills(7, 1.8), e = 0.25; let worst = 0;
  grid((x, z) => { worst = Math.max(worst, Math.abs(f(x + e, z) - f(x, z)) / e, Math.abs(f(x, z + e) - f(x, z)) / e); }, 1.7);
  expect(worst).toBeLessThanOrEqual(0.6);
});

test('terraces: maioria num nível exato, com mais de um nível', () => {
  const f = terraces(7, 0.9, 2, 3); let on = 0, n = 0; const levels = new Set<number>();
  grid((x, z) => { const y = f(x, z); n++; const k = Math.round(y / 0.9); if (Math.abs(y - k * 0.9) < 1e-9) { on++; levels.add(k); } });
  expect(on / n).toBeGreaterThanOrEqual(0.7);
  expect(levels.size).toBeGreaterThanOrEqual(2);
});

test('isFlat: retângulo no plano vs. atravessando degrau', () => {
  const step: HeightFn = x => (x > 0 ? 1 : 0);
  expect(isFlat(step, -5, 0, 2, 2, 0)).toBe(true);
  expect(isFlat(step, 0.5, 0, 2, 2, 0)).toBe(false);
  expect(isFlat(step, 5, 0, 2, 2, Math.PI / 4)).toBe(true);
});

test('groundY segue setGround (padrão 0)', () => {
  expect(groundY(3, 3)).toBe(0);
  setGround(() => 1.5); expect(groundY(3, 3)).toBe(1.5);
  setGround(() => 0); expect(groundY(3, 3)).toBe(0);
});

test.each(GENS)('%s: plano antes do penhasco do DW3 (MAP_HALF+24) e além', (_n, f) => {
  for (let a = -H - 30; a <= H + 30; a += 3) for (const d of [H + 23, H + 30, H + 40]) {
    expect(f(d, a)).toBe(0); expect(f(-d, a)).toBe(0); expect(f(a, d)).toBe(0); expect(f(a, -d)).toBe(0);
  }
});

test('terraces: rampa com a largura pedida (inclinação típica ≈ degrau/rampa, não um paredão)', () => {
  const step = 1.3, ramp = 3, f = terraces(0xfac701, step, 2, ramp), e = 0.25;
  const slopes: number[] = [];
  grid((x, z) => {
    const s = Math.hypot(f(x + e, z) - f(x - e, z), f(x, z + e) - f(x, z - e)) / (2 * e);
    if (s > 0.01 && Math.abs(x) < H - 20 && Math.abs(z) < H - 20 && Math.hypot(x, z) > 20) slopes.push(s);
  }, 0.5);
  slopes.sort((a, b) => a - b);
  const median = slopes[Math.floor(slopes.length / 2)];
  expect(median).toBeLessThan((step / ramp) * 1.6);
  expect(median).toBeGreaterThan((step / ramp) * 0.5);
});

test('groundNormal: plano = para cima; rampa x inclina para -x', async () => {
  const { groundNormal } = await import('../../src/render/terrain');
  const n = groundNormal(() => 0, 3, 4);
  expect(n.y).toBeCloseTo(1); expect(n.x).toBeCloseTo(0); expect(n.z).toBeCloseTo(0);
  const r = groundNormal(x => x * 0.5, 3, 4);
  expect(r.x).toBeCloseTo(-0.5 / Math.hypot(1, 0.5), 3); expect(r.y).toBeCloseTo(1 / Math.hypot(1, 0.5), 3); expect(r.z).toBeCloseTo(0, 3);
});
