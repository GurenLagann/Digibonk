import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// texturas repetíveis dos biomas (geradas por tools/biomas/cortar.sh)
const TEXTURAS = [
  'floresta-dw1/grama.webp', 'floresta-dw1/grama-escura.webp', 'floresta-dw1/copa.webp',
  'floresta-dw1/casca.webp', 'floresta-dw1/pedra.webp',
  'floresta-dw3/grama.webp', 'floresta-dw3/trilha.webp', 'floresta-dw3/pinheiro.webp',
  'floresta-dw3/casca.webp', 'floresta-dw3/penhasco.webp', 'floresta-dw3/metal.webp',
];
const N = 256;

const caminho = (t: string) => `public/biomas/${t}`;
const tamanho = (f: string) => execFileSync('magick', ['identify', '-format', '%w %h', f]).toString().trim();
const pixels = (f: string) => execFileSync('magick', [f, '-depth', '8', 'rgb:-'], { maxBuffer: 1 << 24 });

// diferença média (por canal) entre duas colunas (ou linhas, se `linha`)
function dif(px: Buffer, a: number, b: number, linha = false): number {
  let s = 0;
  for (let i = 0; i < N; i++) {
    const pa = linha ? (a * N + i) * 3 : (i * N + a) * 3;
    const pb = linha ? (b * N + i) * 3 : (i * N + b) * 3;
    for (let c = 0; c < 3; c++) s += Math.abs(px[pa + c] - px[pb + c]);
  }
  return s / (N * 3);
}

// pares "aleatórios" fixos do meio da textura
const PARES: [number, number][] = [[70, 131], [96, 183], [112, 150], [140, 201], [88, 170]];
const meio = (px: Buffer, linha: boolean) => PARES.reduce((s, [a, b]) => s + dif(px, a, b, linha), 0) / PARES.length;

describe('texturas dos biomas', () => {
  it('recortes.json cobre exatamente as texturas esperadas', () => {
    const recortes = JSON.parse(readFileSync('tools/biomas/recortes.json', 'utf8'));
    expect(Object.keys(recortes).sort()).toEqual([...TEXTURAS].sort());
  });

  for (const t of TEXTURAS) {
    describe(t, () => {
      const f = caminho(t);
      it('existe e é 256×256', () => {
        expect(existsSync(f)).toBe(true);
        expect(tamanho(f)).toBe('256 256');
      });
      it('repete sem emenda gritante (bordas opostas parecidas)', () => {
        const px = pixels(f);
        expect(px.length).toBe(N * N * 3);
        expect(dif(px, 0, N - 1)).toBeLessThan(meio(px, false) * 1.1);
        expect(dif(px, 0, N - 1, true)).toBeLessThan(meio(px, true) * 1.1);
      });
    });
  }
});
