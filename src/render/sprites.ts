import * as THREE from 'three';

/** walk1..walk24 (de lado), walkupN / walkdownN (de costas / de frente): quadros de caminhada na ordem do ciclo */
export type Role = 'idle1' | 'idle2' | 'idle3' | 'attack' | 'hurt' | 'idleup' | 'idledown'
  | `walk${number}` | `walkup${number}` | `walkdown${number}` | `hurt${number}` | `death${number}`;
export type Facing = 'side' | 'up' | 'down';
const POSE_ROLES: readonly string[] = ['idle1', 'idle2', 'idle3', 'attack', 'hurt', 'idleup', 'idledown'];
const isRole = (f: unknown): f is Role => typeof f === 'string'
  && (POSE_ROLES.includes(f) || /^walk(up|down)?([1-9]|1\d|2[0-4])$/.test(f) || /^(hurt|death)([1-9]|[1-5]\d|6[0-4])$/.test(f));
const WALK_RE: Record<Facing, RegExp> = { side: /^walk\d+$/, up: /^walkup\d+$/, down: /^walkdown\d+$/ };
export interface SpriteInfo { file: string; frameW: number; frameH: number; frames: Role[]; source: number }
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
    sprites[id] = { file: s.file, frameW: s.frameW, frameH: s.frameH, frames: s.frames as Role[], source: typeof s.source === 'number' ? s.source : 0 };
  }
  return { version: 1, sprites };
}

export function frameIndex(role: Role, frames: Role[]): number { const i = frames.indexOf(role); return i < 0 ? 0 : i; }

const IDLE_CYCLE: Role[] = ['idle1', 'idle2', 'idle3', 'idle2'];
export function idleFrame(time: number, phase = 0): Role { return IDLE_CYCLE[Math.floor((time + phase) * 6) % 4]; }

const WALK_FPS = 12;
/**
 * Com caminhada desenhada: andando → ciclo da direção (12 quadros/s; sem quadros verticais usa os de lado),
 * parado → pose fixa da direção (idleup/idledown, senão idle1). Sem caminhada desenhada → ciclo de idle.
 */
export function moveFrame(time: number, phase: number, moving: boolean, frames: Role[], facing: Facing = 'side'): Role {
  const side = frames.filter(f => WALK_RE.side.test(f));
  const dir = facing === 'side' ? side : frames.filter(f => WALK_RE[facing].test(f));
  const walk = dir.length ? dir : side;
  if (moving && walk.length) return walk[Math.floor((time + phase) * WALK_FPS) % walk.length];
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
/** dano: hurt1..N espalhados na janela de HURT_TIME; sem eles, a pose única 'hurt'. null quando a janela passou */
export function hurtFrame(elapsed: number, frames: Role[]): Role | null {
  if (elapsed < 0 || elapsed > HURT_TIME) return null;
  const seq = frames.filter(f => /^hurt\d+$/.test(f));
  if (!seq.length) return 'hurt';
  return seq[Math.min(seq.length - 1, Math.floor((elapsed / HURT_TIME) * seq.length))];
}

export const DEATH_FPS = 12;
/** morte: death1..N uma vez e segura o último; null se o sprite não tem quadros de morte */
export function deathFrame(elapsed: number, frames: Role[]): Role | null {
  const seq = frames.filter(f => /^death\d+$/.test(f));
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
    const c = t.clone(); c.needsUpdate = true; c.repeat.set(1 / (this.info(id)?.frames.length ?? 5), 1); return c;
  }
  image(id: string): HTMLImageElement | null { return this.images.get(id) ?? null; }
}
