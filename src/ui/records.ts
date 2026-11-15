import { fmtClock, MEDAL_ICON, MEDAL_ORDER, medalFor } from '../core/medals';
import type { SaveData } from '../core/save';
import { partnerRecord } from '../core/save';
import { FORMS } from '../data/forms';
import { PARTNERS } from '../data/partners';
import { h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { btn, panel } from './theme';
import { portrait } from './portrait';

const SEASONS = ['adventure', 'adventure02', 'tamers'];

export type RecordSort = 'time' | 'wins' | 'kills';
const SORTS: { id: RecordSort; label: string }[] = [{ id: 'time', label: 'Tempo' }, { id: 'wins', label: 'Vitórias' }, { id: 'kills', label: 'Abates' }];

/** ordena parceiros: tempo crescente (sem vitória no fim); vitórias e abates decrescentes; empate mantém a ordem recebida */
export function sortPartners(ids: string[], save: SaveData, by: RecordSort): string[] {
  const key = (id: string) => {
    const r = partnerRecord(save, id);
    return by === 'time' ? (r.bestTime ?? Infinity) : by === 'wins' ? -r.wins : -r.bestKills;
  };
  return ids.map((id, i) => ({ id, i, k: key(id) })).sort((a, b) => (a.k - b.k) || (a.i - b.i)).map(x => x.id);
}

/** Recordes: totais com medalhas no topo e uma linha por parceiro liberado, ordenável. Cancelar volta. */
export function showRecords(root: HTMLElement, save: SaveData, back: () => void): Modal {
  const rec = save.records;
  const big = (label: string, value: string | number) =>
    panel(h('div', { class: 'b2-label' }, label), h('div', { class: 'b2-title rec-big' }, String(value)));
  const ids = SEASONS.flatMap(s => PARTNERS.filter(p => p.season === s)).filter(p => save.unlocked.includes(p.id)).map(p => p.id);
  const childOf = new Map(PARTNERS.map(p => [p.id, p.childForm]));
  const medals = ids.map(id => medalFor(partnerRecord(save, id).bestTime));
  const medalLine = MEDAL_ORDER.map(m => `${MEDAL_ICON[m]} ${medals.filter(x => x === m).length}`).join(' · ');

  const stat = (label: string, v: string | number) => h('div', { class: 'rec-stat' }, h('b', {}, typeof v === 'number' ? v.toLocaleString('pt-BR') : v), h('span', { class: 'b2-label' }, label));
  const row = (id: string) => {
    const r = partnerRecord(save, id), medal = medalFor(r.bestTime), child = childOf.get(id)!;
    return h('div', { class: 'b2-panel rec-row', 'data-partner': id },
      portrait(child, { size: 48 }),
      h('strong', { class: 'rec-name' }, FORMS[child].name),
      h('span', { class: 'rec-medal', title: medal ?? 'sem medalha' }, medal ? MEDAL_ICON[medal] : '—'),
      stat('Melhor tempo', fmtClock(r.bestTime)), stat('Melhor fase', r.bestPhase), stat('Vitórias', r.wins), stat('Partidas', r.runs), stat('Abates', r.bestKills));
  };

  let sort: RecordSort = 'time';
  const list = h('div', { class: 'rec-list' });
  const sortBtns = SORTS.map(s => {
    const b = h('button', { class: 'b2-btn secondary rec-sort-btn', type: 'button', 'data-sort': s.id, onClick: () => setSort(s.id) }, s.label);
    return b;
  });
  function setSort(s: RecordSort) {
    sort = s;
    sortBtns.forEach(b => b.classList.toggle('active', b.getAttribute('data-sort') === s));
    list.replaceChildren(...sortPartners(ids, save, s).map(row));
  }

  let closed = false;
  const screen = h('div', { class: 'b2-screen rec-screen' },
    h('div', { class: 'rec-head' }, h('h1', { class: 'b2-title' }, 'Recordes'),
      btn('Voltar', 'Esc', () => { if (!closed) { m.close(); back(); } }, true)),
    h('div', { class: 'rec-totals' }, big('Vitórias', rec.wins), big('Partidas', rec.runs), big('Mais rápido', fmtClock(rec.bestTime)),
      big('Parceiros', `${save.unlocked.length} / ${PARTNERS.length}`)),
    h('div', { class: 'b2-panel rec-medals' }, h('span', { class: 'b2-label' }, 'Medalhas'), h('strong', {}, medalLine)),
    h('div', { class: 'rec-bar' }, h('span', { class: 'b2-label rec-sub' }, 'Por parceiro'),
      h('div', { class: 'rec-sorts' }, h('span', { class: 'b2-label' }, 'ordenar (◀ ▶):'), ...sortBtns)),
    list);
  setSort('time');
  root.append(screen);
  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      const i = SORTS.findIndex(s => s.id === sort);
      if (input.pressed('right')) setSort(SORTS[(i + 1) % SORTS.length].id);
      else if (input.pressed('left')) setSort(SORTS[(i + SORTS.length - 1) % SORTS.length].id);
      else if (input.pressed('cancel') || input.pressed('pause') || input.pressed('confirm')) { m.close(); back(); }
    },
  };
  setActiveModal(m);
  return m;
}
