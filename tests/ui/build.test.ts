// @vitest-environment happy-dom
import { defaultSave, SAVE_KEY } from '../../src/core/save';
import type { Input } from '../../src/core/input';
import { CARD_LIST } from '../../src/data/cards';
import { discover, reveal } from '../../src/sim/discovery';
import { lineMoves } from '../../src/sim/build';
import { activeModal } from '../../src/ui/modal';
import { showBuild } from '../../src/ui/build';
import { fakeStorage } from '../helpers';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);
function setup(save = defaultSave()) {
  const storage = fakeStorage({}); const root = document.createElement('div'); let back = 0;
  const m = showBuild(root, save, 'agumon', () => { back++; }, storage);
  return { root, m, save, storage, back: () => back };
}
beforeEach(() => { activeModal()?.close(); });

test('lista golpes da linha e cartas passivas; golpe de forma não descoberta fica ???', () => {
  const { root } = setup();
  const rows = [...root.querySelectorAll('[data-key]')].map(e => e.getAttribute('data-key'));
  expect(rows).toContain('move:baby_flame');
  expect(rows).toContain(`card:${CARD_LIST.find(c => c.kind === 'passive')!.id}`);
  const greyMove = lineMoves('agumon').find(m => m.from === 'greymon')!;
  const el = root.querySelector(`[data-key="move:${greyMove.moveId}"]`)!;
  expect(el.textContent).toContain('???');
  expect(el.classList.contains('locked')).toBe(true);
});
test('clicar alterna nada → ★ → ✕ e atualiza o contador', () => {
  const { root, save } = setup();
  const el = () => root.querySelector<HTMLElement>('[data-key="move:sharp_claws"]')!;
  el().click(); expect(save.builds.agumon.fav).toEqual(['move:sharp_claws']);
  expect(root.querySelector('.bd-count')!.textContent).toContain('★ 1/4');
  el().click(); expect(save.builds.agumon.ban).toEqual(['move:sharp_claws']);
});
test('caminho: escolhe passo descoberto e limpa', () => {
  const save = defaultSave(); discover(save, 'agumon->greymon');
  const { root } = setup(save);
  root.querySelector<HTMLElement>('[data-step="greymon"]')!.click();
  expect(save.builds.agumon.path).toEqual(['agumon', 'greymon']);
  root.querySelector<HTMLElement>('.bd-path-clear')!.click();
  expect(save.builds.agumon.path).toEqual([]);
});
test('Esc salva e volta', () => {
  const { m, storage, back } = setup();
  m.handle(press('cancel'));
  expect(back()).toBe(1);
  expect(JSON.parse(storage.getItem(SAVE_KEY)!).builds.agumon).toBeTruthy();
});
test('teclado: desce até o botão do passo e confirma define o caminho', () => {
  const save = defaultSave(); discover(save, 'agumon->greymon');
  const { root, m } = setup(save);
  const n = root.querySelectorAll('.bd-row').length;
  for (let i = 0; i < n; i++) m.handle(press('down'));
  expect(root.querySelector('.bd-next')!.classList.contains('b2-sel')).toBe(true);
  m.handle(press('confirm'));
  expect(save.builds.agumon.path).toEqual(['agumon', 'greymon']);
});
test('escolha secreta mostra ??? + pista e não vaza o id da forma no DOM', () => {
  const save = defaultSave(); discover(save, 'agumon->greymon'); reveal(save, { edge: 'greymon->skullgreymon', key: 'level' });
  const { root } = setup(save);
  root.querySelector<HTMLElement>('[data-step="greymon"]')!.click();
  const secret = [...root.querySelectorAll('.bd-next')].find(e => e.textContent!.includes('???'))!;
  expect(secret.textContent).toContain('??? · ');
  expect(root.innerHTML).not.toContain('skullgreymon');
});

const selKey = (root: HTMLElement) => root.querySelector('.b2-sel')!;
test('←/→ saltam entre grupos (golpes → cartas → caminho) e travam nas pontas', () => {
  const save = defaultSave(); discover(save, 'agumon->greymon');
  const { root, m } = setup(save);
  const inGroup = () => { const e = selKey(root); return e.closest('.bd-path') ? 'path' : (e.getAttribute('data-key') ?? '').startsWith('card:') ? 'cards' : 'moves'; };
  expect(inGroup()).toBe('moves');
  m.handle(press('left')); expect(inGroup()).toBe('moves');
  m.handle(press('right')); expect(inGroup()).toBe('cards');
  expect(selKey(root)).toBe(root.querySelector('[data-key^="card:"]'));
  m.handle(press('right')); expect(inGroup()).toBe('path');
  m.handle(press('right')); expect(inGroup()).toBe('path');
  m.handle(press('left')); expect(inGroup()).toBe('cards');
  m.handle(press('left')); expect(inGroup()).toBe('moves');
});
test('↑/↓ pulam linhas ??? desabilitadas', () => {
  const { root, m } = setup();
  const locked = root.querySelectorAll('.bd-row.locked').length;
  expect(locked).toBeGreaterThan(0);
  const stops = root.querySelectorAll('.bd-row:not(.locked)').length;
  for (let i = 0; i < stops + 2; i++) { m.handle(press('down')); expect(selKey(root).classList.contains('locked')).toBe(false); }
});
test('seleção rola para a vista', () => {
  const { root, m } = setup();
  const calls: unknown[] = [];
  const proto = HTMLElement.prototype as unknown as { scrollIntoView?: unknown };
  const old = proto.scrollIntoView;
  proto.scrollIntoView = (o: unknown) => { calls.push(o); };
  try { m.handle(press('down')); } finally { proto.scrollIntoView = old; }
  expect(calls).toEqual([{ block: 'nearest' }]);
});
function pathSetup() {
  const save = defaultSave();
  discover(save, 'agumon->greymon'); discover(save, 'greymon->metalgreymon'); discover(save, 'greymon->skullgreymon');
  save.builds.agumon = { fav: [], ban: [], path: ['agumon', 'greymon', 'metalgreymon'] };
  return setup(save);
}
const goTo = (root: HTMLElement, m: { handle(i: Input): void }, sel: string) => {
  for (let i = 0; i < 80 && !root.querySelector(sel)!.classList.contains('b2-sel'); i++) m.handle(press('down'));
  expect(root.querySelector(sel)!.classList.contains('b2-sel')).toBe(true);
};
test('caminho: trocar o passo 2 por outra aresta conhecida', () => {
  const { root, m, save } = pathSetup();
  goTo(root, m, '[data-pos="2"]');
  m.handle(press('confirm')); // passa a oferecer as saídas do passo 1
  root.querySelector<HTMLElement>('[data-step="skullgreymon"]')!.click();
  expect(save.builds.agumon.path).toEqual(['agumon', 'greymon', 'skullgreymon']);
});
test('caminho: X no passo 2 remove ele e os seguintes; sem passo selecionado limpa tudo', () => {
  const { root, m, save } = pathSetup();
  goTo(root, m, '[data-pos="2"]');
  m.handle(press('skip'));
  expect(save.builds.agumon.path).toEqual(['agumon', 'greymon']);
  m.handle(press('left')); // fora do caminho
  m.handle(press('skip'));
  expect(save.builds.agumon.path).toEqual([]);
});
