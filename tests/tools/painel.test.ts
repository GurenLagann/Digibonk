import { FORMS } from '../../src/data/forms';
import { lineOf, reqLabels, spriteStatus, frameIndex } from '../../tools/painel/dados.ts';

const info = (frames: string[]) => ({ file: 'x.png', frameW: 10, frameH: 10, frames, source: 0 });

test('spriteStatus: completo, ajustar, só parado e sem sprite', () => {
  expect(spriteStatus('agumon', info(['idle1', 'walk1', 'run1', 'walkdiagup1'])).st).toBe('done');
  expect(spriteStatus('omnimon', info(['idle1', 'walk1', 'run1', 'walkdiagup1'])).st).toBe('adjust');
  expect(spriteStatus('gabumon', info(['idle1', 'idle2']))).toEqual({ st: 'idle', note: 'só parado (2 quadros)' });
  expect(spriteStatus('megidramon', undefined).st).toBe('none');
  expect(spriteStatus('x', info(['idle1', 'walk1'])).st).toBe('partial');
});

test('frameIndex prefere idle1, senão o primeiro quadro', () => {
  expect(frameIndex(['idleup', 'idle1', 'walk1'])).toBe(1);
  expect(frameIndex(['walk1', 'walk2'])).toBe(0);
});

test('reqLabels: nível, status, itens, abates, quase-mortes e parceiro', () => {
  expect(reqLabels({ minLevel: 20, minStats: { atk: 38 }, minNearDeaths: 3 })).toEqual(['Nv 20', 'Atq 38', 'HP<25% 3×']);
  const pail = FORMS.exveemon.evolutions.find(e => e.to === 'paildramon')!.req;
  expect(reqLabels(pail).some(r => r.startsWith('com '))).toBe(true);
});

test('lineOf percorre a linha inteira a partir da forma Child', () => {
  const ids = lineOf('agumon');
  for (const id of ['agumon', 'greymon', 'metalgreymon', 'skullgreymon', 'blackwargreymon', 'wargreymon']) expect(ids).toContain(id);
  expect(ids).not.toContain('gabumon');
});
test('reqLabels mostra a Maturidade', () => expect(reqLabels({ minLevel: 30, requiresMaturity: true })).toEqual(['Nv 30', 'Maturidade']));
