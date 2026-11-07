import type { PartnerDef } from './types';

export const PARTNERS: PartnerDef[] = [
  { id: 'agumon', childForm: 'agumon', season: 'adventure', starter: true },
  { id: 'gabumon', childForm: 'gabumon', season: 'adventure', starter: false },
  { id: 'veemon', childForm: 'veemon', season: 'adventure02', starter: true },
  { id: 'wormmon', childForm: 'wormmon', season: 'adventure02', starter: false },
  { id: 'guilmon', childForm: 'guilmon', season: 'tamers', starter: true },
];
export const SEASON_NAMES = { adventure: 'Digimon Adventure', adventure02: 'Digimon Adventure 02', tamers: 'Digimon Tamers' } as const;
