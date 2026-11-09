/**
 * Jogress de golpes: dois golpes no nível máximo viram um golpe Jogress num espaço só (dispara os dois, com bônus de
 * dano) e o outro espaço fica livre. Uma vez por partida, num Terminal Jogress do mapa.
 */
import { MOVES } from '../data/moves';
import type { PlayerProg } from './progression';

const maxed = (p: PlayerProg, i: number) => {
  const s = p.slots[i];
  return !!s && !s.jogress && s.level >= MOVES[s.moveId].maxLevel;
};

/** pares de espaços [a, b] (a < b) que podem fazer Jogress */
export function jogressPairs(p: PlayerProg): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 0; a < p.slots.length; a++) for (let b = a + 1; b < p.slots.length; b++) if (maxed(p, a) && maxed(p, b)) out.push([a, b]);
  return out;
}

/** junta o golpe do espaço b no espaço a (a assinatura, se entrar, fica no espaço 0) e libera b */
export function applyJogress(p: PlayerProg, a: number, b: number): void {
  const sa = p.slots[a], sb = p.slots[b];
  if (!sa || !sb) return;
  sa.jogress = { moveId: sb.moveId, level: sb.level };
  p.slots[b] = null;
}
