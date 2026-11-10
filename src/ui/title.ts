import type { App } from '../app';
import { partnerRecord, type SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { PARTNERS } from '../data/partners';
import { h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { portrait } from './portrait';

export interface TitleNav { play(): void; partners(): void; records(): void; settings(): void; credits(): void; wiki?(): void }

/** página da wiki dos Digimon World (public/dw-wiki.html) */
export const WIKI_URL = './dw-wiki.html';

/** vizinho de cada item por seta (índices: 0 Jogar, 1 Parceiros, 2 Recordes, 3 Controles, 4 Créditos, 5 DW Wiki) */
const NAV = {
  right: [1, 1, 2, 4, 5, 5], left: [0, 0, 0, 3, 3, 4],
  down: [3, 2, 4, 3, 4, 5], up: [0, 1, 1, 0, 2, 2],
};

/** total de evoluções do jogo (para "Evoluções x / y") */
const TOTAL_EVOS = Object.values(FORMS).reduce((n, f) => n + f.evolutions.length, 0);

/**
 * Tela inicial em cartões: barra do topo (último parceiro + progresso), logo, cartão grande "Jogar" com dois cartões
 * ao lado, fileira de atalhos e o painel "Seus parceiros" (melhor resultado de cada um). Fundo: o Mundo Digital.
 * Setas percorrem os itens na ordem; confirm abre; opt1 joga.
 */
export function showTitle(root: HTMLElement, app: App, save: SaveData, nav: TitleNav, lastPartner = save.lastPartner || 'agumon'): Modal {
  const rec = save.records;
  const partners = app.partners();
  const unlocked = partners.filter(p => !p.locked);
  const last = PARTNERS.find(p => p.id === lastPartner) ?? PARTNERS[0];
  const lastForm = FORMS[last.childForm];
  const evos = save.discoveredEvos.length;

  const items: { go: () => void; el: HTMLElement }[] = [];
  const item = (el: HTMLElement, go: () => void) => {
    const i = items.length;
    el.addEventListener('click', () => go());
    el.addEventListener('mouseenter', () => select(i));
    items.push({ go, el });
    return el;
  };

  // barra do topo
  const chip = (label: string, value: string) => h('div', { class: 'tt-chip' }, h('span', { class: 'b2-label' }, label), h('b', {}, value));
  const top = h('div', { class: 'tt-top' },
    h('div', { class: 'tt-me' }, h('div', { class: 'tt-me-port' }, portrait(last.childForm, { size: 44 })),
      h('div', { class: 'tt-me-txt' }, h('b', {}, lastForm.name), h('span', { class: 'b2-label' }, 'Último parceiro'))),
    h('div', { class: 'tt-chips' },
      chip('Vitórias', String(rec.wins)), chip('Partidas', String(rec.runs)),
      chip('Parceiros', `${unlocked.length} / ${partners.length}`), chip('Evoluções', `${evos} / ${TOTAL_EVOS}`)));

  // cartão grande + cartões ao lado
  const play = item(h('button', { type: 'button', class: 'tt-card tt-play' },
    h('span', { class: 'tt-play-ico' }, '▶'),
    h('span', { class: 'tt-card-txt' }, h('b', {}, 'Jogar'), h('span', {}, `Modo clássico · melhor fase ${rec.bestPhase}`)),
    h('span', { class: 'b2-key' }, '1')), nav.play);
  const side = (cls: string, icon: string, title: string, sub: string, go: () => void) => item(h('button', { type: 'button', class: `tt-card tt-side ${cls}` },
    h('span', { class: 'tt-side-ico' }, icon), h('span', { class: 'tt-card-txt' }, h('b', {}, title), h('span', {}, sub))), go);
  const stack = h('div', { class: 'tt-stack' },
    side('tt-partners', '🥚', 'Parceiros', `${unlocked.length} / ${partners.length} liberados · evoluções e golpes`, nav.partners),
    side('tt-records', '🏆', 'Recordes', `Melhor fase ${rec.bestPhase} · ${rec.wins} vitórias`, nav.records));

  // fileira de atalhos
  const tile = (icon: string, title: string, sub: string, color: string, go: () => void) => item(h('button', { type: 'button', class: 'tt-tile', style: `--tt-c:${color}` },
    h('span', { class: 'tt-tile-ico' }, icon), h('span', { class: 'tt-tile-txt' }, h('b', {}, title), h('span', { class: 'b2-label' }, sub))), go);
  const tiles = h('div', { class: 'tt-tiles' },
    tile('⚙', 'Controles', 'Teclado · controle', '#3d9bff', nav.settings),
    tile('ⓘ', 'Créditos', 'Aviso legal', '#9a7dff', nav.credits),
    tile('📖', 'DW Wiki', 'Evoluções · DW 1–4', '#2fbf71', nav.wiki ?? (() => { window.location.href = WIKI_URL; })));

  // painel "Seus parceiros": liberados, do melhor resultado para o pior
  const ranked = unlocked.map(p => ({ p, r: partnerRecord(save, p.id) }))
    .sort((a, b) => b.r.bestPhase - a.r.bestPhase || b.r.wins - a.r.wins || b.r.runs - a.r.runs);
  const rank = h('div', { class: 'b2-panel tt-rank' },
    h('div', { class: 'tt-rank-head' }, h('b', {}, 'Seus parceiros'), h('span', { class: 'b2-label' }, 'melhor fase · vitórias')),
    h('div', { class: 'tt-rank-list' }, ...ranked.map(({ p, r }, i) => h('div', { class: 'tt-rank-row' + (i === 0 && r.runs ? ' first' : '') },
      h('span', { class: 'tt-rank-n' }, String(i + 1)), portrait(p.childForm, { size: 32 }),
      h('b', {}, FORMS[p.childForm]?.name ?? p.id),
      h('span', { class: 'tt-rank-v' }, r.runs ? `Fase ${r.bestPhase} · ${r.wins}V` : 'sem partidas')))));

  const screen = h('div', { class: 'b2-screen tt-screen' },
    h('img', { class: 'tt-bg', src: './ui/menu-bg.webp', alt: '', draggable: 'false' }),
    top,
    h('div', { class: 'tt-body' },
      h('div', { class: 'tt-main' },
        h('div', { class: 'tt-logo' },
          h('img', { class: 'title-logo-img', src: './ui/logo.webp', alt: 'DigiBonk', draggable: 'false' }),
          h('div', { class: 'b2-label' }, 'Survivor de Digimon · fan-game não oficial')),
        h('div', { class: 'tt-row' }, play, stack),
        tiles),
      rank),
    h('div', { class: 'b2-label title-legal' }, 'Digimon © Akiyoshi Hongo / Toei / Bandai · não afiliado'));
  root.append(screen);

  let sel = 0, closed = false;
  function select(i: number) { sel = (i + items.length) % items.length; items.forEach((it, j) => it.el.classList.toggle('b2-sel', j === sel)); }
  select(0);
  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      // posição na tela: 0 Jogar | 1 Parceiros / 2 Recordes (ao lado); 3 Controles | 4 Créditos | 5 DW Wiki (embaixo)
      if (input.pressed('right')) select(NAV.right[sel]);
      else if (input.pressed('left')) select(NAV.left[sel]);
      else if (input.pressed('down')) select(NAV.down[sel]);
      else if (input.pressed('up')) select(NAV.up[sel]);
      if (input.pressed('opt1')) return items[0].go();
      if (input.pressed('confirm')) items[sel].go();
    },
  };
  setActiveModal(m);
  return m;
}
