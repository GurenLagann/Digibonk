import { storeSave, type SaveData } from '../core/save';
import { CARD_LIST, CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';
import { buildOf, clearPathFrom, cycleMark, lineMoves, markOf, pathChoices, setPathStep } from '../sim/build';
import { reqKeyText } from './evoText';
import { h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { btn } from './theme';

const MARK_ICON = { fav: '★', ban: '✕' } as const;

/** Editor de build: ★/✕ em golpes da linha e cartas passivas, e o caminho de digievolução. Esc salva e volta. */
export function showBuild(root: HTMLElement, save: SaveData, partnerId: string, back: () => void, storage?: Storage | null): Modal {
  const b = buildOf(save, partnerId);
  const child = PARTNERS.find(p => p.id === partnerId)!.childForm;
  let closed = false, sel = 0;
  const count = h('div', { class: 'b2-label bd-count' });
  const moves = h('div', { class: 'b2-panel bd-col' });
  const cards = h('div', { class: 'b2-panel bd-col' });
  const path = h('div', { class: 'b2-panel bd-path' });
  const rows: HTMLElement[] = [];

  const row = (key: string, name: string, sub: string, locked: boolean) => {
    const mark = markOf(b, key);
    const el: HTMLElement = h('button', { type: 'button', class: 'bd-row' + (locked ? ' locked' : '') + (mark ? ` ${mark}` : ''), 'data-key': key, disabled: locked,
      onclick: () => { if (!locked) { sel = rows.indexOf(el); if (cycleMark(b, key)) render(); } } },
      h('b', { class: 'bd-mark' }, mark ? MARK_ICON[mark] : '·'), h('span', { class: 'bd-name' }, name), h('span', { class: 'b2-label' }, sub));
    rows.push(el);
    return el;
  };

  function renderPath() {
    const steps = b.path.length ? b.path : [child];
    const chosen = steps.map((id, i) => {
      const secret = i > 0 && !save.discoveredEvos.includes(`${steps[i - 1]}->${id}`);
      return h('span', { class: 'bd-step' + (secret ? ' secret' : '') }, secret ? '???' : FORMS[id].name);
    });
    const next = pathChoices(save, b.path, partnerId).map(c => { const el: HTMLElement = h('button', { type: 'button', class: 'b2-btn secondary bd-next', ...(c.secret ? {} : { 'data-step': c.to }),
      onclick: () => { sel = rows.indexOf(el); setPathStep(b, partnerId, steps.length, c.to); render(); } },
      h('span', { class: 'b2-btn-label' }, c.secret ? `??? · ${c.hints.map(k => reqKeyText(FORMS[steps[steps.length - 1]].evolutions.find(e => e.to === c.to)!.req, k)).join(' e ')}` : FORMS[c.to].name)); rows.push(el); return el; });
    const clear: HTMLElement = h('button', { type: 'button', class: 'b2-btn secondary bd-path-clear', onclick: () => { sel = rows.indexOf(clear); clearPathFrom(b, 1); render(); } },
      h('span', { class: 'b2-btn-label' }, 'Limpar caminho'), h('span', { class: 'b2-key' }, 'X'));
    if (b.path.length) rows.push(clear);
    path.replaceChildren(
      h('div', { class: 'b2-label' }, 'Caminho de digievolução · só orienta a partida'),
      h('div', { class: 'bd-steps' }, ...chosen.flatMap((c, i) => (i ? [h('span', { class: 'bd-arrow' }, '→'), c] : [c]))),
      next.length ? h('div', { class: 'bd-nexts' }, ...next) : h('div', { class: 'b2-label' }, b.path.length ? 'Fim do caminho conhecido' : 'Descubra evoluções para montar o caminho'),
      ...(b.path.length ? [clear] : []));
  }

  function render() {
    rows.length = 0;
    count.textContent = `★ ${b.fav.length}/${T.BUILD.MAX} · ✕ ${b.ban.length}/${T.BUILD.MAX}`;
    moves.replaceChildren(h('div', { class: 'b2-label' }, 'Golpes da linha'),
      ...lineMoves(partnerId).map(m => {
        const known = save.discovered.includes(m.from) || m.from === child;
        return known ? row(`move:${m.moveId}`, MOVES[m.moveId].name, `Kit do ${FORMS[m.from].name}`, false)
          : row(`move:${m.moveId}`, '???', 'golpe de forma não descoberta', true);
      }));
    cards.replaceChildren(h('div', { class: 'b2-label' }, 'Cartas'),
      ...CARD_LIST.filter(c => c.kind === 'passive').map(c => row(`card:${c.id}`, CARDS[c.id].name, 'Passiva', false)));
    renderPath();
    sel = Math.max(0, Math.min(sel, rows.length - 1));
    rows.forEach((r, i) => r.classList.toggle('b2-sel', i === sel));
  }

  function leave() { if (closed) return; storeSave(save, storage); m.close(); back(); }
  const screen = h('div', { class: 'b2-screen bd-screen' },
    h('div', { class: 'bd-head' }, btn('Voltar', 'Esc', () => leave(), true), h('h1', { class: 'b2-title' }, `Build · ${FORMS[child].name}`), count),
    h('div', { class: 'bd-body' }, moves, cards), path);
  root.append(screen);
  render();

  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      if (input.pressed('cancel') || input.pressed('pause')) return leave();
      if (input.pressed('up')) sel = Math.max(0, sel - 1);
      else if (input.pressed('down')) sel = Math.min(rows.length - 1, sel + 1);
      else if (input.pressed('confirm')) { rows[sel]?.click(); return; }
      else if (input.pressed('skip') && b.path.length) { clearPathFrom(b, 1); }
      else return;
      render();
    },
  };
  setActiveModal(m);
  return m;
}
