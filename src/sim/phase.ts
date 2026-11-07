import type { Rng } from '../core/rng';
import { T } from '../data/tuning';

export type MissionKind = 'miniboss' | 'collect' | 'activate';
export interface Mission { kind: MissionKind; done: boolean; progress: number; goal: number; points: { x: number; z: number; charge: number }[] }
export interface PhaseState {
  phase: number; t: number; mission: Mission; bossUnlocked: boolean; bossAltar: { x: number; z: number };
  bossActive: boolean; bossId: number | null; overtime: boolean; cleared: boolean; minibossSpawned: boolean;
}
export type PhaseEvent = 'missionProgress' | 'bossUnlocked' | 'overtimeStarted' | 'bossStarted' | 'phaseCleared' | 'playerDied' | 'minibossSpawn';
export interface PhaseInput { px: number; pz: number; dt: number; killedMiniboss: boolean; collectedFragment: boolean; bossDead: boolean; playerDead: boolean }

export const ACTIVATE_RADIUS = 3, ACTIVATE_SECONDS = 5, ALTAR_RADIUS = 4, MINIBOSS_AT = 60;

function spreadPoints(n: number, rng: Rng, minR: number, maxR: number): { x: number; z: number; charge: number }[] {
  const out: { x: number; z: number; charge: number }[] = [];
  for (let tries = 0; out.length < n && tries < 2000; tries++) {
    const a = rng.next() * Math.PI * 2, r = minR + rng.next() * (maxR - minR);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (out.some(p => Math.hypot(p.x - x, p.z - z) < 18)) continue;
    out.push({ x, z, charge: 0 });
  }
  return out;
}

export function newPhase(phase: number, rng: Rng): PhaseState {
  const kinds: MissionKind[] = phase === 1 ? ['collect', 'activate'] : ['collect', 'activate', 'miniboss'];
  const kind = rng.pick(kinds);
  const mission: Mission =
    kind === 'collect' ? { kind, done: false, progress: 0, goal: 6, points: spreadPoints(6, rng, 15, T.MAP_HALF - 10) }
    : kind === 'activate' ? { kind, done: false, progress: 0, goal: 3, points: spreadPoints(3, rng, 20, T.MAP_HALF - 15) }
    : { kind, done: false, progress: 0, goal: 1, points: [] };
  const a = rng.next() * Math.PI * 2, r = 30 + rng.next() * 30;
  return { phase, t: 0, mission, bossUnlocked: false, bossAltar: { x: Math.cos(a) * r, z: Math.sin(a) * r },
    bossActive: false, bossId: null, overtime: false, cleared: false, minibossSpawned: false };
}

export function stepPhase(s: PhaseState, i: PhaseInput): PhaseEvent[] {
  if (s.cleared) return [];
  const ev: PhaseEvent[] = [];
  s.t += i.dt;
  if (!s.overtime && s.t > T.PHASE_SECONDS) { s.overtime = true; ev.push('overtimeStarted'); }
  const m = s.mission;
  if (!m.done) {
    if (m.kind === 'collect' && i.collectedFragment) { m.progress++; ev.push('missionProgress'); }
    if (m.kind === 'activate') for (const p of m.points) {
      if (p.charge >= 1) continue;
      if (Math.hypot(p.x - i.px, p.z - i.pz) <= ACTIVATE_RADIUS) {
        p.charge = Math.min(1, p.charge + i.dt / ACTIVATE_SECONDS);
        if (p.charge >= 1 - 1e-9) { p.charge = 1; m.progress++; ev.push('missionProgress'); }
      }
    }
    if (m.kind === 'miniboss') {
      if (!s.minibossSpawned && s.t >= MINIBOSS_AT) { s.minibossSpawned = true; ev.push('minibossSpawn'); }
      if (i.killedMiniboss) { m.progress = 1; ev.push('missionProgress'); }
    }
    if (m.progress >= m.goal) { m.done = true; s.bossUnlocked = true; ev.push('bossUnlocked'); }
  }
  if (s.bossUnlocked && !s.bossActive && Math.hypot(s.bossAltar.x - i.px, s.bossAltar.z - i.pz) <= ALTAR_RADIUS) {
    s.bossActive = true; ev.push('bossStarted');
  }
  if (s.bossActive && i.bossDead) { s.cleared = true; ev.push('phaseCleared'); return ev; }
  if (i.playerDead) ev.push('playerDied');
  return ev;
}
