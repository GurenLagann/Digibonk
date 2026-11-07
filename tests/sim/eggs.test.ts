import { eligibleItems } from '../../src/sim/loot';
import { createRun } from '../../src/sim/run';
import { debugGiveItem } from '../../src/sim/debug';
import { defaultSave } from '../../src/core/save';

const UNLOCKABLE = ['gabumon', 'patamon', 'tentomon', 'gatomon', 'wormmon', 'armadillomon', 'terriermon', 'renamon'];

test.each(UNLOCKABLE)('%s: egg drops while locked, never after', id => {
  const save = defaultSave();
  expect(eligibleItems('agumon', save, []).map(i => i.id)).toContain(`egg_${id}`);
  save.unlocked.push(id);
  expect(eligibleItems('agumon', save, []).map(i => i.id)).not.toContain(`egg_${id}`);
});

test.each(UNLOCKABLE)('%s: picking the egg unlocks the partner for good', id => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  const ev = debugGiveItem(r, `egg_${id}`);
  expect(ev).toContainEqual({ type: 'partnerUnlocked', partnerId: id });
  expect(r.save.unlocked).toContain(id);
});
