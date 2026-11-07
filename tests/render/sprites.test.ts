import { existsSync } from 'node:fs';
import { parseManifest, idleFrame, facingFlip, frameIndex, moveFrame, hurtFrame, deathFrame, deathDuration, nextHurtStart, mirrorsWithDir, HURT_TIME, HURT_COOLDOWN, DEATH_FPS, type Role } from '../../src/render/sprites';
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
test('vertical facing uses walkup/walkdown frames and their idle poses', () => {
  const frames = ['walk1', 'walk2', 'walkup1', 'walkup2', 'walkdown1', 'walkdown2', 'idle1', 'idleup', 'idledown'] as Role[];
  expect(moveFrame(0.001, 0, true, frames, 'up')).toBe('walkup1');
  expect(moveFrame(1 / 12 + 0.001, 0, true, frames, 'down')).toBe('walkdown2');
  expect(moveFrame(0.001, 0, false, frames, 'up')).toBe('idleup');
  expect(moveFrame(0.001, 0, false, frames, 'down')).toBe('idledown');
  expect(moveFrame(0.001, 0, true, frames, 'side')).toBe('walk1');
});
test('vertical facing without vertical frames falls back to side frames', () => {
  expect(moveFrame(0.001, 0, true, ['walk1', 'walk2', 'idle1'] as Role[], 'up')).toBe('walk1');
  expect(moveFrame(0.001, 0, false, ['walk1', 'idle1'] as Role[], 'down')).toBe('idle1');
});
test('manifest accepts vertical roles', () => {
  expect(parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 1, frameH: 1, frames: ['walkup12', 'walkdown3', 'idleup', 'idledown'] } } })).not.toBeNull();
});
test('manifest accepts hurtN and deathN roles', () => {
  expect(parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 1, frameH: 1, frames: ['hurt1', 'hurt8', 'death1', 'death40'] } } })).not.toBeNull();
});
test('hurtFrame plays hurt1..N across the hurt window, or the single hurt pose', () => {
  const frames = ['idle1', 'hurt1', 'hurt2', 'hurt3', 'hurt4'] as Role[];
  expect(hurtFrame(0, frames)).toBe('hurt1');
  expect(hurtFrame(HURT_TIME * 0.99, frames)).toBe('hurt4');
  expect(hurtFrame(HURT_TIME + 0.01, frames)).toBeNull();
  expect(hurtFrame(0.05, ['idle1', 'hurt'] as Role[])).toBe('hurt');
});
test('deathFrame plays death1..N once and holds the last; null without death frames', () => {
  const frames = ['idle1', 'death1', 'death2', 'death3'] as Role[];
  expect(deathFrame(0, frames)).toBe('death1');
  expect(deathFrame(10, frames)).toBe('death3');
  expect(deathFrame(0, ['idle1'] as Role[])).toBeNull();
  expect(deathDuration(frames)).toBeCloseTo(3 / DEATH_FPS);
});
test('a new hit starts the hurt animation only after the cooldown', () => {
  expect(nextHurtStart(-Infinity, 5, true)).toBe(5);
  expect(nextHurtStart(5, 5.5, true)).toBe(5);                 // dentro do cooldown: não reinicia
  expect(nextHurtStart(5, 5 + HURT_COOLDOWN, true)).toBe(5 + HURT_COOLDOWN);
  expect(nextHurtStart(5, 9, false)).toBe(5);                 // sem golpe novo: mantém
  expect(HURT_TIME).toBeLessThan(HURT_COOLDOWN / 2);
});
test('diagonal facing uses walkdiag frames, falling back to side', () => {
  const frames = ['walk1', 'walkdiagup1', 'walkdiagup2', 'walkdiagdown1', 'idle1', 'idlediagup'] as Role[];
  expect(moveFrame(1 / 12 + 0.001, 0, true, frames, 'diagup')).toBe('walkdiagup2');
  expect(moveFrame(0.001, 0, true, frames, 'diagdown')).toBe('walkdiagdown1');
  expect(moveFrame(0.001, 0, false, frames, 'diagup')).toBe('idlediagup');
  expect(moveFrame(0.001, 0, true, ['walk1', 'walk2'] as Role[], 'diagup')).toBe('walk1');
  expect(parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 1, frameH: 1, frames: ['walkdiagup4', 'walkdiagdown2', 'idlediagdown'] } } })).not.toBeNull();
});
test('only up/down views are not mirrored', () => {
  expect(mirrorsWithDir('side')).toBe(true);
  expect(mirrorsWithDir('diagup')).toBe(true);
  expect(mirrorsWithDir('up')).toBe(false);
  expect(mirrorsWithDir('down')).toBe(false);
});
test('hurtFrame is null when the sprite has no hurt pose at all (keeps the movement frame)', () => {
  expect(hurtFrame(0.05, ['walkup1', 'walk1', 'idle1'] as Role[])).toBeNull();
});
test('manifest keeps an optional per-sprite scale (default 1)', () => {
  const m = parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 1, frameH: 1, frames: ['idle1'], scale: 0.8 }, b: { file: 'b.png', frameW: 1, frameH: 1, frames: ['idle1'] } } });
  expect(m?.sprites.a.scale).toBe(0.8);
  expect(m?.sprites.b.scale).toBe(1);
});
test('running uses runN frames of the facing, walking keeps walkN', () => {
  const frames = ['walk1', 'walk2', 'run1', 'run2', 'run3', 'runup1', 'walkup1', 'idle1'] as Role[];
  expect(moveFrame(2 / 12 + 0.001, 0, true, frames, 'side', true)).toBe('run3');
  expect(moveFrame(0.001, 0, true, frames, 'up', true)).toBe('runup1');
  expect(moveFrame(1 / 12 + 0.001, 0, true, frames, 'side', false)).toBe('walk2');
  expect(moveFrame(0.001, 0, true, ['walk1', 'idle1'] as Role[], 'side', true)).toBe('walk1'); // sem corrida: caminhada
  expect(parseManifest({ version: 1, sprites: { a: { file: 'a.png', frameW: 1, frameH: 1, frames: ['run5', 'rundiagup2', 'runup3', 'rundown1', 'rundiagdown4'] } } })).not.toBeNull();
});
