// @vitest-environment happy-dom
import { defaultSave } from '../../src/core/save';
import type { Input } from '../../src/core/input';
import { FORMS } from '../../src/data/forms';
import { discover, reveal } from '../../src/sim/discovery';
import { activeModal } from '../../src/ui/modal';
import { showAnalyzer } from '../../src/ui/analyzer';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);
function setup() {
  const save = defaultSave(); save.discovered = ['agumon', 'greymon'];
  discover(save, 'agumon->greymon'); reveal(save, { edge: 'greymon->skullgreymon', key: 'level' });
  const root = document.createElement('div'); let back = 0;
  const m = showAnalyzer(root, save, () => { back++; });
  return { root, m, back: () => back };
}
beforeEach(() => { activeModal()?.close(); });

test('contador e lista com ??? para formas não descobertas', () => {
  const { root } = setup();
  expect(root.querySelector('.an-count')!.textContent).toMatch(/Descobertas 4\/\d+/);
  expect(root.querySelector('[data-form="metalgreymon"]')!.textContent).toContain('???');
  expect(root.textContent).not.toContain(FORMS.metalgreymon.name);
  expect(root.textContent).not.toContain(FORMS.skullgreymon.name);
});
test('ficha da forma descoberta: nome, kit, vem de, evolui para ??? com pista', () => {
  const { root } = setup();
  root.querySelector<HTMLElement>('[data-form="greymon"]')!.click();
  const card = root.querySelector('.an-card')!.textContent!;
  expect(card).toContain('Greymon');
  expect(card).toContain('Agumon'); // vem de
  expect(card).toContain('???');
});
test('Esc volta', () => {
  const { m, back } = setup();
  m.handle(press('cancel'));
  expect(back()).toBe(1);
});

test('seleção por teclado rola a lista (scrollIntoView nearest)', () => {
  const { root, m } = setup();
  const calls: unknown[] = [];
  for (const b of root.querySelectorAll<HTMLElement>('.an-form')) b.scrollIntoView = ((o: unknown) => { calls.push(o); }) as never;
  m.handle(press('down'));
  expect(calls).toEqual([{ block: 'nearest' }]);
});
