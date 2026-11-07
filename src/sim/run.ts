import { createRng, type Rng } from '../core/rng';
import { storeSave, type SaveData } from '../core/save';
import { CARDS } from '../data/cards';
import { BOSSES, MINIBOSSES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';
import { gainItem, offerPassive, replacePassive, slashIntoSlot } from './cards';
import { newCombatState, stepCombat, type CombatState } from './combat';
import { difficulty, EnemyPool, stepDirector, type DirectorState } from './director';
import { availableEvolutions, evolve, EvoNotifier } from './evolution';
import { collect, dropOnKill, eligibleCards, eligibleItems, placeChests, rollChest, type Chest, type Pickup } from './loot';
import { MAP_OBSTACLES } from './map';
import { newPhase, stepPhase, type PhaseState } from './phase';
import { addXp, applyOffer, newPlayerProg, rollOffers, type LevelOffer, type PlayerProg } from './progression';
import { SpatialHash } from './spatial';
import { effectiveStats } from './stats';
import { clamp } from './vec';

export interface InputState { mx: number; mz: number }
export type RunEvent =
  | { type: 'levelUp' } | { type: 'evolutionAvailable'; forms: string[] } | { type: 'bossUnlocked' } | { type: 'bossStarted' }
  | { type: 'overtime' } | { type: 'phaseCleared'; phase: number } | { type: 'victory' } | { type: 'defeat' }
  | { type: 'cardFound'; cardId: string } | { type: 'itemFound'; itemId: string } | { type: 'partnerUnlocked'; partnerId: string }
  | { type: 'kill'; x: number; z: number } | { type: 'hit'; x: number; z: number; dmg: number }
  | { type: 'missionProgress' } | { type: 'minibossSpawned' } | { type: 'chestOpened'; x: number; z: number } | { type: 'playerHit'; dmg: number };

export interface RunState {
  partnerId: string; seed: number; rng: Rng; save: SaveData; storage: Storage | null | undefined;
  prog: PlayerProg; combat: CombatState; px: number; pz: number; moving: boolean;
  pool: EnemyPool; hash: SpatialHash; director: DirectorState; phase: PhaseState;
  pickups: Pickup[]; chests: Chest[]; evo: EvoNotifier;
  paused: boolean; ended: null | 'victory' | 'defeat'; time: number;
  offers: LevelOffer[] | null; pendingCard: string | null;
  nextPickupId: number; unlockedThisRun: string[];
  /** dev only */
  debug: { xpMul: number; forceItems: boolean };
}

export const PLAYER_RADIUS = 0.5, CHEST_RADIUS = 1.6;

function setupPhase(r: RunState, n: number) {
  r.phase = newPhase(n, r.rng);
  r.pool.clearAll(); r.pickups.length = 0;
  r.combat.projectiles.length = 0; r.combat.areas.length = 0; r.combat.hostiles.length = 0;
  r.px = 0; r.pz = 0;
  r.director = { pool: r.pool, phase: n, t: 0, acc: 0, px: 0, pz: 0 };
  r.chests = placeChests(n, r.rng);
  if (r.phase.mission.kind === 'collect') for (const p of r.phase.mission.points) r.pickups.push({ id: r.nextPickupId++, x: p.x, z: p.z, kind: 'fragment', value: 1 });
  syncHp(r); r.combat.hp = r.combat.maxHp;
}

function syncHp(r: RunState) {
  const max = effectiveStats(r.prog).hp;
  if (max > r.combat.maxHp) r.combat.hp += max - r.combat.maxHp;
  r.combat.maxHp = max;
  if (r.combat.hp > max) r.combat.hp = max;
}

export function createRun(opts: { partnerId: string; seed: number; save: SaveData; storage?: Storage | null }): RunState {
  const partner = PARTNERS.find(p => p.id === opts.partnerId);
  if (!partner) throw new Error(`unknown partner ${opts.partnerId}`);
  const prog = newPlayerProg(partner.childForm);
  const pool = new EnemyPool();
  const r: RunState = {
    partnerId: partner.id, seed: opts.seed, rng: createRng(opts.seed), save: opts.save, storage: opts.storage,
    prog, combat: newCombatState(prog), px: 0, pz: 0, moving: false, pool, hash: new SpatialHash(4),
    director: { pool, phase: 1, t: 0, acc: 0, px: 0, pz: 0 }, phase: undefined as unknown as PhaseState,
    pickups: [], chests: [], evo: new EvoNotifier(), paused: false, ended: null, time: 0, offers: null, pendingCard: null,
    nextPickupId: 1, unlockedThisRun: [], debug: { xpMul: 1, forceItems: false },
  };
  if (!r.save.discovered.includes(partner.childForm)) r.save.discovered.push(partner.childForm);
  setupPhase(r, 1);
  return r;
}

function persist(r: RunState) { storeSave(r.save, r.storage); }

function finish(r: RunState, result: 'victory' | 'defeat', ev: RunEvent[]) {
  r.ended = result;
  const rec = r.save.records;
  rec.runs++; if (result === 'victory') rec.wins++;
  rec.bestPhase = Math.max(rec.bestPhase, result === 'victory' ? T.PHASES : r.phase.phase);
  persist(r);
  ev.push({ type: result });
}

function movePlayer(r: RunState, input: InputState, dt: number) {
  let { mx, mz } = input;
  const l = Math.hypot(mx, mz);
  if (l > 1) { mx /= l; mz /= l; }
  r.moving = l > 0.05;
  const speed = 4 + effectiveStats(r.prog).spd * 0.08;
  let x = r.px + mx * speed * dt, z = r.pz + mz * speed * dt;
  for (const o of MAP_OBSTACLES) {
    const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), min = o.r + PLAYER_RADIUS;
    if (d < min && d > 1e-6) { x = o.x + (dx / d) * min; z = o.z + (dz / d) * min; }
  }
  r.px = clamp(x, -T.MAP_HALF, T.MAP_HALF); r.pz = clamp(z, -T.MAP_HALF, T.MAP_HALF);
}

