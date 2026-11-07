import * as THREE from 'three';
import { BOSSES, ENEMIES, MINIBOSSES } from '../data/enemies';
import { FORMS } from '../data/forms';
import { T } from '../data/tuning';
import type { RunState } from '../sim/run';
import { placeholderTexture } from './placeholder';

const DEFS = new Map<string, { name: string; color: number }>([...ENEMIES, ...MINIBOSSES, ...BOSSES].map(d => [d.id, { name: d.name, color: d.color }]));
const plane = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
/** escala visual dos sprites em relação ao tamanho de colisão */
const VIS = 1.6;
/** espelhar pela direção: desligado enquanto os sprites são placeholders com texto (Plano 2 liga) */
export const FLIP_SPRITES = false;

function spriteMaterial(tex: THREE.Texture) {
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, depthWrite: true, side: THREE.DoubleSide });
}

export class Billboards {
  private meshes = new Map<string, THREE.InstancedMesh>();
  private player: THREE.Mesh;
  private playerForm = '';
  private shadows: THREE.InstancedMesh;
  private m = new THREE.Matrix4();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private white = new THREE.Color(1, 1, 1);
  private flash = new THREE.Color(3, 3, 3);
  private counts = new Map<string, number>();
  private ident = new THREE.Quaternion();

  constructor(private scene: THREE.Scene, private camera: THREE.Camera) {
    this.player = new THREE.Mesh(plane, spriteMaterial(placeholderTexture('_', '?', 0xffffff)));
    scene.add(this.player);
    const shadowGeo = new THREE.CircleGeometry(0.5, 16).rotateX(-Math.PI / 2);
    this.shadows = new THREE.InstancedMesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }), T.MAX_ENEMIES + 32);
    this.shadows.frustumCulled = false;
    scene.add(this.shadows);
  }

  private meshFor(def: string): THREE.InstancedMesh {
    let mesh = this.meshes.get(def);
    if (!mesh) {
      const d = DEFS.get(def) ?? { name: def, color: 0xff00ff };
      mesh = new THREE.InstancedMesh(plane, spriteMaterial(placeholderTexture('enemy:' + def, d.name, d.color)), T.MAX_ENEMIES);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(T.MAX_ENEMIES * 3).fill(1), 3);
      mesh.frustumCulled = false;
      this.scene.add(mesh); this.meshes.set(def, mesh);
    }
    return mesh;
  }

  sync(run: RunState, time: number) {
    const q = this.camera.quaternion;
    this.counts.clear();
    let sh = 0;
    for (const e of run.pool.all) {
      if (!e || !e.alive) continue;
      const mesh = this.meshFor(e.def);
      const i = this.counts.get(e.def) ?? 0;
      if (i >= T.MAX_ENEMIES) continue;
      this.counts.set(e.def, i + 1);
      const bob = Math.abs(Math.sin(time * 9 + e.id)) * 0.08 * e.size;
      const flip = FLIP_SPRITES && e.x > run.px ? -1 : 1;
      this.m.compose(this.p.set(e.x, bob, e.z), q, this.s.set(e.size * VIS * flip, e.size * VIS, 1));
      mesh.setMatrixAt(i, this.m);
      mesh.setColorAt(i, e.hitFlash > 0 ? this.flash : this.white);
      if (sh < T.MAX_ENEMIES + 31) {
        this.m.compose(this.p.set(e.x, 0.02, e.z), this.ident, this.s.set(e.size, 1, e.size * 0.6));
        this.shadows.setMatrixAt(sh++, this.m);
      }
    }
    for (const [def, mesh] of this.meshes) {
      mesh.count = this.counts.get(def) ?? 0;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // player
    const f = FORMS[run.prog.formId];
    if (this.playerForm !== f.id) {
      this.playerForm = f.id;
      (this.player.material as THREE.MeshBasicMaterial).map = placeholderTexture('form:' + f.id, f.name, f.color);
      (this.player.material as THREE.MeshBasicMaterial).needsUpdate = true;
    }
    const c = run.combat;
    const fired = Math.min(...c.firedAgo);
    const squash = fired < 0.08 ? 0.85 : 1;
    const bob = run.moving ? Math.abs(Math.sin(time * 10)) * 0.05 * f.size * 2 : 0;
    const flip = FLIP_SPRITES && c.facingX < 0 ? -1 : 1;
    this.player.position.set(run.px, bob, run.pz);
    this.player.quaternion.copy(q);
    this.player.scale.set(f.size * VIS * flip * (2 - squash), f.size * VIS * squash, 1);
    const mat = this.player.material as THREE.MeshBasicMaterial;
    mat.color.copy(c.invuln > 0.35 ? this.flash : this.white);
    this.m.compose(this.p.set(run.px, 0.02, run.pz), this.ident, this.s.set(f.size, 1, f.size * 0.6));
    this.shadows.setMatrixAt(sh++, this.m);
    this.shadows.count = sh;
    this.shadows.instanceMatrix.needsUpdate = true;
  }
}
