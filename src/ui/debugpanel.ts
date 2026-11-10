/** Painel de debug (só no modo dev, com ?debug na URL). F2 mostra/esconde. */
import { h } from './dom';

export interface DebugEntry { id: string; name: string }
export interface DebugActions {
  forms: DebugEntry[]; cards: DebugEntry[]; items: DebugEntry[];
  /** inimigos, mini-chefes e chefes que dá para invocar, com o grupo de cada um */
  summons: (DebugEntry & { group: string })[];
  evolve(id: string): void; levelUp(): void; card(id: string): void; item(id: string): void;
  heal(): void; killAll(): void; die(): void; summon(id: string): void;
  /** alterna invencibilidade e devolve o novo estado */
  god(): boolean;
  /** alterna velocidade dobrada (para ver a corrida) e devolve o novo estado */
  doubleSpeed(): boolean;
  /** marca todas as evoluções como descobertas / volta tudo a secreto (no save, sem precisar de partida) */
  revealAll(): void; forgetAll(): void;
}

export function mountDebugPanel(root: HTMLElement, a: DebugActions): { el: HTMLElement; toggle(): void; setAnim(form: string, missing: string[]): void } {
  // botão perde o foco depois do clique, para o teclado continuar indo pro jogo
  const b = (label: string, fn: (btn: HTMLButtonElement) => void) => {
    const btn = h('button', { class: 'dbg-btn', type: 'button' }, label);
    btn.addEventListener('click', () => { fn(btn); btn.blur(); });
    return btn;
  };
  const section = (title: string, ...btns: HTMLElement[]) => h('div', { class: 'dbg-sec' }, h('div', { class: 'dbg-title' }, title), h('div', { class: 'dbg-grid' }, ...btns));
  // marcação das animações que faltam no sprite da forma atual (o jogo usa um quadro padrão no lugar)
  const anim = h('div', { class: 'dbg-anim' }, '—');
  const el = h('div', { class: 'dbg-panel' },
    h('div', { class: 'dbg-head' }, 'DEBUG (F2)'),
    h('div', { class: 'dbg-sec' }, h('div', { class: 'dbg-title' }, 'Animações faltando (forma atual)'), anim),
    section('Geral',
      b('+1 nível', () => a.levelUp()), b('Curar', () => a.heal()), b('Matar todos', () => a.killAll()), b('Morrer', () => a.die()),
      b('Invencível: não', btn => { btn.textContent = `Invencível: ${a.god() ? 'sim' : 'não'}`; }),
      b('Velocidade 2×: não', btn => { btn.textContent = `Velocidade 2×: ${a.doubleSpeed() ? 'sim' : 'não'}`; }),
      b('Revelar todas as evoluções', () => a.revealAll()), b('Esquecer evoluções', () => a.forgetAll())),
    section('Evoluir para', ...a.forms.map(f => b(f.name, () => a.evolve(f.id)))),
    ...[...new Set(a.summons.map(s => s.group))].map(g =>
      section(`Invocar — ${g}`, ...a.summons.filter(s => s.group === g).map(s => b(s.name, () => a.summon(s.id))))),
    section('Cartas', ...a.cards.map(c => b(c.name, () => a.card(c.id)))),
    section('Itens', ...a.items.map(i => b(i.name, () => a.item(i.id)))),
  );
  root.append(el);
  return {
    el, toggle: () => el.classList.toggle('hidden'),
    setAnim: (form, missing) => {
      anim.textContent = missing.length ? `${form}: ${missing.join(', ')}` : `${form}: completo`;
      anim.classList.toggle('dbg-anim-ok', !missing.length);
    },
  };
}
