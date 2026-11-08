import type { App } from '../app';
import type { SaveData } from '../core/save';
import { h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { portrait } from './portrait';

export interface TitleNav { play(): void; partners(): void; records(): void; settings(): void; credits(): void }

/** Tela inicial: Jogar (grande) + Parceiros, Recordes, Controles, Créditos; cartão "Seu progresso" e aviso legal. */
export function showTitle(root: HTMLElement, app: App, save: SaveData, nav: TitleNav): Modal {
  const rec = save.records;
  const unlocked = app.partners().filter(p => !p.locked).length;
  const total = app.partners().length;
  const items: { icon: string; label: string; sub: string; key: string; go: () => void }[] = [
    { icon: '▶', label: 'Jogar', sub: '', key: '1', go: nav.play },
    { icon: '🥚', label: 'Parceiros', sub: `${unlocked} / ${total} liberados`, key: '', go: nav.partners },
    { icon: '🏆', label: 'Recordes', sub: `Melhor fase ${rec.bestPhase}`, key: '', go: nav.records },
    { icon: '⚙', label: 'Controles', sub: 'Teclado · controle', key: '', go: nav.settings },
    { icon: 'ⓘ', label: 'Créditos', sub: 'Aviso legal', key: '', go: nav.credits },
  ];
  let sel = 0, closed = false;
  const els = items.map((it, i) => {
    const main = i === 0;
    const e = h('button', { type: 'button', class: main ? 'b2-btn title-play' : 'b2-panel title-tile', onclick: () => it.go(), onmouseenter: () => select(i) },
      main ? h('span', { class: 'b2-btn-label' }, '▶ Jogar') : h('span', { class: 'title-ico' }, it.icon),
      main ? h('span', { class: 'b2-key' }, it.key) : h('span', { class: 'title-txt' }, h('b', {}, it.label), h('span', { class: 'b2-label' }, it.sub)));
    return e;
  });
  const row = (label: string, v: string | number) => h('div', { class: 'title-stat' }, h('span', {}, label), h('b', {}, String(v)));
  const screen = h('div', { class: 'b2-screen title-screen' },
    h('div', { class: 'title-menu' },
      h('div', { class: 'title-logo' },
        h('div', { class: 'title-logo-text' }, 'Digi', h('span', {}, 'Bonk')),
        h('div', { class: 'b2-label' }, 'Survivor de Digimon · fan-game não oficial')),
      els[0], h('div', { class: 'title-grid' }, ...els.slice(1))),
    h('div', { class: 'title-hero' }, portrait('wargreymon', { size: 256 })),
    h('div', { class: 'b2-panel tick title-progress' }, h('div', { class: 'b2-label' }, 'Seu progresso'),
      row('Vitórias', rec.wins), row('Partidas', rec.runs), row('Parceiros', `${unlocked} / ${total}`)),
    h('div', { class: 'b2-label title-legal' }, 'Digimon © Akiyoshi Hongo / Toei / Bandai · não afiliado'));
  root.append(screen);
  function select(i: number) { sel = i; els.forEach((e, j) => e.classList.toggle('b2-sel', j === sel)); }
  select(0);
  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      if (input.pressed('up')) select(sel >= 3 ? sel - 2 : 0);
      else if (input.pressed('down')) select(sel === 0 ? 1 : sel <= 2 ? sel + 2 : sel);
      else if (input.pressed('left') && sel > 0 && (sel - 1) % 2 === 1) select(sel - 1);
      else if (input.pressed('right') && sel > 0 && (sel - 1) % 2 === 0) select(sel + 1);
      if (input.pressed('opt1')) return items[0].go();
      if (input.pressed('confirm')) items[sel].go();
    },
  };
  setActiveModal(m);
  return m;
}
