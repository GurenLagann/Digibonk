// @vitest-environment happy-dom
import { vi } from 'vitest';
import { showChoice } from '../../src/ui/modal';
import type { Input } from '../../src/core/input';

const fakeInput = (pressed: string[]): Input => ({ pressed: (a: string) => pressed.includes(a) } as unknown as Input);

test('a choice with no options ignores confirm instead of throwing', () => {
  const root = document.createElement('div');
  const m = showChoice(root, { title: 'Aperte a nova tecla', options: [] });
  expect(() => m.handle(fakeInput(['confirm']))).not.toThrow();
  expect(() => m.handle(fakeInput(['down', 'cancel', 'opt1']))).not.toThrow();
  expect(m.closed).toBe(false);
});

test('extra option: both cancel and pause (Esc) trigger it', () => {
  for (const key of ['cancel', 'pause']) {
    const root = document.createElement('div');
    const onPick = vi.fn(), other = vi.fn();
    const m = showChoice(root, { title: 'T', options: [{ title: 'A', onPick: other }], extra: { title: 'Voltar', onPick } });
    m.handle(fakeInput([key]));
    expect(onPick).toHaveBeenCalledOnce();
    expect(other).not.toHaveBeenCalled();
    expect(m.closed).toBe(true);
  }
});

test('without extra, pause/cancel do nothing', () => {
  const root = document.createElement('div');
  const m = showChoice(root, { title: 'T', options: [{ title: 'A', onPick: () => {} }] });
  m.handle(fakeInput(['pause', 'cancel']));
  expect(m.closed).toBe(false);
});

test('renders the B2 panel, shows an Esc badge on the extra option and keeps number hints', () => {
  const root = document.createElement('div');
  showChoice(root, { title: 'Pausado', options: [{ title: 'Continuar', onPick: () => {} }, { title: 'Controles', onPick: () => {} }], extra: { title: 'Voltar', onPick: () => {} } });
  expect(root.querySelector('.b2-screen .b2-panel')).not.toBeNull();
  expect(root.querySelector('.b2-title')!.textContent).toBe('Pausado');
  expect(root.querySelector('.cm-extra .b2-key')!.textContent).toBe('Esc');
  expect(root.querySelectorAll('.cm-opt').length).toBe(2);
  expect(root.querySelector('.cm-opt .b2-key')!.textContent).toBe('1');
  expect(root.querySelectorAll('.cm-opt.b2-sel').length).toBe(1);
});

test('arrows move the selection and confirm picks it; mouse click picks too', () => {
  const root = document.createElement('div');
  const a = vi.fn(), b = vi.fn();
  const m = showChoice(root, { title: 'T', options: [{ title: 'A', onPick: a }, { title: 'B', onPick: b }] });
  m.handle(fakeInput(['down']));
  m.handle(fakeInput(['confirm']));
  expect(b).toHaveBeenCalledOnce();
  const m2 = showChoice(root, { title: 'T', options: [{ title: 'A', onPick: a }] });
  (root.querySelector('.cm-opt') as HTMLElement).click();
  expect(a).toHaveBeenCalledOnce(); expect(m2.closed).toBe(true);
});
