// @vitest-environment happy-dom
import type { Input } from '../../src/core/input';
import { defaultSave, type SaveData } from '../../src/core/save';
import { activeModal } from '../../src/ui/modal';
import { showRecords, sortPartners } from '../../src/ui/records';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);

function saveWith(): SaveData {
  const s = defaultSave();
  s.records = { bestPhase: 5, wins: 3, runs: 20, bestTime: 1400 };
  s.partnerRecords = {
    agumon: { runs: 8, wins: 2, bestPhase: 5, bestTime: 1400, bestKills: 900 },
    veemon: { runs: 6, wins: 1, bestPhase: 5, bestTime: 2500, bestKills: 1500 },
    guilmon: { runs: 6, wins: 0, bestPhase: 3, bestKills: 1200 },
  };
  return s;
}
const order = (root: HTMLElement) => [...root.querySelectorAll('.rec-row')].map(e => e.getAttribute('data-partner'));

beforeEach(() => { activeModal()?.close(); });

test('sortPartners: tempo crescente com sem-vitória no fim; vitórias/abates decrescentes, empate mantém a ordem', () => {
  const s = saveWith();
  expect(sortPartners(['guilmon', 'veemon', 'agumon'], s, 'time')).toEqual(['agumon', 'veemon', 'guilmon']);
  expect(sortPartners(['patamon', 'guilmon', 'agumon'], s, 'time')).toEqual(['agumon', 'patamon', 'guilmon']);
  expect(sortPartners(['guilmon', 'veemon', 'agumon'], s, 'wins')).toEqual(['agumon', 'veemon', 'guilmon']);
  expect(sortPartners(['agumon', 'veemon', 'guilmon'], s, 'kills')).toEqual(['veemon', 'guilmon', 'agumon']);
  expect(sortPartners(['guilmon', 'patamon'], s, 'wins')).toEqual(['guilmon', 'patamon']);
});

test('totais: mais rápido e contagem de medalhas; linha mostra medalha, tempo e abates', () => {
  const root = document.createElement('div');
  showRecords(root, saveWith(), () => {});
  const txt = root.textContent ?? '';
  expect(txt).toContain('Mais rápido'); expect(txt).toContain('23:20');
  expect(txt).toContain('🥇 1'); expect(txt).toContain('🥉 1'); expect(txt).toContain('🥈 0'); expect(txt).toContain('🏆 0');
  const ag = root.querySelector('.rec-row[data-partner="agumon"]')!.textContent!;
  expect(ag).toContain('🥇'); expect(ag).toContain('23:20'); expect(ag).toContain('900');
  const gu = root.querySelector('.rec-row[data-partner="guilmon"]')!.textContent!;
  expect(gu).toContain('—');
});

test('ordenação começa em Tempo; direita/esquerda e clique trocam', () => {
  const root = document.createElement('div');
  const m = showRecords(root, saveWith(), () => {});
  expect(order(root)).toEqual(['agumon', 'veemon', 'guilmon']);
  m.handle(press('right')); // Vitórias
  expect(order(root)).toEqual(['agumon', 'veemon', 'guilmon']);
  m.handle(press('right')); // Abates
  expect(order(root)).toEqual(['veemon', 'guilmon', 'agumon']);
  m.handle(press('left'));
  (root.querySelector('[data-sort="kills"]') as HTMLButtonElement).click();
  expect(order(root)).toEqual(['veemon', 'guilmon', 'agumon']);
  expect(root.querySelector('[data-sort="kills"]')!.classList.contains('active')).toBe(true);
});

test('Esc volta', () => {
  const root = document.createElement('div'); let back = 0;
  const m = showRecords(root, saveWith(), () => back++);
  m.handle(press('cancel')); expect(back).toBe(1); expect(m.closed).toBe(true);
});
