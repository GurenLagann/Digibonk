export const SAVE_KEY = 'digibonk.save.v1';
export const STARTERS = ['agumon', 'veemon', 'guilmon'] as const;

export interface SaveData {
  version: 1;
  unlocked: string[];
  discovered: string[];
  records: { bestPhase: number; wins: number; runs: number };
  currency: number;
  bindings: Record<string, string>;
}

export function defaultSave(): SaveData {
  return { version: 1, unlocked: [...STARTERS], discovered: [], records: { bestPhase: 0, wins: 0, runs: 0 }, currency: 0, bindings: {} };
}

const strArr = (v: unknown): string[] | null => (Array.isArray(v) && v.every(x => typeof x === 'string') ? [...v] : null);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function storageOrGlobal(storage: Storage | null | undefined): Storage | null {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function loadSave(storage?: Storage | null): SaveData {
  const d = defaultSave();
  const s = storageOrGlobal(storage);
  if (!s) return d;
  let raw: unknown;
  try {
    const txt = s.getItem(SAVE_KEY);
    if (!txt) return d;
    raw = JSON.parse(txt);
  } catch { return d; }
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  const loaded = strArr(r.unlocked) ?? d.unlocked;
  const unlocked = [...STARTERS.filter(st => !loaded.includes(st)), ...loaded];
  const rec = (r.records && typeof r.records === 'object' ? r.records : {}) as Record<string, unknown>;
  const bindings: Record<string, string> = {};
  if (r.bindings && typeof r.bindings === 'object') {
    for (const [k, v] of Object.entries(r.bindings as object)) if (typeof v === 'string') bindings[k] = v;
  }
  return {
    version: 1,
    unlocked,
    discovered: strArr(r.discovered) ?? d.discovered,
    records: { bestPhase: num(rec.bestPhase, 0), wins: num(rec.wins, 0), runs: num(rec.runs, 0) },
    currency: num(r.currency, 0),
    bindings,
  };
}

export function storeSave(data: SaveData, storage?: Storage | null): boolean {
  const s = storageOrGlobal(storage);
  if (!s) return false;
  try { s.setItem(SAVE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}
