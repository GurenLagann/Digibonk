// @vitest-environment happy-dom
import type { Input } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';
import { MOVES } from '../../src/data/moves';
import { createRun, type RunState } from '../../src/sim/run';
import { moveCooldown, outgoingDamage } from '../../src/sim/stats';
import { showLevelUp } from '../../src/ui/levelup';
import { activeModal } from '../../src/ui/modal';
import { SLASH_MS } from '../../src/ui/tamerCards';

const fakeInput = (pressed: string[]): Input => ({ pressed: (a: string) => pressed.includes(a) } as unknown as Input);
const fmt = (n: number, d = 1) => String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ',');

function levelUpRun(): RunState {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.prog.level = 5; r.prog.pendingLevelUps = 1;
  r.prog.slots[0] = { moveId: 'baby_flame', level: 2, fromCard: false };
  r.offers = [{ kind: 'learn', moveId: 'spitfire_blast' }, { kind: 'upgrade', slot: 0 }, { kind: 'card', cardId: 'card_hyper_speed' }];
  return r;
}

beforeEach(() => { vi.useFakeTimers(); activeModal()?.close(); });
afterEach(() => { vi.useRealTimers(); });

test('level up shows one Tamers card per offer, coloured by kind', () => {
  const r = levelUpRun();
  const root = document.createElement('div');
  showLevelUp(root, r);
  expect(root.textContent).toContain('Level up! Escolha uma carta');
  const cards = [...root.querySelectorAll('.tc')];
  expect(cards).toHaveLength(3);
  expect(cards[0].classList.contains('learn')).toBe(true);
  expect(cards[1].classList.contains('upgrade')).toBe(true);
  expect(cards[2].classList.contains('card')).toBe(true);
  const learn = MOVES.spitfire_blast;
  expect(cards[0].textContent).toContain(learn.name);
  expect(cards[0].textContent).toContain(learn.description);
  // melhorar: nível e dano antes → depois (fórmula do jogo: × perLevel.damage por nível)
  const slot = r.prog.slots[0]!;
  const before = outgoingDamage(r.prog, slot), after = outgoingDamage(r.prog, { ...slot, level: 3 });
  expect(after).toBeCloseTo(before * MOVES.baby_flame.perLevel.damage);
  expect(cards[1].textContent).toContain('Nv 2 → 3');
  expect(cards[1].textContent).toContain(`Dano ${fmt(before)} → ${fmt(after)}`);
  expect(cards[1].textContent).toContain(`Recarga ${fmt(moveCooldown(r.prog, slot), 2)} → ${fmt(moveCooldown(r.prog, { ...slot, level: 3 }), 2)} s`);
  expect(cards[2].textContent).toContain('Hyper Speed');
  // as teclas 1..3 no rodapé
  expect(cards.map(c => c.querySelector('.b2-key')?.textContent)).toEqual(['1', '2', '3']);
});

test('a stat offer uses the yellow stat card', () => {
  const r = levelUpRun();
  r.offers = [{ kind: 'stat', stat: 'atk', amount: 2 }];
  const root = document.createElement('div');
  showLevelUp(root, r);
  const card = root.querySelector('.tc')!;
  expect(card.classList.contains('stat')).toBe(true);
  expect(card.textContent).toContain('Ataque');
});

test('picking plays the Card Slash and applies only the first choice after SLASH_MS', () => {
  const r = levelUpRun();
  const root = document.createElement('div');
  const m = showLevelUp(root, r);
  m.handle(fakeInput(['opt2']));
  m.handle(fakeInput(['opt1'])); // ignorada durante a animação
  m.handle(fakeInput(['confirm']));
  expect(r.prog.slots[0]!.level).toBe(2);
  expect(r.offers).not.toBeNull();
  expect(root.querySelector('.tc-slash')).not.toBeNull();
  expect(root.textContent).toContain('Card Slash!');
  expect(m.closed).toBe(false);
  vi.advanceTimersByTime(SLASH_MS);
  expect(r.prog.slots[0]!.level).toBe(3);
  expect(r.prog.slots[1]).toBeNull(); // o golpe da carta 1 não foi aprendido
  expect(m.closed).toBe(true);
  expect(root.querySelector('.tc')).toBeNull();
});

test('clicking a card picks it too', () => {
  const r = levelUpRun();
  const root = document.createElement('div');
  showLevelUp(root, r);
  (root.querySelectorAll('.tc')[0] as HTMLElement).click();
  vi.advanceTimersByTime(SLASH_MS);
  expect(r.prog.slots[1]?.moveId).toBe('spitfire_blast');
});
