import { readFileSync } from 'node:fs';
import { openDb } from '../../tools/db/db';
import { migrate, seed } from '../../tools/db/migrate';
import { seedsAtMigration } from './helpers';
import { exportGameData } from '../../tools/db/export';

const before = JSON.parse(readFileSync('tests/db/fixtures/before.json', 'utf8'));
const db = openDb(':memory:');
migrate(db, 'db/migrations');
seed(db, seedsAtMigration()); // fidelidade da migração: só os seeds daquela época
const g = exportGameData(db);
const strip = <T extends object>(o: T, keys: string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

test('forms keep every game field except the old fixed growth, and gain typing + growth rate', () => {
  for (const [id, f] of Object.entries(before.FORMS) as [string, any][]) {
    expect(strip(g.FORMS[id], ['growthRate', 'attribute', 'element']), id).toEqual(strip(f, ['growth']));
    expect(g.FORMS[id].growthRate).toBe(0.005);
    expect(g.FORMS[id].attribute).toBeTruthy();
    expect(g.FORMS[id].element).toBeTruthy();
  }
  expect(Object.keys(g.FORMS)).toEqual(Object.keys(before.FORMS));
});

test('moves, items, partners are identical (moves gain an element)', () => {
  for (const [id, m] of Object.entries(before.MOVES) as [string, any][]) expect(strip(g.MOVES[id], ['element']), id).toEqual(m);
  expect(g.ITEMS).toEqual(before.ITEMS);
  expect(g.PARTNERS).toEqual(before.PARTNERS);
});

test('enemies, minibosses and bosses keep their fields and gain the Digimon typing', () => {
  for (const k of ['ENEMIES', 'MINIBOSSES', 'BOSSES'] as const) {
    expect(g[k].map((e: any) => strip(e, ['attribute', 'element']))).toEqual(before[k]);
    for (const e of g[k]) expect(e.attribute && e.element, e.id).toBeTruthy();
  }
});

test('cards keep identity and passive bonuses become percentages with per-level gain', () => {
  for (const [id, c] of Object.entries(before.CARDS) as [string, any][]) expect(strip(g.CARDS[id], ['bonuses']), id).toEqual(strip(c, ['passive']));
  expect(g.CARDS.card_greymon_horn.bonuses).toEqual([{ stat: 'atk', basePct: 15, perLevelPct: 2 }]);
  expect(g.CARDS.card_lightning_paw.bonuses).toEqual([]);
});

test('type charts come from the matchup tables (missing pair = 1)', () => {
  expect(g.ATTRIBUTE_CHART.vaccine.virus).toBe(1.5);
  expect(g.ATTRIBUTE_CHART.virus.vaccine).toBe(0.75);
  expect(g.ATTRIBUTE_CHART.free.virus).toBe(1);
  expect(g.ELEMENT_CHART.fire.plant).toBe(1.5);
  expect(g.ELEMENT_CHART.neutral.fire).toBe(1);
});

test('an enemy pointing at a missing Digimon fails the export with its id (even with foreign keys off)', () => {
  const d = openDb(':memory:');
  migrate(d, 'db/migrations'); seed(d, 'db/seeds');
  d.exec('PRAGMA foreign_keys = OFF;');
  d.exec("INSERT INTO enemies (digimon_id, role, hp, dmg, speed, xp, size, min_phase, ord) VALUES ('numemon', 'enemy', 1, 1, 1, 1, 1, 1, 99)");
  expect(() => exportGameData(d)).toThrow(/numemon/);
});
