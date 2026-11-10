import { describe, expect, it } from 'vitest';
import { enemyStageScale, HOP, motionPose, playerHeightFor } from '../../src/render/motion';
import { test } from 'vitest';

const base = { t: 0, phase: 0, moving: false, attack: 99, hurt: 0, drawnWalk: false };
const samples = (o: Partial<typeof base>) => Array.from({ length: 120 }, (_, i) => motionPose({ ...base, ...o, t: i / 60 }));

describe('motionPose', () => {
  it('parado: não pula nem inclina, só respira', () => {
    const ps = samples({});
    for (const p of ps) { expect(p.y).toBe(0); expect(p.tilt).toBe(0); }
    expect(Math.max(...ps.map(p => p.sy))).toBeGreaterThan(1);
  });

  it('andando: pula até HOP e balança para os dois lados', () => {
    const ps = samples({ moving: true });
    const ys = ps.map(p => p.y);
    expect(Math.max(...ys)).toBeGreaterThan(HOP * 0.8);
    expect(Math.max(...ys)).toBeLessThanOrEqual(HOP + 1e-9);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
    expect(Math.min(...ps.map(p => p.tilt))).toBeLessThan(-0.05);
    expect(Math.max(...ps.map(p => p.tilt))).toBeGreaterThan(0.05);
  });

  it('fase diferente dessincroniza a caminhada', () => {
    const a = motionPose({ ...base, moving: true, t: 0.1 });
    const b = motionPose({ ...base, moving: true, t: 0.1, phase: 0.13 });
    expect(a.y).not.toBeCloseTo(b.y, 3);
  });

  it('ataque recente estica para o lado e volta ao normal', () => {
    const hit = motionPose({ ...base, attack: 0.02 });
    expect(hit.sx).toBeGreaterThan(1.1);
    expect(hit.sy).toBeLessThan(0.95);
    const later = motionPose({ ...base, attack: 0.4 });
    expect(later.sx).toBeCloseTo(1 / later.sy, 1);
    expect(later.sx).toBeLessThan(1.05);
  });

  it('dano inclina para trás', () => {
    expect(motionPose({ ...base, hurt: 1 }).tilt).toBeLessThan(-0.15);
  });

  it('mantém a área aproximada (sx·sy ≈ 1)', () => {
    for (const p of [...samples({ moving: true }), ...samples({ attack: 0.05 })]) expect(p.sx * p.sy).toBeGreaterThan(0.95), expect(p.sx * p.sy).toBeLessThan(1.05);
  });
});

test('parado desenhado (drawnIdle) não respira por cima', () => {
  for (const t of [0, 0.1, 0.2, 0.3]) expect(motionPose({ t, phase: 0, moving: false, attack: 99, hurt: 0, drawnIdle: true }).sy).toBe(1);
});

describe('motionPose com caminhada desenhada', () => {
  it('andando não pula nem balança', () => {
    for (const p of samples({ moving: true, drawnWalk: true })) { expect(p.y).toBe(0); expect(p.tilt).toBe(0); }
  });
  it('ataque e dano continuam', () => {
    expect(motionPose({ ...base, drawnWalk: true, attack: 0.02 }).sx).toBeGreaterThan(1.1);
    expect(motionPose({ ...base, drawnWalk: true, hurt: 1 }).tilt).toBeLessThan(-0.15);
  });
});

test('altura do parceiro: Child fixo, +25% a cada estágio acima', () => {
  expect(playerHeightFor('child')).toBe(2);
  expect(playerHeightFor('adult')).toBeCloseTo(2 * 1.25);
  expect(playerHeightFor('perfect')).toBeCloseTo(2 * 1.25 ** 2);
  expect(playerHeightFor('ultimate')).toBeCloseTo(2 * 1.25 ** 3);
  expect(playerHeightFor('desconhecido')).toBe(2);
});
test('o pulinho é baixo (sprites sem caminhada desenhada não parecem flutuar)', () => {
  expect(HOP).toBeLessThanOrEqual(0.04);
});

test('inimigos: Child no tamanho de hoje, +15% a cada estágio acima', () => {
  expect(enemyStageScale('child')).toBe(1);
  expect(enemyStageScale(undefined)).toBe(1);
  expect(enemyStageScale('adult')).toBeCloseTo(1.15);
  expect(enemyStageScale('perfect')).toBeCloseTo(1.15 ** 2);
  expect(enemyStageScale('ultimate')).toBeCloseTo(1.15 ** 3);
});
