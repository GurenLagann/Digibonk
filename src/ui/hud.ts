import { BOSSES } from '../data/enemies';
import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { ITEMS } from '../data/items';
import { MOVES } from '../data/moves';
import { T } from '../data/tuning';
import { xpToNext } from '../sim/progression';
import type { RunState } from '../sim/run';
import { moveCooldown } from '../sim/stats';
import { canEvolve } from './evolve';
import { fmtTime, h } from './dom';

function setText(el: HTMLElement, t: string) { if (el.textContent !== t) el.textContent = t; }
function setW(el: HTMLElement, frac: number) { const w = `${Math.max(0, Math.min(1, frac)) * 100}%`; if (el.style.width !== w) el.style.width = w; }

export function mountHud(root: HTMLElement) {
  const hpFill = h('div', { class: 'fill hp' }), hpText = h('span');
  const xpFill = h('div', { class: 'fill xp' }), lvText = h('span');
  const name = h('div', { class: 'name' });
  const phase = h('div', { class: 'phase' }), timer = h('div', { class: 'timer' }), mission = h('div', { class: 'mission' });
  const moves = h('div', { class: 'moves' }), cards = h('div', { class: 'cards' }), items = h('div', { class: 'items' });
  const bossBar = h('div', { class: 'bossbar hidden' }), bossFill = h('div', { class: 'fill boss' }), bossName = h('span');
  bossBar.append(h('div', { class: 'bar' }, bossFill), bossName);
  const evo = h('div', { class: 'evo hidden' }, 'Digievolução disponível! [E / Y]');
  const arrow = h('div', { class: 'arrow hidden' }, '➤');
  const moveEls = Array.from({ length: T.MOVE_SLOTS }, () => {
    const cd = h('div', { class: 'cd' }), label = h('b'), lv = h('i');
    const el = h('div', { class: 'move' }, cd, label, lv); moves.append(el); return { el, cd, label, lv };
  });
  const cardEls = Array.from({ length: T.PASSIVE_SLOTS }, () => { const el = h('div', { class: 'card' }); cards.append(el); return el; });

  const hud = h('div', { class: 'hud' },
    h('div', { class: 'tl' }, name, h('div', { class: 'bar' }, hpFill, hpText), h('div', { class: 'bar small' }, xpFill, lvText), moves, cards, items),
    h('div', { class: 'tc' }, phase, timer, mission),
    bossBar, evo, arrow);
  root.append(hud);
  let itemKey = '';

  return {
    el: hud,
    update(run: RunState) {
      const p = run.prog, c = run.combat, f = FORMS[p.formId];
      setText(name, f.name);
      setW(hpFill, c.hp / c.maxHp); setText(hpText, `${Math.max(0, Math.ceil(c.hp))} / ${Math.ceil(c.maxHp)}`);
      setW(xpFill, p.xp / xpToNext(p.level)); setText(lvText, `Nv ${p.level}`);
      const ph = run.phase;
      setText(phase, `Fase ${ph.phase}/${T.PHASES}`);
      setText(timer, ph.overtime ? `HORDAS INSANAS +${fmtTime(ph.t - T.PHASE_SECONDS)}` : fmtTime(T.PHASE_SECONDS - ph.t));
      timer.classList.toggle('over', ph.overtime);
      const m = ph.mission;
      let ms = '';
      if (ph.bossActive) ms = `Derrote ${BOSSES.find(b => b.phase === ph.phase)!.name}!`;
      else if (ph.bossUnlocked) ms = 'Chefe liberado — vá ao altar';
      else if (m.kind === 'collect') ms = `Fragmentos de dados ${m.progress}/${m.goal}`;
      else if (m.kind === 'activate') ms = `Ative os pontos ${m.progress}/${m.goal} (fique dentro do círculo)`;
      else ms = ph.minibossSpawned ? 'Derrote o guardião!' : `Um guardião vai surgir em ${Math.max(0, Math.ceil(60 - ph.t))}s`;
      setText(mission, ms);

      p.slots.forEach((s, i) => {
        const e = moveEls[i];
        e.el.classList.toggle('empty', !s); e.el.classList.toggle('slash', !!s?.fromCard);
        if (!s) { setText(e.label, '—'); setText(e.lv, ''); setW(e.cd, 0); return; }
        setText(e.label, MOVES[s.moveId].name); setText(e.lv, `Nv ${s.level}`);
        const total = moveCooldown(p, s); setW(e.cd, total > 0 ? (c.cooldowns[i] ?? 0) / total : 0);
      });
      p.passives.forEach((id, i) => { setText(cardEls[i], id ? CARDS[id].name : 'Carta vazia'); cardEls[i].classList.toggle('empty', !id); });
      const key = p.items.join(',');
      if (key !== itemKey) {
        itemKey = key; items.replaceChildren(...p.items.map(id => h('span', { class: 'item' }, ITEMS[id]?.name ?? CARDS[id]?.name ?? id)));
      }

      const boss = ph.bossId !== null ? run.pool.get(ph.bossId) : undefined;
      bossBar.classList.toggle('hidden', !boss);
      if (boss) { setW(bossFill, boss.hp / boss.maxHp); setText(bossName, BOSSES.find(b => b.id === boss.def)?.name ?? ''); }
      evo.classList.toggle('hidden', !canEvolve(run));

      // seta para o objetivo (altar ou ponto mais próximo)
      let target: { x: number; z: number } | null = null;
      if (ph.bossUnlocked && !ph.bossActive) target = ph.bossAltar;
      else if (!m.done && m.kind === 'activate') target = m.points.filter(q => q.charge < 1).sort((a, b) => Math.hypot(a.x - run.px, a.z - run.pz) - Math.hypot(b.x - run.px, b.z - run.pz))[0] ?? null;
      else if (!m.done && m.kind === 'collect') {
        const frs = run.pickups.filter(q => q.kind === 'fragment');
        target = frs.sort((a, b) => Math.hypot(a.x - run.px, a.z - run.pz) - Math.hypot(b.x - run.px, b.z - run.pz))[0] ?? null;
      }
      const far = target && Math.hypot(target.x - run.px, target.z - run.pz) > 12;
      arrow.classList.toggle('hidden', !far);
      if (target && far) {
        const a = Math.atan2(target.z - run.pz, target.x - run.px);
        arrow.style.transform = `translate(-50%, -50%) translate(${Math.cos(a) * 140}px, ${Math.sin(a) * 110}px) rotate(${a}rad)`;
      }
    },
  };
}
