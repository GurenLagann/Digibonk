// @vitest-environment happy-dom
import type { Input } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';
import { CARDS } from '../../src/data/cards';
import { FORMS } from '../../src/data/forms';
import { MOVES } from '../../src/data/moves';
import { abandonRun, createRun, type RunState } from '../../src/sim/run';
import { activeModal } from '../../src/ui/modal';
import { showResults } from '../../src/ui/results';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);

function endedRun(): RunState {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.prog.path = ['agumon', 'greymon', 'metalgreymon'];
  r.prog.pathLevels = [1, 8, 22];
  r.prog.formId = 'metalgreymon';
  r.prog.level = 27; r.prog.kills = 3912;
  r.prog.slots[0] = { moveId: 'baby_flame', level: 4, fromCard: false };
  r.prog.slots[1] = { moveId: 'spitfire_blast', level: 3, fromCard: false };
  r.prog.passives[0] = 'card_hyper_speed';
  r.prog.cardLevels.card_hyper_speed = 4;
  r.stats.bosses = 2; r.stats.guardians = 5;
  r.phase.phase = 3; r.time = 21 * 60 + 14;
  abandonRun(r);
  return r;
}

function show(r: RunState) {
  const root = document.createElement('div');
  const calls: string[] = [];
  const m = showResults(root, r, () => calls.push('again'), () => calls.push('menu'));
  return { root, m, calls, text: () => root.textContent ?? '' };
}

beforeEach(() => { activeModal()?.close(); });

test('derrota: título, fase e tempo; caminho em retratos com o nível de cada evolução', () => {
  const { root, text } = show(endedRun());
  const title = root.querySelector('.res-title')!;
  expect(title.textContent).toBe('Derrota');
  expect(title.classList.contains('lose')).toBe(true);
  expect(text()).toContain('Fase 3 de 5');
  expect(text()).toContain('21:14');
  const steps = [...root.querySelectorAll('.res-step')];
  expect(steps).toHaveLength(3);
  expect(steps.every(s => s.querySelector('canvas'))).toBe(true);
  expect(steps[0].textContent).toContain('Agumon');
  expect(steps[0].textContent).not.toContain('Nv');
  expect(steps[1].textContent).toContain(FORMS.greymon.name);
  expect(steps[1].textContent).toContain('Nv 8');
  expect(steps[2].textContent).toContain(FORMS.metalgreymon.name);
  expect(steps[2].textContent).toContain('Nv 22');
});

test('golpes e cartas finais com nível; números em destaque', () => {
  const { root, text } = show(endedRun());
  const kit = root.querySelector('.res-kit')!.textContent ?? '';
  expect(kit).toContain(`${MOVES.baby_flame.name} Nv 4`);
  expect(kit).toContain(`${MOVES.spitfire_blast.name} Nv 3`);
  expect(kit).toContain(`${CARDS.card_hyper_speed.name} Nv 4`);
  const nums = Object.fromEntries([...root.querySelectorAll('.res-num')].map(n => [n.querySelector('.b2-label')!.textContent, n.querySelector('b')!.textContent]));
  expect(nums['Abates']).toBe('3.912');
  expect(nums['Nível']).toBe('27');
  expect(nums['Chefes']).toBe('2');
  expect(nums['Guardiões']).toBe('5');
  expect(nums['Melhor fase']).toBe('3');
  expect(text()).toContain('Novo recorde!'); // primeira partida do parceiro passou do recorde 0
  expect(text()).not.toContain('Novo parceiro liberado!');
  expect(text()).toContain('Jogar de novo');
  expect(text()).toContain('Menu');
  // Ruling 2: o selo do botão Menu mostra Esc (2/cancel/pause continuam valendo)
  expect(root.querySelector('.res-menu .b2-key')!.textContent).toBe('Esc');
});

test('nível ausente em pathLevels não mostra rótulo Nv', () => {
  const r = endedRun();
  r.prog.pathLevels = [1, 8];
  const { root } = show(r);
  const steps = [...root.querySelectorAll('.res-step')];
  expect(steps[1].textContent).toContain('Nv 8');
  expect(steps[2].textContent).not.toContain('Nv');
});

