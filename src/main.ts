import './ui/style.css';
import './ui/theme.css';
import { createApp } from './app';
import { createInput } from './core/input';
import { createFixedLoop } from './core/loop';
import { loadSave } from './core/save';
import { sanitizeDiscovery } from './sim/discovery';
import { CARD_LIST, CARDS } from './data/cards';
import { ENEMIES } from './data/enemies';
import { FORMS } from './data/forms';
import { ITEM_LIST, ITEMS } from './data/items';
import { T } from './data/tuning';
import { Billboards } from './render/billboards';
import { MapView } from './render/map';
import { createScene, follow } from './render/scene';
import { Vfx } from './render/vfx';
import { deathDuration, SpriteLibrary } from './render/sprites';
import { abandonRun, createRun, stepRun, type RunEvent, type RunState } from './sim/run';
import { showCardChoice } from './ui/cardmodal';
import { canEvolve, showBlindEvolve, showEvolve } from './ui/evolve';
import { autoGainText, mountHud } from './ui/hud';
import { showRelicChoice } from './ui/relics';
import { showJogressChoice } from './ui/jogress';
import { showAltar } from './ui/altars';
import { damagePanel } from './ui/damage';
import { showLevelUp } from './ui/levelup';
import { prettyCode, showCredits, showPause, showSettings } from './ui/menus';
import { showResults } from './ui/results';
import { showRecords } from './ui/records';
import { showPartnerSelect } from './ui/partnerSelect';
import { showTitle } from './ui/title';
import { activeModal } from './ui/modal';
import { mountToasts, toast } from './ui/toast';
import { installAutoPause } from './ui/autopause';
import { setPortraitSource } from './ui/portrait';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui')!;
const { renderer, scene, camera, resize } = createScene(canvas);
addEventListener('resize', resize);
const save = loadSave();
sanitizeDiscovery(save); // descarta evoluções/pistas que não existem mais nos dados
const input = createInput(window, () => (navigator.getGamepads ? [...navigator.getGamepads()] : []), save.bindings);
const debug = import.meta.env.DEV ? new URLSearchParams(location.search).get('debug')?.split(',') ?? [] : [];

const map = new MapView(scene);
const sprites = await SpriteLibrary.load();
setPortraitSource(sprites);
if (import.meta.env.DEV) Object.assign(window, { __scene: scene, __renderer: renderer });
const boards = new Billboards(scene, camera, sprites);
const vfx = new Vfx(scene);
const hud = mountHud(ui, () => input.codesFor('evolve').map(prettyCode).join(' / ') || '—');
mountToasts(hud.toastHost); // coluna da direita do HUD, abaixo do painel de abates

let run: RunState | null = null;
let lastPartner = 'agumon';
let events: RunEvent[] = [];
let resultsAt = 0;

const app = createApp({ save, storage: null, startRun });
const toTitle = () => {
  app.go('title'); hud.el.classList.add('hidden');
  const m = showTitle(ui, app, save, {
    play: () => { m.close(); app.go('partner'); showPartnerSelect(ui, app, save, { mode: 'pick', back: toTitle }); },
    partners: () => { m.close(); app.go('partner'); showPartnerSelect(ui, app, save, { mode: 'view', back: toTitle }); },
    records: () => { m.close(); app.go('records'); showRecords(ui, save, toTitle); },
    settings: () => { m.close(); app.go('settings'); openSettings(); },
    credits: () => { m.close(); app.go('credits'); showCredits(ui, toTitle); },
  });
};
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
  const open = () => showPause(ui, resume, () => openSettings(open), () => { if (run) abandonRun(run).forEach(announce); }, run ? damagePanel(run) : undefined);
  open();
}
installAutoPause(document, pause, window);

// painel de debug: só em dev, com ?debug na URL; F2 mostra/esconde
if (import.meta.env.DEV && new URLSearchParams(location.search).has('debug')) {
  const [{ mountDebugPanel }, dbg] = await Promise.all([import('./ui/debugpanel'), import('./sim/debug')]);
  const withRun = (fn: (r: RunState) => RunEvent[] | void) => () => {
    if (!run || run.ended) { toast('Debug: comece uma partida primeiro', 'warn'); return; }
    const ev = fn(run); if (ev) { ev.forEach(announce); events.push(...ev); }
  };
  const panel = mountDebugPanel(document.body, {
    forms: Object.values(FORMS).map(f => ({ id: f.id, name: f.name })),
    cards: CARD_LIST.map(c => ({ id: c.id, name: c.name })),
    items: ITEM_LIST.map(i => ({ id: i.id, name: i.name })),
    evolve: id => withRun(r => { dbg.debugEvolve(r, id); toast(`Debug: virou ${FORMS[id].name}`, 'rare'); })(),
    levelUp: withRun(r => dbg.debugLevelUp(r)),
    card: id => withRun(r => dbg.debugGiveCard(r, id))(),
    item: id => withRun(r => dbg.debugGiveItem(r, id))(),
    heal: withRun(r => dbg.debugHeal(r)),
    killAll: withRun(r => dbg.debugKillAll(r)),
    god: () => { if (!run) return false; const on = dbg.debugToggleGod(run); toast(`Debug: invencível ${on ? 'ligado' : 'desligado'}`); return on; },
    revealAll: () => { dbg.debugRevealAll(save); toast('Debug: todas as evoluções reveladas'); },
    forgetAll: () => { dbg.debugForgetAll(save); toast('Debug: evoluções esquecidas'); },
    doubleSpeed: () => { if (!run) return false; const on = dbg.debugToggleDoubleSpeed(run); toast(`Debug: velocidade 2× ${on ? 'ligada' : 'desligada'}`); return on; },
  });
  addEventListener('keydown', e => { if (e.code === 'F2') { e.preventDefault(); panel.toggle(); } });
}

