import { availableEvolutions, evolve, EvoNotifier, nextEvolutionHint, type EvoContext } from '../../src/sim/evolution';
import { newPlayerProg } from '../../src/sim/progression';
import { defaultSave } from '../../src/core/save';
import { progAt } from '../helpers';

const ctx = (o: { unlocked?: string[]; phase?: number } = {}): EvoContext =>
  ({ save: { ...defaultSave(), unlocked: o.unlocked ?? defaultSave().unlocked }, phase: o.phase ?? 1 });

test('agumon to greymon needs level and atk', () => {
  const p = newPlayerProg('agumon'); p.level = 8;
  p.bonus.atk = -5; expect(availableEvolutions(p, ctx())).not.toContain('greymon');
  p.bonus.atk = 20; expect(availableEvolutions(p, ctx())).toContain('greymon');
  p.level = 7; expect(availableEvolutions(p, ctx())).not.toContain('greymon');
});
test('veemon branches by stats', () => {
  const p = progAt('veemon', 8);
  p.bonus.spd = 10; expect(availableEvolutions(p, ctx())).toEqual(['exveemon']);
  // com 0,5%/nível o ataque no nível 8 fica ~10,35: Veedramon (atk 14) agora exige pontos em ataque
  p.bonus.spd = 0; p.bonus.def = 5; p.bonus.atk = 4; expect(availableEvolutions(p, ctx())).toEqual(['veedramon']);
  p.bonus.spd = 10; expect(availableEvolutions(p, ctx()).sort()).toEqual(['exveemon', 'veedramon']);
});
test('digiegg unlocks flamedramon early', () => {
  const p = newPlayerProg('veemon'); p.level = 5; expect(availableEvolutions(p, ctx())).not.toContain('flamedramon');
  p.items.push('digiegg_courage'); expect(availableEvolutions(p, ctx())).toContain('flamedramon');
});
test('paildramon blocked without wormmon unlocked', () => {
  const p = progAt('exveemon', 22); p.items.push('fusion_stingmon');
  expect(availableEvolutions(p, ctx())).not.toContain('paildramon');
  expect(availableEvolutions(p, ctx({ unlocked: ['agumon', 'veemon', 'guilmon', 'wormmon'] }))).toContain('paildramon');
});
test('minPhase gates ultimate', () => {
  const p = progAt('metalgreymon', 35); p.bonus.atk = 50;
  expect(availableEvolutions(p, ctx({ phase: 3 }))).not.toContain('wargreymon');
  expect(availableEvolutions(p, ctx({ phase: 4 }))).toContain('wargreymon');
});
test('notifier only reports new options', () => {
  const n = new EvoNotifier();
  expect(n.update(['greymon'])).toEqual(['greymon']); expect(n.update(['greymon'])).toEqual([]);
  expect(n.update(['greymon', 'x'])).toEqual(['x']);
});
test('evolve upgrades signature keeping level and records path', () => {
  const p = progAt('agumon', 8); p.bonus.atk = 20; p.slots[0]!.level = 3; p.slots[1] = { moveId: 'sharp_claws', level: 2, fromCard: false };
  evolve(p, 'greymon', ctx());
  expect(p.formId).toBe('greymon'); expect(p.slots[0]).toMatchObject({ moveId: 'mega_flame', level: 3 });
  expect(p.slots[1]).toMatchObject({ moveId: 'sharp_claws', level: 2 }); expect(p.path).toEqual(['agumon', 'greymon']);
});
test('evolve rejects unavailable form', () => expect(() => evolve(newPlayerProg('agumon'), 'wargreymon', ctx())).toThrow());

describe('nextEvolutionHint', () => {
  test('final form', () => {
    expect(nextEvolutionHint(newPlayerProg('omnimon'), ctx())).toEqual({ kind: 'final' });
  });
  test('agumon level 1 misses level and atk', () => {
    expect(nextEvolutionHint(newPlayerProg('agumon'), ctx())).toEqual({
      kind: 'next', to: 'greymon', missing: [{ kind: 'level', need: 8 }, { kind: 'stat', stat: 'atk', need: 14 }],
    });
  });
  test('agumon ready has nothing missing', () => {
    const p = progAt('agumon', 8); p.bonus.atk = 20;
    expect(nextEvolutionHint(p, ctx())).toEqual({ kind: 'next', to: 'greymon', missing: [] });
  });
  test('veemon picks the closest branch', () => {
    const p = progAt('veemon', 8); p.bonus.spd = 10;
    const h = nextEvolutionHint(p, ctx());
    expect(h).toEqual({ kind: 'next', to: 'exveemon', missing: [] });
  });
  test('none when all edges impossible', () => {
    const p = progAt('exveemon', 22); p.items.push('fusion_stingmon');
    expect(nextEvolutionHint(p, ctx())).toEqual({ kind: 'none' });
  });
});
