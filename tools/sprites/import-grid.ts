import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BOSSES, ENEMIES, FORMS, MINIBOSSES } from '../../src/data/generated/gamedata.ts';
import { readPng, writePng } from './png.ts';
import { GRID_CELL, GRID_DIRS, GRID_KINDS, GRID_SRC } from './grid.ts';

/**
 * Copia folhas em grade (<id>_walk.png / _run.png / _idle.png / _defeat.png: 5 colunas × 8 linhas de 256 px, uma direção por linha)
 * para assets-src/sprites/grid/, guardando só as linhas que o jogo usa (as 5 viradas para a esquerda; a direita é espelhada).
 * uso: node --experimental-strip-types tools/sprites/import-grid.ts <pasta> [ids...]
 *      sem ids: importa os Digimon que o jogo usa (formas, inimigos, chefes) e que existem na pasta.
 * Depois: npm run sprites:vpet
 */
const [dir, ...wanted] = process.argv.slice(2);
if (!dir || !existsSync(dir)) { console.error('uso: import-grid.ts <pasta> [ids...]'); process.exit(1); }
const inGame = new Set([...Object.keys(FORMS), ...[...ENEMIES, ...MINIBOSSES, ...BOSSES].map(e => e.id)]);
const available = new Set(readdirSync(dir).filter(f => f.endsWith('_walk.png')).map(f => f.slice(0, -'_walk.png'.length)));
const ids = wanted.length ? wanted : [...available].filter(id => inGame.has(id)).sort();
mkdirSync(GRID_SRC, { recursive: true });
const rows = GRID_DIRS.length;
for (const id of ids) {
  for (const kind of GRID_KINDS) {
    const file = join(dir, `${id}_${kind}.png`);
    if (!existsSync(file)) { if (kind === 'walk') console.warn(`${id}: falta ${id}_${kind}.png`); continue; }
    const img = readPng(file);
    if (img.w !== 5 * GRID_CELL || img.h < rows * GRID_CELL) { console.warn(`${id}_${kind}: ${img.w}x${img.h}, esperava 1280x2048 — pulei`); continue; }
    const h = rows * GRID_CELL;
    writePng(join(GRID_SRC, `${id}_${kind}.png`), { w: img.w, h, data: img.data.slice(0, img.w * h * 4) });
  }
  console.log(`${id}${inGame.has(id) ? '' : '  (ainda não está no jogo)'}`);
}
console.log(`${ids.length} Digimon em ${GRID_SRC} — agora: npm run sprites:vpet`);
