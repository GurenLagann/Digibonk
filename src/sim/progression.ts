import type { Rng } from '../core/rng';
import { CARD_LIST } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { T } from '../data/tuning';
import type { StatKey, Stats } from '../data/types';

export interface MoveSlot {
  moveId: string; level: number; fromCard: boolean;
  /** Jogress: segundo golpe que divide este espaço (dispara junto, com bônus de dano) */
  jogress?: { moveId: string; level: number };
}
export interface PlayerProg {
  formId: string; level: number; xp: number; bonus: Stats;
  slots: (MoveSlot | null)[]; passives: (string | null)[]; items: string[];
  pendingLevelUps: number; kills: number; path: string[];
  /** nível do jogador ao entrar em cada forma de `path` (paralelo; [0] = 1) */
  pathLevels: number[];
  /** nível de cada carta equipada (ausente = 1); sobe pegando cópias, até CARD_MAX_LEVEL */
  cardLevels: Record<string, number>;
  /** vezes em que o HP caiu abaixo de NEAR_DEATH_PCT; só volta a contar depois de curar acima de NEAR_DEATH_REARM */
  nearDeaths: number; nearDeathArmed: boolean;
  /** Maturidade: escolheu ficar nesta forma pelo resto da partida (bônus em stats.ts, sem evoluções) */
  matured: boolean;
  /** relíquias da Zona Digital equipadas (até 3; efeitos em sim/relics.ts) */
  relics: string[];
}
export const RARITIES = ['common', 'uncommon', 'rare', 'legendary'] as const;
export type Rarity = typeof RARITIES[number];
export type LevelOffer =
  | { kind: 'learn'; moveId: string; rarity?: undefined }
  | { kind: 'upgrade'; slot: number; rarity?: Rarity }
  | { kind: 'stat'; stat: StatKey; amount: number; rarity?: Rarity }
  | { kind: 'card'; cardId: string; rarity?: Rarity };

/** identidade da oferta para banir: o golpe, o status ou a carta (não a raridade) */
export function offerKey(p: PlayerProg, o: LevelOffer): string {
  switch (o.kind) {
    case 'learn': return `learn:${o.moveId}`;
    case 'upgrade': return `upgrade:${p.slots[o.slot]?.moveId ?? o.slot}`;
    case 'stat': return `stat:${o.stat}`;
    case 'card': return `card:${o.cardId}`;
  }
}

function rollRarity(rng: Rng): Rarity { return rng.weighted([...RARITIES], r => T.RARITY.weight[r]); }

export const STAT_KEYS: readonly StatKey[] = ['hp', 'atk', 'def', 'spd', 'brain'];

export function newPlayerProg(formId: string): PlayerProg {
  const f = FORMS[formId];
  if (!f) throw new Error(`unknown form ${formId}`);
  const slots: (MoveSlot | null)[] = Array.from({ length: T.MOVE_SLOTS }, () => null);
  slots[0] = { moveId: f.signature, level: 1, fromCard: false };
  return {
    formId, level: 1, xp: 0, bonus: { hp: 0, atk: 0, def: 0, spd: 0, brain: 0 },
    slots, passives: Array.from({ length: T.PASSIVE_SLOTS }, () => null), items: [],
    pendingLevelUps: 0, kills: 0, path: [formId], pathLevels: [1], cardLevels: {},
    nearDeaths: 0, nearDeathArmed: true, matured: false, relics: [],
  };
}

export const NEAR_DEATH_PCT = 0.25, NEAR_DEATH_REARM = 0.5;

/** conta uma "quase-morte" quando o HP (vivo) cai abaixo de 25%; rearma ao voltar a 50%. Devolve true ao contar. */
export function trackNearDeath(p: PlayerProg, hp: number, maxHp: number): boolean {
  if (hp >= maxHp * NEAR_DEATH_REARM) { p.nearDeathArmed = true; return false; }
  if (hp > 0 && hp < maxHp * NEAR_DEATH_PCT && p.nearDeathArmed) { p.nearDeathArmed = false; p.nearDeaths++; return true; }
  return false;
}

export const xpToNext = (level: number) => Math.round(5 + level * 4 + level ** 1.6);

