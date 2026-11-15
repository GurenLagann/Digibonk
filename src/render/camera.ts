import type * as THREE from 'three';
import { T } from '../data/tuning';

const C = T.CAMERA;

/**
 * Câmera orbital em volta do parceiro (estilo PokéBonk).
 * yaw 0 = atrás em +z olhando para -z; yaw cresce levando a câmera para +x (mesma convenção de core/view).
 * pitch = elevação da câmera acima do alvo; pitch maior = câmera mais alta, olhando mais para baixo.
 */
export class OrbitCamera {
  yaw = 0;
  pitch: number = C.PITCH;

  constructor(readonly camera: THREE.PerspectiveCamera) {}

  /** dx soma no yaw; dy soma no pitch (dy > 0 = olhar mais para baixo, como o mouse descendo) */
  turn(dx: number, dy: number): void {
    this.yaw += dx;
    this.pitch = Math.min(C.PITCH_MAX, Math.max(C.PITCH_MIN, this.pitch + dy));
  }

  /** altura do chão suavizada (degraus/rampas não dão tranco); null = ainda não seguiu ninguém */
  private gy: number | null = null;

  /** y = altura do chão no parceiro; com dt, a altura acompanha suave (~10/s); sem dt (ou salto > 5), encaixa */
  follow(x: number, z: number, y = 0, dt?: number): void {
    if (dt === undefined || this.gy === null || Math.abs(y - this.gy) > 5) this.gy = y;
    else this.gy += (y - this.gy) * Math.min(1, dt * 10);
    const h = Math.cos(this.pitch) * C.DIST, gy = this.gy;
    this.camera.position.set(x + Math.sin(this.yaw) * h, gy + C.LOOK_HEIGHT + Math.sin(this.pitch) * C.DIST, z + Math.cos(this.yaw) * h);
    this.camera.lookAt(x, gy + C.LOOK_HEIGHT, z);
  }

  reset(): void {
    this.yaw = 0;
    this.pitch = C.PITCH;
  }

  /** metade do FOV horizontal (rad) */
  horizontalHalfFov(): number {
    return Math.atan(Math.tan((C.FOV / 2) * (Math.PI / 180)) * this.camera.aspect);
  }
}
