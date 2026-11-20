import { planStats, runPathTarget, createRun, stepRun, doEvolve, abandonRun, playerSpeed, chooseBlind, chooseOffer, hudSave, rerollOffers, skipOffer, banOffer, stayMature, type RunState } from '../../src/sim/run';
import { offerKey } from '../../src/sim/progression';
import { applyForm } from '../../src/sim/evolution';
import { discover, reveal, visibleHint } from '../../src/sim/discovery';
import { CARDS } from '../../src/data/cards';
import { FORMS } from '../../src/data/forms';
import { newPhase } from '../../src/sim/phase';
import { defaultSave, loadSave } from '../../src/core/save';
import { createRng } from '../../src/core/rng';
import { BOSSES } from '../../src/data/enemies';
import { T } from '../../src/data/tuning';
import { MINIBOSSES } from '../../src/data/enemies';
import { MAP_OBSTACLES } from '../../src/sim/map';
import { fakeStorage, autoResolveModals, circleInput, discoverAll, maxedProg } from '../helpers';

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

test('run remembers the last move direction in z (dirZ) for camera-relative views', () => {
  const r = createRun(opts()); expect(r.dirZ).toBe(0);
  stepRun(r, { mx: 0, mz: 1 }, 1 / 60); expect(r.dirZ).toBe(1); expect(r.dirX).toBe(0);
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60); expect(r.dirZ).toBe(1); // parado mantém a última direção
  stepRun(r, { mx: 3, mz: -4 }, 1 / 60); expect(r.dirX).toBeCloseTo(0.6); expect(r.dirZ).toBeCloseTo(-0.8);
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
  expect(save.partnerRecords.agumon).toEqual({ runs: 1, wins: 0, bestPhase: 1, bestKills: 0 }); expect(a.newRecord).toBe(true);
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
    r.chests = [{ id: 1, x: r.px, z: r.pz, opened: false, kind: 'free' }];
    // força o baú a dar uma carta slash (pede escolha)
    r.debug.forceItems = false;
    const slash = Object.values(CARDS).find(c => c.kind === 'slash')!;
    r.pickups.push({ id: 9999, x: r.px, z: r.pz, kind: 'card', value: 0, ref: slash.id });
    stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.pendingCard).not.toBeNull();
    expect(r.prog.formId).toBe('agumon');
  });
});

describe('nível infinito na partida', () => {
  test('sem nada para melhorar, subir de nível não abre a tela e avisa o ganho', () => {
    const r = createRun(opts());
    const f = r.prog.formId, full = maxedProg(f);
    r.prog.slots = full.slots; r.prog.passives = ['card_greymon_horn', 'card_hyper_speed', 'card_hyper_speed'];
    r.prog.pendingLevelUps = 2; r.prog.level = 40;
    const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.offers).toBeNull();
    expect(r.prog.pendingLevelUps).toBe(0);
    expect(ev.filter(e => e.type === 'autoGain')).toHaveLength(2);
  });
});
test('a última melhoria escolhida não abre outra tela: os níveis restantes viram ganho automático', () => {
  const r = createRun(opts());
  const full = maxedProg(r.prog.formId);
  r.prog.slots = full.slots; r.prog.slots[3]!.level = 4; // falta 1 nível num golpe
  r.prog.passives = ['card_greymon_horn', 'card_hyper_speed', 'card_hyper_speed'];
  r.prog.pendingLevelUps = 3; r.offers = [{ kind: 'upgrade', slot: 3 }];
  chooseOffer(r, 0);
  expect(r.offers).toBeNull();
  const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(ev.filter(e => e.type === 'autoGain')).toHaveLength(2);
});

