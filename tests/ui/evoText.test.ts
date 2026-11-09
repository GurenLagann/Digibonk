import { FORMS } from '../../src/data/forms';
import { pathLabel, reqKeyText } from '../../src/ui/evoText';

const req = { minLevel: 20, minStats: { atk: 38 }, items: ['digiegg_courage'], minKills: 1000, minNearDeaths: 3, minPhase: 2 };
test('reqKeyText cobre todos os formatos', () => {
  expect(reqKeyText(req, 'level')).toBe('Nv 20');
  expect(reqKeyText(req, 'stat:atk')).toBe('Atq 38');
  expect(reqKeyText(req, 'item:digiegg_courage')).not.toBe('digiegg_courage');
  expect(reqKeyText(req, 'kills')).toBe('1000 abates');
  expect(reqKeyText(req, 'nearDeaths')).toBe('HP < 25%: 3×');
  expect(reqKeyText(req, 'phase')).toBe('Fase 2');
});
test('pathLabel numera só quando há mais de um caminho', () => {
  expect(pathLabel('greymon->skullgreymon')).toBe(`Caminho ${FORMS.greymon.name} ②`);
  expect(pathLabel('agumon->greymon')).toBe('Caminho Agumon');
});
