import { CARDS } from '../data/cards';
import { MOVES } from '../data/moves';
import { resolveCard, type RunState } from '../sim/run';
import { describeCard } from './levelup';
import { showChoice } from './modal';

export function showCardChoice(root: HTMLElement, run: RunState) {
  const id = run.pendingCard!; const card = CARDS[id];
  if (card.kind === 'slash') {
    return showChoice(root, {
      title: card.name, subtitle: `${describeCard(id)} Escolha qual golpe substituir (o golpe principal não pode ser trocado).`,
      options: [1, 2, 3].map(i => {
        const s = run.prog.slots[i];
        return { tag: `Espaço ${i + 1}`, title: s ? `Trocar ${MOVES[s.moveId].name}` : 'Espaço vazio', body: s ? `Nv ${s.level}` : '', onPick: () => resolveCard(run, { moveSlot: i }) };
      }),
      extra: { title: 'Descartar carta', onPick: () => resolveCard(run, {}) },
    });
  }
  return showChoice(root, {
    title: card.name, subtitle: `${describeCard(id)} — seus 3 espaços de carta estão cheios. Trocar qual?`,
    options: run.prog.passives.map((c, i) => ({ tag: `Carta ${i + 1}`, title: c ? CARDS[c].name : 'Vazio', body: c ? describeCard(c) : '', onPick: () => resolveCard(run, { passiveSlot: i }) })),
    extra: { title: 'Descartar a nova', onPick: () => resolveCard(run, { passiveSlot: null }) },
  });
}
