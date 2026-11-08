// @vitest-environment happy-dom
import { reqText, showPartnerSelect } from '../../src/ui/partnerSelect';
import { defaultSave } from '../../src/core/save';
import { PARTNERS } from '../../src/data/partners';
import { FORMS } from '../../src/data/forms';
import { MOVES } from '../../src/data/moves';
import type { Input } from '../../src/core/input';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);
const SEASONS = ['adventure', 'adventure02', 'tamers'];
const ordered = SEASONS.flatMap(s => PARTNERS.filter(p => p.season === s));

function setup(mode: 'pick' | 'view' = 'pick', unlockedIds: string[] = ['agumon']) {
  const picked: string[] = [];
  const list = ordered.map(p => ({ id: p.id, childForm: p.childForm, season: p.season, locked: !unlockedIds.includes(p.id) }));
  const app = { partners: () => list, pickPartner: (id: string) => { picked.push(id); return true; }, go: () => {} };
  const save = defaultSave();
  const root = document.createElement('div');
  let back = 0;
  const m = showPartnerSelect(root, app as never, save, { mode, back: () => { back++; } });
  return { root, m, picked, save, back: () => back, detail: () => root.querySelector('.ps-detail')!.textContent ?? '' };
}

test('grade mostra os 11 parceiros pela forma Child, em ordem de temporada; bloqueados com ??? e silhueta', () => {
  const { root } = setup('pick', ['agumon', 'gabumon']);
  const cells = [...root.querySelectorAll('.ps-cell')];
  expect(cells.length).toBe(PARTNERS.length);
  expect(cells[0].textContent).toContain(FORMS[ordered[0].childForm].name);
  const locked = cells.filter(c => c.textContent!.includes('???'));
  expect(locked.length).toBe(PARTNERS.length - 2);
  expect(locked[0].querySelector('canvas')).toBeTruthy();
});

test('detalhe do selecionado: estágio, temporada, selos, 5 barras, assinatura, kit com descrição, evolução, recordes; sem linha evolutiva', () => {
  const { root, detail } = setup();
  const f = FORMS[ordered[0].childForm];
  const d = detail();
  expect(d).toContain(f.name);
  expect(d).toContain('Child');
  expect(d).toContain('Digimon Adventure');
  expect(root.querySelectorAll('.ps-detail .b2-chip').length).toBe(2);
  expect(root.querySelectorAll('.ps-detail .b2-bar').length).toBe(5);
  expect(d).toContain(String(f.baseStats.hp));
  expect(d).toContain(MOVES[f.signature].name);
  expect(d).toContain(MOVES[f.signature].description);
  for (const k of f.kit) { expect(d).toContain(MOVES[k].name); expect(d).toContain(MOVES[k].description); }
  const e = f.evolutions[0];
  expect(d).toContain(FORMS[e.to].name + ' · Nv ' + e.req.minLevel);
  expect(d).toContain('Partidas');
  expect(d).toContain('Vitórias');
  expect(d).toContain('Melhor fase');
  expect(d).not.toContain('Linha evolutiva');
});

test('bloqueado selecionado: ??? e dica; confirm não escolhe', () => {
  const { m, picked, detail } = setup();
  m.handle(press('right'));
  expect(detail()).toContain('???');
  expect(detail()).toContain('Encontre o ovo deste Digimon nas fases');
  m.handle(press('confirm'));
  expect(picked).toEqual([]);
});

test('setas navegam na grade de 4 colunas com limite; confirm escolhe liberado; cancel e pause voltam', () => {
  const ids = ordered.map(p => p.id);
  const { m, picked, back, root } = setup('pick', ids);
  m.handle(press('left')); m.handle(press('up'));
  m.handle(press('right'));
  expect(root.querySelectorAll('.ps-cell')[1].classList.contains('b2-sel')).toBe(true);
  m.handle(press('down'));
  expect(root.querySelectorAll('.ps-cell')[5].classList.contains('b2-sel')).toBe(true);
  for (let i = 0; i < 5; i++) m.handle(press('down'));
  expect(root.querySelectorAll('.ps-cell')[ids.length - 1].classList.contains('b2-sel') || root.querySelectorAll('.ps-cell')[9].classList.contains('b2-sel')).toBe(true);
  m.handle(press('cancel')); expect(back()).toBe(1);
  const m2 = setup('pick', ids);
  m2.m.handle(press('down')); m2.m.handle(press('confirm'));
  expect(m2.picked).toEqual([ids[4]]);
  const m3 = setup(); m3.m.handle(press('pause')); expect(m3.back()).toBe(1);
  expect(picked).toEqual([]);
});

test('mode view: sem botão Escolher e confirm não escolhe', () => {
  const v = setup('view');
  expect(v.root.textContent).not.toContain('Escolher parceiro!');
  v.m.handle(press('confirm'));
  expect(v.picked).toEqual([]);
  expect(setup('pick').root.textContent).toContain('Escolher parceiro!');
});

test('pick: clique numa célula não selecionada só seleciona; clicar de novo confirma', () => {
  const ids = ordered.map(p => p.id);
  const { root, picked } = setup('pick', ids);
  const cells = root.querySelectorAll<HTMLElement>('.ps-cell');
  cells[2].click();
  expect(picked).toEqual([]); expect(cells[2].classList.contains('b2-sel')).toBe(true);
  cells[2].click(); expect(picked).toEqual([ids[2]]);
});

test('requisitos nomeiam itens e parceiros liberados', () => {
  const { root } = setup('pick', ordered.map(p => p.id));
  const vee = root.querySelector<HTMLElement>('.ps-cell[data-partner="' + ordered.find(p => p.childForm === 'veemon')!.id + '"]')!;
  vee.dispatchEvent(new Event('mouseenter'));
  const d = root.querySelector('.ps-detail')!.textContent!;
  expect(d).toContain('Flamedramon · Nv 5 e Digiovo da Coragem');
  expect(d).toContain('Raidramon · Nv 5 e Digiovo da Amizade');
  expect(reqText({ minLevel: 42, items: ['fusion_garurumon'], unlocked: ['gabumon'] })).toContain('com Gabumon liberado');
});
