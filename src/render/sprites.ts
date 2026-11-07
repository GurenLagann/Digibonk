import * as THREE from 'three';

export type Role = 'idle1' | 'idle2' | 'idle3' | 'attack' | 'hurt' | 'walk1' | 'walk2' | 'walk3' | 'walk4';
const ROLES: readonly Role[] = ['idle1', 'idle2', 'idle3', 'attack', 'hurt', 'walk1', 'walk2', 'walk3', 'walk4'];
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
      || !Array.isArray(s.frames) || !s.frames.length || !s.frames.every(f => ROLES.includes(f as Role))) return null;
    sprites[id] = { file: s.file, frameW: s.frameW, frameH: s.frameH, frames: s.frames as Role[], source: typeof s.source === 'number' ? s.source : 0 };
  }
  return { version: 1, sprites };
}

export function frameIndex(role: Role, frames: Role[]): number { const i = frames.indexOf(role); return i < 0 ? 0 : i; }

const IDLE_CYCLE: Role[] = ['idle1', 'idle2', 'idle3', 'idle2'];
export function idleFrame(time: number, phase = 0): Role { return IDLE_CYCLE[Math.floor((time + phase) * 6) % 4]; }

const WALK_CYCLE: Role[] = ['walk1', 'walk2', 'walk3', 'walk4'];
/** andando e com quadros de caminhada → ciclo de caminhada (8 quadros/s); senão o ciclo de idle */
export function moveFrame(time: number, phase: number, moving: boolean, frames: Role[]): Role {
  if (moving && frames.includes('walk1')) return WALK_CYCLE[Math.floor((time + phase) * 8) % 4];
  return idleFrame(time, phase);
}

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
