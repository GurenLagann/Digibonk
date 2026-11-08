import { newPhase } from '../../src/sim/phase';
import { createRng } from '../../src/core/rng';
import { timerView } from '../../src/ui/hudTimer';

const ph = (t: number, overtime = false) => ({ ...newPhase(1, createRng(1)), t, overtime });

test('start of the phase: normal, full time left, empty bar', () => {
  expect(timerView(ph(0))).toEqual({ text: '10:00', frac: 0, mode: 'normal', pct: 0 });
});

test('last minute is a warning; exactly 60 s left is still normal', () => {
  const w = timerView(ph(541));
  expect(w.mode).toBe('warning'); expect(w.text).toBe('00:59');
  expect(timerView(ph(540)).mode).toBe('normal');
});

test('overtime: full bar and extra time with a plus sign', () => {
  expect(timerView(ph(683, true))).toEqual({ text: '+01:23', frac: 1, mode: 'overtime', pct: 100 });
});

test('pct is the whole percentage of the elapsed phase time', () => {
  expect(timerView(ph(372)).pct).toBe(62);
});

test('after overtime, a fresh phase state (t=0, overtime=false) is back to normal', () => {
  expect(timerView(ph(683, true)).mode).toBe('overtime');
  expect(timerView(ph(0, false)).mode).toBe('normal');
});
