import { defaultSave } from '../../src/core/save';
import { buildOf, buildPrefs, clearPathFrom, cycleMark, lineForms, lineMoves, markOf, pathChoices, pathTarget, setPathStep } from '../../src/sim/build';
import { discover, reveal } from '../../src/sim/discovery';

test('lineForms começa no Child e inclui Greymon e MetalGreymon', () => {
  const f = lineForms('agumon');
  expect(f[0]).toBe('agumon');
  expect(f).toEqual(expect.arrayContaining(['greymon', 'metalgreymon', 'skullgreymon']));
  expect(new Set(f).size).toBe(f.length);
});
test('lineMoves traz assinatura e kit com a primeira forma de origem, sem repetir', () => {
  const m = lineMoves('agumon');
  expect(m[0]).toEqual({ moveId: 'baby_flame', from: 'agumon' });
  expect(m.find(x => x.moveId === 'spitfire_blast')!.from).toBe('agumon'); // também no kit do Greymon
  expect(m.find(x => x.moveId === 'horn_strike')!.from).toBe('greymon');
  expect(new Set(m.map(x => x.moveId)).size).toBe(m.length);
});
test('buildOf cria build vazia e a guarda no save', () => {
  const s = defaultSave();
  const b = buildOf(s, 'agumon');
  expect(b).toEqual({ fav: [], ban: [], path: [] });
  expect(s.builds.agumon).toBe(b);
});
test('cycleMark: nada → ★ → ✕ → nada', () => {
  const b = { fav: [], ban: [], path: [] };
  cycleMark(b, 'move:sharp_claws'); expect(markOf(b, 'move:sharp_claws')).toBe('fav');
  cycleMark(b, 'move:sharp_claws'); expect(markOf(b, 'move:sharp_claws')).toBe('ban');
  cycleMark(b, 'move:sharp_claws'); expect(markOf(b, 'move:sharp_claws')).toBeNull();
});
test('cycleMark respeita o limite de 4: ★ cheio pula para ✕; ✕ cheio volta para nada', () => {
  const b = { fav: ['move:a', 'move:b', 'move:c', 'move:d'], ban: [], path: [] };
  cycleMark(b, 'move:e'); expect(markOf(b, 'move:e')).toBe('ban');
  const c = { fav: ['move:e'], ban: ['move:a', 'move:b', 'move:c', 'move:d'], path: [] };
  cycleMark(c, 'move:e'); expect(markOf(c, 'move:e')).toBeNull();
  const d = { fav: ['move:a', 'move:b', 'move:c', 'move:d'], ban: ['move:w', 'move:x', 'move:y', 'move:z'], path: [] };
  expect(cycleMark(d, 'move:e')).toBe(false);
});
test('buildPrefs: ★ = 2, ✕ = 0, resto = 1', () => {
  const p = buildPrefs({ fav: ['move:a'], ban: ['card:b'], path: [] });
  expect(p.weight('move:a')).toBe(2); expect(p.weight('card:b')).toBe(0); expect(p.weight('move:c')).toBe(1);
});

describe('caminho', () => {
  test('sem descobertas nem pistas, não há passos', () => {
    expect(pathChoices(defaultSave(), [], 'agumon')).toEqual([]);
  });
  test('aresta descoberta vira passo aberto; secreta só com pista', () => {
    const s = defaultSave();
    discover(s, 'agumon->greymon');
    expect(pathChoices(s, [], 'agumon')).toEqual([{ to: 'greymon', secret: false, hints: [] }]);
    const path = ['agumon', 'greymon'];
    expect(pathChoices(s, path, 'agumon')).toEqual([]);
    reveal(s, { edge: 'greymon->skullgreymon', key: 'level' });
    expect(pathChoices(s, path, 'agumon')).toEqual([{ to: 'skullgreymon', secret: true, hints: ['level'] }]);
  });
  test('depois de uma secreta não há mais passos', () => {
    const s = defaultSave();
    reveal(s, { edge: 'skullgreymon->blackwargreymon', key: 'level' });
    expect(pathChoices(s, ['agumon', 'greymon', 'skullgreymon'], 'agumon')).toEqual([]);
  });
  test('setPathStep corta e acrescenta; clearPathFrom limpa; caminho de 1 forma vira []', () => {
    const b = { fav: [], ban: [], path: ['agumon', 'greymon', 'metalgreymon'] };
    setPathStep(b, 'agumon', 2, 'skullgreymon'); expect(b.path).toEqual(['agumon', 'greymon', 'skullgreymon']);
    clearPathFrom(b, 2); expect(b.path).toEqual(['agumon', 'greymon']);
    clearPathFrom(b, 1); expect(b.path).toEqual([]);
    const e = { fav: [], ban: [], path: [] as string[] };
    setPathStep(e, 'agumon', 1, 'greymon'); expect(e.path).toEqual(['agumon', 'greymon']);
  });
  test('pathTarget: próxima forma enquanto no caminho e não desligado', () => {
    const p = ['agumon', 'greymon', 'metalgreymon'];
    expect(pathTarget(p, 'agumon', false)).toBe('greymon');
    expect(pathTarget(p, 'greymon', false)).toBe('metalgreymon');
    expect(pathTarget(p, 'metalgreymon', false)).toBeNull();
    expect(pathTarget(p, 'skullgreymon', false)).toBeNull();
    expect(pathTarget(p, 'agumon', true)).toBeNull();
  });
});
