import { RELICS, RELIC_LIST, RELIC_EFFECTS } from '../../src/data/relics';

test('primeira leva: 8 relíquias com status em %, efeito válido e descrição', () => {
  expect(RELIC_LIST).toHaveLength(8);
  for (const r of RELIC_LIST) {
    expect(['hp', 'atk', 'def', 'spd']).toContain(r.stat);
    expect(r.statPct).toBeGreaterThan(0);
    expect(RELIC_EFFECTS).toContain(r.effect);
    expect(r.description.length).toBeGreaterThan(10);
  }
  expect(new Set(RELIC_LIST.map(r => r.effect))).toEqual(new Set(RELIC_EFFECTS));
});
test('acesso por id', () => {
  const r = RELIC_LIST[0]; expect(RELICS[r.id]).toBe(r);
});
