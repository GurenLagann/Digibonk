import type { Stage, StatKey } from './types';

export const T = {
  PHASE_SECONDS: 600,
  PHASES: 5,
  /** Digi Data por fase (sorteado entre os dois, limitado ao que ainda dá para revelar) */
  DIGIDATA_PER_PHASE_MIN: 1,
  DIGIDATA_PER_PHASE_MAX: 2,
  MOVE_SLOTS: 4,
  PASSIVE_SLOTS: 3,
  MAX_ENEMIES: 600,
  STAGE_DMG: { child: 1, adult: 1.6, perfect: 2.4, ultimate: 3.5 } as Record<Stage, number>,
  STAT_OFFER_AMOUNT: 3,
  /** raridade das cartas de level up: chance (peso), +status, +níveis de golpe e nível inicial de carta passiva */
  RARITY: {
    weight: { common: 60, uncommon: 26, rare: 11, legendary: 3 },
    statAmount: { common: 3, uncommon: 5, rare: 6, legendary: 9 },
    upgradeLevels: { common: 1, uncommon: 1, rare: 2, legendary: 2 },
    cardStartLevel: { common: 1, uncommon: 1, rare: 2, legendary: 3 },
  },
  /** Zona Digital (Distorção): portal do guardião, arena separada, ondas e Alfa */
  ZONE: {
    PORTAL_SECONDS: 30, ENTER_RADIUS: 1.8, CENTER: { x: 400, z: 0 }, RADIUS: 22,
    WAVES: 4, WAVE_BASE: 8, WAVE_GROWTH: 4, WAVE_SECONDS: 15,
    ALPHA_SECONDS: 60, ALPHA_HP: 10, ALPHA_DMG: 1.5, ALPHA_SIZE: 1.5,
  },
  /** Maturidade (ficar na forma atual de vez): +12% de dano e de Vida máxima */
  MATURITY_BONUS: 0.12,
  /** usos por partida na tela de level up (o Laboratório vai aumentar depois) */
  LEVEL_TOOLS: { reroll: 2, skip: 2, ban: 1 },
  /** nível infinito: ganho automático por nível quando não há mais nada para melhorar (1/3 da oferta de status) */
  AUTO_GAIN: { hp: 3, atk: 1, def: 1, spd: 1, brain: 1 } as Record<StatKey, number>,
  OFFERS_PER_LEVEL: 3,
  CARD_OFFER_CHANCE: 0.12,
  MAP_HALF: 100,
} as const;
