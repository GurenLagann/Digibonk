import { describe, expect, it } from 'vitest';
import type { Image } from '../../tools/sprites/slice';
import { cropToUnion, VPET_ROLES } from '../../tools/sprites/vpet';

function img(w: number, h: number, dots: [number, number][]): Image {
  const data = new Uint8Array(w * h * 4);
  for (const [x, y] of dots) data.set([200, 10, 10, 255], (y * w + x) * 4);
  return { w, h, data };
}

describe('cropToUnion', () => {
  it('recorta os dois quadros na mesma caixa (união dos pixels opacos)', () => {
    const a = img(10, 10, [[2, 3], [4, 5]]);
    const b = img(10, 10, [[3, 2], [6, 6]]);
    const [ca, cb] = cropToUnion([a, b]);
    expect([ca.w, ca.h]).toEqual([5, 5]); // x 2..6, y 2..6
    expect([cb.w, cb.h]).toEqual([5, 5]);
    // pixel (2,3) de a vira (0,1)
    expect(ca.data[(1 * 5 + 0) * 4 + 3]).toBe(255);
    // pixel (6,6) de b vira (4,4)
    expect(cb.data[(4 * 5 + 4) * 4 + 3]).toBe(255);
  });

  it('quadros vazios viram 1x1 transparente', () => {
    const [c] = cropToUnion([img(4, 4, [])]);
    expect([c.w, c.h]).toEqual([1, 1]);
  });

  it('papéis: 2 quadros de caminhada', () => {
    expect(VPET_ROLES).toEqual(['idle1', 'idle2']);
  });
});
