/** Dados do painel dos devs (tools/painel/build.ts): linhas de evolução, requisitos e estado dos sprites. */
import { CARDS, FORMS, ITEMS, PARTNERS } from '../../src/data/generated/gamedata.ts';
import type { EvoReq } from '../../src/data/types.ts';

export interface SpriteInfo { file: string; frameW: number; frameH: number; frames: string[]; source: number }
export type SpriteState = 'done' | 'adjust' | 'partial' | 'idle' | 'none';

/** folhas que existem mas têm defeitos conhecidos (revisar quando as folhas novas chegarem) */
export const SPRITE_ADJUST: Record<string, string> = {
  wargreymon: 'diagonais da corrida', omnimon: 'diagonais da corrida', exveemon: 'diagonais da corrida',
  gallantmon: 'linha de costas da corrida cortada',
};

export function spriteStatus(id: string, s: SpriteInfo | undefined): { st: SpriteState; note: string } {
  if (!s) return { st: 'none', note: 'sem sprite (círculo no jogo)' };
  if (SPRITE_ADJUST[id]) return { st: 'adjust', note: SPRITE_ADJUST[id] };
  const fr = s.frames;
  const walk = fr.some(f => f.startsWith('walk')), run = fr.some(f => f.startsWith('run')), diag = fr.some(f => f.includes('diag'));
  if (!walk) return { st: 'idle', note: `só parado (${fr.length} quadros)` };
  if (run && diag) return { st: 'done', note: `${fr.length} quadros, 8 direções` };
  return { st: 'partial', note: `${fr.length} quadros${diag ? '' : ', sem diagonais'}${run ? '' : ', sem corrida'}` };
}

/** quadro usado na miniatura: idle1 (de lado, parado) ou o primeiro */
export function frameIndex(frames: string[]): number { return Math.max(0, frames.indexOf('idle1')); }

const STAT: Record<string, string> = { hp: 'Vida', atk: 'Atq', def: 'Def', spd: 'Vel', brain: 'Int' };
export function reqLabels(r: EvoReq): string[] {
  const out = [`Nv ${r.minLevel}`];
  for (const [k, v] of Object.entries(r.minStats ?? {})) out.push(`${STAT[k] ?? k} ${v}`);
  for (const i of r.items ?? []) out.push(ITEMS[i]?.name ?? CARDS[i]?.name ?? i);
  if (r.minKills) out.push(`${r.minKills} abates`);
  if (r.minNearDeaths) out.push(`HP<25% ${r.minNearDeaths}×`);
  if (r.minPhase) out.push(`Fase ${r.minPhase}`);
  for (const u of r.unlocked ?? []) {
    const cf = PARTNERS.find(p => p.id === u)?.childForm;
    out.push(`com ${cf ? FORMS[cf].name : u} liberado`);
  }
  return out;
}

/** todas as formas alcançáveis a partir de uma forma (a linha de um parceiro) */
export function lineOf(start: string): string[] {
  const seen: string[] = [], q = [start];
  while (q.length) {
    const id = q.shift()!;
    if (seen.includes(id) || !FORMS[id]) continue;
    seen.push(id);
    for (const e of FORMS[id].evolutions) q.push(e.to);
  }
  return seen;
}

export interface PainelForm { n: string; s: string; a: string; sp: { st: SpriteState; note: string }; img: string | null; ev: { to: string; r: string[] }[] }

/** monta os dados do painel; `thumb` devolve a miniatura (data URI) de uma forma com sprite */
export function buildData(manifest: Record<string, SpriteInfo>, thumb: (id: string, s: SpriteInfo) => string | null) {
  const forms: Record<string, PainelForm> = {};
  for (const f of Object.values(FORMS)) {
    const s = manifest[f.id];
    forms[f.id] = {
      n: f.name, s: f.stage, a: f.attribute, sp: spriteStatus(f.id, s), img: s ? thumb(f.id, s) : null,
      ev: f.evolutions.map(e => ({ to: e.to, r: reqLabels(e.req) })),
    };
  }
  return { partners: PARTNERS.map(p => ({ id: p.id, childForm: p.childForm, season: p.season, starter: p.starter })), forms };
}
