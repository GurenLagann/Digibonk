import * as THREE from 'three';
import { T } from '../data/tuning';
import type { RunState } from '../sim/run';
import { chestPrice, type Chest } from '../sim/loot';
import { BIOME_IDS, biomeForPhase, buildBiome, type BiomeId, type BiomeView } from './biomes';
import { ALTAR_DIGIMON, ALTAR_HEIGHT, altarFrame, contentBand } from './altarSprite';
import { readPixels } from './footPad';
import { groundY, setGround } from './terrain';
import { frameIndex, frameOffset, sheetGrid, type SpriteLibrary } from './sprites';

export interface SceneLights { hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight }

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

const ALTAR_COLORS: Record<string, number> = { etemon: 0x9a3dff, datamon: 0x3dff8a, challenge: 0xff3a4a };

/** texto flutuante sobre o baú fechado: preço (pago), "Grátis…?" (amaldiçoado) ou nada (grátis) */
export function chestLabel(kind: Chest['kind'], bought: number): string | null {
  if (kind === 'paid') return `${chestPrice(bought)} Bits`;
  if (kind === 'cursed') return 'Grátis…?';
  return null;
}

/** sprite de canvas com o texto do rótulo (null se o canvas não estiver disponível) */
function labelSprite(text: string, cursed: boolean): THREE.Sprite | null {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d'); if (!g) return null;
  g.fillStyle = cursed ? 'rgba(40,10,70,.85)' : 'rgba(8,22,43,.85)';
  g.beginPath(); g.roundRect(4, 6, 248, 52, 14); g.fill();
  g.strokeStyle = cursed ? '#b04dff' : '#ffd43b'; g.lineWidth = 3; g.stroke();
  g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = cursed ? '#e2b8ff' : '#ffe27a'; g.fillText(text, 128, 33);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  sp.renderOrder = 10; sp.scale.set(2.4, 0.6, 1);
  return sp;
}

export class MapView {
  private arena: THREE.Group;
  private arenaRing: THREE.Mesh;
  private portals: THREE.Group[] = [];
  private exitPortal: THREE.Group;
  private inZone = false;
  private terminal: THREE.Group;
  private altarMeshes = new Map<number, THREE.Group>();
  private sprites: SpriteLibrary | null = null;
  private altarKey = '';
  private altar: THREE.Group;
  private altarRing: THREE.Mesh;
  private points: THREE.Mesh[] = [];
  private chests = new Map<number, THREE.Mesh>();
  private chestGeo = new THREE.BoxGeometry(1.2, 0.9, 0.9);
  private chestMat = new THREE.MeshLambertMaterial({ color: 0xc8892a });
  /** baú amaldiçoado: escuro, com brilho roxo */
  private cursedMat = new THREE.MeshLambertMaterial({ color: 0x2a1a3a, emissive: 0x8a2be2, emissiveIntensity: 0.9 });
  /** rótulo flutuante de cada baú (texto atual guardado para só refazer a textura quando mudar) */
  private chestLabels = new Map<number, { sprite: THREE.Sprite; text: string }>();
  private phaseKey = -1;
  private lastRun: RunState | null = null;

  private view: BiomeView | null = null;
  private biomeId: BiomeId = 'floresta-dw1';
  /** bioma forçado pelo debug (null = pela fase) */
  private biomeOverride: BiomeId | null = null;
  private zoneColor = new THREE.Color(0x050b16);

