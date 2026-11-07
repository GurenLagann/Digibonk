import * as THREE from 'three';
import { BOSSES, ENEMIES, MINIBOSSES } from '../data/enemies';
import { FORMS } from '../data/forms';
import { T } from '../data/tuning';
import type { RunState } from '../sim/run';
import { placeholderTexture } from './placeholder';
import { motionPose } from './motion';
import { facingFlip, frameIndex, idleFrame, type Role, type SpriteLibrary } from './sprites';

const DEFS = new Map<string, { name: string; color: number }>([...ENEMIES, ...MINIBOSSES, ...BOSSES].map(d => [d.id, { name: d.name, color: d.color }]));
const unitPlane = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
/** escala visual dos placeholders em relação ao tamanho de colisão */
const VIS = 1.6;
/** mundo por pixel dos sprites de V-pet */
const PX = 0.05;
export const FLIP_SPRITES = true;
/** altura visual dos inimigos com sprite = tamanho de colisão × ENEMY_VIS */
const ENEMY_VIS = 1.7;

function spriteMaterial(tex: THREE.Texture) {
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, depthWrite: true, side: THREE.DoubleSide });
}

interface Species { mesh: THREE.InstancedMesh; tex: THREE.Texture | null; frames: Role[]; height: number; phase: number }

export class Billboards {
  private species = new Map<string, Species>();
  private player: THREE.Mesh;
  private playerForm = '';
  private playerTex: THREE.Texture | null = null;
  private playerFrames: Role[] = [];
  private playerHeight = 1;
  private shadows: THREE.InstancedMesh;
  private m = new THREE.Matrix4(); private p = new THREE.Vector3(); private s = new THREE.Vector3();
  private ident = new THREE.Quaternion(); private qt = new THREE.Quaternion(); private qz = new THREE.Quaternion();
  private zAxis = new THREE.Vector3(0, 0, 1);
  private white = new THREE.Color(1, 1, 1); private flash = new THREE.Color(3, 3, 3);
  private counts = new Map<string, number>();

