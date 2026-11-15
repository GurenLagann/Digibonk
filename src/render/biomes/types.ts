import type * as THREE from 'three';
import type { HeightFn } from '../terrain';

export type BiomeId = 'floresta-dw1' | 'floresta-dw3' | 'fabrica' | 'nucleo';

/** luz do bioma: hemisfério (céu/chão) e sol */
export interface BiomeLight { sky: number; ground: number; hemi: number; sun: number; sunIntensity: number }

export interface BiomeView {
  group: THREE.Group;
  sky: { background: THREE.Texture | THREE.Color; fog: number };
  light: BiomeLight;
  /** altura do chão (relevo só visual); 0 fora do mapa */
  height: HeightFn;
  /** por quadro: silhueta segue a câmera; copas entre câmera e parceiro ficam transparentes */
  update(time: number, camPos: THREE.Vector3, target: THREE.Vector3): void;
  dispose(): void;
}
