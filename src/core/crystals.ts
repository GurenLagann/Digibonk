import { T } from '../data/tuning';
import type { Medal } from './medals';

/** Cristais (moeda permanente do Laboratório) ganhos ao fim de uma partida */
export function crystalsFor(o: { phase: number; kills: number; bosses: number; guardians: number; won: boolean; medal: Medal | null }): number {
  const C = T.CRYSTALS;
  // vitória: bônus da medalha (prata ou melhor) substitui o bônus base de vitória
  const win = !o.won ? 0 : o.medal === 'silver' || o.medal === 'gold' || o.medal === 'champion' ? C.MEDAL[o.medal] : C.WIN;
  return o.phase * C.PER_PHASE + Math.floor(o.kills / C.KILLS_PER) + o.bosses * C.BOSS + o.guardians * C.GUARDIAN + win;
}
