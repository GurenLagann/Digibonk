import { BOSSES, MINIBOSSES } from '../data/enemies';
import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { ITEMS } from '../data/items';
import { RELICS } from '../data/relics';
import { MOVES } from '../data/moves';
import { T } from '../data/tuning';
import type { StatKey } from '../data/types';
import { knownAvailable, visibleHint } from '../sim/discovery';
import { canMature, type EvoMissing } from '../sim/evolution';
import { xpToNext } from '../sim/progression';
import { hudSave, type RunState } from '../sim/run';
import { moveCooldown } from '../sim/stats';
import { h, STAT_SHORT } from './dom';
import { timerView, type TimerMode } from './hudTimer';
import { portrait } from './portrait';
import { chip } from './theme';

function setText(el: HTMLElement, t: string) { if (el.textContent !== t) el.textContent = t; }
function setW(el: HTMLElement, frac: number) { const w = `${Math.max(0, Math.min(1, frac)) * 100}%`; if (el.style.width !== w) el.style.width = w; }
function setH(el: HTMLElement, frac: number) { const v = `${Math.max(0, Math.min(1, frac)) * 100}%`; if (el.style.height !== v) el.style.height = v; }


/** "Nv 8 · Atq 14": só o que ainda falta para a próxima evolução */
export function evoMissingText(missing: EvoMissing[]): string {
  return missing.map(m => {
    switch (m.kind) {
      case 'level': return `Nv ${m.need}`;
      case 'stat': return `${STAT_SHORT[m.stat]} ${m.need}`;
      case 'item': return ITEMS[m.id]?.name ?? CARDS[m.id]?.name ?? m.id;
      case 'phase': return `Fase ${m.need}`;
      case 'kills': return `${m.need} abates`;
      case 'nearDeaths': return `HP < 25%: ${m.have}/${m.need}×`;
      case 'maturity': return 'Maturidade';
    }
  }).join(' · ');
}

/** nível infinito: "Nv 37–39 · +3 Vida · +2 Atq" (ganhos do mesmo instante somados num aviso só) */
export function autoGainText(gains: { level: number; stat: StatKey; amount: number }[]): string {
  const lv = gains.map(g => g.level), lo = Math.min(...lv), hi = Math.max(...lv);
  const sum = new Map<StatKey, number>();
  for (const g of gains) sum.set(g.stat, (sum.get(g.stat) ?? 0) + g.amount);
  return [lo === hi ? `Nv ${lo}` : `Nv ${lo}–${hi}`, ...[...sum].map(([k, v]) => `+${v} ${STAT_SHORT[k]}`)].join(' · ');
}

