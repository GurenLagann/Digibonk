import type { AltarKind } from '../sim/altars';
import type { Role } from './sprites';

/** Digimon de cada altar, parado no mapa como NPC (sprite do jogo, de frente) */
export const ALTAR_DIGIMON: Record<AltarKind, string> = { etemon: 'etemon', datamon: 'datamon', challenge: 'ogremon' };

/** altura do Digimon no altar (unidades do mundo; o parceiro Child tem 2) */
export const ALTAR_HEIGHT = 2.6;

const STAND_FPS = 6;

/**
 * Quadro do Digimon no altar: parado respirando de frente (standdown1..N); sem folha de parado, a pose fixa idledown/idle1.
 * Usado = congelado no primeiro quadro.
 */
export function altarFrame(time: number, frames: Role[], used: boolean): Role {
  const stand = frames.filter(f => /^standdown\d+$/.test(f));
  if (stand.length) return used ? stand[0] : stand[Math.floor(time * STAND_FPS) % stand.length];
  return frames.includes('idledown') ? 'idledown' : 'idle1';
}

export interface Pixels { width: number; height: number; data: ArrayLike<number> }

/**
 * Faixa vertical ocupada pelo desenho no quadro i (frações da altura do quadro, 0 = topo):
 * as folhas em grade têm margem vazia em cima e embaixo (o recorte é comum a todos os quadros, inclusive a derrota deitada).
 * Quadro vazio → { top: 0, bottom: 1 }.
 */
export function contentBand(px: Pixels, i: number, cols: number, rows: number, alphaMin = 128): { top: number; bottom: number } {
  const cw = Math.floor(px.width / cols), ch = Math.floor(px.height / rows);
  const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch;
  let top = -1, bottom = -1;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) if (px.data[((y0 + y) * px.width + x0 + x) * 4 + 3] >= alphaMin) { if (top < 0) top = y; bottom = y; break; }
  }
  return top < 0 ? { top: 0, bottom: 1 } : { top: top / ch, bottom: (bottom + 1) / ch };
}
