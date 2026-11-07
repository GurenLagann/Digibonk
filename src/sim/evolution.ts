import type { SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import type { StatKey } from '../data/types';
import type { PlayerProg } from './progression';
import { effectiveStats } from './stats';

export interface EvoContext { save: SaveData; phase: number }

export function availableEvolutions(p: PlayerProg, ctx: EvoContext): string[] {
  const f = FORMS[p.formId];
  const s = effectiveStats(p);
  return f.evolutions.filter(({ req }) => {
    if (p.level < req.minLevel) return false;
    for (const [k, v] of Object.entries(req.minStats ?? {})) if (s[k as StatKey] < (v as number)) return false;
    if (req.items && !req.items.every(i => p.items.includes(i))) return false;
    if (req.unlocked && !req.unlocked.every(u => ctx.save.unlocked.includes(u))) return false;
    if (req.minPhase && ctx.phase < req.minPhase) return false;
    if (req.minKills && p.kills < req.minKills) return false;
    return true;
  }).map(e => e.to);
}

export class EvoNotifier {
  private seen = new Set<string>();
  update(available: string[]): string[] {
    const fresh = available.filter(a => !this.seen.has(a));
    fresh.forEach(a => this.seen.add(a));
    return fresh;
  }
  reset() { this.seen.clear(); }
}

export function evolve(p: PlayerProg, toFormId: string, ctx: EvoContext): void {
  if (!availableEvolutions(p, ctx).includes(toFormId)) throw new Error(`cannot evolve ${p.formId} -> ${toFormId}`);
  applyForm(p, toFormId);
}

/** troca de forma sem checar requisitos (evolução já validada, ou debug) */
export function applyForm(p: PlayerProg, toFormId: string): void {
  const to = FORMS[toFormId];
  if (!to) throw new Error(`unknown form ${toFormId}`);
  p.formId = toFormId;
  p.path.push(toFormId);
  const lvl = p.slots[0]?.level ?? 1;
  for (let i = 1; i < p.slots.length; i++) if (p.slots[i]?.moveId === to.signature) p.slots[i] = null;
  p.slots[0] = { moveId: to.signature, level: lvl, fromCard: false };
}
