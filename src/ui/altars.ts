import { T } from '../data/tuning';
import { chooseAltar, type RunState } from '../sim/run';
import { STAT_SHORT } from './dom';
import { showTamerCards } from './tamerCards';

const A = () => T.ALTARS;
const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Altares: Etemon (Corrupção), Datamon (troca de status) e Desafio. Esc recusa e o altar continua lá. */
export function showAltar(root: HTMLElement, run: RunState) {
  const o = run.altarOffer!;
  const refuse = { label: 'Recusar', onPick: () => chooseAltar(run, null) };
  if (o.kind === 'datamon') {
    return showTamerCards(root, {
      title: 'Altar do Datamon', subtitle: 'Troque um status por outro pelo resto da partida',
      cards: (o.trades ?? []).map((t, i) => ({
        kind: 'stat' as const, name: `${STAT_SHORT[t.from]} → ${STAT_SHORT[t.to]}`, level: 'Troca', art: { glyph: '💽' },
        typeLine: 'Datamon · troca', text: `−${t.lose}% ${STAT_SHORT[t.from]} → +${t.gain}% ${STAT_SHORT[t.to]}`,
        onPick: () => chooseAltar(run, i),
      })),
      extra: refuse,
    });
  }
  if (o.kind === 'etemon') {
    const next = Math.min(A().CORRUPTION_MAX, run.corruption + 1);
    return showTamerCards(root, {
      title: 'Altar do Etemon', subtitle: `Corrupção ×${run.corruption} → ×${next} (máx. ×${A().CORRUPTION_MAX}) · vale até o fim da partida`,
      cards: [{
        kind: 'card' as const, name: 'Rede Sombria', level: `×${next}`, art: { glyph: '🐵' }, typeLine: 'Etemon · Corrupção',
        text: `Por nível: +${pct(A().CORRUPTION_SPAWN)} inimigos surgindo e +${pct(A().CORRUPTION_POWER)} de vida e dano deles; +${pct(A().CORRUPTION_XP)} de XP.`,
        onPick: () => chooseAltar(run, 0),
      }],
      extra: refuse,
    });
  }
  return showTamerCards(root, {
    title: 'Altar do Desafio', subtitle: 'O próximo guardião vem mais forte',
    cards: [{
      kind: 'learn' as const, name: 'Desafio', level: 'Raro', art: { glyph: '⚔' }, typeLine: 'Guardião · Distorção rara',
      text: `Guardião com +${pct(A().CHALLENGE_HP - 1)} de vida e +${pct(A().CHALLENGE_DMG - 1)} de dano. A Distorção dele tem uma onda a mais, 4 relíquias e um Digi Data extra.`,
      onPick: () => chooseAltar(run, 0),
    }],
    extra: refuse,
  });
}
