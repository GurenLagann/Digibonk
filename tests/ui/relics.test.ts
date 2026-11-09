// @vitest-environment happy-dom
import type { Input } from '../../src/core/input';
import { defaultSave } from '../../src/core/save';
import { RELICS } from '../../src/data/relics';
import { createRun } from '../../src/sim/run';
import { activeModal } from '../../src/ui/modal';
import { showRelicChoice } from '../../src/ui/relics';
import { SLASH_MS } from '../../src/ui/tamerCards';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);
beforeEach(() => { vi.useFakeTimers(); activeModal()?.close(); });
afterEach(() => { vi.useRealTimers(); });

test('mostra as 3 relíquias com nome, bônus e efeito; opt2 equipa a segunda', () => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.relicOffer = ['relic_tag_courage', 'relic_blue_card', 'relic_digivice'];
  const root = document.createElement('div');
  const m = showRelicChoice(root, r);
  expect(root.textContent).toContain('Relíquias da Distorção');
  expect(root.querySelectorAll('.tc')).toHaveLength(3);
  expect(root.textContent).toContain(RELICS.relic_blue_card.name);
  expect(root.textContent).toContain(RELICS.relic_blue_card.description);
  expect(root.textContent).toContain('+6% Atq');
  m.handle(press('opt2')); vi.advanceTimersByTime(SLASH_MS + 10);
  expect(r.prog.relics).toEqual(['relic_blue_card']); expect(r.relicOffer).toBeNull();
});
test('Esc não leva nenhuma', () => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.relicOffer = ['relic_tag_courage', 'relic_blue_card', 'relic_digivice'];
  const m = showRelicChoice(document.createElement('div'), r);
  m.handle(press('cancel'));
  expect(r.prog.relics).toEqual([]); expect(r.relicOffer).toBeNull();
});
