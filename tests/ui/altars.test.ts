// @vitest-environment happy-dom
import type { Input } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';
import { createRun } from '../../src/sim/run';
import { activeModal } from '../../src/ui/modal';
import { showAltar } from '../../src/ui/altars';
import { SLASH_MS } from '../../src/ui/tamerCards';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);
beforeEach(() => { vi.useFakeTimers(); activeModal()?.close(); });
afterEach(() => { vi.useRealTimers(); });
const mk = () => createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });

test('Etemon: uma carta com o risco e a recompensa; aceitar soma Corrupção', () => {
  const r = mk(); const a = r.altars.find(x => x.kind === 'etemon')!;
  r.altarOffer = { altarId: a.id, kind: 'etemon' };
  const root = document.createElement('div'); const m = showAltar(root, r);
  expect(root.textContent).toContain('Etemon');
  expect(root.textContent).toContain('XP');
  m.handle(press('opt1')); vi.advanceTimersByTime(SLASH_MS + 10);
  expect(r.corruption).toBe(1);
});
test('Datamon: 3 trocas; Esc recusa', () => {
  const r = mk(); const a = r.altars.find(x => x.kind === 'datamon')!;
  r.altarOffer = { altarId: a.id, kind: 'datamon', trades: [{ from: 'def', to: 'atk', lose: 10, gain: 14 }, { from: 'hp', to: 'spd', lose: 10, gain: 12 }, { from: 'spd', to: 'def', lose: 10, gain: 16 }] };
  const root = document.createElement('div'); const m = showAltar(root, r);
  expect(root.querySelectorAll('.tc')).toHaveLength(3);
  expect(root.textContent).toContain('−10% Def → +14% Atq');
  m.handle(press('cancel'));
  expect(r.altarOffer).toBeNull(); expect(r.prog.statShift).toEqual({});
});
test('Desafio: aceitar arma o guardião forte', () => {
  const r = mk(); const a = r.altars.find(x => x.kind === 'challenge')!;
  r.altarOffer = { altarId: a.id, kind: 'challenge' };
  const m = showAltar(document.createElement('div'), r);
  m.handle(press('confirm')); vi.advanceTimersByTime(SLASH_MS + 10);
  expect(r.challengeArmed).toBe(true);
});
