// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vitest';
import { showSettings } from '../../src/ui/menus';
import { activeModal } from '../../src/ui/modal';
import { createInput } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';

const memStorage = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: vi.fn((k: string, v: string) => { m.set(k, v); }), removeItem: (k: string) => { m.delete(k); } } as unknown as Storage & { setItem: ReturnType<typeof vi.fn> };
};
const target = () => ({ addEventListener: () => {} });
const button = (root: HTMLElement, text: string) => [...root.querySelectorAll('button')].find(b => b.textContent!.includes(text)) as HTMLButtonElement;

afterEach(() => { activeModal()?.close(); vi.useRealTimers(); });

test('clicar em "Inverter vertical" alterna save.camera.invertY, grava e aplica no input', () => {
  const root = document.createElement('div');
  const input = createInput(target(), () => [], {});
  const setCamera = vi.spyOn(input, 'setCamera');
  const save = defaultSave(), storage = memStorage();
  showSettings(root, input, save, storage, () => {});
  expect(button(root, 'Inverter vertical').textContent).toContain('não');
  button(root, 'Inverter vertical').click();
  expect(save.camera.invertY).toBe(true);
  expect(storage.setItem).toHaveBeenCalled();
  expect(JSON.parse(storage.setItem.mock.calls.at(-1)![1] as string).camera.invertY).toBe(true);
  expect(setCamera).toHaveBeenLastCalledWith(expect.objectContaining({ invertY: true }));
  expect(button(root, 'Inverter vertical').textContent).toContain('sim');
  button(root, 'Inverter vertical').click();
  expect(save.camera.invertY).toBe(false);
});

test('sensibilidade do mouse sobe de 0.25 em 0.25 e volta para 0.25 depois de 3', () => {
  const root = document.createElement('div');
  const input = createInput(target(), () => [], {});
  const save = defaultSave();
  save.camera.mouseSens = 2.75;
  showSettings(root, input, save, memStorage(), () => {});
  button(root, 'Sensibilidade do mouse').click();
  expect(save.camera.mouseSens).toBe(3);
  button(root, 'Sensibilidade do mouse').click();
  expect(save.camera.mouseSens).toBe(0.25);
  button(root, 'Sensibilidade do controle').click();
  expect(save.camera.padSens).toBe(1.25);
});

test('eixo horizontal: ignora analógico já segurado e grava o eixo movido depois do neutro', () => {
  vi.useFakeTimers();
  const root = document.createElement('div');
  let axes = [0, 0, 0, 0, 0.9]; // eixo 4 já segurado ao abrir a captura
  const pad = () => ({ connected: true, axes, buttons: [] } as unknown as Gamepad);
  const input = createInput(target(), () => [pad()], {});
  const save = defaultSave();
  showSettings(root, input, save, memStorage(), () => {});
  button(root, 'Eixo horizontal').click();
  expect(root.textContent).toContain('Mova o analógico da câmera para a direita');
  const tick = async () => { vi.advanceTimersByTime(16); input.poll(); await Promise.resolve(); await Promise.resolve(); };
  return (async () => {
    for (let i = 0; i < 20; i++) await tick();
    expect(save.camera.padAxisX).toBe(2); // ainda não aceitou o eixo 4 segurado
    axes = [0, 0, 0, 0, 0];
    for (let i = 0; i < 20; i++) await tick();
    axes = [0, 0, 0, 0.95, 0];
    for (let i = 0; i < 3; i++) await tick();
    expect(save.camera.padAxisX).toBe(3);
  })();
});

test('captura de eixo pode ser cancelada sem controle', () => {
  const root = document.createElement('div');
  const input = createInput(target(), () => [], {});
  const save = defaultSave();
  showSettings(root, input, save, memStorage(), () => {});
  button(root, 'Eixo vertical').click();
  expect(root.textContent).toContain('Mova o analógico da câmera para cima');
  button(root, 'Cancelar').click();
  expect(button(root, 'Eixo vertical')).toBeTruthy();
  expect(save.camera.padAxisY).toBe(3);
});
