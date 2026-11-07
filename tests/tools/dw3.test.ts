import { describe, expect, it } from 'vitest';
import type { Image } from '../../tools/sprites/slice';
import { flipH, gridOf, scaleNearest } from '../../tools/sprites/dw3';

const r = (x: number, y: number, w = 20, h = 25) => ({ x, y, w, h });

describe('gridOf', () => {
  it('agrupa em fileiras pela sobreposição vertical e ordena por x', () => {
    const rects = [r(50, 3), r(0, 2), r(25, 5, 20, 22), r(10, 33), r(40, 30, 20, 28)];
    const g = gridOf(rects);
    expect(g.map(row => row.map(q => q.x))).toEqual([[0, 25, 50], [10, 40]]);
  });
  it('ignora pedaços pequenos (texto, linhas)', () => {
    const g = gridOf([r(0, 0), r(30, 0, 6, 7), r(0, 100, 300, 2)]);
    expect(g).toEqual([[r(0, 0)]]);
  });
});

describe('flipH / scaleNearest', () => {
  const img: Image = { w: 2, h: 1, data: new Uint8Array([1, 1, 1, 255, 2, 2, 2, 255]) };
  it('espelha na horizontal', () => expect([...flipH(img).data]).toEqual([2, 2, 2, 255, 1, 1, 1, 255]));
  it('amplia 2x sem misturar cores', () => {
    const s = scaleNearest(img, 2);
    expect([s.w, s.h]).toEqual([4, 2]);
    expect([...s.data.subarray(0, 16)]).toEqual([1, 1, 1, 255, 1, 1, 1, 255, 2, 2, 2, 255, 2, 2, 2, 255]);
  });
});
