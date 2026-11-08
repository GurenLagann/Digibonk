import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CLI = resolve('tools/db/cli.ts');

test('comando inválido não cria o banco', () => {
  const dir = mkdtempSync(join(tmpdir(), 'cli-')); mkdirSync(join(dir, 'db'));
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', CLI, 'bogus'], { cwd: dir, encoding: 'utf8' });
  expect(r.status).toBe(1);
  expect(r.stderr).toContain('uso:');
  expect(existsSync(join(dir, 'db', 'digibonk.db'))).toBe(false);
});
