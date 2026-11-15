import { crystalsFor } from '../../src/core/crystals';

test('derrota: fase × 20 + abates + chefes + guardiões', () => {
  expect(crystalsFor({ phase: 2, kills: 4000, bosses: 1, guardians: 1, won: false, medal: null })).toBe(85);
});
test('vitória na fase 5 com medalha de ouro', () => {
  expect(crystalsFor({ phase: 5, kills: 15000, bosses: 5, guardians: 5, won: true, medal: 'gold' })).toBe(370);
});
test('vitória sem medalha (bronze) soma só o bônus de vitória', () => {
  expect(crystalsFor({ phase: 5, kills: 0, bosses: 0, guardians: 0, won: true, medal: 'bronze' })).toBe(120);
  expect(crystalsFor({ phase: 5, kills: 0, bosses: 0, guardians: 0, won: true, medal: null })).toBe(120);
});
