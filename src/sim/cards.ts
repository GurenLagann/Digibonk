import { CARDS } from '../data/cards';
import type { PlayerProg } from './progression';

export type CardResult = { status: 'equipped'; slot: number } | { status: 'full'; cardId: string };

export function offerPassive(p: PlayerProg, cardId: string): CardResult {
  const slot = p.passives.findIndex(c => c === null);
  if (slot < 0) return { status: 'full', cardId };
  p.passives[slot] = cardId;
  return { status: 'equipped', slot };
}

export function replacePassive(p: PlayerProg, slot: number | null, cardId: string): void {
  if (slot === null) return;
  if (slot < 0 || slot >= p.passives.length) throw new Error(`bad passive slot ${slot}`);
  p.passives[slot] = cardId;
}

export function slashIntoSlot(p: PlayerProg, slot: number, cardId: string): void {
  const card = CARDS[cardId];
  if (!card || card.kind !== 'slash' || !card.moveId) throw new Error(`not a slash card ${cardId}`);
  if (slot <= 0 || slot >= p.slots.length) throw new Error('signature slot cannot be replaced');
  p.slots[slot] = { moveId: card.moveId, level: 1, fromCard: true };
}

export function gainItem(p: PlayerProg, id: string): void {
  if (!p.items.includes(id)) p.items.push(id);
}
export const gainRare = gainItem;
