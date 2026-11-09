import { applyForm, availableEvolutions, canMature, evolve, EvoNotifier, mature, nextEvolutionHint, type EvoContext } from '../../src/sim/evolution';
import { effectiveStats } from '../../src/sim/stats';
import { T } from '../../src/data/tuning';
import { newPlayerProg } from '../../src/sim/progression';
import { defaultSave } from '../../src/core/save';
import { progAt } from '../helpers';
import { FORMS } from '../../src/data/forms';

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
test('flamedramon pede Maturidade e o Digiovo da Coragem', () => {
  const p = newPlayerProg('veemon'); p.level = 5; p.items.push('digiegg_courage');
  expect(availableEvolutions(p, ctx())).not.toContain('flamedramon');
  mature(p); expect(availableEvolutions(p, ctx())).toEqual(['flamedramon']);
});
test('Magnamon: Veemon maduro, Nv 12 e Digiovo dos Milagres', () => {
  const p = newPlayerProg('veemon'); p.level = 12; mature(p);
  expect(availableEvolutions(p, ctx())).not.toContain('magnamon');
  p.items.push('digiegg_miracles'); expect(availableEvolutions(p, ctx())).toContain('magnamon');
});
test('VictoryGreymon: WarGreymon maduro no Nv 50; Modo Paladino: Transcendent Sword, sem Maturidade', () => {
  const w = progAt('wargreymon', 50); expect(availableEvolutions(w, ctx())).not.toContain('victorygreymon');
  mature(w); expect(availableEvolutions(w, ctx())).toEqual(['victorygreymon']);
  const i = progAt('imperialdramon_fm', 45); i.items.push('sword_omnimon');
  expect(availableEvolutions(i, ctx())).toEqual(['imperialdramon_pm']);
});
describe('quando dá para amadurecer', () => {
  test('a partir do menor nível das evoluções da forma, uma vez, e nunca em forma final', () => {
    const v = newPlayerProg('veemon'); v.level = 4; expect(canMature(v)).toBe(false);
    v.level = 5; expect(canMature(v)).toBe(true);
    mature(v); expect(canMature(v)).toBe(false);
    expect(canMature(progAt('omnimon', 80))).toBe(false);
    expect(canMature(progAt('wargreymon', 41))).toBe(false);
    expect(canMature(progAt('wargreymon', 42))).toBe(true);
  });
});
test('paildramon blocked without wormmon unlocked', () => {
  const p = progAt('exveemon', 22); p.items.push('fusion_stingmon');
  expect(availableEvolutions(p, ctx())).not.toContain('paildramon');
  expect(availableEvolutions(p, ctx({ unlocked: ['agumon', 'veemon', 'guilmon', 'wormmon'] }))).toContain('paildramon');
});
test('no evolution depends on the run phase', () => {
  for (const f of Object.values(FORMS)) for (const e of f.evolutions) expect(e.req.minPhase, `${f.id}->${e.to}`).toBeUndefined();
  const p = progAt('metalgreymon', 35); p.bonus.atk = 50;
  expect(availableEvolutions(p, ctx({ phase: 1 }))).toContain('wargreymon');
});
describe('dark branch', () => {
  test('greymon -> skullgreymon needs high atk and near-deaths, alongside metalgreymon', () => {
    const p = progAt('greymon', 20); p.bonus.atk = 40; p.bonus.def = 20;
    expect(availableEvolutions(p, ctx())).toEqual(['metalgreymon']);
    p.nearDeaths = 3; expect(availableEvolutions(p, ctx()).sort()).toEqual(['metalgreymon', 'skullgreymon']);
    p.bonus.def = -20; expect(availableEvolutions(p, ctx())).toEqual(['skullgreymon']);
  });
  test('hint shows the missing near-deaths', () => {
    const p = progAt('skullgreymon', 35); p.bonus.atk = 40; p.nearDeaths = 7;
    expect(nextEvolutionHint(p, ctx())).toEqual({ kind: 'next', to: 'blackwargreymon', missing: [{ kind: 'nearDeaths', need: 8, have: 7 }] });
    p.nearDeaths = 8; expect(availableEvolutions(p, ctx())).toEqual(['blackwargreymon']);
  });
  test('growlmon -> blackwargrowlmon -> megidramon', () => {
    const g = progAt('growlmon', 20); g.bonus.atk = 20; g.nearDeaths = 3;
    expect(availableEvolutions(g, ctx())).toContain('blackwargrowlmon');
    const b = progAt('blackwargrowlmon', 35); b.bonus.atk = 40; b.nearDeaths = 8;
    expect(availableEvolutions(b, ctx())).toEqual(['megidramon']);
  });
  test('wargrowlmon -> megidramon without the blue card, but harder', () => {
    const p = progAt('wargrowlmon', 35); p.bonus.atk = 40; p.nearDeaths = 11;
    expect(availableEvolutions(p, ctx())).toEqual([]);
    p.nearDeaths = 12; expect(availableEvolutions(p, ctx())).toEqual(['megidramon']);
  });
  test('evolving keeps the previous signature in the dark kits', () => {
    const p = progAt('greymon', 20); p.bonus.atk = 40; p.nearDeaths = 3; p.slots[0]!.level = 3;
    evolve(p, 'skullgreymon', ctx());
    expect(p.slots[0]).toMatchObject({ moveId: 'ground_zero', level: 3 });
    expect(p.slots.some((s, i) => i > 0 && s?.moveId === 'mega_flame')).toBe(true);
  });
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

describe('Maturidade (troca de caminho)', () => {
  // aresta de teste: Agumon maduro → MetalGreymon (os dados reais vêm do banco)
  const edge = { to: 'metalgreymon', req: { minLevel: 12, requiresMaturity: true } };
  beforeEach(() => { FORMS.agumon.evolutions.push(edge); });
  afterEach(() => { FORMS.agumon.evolutions = FORMS.agumon.evolutions.filter(e => e !== edge); });

  test('dá +12% de vida e de dano', () => {
    const p = progAt('agumon', 9); const before = effectiveStats(p);
    mature(p); const after = effectiveStats(p);
    expect(after.hp).toBeCloseTo(before.hp * (1 + T.MATURITY_BONUS));
    expect(after.dmgMul).toBeCloseTo(before.dmgMul * (1 + T.MATURITY_BONUS));
  });
  test('sem Maturidade, a aresta de Maturidade não aparece; com Maturidade só ela vale', () => {
    const p = progAt('agumon', 12); p.bonus.atk = 20;
    expect(availableEvolutions(p, ctx())).toEqual(['greymon']);
    mature(p);
    expect(availableEvolutions(p, ctx())).toEqual(['metalgreymon']);
  });
  test('dica: maduro mira a aresta de Maturidade; sem ela vira forma final', () => {
    const p = progAt('agumon', 5); mature(p);
    expect(nextEvolutionHint(p, ctx())).toEqual({ kind: 'next', to: 'metalgreymon', missing: [{ kind: 'level', need: 12 }] });
    const q = progAt('greymon', 5); mature(q);
    expect(nextEvolutionHint(q, ctx())).toEqual({ kind: 'final' });
  });
  test('sem Maturidade, a dica mostra que falta a Maturidade só se for a melhor opção', () => {
    FORMS.agumon.evolutions = FORMS.agumon.evolutions.filter(e => e.to !== 'greymon' || e === edge);
    const p = progAt('agumon', 12);
    const h = nextEvolutionHint(p, ctx());
    expect(h).toEqual({ kind: 'next', to: 'metalgreymon', missing: [{ kind: 'maturity' }] });
  });
  test('trocar de forma tira a Maturidade', () => {
    const p = progAt('agumon', 9); mature(p); applyForm(p, 'greymon');
    expect(p.matured).toBe(false);
  });
});
