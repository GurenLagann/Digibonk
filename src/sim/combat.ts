import type { Rng } from '../core/rng';
import { MOVES } from '../data/moves';
import { FORMS } from '../data/forms';
import type { AttributeId, MoveDef } from '../data/types';
import type { Enemy, EnemyPool } from './director';
import type { PlayerProg } from './progression';
import type { SpatialHash } from './spatial';
import { effectiveStats, incomingDamage, moveCooldown, outgoingDamage, typeMultiplier } from './stats';
import { norm } from './vec';
import type { BossState } from './boss';

export interface Projectile {
  x: number; z: number; vx: number; vz: number; dmg: number; radius: number; pierce: number; life: number;
  moveId: string; hit: Set<number>;
  orbit?: { angle: number; radius: number; angVel: number; rehit: number };
}
export type AreaShape = 'circle' | 'cone' | 'beam';
export interface Area {
  x: number; z: number; radius: number; dmg: number; life: number; maxLife: number; tick: number; moveId: string;
  /** atributo de quem atacou (golpes de chefe); o elemento vem do golpe */
  attribute?: AttributeId;
  follow: boolean; shape: AreaShape; dx: number; dz: number; length: number;
  /** seconds until it damages (telegraph); hostile areas only */
  delay: number; hostile: boolean; done: boolean;
}
export interface HostileProjectile { x: number; z: number; vx: number; vz: number; dmg: number; radius: number; life: number; moveId: string; attribute?: AttributeId }
export interface CombatState {
  cooldowns: number[]; projectiles: Projectile[]; areas: Area[]; hostiles: HostileProjectile[];
  invuln: number; hp: number; maxHp: number; facingX: number; facingZ: number;
  /** time since each slot last fired (render squash) */
  firedAgo: number[];
  bosses: Map<number, BossState>;
}
export type CombatEvent =
  | { type: 'kill'; enemy: Enemy }
  | { type: 'hit'; enemyId: number; dmg: number; x: number; z: number }
  | { type: 'playerHit'; dmg: number };

export const INVULN = 0.5;

export function newCombatState(p: PlayerProg): CombatState {
  const hp = effectiveStats(p).hp;
  return { cooldowns: p.slots.map(() => 0), projectiles: [], areas: [], hostiles: [], invuln: 0, hp, maxHp: hp, facingX: 1, facingZ: 0, firedAgo: p.slots.map(() => 99), bosses: new Map() };
}

const tmp: number[] = [];

function nearest(pool: EnemyPool, hash: SpatialHash, x: number, z: number, range: number): Enemy | null {
  tmp.length = 0; hash.query(x, z, range, tmp);
  let best: Enemy | null = null, bd = Infinity;
  for (const id of tmp) { const e = pool.get(id); if (!e) continue; const d = (e.x - x) ** 2 + (e.z - z) ** 2; if (d < bd) { bd = d; best = e; } }
  return best;
}

export function damageEnemy(e: Enemy, dmg: number, pool: EnemyPool, out: CombatEvent[]) {
  if (!e.alive) return;
  e.hp -= dmg; e.hitFlash = 0.1;
  out.push({ type: 'hit', enemyId: e.id, dmg, x: e.x, z: e.z });
  if (e.hp <= 0) { pool.kill(e.id); out.push({ type: 'kill', enemy: e }); }
}

export const PLAYER_HIT_RADIUS = 0.5;

function inArea(a: Area, e: Enemy): boolean { return pointInArea(a, e.x, e.z, e.size * 0.5); }

export function pointInArea(a: Area, x: number, z: number, er: number): boolean {
  const rx = x - a.x, rz = z - a.z;
  if (a.shape === 'circle') return rx * rx + rz * rz <= (a.radius + er) ** 2;
  const along = rx * a.dx + rz * a.dz;
  if (a.shape === 'beam') {
    const perp = Math.abs(rx * a.dz - rz * a.dx);
    return along >= -er && along <= a.length + er && perp <= a.radius + er;
  }
  // cone: 90° wide, length = radius
  const d = Math.hypot(rx, rz);
  if (d > a.radius + er) return false;
  if (d < er + 0.5) return true;
  return along / d >= Math.cos(Math.PI / 4);
}

/** dano de um golpe do jogador num inimigo, com a vantagem de tipagem */
function typedDamage(dmg: number, moveId: string, atkAttr: AttributeId, e: Enemy): number {
  return dmg * typeMultiplier(atkAttr, MOVES[moveId]?.element ?? 'neutral', e.attribute, e.element);
}

