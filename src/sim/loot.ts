import type { Rng } from '../core/rng';
import type { SaveData } from '../core/save';
import { CARD_LIST } from '../data/cards';
import { ITEM_LIST } from '../data/items';
import { T } from '../data/tuning';
import type { CardDef, ItemDef } from '../data/types';
import type { Enemy } from './director';

export interface Pickup { id: number; x: number; z: number; kind: 'xp' | 'card' | 'item' | 'heal' | 'fragment' | 'digidata'; value: number; ref?: string }
export interface Chest { id: number; x: number; z: number; opened: boolean }
export type ChestRoll = { kind: 'card' | 'item' | 'heal'; ref?: string };

export function eligibleItems(partnerId: string, save: SaveData, owned: string[]): ItemDef[] {
  return ITEM_LIST.filter(i => {
    if (owned.includes(i.id)) return false;
    if (i.kind === 'egg') return !!i.unlockPartner && !save.unlocked.includes(i.unlockPartner);
    if (i.forPartners && !i.forPartners.includes(partnerId)) return false;
    if (i.requiresUnlocked && !i.requiresUnlocked.every(u => save.unlocked.includes(u))) return false;
    return true;
  });
}

export function eligibleCards(partnerId: string): CardDef[] {
  return CARD_LIST.filter(c => c.kind !== 'rare' || (c.forPartners ?? []).includes(partnerId));
}

/** maxed: cartas que o jogador já tem no nível máximo (ficam fora do sorteio) */
export function rollChest(partnerId: string, save: SaveData, owned: string[], phase: number, rng: Rng, maxed: string[] = []): ChestRoll {
  const r = rng.next();
  if (r < 0.2) return { kind: 'heal' };
  if (r < 0.38) {
    const items = eligibleItems(partnerId, save, owned).filter(i => i.kind !== 'fusion' || phase >= 3);
    const eggs = items.filter(i => i.kind === 'egg'), others = items.filter(i => i.kind !== 'egg');
    // eggs: 2% of all chests
    if (eggs.length && r < 0.2 + 0.02) return { kind: 'item', ref: rng.pick(eggs).id };
    if (others.length && r >= 0.22) return { kind: 'item', ref: rng.pick(others).id };
  }
  const cards = eligibleCards(partnerId).filter(c => !maxed.includes(c.id) && (c.kind !== 'rare' || (phase >= 4 && !owned.includes(c.id))));
  return cards.length ? { kind: 'card', ref: rng.weighted(cards, c => c.weight).id } : { kind: 'heal' };
}

export function dropOnKill(enemy: Pick<Enemy, 'xp'>, rng: Rng): { xp: number; extra?: 'heal' | 'card' } {
  const r = rng.next();
  return { xp: enemy.xp, extra: r < 0.01 ? 'heal' : r < 0.014 ? 'card' : undefined };
}

export function placeChests(phase: number, rng: Rng, count = 8): Chest[] {
  const out: Chest[] = [];
  const lim = T.MAP_HALF - 8;
  for (let tries = 0; out.length < count && tries < 5000; tries++) {
    const x = (rng.next() * 2 - 1) * lim, z = (rng.next() * 2 - 1) * lim;
    if (Math.hypot(x, z) < 15) continue;
    if (out.some(c => Math.hypot(c.x - x, c.z - z) < 15)) continue;
    out.push({ id: phase * 100 + out.length, x, z, opened: false });
  }
  return out;
}

export function collect(pickups: Pickup[], px: number, pz: number, radius: number): Pickup[] {
  const got: Pickup[] = [];
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    if ((p.x - px) ** 2 + (p.z - pz) ** 2 <= radius * radius) { got.push(p); pickups.splice(i, 1); }
  }
  return got.reverse();
}
