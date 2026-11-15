import { T } from '../data/tuning';

/** medalha de vitória por tempo total da partida */
export type Medal = 'bronze' | 'silver' | 'gold' | 'champion';
export const MEDAL_ORDER: Medal[] = ['bronze', 'silver', 'gold', 'champion'];
export const MEDAL_ICON: Record<Medal, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', champion: '🏆' };
export const MEDAL_NAME: Record<Medal, string> = { bronze: 'Bronze', silver: 'Prata', gold: 'Ouro', champion: 'Campeão' };

/** sem vitória (undefined) → null; abaixo do corte (estrito) ganha a medalha */
export function medalFor(seconds: number | undefined): Medal | null {
  if (seconds === undefined) return null;
  if (seconds < T.MEDALS.champion) return 'champion';
  if (seconds < T.MEDALS.gold) return 'gold';
  if (seconds < T.MEDALS.silver) return 'silver';
  return 'bronze';
}

/** mm:ss, ou h:mm:ss a partir de 1 hora; sem tempo → "—" */
export function fmtClock(seconds: number | undefined): string {
  if (seconds === undefined) return '—';
  const t = Math.floor(seconds), hh = Math.floor(t / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return hh ? `${hh}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}