export function addXp(p: PlayerProg, amount: number): number {
  p.xp += amount;
  let gained = 0;
  while (p.xp >= xpToNext(p.level)) { p.xp -= xpToNext(p.level); p.level++; gained++; }
  p.pendingLevelUps += gained;
  return gained;
}

/** golpes todos no máximo, sem espaço livre de golpe nem de carta: a subida de nível não tem escolha que valha a tela */
export function nothingToImprove(p: PlayerProg): boolean {
  if (p.passives.some(c => c === null)) return false;
  if (p.slots.some(s => s === null)) return false;
  return p.slots.every(s => s!.level >= MOVES[s!.moveId].maxLevel);
}

/** nível infinito: aplica um ganho pequeno num status sorteado e consome um nível pendente */
export function autoGain(p: PlayerProg, rng: Rng): { stat: StatKey; amount: number } {
  const stat = rng.pick(STAT_KEYS), amount = T.AUTO_GAIN[stat];
  p.bonus[stat] += amount;
  if (p.pendingLevelUps > 0) p.pendingLevelUps--;
  return { stat, amount };
}

/** sorteia as ofertas do level up; `exclude` = chaves (offerKey) banidas ou já na mesa */
export function rollOffers(p: PlayerProg, rng: Rng, exclude: ReadonlySet<string> = new Set()): LevelOffer[] {
  const ok = (o: LevelOffer) => !exclude.has(offerKey(p, o));
  const f = FORMS[p.formId];
  const pool: LevelOffer[] = [];
  const slotted = new Set(p.slots.filter(Boolean).map(s => s!.moveId));
  if (p.slots.some(s => s === null)) for (const m of f.kit) if (!slotted.has(m)) pool.push({ kind: 'learn', moveId: m });
  p.slots.forEach((s, i) => { if (s && s.level < MOVES[s.moveId].maxLevel) pool.push({ kind: 'upgrade', slot: i }); });
  const out: LevelOffer[] = [];
  if (p.passives.some(c => c === null) && rng.next() < T.CARD_OFFER_CHANCE) {
    const cards = CARD_LIST.filter(c => c.kind === 'passive' && !p.passives.includes(c.id) && !exclude.has(`card:${c.id}`));
    if (cards.length) out.push({ kind: 'card', cardId: rng.weighted(cards, c => c.weight).id });
  }
  const stats = STAT_KEYS.map(stat => ({ kind: 'stat', stat, amount: T.STAT_OFFER_AMOUNT }) as LevelOffer).filter(ok);
  // shuffle pool then fill; stats always available as candidates (lower priority)
  const shuffled = pool.filter(ok);
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  const statShuffled = [...stats];
  for (let i = statShuffled.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [statShuffled[i], statShuffled[j]] = [statShuffled[j], statShuffled[i]]; }
  // one stat slot is always mixed in when pool is rich, so stat growth stays available
  const want = T.OFFERS_PER_LEVEL;
  const fromPool = Math.min(shuffled.length, want - out.length - (shuffled.length >= want ? 1 : 0));
  out.push(...shuffled.slice(0, Math.max(0, fromPool)));
  for (const s of statShuffled) { if (out.length >= want) break; out.push(s); }
  // raridade: golpe novo não tem; status ganha a quantidade da raridade
  return out.slice(0, want).map(o => {
    if (o.kind === 'learn') return o;
    const rarity = rollRarity(rng);
    return o.kind === 'stat' ? { ...o, rarity, amount: T.RARITY.statAmount[rarity] } : { ...o, rarity };
  });
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
      if (s) s.level = Math.min(MOVES[s.moveId].maxLevel, s.level + T.RARITY.upgradeLevels[o.rarity ?? 'common']);
      break;
    }
    case 'stat': p.bonus[o.stat] += o.amount; break;
    case 'card': {
      const i = p.passives.findIndex(c => c === null);
      if (i >= 0) {
        p.passives[i] = o.cardId;
        const lv = T.RARITY.cardStartLevel[o.rarity ?? 'common'];
        if (lv > 1) p.cardLevels[o.cardId] = lv;
      }
      break;
    }
  }
  if (p.pendingLevelUps > 0) p.pendingLevelUps--;
}
