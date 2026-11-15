import { defaultSave } from '../../src/core/save';
import { labLevel, nextLabCost, buyLab, labBonuses } from '../../src/core/lab';

test('buyLab sem saldo não muda nada', () => {
  const s = { ...defaultSave(), currency: 99 };
  expect(buyLab(s, 'lab_reroll')).toBe(false);
  expect(s.currency).toBe(99); expect(labLevel(s, 'lab_reroll')).toBe(0);
});
test('buyLab com saldo debita e sobe nível', () => {
  const s = { ...defaultSave(), currency: 100 };
  expect(buyLab(s, 'lab_reroll')).toBe(true);
  expect(s.currency).toBe(0); expect(labLevel(s, 'lab_reroll')).toBe(1); expect(nextLabCost(s, 'lab_reroll')).toBe(250);
});
test('id desconhecido', () => {
  const s = { ...defaultSave(), currency: 9999 };
  expect(buyLab(s, 'xyz')).toBe(false); expect(nextLabCost(s, 'xyz')).toBeNull();
});
test('nível máximo', () => {
  const s = { ...defaultSave(), currency: 9999 };
  expect(buyLab(s, 'lab_offer')).toBe(true);
  expect(nextLabCost(s, 'lab_offer')).toBeNull(); expect(buyLab(s, 'lab_offer')).toBe(false);
});
test('labBonuses', () => {
  const s = { ...defaultSave(), lab: { lab_reroll: 2, lab_ban: 1, lab_offer: 1 } };
  expect(labBonuses(s)).toEqual({ reroll: 2, skip: 0, ban: 1, extraOffers: 1 });
});
