// Dados vêm do banco (db/) via tools/db/export.ts — editar o seed, não este arquivo.
import { LAB_UPGRADES } from './generated/gamedata';
import type { LabUpgradeDef } from './types';
export { LAB_UPGRADES };
export const LAB_LIST: readonly LabUpgradeDef[] = Object.values(LAB_UPGRADES);