function spawnPickup(r: RunState, x: number, z: number, roll: { kind: 'card' | 'item' | 'heal'; ref?: string }) {
  r.pickups.push({ id: r.nextPickupId++, x, z, kind: roll.kind, value: 0, ref: roll.ref });
}

function handleCard(r: RunState, cardId: string, ev: RunEvent[]) {
  const c = CARDS[cardId]; if (!c) return;
  ev.push({ type: 'cardFound', cardId });
  if (c.kind === 'rare') { gainItem(r.prog, cardId); return; }
  if (c.kind === 'passive') { if (offerPassive(r.prog, cardId).status === 'full') r.pendingCard = cardId; else syncHp(r); return; }
  r.pendingCard = cardId; // slash: player chooses slot
}

function handleItem(r: RunState, itemId: string, ev: RunEvent[]) {
  const it = ITEMS[itemId]; if (!it) return;
  if (it.kind === 'egg' && it.unlockPartner) {
    if (!r.save.unlocked.includes(it.unlockPartner)) {
      r.save.unlocked.push(it.unlockPartner); r.unlockedThisRun.push(it.unlockPartner); persist(r);
      ev.push({ type: 'partnerUnlocked', partnerId: it.unlockPartner });
    }
    return;
  }
  gainItem(r.prog, itemId);
  ev.push({ type: 'itemFound', itemId });
}

