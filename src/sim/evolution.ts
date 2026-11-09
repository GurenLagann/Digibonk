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
    // Maturidade troca de caminho: madura só segue arestas de Maturidade; não madura, só as outras
    if (!!req.requiresMaturity !== p.matured) return false;
    if (p.level < req.minLevel) return false;
    for (const [k, v] of Object.entries(req.minStats ?? {})) if (s[k as StatKey] < (v as number)) return false;
    if (req.items && !req.items.every(i => p.items.includes(i))) return false;
    if (req.unlocked && !req.unlocked.every(u => ctx.save.unlocked.includes(u))) return false;
    if (req.minPhase && ctx.phase < req.minPhase) return false;
    if (req.minKills && p.kills < req.minKills) return false;
    if (req.minNearDeaths && p.nearDeaths < req.minNearDeaths) return false;
    return true;
  }).map(e => e.to);
}

export type EvoMissing =
  | { kind: 'level'; need: number }
  | { kind: 'stat'; stat: StatKey; need: number }
  | { kind: 'item'; id: string }
  | { kind: 'phase'; need: number }
  | { kind: 'kills'; need: number }
  | { kind: 'nearDeaths'; need: number; have: number }
  | { kind: 'maturity' };
export type EvoHint = { kind: 'final' } | { kind: 'none' } | { kind: 'next'; to: string; missing: EvoMissing[] };

export function nextEvolutionHint(p: PlayerProg, ctx: EvoContext): EvoHint {
  const f = FORMS[p.formId];
  const edges = p.matured ? f.evolutions.filter(e => e.req.requiresMaturity) : f.evolutions;
  if (edges.length === 0) return { kind: 'final' };
  const s = effectiveStats(p);
  let best: { to: string; missing: EvoMissing[] } | null = null;
  for (const { to, req } of edges) {
    if (req.unlocked && !req.unlocked.every(u => ctx.save.unlocked.includes(u))) continue;
    const missing: EvoMissing[] = [];
    if (p.level < req.minLevel) missing.push({ kind: 'level', need: req.minLevel });
    for (const [k, v] of Object.entries(req.minStats ?? {}))
      if (s[k as StatKey] < (v as number)) missing.push({ kind: 'stat', stat: k as StatKey, need: v as number });
    for (const id of req.items ?? []) if (!p.items.includes(id)) missing.push({ kind: 'item', id });
    if (req.minPhase && ctx.phase < req.minPhase) missing.push({ kind: 'phase', need: req.minPhase });
    if (req.minKills && p.kills < req.minKills) missing.push({ kind: 'kills', need: req.minKills });
    if (req.minNearDeaths && p.nearDeaths < req.minNearDeaths) missing.push({ kind: 'nearDeaths', need: req.minNearDeaths, have: p.nearDeaths });
    if (req.requiresMaturity && !p.matured) missing.push({ kind: 'maturity' });
    if (!best || missing.length < best.missing.length) best = { to, missing };
  }
  return best ? { kind: 'next', ...best } : { kind: 'none' };
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

/** dá para amadurecer: ainda não amadureceu, a forma evolui e o nível já alcança a evolução mais baixa dela */
export function canMature(p: PlayerProg): boolean {
  const evs = FORMS[p.formId]?.evolutions ?? [];
  return !p.matured && evs.length > 0 && p.level >= Math.min(...evs.map(e => e.req.minLevel));
}

/** Maturidade: fica na forma atual com bônus (stats.ts); daí em diante só valem as arestas de Maturidade */
export function mature(p: PlayerProg): void { p.matured = true; }

/** troca de forma sem checar requisitos (evolução já validada, ou debug) */
export function applyForm(p: PlayerProg, toFormId: string): void {
  const to = FORMS[toFormId];
  if (!to) throw new Error(`unknown form ${toFormId}`);
  p.formId = toFormId;
  p.matured = false;
  p.path.push(toFormId);
  p.pathLevels.push(p.level);
  const prev = p.slots[0];
  const lvl = prev?.level ?? 1;
  for (let i = 1; i < p.slots.length; i++) if (p.slots[i]?.moveId === to.signature) p.slots[i] = null;
  p.slots[0] = { moveId: to.signature, level: lvl, fromCard: false };
  // a assinatura anterior que faz parte do kit novo passa para um espaço livre, mantendo o nível
  if (prev && to.kit.includes(prev.moveId) && !p.slots.some(s => s?.moveId === prev.moveId)) {
    const free = p.slots.findIndex((s, i) => i > 0 && s === null);
    if (free > 0) p.slots[free] = { moveId: prev.moveId, level: prev.level, fromCard: false };
  }
}
