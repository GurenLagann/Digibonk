import { createRun, stepRun } from '../../src/sim/run';
import { debugEvolve, debugGiveCard, debugGiveItem, debugHeal, debugKillAll, debugLevelUp, debugToggleGod } from '../../src/sim/debug';
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
