# Relevo andável Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chão com colinas (florestas) e plataformas com rampas (fábrica/núcleo), com tudo que fica no chão acompanhando a altura.

**Architecture:** Função de altura pura por bioma em `src/render/terrain.ts`; `BiomeView.height`; um `groundY` global trocado por `MapView.setBiome`; consumidores de render somam `groundY(x,z)` no y. Sim intocado.

**Tech Stack:** TypeScript, three r187, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-15-digibonk-relevo-design.md`

## Global Constraints
- Altura do chão em [0, 2.2]; 0 no nascimento (raio 6) e para |x| ou |z| > T.MAP_HALF + 40.
- Sim (src/sim) não muda.
- 60 fps no Chrome.

## Review Focus
- Zona Digital (arena em T.ZONE.CENTER) plana e com tudo no y antigo. (Task 1 teste)
- Voltar ao título / trocar bioma no debug troca a altura junto (nada fica flutuando no bioma novo). (Task 3)
- Decalque plano sobre rampa (grade/neon) não pode aparecer meio enterrado. (Task 2 teste)
- Áreas de golpe em encosta continuam visíveis. (Task 3)
- Objetos altos fora dos obstáculos continuam proibidos, medindo a partir do chão local. (Task 2 teste)

---

### Task 1: Geradores de altura (`src/render/terrain.ts`)
**Interfaces — Produces:**
- `type HeightFn = (x: number, z: number) => number`
- `hills(seed: number, amp: number): HeightFn` (suave; inclinação ≤ 0.45)
- `terraces(seed: number, step: number, levels: number, ramp: number): HeightFn` (valores em {0, step, 2·step…} exceto nas rampas)
- `setGround(fn: HeightFn): void`, `groundY(x: number, z: number): number` (padrão: 0)
- `isFlat(fn, x, z, halfW, halfD, rot): boolean` (cantos e centro do retângulo com a mesma altura ±0.01)

- [ ] Testes (`tests/render/terrain.test.ts`): limites [0, 2.2]; 0 em (0,0), (4,3) e (T.MAP_HALF+50, 0) e em T.ZONE.CENTER; determinístico; `hills` inclinação máx. amostrada ≤ 0.45; `terraces` maioria dos pontos (≥ 70%) exatamente num nível; existe mais de um nível dentro do mapa; `groundY` segue `setGround`.
- [ ] Ver falhar → implementar → passar → commit `feat(relevo): geradores de altura do chão`.

### Task 2: Biomas com relevo
**Files:** `src/render/biomes/{types,common,forestDw1,forestDw3,factory}.ts`, `tests/render/biomes.test.ts`
**Interfaces — Consumes:** Task 1. **Produces:** `BiomeView.height: HeightFn`; `groundMesh(bag, height, map, color)` em common (malha deslocada na área jogável+borda, plano grande embaixo).
- Florestas: `hills`; Fábrica/Núcleo: `terraces` (2 níveis de 0.9, rampa ~3). Obstáculos, decoração e borda posicionados em `height(x,z)`. Decalques (manchas, grades, painéis, faixas, neon) só quando `isFlat` — nas florestas as manchas seguem a malha? → manchas viram decalque só onde plano ou somem; aceitável reduzir quantidade.
- [ ] Testes: cada bioma expõe `height` com máx. > 0.5 dentro do mapa; teste "nada alto" passa a medir `box.max.y - height(c.x, c.z)` e ignora `ground`; decalques: para cada instância de `floor-*`, `isFlat` verdadeiro; malha do chão: vértice em (x,z) tem y = height(x,z).
- [ ] Ver falhar → implementar → passar → commit `feat(relevo): florestas com colinas, fábrica e núcleo com plataformas`.

### Task 3: Render acompanha o chão
**Files:** `src/render/{map,billboards,vfx,camera}.ts`, `src/main.ts`, testes existentes de render/map
**Interfaces — Consumes:** `setGround`, `groundY`, `BiomeView.height`.
- `MapView.setBiome` chama `setGround(view.height)`; Zona Digital: dentro da arena `groundY` dá 0 (já garantido pela Task 1).
- Billboards (sprite + sombra), vfx (projéteis, hostis, áreas com `depthTest:false`, itens, números), map (portais, saída, altares/NPCs, terminal, altar do chefe, pontos de missão, baús) somam `groundY`.
- `OrbitCamera.follow(x, z, y = 0)`: olha para `y + LOOK_HEIGHT`; altura suavizada (lerp ~10/s) para degraus não darem tranco.
- [ ] Testes: `follow` com y desloca câmera e alvo; teste do MapView: após `setBiome('fabrica')`, `groundY` = `view.height`.
- [ ] Ver falhar → implementar → passar → build → Chrome (4 biomas, subir rampa, inimigos/itens/baús no chão, Zona Digital plana, fps) → commit `feat(relevo): personagens, efeitos, objetos e câmera seguem o chão`.
