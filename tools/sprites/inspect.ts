/**
 * Inspeciona uma folha de sprites: detecta os quadros, organiza em fileiras/colunas e
 * escreve "fileira.coluna x,y,w,h" (uma por linha) — a base para escolher os quadros de cada papel.
 * uso: node --experimental-strip-types tools/sprites/inspect.ts <folha.png> > grade.txt
 */
import { readPng } from './png.ts';
import { backgroundColors, components, foregroundMask } from './slice.ts';
import { gridOf } from './dw3.ts';

const im = readPng(process.argv[2]);
const grid = gridOf(components(foregroundMask(im, backgroundColors(im)), im.w, im.h, 40, 0.1).map(c => c.rect));
grid.forEach((row, r) => row.forEach((q, c) => console.log(`${r}.${c} ${q.x},${q.y},${q.w},${q.h}`)));
