// Dados vêm do banco (db/) via tools/db/export.ts — editar o seed, não este arquivo.
import { MOVES } from './generated/gamedata';
import type { MoveDef } from './types';
export { MOVES };
export const MOVE_LIST: readonly MoveDef[] = Object.values(MOVES);
