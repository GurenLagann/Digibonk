import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPng, writePng } from './png.ts';
import { buildStrip } from './slice.ts';
import { cropToUnion, VPET_ROLES } from './vpet.ts';

/** quadros de V-pet (humulos.com/digimon, sprites © Bandai) → tiras + manifesto */
const SRC = 'assets-src/sprites/vpet', OUT = 'public/sprites';
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith('.png')) rmSync(join(OUT, f));

const sources: Record<string, string> = JSON.parse(readFileSync(join(SRC, 'sources.json'), 'utf8'));
const manifest: { version: 1; sprites: Record<string, unknown> } = { version: 1, sprites: {} };
for (const id of Object.keys(sources).sort()) {
  const frames = cropToUnion([readPng(join(SRC, `${id}_1.png`)), readPng(join(SRC, `${id}_2.png`))]);
  const r = buildStrip(frames);
  writePng(join(OUT, `${id}.png`), r.strip);
  manifest.sprites[id] = { file: `${id}.png`, frameW: r.frameW, frameH: r.frameH, frames: VPET_ROLES, source: 0 };
  console.log(`${id.padEnd(20)} ${r.frameW}x${r.frameH}  ${sources[id]}`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`${Object.keys(sources).length} tiras`);
