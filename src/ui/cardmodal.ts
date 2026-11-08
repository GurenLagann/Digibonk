import { CARDS } from '../data/cards';
import { resolveCard, type RunState } from '../sim/run';
import { describeCard, moveCard, passiveCard } from './levelup';
import { showTamerCards, type TamerCardSpec } from './tamerCards';

const empty = (typeLine: string, kind: TamerCardSpec['kind']): TamerCardSpec =>
  ({ kind, name: 'Espaço vazio', level: '—', art: { glyph: '＋' }, typeLine, text: 'Nada equipado aqui.' });

/** carta slash ou passiva sem espaço livre: escolher o que sai (cartas Tamers) ou descartar */
export function showCardChoice(root: HTMLElement, run: RunState) {
  const id = run.pendingCard!; const card = CARDS[id];
  if (card.kind === 'slash') {
    return showTamerCards(root, {
      title: card.name,
      subtitle: `${describeCard(id)} Escolha qual golpe substituir (o principal não pode ser trocado).`,
      cards: [1, 2, 3].map(i => {
        const s = run.prog.slots[i]; const line = `Espaço ${i + 1} · trocar`;
        return { ...(s ? moveCard(run.prog, s, line) : empty(line, 'learn')), onPick: () => resolveCard(run, { moveSlot: i }) };
      }),
      extra: { label: 'Descartar carta', onPick: () => resolveCard(run, {}) },
    });
  }
  return showTamerCards(root, {
    title: card.name,
    subtitle: `${describeCard(id)} — seus 3 espaços de carta estão cheios. Trocar qual?`,
    cards: run.prog.passives.map((c, i) => {
      const line = `Carta ${i + 1} · trocar`;
      return { ...(c ? passiveCard(c, run.prog.cardLevels[c] ?? 1, line) : empty(line, 'card')), onPick: () => resolveCard(run, { passiveSlot: i }) };
    }),
    extra: { label: 'Descartar a nova', onPick: () => resolveCard(run, { passiveSlot: null }) },
  });
}
