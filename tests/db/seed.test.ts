import { readFileSync } from 'node:fs';
import { openDb } from '../../tools/db/db';
import { migrate, seed } from '../../tools/db/migrate';

const before = JSON.parse(readFileSync('tests/db/fixtures/before.json', 'utf8'));
const db = openDb(':memory:');
migrate(db, 'db/migrations');
seed(db, 'db/seeds');
const count = (sql: string) => Number(db.prepare(sql).get()!.n);

test('seed has the same content as the old TS modules', () => {
  expect(count('SELECT COUNT(*) n FROM forms')).toBe(Object.keys(before.FORMS).length);
  expect(count('SELECT COUNT(*) n FROM moves')).toBe(Object.keys(before.MOVES).length);
  expect(count('SELECT COUNT(*) n FROM cards')).toBe(Object.keys(before.CARDS).length);
  expect(count('SELECT COUNT(*) n FROM items')).toBe(Object.keys(before.ITEMS).length);
  expect(count('SELECT COUNT(*) n FROM partners')).toBe(before.PARTNERS.length);
  expect(count("SELECT COUNT(*) n FROM enemies WHERE role = 'enemy'")).toBe(before.ENEMIES.length);
  expect(count("SELECT COUNT(*) n FROM enemies WHERE role = 'miniboss'")).toBe(before.MINIBOSSES.length);
  expect(count("SELECT COUNT(*) n FROM enemies WHERE role = 'boss'")).toBe(before.BOSSES.length);
  const evos = Object.values(before.FORMS).reduce((n: number, f: any) => n + f.evolutions.length, 0);
  expect(count('SELECT COUNT(*) n FROM evolutions')).toBe(evos);
});

test('every Digimon has attribute and element, every move has an element, every passive card has a bonus', () => {
  expect(count('SELECT COUNT(*) n FROM digimon WHERE attribute IS NULL OR element IS NULL')).toBe(0);
  expect(count('SELECT COUNT(*) n FROM moves WHERE element IS NULL')).toBe(0);
  expect(count("SELECT COUNT(*) n FROM cards c WHERE kind = 'passive' AND NOT EXISTS (SELECT 1 FROM card_bonuses b WHERE b.card_id = c.id)")).toBe(0);
});

test('every strong element matchup has its weak inverse', () => {
  const rows = db.prepare('SELECT attacker, defender, multiplier FROM element_matchups').all() as { attacker: string; defender: string; multiplier: number }[];
  const m = new Map(rows.map(r => [`${r.attacker}>${r.defender}`, r.multiplier]));
  for (const r of rows) if (r.multiplier > 1) expect([0.75, 1.5], `${r.defender}>${r.attacker}`).toContain(m.get(`${r.defender}>${r.attacker}`));
});
