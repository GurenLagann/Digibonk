import { CARDS } from '../data/cards';
import { MOVES } from '../data/moves';
import { chooseOffer, type RunState } from '../sim/run';
import type { LevelOffer } from '../sim/progression';
import { PATTERN_NAMES, STAT_NAMES } from './dom';
import { showChoice, type ChoiceOption } from './modal';

const BONUS_NAMES = { dmg: 'dano', cooldown: 'recarga', pickup: 'alcance de coleta', xp: 'XP' } as const;

/** texto da carta; level = nível atual da carta (passivas: bônus em % que sobe por nível) */
export function describeCard(id: string, level = 1): string {
  const c = CARDS[id]; if (!c) return '';
  if (c.kind === 'slash' && c.moveId) { const m = MOVES[c.moveId]; return `Golpe extra (${PATTERN_NAMES[m.pattern]}), dano ${m.damage}. Ocupa um espaço de ataque.`; }
  if (c.kind === 'rare') return 'Carta rara: libera digievoluções especiais.';
  return c.bonuses.map(b => {
    const pct = Math.round(b.basePct + b.perLevelPct * (level - 1));
    const name = b.stat in BONUS_NAMES ? BONUS_NAMES[b.stat as keyof typeof BONUS_NAMES] : STAT_NAMES[b.stat as keyof typeof STAT_NAMES];
    return `${pct >= 0 ? '+' : ''}${pct}% ${name}`;
  }).join(', ');
}

function describe(run: RunState, o: LevelOffer): Omit<ChoiceOption, 'onPick'> {
  switch (o.kind) {
    case 'learn': { const m = MOVES[o.moveId]; return { tag: 'Golpe novo', title: m.name, body: `${PATTERN_NAMES[m.pattern]} · dano ${m.damage} · recarga ${m.cooldown}s` }; }
    case 'upgrade': { const s = run.prog.slots[o.slot]!; const m = MOVES[s.moveId]; return { tag: 'Melhorar', title: `${m.name} Nv ${s.level} → ${s.level + 1}`, body: `+25% dano, -8% recarga` }; }
    case 'stat': return { tag: 'Atributo', title: `+${o.amount} ${STAT_NAMES[o.stat]}`, body: o.stat === 'brain' ? 'Reduz recarga dos golpes' : o.stat === 'spd' ? 'Anda mais rápido' : '' };
    case 'card': return { tag: 'Carta', title: CARDS[o.cardId].name, body: describeCard(o.cardId) };
  }
}

export function showLevelUp(root: HTMLElement, run: RunState) {
  const offers = run.offers ?? [];
  return showChoice(root, {
    title: `Nível ${run.prog.level - run.prog.pendingLevelUps + 1}!`,
    subtitle: run.prog.pendingLevelUps > 1 ? `Mais ${run.prog.pendingLevelUps - 1} escolha(s) na fila` : 'Escolha uma melhoria',
    options: offers.map((o, i) => ({ ...describe(run, o), onPick: () => chooseOffer(run, i) })),
  });
}
