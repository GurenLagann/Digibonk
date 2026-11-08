// @vitest-environment happy-dom
import { ATTR_COLORS, ATTR_NAMES, btn, chip, ELEM_COLORS, ELEM_NAMES, panel } from '../../src/ui/theme';
import { portrait, setPortraitSource } from '../../src/ui/portrait';
import type { AttributeId, ElementId } from '../../src/data/types';

const ATTRS: AttributeId[] = ['vaccine', 'data', 'virus', 'free'];
const ELEMS: ElementId[] = ['fire', 'water', 'plant', 'ice', 'electric', 'earth', 'wind', 'light', 'dark', 'steel', 'neutral'];

/** happy-dom normaliza cores; compara convertendo o hex esperado do mesmo jeito */
const norm = (c: string) => { const d = document.createElement('i'); d.style.background = c; return d.style.background; };

test('chip de atributo: nome em pt-BR e cor do atributo', () => {
  const c = chip('attr', 'vaccine');
  expect(c.tagName).toBe('SPAN');
  expect(c.textContent).toBe('Vacina');
  expect(c.classList.contains('b2-chip')).toBe(true);
  expect(c.style.background).toBe(norm(ATTR_COLORS.vaccine));
});

test('chip de elemento usa nome e cor do elemento', () => {
  const c = chip('elem', 'fire');
  expect(c.textContent).toBe('Fogo');
  expect(c.style.background).toBe(norm(ELEM_COLORS.fire));
});

test('todo atributo e elemento tem cor e nome', () => {
  for (const a of ATTRS) { expect(ATTR_COLORS[a]).toMatch(/^#[0-9a-f]{6}$/i); expect(ATTR_NAMES[a]).toBeTruthy(); }
  for (const e of ELEMS) { expect(ELEM_COLORS[e]).toMatch(/^#[0-9a-f]{6}$/i); expect(ELEM_NAMES[e]).toBeTruthy(); }
  expect(Object.values(ATTR_NAMES)).toEqual(['Vacina', 'Dados', 'Vírus', 'Livre']);
  expect(Object.values(ELEM_NAMES)).toEqual(['Fogo', 'Água', 'Planta', 'Gelo', 'Elétrico', 'Terra', 'Vento', 'Luz', 'Trevas', 'Aço', 'Neutro']);
});

test('btn mostra o selo da tecla e chama a ação no clique', () => {
  const fn = vi.fn();
  const b = btn('Jogar', 'Enter', fn);
  expect(b.tagName).toBe('BUTTON');
  expect(b.classList.contains('b2-btn')).toBe(true);
  expect(b.classList.contains('secondary')).toBe(false);
  expect(b.querySelector('.b2-key')?.textContent).toBe('Enter');
  expect(b.textContent).toContain('Jogar');
  b.click();
  expect(fn).toHaveBeenCalledTimes(1);
});

test('btn secundário e sem tecla', () => {
  const b = btn('Voltar', null, () => {}, true);
  expect(b.classList.contains('secondary')).toBe(true);
  expect(b.querySelector('.b2-key')).toBeNull();
});

test('panel junta os filhos num .b2-panel', () => {
  const p = panel('olá', document.createElement('b'));
  expect(p.classList.contains('b2-panel')).toBe(true);
  expect(p.childNodes.length).toBe(2);
});

test('portrait sem fonte não lança erro e marca a forma', () => {
  setPortraitSource(null);
  let c!: HTMLCanvasElement;
  expect(() => { c = portrait('omnimon'); }).not.toThrow();
  expect(c.tagName).toBe('CANVAS');
  expect(c.getAttribute('data-form')).toBe('omnimon');
  expect(c.width).toBe(64);
  expect(() => portrait('omnimon', { size: 96, silhouette: true })).not.toThrow();
  expect(() => portrait('nao-existe')).not.toThrow();
});

test('portrait com fonte sem imagem carregada cai no placeholder sem erro', () => {
  const lib = { info: () => ({ file: 'x.png', frameW: 32, frameH: 32, frames: ['idle1'], source: 0 }), image: () => null };
  setPortraitSource(lib as never);
  expect(() => portrait('agumon', { size: 48 })).not.toThrow();
  setPortraitSource(null);
});
