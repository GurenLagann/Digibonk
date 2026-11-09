import { MOVES } from '../data/moves';
import { T } from '../data/tuning';
import { chooseJogress, type RunState } from '../sim/run';
import { outgoingDamage } from '../sim/stats';
import { fmtNum, ELEM_GLYPHS } from './levelup';
import { showTamerCards } from './tamerCards';

/** nome do golpe Jogress: "Mega Flame × Radiation Blade" */
export const jogressName = (a: string, b: string) => `${MOVES[a]?.name ?? a} × ${MOVES[b]?.name ?? b}`;

/** Terminal Jogress: uma carta por par de golpes no máximo; escolher junta os dois num espaço (uma vez por partida) */
export function showJogressChoice(root: HTMLElement, run: RunState, onDone: (name: string) => void) {
  const p = run.prog, pairs = run.jogressOffer ?? [];
  const pct = Math.round(T.JOGRESS_BONUS * 100);
  return showTamerCards(root, {
    title: 'Jogress! Junte dois golpes',
    subtitle: `Os dois disparam do mesmo espaço com +${pct}% de dano e o outro espaço fica livre · uma vez por partida`,
    cards: pairs.map(([a, b], i) => {
      const sa = p.slots[a]!, sb = p.slots[b]!;
      const name = jogressName(sa.moveId, sb.moveId);
      return {
        kind: 'upgrade' as const, name, level: 'Jogress', art: { glyph: `${ELEM_GLYPHS[MOVES[sa.moveId].element]}${ELEM_GLYPHS[MOVES[sb.moveId].element]}` },
        typeLine: a === 0 ? 'Jogress · Assinatura' : 'Jogress', text: '',
        gains: [sa, sb].map(s => ({ label: MOVES[s.moveId].name, from: fmtNum(outgoingDamage(p, s)), to: fmtNum(outgoingDamage(p, s) * (1 + T.JOGRESS_BONUS)) })),
        onPick: () => { const r = chooseJogress(run, i); if (r) onDone(jogressName(r.a, r.b)); },
      };
    }),
    extra: { label: 'Agora não', onPick: () => chooseJogress(run, null) },
  });
}
