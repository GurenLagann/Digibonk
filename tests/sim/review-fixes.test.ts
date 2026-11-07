import { createRun, stepRun } from '../../src/sim/run';
import { defaultSave } from '../../src/core/save';
import { BOSSES } from '../../src/data/enemies';
import { fakeStorage } from '../helpers';

test('boss drops survive the phase transition', () => {
  const r = createRun({ partnerId: 'veemon', seed: 5, save: defaultSave(), storage: fakeStorage({}) });
  r.debug.forceItems = true; r.prog.bonus.hp = 1e6;
  r.phase.mission.done = true; r.phase.bossUnlocked = true; r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[0], r.px + 1, r.pz, { hp: 1, dmg: 0 }, { boss: true })!; b.hp = 0.001; r.phase.bossId = b.id;
  let cleared = false;
  for (let i = 0; i < 120 && !cleared; i++) cleared = stepRun(r, { mx: 0, mz: 0 }, 1 / 60).some(e => e.type === 'phaseCleared');
  expect(cleared).toBe(true);
  for (let i = 0; i < 3; i++) stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.prog.items.length + r.unlockedThisRun.length).toBe(2);
});

test('two choice cards collected in one step are both offered', () => {
  const r = createRun({ partnerId: 'agumon', seed: 5, save: defaultSave(), storage: fakeStorage({}) });
  r.pickups.push({ id: 901, x: r.px, z: r.pz, kind: 'card', value: 0, ref: 'card_diamond_storm' });
  r.pickups.push({ id: 902, x: r.px, z: r.pz, kind: 'card', value: 0, ref: 'card_lightning_paw' });
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.pendingCard).toBe('card_diamond_storm');
  r.pendingCard = null; // player resolves the first
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.pendingCard).toBe('card_lightning_paw');
});
