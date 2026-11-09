// @vitest-environment happy-dom
import { createApp } from '../../src/app';
import { defaultSave } from '../../src/core/save';
import type { Input } from '../../src/core/input';
import { activeModal } from '../../src/ui/modal';
import { showRecords } from '../../src/ui/records';
import { showTitle } from '../../src/ui/title';
import { fakeStorage } from '../helpers';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);

function setup(patch: (s: ReturnType<typeof defaultSave>) => void = () => {}) {
  const save = defaultSave(); patch(save);
  const app = createApp({ save, storage: fakeStorage({}), startRun: () => {} });
  const calls: string[] = [];
  const nav = { play: () => calls.push('play'), partners: () => calls.push('partners'), records: () => calls.push('records'), settings: () => calls.push('settings'), credits: () => calls.push('credits') };
  const root = document.createElement('div');
  const m = showTitle(root, app, save, nav, 'veemon');
  return { root, m, calls, save };
}

test('title shows the items and the progress from the save', () => {
  const { root } = setup(s => { s.records = { bestPhase: 3, wins: 2, runs: 14 }; s.unlocked = ['agumon', 'gabumon', 'patamon']; });
  for (const t of ['Jogar', 'Parceiros', 'Recordes', 'Controles', 'Créditos', 'Seus parceiros']) expect(root.textContent).toContain(t);
  expect(root.textContent).toContain('3 / 11');
  expect(root.textContent).toContain('14');
  expect(root.textContent).toContain('Vitórias');
  expect(root.textContent).toContain('Partidas');
});

test('confirm on the initial item plays; opt1 plays too', () => {
  const a = setup(); a.m.handle(press('confirm')); expect(a.calls).toEqual(['play']);
  const b = setup(); b.m.handle(press('opt1')); expect(b.calls).toEqual(['play']);
});


test('title registers as the active modal and closes cleanly', () => {
  const { m, root } = setup();
  expect(activeModal()).toBe(m);
  m.close(); expect(m.closed).toBe(true); expect(activeModal()).toBeNull(); expect(root.children.length).toBe(0);
});

test('records lists only unlocked partners with their numbers; cancel goes back', () => {
  const save = defaultSave();
  save.records = { bestPhase: 4, wins: 1, runs: 9 };
  save.partnerRecords = { agumon: { runs: 7, wins: 1, bestPhase: 4 } };
  const root = document.createElement('div'); let back = 0;
  const m = showRecords(root, save, () => { back++; });
  expect(root.querySelectorAll('.rec-row').length).toBe(save.unlocked.length);
  const row = root.querySelector('.rec-row[data-partner="agumon"]')!;
  expect(row.textContent).toContain('7'); expect(row.textContent).toContain('4');
  expect(root.querySelector('.rec-row[data-partner="gabumon"]')).toBeNull();
  expect(activeModal()).toBe(m);
  m.handle(press('cancel')); expect(back).toBe(1); expect(m.closed).toBe(true);
});

test('records: pause (Esc) and confirm also go back', () => {
  for (const a of ['pause', 'confirm']) {
    let back = 0; const m = showRecords(document.createElement('div'), defaultSave(), () => { back++; });
    m.handle(press(a)); expect(back).toBe(1);
  }
});


describe('menu no estilo de cartões', () => {
  test('barra do topo: último parceiro e números do progresso', () => {
    const { root } = setup(s => { s.records = { bestPhase: 2, wins: 1, runs: 5 }; s.discoveredEvos = ['agumon->greymon']; });
    const top = root.querySelector('.tt-top')!;
    expect(top.textContent).toContain('Veemon');
    expect(top.textContent).toMatch(/Evoluções\s*1 \/ \d+/);
    expect(top.textContent).toContain('Vitórias');
  });
  test('Jogar é o cartão grande; atalhos têm ícone, nome e número', () => {
    const { root } = setup();
    expect(root.querySelector('.tt-play')!.textContent).toContain('Jogar');
    expect(root.querySelectorAll('.tt-tile').length).toBe(2); // Controles e Créditos; Recordes fica ao lado do Jogar
  });
  test('painel "Seus parceiros" lista os liberados, do melhor resultado para o pior', () => {
    const { root } = setup(s => { s.partnerRecords = { agumon: { runs: 3, wins: 0, bestPhase: 2 }, guilmon: { runs: 9, wins: 2, bestPhase: 5 } }; });
    const rows = [...root.querySelectorAll('.tt-rank-row')].map(r => r.textContent ?? '');
    expect(rows).toHaveLength(3); // iniciais liberados
    expect(rows[0]).toContain('Guilmon');
  });
  test('setas seguem a posição na tela: Jogar | Parceiros/Recordes; atalhos embaixo', () => {
    const go = (...keys: string[]) => { const t = setup(); for (const k of keys) t.m.handle(press(k)); t.m.handle(press('confirm')); return t.calls[0]; };
    expect(go('right')).toBe('partners');
    expect(go('right', 'down')).toBe('records');
    expect(go('down')).toBe('settings');
    expect(go('down', 'right')).toBe('credits');
    expect(go('down', 'up')).toBe('play');
    expect(go('left')).toBe('play');
    expect(go('right', 'down', 'down')).toBe('credits');
    expect(go('right', 'left')).toBe('play');
  });
  test('cada cartão abre uma tela diferente', () => {
    const { root } = setup();
    const labels = [...root.querySelectorAll('.tt-card b, .tt-tile b')].map(e => e.textContent);
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).not.toContain('Evoluções');
  });
});
