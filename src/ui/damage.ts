import { MOVES } from '../data/moves';
import { damageRows } from '../sim/damage';
import type { RunState } from '../sim/run';
import { h } from './dom';

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1).replace('.', ',')} mil` : String(Math.round(n)));

/** "Dano por golpe": barra, total, % e dano por segundo (últimos 15 s); usado na pausa e no resultado */
export function damagePanel(run: RunState, opts: { dps?: boolean } = {}): HTMLElement {
  const rows = damageRows(run.damage, run.time);
  const dps = opts.dps ?? true;
  return h('div', { class: 'b2-panel dmg-panel' },
    h('div', { class: 'b2-label' }, 'Dano por golpe'),
    ...(rows.length ? rows.map(r => {
      const bar = h('div', { class: 'b2-bar dmg-bar' }, h('i', {}));
      (bar.firstElementChild as HTMLElement).style.width = `${r.pct * 100}%`;
      return h('div', { class: 'dmg-row' },
        h('span', { class: 'dmg-name' }, MOVES[r.moveId]?.name ?? r.moveId), bar,
        h('span', { class: 'dmg-num' }, `${fmt(r.total)} · ${Math.round(r.pct * 100)}%${dps ? ` · ${fmt(r.dps)}/s` : ''}`));
    }) : [h('div', { class: 'dmg-row' }, 'Nenhum dano ainda')]));
}
