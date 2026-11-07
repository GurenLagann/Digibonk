import { newCombatState, stepCombat } from '../../src/sim/combat';
import { stepBoss, newBossState } from '../../src/sim/boss';
import { EnemyPool } from '../../src/sim/director';
import { SpatialHash } from '../../src/sim/spatial';
import { newPlayerProg } from '../../src/sim/progression';
import { createRun, stepRun } from '../../src/sim/run';
import { BOSSES } from '../../src/data/enemies';
import { MOVES } from '../../src/data/moves';
import { defaultSave } from '../../src/core/save';
import { createRng } from '../../src/core/rng';
import { fakeStorage } from '../helpers';

test('every boss move id exists', () => BOSSES.forEach(b => b.moves.forEach(m => expect(MOVES[m]).toBeDefined())));

test('area attack telegraphs before damaging', () => {
  const p = newPlayerProg('agumon'); p.slots[0] = null; const c = newCombatState(p);
  const pool = new EnemyPool(), hash = new SpatialHash(4), rng = createRng(1);
  c.areas.push({ x: 0, z: 0, radius: 4, dmg: 30, life: 1.3, maxLife: 1.3, tick: 0, moveId: 'crimson_lightning', follow: false, shape: 'circle', dx: 1, dz: 0, length: 0, delay: 1, hostile: true, done: false });
  let hits = 0;
  for (let i = 0; i < 54; i++) hits += stepCombat(c, p, 0, 0, pool, hash, 1 / 60, rng).filter(e => e.type === 'playerHit').length;
  expect(hits).toBe(0);
  for (let i = 0; i < 12; i++) hits += stepCombat(c, p, 0, 0, pool, hash, 1 / 60, rng).filter(e => e.type === 'playerHit').length;
  expect(hits).toBe(1);
});

test('etemon dark network fires a fan of 8', () => {
  const p = newPlayerProg('agumon'); const c = newCombatState(p); const pool = new EnemyPool();
  const def = BOSSES.find(b => b.id === 'etemon')!; const b = pool.spawn(def, 10, 0, { hp: 1, dmg: 1 }, { boss: true })!;
  const st = newBossState(); st.cooldown = 0;
  stepBoss(b, def, st, c, 0, 0, 1 / 60, createRng(1));
  expect(c.hostiles).toHaveLength(8);
});

test('devimon charges toward the player', () => {
  const p = newPlayerProg('agumon'); const c = newCombatState(p); const pool = new EnemyPool();
  const def = BOSSES.find(b => b.id === 'devimon')!; const b = pool.spawn(def, 15, 0, { hp: 1, dmg: 1 }, { boss: true })!;
  const st = newBossState(); st.cooldown = 0; const r = createRng(1);
  for (let i = 0; i < 60 * 1.3; i++) stepBoss(b, def, st, c, 0, 0, 1 / 60, r);
  expect(b.x).toBeLessThan(6);
});

test('boss spawn scales with time spent', () => {
  const hpAt = (t: number) => {
    const r = createRun({ partnerId: 'agumon', seed: 3, save: defaultSave(), storage: fakeStorage({}) });
    r.phase.t = t; r.phase.mission.done = true; r.phase.bossUnlocked = true; r.px = r.phase.bossAltar.x; r.pz = r.phase.bossAltar.z;
    stepRun(r, { mx: 0, mz: 0 }, 1 / 60); return r.pool.get(r.phase.bossId!)!.maxHp;
  };
  expect(hpAt(500)).toBeGreaterThan(hpAt(100));
});

test('bosses are driven by their AI in a run', () => {
  const r = createRun({ partnerId: 'agumon', seed: 3, save: defaultSave(), storage: fakeStorage({}) });
  r.phase.mission.done = true; r.phase.bossUnlocked = true; r.px = r.phase.bossAltar.x; r.pz = r.phase.bossAltar.z; r.prog.bonus.hp = 100000;
  for (let i = 0; i < 60 * 6; i++) stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.combat.bosses.size).toBe(1);
});
