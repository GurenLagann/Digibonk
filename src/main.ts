import './ui/style.css';
import { createFixedLoop } from './core/loop';
import { createInput } from './core/input';
import { loadSave } from './core/save';
import { T } from './data/tuning';
import { ENEMIES } from './data/enemies';
import { Billboards } from './render/billboards';
import { MapView } from './render/map';
import { createScene, follow } from './render/scene';
import { Vfx } from './render/vfx';
import { createRun, stepRun, type RunEvent } from './sim/run';
import { CARDS } from './data/cards';
import { FORMS } from './data/forms';
import { ITEMS } from './data/items';
import { mountHud } from './ui/hud';
import { activeModal } from './ui/modal';
import { showLevelUp } from './ui/levelup';
import { canEvolve, showEvolve } from './ui/evolve';
import { showCardChoice } from './ui/cardmodal';
import { mountToasts, toast } from './ui/toast';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const { renderer, scene, camera, resize } = createScene(canvas);
addEventListener('resize', resize);
const save = loadSave();
const input = createInput(window, () => (navigator.getGamepads ? [...navigator.getGamepads()] : []), save.bindings);
const run = createRun({ partnerId: 'agumon', seed: Date.now() >>> 0, save });
const debug = import.meta.env.DEV ? new URLSearchParams(location.search).get('debug')?.split(',') ?? [] : [];
if (import.meta.env.DEV) (window as unknown as { __run: unknown }).__run = run;
if (debug.includes('xp10')) run.debug.xpMul = 10;
if (debug.includes('items')) run.debug.forceItems = true;
if (debug.includes('spawn600')) for (let i = 0; i < T.MAX_ENEMIES; i++) run.pool.spawn(ENEMIES[i % ENEMIES.length], (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, { hp: 50, dmg: 0 });

const map = new MapView(scene);
const boards = new Billboards(scene, camera);
const vfx = new Vfx(scene);
const ui = document.getElementById('ui')!;
const hud = mountHud(ui);
mountToasts(ui);
let events: RunEvent[] = [];

function announce(e: RunEvent) {
  switch (e.type) {
    case 'cardFound': toast(`Carta: ${CARDS[e.cardId].name}`, CARDS[e.cardId].kind === 'rare' ? 'rare' : 'info'); break;
    case 'itemFound': toast(`${ITEMS[e.itemId].name}!`, 'rare'); break;
    case 'partnerUnlocked': toast(`Ovo encontrado! ${FORMS[e.partnerId]?.name ?? e.partnerId} desbloqueado!`, 'rare'); break;
    case 'evolutionAvailable': toast('Digievolução disponível! Aperte E', 'rare'); break;
    case 'bossUnlocked': toast('Missão cumprida! O chefe foi liberado', 'rare'); break;
    case 'bossStarted': toast('O chefe apareceu!', 'warn'); break;
    case 'minibossSpawned': toast('Um Deva apareceu!', 'warn'); break;
    case 'overtime': toast('O tempo acabou! Hordas insanas chegando!', 'warn'); break;
    case 'phaseCleared': toast(`Fase ${e.phase} concluída!`, 'rare'); break;
    case 'victory': toast('VITÓRIA!', 'rare'); break;
    case 'defeat': toast('Seu Digimon caiu...', 'warn'); break;
  }
}

const loop = createFixedLoop(1 / 60, 0.25, dt => {
  input.poll();
  const modal = activeModal();
  if (modal) { modal.handle(input); return; }
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
  follow(camera, run.px, run.pz);
  map.sync(run, t);
  boards.sync(run, t);
  vfx.sync(run, events, Math.min(dt, 0.25), t);
  hud.update(run);
  events = [];
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
