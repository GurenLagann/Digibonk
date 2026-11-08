import { createApp } from '../src/app';
import { defaultSave } from '../src/core/save';
import { createRun, abandonRun } from '../src/sim/run';
import { fakeStorage } from './helpers';

const deps = (o: { unlocked?: string[] } = {}) => {
  const started: string[] = [];
  return { save: { ...defaultSave(), unlocked: o.unlocked ?? defaultSave().unlocked }, storage: fakeStorage({}), startRun: (id: string) => started.push(id), started };
};

test('starts on title', () => expect(createApp(deps()).screen()).toBe('title'));
test('partners() lists all 11 in season order and only the starters are unlocked', () => {
  const ps = createApp(deps()).partners();
  expect(ps.length).toBe(11);
  expect(ps.map(p => p.season)).toEqual([...ps.map(p => p.season)].sort((x, y) => ['adventure', 'adventure02', 'tamers'].indexOf(x) - ['adventure', 'adventure02', 'tamers'].indexOf(y)));
  expect(ps.slice(0, 5).map(p => p.id)).toEqual(['agumon', 'gabumon', 'patamon', 'tentomon', 'gatomon']);
  expect(ps[0]).toEqual({ id: 'agumon', childForm: 'agumon', season: 'adventure', locked: false });
  expect(ps.filter(p => !p.locked).map(p => p.id).sort()).toEqual(['agumon', 'guilmon', 'veemon']);
});
test('unlocked partner shows as available', () => {
  const a = createApp(deps({ unlocked: ['agumon', 'veemon', 'guilmon', 'wormmon'] }));
  expect(a.partners()).toContainEqual({ id: 'wormmon', childForm: 'wormmon', season: 'adventure02', locked: false });
});
test('picking an unlocked partner starts a run without any season', () => {
  const d = deps(); const a = createApp(d);
  a.go('partner'); expect(a.pickPartner('guilmon')).toBe(true); expect(d.started).toEqual(['guilmon']); expect(a.screen()).toBe('run');
});
test('locked partner cannot start', () => {
  const d = deps(); const a = createApp(d); a.go('partner');
  expect(a.pickPartner('gabumon')).toBe(false);
  expect(d.started).toEqual([]); expect(a.screen()).toBe('partner');
});
test('abandoning a run is a defeat and counts the run', () => {
  const storage = fakeStorage({}); const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage });
  const ev = abandonRun(r); expect(r.ended).toBe('defeat'); expect(ev).toContainEqual({ type: 'defeat' }); expect(r.save.records.runs).toBe(1);
});
