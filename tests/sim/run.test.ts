import { createRun, stepRun, doEvolve, abandonRun, playerSpeed, chooseBlind, hudSave, type RunState } from '../../src/sim/run';
import { visibleHint } from '../../src/sim/discovery';
import { CARDS } from '../../src/data/cards';
import { newPhase } from '../../src/sim/phase';
import { defaultSave, loadSave } from '../../src/core/save';
import { createRng } from '../../src/core/rng';
import { BOSSES } from '../../src/data/enemies';
import { T } from '../../src/data/tuning';
import { MINIBOSSES } from '../../src/data/enemies';
import { MAP_OBSTACLES } from '../../src/sim/map';
import { fakeStorage, autoResolveModals, circleInput, discoverAll } from '../helpers';

const opts = (o: { seed?: number; partnerId?: string; storage?: Storage } = {}) =>
  ({ partnerId: o.partnerId ?? 'agumon', seed: o.seed ?? 1, save: defaultSave(), storage: o.storage ?? fakeStorage({}) });

test('modal offers freeze the run', () => {
  const r = createRun(opts()); r.offers = [{ kind: 'stat', stat: 'atk', amount: 3 }];
  const t = r.time; stepRun(r, { mx: 1, mz: 0 }, 1 / 60); expect(r.time).toBe(t);
});
test('pause freezes the run', () => {
  const r = createRun(opts()); r.paused = true; stepRun(r, { mx: 1, mz: 0 }, 1 / 60); expect(r.time).toBe(0);
});
test('egg unlocks partner immediately and persists even on defeat', () => {
  const storage = fakeStorage({}); const r = createRun(opts({ storage }));
  r.pickups.push({ id: 999, x: r.px, z: r.pz, kind: 'item', value: 0, ref: 'egg_gabumon' });
  const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(ev).toContainEqual({ type: 'partnerUnlocked', partnerId: 'gabumon' });
  expect(r.save.unlocked).toContain('gabumon');
  r.combat.hp = -1; r.prog.bonus.hp = -10000; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.ended).toBe('defeat'); expect(loadSave(storage).unlocked).toContain('gabumon');
});
test('headless bot survives a full phase timeline without NaN', () => {
  const r = createRun(opts({ seed: 99 })); r.prog.bonus.hp = 100000;
  for (let i = 0; i < 60 * 660; i++) { autoResolveModals(r); stepRun(r, circleInput(i), 1 / 60); }
  expect(r.phase.overtime).toBe(true);
  expect(r.pool.alive().length).toBeLessThanOrEqual(T.MAX_ENEMIES + 6);
  expect(Number.isFinite(r.px) && Number.isFinite(r.pz)).toBe(true);
  expect(r.prog.level).toBeGreaterThan(5);
}, 60000);
test('clearing phase 5 is victory and records it', () => {
  const storage = fakeStorage({}); const r = createRun(opts({ storage }));
  r.phase = newPhase(5, createRng(1)); r.phase.mission.done = true; r.phase.bossUnlocked = true; r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[4], 50, 50, { hp: 1, dmg: 1 }, { boss: true })!; r.phase.bossId = b.id; r.pool.kill(b.id);
  const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(ev).toContainEqual({ type: 'victory' }); expect(r.ended).toBe('victory');
  expect(loadSave(storage).records).toMatchObject({ wins: 1, bestPhase: 5, runs: 1 });
});
test('clearing a phase advances and resets the arena', () => {
  const r = createRun(opts()); r.phase.mission.done = true; r.phase.bossUnlocked = true; r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[0], 50, 50, { hp: 1, dmg: 1 }, { boss: true })!; r.phase.bossId = b.id; r.pool.kill(b.id);
  r.px = 40; const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(ev).toContainEqual({ type: 'phaseCleared', phase: 1 }); expect(r.phase.phase).toBe(2); expect(r.px).toBe(0);
});
test('player stays inside map bounds', () => {
  const r = createRun(opts()); r.prog.bonus.hp = 100000; r.paused = false;
  for (let i = 0; i < 60 * 40; i++) { autoResolveModals(r); stepRun(r, { mx: 1, mz: 0 }, 1 / 60); }
  expect(r.px).toBeLessThanOrEqual(T.MAP_HALF);
});
test('obstacles keep clear of the center', () => {
  expect(MAP_OBSTACLES.length).toBeGreaterThan(40);
  for (const o of MAP_OBSTACLES) expect(Math.hypot(o.x, o.z)).toBeGreaterThanOrEqual(8);
});
test('evolving records discovery and restores hp', () => {
  const storage = fakeStorage({}); const r = createRun(opts({ storage }));
  r.prog.level = 8; r.prog.bonus.atk = 20; r.combat.hp = 1;
  doEvolve(r, 'greymon');
  expect(r.prog.formId).toBe('greymon'); expect(r.combat.hp).toBe(r.combat.maxHp);
  expect(loadSave(storage).discovered).toContain('greymon');
});
test('evolution availability is announced once', () => {
  const o = opts(); discoverAll(o.save);
  const r = createRun(o); r.prog.level = 8; r.prog.bonus.atk = 20;
  const a = stepRun(r, { mx: 0, mz: 0 }, 1 / 60), b = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(a).toContainEqual({ type: 'evolutionAvailable', forms: ['greymon'] });
  expect(b.some(e => e.type === 'evolutionAvailable')).toBe(false);
});
test('run remembers the horizontal move direction for sprite facing', () => {
  const r = createRun(opts()); stepRun(r, { mx: 1, mz: 0 }, 1 / 60); expect(r.dirX).toBeGreaterThan(0);
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60); expect(r.dirX).toBeGreaterThan(0); // parado mantém a última direção
  stepRun(r, { mx: -1, mz: 0.2 }, 1 / 60); expect(r.dirX).toBeLessThan(0);
});

