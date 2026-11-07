import type { Input } from '../core/input';
import { h } from './dom';

export interface ChoiceOption { title: string; body?: string; tag?: string; onPick: () => void }
export interface ChoiceSpec { title: string; subtitle?: string; options: ChoiceOption[]; extra?: ChoiceOption; columns?: boolean }

export interface Modal { handle(input: Input): void; close(): void; readonly closed: boolean }

let current: Modal | null = null;
export const activeModal = () => (current && !current.closed ? current : null);

export function showChoice(root: HTMLElement, spec: ChoiceSpec): Modal {
  current?.close();
  const all = spec.extra ? [...spec.options, spec.extra] : spec.options;
  let sel = 0, closed = false;
  const cards = all.map((o, i) => h('button', { class: 'choice' + (o === spec.extra ? ' extra' : ''), onclick: () => pick(i), onmouseenter: () => select(i) },
    o.tag ? h('span', { class: 'tag' }, o.tag) : null, h('strong', {}, (i < 3 && o !== spec.extra ? `${i + 1}. ` : '') + o.title), o.body ? h('small', {}, o.body) : null));
  const panel = h('div', { class: 'modal' }, h('h2', {}, spec.title), spec.subtitle ? h('p', { class: 'sub' }, spec.subtitle) : null,
    h('div', { class: spec.columns === false ? 'choices rows' : 'choices' }, ...cards.filter((_, i) => all[i] !== spec.extra)),
    spec.extra ? cards[cards.length - 1] : null);
  const back = h('div', { class: 'backdrop' }, panel);
  root.append(back);
  function select(i: number) { if (!all.length) return; sel = (i + all.length) % all.length; cards.forEach((c, j) => c.classList.toggle('sel', j === sel)); }
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
      if (input.pressed('cancel') && spec.extra) return pick(all.length - 1);
      if (input.pressed('confirm')) pick(sel);
    },
  };
  current = m;
  return m;
}
