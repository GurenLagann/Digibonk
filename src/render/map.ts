import * as THREE from 'three';
import { T } from '../data/tuning';
import { MAP_OBSTACLES } from '../sim/map';
import type { RunState } from '../sim/run';

function groundTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  for (let y = 0; y < 64; y += 4) for (let x = 0; x < 64; x += 4) {
    const v = 0.85 + Math.random() * 0.15 + (((x + y) / 4) % 2 ? 0.03 : 0);
    g.fillStyle = `rgb(${Math.round(92 * v)},${Math.round(160 * v)},${Math.round(72 * v)})`;
    g.fillRect(x, y, 4, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(50, 50);
  t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class MapView {
  private altar: THREE.Group;
  private altarRing: THREE.Mesh;
  private points: THREE.Mesh[] = [];
  private chests = new Map<number, THREE.Mesh>();
  private chestGeo = new THREE.BoxGeometry(1.2, 0.9, 0.9);
  private chestMat = new THREE.MeshLambertMaterial({ color: 0xc8892a });
  private phaseKey = -1;
  private lastRun: RunState | null = null;

  constructor(private scene: THREE.Scene) {
    const size = T.MAP_HALF * 2 + 40;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map: groundTexture() }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    // borda: rochedos
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
    const wallGeo = new THREE.BoxGeometry(T.MAP_HALF * 2 + 6, 4, 3);
    for (const [x, z, rot] of [[0, -T.MAP_HALF - 2, 0], [0, T.MAP_HALF + 2, 0], [-T.MAP_HALF - 2, 0, 1], [T.MAP_HALF + 2, 0, 1]] as const) {
      const w = new THREE.Mesh(wallGeo, wallMat); w.position.set(x, 2, z); w.rotation.y = rot ? Math.PI / 2 : 0; scene.add(w);
    }

    const trees = MAP_OBSTACLES.filter(o => o.kind === 'tree'), rocks = MAP_OBSTACLES.filter(o => o.kind === 'rock');
    const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.35, 1.6, 6), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }), trees.length);
    const crown = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 2.6, 7), new THREE.MeshLambertMaterial({ color: 0x2f7a3a, flatShading: true }), trees.length);
    const rock = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ color: 0x8a8a92, flatShading: true }), rocks.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    trees.forEach((o, i) => {
      trunk.setMatrixAt(i, m.compose(p.set(o.x, 0.8, o.z), q.identity(), s.set(o.r, 1, o.r)));
      crown.setMatrixAt(i, m.compose(p.set(o.x, 1.6 + o.r * 1.1, o.z), q.identity(), s.set(o.r * 1.3, o.r * 1.1, o.r * 1.3)));
    });
    rocks.forEach((o, i) => rock.setMatrixAt(i, m.compose(p.set(o.x, o.r * 0.4, o.z), q.setFromEuler(new THREE.Euler(0, o.x, 0)), s.set(o.r, o.r * 0.8, o.r))));
    scene.add(trunk, crown, rock);

    this.altar = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.4, 0.12, 16), new THREE.MeshLambertMaterial({ color: 0x5a4a7a }));
    base.position.y = 0.06;
    this.altarRing = new THREE.Mesh(new THREE.TorusGeometry(4, 0.15, 6, 32), new THREE.MeshBasicMaterial({ color: 0xff3a5a }));
    this.altarRing.rotation.x = -Math.PI / 2; this.altarRing.position.y = 0.15;
    this.altar.add(base, this.altarRing);
    scene.add(this.altar);
  }

  sync(run: RunState, time: number) {
    const ph = run.phase;
    const key = ph.phase * 1000 + run.chests.length;
    if (key !== this.phaseKey || run !== this.lastRun) {
      this.lastRun = run;
      this.phaseKey = key;
      this.altar.position.set(ph.bossAltar.x, 0, ph.bossAltar.z);
      for (const pt of this.points) this.scene.remove(pt);
      this.points = [];
      if (ph.mission.kind === 'activate') for (const p of ph.mission.points) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3, 32), new THREE.MeshBasicMaterial({ color: 0x5affd8, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, 0.05, p.z); this.scene.add(ring); this.points.push(ring);
      }
      for (const c of this.chests.values()) this.scene.remove(c);
      this.chests.clear();
      for (const c of run.chests) {
        const mesh = new THREE.Mesh(this.chestGeo, this.chestMat); mesh.position.set(c.x, 0.45, c.z); this.scene.add(mesh); this.chests.set(c.id, mesh);
      }
    }
    for (const c of run.chests) { const m = this.chests.get(c.id); if (m) m.visible = !c.opened; }
    if (ph.mission.kind === 'activate') ph.mission.points.forEach((p, i) => {
      const ring = this.points[i]; if (!ring) return;
      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.color.setHex(p.charge >= 1 ? 0x3aff6a : 0x5affd8);
      ring.scale.setScalar(1 + (p.charge < 1 ? Math.sin(time * 4) * 0.04 : 0));
    });
    const on = ph.bossUnlocked && !ph.bossActive;
    (this.altarRing.material as THREE.MeshBasicMaterial).color.setHex(on ? 0xff3a5a : 0x5a5a6a);
    this.altarRing.scale.setScalar(on ? 1 + Math.sin(time * 5) * 0.08 : 1);
  }
}
