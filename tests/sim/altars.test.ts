import { defaultSave } from '../../src/core/save';
import { T } from '../../src/data/tuning';
import { MINIBOSSES } from '../../src/data/enemies';
import { rollTrades } from '../../src/sim/altars';
import { createRng } from '../../src/core/rng';
import { stepDirector } from '../../src/sim/director';
import { EnemyPool } from '../../src/sim/director';
import { effectiveStats } from '../../src/sim/stats';
import { chooseAltar, createRun, stepRun, type RunState } from '../../src/sim/run';
import { fakeStorage } from '../helpers';

const mk = () => {
  const r = createRun({ partnerId: 'agumon', seed: 4, save: defaultSave(), storage: fakeStorage({}) });
  r.debug.god = true; r.debug.xpMul = 0;
  return r;
};
const step = (r: RunState) => stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
const touch = (r: RunState, kind: string) => { const a = r.altars.find(x => x.kind === kind)!; r.px = a.x; r.pz = a.z; step(r); return a; };

test('cada fase tem um altar de cada, longe do início', () => {
  const r = mk();
  expect(r.altars.map(a => a.kind).sort()).toEqual(['challenge', 'datamon', 'etemon']);
  for (const a of r.altars) expect(Math.hypot(a.x, a.z)).toBeGreaterThanOrEqual(20);
});

test('Etemon: aceitar soma Corrupção (até o máximo) e o altar só vale uma vez na fase', () => {
  const r = mk(); const a = touch(r, 'etemon');
  expect(r.altarOffer).toMatchObject({ kind: 'etemon' });
  chooseAltar(r, 0);
  expect(r.corruption).toBe(1); expect(a.used).toBe(true); expect(r.altarOffer).toBeNull();
  r.px += 5; step(r); r.px = a.x; r.pz = a.z; step(r);
  expect(r.altarOffer).toBeNull();
});

test('Corrupção faz surgir mais inimigos e mais fortes', () => {
  const base = { pool: new EnemyPool(), phase: 1, t: 60, acc: 0, px: 0, pz: 0, corruption: 0 };
  const cor = { ...base, pool: new EnemyPool(), corruption: 3 };
  stepDirector(base, 10, createRng(1)); stepDirector(cor, 10, createRng(1));
  expect(cor.pool.alive().length).toBeGreaterThan(base.pool.alive().length);
  const hp = (s: typeof base) => s.pool.alive()[0].maxHp / 1;
  expect(hp(cor) / hp(base)).toBeGreaterThan(1);
});

test('Datamon: 3 trocas de status; a escolhida vale para a partida', () => {
  const trades = rollTrades(createRng(2));
  expect(trades).toHaveLength(3);
  for (const t of trades) { expect(t.from).not.toBe(t.to); expect(t.lose).toBeGreaterThan(0); expect(t.gain).toBeGreaterThan(t.lose); }
  const r = mk(); const before = effectiveStats(r.prog);
  touch(r, 'datamon');
  const t = (r.altarOffer as { trades: { from: string; to: string; lose: number; gain: number }[] }).trades[1];
  chooseAltar(r, 1);
  const after = effectiveStats(r.prog) as unknown as Record<string, number>;
  const b = before as unknown as Record<string, number>;
  expect(after[t.to]).toBeCloseTo(b[t.to] * (1 + t.gain / 100));
  expect(after[t.from]).toBeCloseTo(b[t.from] * (1 - t.lose / 100));
});

test('Desafio: o próximo guardião vem mais forte e abre uma Distorção rara', () => {
  const r = mk(); touch(r, 'challenge'); chooseAltar(r, 0);
  expect(r.challengeArmed).toBe(true);
  r.phase.mission = { kind: 'miniboss', done: false, progress: 0, goal: 1 } as never;
  r.phase.t = 61; r.phase.minibossSpawned = false; step(r);
  const g = r.pool.alive().find(e => e.miniboss)!;
  expect(g).toBeTruthy();
  const def = MINIBOSSES.find(m => m.id === g.def)!;
  expect(g.maxHp).toBeGreaterThan(def.hp * T.ALTARS.CHALLENGE_HP * 0.99);
  g.hp = 0.0001;
  for (let i = 0; i < 600 && r.pool.get(g.id); i++) step(r);
  expect(r.portals[0]?.rare).toBe(true); expect(r.challengeArmed).toBe(false);
});

test('Esc recusa: o altar continua disponível', () => {
  const r = mk(); const a = touch(r, 'etemon'); chooseAltar(r, null);
  expect(r.corruption).toBe(0); expect(a.used).toBe(false); expect(r.altarOffer).toBeNull();
});
