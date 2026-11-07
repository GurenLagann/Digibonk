// @vitest-environment happy-dom
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
