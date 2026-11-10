// @vitest-environment happy-dom
import { mountDebugPanel, type DebugActions } from '../../src/ui/debugpanel';

function actions(log: string[]): DebugActions {
  let god = false;
  return {
    forms: [{ id: 'greymon', name: 'Greymon' }, { id: 'wargreymon', name: 'WarGreymon' }],
    cards: [{ id: 'card_greymon_horn', name: 'Chifre do Greymon' }],
    items: [{ id: 'fusion_garurumon', name: 'Dados de Fusão' }],
    evolve: id => log.push('evolve:' + id), levelUp: () => log.push('level'), card: id => log.push('card:' + id),
    item: id => log.push('item:' + id), heal: () => log.push('heal'), killAll: () => log.push('kill'),
    die: () => log.push('die'), summon: id => log.push('summon:' + id),
    summons: [{ id: 'gazimon', name: 'Gazimon', group: 'inimigos' }, { id: 'devimon', name: 'Devimon', group: 'chefes' }],
    god: () => (god = !god),
    doubleSpeed: () => false,
    revealAll: () => log.push('reveal'), forgetAll: () => log.push('forget'),
  };
}
const btn = (root: HTMLElement, text: string) => [...root.querySelectorAll('button')].find(b => b.textContent === text)!;

test('buttons call the matching actions', () => {
  const root = document.createElement('div'); const log: string[] = [];
  mountDebugPanel(root, actions(log));
  btn(root, 'WarGreymon').click(); btn(root, '+1 nível').click(); btn(root, 'Chifre do Greymon').click();
  btn(root, 'Dados de Fusão').click(); btn(root, 'Curar').click(); btn(root, 'Matar todos').click();
  expect(log).toEqual(['evolve:wargreymon', 'level', 'card:card_greymon_horn', 'item:fusion_garurumon', 'heal', 'kill']);
});

test('god button shows its state', () => {
  const root = document.createElement('div');
  mountDebugPanel(root, actions([]));
  btn(root, 'Invencível: não').click();
  expect(btn(root, 'Invencível: sim')).toBeTruthy();
});

test('toggle hides and shows the panel', () => {
  const root = document.createElement('div');
  const p = mountDebugPanel(root, actions([]));
  expect(p.el.classList.contains('hidden')).toBe(false);
  p.toggle(); expect(p.el.classList.contains('hidden')).toBe(true);
});

test('double speed button shows its state', () => {
  const root = document.createElement('div');
  let on = false;
  mountDebugPanel(root, { ...actions([]), doubleSpeed: () => (on = !on) });
  btn(root, 'Velocidade 2×: não').click();
  expect(btn(root, 'Velocidade 2×: sim')).toBeTruthy();
});

test('botões de revelar e esquecer evoluções', () => {
  const root = document.createElement('div'); const log: string[] = [];
  mountDebugPanel(root, actions(log));
  btn(root, 'Revelar todas as evoluções').click(); btn(root, 'Esquecer evoluções').click();
  expect(log).toEqual(['reveal', 'forget']);
});

test('Morrer e Invocar (uma seção por grupo)', () => {
  const root = document.createElement('div'); const log: string[] = [];
  mountDebugPanel(root, actions(log));
  btn(root, 'Morrer').click(); btn(root, 'Gazimon').click(); btn(root, 'Devimon').click();
  expect(log).toEqual(['die', 'summon:gazimon', 'summon:devimon']);
  const titles = [...root.querySelectorAll('.dbg-title')].map(t => t.textContent);
  expect(titles).toContain('Invocar — inimigos');
  expect(titles).toContain('Invocar — chefes');
});