describe('atualizar, pular e banir', () => {
  const withOffers = () => { const r = createRun(opts()); r.prog.pendingLevelUps = 2; r.prog.level = 3; r.offers = rollOfferSet(r); return r; };
  const rollOfferSet = (r: RunState) => { stepRun(r, { mx: 0, mz: 0 }, 1 / 60); return r.offers; };
  test('Laboratório soma usos e 4ª opção', () => {
    const save = defaultSave(); save.lab = { lab_reroll: 3, lab_ban: 2, lab_offer: 1 };
    const r = createRun({ ...opts(), save });
    expect(r.levelTools).toEqual({ reroll: 5, skip: 2, ban: 3 });
    expect(r.offerCount).toBe(4);
    r.prog.pendingLevelUps = 1; r.prog.level = 2;
    stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.offers).toHaveLength(4);
  });
  test('começa com os usos do tuning', () => {
    expect(createRun(opts()).levelTools).toEqual(T.LEVEL_TOOLS);
  });
  test('atualizar sorteia de novo e gasta um uso; sem usos não faz nada', () => {
    const r = createRun(opts()); r.prog.pendingLevelUps = 1; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.offers).not.toBeNull();
    for (let i = 0; i < T.LEVEL_TOOLS.reroll; i++) expect(rerollOffers(r)).toBe(true);
    expect(r.levelTools.reroll).toBe(0);
    const before = r.offers; expect(rerollOffers(r)).toBe(false); expect(r.offers).toBe(before);
  });
  test('pular consome o nível com o ganho automático e abre o próximo', () => {
    const r = createRun(opts()); r.prog.pendingLevelUps = 2; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    const sum = () => Object.values(r.prog.bonus).reduce((a, b) => a + b, 0);
    const s0 = sum(); const g = skipOffer(r);
    expect(g).not.toBeNull(); expect(sum()).toBe(s0 + g!.amount);
    expect(r.prog.pendingLevelUps).toBe(1); expect(r.offers).not.toBeNull();
    expect(r.levelTools.skip).toBe(T.LEVEL_TOOLS.skip - 1);
  });
  test('banir tira a carta do sorteio pelo resto da partida e troca só ela', () => {
    const r = createRun(opts()); r.prog.pendingLevelUps = 1; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    const [a, b, c] = r.offers!; const key = offerKey(r.prog, b);
    expect(banOffer(r, 1)).toBe(true);
    expect(r.banned).toContain(key);
    expect(r.offers![0]).toEqual(a); expect(r.offers![2]).toEqual(c);
    expect(offerKey(r.prog, r.offers![1])).not.toBe(key);
    expect(r.levelTools.ban).toBe(T.LEVEL_TOOLS.ban - 1);
    expect(banOffer(r, 0)).toBe(false);
  });
});
test('amadurecer: trava as evoluções normais, enche a vida e não avisa evolução', () => {
  const o = opts(); discoverAll(o.save);
  const r = createRun(o); r.prog.level = 9; r.prog.bonus.atk = 20; r.combat.hp = 1;
  stayMature(r);
  expect(r.prog.matured).toBe(true); expect(r.combat.hp).toBe(r.combat.maxHp);
  const ev = stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.prog.formId).toBe('agumon'); expect(ev.some(e => e.type === 'evolutionAvailable')).toBe(false);
});

describe('efeitos de relíquia na partida', () => {
  test('regeneração cura com o tempo', () => {
    const r = createRun(opts()); r.prog.relics = ['relic_crest_friend']; r.pool.clearAll();
    stepRun(r, { mx: 0, mz: 0 }, 1e-6); // sincroniza a vida máxima com a relíquia
    r.combat.hp = 10; r.pool.clearAll();
    stepRun(r, { mx: 0, mz: 0 }, 0.5);
    expect(r.combat.hp).toBeCloseTo(10 + 3 * 0.5, 1);
  });
  test('revive uma vez com metade da vida', () => {
    const r = createRun(opts()); r.prog.relics = ['relic_digiegg_hope'];
    stepRun(r, { mx: 0, mz: 0 }, 1e-6); // sincroniza a vida máxima com a relíquia
    r.combat.hp = -5; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.ended).toBeNull(); expect(r.combat.hp).toBeCloseTo(r.combat.maxHp * 0.5, 0); expect(r.reviveUsed).toBe(true);
    r.combat.hp = -5; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
    expect(r.ended).toBe('defeat');
  });
});

