import { ACTIONS, DEFAULT_BINDINGS, type Action, type Input } from '../core/input';
import { storeSave, type SaveData } from '../core/save';
import type { App } from '../app';
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

export const CREDITS_TEXT = [
  'DigiBonk é um projeto de fã, gratuito, sem fins lucrativos e sem vínculo com a Bandai Namco, a Toei Animation ou qualquer detentor dos direitos. Digimon, seus personagens, nomes e imagens são © Akiyoshi Hongo, Toei Animation e Bandai.',
  'Sprites do Digimon World 3 (Agumon, Veemon, Guilmon, Bakemon, Guardromon): rips de Ragey e Artzei no The Spriters Resource.',
  'Sprites de V-pet: extraídos dos aparelhos Digimon Vital Bracelet e Pendulum Color (© Bandai), consultados no acervo humulos.com.',
  'Folhas geradas no ChatGPT: Greymon, MetalGreymon, WarGreymon, Omnimon, ExVeemon, Growlmon, WarGrowlmon e Gallantmon.',
  'As primeiras folhas do Greymon e do MetalGreymon foram geradas com o Google Gemini e depois substituídas pelas do ChatGPT.',
  'Inspiração: PokéBonk (a referência principal), Megabonk e Digimon World 1.',
  'Se você é detentor de direitos e quer a remoção de algum material, abra uma issue no repositório.',
].join('\n\n');

export function showCredits(root: HTMLElement, back: () => void) {
  return showChoice(root, {
    title: 'Créditos e aviso legal',
    subtitle: CREDITS_TEXT,
    options: [],
    extra: { title: 'Voltar', onPick: back },
  });
}
