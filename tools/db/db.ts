/** Abre o banco SQLite (node:sqlite, embutido no Node 22) com chaves estrangeiras ligadas. */
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export function openDb(path: string): Db {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}
