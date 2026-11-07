import type { Rng } from '../core/rng';
import { MOVES } from '../data/moves';
import { T } from '../data/tuning';
import type { AttributeId, BossDef } from '../data/types';
import type { CombatState } from './combat';
import type { Enemy } from './director';
import { clamp, norm } from './vec';

export interface BossState { cooldown: number; mode: 'chase' | 'windup' | 'charge'; t: number; dx: number; dz: number }
export const newBossState = (): BossState => ({ cooldown: 2, mode: 'chase', t: 0, dx: 0, dz: 0 });

function hostileArea(c: CombatState, x: number, z: number, opts: { radius: number; dmg: number; delay: number; moveId: string; attribute: AttributeId; shape?: 'circle' | 'beam'; dx?: number; dz?: number; length?: number }) {
  const life = opts.delay + 0.3;
  c.areas.push({ x, z, radius: opts.radius, dmg: opts.dmg, life, maxLife: life, tick: 0, moveId: opts.moveId, attribute: opts.attribute, follow: false,
    shape: opts.shape ?? 'circle', dx: opts.dx ?? 1, dz: opts.dz ?? 0, length: opts.length ?? 0, delay: opts.delay, hostile: true, done: false });
}

export function stepBoss(b: Enemy, def: BossDef, st: BossState, c: CombatState, px: number, pz: number, dt: number, rng: Rng): void {
  const move = MOVES[def.moves[0]];
  const dmg = move.damage * (b.dmg / def.dmg);
  const [tx, tz] = norm(px - b.x, pz - b.z);
  if (st.mode === 'windup') { st.t -= dt; if (st.t <= 0) { st.mode = 'charge'; st.t = move.duration ?? 0.6; } return; }
  if (st.mode === 'charge') {
    b.x = clamp(b.x + st.dx * (move.speed ?? 20) * dt, -T.MAP_HALF, T.MAP_HALF);
    b.z = clamp(b.z + st.dz * (move.speed ?? 20) * dt, -T.MAP_HALF, T.MAP_HALF);
    st.t -= dt; if (st.t <= 0) { st.mode = 'chase'; st.cooldown = move.cooldown; }
    return;
  }
  b.x += tx * b.speed * dt; b.z += tz * b.speed * dt;
  st.cooldown -= dt;
  if (st.cooldown > 0) return;
  st.cooldown = move.cooldown;
  const a0 = Math.atan2(tz, tx);
  switch (def.moves[0]) {
    case 'touch_of_evil':
      st.mode = 'windup'; st.t = 0.5; st.dx = tx; st.dz = tz;
      hostileArea(c, b.x, b.z, { radius: 1.4, dmg: 0, delay: 0.5, moveId: move.id, attribute: b.attribute, shape: 'beam', dx: tx, dz: tz, length: (move.speed ?? 20) * (move.duration ?? 0.6) });
      break;
    case 'dark_network': {
      const n = move.count ?? 8, sp = move.speed ?? 9;
      for (let i = 0; i < n; i++) { const a = a0 + (i / (n - 1) - 0.5) * (Math.PI * 0.8); c.hostiles.push({ x: b.x, z: b.z, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, dmg, radius: move.radius ?? 0.6, life: move.range / sp, moveId: move.id, attribute: b.attribute }); }
      break;
    }
    case 'crimson_lightning': {
      hostileArea(c, px, pz, { radius: move.radius ?? 4, dmg, delay: move.duration ?? 1, moveId: move.id, attribute: b.attribute });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.hostiles.push({ x: b.x, z: b.z, vx: Math.cos(a) * 7, vz: Math.sin(a) * 7, dmg: dmg * 0.5, radius: 0.5, life: 2, moveId: move.id, attribute: b.attribute }); }
      break;
    }
    case 'heat_viper':
      [-0.4, 0, 0.4].forEach((off, i) => hostileArea(c, b.x, b.z, { radius: move.radius ?? 1.2, dmg, delay: 1 + i * 0.3, moveId: move.id, attribute: b.attribute, shape: 'beam', dx: Math.cos(a0 + off), dz: Math.sin(a0 + off), length: move.range }));
      break;
    case 'trump_sword': {
      const a = rng.next() * Math.PI * 2;
      b.x = clamp(px + Math.cos(a) * 9, -T.MAP_HALF, T.MAP_HALF); b.z = clamp(pz + Math.sin(a) * 9, -T.MAP_HALF, T.MAP_HALF);
      const sp = move.speed ?? 12;
      for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) c.hostiles.push({ x: px + ox * 10, z: pz + oz * 10, vx: -ox * sp, vz: -oz * sp, dmg, radius: move.radius ?? 0.8, life: 20 / sp, moveId: move.id, attribute: b.attribute });
      break;
    }
  }
}
