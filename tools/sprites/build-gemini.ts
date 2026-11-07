import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readPng, writePng } from './png.ts';
import { buildStrip, type Role } from './slice.ts';
import { cropToUnion, defringe } from './vpet.ts';

/** folhas geradas no Gemini (quadros f0..fN + roles.json com o papel de cada um) → sobrescrevem o V-pet no manifesto */
const SRC = 'assets-src/sprites/gemini', OUT = 'public/sprites';
const manifest = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8'));
for (const id of existsSync(SRC) ? readdirSync(SRC).sort() : []) {
  const meta: { roles: Role[]; key: number[] } = JSON.parse(readFileSync(join(SRC, id, 'roles.json'), 'utf8'));
  const ROLES = meta.roles;
  const frames = cropToUnion(ROLES.map((_, i) => defringe(readPng(join(SRC, id, `f${i}.png`)), meta.key)));
  const r = buildStrip(frames);
  writePng(join(OUT, `${id}.png`), r.strip);
  manifest.sprites[id] = { file: `${id}.png`, frameW: r.frameW, frameH: r.frameH, frames: ROLES, source: 0 };
  console.log(`${id.padEnd(20)} ${r.frameW}x${r.frameH} (gemini)`);
}
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
