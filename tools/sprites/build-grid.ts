import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPng, writePng } from './png.ts';
import { buildGrid, type Image } from './slice.ts';
import { cropToUnion } from './vpet.ts';
import { cell, downscale, GRID_COLS, GRID_DIRS, GRID_IDLE, GRID_KINDS, GRID_ROLE, GRID_SRC } from './grid.ts';

/**
 * Folhas em grade (assets-src/sprites/grid/<id>_walk|run|idle|defeat.png, ver grid.ts) → folha do jogo em grade
 * (COLS quadros por linha; `cols` no manifesto). Roda por último no sprites:vpet: sobrescreve V-pet, ChatGPT/Gemini e DW3.
 * Papéis: walk/run/stand (parado respirando)/death (derrota) por direção, mais idle1/idleup… = 1º quadro do parado
 * (ou do andar, se não houver folha de parado: marcado em `defaults`). Dano ainda não tem folha: o jogo mantém o quadro de movimento.
 */
const OUT = 'public/sprites';
/** altura e largura máximas do quadro (px); com COLS por linha a folha fica bem abaixo de 4096 px */
const MAX_H = 128, MAX_W = 160, COLS = 21;
const manifest = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'));
const ids = existsSync(GRID_SRC) ? [...new Set(readdirSync(GRID_SRC).filter(f => f.endsWith('_walk.png')).map(f => f.slice(0, -9)))].sort() : [];
for (const id of ids) {
  const frames: Image[] = [], roles: string[] = [];
  for (const kind of GRID_KINDS) {
    const file = join(GRID_SRC, `${id}_${kind}.png`);
    if (!existsSync(file)) continue;  // idle/defeat são opcionais
    const sheet = readPng(file);
    GRID_DIRS.forEach((dir, row) => {
      for (let col = 0; col < GRID_COLS; col++) { frames.push(cell(sheet, row, col)); roles.push(`${GRID_ROLE[kind]}${dir}${col + 1}`); }
    });
  }
  // pose parada fixa (retrato, miniatura) = 1º quadro do parado de cada direção, ou do andar
  const idleFrom = roles.includes('stand1') ? 'stand' : 'walk';
  for (const dir of GRID_DIRS) {
    const i = roles.indexOf(`${idleFrom}${dir}1`);
    if (i >= 0) { frames.push(frames[i]); roles.push(GRID_IDLE[dir]); }
  }
  // recorte comum a todos os quadros (mantém os pés na mesma linha), depois reduz
  const cropped = cropToUnion(frames);
  const s = Math.min(1, MAX_H / cropped[0].h, MAX_W / cropped[0].w);
  const r = buildGrid(cropped.map(f => downscale(f, s)), COLS);
  writePng(join(OUT, `${id}.png`), r.strip);
  manifest.sprites[id] = { file: `${id}.png`, frameW: r.frameW, frameH: r.frameH, frames: roles, source: 0, cols: COLS, ...(idleFrom === 'walk' ? { defaults: ['idle'] } : {}) };
  console.log(`${id.padEnd(22)} ${r.frameW}x${r.frameH} ×${roles.length} → ${r.strip.w}x${r.strip.h} (grade)`);
}
// ids em ordem alfabética: o manifesto não muda de ordem conforme a fonte de cada sprite
manifest.sprites = Object.fromEntries(Object.keys(manifest.sprites).sort().map(k => [k, manifest.sprites[k]]));
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`${ids.length} tiras da grade`);
