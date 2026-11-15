import { buildForestDw1 } from './forestDw1';
import type { BiomeId, BiomeView } from './types';

export type { BiomeId, BiomeView, BiomeLight } from './types';

export const BIOME_NAMES: Record<BiomeId, string> = { 'floresta-dw1': 'Floresta DW1', 'floresta-dw3': 'Floresta DW3' };

/** fases ímpares na Floresta DW1, pares na Floresta DW3 */
export function biomeForPhase(phase: number): BiomeId {
  return phase % 2 === 1 ? 'floresta-dw1' : 'floresta-dw3';
}

export function buildBiome(id: BiomeId): BiomeView {
  switch (id) {
    // DW3 entra na Task 8; até lá usa a DW1
    case 'floresta-dw3':
    case 'floresta-dw1':
    default: return buildForestDw1();
  }
}
