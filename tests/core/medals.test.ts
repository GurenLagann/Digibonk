import { fmtClock, medalFor } from '../../src/core/medals';

test('medal by victory time', () => {
  expect(medalFor(undefined)).toBeNull();
  expect(medalFor(3000)).toBe('bronze');
  expect(medalFor(2100)).toBe('bronze');
  expect(medalFor(2099)).toBe('silver');
  expect(medalFor(1499)).toBe('gold');
  expect(medalFor(1079)).toBe('champion');
});
test('fmtClock', () => {
  expect(fmtClock(undefined)).toBe('—');
  expect(fmtClock(65)).toBe('01:05');
  expect(fmtClock(3725)).toBe('1:02:05');
});
