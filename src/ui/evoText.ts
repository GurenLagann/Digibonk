/** Textos curtos de requisito e de "caminho" para as evoluções secretas (resultado, seleção de parceiro). */
import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { ITEMS } from '../data/items';
import type { EvoReq, StatKey } from '../data/types';
import { findEdge, type ReqKey } from '../sim/discovery';
import { STAT_SHORT } from './dom';

/** "Nv 20", "Atq 38", "HP < 25%: 3×"… */
export function reqKeyText(req: EvoReq, key: ReqKey): string {
  if (key === 'level') return `Nv ${req.minLevel}`;
  if (key === 'kills') return `${req.minKills} abates`;
  if (key === 'nearDeaths') return `HP < 25%: ${req.minNearDeaths}×`;
  if (key === 'phase') return `Fase ${req.minPhase}`;
  if (key.startsWith('stat:')) { const k = key.slice(5) as StatKey; return `${STAT_SHORT[k]} ${req.minStats?.[k]}`; }
  const id = key.slice(5);
  return ITEMS[id]?.name ?? CARDS[id]?.name ?? id;
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];

/** "Caminho Greymon ②": nomeia só a forma de origem; o número separa caminhos que saem do mesmo Digimon */
export function pathLabel(edge: string): string {
  const e = findEdge(edge);
  if (!e) return 'Caminho ???';
  const name = FORMS[e.from]?.name ?? e.from;
  return e.total > 1 ? `Caminho ${name} ${CIRCLED[e.index] ?? e.index + 1}` : `Caminho ${name}`;
}
