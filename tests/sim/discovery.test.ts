import { defaultSave } from '../../src/core/save';
import {
  discover, drawPool, edgeId, sanitizeDiscovery, withoutReveals, findEdge, isDiscovered, knownAvailable, reqKeys, reveal, revealedKeys, secretAvailable, visibleHint,
} from '../../src/sim/discovery';
import type { EvoContext } from '../../src/sim/evolution';
import { FORMS } from '../../src/data/forms';
import { discoverAll, progAt } from '../helpers';

const reqOf = (from: string, to: string) => FORMS[from].evolutions.find(e => e.to === to)!.req;
const ctxOf = (save = defaultSave()): EvoContext => ({ save, phase: 1 });

test('edgeId e findEdge', () => {
  expect(edgeId('greymon', 'skullgreymon')).toBe('greymon->skullgreymon');
  expect(findEdge('greymon->skullgreymon')).toMatchObject({ from: 'greymon', index: 1, total: 2 });
  expect(findEdge('agumon->greymon')).toMatchObject({ from: 'agumon', index: 0, total: 1 });
  expect(findEdge('agumon->omnimon')).toBeUndefined();
});

test('reqKeys: uma chave por condição, sem unlocked', () => {
  expect(reqKeys(reqOf('greymon', 'skullgreymon'))).toEqual(['level', 'stat:atk', 'nearDeaths']);
  const pail = reqKeys(reqOf('exveemon', 'paildramon'));
  expect(pail.some(k => k.includes('wormmon'))).toBe(false);
  expect(pail).toContain('item:fusion_stingmon');
});

test('discover e reveal são idempotentes', () => {
  const s = defaultSave();
  discover(s, 'agumon->greymon'); discover(s, 'agumon->greymon');
  expect(s.discoveredEvos).toEqual(['agumon->greymon']);
  expect(isDiscovered(s, 'agumon->greymon')).toBe(true);
  reveal(s, { edge: 'greymon->skullgreymon', key: 'stat:atk' }); reveal(s, { edge: 'greymon->skullgreymon', key: 'stat:atk' });
  expect(revealedKeys(s, 'greymon->skullgreymon')).toEqual(['stat:atk']);
});

test('Agumon pronto para Greymon com save vazio: só secreta, nada visível', () => {
  const p = progAt('agumon', 9); p.bonus.atk = 20;
  const ctx = ctxOf();
  expect(knownAvailable(p, ctx)).toEqual([]);
  expect(secretAvailable(p, ctx)).toEqual(['greymon']);
  expect(visibleHint(p, ctx)).toEqual({ kind: 'none' });
  discover(ctx.save, 'agumon->greymon');
  expect(knownAvailable(p, ctx)).toEqual(['greymon']);
  expect(secretAvailable(p, ctx)).toEqual([]);
});

test('secreta com pista: requisito oculto cumprido não muda a dica', () => {
  const s = defaultSave(); reveal(s, { edge: 'greymon->skullgreymon', key: 'stat:atk' });
  const p = progAt('greymon', 20); p.bonus.atk = 40;
  const want = { kind: 'secret', from: 'greymon', missing: [], hidden: true };
  expect(visibleHint(p, ctxOf(s))).toEqual(want);
  p.nearDeaths = 5;
  expect(visibleHint(p, ctxOf(s))).toEqual(want);
});

test('secreta com pista mostra o que falta das chaves reveladas, com have nas quase-mortes', () => {
  const s = defaultSave();
  reveal(s, { edge: 'greymon->skullgreymon', key: 'nearDeaths' });
  const p = progAt('greymon', 20); p.nearDeaths = 1;
  expect(visibleHint(p, ctxOf(s))).toEqual({ kind: 'secret', from: 'greymon', missing: [{ kind: 'nearDeaths', need: 3, have: 1 }], hidden: true });
});

test('aresta descoberta tem prioridade sobre secreta com pista', () => {
  const s = defaultSave(); reveal(s, { edge: 'greymon->skullgreymon', key: 'stat:atk' }); discover(s, 'greymon->metalgreymon');
  const p = progAt('greymon', 20); p.bonus.atk = 40;
  expect(visibleHint(p, ctxOf(s))).toMatchObject({ kind: 'next', to: 'metalgreymon' });
});

