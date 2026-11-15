import { outsideView, cameraForward } from '../../src/core/view';
import { difficulty, EnemyPool, stepDirector } from '../../src/sim/director';
import { ENEMIES, BOSSES } from '../../src/data/enemies';
import { T } from '../../src/data/tuning';
import { createRng } from '../../src/core/rng';

test('overtime is much harsher', () => {
  const a = difficulty(1, 599), b = difficulty(1, 660);
  expect(b.spawnPerSec / a.spawnPerSec).toBeGreaterThanOrEqual(4); expect(b.hpMul).toBeGreaterThan(a.hpMul * 2);
});
test('difficulty grows with phase', () => expect(difficulty(3, 0).hpMul).toBeGreaterThan(difficulty(1, 0).hpMul));
test('pool caps normal enemies but not bosses', () => {
  const pool = new EnemyPool();
  for (let i = 0; i < T.MAX_ENEMIES + 50; i++) pool.spawn(ENEMIES[0], 0, 0, { hp: 1, dmg: 1 });
  expect(pool.alive().length).toBe(T.MAX_ENEMIES);
  expect(pool.spawn(BOSSES[0], 0, 0, { hp: 1, dmg: 1 }, { boss: true })).not.toBeNull();
});
test('killed slots are reused', () => {
  const pool = new EnemyPool(); const e = pool.spawn(ENEMIES[0], 0, 0, { hp: 1, dmg: 1 })!;
  pool.kill(e.id); expect(pool.alive()).toHaveLength(0); expect(pool.spawn(ENEMIES[0], 0, 0, { hp: 1, dmg: 1 })).not.toBeNull();
});
test('spawns stay in the ring and respect phase', () => {
  const st = { pool: new EnemyPool(), phase: 1, t: 0, acc: 0, px: 5, pz: -3 }; const r = createRng(2);
  for (let i = 0; i < 600; i++) { st.t += 1 / 60; stepDirector(st, 1 / 60, r); }
  const alive = st.pool.alive(); expect(alive.length).toBeGreaterThan(10);
  for (const e of alive) {
    const d = Math.hypot(e.x - 5, e.z + 3); expect(d).toBeGreaterThanOrEqual(22 - 1e-6); expect(d).toBeLessThanOrEqual(28 + 1e-6);
    expect(ENEMIES.find(x => x.id === e.def)!.minPhase).toBe(1);
  }
});
test('spawns avoid the camera view cone', () => {
  for (const yaw of [0, Math.PI / 2]) {
    const half = Math.PI / 3;
    const st = { pool: new EnemyPool(), phase: 1, t: 0, acc: 0, px: 0, pz: 0, viewYaw: yaw, viewHalf: half }; const r = createRng(3);
    for (let i = 0; i < 600; i++) { st.t += 1 / 60; stepDirector(st, 1 / 60, r); }
    const alive = st.pool.alive(); expect(alive.length).toBeGreaterThan(10);
    for (const e of alive) {
      expect(outsideView(e.x, e.z, yaw, half)).toBe(true);
      const d = Math.hypot(e.x, e.z); expect(d).toBeGreaterThanOrEqual(22 - 1e-6); expect(d).toBeLessThanOrEqual(28 + 1e-6);
    }
  }
});
test('spawns ficam fora do cone visto da câmera (que está DIST atrás), mesmo em tela ultra-wide', () => {
  const half = Math.atan(Math.tan(Math.PI / 6) * 2.37) + T.CAMERA.SPAWN_MARGIN;
  for (const yaw of [0, 1.2, 4]) {
    const st = { pool: new EnemyPool(), phase: 1, t: 0, acc: 0, px: 5, pz: -3, viewYaw: yaw, viewHalf: half }; const r = createRng(9);
    for (let i = 0; i < 900; i++) { st.t += 1 / 60; stepDirector(st, 1 / 60, r); }
    const alive = st.pool.alive(); expect(alive.length).toBeGreaterThan(10);
    const f = cameraForward(yaw), cx = 5 - f.x * T.CAMERA.DIST, cz = -3 - f.z * T.CAMERA.DIST;
    for (const e of alive) expect(outsideView(e.x - cx, e.z - cz, yaw, half - 1e-6)).toBe(true);
  }
});
