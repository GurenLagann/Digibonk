import type { Rng } from '../core/rng';
import type { SaveData } from '../core/save';
import { CARD_LIST } from '../data/cards';
import { FORMS } from '../data/forms';
import { ITEMS, ITEM_LIST } from '../data/items';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';
import type { CardDef, ItemDef } from '../data/types';
import type { Enemy } from './director';

export interface Pickup { id: number; x: number; z: number; kind: 'xp' | 'card' | 'item' | 'heal' | 'fragment' | 'digidata' | 'bits'; value: number; ref?: string;
  /** velocidade do ímã (u/s) depois que o item foi puxado; ausente = parado no chão */
  pull?: number }
export interface Chest { id: number; x: number; z: number; opened: boolean; kind: 'free' | 'paid' | 'cursed';
  /** jogador dentro do raio (só para o aviso de Bits faltando sair na transição) */
  near?: boolean }
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

export function placeChests(phase: number, rng: Rng, free = T.CHESTS.FREE, paid = T.CHESTS.PAID): Chest[] {
  const count = free + paid + 1;
  const out: Chest[] = [];
  const lim = T.MAP_HALF - 8;
  for (let tries = 0; out.length < count && tries < 5000; tries++) {
    const x = (rng.next() * 2 - 1) * lim, z = (rng.next() * 2 - 1) * lim;
    if (Math.hypot(x, z) < 15) continue;
    if (out.some(c => Math.hypot(c.x - x, c.z - z) < 15)) continue;
    const n = out.length;
    out.push({ id: phase * 100 + n, x, z, opened: false, kind: n < free ? 'free' : n < free + paid ? 'paid' : 'cursed' });
  }
  return out;
}

/** preço do próximo baú pago, dado quantos já foram comprados na partida */
export function chestPrice(bought: number): number {
  const P = T.CHESTS.PRICES;
  return bought < P.length ? P[bought] : P[P.length - 1] + (bought - P.length + 1) * T.CHESTS.PRICE_STEP;
}

/** Digiovos que a linha do parceiro usa em evoluções e que o jogador ainda não tem */
export function eggsForPartner(partnerId: string, owned: string[]): string[] {
  const child = PARTNERS.find(p => p.id === partnerId)?.childForm;
  if (!child || !FORMS[child]) return [];
  const line = FORMS[child].line, ids = new Set<string>();
  for (const f of Object.values(FORMS)) {
    if (f.line !== line) continue;
    for (const e of f.evolutions) for (const id of e.req.items ?? []) if (ITEMS[id]?.kind === 'digiegg') ids.add(id);
  }
  return [...ids].filter(id => !owned.includes(id));
}

/** atraídos pelo ímã; fragmentos da missão e Digi Data ficam onde caíram (são objetivo) */
export function isMagnetic(kind: Pickup['kind']): boolean { return kind !== 'fragment' && kind !== 'digidata'; }

/**
 * Ímã: item atraível a menos de MAGNET × pickupMul do parceiro começa a voar até ele,
 * acelerando; depois de puxado segue o parceiro até ser coletado.
 */
export function attract(pickups: Pickup[], px: number, pz: number, pickupMul: number, dt: number): void {
  const reach = T.PICKUP.MAGNET * pickupMul;
  for (const p of pickups) {
    if (!isMagnetic(p.kind)) continue;
    const dx = px - p.x, dz = pz - p.z, d = Math.hypot(dx, dz);
    if (p.pull === undefined) { if (d > reach) continue; p.pull = T.PICKUP.PULL_START; }
    p.pull += T.PICKUP.PULL_ACCEL * dt;
    if (d < 1e-9) continue;
    const step = Math.min(d, p.pull * dt);
    p.x += (dx / d) * step; p.z += (dz / d) * step;
  }
}

export function collect(pickups: Pickup[], px: number, pz: number, radius: number): Pickup[] {
  const got: Pickup[] = [];
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    if ((p.x - px) ** 2 + (p.z - pz) ** 2 <= radius * radius) { got.push(p); pickups.splice(i, 1); }
  }
  return got.reverse();
}
