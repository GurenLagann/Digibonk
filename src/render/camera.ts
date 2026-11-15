import type * as THREE from 'three';
import type { HeightFn } from './terrain';
import { T } from '../data/tuning';

const C = T.CAMERA;
/** folga mínima da câmera acima do chão onde ela está */
const CAM_CLEARANCE = 0.8;

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

  /**
   * y = altura do chão no parceiro; com dt, a altura acompanha suave (~10/s); sem dt (ou salto > 5), encaixa.
   * ground: relevo; a câmera não desce abaixo do chão onde ela está (colina atrás do parceiro).
   */
  follow(x: number, z: number, y = 0, dt?: number, ground?: HeightFn): void {
    if (dt === undefined || this.gy === null || Math.abs(y - this.gy) > 5) this.gy = y;
    else this.gy += (y - this.gy) * Math.min(1, dt * 10);
    const h = Math.cos(this.pitch) * C.DIST, gy = this.gy;
    const cx = x + Math.sin(this.yaw) * h, cz = z + Math.cos(this.yaw) * h;
    let cy = gy + C.LOOK_HEIGHT + Math.sin(this.pitch) * C.DIST;
    if (ground) cy = Math.max(cy, ground(cx, cz) + CAM_CLEARANCE);
    this.camera.position.set(cx, cy, cz);
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
