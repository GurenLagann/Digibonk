import { describe, expect, it } from 'vitest';
import type { Image } from '../../tools/sprites/slice';
import { alignBottom, clearHoles, cropToUnion, defringe, DEFRINGE_OUTLINE, VPET_ROLES } from '../../tools/sprites/vpet';

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

describe('defringe com fundo cinza', () => {
  it('não altera nada (cinza não tem tom para puxar a borda)', () => {
    const data = new Uint8Array([140, 140, 140, 255, 0, 0, 0, 0]);
    expect([...defringe({ w: 2, h: 1, data }, [128, 128, 128]).data]).toEqual([140, 140, 140, 255, 0, 0, 0, 0]);
  });
});

describe('clearHoles', () => {
  // 8x8 opaco laranja com um buraco 3x3 cinza (fundo preso) e um pixel cinza solto (detalhe do corpo)
  const mk = () => {
    const w = 8, h = 8, data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) data.set([220, 120, 30, 255], i * 4);
    for (let y = 2; y < 5; y++) for (let x = 2; x < 5; x++) data.set([118, 118, 118, 255], (y * w + x) * 4);
    data.set([120, 117, 119, 255], (6 * w + 6) * 4);
    return { w, h, data };
  };
  it('apaga regiões grandes da cor de fundo presas no meio do sprite', () => {
    const out = clearHoles(mk(), [118, 118, 118], 12, 6);
    expect(out.data[(3 * 8 + 3) * 4 + 3]).toBe(0);
  });
  it('mantém manchinhas da mesma cor menores que o mínimo', () => {
    const out = clearHoles(mk(), [118, 118, 118], 12, 6);
    expect(out.data[(6 * 8 + 6) * 4 + 3]).toBe(255);
    expect(out.data[(0 * 8 + 0) * 4 + 3]).toBe(255);
  });
});

describe('alignBottom (pés na mesma linha)', () => {
  it('quadros de alturas diferentes ficam apoiados na base e centralizados', () => {
    const alto = img(4, 6, [[0, 0], [3, 5]]);   // ocupa 4x6 inteiro
    const baixo = img(2, 2, [[0, 1], [1, 1]]);  // 2x2, "pés" na linha de baixo
    const [a, b] = alignBottom([alto, baixo]);
    expect([a.w, a.h]).toEqual([4, 6]); expect([b.w, b.h]).toEqual([4, 6]);
    // a linha de baixo do quadro baixo cai na última linha (y=5), centralizada (x=1..2)
    expect(b.data[(5 * 4 + 1) * 4 + 3]).toBe(255);
    expect(b.data[(5 * 4 + 2) * 4 + 3]).toBe(255);
    expect(b.data[(0 * 4 + 1) * 4 + 3]).toBe(0);
  });
  it('depois do cropToUnion os pés continuam na última linha', () => {
    const [, b] = cropToUnion(alignBottom([img(4, 6, [[0, 0], [3, 5]]), img(2, 2, [[0, 1]])]));
    expect(b.h).toBe(6);
    let last = -1; for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) if (b.data[(y * b.w + x) * 4 + 3]) last = y;
    expect(last).toBe(5);
  });
});
