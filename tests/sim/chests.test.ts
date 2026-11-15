import { createRun, stepRun } from '../../src/sim/run';
import { placeChests, chestPrice, eggsForPartner } from '../../src/sim/loot';
import { defaultSave } from '../../src/core/save';
import { createRng } from '../../src/core/rng';
import { T } from '../../src/data/tuning';
import { fakeStorage } from '../helpers';

const mk = (partnerId = 'agumon') => createRun({ partnerId, seed: 1, save: defaultSave(), storage: fakeStorage({}) });
const idle = { mx: 0, mz: 0 };
const place = (r: ReturnType<typeof mk>, kind: 'free' | 'paid') => {
  const c = r.chests.find(x => x.kind === kind && !x.opened)!;
  return c;
};
const goTo = (r: ReturnType<typeof mk>, c: { x: number; z: number }) => { r.px = c.x; r.pz = c.z; };
const away = (r: ReturnType<typeof mk>) => { r.px = 1000; r.pz = 1000; };

test('9 baús: 2 grátis, 6 pagos, 1 amaldiçoado', () => {
  const cs = placeChests(1, createRng(3));
  expect(cs).toHaveLength(9);
  const n = (k: string) => cs.filter(c => c.kind === k).length;
  expect({ free: n('free'), paid: n('paid'), cursed: n('cursed') }).toEqual({ free: 2, paid: 6, cursed: 1 });
  expect(cs[8].kind).toBe('cursed');
});
test('chestPrice', () => {
  expect([0, 1, 2, 7, 8, 9].map(chestPrice)).toEqual([20, 35, 55, 230, 280, 330]);
});
test('baú pago sem Bits avisa uma vez por entrada', () => {
  const r = mk(); r.bits = 19; r.chestsBought = 0;
  const c = place(r, 'paid');
  const count = (ev: { type: string }[]) => ev.filter(e => e.type === 'chestLocked');
  goTo(r, c);
  const ev1 = stepRun(r, idle, 1 / 60);
  expect(count(ev1)).toEqual([{ type: 'chestLocked', missing: 1 }]);
  let more = 0; for (let i = 0; i < 30; i++) more += count(stepRun(r, idle, 1 / 60)).length;
  expect(more).toBe(0);
  away(r); stepRun(r, idle, 1 / 60); goTo(r, c);
  expect(count(stepRun(r, idle, 1 / 60))).toHaveLength(1);
  expect(r.bits).toBe(19); expect(c.opened).toBe(false);
});
test('baú pago debita e encarece o próximo', () => {
  const r = mk(); r.bits = 50;
  const c = place(r, 'paid'); goTo(r, c);
  const ev = stepRun(r, idle, 1 / 60);
  expect(ev.some(e => e.type === 'chestOpened')).toBe(true);
  expect(r.bits).toBe(30); expect(r.chestsBought).toBe(1); expect(c.opened).toBe(true);
  expect(chestPrice(r.chestsBought)).toBe(35);
});
test('baú grátis abre sem Bits e não muda chestsBought', () => {
  const r = mk(); r.bits = 0;
  const c = place(r, 'free'); goTo(r, c);
  stepRun(r, idle, 1 / 60);
  expect(c.opened).toBe(true); expect(r.chestsBought).toBe(0); expect(r.bits).toBe(0);
});
test('baú amaldiçoado não abre nesta tarefa', () => {
  const r = mk(); r.bits = 999;
  const c = r.chests.find(x => x.kind === 'cursed')!; goTo(r, c);
  stepRun(r, idle, 1 / 60);
  expect(c.opened).toBe(false);
});
test('eggsForPartner', () => {
  const v = eggsForPartner('veemon', []);
  expect(v).toEqual(expect.arrayContaining(['digiegg_courage', 'digiegg_friendship', 'digiegg_miracles']));
  expect(v.every(i => i.startsWith('digiegg_'))).toBe(true);
  expect(eggsForPartner('agumon', [])).toEqual([]);
  expect(eggsForPartner('veemon', ['digiegg_courage'])).not.toContain('digiegg_courage');
});
test('baú pago pode dar Digiovo da linha do parceiro', () => {
  const r = mk('veemon'); r.bits = 100;
  r.rng = { ...r.rng, next: () => T.CHESTS.EGG_CHANCE / 2 } as typeof r.rng;
  const c = place(r, 'paid'); goTo(r, c);
  const before = r.pickups.length;
  stepRun(r, idle, 1 / 60);
  const p = r.pickups.slice(before).find(x => x.kind === 'item');
  expect(eggsForPartner('veemon', [])).toContain(p?.ref);
});
test('Agumon não tem Digiovo: usa loot normal', () => {
  const r = mk('agumon'); r.bits = 100;
  r.rng = { ...r.rng, next: () => T.CHESTS.EGG_CHANCE / 2 } as typeof r.rng;
  const c = place(r, 'paid'); goTo(r, c);
  const before = r.pickups.length;
  stepRun(r, idle, 1 / 60);
  const p = r.pickups.slice(before).find(x => x.kind === 'item' || x.kind === 'heal' || x.kind === 'card');
  expect(p).toBeDefined();
  expect(p?.ref?.startsWith('digiegg_')).not.toBe(true);
});
