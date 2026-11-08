// @vitest-environment happy-dom
import { showPartner } from '../../src/ui/menus';
import { defaultSave } from '../../src/core/save';
import type { Input } from '../../src/core/input';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);

function fakeApp(partners: { id: string; childForm: string; locked: boolean }[]) {
  const picked: string[] = [];
  return { picked, app: { partners: () => partners, pickPartner: (id: string) => { picked.push(id); return true; }, go: () => {} } };
}

test('partner select lists 5 partners, names them by their Child form, and reaches the 5th with the arrows', () => {
  const ps = [
    { id: 'agumon', childForm: 'agumon', locked: false }, { id: 'gabumon', childForm: 'gabumon', locked: false },
    { id: 'p3', childForm: 'veemon', locked: true }, { id: 'p4', childForm: 'guilmon', locked: true },
    { id: 'gatomon', childForm: 'wormmon', locked: false }, // parceiro cujo id ≠ forma Child
  ];
  const { app, picked } = fakeApp(ps);
  const root = document.createElement('div');
  const m = showPartner(root, app as never, defaultSave(), () => {});
  expect(root.textContent).toContain('Wormmon');
  expect(root.textContent).not.toContain('Gatomon');
  expect((root.textContent!.match(/\?\?\?/g) ?? []).length).toBe(2);
  for (let i = 0; i < 4; i++) m.handle(press('down'));
  m.handle(press('confirm'));
  expect(picked).toEqual(['gatomon']);
});

test('partner select: pause (Esc) goes back like cancel', () => {
  const { app } = fakeApp([{ id: 'agumon', childForm: 'agumon', locked: false }]);
  let back = 0;
  const m = showPartner(document.createElement('div'), app as never, defaultSave(), () => { back++; });
  m.handle(press('pause')); expect(back).toBe(1);
});
