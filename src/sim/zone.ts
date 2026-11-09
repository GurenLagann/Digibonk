/**
 * Zona Digital (Distorção): o guardião derrotado deixa um portal; passar por ele leva a uma arena separada com ondas
 * de inimigos do atributo do portal e o próprio guardião como Alfa. Vencer dá Digi Data e a escolha de uma relíquia.
 * O mapa (inimigos, coletáveis, baús e posição) fica guardado e volta igual na saída.
 */
import { ENEMIES, MINIBOSSES } from '../data/enemies';
import { RELIC_LIST } from '../data/relics';
import { T } from '../data/tuning';
import type { AttributeId } from '../data/types';
import { difficulty, EnemyPool, type Enemy } from './director';
import type { Chest, Pickup } from './loot';
import { RELIC_SLOTS } from './relics';
import type { RunEvent, RunState } from './run';

export interface Portal { x: number; z: number; attr: AttributeId; guardian: string; t: number;
  /** Distorção rara (guardião do Altar do Desafio): onda extra, 4 relíquias e Digi Data a mais */
  rare?: boolean }
export interface ZoneState {
  attr: AttributeId; guardian: string; rare: boolean;
  stage: 'waves' | 'alpha' | 'exit';
  wave: number; waveT: number;
  alphaId: number | null; alphaT: number;
  /** portal de volta (aparece no centro ao fim da Distorção) */
  exit: { x: number; z: number } | null;
  saved: { pool: EnemyPool; pickups: Pickup[]; chests: Chest[]; px: number; pz: number };
}

const Z = () => T.ZONE;

/** guardião derrotado no mapa: abre um portal no lugar dele */
export function openPortal(r: RunState, e: Enemy, ev: RunEvent[]): void {
  const rare = r.challengeGuardianId === e.id;
  if (rare) { r.challengeGuardianId = null; r.challengeArmed = false; }
  r.portals.push({ x: e.x, z: e.z, attr: e.attribute, guardian: e.def, t: Z().PORTAL_SECONDS, rare });
  ev.push({ type: 'portalOpened', attr: e.attribute });
}

function clearCombat(r: RunState) {
  r.combat.projectiles.length = 0; r.combat.areas.length = 0; r.combat.hostiles.length = 0; r.combat.bosses.clear();
}

/** fora da arena: o tempo dos portais corre e passar por um deles entra na Distorção */
export function stepPortals(r: RunState, dt: number, ev: RunEvent[]): void {
  for (const p of r.portals) p.t -= dt;
  r.portals = r.portals.filter(p => p.t > 0);
  const i = r.portals.findIndex(p => Math.hypot(p.x - r.px, p.z - r.pz) <= Z().ENTER_RADIUS);
  if (i < 0) return;
  const [p] = r.portals.splice(i, 1);
  enterZone(r, p, ev);
}

function enterZone(r: RunState, p: Portal, ev: RunEvent[]) {
  r.zone = {
    attr: p.attr, guardian: p.guardian, rare: !!p.rare, stage: 'waves', wave: 0, waveT: 0, alphaId: null, alphaT: 0, exit: null,
    saved: { pool: r.pool, pickups: r.pickups, chests: r.chests, px: r.px, pz: r.pz },
  };
  r.pool = new EnemyPool(); r.pickups = []; r.chests = [];
  r.px = Z().CENTER.x; r.pz = Z().CENTER.z;
  clearCombat(r);
  ev.push({ type: 'zoneEnter', attr: p.attr });
  nextWave(r, ev);
}

function exitZone(r: RunState, ev: RunEvent[]) {
  const s = r.zone!.saved;
  r.pool = s.pool; r.pickups = s.pickups; r.chests = s.chests; r.px = s.px; r.pz = s.pz;
  r.zone = null;
  clearCombat(r);
  ev.push({ type: 'zoneExit' });
}

