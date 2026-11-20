/** Digimon Analyzer: formas das linhas dos parceiros, só com o que o jogador já sabe. */
import type { SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { PARTNERS } from '../data/partners';
import type { EvoReq } from '../data/types';
import { lineForms } from './build';
import { edgeId, isDiscovered, revealedKeys, type ReqKey } from './discovery';

export interface AnalyzerEdge { form: string | null; req: EvoReq; hints: ReqKey[] } // form null = secreta (req só dá o texto das pistas)
export interface AnalyzerForm { id: string; known: boolean; from: AnalyzerEdge[]; to: AnalyzerEdge[] }
export interface AnalyzerGroup { partnerId: string; locked: boolean; forms: AnalyzerForm[] }
export interface AnalyzerData { groups: AnalyzerGroup[]; known: number; total: number }

export function analyzerData(save: SaveData): AnalyzerData {
  const total = new Set<string>();
  const knownIds = new Set<string>();
  const groups = PARTNERS.map((p): AnalyzerGroup => {
    const locked = !save.unlocked.includes(p.id);
    const forms = lineForms(p.id).map((id): AnalyzerForm => {
      total.add(id);
      const known = !locked && (save.discovered.includes(id) || id === p.childForm); // o Child entra em discovered só ao jogar
      if (!known) return { id, known: false, from: [], to: [] };
      knownIds.add(id);
      const from = Object.values(FORMS).flatMap(f => f.evolutions
        .filter(e => e.to === id && isDiscovered(save, edgeId(f.id, id)))
        .map(e => ({ form: f.id, req: e.req, hints: [] as ReqKey[] })));
      const to = FORMS[id].evolutions.flatMap((e): AnalyzerEdge[] => {
        const eid = edgeId(id, e.to);
        if (isDiscovered(save, eid)) return [{ form: e.to, req: e.req, hints: [] }];
        const hints = revealedKeys(save, eid);
        return hints.length ? [{ form: null, req: e.req, hints }] : [];
      });
      return { id, known, from, to };
    });
    return { partnerId: p.id, locked, forms };
  });
  return { groups, known: knownIds.size, total: total.size };
}
