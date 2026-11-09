/** Registro de dano por golpe da partida: total e dano por segundo dos últimos 15 s (baldes de 1 s). */
export const DPS_WINDOW = 15;
export interface DamageLog { total: Record<string, number>; buckets: Record<string, number[]>; sec: number }

export const newDamageLog = (): DamageLog => ({ total: {}, buckets: {}, sec: 0 });

/** avança o relógio dos baldes zerando os segundos que passaram */
function advance(l: DamageLog, sec: number) {
  if (sec <= l.sec) return;
  const steps = Math.min(DPS_WINDOW, sec - l.sec);
  for (const b of Object.values(l.buckets)) for (let k = 1; k <= steps; k++) b[(l.sec + k) % DPS_WINDOW] = 0;
  l.sec = sec;
}

export function logDamage(l: DamageLog, time: number, moveId: string, dmg: number): void {
  const sec = Math.floor(time);
  advance(l, sec);
  l.total[moveId] = (l.total[moveId] ?? 0) + dmg;
  (l.buckets[moveId] ??= Array.from({ length: DPS_WINDOW }, () => 0))[sec % DPS_WINDOW] += dmg;
}

export interface DamageRow { moveId: string; total: number; pct: number; dps: number }
/** linhas do maior para o menor dano total; dps = média dos últimos 15 s */
export function damageRows(l: DamageLog, time: number): DamageRow[] {
  advance(l, Math.floor(time));
  const sum = Object.values(l.total).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(l.total)
    .map(([moveId, total]) => ({ moveId, total, pct: total / sum, dps: (l.buckets[moveId] ?? []).reduce((a, b) => a + b, 0) / DPS_WINDOW }))
    .sort((a, b) => b.total - a.total);
}
