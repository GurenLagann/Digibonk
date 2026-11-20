import { defaultSave } from '../../src/core/save';
import { PARTNERS } from '../../src/data/partners';
import { lineForms } from '../../src/sim/build';
import { analyzerData } from '../../src/sim/analyzer';
import { discover, reveal } from '../../src/sim/discovery';

test('um grupo por parceiro, contagem de descobertas sobre todas as formas das linhas', () => {
  const s = defaultSave(); s.discovered = ['agumon', 'greymon'];
  const d = analyzerData(s);
  expect(d.groups.map(g => g.partnerId)).toEqual(expect.arrayContaining(PARTNERS.map(p => p.id)));
  const all = new Set(PARTNERS.flatMap(p => lineForms(p.id)));
  expect(d.total).toBe(all.size);
  expect(d.known).toBe(2);
});
test('parceiro bloqueado: linha inteira desconhecida', () => {
  const s = defaultSave(); s.discovered = ['gabumon'];
  const g = analyzerData(s).groups.find(x => x.partnerId === 'gabumon')!;
  expect(g.locked).toBe(true);
  expect(g.forms.every(f => !f.known)).toBe(true);
});
test('arestas: descoberta mostra destino; secreta com pista só pistas; sem pista some', () => {
  const s = defaultSave(); s.discovered = ['agumon', 'greymon'];
  discover(s, 'agumon->greymon');
  reveal(s, { edge: 'greymon->skullgreymon', key: 'level' });
  const forms = analyzerData(s).groups.find(g => g.partnerId === 'agumon')!.forms;
  const grey = forms.find(f => f.id === 'greymon')!;
  expect(grey.from).toEqual([expect.objectContaining({ form: 'agumon' })]);
  expect(grey.to).toEqual([{ form: null, req: expect.anything(), hints: ['level'] }]); // metalgreymon sem pista some
});
test('forma não descoberta não traz arestas', () => {
  const s = defaultSave(); s.discovered = ['agumon'];
  const mg = analyzerData(s).groups.find(g => g.partnerId === 'agumon')!.forms.find(f => f.id === 'metalgreymon')!;
  expect(mg).toEqual({ id: 'metalgreymon', known: false, from: [], to: [] });
});
