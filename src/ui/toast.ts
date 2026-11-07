import { h } from './dom';

let box: HTMLElement | null = null;
export function mountToasts(root: HTMLElement) { box = h('div', { class: 'toasts' }); root.append(box); }
export function toast(text: string, kind: 'info' | 'rare' | 'warn' = 'info') {
  if (!box) return;
  const el = h('div', { class: `toast ${kind}` }, text);
  box.append(el);
  while (box.children.length > 5) box.firstElementChild?.remove();
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3200);
}
