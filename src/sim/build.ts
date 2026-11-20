/** Builds por parceiro: ★ (peso maior no level up), ✕ (fora do sorteio) e caminho de digievolução (só orienta). */
import type { PartnerBuild, SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';

export interface OfferPrefs { weight(key: string): number }

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
