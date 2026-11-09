import type { Rng } from '../core/rng';
import { ENEMIES } from '../data/enemies';
import { T } from '../data/tuning';
import type { AttributeId, BossDef, ElementId, EnemyDef } from '../data/types';
import { clamp } from './vec';

export interface Enemy {
  id: number; def: string; x: number; z: number; hp: number; maxHp: number; dmg: number; speed: number;
  size: number; xp: number; alive: boolean; boss: boolean; miniboss: boolean; hitFlash: number;
  attribute: AttributeId; element: ElementId;
}

export class EnemyPool {
  readonly all: Enemy[] = [];
  private free: number[] = [];
  private normalAlive = 0;
  spawn(def: EnemyDef | BossDef, x: number, z: number, scale: { hp: number; dmg: number }, flags: { boss?: boolean; miniboss?: boolean } = {}): Enemy | null {
    const special = !!(flags.boss || flags.miniboss);
    if (!special && this.normalAlive >= T.MAX_ENEMIES) return null;
    const id = this.free.length ? this.free.pop()! : this.all.length;
    const hp = def.hp * scale.hp;
    const e: Enemy = { id, def: def.id, x, z, hp, maxHp: hp, dmg: def.dmg * scale.dmg, speed: def.speed, size: def.size,
      xp: 'xp' in def ? def.xp : 0, alive: true, boss: !!flags.boss, miniboss: !!flags.miniboss, hitFlash: 0,
      attribute: def.attribute, element: def.element };
    this.all[id] = e;
    if (!special) this.normalAlive++;
    return e;
  }
  get(id: number): Enemy | undefined { const e = this.all[id]; return e && e.alive ? e : undefined; }
  kill(id: number) {
    const e = this.all[id]; if (!e || !e.alive) return;
    e.alive = false; this.free.push(id);
    if (!e.boss && !e.miniboss) this.normalAlive--;
  }
  clearAll() { for (const e of this.all) if (e && e.alive) this.kill(e.id); }
  alive(): Enemy[] { return this.all.filter(e => e && e.alive); }
}

export function difficulty(phase: number, t: number) {
  const base = Math.min(t, T.PHASE_SECONDS);
  let spawnPerSec = 1.5 + phase * 0.8 + (base / 60) * 0.6;
  let hpMul = (1 + (phase - 1) * 0.9) * (1 + (base / T.PHASE_SECONDS) * 0.6);
  let dmgMul = hpMul;
  if (t > T.PHASE_SECONDS) {
    const m = (t - T.PHASE_SECONDS) / 60;
    spawnPerSec *= 4 + 2 * m;
    hpMul *= (1 + 0.5 * m) ** 2;
    dmgMul *= (1 + 0.5 * m) ** 2;
  }
  return { spawnPerSec, hpMul, dmgMul };
}

export interface DirectorState { pool: EnemyPool; phase: number; t: number; acc: number; px: number; pz: number;
  /** nível de Corrupção do Etemon (mais inimigos e mais fortes) */
  corruption?: number }

export function stepDirector(s: DirectorState, dt: number, rng: Rng): void {
  const d = difficulty(s.phase, s.t);
  const c = s.corruption ?? 0, power = 1 + c * T.ALTARS.CORRUPTION_POWER;
  s.acc += d.spawnPerSec * (1 + c * T.ALTARS.CORRUPTION_SPAWN) * dt;
  const eligible = ENEMIES.filter(e => e.minPhase <= s.phase);
  while (s.acc >= 1) {
    s.acc -= 1;
    const def = rng.weighted(eligible, e => 1 + e.minPhase * 0.75);
    let x = 0, z = 0;
    for (let tries = 0; tries < 6; tries++) {
      const a = rng.next() * Math.PI * 2, r = 22 + rng.next() * 6;
      x = s.px + Math.cos(a) * r; z = s.pz + Math.sin(a) * r;
      if (Math.abs(x) <= T.MAP_HALF && Math.abs(z) <= T.MAP_HALF) break;
    }
    x = clamp(x, -T.MAP_HALF, T.MAP_HALF); z = clamp(z, -T.MAP_HALF, T.MAP_HALF);
    s.pool.spawn(def, x, z, { hp: d.hpMul * power, dmg: d.dmgMul * power });
  }
}
