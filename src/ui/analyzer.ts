import type { SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { PARTNERS } from '../data/partners';
import { analyzerData, type AnalyzerForm } from '../sim/analyzer';
import { STAT_KEYS } from '../sim/progression';
import { h, STAGE_NAMES, STAT_NAMES } from './dom';
import { reqKeyText } from './evoText';
import { setActiveModal, type Modal } from './modal';
import { reqText } from './partnerSelect';
import { portrait } from './portrait';
import { btn, chip } from './theme';

/** Digimon Analyzer: vitrine das formas das linhas dos parceiros. ↑↓ escolhe, Esc volta. */
export function showAnalyzer(root: HTMLElement, save: SaveData, back: () => void): Modal {
  const data = analyzerData(save);
  const flat: AnalyzerForm[] = data.groups.flatMap(g => g.forms);
  let sel = Math.max(0, flat.findIndex(f => f.known)), closed = false;
  const card = h('div', { class: 'b2-panel an-card' });
  const buttons: HTMLElement[] = [];

  const list = h('div', { class: 'b2-panel an-list' }, ...data.groups.map(g => {
    const head = g.locked ? '???' : FORMS[PARTNERS.find(p => p.id === g.partnerId)!.childForm].name;
    return h('div', { class: 'an-group' }, h('div', { class: 'b2-label' }, head), h('div', { class: 'an-forms' }, ...g.forms.map(f => {
      const i = flat.indexOf(f);
      const el = h('button', { type: 'button', class: 'an-form' + (f.known ? '' : ' unknown'), 'data-form': f.id, title: f.known ? FORMS[f.id].name : '???',
        onclick: () => select(i) }, portrait(f.id, { size: 40, silhouette: !f.known }), h('span', {}, f.known ? FORMS[f.id].name : '???'));
      buttons[i] = el;
      return el;
    })));
  }));

  function renderCard(f: AnalyzerForm) {
    if (!f.known) {
      card.replaceChildren(portrait(f.id, { size: 140, silhouette: true }), h('div', { class: 'b2-title' }, '???'), h('p', {}, 'Forma não descoberta'));
      return;
    }
    const d = FORMS[f.id];
    const edge = (e: AnalyzerForm['to'][number], dir: 'from' | 'to') => e.form
      ? h('div', { class: 'an-edge' }, `${dir === 'from' ? '←' : '→'} ${FORMS[e.form].name} · ${reqText(e.req)}`)
      : h('div', { class: 'an-edge secret' }, `→ ??? · ${e.hints.map(k => reqKeyText(e.req, k)).join(' e ')}`);
    card.replaceChildren(
      h('div', { class: 'an-top' }, portrait(d.id, { size: 120 }),
        h('div', {}, h('div', { class: 'b2-label' }, STAGE_NAMES[d.stage]), h('div', { class: 'b2-title' }, d.name),
          h('div', { class: 'ps-chips' }, chip('attr', d.attribute), chip('elem', d.element)))),
      h('div', { class: 'b2-label' }, 'Status base'),
      h('div', { class: 'an-stats' }, ...STAT_KEYS.map(k => h('span', {}, `${STAT_NAMES[k]} ${d.baseStats[k]}`))),
      h('div', { class: 'b2-label' }, 'Golpes'),
      h('div', { class: 'an-moves' }, ...[d.signature, ...d.kit].map(m => h('span', {}, MOVES[m]?.name ?? m))),
      ...(f.from.length ? [h('div', { class: 'b2-label' }, 'Vem de')] : []), ...f.from.map(e => edge(e, 'from')),
      ...(f.to.length ? [h('div', { class: 'b2-label' }, 'Evolui para')] : []), ...f.to.map(e => edge(e, 'to')));
  }

  function select(i: number) {
    sel = Math.max(0, Math.min(flat.length - 1, i));
    buttons.forEach((b, j) => b.classList.toggle('b2-sel', j === sel));
    renderCard(flat[sel]);
  }
  function leave() { if (closed) return; m.close(); back(); }

  const screen = h('div', { class: 'b2-screen an-screen' },
    h('div', { class: 'an-head' }, btn('Voltar', 'Esc', () => leave(), true), h('h1', { class: 'b2-title' }, 'Digimon Analyzer'),
      h('div', { class: 'b2-label an-count' }, `Descobertas ${data.known}/${data.total}`)),
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
