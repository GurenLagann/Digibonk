// Dados vêm do banco (db/) via tools/db/export.ts — editar o seed, não este arquivo.
import { FORMS } from './generated/gamedata';
import type { FormDef } from './types';
export { FORMS };
export const FORM_LIST: readonly FormDef[] = Object.values(FORMS);
