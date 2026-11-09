import type { Input } from '../core/input';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { knownAvailable } from '../sim/discovery';
import { chooseBlind, doEvolve, stayMature, type RunState } from '../sim/run';
import { T } from '../data/tuning';
import { effectiveStats } from '../sim/stats';
import { h, STAGE_NAMES, STAT_SHORT } from './dom';
import { setActiveModal, type Modal } from './modal';
import { portrait } from './portrait';
import { chip } from './theme';

/** só evoluções já descobertas abrem a tela (as secretas evoluem sozinhas) */
export function canEvolve(run: RunState) { return knownAvailable(run.prog, { save: run.save, phase: run.phase.phase }).length > 0; }

const STAT_ROWS = (['hp', 'atk', 'def', 'spd'] as const).map(k => [k, STAT_SHORT[k]] as const);

/** cartão grande de uma opção: retrato, nome, selos, status no nível atual "antes → depois" e o golpe assinatura novo */
function optionCard(run: RunState, formId: string): HTMLElement {
  const f = FORMS[formId];
  const before = effectiveStats(run.prog);
  const after = effectiveStats({ ...run.prog, formId }); // cópia rasa: só a forma muda
  const stats = STAT_ROWS.map(([k, lbl]) => {
    // HP arredonda para cima como o HUD (Math.ceil(maxHp)); os demais, ao mais próximo
    const rnd = k === 'hp' ? Math.ceil : Math.round;
    const a = rnd(before[k]), b = rnd(after[k]);
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
      h('b', { class: f.name.length > 12 ? 'evo-name long' : 'evo-name' }, f.name),
      h('div', { class: 'evo-chips' }, chip('attr', f.attribute), chip('elem', f.element))),
    h('div', { class: 'evo-info' },
      h('div', { class: 'b2-label' }, `${STAGE_NAMES[f.stage]} · status no nível atual${final ? ' · forma final' : ''}`),
      ...stats,
      h('div', { class: 'b2-label evo-siglbl' }, 'Novo golpe assinatura'),
      h('div', { class: 'evo-sig' }, h('b', {}, sig?.name ?? f.signature), replaces)));
}

/** opção da Maturidade: ficar na forma atual de vez, com +12% de vida e dano */
const MATURE = '__mature__';
function matureCard(run: RunState): HTMLElement {
  const f = FORMS[run.prog.formId];
  const before = effectiveStats(run.prog), after = effectiveStats({ ...run.prog, matured: true });
  const pct = `+${Math.round(T.MATURITY_BONUS * 100)}%`;
  const row = (lbl: string, a: number, b: number) => h('div', { class: 'evo-stat' }, h('span', { class: 'evo-sl' }, lbl),
    h('div', { class: 'b2-bar evo-bar' }, h('i', { style: `width:${(a / b) * 100}%` }), h('b', { style: `width:${((b - a) / b) * 100}%` })),
    h('span', { class: 'evo-sv' }, `${Math.ceil(a)} → `, h('span', { class: 'b2-gain' }, String(Math.ceil(b)))));
  return h('div', { class: 'b2-panel tick evo-card b2-sel evo-mature' },
    h('div', { class: 'evo-side' },
      h('div', { class: 'evo-art' }, portrait(f.id, { size: 128 })),
      h('b', { class: f.name.length > 12 ? 'evo-name long' : 'evo-name' }, f.name),
      h('div', { class: 'evo-chips' }, chip('attr', f.attribute), chip('elem', f.element))),
    h('div', { class: 'evo-info' },
      h('div', { class: 'b2-label' }, `Maturidade · ${pct} de vida e dano`),
      row(STAT_SHORT.hp, before.hp, after.hp),
      row('Dano', before.dmgMul * 100, after.dmgMul * 100),
      h('div', { class: 'b2-label evo-siglbl' }, 'Troca de caminho'),
      h('div', { class: 'evo-sig' }, `${f.name} deixa as evoluções normais para trás. Daqui em diante só seguem os caminhos que pedem Maturidade.`)));
}

/**
 * Tela "Digievolução!": forma atual à esquerda, a opção selecionada num cartão grande (setas trocam quando há mais de uma).
 * `confirm` evolui; `cancel`/`pause` ("Agora não") fecham sem evoluir e chamam `onDone(null)`.
 */
