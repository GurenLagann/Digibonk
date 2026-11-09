import { createRng, type Rng } from '../core/rng';
import { storeSave, type SaveData } from '../core/save';
import { CARDS } from '../data/cards';
import { BOSSES, MINIBOSSES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';
import { gainItem, levelUpOwnedCard, maxedCards, offerPassive, replacePassive, slashIntoSlot } from './cards';
import { newCombatState, stepCombat, type CombatState } from './combat';
import { newBossState, stepBoss } from './boss';
import { difficulty, EnemyPool, stepDirector, type DirectorState } from './director';
import { evolve, EvoNotifier, mature } from './evolution';
import { discover, drawPool, edgeId, knownAvailable, reveal, secretAvailable, withoutReveals, type Reveal } from './discovery';
import { collect, dropOnKill, eligibleCards, eligibleItems, placeChests, rollChest, type Chest, type Pickup } from './loot';
import { MAP_OBSTACLES } from './map';
import { newPhase, stepPhase, type PhaseState } from './phase';
import { addXp, applyOffer, autoGain, newPlayerProg, nothingToImprove, offerKey, rollOffers, trackNearDeath, type LevelOffer, type PlayerProg } from './progression';
import { SpatialHash } from './spatial';
import { effectiveStats } from './stats';
import { clamp } from './vec';
import { relicEffects } from './relics';
import type { StatKey } from '../data/types';

export interface InputState { mx: number; mz: number }
export type RunEvent =
  | { type: 'levelUp' } | { type: 'evolutionAvailable'; forms: string[] } | { type: 'bossUnlocked' } | { type: 'bossStarted' }
  | { type: 'overtime' } | { type: 'phaseCleared'; phase: number } | { type: 'victory' } | { type: 'defeat' }
  | { type: 'cardFound'; cardId: string } | { type: 'itemFound'; itemId: string } | { type: 'partnerUnlocked'; partnerId: string }
  | { type: 'kill'; x: number; z: number } | { type: 'hit'; x: number; z: number; dmg: number }
  | { type: 'missionProgress' } | { type: 'minibossSpawned' } | { type: 'chestOpened'; x: number; z: number } | { type: 'playerHit'; dmg: number }
  | { type: 'cardLeveled'; cardId: string; level: number }
  | { type: 'formDiscovered'; formId: string } | { type: 'digiData' }
  | { type: 'autoGain'; level: number; stat: StatKey; amount: number } | { type: 'revived' };

export interface RunState {
  partnerId: string; seed: number; rng: Rng; save: SaveData; storage: Storage | null | undefined;
  prog: PlayerProg; combat: CombatState; px: number; pz: number; moving: boolean;
  /** última direção horizontal de movimento (para espelhar o sprite) */
  dirX: number;
  /** eixo dominante do último movimento (para escolher os quadros de lado/costas/frente) */
  facing: 'side' | 'up' | 'down' | 'diagup' | 'diagdown';
  /** velocidade de movimento no início da partida (render troca para corrida quando dobra) */
  baseSpeed: number;
  pool: EnemyPool; hash: SpatialHash; director: DirectorState; phase: PhaseState;
  pickups: Pickup[]; chests: Chest[]; evo: EvoNotifier;
  paused: boolean; ended: null | 'victory' | 'defeat'; time: number;
  offers: LevelOffer[] | null; pendingCard: string | null;
  /** 2+ evoluções secretas ao mesmo tempo: o jogador escolhe às cegas (ids de forma) */
  blindChoice: string[] | null;
  /** usos restantes de atualizar/pular/banir no level up e as ofertas banidas (offerKey) */
  levelTools: { reroll: number; skip: number; ban: number }; banned: string[];
  /** relíquia de reviver já usada nesta partida */
  reviveUsed: boolean;
  /** sorteios de Digi Data (gerador separado para não mexer na sequência de `rng`) */
  dataRng: Rng;
  /** requisitos revelados por Digi Data nesta partida (mostrados no resultado) */
  digiDataThisRun: Reveal[];
  /** chefes de fase e guardiões derrotados nesta partida */
  stats: { bosses: number; guardians: number };
  /** true quando `finish` superou o bestPhase deste parceiro */
  newRecord: boolean;
  nextPickupId: number; unlockedThisRun: string[];
  /** dev only */
  debug: { xpMul: number; forceItems: boolean; god: boolean; doubleSpeed: boolean; speedBonus: number };
}

export const PLAYER_RADIUS = 0.5, CHEST_RADIUS = 1.6;

function setupPhase(r: RunState, n: number) {
  r.phase = newPhase(n, r.rng);
  r.pool.clearAll(); r.pickups.length = 0;
  r.combat.projectiles.length = 0; r.combat.areas.length = 0; r.combat.hostiles.length = 0; r.combat.bosses.clear();
  r.px = 0; r.pz = 0;
  r.director = { pool: r.pool, phase: n, t: 0, acc: 0, px: 0, pz: 0 };
  r.chests = placeChests(n, r.rng);
  if (r.phase.mission.kind === 'collect') for (const p of r.phase.mission.points) r.pickups.push({ id: r.nextPickupId++, x: p.x, z: p.z, kind: 'fragment', value: 1 });
  placeDigiData(r);
  syncHp(r); r.combat.hp = r.combat.maxHp;
}

/** Digi Data da fase: em pontos aleatórios longe do início, só enquanto houver requisito para revelar */
function placeDigiData(r: RunState) {
  const n = Math.min(r.dataRng.int(T.DIGIDATA_PER_PHASE_MIN, T.DIGIDATA_PER_PHASE_MAX), drawPool(r.save).length);
  const lim = T.MAP_HALF - 8;
  for (let placed = 0, tries = 0; placed < n && tries < 1000; tries++) {
    const x = (r.dataRng.next() * 2 - 1) * lim, z = (r.dataRng.next() * 2 - 1) * lim;
    if (Math.hypot(x, z) < 15) continue;
    r.pickups.push({ id: r.nextPickupId++, x, z, kind: 'digidata', value: 0 });
    placed++;
  }
}

/** coleta de Digi Data: sorteia e grava um requisito oculto (o jogador só vê no resultado) */
function collectDigiData(r: RunState, ev: RunEvent[]) {
  ev.push({ type: 'digiData' });
  const pool = drawPool(r.save);
  if (!pool.length) return;
  const got = r.dataRng.pick(pool);
  reveal(r.save, got); r.digiDataThisRun.push(got);
  persist(r);
}

/** @internal usado por sim/debug */
export function syncHp(r: RunState) {
  const max = effectiveStats(r.prog).hp;
  if (max > r.combat.maxHp) r.combat.hp += max - r.combat.maxHp;
  r.combat.maxHp = max;
  if (r.combat.hp > max) r.combat.hp = max;
}

/** velocidade de movimento (unidades/s) pelo atributo Velocidade */
export function playerSpeed(p: PlayerProg): number { return 4 + effectiveStats(p).spd * 0.08; }

export function createRun(opts: { partnerId: string; seed: number; save: SaveData; storage?: Storage | null }): RunState {
  const partner = PARTNERS.find(p => p.id === opts.partnerId);
  if (!partner) throw new Error(`unknown partner ${opts.partnerId}`);
  const prog = newPlayerProg(partner.childForm);
  const pool = new EnemyPool();
  const r: RunState = {
    partnerId: partner.id, seed: opts.seed, rng: createRng(opts.seed), save: opts.save, storage: opts.storage,
    prog, combat: newCombatState(prog), px: 0, pz: 0, moving: false, dirX: -1, facing: 'side', baseSpeed: playerSpeed(prog), pool, hash: new SpatialHash(4),
    director: { pool, phase: 1, t: 0, acc: 0, px: 0, pz: 0 }, phase: undefined as unknown as PhaseState,
    pickups: [], chests: [], evo: new EvoNotifier(), paused: false, ended: null, time: 0, offers: null, pendingCard: null, blindChoice: null, levelTools: { ...T.LEVEL_TOOLS }, banned: [], reviveUsed: false, dataRng: createRng((opts.seed ^ 0x5eedda7a) >>> 0), digiDataThisRun: [],
    stats: { bosses: 0, guardians: 0 }, newRecord: false, nextPickupId: 1, unlockedThisRun: [], debug: { xpMul: 1, forceItems: false, god: false, doubleSpeed: false, speedBonus: 0 },
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
  const best = result === 'victory' ? T.PHASES : r.phase.phase;
  const pr = r.save.partnerRecords[r.partnerId] ??= { runs: 0, wins: 0, bestPhase: 0 };
  pr.runs++; if (result === 'victory') pr.wins++;
  r.newRecord = best > pr.bestPhase;
  pr.bestPhase = Math.max(pr.bestPhase, best);
  persist(r);
  ev.push({ type: result });
}

function movePlayer(r: RunState, input: InputState, dt: number) {
  let { mx, mz } = input;
  const l = Math.hypot(mx, mz);
  if (l > 1) { mx /= l; mz /= l; }
  r.moving = l > 0.05;
  if (Math.abs(mx) > 0.05) r.dirX = Math.sign(mx);
  if (r.moving) {
    // 8 direções: setores de 45° (lado, diagonais, cima/baixo); esquerda/direita vêm do dirX
    const a = Math.atan2(Math.abs(mz), Math.abs(mx));
    r.facing = a < Math.PI / 8 ? 'side' : a > (3 * Math.PI) / 8 ? (mz < 0 ? 'up' : 'down') : mz < 0 ? 'diagup' : 'diagdown';
  }
  const speed = playerSpeed(r.prog);
  let x = r.px + mx * speed * dt, z = r.pz + mz * speed * dt;
  for (const o of MAP_OBSTACLES) {
    const dx = x - o.x, dz = z - o.z, d = Math.hypot(dx, dz), min = o.r + PLAYER_RADIUS;
    if (d < min && d > 1e-6) { x = o.x + (dx / d) * min; z = o.z + (dz / d) * min; }
  }
  r.px = clamp(x, -T.MAP_HALF, T.MAP_HALF); r.pz = clamp(z, -T.MAP_HALF, T.MAP_HALF);
}

function lootRoll(r: RunState, alsoOwned: string[] = []): { kind: 'card' | 'item' | 'heal'; ref?: string } {
  const owned = [...r.prog.items, ...alsoOwned];
  const forced = r.debug.forceItems ? eligibleItems(r.partnerId, r.save, owned) : [];
  return forced.length ? { kind: 'item', ref: r.rng.pick(forced).id } : rollChest(r.partnerId, r.save, owned, r.phase.phase, r.rng, maxedCards(r.prog));
}

function spawnPickup(r: RunState, x: number, z: number, roll: { kind: 'card' | 'item' | 'heal'; ref?: string }) {
  r.pickups.push({ id: r.nextPickupId++, x, z, kind: roll.kind, value: 0, ref: roll.ref });
}

function needsChoice(r: RunState, cardId: string): boolean {
  const c = CARDS[cardId];
  if (!c) return false;
  const owned = c.kind === 'passive' ? r.prog.passives.includes(cardId) : r.prog.slots.some(s => s?.fromCard && s.moveId === c.moveId);
  return !owned && (c.kind === 'slash' || (c.kind === 'passive' && !r.prog.passives.includes(null)));
}

/** @internal usado por sim/debug */
export function handleCard(r: RunState, cardId: string, ev: RunEvent[]) {
  const c = CARDS[cardId]; if (!c) return;
  // cópia de uma carta que já tem: sobe o nível (passiva até CARD_MAX_LEVEL; slash sobe o golpe)
  const lv = levelUpOwnedCard(r.prog, cardId);
  if (lv === 'leveled') {
    const level = c.kind === 'passive' ? r.prog.cardLevels[cardId] : r.prog.slots.find(s => s?.fromCard && s.moveId === c.moveId)!.level;
    ev.push({ type: 'cardLeveled', cardId, level }); syncHp(r); return;
  }
  if (lv === 'maxed') return;
  ev.push({ type: 'cardFound', cardId });
  if (c.kind === 'rare') { gainItem(r.prog, cardId); return; }
  if (c.kind === 'passive') { if (offerPassive(r.prog, cardId).status === 'full') r.pendingCard = cardId; else syncHp(r); return; }
  r.pendingCard = cardId; // slash: player chooses slot
}

/** @internal usado por sim/debug */
export function handleItem(r: RunState, itemId: string, ev: RunEvent[]) {
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
  if (r.paused || r.ended || r.offers !== null || r.pendingCard !== null || r.blindChoice !== null) return [];
  const ev: RunEvent[] = [];
  r.time += dt;
  movePlayer(r, input, dt);

  const d = r.director; d.phase = r.phase.phase; d.t = r.phase.t; d.px = r.px; d.pz = r.pz;
  stepDirector(d, dt, r.rng);

  for (const [id] of r.combat.bosses) if (!r.pool.get(id)) r.combat.bosses.delete(id);
  for (const e of r.pool.all) {
    if (!e || !e.alive || !e.boss) continue;
    const def = BOSSES.find(b => b.id === e.def); if (!def) continue;
    let st = r.combat.bosses.get(e.id);
    if (!st) { st = newBossState(); r.combat.bosses.set(e.id, st); }
    stepBoss(e, def, st, r.combat, r.px, r.pz, dt, r.rng);
  }

  let killedMiniboss = false, bossDead = false, collectedFragment = false;
  const bossDrops: { kind: 'card' | 'item' | 'heal'; ref?: string }[] = [];
  const stats = effectiveStats(r.prog);
  for (const ce of stepCombat(r.combat, r.prog, r.px, r.pz, r.pool, r.hash, dt, r.rng)) {
    if (ce.type === 'hit') ev.push({ type: 'hit', x: ce.x, z: ce.z, dmg: ce.dmg });
    else if (ce.type === 'playerHit') ev.push({ type: 'playerHit', dmg: ce.dmg });
    else {
      const e = ce.enemy;
      r.prog.kills++;
      ev.push({ type: 'kill', x: e.x, z: e.z });
      if (e.boss) {
        if (e.id === r.phase.bossId) { bossDead = true; r.stats.bosses++; }
        for (let k = 0; k < 2; k++) {
          const roll = lootRoll(r, bossDrops.map(d => d.ref ?? ''));
          bossDrops.push(roll); spawnPickup(r, e.x + k * 1.2, e.z, roll);
        }
        continue;
      }
      if (e.miniboss) { killedMiniboss = true; r.stats.guardians++; spawnPickup(r, e.x, e.z, rollChest(r.partnerId, r.save, r.prog.items, r.phase.phase, r.rng, maxedCards(r.prog))); }
      const drop = dropOnKill(e, r.rng);
      if (drop.xp > 0) r.pickups.push({ id: r.nextPickupId++, x: e.x, z: e.z, kind: 'xp', value: drop.xp });
      if (drop.extra === 'heal') spawnPickup(r, e.x + 0.6, e.z, { kind: 'heal' });
      if (drop.extra === 'card') {
        const maxed = maxedCards(r.prog);
        const cards = eligibleCards(r.partnerId).filter(c => c.kind !== 'rare' && !maxed.includes(c.id));
        if (cards.length) spawnPickup(r, e.x + 0.6, e.z, { kind: 'card', ref: r.rng.weighted(cards, c => c.weight).id });
      }
    }
  }
  if (r.phase.bossActive && r.phase.bossId !== null && !r.pool.get(r.phase.bossId)) bossDead = true;

  // pickups
  for (const p of collect(r.pickups, r.px, r.pz, 1.5 * stats.pickupMul)) {
    if (p.kind === 'xp') addXp(r.prog, p.value * stats.xpMul * r.debug.xpMul);
    else if (p.kind === 'heal') r.combat.hp = Math.min(r.combat.maxHp, r.combat.hp + r.combat.maxHp * 0.25);
    else if (p.kind === 'fragment') collectedFragment = true;
    else if (p.kind === 'digidata') collectDigiData(r, ev);
    else if (p.kind === 'card' && p.ref) {
      // one choice at a time: a second card that needs a choice waits on the ground
      if (r.pendingCard !== null && needsChoice(r, p.ref)) r.pickups.push(p);
      else handleCard(r, p.ref, ev);
    }
    else if (p.kind === 'item' && p.ref) handleItem(r, p.ref, ev);
  }
  for (const c of r.chests) {
    if (c.opened || Math.hypot(c.x - r.px, c.z - r.pz) > CHEST_RADIUS) continue;
    c.opened = true; ev.push({ type: 'chestOpened', x: c.x, z: c.z });
    spawnPickup(r, c.x, c.z, lootRoll(r));
  }

  // phase
  if (r.debug.god) r.combat.hp = r.combat.maxHp;
  // relíquias: regeneração e reviver uma vez
  if (r.combat.hp > 0 && stats.regen > 0) r.combat.hp = Math.min(r.combat.maxHp, r.combat.hp + stats.regen * dt);
  const rel = relicEffects(r.prog);
  if (r.combat.hp <= 0 && rel.revive > 0 && !r.reviveUsed) { r.reviveUsed = true; r.combat.hp = r.combat.maxHp * rel.revive; ev.push({ type: 'revived' }); }
  const playerDead = r.combat.hp <= 0;
  trackNearDeath(r.prog, r.combat.hp, r.combat.maxHp);
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
      // boss loot is carried into the next phase, right next to the player
      bossDrops.forEach((d, k) => spawnPickup(r, r.px + (k - 0.5) * 0.6, r.pz + 0.5, d));
      return ev;
    } else if (pe === 'playerDied') { finish(r, 'defeat', ev); return ev; }
  }

  // evolução: secreta cumprida evolui sozinha (ou abre a escolha às cegas); conhecida só avisa
  const ctx = { save: r.save, phase: r.phase.phase };
  // espera a escolha de carta deste tick fechar antes de trocar de forma
  const secret = r.pendingCard === null ? secretAvailable(r.prog, ctx) : [];
  if (secret.length === 1) {
    doEvolve(r, secret[0]); ev.push({ type: 'formDiscovered', formId: secret[0] });
    return ev;
  }
  if (secret.length > 1) { r.blindChoice = secret; return ev; }
  const avail = knownAvailable(r.prog, ctx);
  if (r.evo.update(avail).length) ev.push({ type: 'evolutionAvailable', forms: avail });
  // nível infinito: sem nada para melhorar, cada nível vira um ganho automático, sem abrir a tela
  while (r.prog.pendingLevelUps > 0 && r.offers === null && nothingToImprove(r.prog)) {
    const level = r.prog.level - r.prog.pendingLevelUps + 1;
    ev.push({ type: 'autoGain', level, ...autoGain(r.prog, r.rng) });
  }
  if (r.prog.pendingLevelUps > 0 && r.offers === null) { r.offers = rollOffers(r.prog, r.rng, new Set(r.banned)); ev.push({ type: 'levelUp' }); }
  syncHp(r);
  return ev;
}

