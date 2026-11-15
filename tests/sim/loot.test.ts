import { eligibleItems, eligibleCards, rollChest, placeChests, collect, dropOnKill, attract, isMagnetic } from '../../src/sim/loot';
import { T } from '../../src/data/tuning';
import { defaultSave } from '../../src/core/save';
import { createRng } from '../../src/core/rng';

const withUnlock = (...ids: string[]) => ({ ...defaultSave(), unlocked: [...defaultSave().unlocked, ...ids] });

test('digiegg only for veemon', () => {
  expect(eligibleItems('agumon', defaultSave(), []).some(i => i.kind === 'digiegg')).toBe(false);
  expect(eligibleItems('veemon', defaultSave(), []).map(i => i.id)).toContain('digiegg_courage');
});
test('fusion needs unlock', () => {
  expect(eligibleItems('agumon', defaultSave(), []).map(i => i.id)).not.toContain('fusion_garurumon');
  expect(eligibleItems('agumon', withUnlock('gabumon'), []).map(i => i.id)).toContain('fusion_garurumon');
});
test('egg of unlocked partner never drops', () =>
  expect(eligibleItems('agumon', withUnlock('gabumon'), []).map(i => i.id)).not.toContain('egg_gabumon'));
test('blue card only for guilmon', () => {
  expect(eligibleCards('agumon').map(c => c.id)).not.toContain('blue_card');
  expect(eligibleCards('guilmon').map(c => c.id)).toContain('blue_card');
});
test('owned items do not drop again', () =>
  expect(eligibleItems('veemon', defaultSave(), ['digiegg_courage']).map(i => i.id)).not.toContain('digiegg_courage'));
test('fusion never before phase 3, blue card never before phase 4', () => {
  const r = createRng(4);
  for (let i = 0; i < 3000; i++) {
    expect(rollChest('agumon', withUnlock('gabumon'), [], 2, r).ref).not.toBe('fusion_garurumon');
    expect(rollChest('guilmon', defaultSave(), [], 3, r).ref).not.toBe('blue_card');
  }
});
test('eggs are rare in chests', () => {
  const r = createRng(9); let eggs = 0; const N = 20000;
  for (let i = 0; i < N; i++) if (rollChest('agumon', defaultSave(), [], 1, r).ref?.startsWith('egg_')) eggs++;
  expect(eggs / N).toBeLessThanOrEqual(0.025); expect(eggs).toBeGreaterThan(0);
});
test('chests are spread out and away from spawn', () => {
  const cs = placeChests(1, createRng(3)); expect(cs).toHaveLength(9);
  for (const a of cs) { expect(Math.hypot(a.x, a.z)).toBeGreaterThanOrEqual(15);
    for (const b of cs) if (a !== b) expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThanOrEqual(15); }
});
test('collect removes only near pickups', () => {
  const ps = [{ id: 1, x: 1, z: 0, kind: 'xp' as const, value: 1 }, { id: 2, x: 9, z: 0, kind: 'xp' as const, value: 1 }];
  expect(collect(ps, 0, 0, 2).map(p => p.id)).toEqual([1]); expect(ps.map(p => p.id)).toEqual([2]);
});
test('kills drop xp', () => expect(dropOnKill({ xp: 3 } as never, createRng(1)).xp).toBe(3));

describe('ímã de coleta', () => {
  const xp = (id: number, x: number, z = 0) => ({ id, x, z, kind: 'xp' as const, value: 1 });

  test('XP, cura, carta e item são atraídos; fragmento e Digi Data não', () => {
    expect(['xp', 'heal', 'card', 'item'].every(k => isMagnetic(k as never))).toBe(true);
    expect(isMagnetic('fragment')).toBe(false); expect(isMagnetic('digidata')).toBe(false);
  });

  test('dentro do raio o item voa até o parceiro; fora dele fica parado', () => {
    const near = xp(1, T.PICKUP.MAGNET - 0.5), far = xp(2, T.PICKUP.MAGNET + 2);
    attract([near, far], 0, 0, 1, 0.1);
    expect(near.x).toBeLessThan(T.PICKUP.MAGNET - 0.5);
    expect(near.z).toBeCloseTo(0);
    expect(far.x).toBe(T.PICKUP.MAGNET + 2);
  });

  test('o alcance do ímã cresce com pickupMul', () => {
    const p = xp(1, T.PICKUP.MAGNET * 1.8);
    attract([p], 0, 0, 1, 0.1); expect(p.x).toBe(T.PICKUP.MAGNET * 1.8);
    attract([p], 0, 0, 2, 0.1); expect(p.x).toBeLessThan(T.PICKUP.MAGNET * 1.8);
  });

  test('depois de puxado, segue o parceiro mesmo se ele se afastar e chega mais rápido que ele anda', () => {
    const p = xp(1, T.PICKUP.MAGNET - 1);
    attract([p], 0, 0, 1, 1 / 60);
    let px = 0;
    for (let i = 0; i < 300; i++) { px -= 8 / 60; attract([p], px, 0, 1, 1 / 60); if (collect([p], px, 0, 1.5).length) return; }
    throw new Error('não alcançou o parceiro em 5 s');
  });

  test('fragmento dentro do raio não se move', () => {
    const f = { id: 3, x: 2, z: 0, kind: 'fragment' as const, value: 1 };
    attract([f], 0, 0, 3, 0.5); expect(f.x).toBe(2);
  });

  test('não passa do parceiro (para em cima dele)', () => {
    const p = xp(1, 0.5);
    attract([p], 0, 0, 1, 10);
    expect(Math.hypot(p.x, p.z)).toBeLessThanOrEqual(1e-9);
  });
});
