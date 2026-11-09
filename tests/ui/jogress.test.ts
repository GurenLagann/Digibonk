// @vitest-environment happy-dom
import type { Input } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';
import { MOVES } from '../../src/data/moves';
import { createRun } from '../../src/sim/run';
import { jogressPairs } from '../../src/sim/jogress';
import { activeModal } from '../../src/ui/modal';
import { showJogressChoice } from '../../src/ui/jogress';
import { SLASH_MS } from '../../src/ui/tamerCards';
import { maxedProg } from '../helpers';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);
beforeEach(() => { vi.useFakeTimers(); activeModal()?.close(); });
afterEach(() => { vi.useRealTimers(); });

const mk = () => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.prog.slots = maxedProg('agumon').slots; r.jogressOffer = jogressPairs(r.prog);
  return r;
};

test('uma carta por par, com os dois nomes; escolher faz o Jogress e avisa', () => {
  const r = mk(); const root = document.createElement('div'); const done: string[] = [];
  const m = showJogressChoice(root, r, t => done.push(t));
  expect(root.textContent).toContain('Jogress');
  expect(root.querySelectorAll('.tc')).toHaveLength(r.jogressOffer!.length);
  const [a, b] = r.jogressOffer![0];
  const na = MOVES[r.prog.slots[a]!.moveId].name, nb = MOVES[r.prog.slots[b]!.moveId].name;
  expect(root.querySelector('.tc')!.textContent).toContain(`${na} × ${nb}`);
  m.handle(press('opt1')); vi.advanceTimersByTime(SLASH_MS + 10);
  expect(r.prog.slots[a]!.jogress).toBeTruthy(); expect(r.jogressUsed).toBe(true);
  expect(done).toEqual([`${na} × ${nb}`]);
});
test('Esc fecha sem fazer', () => {
  const r = mk(); const m = showJogressChoice(document.createElement('div'), r, () => {});
  m.handle(press('cancel'));
  expect(r.jogressOffer).toBeNull(); expect(r.jogressUsed).toBe(false);
});
