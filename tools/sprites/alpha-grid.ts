/**
 * Grade de quadros de uma folha do ChatGPT (PNG com fundo transparente, ou fundo branco liso).
 * Escreve "fileira.coluna x,y,w,h" por quadro, igual ao inspect.ts.
 * uso: node --experimental-strip-types tools/sprites/alpha-grid.ts <folha.png> [fileiras]
 *   fileiras: quantas linhas a folha tem. Quando os sprites de linhas vizinhas se encostam,
 *   a folha é cortada perto de k*altura/fileiras (no vão mais vazio) em vez de pelos vãos, e cada
 *   quadro fica só com a faixa vertical principal (pedaços da linha vizinha são descartados).
 * Fundo transparente: o ChatGPT deixa cor escura com alpha≈0 no fundo; só alpha>128 conta.
 * Rótulos (caixas cheias, como DIREITA/ANDANDO) e faixas de título que cruzam a folha são ignorados.
 */
import { readPng } from './png.ts';

const im = readPng(process.argv[2]);
const want = Number(process.argv[3] ?? 0);
const { w: W, h: H, data } = im;
const px = (x: number, y: number) => (y * W + x) * 4;

let transparent = 0;
for (let i = 3; i < data.length; i += 4) if (data[i] < 128) transparent++;
const alphaMode = transparent > W * H * 0.2;
const fg = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const p = px(x, y);
  fg[y * W + x] = alphaMode ? +(data[p + 3] > 128) : +(Math.min(data[p], data[p + 1], data[p + 2]) < 215);
}
type Band = [number, number];
function bands(p: number[], gap: number, min: number): Band[] {
  const out: Band[] = []; let s = -1, last = -99;
  p.forEach((v, i) => {
    if (v > 0) { if (s < 0) s = i; last = i; }
    else if (s >= 0 && i - last > gap) { if (last - s >= min) out.push([s, last]); s = -1; }
  });
  if (s >= 0 && last - s >= min) out.push([s, last]);
  return out;
}
const rowSum = (y0: number, y1: number, x0 = 0, x1 = W) => { let n = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x < x1; x++) n += fg[y * W + x]; return n; };
const rowProj = Array.from({ length: H }, (_, y) => rowSum(y, y));

/** faixa vertical com mais pixels dentro do quadro: descarta pedaços das linhas vizinhas que caem no corte forçado */
function mainRun(top: number, bot: number, x0: number, x1: number): Band {
  let best: Band = [top, bot], bestN = -1, s = -1, last = -99, n = 0;
  for (let y = top; y <= bot + 4; y++) {
    const v = y <= bot ? rowSum(y, y, x0, x1) : 0;
    if (v > 0) { if (s < 0) { s = y; n = 0; } last = y; n += v; }
    else if (s >= 0 && y - last > 3) { if (n > bestN) { bestN = n; best = [s, last]; } s = -1; }
  }
  return best;
}

let rows = bands(rowProj.map(v => (v > 2 ? 1 : 0)), 4, 30);
const forced = !!want && rows.length !== want;
if (forced) {
  const cuts = [0];
  for (let k = 1; k < want; k++) {
    const c = Math.round((k * H) / want), r = Math.round(H / want / 5);
    let best = c; for (let y = c - r; y <= c + r; y++) if (rowProj[y] < rowProj[best]) best = y;
    cuts.push(best);
  }
  cuts.push(H - 1);
  rows = cuts.slice(0, -1).map((c, i) => [c, cuts[i + 1]] as Band);
}

let r = 0;
for (const [y0, y1] of rows) {
  const colProj = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = y0; y <= y1; y++) n += fg[y * W + x]; return n; });
  const cols = bands(colProj, 8, 30);
  if (cols.some(([a, b]) => b - a > W * 0.6)) continue; // faixa de título
  let c = 0;
  for (const [x0, x1] of cols) {
    let top = -1, bot = -1;
    for (let y = y0; y <= y1; y++) if (rowSum(y, y, x0, x1 + 1)) { if (top < 0) top = y; bot = y; }
    if (top < 0) continue;
    if (forced) [top, bot] = mainRun(top, bot, x0, x1 + 1);
    const w = x1 - x0 + 1, h = bot - top + 1;
    if (rowSum(top, bot, x0, x1 + 1) > w * h * 0.8) continue; // caixa de rótulo
    console.log(`${r}.${c++} ${x0},${top},${w},${h}`);
  }
  if (c) r++;
}
console.error(`${alphaMode ? 'transparente' : 'fundo branco'}: ${r} fileiras`);