test('forma sem evoluções é final', () => {
  expect(visibleHint(progAt('omnimon', 50), ctxOf())).toEqual({ kind: 'final' });
});

test('drawPool: sem parceiro bloqueado, sem revelados, sem descobertas', () => {
  const s = defaultSave();
  const pool = drawPool(s);
  expect(pool.some(r => r.edge === 'exveemon->paildramon')).toBe(false);
  expect(pool).toContainEqual({ edge: 'greymon->skullgreymon', key: 'stat:atk' });
  reveal(s, { edge: 'greymon->skullgreymon', key: 'stat:atk' });
  expect(drawPool(s)).not.toContainEqual({ edge: 'greymon->skullgreymon', key: 'stat:atk' });
  discover(s, 'greymon->skullgreymon');
  expect(drawPool(s).some(r => r.edge === 'greymon->skullgreymon')).toBe(false);
  expect(drawPool(discoverAll(defaultSave()))).toEqual([]);
});

describe('correções da revisão final', () => {
  test('drawPool só usa linhas de parceiros liberados', () => {
    const pool = drawPool(defaultSave());
    expect(pool.some(r => r.edge.startsWith('gabumon->'))).toBe(false);
    expect(pool.some(r => r.edge === 'agumon->greymon')).toBe(true);
    const s = defaultSave(); s.unlocked.push('gabumon');
    expect(drawPool(s).some(r => r.edge.startsWith('gabumon->'))).toBe(true);
  });
  test('withoutReveals esconde as pistas desta partida', () => {
    const s = defaultSave();
    reveal(s, { edge: 'agumon->greymon', key: 'level' }); reveal(s, { edge: 'agumon->greymon', key: 'stat:atk' });
    const v = withoutReveals(s, [{ edge: 'agumon->greymon', key: 'level' }]);
    expect(v.revealedReqs).toEqual({ 'agumon->greymon': ['stat:atk'] });
    expect(s.revealedReqs['agumon->greymon']).toEqual(['level', 'stat:atk']);
  });
  test('sanitizeDiscovery descarta arestas e chaves desconhecidas', () => {
    const s = defaultSave();
    s.discoveredEvos = ['agumon->greymon', 'x->y'];
    s.revealedReqs = { 'agumon->greymon': ['junk', 'level'], 'x->y': ['level'] };
    sanitizeDiscovery(s);
    expect(s.discoveredEvos).toEqual(['agumon->greymon']);
    expect(s.revealedReqs).toEqual({ 'agumon->greymon': ['level'] });
  });
});
describe('Maturidade nas evoluções secretas', () => {
  const edge = { to: 'metalgreymon', req: { minLevel: 12, requiresMaturity: true } };
  beforeEach(() => { FORMS.agumon.evolutions.push(edge); });
  afterEach(() => { FORMS.agumon.evolutions = FORMS.agumon.evolutions.filter(e => e !== edge); });
  test('reqKeys inclui a Maturidade e o Digi Data pode revelá-la', () => {
    expect(reqKeys(edge.req)).toEqual(['level', 'maturity']);
    expect(drawPool(defaultSave())).toContainEqual({ edge: 'agumon->metalgreymon', key: 'maturity' });
  });
  test('secreta de Maturidade: só dispara depois de amadurecer', () => {
    const s = discoverAll(defaultSave()); s.discoveredEvos = s.discoveredEvos.filter(e => e !== 'agumon->metalgreymon');
    const p = progAt('agumon', 12);
    expect(secretAvailable(p, ctxOf(s))).toEqual([]);
    p.matured = true;
    expect(secretAvailable(p, ctxOf(s))).toEqual(['metalgreymon']);
  });
  test('pista revelada de Maturidade aparece na dica da secreta', () => {
    const s = defaultSave(); reveal(s, { edge: 'agumon->metalgreymon', key: 'maturity' });
    const p = progAt('agumon', 12);
    expect(visibleHint(p, ctxOf(s))).toEqual({ kind: 'secret', from: 'agumon', missing: [{ kind: 'maturity' }], hidden: true });
  });
});
