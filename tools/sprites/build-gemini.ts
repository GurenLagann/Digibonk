import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPng, writePng } from './png.ts';
import { buildStrip, type Role } from './slice.ts';
import { cropToUnion } from './vpet.ts';

/** folhas geradas no Gemini (grade 4x2 já recortada em f0..f7) → sobrescrevem o V-pet no manifesto */
const SRC = 'assets-src/sprites/gemini', OUT = 'public/sprites';
const ROLES = ['walk1', 'walk2', 'walk3', 'walk4', 'idle1', 'idle2', 'attack', 'hurt'] as Role[];
const manifest = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'));
for (const id of existsSync(SRC) ? readdirSync(SRC).sort() : []) {
  const frames = cropToUnion(ROLES.map((_, i) => readPng(join(SRC, id, `f${i}.png`))));
  const r = buildStrip(frames);
  writePng(join(OUT, `${id}.png`), r.strip);
  manifest.sprites[id] = { file: `${id}.png`, frameW: r.frameW, frameH: r.frameH, frames: ROLES, source: 0 };
  console.log(`${id.padEnd(20)} ${r.frameW}x${r.frameH} (gemini)`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
