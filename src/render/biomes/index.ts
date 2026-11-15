import { buildFactory, buildFactoryCore } from './factory';
import { buildForestDw1 } from './forestDw1';
import { buildForestDw3 } from './forestDw3';
import type { BiomeId, BiomeView } from './types';

export type { BiomeId, BiomeView, BiomeLight } from './types';

export const BIOME_NAMES: Record<BiomeId, string> = {
  'floresta-dw1': 'Floresta DW1', 'floresta-dw3': 'Floresta DW3', fabrica: 'Fábrica', nucleo: 'Núcleo da Fábrica',
};
/** ordem do debug "Trocar bioma" */
export const BIOME_IDS = Object.keys(BIOME_NAMES) as BiomeId[];

/** sequência das fases: Floresta DW1 → Floresta DW3 → Fábrica → Núcleo → Floresta DW1 */
const BY_PHASE: BiomeId[] = ['floresta-dw1', 'floresta-dw3', 'fabrica', 'nucleo', 'floresta-dw1'];
export function biomeForPhase(phase: number): BiomeId {
  return BY_PHASE[(Math.max(1, phase) - 1) % BY_PHASE.length];
}

export function buildBiome(id: BiomeId): BiomeView {
  switch (id) {
    case 'floresta-dw3': return buildForestDw3();
    case 'fabrica': return buildFactory();
    case 'nucleo': return buildFactoryCore();
    case 'floresta-dw1':
    default: return buildForestDw1();
  }
}
