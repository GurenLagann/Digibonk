import { createFixedLoop } from '../../src/core/loop';

test('loop clamps dt', () => {
  let n = 0; const l = createFixedLoop(1 / 60, 0.25, () => n++);
  l.advance(10); expect(n).toBe(15);
});
test('loop accumulates fractional frames', () => {
  let n = 0; const l = createFixedLoop(1 / 60, 0.25, () => n++);
  l.advance(1 / 120); expect(n).toBe(0); l.advance(1 / 120); expect(n).toBe(1);
});
