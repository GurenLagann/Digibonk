import { SpatialHash } from '../../src/sim/spatial';

test('hash query finds only near ids', () => {
  const h = new SpatialHash(4); h.insert(1, 0, 0); h.insert(2, 50, 50);
  expect(h.query(1, 1, 3, [])).toEqual([1]);
});
test('hash handles negative coords and clear', () => {
  const h = new SpatialHash(4); h.insert(3, -9, -9);
  expect(h.query(-8, -8, 2, [])).toEqual([3]); h.clear(); expect(h.query(-8, -8, 2, [])).toEqual([]);
});
