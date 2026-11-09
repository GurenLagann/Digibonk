// @vitest-environment happy-dom
import type { Input } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';
import { FORMS } from '../../src/data/forms';
import { createRun, type RunState } from '../../src/sim/run';
import { effectiveStats } from '../../src/sim/stats';
import { canEvolve, showBlindEvolve, showEvolve } from '../../src/ui/evolve';
import { activeModal } from '../../src/ui/modal';
import { discoverAll } from '../helpers';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);

function agumonRun(): RunState {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: discoverAll(defaultSave()), storage: null });
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
    const rnd = k === 'hp' ? Math.ceil : Math.round; // HP como no HUD
    expect(rows[i]).toContain(`${rnd(before[k])} → ${rnd(after[k])}`);
  });
  ['Vida', 'Atq', 'Def', 'Vel'].forEach((lbl, i) => expect(rows[i].startsWith(lbl)).toBe(true));
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
  const r = createRun({ partnerId: 'veemon', seed: 1, save: discoverAll(defaultSave()), storage: null });
  r.prog.level = 9; r.prog.bonus.atk = 6; r.prog.bonus.def = 6; r.prog.bonus.spd = 6;
  const root = document.createElement('div');
  const m = showEvolve(root, r, () => {});
  const name = () => root.querySelector('.evo-card')!.textContent ?? '';
  expect(name()).toContain(FORMS.exveemon.name);
  m.handle(press('right'));
  expect(name()).toContain(FORMS.veedramon.name);
  expect(name()).not.toContain(FORMS.exveemon.name);
  m.handle(press('right')); m.handle(press('right'));
  expect(name()).toContain(FORMS.exveemon.name); // dá a volta (passando pela Maturidade)
  m.handle(press('left')); m.handle(press('left'));
  expect(name()).toContain(FORMS.veedramon.name);
  m.handle(press('confirm'));
  expect(r.prog.formId).toBe('veedramon');
});

test('opt1/opt2/opt3 escolhem o caminho e evoluem na hora; opção inexistente é ignorada; abas mostram 1/2/3', () => {
  const mk = () => {
    const r = createRun({ partnerId: 'veemon', seed: 1, save: discoverAll(defaultSave()), storage: null });
    r.prog.level = 9; r.prog.bonus.atk = 6; r.prog.bonus.def = 6; r.prog.bonus.spd = 6;
    return r;
  };
  const r = mk(); const root = document.createElement('div');
  const m = showEvolve(root, r, () => {});
  expect([...root.querySelectorAll('.evo-tab .b2-key')].map(e => e.textContent)).toEqual(['1', '2', '3']); // 3 = Maturidade
  m.handle(press('opt2'));
  expect(r.prog.formId).toBe('veedramon'); expect(m.closed).toBe(true);
  activeModal()?.close();
  const r3 = mk(); const m3 = showEvolve(document.createElement('div'), r3, () => {});
  m3.handle(press('opt1')); expect(r3.prog.formId).toBe('exveemon');
});

test('save vazio: Greymon é secreto, a tela não oferece nada', () => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.prog.level = 9; r.prog.bonus.atk = 6;
  expect(canEvolve(r)).toBe(true); // só a Maturidade
  const root = document.createElement('div');
  showEvolve(root, r, () => {});
  expect(root.textContent).not.toContain('Greymon');
  expect(root.querySelectorAll('.evo-card')).toHaveLength(1);
  expect(root.querySelector('.evo-mature')).not.toBeNull();
});

test('escolha às cegas: só cartas "???", não cancela, opt2 evolui para a segunda', () => {
  const r = createRun({ partnerId: 'veemon', seed: 1, save: defaultSave(), storage: null });
  r.prog.level = 9; r.prog.bonus.atk = 6; r.prog.bonus.def = 6; r.prog.bonus.spd = 6;
  r.blindChoice = ['exveemon', 'veedramon'];
  const root = document.createElement('div');
  const done: string[] = [];
  const m = showBlindEvolve(root, r, id => done.push(id));
  const txt = root.textContent ?? '';
  expect(txt).not.toContain('ExVeemon'); expect(txt).not.toContain('Veedramon');
  expect(root.querySelector('canvas')).toBeNull();
  expect(root.querySelectorAll('.evo-mystery')).toHaveLength(2);
  m.handle(press('cancel')); m.handle(press('pause'));
  expect(m.closed).toBe(false);
  m.handle(press('opt2'));
  expect(r.prog.formId).toBe('veedramon'); expect(done).toEqual(['veedramon']); expect(m.closed).toBe(true);
});

test('escolha às cegas: setas e Enter', () => {
  const r = createRun({ partnerId: 'veemon', seed: 1, save: defaultSave(), storage: null });
  r.prog.level = 9; r.prog.bonus.atk = 6; r.prog.bonus.def = 6; r.prog.bonus.spd = 6;
  r.blindChoice = ['exveemon', 'veedramon'];
  const m = showBlindEvolve(document.createElement('div'), r, () => {});
  m.handle(press('right')); m.handle(press('confirm'));
  expect(r.prog.formId).toBe('veedramon');
});

test('Maturidade: última opção, mostra o bônus e trava a forma ao confirmar', () => {
  const r = agumonRun(); const root = document.createElement('div');
  const done: (string | null)[] = []; const matured: number[] = [];
  const m = showEvolve(root, r, id => done.push(id), () => matured.push(1));
  const tabs = [...root.querySelectorAll('.evo-tab')].map(t => t.textContent);
  expect(tabs[1]).toContain('Ficar como Agumon');
  m.handle(press('right'));
  const card = root.querySelector('.evo-card')!;
  expect(card.textContent).toContain('Maturidade');
  expect(root.querySelector('.evo-go')!.textContent).toContain('Amadurecer!');
  expect(card.textContent).toContain('+12%');
  m.handle(press('confirm'));
  expect(r.prog.matured).toBe(true); expect(r.prog.formId).toBe('agumon');
  expect(matured).toEqual([1]); expect(done).toEqual([]);
  expect(canEvolve(r)).toBe(false);
});

test('forma já madura não oferece a Maturidade de novo', () => {
  const r = agumonRun(); r.prog.matured = true;
  const edge = { to: 'greymon', req: { minLevel: 1, requiresMaturity: true } };
  FORMS.agumon.evolutions.push(edge);
  try {
    const root = document.createElement('div'); showEvolve(root, r, () => {});
    expect(root.textContent).not.toContain('Ficar como');
  } finally { FORMS.agumon.evolutions = FORMS.agumon.evolutions.filter(e => e !== edge); }
});

test('Veemon no Nv 5 sem evolução normal: a tela abre só com a Maturidade', () => {
  const r = createRun({ partnerId: 'veemon', seed: 1, save: discoverAll(defaultSave()), storage: null });
  r.prog.level = 5;
  expect(canEvolve(r)).toBe(true);
  const root = document.createElement('div'); const m = showEvolve(root, r, () => {});
  expect(root.querySelector('.evo-mature')).not.toBeNull();
  m.handle(press('confirm'));
  expect(r.prog.matured).toBe(true);
});
