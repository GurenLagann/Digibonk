/** Relíquias da Zona Digital: até 3 por partida, cada uma com +% num status e um efeito (somados aqui). */
import { RELICS } from '../data/relics';
import type { RelicEffect } from '../data/types';
import type { PlayerProg } from './progression';

export const RELIC_SLOTS = 3;

/** soma dos efeitos das relíquias equipadas: regen = vida/s; pickup = +alcance; xp/elite = %; revive = fração; digidata = extra */
export function relicEffects(p: PlayerProg): Record<RelicEffect, number> {
  const out: Record<RelicEffect, number> = { regen: 0, pickup: 0, xp: 0, elite: 0, revive: 0, digidata: 0 };
  for (const id of p.relics) { const r = RELICS[id]; if (r) out[r.effect] += r.value; }
  return out;
}

/** equipa uma relíquia (sem repetir, até RELIC_SLOTS); devolve se entrou */
export function addRelic(p: PlayerProg, id: string): boolean {
  if (!RELICS[id] || p.relics.includes(id) || p.relics.length >= RELIC_SLOTS) return false;
  p.relics.push(id);
  return true;
}
