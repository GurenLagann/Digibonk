import { openDb } from '../../tools/db/db';
import { migrate } from '../../tools/db/migrate';

const TABLES = ['attributes', 'elements', 'attribute_matchups', 'element_matchups', 'stages', 'digimon', 'moves', 'forms', 'form_kit',
  'evolutions', 'evolution_items', 'evolution_unlocks', 'partners', 'items', 'item_partners', 'item_requires', 'cards', 'card_bonuses',
  'card_partners', 'enemies', 'boss_moves'];

test('migrations create every table of the game data model', () => {
  const db = openDb(':memory:');
  migrate(db, 'db/migrations');
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(r => String(r.name));
  for (const t of TABLES) expect(names, t).toContain(t);
});

test('foreign keys and checks protect the data', () => {
  const db = openDb(':memory:');
  migrate(db, 'db/migrations');
  expect(() => db.exec("INSERT INTO digimon (id, name, stage, attribute, element, hp, atk, def, spd, brain, size, color) VALUES ('x', 'X', 'child', 'nope', 'nope', 1, 1, 1, 1, 1, 1, 0)")).toThrow();
  db.exec("INSERT INTO elements VALUES ('fire', 'Fogo')");
  expect(() => db.exec("INSERT INTO moves (id, name, element, pattern, damage, cooldown, reach, max_level, dmg_per_level, cd_per_level, color) VALUES ('m', 'M', 'fire', 'laser', 1, 1, 1, 5, 1.25, 0.92, 0)")).toThrow();
});
