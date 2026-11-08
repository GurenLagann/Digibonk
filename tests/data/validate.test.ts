import { validateData, reachableStages } from '../../src/data/validate';
import { MOVES } from '../../src/data/moves';
import { FORMS } from '../../src/data/forms';
import { PARTNERS } from '../../src/data/partners';
import { BOSSES } from '../../src/data/enemies';

test('data is internally consistent', () => expect(validateData()).toEqual([]));
test('every starter line reaches an ultimate', () => {
  for (const p of PARTNERS.filter(p => p.starter)) expect(reachableStages(p.childForm)).toContain('ultimate');
});
test('omnimon requires gabumon unlocked', () =>
  expect(FORMS.wargreymon.evolutions.find(e => e.to === 'omnimon')!.req.unlocked).toContain('gabumon'));
test('paildramon requires wormmon unlocked', () =>
  expect(FORMS.exveemon.evolutions.find(e => e.to === 'paildramon')!.req.unlocked).toContain('wormmon'));
test('one boss per phase', () => expect(BOSSES.map(b => b.phase).sort()).toEqual([1, 2, 3, 4, 5]));
test('armor forms are dead ends', () => {
  expect(FORMS.flamedramon.evolutions).toEqual([]); expect(FORMS.raidramon.evolutions).toEqual([]);
});
test('gallantmon needs blue card', () =>
  expect(FORMS.wargrowlmon.evolutions.find(e => e.to === 'gallantmon')!.req.items).toContain('blue_card'));
test('todo golpe tem descrição curta', () => {
  for (const m of Object.values(MOVES)) {
    expect.soft(m.description, m.id).toMatch(/\S/);
    expect.soft(m.description.length, m.id).toBeLessThanOrEqual(90);
  }
});
