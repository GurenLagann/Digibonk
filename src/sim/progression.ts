import type { Rng } from '../core/rng';
import { CARD_LIST } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { T } from '../data/tuning';
import type { StatKey, Stats } from '../data/types';

export interface MoveSlot { moveId: string; level: number; fromCard: boolean }
export interface PlayerProg {
  formId: string; level: number; xp: number; bonus: Stats;
  slots: (MoveSlot | null)[]; passives: (string | null)[]; items: string[];
  pendingLevelUps: number; kills: number; path: string[];
}
export type LevelOffer =
  | { kind: 'learn'; moveId: string }
  | { kind: 'upgrade'; slot: number }
  | { kind: 'stat'; stat: StatKey; amount: number }
  | { kind: 'card'; cardId: string };

export const STAT_KEYS: readonly StatKey[] = ['hp', 'atk', 'def', 'spd', 'brain'];

export function newPlayerProg(formId: string): PlayerProg {
  const f = FORMS[formId];
  if (!f) throw new Error(`unknown form ${formId}`);
  const slots: (MoveSlot | null)[] = Array.from({ length: T.MOVE_SLOTS }, () => null);
  slots[0] = { moveId: f.signature, level: 1, fromCard: false };
  return {
    formId, level: 1, xp: 0, bonus: { hp: 0, atk: 0, def: 0, spd: 0, brain: 0 },
    slots, passives: Array.from({ length: T.PASSIVE_SLOTS }, () => null), items: [],
    pendingLevelUps: 0, kills: 0, path: [formId],
  };
}

export const xpToNext = (level: number) => Math.round(5 + level * 4 + level ** 1.6);

export function addXp(p: PlayerProg, amount: number): number {
  p.xp += amount;
  let gained = 0;
  while (p.xp >= xpToNext(p.level)) { p.xp -= xpToNext(p.level); p.level++; gained++; }
  p.pendingLevelUps += gained;
  return gained;
}

export function rollOffers(p: PlayerProg, rng: Rng): LevelOffer[] {
  const f = FORMS[p.formId];
  const pool: LevelOffer[] = [];
  const slotted = new Set(p.slots.filter(Boolean).map(s => s!.moveId));
  if (p.slots.some(s => s === null)) for (const m of f.kit) if (!slotted.has(m)) pool.push({ kind: 'learn', moveId: m });
  p.slots.forEach((s, i) => { if (s && s.level < MOVES[s.moveId].maxLevel) pool.push({ kind: 'upgrade', slot: i }); });
  const out: LevelOffer[] = [];
  if (p.passives.some(c => c === null) && rng.next() < T.CARD_OFFER_CHANCE) {
    const cards = CARD_LIST.filter(c => c.kind === 'passive' && !p.passives.includes(c.id));
    if (cards.length) out.push({ kind: 'card', cardId: rng.weighted(cards, c => c.weight).id });
  }
  const stats = STAT_KEYS.map(stat => ({ kind: 'stat', stat, amount: T.STAT_OFFER_AMOUNT }) as LevelOffer);
  // shuffle pool then fill; stats always available as candidates (lower priority)
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const statShuffled = [...stats];
  for (let i = statShuffled.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [statShuffled[i], statShuffled[j]] = [statShuffled[j], statShuffled[i]]; }
  // one stat slot is always mixed in when pool is rich, so stat growth stays available
  const want = T.OFFERS_PER_LEVEL;
  const fromPool = Math.min(shuffled.length, want - out.length - (shuffled.length >= want ? 1 : 0));
  out.push(...shuffled.slice(0, Math.max(0, fromPool)));
  for (const s of statShuffled) { if (out.length >= want) break; out.push(s); }
  return out.slice(0, want);
}

export function applyOffer(p: PlayerProg, o: LevelOffer): void {
  switch (o.kind) {
    case 'learn': {
      const i = p.slots.findIndex(s => s === null);
      if (i >= 0) p.slots[i] = { moveId: o.moveId, level: 1, fromCard: false };
      break;
    }
    case 'upgrade': {
      const s = p.slots[o.slot];
      if (s && s.level < MOVES[s.moveId].maxLevel) s.level++;
      break;
    }
    case 'stat': p.bonus[o.stat] += o.amount; break;
    case 'card': {
      const i = p.passives.findIndex(c => c === null);
      if (i >= 0) p.passives[i] = o.cardId;
      break;
    }
  }
  if (p.pendingLevelUps > 0) p.pendingLevelUps--;
}
