import { createRng } from '../../src/core/rng';

test('same seed same sequence', () => {
  const a = createRng(42), b = createRng(42);
  expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
});
test('int is inclusive and in range', () => {
  const r = createRng(1); const seen = new Set<number>();
  for (let i = 0; i < 1000; i++) { const v = r.int(2, 4); seen.add(v); expect(v).toBeGreaterThanOrEqual(2); expect(v).toBeLessThanOrEqual(4); }
  expect([...seen].sort()).toEqual([2, 3, 4]);
});
test('weighted never picks zero weight', () => {
  const r = createRng(7);
  for (let i = 0; i < 500; i++) expect(r.weighted(['a', 'b'], x => (x === 'a' ? 0 : 1))).toBe('b');
});
