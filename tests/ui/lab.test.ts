// @vitest-environment happy-dom
import { defaultSave, SAVE_KEY } from '../../src/core/save';
import type { Input } from '../../src/core/input';
import { LAB_LIST } from '../../src/data/lab';
import { activeModal } from '../../src/ui/modal';
import { showLab } from '../../src/ui/lab';
import { fakeStorage } from '../helpers';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);

function setup(currency = 120) {
  const save = defaultSave(); save.currency = currency;
  const storage = fakeStorage({});
  const root = document.createElement('div'); let back = 0;
  const m = showLab(root, save, () => { back++; }, storage);
  return { root, m, save, storage, back: () => back };
}
const rows = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('.lab-row')];

beforeEach(() => { activeModal()?.close(); });

test('4 linhas na ordem do LAB_LIST com nome, barrinhas e preço', () => {
  const { root } = setup();
  const r = rows(root);
  expect(r).toHaveLength(4);
  LAB_LIST.forEach((d, i) => {
    expect(r[i].textContent).toContain(d.name);
    expect(r[i].textContent).toContain(`0/${d.costs.length}`);
    expect(r[i].textContent).toContain(String(d.costs[0]));
  });
  expect(root.textContent).toContain('120');
});

test('Comprar: habilitado quando dá, desabilitado quando falta saldo', () => {
  const { root } = setup();
  const b = (i: number) => rows(root)[i].querySelector<HTMLButtonElement>('.lab-buy')!;
  expect(b(0).disabled).toBe(false);
  expect(b(3).disabled).toBe(true);
});

test('clicar Comprar gasta, sobe o nível e grava no storage', () => {
  const { root, storage, save } = setup();
  rows(root)[0].querySelector<HTMLButtonElement>('.lab-buy')!.click();
  expect(root.querySelector('.lab-balance')!.textContent).toContain('20');
  expect(rows(root)[0].textContent).toContain('1/3');
  expect(save.lab[LAB_LIST[0].id]).toBe(1);
  expect(JSON.parse(storage.getItem(SAVE_KEY)!).currency).toBe(20);
});

test('↑↓ move o foco, Enter compra, Esc volta', () => {
  const { root, m, save, back } = setup(300);
  m.handle(press('down'));
  expect(rows(root)[1].classList.contains('b2-sel')).toBe(true);
  m.handle(press('confirm'));
  expect(save.lab[LAB_LIST[1].id]).toBe(1);
  m.handle(press('up'));
  expect(rows(root)[0].classList.contains('b2-sel')).toBe(true);
  m.handle(press('pause'));
  expect(back()).toBe(1); expect(m.closed).toBe(true);
});

test('nível máximo mostra "Máx" e desabilita', () => {
  const save = defaultSave(); save.currency = 9999; save.lab[LAB_LIST[0].id] = LAB_LIST[0].costs.length;
  const root = document.createElement('div');
  showLab(root, save, () => {}, fakeStorage({}));
  const r = rows(root)[0];
  expect(r.textContent).toContain('Máx');
  expect(r.querySelector<HTMLButtonElement>('.lab-buy')!.disabled).toBe(true);
});