export function abandonRun(r: RunState): RunEvent[] {
  const ev: RunEvent[] = [];
  if (!r.ended) finish(r, 'defeat', ev);
  return ev;
}

export function chooseOffer(r: RunState, index: number): void {
  if (!r.offers) return;
  const o = r.offers[index]; if (!o) return;
  applyOffer(r.prog, o);
  r.offers = null;
  // sem nada para melhorar, os níveis restantes viram ganho automático no próximo passo (stepRun)
  if (r.prog.pendingLevelUps > 0 && !nothingToImprove(r.prog)) r.offers = rollOffers(r.prog, r.rng, new Set(r.banned));
  syncHp(r);
}

export function doEvolve(r: RunState, formId: string): void {
  const from = r.prog.formId;
  evolve(r.prog, formId, { save: r.save, phase: r.phase.phase });
  discover(r.save, edgeId(from, formId));
  if (!r.save.discovered.includes(formId)) r.save.discovered.push(formId);
  persist(r);
  r.evo.reset();
  syncHp(r);
  r.combat.hp = r.combat.maxHp;
}

/** Maturidade: fica na forma atual pelo resto da partida, com bônus e vida cheia */
export function stayMature(r: RunState): void {
  mature(r.prog);
  r.evo.reset();
  syncHp(r);
  r.combat.hp = r.combat.maxHp;
}