test('facing follows the dominant movement axis and is kept when stopped', () => {
  const r = createRun(opts());
  expect(r.facing).toBe('side');
  stepRun(r, { mx: 0, mz: -1 }, 1 / 60); expect(r.facing).toBe('up');
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60); expect(r.facing).toBe('up');
  stepRun(r, { mx: 0.3, mz: 1 }, 1 / 60); expect(r.facing).toBe('down');
  stepRun(r, { mx: 1, mz: 0.4 }, 1 / 60); expect(r.facing).toBe('side');
});

test('facing has diagonals (8 directions, mirrored by dirX)', () => {
  const r = createRun(opts());
  stepRun(r, { mx: 0.7, mz: -0.7 }, 1 / 60); expect(r.facing).toBe('diagup');
  stepRun(r, { mx: -0.7, mz: 0.7 }, 1 / 60); expect(r.facing).toBe('diagdown');
  stepRun(r, { mx: 0.2, mz: -1 }, 1 / 60); expect(r.facing).toBe('up');
  stepRun(r, { mx: 1, mz: 0.2 }, 1 / 60); expect(r.facing).toBe('side');
});

test('playerSpeed follows spd and the run remembers its base speed', () => {
  const r = createRun(opts());
  expect(r.baseSpeed).toBeCloseTo(playerSpeed(r.prog));
  r.prog.bonus.spd += 1000;
  expect(playerSpeed(r.prog)).toBeGreaterThan(2 * r.baseSpeed);
});

test('abandon updates the per-partner record and flags a new record once', () => {
  const save = defaultSave();
  const a = createRun({ ...opts(), save }); abandonRun(a);
  expect(save.partnerRecords.agumon).toEqual({ runs: 1, wins: 0, bestPhase: 1 }); expect(a.newRecord).toBe(true);
  const b = createRun({ ...opts(), save }); abandonRun(b);
  expect(save.partnerRecords.agumon.runs).toBe(2); expect(b.newRecord).toBe(false);
});
test('evolving stacks the level in pathLevels', () => {
  const r = createRun(opts()); expect(r.prog.pathLevels).toEqual([1]);
  r.prog.level = 9; r.prog.bonus.atk = 20; doEvolve(r, 'greymon');
  expect(r.prog.pathLevels).toEqual([1, 9]);
});
test('killing a miniboss counts as a guardian', () => {
  const r = createRun(opts()); r.prog.bonus.hp = 1e6;
  expect(r.stats).toEqual({ bosses: 0, guardians: 0 });
  const m = r.pool.spawn(MINIBOSSES[0], r.px + 1, r.pz, { hp: 1, dmg: 0 }, { miniboss: true })!; m.hp = 0;
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60); expect(r.stats.guardians).toBe(1);
});
test('killing the phase boss counts in stats', () => {
  const r = createRun(opts({ partnerId: 'veemon', seed: 5 })); r.prog.bonus.hp = 1e6;
  r.phase.mission.done = true; r.phase.bossUnlocked = true; r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[0], r.px + 1, r.pz, { hp: 1, dmg: 0 }, { boss: true })!; b.hp = 0.001; r.phase.bossId = b.id;
  for (let i = 0; i < 120 && !r.stats.bosses; i++) stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.stats.bosses).toBe(1);
});