export function hitArea(a: Area, pool: EnemyPool, hash: SpatialHash, out: CombatEvent[], atkAttr: AttributeId = 'free') {
  const reach = a.shape === 'beam' ? a.length + a.radius : a.radius;
  const cx = a.shape === 'beam' ? a.x + a.dx * a.length * 0.5 : a.x, cz = a.shape === 'beam' ? a.z + a.dz * a.length * 0.5 : a.z;
  tmp.length = 0; hash.query(cx, cz, (a.shape === 'beam' ? reach * 0.5 + a.radius : reach) + 2, tmp);
  const ids = [...tmp];
  for (const id of ids) { const e = pool.get(id); if (e && inArea(a, e)) damageEnemy(e, typedDamage(a.dmg, a.moveId, atkAttr, e), pool, out); }
}

function fire(m: MoveDef, dmg: number, c: CombatState, px: number, pz: number, target: Enemy, pool: EnemyPool, hash: SpatialHash, out: CombatEvent[], atkAttr: AttributeId) {
  const [dx, dz] = norm(target.x - px, target.z - pz);
  c.facingX = dx; c.facingZ = dz;
  const base = { dmg, moveId: m.id, maxLife: m.duration ?? 0.3, life: m.duration ?? 0.3, tick: 0, delay: 0, hostile: false, done: false, dx, dz, length: m.range };
  switch (m.pattern) {
    case 'projectile': {
      const n = m.count ?? 1, sp = m.speed ?? 14, a0 = Math.atan2(dz, dx);
      for (let i = 0; i < n; i++) {
        const a = a0 + (i - (n - 1) / 2) * 0.22;
        c.projectiles.push({ x: px, z: pz, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, dmg, radius: m.radius ?? 0.5, pierce: m.pierce ?? 0, life: m.range / sp, moveId: m.id, hit: new Set() });
      }
      break;
    }
    case 'orbital': {
      const n = m.count ?? 1;
      for (let i = 0; i < n; i++) c.projectiles.push({ x: px, z: pz, vx: 0, vz: 0, dmg, radius: 0.8, pierce: Infinity, life: m.duration ?? 3, moveId: m.id, hit: new Set(),
        orbit: { angle: (i / n) * Math.PI * 2, radius: m.radius ?? 3, angVel: 3.2, rehit: 0.5 } });
      break;
    }
    case 'area': { const a: Area = { ...base, x: target.x, z: target.z, radius: m.radius ?? 2, follow: false, shape: 'circle' }; c.areas.push(a); hitArea(a, pool, hash, out, atkAttr); a.done = true; break; }
    case 'aura': { const a: Area = { ...base, x: px, z: pz, radius: m.radius ?? 3, follow: true, shape: 'circle', life: 0.2, maxLife: 0.2 }; c.areas.push(a); hitArea(a, pool, hash, out, atkAttr); a.done = true; break; }
    case 'cone': { const a: Area = { ...base, x: px, z: pz, radius: m.radius ?? m.range, follow: true, shape: 'cone', life: 0.15, maxLife: 0.15 }; c.areas.push(a); hitArea(a, pool, hash, out, atkAttr); a.done = true; break; }
    case 'beam': { const a: Area = { ...base, x: px, z: pz, radius: m.radius ?? 0.8, follow: true, shape: 'beam' }; c.areas.push(a); hitArea(a, pool, hash, out, atkAttr); a.done = true; break; }
  }
}