test('câmera: camYaw começa em 0 e camHalf em π (sem restrição)', () => {
  const r = createRun(opts());
  expect(r.camYaw).toBe(0);
  expect(r.camHalf).toBe(Math.PI);
});

/** vence a fase 5 na hora: chefe já morto */
function winNow(r: RunState) {
  r.phase = newPhase(5, createRng(1)); r.phase.mission.done = true; r.phase.bossUnlocked = true; r.phase.bossActive = true;
  const b = r.pool.spawn(BOSSES[4], 50, 50, { hp: 1, dmg: 1 }, { boss: true })!; r.phase.bossId = b.id; r.pool.kill(b.id);
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
}
test('victory records best time, medal and only improves', () => {
  const save = defaultSave();
  const a = createRun({ ...opts(), save }); a.time = 1400; winNow(a);
  expect(a.ended).toBe('victory');
  expect(save.partnerRecords.agumon.bestTime).toBeCloseTo(1400, 0); expect(save.records.bestTime).toBeCloseTo(1400, 0);
  expect(a.newTimeRecord).toBe(true); expect(a.medalEarned).toBe('gold');
  const b = createRun({ ...opts(), save }); b.time = 1600; winNow(b);
  expect(save.partnerRecords.agumon.bestTime).toBeCloseTo(1400, 0);
  expect(b.newTimeRecord).toBe(false); expect(b.medalEarned).toBeNull();
});
test('defeat records most kills but no time or medal', () => {
  const save = defaultSave();
  const r = createRun({ ...opts(), save }); r.prog.kills = 300; abandonRun(r);
  expect(save.partnerRecords.agumon.bestKills).toBe(300); expect(save.partnerRecords.agumon.bestTime).toBeUndefined();
  expect(save.records.bestTime).toBeUndefined(); expect(r.medalEarned).toBeNull(); expect(r.newTimeRecord).toBe(false);
});

test('Cristais: a vitória soma em save.currency, grava e não repete ao continuar o passo', () => {
  const storage = fakeStorage({}); const save = defaultSave();
  const r = createRun({ ...opts({ storage }), save }); r.time = 1400; r.prog.kills = 400; r.stats.bosses = 2; r.stats.guardians = 1; winNow(r);
  // fase 5 (100) + 2 abates/200 (2×1... 400/200=2) + 2 chefes (30) + 1 guardião (10) + ouro (70, substitui o bônus de vitória)
  const esperado = 100 + 2 + 30 + 10 + 70;
  expect(r.crystalsEarned).toBe(esperado); expect(save.currency).toBe(esperado);
  expect(loadSave(storage).currency).toBe(esperado);
  for (let i = 0; i < 5; i++) stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  abandonRun(r);
  expect(save.currency).toBe(esperado);
});
test('Cristais: vitória com relicOffer pendente soma uma única vez', () => {
  const save = defaultSave();
  const r = createRun({ ...opts(), save }); r.time = 1400; winNow(r);
  const antes = save.currency; r.relicOffer = ['x'] as never;
  for (let i = 0; i < 5; i++) stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(save.currency).toBe(antes); expect(antes).toBeGreaterThan(0);
});
test('Cristais: derrota dentro da Zona Digital soma uma única vez', () => {
  const save = defaultSave();
  const r = createRun({ ...opts(), save }); r.prog.kills = 200;
  const g = MINIBOSSES[0];
  r.portals.push({ x: r.px, z: r.pz, attr: g.attribute, guardian: g.id, t: T.ZONE.PORTAL_SECONDS });
  stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.zone).not.toBeNull();
  r.combat.hp = 0; stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  expect(r.ended).toBe('defeat');
  const esperado = 1; // 0 fases limpas + 1 abate-bloco
  expect(save.currency).toBe(esperado); expect(r.crystalsEarned).toBe(esperado);
  for (let i = 0; i < 5; i++) stepRun(r, { mx: 0, mz: 0 }, 1 / 60);
  abandonRun(r);
  expect(save.currency).toBe(esperado);
});

