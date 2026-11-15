import { defaultSave } from '../../src/core/save';
import { CARDS } from '../../src/data/cards';
import { ENEMIES, MINIBOSSES } from '../../src/data/enemies';
import { RELIC_LIST } from '../../src/data/relics';
import { T } from '../../src/data/tuning';
import { difficulty } from '../../src/sim/director';
import { createRun, stepRun, type RunState } from '../../src/sim/run';
import { fakeStorage } from '../helpers';

const mk = () => {
  const r = createRun({ partnerId: 'agumon', seed: 3, save: defaultSave(), storage: fakeStorage({}) });
  r.debug.god = true; r.debug.xpMul = 0;
  return r;
};
const step = (r: RunState, dt = 1 / 60) => stepRun(r, { mx: 0, mz: 0 }, dt);
const touch = (r: RunState) => {
  r.pool.clearAll(); r.pickups.length = 0;
  const c = r.chests.find(x => x.kind === 'cursed')!;
  r.px = c.x; r.pz = c.z;
  return { c, ev: step(r) };
};
const ambushed = (r: RunState) => r.ambush!.ids.map(id => r.pool.get(id)!);
const killIds = (r: RunState, ids: number[]) => { for (const id of ids) { r.pool.get(id)!.hp = -1; r.pool.kill(id); } };

test('encostar no amaldiçoado abre sem custo e cerca o jogador com 12 Bakemon fortes', () => {
  const r = mk(); r.bits = 0;
  const { c, ev } = touch(r);
  expect(c.opened).toBe(true);
  expect(ev.some(e => e.type === 'ambush')).toBe(true);
  expect(ev.some(e => e.type === 'chestOpened' && e.kind === 'cursed')).toBe(true);
  expect(r.ambush!.ids).toHaveLength(T.CURSED.COUNT);
  const d = difficulty(r.phase.phase, r.phase.t);
  const def = ENEMIES.find(e => e.id === 'bakemon')!;
  for (const e of ambushed(r)) {
    expect(e.def).toBe('bakemon');
    expect(Math.hypot(e.x - c.x, e.z - c.z)).toBeGreaterThan(T.CURSED.RADIUS - 2);
    expect(Math.hypot(e.x - c.x, e.z - c.z)).toBeLessThan(T.CURSED.RADIUS + 2);
    expect(e.maxHp).toBeCloseTo(def.hp * d.hpMul * T.CURSED.HP, 0);
  }
});

test('matar os 12 dá relíquia (3 opções) e Bits e encerra a emboscada', () => {
  const r = mk(); touch(r);
  const bits = r.bits;
  killIds(r, r.ambush!.ids);
  const ev = step(r);
  expect(ev.some(e => e.type === 'ambushCleared')).toBe(true);
  expect(r.relicOffer).toHaveLength(3);
  expect(r.bits).toBe(bits + T.CURSED.BITS_PER_PHASE * r.phase.phase);
  expect(r.ambush).toBeNull();
});

test('com as relíquias cheias cai carta rara (ou cura)', () => {
  const r = mk();
  r.prog.relics.push(...RELIC_LIST.slice(0, 3).map(x => x.id));
  touch(r);
  killIds(r, r.ambush!.ids); step(r);
  expect(r.relicOffer).toBeNull();
  const p = r.pickups.find(x => x.kind === 'card' || x.kind === 'heal')!;
  expect(p).toBeDefined();
  if (p.kind === 'card') {
    expect(CARDS[p.ref!].kind).toBe('rare');
    expect(CARDS[p.ref!].forPartners).toContain('agumon');
  }
});

test('com 11 mortos e 1 vivo nada acontece', () => {
  const r = mk(); touch(r);
  const ids = [...r.ambush!.ids];
  killIds(r, ids.slice(0, 11));
  const ev = step(r);
  expect(ev.some(e => e.type === 'ambushCleared')).toBe(false);
  expect(r.relicOffer).toBeNull();
  expect(r.ambush).not.toBeNull();
});

test('entrar na Zona Digital com a emboscada ativa não a conclui; ao sair continua', () => {
  const r = mk(); touch(r);
  const ids = [...r.ambush!.ids];
  const g = MINIBOSSES[0];
  r.portals.push({ x: r.px, z: r.pz, attr: g.attribute, guardian: g.id, t: T.ZONE.PORTAL_SECONDS });
  step(r);
  expect(r.zone).not.toBeNull();
  r.pool.clearAll();
  const evs = [];
  for (let i = 0; i < 5; i++) evs.push(...step(r));
  expect(evs.some(e => e.type === 'ambushCleared')).toBe(false);
  expect(r.ambush).not.toBeNull();
  // sai da zona
  r.zone!.stage = 'exit'; r.zone!.exit = { x: r.px, z: r.pz };
  step(r);
  expect(r.zone).toBeNull();
  expect(r.ambush!.ids).toEqual(ids);
  for (const id of ids) expect(r.pool.get(id)).toBeDefined();
});
