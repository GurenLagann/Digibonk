// @vitest-environment happy-dom
import { createRun } from '../../src/sim/run';
import { defaultSave } from '../../src/core/save';
import { showCardChoice } from '../../src/ui/cardmodal';
import { SLASH_MS } from '../../src/ui/tamerCards';

test('replace-card dialog describes equipped cards at their current level', () => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.prog.passives = ['card_greymon_horn', 'card_monzaemon_hug', 'card_andromon_armor'];
  r.prog.cardLevels.card_greymon_horn = 7; // 15% + 2% × 6 = 27%
  r.pendingCard = 'card_hyper_speed';
  const root = document.createElement('div');
  showCardChoice(root, r);
  expect(root.textContent).toContain('+27% Ataque');
});

import type { Input } from '../../src/core/input';
import { MOVES } from '../../src/data/moves';
import { CARDS } from '../../src/data/cards';
import { activeModal } from '../../src/ui/modal';

const fakeInput = (pressed: string[]): Input => ({ pressed: (a: string) => pressed.includes(a) } as unknown as Input);

describe('Tamers cards', () => {
  beforeEach(() => { vi.useFakeTimers(); activeModal()?.close(); });
  afterEach(() => { vi.useRealTimers(); });

  test('slash card with full move slots shows slots 2–4 with their current move; cancel discards without animation', () => {
    const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
    r.prog.slots = [
      { moveId: 'baby_flame', level: 1, fromCard: false },
      { moveId: 'sharp_claws', level: 2, fromCard: false },
      { moveId: 'spitfire_blast', level: 1, fromCard: false },
      { moveId: 'pepper_breath_rain', level: 3, fromCard: false },
    ];
    r.pendingCard = 'card_diamond_storm';
    const root = document.createElement('div');
    const m = showCardChoice(root, r);
    expect(root.textContent).toContain('Slash: Diamond Storm');
    const cards = [...root.querySelectorAll('.tc')];
    expect(cards).toHaveLength(3);
    expect(cards[0].textContent).toContain(MOVES.sharp_claws.name);
    expect(cards[0].textContent).toContain('Nv 2');
    expect(cards[1].textContent).toContain(MOVES.spitfire_blast.name);
    expect(cards[2].textContent).toContain(MOVES.pepper_breath_rain.name);
    expect(cards[2].textContent).toContain('Nv 3');
    expect(root.querySelector('.tc-extra .b2-key')?.textContent).toBe('Esc');
    m.handle(fakeInput(['cancel']));
    expect(r.pendingCard).toBeNull();
    expect(m.closed).toBe(true);
    expect(root.querySelector('.tc-slash')).toBeNull();
    expect(r.prog.slots[3]!.moveId).toBe('pepper_breath_rain');
  });

  test('slash card: picking a slot replaces it after the Card Slash', () => {
    const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
    r.prog.slots = [
      { moveId: 'baby_flame', level: 1, fromCard: false },
      { moveId: 'sharp_claws', level: 2, fromCard: false },
      { moveId: 'spitfire_blast', level: 1, fromCard: false },
      { moveId: 'pepper_breath_rain', level: 3, fromCard: false },
    ];
    r.pendingCard = 'card_diamond_storm';
    const root = document.createElement('div');
    showCardChoice(root, r);
    activeModal()!.handle(fakeInput(['opt3']));
    expect(r.prog.slots[3]!.moveId).toBe('pepper_breath_rain');
    vi.advanceTimersByTime(SLASH_MS);
    expect(r.prog.slots[3]!.moveId).toBe('diamond_storm');
  });

  test('passive with 3 full slots shows the equipped cards with their level; Esc (pause) discards', () => {
    const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
    r.prog.passives = ['card_greymon_horn', 'card_monzaemon_hug', 'card_andromon_armor'];
    r.prog.cardLevels.card_greymon_horn = 7;
    r.pendingCard = 'card_hyper_speed';
    const root = document.createElement('div');
    const m = showCardChoice(root, r);
    const cards = [...root.querySelectorAll('.tc')];
    expect(cards).toHaveLength(3);
    expect(cards.every(c => c.classList.contains('card'))).toBe(true);
    expect(cards[0].textContent).toContain(CARDS.card_greymon_horn.name);
    expect(cards[0].textContent).toContain('Nv 7');
    expect(cards[1].textContent).toContain(CARDS.card_monzaemon_hug.name);
    expect(cards[2].textContent).toContain(CARDS.card_andromon_armor.name);
    m.handle(fakeInput(['pause']));
    expect(r.pendingCard).toBeNull();
    expect(m.closed).toBe(true);
    expect(r.prog.passives).toEqual(['card_greymon_horn', 'card_monzaemon_hug', 'card_andromon_armor']);
  });
});
