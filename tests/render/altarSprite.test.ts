import { readFileSync, existsSync } from 'node:fs';
import { expect, test } from 'vitest';
import { ALTAR_DIGIMON, altarFrame, contentBand } from '../../src/render/altarSprite';
import type { Role } from '../../src/render/sprites';

const manifest = JSON.parse(readFileSync('public/sprites/manifest.json', 'utf8'));

test('every altar Digimon has a sprite sheet', () => {
  for (const id of Object.values(ALTAR_DIGIMON)) {
    expect(manifest.sprites[id], id).toBeTruthy();
    expect(existsSync(`public/sprites/${manifest.sprites[id].file}`), id).toBe(true);
  }
});
test('altar Digimon breathes facing front and freezes when used', () => {
  const frames = ['walkdown1', 'standdown1', 'standdown2', 'standdown3', 'idledown'] as Role[];
  expect([0, 1, 2, 3].map(i => altarFrame(i / 6 + 0.001, frames, false))).toEqual(['standdown1', 'standdown2', 'standdown3', 'standdown1']);
  expect(altarFrame(0.5, frames, true)).toBe('standdown1');
});
test('without a stand sheet the altar uses the fixed pose', () => {
  expect(altarFrame(1, ['idle1', 'idledown'] as Role[], false)).toBe('idledown');
  expect(altarFrame(1, ['idle1'] as Role[], false)).toBe('idle1');
});
test('contentBand finds the drawn rows of one frame', () => {
  // 2 quadros lado a lado, 2×4 px cada; quadro 1 tem desenho nas linhas 1–2
  const w = 4, h = 4, data = new Uint8Array(w * h * 4);
  for (const y of [1, 2]) data[(y * w + 3) * 4 + 3] = 255;
  expect(contentBand({ width: w, height: h, data }, 1, 2, 1)).toEqual({ top: 0.25, bottom: 0.75 });
  expect(contentBand({ width: w, height: h, data }, 0, 2, 1)).toEqual({ top: 0, bottom: 1 });
});
