import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPng, writePng } from './png.ts';
import { backgroundColors, buildStrip, components, foregroundMask, type Image, type Rect, type Role } from './slice.ts';
import { gridOf, scaleNearest } from './dw3.ts';

/**
 * Sprites de campo do Digimon World 3 (PS1, © Bandai; rips de Ragey e Artzei no The Spriters Resource).
 * Caminhada (4 quadros por direção) e corrida (5 por direção; o jogo usa quando a velocidade dobra).
 * Na folha os sprites já olham para a ESQUERDA, como o jogo espera (não espelhar).
 * Cada direção: [fileira, primeira coluna] na grade detectada; os quadros seguem em sequência.
 */
type Dir = 'up' | 'diagup' | 'side' | 'diagdown' | 'down';
type Dirs = Record<Dir, [number, number]>;
const WALK_FRAMES = 4, RUN_FRAMES = 5;
const ROW0_WALK: Dirs = { up: [0, 0], diagup: [0, 4], side: [0, 8], diagdown: [0, 12], down: [0, 16] };
const CONFIG: Record<string, { walk: Dirs; run: Dirs }> = {
  agumon: { walk: ROW0_WALK, run: { up: [1, 0], diagup: [1, 5], side: [1, 10], diagdown: [1, 15], down: [2, 0] } },
  veemon: { walk: ROW0_WALK, run: { up: [0, 20], diagup: [1, 0], side: [1, 5], diagdown: [1, 10], down: [1, 15] } },
  guilmon: {
    walk: { up: [2, 0], diagup: [2, 4], side: [3, 0], diagdown: [3, 4], down: [4, 0] },
    run: { up: [5, 0], diagup: [5, 5], side: [6, 0], diagdown: [6, 5], down: [7, 0] },
  },
};
const SUFFIX: Record<Dir, string> = { side: '', up: 'up', down: 'down', diagup: 'diagup', diagdown: 'diagdown' };
const IDLE: Record<Dir, string> = { side: 'idle1', up: 'idleup', down: 'idledown', diagup: 'idlediagup', diagdown: 'idlediagdown' };
const SRC = 'assets-src/sprites/dw3', OUT = 'public/sprites', SCALE = 2;

function cut(img: Image, bg: Set<number>, q: Rect): Image {
  const data = new Uint8Array(q.w * q.h * 4);
  for (let y = 0; y < q.h; y++) for (let x = 0; x < q.w; x++) {
    const s = ((q.y + y) * img.w + q.x + x) * 4;
    const c = (img.data[s] << 16) | (img.data[s + 1] << 8) | img.data[s + 2];
    if (img.data[s + 3] && !bg.has(c)) data.set(img.data.subarray(s, s + 4), (y * q.w + x) * 4);
  }
  return scaleNearest({ w: q.w, h: q.h, data }, SCALE);
}

const manifest = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'));
for (const [id, cfg] of Object.entries(CONFIG)) {
  const img = readPng(join(SRC, `${id}.png`));
  const bg = backgroundColors(img);
  const grid = gridOf(components(foregroundMask(img, bg), img.w, img.h, 40, 0.1).map(c => c.rect));
  const frames: Image[] = [], roles: Role[] = [];
  const take = (kind: 'walk' | 'run', n: number) => {
    for (const [dir, [row, col]] of Object.entries(cfg[kind]) as [Dir, [number, number]][]) {
      const cells = grid[row]?.slice(col, col + n) ?? [];
      if (cells.length !== n) throw new Error(`${id}: ${kind} ${dir} precisa de ${n} quadros em [${row}, ${col}], achou ${cells.length}`);
      cells.forEach((q, i) => { frames.push(cut(img, bg, q)); roles.push(`${kind}${SUFFIX[dir]}${i + 1}` as Role); });
      if (kind === 'walk') { frames.push(cut(img, bg, cells[0])); roles.push(IDLE[dir] as Role); }
    }
  };
  take('walk', WALK_FRAMES);
  take('run', RUN_FRAMES);
  const r = buildStrip(frames);
  writePng(join(OUT, `${id}.png`), r.strip);
  manifest.sprites[id] = { file: `${id}.png`, frameW: r.frameW, frameH: r.frameH, frames: roles, source: 0, scale: 0.8 };
  console.log(`${id.padEnd(20)} ${r.frameW}x${r.frameH} (dw3, ${frames.length} quadros)`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
