import { describe, expect, it } from 'vitest';
import type { Image } from '../../tools/sprites/slice';
import { cropToUnion, defringe, DEFRINGE_OUTLINE, VPET_ROLES } from '../../tools/sprites/vpet';

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

describe('defringe', () => {
  it('escurece pixels de borda puxados para a cor do fundo e preserva o interior', () => {
    const w = 3, h = 3, data = new Uint8Array(w * h * 4);
    const set = (x: number, y: number, c: number[]) => data.set([...c, 255], (y * w + x) * 4);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) set(x, y, [70, 200, 150]); // tudo esverdeado
    data[(0 * w + 0) * 4 + 3] = 0; // canto transparente → (1,0) e (0,1) são borda
    const out = defringe({ w, h, data }, [64, 240, 168]);
    expect([...out.data.subarray((0 * w + 1) * 4, (0 * w + 1) * 4 + 3)]).toEqual([...DEFRINGE_OUTLINE]);
    expect([...out.data.subarray((1 * w + 1) * 4, (1 * w + 1) * 4 + 3)]).toEqual([70, 200, 150]); // interior intacto
  });
  it('não mexe em borda de cor normal', () => {
    const data = new Uint8Array([200, 120, 20, 255, 0, 0, 0, 0]);
    expect([...defringe({ w: 2, h: 1, data }, [64, 240, 168]).data.subarray(0, 3)]).toEqual([200, 120, 20]);
  });
});
