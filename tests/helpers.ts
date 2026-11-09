export function fakeStorage(init: Record<string, string>): Storage {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    clear: () => m.clear(),
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    key: (i: number) => [...m.keys()][i] ?? null,
    removeItem: (k: string) => { m.delete(k); },
    setItem: (k: string, v: string) => { m.set(k, String(v)); },
  };
}

import { newPlayerProg, type PlayerProg } from '../src/sim/progression';
import { FORMS } from '../src/data/forms';

export function progAt(formId: string, level: number): PlayerProg {
  const p = newPlayerProg(formId); p.level = level; return p;
}
export function maxedProg(formId: string): PlayerProg {
  const p = newPlayerProg(formId);
  const f = FORMS[formId];
  p.slots = [f.signature, ...f.kit].map(moveId => ({ moveId, level: 5, fromCard: false }));
  return p;
}

import { chooseBlind, chooseOffer, resolveCard, type RunState } from '../src/sim/run';
export function autoResolveModals(r: RunState) {
  if (r.offers) chooseOffer(r, 0);
  if (r.pendingCard) resolveCard(r, { passiveSlot: null });
  if (r.blindChoice) chooseBlind(r, 0);
}
export const circleInput = (i: number) => ({ mx: Math.cos(i / 120), mz: Math.sin(i / 120) });

import type { SaveData } from '../src/core/save';
/** marca todas as arestas de evolução do jogo como descobertas (testes que não são sobre segredo) */
export function discoverAll(save: SaveData): SaveData {
  for (const f of Object.values(FORMS)) for (const e of f.evolutions) {
    const id = `${f.id}->${e.to}`;
    if (!save.discoveredEvos.includes(id)) save.discoveredEvos.push(id);
  }
  return save;
}
