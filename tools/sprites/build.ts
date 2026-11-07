import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPng, writePng } from './png.ts';
import { buildOne, DEFAULT_ROLES, type Image } from './slice.ts';
import { OVERRIDES, SOURCES } from './overrides.ts';

const SRC = 'assets-src/sprites/dwds', OUT = 'public/sprites', CONTACT = 'assets-src/sprites';
mkdirSync(OUT, { recursive: true });

const ids = readdirSync(SRC).filter(f => f.endsWith('.png')).map(f => f.slice(0, -4)).sort();
const manifest: { version: 1; sprites: Record<string, unknown> } = { version: 1, sprites: {} };
const strips: { id: string; img: Image }[] = [];
let warned = 0;
for (const id of ids) {
  const r = buildOne(id, readPng(join(SRC, `${id}.png`)), OVERRIDES);
  for (const w of r.warnings) { console.warn('AVISO', w); warned++; }
  writePng(join(OUT, `${id}.png`), r.strip);
  manifest.sprites[id] = { file: `${id}.png`, frameW: r.frameW, frameH: r.frameH, frames: DEFAULT_ROLES, source: SOURCES[id] ?? 0 };
  strips.push({ id, img: r.strip });
  console.log(`${id.padEnd(20)} ${r.frameW}x${r.frameH}  poses (ordem de leitura→tira): ${r.order.join(',')}`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');

// folhas de conferência: 6 tiras por imagem, fundo xadrez
for (let k = 0; k * 6 < strips.length; k++) {
  const group = strips.slice(k * 6, k * 6 + 6);
  const w = Math.max(...group.map(s => s.img.w)), h = group.reduce((a, s) => a + s.img.h + 6, 0);
  const sheet: Image = { w, h, data: new Uint8Array(w * h * 4) };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = ((x >> 3) + (y >> 3)) % 2 ? 200 : 235; sheet.data.set([v, v, v, 255], (y * w + x) * 4); }
  let oy = 0;
  for (const s of group) {
    for (let y = 0; y < s.img.h; y++) for (let x = 0; x < s.img.w; x++) {
      const si = (y * s.img.w + x) * 4; if (!s.img.data[si + 3]) continue;
      sheet.data.set(s.img.data.subarray(si, si + 4), ((oy + y) * w + x) * 4);
    }
    for (let x = 0; x < w; x++) sheet.data.set([255, 0, 0, 255], ((oy + s.img.h + 2) * w + x) * 4);
    oy += s.img.h + 6;
  }
  writePng(join(CONTACT, `contact-${k + 1}.png`), sheet);
  console.log(`contact-${k + 1}.png: ${group.map(s => s.id).join(', ')}`);
}
console.log(`${ids.length} tiras, ${warned} avisos`);