export function showEvolve(root: HTMLElement, run: RunState, onDone: (formId: string | null) => void, onMature?: () => void): Modal {
  const cur = FORMS[run.prog.formId];
  const evos = knownAvailable(run.prog, { save: run.save, phase: run.phase.phase });
  // a Maturidade entra como última opção quando há alguma evolução para recusar
  const forms = evos.length && !run.prog.matured ? [...evos, MATURE] : evos;
  let sel = 0, closed = false;

  const slot = h('div', { class: 'evo-opt' });
  const tabName = (id: string) => (id === MATURE ? `Ficar como ${cur.name}` : FORMS[id].name);
  const tabs = forms.length > 1 ? forms.map((id, i) => h('button', { type: 'button', class: 'evo-tab' + (id === MATURE ? ' mature' : ''), onclick: () => select(i) }, h('span', { class: 'b2-key' }, String(i + 1)), tabName(id))) : [];
  const screen = h('div', { class: 'b2-screen evo-screen' },
    h('div', { class: 'evo-head' },
      h('h1', { class: 'b2-title evo-title' }, 'Digievolução!'),
      h('div', { class: 'b2-label' }, 'Escolha o caminho · dá para recusar e evoluir depois')),
    h('div', { class: 'evo-row' },
      h('div', { class: 'b2-panel evo-cur' },
        h('div', { class: 'b2-label' }, `Atual · ${STAGE_NAMES[cur.stage]}`),
        h('div', { class: 'evo-curart' }, portrait(cur.id, { size: 96 })),
        h('b', { class: cur.name.length > 12 ? 'evo-name long' : 'evo-name' }, cur.name)),
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
    slot.replaceChildren(forms[sel] === MATURE ? matureCard(run) : optionCard(run, forms[sel]));
    tabs.forEach((t, j) => t.classList.toggle('b2-sel', j === sel));
  }
  function accept() {
    if (closed) return;
    const id = forms[sel];
    m.close();
    if (!id) return onDone(null);
    if (id === MATURE) { stayMature(run); onMature?.(); return; }
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
      for (const [a, i] of [['opt1', 0], ['opt2', 1], ['opt3', 2]] as const) {
        if (input.pressed(a) && i < forms.length) { select(i); return accept(); }
      }
      if (input.pressed('confirm')) accept();
    },
  };
  setActiveModal(m);
  return m;
}

/**
 * Escolha às cegas: 2+ evoluções secretas cumpridas ao mesmo tempo. Uma carta "???" por opção, sem nada que
 * identifique o destino. Não dá para recusar (os requisitos voltariam a disparar); 1/2/3 escolhem e confirmam.
 */
export function showBlindEvolve(root: HTMLElement, run: RunState, onDone: (formId: string) => void): Modal {
  const n = run.blindChoice?.length ?? 0;
  let sel = 0, closed = false;
  const cards = Array.from({ length: n }, (_, i) => h('button', { type: 'button', class: 'b2-panel tick evo-card evo-mystery', onclick: () => { select(i); accept(); } },
    h('span', { class: 'evo-q' }, '?'), h('span', { class: 'b2-key' }, String(i + 1))));
  const screen = h('div', { class: 'b2-screen evo-screen evo-blind' },
    h('div', { class: 'evo-head' },
      h('h1', { class: 'b2-title evo-title' }, 'Digievolução!'),
      h('div', { class: 'b2-label' }, 'Algo está despertando… escolha um caminho')),
    h('div', { class: 'evo-mysteries' }, ...cards),
    h('div', { class: 'evo-foot' },
      h('button', { type: 'button', class: 'b2-btn evo-go', onclick: () => accept() },
        h('span', { class: 'b2-btn-label' }, 'Digievoluir!'), h('span', { class: 'b2-key' }, 'Enter'))));
  root.append(screen);

  function select(i: number) {
    if (!n) return;
    sel = (i + n) % n;
    cards.forEach((c, j) => c.classList.toggle('b2-sel', j === sel));
  }
  function accept() {
    if (closed) return;
    const id = chooseBlind(run, sel);
    if (!id) return;
    m.close();
    onDone(id);
  }
  select(0);

  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input: Input) {
      if (closed) return;
      if (input.pressed('left') || input.pressed('up')) select(sel - 1);
      if (input.pressed('right') || input.pressed('down')) select(sel + 1);
      for (const [a, i] of [['opt1', 0], ['opt2', 1], ['opt3', 2]] as const) {
        if (input.pressed(a) && i < n) { select(i); return accept(); }
      }
      if (input.pressed('confirm')) accept();
    },
  };
  setActiveModal(m);
  return m;
}