export function stepRun(r: RunState, input: InputState, dt: number): RunEvent[] {
  if (r.paused || r.ended || r.offers !== null || r.pendingCard !== null) return [];
  const ev: RunEvent[] = [];
  r.time += dt;
  movePlayer(r, input, dt);

  const d = r.director; d.phase = r.phase.phase; d.t = r.phase.t; d.px = r.px; d.pz = r.pz;
  stepDirector(d, dt, r.rng);

  let killedMiniboss = false, bossDead = false, collectedFragment = false;
  const stats = effectiveStats(r.prog);
  for (const ce of stepCombat(r.combat, r.prog, r.px, r.pz, r.pool, r.hash, dt, r.rng)) {
    if (ce.type === 'hit') ev.push({ type: 'hit', x: ce.x, z: ce.z, dmg: ce.dmg });
    else if (ce.type === 'playerHit') ev.push({ type: 'playerHit', dmg: ce.dmg });
    else {
      const e = ce.enemy;
      r.prog.kills++;
      ev.push({ type: 'kill', x: e.x, z: e.z });
      if (e.boss) {
        if (e.id === r.phase.bossId) bossDead = true;
        for (let k = 0; k < 2; k++) spawnPickup(r, e.x + k * 1.2, e.z, rollChest(r.partnerId, r.save, r.prog.items, r.phase.phase, r.rng));
        continue;
      }
      if (e.miniboss) { killedMiniboss = true; spawnPickup(r, e.x, e.z, rollChest(r.partnerId, r.save, r.prog.items, r.phase.phase, r.rng)); }
      const drop = dropOnKill(e, r.rng);
      if (drop.xp > 0) r.pickups.push({ id: r.nextPickupId++, x: e.x, z: e.z, kind: 'xp', value: drop.xp });
      if (drop.extra === 'heal') spawnPickup(r, e.x + 0.6, e.z, { kind: 'heal' });
      if (drop.extra === 'card') {
        const cards = eligibleCards(r.partnerId).filter(c => c.kind !== 'rare');
        spawnPickup(r, e.x + 0.6, e.z, { kind: 'card', ref: r.rng.weighted(cards, c => c.weight).id });
      }
    }
  }
  if (r.phase.bossActive && r.phase.bossId !== null && !r.pool.get(r.phase.bossId)) bossDead = true;

  // pickups
  for (const p of collect(r.pickups, r.px, r.pz, 1.5 * stats.pickupMul)) {
    if (p.kind === 'xp') addXp(r.prog, p.value * stats.xpMul * r.debug.xpMul);
    else if (p.kind === 'heal') r.combat.hp = Math.min(r.combat.maxHp, r.combat.hp + r.combat.maxHp * 0.25);
    else if (p.kind === 'fragment') collectedFragment = true;
    else if (p.kind === 'card' && p.ref) handleCard(r, p.ref, ev);
    else if (p.kind === 'item' && p.ref) handleItem(r, p.ref, ev);
  }
  for (const c of r.chests) {
    if (c.opened || Math.hypot(c.x - r.px, c.z - r.pz) > CHEST_RADIUS) continue;
    c.opened = true; ev.push({ type: 'chestOpened', x: c.x, z: c.z });
    const forced = r.debug.forceItems ? eligibleItems(r.partnerId, r.save, r.prog.items) : [];
    spawnPickup(r, c.x, c.z, forced.length ? { kind: 'item', ref: r.rng.pick(forced).id } : rollChest(r.partnerId, r.save, r.prog.items, r.phase.phase, r.rng));
  }

  // phase
  const playerDead = r.combat.hp <= 0;
  for (const pe of stepPhase(r.phase, { px: r.px, pz: r.pz, dt, killedMiniboss, collectedFragment, bossDead, playerDead })) {
    if (pe === 'missionProgress') ev.push({ type: 'missionProgress' });
    else if (pe === 'bossUnlocked') ev.push({ type: 'bossUnlocked' });
    else if (pe === 'overtimeStarted') ev.push({ type: 'overtime' });
    else if (pe === 'minibossSpawn') {
      const defs = MINIBOSSES.filter(m => m.minPhase <= r.phase.phase);
      const def = r.rng.pick(defs.length ? defs : MINIBOSSES);
      const a = r.rng.next() * Math.PI * 2, diff = difficulty(r.phase.phase, r.phase.t);
      r.pool.spawn(def, clamp(r.px + Math.cos(a) * 16, -T.MAP_HALF, T.MAP_HALF), clamp(r.pz + Math.sin(a) * 16, -T.MAP_HALF, T.MAP_HALF), { hp: diff.hpMul, dmg: diff.dmgMul }, { miniboss: true });
      ev.push({ type: 'minibossSpawned' });
    } else if (pe === 'bossStarted') {
      const def = BOSSES.find(b => b.phase === r.phase.phase)!;
      const diff = difficulty(r.phase.phase, r.phase.t);
      const b = r.pool.spawn(def, r.phase.bossAltar.x, r.phase.bossAltar.z + 6, { hp: diff.hpMul, dmg: diff.dmgMul }, { boss: true })!;
      r.phase.bossId = b.id;
      ev.push({ type: 'bossStarted' });
    } else if (pe === 'phaseCleared') {
      const n = r.phase.phase;
      ev.push({ type: 'phaseCleared', phase: n });
      if (n >= T.PHASES) { finish(r, 'victory', ev); return ev; }
      setupPhase(r, n + 1);
      return ev;
    } else if (pe === 'playerDied') { finish(r, 'defeat', ev); return ev; }
  }

  // evolution + level-up
  const avail = availableEvolutions(r.prog, { save: r.save, phase: r.phase.phase });
  if (r.evo.update(avail).length) ev.push({ type: 'evolutionAvailable', forms: avail });
  if (r.prog.pendingLevelUps > 0 && r.offers === null) { r.offers = rollOffers(r.prog, r.rng); ev.push({ type: 'levelUp' }); }
  syncHp(r);
  return ev;
}

export function chooseOffer(r: RunState, index: number): void {
  if (!r.offers) return;
  const o = r.offers[index]; if (!o) return;
  applyOffer(r.prog, o);
  r.offers = null;
  if (r.prog.pendingLevelUps > 0) r.offers = rollOffers(r.prog, r.rng);
  syncHp(r);
}

export function doEvolve(r: RunState, formId: string): void {
  evolve(r.prog, formId, { save: r.save, phase: r.phase.phase });
  if (!r.save.discovered.includes(formId)) r.save.discovered.push(formId);
  persist(r);
  r.evo.reset();
  syncHp(r);
  r.combat.hp = r.combat.maxHp;
}

export function resolveCard(r: RunState, choice: { passiveSlot?: number | null; moveSlot?: number }): void {
  const id = r.pendingCard; if (!id) return;
  const c = CARDS[id];
  if (c?.kind === 'passive' && choice.passiveSlot !== undefined) replacePassive(r.prog, choice.passiveSlot, id);
  if (c?.kind === 'slash' && choice.moveSlot !== undefined) slashIntoSlot(r.prog, choice.moveSlot, id);
  r.pendingCard = null;
  syncHp(r);
}
