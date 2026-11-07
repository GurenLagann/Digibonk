/**
 * Direção de cada quadro, comparando a silhueta com um quadro de referência DA MESMA FOLHA que você já
 * conferiu com zoom (olhando para a esquerda): "L" = igual à referência, "R" = igual a ela espelhada.
 * Só funciona dentro do mesmo Digimon. Diferença pequena entre os números = inconclusivo → zoom.
 * uso: node --experimental-strip-types tools/sprites/facing.ts <folha.png> <grade.txt> <id-ref> [ids...]
 */
import { readFileSync } from 'node:fs';
import { readPng } from './png.ts';
import type { Image } from './slice.ts';

const N = 24;
/** silhueta N×N: pixel opaco e longe da cor do canto da célula (fundo liso ou JPEG com ruído) */
function mask(img: Image, x: number, y: number, w: number, h: number): number[] {
  const k0 = (y * img.w + x) * 4, bg = [img.data[k0], img.data[k0 + 1], img.data[k0 + 2]];
  const out: number[] = [];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = ((y + Math.floor((j + 0.5) * h / N)) * img.w + x + Math.floor((i + 0.5) * w / N)) * 4;
    const d = Math.hypot(img.data[k] - bg[0], img.data[k + 1] - bg[1], img.data[k + 2] - bg[2]);
    out.push(img.data[k + 3] && d > 60 ? 1 : 0);
  }
  return out;
}
const [sheetPath, gridPath, refId, ...ids] = process.argv.slice(2);
const sheet = readPng(sheetPath);
const lines = readFileSync(gridPath, 'utf8').trim().split('\n');
const refLine = lines.find(l => l.split(' ')[0] === refId);
if (!refLine) throw new Error(`quadro de referência ${refId} não está na grade`);
const [rx, ry, rw, rh] = refLine.split(' ')[1].split(',').map(Number);
const rm = mask(sheet, rx, ry, rw, rh);
const rmf = rm.map((_, i) => rm[Math.floor(i / N) * N + (N - 1 - (i % N))]);
const diff = (a: number[], b: number[]) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
for (const line of lines) {
  const [id, rect] = line.split(' ');
  if (ids.length && !ids.includes(id)) continue;
  const [x, y, w, h] = rect.split(',').map(Number);
  const m = mask(sheet, x, y, w, h), l = diff(m, rm), r = diff(m, rmf);
  console.log(`${id} ${l < r ? 'L' : 'R'} (igual=${l} espelhado=${r})${Math.abs(l - r) < 25 ? ' inconclusivo' : ''}`);
}
