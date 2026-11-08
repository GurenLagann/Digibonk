import type { AttributeId, ElementId } from '../data/types';
import { h } from './dom';

type Child = Node | string | null | undefined | false;

/** Uma cor por atributo (convenção Digimon: Vacina azul, Dados verde, Vírus roxo, Livre cinza) */
export const ATTR_COLORS: Record<AttributeId, string> = {
  vaccine: '#1f6bff', data: '#14a85c', virus: '#9b3cf0', free: '#6b7a90',
};
export const ATTR_NAMES: Record<AttributeId, string> = {
  vaccine: 'Vacina', data: 'Dados', virus: 'Vírus', free: 'Livre',
};
/** Uma cor por elemento */
export const ELEM_COLORS: Record<ElementId, string> = {
  fire: '#ff7a1a', water: '#1e7bff', plant: '#3cae3c', ice: '#7fe3ff', electric: '#ffd21f', earth: '#a8703a',
  wind: '#2fd3a6', light: '#ffe9a0', dark: '#5b2d9e', steel: '#8d9bb0', neutral: '#9aa3b2',
};
export const ELEM_NAMES: Record<ElementId, string> = {
  fire: 'Fogo', water: 'Água', plant: 'Planta', ice: 'Gelo', electric: 'Elétrico', earth: 'Terra',
  wind: 'Vento', light: 'Luz', dark: 'Trevas', steel: 'Aço', neutral: 'Neutro',
};

/** texto escuro sobre selos claros (Gelo, Elétrico, Luz), branco nos demais — contraste legível */
function chipInk(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = 0.2126 * lin(n >> 16 & 255) + 0.7152 * lin(n >> 8 & 255) + 0.0722 * lin(n & 255);
  return lum > 0.4 ? '#04203a' : '#ffffff';
}

/** selo (pílula) de atributo ou elemento; id desconhecido vira um selo neutro com o próprio id */
export function chip(kind: 'attr' | 'elem', id: string): HTMLSpanElement {
  const colors: Record<string, string> = kind === 'attr' ? ATTR_COLORS : ELEM_COLORS;
  const names: Record<string, string> = kind === 'attr' ? ATTR_NAMES : ELEM_NAMES;
  const bg = colors[id] ?? ELEM_COLORS.neutral;
  const el = h('span', { class: `b2-chip ${kind}`, 'data-id': id }, names[id] ?? id);
  el.style.background = bg;
  el.style.color = chipInk(bg);
  return el;
}

/** painel de vidro B2 (some `tick` na classe para o marcador tracejado) */
export function panel(...children: Child[]): HTMLDivElement {
  return h('div', { class: 'b2-panel' }, ...children);
}

/** botão pílula: laranja (principal) ou contorno ciano (secundário), com o selo da tecla de atalho */
export function btn(label: string, key: string | null, onClick: () => void, secondary = false): HTMLButtonElement {
  return h('button', { class: secondary ? 'b2-btn secondary' : 'b2-btn', type: 'button', onClick: () => onClick() },
    h('span', { class: 'b2-btn-label' }, label),
    key !== null && h('span', { class: 'b2-key' }, key));
}
