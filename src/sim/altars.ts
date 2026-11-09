/**
 * Altares do mapa (um de cada por fase, uso único na fase): decisões de risco e recompensa.
 *   Etemon (Corrupção): mais inimigos e mais fortes pelo resto da partida, em troca de mais XP.
 *   Datamon (Troca): perde % de um status e ganha um pouco mais em outro, pelo resto da partida.
 *   Desafio: o próximo guardião vem mais forte e abre uma Distorção rara.
 */
import type { Rng } from '../core/rng';
import { T } from '../data/tuning';
import { MAP_OBSTACLES } from './map';

export type AltarKind = 'etemon' | 'datamon' | 'challenge';
export interface Altar { id: number; kind: AltarKind; x: number; z: number; used: boolean }
export type TradeStat = 'hp' | 'atk' | 'def' | 'spd';
export interface Trade { from: TradeStat; to: TradeStat; lose: number; gain: number }

const KINDS: AltarKind[] = ['etemon', 'datamon', 'challenge'];
const TRADE_STATS: TradeStat[] = ['hp', 'atk', 'def', 'spd'];

/** um altar de cada tipo, longe do início, dos obstáculos e uns dos outros */
export function placeAltars(phase: number, rng: Rng): Altar[] {
  const out: Altar[] = [], lim = T.MAP_HALF - 12;
  for (let tries = 0; out.length < KINDS.length && tries < 3000; tries++) {
    const x = (rng.next() * 2 - 1) * lim, z = (rng.next() * 2 - 1) * lim;
    if (Math.hypot(x, z) < 20) continue;
    if (MAP_OBSTACLES.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 3)) continue;
    if (out.some(a => Math.hypot(a.x - x, a.z - z) < 25)) continue;
    out.push({ id: phase * 10 + out.length, kind: KINDS[out.length], x, z, used: false });
  }
  return out;
}

/** 3 trocas do Datamon: perde `lose`% de um status, ganha `gain`% (sempre um pouco mais) em outro */
export function rollTrades(rng: Rng): Trade[] {
  const out: Trade[] = [];
  while (out.length < 3) {
    const from = rng.pick(TRADE_STATS), to = rng.pick(TRADE_STATS.filter(s => s !== from));
    if (out.some(t => t.from === from && t.to === to)) continue;
    out.push({ from, to, lose: T.ALTARS.TRADE_LOSE, gain: rng.pick(T.ALTARS.TRADE_GAINS) });
  }
  return out;
}
