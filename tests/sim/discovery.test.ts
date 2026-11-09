import { defaultSave } from '../../src/core/save';
import {
  discover, drawPool, edgeId, findEdge, isDiscovered, knownAvailable, reqKeys, reveal, revealedKeys, secretAvailable, visibleHint,
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
