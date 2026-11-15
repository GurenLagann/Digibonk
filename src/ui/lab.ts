import { buyLab, labLevel, nextLabCost } from '../core/lab';
import { storeSave, type SaveData } from '../core/save';
import { LAB_LIST } from '../data/lab';
import { h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { btn, panel } from './theme';

/** Laboratório: gasta Cristais 💠 em melhorias permanentes. ↑↓ escolhe, confirmar compra, Esc/Voltar sai. */
export function showLab(root: HTMLElement, save: SaveData, back: () => void, storage?: Storage | null): Modal {
  let sel = 0, closed = false;
  const balance = h('strong', { class: 'lab-balance' });
  const list = h('div', { class: 'lab-list' });

  function buy(i: number) {
    if (!buyLab(save, LAB_LIST[i].id)) return;
    storeSave(save, storage);
    render();
  }
  function render() {
    balance.textContent = `${save.currency.toLocaleString('pt-BR')} 💠`;
    list.replaceChildren(...LAB_LIST.map((d, i) => {
      const lv = labLevel(save, d.id), cost = nextLabCost(save, d.id), max = d.costs.length;
      const can = cost !== null && save.currency >= cost;
      const buyBtn = h('button', { class: 'b2-btn lab-buy', type: 'button', disabled: !can, onClick: (e: Event) => { e.stopPropagation(); buy(i); } },
        h('span', { class: 'b2-btn-label' }, cost === null ? 'Máx' : `Comprar · ${cost} 💠`));
      buyBtn.disabled = !can;
      const row = h('div', { class: 'b2-panel lab-row' + (i === sel ? ' b2-sel' : ''), 'data-lab': d.id },
        h('div', { class: 'lab-info' }, h('strong', { class: 'lab-name' }, d.name), h('span', { class: 'b2-label' }, d.description)),
        h('div', { class: 'lab-pips', title: `${lv}/${max}` },
          ...Array.from({ length: max }, (_, k) => h('span', { class: 'lab-pip' + (k < lv ? ' on' : '') })),
          h('b', {}, `${lv}/${max}`)),
        buyBtn);
      row.addEventListener('mouseenter', () => { sel = i; list.querySelectorAll('.lab-row').forEach((el, j) => el.classList.toggle('b2-sel', j === i)); });
      return row;
    }));
  }

  const screen = h('div', { class: 'b2-screen lab-screen' },
    h('div', { class: 'lab-head' }, h('h1', { class: 'b2-title' }, 'Laboratório'),
      panel(h('span', { class: 'b2-label' }, 'Cristais'), balance),
      btn('Voltar', 'Esc', () => { if (!closed) { m.close(); back(); } }, true)),
    list,
    h('div', { class: 'b2-label lab-hint' }, '↑ ↓ escolher · Enter comprar · Esc voltar'));
  render();
  root.append(screen);
  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      const n = LAB_LIST.length;
      if (input.pressed('down')) { sel = (sel + 1) % n; render(); }
      else if (input.pressed('up')) { sel = (sel + n - 1) % n; render(); }
      else if (input.pressed('confirm')) buy(sel);
      else if (input.pressed('cancel') || input.pressed('pause')) { m.close(); back(); }
    },
  };
  setActiveModal(m);
  return m;
}
