// @vitest-environment happy-dom
import type { Input } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';
import { FORMS } from '../../src/data/forms';
import { createRun, type RunState } from '../../src/sim/run';
import { effectiveStats } from '../../src/sim/stats';
import { showEvolve } from '../../src/ui/evolve';
import { activeModal } from '../../src/ui/modal';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);

function agumonRun(): RunState {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.prog.level = 9; r.prog.bonus.atk = 6;
  r.prog.slots[0] = { moveId: 'baby_flame', level: 3, fromCard: false };
  return r;
}

beforeEach(() => { activeModal()?.close(); });

test('mostra forma atual, cartão Greymon com selos, status antes → depois e o novo golpe', () => {
  const r = agumonRun();
  const root = document.createElement('div');
  showEvolve(root, r, () => {});
  expect(root.textContent).toContain('Digievolução!');
  expect(root.textContent).toContain('dá para recusar e evoluir depois');
  const cur = root.querySelector('.evo-cur')!;
  expect(cur.textContent).toContain('Agumon');
  expect(cur.textContent).toContain('Child');
  expect(cur.querySelector('canvas')).toBeTruthy();
  const card = root.querySelector('.evo-card')!;
  expect(card.textContent).toContain('Greymon');
  expect(card.textContent).toContain('Adult');
  expect(card.querySelector('canvas')).toBeTruthy();
  expect([...card.querySelectorAll('.b2-chip')].map(c => c.textContent)).toEqual(['Vacina', 'Fogo']);
  const before = effectiveStats(r.prog), after = effectiveStats({ ...r.prog, formId: 'greymon' });
  const rows = [...card.querySelectorAll('.evo-stat')].map(e => e.textContent ?? '');
  expect(rows).toHaveLength(4);
  (['hp', 'atk', 'def', 'spd'] as const).forEach((k, i) => {
    expect(rows[i]).toContain(`${Math.round(before[k])} → ${Math.round(after[k])}`);
  });
  ['HP', 'Atq', 'Def', 'Vel'].forEach((lbl, i) => expect(rows[i].startsWith(lbl)).toBe(true));
  expect(card.textContent).toContain('Mega Flame');
  expect(card.textContent).toContain('substitui Baby Flame mantendo o nível');
  expect(root.textContent).toContain('Agora não');
  expect(root.textContent).toContain('Digievoluir!');
  // a cópia não mexeu na partida
  expect(r.prog.formId).toBe('agumon');
});

test('confirm evolui e chama onDone com a forma nova', () => {
  const r = agumonRun();
  const root = document.createElement('div');
  const done: (string | null)[] = [];
  const m = showEvolve(root, r, id => done.push(id));
  m.handle(press('confirm'));
  expect(r.prog.formId).toBe('greymon');
  expect(done).toEqual(['greymon']);
  expect(m.closed).toBe(true);
  expect(root.querySelector('.evo-screen')).toBeNull();
});

test('cancel (e pause) chamam onDone(null) sem evoluir', () => {
  for (const key of ['cancel', 'pause']) {
    const r = agumonRun();
    const root = document.createElement('div');
    const done: (string | null)[] = [];
    const m = showEvolve(root, r, id => done.push(id));
    m.handle(press(key));
    expect(r.prog.formId).toBe('agumon');
    expect(done).toEqual([null]);
    expect(m.closed).toBe(true);
  }
});

test('com 2 caminhos (Veemon), setas trocam a opção e confirm evolui para a escolhida', () => {
  const r = createRun({ partnerId: 'veemon', seed: 1, save: defaultSave(), storage: null });
  r.prog.level = 9; r.prog.bonus.atk = 6; r.prog.bonus.def = 6; r.prog.bonus.spd = 6;
  const root = document.createElement('div');
  const m = showEvolve(root, r, () => {});
  const name = () => root.querySelector('.evo-card')!.textContent ?? '';
  expect(name()).toContain(FORMS.exveemon.name);
  m.handle(press('right'));
  expect(name()).toContain(FORMS.veedramon.name);
  expect(name()).not.toContain(FORMS.exveemon.name);
  m.handle(press('right'));
  expect(name()).toContain(FORMS.exveemon.name); // dá a volta
  m.handle(press('left'));
  expect(name()).toContain(FORMS.veedramon.name);
  m.handle(press('confirm'));
  expect(r.prog.formId).toBe('veedramon');
});
