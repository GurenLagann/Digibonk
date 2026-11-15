// @vitest-environment happy-dom
import { createInput } from '../../src/core/input';
import { createFixedLoop } from '../../src/core/loop';
import { defaultSave } from '../../src/core/save';
import { activeModal } from '../../src/ui/modal';
import { showLab } from '../../src/ui/lab';
import { fakeStorage } from '../helpers';

test('um Enter pelo caminho real do laço compra um nível só', () => {
  const save = defaultSave(); save.currency = 1200;
  const root = document.createElement('div'); document.body.append(root);
  showLab(root, save, () => {}, fakeStorage({}));
  const input = createInput(window as never, () => [], {});
  const loop = createFixedLoop(1 / 60, 0.25, () => { input.poll(); activeModal()?.handle(input); });
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
  loop.advance(0.1); // vários passos num quadro
  // tecla segurada: blur (ex.: painel de debug/foco) e auto-repeat não podem comprar de novo
  for (let i = 0; i < 3; i++) {
    window.dispatchEvent(new Event('blur'));
    loop.advance(0.05);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', repeat: true } as KeyboardEventInit));
    loop.advance(0.05);
  }
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter' }));
  loop.advance(0.1);
  expect(save.lab.lab_reroll).toBe(1);
  expect(save.currency).toBe(1100);
});
