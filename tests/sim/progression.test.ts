import { newPlayerProg, addXp, rollOffers, applyOffer, xpToNext, trackNearDeath, nothingToImprove, autoGain, offerKey, RARITIES } from '../../src/sim/progression';
import { createRng } from '../../src/core/rng';
import { T } from '../../src/data/tuning';
import { maxedProg } from '../helpers';
import { buildPrefs } from '../../src/sim/build';

test('xp curve grows', () => expect(xpToNext(10)).toBeGreaterThan(xpToNext(1)));
test('multiple level ups queue', () => {
  const p = newPlayerProg('agumon'); const n = addXp(p, 500);
  expect(n).toBeGreaterThan(1); expect(p.pendingLevelUps).toBe(n); expect(p.level).toBe(1 + n);
});
test('offers never learn a move already slotted', () => {
  const p = newPlayerProg('agumon'); const r = createRng(3);
  for (let i = 0; i < 200; i++) rollOffers(p, r).forEach(o => { if (o.kind === 'learn') expect(o.moveId).not.toBe('baby_flame'); });
});
test('offers are 3 and distinct', () => {
  const p = newPlayerProg('agumon'); const r = createRng(5);
  for (let i = 0; i < 100; i++) { const o = rollOffers(p, r); expect(o).toHaveLength(3); expect(new Set(o.map(x => JSON.stringify(x))).size).toBe(3); }
});
test('offers fall back to stats when nothing else is possible', () => {
  const p = maxedProg('agumon');
  const offers = rollOffers(p, createRng(1)); expect(offers).toHaveLength(3);
  expect(offers.every(o => o.kind === 'stat' || o.kind === 'card')).toBe(true);
});
test('learn fills first empty slot', () => {
  const p = newPlayerProg('agumon'); p.pendingLevelUps = 1; applyOffer(p, { kind: 'learn', moveId: 'sharp_claws' });
  expect(p.slots[1]).toEqual({ moveId: 'sharp_claws', level: 1, fromCard: false }); expect(p.pendingLevelUps).toBe(0);
});
test('upgrade and stat offers apply', () => {
  const p = newPlayerProg('agumon');
  applyOffer(p, { kind: 'upgrade', slot: 0 }); expect(p.slots[0]!.level).toBe(2);
  applyOffer(p, { kind: 'stat', stat: 'atk', amount: 3 }); expect(p.bonus.atk).toBe(3);
});

describe('trackNearDeath', () => {
  test('counts once per drop below 25% and rearms at 50%', () => {
    const p = newPlayerProg('agumon');
    expect(trackNearDeath(p, 80, 100)).toBe(false);
    expect(trackNearDeath(p, 20, 100)).toBe(true);
    expect(trackNearDeath(p, 10, 100)).toBe(false); // ainda na mesma queda
    expect(trackNearDeath(p, 40, 100)).toBe(false); // curou, mas não o bastante para rearmar
    expect(trackNearDeath(p, 20, 100)).toBe(false);
    trackNearDeath(p, 50, 100);
    expect(trackNearDeath(p, 24, 100)).toBe(true);
    expect(p.nearDeaths).toBe(2);
  });
  test('death does not count', () => {
    const p = newPlayerProg('agumon');
    expect(trackNearDeath(p, 0, 100)).toBe(false); expect(p.nearDeaths).toBe(0);
  });
});

describe('nível infinito: ganho automático quando não há o que melhorar', () => {
  const fullCards = (p: ReturnType<typeof newPlayerProg>) => { p.passives = ['card_greymon_horn', 'card_hyper_speed', 'card_hyper_speed']; return p; };
  test('nothingToImprove só com golpes no máximo, espaços cheios e cartas cheias', () => {
    expect(nothingToImprove(newPlayerProg('agumon'))).toBe(false);
    expect(nothingToImprove(maxedProg('agumon'))).toBe(false); // ainda há espaço de carta
    expect(nothingToImprove(fullCards(maxedProg('agumon')))).toBe(true);
  });
  test('autoGain soma um ganho pequeno num status sorteado e consome o nível pendente', () => {
    const p = fullCards(maxedProg('agumon')); p.pendingLevelUps = 2;
    const g = autoGain(p, createRng(3));
    expect(['hp', 'atk', 'def', 'spd', 'brain']).toContain(g.stat);
    expect(g.amount).toBe(g.stat === 'hp' ? 3 : 1);
    expect(p.bonus[g.stat]).toBe(g.amount);
    expect(p.pendingLevelUps).toBe(1);
  });
});

