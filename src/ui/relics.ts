import { RELICS } from '../data/relics';
import { chooseRelic, type RunState } from '../sim/run';
import { RELIC_SLOTS } from '../sim/relics';
import { STAT_SHORT } from './dom';
import { showTamerCards } from './tamerCards';

const EFFECT_GLYPH: Record<string, string> = { regen: '💚', pickup: '🧲', xp: '⭐', elite: '⚔', revive: '🥚', digidata: '💾' };

/** Relíquias da Distorção: escolha 1 de 3 (vale o resto da partida) ou nenhuma (Esc) */
export function showRelicChoice(root: HTMLElement, run: RunState) {
  const ids = run.relicOffer ?? [];
  return showTamerCards(root, {
    title: 'Relíquias da Distorção',
    subtitle: `Escolha uma para o resto da partida · ${run.prog.relics.length}/${RELIC_SLOTS} espaços`,
    cards: ids.map((id, i) => {
      const r = RELICS[id];
      return {
        kind: 'card' as const, name: r.name, level: 'Relíquia', art: { glyph: EFFECT_GLYPH[r.effect] ?? '✦' },
        typeLine: `+${r.statPct}% ${STAT_SHORT[r.stat]}`, text: r.description,
        onPick: () => chooseRelic(run, i),
      };
    }),
    extra: { label: 'Não levar nenhuma', onPick: () => chooseRelic(run, null) },
  });
}
