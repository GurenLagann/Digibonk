import type { BossDef, EnemyDef } from './types';

export const ENEMIES: EnemyDef[] = [
  { id: 'snowgoblimon', name: 'Snow Goblimon', hp: 12, dmg: 6, speed: 2.6, xp: 1, size: 0.9, color: 0x8ac24a, minPhase: 1 },
  { id: 'hagurumon', name: 'Hagurumon', hp: 10, dmg: 5, speed: 3.2, xp: 1, size: 0.9, color: 0x9a9aa8, minPhase: 1 },
  { id: 'gazimon', name: 'Gazimon', hp: 20, dmg: 7, speed: 2.0, xp: 2, size: 0.9, color: 0x9b8b7a, minPhase: 1 },
  { id: 'bakemon', name: 'Bakemon', hp: 18, dmg: 8, speed: 3.0, xp: 2, size: 1.1, color: 0xe8e8f0, minPhase: 2 },
  { id: 'guardromon', name: 'Guardromon', hp: 45, dmg: 10, speed: 1.6, xp: 4, size: 1.3, color: 0x5a6a4a, minPhase: 2 },
  { id: 'kuwagamon', name: 'Kuwagamon', hp: 40, dmg: 12, speed: 3.4, xp: 4, size: 1.4, color: 0xc0302a, minPhase: 3 },
  { id: 'ogremon', name: 'Ogremon', hp: 60, dmg: 14, speed: 2.4, xp: 5, size: 1.4, color: 0x4a8a3a, minPhase: 3 },
  { id: 'snimon', name: 'Snimon', hp: 50, dmg: 14, speed: 3.8, xp: 5, size: 1.4, color: 0x7ad25a, minPhase: 4 },
  { id: 'darktyrannomon', name: 'DarkTyrannomon', hp: 90, dmg: 18, speed: 2.4, xp: 8, size: 1.7, color: 0x3a3a5a, minPhase: 4 },
  { id: 'devidramon', name: 'Devidramon', hp: 40, dmg: 16, speed: 4.2, xp: 6, size: 1.1, color: 0x6a3a8a, minPhase: 5 },
];

export const MINIBOSSES: EnemyDef[] = [
  { id: 'ladydevimon', name: 'LadyDevimon', hp: 600, dmg: 20, speed: 3.0, xp: 40, size: 2.2, color: 0xe8b23a, minPhase: 2 },
  { id: 'arukenimon', name: 'Arukenimon', hp: 800, dmg: 24, speed: 2.8, xp: 50, size: 2.2, color: 0x5a8ae8, minPhase: 2 },
  { id: 'skullgreymon', name: 'SkullGreymon', hp: 1000, dmg: 28, speed: 3.0, xp: 60, size: 2.2, color: 0xa86ae8, minPhase: 3 },
  { id: 'blackwargrowlmon', name: 'BlackWarGrowlmon', hp: 1200, dmg: 30, speed: 3.2, xp: 70, size: 2.2, color: 0xe86a8a, minPhase: 4 },
  { id: 'blackweregarurumon', name: 'BlackWereGarurumon', hp: 1400, dmg: 32, speed: 3.6, xp: 80, size: 2.0, color: 0xe8e86a, minPhase: 4 },
];

export const BOSSES: BossDef[] = [
  { id: 'devimon', name: 'Devimon', phase: 1, hp: 1500, dmg: 20, speed: 2.6, size: 2.8, color: 0x3a2a4a, moves: ['touch_of_evil'] },
  { id: 'etemon', name: 'Etemon', phase: 2, hp: 3500, dmg: 26, speed: 2.4, size: 2.8, color: 0xc8a06a, moves: ['dark_network'] },
  { id: 'myotismon', name: 'Myotismon', phase: 3, hp: 7000, dmg: 32, speed: 2.8, size: 3.0, color: 0x5a2a6a, moves: ['crimson_lightning'] },
  { id: 'kimeramon', name: 'Kimeramon', phase: 4, hp: 12000, dmg: 40, speed: 2.4, size: 3.4, color: 0xd8c8a0, moves: ['heat_viper'] },
  { id: 'piedmon', name: 'Piedmon', phase: 5, hp: 20000, dmg: 48, speed: 3.0, size: 3.0, color: 0xe8e8e8, moves: ['trump_sword'] },
];
