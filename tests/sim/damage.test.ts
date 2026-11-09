import { damageRows, logDamage, newDamageLog } from '../../src/sim/damage';
import { createRun, stepRun } from '../../src/sim/run';
import { defaultSave } from '../../src/core/save';
import { ENEMIES } from '../../src/data/enemies';

test('total, % e dano por segundo dos últimos 15 s, ordenados', () => {
  const l = newDamageLog();
  logDamage(l, 0.5, 'a', 100); logDamage(l, 1.2, 'b', 300); logDamage(l, 20, 'a', 150);
  const rows = damageRows(l, 20.5);
  expect(rows.map(r => r.moveId)).toEqual(['b', 'a']);
  expect(rows[0]).toMatchObject({ total: 300, pct: 300 / 550 });
  expect(rows[0].dps).toBe(0);            // os 300 de "b" foram há mais de 15 s
  expect(rows[1].dps).toBeCloseTo(150 / 15);
});

test('a partida registra o dano de cada golpe', () => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.debug.god = true; r.pool.clearAll();
  r.pool.spawn(ENEMIES[0], r.px + 2, r.pz, { hp: 1e6, dmg: 0 });
  for (let i = 0; i < 120; i++) stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.damage.total[r.prog.slots[0]!.moveId]).toBeGreaterThan(0);
});
