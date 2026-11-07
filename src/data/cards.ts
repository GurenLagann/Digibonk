// Dados vêm do banco (db/) via tools/db/export.ts — editar o seed, não este arquivo.
import { CARDS } from './generated/gamedata';
import type { CardDef } from './types';
export { CARDS };
export const CARD_LIST: readonly CardDef[] = Object.values(CARDS);
/** nível máximo de uma carta (sobe pegando cópias na partida) */
export const CARD_MAX_LEVEL = 10;
