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
  /** nível infinito: ganho automático por nível quando não há mais nada para melhorar (1/3 da oferta de status) */
  AUTO_GAIN: { hp: 3, atk: 1, def: 1, spd: 1, brain: 1 } as Record<StatKey, number>,
  OFFERS_PER_LEVEL: 3,
  CARD_OFFER_CHANCE: 0.12,
  MAP_HALF: 100,
} as const;
