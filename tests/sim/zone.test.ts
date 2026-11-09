import { defaultSave } from '../../src/core/save';
import { MINIBOSSES } from '../../src/data/enemies';
import { T } from '../../src/data/tuning';
import { chooseRelic, createRun, stepRun, type RunState } from '../../src/sim/run';
import { fakeStorage } from '../helpers';

const mk = () => {
  const r = createRun({ partnerId: 'agumon', seed: 3, save: defaultSave(), storage: fakeStorage({}) });
  r.debug.god = true; r.debug.xpMul = 0;
  return r;
};
const step = (r: RunState, dt = 1 / 60, input = { mx: 0, mz: 0 }) => stepRun(r, input, dt);
const C = T.ZONE.CENTER;
/** mata todos os inimigos vivos da arena (como se o jogador tivesse vencido a onda) */
const killAll = (r: RunState) => { for (const e of r.pool.alive()) e.hp = -1; for (const e of r.pool.alive()) r.pool.kill(e.id); };

function withPortal(r: RunState) {
  const g = MINIBOSSES[0];
  r.portals.push({ x: r.px, z: r.pz, attr: g.attribute, guardian: g.id, t: T.ZONE.PORTAL_SECONDS });
  return g;
}

test('derrotar um guardião abre um portal com o atributo dele, que some em 30 s', () => {
  const r = mk(); r.pool.clearAll();
  const g = MINIBOSSES[0];
  const e = r.pool.spawn(g, r.px + 2, r.pz, { hp: 0.001, dmg: 0 }, { miniboss: true })!;
  for (let i = 0; i < 600 && r.pool.get(e.id); i++) step(r);
  expect(r.pool.get(e.id)).toBeUndefined();
  expect(r.portals).toHaveLength(1);
  expect(r.portals[0]).toMatchObject({ attr: g.attribute, guardian: g.id });
  r.px += 40; // longe do portal
  for (let i = 0; i < 4; i++) step(r, T.ZONE.PORTAL_SECONDS / 4 + 0.1);
  expect(r.portals).toEqual([]);
});

test('passar pelo portal entra na arena: mapa guardado, jogador no centro, relógio parado, onda 1', () => {
  const r = mk(); const g = withPortal(r);
  const outside = r.pool, outsidePickups = r.pickups, px = r.px, pz = r.pz;
  step(r);
  expect(r.zone).not.toBeNull();
  expect(r.zone!.attr).toBe(g.attribute);
  expect(r.pool).not.toBe(outside); expect(r.zone!.saved.pool).toBe(outside); expect(r.zone!.saved.pickups).toBe(outsidePickups);
  expect(Math.hypot(r.px - C.x, r.pz - C.z)).toBeLessThan(1);
  expect(r.zone!.wave).toBe(1); expect(r.pool.alive().length).toBeGreaterThan(0);
  const t = r.phase.t; step(r, 1); expect(r.phase.t).toBe(t);
  expect(r.zone!.saved.px).toBe(px); expect(r.zone!.saved.pz).toBe(pz);
});

test('o jogador não sai do círculo da arena', () => {
  const r = mk(); withPortal(r); step(r);
  for (let i = 0; i < 600; i++) step(r, 1 / 60, { mx: 1, mz: 0 });
  expect(Math.hypot(r.px - C.x, r.pz - C.z)).toBeLessThanOrEqual(T.ZONE.RADIUS);
});

function clearWaves(r: RunState) {
  for (let i = 0; i < T.ZONE.WAVES + 2 && r.zone!.stage === 'waves'; i++) { killAll(r); step(r); }
}

test('depois das ondas vem o Alfa (o guardião mais forte); vencê-lo dá relíquias e Digi Data e abre a saída', () => {
  const r = mk(); const g = withPortal(r); step(r);
  clearWaves(r);
  expect(r.zone!.stage).toBe('alpha');
  const alpha = r.pool.get(r.zone!.alphaId!)!;
  expect(alpha.def).toBe(g.id); expect(alpha.miniboss).toBe(true);
  const dd = r.digiDataThisRun.length, guardians = r.stats.guardians;
  alpha.hp = -1; r.pool.kill(alpha.id); step(r);
  expect(r.relicOffer).toHaveLength(3); expect(new Set(r.relicOffer).size).toBe(3);
  expect(r.digiDataThisRun.length).toBe(dd + 1);
  expect(r.stats.guardians).toBe(guardians); // o Alfa não conta como guardião do mapa
  expect(r.portals).toEqual([]);             // nem abre outro portal
  expect(r.zone!.exit).not.toBeNull();
});

test('escolher a relíquia equipa; a saída devolve o mapa exatamente como estava', () => {
  const r = mk(); withPortal(r);
  const outside = r.pool, chests = r.chests, px = r.px, pz = r.pz;
  step(r); clearWaves(r);
  const alpha = r.pool.get(r.zone!.alphaId!)!; alpha.hp = -1; r.pool.kill(alpha.id); step(r);
  const pick = r.relicOffer![1];
  chooseRelic(r, 1);
  expect(r.prog.relics).toEqual([pick]); expect(r.relicOffer).toBeNull();
  r.px = r.zone!.exit!.x; r.pz = r.zone!.exit!.z; step(r);
  expect(r.zone).toBeNull();
  expect(r.pool).toBe(outside); expect(r.chests).toBe(chests);
  expect(r.px).toBe(px); expect(r.pz).toBe(pz);
});

test('tempo do Alfa acabou: ele some, sem relíquia, e a saída abre', () => {
  const r = mk(); withPortal(r); step(r); clearWaves(r);
  step(r, T.ZONE.ALPHA_SECONDS + 0.1);
  expect(r.zone!.stage).toBe('exit'); expect(r.relicOffer).toBeNull();
  expect(r.pool.alive().length).toBe(0); expect(r.zone!.exit).not.toBeNull();
});

test('com 3 relíquias não há escolha, só o Digi Data', () => {
  const r = mk(); r.prog.relics = ['relic_tag_courage', 'relic_blue_card', 'relic_crest_reliance'];
  withPortal(r); step(r); clearWaves(r);
  const a = r.pool.get(r.zone!.alphaId!)!; a.hp = -1; r.pool.kill(a.id); step(r);
  expect(r.relicOffer).toBeNull(); expect(r.zone!.stage).toBe('exit');
});
