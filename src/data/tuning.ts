import type { Stage } from './types';

export const T = {
  PHASE_SECONDS: 600,
  PHASES: 5,
  MOVE_SLOTS: 4,
  PASSIVE_SLOTS: 3,
  MAX_ENEMIES: 600,
  STAGE_DMG: { child: 1, adult: 1.6, perfect: 2.4, ultimate: 3.5 } as Record<Stage, number>,
  STAT_OFFER_AMOUNT: 3,
  OFFERS_PER_LEVEL: 3,
  CARD_OFFER_CHANCE: 0.12,
  MAP_HALF: 100,
} as const;
