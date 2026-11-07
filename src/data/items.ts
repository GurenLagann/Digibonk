// Dados vêm do banco (db/) via tools/db/export.ts — editar o seed, não este arquivo.
import { ITEMS } from './generated/gamedata';
import type { ItemDef } from './types';
export { ITEMS };
export const ITEM_LIST: readonly ItemDef[] = Object.values(ITEMS);