function announce(e: RunEvent) {
  switch (e.type) {
    case 'cardFound': toast(`Carta: ${CARDS[e.cardId].name}`, CARDS[e.cardId].kind === 'rare' ? 'rare' : 'info'); break;
    case 'cardLeveled': toast(`${CARDS[e.cardId].name} subiu para Nv ${e.level}!`, 'rare'); break;
    case 'itemFound': toast(`${ITEMS[e.itemId].name}!`, 'rare'); break;
    case 'partnerUnlocked': toast(`Ovo encontrado! ${FORMS[e.partnerId]?.name ?? e.partnerId} desbloqueado!`, 'rare'); break;
    case 'formDiscovered': toast(`Nova forma liberada! ${FORMS[e.formId].name}`, 'rare'); break;
    case 'digiData': toast('Digi Data coletado'); break;
    case 'autoGain': break; // somados num aviso só, no loop
    case 'revived': toast('Reviveu com a relíquia!', 'rare'); break;
    case 'jogressReady': toast('Um Terminal Jogress apareceu no mapa!', 'rare'); break;
    case 'portalOpened': toast('Uma Distorção Digital se abriu! Entre em 30 s', 'rare'); break;
    case 'zoneEnter': toast('Distorção Digital! Sobreviva às ondas', 'warn'); break;
    case 'zoneWave': if (e.wave > 1) toast(`Onda ${e.wave}`); break;
    case 'zoneAlpha': toast(`O Alfa ${e.name} apareceu!`, 'warn'); break;
    case 'zoneDone': toast(e.won ? 'Distorção vencida! Volte pelo portal' : 'O Alfa escapou… volte pelo portal', e.won ? 'rare' : 'warn'); break;
    case 'zoneExit': toast('De volta ao mapa'); break;
    case 'evolutionAvailable': break; // o painel "Próx. evolução" do HUD acende no lugar do aviso
    case 'bossUnlocked': toast('Missão cumprida! O chefe foi liberado', 'rare'); break;
    case 'bossStarted': toast('O chefe apareceu!', 'warn'); break;
    case 'minibossSpawned': toast('Um guardião apareceu!', 'warn'); break;
    case 'overtime': toast('O tempo acabou! Hordas insanas chegando!', 'warn'); break;
    case 'phaseCleared': toast(`Fase ${e.phase} concluída!`, 'rare'); break;
    case 'victory': toast('VITÓRIA!', 'rare'); resultsAt = performance.now() + 1500; break;
    case 'defeat': {
      toast('Seu Digimon caiu...', 'warn');
      // espera a animação de morte (se o sprite tiver) antes dos resultados
      const frames = run ? sprites.info(run.prog.formId)?.frames ?? [] : [];
      resultsAt = performance.now() + Math.max(1500, deathDuration(frames) * 1000 + 800); break;
    }
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
  if (run.relicOffer) { showRelicChoice(ui, run); return; }
  if (run.altarOffer) { showAltar(ui, run); return; }
  if (run.jogressOffer) { showJogressChoice(ui, run, name => toast(`Jogress! ${name}`, 'rare')); return; }
  if (run.blindChoice) { showBlindEvolve(ui, run, id => toast(`Nova forma liberada! ${FORMS[id].name}`, 'rare')); return; }
  if (run.offers) { showLevelUp(ui, run); return; }
  if (run.pendingCard) { showCardChoice(ui, run); return; }
  if (input.pressed('evolve') && canEvolve(run)) {
    showEvolve(ui, run, id => id && toast(`Digievoluiu para ${FORMS[id].name}!`, 'rare'),
      () => toast(`${FORMS[run!.prog.formId].name} chegou à Maturidade! +${Math.round(T.MATURITY_BONUS * 100)}% de vida e dano`, 'rare'));
    return;
  }
  const ev = stepRun(run, input.move(), dt);
  ev.forEach(announce);
  const gains = ev.flatMap(e => (e.type === 'autoGain' ? [e] : []));
  if (gains.length) toast(autoGainText(gains));
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
