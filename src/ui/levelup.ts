import { CARDS, CARD_MAX_LEVEL } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import type { CardStat, ElementId } from '../data/types';
import { chooseOffer, type RunState } from '../sim/run';
import type { LevelOffer, MoveSlot, PlayerProg } from '../sim/progression';
import { effectiveStats, moveCooldown, outgoingDamage } from '../sim/stats';
import { PATTERN_NAMES, STAT_NAMES } from './dom';
import { ELEM_NAMES } from './theme';
import { showTamerCards, type TamerCardSpec } from './tamerCards';

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

/** número em pt-BR com até `d` casas ("17,5", "0,92") */
export const fmtNum = (n: number, d = 1) => String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ',');

/** símbolo da janela de arte (as cartas não têm desenho próprio) */
export const ELEM_GLYPHS: Record<ElementId, string> = {
  fire: '🔥', water: '💧', plant: '🌿', ice: '❄', electric: '⚡', earth: '⛰', wind: '🌀', light: '✨', dark: '🌑', steel: '⚙', neutral: '✦',
};
const STAT_GLYPHS: Record<CardStat, string> = {
  hp: '❤', atk: '💪', def: '🛡', spd: '👟', brain: '🧠', dmg: '💥', cooldown: '⏱', pickup: '🧲', xp: '⭐',
};
const STAT_HINTS: Partial<Record<string, string>> = { brain: 'Reduz a recarga dos golpes.', spd: 'Anda mais rápido.', hp: 'Mais vida máxima.', atk: 'Golpes causam mais dano.', def: 'Leva menos dano.' };

const moveGains = (p: PlayerProg, a: MoveSlot, b: MoveSlot) => [
  { label: 'Dano', from: fmtNum(outgoingDamage(p, a)), to: fmtNum(outgoingDamage(p, b)) },
  { label: 'Recarga', from: fmtNum(moveCooldown(p, a), 2), to: `${fmtNum(moveCooldown(p, b), 2)} s` },
];

/** carta de um golpe já equipado (troca da carta slash) */
export function moveCard(p: PlayerProg, slot: MoveSlot, typeLine: string): TamerCardSpec {
  const m = MOVES[slot.moveId];
  return {
    kind: 'learn', name: m.name, level: `Nv ${slot.level}`, art: { glyph: ELEM_GLYPHS[m.element] }, typeLine,
    text: `${m.description} Dano ${fmtNum(outgoingDamage(p, slot))} · recarga ${fmtNum(moveCooldown(p, slot), 2)} s.`,
    pips: { filled: slot.level, next: false, max: m.maxLevel },
  };
}

/** carta de uma passiva (oferta ou já equipada no nível `level`) */
export function passiveCard(id: string, level: number, typeLine: string, next = false): TamerCardSpec {
  const c = CARDS[id];
  const stat = c.bonuses[0]?.stat;
  return {
    kind: 'card', name: c.name, level: `Nv ${level}`, art: { glyph: stat ? STAT_GLYPHS[stat] : '🃏' }, typeLine,
    text: `${describeCard(id, level)}. Cópias sobem o nível até Nv ${CARD_MAX_LEVEL}.`,
    pips: { filled: next ? level - 1 : level, next, max: CARD_MAX_LEVEL },
  };
}

function offerCard(run: RunState, o: LevelOffer): TamerCardSpec {
  const p = run.prog;
  switch (o.kind) {
    case 'learn': {
      const m = MOVES[o.moveId]; const s: MoveSlot = { moveId: o.moveId, level: 1, fromCard: false };
      return {
        kind: 'learn', name: m.name, level: 'Nv 1', art: { glyph: ELEM_GLYPHS[m.element] },
        typeLine: `Golpe novo · ${ELEM_NAMES[m.element]}`, text: m.description,
        gains: [{ label: 'Dano', from: '—', to: fmtNum(outgoingDamage(p, s)) }, { label: 'Recarga', from: '—', to: `${fmtNum(moveCooldown(p, s), 2)} s` }],
        pips: { filled: 0, next: true, max: m.maxLevel },
      };
    }
    case 'upgrade': {
      const s = p.slots[o.slot]!; const m = MOVES[s.moveId];
      return {
        kind: 'upgrade', name: m.name, level: `Nv ${s.level} → ${s.level + 1}`, art: o.slot === 0 ? { formId: p.formId } : { glyph: ELEM_GLYPHS[m.element] },
        typeLine: `Melhorar · ${o.slot === 0 ? 'Assinatura' : ELEM_NAMES[m.element]}`, text: '',
        gains: moveGains(p, s, { ...s, level: s.level + 1 }),
        pips: { filled: s.level, next: true, max: m.maxLevel },
      };
    }
    case 'stat': {
      const name = STAT_NAMES[o.stat];
      const after = { ...p, bonus: { ...p.bonus, [o.stat]: p.bonus[o.stat] + o.amount } };
      return {
        kind: 'stat', name: `Treino de ${name}`, level: `+${o.amount}`, art: { glyph: STAT_GLYPHS[o.stat] },
        typeLine: `Status · ${name}`, text: `${STAT_HINTS[o.stat] ?? ''} Permanente nesta partida.`.trim(),
        gains: [{ label: name, from: fmtNum(effectiveStats(p)[o.stat]), to: fmtNum(effectiveStats(after)[o.stat]) }],
      };
    }
    case 'card': {
      const full = p.passives.filter(Boolean).length;
      return passiveCard(o.cardId, 1, `Carta · Passiva · ${full}/${p.passives.length}`, true);
    }
  }
}

export function showLevelUp(root: HTMLElement, run: RunState) {
  const offers = run.offers ?? [];
  const from = run.prog.level - run.prog.pendingLevelUps;
  const more = run.prog.pendingLevelUps > 1 ? ` · mais ${run.prog.pendingLevelUps - 1} na fila` : '';
  return showTamerCards(root, {
    title: 'Level up! Escolha uma carta',
    subtitle: `${FORMS[run.prog.formId]?.name ?? run.prog.formId} · Nv ${from} → ${from + 1}${more}`,
    cards: offers.map((o, i) => ({ ...offerCard(run, o), onPick: () => chooseOffer(run, i) })),
  });
}
