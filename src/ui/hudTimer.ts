import { T } from '../data/tuning';
import type { PhaseState } from '../sim/phase';
import { fmtTime } from './dom';

export type TimerMode = 'normal' | 'warning' | 'overtime';
export interface TimerView { text: string; frac: number; mode: TimerMode; pct: number }

/** Último minuto da fase: faltam menos de 60 s (com 60 s cravados ainda é normal). */
export const WARNING_SECONDS = 60;

/** O que a barra da fase e o timer mostram: tempo restante (ou "+extra" no overtime), fração da barra, modo e %. */
export function timerView(ph: Pick<PhaseState, 't' | 'overtime'>): TimerView {
  if (ph.overtime) return { text: '+' + fmtTime(ph.t - T.PHASE_SECONDS), frac: 1, mode: 'overtime', pct: 100 };
  const left = T.PHASE_SECONDS - ph.t;
  const frac = Math.max(0, Math.min(1, ph.t / T.PHASE_SECONDS));
  return { text: fmtTime(left), frac, mode: left < WARNING_SECONDS ? 'warning' : 'normal', pct: Math.floor(frac * 100) };
}
