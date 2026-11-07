import type { ItemDef } from './types';

const list: ItemDef[] = [
  { id: 'digiegg_courage', name: 'Digiovo da Coragem', kind: 'digiegg', forPartners: ['veemon'] },
  { id: 'digiegg_friendship', name: 'Digiovo da Amizade', kind: 'digiegg', forPartners: ['veemon'] },
  { id: 'fusion_garurumon', name: 'Dados de Fusão: MetalGarurumon', kind: 'fusion', forPartners: ['agumon'], requiresUnlocked: ['gabumon'] },
  { id: 'fusion_stingmon', name: 'Dados de Fusão: Stingmon', kind: 'fusion', forPartners: ['veemon'], requiresUnlocked: ['wormmon'] },
  { id: 'egg_gabumon', name: 'Ovo do Gabumon', kind: 'egg', unlockPartner: 'gabumon' },
  { id: 'egg_wormmon', name: 'Ovo do Wormmon', kind: 'egg', unlockPartner: 'wormmon' },
];
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(list.map(i => [i.id, i]));
export const ITEM_LIST: readonly ItemDef[] = list;
