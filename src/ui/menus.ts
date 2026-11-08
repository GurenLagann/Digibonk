import { ACTIONS, DEFAULT_BINDINGS, type Action, type Input } from '../core/input';
import { storeSave, type SaveData } from '../core/save';
import type { App } from '../app';
import { h } from './dom';
import { showChoice, type Modal } from './modal';

const ACTION_NAMES: Record<Action, string> = {
  up: 'Mover p/ cima', down: 'Mover p/ baixo', left: 'Mover p/ esquerda', right: 'Mover p/ direita',
  confirm: 'Confirmar', cancel: 'Cancelar / Esperar', evolve: 'Digievoluir', pause: 'Pausar', opt1: 'Opção 1', opt2: 'Opção 2', opt3: 'Opção 3',
};
const prettyCode = (c: string) => c.replace(/^Key/, '').replace(/^Digit/, '').replace(/^pad:b(\d+)$/, 'Controle botão $1').replace(/^Arrow/, 'Seta ');

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