/** ponto aleatório na borda interna da arena */
function edgePoint(r: RunState): [number, number] {
  const a = r.rng.next() * Math.PI * 2, d = Z().RADIUS - 2;
  return [Z().CENTER.x + Math.cos(a) * d, Z().CENTER.z + Math.sin(a) * d];
}

function nextWave(r: RunState, ev: RunEvent[]) {
  const z = r.zone!, ph = r.phase.phase;
  z.wave++; z.waveT = 0;
  const pool = ENEMIES.filter(e => e.minPhase <= ph && e.attribute === z.attr);
  const defs = pool.length ? pool : ENEMIES.filter(e => e.minPhase <= ph);
  const diff = difficulty(ph, r.phase.t);
  const n = Z().WAVE_BASE + Z().WAVE_GROWTH * z.wave + ph * 2;
  for (let i = 0; i < n; i++) { const [x, zz] = edgePoint(r); r.pool.spawn(r.rng.pick(defs), x, zz, { hp: diff.hpMul, dmg: diff.dmgMul }); }
  ev.push({ type: 'zoneWave', wave: z.wave });
}

function spawnAlpha(r: RunState, ev: RunEvent[]) {
  const z = r.zone!;
  const def = MINIBOSSES.find(m => m.id === z.guardian) ?? MINIBOSSES[0];
  const diff = difficulty(r.phase.phase, r.phase.t);
  const [x, zz] = edgePoint(r);
  const a = r.pool.spawn(def, x, zz, { hp: diff.hpMul * Z().ALPHA_HP, dmg: diff.dmgMul * Z().ALPHA_DMG }, { miniboss: true })!;
  a.size *= Z().ALPHA_SIZE;
  z.stage = 'alpha'; z.alphaId = a.id; z.alphaT = Z().ALPHA_SECONDS;
  ev.push({ type: 'zoneAlpha', name: def.name });
}

/** dentro da arena, depois do combate: ondas, Alfa, recompensa e saída. `reward` revela o Digi Data (run.ts) */
export function stepZone(r: RunState, dt: number, ev: RunEvent[], reward: (extra: number) => void): void {
  const z = r.zone!;
  if (z.stage === 'waves') {
    z.waveT += dt;
    if (r.pool.alive().length === 0 || z.waveT >= Z().WAVE_SECONDS) {
      if (z.wave < Z().WAVES + (z.rare ? 1 : 0)) nextWave(r, ev);
      else if (r.pool.alive().length === 0) spawnAlpha(r, ev);
    }
  } else if (z.stage === 'alpha') {
    z.alphaT -= dt;
    const alpha = z.alphaId !== null ? r.pool.get(z.alphaId) : undefined;
    if (!alpha) {
      reward(z.rare ? 1 : 0);
      const free = RELIC_LIST.filter(x => !r.prog.relics.includes(x.id));
      if (r.prog.relics.length < RELIC_SLOTS && free.length) {
        const pick: string[] = [];
        while (pick.length < Math.min(z.rare ? 4 : 3, free.length)) { const c = r.rng.pick(free).id; if (!pick.includes(c)) pick.push(c); }
        r.relicOffer = pick;
      }
      finish(r, ev, true);
    } else if (z.alphaT <= 0) {
      r.pool.clearAll();
      finish(r, ev, false);
    }
  } else if (z.exit && Math.hypot(z.exit.x - r.px, z.exit.z - r.pz) <= Z().ENTER_RADIUS && r.relicOffer === null) {
    exitZone(r, ev);
  }
}

function finish(r: RunState, ev: RunEvent[], won: boolean) {
  const z = r.zone!;
  r.pool.clearAll();
  z.stage = 'exit'; z.alphaId = null; z.exit = { x: Z().CENTER.x, z: Z().CENTER.z + 4 };
  ev.push({ type: 'zoneDone', won });
}

/** movimento dentro da arena: preso ao círculo */
export function clampToArena(x: number, z: number): [number, number] {
  const c = Z().CENTER, dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), max = Z().RADIUS - 0.5;
  return d <= max ? [x, z] : [c.x + (dx / d) * max, c.z + (dz / d) * max];
}
