/** Ações do painel de debug (só no modo dev). Não gravam `discovered` (formas); evoluções descobertas sim. */
import { addXp, rollOffers, xpToNext } from './progression';
import { storeSave, type SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { BOSSES, ENEMIES, MINIBOSSES } from '../data/enemies';
import { applyForm } from './evolution';
import { discover, edgeId } from './discovery';
import { handleCard, handleItem, playerSpeed, syncHp, type RunEvent, type RunState } from './run';

export function debugEvolve(r: RunState, formId: string): void {
  const from = r.prog.formId;
  applyForm(r.prog, formId);
  if (FORMS[from]?.evolutions.some(e => e.to === formId)) { discover(r.save, edgeId(from, formId)); storeSave(r.save, r.storage); }
  r.evo.reset();
  syncHp(r);
  r.combat.hp = r.combat.maxHp;
}

export function debugLevelUp(r: RunState): void {
  addXp(r.prog, xpToNext(r.prog.level));
  if (r.prog.pendingLevelUps > 0 && r.offers === null) r.offers = rollOffers(r.prog, r.rng);
}

export function debugGiveCard(r: RunState, cardId: string): RunEvent[] {
  const ev: RunEvent[] = [];
  handleCard(r, cardId, ev);
  return ev;
}

export function debugGiveItem(r: RunState, itemId: string): RunEvent[] {
  const ev: RunEvent[] = [];
  handleItem(r, itemId, ev);
  return ev;
}

export function debugHeal(r: RunState): void { r.combat.hp = r.combat.maxHp; }

export function debugKillAll(r: RunState): void { r.pool.clearAll(); }

/** derrota na hora (para ver a animação de derrota): ignora invencível e a relíquia de reviver */
export function debugDie(r: RunState): void {
  r.debug.god = false;
  r.reviveUsed = true;
  r.combat.hp = 0;
}

/** vida extra dos invocados, para dar tempo de olhar o sprite antes de os golpes automáticos o derrubarem */
export const SUMMON_HP = 10;
/** invoca um inimigo, mini-chefe ou chefe a 6 m do jogador, como inimigo comum (sem barra de chefe nem missão) */
export function debugSummon(r: RunState, id: string): boolean {
  const def = [...ENEMIES, ...MINIBOSSES, ...BOSSES].find(d => d.id === id);
  if (!def) return false;
  const a = r.rng.next() * Math.PI * 2;
  return r.pool.spawn(def, r.px + Math.cos(a) * 6, r.pz + Math.sin(a) * 6, { hp: SUMMON_HP, dmg: 1 }) !== null;
}

/** liga/desliga invencibilidade; devolve o novo estado */
export function debugToggleGod(r: RunState): boolean { return (r.debug.god = !r.debug.god); }

/** liga/desliga velocidade dobrada (soma pontos de Velocidade até 2× a inicial, para ver a corrida); devolve o novo estado */
export function debugToggleDoubleSpeed(r: RunState): boolean {
  const d = r.debug;
  if (d.doubleSpeed) { r.prog.bonus.spd -= d.speedBonus; d.speedBonus = 0; return (d.doubleSpeed = false); }
  while (playerSpeed(r.prog) < 2 * r.baseSpeed && d.speedBonus < 10000) { r.prog.bonus.spd++; d.speedBonus++; }
  return (d.doubleSpeed = true);
}

/** marca todas as evoluções do jogo como descobertas */
export function debugRevealAll(save: SaveData, storage?: Storage | null): void {
  for (const f of Object.values(FORMS)) for (const e of f.evolutions) discover(save, edgeId(f.id, e.to));
  storeSave(save, storage);
}

/** volta tudo a secreto: esquece evoluções descobertas e requisitos revelados */
export function debugForgetAll(save: SaveData, storage?: Storage | null): void {
  save.discoveredEvos = []; save.revealedReqs = {};
  storeSave(save, storage);
}