  constructor(private scene: THREE.Scene, private camera: THREE.Camera, private lib: SpriteLibrary) {
    this.player = new THREE.Mesh(unitPlane, spriteMaterial(placeholderTexture('_', '?', 0xffffff)));
    scene.add(this.player);
    const shadowGeo = new THREE.CircleGeometry(0.5, 16).rotateX(-Math.PI / 2);
    this.shadows = new THREE.InstancedMesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), T.MAX_ENEMIES + 32);
    this.shadows.frustumCulled = false;
    scene.add(this.shadows);
  }

  private geometryFor(id: string): { geo: THREE.BufferGeometry; tex: THREE.Texture | null; frames: Role[]; frameH: number } {
    const info = this.lib.info(id), tex = this.lib.texture(id);
    if (!info || !tex) return { geo: unitPlane, tex: null, frames: [], frameH: 0 };
    return { geo: new THREE.PlaneGeometry(info.frameW / info.frameH, 1).translate(0, 0.5, 0), tex, frames: info.frames, frameH: info.frameH };
  }

  private speciesFor(def: string, size: number): Species {
    let sp = this.species.get(def);
    if (!sp) {
      const g = this.geometryFor(def);
      const d = DEFS.get(def) ?? { name: def, color: 0xff00ff };
      const mat = spriteMaterial(g.tex ?? placeholderTexture('enemy:' + def, d.name, d.color));
      const mesh = new THREE.InstancedMesh(g.geo, mat, T.MAX_ENEMIES);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(T.MAX_ENEMIES * 3).fill(1), 3);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      // inimigos: altura pelo tamanho de jogo (as folhas foram ripadas em escalas diferentes)
      const height = g.tex ? size * ENEMY_VIS : size * VIS;
      sp = { mesh, tex: g.tex, frames: g.frames, height, phase: (this.species.size * 0.37) % 1 };
      this.species.set(def, sp);
    }
    return sp;
  }

  private setFrame(tex: THREE.Texture | null, frames: Role[], role: Role) {
    if (tex) tex.offset.x = frameIndex(role, frames) / frames.length;
  }

  /** quaternion da câmera inclinada no plano da tela (pivô nos pés) */
  private tilted(q: THREE.Quaternion, tilt: number): THREE.Quaternion {
    return this.qt.copy(q).multiply(this.qz.setFromAxisAngle(this.zAxis, tilt));
  }

  sync(run: RunState, time: number) {
    const q = this.camera.quaternion;
    this.counts.clear();
    let sh = 0;
    for (const e of run.pool.all) {
      if (!e || !e.alive) continue;
      const sp = this.speciesFor(e.def, e.size);
      const i = this.counts.get(e.def) ?? 0;
      if (i >= T.MAX_ENEMIES) continue;
      this.counts.set(e.def, i + 1);
      const flip = FLIP_SPRITES && sp.tex ? facingFlip(run.px - e.x) : 1;
      const pose = motionPose({ t: time, phase: (e.id * 0.618) % 1, moving: true, attack: 99, hurt: e.hitFlash > 0 ? 0.5 : 0 });
      this.m.compose(this.p.set(e.x, pose.y * sp.height, e.z), this.tilted(q, pose.tilt * flip), this.s.set(sp.height * flip * pose.sx, sp.height * pose.sy, 1));
      sp.mesh.setMatrixAt(i, this.m);
      sp.mesh.setColorAt(i, e.hitFlash > 0 ? this.flash : this.white);
      if (sh < T.MAX_ENEMIES + 31) {
        this.m.compose(this.p.set(e.x, 0.02, e.z), this.ident, this.s.set(e.size, 1, e.size * 0.6));
        this.shadows.setMatrixAt(sh++, this.m);
      }
    }
    for (const [def, sp] of this.species) {
      sp.mesh.count = this.counts.get(def) ?? 0;
      sp.mesh.instanceMatrix.needsUpdate = true;
      if (sp.mesh.instanceColor) sp.mesh.instanceColor.needsUpdate = true;
      this.setFrame(sp.tex, sp.frames, idleFrame(time, sp.phase));
    }

    // jogador
    const f = FORMS[run.prog.formId];
    const mat = this.player.material as THREE.MeshBasicMaterial;
    if (this.playerForm !== f.id) {
      this.playerForm = f.id;
      const g = this.geometryFor(f.id);
      this.playerTex?.dispose();
      this.playerTex = g.tex; this.playerFrames = g.frames;
      this.player.geometry = g.geo;
      mat.map = g.tex ?? placeholderTexture('form:' + f.id, f.name, f.color);
      mat.needsUpdate = true;
      this.playerHeight = g.tex ? THREE.MathUtils.clamp(g.frameH * PX, 1.2, 7) : f.size * VIS;
    }
    const c = run.combat;
    const fired = Math.min(...c.firedAgo);
    if (this.playerTex) {
      const role: Role = c.invuln > 0.3 ? 'hurt' : fired < 0.15 ? 'attack' : idleFrame(time);
      this.setFrame(this.playerTex, this.playerFrames, role);
    }
    const flip = FLIP_SPRITES && this.playerTex ? facingFlip(run.dirX) : 1;
    const hurt = Math.max(0, Math.min(1, (c.invuln - 0.3) / 0.2));
    const pose = motionPose({ t: time, phase: 0, moving: run.moving, attack: fired, hurt });
    this.player.position.set(run.px, pose.y * this.playerHeight, run.pz);
    this.player.quaternion.copy(this.tilted(q, pose.tilt * flip));
    this.player.scale.set(this.playerHeight * flip * pose.sx, this.playerHeight * pose.sy, 1);
    mat.color.copy(c.invuln > 0.35 ? this.flash : this.white);
    this.m.compose(this.p.set(run.px, 0.02, run.pz), this.ident, this.s.set(f.size, 1, f.size * 0.6));
    this.shadows.setMatrixAt(sh++, this.m);
    this.shadows.count = sh;
    this.shadows.instanceMatrix.needsUpdate = true;
  }
}
