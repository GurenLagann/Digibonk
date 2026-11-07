// @vitest-environment happy-dom
import { createRun } from '../../src/sim/run';
import { defaultSave } from '../../src/core/save';
import { showCardChoice } from '../../src/ui/cardmodal';

test('replace-card dialog describes equipped cards at their current level', () => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.prog.passives = ['card_greymon_horn', 'card_monzaemon_hug', 'card_andromon_armor'];
  r.prog.cardLevels.card_greymon_horn = 7; // 15% + 2% × 6 = 27%
  r.pendingCard = 'card_hyper_speed';
  const root = document.createElement('div');
  showCardChoice(root, r);
  expect(root.textContent).toContain('+27% Ataque');
});
