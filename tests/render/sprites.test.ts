import { existsSync } from 'node:fs';
import { parseManifest, idleFrame, facingFlip, frameIndex } from '../../src/render/sprites';
import { ENEMIES, MINIBOSSES, BOSSES } from '../../src/data/enemies';
import { FORMS } from '../../src/data/forms';

const hasSheet = (id: string) => existsSync(`assets-src/sprites/dwds/${id}.png`) && existsSync(`public/sprites/${id}.png`);

test('invalid manifest is null', () => {
  expect(parseManifest('x')).toBeNull(); expect(parseManifest({ version: 2 })).toBeNull();
  expect(parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 'x' } } })).toBeNull();
});
test('valid manifest parses', () => {
  const m = parseManifest({ version: 1, sprites: { agumon: { file: 'agumon.png', frameW: 64, frameH: 75, frames: ['idle1', 'idle2', 'idle3', 'attack', 'hurt'], source: 1 } } });
  expect(m?.sprites.agumon.frameW).toBe(64);
});
test('idle cycles through 4 steps', () => expect([0, 1 / 6, 2 / 6, 3 / 6].map(t => idleFrame(t + 0.001))).toEqual(['idle1', 'idle2', 'idle3', 'idle2']));
test('frameIndex finds roles', () => { expect(frameIndex('attack', ['idle1', 'idle2', 'idle3', 'attack', 'hurt'])).toBe(3); expect(frameIndex('hurt', ['idle1'])).toBe(0); });
test('facingFlip mirrors when moving right', () => { expect(facingFlip(1)).toBe(-1); expect(facingFlip(-1)).toBe(1); expect(facingFlip(0)).toBe(1); });
test('every enemy and boss has a sprite source', () => {
  for (const e of [...ENEMIES, ...MINIBOSSES, ...BOSSES]) expect(hasSheet(e.id), e.id).toBe(true);
});
test('only veedramon line and raidramon lack sprites among forms', () => {
  expect(Object.keys(FORMS).filter(id => !hasSheet(id)).sort()).toEqual(['aeroveedramon', 'raidramon', 'ulforceveedramon', 'veedramon']);
});
