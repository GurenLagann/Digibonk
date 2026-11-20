import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { LAB_UPGRADES } from '../data/lab';
import { MOVES } from '../data/moves';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';

export const SAVE_KEY = 'digibonk.save.v1';
export const STARTERS = ['agumon', 'veemon', 'guilmon'] as const;

/** build de um parceiro: marcas `move:<id>`/`card:<id>` e caminho de formas a partir do Child */
export interface PartnerBuild { fav: string[]; ban: string[]; path: string[] }

/** bestTime = vitória mais rápida (s), ausente sem vitória; bestKills = mais abates numa partida */
export interface PartnerRecord { runs: number; wins: number; bestPhase: number; bestTime?: number; bestKills: number }

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
  records: { bestPhase: number; wins: number; runs: number; bestTime?: number };
  partnerRecords: Record<string, PartnerRecord>;
  currency: number;
  /** níveis do Laboratório comprados com Cristais, por id de upgrade */
  lab: Record<string, number>;
  bindings: Record<string, string>;
  camera: CameraSettings;
  /** build (★/✕ e caminho) por parceiro, por id de parceiro */
  builds: Record<string, PartnerBuild>;
}

export function defaultSave(): SaveData {
  return { version: 1, unlocked: [...STARTERS], discovered: [], discoveredEvos: [], revealedReqs: {}, lastPartner: '', records: { bestPhase: 0, wins: 0, runs: 0 }, partnerRecords: {}, currency: 0, lab: {}, bindings: {}, camera: defaultCamera(), builds: {} };
}

const strArr = (v: unknown): string[] | null => (Array.isArray(v) && v.every(x => typeof x === 'string') ? [...v] : null);
/** como strArr, mas descarta só os itens inválidos */
const strItems = (v: unknown): string[] | null => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : null);
const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
/** tempo de recorde: só número finito > 0, senão ausente */
const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined);
const withTime = <O extends object>(o: O, t: number | undefined) => (t === undefined ? o : { ...o, bestTime: t });

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

/** marca válida: golpe existente ou carta passiva existente */
export function isBuildKey(k: unknown): k is string {
  if (typeof k !== 'string') return false;
  if (k.startsWith('move:')) return Object.hasOwn(MOVES, k.slice(5));
  if (k.startsWith('card:')) { const c = Object.hasOwn(CARDS, k.slice(5)) ? CARDS[k.slice(5)] : undefined; return c?.kind === 'passive'; }
  return false;
}
const marks = (v: unknown, skip: ReadonlySet<string>) => {
  const out: string[] = [];
  for (const k of Array.isArray(v) ? v : []) if (isBuildKey(k) && !skip.has(k) && !out.includes(k) && out.length < T.BUILD.MAX) out.push(k);
  return out;
};
/** caminho válido: começa no Child do parceiro e cada passo é uma aresta existente */
function loadPath(v: unknown, child: string): string[] {
  const p = strArr(v);
  if (!p || p.length === 0 || p[0] !== child) return [];
  for (let i = 1; i < p.length; i++) if (!FORMS[p[i - 1]]?.evolutions.some(e => e.to === p[i])) return [];
  return p.length > 1 ? p : [];
}
function loadBuilds(v: unknown): Record<string, PartnerBuild> {
  const out: Record<string, PartnerBuild> = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [id, b] of Object.entries(v as object)) {
    const partner = PARTNERS.find(p => p.id === id);
    if (!partner || !b || typeof b !== 'object') continue;
    const r = b as Record<string, unknown>;
    const fav = marks(r.fav, new Set());
    out[id] = { fav, ban: marks(r.ban, new Set(fav)), path: loadPath(r.path, partner.childForm) };
  }
  return out;
}

export function partnerRecord(save: SaveData, id: string): PartnerRecord {
  return save.partnerRecords[id] ?? { runs: 0, wins: 0, bestPhase: 0, bestKills: 0 };
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
      partnerRecords[k] = withTime({ runs: num(pr.runs, 0), wins: num(pr.wins, 0), bestPhase: num(pr.bestPhase, 0), bestKills: Math.max(0, num(pr.bestKills, 0)) }, time(pr.bestTime));
    }
  }
  const revealedReqs: Record<string, string[]> = {};
  if (r.revealedReqs && typeof r.revealedReqs === 'object' && !Array.isArray(r.revealedReqs)) {
    for (const [k, v] of Object.entries(r.revealedReqs as object)) { const keys = strItems(v); if (keys) revealedReqs[k] = keys; }
  }
  const lab: Record<string, number> = {};
  if (r.lab && typeof r.lab === 'object' && !Array.isArray(r.lab)) {
    for (const [k, v] of Object.entries(r.lab as object)) {
      const def = Object.hasOwn(LAB_UPGRADES, k) ? LAB_UPGRADES[k] : undefined;
      if (def && typeof v === 'number' && Number.isInteger(v) && v >= 1) lab[k] = Math.min(v, def.costs.length);
    }
  }
  return {
    version: 1,
    unlocked,
    discovered: strArr(r.discovered) ?? d.discovered,
    discoveredEvos: strItems(r.discoveredEvos) ?? d.discoveredEvos,
    revealedReqs,
    lastPartner: typeof r.lastPartner === 'string' ? r.lastPartner : d.lastPartner,
    records: withTime({ bestPhase: num(rec.bestPhase, 0), wins: num(rec.wins, 0), runs: num(rec.runs, 0) }, time(rec.bestTime)),
    partnerRecords,
    currency: Math.max(0, num(r.currency, 0)),
    lab,
    bindings,
    camera: loadCamera(r.camera),
    builds: loadBuilds(r.builds),
  };
}

export function storeSave(data: SaveData, storage?: Storage | null): boolean {
  const s = storageOrGlobal(storage);
  if (!s) return false;
  try { s.setItem(SAVE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}
