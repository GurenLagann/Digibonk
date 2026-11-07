import { existsSync } from 'node:fs';
import { parseManifest, idleFrame, facingFlip, frameIndex, moveFrame, type Role } from '../../src/render/sprites';
import { ENEMIES, MINIBOSSES, BOSSES } from '../../src/data/enemies';
import { FORMS } from '../../src/data/forms';

const hasSheet = (id: string) => existsSync(`assets-src/sprites/vpet/${id}_1.png`) && existsSync(`public/sprites/${id}.png`);

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
test('every form has a v-pet sprite', () => {
  expect(Object.keys(FORMS).filter(id => !hasSheet(id))).toEqual([]);
});
test('moving with walk frames cycles walk1..walk4', () => {
  const frames: Role[] = ['walk1', 'walk2', 'walk3', 'walk4', 'idle1', 'idle2', 'attack', 'hurt'];
  expect([0, 1, 2, 3, 4].map(i => moveFrame(i / 12 + 0.001, 0, true, frames))).toEqual(['walk1', 'walk2', 'walk3', 'walk4', 'walk1']);
});
test('without walk frames or standing still uses idle cycle', () => {
  expect(moveFrame(0.001, 0, true, ['idle1', 'idle2'])).toBe('idle1');
});
test('manifest accepts walk roles', () => {
  expect(parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 1, frameH: 1, frames: ['walk1', 'walk4'] } } })).not.toBeNull();
});
test('walk cycle uses every walk frame present', () => {
  const frames: Role[] = ['walk1', 'walk2', 'walk3', 'walk4', 'walk5', 'walk6', 'walk7', 'walk8', 'idle1'];
  expect(moveFrame(7 / 12 + 0.001, 0, true, frames)).toBe('walk8');
  expect(moveFrame(8 / 12 + 0.001, 0, true, frames)).toBe('walk1');
});
test('standing still with drawn walk keeps one pose (no leg motion)', () => {
  const frames: Role[] = ['walk1', 'walk2', 'idle1', 'idle2'];
  expect([0, 1, 2, 3, 4, 5].map(i => moveFrame(i / 6 + 0.001, 0, false, frames))).toEqual(Array(6).fill('idle1'));
});
test('supports up to 24 walk frames', () => {
  const frames = Array.from({ length: 17 }, (_, i) => `walk${i + 1}`) as Role[];
  expect(parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 1, frameH: 1, frames } } })).not.toBeNull();
  expect(parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 1, frameH: 1, frames: ['walk25'] } } })).toBeNull();
  const seen = new Set(Array.from({ length: 40 }, (_, i) => moveFrame(i / 12 + 0.001, 0, true, frames)));
  expect(seen.size).toBe(17);
});
