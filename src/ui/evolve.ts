import type { Input } from '../core/input';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { availableEvolutions } from '../sim/evolution';
import { doEvolve, type RunState } from '../sim/run';
import { effectiveStats } from '../sim/stats';
import { h, STAGE_NAMES } from './dom';
import { setActiveModal, type Modal } from './modal';
import { portrait } from './portrait';
import { chip } from './theme';

export function canEvolve(run: RunState) { return availableEvolutions(run.prog, { save: run.save, phase: run.phase.phase }).length > 0; }

const STAT_ROWS = [['hp', 'HP'], ['atk', 'Atq'], ['def', 'Def'], ['spd', 'Vel']] as const;

/** cartão grande de uma opção: retrato, nome, selos, status no nível atual "antes → depois" e o golpe assinatura novo */
function optionCard(run: RunState, formId: string): HTMLElement {
  const f = FORMS[formId];
  const before = effectiveStats(run.prog);
  const after = effectiveStats({ ...run.prog, formId }); // cópia rasa: só a forma muda
  const stats = STAT_ROWS.map(([k, lbl]) => {
    const a = Math.round(before[k]), b = Math.round(after[k]);
    const top = Math.max(a, b, 1);
    const bar = h('div', { class: 'b2-bar evo-bar' }, h('i', {}), h('b', {}));
    (bar.children[0] as HTMLElement).style.width = `${(Math.min(a, b) / top) * 100}%`;
    (bar.children[1] as HTMLElement).style.width = `${(Math.max(0, b - a) / top) * 100}%`;
    return h('div', { class: 'evo-stat' }, h('span', { class: 'evo-sl' }, lbl), bar,
      h('span', { class: 'evo-sv' }, `${a} → `, h('span', { class: b > a ? 'b2-gain' : '' }, String(b))));
  });
  const prevSig = run.prog.slots[0]?.moveId ?? FORMS[run.prog.formId].signature;
  const sig = MOVES[f.signature];
  const replaces = prevSig !== f.signature ? ` · substitui ${MOVES[prevSig]?.name ?? prevSig} mantendo o nível` : '';
  const final = f.evolutions.length === 0 && f.stage !== 'ultimate';
  return h('div', { class: 'b2-panel tick evo-card b2-sel' },
    h('div', { class: 'evo-side' },
      h('div', { class: 'evo-art' }, portrait(formId, { size: 128 })),
      h('b', { class: 'evo-name' }, f.name),
      h('div', { class: 'evo-chips' }, chip('attr', f.attribute), chip('elem', f.element))),
    h('div', { class: 'evo-info' },
      h('div', { class: 'b2-label' }, `${STAGE_NAMES[f.stage]} · status no nível atual${final ? ' · forma final' : ''}`),
      ...stats,
      h('div', { class: 'b2-label evo-siglbl' }, 'Novo golpe assinatura'),
      h('div', { class: 'evo-sig' }, h('b', {}, sig?.name ?? f.signature), replaces)));
}

/**
 * Tela "Digievolução!": forma atual à esquerda, a opção selecionada num cartão grande (setas trocam quando há mais de uma).
 * `confirm` evolui; `cancel`/`pause` ("Agora não") fecham sem evoluir e chamam `onDone(null)`.
 */
export function showEvolve(root: HTMLElement, run: RunState, onDone: (formId: string | null) => void): Modal {
  const cur = FORMS[run.prog.formId];
  const forms = availableEvolutions(run.prog, { save: run.save, phase: run.phase.phase });
  let sel = 0, closed = false;

  const slot = h('div', { class: 'evo-opt' });
  const tabs = forms.length > 1 ? forms.map((id, i) => h('button', { type: 'button', class: 'evo-tab', onclick: () => select(i) }, FORMS[id].name)) : [];
  const screen = h('div', { class: 'b2-screen evo-screen' },
    h('div', { class: 'evo-head' },
      h('h1', { class: 'b2-title evo-title' }, 'Digievolução!'),
      h('div', { class: 'b2-label' }, 'Escolha o caminho · dá para recusar e evoluir depois')),
    h('div', { class: 'evo-row' },
      h('div', { class: 'b2-panel evo-cur' },
        h('div', { class: 'b2-label' }, `Atual · ${STAGE_NAMES[cur.stage]}`),
        h('div', { class: 'evo-curart' }, portrait(cur.id, { size: 96 })),
        h('b', { class: 'evo-name' }, cur.name)),
      h('div', { class: 'evo-arrows' }, '›››'),
      h('div', { class: 'evo-col' },
        tabs.length ? h('div', { class: 'evo-tabs' }, h('span', { class: 'b2-key' }, '◀'), ...tabs, h('span', { class: 'b2-key' }, '▶')) : null,
        slot)),
    h('div', { class: 'evo-foot' },
      h('button', { type: 'button', class: 'b2-btn secondary', onclick: () => refuse() },
        h('span', { class: 'b2-btn-label' }, 'Agora não'), h('span', { class: 'b2-key' }, 'Esc')),
      h('button', { type: 'button', class: 'b2-btn evo-go', onclick: () => accept() },
        h('span', { class: 'b2-btn-label' }, 'Digievoluir!'), h('span', { class: 'b2-key' }, 'Enter'))));
  root.append(screen);

  function select(i: number) {
    if (!forms.length) return;
    sel = (i + forms.length) % forms.length;
    slot.replaceChildren(optionCard(run, forms[sel]));
    tabs.forEach((t, j) => t.classList.toggle('b2-sel', j === sel));
  }
  function accept() {
    if (closed) return;
    const id = forms[sel];
    m.close();
    if (!id) return onDone(null);
    doEvolve(run, id);
    onDone(id);
  }
  function refuse() { if (closed) return; m.close(); onDone(null); }
  select(0);

  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input: Input) {
      if (closed) return;
      if (input.pressed('left') || input.pressed('up')) select(sel - 1);
      if (input.pressed('right') || input.pressed('down')) select(sel + 1);
      if (input.pressed('cancel') || input.pressed('pause')) return refuse();
      if (input.pressed('confirm')) accept();
    },
  };
  setActiveModal(m);
  return m;
}
