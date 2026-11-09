import { RELICS } from '../../src/data/relics';
import { relicEffects, RELIC_SLOTS, addRelic } from '../../src/sim/relics';
import { effectiveStats } from '../../src/sim/stats';
import { newPlayerProg } from '../../src/sim/progression';

const P = () => newPlayerProg('agumon');

test('sem relíquias, nada', () => {
  expect(relicEffects(P())).toEqual({ regen: 0, pickup: 0, xp: 0, elite: 0, revive: 0, digidata: 0 });
});
test('efeitos somam por tipo', () => {
  const p = P(); p.relics = ['relic_tag_courage', 'relic_crest_friend', 'relic_blue_card'];
  expect(relicEffects(p)).toMatchObject({ regen: 5, elite: 25 });
});
test('status em % e multiplicadores entram em effectiveStats', () => {
  const p = P(); const b = effectiveStats(p);
  p.relics = ['relic_tag_courage', 'relic_crest_reliance', 'relic_crest_knowledge', 'relic_blue_card'];
  const a = effectiveStats(p);
  expect(a.atk).toBeCloseTo(b.atk * (1 + (RELICS.relic_tag_courage.statPct + RELICS.relic_blue_card.statPct) / 100));
  expect(a.pickupMul).toBeCloseTo(b.pickupMul + 1.5 / 1.5);
  expect(a.xpMul).toBeCloseTo(b.xpMul + 0.15);
  expect(a.eliteMul).toBeCloseTo(1.25);
  expect(a.regen).toBe(2);
});
test('no máximo 3 relíquias, sem repetir', () => {
  const p = P();
  expect(addRelic(p, 'relic_tag_courage')).toBe(true);
  expect(addRelic(p, 'relic_tag_courage')).toBe(false);
  addRelic(p, 'relic_blue_card'); addRelic(p, 'relic_digivice');
  expect(RELIC_SLOTS).toBe(3);
  expect(addRelic(p, 'relic_black_gear')).toBe(false);
  expect(p.relics).toHaveLength(3);
});
