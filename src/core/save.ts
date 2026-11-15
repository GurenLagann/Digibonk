export const SAVE_KEY = 'digibonk.save.v1';
export const STARTERS = ['agumon', 'veemon', 'guilmon'] as const;

export interface PartnerRecord { runs: number; wins: number; bestPhase: number }

/** opções de câmera: sensibilidades são multiplicadores (0.25–3); eixos do analógico direito (0–15) */
export interface CameraSettings { mouseSens: number; padSens: number; invertY: boolean; padAxisX: number; padAxisY: number }
export const defaultCamera = (): CameraSettings => ({ mouseSens: 1, padSens: 1, invertY: false, padAxisX: 2, padAxisY: 3 });

export interface SaveData {
  version: 1;
  unlocked: string[];
  discovered: string[];
  /** arestas de evolução já feitas alguma vez ("from->to") */
  discoveredEvos: string[];
  /** requisitos revelados por Digi Data, por aresta (chaves de ReqKey) */
  revealedReqs: Record<string, string[]>;
  /** parceiro da última partida (tela inicial); '' = nenhum ainda */
  lastPartner: string;
  records: { bestPhase: number; wins: number; runs: number };
  partnerRecords: Record<string, PartnerRecord>;
  currency: number;
  bindings: Record<string, string>;
  camera: CameraSettings;
}

export function defaultSave(): SaveData {
  return { version: 1, unlocked: [...STARTERS], discovered: [], discoveredEvos: [], revealedReqs: {}, lastPartner: '', records: { bestPhase: 0, wins: 0, runs: 0 }, partnerRecords: {}, currency: 0, bindings: {}, camera: defaultCamera() };
}

const strArr = (v: unknown): string[] | null => (Array.isArray(v) && v.every(x => typeof x === 'string') ? [...v] : null);
/** como strArr, mas descarta só os itens inválidos */
const strItems = (v: unknown): string[] | null => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

const sens = (v: unknown) => Math.min(3, Math.max(0.25, num(v, 1)));
const axisIdx = (v: unknown, d: number) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 15 ? v : d);
function loadCamera(v: unknown): CameraSettings {
  const d = defaultCamera();
  if (!v || typeof v !== 'object') return d;
  const c = v as Record<string, unknown>;
  return { mouseSens: sens(c.mouseSens), padSens: sens(c.padSens), invertY: c.invertY === true, padAxisX: axisIdx(c.padAxisX, d.padAxisX), padAxisY: axisIdx(c.padAxisY, d.padAxisY) };
}

function storageOrGlobal(storage: Storage | null | undefined): Storage | null {
  if (storage !== undefined) return storage;
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function partnerRecord(save: SaveData, id: string): PartnerRecord {
  return save.partnerRecords[id] ?? { runs: 0, wins: 0, bestPhase: 0 };
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
  const partnerRecords: Record<string, PartnerRecord> = {};
  if (r.partnerRecords && typeof r.partnerRecords === 'object') {
    for (const [k, v] of Object.entries(r.partnerRecords as object)) {
      if (!v || typeof v !== 'object') continue;
      const pr = v as Record<string, unknown>;
      partnerRecords[k] = { runs: num(pr.runs, 0), wins: num(pr.wins, 0), bestPhase: num(pr.bestPhase, 0) };
    }
  }
  const revealedReqs: Record<string, string[]> = {};
  if (r.revealedReqs && typeof r.revealedReqs === 'object' && !Array.isArray(r.revealedReqs)) {
    for (const [k, v] of Object.entries(r.revealedReqs as object)) { const keys = strItems(v); if (keys) revealedReqs[k] = keys; }
  }
  return {
    version: 1,
    unlocked,
    discovered: strArr(r.discovered) ?? d.discovered,
    discoveredEvos: strItems(r.discoveredEvos) ?? d.discoveredEvos,
    revealedReqs,
    lastPartner: typeof r.lastPartner === 'string' ? r.lastPartner : d.lastPartner,
    records: { bestPhase: num(rec.bestPhase, 0), wins: num(rec.wins, 0), runs: num(rec.runs, 0) },
    partnerRecords,
    currency: num(r.currency, 0),
    bindings,
    camera: loadCamera(r.camera),
  };
}

export function storeSave(data: SaveData, storage?: Storage | null): boolean {
  const s = storageOrGlobal(storage);
  if (!s) return false;
  try { s.setItem(SAVE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}
