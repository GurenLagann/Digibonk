import { createInput, DEFAULT_BINDINGS } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';

function make(pads: { current: (Gamepad | null)[] } = { current: [] }, bindings: Record<string, string> = {}, locked = { on: true }) {
  const handlers: Record<string, ((e: { code: string; movementX?: number; movementY?: number; preventDefault?: () => void }) => void)[]> = {};
  const target = { addEventListener: (t: string, h: never) => { (handlers[t] ??= []).push(h); } } as never;
  const input = createInput(target, () => pads.current, bindings, () => locked.on);
  const key = (type: 'keydown' | 'keyup', code: string) => handlers[type]?.forEach(h => h({ code, preventDefault() {} }));
  const mouse = (movementX: number, movementY: number) => handlers.mousemove?.forEach(h => h({ code: '', movementX, movementY }));
  return { input, key, mouse, locked };
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

const cam = defaultSave().camera;
test('mouse com lock vira yaw e o acumulador zera no poll', () => {
  const { input, mouse } = make(); mouse(100, 0); input.poll();
  expect(input.look(1 / 60).dx).toBeCloseTo(100 * 0.0025);
  input.poll(); expect(input.look(1 / 60).dx).toBe(0);
});
test('mouse sem lock é ignorado', () => {
  const { input, mouse, locked } = make(); locked.on = false; mouse(100, 50); input.poll();
  expect(input.look(1 / 60)).toEqual({ dx: 0, dy: 0 });
});
test('analógico direito com zona morta', () => {
  const pads = { current: [pad([0, 0, 0.8, 0])] }; const { input } = make(pads); input.poll();
  expect(input.look(0.5).dx).toBeCloseTo(0.8 * 2.6 * 0.5);
  pads.current = [pad([0, 0, 0.2, 0])]; input.poll(); expect(input.look(0.5).dx).toBe(0);
});
test('invertY inverte dy', () => {
  const { input, mouse } = make(); input.setCamera({ ...cam, invertY: true }); mouse(0, 40); input.poll();
  expect(input.look(1 / 60).dy).toBeLessThan(0);
});
test('setCamera troca o eixo X do analógico', () => {
  const pads = { current: [pad([0, 0, 0, 0, 0.9])] }; const { input } = make(pads);
  input.setCamera({ ...cam, padAxisX: 4 }); input.poll(); expect(input.look(0.1).dx).toBeGreaterThan(0);
});
test('captureAxis resolve com o eixo movido', async () => {
  const pads = { current: [pad([0, 0, 0, 0])] }; const { input } = make(pads);
  const p = input.captureAxis(); pads.current = [pad([0, 0, 0, -0.9])]; input.poll(); await expect(p).resolves.toBe(3);
});
test('captureAxis: eixo em repouso em -1 (gatilho) não resolve; analógico de 0 para 0.9 resolve', async () => {
  const pads = { current: [pad([0, 0, -1, 0, -1])] }; const { input } = make(pads);
  let got: number | null = null;
  void input.captureAxis().then(i => { got = i; });
  for (let k = 0; k < 5; k++) { input.poll(); await Promise.resolve(); }
  expect(got).toBeNull();
  pads.current = [pad([0, 0, -1, 0.9, -1])]; input.poll(); await Promise.resolve();
  expect(got).toBe(3);
});
test('captureAxis: analógico já segurado em 0.9 só resolve quando muda mais de 0.6 da base', async () => {
  const pads = { current: [pad([0, 0, 0.9, 0])] }; const { input } = make(pads);
  let got: number | null = null;
  void input.captureAxis().then(i => { got = i; });
  for (let k = 0; k < 5; k++) { input.poll(); await Promise.resolve(); }
  pads.current = [pad([0, 0, 0.4, 0])]; input.poll(); await Promise.resolve();
  expect(got).toBeNull();
  pads.current = [pad([0, 0, 0.2, 0])]; input.poll(); await Promise.resolve();
  expect(got).toBe(2);
});
test('captureAxis sem controle no início: a base vem do primeiro poll com controle', async () => {
  const pads = { current: [] as (Gamepad | null)[] }; const { input } = make(pads);
  let got: number | null = null;
  void input.captureAxis().then(i => { got = i; });
  input.poll(); pads.current = [pad([0, 0, -1, 0])]; input.poll(); await Promise.resolve();
  expect(got).toBeNull();
  pads.current = [pad([0, 0, -1, -0.8])]; input.poll(); await Promise.resolve();
  expect(got).toBe(3);
});

test('auto-repeat do teclado (mesmo após blur) não vira um novo pressionar', () => {
  const handlers: Record<string, ((e: unknown) => void)[]> = {};
  const target = { addEventListener: (t: string, h: never) => { (handlers[t] ??= []).push(h); } } as never;
  const input = createInput(target, () => [], {});
  const fire = (t: string, e: object = {}) => handlers[t]?.forEach(h => h(e));
  fire('keydown', { code: 'Enter', repeat: false }); input.poll();
  expect(input.pressed('confirm')).toBe(true);
  fire('blur'); input.poll(); fire('keydown', { code: 'Enter', repeat: true }); input.poll();
  expect(input.pressed('confirm')).toBe(false);
  fire('keydown', { code: 'Enter', repeat: true }); input.poll();
  expect(input.pressed('confirm')).toBe(false);
});

test('tecla segurada durante um blur volta a valer no auto-repeat, sem virar pressionar', () => {
  const handlers: Record<string, ((e: unknown) => void)[]> = {};
  const target = { addEventListener: (t: string, h: never) => { (handlers[t] ??= []).push(h); } } as never;
  const input = createInput(target, () => [], {});
  const fire = (t: string, e: object = {}) => handlers[t]?.forEach(h => h(e));
  fire('keydown', { code: 'KeyW', repeat: false }); input.poll();
  expect(input.move().mz).toBe(-1);
  fire('blur'); input.poll();
  expect(input.move().mz).toBe(0);
  fire('keydown', { code: 'KeyW', repeat: true }); input.poll();
  expect(input.move().mz).toBe(-1);
  expect(input.pressed('up')).toBe(false);
  fire('keyup', { code: 'KeyW' }); input.poll();
  expect(input.move().mz).toBe(0);
});
