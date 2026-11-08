import type { App } from '../app';
import type { SaveData } from '../core/save';
import { partnerRecord } from '../core/save';
import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { ITEMS } from '../data/items';
import { MOVES } from '../data/moves';
import { PARTNERS, SEASON_NAMES } from '../data/partners';
import type { EvoReq, Stats } from '../data/types';
import { h, STAGE_NAMES, STAT_NAMES, STAT_SHORT } from './dom';
import { setActiveModal, type Modal } from './modal';
import { portrait } from './portrait';
import { btn, chip, panel } from './theme';

const COLS = 4;
const STAT_KEYS = ['hp', 'atk', 'def', 'spd', 'brain'] as const;
/** teto de cada barra: maior status base entre todas as formas Child (barra nunca passa de 100%) */
const STAT_MAX = Object.fromEntries(STAT_KEYS.map(k => [k,
  Math.max(1, ...Object.values(FORMS).filter(f => f.stage === 'child').map(f => f.baseStats[k]))])) as Record<keyof Stats, number>;

/** "Nv 8 e Atq 14" */
export function reqText(req: EvoReq): string {
  const parts = [`Nv ${req.minLevel}`];
  for (const [k, v] of Object.entries(req.minStats ?? {})) parts.push(`${STAT_SHORT[k as keyof typeof STAT_SHORT] ?? k} ${v}`);
  if (req.minPhase) parts.push(`fase ${req.minPhase}`);
  if (req.minKills) parts.push(`${req.minKills} abates`);
  for (const id of req.items ?? []) parts.push(ITEMS[id]?.name ?? CARDS[id]?.name ?? id);
  for (const id of req.unlocked ?? []) {
    const cf = PARTNERS.find(x => x.id === id)?.childForm;
    parts.push(`com ${cf ? FORMS[cf].name : id} liberado`);
  }
  return parts.join(' e ');
}

const move = (id: string, sig = false) => {
  const mv = MOVES[id];
  return h('div', { class: 'ps-move' + (sig ? ' sig' : '') }, h('b', {}, mv?.name ?? id), mv?.description ? h('span', {}, mv.description) : null);
};

/** Escolha de parceiro: detalhe à esquerda, grade única (4 colunas, ordem de temporada) à direita. */
export function showPartnerSelect(root: HTMLElement, app: App, save: SaveData, opts: { mode: 'pick' | 'view'; back: () => void }): Modal {
  const ps = app.partners();
  let sel = 0, closed = false;
  const cells = ps.map((p, i) => {
    const name = p.locked ? '???' : FORMS[p.childForm].name;
    return h('button', { type: 'button', class: 'b2-panel ps-cell' + (p.locked ? ' locked' : ''), 'data-partner': p.id, title: name,
      onclick: () => { if (opts.mode === 'pick' && sel !== i) select(i); else { select(i); confirm(); } }, onmouseenter: () => select(i) },
      portrait(p.childForm, { size: 64, silhouette: p.locked }), h('span', { class: 'ps-name' }, name));
  });
  const detail = h('div', { class: 'b2-panel tick ps-detail' });
  const pickBtn = opts.mode === 'pick' ? btn('Escolher parceiro!', 'Enter', () => confirm()) : null;
  const screen = h('div', { class: 'b2-screen ps-screen' },
    h('div', { class: 'ps-head' }, btn('Voltar', 'Esc', () => leave(), true),
      h('h1', { class: 'b2-title' }, opts.mode === 'pick' ? 'Escolha seu parceiro' : 'Parceiros')),
    detail,
    h('div', { class: 'b2-panel ps-grid' }, ...cells),
    pickBtn && h('div', { class: 'ps-foot' }, pickBtn));
  root.append(screen);

  function render() {
    const p = ps[sel];
    detail.replaceChildren();
    if (p.locked) {
      detail.append(h('div', { class: 'ps-lock' }, portrait(p.childForm, { size: 150, silhouette: true }),
        h('div', { class: 'b2-title' }, '???'), h('p', {}, 'Encontre o ovo deste Digimon nas fases')));
      pickBtn && (pickBtn.disabled = true);
      return;
    }
    pickBtn && (pickBtn.disabled = false);
    const f = FORMS[p.childForm];
    const r = partnerRecord(save, p.id);
    const stat = (k: keyof Stats) => h('div', { class: 'ps-stat' }, h('span', {}, STAT_NAMES[k]),
      h('div', { class: 'b2-bar' }, h('i', { style: `width:${Math.min(100, Math.round(f.baseStats[k] / STAT_MAX[k] * 100))}%` })), h('b', {}, String(f.baseStats[k])));
    const rec = (label: string, v: number) => h('div', { class: 'rec-stat' }, h('b', {}, String(v)), h('span', { class: 'b2-label' }, label));
    detail.append(
      h('div', { class: 'ps-id' },
        h('div', { class: 'b2-label' }, `${STAGE_NAMES[f.stage]} · ${SEASON_NAMES[p.season as keyof typeof SEASON_NAMES] ?? p.season}`),
        h('div', { class: 'b2-title ps-nm' }, f.name),
        h('div', { class: 'ps-chips' }, chip('attr', f.attribute), chip('elem', f.element)),
        h('div', { class: 'ps-art' }, portrait(p.childForm, { size: 160 }))),
      h('div', { class: 'ps-info' },
        h('div', { class: 'b2-label' }, 'Status base'), ...STAT_KEYS.map(stat),
        h('div', { class: 'b2-label' }, 'Golpe assinatura'), move(f.signature, true),
        h('div', { class: 'b2-label' }, 'Kit'), ...f.kit.map(k => move(k)),
        f.evolutions.length ? h('div', { class: 'b2-label' }, 'Evolui em') : null,
        ...f.evolutions.map(e => h('div', { class: 'ps-evo' }, `${FORMS[e.to]?.name ?? e.to} · ${reqText(e.req)}`)),
        h('div', { class: 'ps-rec' }, rec('Partidas', r.runs), rec('Vitórias', r.wins), rec('Melhor fase', r.bestPhase))));
  }
  function select(i: number) {
    sel = Math.max(0, Math.min(ps.length - 1, i));
    cells.forEach((c, j) => c.classList.toggle('b2-sel', j === sel));
    render();
  }
  function leave() { if (closed) return; m.close(); opts.back(); }
  function confirm() {
    if (closed || opts.mode !== 'pick' || ps[sel].locked) return;
    if (app.pickPartner(ps[sel].id)) m.close();
  }
  select(0);
  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      if (input.pressed('cancel') || input.pressed('pause')) return leave();
      if (input.pressed('left') && sel % COLS > 0) select(sel - 1);
      else if (input.pressed('right') && sel % COLS < COLS - 1 && sel + 1 < ps.length) select(sel + 1);
      else if (input.pressed('up') && sel - COLS >= 0) select(sel - COLS);
      else if (input.pressed('down') && sel + COLS < ps.length) select(sel + COLS);
      else if (input.pressed('confirm')) confirm();
    },
  };
  setActiveModal(m);
  return m;
}
