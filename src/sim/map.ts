import { createRng } from '../core/rng';
import { T } from '../data/tuning';

export interface Obstacle { x: number; z: number; r: number; kind: 'rock' | 'tree' }

function build(): Obstacle[] {
  const rng = createRng(1234);
  const out: Obstacle[] = [];
  const lim = T.MAP_HALF - 4;
  for (let tries = 0; out.length < 60 && tries < 4000; tries++) {
    const x = (rng.next() * 2 - 1) * lim, z = (rng.next() * 2 - 1) * lim;
    const r = 0.8 + rng.next() * 1.6;
    if (Math.hypot(x, z) < 8 + r) continue;
    if (out.some(o => Math.hypot(o.x - x, o.z - z) < o.r + r + 4)) continue;
    out.push({ x, z, r, kind: rng.next() < 0.55 ? 'tree' : 'rock' });
  }
  return out;
}
export const MAP_OBSTACLES: readonly Obstacle[] = build();