/** level up: sorteia as cartas de novo (gasta um uso de Atualizar) */
export function rerollOffers(r: RunState): boolean {
  if (!r.offers || r.levelTools.reroll <= 0) return false;
  r.levelTools.reroll--;
  r.offers = rollOffers(r.prog, r.rng, new Set(r.banned));
  return true;
}

/** level up: recusa o nível em troca do ganho automático pequeno (gasta um uso de Pular) */
export function skipOffer(r: RunState): { level: number; stat: StatKey; amount: number } | null {
  if (!r.offers || r.levelTools.skip <= 0) return null;
  r.levelTools.skip--;
  const level = r.prog.level - r.prog.pendingLevelUps + 1;
  const g = autoGain(r.prog, r.rng);
  r.offers = null;
  if (r.prog.pendingLevelUps > 0 && !nothingToImprove(r.prog)) r.offers = rollOffers(r.prog, r.rng, new Set(r.banned));
  syncHp(r);
  return { level, ...g };
}

/** level up: tira a carta `index` do sorteio pelo resto da partida e troca só ela (gasta um uso de Banir) */
export function banOffer(r: RunState, index: number): boolean {
  const o = r.offers?.[index];
  if (!r.offers || !o || r.levelTools.ban <= 0) return false;
  r.levelTools.ban--;
  r.banned.push(offerKey(r.prog, o));
  const onTable = new Set([...r.banned, ...r.offers.map(x => offerKey(r.prog, x))]);
  const repl = rollOffers(r.prog, r.rng, onTable)[0];
  r.offers = repl ? r.offers.map((x, i) => (i === index ? repl : x)) : r.offers.filter((_, i) => i !== index);
  return true;
}

/** save como o HUD deve ver: sem as pistas de Digi Data desta partida (essas só aparecem no resultado) */
export function hudSave(r: RunState): SaveData { return withoutReveals(r.save, r.digiDataThisRun); }

/** escolha às cegas: evolui para a opção `index` e devolve a forma (null se índice inválido) */
export function chooseBlind(r: RunState, index: number): string | null {
  const id = r.blindChoice?.[index];
  if (!id) return null;
  r.blindChoice = null;
  doEvolve(r, id);
  return id;
}

export function resolveCard(r: RunState, choice: { passiveSlot?: number | null; moveSlot?: number }): void {
  const id = r.pendingCard; if (!id) return;
  const c = CARDS[id];
  if (c?.kind === 'passive' && choice.passiveSlot !== undefined) replacePassive(r.prog, choice.passiveSlot, id);
  if (c?.kind === 'slash' && choice.moveSlot !== undefined) slashIntoSlot(r.prog, choice.moveSlot, id);
  r.pendingCard = null;
  syncHp(r);
}
