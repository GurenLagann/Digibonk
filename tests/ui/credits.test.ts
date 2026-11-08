// @vitest-environment happy-dom
import { vi } from 'vitest';
import { showCredits } from '../../src/ui/menus';
import type { Input } from '../../src/core/input';

const fakeInput = (pressed: string[]): Input => ({ pressed: (a: string) => pressed.includes(a) } as unknown as Input);

test('credits name every source and the rights notice', () => {
  const root = document.createElement('div');
  showCredits(root, () => {});
  const t = root.textContent!;
  for (const s of ['Digimon World 3', 'Ragey', 'Artzei', 'V-pet', 'Vital Bracelet', 'Pendulum Color', 'ChatGPT', 'Gemini', 'PokéBonk',
    'Greymon', 'MetalGreymon', 'WarGreymon', 'Omnimon', 'ExVeemon', 'Growlmon', 'WarGrowlmon', 'Gallantmon', '© Akiyoshi Hongo, Toei Animation e Bandai'])
    expect(t, s).toContain(s);
  expect(t).not.toContain('Sprites provisórios');
  expect(t).not.toContain('Gemini: Agumon');
});

test('cancel and Esc (pause) go back from the credits', () => {
  for (const key of ['cancel', 'pause']) {
    const root = document.createElement('div'); const back = vi.fn();
    showCredits(root, back).handle(fakeInput([key]));
    expect(back).toHaveBeenCalledOnce();
  }
});
