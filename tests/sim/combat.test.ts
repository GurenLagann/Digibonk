import { newCombatState, stepCombat, type CombatEvent } from '../../src/sim/combat';
import { EnemyPool } from '../../src/sim/director';
import { SpatialHash } from '../../src/sim/spatial';
import { newPlayerProg } from '../../src/sim/progression';
import { ENEMIES } from '../../src/data/enemies';
import { createRng } from '../../src/core/rng';

function setup(formId = 'agumon') {
  const p = newPlayerProg(formId); const c = newCombatState(p);
  return { p, c, pool: new EnemyPool(), hash: new SpatialHash(4), rng: createRng(1) };
}
function enemyAt(pool: EnemyPool, x: number, z: number, hp: number, speed = 0) {
  const e = pool.spawn(ENEMIES[0], x, z, { hp: 1, dmg: 1 })!; e.hp = e.maxHp = hp; e.speed = speed; return e;
}
function run(s: ReturnType<typeof setup>, seconds: number): CombatEvent[] {
  const ev: CombatEvent[] = [];
  for (let i = 0; i < Math.round(seconds * 60); i++) ev.push(...stepCombat(s.c, s.p, 0, 0, s.pool, s.hash, 1 / 60, s.rng));
  return ev;
}

test('no target in range does not consume cooldown', () => {
  const s = setup(); enemyAt(s.pool, 100, 0, 50);
  run(s, 1); expect(s.c.projectiles).toHaveLength(0); expect(s.c.cooldowns[0]).toBe(0);
});
test('projectile kills weak enemy and emits kill once', () => {
  const s = setup(); enemyAt(s.pool, 5, 0, 1);
  const ev = run(s, 2); expect(ev.filter(e => e.type === 'kill')).toHaveLength(1);
});
test('pierce limits hits', () => {
  const s = setup(); s.p.slots[0] = { moveId: 'mega_flame', level: 1, fromCard: false };
  [4, 6, 8].forEach(x => enemyAt(s.pool, x, 0, 9999));
  const ev = run(s, 0.9); expect(ev.filter(e => e.type === 'hit')).toHaveLength(2);
});
test('contact damage respects invulnerability', () => {
  const s = setup(); s.p.slots[0] = null; enemyAt(s.pool, 0.2, 0, 9999);
  const ev = run(s, 0.4); expect(ev.filter(e => e.type === 'playerHit')).toHaveLength(1);
  expect(s.c.hp).toBeLessThan(s.c.maxHp);
});
test('slash card move in slot fires like a kit move', () => {
  const s = setup(); s.p.slots[0] = null; s.p.slots[1] = { moveId: 'diamond_storm', level: 1, fromCard: true };
  enemyAt(s.pool, 6, 0, 9999); run(s, 0.1);
  expect(s.c.projectiles.some(pr => pr.moveId === 'diamond_storm')).toBe(true);
});
test('enemies walk toward the player', () => {
  const s = setup(); s.p.slots[0] = null; const e = enemyAt(s.pool, 10, 0, 9999, 3);
  run(s, 1); expect(e.x).toBeLessThan(10); expect(e.x).toBeGreaterThan(5);
});
test('aura hits nearby enemies', () => {
  const s = setup(); s.p.slots[0] = { moveId: 'tail_whip', level: 1, fromCard: false };
  enemyAt(s.pool, 2, 0, 9999); enemyAt(s.pool, -2, 0, 9999);
  const ev = run(s, 0.1); expect(ev.filter(e => e.type === 'hit')).toHaveLength(2);
});