test('Cristais: derrota conta fases LIMPAS (fase alcançada − 1)', () => {
  const save = defaultSave();
  const r = createRun({ ...opts(), save }); r.phase = newPhase(2, createRng(1)); r.prog.kills = 4000; r.stats.bosses = 1; r.stats.guardians = 1;
  abandonRun(r);
  expect(r.crystalsEarned).toBe(20 + 20 + 15 + 10); expect(save.currency).toBe(65);
});
test('Cristais: desistir de cara na fase 1 sem abates não rende nada', () => {
  const save = defaultSave();
  const r = createRun({ ...opts(), save }); abandonRun(r);
  expect(r.crystalsEarned).toBe(0); expect(save.currency).toBe(0);
});

describe('build na partida', () => {
  const mk = (path: string[]) => {
    const save = defaultSave();
    save.builds.agumon = { fav: [], ban: ['move:sharp_claws'], path };
    return createRun({ partnerId: 'agumon', seed: 1, save, storage: null });
  };
  test('a partida copia a build e o caminho mira a próxima forma', () => {
    const r = mk(['agumon', 'greymon', 'metalgreymon']);
    expect(r.build.ban).toEqual(['move:sharp_claws']);
    expect(runPathTarget(r)).toBe('greymon');
  });
  test('✕ da build vale nas ofertas da partida', () => {
    const r = mk([]);
    r.prog.pendingLevelUps = 1; r.levelTools.reroll = 99; r.offers = [];
    for (let i = 0; i < 30; i++) { rerollOffers(r); for (const o of r.offers!) if (o.kind === 'learn') expect(o.moveId).not.toBe('sharp_claws'); }
  });
  test('evoluir fora do caminho desliga a orientação', () => {
    const r = mk(['agumon', 'greymon', 'metalgreymon']);
    applyForm(r.prog, 'greymon'); expect(runPathTarget(r)).toBe('metalgreymon');
    r.prog.level = 99; r.prog.nearDeaths = 99; r.prog.bonus.atk = 999; r.prog.bonus.def = 999;
    discover(r.save, 'greymon->skullgreymon');
    doEvolve(r, 'skullgreymon');
    expect(r.pathOff).toBe(true);
    expect(runPathTarget(r)).toBeNull();
  });
  test('planStats: só status conhecidos que faltam na aresta alvo', () => {
    const r = mk(['agumon', 'greymon']);
    expect(planStats(r)).toEqual([]);
    reveal(r.save, { edge: 'agumon->greymon', key: 'stat:atk' });
    expect(planStats(r)).toEqual(['atk']);
    discover(r.save, 'agumon->greymon');
    r.prog.bonus.atk = 10;
    expect(planStats(r)).toEqual([]);
  });
  test('Digi Data revelado nesta partida não entra no planStats', () => {
    const r = mk(['agumon', 'greymon']);
    const got = { edge: 'agumon->greymon', key: 'stat:atk' } as const;
    reveal(r.save, got); r.digiDataThisRun.push(got);
    expect(planStats(r)).toEqual([]);
  });
  test('evoluir pelo caminho mantém pathOff falso', () => {
    const r = mk(['agumon', 'greymon', 'metalgreymon']);
    r.prog.level = 99; r.prog.bonus.atk = 999; r.prog.bonus.def = 999; r.prog.bonus.spd = 999;
    discover(r.save, 'agumon->greymon');
    doEvolve(r, 'greymon');
    expect(r.prog.formId).toBe('greymon');
    expect(r.pathOff).toBe(false);
    expect(runPathTarget(r)).toBe('metalgreymon');
  });
  test('stayMature quando a próxima aresta não pede maturidade desliga o caminho', () => {
    const r = mk(['agumon', 'greymon']);
    expect(FORMS.agumon.evolutions.find(e => e.to === 'greymon')!.req.requiresMaturity).toBeFalsy();
    stayMature(r);
    expect(r.pathOff).toBe(true);
  });
});
