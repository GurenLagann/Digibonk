import { offerPassive, replacePassive, slashIntoSlot, gainItem } from '../../src/sim/cards';
import { newPlayerProg } from '../../src/sim/progression';
import { effectiveStats } from '../../src/sim/stats';

const three = ['card_gatomon_claws', 'card_birdramon_wings', 'card_hyper_speed'];

test('passives fill free slots', () => {
  const p = newPlayerProg('agumon'); expect(offerPassive(p, three[0])).toEqual({ status: 'equipped', slot: 0 });
});
test('4th passive reports full', () => {
  const p = newPlayerProg('agumon'); three.forEach(c => offerPassive(p, c));
  expect(offerPassive(p, 'card_data_magnet')).toEqual({ status: 'full', cardId: 'card_data_magnet' });
});
test('replace swaps passive and stats change', () => {
  const p = newPlayerProg('agumon'); three.forEach(c => offerPassive(p, c));
  replacePassive(p, 1, 'card_data_magnet');
  expect(p.passives[1]).toBe('card_data_magnet'); expect(effectiveStats(p).pickupMul).toBeCloseTo(1.5);
});
test('replace with null discards the new card', () => {
  const p = newPlayerProg('agumon'); three.forEach(c => offerPassive(p, c));
  replacePassive(p, null, 'card_data_magnet'); expect(p.passives).toEqual(three);
});
test('slash replaces a kit move', () => {
  const p = newPlayerProg('agumon'); p.slots[1] = { moveId: 'sharp_claws', level: 3, fromCard: false };
  slashIntoSlot(p, 1, 'card_lightning_paw'); expect(p.slots[1]).toEqual({ moveId: 'lightning_paw', level: 1, fromCard: true });
});
test('signature slot cannot be replaced', () => expect(() => slashIntoSlot(newPlayerProg('agumon'), 0, 'card_lightning_paw')).toThrow());
test('items are not duplicated', () => {
  const p = newPlayerProg('veemon'); gainItem(p, 'digiegg_courage'); gainItem(p, 'digiegg_courage'); expect(p.items).toEqual(['digiegg_courage']);
});
