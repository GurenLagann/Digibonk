import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** pasta só com os seeds do momento da migração para o banco (001–002): é contra eles que o retrato before.json vale */
export function seedsAtMigration(): string {
  const d = mkdtempSync(join(tmpdir(), 'seeds-'));
  for (const f of ['001_tipagem.sql', '002_conteudo.sql']) copyFileSync(join('db/seeds', f), join(d, f));
  return d;
}
