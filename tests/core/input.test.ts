import { createInput, DEFAULT_BINDINGS } from '../../src/core/input';

function make(pads: { current: (Gamepad | null)[] } = { current: [] }, bindings: Record<string, string> = {}) {
  const handlers: Record<string, ((e: { code: string; preventDefault?: () => void }) => void)[]> = {};
  const target = { addEventListener: (t: string, h: never) => { (handlers[t] ??= []).push(h); } } as never;
  const input = createInput(target, () => pads.current, bindings);
  const key = (type: 'keydown' | 'keyup', code: string) => handlers[type]?.forEach(h => h({ code, preventDefault() {} }));
  return { input, key };
}
const pad = (axes: number[], pressed: number[] = []) =>
  ({ connected: true, axes, buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: pressed.includes(i), value: pressed.includes(i) ? 1 : 0 })) }) as unknown as Gamepad;

test('defaults include WASD and arrows', () => expect(DEFAULT_BINDINGS.up).toEqual(expect.arrayContaining(['KeyW', 'ArrowUp'])));
test('WASD diagonal is normalized', () => {
  const { input, key } = make(); key('keydown', 'KeyW'); key('keydown', 'KeyD'); input.poll();
  const m = input.move(); expect(Math.hypot(m.mx, m.mz)).toBeCloseTo(1); expect(m.mx).toBeGreaterThan(0); expect(m.mz).toBeLessThan(0);
});
test('pad stick beats deadzone', () => {
  const pads = { current: [pad([0.1, 0])] }; const { input } = make(pads); input.poll(); expect(input.move().mx).toBe(0);
  pads.current = [pad([0.8, 0])]; input.poll(); expect(input.move().mx).toBeCloseTo(0.8);
});
test('rebound pad button triggers action', () => {
  const pads = { current: [pad([0, 0], [5])] }; const { input } = make(pads);
  input.rebind('evolve', 'pad:b5'); input.poll(); expect(input.pressed('evolve')).toBe(true);
  expect(input.bindings().evolve).toBe('pad:b5');
});
test('rebinding a pad button keeps keyboard binding', () => {
  const { input, key } = make(); input.rebind('evolve', 'pad:b5'); key('keydown', 'KeyE'); input.poll(); expect(input.pressed('evolve')).toBe(true);
});
test('saved bindings are applied', () => {
  const pads = { current: [pad([0, 0], [7])] }; const { input } = make(pads, { evolve: 'pad:b7' }); input.poll(); expect(input.pressed('evolve')).toBe(true);
});
test('pad disconnect falls back to keyboard', () => {
  const pads = { current: [pad([0.9, 0])] as (Gamepad | null)[] }; const { input, key } = make(pads); input.poll();
  pads.current = []; key('keydown', 'KeyA'); input.poll(); expect(input.move().mx).toBeLessThan(0);
});
test('pressed is edge-triggered', () => {
  const { input, key } = make(); key('keydown', 'Enter');
  input.poll(); expect(input.pressed('confirm')).toBe(true);
  input.poll(); expect(input.pressed('confirm')).toBe(false);
  input.poll(); expect(input.pressed('confirm')).toBe(false);
});
test('a tap between polls is not lost', () => {
  const { input, key } = make(); key('keydown', 'KeyE'); key('keyup', 'KeyE'); input.poll(); expect(input.pressed('evolve')).toBe(true);
});
test('captureNext resolves with next key', async () => {
  const { input, key } = make(); const p = input.captureNext(); key('keydown', 'KeyQ'); await expect(p).resolves.toBe('KeyQ');
});
