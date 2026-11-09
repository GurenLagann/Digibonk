import type { Action, Input } from '../core/input';
import { h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { portrait } from './portrait';

/** cor da moldura: ciano golpe novo, verde melhorar, roxo carta, amarelo status */
export type TamerCardKind = 'learn' | 'upgrade' | 'card' | 'stat';
export interface TamerCardSpec {
  kind: TamerCardKind; name: string; level: string;
  art: { glyph?: string; formId?: string };
  typeLine: string; text: string;
  gains?: { label: string; from: string; to: string }[];
  pips?: { filled: number; next: boolean; max: number };
  /** raridade da oferta (golpe novo não tem): muda a moldura e mostra o selo */
  rarity?: { id: string; label: string };
}
export interface TamerCardsSpec {
  title: string; subtitle?: string;
  cards: (TamerCardSpec & { onPick(): void })[];
  extra?: { label: string; onPick(): void };
  /** ações extras com usos limitados (level up: atualizar/pular/banir); `onUse` recebe a carta selecionada */
  tools?: { label: string; action: Action; key: string; count: number; onUse(sel: number): void }[];
}

/** duração do "Card Slash!" (a carta passa pelo leitor) antes de aplicar a escolha */
export const SLASH_MS = 750;

const KEYS = ['opt1', 'opt2', 'opt3'] as const;

function cardEl(c: TamerCardSpec, key: string | null): HTMLElement {
  const art = h('div', { class: 'tc-art' },
    c.art.formId ? portrait(c.art.formId, { size: 96 }) : h('span', { class: 'tc-glyph' }, c.art.glyph ?? '✦'));
  const gains = (c.gains ?? []).map(g => h('div', { class: 'tc-gain' }, h('span', {}, g.label), ' ', g.from, ' → ', h('b', { class: 'up' }, g.to)));
  const pips = c.pips ? h('span', { class: 'tc-pips' },
    ...Array.from({ length: c.pips.max }, (_, i) => h('i', { class: i < c.pips!.filled ? 'f' : i === c.pips!.filled && c.pips!.next ? 'n' : '' }))) : h('span', {});
  return h('div', { class: `tc ${c.kind}${c.rarity ? ` rar-${c.rarity.id}` : ''}` },
    c.rarity ? h('span', { class: 'tc-rar' }, c.rarity.label) : null,
    h('div', { class: 'tc-face' },
      h('div', { class: 'tc-top' }, h('span', { class: 'tc-name' }, c.name), h('span', { class: 'tc-lv' }, c.level)),
      art,
      h('span', { class: 'tc-type' }, c.typeLine),
      h('div', { class: 'tc-txt' }, c.text ? h('p', {}, c.text) : null, ...gains),
      h('div', { class: 'tc-foot' }, pips, key !== null ? h('span', { class: 'b2-key' }, key) : h('span', {})),
      h('div', { class: 'tc-shine' })));
}

/**
 * Tela de cartas em pé estilo Tamers. `opt1..3`, setas + `confirm` ou clique escolhem; a carta escolhida passa pelo leitor
 * ("Card Slash!") e `onPick` roda depois de SLASH_MS (entradas no meio são ignoradas). `extra` (cancel/Esc) fecha na hora.
 */
export function showTamerCards(root: HTMLElement, spec: TamerCardsSpec): Modal {
  let sel = 0, closed = false, busy = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const slots = spec.cards.map((c, i) => {
    const el = cardEl(c, i < 3 ? String(i + 1) : null);
    return h('div', { class: 'tc-slot', onclick: () => pick(i), onmouseenter: () => select(i) }, el);
  });
  const extraBtn = spec.extra ? h('button', { type: 'button', class: 'b2-btn secondary tc-extra', onclick: () => discard() },
    h('span', { class: 'b2-btn-label' }, spec.extra.label), h('span', { class: 'b2-key' }, 'Esc')) : null;
  const tools = (spec.tools ?? []).map(t => {
    const b = h('button', { type: 'button', class: 'b2-btn secondary tc-tool', onclick: () => use(t) },
      h('span', { class: 'b2-btn-label' }, t.label), h('b', { class: 'tc-count' }, String(t.count)), h('span', { class: 'b2-key' }, t.key)) as HTMLButtonElement;
    b.disabled = t.count <= 0;
    return b;
  });
  const screen = h('div', { class: 'b2-screen tc-screen' },
    h('div', { class: 'tc-head' },
      spec.subtitle ? h('div', { class: 'b2-label tc-sub' }, spec.subtitle) : null,
      h('h1', { class: 'b2-title tc-title' }, spec.title)),
    h('div', { class: 'tc-row' }, ...slots),
    tools.length ? h('div', { class: 'tc-foot-row tc-tools' }, ...tools) : null,
    extraBtn && h('div', { class: 'tc-foot-row' }, extraBtn));
  root.append(screen);

  function select(i: number) {
    if (busy || !slots.length) return;
    sel = (i + slots.length) % slots.length;
    slots.forEach((s, j) => s.firstElementChild!.classList.toggle('sel', j === sel));
  }
  function pick(i: number) {
    if (busy || closed) return;
    const c = spec.cards[i]; if (!c) return;
    busy = true; sel = i;
    slots.forEach((s, j) => s.firstElementChild!.classList.toggle('sel', j === i));
    screen.classList.add('slashing');
    slots[i].classList.add('tc-slash');
    slots[i].prepend(h('div', { class: 'tc-reader' }), h('div', { class: 'tc-slash-txt' }, 'Card Slash!'));
    timer = setTimeout(() => { timer = null; m.close(); c.onPick(); }, SLASH_MS);
  }
  function use(t: NonNullable<TamerCardsSpec['tools']>[number]) {
    if (busy || closed || t.count <= 0) return;
    m.close(); t.onUse(sel);
  }
  function discard() {
    if (busy || closed || !spec.extra) return;
    m.close(); spec.extra.onPick();
  }
  select(0);
  const m: Modal = {
    get closed() { return closed; },
    close() {
      if (closed) return;
      closed = true;
      if (timer) { clearTimeout(timer); timer = null; }
      screen.remove();
    },
    handle(input: Input) {
      if (busy || closed) return;
      if (input.pressed('left') || input.pressed('up')) select(sel - 1);
      if (input.pressed('right') || input.pressed('down')) select(sel + 1);
      for (let i = 0; i < KEYS.length; i++) if (input.pressed(KEYS[i]) && spec.cards[i]) return pick(i);
      for (const t of spec.tools ?? []) if (input.pressed(t.action)) return use(t);
      if ((input.pressed('cancel') || input.pressed('pause')) && spec.extra) return discard();
      if (input.pressed('confirm')) pick(sel);
    },
  };
  setActiveModal(m);
  return m;
}
