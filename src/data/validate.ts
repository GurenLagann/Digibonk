import { MOVES } from './moves';
import { FORMS } from './forms';
import { PARTNERS } from './partners';
import { CARDS } from './cards';
import { ITEMS } from './items';
import { BOSSES, ENEMIES, MINIBOSSES } from './enemies';
import { T } from './tuning';
import type { Stage } from './types';

export function reachableStages(formId: string): Stage[] {
  const seen = new Set<string>(); const stages = new Set<Stage>();
  const stack = [formId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id) || !FORMS[id]) continue;
    seen.add(id); stages.add(FORMS[id].stage);
    for (const e of FORMS[id].evolutions) stack.push(e.to);
  }
  return [...stages];
}

export function validateData(): string[] {
  const errs: string[] = [];
  const partnerIds = new Set([...PARTNERS.map(p => p.id), ...Object.values(ITEMS).flatMap(i => (i.unlockPartner ? [i.unlockPartner] : []))]);
  const ids = [...Object.keys(MOVES), ...Object.keys(FORMS), ...Object.keys(CARDS), ...Object.keys(ITEMS)];
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i && !(FORMS[id] && PARTNERS.some(p => p.id === id)));
  // forms and partners may share ids by design; moves/cards/items/forms must otherwise be unique
  for (const d of new Set(dup)) errs.push(`duplicate id ${d}`);
  for (const m of Object.values(MOVES)) {
    if (m.maxLevel !== 5) errs.push(`move ${m.id} maxLevel`);
    if (!m.perLevel) errs.push(`move ${m.id} perLevel`);
  }
  for (const f of Object.values(FORMS)) {
    if (!MOVES[f.signature]) errs.push(`form ${f.id} signature ${f.signature} missing`);
    for (const k of f.kit) if (!MOVES[k]) errs.push(`form ${f.id} kit ${k} missing`);
    if (f.kit.length > T.MOVE_SLOTS - 1) errs.push(`form ${f.id} kit too long`);
    if (f.kit.includes(f.signature)) errs.push(`form ${f.id} kit repeats signature`);
    for (const e of f.evolutions) {
      if (!FORMS[e.to]) errs.push(`form ${f.id} -> ${e.to} missing`);
      for (const it of e.req.items ?? []) if (!ITEMS[it] && !CARDS[it]) errs.push(`form ${f.id} -> ${e.to} item ${it} missing`);
      for (const u of e.req.unlocked ?? []) if (!partnerIds.has(u)) errs.push(`form ${f.id} -> ${e.to} unlocked ${u} unknown`);
    }
  }
  for (const p of PARTNERS) if (!FORMS[p.childForm] || FORMS[p.childForm].stage !== 'child') errs.push(`partner ${p.id} childForm`);
  for (const c of Object.values(CARDS)) if (c.kind === 'slash' && (!c.moveId || !MOVES[c.moveId])) errs.push(`card ${c.id} move`);
  for (const i of Object.values(ITEMS)) {
    for (const p of [...(i.forPartners ?? []), ...(i.requiresUnlocked ?? [])]) if (!partnerIds.has(p)) errs.push(`item ${i.id} partner ${p}`);
  }
  for (const b of BOSSES) for (const m of b.moves) if (!MOVES[m]) errs.push(`boss ${b.id} move ${m}`);
  const enemyIds = [...ENEMIES, ...MINIBOSSES, ...BOSSES].map(e => e.id);
  if (new Set(enemyIds).size !== enemyIds.length) errs.push('duplicate enemy id');
  return errs;
}
