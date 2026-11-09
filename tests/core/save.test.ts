import { loadSave, storeSave, defaultSave, partnerRecord, SAVE_KEY } from '../../src/core/save';
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

test('partnerRecords: default empty, validated per field, round trip', () => {
  expect(defaultSave().partnerRecords).toEqual({});
  expect(loadSave(fakeStorage({ [SAVE_KEY]: JSON.stringify({ ...defaultSave(), partnerRecords: undefined }) })).partnerRecords).toEqual({});
  const bad = fakeStorage({ [SAVE_KEY]: JSON.stringify({ ...defaultSave(), partnerRecords: { agumon: { runs: 'x', wins: 2 } } }) });
  expect(loadSave(bad).partnerRecords).toEqual({ agumon: { runs: 0, wins: 2, bestPhase: 0 } });
  const s = fakeStorage({}); const d = { ...defaultSave(), partnerRecords: { veemon: { runs: 3, wins: 1, bestPhase: 4 } } };
  storeSave(d, s); expect(loadSave(s)).toEqual(d);
  expect(partnerRecord(d, 'veemon').bestPhase).toBe(4);
  expect(partnerRecord(d, 'nobody')).toEqual({ runs: 0, wins: 0, bestPhase: 0 });
});
describe('evoluções secretas', () => {
  test('default: nada descoberto nem revelado', () => {
    expect(defaultSave().discoveredEvos).toEqual([]);
    expect(defaultSave().revealedReqs).toEqual({});
  });
  test('discoveredEvos descarta itens que não são texto', () => {
    const s = fakeStorage({ [SAVE_KEY]: JSON.stringify({ discoveredEvos: ['agumon->greymon', 3] }) });
    expect(loadSave(s).discoveredEvos).toEqual(['agumon->greymon']);
  });
  test('revealedReqs valida por aresta e por chave', () => {
    const s = fakeStorage({ [SAVE_KEY]: JSON.stringify({ revealedReqs: { 'agumon->greymon': ['level', 7], x: 'lixo' } }) });
    expect(loadSave(s).revealedReqs).toEqual({ 'agumon->greymon': ['level'] });
  });
  test('save antigo sem os campos carrega com tudo secreto', () => {
    const s = fakeStorage({ [SAVE_KEY]: JSON.stringify({ unlocked: ['agumon'], discovered: ['agumon'] }) });
    const d = loadSave(s);
    expect(d.discoveredEvos).toEqual([]); expect(d.revealedReqs).toEqual({});
  });
  test('round trip', () => {
    const s = fakeStorage({});
    const d = { ...defaultSave(), discoveredEvos: ['agumon->greymon'], revealedReqs: { 'greymon->skullgreymon': ['stat:atk'] } };
    storeSave(d, s); expect(loadSave(s)).toEqual(d);
  });
});
