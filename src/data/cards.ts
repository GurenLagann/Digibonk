import type { CardDef } from './types';

const list: CardDef[] = [
  { id: 'card_gatomon_claws', name: 'Garras do Gatomon', kind: 'passive', weight: 10, passive: { dmgMul: 0.15 } },
  { id: 'card_birdramon_wings', name: 'Asas do Birdramon', kind: 'passive', weight: 10, passive: { spd: 6 } },
  { id: 'card_hyper_speed', name: 'Hyper Speed', kind: 'passive', weight: 8, passive: { cdMul: 0.9 } },
  { id: 'card_data_magnet', name: 'Ímã de Dados', kind: 'passive', weight: 8, passive: { pickupMul: 1.5 } },
  { id: 'card_monzaemon_hug', name: 'Abraço do Monzaemon', kind: 'passive', weight: 10, passive: { hp: 40 } },
  { id: 'card_andromon_armor', name: 'Armadura do Andromon', kind: 'passive', weight: 10, passive: { def: 8 } },
  { id: 'card_wisemon_book', name: 'Livro do Wisemon', kind: 'passive', weight: 8, passive: { brain: 6, xpMul: 1.2 } },
  { id: 'card_greymon_horn', name: 'Chifre do Greymon', kind: 'passive', weight: 10, passive: { atk: 6 } },
  { id: 'card_lightning_paw', name: 'Slash: Lightning Paw', kind: 'slash', weight: 6, moveId: 'lightning_paw' },
  { id: 'card_diamond_storm', name: 'Slash: Diamond Storm', kind: 'slash', weight: 6, moveId: 'diamond_storm' },
  { id: 'card_hand_of_fate', name: 'Slash: Hand of Fate', kind: 'slash', weight: 5, moveId: 'hand_of_fate' },
  { id: 'card_howling_blaster', name: 'Slash: Howling Blaster', kind: 'slash', weight: 5, moveId: 'howling_blaster' },
  { id: 'card_super_shocker', name: 'Slash: Super Shocker', kind: 'slash', weight: 6, moveId: 'super_shocker' },
  { id: 'card_poison_ivy', name: 'Slash: Poison Ivy', kind: 'slash', weight: 6, moveId: 'poison_ivy' },
  { id: 'blue_card', name: 'Blue Card', kind: 'rare', weight: 1, forPartners: ['guilmon'] },
];
export const CARDS: Record<string, CardDef> = Object.fromEntries(list.map(c => [c.id, c]));
export const CARD_LIST: readonly CardDef[] = list;
