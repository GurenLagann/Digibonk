import { effectiveStats, incomingDamage, outgoingDamage, moveCooldown } from '../../src/sim/stats';
import { newPlayerProg } from '../../src/sim/progression';

test('defense reduces damage', () => expect(incomingDamage(100, 20)).toBe(50));
test('stage multiplies damage', () => {
  const a = newPlayerProg('agumon'), g = newPlayerProg('greymon');
  g.bonus.atk = effectiveStats(a).atk - effectiveStats(g).atk;
  expect(outgoingDamage(g, { moveId: 'baby_flame', level: 1, fromCard: false }) / outgoingDamage(a, a.slots[0]!)).toBeCloseTo(1.6);
});
test('level grows stats', () => {
  const p = newPlayerProg('agumon'); const s1 = effectiveStats(p).hp; p.level = 11;
  expect(effectiveStats(p).hp).toBe(s1 + 60);
});
test('passive card applies', () => {
  const p = newPlayerProg('agumon'); const base = effectiveStats(p);
  p.passives[0] = 'card_gatomon_claws'; p.passives[1] = 'card_birdramon_wings';
  const s = effectiveStats(p); expect(s.dmgMul).toBeCloseTo(base.dmgMul + 0.15); expect(s.spd).toBeCloseTo(base.spd + 6);
});
test('brain shortens cooldown', () => {
  const p = newPlayerProg('agumon'); const c1 = moveCooldown(p, p.slots[0]!); p.bonus.brain = 50;
  expect(moveCooldown(p, p.slots[0]!)).toBeLessThan(c1);
});
