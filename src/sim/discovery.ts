/**
 * Evoluções secretas: o jogador só vê uma evolução depois de fazê-la uma vez (aresta "descoberta")
 * ou de revelar requisitos dela com Digi Data. Funções puras sobre o SaveData.
 */
import type { SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import type { EvoEdge, EvoReq, StatKey, Stats } from '../data/types';
import { availableEvolutions, type EvoContext, type EvoHint, type EvoMissing } from './evolution';
import type { PlayerProg } from './progression';
import { effectiveStats } from './stats';

export type ReqKey = 'level' | 'kills' | 'nearDeaths' | 'phase' | `stat:${StatKey}` | `item:${string}`;
export interface Reveal { edge: string; key: ReqKey }
export type VisibleHint = EvoHint | { kind: 'secret'; from: string; missing: EvoMissing[]; hidden: boolean };

export const edgeId = (from: string, to: string) => `${from}->${to}`;

export function findEdge(id: string): { from: string; index: number; total: number; edge: EvoEdge } | undefined {
  const i = id.indexOf('->'); if (i < 0) return undefined;
  const from = id.slice(0, i), to = id.slice(i + 2);
  const evs = FORMS[from]?.evolutions ?? [];
  const index = evs.findIndex(e => e.to === to);
  return index < 0 ? undefined : { from, index, total: evs.length, edge: evs[index] };
}

/** uma chave por condição do requisito; parceiro liberado (`unlocked`) não é segredo e fica de fora */
export function reqKeys(req: EvoReq): ReqKey[] {
  const keys: ReqKey[] = ['level'];
  for (const k of Object.keys(req.minStats ?? {})) keys.push(`stat:${k as StatKey}`);
  for (const id of req.items ?? []) keys.push(`item:${id}`);
  if (req.minKills) keys.push('kills');
  if (req.minNearDeaths) keys.push('nearDeaths');
  if (req.minPhase) keys.push('phase');
  return keys;
}

export const isDiscovered = (save: SaveData, edge: string) => save.discoveredEvos.includes(edge);
export function discover(save: SaveData, edge: string): void { if (!isDiscovered(save, edge)) save.discoveredEvos.push(edge); }
export const revealedKeys = (save: SaveData, edge: string) => (save.revealedReqs[edge] ?? []) as ReqKey[];
export function reveal(save: SaveData, r: Reveal): void {
  const keys = (save.revealedReqs[r.edge] ??= []);
  if (!keys.includes(r.key)) keys.push(r.key);
}

export function knownAvailable(p: PlayerProg, ctx: EvoContext): string[] {
  return availableEvolutions(p, ctx).filter(to => isDiscovered(ctx.save, edgeId(p.formId, to)));
}
export function secretAvailable(p: PlayerProg, ctx: EvoContext): string[] {
  return availableEvolutions(p, ctx).filter(to => !isDiscovered(ctx.save, edgeId(p.formId, to)));
}

/** o que falta de uma chave (null = cumprida) */
function missingOf(p: PlayerProg, s: Stats, ctx: EvoContext, req: EvoReq, key: ReqKey): EvoMissing | null {
  if (key === 'level') return p.level < req.minLevel ? { kind: 'level', need: req.minLevel } : null;
  if (key === 'kills') return req.minKills && p.kills < req.minKills ? { kind: 'kills', need: req.minKills } : null;
  if (key === 'nearDeaths') return req.minNearDeaths && p.nearDeaths < req.minNearDeaths ? { kind: 'nearDeaths', need: req.minNearDeaths, have: p.nearDeaths } : null;
  if (key === 'phase') return req.minPhase && ctx.phase < req.minPhase ? { kind: 'phase', need: req.minPhase } : null;
  if (key.startsWith('stat:')) {
    const stat = key.slice(5) as StatKey, need = req.minStats?.[stat] ?? 0;
    return s[stat] < need ? { kind: 'stat', stat, need } : null;
  }
  const id = key.slice(5);
  return p.items.includes(id) ? null : { kind: 'item', id };
}

const unlockedOk = (save: SaveData, req: EvoReq) => !req.unlocked || req.unlocked.every(u => save.unlocked.includes(u));

/**
 * Dica do painel "Próx. evolução" sem vazar segredos: arestas descobertas primeiro; senão a secreta com pistas
 * que tem menos requisitos revelados faltando. O destino de uma secreta nunca sai daqui, e `hidden` não depende
 * de o requisito oculto estar cumprido.
 */
export function visibleHint(p: PlayerProg, ctx: EvoContext): VisibleHint {
  const f = FORMS[p.formId];
  if (f.evolutions.length === 0) return { kind: 'final' };
  const s = effectiveStats(p);
  const edges = f.evolutions.filter(e => unlockedOk(ctx.save, e.req));
  const rank = <T extends { missing: EvoMissing[] }>(xs: T[]) => xs.reduce<T | null>((b, x) => (!b || x.missing.length < b.missing.length ? x : b), null);

  const known = edges.filter(e => isDiscovered(ctx.save, edgeId(p.formId, e.to)))
    .map(e => ({ to: e.to, missing: reqKeys(e.req).map(k => missingOf(p, s, ctx, e.req, k)).filter((m): m is EvoMissing => !!m) }));
  const bestKnown = rank(known);
  if (bestKnown) return { kind: 'next', ...bestKnown };

  const secret = edges.map(e => ({ e, rev: revealedKeys(ctx.save, edgeId(p.formId, e.to)) }))
    .filter(x => x.rev.length > 0)
    .map(({ e, rev }) => ({
      missing: rev.map(k => missingOf(p, s, ctx, e.req, k)).filter((m): m is EvoMissing => !!m),
      hidden: reqKeys(e.req).some(k => !rev.includes(k)),
    }));
  const bestSecret = rank(secret);
  return bestSecret ? { kind: 'secret', from: p.formId, ...bestSecret } : { kind: 'none' };
}

/** requisitos que um Digi Data ainda pode revelar neste save */
export function drawPool(save: SaveData): Reveal[] {
  const out: Reveal[] = [];
  for (const f of Object.values(FORMS)) for (const e of f.evolutions) {
    const edge = edgeId(f.id, e.to);
    if (isDiscovered(save, edge) || !unlockedOk(save, e.req)) continue;
    const rev = revealedKeys(save, edge);
    for (const key of reqKeys(e.req)) if (!rev.includes(key)) out.push({ edge, key });
  }
  return out;
}
