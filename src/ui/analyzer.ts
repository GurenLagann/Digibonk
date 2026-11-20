import type { SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { PARTNERS } from '../data/partners';
import { analyzerData, type AnalyzerForm } from '../sim/analyzer';
import { STAT_KEYS } from '../sim/progression';
import type { Stats } from '../data/types';
import { h, STAGE_NAMES, STAT_NAMES } from './dom';
import { reqKeyText } from './evoText';
import { setActiveModal, type Modal } from './modal';
import { reqText } from './partnerSelect';
import { portrait } from './portrait';
import { btn, chip } from './theme';

/** teto das barras de status: maior status base entre todas as formas (barra nunca passa de 100%) */
const STAT_MAX = Object.fromEntries(STAT_KEYS.map(k => [k, Math.max(1, ...Object.values(FORMS).map(f => f.baseStats[k]))])) as Record<keyof Stats, number>;

/** Digimon Analyzer: vitrine das formas das linhas dos parceiros. ↑↓ escolhe, Esc volta. */
export function showAnalyzer(root: HTMLElement, save: SaveData, back: () => void): Modal {
  const data = analyzerData(save);
  const flat: AnalyzerForm[] = data.groups.flatMap(g => g.forms);
  let sel = Math.max(0, flat.findIndex(f => f.known)), closed = false;
  const card = h('div', { class: 'b2-panel an-card' });
  const buttons: HTMLElement[] = [];

  const list = h('div', { class: 'b2-panel an-list' }, ...data.groups.map(g => {
    const child = PARTNERS.find(p => p.id === g.partnerId)!.childForm;
    const seen = g.forms.filter(f => f.known).length;
    const head = h('div', { class: 'an-ghead' + (g.locked ? ' locked' : '') },
      portrait(child, { size: 32, silhouette: g.locked }),
      h('b', {}, g.locked ? 'Parceiro bloqueado' : FORMS[child].name),
      h('span', { class: 'an-gcount' }, `${seen}/${g.forms.length}`));
    return h('div', { class: 'an-group' }, head, h('div', { class: 'an-forms' }, ...g.forms.map(f => {
      const i = flat.indexOf(f);
      const el = h('button', { type: 'button', class: 'an-form' + (f.known ? '' : ' unknown'), 'data-form': f.id, title: f.known ? FORMS[f.id].name : '???',
        onclick: () => select(i) }, portrait(f.id, { size: 56, silhouette: !f.known }), h('span', { class: 'an-fname' }, f.known ? FORMS[f.id].name : '???'));
      buttons[i] = el;
      return el;
    })));
  }));

  function renderCard(f: AnalyzerForm) {
    if (!f.known) {
      card.replaceChildren(h('div', { class: 'an-unknown' },
        h('div', { class: 'an-art' }, portrait(f.id, { size: 160, silhouette: true })),
        h('div', { class: 'b2-title' }, '???'),
        h('p', {}, 'Forma não descoberta. Evolua até ela numa partida ou junte Digi Data para ver as pistas.')));
      return;
    }
    const d = FORMS[f.id];
    const edge = (e: AnalyzerForm['to'][number], dir: 'from' | 'to') => e.form
      ? h('div', { class: 'an-edge' }, h('span', { class: 'an-arrow' }, dir === 'from' ? '←' : '→'), portrait(e.form, { size: 32 }),
        h('div', { class: 'an-edge-txt' }, h('b', {}, FORMS[e.form].name), h('span', {}, reqText(e.req))))
      : h('div', { class: 'an-edge secret' }, h('span', { class: 'an-arrow' }, dir === 'from' ? '←' : '→'), h('span', { class: 'an-q' }, '?'),
        h('div', { class: 'an-edge-txt' }, h('b', {}, '???'), h('span', {}, `Pistas: ${e.hints.map(k => reqKeyText(e.req, k)).join(' e ')}`)));
    const stat = (k: keyof Stats) => h('div', { class: 'ps-stat' }, h('span', {}, STAT_NAMES[k]),
      h('div', { class: 'b2-bar' }, h('i', { style: `width:${Math.min(100, Math.round(d.baseStats[k] / STAT_MAX[k] * 100))}%` })), h('b', {}, String(d.baseStats[k])));
    card.replaceChildren(
      h('div', { class: 'an-top' }, h('div', { class: 'an-art' }, portrait(d.id, { size: 160 })),
        h('div', { class: 'an-id' }, h('div', { class: 'b2-label' }, STAGE_NAMES[d.stage]), h('div', { class: 'b2-title an-nm' }, d.name),
          h('div', { class: 'ps-chips' }, chip('attr', d.attribute), chip('elem', d.element)))),
      h('div', { class: 'b2-label' }, 'Status base'),
      h('div', { class: 'an-stats' }, ...STAT_KEYS.map(stat)),
      h('div', { class: 'b2-label' }, 'Golpes'),
      h('div', { class: 'an-moves' }, ...[d.signature, ...d.kit].map((m, j) => h('span', { class: 'an-move' + (j === 0 ? ' sig' : '') }, MOVES[m]?.name ?? m))),
      ...(f.from.length ? [h('div', { class: 'b2-label' }, 'Vem de')] : []), ...f.from.map(e => edge(e, 'from')),
      ...(f.to.length ? [h('div', { class: 'b2-label' }, 'Evolui para')] : []), ...f.to.map(e => edge(e, 'to')));
  }

  function select(i: number) {
    sel = Math.max(0, Math.min(flat.length - 1, i));
    buttons.forEach((b, j) => b.classList.toggle('b2-sel', j === sel));
    buttons[sel]?.scrollIntoView?.({ block: 'nearest' });
    renderCard(flat[sel]);
  }
  function leave() { if (closed) return; m.close(); back(); }

  const screen = h('div', { class: 'b2-screen an-screen' },
    h('div', { class: 'an-head' }, btn('Voltar', 'Esc', () => leave(), true), h('h1', { class: 'b2-title' }, 'Digimon Analyzer'),
      h('div', { class: 'an-count' }, h('span', { class: 'b2-label' }, `Descobertas ${data.known}/${data.total}`),
        h('div', { class: 'b2-bar' }, h('i', { style: `width:${Math.round(data.known / Math.max(1, data.total) * 100)}%` })))),
    h('div', { class: 'an-body' }, list, card));
  root.append(screen);
  select(sel);

  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      if (input.pressed('cancel') || input.pressed('pause')) return leave();
      if (input.pressed('up') || input.pressed('left')) select(sel - 1);
      else if (input.pressed('down') || input.pressed('right')) select(sel + 1);
    },
  };
  setActiveModal(m);
  return m;
}
