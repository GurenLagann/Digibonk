/**
 * uso: node --experimental-strip-types tools/db/cli.ts <migrate|seed|build>
 *   migrate / seed: aplica o que falta em db/digibonk.db
 *   build: recria o banco do zero (migrate + seed)
 */
import { existsSync, rmSync } from 'node:fs';
import { openDb } from './db.ts';
import { migrate, seed } from './migrate.ts';

export const DB_PATH = 'db/digibonk.db', MIGRATIONS = 'db/migrations', SEEDS = 'db/seeds';

const cmd = process.argv[2];
if (cmd === 'build' && existsSync(DB_PATH)) rmSync(DB_PATH);
const db = openDb(DB_PATH);
const log = (what: string, names: string[]) => console.log(`${what}: ${names.length ? names.join(', ') : 'nada pendente'}`);
if (cmd === 'migrate' || cmd === 'build') log('migrations', migrate(db, MIGRATIONS));
if (cmd === 'seed' || cmd === 'build') log('seeds', seed(db, SEEDS));
if (!['migrate', 'seed', 'build'].includes(cmd)) { console.error('uso: cli.ts <migrate|seed|build>'); process.exit(1); }