describe('evoluções secretas na partida', () => {
  const veemonReady = (r: RunState) => { r.prog.level = 8; r.prog.bonus.spd = 10; r.prog.bonus.def = 5; r.prog.bonus.atk = 4; };
  test('uma secreta disponível: evolui sozinho, avisa e grava na hora', () => {
    const storage = fakeStorage({}); const r = createRun(opts({ storage }));
    r.prog.level = 9; r.prog.bonus.atk = 20;
    const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.prog.formId).toBe('greymon');
    expect(ev).toContainEqual({ type: 'formDiscovered', formId: 'greymon' });
    expect(loadSave(storage).discoveredEvos).toContain('agumon->greymon');
  });
  test('duas secretas: escolha às cegas congela a partida até escolher', () => {
    const r = createRun(opts({ partnerId: 'veemon' })); veemonReady(r);
    stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.blindChoice?.slice().sort()).toEqual(['exveemon', 'veedramon']);
    expect(r.prog.formId).toBe('veemon');
    const t = r.time; stepRun(r, { mx: 1, mz: 0 }, 1 / 60); expect(r.time).toBe(t);
    const second = r.blindChoice![1], first = r.blindChoice![0];
    expect(chooseBlind(r, 1)).toBe(second);
    expect(r.prog.formId).toBe(second); expect(r.blindChoice).toBeNull();
    expect(r.save.discoveredEvos).toContain(`veemon->${second}`);
    expect(r.save.discoveredEvos).not.toContain(`veemon->${first}`);
  });
  test('chooseBlind com índice inválido não faz nada', () => {
    const r = createRun(opts({ partnerId: 'veemon' })); veemonReady(r);
    stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(chooseBlind(r, 5)).toBeNull(); expect(r.prog.formId).toBe('veemon');
  });
  test('secreta e conhecida juntas: a secreta evolui sozinha', () => {
    const o = opts({ partnerId: 'veemon' }); o.save.discoveredEvos.push('veemon->exveemon');
    const r = createRun(o); veemonReady(r);
    const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.blindChoice).toBeNull(); expect(r.prog.formId).toBe('veedramon');
    expect(ev).toContainEqual({ type: 'formDiscovered', formId: 'veedramon' });
  });
  test('todas conhecidas: nada automático, só o aviso de disponível', () => {
    const o = opts({ partnerId: 'veemon' }); o.save.discoveredEvos.push('veemon->exveemon', 'veemon->veedramon');
    const r = createRun(o); veemonReady(r);
    const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.prog.formId).toBe('veemon'); expect(r.blindChoice).toBeNull();
    expect(ev.some(e => e.type === 'evolutionAvailable')).toBe(true);
  });
});

describe('Digi Data', () => {
  const data = (r: RunState) => r.pickups.filter(p => p.kind === 'digidata');
  test('save vazio: 1 a 2 dados por fase, longe do início', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const r = createRun(opts({ seed }));
      expect(data(r).length).toBeGreaterThanOrEqual(T.DIGIDATA_PER_PHASE_MIN);
      expect(data(r).length).toBeLessThanOrEqual(T.DIGIDATA_PER_PHASE_MAX);
      for (const d of data(r)) expect(Math.hypot(d.x, d.z)).toBeGreaterThanOrEqual(15);
    }
  });
  test('nada para revelar: nenhum dado surge', () => {
    const o = opts(); discoverAll(o.save);
    expect(data(createRun(o))).toEqual([]);
  });
  test('coletar revela um requisito e grava na hora', () => {
    const storage = fakeStorage({}); const r = createRun(opts({ storage }));
    const d = data(r)[0]; d.x = r.px; d.z = r.pz;
    const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(ev).toContainEqual({ type: 'digiData' });
    expect(r.digiDataThisRun).toHaveLength(1);
    const { edge, key } = r.digiDataThisRun[0];
    expect(loadSave(storage).revealedReqs[edge]).toContain(key);
  });
  test('sorteio vazio na coleta: só o aviso, sem linha no resultado', () => {
    const r = createRun(opts());
    discoverAll(r.save);
    const d = data(r)[0]; d.x = r.px; d.z = r.pz;
    const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(ev).toContainEqual({ type: 'digiData' });
    expect(r.digiDataThisRun).toEqual([]);
  });
});

describe('correções da revisão final', () => {
  test('pista de Digi Data não aparece na dica durante a partida', () => {
    const r = createRun(opts());
    r.prog.level = 1;
    r.save.unlocked = ['agumon'];
    const d = r.pickups.find(p => p.kind === 'digidata')!; d.x = r.px; d.z = r.pz;
    stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.digiDataThisRun.length).toBe(1);
    expect(visibleHint(r.prog, { save: hudSave(r), phase: 1 })).toEqual({ kind: 'none' });
  });
  test('evolução secreta espera a escolha de carta pendente', () => {
    const r = createRun(opts());
    r.prog.level = 9; r.prog.bonus.atk = 20;
    r.chests = [{ id: 1, x: r.px, z: r.pz, opened: false }];
    // força o baú a dar uma carta slash (pede escolha)
    r.debug.forceItems = false;
    const slash = Object.values(CARDS).find(c => c.kind === 'slash')!;
    r.pickups.push({ id: 9999, x: r.px, z: r.pz, kind: 'card', value: 0, ref: slash.id });
    stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.pendingCard).not.toBeNull();
    expect(r.prog.formId).toBe('agumon');
  });
});
