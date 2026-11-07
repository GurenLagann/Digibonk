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
import { chooseOffer, createRun, resolveCard, stepRun, type RunEvent } from './sim/run';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const { renderer, scene, camera, resize } = createScene(canvas);
addEventListener('resize', resize);
const save = loadSave();
const input = createInput(window, () => (navigator.getGamepads ? [...navigator.getGamepads()] : []), save.bindings);
const run = createRun({ partnerId: 'agumon', seed: Date.now() >>> 0, save });
const debug = import.meta.env.DEV ? new URLSearchParams(location.search).get('debug')?.split(',') ?? [] : [];
if (debug.includes('xp10')) run.debug.xpMul = 10;
if (debug.includes('items')) run.debug.forceItems = true;
if (debug.includes('spawn600')) for (let i = 0; i < T.MAX_ENEMIES; i++) run.pool.spawn(ENEMIES[i % ENEMIES.length], (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, { hp: 50, dmg: 0 });

const map = new MapView(scene);
const boards = new Billboards(scene, camera);
const vfx = new Vfx(scene);
let events: RunEvent[] = [];
const loop = createFixedLoop(1 / 60, 0.25, dt => {
  input.poll();
  if (run.offers) chooseOffer(run, 0); // temporário até a Task 13
  if (run.pendingCard) resolveCard(run, { passiveSlot: null });
  events.push(...stepRun(run, input.move(), dt));
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
  events = [];
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
