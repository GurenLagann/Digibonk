import { newPhase, stepPhase, type PhaseState } from '../../src/sim/phase';
import { createRng } from '../../src/core/rng';

const noop = () => ({ px: 0, pz: 0, dt: 0.1, killedMiniboss: false, collectedFragment: false, bossDead: false, playerDead: false });
function withMission(kind: 'collect' | 'activate' | 'miniboss'): PhaseState {
  for (let seed = 1; seed < 500; seed++) { const s = newPhase(2, createRng(seed)); if (s.mission.kind === kind) return s; }
  throw new Error('no mission ' + kind);
}
function unlockedActive(): PhaseState {
  const s = withMission('collect'); s.mission.done = true; s.bossUnlocked = true; s.bossActive = true; return s;
}
function runFor(s: PhaseState, seconds: number, over: Partial<ReturnType<typeof noop>> = {}) {
  const ev: string[] = []; for (let i = 0; i < Math.round(seconds / 0.1); i++) ev.push(...stepPhase(s, { ...noop(), ...over })); return ev;
}

test('phase 1 never has miniboss mission', () => {
  for (let seed = 1; seed < 200; seed++) expect(newPhase(1, createRng(seed)).mission.kind).not.toBe('miniboss');
});
test('all mission kinds occur', () => {
  const kinds = new Set<string>(); for (let seed = 1; seed < 200; seed++) kinds.add(newPhase(3, createRng(seed)).mission.kind);
  expect([...kinds].sort()).toEqual(['activate', 'collect', 'miniboss']);
});
test('boss locked until mission done', () => {
  const s = withMission('collect'); runFor(s, 300); expect(s.bossUnlocked).toBe(false);
});
test('collect mission unlocks boss at 6 fragments', () => {
  const s = withMission('collect'); const ev: string[] = [];
  for (let i = 0; i < 6; i++) ev.push(...stepPhase(s, { ...noop(), collectedFragment: true }));
  expect(ev.filter(e => e === 'bossUnlocked')).toHaveLength(1); expect(s.mission.progress).toBe(6);
});
test('activate charge accumulates while inside and pauses outside', () => {
  const s = withMission('activate'); const pt = s.mission.points[0];
  runFor(s, 4.9, { px: pt.x, pz: pt.z }); expect(pt.charge).toBeLessThan(1);
  runFor(s, 3, { px: pt.x + 50, pz: pt.z }); const c = pt.charge; expect(c).toBeGreaterThan(0.9);
  runFor(s, 0.3, { px: pt.x, pz: pt.z }); expect(pt.charge).toBeGreaterThanOrEqual(1); expect(s.mission.progress).toBe(1);
});
test('miniboss mission asks for spawn at 60s and completes on kill', () => {
  const s = withMission('miniboss'); expect(runFor(s, 61)).toContain('minibossSpawn');
  expect(stepPhase(s, { ...noop(), killedMiniboss: true })).toContain('bossUnlocked');
});
test('overtime starts after 600s once', () => {
  const s = withMission('collect'); s.t = 599.95;
  const ev = runFor(s, 1); expect(ev.filter(e => e === 'overtimeStarted')).toHaveLength(1); expect(s.overtime).toBe(true);
});
test('boss starts only near altar', () => {
  const s = withMission('collect'); s.mission.done = true; s.bossUnlocked = true;
  expect(stepPhase(s, { ...noop(), px: s.bossAltar.x + 20, pz: s.bossAltar.z })).not.toContain('bossStarted');
  expect(stepPhase(s, { ...noop(), px: s.bossAltar.x + 1, pz: s.bossAltar.z })).toContain('bossStarted');
});
test('simultaneous boss and player death clears phase', () => {
  const s = unlockedActive();
  const ev = stepPhase(s, { ...noop(), bossDead: true, playerDead: true });
  expect(ev).toContain('phaseCleared'); expect(ev).not.toContain('playerDied');
});
test('player death without boss kill is reported', () => {
  const s = withMission('collect'); expect(stepPhase(s, { ...noop(), playerDead: true })).toContain('playerDied');
});
