import { createApp } from '../src/app';
import { defaultSave } from '../src/core/save';
import { createRun, abandonRun } from '../src/sim/run';
import { fakeStorage } from './helpers';

const deps = (o: { unlocked?: string[] } = {}) => {
  const started: string[] = [];
  return { save: { ...defaultSave(), unlocked: o.unlocked ?? defaultSave().unlocked }, storage: fakeStorage({}), startRun: (id: string) => started.push(id), started };
};

test('starts on title', () => expect(createApp(deps()).screen()).toBe('title'));
test('locked partners are listed but locked', () => {
  const a = createApp(deps());
  expect(a.partnersFor('adventure')).toEqual([{ id: 'agumon', childForm: 'agumon', locked: false }, { id: 'gabumon', childForm: 'gabumon', locked: true }]);
});
test('unlocked partner shows as available', () => {
  const a = createApp(deps({ unlocked: ['agumon', 'veemon', 'guilmon', 'wormmon'] }));
  expect(a.partnersFor('adventure02')).toContainEqual({ id: 'wormmon', childForm: 'wormmon', locked: false });
});
test('season then partner starts a run', () => {
  const d = deps(); const a = createApp(d);
  a.go('season'); a.selectSeason('tamers'); expect(a.screen()).toBe('partner'); expect(a.season()).toBe('tamers');
  a.pickPartner('guilmon'); expect(d.started).toEqual(['guilmon']); expect(a.screen()).toBe('run');
});
test('locked partner cannot start', () => {
  const d = deps(); const a = createApp(d); a.selectSeason('adventure'); a.pickPartner('gabumon');
  expect(d.started).toEqual([]); expect(a.screen()).toBe('partner');
});
test('abandoning a run is a defeat and counts the run', () => {
  const storage = fakeStorage({}); const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage });
  const ev = abandonRun(r); expect(r.ended).toBe('defeat'); expect(ev).toContainEqual({ type: 'defeat' }); expect(r.save.records.runs).toBe(1);
});
