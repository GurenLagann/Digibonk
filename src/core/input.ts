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
}

type KeyTarget = { addEventListener(type: string, h: (e: KeyboardEvent) => void): void };
const isPad = (c: string) => c.startsWith('pad:');
const DEADZONE = 0.2;

export function createInput(target: KeyTarget, getPads: () => (Gamepad | null)[], saved: Record<string, string>): Input {
  const held = new Set<string>();
  const tapped = new Set<string>();
  let overrides: Record<string, string> = { ...saved };
  let active = new Set<string>(), prev = new Set<string>();
  let stick = { x: 0, y: 0 };
  let padOn = false;
  let capture: ((c: string) => void) | null = null;

  target.addEventListener('keydown', e => {
    if (capture) { const c = capture; capture = null; c(e.code); return; }
    held.add(e.code); tapped.add(e.code);
  });
  target.addEventListener('keyup', e => { held.delete(e.code); });
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
  };
}