describe('raridade das cartas', () => {
  test('status, melhoria e carta têm raridade; golpe novo não', () => {
    const p = newPlayerProg('agumon'); const r = createRng(7);
    for (let i = 0; i < 200; i++) for (const o of rollOffers(p, r)) {
      if (o.kind === 'learn') expect(o.rarity).toBeUndefined();
      else expect(RARITIES).toContain(o.rarity);
      if (o.kind === 'stat') expect(o.amount).toBe(T.RARITY.statAmount[o.rarity!]);
    }
  });
  test('as raridades aparecem perto dos pesos (Comum mais, Lendário menos)', () => {
    const p = newPlayerProg('agumon'); const r = createRng(11); const c: Record<string, number> = {};
    for (let i = 0; i < 3000; i++) for (const o of rollOffers(p, r)) if (o.rarity) c[o.rarity] = (c[o.rarity] ?? 0) + 1;
    expect(c.common).toBeGreaterThan(c.uncommon); expect(c.uncommon).toBeGreaterThan(c.rare); expect(c.rare).toBeGreaterThan(c.legendary);
    expect(c.legendary).toBeGreaterThan(0);
  });
  test('melhoria rara sobe 2 níveis sem passar do máximo', () => {
    const p = newPlayerProg('agumon');
    applyOffer(p, { kind: 'upgrade', slot: 0, rarity: 'rare' }); expect(p.slots[0]!.level).toBe(3);
    p.slots[0]!.level = 4; applyOffer(p, { kind: 'upgrade', slot: 0, rarity: 'legendary' }); expect(p.slots[0]!.level).toBe(5);
  });
  test('carta lendária entra no nível 3', () => {
    const p = newPlayerProg('agumon');
    applyOffer(p, { kind: 'card', cardId: 'card_hyper_speed', rarity: 'legendary' });
    expect(p.passives[0]).toBe('card_hyper_speed'); expect(p.cardLevels.card_hyper_speed).toBe(3);
  });
  test('ofertas banidas não aparecem', () => {
    const p = newPlayerProg('agumon'); const r = createRng(2);
    const banned = new Set(['stat:atk', 'learn:sharp_claws']);
    for (let i = 0; i < 200; i++) for (const o of rollOffers(p, r, banned)) expect(banned.has(offerKey(p, o))).toBe(false);
  });
});

describe('rollOffers com count', () => {
  test('4 ofertas com quase tudo banido: sem undefined nem chaves repetidas', () => {
    const p = maxedProg('agumon'); const r = createRng(5);
    const banned = new Set(['stat:hp', 'stat:atk', 'stat:def', 'stat:spd']);
    for (let i = 0; i < 100; i++) {
      const o = rollOffers(p, r, banned, 4);
      expect(o.every(x => x !== undefined)).toBe(true);
      const keys = o.map(x => offerKey(p, x)); expect(new Set(keys).size).toBe(keys.length);
      expect(o.length).toBeLessThanOrEqual(4);
    }
  });
  test('count 4 devolve 4 num prog novo', () => {
    expect(rollOffers(newPlayerProg('agumon'), createRng(1), new Set(), 4)).toHaveLength(4);
  });
});

describe('★/✕ no sorteio', () => {
  const roll = (seed: number, prefs?: ReturnType<typeof buildPrefs>) => { const p = newPlayerProg('agumon'); const r = createRng(seed); return Array.from({ length: 50 }, () => rollOffers(p, r, new Set(), 3, prefs)); };

  test('sem prefs e com build vazia, a sequência é idêntica', () => {
    expect(roll(42, buildPrefs({ fav: [], ban: [], path: [] }))).toEqual(roll(42));
    expect(roll(42, undefined)).toEqual(roll(42));
  });
  test('✕ nunca aparece como golpe novo, melhoria ou carta', () => {
    const prefs = buildPrefs({ fav: [], ban: ['move:sharp_claws', 'move:baby_flame', 'card:card_hyper_speed'], path: [] });
    for (let seed = 1; seed <= 40; seed++) for (const offers of roll(seed, prefs)) for (const o of offers) {
      if (o.kind === 'learn') expect(o.moveId).not.toBe('sharp_claws');
      if (o.kind === 'upgrade') expect(o.slot).not.toBe(0); // slot 0 = baby_flame
      if (o.kind === 'card') expect(o.cardId).not.toBe('card_hyper_speed');
    }
  });
  test('★ aparece mais que sem marca', () => {
    const count = (prefs?: ReturnType<typeof buildPrefs>) => { let n = 0; for (let s = 1; s <= 60; s++) for (const offers of roll(s, prefs)) n += offers.filter(o => o.kind === 'learn' && o.moveId === 'pepper_breath_rain').length; return n; };
    expect(count(buildPrefs({ fav: ['move:pepper_breath_rain'], ban: [], path: [] }))).toBeGreaterThan(count());
  });
  test('com tudo do kit em ✕, status preenchem as 3 opções', () => {
    const prefs = buildPrefs({ fav: [], ban: ['move:baby_flame', 'move:sharp_claws', 'move:spitfire_blast', 'move:pepper_breath_rain'], path: [] });
    for (const offers of roll(7, prefs)) { expect(offers).toHaveLength(3); expect(offers.every(o => o.kind === 'stat' || o.kind === 'card')).toBe(true); }
  });
});
