import { createRun, stepRun, type RunState } from '../../src/sim/run';
import { defaultSave } from '../../src/core/save';
import { BOSSES, MINIBOSSES, ENEMIES } from '../../src/data/enemies';
import { newPhase } from '../../src/sim/phase';
import { createRng } from '../../src/core/rng';
import { isMagnetic } from '../../src/sim/loot';
import { T } from '../../src/data/tuning';
import { fakeStorage } from '../helpers';

const mk = () => { const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: fakeStorage({}) }); r.prog.bonus.hp = 1e6; return r; };
const step = (r: RunState) => stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
// o abate precisa de um golpe (perto do parceiro) e o pickup é coletado no mesmo passo: soma o que está no chão (ou guardado se o portal do guardião levou à arena) com o já coletado
const bitsPickups = (r: RunState) => [...[...r.pickups, ...(r.zone?.saved.pickups ?? [])].filter(p => p.kind === 'bits'), ...(r.bits ? [{ kind: 'bits', value: r.bits }] : [])];

test('Bits: tuning', () => {
  expect(T.BITS).toEqual({ DROP_CHANCE: 0.05, PER_PHASE: 1, GUARDIAN_PER_PHASE: 25, BOSS_PER_PHASE: 60 });
});
test('Bits: createRun zera', () => { expect(mk().bits).toBe(0); });
test('Bits: inimigo comum (rng baixo) na fase 2 solta 2 Bits; coletar soma', () => {
  const r = mk(); r.phase = newPhase(2, createRng(1));
  r.rng.next = () => 0.001;
  const e = r.pool.spawn(Object.values(ENEMIES)[0], r.px + 1, r.pz, { hp: 1, dmg: 0 })!; e.hp = 0;
  step(r);
  expect(bitsPickups(r)).toMatchObject([{ kind: 'bits', value: 2 }]);
  r.bits = 0; r.pickups.length = 0; r.pickups.push({ id: 999, x: r.px, z: r.pz, kind: 'bits', value: 2 });
  step(r);
  expect(r.bits).toBe(2);
});
test('Bits: sem sorteio favorável, não solta', () => {
  const r = mk(); r.rng.next = () => 0.9;
  const e = r.pool.spawn(Object.values(ENEMIES)[0], r.px + 1, r.pz, { hp: 1, dmg: 0 })!; e.hp = 0;
  step(r);
  expect(bitsPickups(r)).toHaveLength(0);
});
test('Bits: guardião na fase 1 solta 25', () => {
  const r = mk();
  const m = r.pool.spawn(MINIBOSSES[0], r.px + 1, r.pz, { hp: 1, dmg: 0 }, { miniboss: true })!; m.hp = 0;
  step(r);
  expect(bitsPickups(r).map(p => p.value)).toEqual([25]);
});
test('Bits: chefe da fase 3 credita 180 direto em r.bits (não vira pickup)', () => {
  const r = mk(); r.phase = newPhase(3, createRng(1)); r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[2], r.px + 1, r.pz, { hp: 1, dmg: 0 }, { boss: true })!; r.phase.bossId = b.id; b.hp = 0;
  step(r);
  expect(r.bits).toBe(180);
  expect(r.pickups.filter(p => p.kind === 'bits')).toHaveLength(0);
});
test('Bits: chefe morto fora do alcance de coleta não perde os Bits ao limpar a fase', () => {
  const r = mk(); r.phase = newPhase(3, createRng(1)); r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[2], r.px + 2, r.pz, { hp: 1, dmg: 0 }, { boss: true })!; r.phase.bossId = b.id; b.hp = 0;
  const ev = step(r);
  expect(ev.some(e => e.type === 'phaseCleared')).toBe(true);
  expect(r.bits).toBeGreaterThanOrEqual(T.BITS.BOSS_PER_PHASE * 3);
});
test('Bits: isMagnetic', () => { expect(isMagnetic('bits')).toBe(true); });
