/** Ações do painel de debug (só no modo dev). Não gravam nada de "descoberta" no save. */
import { addXp, rollOffers, xpToNext } from './progression';
import { applyForm } from './evolution';
import { handleCard, handleItem, syncHp, type RunEvent, type RunState } from './run';

export function debugEvolve(r: RunState, formId: string): void {
  applyForm(r.prog, formId);
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

/** liga/desliga invencibilidade; devolve o novo estado */
export function debugToggleGod(r: RunState): boolean { return (r.debug.god = !r.debug.god); }
