import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb } from '../../tools/db/db';
import { migrate, seed } from '../../tools/db/migrate';

function dirWith(files: Record<string, string>) {
  const d = mkdtempSync(join(tmpdir(), 'mig-'));
  for (const [n, sql] of Object.entries(files)) writeFileSync(join(d, n), sql);
  return d;
}

test('migrate applies pending .sql files in name order and records them', () => {
  const db = openDb(':memory:');
  const dir = dirWith({ '002_b.sql': 'CREATE TABLE b (id TEXT PRIMARY KEY, a TEXT REFERENCES a(id));', '001_a.sql': 'CREATE TABLE a (id TEXT PRIMARY KEY);' });
  expect(migrate(db, dir)).toEqual(['001_a.sql', '002_b.sql']);
  expect(migrate(db, dir)).toEqual([]);
  expect(db.prepare('SELECT name FROM schema_migrations ORDER BY name').all().map(r => r.name)).toEqual(['001_a.sql', '002_b.sql']);
});

test('a failing migration rolls back and is not recorded', () => {
  const db = openDb(':memory:');
  const dir = dirWith({ '001_ok.sql': 'CREATE TABLE ok (id TEXT PRIMARY KEY);', '002_bad.sql': 'CREATE TABLE x (id TEXT PRIMARY KEY); INSERT INTO nope VALUES (1);' });
  expect(() => migrate(db, dir)).toThrow(/002_bad\.sql/);
  expect(db.prepare('SELECT name FROM schema_migrations').all().map(r => r.name)).toEqual(['001_ok.sql']);
  expect(db.prepare("SELECT name FROM sqlite_master WHERE name = 'x'").all()).toEqual([]);
});

test('seeds use their own registry and foreign keys are enforced', () => {
  const db = openDb(':memory:');
  migrate(db, dirWith({ '001.sql': 'CREATE TABLE a (id TEXT PRIMARY KEY); CREATE TABLE b (id TEXT PRIMARY KEY, a TEXT REFERENCES a(id));' }));
  expect(seed(db, dirWith({ '001_s.sql': "INSERT INTO a VALUES ('x');" }))).toEqual(['001_s.sql']);
  expect(() => db.exec("INSERT INTO b VALUES ('1', 'nope')")).toThrow();
});
