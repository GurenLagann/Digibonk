// @vitest-environment happy-dom
import { damagePanel } from '../../src/ui/damage';
import { defaultSave } from '../../src/core/save';
import { createRun } from '../../src/sim/run';
import { logDamage } from '../../src/sim/damage';

test('painel da pausa: nome, total, % e dano/s', () => {
  const r = createRun({ partnerId: 'agumon', seed: 1, save: defaultSave(), storage: null });
  r.time = 10; logDamage(r.damage, 9, 'baby_flame', 150);
  const el = damagePanel(r);
  expect(el.textContent).toContain('Dano por golpe');
  const row = el.querySelector('.dmg-row')!.textContent!;
  expect(row).toContain('Baby Flame'); expect(row).toContain('150'); expect(row).toContain('100%'); expect(row).toContain('10/s');
});
