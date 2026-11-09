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

/** chão da Zona Digital: placas escuras com grade ciano */
function arenaTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#071226'; g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#0b1d3a'; g.fillRect(2, 2, 28, 28); g.fillRect(34, 34, 28, 28);
  g.strokeStyle = '#1fd6ff'; g.globalAlpha = 0.55; g.lineWidth = 1; g.strokeRect(0.5, 0.5, 63, 63);
  g.globalAlpha = 0.25; g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 64); g.moveTo(0, 32); g.lineTo(64, 32); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(12, 12);
  t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** cor do portal pelo atributo do guardião */
const PORTAL_COLORS: Record<string, number> = { vaccine: 0x3d9bff, data: 0x3dff9b, virus: 0xb04dff, free: 0xffd43b };

export class MapView {
  private arena: THREE.Group;
  private arenaRing: THREE.Mesh;
  private portals: THREE.Group[] = [];
  private exitPortal: THREE.Group;
  private inZone = false;
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

    // Zona Digital: arena separada, longe do mapa (o nevoeiro esconde um do outro)
    const C = T.ZONE.CENTER, R = T.ZONE.RADIUS;
    this.arena = new THREE.Group(); this.arena.position.set(C.x, 0, C.z);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(R + 8, 48), new THREE.MeshBasicMaterial({ map: arenaTexture() }));
    floor.rotation.x = -Math.PI / 2;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.3, R + 0.3, 3, 48, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x1fd6ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
    wall.position.y = 1.5;
    this.arenaRing = new THREE.Mesh(new THREE.TorusGeometry(R + 0.3, 0.12, 6, 64), new THREE.MeshBasicMaterial({ color: 0x5ae8ff }));
    this.arenaRing.rotation.x = -Math.PI / 2; this.arenaRing.position.y = 0.08;
    const cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({ color: 0x1fd6ff, transparent: true, opacity: 0.5 }), 24);
    const mm = new THREE.Matrix4();
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; cubes.setMatrixAt(i, mm.makeTranslation(Math.cos(a) * (R + 4), 2 + (i % 3), Math.sin(a) * (R + 4))); }
    this.arena.add(floor, wall, this.arenaRing, cubes);
    scene.add(this.arena);
    this.exitPortal = this.makePortal(0x5ae8ff);
    this.exitPortal.visible = false;
  }

  /** anel vertical girando sobre um disco brilhante */
  private makePortal(color: number): THREE.Group {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.18, 8, 32), new THREE.MeshBasicMaterial({ color }));
    ring.position.y = 1.6;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.15, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
    disc.position.y = 1.6;
    const glow = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.9, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.4, side: THREE.DoubleSide }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.06;
    g.add(ring, disc, glow);
    this.scene.add(g);
    return g;
  }

  private syncPortals(run: RunState, time: number) {
    while (this.portals.length < run.portals.length) this.portals.push(this.makePortal(0xffffff));
    this.portals.forEach((g, i) => {
      const p = run.portals[i];
      g.visible = !!p && !run.zone;
      if (!p) return;
      g.position.set(p.x, 0, p.z);
      const c = PORTAL_COLORS[p.attr] ?? 0xffffff;
      for (const m of g.children) ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(c);
      g.rotation.y = time * 1.8;
      // pisca nos últimos 5 s
      g.children[1].visible = p.t > 5 || Math.sin(time * 12) > 0;
    });
    const ex = run.zone?.exit;
    this.exitPortal.visible = !!ex && run.relicOffer === null;
    if (ex) { this.exitPortal.position.set(ex.x, 0, ex.z); this.exitPortal.rotation.y = time * 1.8; }
    // dentro da arena: céu e nevoeiro escuros
    const z = !!run.zone;
    if (z !== this.inZone) {
      this.inZone = z;
      const col = z ? 0x050b16 : 0x8fc8ff;
      (this.scene.background as THREE.Color).setHex(col);
      this.scene.fog?.color.setHex(col);
    }
    (this.arenaRing.material as THREE.MeshBasicMaterial).color.setHex(Math.sin(time * 3) > 0 ? 0x5ae8ff : 0x1fd6ff);
  }

  sync(run: RunState, time: number) {
    this.syncPortals(run, time);
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
