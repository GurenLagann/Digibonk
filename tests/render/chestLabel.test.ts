import { chestLabel } from '../../src/render/map';
import { chestPrice } from '../../src/sim/loot';

test('baú pago mostra o preço atual; sobe com as compras', () => {
  expect(chestLabel('paid', 0)).toBe(`${chestPrice(0)} Bits`);
  expect(chestLabel('paid', 2)).toBe(`${chestPrice(2)} Bits`);
  expect(chestPrice(2)).toBeGreaterThan(chestPrice(0));
});
test('amaldiçoado é "Grátis…?"; grátis não tem rótulo', () => {
  expect(chestLabel('cursed', 3)).toBe('Grátis…?');
  expect(chestLabel('free', 3)).toBeNull();
});
