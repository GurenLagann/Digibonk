import { T } from '../data/tuning';
import { defaultCamera, type CameraSettings } from './save';

export type Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'evolve' | 'pause' | 'opt1' | 'opt2' | 'opt3' | 'reroll' | 'skip' | 'ban';
export const ACTIONS: readonly Action[] = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'evolve', 'pause', 'opt1', 'opt2', 'opt3', 'reroll', 'skip', 'ban'];

export const DEFAULT_BINDINGS: Record<Action, string[]> = {
  up: ['KeyW', 'ArrowUp', 'pad:b12'],
  down: ['KeyS', 'ArrowDown', 'pad:b13'],
  left: ['KeyA', 'ArrowLeft', 'pad:b14'],
  right: ['KeyD', 'ArrowRight', 'pad:b15'],
  confirm: ['Enter', 'Space', 'pad:b0'],
  cancel: ['Backspace', 'pad:b1'],
  evolve: ['KeyE', 'pad:b3'],
  pause: ['Escape', 'pad:b9'],
  opt1: ['Digit1'],
  opt2: ['Digit2'],
  opt3: ['Digit3'],
  // level up: atualizar / pular / banir
  reroll: ['KeyF', 'pad:b2'],
  skip: ['KeyX', 'pad:b4'],
  ban: ['KeyZ', 'pad:b5'],
};

export interface Input {
  poll(): void;
  move(): { mx: number; mz: number };
  pressed(a: Action): boolean;
  held(a: Action): boolean;
  rebind(a: Action, code: string): void;
  resetBindings(): void;
  bindings(): Record<string, string>;
  codesFor(a: Action): string[];
  captureNext(): Promise<string>;
  padConnected(): boolean;
  /** yaw/pitch (rad) deste quadro: mouse acumulado até o último poll() + analógico direito do último poll() */
  look(dt: number): { dx: number; dy: number };
  setCamera(s: CameraSettings): void;
  /** resolve com o índice do primeiro eixo que se afastar mais de 0.6 do valor que tinha ao chamar (gatilhos em -1 e analógico já segurado não contam) */
  captureAxis(): Promise<number>;
}

type KeyTarget = { addEventListener(type: string, h: (e: KeyboardEvent & MouseEvent) => void): void };
const isPad = (c: string) => c.startsWith('pad:');
const DEADZONE = 0.2;

export function createInput(target: KeyTarget, getPads: () => (Gamepad | null)[], saved: Record<string, string>, isLocked: () => boolean = () => false): Input {
  const held = new Set<string>();
  const tapped = new Set<string>();
  let overrides: Record<string, string> = { ...saved };
  let active = new Set<string>(), prev = new Set<string>();
  let stick = { x: 0, y: 0 };
  let padOn = false;
  let capture: ((c: string) => void) | null = null;
  let axisCapture: ((i: number) => void) | null = null;
  let axisBase: readonly number[] | null = null;
  let cam = defaultCamera();
  // regra: o mouse acumula entre polls (acc) e é consumido no poll (mouse); o look() lê só o snapshot do último poll
  let acc = { x: 0, y: 0 }, mouse = { x: 0, y: 0 };
  let axes: readonly number[] = [];

  target.addEventListener('keydown', e => {
    if (capture) { const c = capture; capture = null; c(e.code); return; }
    held.add(e.code); tapped.add(e.code);
  });
  target.addEventListener('keyup', e => { held.delete(e.code); });
  target.addEventListener('mousemove', e => {
    if (!isLocked()) return;
    acc.x += e.movementX || 0; acc.y += e.movementY || 0;
  });
  target.addEventListener('blur', () => held.clear());

  const codesFor = (a: Action): string[] => {
    const o = overrides[a];
    const d = DEFAULT_BINDINGS[a];
    if (!o) return d;
    return [...d.filter(c => isPad(c) !== isPad(o)), o];
  };

  function readPad(): Gamepad | null {
    let pads: (Gamepad | null)[] = [];
    try { pads = getPads() ?? []; } catch { pads = []; }
    return pads.find(p => p && p.connected) ?? null;
  }

  return {
    poll() {
      prev = active;
      active = new Set([...held, ...tapped]);
      tapped.clear();
      const p = readPad();
      padOn = !!p;
      stick = { x: 0, y: 0 };
      mouse = acc; acc = { x: 0, y: 0 };
      axes = p ? [...p.axes] : [];
      if (axisCapture && p) {
        // sem controle ao chamar captureAxis: a base é o primeiro poll com controle
        if (!axisBase) axisBase = axes;
        const base = axisBase;
        const i = axes.findIndex((v, j) => Math.abs(v - (base[j] ?? 0)) > 0.6);
        if (i >= 0) { const c = axisCapture; axisCapture = null; axisBase = null; c(i); }
      }
      if (p) {
        p.buttons.forEach((b, i) => { if (b.pressed) active.add(`pad:b${i}`); });
        p.axes.forEach((v, i) => { if (v > 0.5) active.add(`pad:a${i}+`); else if (v < -0.5) active.add(`pad:a${i}-`); });
        const x = p.axes[0] ?? 0, y = p.axes[1] ?? 0;
        if (Math.hypot(x, y) > DEADZONE) stick = { x, y };
        if (capture) {
          const b = p.buttons.findIndex((bt, i) => bt.pressed && !prev.has(`pad:b${i}`));
          if (b >= 0) { const c = capture; capture = null; c(`pad:b${b}`); }
        }
      }
    },
    move() {
      let mx = stick.x, mz = stick.y;
      if (mx === 0 && mz === 0) {
        const on = (a: Action) => codesFor(a).some(c => active.has(c));
        mx = (on('right') ? 1 : 0) - (on('left') ? 1 : 0);
        mz = (on('down') ? 1 : 0) - (on('up') ? 1 : 0);
      }
      const l = Math.hypot(mx, mz);
      return l > 1 ? { mx: mx / l, mz: mz / l } : { mx, mz };
    },
    pressed(a) { const cs = codesFor(a); return cs.some(c => active.has(c)) && !cs.some(c => prev.has(c)); },
    held(a) { return codesFor(a).some(c => active.has(c)); },
    rebind(a, code) { overrides = { ...overrides, [a]: code }; },
    resetBindings() { overrides = {}; },
    bindings() { return { ...overrides }; },
    codesFor,
    captureNext() { return new Promise<string>(res => { capture = res; }); },
    padConnected() { return padOn; },
    look(dt) {
      const dz = (v: number) => (Math.abs(v) > T.CAMERA.PAD_DEADZONE ? v : 0);
      const ps = T.CAMERA.PAD_SENS * cam.padSens * dt;
      const ms = T.CAMERA.MOUSE_SENS * cam.mouseSens;
      const dx = mouse.x * ms + dz(axes[cam.padAxisX] ?? 0) * ps;
      const dy = mouse.y * ms + dz(axes[cam.padAxisY] ?? 0) * ps;
      return { dx, dy: cam.invertY ? -dy : dy };
    },
    setCamera(s) { cam = { ...s }; },
    captureAxis() {
      const p = readPad();
      axisBase = p ? [...p.axes] : null;
      return new Promise<number>(res => { axisCapture = res; });
    },
  };
}
