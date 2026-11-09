import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPng, writePng } from './png.ts';
import { backgroundColors, buildStrip, components, foregroundMask, type Image, type Rect, type Role } from './slice.ts';
import { gridOf, scaleNearest } from './dw3.ts';

/**
 * Sprites de campo do Digimon World 3 (PS1, © Bandai; rips de Ragey e Artzei no The Spriters Resource).
 * Por direção: parado (1 quadro), caminhada (4–5 quadros) e corrida (5–6 quadros, braços balançando; o jogo usa quando a velocidade dobra).
 * Na folha os sprites já olham para a ESQUERDA, como o jogo espera (não espelhar).
 * Cada direção: [fileira, primeira coluna] (quadros em sequência) ou lista de ids "fileira.coluna" de tools/sprites/inspect.ts.
 * Atenção: nas folhas do Agumon e do Veemon a 1ª fileira é o PARADO respirando, não a caminhada.
 */
type Dir = 'up' | 'diagup' | 'side' | 'diagdown' | 'down';
/** [fileira, primeira coluna] para quadros em sequência, ou a lista explícita de ids "fileira.coluna" */
type At = [number, number] | string[];
type Dirs = Record<Dir, At>;
/** file: folha em assets-src/sprites/dw3 (padrão <id>.png); direções ausentes caem nas de lado no jogo */
interface Sheet { file?: string; idle?: Partial<Dirs>; walk: Partial<Dirs>; walkFrames: number; run?: Partial<Dirs>; runFrames?: number }
const ROW0_IDLE: Dirs = { up: [0, 0], diagup: [0, 4], side: [0, 8], diagdown: [0, 12], down: [0, 16] };
// agumon saiu daqui em 2026-11-09: agora usa a folha do ChatGPT (assets-src/sprites/gemini/agumon); a folha DW3 continua
// em assets-src/sprites/dw3/agumon.png caso seja preciso voltar (walk/run em 5 direções, linhas 1-3).
const CONFIG: Record<string, Sheet> = {
  veemon: {
    idle: ROW0_IDLE, walkFrames: 5, runFrames: 6,
    walk: { up: [0, 20], diagup: [1, 0], side: [1, 5], diagdown: [1, 10], down: [1, 15] },
    run: { up: [2, 0], diagup: [2, 6], side: [2, 12], diagdown: [3, 0], down: [3, 6] },
  },
  // inimigos (folha "Various Digimon 1"): só a caminhada de lado, virada para o jogador
  bakemon: { file: 'extra/various_digimon_01_02__187606.png', idle: { side: [3, 6] }, walk: { side: [3, 6] }, walkFrames: 3 },
  guardromon: { file: 'extra/various_digimon_01_02__187606.png', idle: { side: [1, 0] }, walk: { side: [1, 0] }, walkFrames: 3 },
  guilmon: { // folha rotulada (IDLE / WALK / RUN)
    idle: { up: [0, 0], diagup: [0, 3], side: [0, 6], diagdown: [1, 0], down: [1, 3] }, walkFrames: 4, runFrames: 5,
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
  const img = readPng(join(SRC, cfg.file ?? `${id}.png`));
  const bg = backgroundColors(img);
  const grid = gridOf(components(foregroundMask(img, bg), img.w, img.h, 40, 0.1).map(c => c.rect));
  const frames: Image[] = [], roles: Role[] = [];
  const cellsAt = (what: string, at: At, n: number) => {
    const cells = typeof at[0] === 'string'
      ? (at as string[]).map(ref => { const [r, c] = ref.split('.').map(Number); return grid[r]?.[c]; }).filter((q): q is Rect => !!q)
      : grid[at[0] as number]?.slice(at[1] as number, (at[1] as number) + n) ?? [];
    const want = typeof at[0] === 'string' ? at.length : n;
    if (cells.length !== want) throw new Error(`${id}: ${what} precisa de ${want} quadros em ${JSON.stringify(at)}, achou ${cells.length}`);
    return cells;
  };
  for (const [dir, at] of Object.entries(cfg.idle ?? {}) as [Dir, At][]) {
    frames.push(cut(img, bg, cellsAt(`parado ${dir}`, at, 1)[0])); roles.push(IDLE[dir] as Role);
  }
  for (const [kind, n] of [['walk', cfg.walkFrames], ['run', cfg.runFrames ?? 0]] as const)
    for (const [dir, at] of Object.entries(cfg[kind] ?? {}) as [Dir, At][])
      cellsAt(`${kind} ${dir}`, at, n).forEach((q, i) => { frames.push(cut(img, bg, q)); roles.push(`${kind}${SUFFIX[dir]}${i + 1}` as Role); });
  const r = buildStrip(frames);
  writePng(join(OUT, `${id}.png`), r.strip);
  manifest.sprites[id] = { file: `${id}.png`, frameW: r.frameW, frameH: r.frameH, frames: roles, source: 0 };
  console.log(`${id.padEnd(20)} ${r.frameW}x${r.frameH} (dw3, ${frames.length} quadros)`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
