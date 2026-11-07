import { loadSave, storeSave, defaultSave, SAVE_KEY } from '../../src/core/save';
import { fakeStorage } from '../helpers';

test('missing storage returns defaults', () => expect(loadSave(null)).toEqual(defaultSave()));
test('corrupt json returns defaults', () => {
  const s = fakeStorage({ [SAVE_KEY]: '{oops' }); expect(loadSave(s)).toEqual(defaultSave());
});
test('throwing storage returns defaults and store returns false', () => {
  const s = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } } as unknown as Storage;
  expect(loadSave(s)).toEqual(defaultSave()); expect(storeSave(defaultSave(), s)).toBe(false);
});
test('round trip', () => {
  const s = fakeStorage({}); const d = { ...defaultSave(), unlocked: ['agumon', 'veemon', 'guilmon', 'gabumon'] };
  expect(storeSave(d, s)).toBe(true); expect(loadSave(s)).toEqual(d);
});
test('starters always unlocked even if save lost them', () => {
  const s = fakeStorage({ [SAVE_KEY]: JSON.stringify({ ...defaultSave(), unlocked: [] }) });
  expect(loadSave(s).unlocked).toEqual(expect.arrayContaining(['agumon', 'veemon', 'guilmon']));
});
test('wrong field types fall back per field', () => {
  const s = fakeStorage({ [SAVE_KEY]: JSON.stringify({ version: 1, unlocked: 'x', currency: 'lots', records: { bestPhase: 3 } }) });
  const d = loadSave(s);
  expect(d.currency).toBe(0); expect(d.records).toEqual({ bestPhase: 3, wins: 0, runs: 0 });
});
