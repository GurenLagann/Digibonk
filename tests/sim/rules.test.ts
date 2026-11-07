import { newCombatState, stepCombat, type CombatEvent } from '../../src/sim/combat';
import { EnemyPool } from '../../src/sim/director';
import { SpatialHash } from '../../src/sim/spatial';
import { newPlayerProg } from '../../src/sim/progression';
import { effectiveStats, statAt, typeMultiplier } from '../../src/sim/stats';
import { levelUpOwnedCard } from '../../src/sim/cards';
import { CARD_MAX_LEVEL } from '../../src/data/cards';
import { ENEMIES } from '../../src/data/enemies';
import { createRng } from '../../src/core/rng';
import type { AttributeId, ElementId } from '../../src/data/types';

test('statAt grows 0.5% of the base per level (linear)', () => {
  expect(statAt(5, 0.005, 1)).toBe(5);
  expect(statAt(5, 0.005, 10)).toBeCloseTo(5.225);
});

test('typeMultiplier multiplies attribute and element advantages', () => {
  expect(typeMultiplier('vaccine', 'fire', 'virus', 'plant')).toBeCloseTo(2.25);
  expect(typeMultiplier('virus', 'neutral', 'vaccine', 'fire')).toBeCloseTo(0.75);
  expect(typeMultiplier('free', 'neutral', 'data', 'water')).toBe(1);
});

test('effective stats: level growth + passive card % that grows with the card level', () => {
  const p = newPlayerProg('agumon'); // atk base 10
  expect(effectiveStats(p).atk).toBeCloseTo(10);
  p.level = 11; expect(effectiveStats(p).atk).toBeCloseTo(10.5);
  p.level = 1; p.passives[0] = 'card_greymon_horn'; // atk +15%, +2%/nível
  expect(effectiveStats(p).atk).toBeCloseTo(11.5);
  p.cardLevels.card_greymon_horn = 3;
  expect(effectiveStats(p).atk).toBeCloseTo(11.9);
});

test('picking an owned passive card levels it up to the max, in a single slot', () => {
  const p = newPlayerProg('agumon');
  p.passives[0] = 'card_greymon_horn';
  const results = Array.from({ length: 12 }, () => levelUpOwnedCard(p, 'card_greymon_horn'));
  expect(p.cardLevels.card_greymon_horn).toBe(CARD_MAX_LEVEL);
  expect(results.at(-1)).toBe('maxed');
  expect(p.passives.filter(c => c === 'card_greymon_horn')).toHaveLength(1);
  expect(levelUpOwnedCard(p, 'card_monzaemon_hug')).toBeNull(); // não equipada
});

test('picking an owned slash card levels up its move', () => {
  const p = newPlayerProg('agumon');
  p.slots[1] = { moveId: 'lightning_paw', level: 1, fromCard: true };
  expect(levelUpOwnedCard(p, 'card_lightning_paw')).toBe('leveled');
  expect(p.slots[1]?.level).toBe(2);
});

function spawnTyped(pool: EnemyPool, attribute: AttributeId, element: ElementId, x: number) {
  const e = pool.spawn({ ...ENEMIES[0], attribute, element }, x, 0, { hp: 1, dmg: 1 })!;
  e.hp = e.maxHp = 99999; e.speed = 0; return e;
}
function firstHit(attribute: AttributeId, element: ElementId): number {
  const p = newPlayerProg('agumon'); const c = newCombatState(p); const pool = new EnemyPool(); const hash = new SpatialHash(4);
  spawnTyped(pool, attribute, element, 5);
  for (let i = 0; i < 120; i++) for (const ev of stepCombat(c, p, 0, 0, pool, hash, 1 / 60, createRng(1))) if (ev.type === 'hit') return ev.dmg;
  throw new Error('no hit');
}

test('player attacks use attribute × element advantage against the target', () => {
  // Agumon: Vacina; Baby Flame: Fogo
  const neutral = firstHit('free', 'neutral');
  expect(firstHit('virus', 'plant') / neutral).toBeCloseTo(2.25);
  expect(firstHit('data', 'water') / neutral).toBeCloseTo(0.5625); // Vacina < Dados, Fogo < Água
});

function contactDamage(attribute: AttributeId, element: ElementId): number {
  const p = newPlayerProg('agumon'); p.slots[0] = null; const c = newCombatState(p); const pool = new EnemyPool(); const hash = new SpatialHash(4);
  spawnTyped(pool, attribute, element, 0.2);
  const ev: CombatEvent[] = [];
  for (let i = 0; i < 10; i++) ev.push(...stepCombat(c, p, 0, 0, pool, hash, 1 / 60, createRng(1)));
  const hit = ev.find(e => e.type === 'playerHit'); if (!hit || hit.type !== 'playerHit') throw new Error('no contact'); return hit.dmg;
}

test('enemy contact damage uses the enemy typing against the player (both directions)', () => {
  const neutral = contactDamage('free', 'neutral');
  expect(contactDamage('data', 'water') / neutral).toBeCloseTo(2.25); // Dados > Vacina, Água > Fogo
  expect(contactDamage('virus', 'plant') / neutral).toBeCloseTo(0.5625); // Vírus < Vacina, Planta < Fogo
});
