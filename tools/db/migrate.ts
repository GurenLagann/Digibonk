/**
 * Executor de migrations e seeds: aplica, em ordem de nome, os .sql de uma pasta que ainda não estão
 * registrados na tabela de controle, cada um numa transação. O SQL dos arquivos é portátil
 * (SQLite agora, PostgreSQL no servidor); só este executor conhece o SQLite.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './db.ts';

function apply(db: Db, dir: string, table: 'schema_migrations' | 'schema_seeds'): string[] {
  db.exec(`CREATE TABLE IF NOT EXISTS ${table} (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
  const done = new Set(db.prepare(`SELECT name FROM ${table}`).all().map(r => String(r.name)));
  const applied: string[] = [];
  for (const name of readdirSync(dir).filter(f => f.endsWith('.sql')).sort()) {
    if (done.has(name)) continue;
    db.exec('BEGIN');
    try {
      db.exec(readFileSync(join(dir, name), 'utf8'));
      db.prepare(`INSERT INTO ${table} (name, applied_at) VALUES (?, ?)`).run(name, new Date().toISOString());
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw new Error(`${name}: ${(e as Error).message}`);
    }
    applied.push(name);
  }
  return applied;
}

export const migrate = (db: Db, dir: string) => apply(db, dir, 'schema_migrations');
export const seed = (db: Db, dir: string) => apply(db, dir, 'schema_seeds');