  constructor(private scene: THREE.Scene, private lights?: SceneLights) {
    // chão, borda e árvores/pedras dos obstáculos vêm do bioma
    this.setBiome('floresta-dw1');

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

    // Terminal Jogress: duas hélices (laranja e ciano) girando sobre uma base
    this.terminal = new THREE.Group();
    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 0.25, 12), new THREE.MeshLambertMaterial({ color: 0x24324a }));
    tBase.position.y = 0.12;
    const h1 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 6, 24), new THREE.MeshBasicMaterial({ color: 0xff8a3d }));
    const h2 = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.12, 6, 24), new THREE.MeshBasicMaterial({ color: 0x1fd6ff }));
    h1.position.y = h2.position.y = 1.5; h2.rotation.y = Math.PI / 2;
    this.terminal.add(tBase, h1, h2); this.terminal.visible = false;
    scene.add(this.terminal);
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
      g.position.set(p.x, groundY(p.x, p.z), p.z);
      const c = PORTAL_COLORS[p.attr] ?? 0xffffff;
      for (const m of g.children) ((m as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(c);
      g.rotation.y = time * 1.8;
      // pisca nos últimos 5 s
      g.children[1].visible = p.t > 5 || Math.sin(time * 12) > 0;
    });
    const ex = run.zone?.exit;
    this.exitPortal.visible = !!ex && run.relicOffer === null;
    if (ex) { this.exitPortal.position.set(ex.x, groundY(ex.x, ex.z), ex.z); this.exitPortal.rotation.y = time * 1.8; }
    // altares da fase: o Digimon (Etemon, Datamon, Ogremon no Desafio) parado no mapa como NPC; usado fica cinza e para
    const ak = run.altars.map(a => a.id).join(',');
    if (ak !== this.altarKey) {
      this.altarKey = ak;
      for (const g of this.altarMeshes.values()) this.scene.remove(g);
      this.altarMeshes.clear();
      for (const a of run.altars) {
        const g = new THREE.Group();
        const id = ALTAR_DIGIMON[a.kind], info = this.sprites?.info(id), tex = this.sprites?.texture(id);
        if (info && tex) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1 }));
          // desenho (não o quadro) com ALTAR_HEIGHT de altura, pés no chão: mede a margem no 1º quadro do parado
          const img = this.sprites!.image(id), px = img ? readPixels(img) : null, gr = sheetGrid(info);
          const band = px ? contentBand(px, frameIndex(altarFrame(0, info.frames, false), info.frames), gr.cols, gr.rows) : { top: 0, bottom: 1 };
          const h = ALTAR_HEIGHT / (band.bottom - band.top);
          sp.center.set(0.5, 1 - band.bottom);
          sp.scale.set(h * info.frameW / info.frameH, h, 1);
          g.add(sp);
        } else {
          // sem folha: cristal colorido
          const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), new THREE.MeshBasicMaterial({ color: ALTAR_COLORS[a.kind] }));
          crystal.position.y = 1.2;
          g.add(crystal);
        }
        g.position.set(a.x, groundY(a.x, a.z), a.z);
        this.scene.add(g); this.altarMeshes.set(a.id, g);
      }
    }
    for (const a of run.altars) {
      const g = this.altarMeshes.get(a.id); if (!g) continue;
      g.visible = !run.zone;
      const top = g.children[0];
      if (top instanceof THREE.Sprite) {
        const info = this.sprites!.info(ALTAR_DIGIMON[a.kind])!;
        const o = frameOffset(frameIndex(altarFrame(time + a.id * 0.37, info.frames, a.used), info.frames), info);
        top.material.map!.offset.set(o.x, o.y);
        top.material.color.setHex(a.used ? 0x6a6a72 : 0xffffff);
      } else if (top) {
        ((top as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(a.used ? 0x555560 : ALTAR_COLORS[a.kind]);
        top.rotation.y = time * 1.5; top.position.y = 1.2 + (a.used ? 0 : Math.sin(time * 2 + a.id) * 0.15);
      }
    }
    const js = run.jogressSpot;
    this.terminal.visible = !!js && !run.zone;
    if (js) { this.terminal.position.set(js.x, groundY(js.x, js.z), js.z); this.terminal.rotation.y = time * 2; this.terminal.children[1].rotation.x = time * 3; }
    // dentro da arena: céu e nevoeiro escuros
    const z = !!run.zone;
    if (z !== this.inZone) { this.inZone = z; this.applySky(); }
    (this.arenaRing.material as THREE.MeshBasicMaterial).color.setHex(Math.sin(time * 3) > 0 ? 0x5ae8ff : 0x1fd6ff);
  }

  private clearChestLabels() {
    for (const l of this.chestLabels.values()) { this.scene.remove(l.sprite); l.sprite.material.map?.dispose(); l.sprite.material.dispose(); }
    this.chestLabels.clear();
  }

  /** preço sobre baú pago fechado (refeito quando o preço muda), "Grátis…?" no amaldiçoado; some quando aberto */
  private syncChestLabels(run: RunState, time: number) {
    if (run.zone) { for (const l of this.chestLabels.values()) l.sprite.visible = false; return; }
    for (const c of run.chests) {
      const text = chestLabel(c.kind, run.chestsBought);
      const cur = this.chestLabels.get(c.id);
      if (!text || c.opened) { if (cur) cur.sprite.visible = false; continue; }
      let l = cur;
      if (!l || l.text !== text) {
        if (l) { this.scene.remove(l.sprite); l.sprite.material.map?.dispose(); l.sprite.material.dispose(); this.chestLabels.delete(c.id); }
        const sprite = labelSprite(text, c.kind === 'cursed');
        if (!sprite) continue;
        this.scene.add(sprite);
        l = { sprite, text }; this.chestLabels.set(c.id, l);
      }
      l.sprite.visible = !run.zone;
      l.sprite.position.set(c.x, groundY(c.x, c.z) + 1.7 + Math.sin(time * 2 + c.id) * 0.08, c.z);
    }
  }

  /** folhas de sprite (carregadas depois do mapa): altares passam a mostrar o Digimon */
  setSprites(lib: SpriteLibrary): void { this.sprites = lib; this.altarKey = ''; }

  /** ao voltar ao título (ex.: morreu na Zona Digital): sai do estado de arena e reaplica céu/nevoeiro/luz do bioma */
  resetForTitle(): void { this.inZone = false; this.applySky(); }

  get biome(): BiomeId { return this.biomeId; }

  /** monta o bioma (troca o anterior); no mesmo bioma não faz nada */
  setBiome(id: BiomeId): void {
    if (this.view && id === this.biomeId) return;
    if (this.view) { this.scene.remove(this.view.group); this.view.dispose(); }
    this.biomeId = id;
    this.view = buildBiome(id);
    setGround(this.view.height);
    // chão novo: altares, anel do chefe, pontos e baús são postos na altura do chão só ao criar → recriar no próximo sync
    this.altarKey = ''; this.phaseKey = -1;
    this.scene.add(this.view.group);
    this.applySky();
  }

  /** debug: força o próximo bioma da lista e devolve o novo */
  cycleBiome(): BiomeId {
    this.biomeOverride = BIOME_IDS[(BIOME_IDS.indexOf(this.biomeId) + 1) % BIOME_IDS.length];
    this.setBiome(this.biomeOverride);
    return this.biomeOverride;
  }

  /** céu, nevoeiro e luz: os do bioma, ou escuros dentro da Zona Digital */
  private applySky() {
    const v = this.view; if (!v) return;
    v.group.visible = !this.inZone; // a silhueta não tem nevoeiro: esconder na arena
    if (this.inZone) {
      this.scene.background = this.zoneColor;
      this.scene.fog?.color.copy(this.zoneColor);
      return;
    }
    this.scene.background = v.sky.background;
    this.scene.fog?.color.setHex(v.sky.fog);
    const l = this.lights; if (!l) return;
    l.hemi.color.setHex(v.light.sky); l.hemi.groundColor.setHex(v.light.ground); l.hemi.intensity = v.light.hemi;
    l.sun.color.setHex(v.light.sun); l.sun.intensity = v.light.sunIntensity;
  }

  /** por quadro, com ou sem partida: camPos = posição da câmera, target = parceiro (para a transparência das copas) */
  update(time: number, camPos: THREE.Vector3, target: THREE.Vector3): void {
    if (this.view && !this.inZone) this.view.update(time, camPos, target);
  }

  sync(run: RunState, time: number) {
    this.setBiome(this.biomeOverride ?? biomeForPhase(run.phase.phase));
    this.syncPortals(run, time);
    const ph = run.phase;
    const key = ph.phase * 1000 + run.chests.length;
    if (key !== this.phaseKey || run !== this.lastRun) {
      this.lastRun = run;
      this.phaseKey = key;
      this.altar.position.set(ph.bossAltar.x, groundY(ph.bossAltar.x, ph.bossAltar.z), ph.bossAltar.z);
      for (const pt of this.points) this.scene.remove(pt);
      this.points = [];
      if (ph.mission.kind === 'activate') for (const p of ph.mission.points) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3, 32), new THREE.MeshBasicMaterial({ color: 0x5affd8, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, groundY(p.x, p.z) + 0.05, p.z); this.scene.add(ring); this.points.push(ring);
      }
      for (const c of this.chests.values()) this.scene.remove(c);
      this.chests.clear();
      this.clearChestLabels();
      for (const c of run.chests) {
        const mesh = new THREE.Mesh(this.chestGeo, c.kind === 'cursed' ? this.cursedMat : this.chestMat); mesh.position.set(c.x, groundY(c.x, c.z) + 0.45, c.z); this.scene.add(mesh); this.chests.set(c.id, mesh);
      }
    }
    for (const c of run.chests) { const m = this.chests.get(c.id); if (m) m.visible = !c.opened; }
    this.syncChestLabels(run, time);
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
