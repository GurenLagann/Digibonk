import type { Input } from '../core/input';
import { partnerRecord } from '../core/save';
import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';
import type { RunState } from '../sim/run';
import { fmtTime, h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { portrait } from './portrait';
import { findEdge } from '../sim/discovery';
import { pathLabel, reqKeyText } from './evoText';

const num = (label: string, value: string, extra?: HTMLElement | null) =>
  h('div', { class: 'res-num' }, h('div', { class: 'b2-label' }, label), h('b', {}, value), extra ?? null);

/**
 * Resultado da partida: "Vitória!"/"Derrota", fase e tempo, caminho evolutivo em retratos (com o nível de cada evolução),
 * golpes e cartas finais, números em destaque e o cartão laranja de parceiro liberado.
 * `opt1`/`confirm` = jogar de novo; `opt2`/`cancel`/`pause` = menu.
 */
export function showResults(root: HTMLElement, run: RunState, onAgain: () => void, onMenu: () => void): Modal {
  const win = run.ended === 'victory';
  const p = run.prog;
  let closed = false;

  const path: HTMLElement[] = [];
  p.path.forEach((id, i) => {
    if (i > 0) path.push(h('span', { class: 'res-arrow' }, '›'));
    const big = i === p.path.length - 1;
    path.push(h('div', { class: 'res-step' + (big ? ' last' : '') },
      portrait(id, { size: big ? 112 : 80 }),
      h('span', { class: 'res-sname' }, FORMS[id]?.name ?? id),
      i > 0 && p.pathLevels[i] !== undefined ? h('div', { class: 'b2-label' }, `Nv ${p.pathLevels[i]}`) : null,
      big && p.matured ? h('div', { class: 'b2-label res-mature' }, 'Maturidade') : null));
  });

  const kit = [
    ...p.slots.filter(s => s !== null).map(s => `${MOVES[s!.moveId]?.name ?? s!.moveId} Nv ${s!.level}`),
    ...p.passives.filter((c): c is string => !!c).map(c => `${CARDS[c]?.name ?? c} Nv ${p.cardLevels[c] ?? 1}`),
  ];

  const rec = partnerRecord(run.save, run.partnerId);
  const unlocked = run.unlockedThisRun.map(id => {
    const form = PARTNERS.find(pp => pp.id === id)?.childForm ?? id;
    return h('div', { class: 'res-unl' }, portrait(form, { size: 56 }), h('b', {}, FORMS[form]?.name ?? id));
  });

  // pistas de Digi Data: só a forma de origem e o requisito, nunca o destino
  const data = run.digiDataThisRun.flatMap(({ edge, key }) => {
    const e = findEdge(edge);
    return e ? [h('div', { class: 'res-dline' }, `${pathLabel(edge)} — ${reqKeyText(e.edge.req, key)}`)] : [];
  });

  const btn = (label: string, key: string, cls: string, fn: () => void) =>
    h('button', { type: 'button', class: cls, onclick: () => choose(fn) }, h('span', { class: 'b2-btn-label' }, label), h('span', { class: 'b2-key' }, key));

  const screen = h('div', { class: 'b2-screen res-screen' },
    h('div', { class: 'res-head' },
      h('h1', { class: `b2-title res-title ${win ? 'win' : 'lose'}` }, win ? 'Vitória!' : 'Derrota'),
      h('div', { class: 'b2-label' }, `Fase ${run.phase.phase} de ${T.PHASES} · ${fmtTime(run.time)} de partida`)),
    h('div', { class: 'res-body' },
      h('div', { class: 'b2-panel tick res-path' },
        h('div', { class: 'b2-label' }, 'Caminho evolutivo'),
        h('div', { class: 'res-steps' }, ...path),
        h('div', { class: 'b2-label res-kitlbl' }, 'Golpes e cartas no fim'),
        h('div', { class: 'res-kit' }, kit.join(' · ') || '—')),
      h('div', { class: 'res-side' },
        h('div', { class: 'b2-panel res-nums' },
          num('Abates', p.kills.toLocaleString('pt-BR')),
          num('Nível', String(p.level)),
          num('Chefes', String(run.stats.bosses)),
          num('Guardiões', String(run.stats.guardians)),
          num('Melhor fase', String(rec.bestPhase), run.newRecord ? h('span', { class: 'res-rec' }, 'Novo recorde!') : null)),
        data.length ? h('div', { class: 'b2-panel res-data' },
          h('div', { class: 'b2-label' }, 'Digi Data'), ...data) : null,
        unlocked.length ? h('div', { class: 'b2-panel res-unlock' },
          h('div', { class: 'b2-label' }, 'Novo parceiro liberado!'), ...unlocked) : null)),
    h('div', { class: 'res-foot' },
      btn('Menu', 'Esc', 'b2-btn secondary res-menu', onMenu),
      btn('Jogar de novo', '1', 'b2-btn res-again', onAgain)));
  root.append(screen);

  function choose(fn: () => void) { if (closed) return; m.close(); fn(); }
  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input: Input) {
      if (closed) return;
      if (input.pressed('opt1') || input.pressed('confirm')) return choose(onAgain);
      if (input.pressed('opt2') || input.pressed('cancel') || input.pressed('pause')) return choose(onMenu);
    },
  };
  setActiveModal(m);
  return m;
}
