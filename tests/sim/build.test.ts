import { defaultSave } from '../../src/core/save';
import { buildOf, buildPrefs, cycleMark, lineForms, lineMoves, markOf } from '../../src/sim/build';

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
