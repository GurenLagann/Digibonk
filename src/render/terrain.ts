import { createRng } from '../core/rng';
import { T } from '../data/tuning';

/**
 * Relevo do chão (só visual: a simulação continua 2D). Cada bioma escolhe um gerador; o render soma
 * `groundY(x, z)` no y de tudo que fica no chão. Plano no nascimento e longe do mapa (fundo e Zona Digital).
 */
export type HeightFn = (x: number, z: number) => number;

const H = T.MAP_HALF;
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
/** 0 no nascimento (raio 6), 1 a partir de 16; some de novo entre MAP_HALF+25 e +40 */
function mask(x: number, z: number): number {
  const spawn = smooth((Math.hypot(x, z) - 6) / 10);
  const edge = 1 - smooth((Math.max(Math.abs(x), Math.abs(z)) - (H + 25)) / 15);
  return spawn * edge;
}

/** soma de ondas em direções sorteadas, normalizada em [-1, 1] */
function waves(seed: number, minLen: number, maxLen: number, count = 4) {
  const rng = createRng(seed), r = rng.next;
  const comps = Array.from({ length: count }, () => {
    const a = r() * Math.PI * 2, len = minLen + r() * (maxLen - minLen), k = (Math.PI * 2) / len;
    return { kx: Math.cos(a) * k, kz: Math.sin(a) * k, ph: r() * Math.PI * 2, w: 0.6 + r() * 0.4 };
  });
  const total = comps.reduce((s, c) => s + c.w, 0);
  return (x: number, z: number) => comps.reduce((s, c) => s + c.w * Math.sin(c.kx * x + c.kz * z + c.ph), 0) / total;
}

/** colinas suaves de até `amp`; vales (≈ 1/4 do mapa) ficam no plano 0 */
export function hills(seed: number, amp: number): HeightFn {
  const n = waves(seed, 35, 60);
  return (x, z) => {
    const m = mask(x, z);
    if (m === 0) return 0;
    return amp * smooth((n(x, z) + 0.45) * 1.1) * m;
  };
}

/**
 * plataformas: `levels` degraus de altura `step` acima do 0, ligados por rampas. A rampa ocupa uma faixa
 * de largura `ramp` (no ruído normalizado ≈ ramp/40) em volta de cada limiar; fora dela a altura é exata.
 */
export function terraces(seed: number, step: number, levels: number, ramp: number): HeightFn {
  const n = waves(seed, 55, 90, 3);
  const w = ramp / 40;
  const th = Array.from({ length: levels }, (_, i) => -0.15 + (i * 0.5) / Math.max(1, levels - 1) * 0.9);
  return (x, z) => {
    const m = mask(x, z);
    if (m === 0) return 0;
    const v = n(x, z);
    let y = 0;
    for (const t of th) y += step * Math.min(1, Math.max(0, (v - t) / w + 0.5));
    // perto do nascimento e da borda, desce suave para 0 (sai do nível exato só nessa faixa)
    return m === 1 ? y : y * m;
  };
}

/** retângulo (meia-largura/meia-profundidade, girado em y) inteiro na mesma altura do centro? */
export function isFlat(fn: HeightFn, x: number, z: number, halfW: number, halfD: number, rot: number): boolean {
  const c = Math.cos(rot), s = Math.sin(rot), y0 = fn(x, z);
  for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const lx = u * halfW, lz = v * halfD;
    // mesma convenção do three (rotação em y): x' = x·cos + z·sin, z' = -x·sin + z·cos
    if (Math.abs(fn(x + lx * c + lz * s, z - lx * s + lz * c) - y0) > 0.01) return false;
  }
  return true;
}

let current: HeightFn = () => 0;
/** altura do bioma atual (MapView.setBiome troca) */
export function setGround(fn: HeightFn): void { current = fn; }
export function groundY(x: number, z: number): number { return current(x, z); }
