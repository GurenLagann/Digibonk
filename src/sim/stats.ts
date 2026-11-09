import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { T } from '../data/tuning';
import { ATTRIBUTE_CHART, ELEMENT_CHART } from '../data/typing';
import type { AttributeId, CardStat, ElementId, StatKey, Stats } from '../data/types';
import type { MoveSlot, PlayerProg } from './progression';

export type EffStats = Stats & { dmgMul: number; pickupMul: number; xpMul: number; cdMul: number };

/** status no nível: base × (1 + taxa × (nível − 1)) — 0,5% do base por nível, sem composição */
export const statAt = (base: number, rate: number, level: number) => base * (1 + rate * (level - 1));

/** bônus em % de uma carta passiva para um status, no nível da carta */
export function cardBonusPct(cardId: string, stat: CardStat, level: number): number {
  const b = CARDS[cardId]?.bonuses.find(x => x.stat === stat);
  return b ? b.basePct + b.perLevelPct * (level - 1) : 0;
}

/** vantagem de tipagem: atributo do atacante × elemento do golpe contra atributo/elemento do alvo */
export function typeMultiplier(atkAttr: AttributeId, atkElem: ElementId, defAttr: AttributeId, defElem: ElementId): number {
  return (ATTRIBUTE_CHART[atkAttr]?.[defAttr] ?? 1) * (ELEMENT_CHART[atkElem]?.[defElem] ?? 1);
}

export function effectiveStats(p: PlayerProg): EffStats {
  const f = FORMS[p.formId];
  const pct: Record<CardStat, number> = { hp: 0, atk: 0, def: 0, spd: 0, brain: 0, dmg: 0, pickup: 0, xp: 0, cooldown: 0 };
  for (const id of p.passives) {
    if (!id) continue;
    const level = p.cardLevels[id] ?? 1;
    for (const b of CARDS[id]?.bonuses ?? []) pct[b.stat] += b.basePct + b.perLevelPct * (level - 1);
  }
  const stat = (k: StatKey) => (statAt(f.baseStats[k], f.growthRate, p.level) + p.bonus[k]) * (1 + pct[k] / 100);
  const mat = p.matured ? 1 + T.MATURITY_BONUS : 1;
  return {
    hp: stat('hp') * mat, atk: stat('atk'), def: stat('def'), spd: stat('spd'), brain: stat('brain'),
    dmgMul: (1 + pct.dmg / 100) * mat, pickupMul: 1 + pct.pickup / 100, xpMul: 1 + pct.xp / 100, cdMul: 1 + pct.cooldown / 100,
  };
}

export function outgoingDamage(p: PlayerProg, slot: MoveSlot): number {
  const m = MOVES[slot.moveId];
  const s = effectiveStats(p);
  return m.damage * m.perLevel.damage ** (slot.level - 1) * T.STAGE_DMG[FORMS[p.formId].stage] * (s.atk / 10) * s.dmgMul;
}

export const incomingDamage = (raw: number, def: number) => (raw * 100) / (100 + def * 5);

export function moveCooldown(p: PlayerProg, slot: MoveSlot): number {
  const m = MOVES[slot.moveId];
  const s = effectiveStats(p);
  return (m.cooldown * m.perLevel.cooldown ** (slot.level - 1) * s.cdMul) / (1 + s.brain * 0.01);
}
