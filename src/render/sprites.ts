import * as THREE from 'three';

/** walk1..walk24 (de lado), walkupN / walkdownN (costas / frente), walkdiagupN / walkdiagdownN (diagonais): ciclos de caminhada */
export type Role = 'idle1' | 'idle2' | 'idle3' | 'attack' | 'hurt' | 'idleup' | 'idledown' | 'idlediagup' | 'idlediagdown'
  | `walk${number}` | `walkup${number}` | `walkdown${number}` | `walkdiagup${number}` | `walkdiagdown${number}`
  | `run${number}` | `runup${number}` | `rundown${number}` | `rundiagup${number}` | `rundiagdown${number}` | `hurt${number}`
  | `stand${number}` | `standup${number}` | `standdown${number}` | `standdiagup${number}` | `standdiagdown${number}`
  | `death${number}` | `deathup${number}` | `deathdown${number}` | `deathdiagup${number}` | `deathdiagdown${number}`;
export type Facing = 'side' | 'up' | 'down' | 'diagup' | 'diagdown';
const POSE_ROLES: readonly string[] = ['idle1', 'idle2', 'idle3', 'attack', 'hurt', 'idleup', 'idledown', 'idlediagup', 'idlediagdown'];
const isRole = (f: unknown): f is Role => typeof f === 'string'
  && (POSE_ROLES.includes(f) || /^(walk|run|stand)(up|down|diagup|diagdown)?([1-9]|1\d|2[0-4])$/.test(f)
    || /^hurt([1-9]|[1-5]\d|6[0-4])$/.test(f) || /^death(up|down|diagup|diagdown)?([1-9]|[1-5]\d|6[0-4])$/.test(f));
/** quadros de um ciclo (walk/run/stand/death) numa direção, na ordem do manifesto */
const cycle = (frames: Role[], kind: 'walk' | 'run' | 'stand' | 'death', facing: Facing) => {
  const re = new RegExp(`^${kind}${facing === 'side' ? '' : facing}\\d+$`);
  return frames.filter(f => re.test(f));
};
/** costas e frente são simétricas: só lado e diagonais espelham com a direção horizontal */
export function mirrorsWithDir(f: Facing): boolean { return f !== 'up' && f !== 'down'; }
/** defaults: animações preenchidas com outro quadro no build (ex.: 'idle' = parado copiado do 1º quadro do andar).
 *  cols: quadros por linha quando a folha é uma grade (padrão: todos numa linha só) */
export interface SpriteInfo { file: string; frameW: number; frameH: number; frames: Role[]; source: number; defaults?: string[]; cols?: number }
export interface SpriteManifest { version: 1; sprites: Record<string, SpriteInfo> }

export function parseManifest(json: unknown): SpriteManifest | null {
  if (!json || typeof json !== 'object') return null;
  const j = json as { version?: unknown; sprites?: unknown };
  if (j.version !== 1 || !j.sprites || typeof j.sprites !== 'object') return null;
  const sprites: Record<string, SpriteInfo> = {};
  for (const [id, v] of Object.entries(j.sprites as Record<string, unknown>)) {
    const s = v as Partial<SpriteInfo>;
    if (!s || typeof s.file !== 'string' || !/^[a-z0-9_]+\.png$/.test(s.file) || typeof s.frameW !== 'number' || typeof s.frameH !== 'number'
      || !Array.isArray(s.frames) || !s.frames.length || !s.frames.every(isRole)) return null;
    sprites[id] = { file: s.file, frameW: s.frameW, frameH: s.frameH, frames: s.frames as Role[], source: typeof s.source === 'number' ? s.source : 0,
      ...(Array.isArray(s.defaults) && s.defaults.every(d => typeof d === 'string') ? { defaults: s.defaults } : {}),
      ...(typeof s.cols === 'number' && s.cols >= 1 ? { cols: Math.floor(s.cols) } : {}) };
  }
  return { version: 1, sprites };
}

/**
 * Animações que o sprite não tem desenhadas (o jogo usa um quadro padrão no lugar):
 * parado → 1º quadro do andar; dano → mantém o quadro de movimento; morte → mantém o último quadro; etc.
 */
export function missingAnimations(info: Pick<SpriteInfo, 'frames' | 'defaults'>): string[] {
  const f = info.frames, has = (re: RegExp) => f.some(x => re.test(x)), out: string[] = [];
  if (!f.includes('idle1') || info.defaults?.includes('idle')) out.push('parado');
  else if (!has(/^stand\d+$/) && has(/^walk\d+$/)) out.push('parado animado');
  if (!has(/^walk\d+$/)) out.push('andar');
  if (!has(/^run/)) out.push('correr');
  if (!has(/^walk(up|down)\d+$/)) out.push('frente/costas');
  if (!has(/^walkdiag/)) out.push('diagonais');
  if (!has(/^hurt/)) out.push('dano');
  if (!has(/^death\d+$/)) out.push('morte');
  return out;
}

/** colunas e linhas da folha */
export function sheetGrid(info: Pick<SpriteInfo, 'frames' | 'cols'>): { cols: number; rows: number } {
  const cols = Math.min(info.cols ?? info.frames.length, info.frames.length);
  return { cols, rows: Math.ceil(info.frames.length / cols) };
}
/** posição (em quadros) do quadro i na folha: coluna e linha, linha 0 em cima */
export function frameCell(i: number, info: Pick<SpriteInfo, 'frames' | 'cols'>): { col: number; row: number } {
  const { cols } = sheetGrid(info);
  return { col: i % cols, row: Math.floor(i / cols) };
}
/** offset de textura (three.js, flipY: v cresce para cima) que mostra o quadro i */
export function frameOffset(i: number, info: Pick<SpriteInfo, 'frames' | 'cols'>): { x: number; y: number } {
  const { cols, rows } = sheetGrid(info), c = frameCell(i, info);
  return { x: c.col / cols, y: 1 - (c.row + 1) / rows };
}

