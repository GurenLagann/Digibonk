import { createRun, stepRun, doEvolve, playerSpeed, type RunState } from '../../src/sim/run';
import { newPhase } from '../../src/sim/phase';
import { defaultSave, loadSave } from '../../src/core/save';
import { createRng } from '../../src/core/rng';
import { BOSSES } from '../../src/data/enemies';
import { T } from '../../src/data/tuning';
import { MAP_OBSTACLES } from '../../src/sim/map';
import { fakeStorage, autoResolveModals, circleInput } from '../helpers';

const opts = (o: { seed?: number; partnerId?: string; storage?: Storage } = {}) =>
  ({ partnerId: o.partnerId ?? 'agumon', seed: o.seed ?? 1, save: defaultSave(), storage: o.storage ?? fakeStorage({}) });

test('modal offers freeze the run', () => {
  const r = createRun(opts()); r.offers = [{ kind: 'stat', stat: 'atk', amount: 3 }];
  const t = r.time; stepRun(r, { mx: 1, mz: 0 }, 1 / 60); expect(r.time).toBe(t);
});
test('pause freezes the run', () => {
  const r = createRun(opts()); r.paused = true; stepRun(r, { mx: 1, mz: 0 }, 1 / 60); expect(r.time).toBe(0);
});
test('egg unlocks partner immediately and persists even on defeat', () => {
  const storage = fakeStorage({}); const r = createRun(opts({ storage }));
  r.pickups.push({ id: 999, x: r.px, z: r.pz, kind: 'item', value: 0, ref: 'egg_gabumon' });
  const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(ev).toContainEqual({ type: 'partnerUnlocked', partnerId: 'gabumon' });
  expect(r.save.unlocked).toContain('gabumon');
  r.combat.hp = -1; r.prog.bonus.hp = -10000; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.ended).toBe('defeat'); expect(loadSave(storage).unlocked).toContain('gabumon');
});
test('headless bot survives a full phase timeline without NaN', () => {
  const r = createRun(opts({ seed: 99 })); r.prog.bonus.hp = 100000;
  for (let i = 0; i < 60 * 660; i++) { autoResolveModals(r); stepRun(r, circleInput(i), 1 / 60); }
  expect(r.phase.overtime).toBe(true);
  expect(r.pool.alive().length).toBeLessThanOrEqual(T.MAX_ENEMIES + 6);
  expect(Number.isFinite(r.px) && Number.isFinite(r.pz)).toBe(true);
  expect(r.prog.level).toBeGreaterThan(5);
}, 60000);
test('clearing phase 5 is victory and records it', () => {
  const storage = fakeStorage({}); const r = createRun(opts({ storage }));
  r.phase = newPhase(5, createRng(1)); r.phase.mission.done = true; r.phase.bossUnlocked = true; r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[4], 50, 50, { hp: 1, dmg: 1 }, { boss: true })!; r.phase.bossId = b.id; r.pool.kill(b.id);
  const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(ev).toContainEqual({ type: 'victory' }); expect(r.ended).toBe('victory');
  expect(loadSave(storage).records).toMatchObject({ wins: 1, bestPhase: 5, runs: 1 });
});
test('clearing a phase advances and resets the arena', () => {
  const r = createRun(opts()); r.phase.mission.done = true; r.phase.bossUnlocked = true; r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[0], 50, 50, { hp: 1, dmg: 1 }, { boss: true })!; r.phase.bossId = b.id; r.pool.kill(b.id);
  r.px = 40; const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(ev).toContainEqual({ type: 'phaseCleared', phase: 1 }); expect(r.phase.phase).toBe(2); expect(r.px).toBe(0);
});
test('player stays inside map bounds', () => {
  const r = createRun(opts()); r.prog.bonus.hp = 100000; r.paused = false;
  for (let i = 0; i < 60 * 40; i++) { autoResolveModals(r); stepRun(r, { mx: 1, mz: 0 }, 1 / 60); }
  expect(r.px).toBeLessThanOrEqual(T.MAP_HALF);
});
test('obstacles keep clear of the center', () => {
  expect(MAP_OBSTACLES.length).toBeGreaterThan(40);
  for (const o of MAP_OBSTACLES) expect(Math.hypot(o.x, o.z)).toBeGreaterThanOrEqual(8);
});
test('evolving records discovery and restores hp', () => {
  const storage = fakeStorage({}); const r = createRun(opts({ storage }));
  r.prog.level = 8; r.prog.bonus.atk = 20; r.combat.hp = 1;
  doEvolve(r, 'greymon');
  expect(r.prog.formId).toBe('greymon'); expect(r.combat.hp).toBe(r.combat.maxHp);
  expect(loadSave(storage).discovered).toContain('greymon');
});
test('evolution availability is announced once', () => {
  const r = createRun(opts()); r.prog.level = 8; r.prog.bonus.atk = 20;
  const a = stepRun(r, { mx: 0, mz: 0 }, 1 / 60), b = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(a).toContainEqual({ type: 'evolutionAvailable', forms: ['greymon'] });
  expect(b.some(e => e.type === 'evolutionAvailable')).toBe(false);
});
test('run remembers the horizontal move direction for sprite facing', () => {
  const r = createRun(opts()); stepRun(r, { mx: 1, mz: 0 }, 1 / 60); expect(r.dirX).toBeGreaterThan(0);
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60); expect(r.dirX).toBeGreaterThan(0); // parado mantém a última direção
  stepRun(r, { mx: -1, mz: 0.2 }, 1 / 60); expect(r.dirX).toBeLessThan(0);
});

test('facing follows the dominant movement axis and is kept when stopped', () => {
  const r = createRun(opts());
  expect(r.facing).toBe('side');
  stepRun(r, { mx: 0, mz: -1 }, 1 / 60); expect(r.facing).toBe('up');
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60); expect(r.facing).toBe('up');
  stepRun(r, { mx: 0.3, mz: 1 }, 1 / 60); expect(r.facing).toBe('down');
  stepRun(r, { mx: 1, mz: 0.4 }, 1 / 60); expect(r.facing).toBe('side');
});

test('facing has diagonals (8 directions, mirrored by dirX)', () => {
  const r = createRun(opts());
  stepRun(r, { mx: 0.7, mz: -0.7 }, 1 / 60); expect(r.facing).toBe('diagup');
  stepRun(r, { mx: -0.7, mz: 0.7 }, 1 / 60); expect(r.facing).toBe('diagdown');
  stepRun(r, { mx: 0.2, mz: -1 }, 1 / 60); expect(r.facing).toBe('up');
  stepRun(r, { mx: 1, mz: 0.2 }, 1 / 60); expect(r.facing).toBe('side');
});

test('playerSpeed follows spd and the run remembers its base speed', () => {
  const r = createRun(opts());
  expect(r.baseSpeed).toBeCloseTo(playerSpeed(r.prog));
  r.prog.bonus.spd += 1000;
  expect(playerSpeed(r.prog)).toBeGreaterThan(2 * r.baseSpeed);
});
