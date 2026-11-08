import type { SaveData } from '../core/save';
import { partnerRecord } from '../core/save';
import { FORMS } from '../data/forms';
import { PARTNERS } from '../data/partners';
import { h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { btn, panel } from './theme';
import { portrait } from './portrait';

const SEASONS = ['adventure', 'adventure02', 'tamers'];

/** Recordes: números gerais e uma linha por parceiro liberado. Cancelar volta. */
export function showRecords(root: HTMLElement, save: SaveData, back: () => void): Modal {
  const rec = save.records;
  const big = (label: string, value: string | number) =>
    panel(h('div', { class: 'b2-label' }, label), h('div', { class: 'b2-title rec-big' }, String(value)));
  const unlocked = SEASONS.flatMap(s => PARTNERS.filter(p => p.season === s)).filter(p => save.unlocked.includes(p.id));
  const rows = unlocked.map(p => {
    const r = partnerRecord(save, p.id);
    const stat = (label: string, v: number) => h('div', { class: 'rec-stat' }, h('b', {}, String(v)), h('span', { class: 'b2-label' }, label));
    return h('div', { class: 'b2-panel rec-row', 'data-partner': p.id },
      portrait(p.childForm, { size: 48 }),
      h('strong', { class: 'rec-name' }, FORMS[p.childForm].name),
      stat('Partidas', r.runs), stat('Vitórias', r.wins), stat('Melhor fase', r.bestPhase));
  });
  let closed = false;
  const screen = h('div', { class: 'b2-screen rec-screen' },
    h('div', { class: 'rec-head' }, h('h1', { class: 'b2-title' }, 'Recordes'),
      btn('Voltar', 'Esc', () => { if (!closed) { m.close(); back(); } }, true)),
    h('div', { class: 'rec-totals' }, big('Vitórias', rec.wins), big('Partidas', rec.runs), big('Melhor fase', rec.bestPhase),
      big('Parceiros', `${save.unlocked.length} / ${PARTNERS.length}`)),
    h('div', { class: 'b2-label rec-sub' }, 'Por parceiro'),
    h('div', { class: 'rec-list' }, ...rows));
  root.append(screen);
  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      if (input.pressed('cancel')) { m.close(); back(); }
    },
  };
  setActiveModal(m);
  return m;
}
