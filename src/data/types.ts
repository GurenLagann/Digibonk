export type StatKey = 'hp' | 'atk' | 'def' | 'spd' | 'brain';
export type Stats = Record<StatKey, number>;
export type Stage = 'child' | 'adult' | 'perfect' | 'ultimate';
export type Season = 'adventure' | 'adventure02' | 'tamers';
export type MovePattern = 'projectile' | 'area' | 'cone' | 'aura' | 'orbital' | 'beam';
export type AttributeId = 'vaccine' | 'data' | 'virus' | 'free';
export type ElementId = 'fire' | 'water' | 'plant' | 'ice' | 'electric' | 'earth' | 'wind' | 'light' | 'dark' | 'steel' | 'neutral';

export interface MoveDef {
  id: string; name: string; element: ElementId; pattern: MovePattern;
  /** uma frase em pt-BR sobre o que o golpe faz no jogo */
  description: string;
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
  /** vezes na partida em que o HP caiu abaixo de 25% (ramo sombrio) */
  minNearDeaths?: number;
}
export interface EvoEdge { to: string; req: EvoReq }
export interface FormDef {
  id: string; name: string; stage: Stage; line: string; attribute: AttributeId; element: ElementId;
  /** status no nível N = base × (1 + growthRate × (N − 1)) */
  baseStats: Stats; growthRate: number;
  signature: string;
  kit: string[];
  evolutions: EvoEdge[];
  size: number;
  color: number;
}
export interface PartnerDef { id: string; childForm: string; season: Season; starter: boolean }
export type CardKind = 'passive' | 'slash' | 'rare';
export type CardStat = StatKey | 'dmg' | 'pickup' | 'xp' | 'cooldown';
export interface CardBonus { stat: CardStat; basePct: number; perLevelPct: number }
export interface CardDef {
  id: string; name: string; kind: CardKind; weight: number;
  /** passivas: bônus em % = basePct + perLevelPct × (nível − 1), nível de 1 a CARD_MAX_LEVEL */
  bonuses: CardBonus[];
  moveId?: string;
  forPartners?: string[];
}
export interface ItemDef { id: string; name: string; kind: 'digiegg' | 'fusion' | 'egg'; forPartners?: string[]; unlockPartner?: string; requiresUnlocked?: string[] }
export interface EnemyDef { id: string; name: string; attribute: AttributeId; element: ElementId; hp: number; dmg: number; speed: number; xp: number; size: number; color: number; minPhase: number }
export interface BossDef { id: string; name: string; attribute: AttributeId; element: ElementId; phase: number; hp: number; dmg: number; speed: number; size: number; color: number; moves: string[] }
