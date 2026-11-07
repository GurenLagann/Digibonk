export type StatKey = 'hp' | 'atk' | 'def' | 'spd' | 'brain';
export type Stats = Record<StatKey, number>;
export type Stage = 'child' | 'adult' | 'perfect' | 'ultimate';
export type Season = 'adventure' | 'adventure02' | 'tamers';
export type MovePattern = 'projectile' | 'area' | 'cone' | 'aura' | 'orbital' | 'beam';

export interface MoveDef {
  id: string; name: string; pattern: MovePattern;
  damage: number; cooldown: number; range: number;
  radius?: number; count?: number; pierce?: number; speed?: number; duration?: number;
  maxLevel: number;
  perLevel: { damage: number; cooldown: number };
  color: number;
}
export interface EvoReq {
  minLevel: number;
  minStats?: Partial<Stats>;
  items?: string[];
  unlocked?: string[];
  minPhase?: number;
  minKills?: number;
}
export interface EvoEdge { to: string; req: EvoReq }
export interface FormDef {
  id: string; name: string; stage: Stage; line: string;
  baseStats: Stats; growth: Stats;
  signature: string;
  kit: string[];
  evolutions: EvoEdge[];
  size: number;
  color: number;
}
export interface PartnerDef { id: string; childForm: string; season: Season; starter: boolean }
export type CardKind = 'passive' | 'slash' | 'rare';
export interface CardDef {
  id: string; name: string; kind: CardKind; weight: number;
  passive?: Partial<Stats> & { dmgMul?: number; pickupMul?: number; xpMul?: number; cdMul?: number };
  moveId?: string;
  forPartners?: string[];
}
export interface ItemDef { id: string; name: string; kind: 'digiegg' | 'fusion' | 'egg'; forPartners?: string[]; unlockPartner?: string; requiresUnlocked?: string[] }
export interface EnemyDef { id: string; name: string; hp: number; dmg: number; speed: number; xp: number; size: number; color: number; minPhase: number }
export interface BossDef { id: string; name: string; phase: number; hp: number; dmg: number; speed: number; size: number; color: number; moves: string[] }
