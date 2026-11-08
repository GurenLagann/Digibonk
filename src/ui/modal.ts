import type { Input } from '../core/input';
import { h } from './dom';

export interface ChoiceOption { title: string; body?: string; tag?: string; onPick: () => void }
export interface ChoiceSpec { title: string; subtitle?: string; options: ChoiceOption[]; extra?: ChoiceOption; columns?: boolean }

export interface Modal { handle(input: Input): void; close(): void; readonly closed: boolean }

let current: Modal | null = null;
export const activeModal = () => (current && !current.closed ? current : null);

/** registra uma tela própria (sem showChoice) para receber o input do laço principal; fecha a anterior */
export function setActiveModal(m: Modal): void {
  if (current && current !== m) current.close();
  current = m;
}

export function showChoice(root: HTMLElement, spec: ChoiceSpec): Modal {
  current?.close();
  const all = spec.extra ? [...spec.options, spec.extra] : spec.options;
  let sel = 0, closed = false;
  const cards = all.map((o, i) => {
    const isExtra = o === spec.extra;
    const key = isExtra ? 'Esc' : i < 3 ? String(i + 1) : null;
    return h('button', { class: isExtra ? 'b2-btn secondary cm-extra' : 'cm-opt', type: 'button', onclick: () => pick(i), onmouseenter: () => select(i) },
      o.tag ? h('span', { class: 'b2-label' }, o.tag) : null,
      h('span', { class: 'cm-text' }, h('b', {}, o.title), o.body ? h('small', {}, o.body) : null),
      key ? h('span', { class: 'b2-key' }, key) : null);
  });
  const panel = h('div', { class: 'b2-panel tick cm-panel' }, h('h2', { class: 'b2-title' }, spec.title),
    spec.subtitle ? h('p', { class: 'cm-sub' }, spec.subtitle) : null,
    spec.options.length ? h('div', { class: 'cm-list' + (spec.columns === false ? ' rows' : '') }, ...cards.filter((_, i) => all[i] !== spec.extra)) : null,
    spec.extra ? cards[cards.length - 1] : null);
  const back = h('div', { class: 'b2-screen cm-screen' }, panel);
  root.append(back);
  function select(i: number) { if (!all.length) return; sel = (i + all.length) % all.length; cards.forEach((c, j) => c.classList.toggle('b2-sel', j === sel)); }
  function pick(i: number) { if (closed) return; const o = all[i]; if (!o) return; m.close(); o.onPick(); }
  select(0);
  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; back.remove(); if (current === m) current = null; } },
    handle(input) {
      if (!all.length) return;
      if (input.pressed('left') || input.pressed('up')) select(sel - 1);
      if (input.pressed('right') || input.pressed('down')) select(sel + 1);
      if (input.pressed('opt1') && spec.options[0]) return pick(0);
      if (input.pressed('opt2') && spec.options[1]) return pick(1);
      if (input.pressed('opt3') && spec.options[2]) return pick(2);
      // Esc está ligado a `pause` e Backspace a `cancel`: "voltar" aceita os dois
      if ((input.pressed('cancel') || input.pressed('pause')) && spec.extra) return pick(all.length - 1);
      if (input.pressed('confirm')) pick(sel);
    },
  };
  current = m;
  return m;
}