test('sem recorde novo não mostra "Novo recorde!"; melhor fase vem do recorde do parceiro', () => {
  const r = endedRun();
  r.newRecord = false; r.save.partnerRecords.agumon.bestPhase = 4;
  const { root, text } = show(r);
  expect(text()).not.toContain('Novo recorde!');
  const best = [...root.querySelectorAll('.res-num')].find(n => n.textContent!.includes('Melhor fase'))!;
  expect(best.querySelector('b')!.textContent).toBe('4');
});

test('vitória e parceiro liberado (nome da forma Child, com retrato)', () => {
  const r = endedRun();
  r.ended = 'victory'; r.unlockedThisRun = ['gatomon'];
  const { root, text } = show(r);
  const title = root.querySelector('.res-title')!;
  expect(title.textContent).toBe('Vitória!');
  expect(title.classList.contains('win')).toBe(true);
  const card = root.querySelector('.res-unlock')!;
  expect(card.textContent).toContain('Novo parceiro liberado!');
  expect(card.textContent).toContain('Salamon');
  expect(card.querySelector('canvas')).toBeTruthy();
  expect(text()).toContain('Novo parceiro liberado!');
});

test('opt1/confirm jogam de novo; opt2/cancel/pause voltam ao menu; fecha a tela', () => {
  for (const [key, want] of [['opt1', 'again'], ['confirm', 'again'], ['opt2', 'menu'], ['cancel', 'menu'], ['pause', 'menu']]) {
    const { m, calls, root } = show(endedRun());
    expect(activeModal()).toBe(m);
    m.handle(press(key));
    expect(calls).toEqual([want]);
    expect(m.closed).toBe(true);
    expect(root.querySelector('.res-screen')).toBeNull();
    m.handle(press(key));
    expect(calls).toEqual([want]);
  }
});

test('botões clicáveis', () => {
  const { root, calls } = show(endedRun());
  const btns = [...root.querySelectorAll('button')];
  btns.find(b => b.textContent!.includes('Jogar de novo'))!.click();
  expect(calls).toEqual(['again']);
});

test('Digi Data: uma linha por dado, só com a forma de origem', () => {
  const r = endedRun();
  r.digiDataThisRun = [{ edge: 'greymon->skullgreymon', key: 'stat:atk' }];
  const root = document.createElement('div');
  showResults(root, r, () => {}, () => {});
  const box = root.querySelector('.res-data')!;
  expect(box.textContent).toContain('Digi Data');
  expect(box.textContent).toContain('Caminho Greymon ② — Atq 38');
  expect(root.textContent).not.toContain('SkullGreymon');
});
test('sem Digi Data, sem seção', () => {
  const root = document.createElement('div');
  showResults(root, endedRun(), () => {}, () => {});
  expect(root.querySelector('.res-data')).toBeNull();
});
test('resultado marca a Maturidade na última forma do caminho', () => {
  const r = endedRun(); r.prog.matured = true;
  const root = document.createElement('div');
  showResults(root, r, () => {}, () => {});
  expect(root.querySelector('.res-step.last')!.textContent).toContain('Maturidade');
});
test('resultado lista as relíquias da partida', () => {
  const r = endedRun(); r.prog.relics = ['relic_blue_card', 'relic_digivice'];
  const root = document.createElement('div');
  showResults(root, r, () => {}, () => {});
  const box = root.querySelector('.res-relics')!;
  expect(box.textContent).toContain('Relíquias');
  expect(box.textContent).toContain('Card Azul Rachado');
});
test('resultado mostra o dano por golpe, do maior para o menor', () => {
  const r = endedRun();
  r.damage.total = { baby_flame: 300, spitfire_blast: 900 };
  const root = document.createElement('div');
  showResults(root, r, () => {}, () => {});
  const rows = [...root.querySelectorAll('.dmg-row')].map(e => e.textContent ?? '');
  expect(rows[0]).toContain('Spitfire Blast'); expect(rows[0]).toContain('75%');
  expect(rows[1]).toContain('Baby Flame');
});
