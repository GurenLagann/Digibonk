// Correções adiadas dos planos 3 e 4.
import { offerPassive, replacePassive, maxedCards } from '../../src/sim/cards';
import { applyForm } from '../../src/sim/evolution';
import { newPlayerProg } from '../../src/sim/progression';
import { availableEvolutions } from '../../src/sim/evolution';
import { rollChest } from '../../src/sim/loot';
import { CARD_MAX_LEVEL } from '../../src/data/cards';
import { FORMS } from '../../src/data/forms';
import { MOVES } from '../../src/data/moves';
import { defaultSave } from '../../src/core/save';
import { createRng } from '../../src/core/rng';
import { placeholderLabel } from '../../src/render/placeholderLabel';

const three = ['card_gatomon_claws', 'card_birdramon_wings', 'card_hyper_speed'];

test('carta substituída esquece o nível', () => {
  const p = newPlayerProg('agumon'); three.forEach(c => offerPassive(p, c));
  p.cardLevels.card_birdramon_wings = 7;
  replacePassive(p, 1, 'card_data_magnet');
  expect(p.cardLevels.card_birdramon_wings).toBeUndefined();
});

test('maxedCards: passiva no nível máximo e slash com o golpe no máximo', () => {
  const p = newPlayerProg('agumon');
  offerPassive(p, 'card_hyper_speed'); p.cardLevels.card_hyper_speed = CARD_MAX_LEVEL;
  offerPassive(p, 'card_data_magnet'); p.cardLevels.card_data_magnet = CARD_MAX_LEVEL - 1;
  p.slots[1] = { moveId: 'lightning_paw', level: MOVES.lightning_paw.maxLevel, fromCard: true };
  expect(maxedCards(p).sort()).toEqual(['card_hyper_speed', 'card_lightning_paw']);
});

test('baú nunca sorteia carta no nível máximo', () => {
  const r = createRng(9);
  for (let i = 0; i < 3000; i++) expect(rollChest('agumon', defaultSave(), [], 1, r, ['card_hyper_speed']).ref).not.toBe('card_hyper_speed');
});

test('ao evoluir, a assinatura anterior que está no kit novo vai para um espaço livre com o nível', () => {
  const p = newPlayerProg('kyubimon'); p.slots[0]!.level = 4;
  applyForm(p, 'taomon');
  expect(p.slots[0]).toMatchObject({ moveId: FORMS.taomon.signature, level: 4 });
  expect(p.slots.filter(s => s?.moveId === 'fox_tail_inferno')).toEqual([{ moveId: 'fox_tail_inferno', level: 4, fromCard: false }]);
});

test('sem espaço livre a assinatura anterior não entra', () => {
  const p = newPlayerProg('kyubimon');
  for (let i = 1; i < p.slots.length; i++) p.slots[i] = { moveId: 'dragon_wheel', level: 1, fromCard: false };
  applyForm(p, 'taomon');
  expect(p.slots.some(s => s?.moveId === 'fox_tail_inferno')).toBe(false);
});

test('assinatura anterior fora do kit novo não é mantida', () => {
  const p = newPlayerProg('agumon');
  applyForm(p, 'greymon');
  expect(p.slots.some(s => s?.moveId === FORMS.agumon.signature)).toBe(false);
});

test('todo requisito de status de evolução trava no nível mínimo sem bônus', () => {
  const save = defaultSave();
  for (const f of Object.values(FORMS)) for (const e of f.evolutions) {
    if (!e.req.minStats) continue;
    const p = newPlayerProg(f.id); p.level = e.req.minLevel;
    p.items.push(...(e.req.items ?? []));
    const ctx = { save: { ...save, unlocked: [...save.unlocked, ...(e.req.unlocked ?? [])] }, phase: 5 };
    p.kills = e.req.minKills ?? 0;
    expect.soft(availableEvolutions(p, ctx), `${f.id} -> ${e.to}`).not.toContain(e.to);
  }
});

test('nomes de golpe não se repetem', () => {
  const names = Object.values(MOVES).map(m => m.name);
  expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
});

test('kit da Renamon só tem golpes canônicos', () => expect(FORMS.renamon.kit).not.toContain('leaf_storm'));

test('placeholders de formas diferentes têm rótulos diferentes', () => {
  const labels = Object.values(FORMS).map(f => placeholderLabel(f.name).join(' '));
  expect(labels.filter((l, i) => labels.indexOf(l) !== i)).toEqual([]);
});
