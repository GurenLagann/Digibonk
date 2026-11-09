// Dados vêm do banco (db/) via tools/db/export.ts — editar o seed, não este arquivo.
import { RELICS } from './generated/gamedata';
import type { RelicDef, RelicEffect } from './types';
export { RELICS };
export const RELIC_LIST: readonly RelicDef[] = Object.values(RELICS);
export const RELIC_EFFECTS: readonly RelicEffect[] = ['regen', 'pickup', 'xp', 'elite', 'revive', 'digidata'];
