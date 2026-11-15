import { describe, it, expect } from 'vitest';
import { rotateByYaw, cameraForward, viewFacing, outsideView } from '../../src/core/view';

describe('rotateByYaw', () => {
  it('yaw 0 mantém W = -z', () => {
    const r = rotateByYaw(0, -1, 0);
    expect(r.mx).toBeCloseTo(0); expect(r.mz).toBeCloseTo(-1);
  });
  it('yaw 90° gira W para -x', () => {
    const r = rotateByYaw(0, -1, Math.PI / 2);
    expect(r.mx).toBeCloseTo(-1); expect(r.mz).toBeCloseTo(0);
  });
  it('preserva o comprimento', () => {
    const r = rotateByYaw(0.6, 0.8, 1.1);
    expect(Math.hypot(r.mx, r.mz)).toBeCloseTo(1);
  });
});

describe('cameraForward', () => {
  it('yaw 0 olha para -z', () => {
    const f = cameraForward(0);
    expect(f.x).toBeCloseTo(0); expect(f.z).toBeCloseTo(-1);
  });
});

describe('viewFacing', () => {
  it('cima/baixo', () => {
    expect(viewFacing(0, -1, 0).facing).toBe('up');
    expect(viewFacing(0, 1, 0).facing).toBe('down');
  });
  it('lado direita', () => {
    expect(viewFacing(1, 0, 0)).toEqual({ facing: 'side', right: true });
  });
  it('diagonal para cima à esquerda', () => {
    expect(viewFacing(-1, -1, 0)).toEqual({ facing: 'diagup', right: false });
  });
  it('câmera girada: andar para -x com yaw 90° é afastar', () => {
    expect(viewFacing(-1, 0, Math.PI / 2).facing).toBe('up');
  });
});

describe('outsideView', () => {
  const h = Math.PI / 3;
  it('dentro e fora do cone', () => {
    expect(outsideView(0, -25, 0, h)).toBe(false);
    expect(outsideView(0, 25, 0, h)).toBe(true);
    expect(outsideView(25, 0, 0, h)).toBe(true);
    expect(outsideView(10, -25, 0, h)).toBe(false);
  });
});
