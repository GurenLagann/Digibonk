/** Builds por parceiro: ★ (peso maior no level up), ✕ (fora do sorteio) e caminho de digievolução (só orienta). */
import type { PartnerBuild, SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';
import { edgeId, isDiscovered, revealedKeys, type ReqKey } from './discovery';

export interface OfferPrefs { weight(key: string): number }
export interface PathChoice { to: string; secret: boolean; hints: ReqKey[] }

export function lineForms(partnerId: string): string[] {
  const child = PARTNERS.find(p => p.id === partnerId)?.childForm;
  if (!child) return [];
  const out: string[] = [], queue = [child];
  while (queue.length) {
    const id = queue.shift()!;
    if (out.includes(id) || !FORMS[id]) continue;
    out.push(id);
    for (const e of FORMS[id].evolutions) queue.push(e.to);
  }
  return out;
}

export function lineMoves(partnerId: string): { moveId: string; from: string }[] {
  const out: { moveId: string; from: string }[] = [];
  for (const f of lineForms(partnerId)) for (const m of [FORMS[f].signature, ...FORMS[f].kit])
    if (!out.some(x => x.moveId === m)) out.push({ moveId: m, from: f });
  return out;
}

export function buildOf(save: SaveData, partnerId: string): PartnerBuild {
  return (save.builds[partnerId] ??= { fav: [], ban: [], path: [] });
}

export function markOf(b: PartnerBuild, key: string): 'fav' | 'ban' | null {
  return b.fav.includes(key) ? 'fav' : b.ban.includes(key) ? 'ban' : null;
}

const drop = (xs: string[], k: string) => { const i = xs.indexOf(k); if (i >= 0) xs.splice(i, 1); };

/** nada → ★ → ✕ → nada, pulando o estado cuja lista está cheia; false se nada mudou */
export function cycleMark(b: PartnerBuild, key: string): boolean {
  const cur = markOf(b, key);
  const order: ('fav' | 'ban' | null)[] = cur === null ? ['fav', 'ban'] : cur === 'fav' ? ['ban', null] : [null];
  for (const next of order) {
    if (next === 'fav' && b.fav.length >= T.BUILD.MAX) continue;
    if (next === 'ban' && b.ban.length >= T.BUILD.MAX) continue;
    drop(b.fav, key); drop(b.ban, key);
    if (next) b[next].push(key);
    return true;
  }
  return false;
}

export function buildPrefs(b: PartnerBuild): OfferPrefs {
  return { weight: key => (b.ban.includes(key) ? 0 : b.fav.includes(key) ? T.BUILD.FAV_WEIGHT : 1) };
}

const childOf = (partnerId: string) => PARTNERS.find(p => p.id === partnerId)?.childForm ?? '';

/** próximos passos: arestas descobertas e secretas com pista; depois de uma secreta, nada */
export function pathChoices(save: SaveData, path: string[], partnerId: string): PathChoice[] {
  const steps = path.length ? path : [childOf(partnerId)];
  for (let i = 1; i < steps.length; i++) if (!isDiscovered(save, edgeId(steps[i - 1], steps[i]))) return [];
  const from = steps[steps.length - 1];
  return (FORMS[from]?.evolutions ?? []).flatMap((e): PathChoice[] => {
    const id = edgeId(from, e.to);
    if (isDiscovered(save, id)) return [{ to: e.to, secret: false, hints: [] }];
    const hints = revealedKeys(save, id);
    return hints.length ? [{ to: e.to, secret: true, hints }] : [];
  });
}

export function setPathStep(b: PartnerBuild, partnerId: string, index: number, to: string): void {
  const base = b.path.length ? b.path.slice(0, index) : [childOf(partnerId)];
  b.path = [...base, to];
}

export function clearPathFrom(b: PartnerBuild, index: number): void {
  b.path = b.path.slice(0, index);
  if (b.path.length < 2) b.path = [];
}

export function pathTarget(path: string[], formId: string, off: boolean): string | null {
  if (off) return null;
  const i = path.indexOf(formId);
  return i >= 0 && i + 1 < path.length ? path[i + 1] : null;
}
