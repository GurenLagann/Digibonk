import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPng, writePng } from './png.ts';
import { backgroundColors, buildStrip, components, foregroundMask, type Image, type Rect, type Role } from './slice.ts';
import { flipH, gridOf, scaleNearest } from './dw3.ts';

/**
 * Sprites de campo do Digimon World 3 (PS1, © Bandai; rips de Ragey e Artzei no The Spriters Resource).
 * 5 direções × 4 quadros de caminhada; na folha olham para a DIREITA → espelhados para a esquerda.
 * Cada direção: [fileira, primeira coluna] na grade detectada (4 quadros seguidos).
 */
type Dir = 'up' | 'diagup' | 'side' | 'diagdown' | 'down';
const SAME_AS_AGUMON: Record<Dir, [number, number]> = { up: [0, 0], diagup: [0, 4], side: [0, 8], diagdown: [0, 12], down: [0, 16] };
const CONFIG: Record<string, Record<Dir, [number, number]>> = {
  agumon: SAME_AS_AGUMON,
  veemon: SAME_AS_AGUMON,
  guilmon: { up: [2, 0], diagup: [2, 4], side: [3, 0], diagdown: [3, 4], down: [4, 0] },
};
const WALK_PREFIX: Record<Dir, string> = { side: 'walk', up: 'walkup', down: 'walkdown', diagup: 'walkdiagup', diagdown: 'walkdiagdown' };
const IDLE: Record<Dir, string> = { side: 'idle1', up: 'idleup', down: 'idledown', diagup: 'idlediagup', diagdown: 'idlediagdown' };
const SRC = 'assets-src/sprites/dw3', OUT = 'public/sprites', SCALE = 2;

function cut(img: Image, bg: Set<number>, q: Rect): Image {
  const data = new Uint8Array(q.w * q.h * 4);
  for (let y = 0; y < q.h; y++) for (let x = 0; x < q.w; x++) {
    const s = ((q.y + y) * img.w + q.x + x) * 4;
    const c = (img.data[s] << 16) | (img.data[s + 1] << 8) | img.data[s + 2];
    if (img.data[s + 3] && !bg.has(c)) data.set(img.data.subarray(s, s + 4), (y * q.w + x) * 4);
  }
  return scaleNearest(flipH({ w: q.w, h: q.h, data }), SCALE);
}

const manifest = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'));
for (const [id, dirs] of Object.entries(CONFIG)) {
  const img = readPng(join(SRC, `${id}.png`));
  const bg = backgroundColors(img);
  const grid = gridOf(components(foregroundMask(img, bg), img.w, img.h, 40, 0.1).map(c => c.rect));
  const frames: Image[] = [], roles: Role[] = [];
  for (const [dir, [row, col]] of Object.entries(dirs) as [Dir, [number, number]][]) {
    const cells = grid[row]?.slice(col, col + 4) ?? [];
    if (cells.length !== 4) throw new Error(`${id}: ${dir} precisa de 4 quadros em [${row}, ${col}], achou ${cells.length}`);
    cells.forEach((q, i) => { frames.push(cut(img, bg, q)); roles.push(`${WALK_PREFIX[dir]}${i + 1}` as Role); });
    frames.push(cut(img, bg, cells[0])); roles.push(IDLE[dir] as Role);
  }
  const r = buildStrip(frames);
  writePng(join(OUT, `${id}.png`), r.strip);
  manifest.sprites[id] = { file: `${id}.png`, frameW: r.frameW, frameH: r.frameH, frames: roles, source: 0, scale: 0.8 };
  console.log(`${id.padEnd(20)} ${r.frameW}x${r.frameH} (dw3, ${frames.length} quadros)`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
