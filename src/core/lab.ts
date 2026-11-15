import type { SaveData } from './save';
import { LAB_UPGRADES, LAB_LIST } from '../data/lab';

/** nível comprado de um upgrade do Laboratório (0 = nenhum) */
export function labLevel(save: SaveData, id: string): number {
  return Object.hasOwn(save.lab, id) ? save.lab[id] : 0;
}

/** preço do próximo nível; null = no máximo (ou id desconhecido) */
export function nextLabCost(save: SaveData, id: string): number | null {
  if (!Object.hasOwn(LAB_UPGRADES, id)) return null;
  const def = LAB_UPGRADES[id];
  return def.costs[labLevel(save, id)] ?? null;
}

/** compra 1 nível com Cristais; não grava no storage (quem chama faz storeSave) */
export function buyLab(save: SaveData, id: string): boolean {
  const cost = nextLabCost(save, id);
  if (cost === null || save.currency < cost) return false;
  save.currency -= cost;
  save.lab[id] = labLevel(save, id) + 1;
  return true;
}

export function labBonuses(save: SaveData): { reroll: number; skip: number; ban: number; extraOffers: number } {
  const b = { reroll: 0, skip: 0, ban: 0, extraOffers: 0 };
  for (const def of LAB_LIST) {
    const lv = labLevel(save, def.id);
    if (def.effect === 'offer') b.extraOffers += lv; else b[def.effect] += lv;
  }
  return b;
}
