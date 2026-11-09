import { createRun, playerSpeed, stepRun } from '../../src/sim/run';
import { drawPool } from '../../src/sim/discovery';
import { debugForgetAll, debugRevealAll, debugEvolve, debugGiveCard, debugGiveItem, debugHeal, debugKillAll, debugLevelUp, debugToggleDoubleSpeed, debugToggleGod } from '../../src/sim/debug';
import { defaultSave } from '../../src/core/save';
import { FORMS } from '../../src/data/forms';
import { ENEMIES } from '../../src/data/enemies';

const mk = () => createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });

test('debugEvolve jumps to any form ignoring requirements, with full hp', () => {
  const r = mk(); r.combat.hp = 1;
  debugEvolve(r, 'wargreymon');
  expect(r.prog.formId).toBe('wargreymon');
  expect(r.prog.slots[0]?.moveId).toBe(FORMS.wargreymon.signature);
  expect(r.prog.path).toContain('wargreymon');
  expect(r.combat.hp).toBe(r.combat.maxHp);
  expect(r.save.discovered).not.toContain('wargreymon'); // debug não registra descoberta
});

test('debugLevelUp gives a level and opens the level-up choice', () => {
  const r = mk(); const lvl = r.prog.level;
  debugLevelUp(r);
  expect(r.prog.level).toBeGreaterThan(lvl);
  expect(r.offers).not.toBeNull();
});

test('debugGiveCard equips a passive card and reports it', () => {
  const r = mk();
  const ev = debugGiveCard(r, 'card_greymon_horn');
  expect(r.prog.passives).toContain('card_greymon_horn');
  expect(ev).toContainEqual({ type: 'cardFound', cardId: 'card_greymon_horn' });
});

test('debugGiveCard with a slash card asks for the slot', () => {
  const r = mk();
  debugGiveCard(r, 'card_lightning_paw');
  expect(r.pendingCard).toBe('card_lightning_paw');
});

test('debugGiveItem adds the item and reports it', () => {
  const r = mk();
  const ev = debugGiveItem(r, 'fusion_garurumon');
  expect(r.prog.items).toContain('fusion_garurumon');
  expect(ev).toContainEqual({ type: 'itemFound', itemId: 'fusion_garurumon' });
});

test('debugHeal restores hp; debugKillAll clears enemies', () => {
  const r = mk(); r.combat.hp = 1;
  debugHeal(r); expect(r.combat.hp).toBe(r.combat.maxHp);
  r.pool.spawn(ENEMIES[0], 3, 3, { hp: 1, dmg: 1 });
  debugKillAll(r); expect(r.pool.alive().length).toBe(0);
});

test('god mode keeps hp full while on', () => {
  const r = mk();
  expect(debugToggleGod(r)).toBe(true);
  r.combat.hp = 1; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.combat.hp).toBe(r.combat.maxHp);
  expect(debugToggleGod(r)).toBe(false);
  r.combat.hp = 1; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.combat.hp).toBeLessThan(r.combat.maxHp);
});

test('debugToggleDoubleSpeed doubles the base speed and restores it', () => {
  const r = mk();
  const before = playerSpeed(r.prog);
  expect(debugToggleDoubleSpeed(r)).toBe(true);
  expect(playerSpeed(r.prog)).toBeGreaterThanOrEqual(2 * r.baseSpeed);
  expect(debugToggleDoubleSpeed(r)).toBe(false);
  expect(playerSpeed(r.prog)).toBeCloseTo(before);
});

test('getting an owned card again levels it up and reports it (no slot choice)', () => {
  const r = mk();
  debugGiveCard(r, 'card_greymon_horn');
  const ev = debugGiveCard(r, 'card_greymon_horn');
  expect(r.prog.cardLevels.card_greymon_horn).toBe(2);
  expect(ev).toContainEqual({ type: 'cardLeveled', cardId: 'card_greymon_horn', level: 2 });
  expect(r.pendingCard).toBeNull();
  r.prog.slots[1] = { moveId: 'lightning_paw', level: 1, fromCard: true };
  debugGiveCard(r, 'card_lightning_paw');
  expect(r.prog.slots[1]?.level).toBe(2);
  expect(r.pendingCard).toBeNull();
});

test('debugEvolve marca a aresta da forma atual como descoberta', () => {
  const r = mk(); debugEvolve(r, 'greymon');
  expect(r.save.discoveredEvos).toContain('agumon->greymon');
});
test('debugRevealAll esvazia o sorteio e debugForgetAll zera tudo', () => {
  const s = defaultSave();
  debugRevealAll(s, null); expect(drawPool(s)).toEqual([]);
  s.revealedReqs['x->y'] = ['level'];
  debugForgetAll(s, null); expect(s.discoveredEvos).toEqual([]); expect(s.revealedReqs).toEqual({});
});