export function stepCombat(c: CombatState, p: PlayerProg, px: number, pz: number, pool: EnemyPool, hash: SpatialHash, dt: number, _rng: Rng): CombatEvent[] {
  const out: CombatEvent[] = [];
  const stats = effectiveStats(p);
  const form = FORMS[p.formId];
  /** golpe de chefe no jogador: atributo do chefe × elemento do golpe contra a tipagem da forma */
  const hostileMul = (attr: AttributeId | undefined, moveId: string) =>
    typeMultiplier(attr ?? 'free', MOVES[moveId]?.element ?? 'neutral', form.attribute, form.element);
  const alive = pool.alive();

  // enemy movement + separation
  hash.clear();
  for (const e of alive) hash.insert(e.id, e.x, e.z);
  for (const e of alive) {
    if (e.hitFlash > 0) e.hitFlash -= dt;
    if (c.bosses.has(e.id)) continue; // movido pela IA do chefe
    const [dx, dz] = norm(px - e.x, pz - e.z);
    let mx = dx * e.speed, mz = dz * e.speed;
    tmp.length = 0; hash.query(e.x, e.z, e.size * 0.7, tmp);
    let n = 0;
    for (const id of tmp) {
      if (id === e.id || n > 4) continue;
      const o = pool.get(id); if (!o) continue;
      const [sx, sz] = norm(e.x - o.x, e.z - o.z); mx += sx * 1.5; mz += sz * 1.5; n++;
    }
    e.x += mx * dt; e.z += mz * dt;
  }
  hash.clear();
  for (const e of alive) hash.insert(e.id, e.x, e.z);

  // contact damage
  if (c.invuln > 0) c.invuln -= dt;
  if (c.invuln <= 0) {
    tmp.length = 0; hash.query(px, pz, 3, tmp);
    for (const id of tmp) {
      const e = pool.get(id); if (!e) continue;
      if (Math.hypot(e.x - px, e.z - pz) < (e.size + 1) * 0.5) {
        const dmg = incomingDamage(e.dmg * typeMultiplier(e.attribute, e.element, form.attribute, form.element), stats.def);
        c.hp -= dmg; c.invuln = INVULN; out.push({ type: 'playerHit', dmg }); break;
      }
    }
  }

  // fire slots
  for (let i = 0; i < p.slots.length; i++) {
    const s = p.slots[i];
    if (c.cooldowns[i] === undefined) { c.cooldowns[i] = 0; c.firedAgo[i] = 99; }
    c.firedAgo[i] += dt;
    if (!s) continue;
    c.cooldowns[i] = Math.max(0, c.cooldowns[i] - dt);
    if (c.cooldowns[i] > 0) continue;
    const m = MOVES[s.moveId];
    const reach = m.pattern === 'aura' || m.pattern === 'orbital' ? (m.radius ?? m.range) + 0.5 : m.range;
    const target = nearest(pool, hash, px, pz, reach);
    if (!target) continue;
    fire(m, outgoingDamage(p, s), c, px, pz, target, pool, hash, out, form.attribute);
    c.cooldowns[i] = moveCooldown(p, s);
    c.firedAgo[i] = 0;
  }

  // projectiles
  for (let i = c.projectiles.length - 1; i >= 0; i--) {
    const pr = c.projectiles[i];
    pr.life -= dt;
    if (pr.orbit) {
      pr.orbit.angle += pr.orbit.angVel * dt;
      pr.x = px + Math.cos(pr.orbit.angle) * pr.orbit.radius; pr.z = pz + Math.sin(pr.orbit.angle) * pr.orbit.radius;
      pr.orbit.rehit -= dt; if (pr.orbit.rehit <= 0) { pr.hit.clear(); pr.orbit.rehit = 0.5; }
    } else { pr.x += pr.vx * dt; pr.z += pr.vz * dt; }
    let dead = pr.life <= 0;
    if (!dead) {
      tmp.length = 0; hash.query(pr.x, pr.z, pr.radius + 1.8, tmp);
      const ids = [...tmp];
      for (const id of ids) {
        const e = pool.get(id); if (!e || pr.hit.has(id)) continue;
        if (Math.hypot(e.x - pr.x, e.z - pr.z) <= pr.radius + e.size * 0.5) {
          pr.hit.add(id); damageEnemy(e, typedDamage(pr.dmg, pr.moveId, form.attribute, e), pool, out);
          if (!pr.orbit && pr.hit.size > pr.pierce) { dead = true; break; }
        }
      }
    }
    if (dead) c.projectiles.splice(i, 1);
  }

  // hostile projectiles
  for (let i = c.hostiles.length - 1; i >= 0; i--) {
    const h = c.hostiles[i];
    h.x += h.vx * dt; h.z += h.vz * dt; h.life -= dt;
    let dead = h.life <= 0;
    if (!dead && Math.hypot(h.x - px, h.z - pz) <= h.radius + PLAYER_HIT_RADIUS) {
      dead = true;
      if (c.invuln <= 0) { const dmg = incomingDamage(h.dmg * hostileMul(h.attribute, h.moveId), stats.def); c.hp -= dmg; c.invuln = INVULN; out.push({ type: 'playerHit', dmg }); }
    }
    if (dead) c.hostiles.splice(i, 1);
  }

  // areas (visual lifetime; follow player; hostile ones telegraph then strike once)
  for (let i = c.areas.length - 1; i >= 0; i--) {
    const a = c.areas[i];
    if (a.follow) { a.x = px; a.z = pz; }
    if (a.hostile && !a.done) {
      a.delay -= dt;
      if (a.delay <= 0) {
        a.done = true;
        if (a.dmg > 0 && c.invuln <= 0 && pointInArea(a, px, pz, PLAYER_HIT_RADIUS)) {
          const dmg = incomingDamage(a.dmg * hostileMul(a.attribute, a.moveId), stats.def); c.hp -= dmg; c.invuln = INVULN; out.push({ type: 'playerHit', dmg });
        }
      }
    }
    a.life -= dt;
    if (a.life <= 0) c.areas.splice(i, 1);
  }
  return out;
}