/** 1284 → "1.284" */
function fmtInt(n: number): string { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

const MODES: TimerMode[] = ['normal', 'warning', 'overtime'];

export function mountHud(root: HTMLElement, evolveKey: () => string = () => 'E / Y') {
  // ── cartão do parceiro (canto superior esquerdo)
  const port = h('div', { class: 'hud-port' });
  const name = h('b', { class: 'hud-name' }), lv = h('span', { class: 'b2-label hud-lv' });
  const chips = h('div', { class: 'hud-chips' });
  const hpFill = h('i'), hpText = h('span', { class: 'hud-hptext' });
  const xpFill = h('i');
  const items = h('div', { class: 'hud-items' });
  const partner = h('div', { class: 'b2-panel hud-partner' }, port,
    h('div', { class: 'hud-pinfo' },
      h('div', { class: 'hud-prow' }, name, lv),
      chips,
      h('div', { class: 'b2-bar hud-hp' }, hpFill),
      h('div', { class: 'hud-hprow' }, h('div', { class: 'b2-bar hud-xp' }, xpFill), hpText),
      items));

  // ── topo centro: barra hackeada + timer + missão
  const phaseLbl = h('span'), pct = h('span', { class: 'hud-pct' });
  const fill = h('div', { class: 'hud-fill' }, h('div', { class: 'hud-stream' }), h('div', { class: 'hud-edge' }), h('div', { class: 'hud-noise' }));
  const track = h('div', { class: 'hud-track normal' }, fill, h('div', { class: 'hud-glitch' }));
  const timer = h('div', { class: 'hud-timer' }), mission = h('div', { class: 'hud-mission' });
  const top = h('div', { class: 'hud-top' }, h('div', { class: 'hud-lbl' }, phaseLbl, pct), track, timer, mission);

  // ── direita: abates + próxima evolução
  const kills = h('div', { class: 'hud-kills' });
  const evoPort = h('div', { class: 'hud-evoport' }), evoName = h('b', { class: 'hud-evoname' }), evoText = h('span', { class: 'hud-evotext' });
  const right = h('div', { class: 'b2-panel hud-right' },
    h('div', { class: 'b2-label' }, 'Abates'), kills,
    h('div', { class: 'b2-label hud-evolbl' }, 'Próx. evolução'),
    h('div', { class: 'hud-evo' }, evoPort, h('div', { class: 'hud-evoinfo' }, evoName, evoText)));

  // ── baixo centro: golpes | cartas
  const moveRow = h('div', { class: 'hud-slots' }), cardRow = h('div', { class: 'hud-slots' });
  // cada golpe/carta: coluna com o quadrado (nível + recarga) e o nome inteiro embaixo
  const slot = (cls: string, withCd: boolean) => {
    const cd = h('div', { class: 'hud-cd' }), lvl = h('b'), nm = h('span', { class: 'hud-sname' });
    const el = h('div', { class: `hud-slot ${cls}` }, h('div', { class: 'hud-box' }, withCd && cd, lvl), nm);
    return { el, cd, lvl, nm };
  };
  const moveEls = Array.from({ length: T.MOVE_SLOTS }, () => { const e = slot('hud-move', true); moveRow.append(e.el); return e; });
  const cardEls = Array.from({ length: T.PASSIVE_SLOTS }, () => { const e = slot('hud-card', false); cardRow.append(e.el); return e; });
  const bottom = h('div', { class: 'b2-panel hud-bottom' },
    h('div', {}, h('div', { class: 'b2-label' }, 'Golpes'), moveRow),
    h('div', { class: 'hud-div' }),
    h('div', {}, h('div', { class: 'b2-label hud-cardlbl' }, 'Cartas'), cardRow));

  // ── chefe (acima do painel de baixo) e seta do objetivo
  const bossFill = h('i'), bossName = h('span', { class: 'b2-label' });
  const bossBar = h('div', { class: 'hud-boss hidden' }, bossName, h('div', { class: 'b2-bar' }, bossFill));
  const arrow = h('div', { class: 'hud-arrow hidden' }, '➤');

  // coluna da direita: painel + avisos (toast.ts monta em toastHost) — empilhados, sem sobreposição
  const toastHost = h('div', { class: 'hud-toasthost' });
  const hud = h('div', { class: 'hud' }, partner, top,
    h('div', { class: 'hud-rcol' }, right, toastHost),
    h('div', { class: 'hud-bcol' }, bossBar, bottom), arrow);
  root.append(hud);

  let formKey = '', itemKey = '', evoKey = '', mode: TimerMode = 'normal';

  return {
    el: hud,
    /** onde os avisos (toasts) são montados: logo abaixo do painel da direita */
    toastHost,
    update(run: RunState) {
      const p = run.prog, c = run.combat, f = FORMS[p.formId];
      const ph = run.phase, m = ph.mission;

      // parceiro: retrato e selos só mudam com a forma
      if (p.formId !== formKey) {
        formKey = p.formId;
        port.replaceChildren(portrait(p.formId, { size: 48 }));
        chips.replaceChildren(chip('attr', f.attribute), chip('elem', f.element));
      }
      setText(name, f.name); setText(lv, `Nv ${p.level}`);
      setW(hpFill, c.hp / c.maxHp); setText(hpText, `${Math.max(0, Math.ceil(c.hp))}/${Math.ceil(c.maxHp)}`);
      setW(xpFill, p.xp / xpToNext(p.level));
      const key = [...p.items, '|', ...p.relics].join(',');
      if (key !== itemKey) {
        itemKey = key; items.replaceChildren(...p.items.map(id => h('span', { class: 'hud-item' }, ITEMS[id]?.name ?? CARDS[id]?.name ?? id)),
          ...p.relics.map(id => h('span', { class: 'hud-item hud-relic', title: RELICS[id]?.description ?? '' }, RELICS[id]?.name ?? id)));
      }

      // fase
      const tv = timerView(ph);
      setText(phaseLbl, `FASE ${ph.phase}/${T.PHASES} · TEMPO DA FASE`);
      setText(pct, `${tv.pct}%`);
      setW(fill, tv.frac);
      if (tv.mode !== mode) { mode = tv.mode; for (const md of MODES) track.classList.toggle(md, md === mode); timer.classList.toggle('warning', mode === 'warning'); timer.classList.toggle('overtime', mode === 'overtime'); }
      if (timer.textContent !== tv.text) { timer.textContent = tv.text; timer.setAttribute('data-t', tv.text); }
      let ms = '';
      const z = run.zone;
      if (z) {
        ms = z.stage === 'waves' ? `Distorção Digital · onda ${z.wave}/${T.ZONE.WAVES} · restam ${run.pool.alive().length}`
          : z.stage === 'alpha' ? `Derrote o Alfa ${MINIBOSSES.find(b => b.id === z.guardian)?.name ?? ''}! ${Math.max(0, Math.ceil(z.alphaT))} s`
          : 'Volte pelo portal';
      } else if (ph.bossActive) ms = `Derrote ${BOSSES.find(b => b.phase === ph.phase)!.name}!`;
      else if (ph.bossUnlocked) ms = 'Chefe liberado — vá ao altar';
      else if (m.kind === 'collect') ms = `Fragmentos de dados ${m.progress}/${m.goal}`;
      else if (m.kind === 'activate') ms = `Ative os pontos ${m.progress}/${m.goal} (fique dentro do círculo)`;
      else ms = ph.minibossSpawned ? 'Derrote o guardião!' : `Um guardião vai surgir em ${Math.max(0, Math.ceil(60 - ph.t))}s`;
      setText(mission, ms);

      // direita: abates + próxima evolução (retrato só muda com o alvo)
      setText(kills, fmtInt(p.kills));
      const ctx = { save: hudSave(run), phase: ph.phase };
      // só evoluções descobertas aparecem; uma secreta com pistas vira "Greymon → ???" sem retrato
      const avail = knownAvailable(p, ctx), ready = avail.length > 0; // = canEvolve(run)
      const hint = visibleHint(p, ctx);
      const to = ready ? avail[0] : hint.kind === 'next' ? hint.to : '';
      const ek = `${hint.kind}:${to}:${ready ? 1 : 0}`;
      if (ek !== evoKey) {
        evoKey = ek;
        right.classList.toggle('ready', ready);
        evoPort.replaceChildren(...(to ? [portrait(to, { size: 36, silhouette: !ready })] : []));
        evoPort.classList.toggle('hidden', !to);
      }
      const evoLabel = ready ? FORMS[to]?.name ?? to : hint.kind === 'final' ? (p.matured ? 'Maturidade' : 'Forma final') : hint.kind === 'none' ? '—'
        : hint.kind === 'secret' ? `${FORMS[hint.from]?.name ?? hint.from} → ???` : FORMS[to]?.name ?? to;
      setText(evoName, evoLabel);
      evoName.classList.toggle('long', evoLabel.length > 12); // ex.: BlackWarGreymon não quebra no meio
      const secretText = hint.kind === 'secret' ? [evoMissingText(hint.missing), hint.hidden ? '???' : ''].filter(Boolean).join(' · ') : '';
      const baseText = ready ? `Digievoluir [${evolveKey()}]` : hint.kind === 'next' ? evoMissingText(hint.missing) : secretText;
      // sem evolução pronta, mas já dá para amadurecer: avisa a tecla
      const matText = !ready && canMature(p) ? `Maturidade [${evolveKey()}]` : '';
      setText(evoText, [baseText, matText].filter(Boolean).join(' · '));

      // golpes e cartas
      p.slots.forEach((s, i) => {
        const e = moveEls[i];
        e.el.classList.toggle('empty', !s);
        e.el.classList.toggle('sig', !!s && s.moveId === f.signature);
        e.el.classList.toggle('jogress', !!s?.jogress);
        if (!s) { setText(e.nm, ''); setText(e.lvl, ''); setH(e.cd, 0); return; }
        setText(e.nm, s.jogress ? `${MOVES[s.moveId].name} × ${MOVES[s.jogress.moveId]?.name ?? s.jogress.moveId}` : MOVES[s.moveId].name); setText(e.lvl, String(s.level));
        const total = moveCooldown(p, s); setH(e.cd, total > 0 ? (c.cooldowns[i] ?? 0) / total : 0);
      });
      p.passives.forEach((id, i) => {
        const e = cardEls[i];
        e.el.classList.toggle('empty', !id);
        setText(e.nm, id ? CARDS[id].name : ''); setText(e.lvl, id ? String(p.cardLevels[id] ?? 1) : '');
      });

      const boss = ph.bossId !== null ? run.pool.get(ph.bossId) : undefined;
      bossBar.classList.toggle('hidden', !boss);
      if (boss) { setW(bossFill, boss.hp / boss.maxHp); setText(bossName, BOSSES.find(b => b.id === boss.def)?.name ?? ''); }

      // seta para o objetivo (altar ou ponto mais próximo)
      let target: { x: number; z: number } | null = null;
      if (run.zone) target = run.zone.exit;
      else if (run.portals.length) target = run.portals[0]; // portal da Distorção some em 30 s: vem antes
      else if (run.jogressSpot) target = run.jogressSpot;
      else if (ph.bossUnlocked && !ph.bossActive) target = ph.bossAltar;
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
