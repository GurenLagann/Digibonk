import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { T } from '../data/tuning';
import type { Stats } from '../data/types';
import type { MoveSlot, PlayerProg } from './progression';

export type EffStats = Stats & { dmgMul: number; pickupMul: number; xpMul: number; cdMul: number };

export function effectiveStats(p: PlayerProg): EffStats {
  const f = FORMS[p.formId];
  const lv = p.level - 1;
  const s: EffStats = {
    hp: f.baseStats.hp + f.growth.hp * lv + p.bonus.hp,
    atk: f.baseStats.atk + f.growth.atk * lv + p.bonus.atk,
    def: f.baseStats.def + f.growth.def * lv + p.bonus.def,
    spd: f.baseStats.spd + f.growth.spd * lv + p.bonus.spd,
    brain: f.baseStats.brain + f.growth.brain * lv + p.bonus.brain,
    dmgMul: 1, pickupMul: 1, xpMul: 1, cdMul: 1,
  };
  for (const id of p.passives) {
    const c = id ? CARDS[id]?.passive : undefined;
    if (!c) continue;
    s.hp += c.hp ?? 0; s.atk += c.atk ?? 0; s.def += c.def ?? 0; s.spd += c.spd ?? 0; s.brain += c.brain ?? 0;
    s.dmgMul += c.dmgMul ?? 0;
    s.pickupMul *= c.pickupMul ?? 1; s.xpMul *= c.xpMul ?? 1; s.cdMul *= c.cdMul ?? 1;
  }
  return s;
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
