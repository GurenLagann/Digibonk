import './ui/style.css';
import { createApp } from './app';
import { createInput } from './core/input';
import { createFixedLoop } from './core/loop';
import { loadSave } from './core/save';
import { CARDS } from './data/cards';
import { ENEMIES } from './data/enemies';
import { FORMS } from './data/forms';
import { ITEMS } from './data/items';
import { T } from './data/tuning';
import { Billboards } from './render/billboards';
import { MapView } from './render/map';
import { createScene, follow } from './render/scene';
import { Vfx } from './render/vfx';
import { abandonRun, createRun, stepRun, type RunEvent, type RunState } from './sim/run';
import { showCardChoice } from './ui/cardmodal';
import { canEvolve, showEvolve } from './ui/evolve';
import { mountHud } from './ui/hud';
import { showLevelUp } from './ui/levelup';
import { showCredits, showPause, showResults, showSettings, showTitle } from './ui/menus';
import { activeModal } from './ui/modal';
import { mountToasts, toast } from './ui/toast';
import { installAutoPause } from './ui/autopause';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui')!;
const { renderer, scene, camera, resize } = createScene(canvas);
addEventListener('resize', resize);
const save = loadSave();
const input = createInput(window, () => (navigator.getGamepads ? [...navigator.getGamepads()] : []), save.bindings);
const debug = import.meta.env.DEV ? new URLSearchParams(location.search).get('debug')?.split(',') ?? [] : [];

const map = new MapView(scene);
const boards = new Billboards(scene, camera);
const vfx = new Vfx(scene);
const hud = mountHud(ui);
mountToasts(ui);

let run: RunState | null = null;
let lastPartner = 'agumon';
let events: RunEvent[] = [];
let resultsAt = 0;

const app = createApp({ save, storage: null, startRun });
const toTitle = () => { app.go('title'); hud.el.classList.add('hidden'); showTitle(ui, app, save, openSettings, () => showCredits(ui, toTitle)); };
function openSettings(back: () => void = toTitle) { showSettings(ui, input, save, undefined, back); }

function startRun(partnerId: string) {
  lastPartner = partnerId;
  run = createRun({ partnerId, seed: (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0, save });
  resultsAt = 0;
  hud.el.classList.remove('hidden');
  if (import.meta.env.DEV) (window as unknown as { __run: unknown }).__run = run;
  if (debug.includes('xp10')) run.debug.xpMul = 10;
  if (debug.includes('items')) run.debug.forceItems = true;
  if (debug.includes('spawn600')) for (let i = 0; i < T.MAX_ENEMIES; i++) run.pool.spawn(ENEMIES[i % ENEMIES.length], (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, { hp: 50, dmg: 0 });
  app.go('run');
}

function pause() {
  if (!run || run.ended || activeModal()) return;
  run.paused = true;
  const resume = () => { if (run) run.paused = false; };
  const open = () => showPause(ui, resume, () => openSettings(open), () => { if (run) abandonRun(run).forEach(announce); });
  open();
}
installAutoPause(document, pause, window);

function announce(e: RunEvent) {
  switch (e.type) {
    case 'cardFound': toast(`Carta: ${CARDS[e.cardId].name}`, CARDS[e.cardId].kind === 'rare' ? 'rare' : 'info'); break;
    case 'itemFound': toast(`${ITEMS[e.itemId].name}!`, 'rare'); break;
    case 'partnerUnlocked': toast(`Ovo encontrado! ${FORMS[e.partnerId]?.name ?? e.partnerId} desbloqueado!`, 'rare'); break;
    case 'evolutionAvailable': toast('Digievolução disponível! Aperte E', 'rare'); break;
    case 'bossUnlocked': toast('Missão cumprida! O chefe foi liberado', 'rare'); break;
    case 'bossStarted': toast('O chefe apareceu!', 'warn'); break;
    case 'minibossSpawned': toast('Um guardião apareceu!', 'warn'); break;
    case 'overtime': toast('O tempo acabou! Hordas insanas chegando!', 'warn'); break;
    case 'phaseCleared': toast(`Fase ${e.phase} concluída!`, 'rare'); break;
    case 'victory': toast('VITÓRIA!', 'rare'); resultsAt = performance.now() + 1500; break;
    case 'defeat': toast('Seu Digimon caiu...', 'warn'); resultsAt = performance.now() + 1500; break;
  }
}

const loop = createFixedLoop(1 / 60, 0.25, dt => {
  input.poll();
  const modal = activeModal();
  if (modal) { modal.handle(input); return; }
  if (!run || app.screen() !== 'run') return;
  if (run.ended) {
    if (resultsAt && performance.now() >= resultsAt) {
      resultsAt = 0; app.go('results'); const r = run;
      showResults(ui, r, () => startRun(lastPartner), () => { run = null; toTitle(); });
    }
    return;
  }
  if (input.pressed('pause')) { pause(); return; }
  if (run.offers) { showLevelUp(ui, run); return; }
  if (run.pendingCard) { showCardChoice(ui, run); return; }
  if (input.pressed('evolve') && canEvolve(run)) { showEvolve(ui, run, id => id && toast(`Digievoluiu para ${FORMS[id].name}!`, 'rare')); return; }
  const ev = stepRun(run, input.move(), dt);
  ev.forEach(announce);
  events.push(...ev);
});

let last = performance.now();
function frame(now: number) {
  const dt = (now - last) / 1000; last = now;
  loop.advance(dt);
  const t = now / 1000;
  if (run) {
    follow(camera, run.px, run.pz);
    map.sync(run, t);
    boards.sync(run, t);
    vfx.sync(run, events, Math.min(dt, 0.25), t);
    hud.update(run);
  } else {
    camera.position.set(Math.cos(t * 0.05) * 30, 20, Math.sin(t * 0.05) * 30);
    camera.lookAt(0, 0, 0);
  }
  events = [];
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
toTitle();
requestAnimationFrame(frame);
