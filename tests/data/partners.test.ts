import { FORMS } from '../../src/data/forms';
import { PARTNERS } from '../../src/data/partners';
import { ITEMS } from '../../src/data/items';
import { T } from '../../src/data/tuning';
import { reachableStages, validateData } from '../../src/data/validate';
import { statAt } from '../../src/sim/stats';
import type { StatKey } from '../../src/data/types';

export function checkPartners(ids: string[], season: string) {
  for (const id of ids) {
    const p = PARTNERS.find(x => x.id === id);
    expect(p, id).toBeTruthy();
    expect(p!.season, id).toBe(season);
    expect(p!.starter, id).toBe(false);
    expect(reachableStages(p!.childForm), id).toContain('ultimate');
    expect(Object.values(ITEMS).some(i => i.kind === 'egg' && i.unlockPartner === id), `ovo de ${id}`).toBe(true);
  }
}

test('Adventure: Gabumon, Patamon, Tentomon and Gatomon reach Mega and have an egg', () => {
  checkPartners(['gabumon', 'patamon', 'tentomon', 'gatomon'], 'adventure');
  expect(PARTNERS.find(p => p.id === 'gatomon')!.childForm).toBe('salamon');
});

test('Adventure 02 and Tamers: Wormmon, Armadillomon, Terriermon and Renamon reach Mega and have an egg', () => {
  checkPartners(['wormmon', 'armadillomon'], 'adventure02');
  checkPartners(['terriermon', 'renamon'], 'tamers');
});

test('game data is valid', () => expect(validateData()).toEqual([]));

test('every stat requirement is reachable at its level with the level-up stat points', () => {
  for (const f of Object.values(FORMS)) for (const e of f.evolutions) {
    const req = e.req.minStats ?? {};
    const deficit = (Object.entries(req) as [StatKey, number][])
      .reduce((sum, [k, v]) => sum + Math.max(0, v - statAt(f.baseStats[k], f.growthRate, e.req.minLevel)), 0);
    expect(deficit, `${f.id} -> ${e.to}`).toBeLessThanOrEqual(T.STAT_OFFER_AMOUNT * (e.req.minLevel - 1));
  }
});
