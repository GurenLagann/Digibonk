// @vitest-environment happy-dom
import { defaultSave } from '../../src/core/save';
import { BOSSES } from '../../src/data/enemies';
import { CARDS } from '../../src/data/cards';
import { FORMS } from '../../src/data/forms';
import { MOVES } from '../../src/data/moves';
import { T } from '../../src/data/tuning';
import { createRun, type RunState } from '../../src/sim/run';
import { evoMissingText, mountHud } from '../../src/ui/hud';
import { fakeStorage } from '../helpers';

function setup(partnerId = 'agumon') {
  const run = createRun({ partnerId, seed: 1, save: defaultSave(), storage: fakeStorage({}) });
  const root = document.createElement('div');
  const hud = mountHud(root);
  hud.update(run);
  return { run, root, hud, q: (s: string) => root.querySelector(s) as HTMLElement };
}

function missionText(run: RunState) {
  const ph = run.phase, m = ph.mission;
  if (ph.bossActive) return `Derrote ${BOSSES.find(b => b.phase === ph.phase)!.name}!`;
  if (ph.bossUnlocked) return 'Chefe liberado — vá ao altar';
  if (m.kind === 'collect') return `Fragmentos de dados ${m.progress}/${m.goal}`;
  if (m.kind === 'activate') return `Ative os pontos ${m.progress}/${m.goal} (fique dentro do círculo)`;
  return ph.minibossSpawned ? 'Derrote o guardião!' : `Um guardião vai surgir em ${Math.max(0, Math.ceil(60 - ph.t))}s`;
}

test('partner card: name, level, attribute/element chips, life bar', () => {
  const { q } = setup();
  const card = q('.hud-partner');
  expect(card.querySelector('.hud-name')!.textContent).toBe('Agumon');
  expect(card.querySelector('.hud-lv')!.textContent).toBe('Nv 1');
  expect(card.querySelector('.b2-chip.attr[data-id="vaccine"]')).not.toBeNull();
  expect(card.querySelector('.b2-chip.elem[data-id="fire"]')).not.toBeNull();
  expect((card.querySelector('.hud-hp > i') as HTMLElement).style.width).toBe('100%');
  expect(card.querySelector('canvas.b2-portrait')).not.toBeNull();
});

test('top centre: phase label, mode class on the bar, timer and the same mission texts', () => {
  const { q, run, hud } = setup();
  expect(q('.hud-top').textContent).toContain(`FASE 1/${T.PHASES} · TEMPO DA FASE`);
  expect(q('.hud-pct').textContent).toBe('0%');
  expect(q('.hud-track').classList.contains('normal')).toBe(true);
  expect(q('.hud-timer').textContent).toBe('10:00');
  expect(q('.hud-mission').textContent).toBe(missionText(run));

  run.phase.t = 545; hud.update(run);
  expect(q('.hud-track').classList.contains('warning')).toBe(true);
  expect(q('.hud-track').classList.contains('normal')).toBe(false);
  expect(q('.hud-timer').textContent).toBe('00:55');

  run.phase.t = 700; run.phase.overtime = true; hud.update(run);
  expect(q('.hud-track').classList.contains('overtime')).toBe(true);
  expect(q('.hud-timer').textContent).toBe('+01:40');
  expect(q('.hud-fill').style.width).toBe('100%');
  expect(q('.hud-pct').textContent).toBe('100%');

  run.phase.bossUnlocked = true; hud.update(run);
  expect(q('.hud-mission').textContent).toBe('Chefe liberado — vá ao altar');
});

test('bottom panel: 4 moves (signature marked, full name under the slot) and 3 cards', () => {
  const { q, run, hud } = setup();
  const bottom = q('.hud-bottom');
  const moves = bottom.querySelectorAll('.hud-move');
  expect(moves.length).toBe(4);
  expect(moves[0].classList.contains('sig')).toBe(true);
  expect(moves[0].querySelector('.hud-box b')!.textContent).toBe('1');
  expect(moves[0].querySelector('.hud-sname')!.textContent).toBe(MOVES[FORMS.agumon.signature].name);
  expect(moves[1].classList.contains('empty')).toBe(true);
  expect(moves[1].querySelector('.hud-sname')!.textContent).toBe('');
  const cards = bottom.querySelectorAll('.hud-card');
  expect(cards.length).toBe(3);
  const cardId = Object.keys(CARDS)[0];
  run.prog.passives[0] = cardId; run.prog.cardLevels[cardId] = 2; hud.update(run);
  expect(cards[0].querySelector('.hud-sname')!.textContent).toBe(CARDS[cardId].name);
  expect(cards[0].querySelector('.hud-box b')!.textContent).toBe('2');
  expect(cards[0].classList.contains('empty')).toBe(false);
});

test('boss bar sits in the bottom column above the moves panel; toasts host sits under the right panel', () => {
  const { q, hud } = setup();
  const col = q('.hud-bcol');
  expect([...col.children].map(c => c.className.split(' ')[0])).toEqual(['hud-boss', 'b2-panel']);
  const rcol = q('.hud-rcol');
  expect(rcol.children[0]).toBe(q('.hud-right'));
  expect(rcol.children[1]).toBe(hud.toastHost);
});

test('right panel: kills and next evolution with what is missing', () => {
  const { q, run, hud } = setup();
  run.prog.kills = 1284; hud.update(run);
  const right = q('.hud-right');
  expect(right.querySelector('.hud-kills')!.textContent).toBe('1.284');
  expect(right.textContent).toContain('Greymon');
  expect(right.textContent).toContain('Nv 8 · Atq 14');
  expect(right.classList.contains('ready')).toBe(false);
});

test('evolution available lights the panel up', () => {
  const { q, run, hud } = setup();
  run.prog.level = 8; run.prog.bonus.atk += 50; hud.update(run);
  const right = q('.hud-right');
  expect(right.classList.contains('ready')).toBe(true);
  expect(right.textContent).toContain('Digievoluir [E / Y]');
});

test('final form shows "Forma final"', () => {
  const { q, run, hud } = setup();
  run.prog.formId = 'omnimon'; hud.update(run);
  expect(q('.hud-right').textContent).toContain('Forma final');
  expect(q('.hud-name').textContent).toBe('Omnimon');
});

test('update does not rebuild nodes (same timer element, same portraits)', () => {
  const { q, run, hud } = setup();
  const timer = q('.hud-timer'), port = q('.hud-partner canvas'), evoPort = q('.hud-right canvas');
  run.phase.t = 3; hud.update(run); hud.update(run);
  expect(q('.hud-timer')).toBe(timer);
  expect(q('.hud-partner canvas')).toBe(port);
  expect(q('.hud-right canvas')).toBe(evoPort);
});

test('no floating evolution notice anymore', () => {
  const { root } = setup();
  expect(root.querySelector('.evo')).toBeNull();
});

test('evoMissingText formats every kind', () => {
  expect(evoMissingText([{ kind: 'level', need: 8 }, { kind: 'stat', stat: 'atk', need: 14 }])).toBe('Nv 8 · Atq 14');
  expect(evoMissingText([{ kind: 'stat', stat: 'hp', need: 1 }, { kind: 'stat', stat: 'def', need: 2 }, { kind: 'stat', stat: 'spd', need: 3 }, { kind: 'stat', stat: 'brain', need: 4 }]))
    .toBe('HP 1 · Def 2 · Vel 3 · Int 4');
  expect(evoMissingText([{ kind: 'phase', need: 3 }, { kind: 'kills', need: 500 }])).toBe('Fase 3 · 500 abates');
});
