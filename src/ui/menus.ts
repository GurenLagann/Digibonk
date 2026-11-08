import { ACTIONS, DEFAULT_BINDINGS, type Action, type Input } from '../core/input';
import { storeSave, type SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import type { App } from '../app';
import type { RunState } from '../sim/run';
import { fmtTime, h } from './dom';
import { showChoice, type Modal } from './modal';
import { MOVES } from '../data/moves';

const ACTION_NAMES: Record<Action, string> = {
  up: 'Mover p/ cima', down: 'Mover p/ baixo', left: 'Mover p/ esquerda', right: 'Mover p/ direita',
  confirm: 'Confirmar', cancel: 'Cancelar / Esperar', evolve: 'Digievoluir', pause: 'Pausar', opt1: 'Opção 1', opt2: 'Opção 2', opt3: 'Opção 3',
};
const prettyCode = (c: string) => c.replace(/^Key/, '').replace(/^Digit/, '').replace(/^pad:b(\d+)$/, 'Controle botão $1').replace(/^Arrow/, 'Seta ');

export function showPartner(root: HTMLElement, app: App, save: SaveData, back: () => void) {
  const ps = app.partners();
  return showChoice(root, {
    title: 'Escolha seu parceiro',
    options: ps.map(p => p.locked
      ? { title: '???', tag: 'Bloqueado', body: 'Encontre o ovo deste Digimon nas fases', onPick: () => { showPartner(root, app, save, back); } }
      // o parceiro aparece pela forma Child (ex.: parceiro Gatomon começa como Salamon)
      : { title: FORMS[p.childForm].name, tag: 'Child', body: `Golpe inicial: ${MOVES[FORMS[p.childForm].signature].name}`, onPick: () => { app.pickPartner(p.id); } }),
    extra: { title: 'Voltar', onPick: () => { app.go('title'); back(); } },
  });
}

export function showPause(root: HTMLElement, onResume: () => void, onSettings: () => void, onQuit: () => void) {
  return showChoice(root, {
    title: 'Pausado',
    options: [
      { title: 'Continuar', onPick: onResume },
      { title: 'Controles', onPick: onSettings },
      { title: 'Desistir', body: 'Conta como derrota', onPick: onQuit },
    ],
    extra: { title: 'Continuar', onPick: onResume },
  });
}

export function showResults(root: HTMLElement, run: RunState, onAgain: () => void, onMenu: () => void) {
  const win = run.ended === 'victory';
  const path = run.prog.path.map(id => FORMS[id]?.name ?? id).join(' → ');
  const unlocked = run.unlockedThisRun.map(id => FORMS[id]?.name ?? id).join(', ');
  return showChoice(root, {
    title: win ? 'Vitória!' : 'Derrota',
    subtitle: `Fase ${run.phase.phase}/5 · Tempo ${fmtTime(run.time)} · Abates ${run.prog.kills} · Nível ${run.prog.level}` +
      `\nCaminho evolutivo: ${path}` + (unlocked ? `\nNovos parceiros: ${unlocked}` : ''),
    options: [
      { title: 'Jogar de novo', body: 'Mesmo parceiro', onPick: onAgain },
      { title: 'Menu', onPick: onMenu },
    ],
  });
}

export function showSettings(root: HTMLElement, input: Input, save: SaveData, storage: Storage | null | undefined, back: () => void) {
  const reopen = () => showSettings(root, input, save, storage, back);
  const m = showChoice(root, {
    title: 'Controles',
    subtitle: 'Escolha uma ação e aperte a tecla ou botão do controle novo. Analógico esquerdo sempre move.',
    columns: false,
    options: (['evolve', 'confirm', 'cancel', 'pause', 'up', 'down', 'left', 'right'] as Action[]).map(a => ({
      title: `${ACTION_NAMES[a]}: ${input.codesFor(a).map(prettyCode).join(' / ')}`,
      onPick: () => {
        const wait = showChoice(root, { title: `Aperte a nova tecla/botão para "${ACTION_NAMES[a]}"`, options: [] });
        void input.captureNext().then(code => {
          wait.close(); input.rebind(a, code); save.bindings = input.bindings(); storeSave(save, storage); reopen();
        });
      },
    })).concat([{ title: 'Restaurar padrão', onPick: () => { input.resetBindings(); save.bindings = {}; storeSave(save, storage); reopen(); } }]),
    extra: { title: 'Voltar', onPick: back },
  });
  return m;
}
void ACTIONS; void DEFAULT_BINDINGS;

export function showCredits(root: HTMLElement, back: () => void) {
  return showChoice(root, {
    title: 'Créditos e aviso legal',
    subtitle: 'DigiBonk é um fan-game gratuito, sem fins lucrativos e não oficial. Digimon e todos os nomes, personagens e golpes relacionados © Akiyoshi Hongo / Toei Animation / Bandai. Não afiliado nem endossado pelos detentores dos direitos. Sprites provisórios (placeholders) gerados pelo próprio jogo.',
    options: [],
    extra: { title: 'Voltar', onPick: back },
  });
}

export function overlayTitle(root: HTMLElement) { root.append(h('div', { class: 'title-bg' })); }
