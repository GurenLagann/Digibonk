import type { SheetOverride } from './slice.ts';

/** asset id no The Spriters Resource (Digimon World DS) de cada folha em assets-src/sprites/dwds */
export const SOURCES: Record<string, number> = {
  agumon: 48418, greymon: 48406, metalgreymon: 48322, wargreymon: 48613, omnimon: 48624, veemon: 48419, exveemon: 48586,
  flamedramon: 48588, paildramon: 48721, imperialdramon_fm: 48680, guilmon: 24505, growlmon: 20461, wargrowlmon: 48670,
  gallantmon: 48623, gabumon: 41249, wormmon: 48516, goblimon: 48522, tsukaimon: 48592, gotsumon: 48428, bakemon: 48533,
  guardromon: 48615, kuwagamon: 41254, ogremon: 48614, minotarumon: 48557, darktyrannomon: 41245, vilemon: 48620,
  ladydevimon: 48617, arukenimon: 48571, infermon: 48328, blackwargrowlmon: 48707, blackweregarurumon: 48678,
  devimon: 48593, etemon: 48430, myotismon: 48609, kimeramon: 48436, piedmon: 48435,
};

/** exceções conferidas na folha de conferência (assets-src/sprites/contact-*.png) */
const SWAP: SheetOverride = { roles: ['idle1', 'idle2', 'idle3', 'hurt', 'attack'] };
export const OVERRIDES: Record<string, SheetOverride> = {
  // folhas em que a 4ª pose é a de dano e a 5ª a de ataque
  ...Object.fromEntries(['agumon', 'bakemon', 'blackwargrowlmon', 'darktyrannomon', 'devimon', 'exveemon', 'gabumon', 'growlmon', 'guardromon',
    'imperialdramon_fm', 'infermon', 'ladydevimon', 'myotismon', 'omnimon', 'paildramon', 'vilemon', 'wargrowlmon', 'wormmon'].map(id => [id, SWAP])),
  // só 4 poses grandes na folha (2 parado, 2 ataque)
  goblimon: { count: 4, roles: ['idle1', 'idle2', 'attack', 'hurt'] },
  // selo "Ripped by RADSPYRO" é maior que uma pose
  metalgreymon: { ignore: [{ x: 195, y: 310, w: 110, h: 120 }] },
};
