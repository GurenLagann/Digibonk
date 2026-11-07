import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { availableEvolutions } from '../sim/evolution';
import { doEvolve, type RunState } from '../sim/run';
import { STAGE_NAMES } from './dom';
import { showChoice } from './modal';

export function canEvolve(run: RunState) { return availableEvolutions(run.prog, { save: run.save, phase: run.phase.phase }).length > 0; }

export function showEvolve(root: HTMLElement, run: RunState, onDone: (formId: string | null) => void) {
  const cur = FORMS[run.prog.formId];
  const forms = availableEvolutions(run.prog, { save: run.save, phase: run.phase.phase });
  return showChoice(root, {
    title: 'Digievolução!',
    subtitle: `${cur.name} pode digievoluir. Evoluir agora ou esperar por outra forma?`,
    options: forms.map(id => {
      const f = FORMS[id], b = f.baseStats;
      return { tag: STAGE_NAMES[f.stage], title: f.name,
        body: `Golpe: ${MOVES[f.signature].name} · Vida ${b.hp} · Atq ${Math.round(b.atk)} · Def ${Math.round(b.def)} · Vel ${Math.round(b.spd)}${f.evolutions.length === 0 && f.stage !== 'ultimate' ? ' · forma final' : ''}`,
        onPick: () => { doEvolve(run, id); onDone(id); } };
    }),
    extra: { title: 'Esperar', body: 'Manter a forma atual', onPick: () => onDone(null) },
  });
}
