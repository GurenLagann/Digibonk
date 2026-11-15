import * as THREE from 'three';
import { expect, test } from 'vitest';
import { OrbitCamera } from '../../src/render/camera';
import { T } from '../../src/data/tuning';

const make = () => new OrbitCamera(new THREE.PerspectiveCamera(T.CAMERA.FOV, 16 / 9, 0.5, T.CAMERA.FAR));

test('yaw 0: câmera atrás do parceiro em +z, centrada em x', () => {
  const o = make();
  o.follow(0, 0);
  expect(o.yaw).toBe(0);
  expect(o.pitch).toBeCloseTo(T.CAMERA.PITCH);
  expect(o.camera.position.z).toBeGreaterThan(0);
  expect(o.camera.position.x).toBeCloseTo(0);
});

test('turn(π/2) leva a câmera para +x, z ≈ 0', () => {
  const o = make();
  o.turn(Math.PI / 2, 0);
  o.follow(0, 0);
  expect(o.camera.position.x).toBeGreaterThan(0);
  expect(o.camera.position.z).toBeCloseTo(0);
});

test('follow acompanha o alvo e olha para ele na altura LOOK_HEIGHT', () => {
  const o = make();
  o.follow(5, -3);
  const dir = new THREE.Vector3();
  o.camera.getWorldDirection(dir);
  const toTarget = new THREE.Vector3(5, T.CAMERA.LOOK_HEIGHT, -3).sub(o.camera.position).normalize();
  expect(dir.dot(toTarget)).toBeCloseTo(1, 5);
  expect(o.camera.position.distanceTo(new THREE.Vector3(5, T.CAMERA.LOOK_HEIGHT, -3))).toBeCloseTo(T.CAMERA.DIST);
});

test('pitch clampa nos limites', () => {
  const o = make();
  o.turn(0, 10);
  expect(o.pitch).toBe(T.CAMERA.PITCH_MAX);
  o.turn(0, -10);
  expect(o.pitch).toBe(T.CAMERA.PITCH_MIN);
});

test('no PITCH_MIN a câmera fica acima de LOOK_HEIGHT (não entra no chão)', () => {
  const o = make();
  o.turn(0, -10);
  o.follow(0, 0);
  expect(o.camera.position.y).toBeGreaterThan(T.CAMERA.LOOK_HEIGHT);
});

test('reset volta para yaw 0 e PITCH', () => {
  const o = make();
  o.turn(1.2, 0.3);
  o.reset();
  expect(o.yaw).toBe(0);
  expect(o.pitch).toBe(T.CAMERA.PITCH);
});

test('horizontalHalfFov usa o aspect da câmera', () => {
  const o = make();
  const v = (T.CAMERA.FOV / 2) * (Math.PI / 180);
  expect(o.horizontalHalfFov()).toBeCloseTo(Math.atan(Math.tan(v) * (16 / 9)));
});
