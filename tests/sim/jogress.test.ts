import { defaultSave } from '../../src/core/save';
import { ENEMIES } from '../../src/data/enemies';
import { FORMS } from '../../src/data/forms';
import { T } from '../../src/data/tuning';
import { applyForm } from '../../src/sim/evolution';
import { applyJogress, jogressPairs } from '../../src/sim/jogress';
import { newCombatState, stepCombat } from '../../src/sim/combat';
import { EnemyPool } from '../../src/sim/director';
import { SpatialHash } from '../../src/sim/spatial';
import { createRng } from '../../src/core/rng';
import { chooseJogress, createRun, stepRun } from '../../src/sim/run';
import { maxedProg, fakeStorage } from '../helpers';
import { outgoingDamage } from '../../src/sim/stats';

test('pares: só golpes no nível máximo, sem golpe Jogress já feito', () => {
  const p = maxedProg('agumon'); p.slots[2]!.level = 3;
  expect(jogressPairs(p)).toEqual([[0, 1], [0, 3], [1, 3]]);
});

test('Jogress junta o par no primeiro espaço e libera o segundo', () => {
  const p = maxedProg('agumon'); const b = p.slots[3]!.moveId;
  applyJogress(p, 1, 3);
  expect(p.slots[1]!.jogress).toEqual({ moveId: b, level: 5 });
  expect(p.slots[3]).toBeNull();
  expect(jogressPairs(p).some(([x, y]) => x === 1 || y === 1)).toBe(false); // o golpe Jogress não entra em outro Jogress
});

test('o espaço Jogress dispara os dois golpes, cada um com +25% de dano', () => {
  const p = maxedProg('agumon'); applyJogress(p, 0, 1);
  p.slots[2] = null; p.slots[3] = null;
  const c = newCombatState(p), pool = new EnemyPool(), hash = new SpatialHash(4);
  pool.spawn(ENEMIES[0], 2, 0, { hp: 1000, dmg: 0 });
  hash.clear(); for (const e of pool.alive()) hash.insert(e.id, e.x, e.z);
  stepCombat(c, p, 0, 0, pool, hash, 1 / 60, createRng(1));
  const fired = new Set([...c.projectiles.map(x => x.moveId), ...c.areas.map(x => x.moveId)]);
  expect(fired.has(p.slots[0]!.moveId)).toBe(true);
  expect(fired.has(p.slots[0]!.jogress!.moveId)).toBe(true);
  const shot = [...c.projectiles, ...c.areas].find(x => x.moveId === p.slots[0]!.moveId)!;
  expect(shot.dmg).toBeCloseTo(outgoingDamage(p, p.slots[0]!) * (1 + T.JOGRESS_BONUS));
});

test('evoluir preserva o golpe Jogress da assinatura num espaço livre', () => {
  const p = maxedProg('agumon'); applyJogress(p, 0, 1);
  const combo = { ...p.slots[0]! };
  applyForm(p, 'greymon');
  expect(p.slots[0]!.moveId).toBe(FORMS.greymon.signature);
  expect(p.slots.some(s => s?.moveId === combo.moveId && s.jogress?.moveId === combo.jogress!.moveId)).toBe(true);
});

test('Terminal aparece com 2 golpes no máximo, abre a escolha e só vale uma vez', () => {
  const r = createRun({ partnerId: 'agumon', seed: 2, save: defaultSave(), storage: fakeStorage({}) });
  r.debug.god = true; r.debug.xpMul = 0;
  const m = maxedProg('agumon'); r.prog.slots = m.slots;
  const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.jogressSpot).not.toBeNull();
  expect(ev).toContainEqual({ type: 'jogressReady' });
  r.px = r.jogressSpot!.x; r.pz = r.jogressSpot!.z; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.jogressOffer).toEqual(jogressPairs(r.prog));
  chooseJogress(r, 0);
  expect(r.jogressOffer).toBeNull(); expect(r.jogressUsed).toBe(true); expect(r.jogressSpot).toBeNull();
  expect(r.prog.slots.some(s => s?.jogress)).toBe(true);
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60); expect(r.jogressSpot).toBeNull();
});

test('Esc fecha a escolha e o Terminal continua no mapa', () => {
  const r = createRun({ partnerId: 'agumon', seed: 2, save: defaultSave(), storage: fakeStorage({}) });
  r.debug.god = true; r.prog.slots = maxedProg('agumon').slots;
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  r.px = r.jogressSpot!.x; r.pz = r.jogressSpot!.z; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  chooseJogress(r, null);
  expect(r.jogressOffer).toBeNull(); expect(r.jogressSpot).not.toBeNull(); expect(r.jogressUsed).toBe(false);
});