export function frameIndex(role: Role, frames: Role[]): number { const i = frames.indexOf(role); return i < 0 ? 0 : i; }

const IDLE_CYCLE: Role[] = ['idle1', 'idle2', 'idle3', 'idle2'];
export function idleFrame(time: number, phase = 0): Role { return IDLE_CYCLE[Math.floor((time + phase) * 6) % 4]; }

const WALK_FPS = 12;
/** parado desenhado (standN): respiração mais lenta que a caminhada */
export const STAND_FPS = 6;
/**
 * Com caminhada desenhada: andando → ciclo da direção (12 quadros/s; sem quadros verticais usa os de lado);
 * running → ciclo de corrida (runN) da direção, se existir,
 * parado → pose fixa da direção (idleup/idledown, senão idle1). Sem caminhada desenhada → ciclo de idle.
 */
export function moveFrame(time: number, phase: number, moving: boolean, frames: Role[], facing: Facing = 'side', running = false): Role {
  const pick = (kind: 'walk' | 'run') => { const d = cycle(frames, kind, facing); return d.length ? d : cycle(frames, kind, 'side'); };
  const walk = pick('walk');
  const run = running ? pick('run') : [];
  const seq = run.length ? run : walk;
  if (moving && seq.length) return seq[Math.floor((time + phase) * WALK_FPS) % seq.length];
  if (!moving) {
    const st = cycle(frames, 'stand', facing), stand = st.length ? st : cycle(frames, 'stand', 'side');
    if (stand.length) return stand[Math.floor((time + phase) * STAND_FPS) % stand.length];
  }
  if (facing !== 'side' && frames.includes(`idle${facing}`)) return `idle${facing}`;
  if (walk.length) return 'idle1'; // parado com caminhada desenhada: pose fixa, a respiração vem do motion
  return idleFrame(time, phase);
}

/** duração da animação de dano (s) contada do golpe */
export const HURT_TIME = 0.25;
/** intervalo mínimo entre duas animações de dano: no meio da horda ele não fica cambaleando sem parar */
export const HURT_COOLDOWN = 1.2;
/** início da animação de dano: um golpe novo só reinicia depois do cooldown */
export function nextHurtStart(prevStart: number, time: number, newHit: boolean): number {
  return newHit && time - prevStart >= HURT_COOLDOWN ? time : prevStart;
}
/** dano: hurt1..N espalhados na janela de HURT_TIME; sem eles, a pose única 'hurt'. null quando a janela passou ou não há pose de dano */
export function hurtFrame(elapsed: number, frames: Role[]): Role | null {
  if (elapsed < 0 || elapsed > HURT_TIME) return null;
  const seq = frames.filter(f => /^hurt\d+$/.test(f));
  if (!seq.length) return frames.includes('hurt') ? 'hurt' : null;
  return seq[Math.min(seq.length - 1, Math.floor((elapsed / HURT_TIME) * seq.length))];
}

/** folhas da grade têm 5 quadros de derrota: ~0,8 s */
export const DEATH_FPS = 6;
/** morte: death1..N (ou deathupN… na direção em que estava) uma vez e segura o último; null se o sprite não tem quadros de morte */
export function deathFrame(elapsed: number, frames: Role[], facing: Facing = 'side'): Role | null {
  const dir = cycle(frames, 'death', facing), seq = dir.length ? dir : cycle(frames, 'death', 'side');
  if (!seq.length) return null;
  return seq[Math.min(seq.length - 1, Math.max(0, Math.floor(elapsed * DEATH_FPS)))];
}
export function deathDuration(frames: Role[]): number { return frames.filter(f => /^death\d+$/.test(f)).length / DEATH_FPS; }

/** sprites do DS olham para a esquerda */
export function facingFlip(dirX: number): number { return dirX > 0.05 ? -1 : 1; }

export class SpriteLibrary {
  private textures = new Map<string, THREE.Texture>();
  private images = new Map<string, HTMLImageElement>();
  private constructor(private manifest: SpriteManifest | null) {}
  static empty() { return new SpriteLibrary(null); }

  static async load(base = './sprites/'): Promise<SpriteLibrary> {
    try {
      const res = await fetch(base + 'manifest.json');
      const lib = new SpriteLibrary(parseManifest(await res.json()));
      if (!lib.manifest) return SpriteLibrary.empty();
      await Promise.all(Object.entries(lib.manifest.sprites).map(([id, s]) => new Promise<void>(done => {
        const img = new Image();
        img.onload = () => {
          const tex = new THREE.Texture(img);
          tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
          tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
          lib.textures.set(id, tex); lib.images.set(id, img); done();
        };
        img.onerror = () => done(); // sem textura → placeholder
        img.src = base + s.file;
      })));
      return lib;
    } catch { return SpriteLibrary.empty(); }
  }
  has(id: string) { return this.textures.has(id); }
  info(id: string): SpriteInfo | null { return this.manifest?.sprites[id] ?? null; }
  /** textura nova (clone) por consumidor, para cada um controlar o próprio offset */
  texture(id: string): THREE.Texture | null {
    const t = this.textures.get(id); if (!t) return null;
    const info = this.info(id), g = info ? sheetGrid(info) : { cols: 5, rows: 1 };
    const c = t.clone(); c.needsUpdate = true; c.repeat.set(1 / g.cols, 1 / g.rows); c.offset.set(0, 1 - 1 / g.rows); return c;
  }
  image(id: string): HTMLImageElement | null { return this.images.get(id) ?? null; }
}
