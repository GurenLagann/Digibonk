# Câmera em terceira pessoa + biomas Floresta DW1/DW3 — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a câmera fixa de cima por uma câmera orbital estilo PokéBonk (mouse + analógico direito), com movimento e vistas de sprite relativos à câmera, inimigos nascendo fora da vista, e dois biomas de floresta (DW1 e DW3) alternando por fase.

**Architecture:** Toda a matemática de câmera (rotação por yaw, vista do sprite, cone de visão) fica em funções puras em `src/core/view.ts`, usadas pelo `main.ts` (movimento), pelo `director` (spawn) e pelos `billboards` (vista). A câmera vira uma classe `OrbitCamera` em `src/render/camera.ts`. Biomas são objetos de dados + construtores em `src/render/biomes/`, e o `MapView` passa a montar chão/árvores/borda/céu a partir do bioma da fase.

**Tech Stack:** TypeScript, Three.js, Vite, vitest + happy-dom, ImageMagick (`magick`) para gerar texturas.

**Spec:** `docs/superpowers/specs/2026-11-15-digibonk-camera-e-biomas-floresta-design.md`

## Global Constraints

- Sem mudança de mecânica: `MAP_OBSTACLES` (posições/raios), `T.MAP_HALF` = 100, colisão, golpes, ritmo/quantidade de spawns ficam iguais. Única exceção: **onde** os inimigos normais nascem (fora da vista).
- Câmera **não gira sozinha**; só mouse/analógico direito.
- Fase ímpar = Floresta DW1, fase par = Floresta DW3. Zona Digital mantém chão/céu/nevoeiro escuros.
- Só **recortes transformados em textura** dos cenários entram no repo (em `public/biomas/<bioma>/`); nunca imagens inteiras.
- Decoração sem colisão dentro do mapa é **baixa** (grama alta, flores, tocos, cercas, cabos). Peças altas só em posições de `MAP_OBSTACLES` ou fora de `MAP_HALF`.
- Não commitar `src/render/sprites.ts`, `src/render/vfx.ts` (teste local do Survive), `public/dw-wiki.html`, `src/ui/title.ts`, `public/ui/menu-bg.mp4` — mudanças locais do usuário. Usar `git add` com caminhos explícitos. Se uma tarefa precisar editar `sprites.ts`/`vfx.ts`, colocar o código novo em outro arquivo.
- Testes: `npx vitest run` (472 passando hoje) e `npx tsc --noEmit` limpo ao fim de cada tarefa.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sem push.
- Texto visível ao jogador em português do Brasil.

## Review Focus

1. **Borda do mapa com câmera baixa:** parado em `x = ±100` olhando para fora, não pode aparecer chão acabando nem vazio — borda de mata/penhasco + silhueta cobrem tudo até o nevoeiro.
2. **Esc com o cursor preso:** o Chrome consome o Esc para soltar o Pointer Lock; o jogo tem que pausar no `pointerlockchange` e voltar a prender o cursor no próximo clique no jogo (pedido sem gesto do usuário falha).
3. **Entrar/sair da Zona Digital e trocar de fase:** o céu/nevoeiro do bioma tem que voltar ao sair da arena; trocar o bioma não pode vazar geometrias/texturas (dispose).
4. **Controle não-standard (8BitDo modo D, `mapping: ""`):** eixos da câmera remapeáveis, zona morta nos eixos da câmera, e nada gira com o analógico parado.
5. **Forma ou inimigo sem a vista pedida** (só `side`, ou só `idle` como o SkullGreymon): cai na vista mais próxima sem quadro vazio/piscando.

---

### Task 1: Matemática de vista (funções puras)

**Files:**
- Create: `src/core/view.ts`
- Test: `tests/core/view.test.ts`

**Interfaces:**
- Produces (convenção: `yaw = 0` = câmera atrás em `+z` olhando para `-z`, igual à câmera atual; yaw cresce girando a câmera para `+x`):
  - `rotateByYaw(mx: number, mz: number, yaw: number): { mx: number; mz: number }` — intenção da tela (W = `mz -1`) → vetor no mundo. `wx = mx·cos + mz·sin`, `wz = −mx·sin + mz·cos`.
  - `cameraForward(yaw: number): { x: number; z: number }` = `(−sin yaw, −cos yaw)`.
  - `type ViewFacing = 'side' | 'up' | 'down' | 'diagup' | 'diagdown'` (mesma união de `Facing` em `src/render/sprites.ts`).
  - `viewFacing(dx: number, dz: number, yaw: number): { facing: ViewFacing; right: boolean }` — direção no mundo → vista no espaço da câmera. `right` = vai para a direita da tela. Usa os mesmos setores de 45° de `movePlayer` (`src/sim/run.ts:173`) aplicados a `(sx, sz) = (dx·cos − dz·sin, dx·sin + dz·cos)`; `sz < 0` = afastando da câmera = `up`/`diagup`.
  - `outsideView(ax: number, az: number, yaw: number, halfAngle: number): boolean` — vetor `(ax, az)` a partir do parceiro está fora do cone `±halfAngle` em volta de `cameraForward(yaw)`.

- [ ] **Step 1: Testes que falham** em `tests/core/view.test.ts`:
  - `rotateByYaw(0,-1,0)` → `{mx≈0, mz≈-1}`; `rotateByYaw(0,-1,Math.PI/2)` → `{mx≈-1, mz≈0}`; comprimento preservado para `(0.6,0.8)` com yaw 1.1.
  - `viewFacing(0,-1,0)` → `facing 'up'`; `viewFacing(0,1,0)` → `'down'`; `viewFacing(1,0,0)` → `{facing:'side', right:true}`; `viewFacing(-1,-1,0)` → `{facing:'diagup', right:false}`; `viewFacing(-1,0,Math.PI/2)` → `'up'` (andando para longe da câmera girada).
  - `outsideView(0,-25,0,Math.PI/3)` → `false`; `outsideView(0,25,0,Math.PI/3)` → `true`; `outsideView(25,0,0,Math.PI/3)` → `true`; `outsideView(10,-25,0,Math.PI/3)` → `false`.
- [ ] **Step 2:** `npx vitest run tests/core/view.test.ts` → FAIL (módulo não existe).
- [ ] **Step 3:** Implementar as quatro funções em `src/core/view.ts`.
- [ ] **Step 4:** `npx vitest run tests/core/view.test.ts` → PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 5: Commit** `feat(camera): matemática de vista relativa à câmera`.

---

### Task 2: Entrada de câmera (mouse, analógico direito, opções no save)

**Files:**
- Modify: `src/core/input.ts`, `src/core/save.ts`, `src/data/tuning.ts`
- Test: `tests/core/input.test.ts`, `tests/core/save.test.ts`

**Interfaces:**
- Produces:
  - `T.CAMERA` em `tuning.ts` (valores iniciais, ajustáveis): `{ DIST: 8, LOOK_HEIGHT: 1.4, PITCH: 0.38, PITCH_MIN: 0.15, PITCH_MAX: 0.8, FOV: 60, MOUSE_SENS: 0.0025 /* rad/px */, PAD_SENS: 2.6 /* rad/s */, PAD_DEADZONE: 0.25, FOG_NEAR: 45, FOG_FAR: 150, FAR: 320, SPAWN_MARGIN: 0.25 /* rad além do meio-FOV horizontal */ }`.
  - `SaveData.camera: CameraSettings` com `interface CameraSettings { mouseSens: number; padSens: number; invertY: boolean; padAxisX: number; padAxisY: number }` — padrão `{ mouseSens: 1, padSens: 1, invertY: false, padAxisX: 2, padAxisY: 3 }` (multiplicadores 0.25–3, validados em `loadSave`; save antigo sem `camera` recebe o padrão).
  - `Input.look(dt: number): { dx: number; dy: number }` — radianos de yaw/pitch neste quadro: soma do `movementX/Y` do mouse acumulado desde o último `poll()` × `MOUSE_SENS × mouseSens` + eixos `padAxisX/Y` (com zona morta `PAD_DEADZONE`) × `PAD_SENS × padSens × dt`. `invertY` inverte `dy`. Mouse só conta enquanto `pointerLocked()`.
  - `Input.setCamera(s: CameraSettings): void`, `Input.captureAxis(): Promise<number>` (resolve com o índice do eixo que passar de 0.6 em módulo no próximo `poll`).
  - `createInput` passa a ouvir `mousemove` no `target` (tipo `KeyTarget` ampliado para aceitar `MouseEvent` com `movementX/movementY`) e recebe 4º parâmetro opcional `isLocked: () => boolean` (padrão `() => false`).

- [ ] **Step 1: Testes que falham** em `tests/core/input.test.ts` (o helper `make` ganha despachante de `mousemove` e `isLocked`):
  - mouse `movementX: 100` com lock → `look(1/60).dx ≈ 100 × 0.0025`; sem lock → `0`; segundo `poll()` sem movimento → `0` (acumulador zera).
  - pad com `axes [0,0,0.8,0]` e `dt = 0.5` → `dx ≈ 0.8 × 2.6 × 0.5`; `axes [0,0,0.2,0]` → `0` (zona morta).
  - `setCamera({...padrão, invertY: true})` + mouse `movementY: 40` → `dy < 0`.
  - `setCamera({...padrão, padAxisX: 4})` + `axes [0,0,0,0,0.9]` → `dx > 0`.
  - `captureAxis()` resolve `3` depois de `poll()` com `axes [0,0,0,-0.9]`.
  - Em `tests/core/save.test.ts`: save sem `camera` → padrão; `camera.mouseSens: 99` → limitado a 3; `padAxisX: -1` → padrão 2.
- [ ] **Step 2:** `npx vitest run tests/core` → FAIL nos testes novos.
- [ ] **Step 3:** Implementar `T.CAMERA`, `CameraSettings` + validação em `loadSave`/`defaultSave`, e `look`/`setCamera`/`captureAxis` em `createInput`.
- [ ] **Step 4:** `npx vitest run` → tudo PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 5: Commit** `feat(input): mouse e analógico direito para a câmera + opções no save`.

---

### Task 3: Câmera orbital no jogo, movimento relativo e Pointer Lock

**Files:**
- Create: `src/render/camera.ts`
- Modify: `src/render/scene.ts` (remover `CAM_OFFSET`/`follow`; FOV/far/fog de `T.CAMERA`), `src/main.ts` (loop, pausa, pointer lock), `src/ui/menus.ts` (opções da câmera), `src/sim/run.ts` (campo `camYaw`)
- Test: `tests/render/camera.test.ts`, `tests/ui/settings.test.ts` (novo; se já houver teste de `showSettings`, estender o existente)

**Interfaces:**
- Consumes: `rotateByYaw` (Task 1), `Input.look`, `CameraSettings`, `T.CAMERA` (Task 2).
- Produces:
  - `class OrbitCamera { yaw: number; pitch: number; constructor(cam: THREE.PerspectiveCamera); turn(dx: number, dy: number): void /* clampa pitch em [PITCH_MIN, PITCH_MAX] */; follow(x: number, z: number): void /* posiciona a DIST atrás/acima, olha para (x, LOOK_HEIGHT, z) */; reset(): void /* yaw 0, pitch PITCH */; horizontalHalfFov(): number }`.
  - `RunState.camYaw: number` (inicia 0) e `RunState.camHalf: number` (inicia `Math.PI`, ou seja, sem restrição) — o `main.ts` escreve antes de `stepRun`; a Task 4 lê.
- Comportamento no `main.ts`: a cada quadro de jogo `orbit.turn(...input.look(dt))`; `stepRun(run, rotateByYaw(m.mx, m.mz, orbit.yaw), dt)`; `orbit.follow(run.px, run.pz)`. Câmera girando devagar do menu fica como está (linhas 213–214). Pointer Lock no `canvas`: pedir ao começar partida, ao fechar pausa/modais e em qualquer clique no canvas durante o jogo; ao virar `document.pointerLockElement === null` em jogo → `pause()`. Qualquer modal/menu aberto solta o lock (`document.exitPointerLock()`). Nova partida → `orbit.reset()`.
- Opções (`showSettings`): linhas "Sensibilidade do mouse", "Sensibilidade do controle" (passo 0.25, faixa 0.25–3), "Inverter vertical: sim/não", "Eixo horizontal da câmera (controle)" e "Eixo vertical da câmera (controle)" usando `input.captureAxis()` com texto "Mova o analógico da câmera para a direita" / "…para cima"; salvar com `storeSave` e `input.setCamera`.

- [ ] **Step 1: Testes que falham:**
  - `tests/render/camera.test.ts`: com `yaw 0`, `follow(0,0)` deixa a câmera em `z > 0` e `x ≈ 0`; `turn(Math.PI/2, 0)` + `follow(0,0)` deixa em `x > 0, z ≈ 0`; `turn(0, 10)` clampa `pitch` em `PITCH_MAX`; `turn(0, -10)` em `PITCH_MIN`; a altura da câmera em `PITCH_MIN` é `> LOOK_HEIGHT` (não entra no chão).
  - `tests/ui/settings.test.ts`: abrir `showSettings` e clicar em "Inverter vertical" alterna `save.camera.invertY` e grava.
- [ ] **Step 2:** `npx vitest run tests/render/camera.test.ts tests/ui/settings.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `OrbitCamera`, ligar no `main.ts`, opções no `menus.ts`, `camYaw`/`camHalf` no `RunState`/`createRun`.
- [ ] **Step 4:** `npx vitest run` + `npx tsc --noEmit` → limpos.
- [ ] **Step 5: Conferir no Chrome** (`npm run dev`): mouse gira (cursor preso), W anda para onde a câmera olha com a câmera virada 90°/180°, Esc pausa e o clique em "Continuar" + clique no jogo prende de novo, cartas de level up soltam o cursor, horizonte visível sem buraco no céu, Zona Digital entra/sai normal.
- [ ] **Step 6: Commit** `feat(camera): câmera orbital estilo PokéBonk com movimento relativo e Pointer Lock`.

---

### Task 4: Inimigos nascem fora da vista

**Files:**
- Modify: `src/sim/director.ts`, `src/sim/run.ts:238` (passar `camYaw`/`camHalf` para o director), `src/main.ts` (escrever `run.camHalf = orbit.horizontalHalfFov() + T.CAMERA.SPAWN_MARGIN`)
- Test: `tests/sim/director.test.ts`

**Interfaces:**
- Consumes: `cameraForward`, `outsideView` (Task 1); `RunState.camYaw/camHalf` (Task 3).
- Produces: `DirectorState.viewYaw?: number; viewHalf?: number`. Sem os campos (ou `viewHalf >= π`) → comportamento antigo idêntico (os testes atuais continuam passando sem mudança).
- Algoritmo: sortear o ângulo só no arco **fora** do cone: `a = ângulo(cameraForward) + viewHalf + rng·(2π − 2·viewHalf)`; raio `22–28` como hoje; a regra de tentativas/clamp na borda do mapa continua.

- [ ] **Step 1: Teste que falha:** `'spawns avoid the camera view cone'` — `st` com `px 0, pz 0, viewYaw 0, viewHalf Math.PI/3`, 600 passos; todo inimigo vivo satisfaz `outsideView(e.x, e.z, 0, Math.PI/3)` e distância 22–28. Segundo caso com `viewYaw Math.PI/2`.
- [ ] **Step 2:** `npx vitest run tests/sim/director.test.ts` → FAIL.
- [ ] **Step 3:** Implementar no `stepDirector` e passar os campos em `stepRun`.
- [ ] **Step 4:** `npx vitest run` + `npx tsc --noEmit` → limpos.
- [ ] **Step 5: Commit** `feat(director): inimigos nascem fora do campo de visão da câmera`.

---

### Task 5: Vistas dos sprites relativas à câmera (parceiro e inimigos)

**Files:**
- Create: `src/render/instanceFrames.ts` (atributo por instância + patch de shader)
- Modify: `src/render/billboards.ts`, `src/sim/run.ts` (`dirZ` em `movePlayer`)
- Test: `tests/render/instanceFrames.test.ts`, `tests/sim/run.test.ts`

**Interfaces:**
- Consumes: `viewFacing` (Task 1); `OrbitCamera.yaw` (Task 3) — `Billboards.sync(run, time, yaw: number)`.
- Produces:
  - `RunState.dirZ: number` (última direção de movimento em z, como `dirX`); `run.facing` continua existindo, mas o render não usa mais.
  - `enableInstanceFrames(mesh: THREE.InstancedMesh, cols: number, rows: number): void` — adiciona `InstancedBufferAttribute` `aFrame` (vec2) e um `onBeforeCompile` no material que soma o offset da instância à UV do `map` (texture `repeat = 1/cols, 1/rows`, `offset = 0`).
  - `setInstanceFrame(mesh: THREE.InstancedMesh, i: number, off: { x: number; y: number }): void`.
- Parceiro: vista = `viewFacing(run.dirX, run.dirZ, yaw)`; espelhamento por `right` (substitui `facingFlip(run.dirX)`/`mirrorsWithDir`). Morte e dano usam a mesma vista.
- Inimigos: direção = do inimigo para o parceiro (`run.px − e.x`, `run.pz − e.z`); quadro por instância = `moveFrame(time, (e.id·0.618)%1, true, sp.frames, vista)` → `frameOffset`; espelhamento por `right`. O fallback do `moveFrame` cobre folhas sem a vista.

- [ ] **Step 1: Testes que falham:**
  - `tests/sim/run.test.ts`: depois de `stepRun` com `{mx: 0, mz: 1}`, `run.dirZ === 1`; parado, mantém o último valor.
  - `tests/render/instanceFrames.test.ts`: `enableInstanceFrames(mesh, 4, 2)` cria `geometry.attributes.aFrame` com `itemSize 2` e `count == mesh.count`; `setInstanceFrame(mesh, 3, {x:0.25, y:0.5})` grava em `aFrame` nos índices `6,7` e marca `needsUpdate`; o `onBeforeCompile` troca o chunk `#include <uv_vertex>` (testar chamando o hook com um shader falso e conferindo que `aFrame` aparece no `vertexShader`).
- [ ] **Step 2:** `npx vitest run tests/render tests/sim/run.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `dirZ`, `instanceFrames.ts` e usar nos `Billboards` (parceiro e inimigos).
- [ ] **Step 4:** `npx vitest run` + `npx tsc --noEmit` → limpos.
- [ ] **Step 5: Conferir no Chrome:** com WarGreymon (8 direções), andar em círculo com a câmera parada e girar a câmera com ele parado → vistas mudam certo; Agumon (5 direções DW3) e um inimigo só-lado não piscam; inimigos vindo de frente mostram frente, os que se afastam (ao contornar) mostram costas.
- [ ] **Step 6: Commit** `feat(render): vistas dos sprites relativas à câmera, inclusive por inimigo`.

---

### Task 6: Texturas dos biomas a partir dos cenários

**Files:**
- Create: `tools/biomas/cortar.sh`, `tools/biomas/recortes.json`, `public/biomas/floresta-dw1/*.webp`, `public/biomas/floresta-dw3/*.webp`
- Test: `tests/tools/biomas.test.ts`

**Interfaces:**
- Produces (nomes fixos, consumidos nas Tasks 7 e 8), todos 256×256 WebP repetíveis:
  - `floresta-dw1/`: `grama.webp`, `grama-escura.webp`, `copa.webp` (folhagem), `casca.webp`, `pedra.webp`.
  - `floresta-dw3/`: `grama.webp`, `trilha.webp` (terra arenosa), `pinheiro.webp`, `casca.webp`, `penhasco.webp`, `metal.webp` (canos).
- `recortes.json`: `{ "<bioma>/<arquivo>": { "fonte": "public/cenarios_dw1/MAYO01_0.webp", "x": n, "y": n, "w": n, "h": n } }` — retângulos escolhidos olhando as imagens (`MAYO00–04*` para DW1; `S335, S350, S355, S370, S400` para DW3), só de áreas planas/sem objeto.
- `cortar.sh`: para cada entrada → `magick` recorta, redimensiona para 256², torna repetível (cópia rolada em meio quadro misturada com máscara de bordas suavizadas) e grava WebP qualidade 85. Recebe caminhos por argumento/JSON, sem rodar nada de dentro de `public/`.

- [ ] **Step 1: Teste que falha** `tests/tools/biomas.test.ts`: para cada arquivo listado acima existe, é 256×256 (ler cabeçalho WebP ou usar `sharp`/`magick identify` via `execFileSync`), e a diferença média entre a coluna 0 e a coluna 255 (e linha 0/255) é menor que a diferença média entre duas colunas aleatórias do meio + 10% (repete sem emenda gritante).
- [ ] **Step 2:** `npx vitest run tests/tools/biomas.test.ts` → FAIL.
- [ ] **Step 3:** Escolher os retângulos, escrever `cortar.sh`/`recortes.json`, gerar as texturas.
- [ ] **Step 4:** `npx vitest run tests/tools/biomas.test.ts` → PASS. Montar uma folha de contato 3×3 de cada textura repetida (`magick ... -tile`) no scratchpad e olhar: sem emenda visível, sem pedaço de objeto/personagem.
- [ ] **Step 5: Commit** `feat(biomas): texturas repetíveis recortadas das florestas do DW1 e DW3` (só `tools/biomas/` e `public/biomas/`).

---

### Task 7: Sistema de biomas + Floresta DW1

**Files:**
- Create: `src/render/biomes/types.ts`, `src/render/biomes/index.ts`, `src/render/biomes/forestDw1.ts`, `src/render/biomes/common.ts` (céu, silhueta distante, carregar textura, fade de oclusão)
- Modify: `src/render/map.ts` (tirar chão/rochedos/árvores fixos; montar pelo bioma; Zona Digital restaura céu do bioma ao sair), `src/main.ts` (debug "Trocar bioma"), `src/ui/debugpanel.ts` (`DebugActions.nextBiome(): string`)
- Test: `tests/render/biomes.test.ts`, `tests/ui/debugpanel.test.ts`

**Interfaces:**
- Consumes: texturas `public/biomas/floresta-dw1/*` (Task 6); `MAP_OBSTACLES`; `OrbitCamera` (posição da câmera para o fade).
- Produces:
  - `type BiomeId = 'floresta-dw1' | 'floresta-dw3'`.
  - `biomeForPhase(phase: number): BiomeId` — ímpar → `'floresta-dw1'`, par → `'floresta-dw3'`.
  - `interface BiomeView { group: THREE.Group; sky: { background: THREE.Texture | THREE.Color; fog: number }; update(time: number, camPos: THREE.Vector3, target: THREE.Vector3): void; dispose(): void }`.
  - `buildBiome(id: BiomeId): BiomeView` (em `index.ts`; DW3 entra na Task 8 — até lá cai no DW1).
  - `MapView.setBiome(id: BiomeId): void`, `MapView.biome: BiomeId`; o `sync` chama `setBiome(override ?? biomeForPhase(run.phase.phase))`. `MapView.update` passa a receber a posição da câmera.
  - `DebugActions.nextBiome(): string` — alterna o override e devolve o nome mostrado no botão ("Bioma: Floresta DW1"/"Bioma: Floresta DW3").
- Floresta DW1 (spec): chão `grama` + manchas de `grama-escura`; árvores de copa redonda (esferas/icosaedros agrupados com `copa`, tronco com `casca`) nas posições `tree` de `MAP_OBSTACLES`; `rock` vira pedra musgosa (`pedra`); decoração baixa instanciada sem colisão (flores, tufos, tocos, cercas), espalhada por semente fixa e afastada ≥ 2 de obstáculos; borda = anel de árvores densas além de `MAP_HALF` + silhueta distante; céu em degradê; luz mais fechada (hemisfério/sol mais fracos e esverdeados).
- Oclusão: copas cuja distância à linha câmera→parceiro for menor que o raio ficam semitransparentes (opacidade ~0.3), voltando quando saem.

- [ ] **Step 1: Testes que falham:**
  - `tests/render/biomes.test.ts`: `biomeForPhase(1..5)` → `dw1, dw3, dw1, dw3, dw1`; `buildBiome('floresta-dw1')` (texturas mockadas via `THREE.TextureLoader` stub) devolve `group` com uma instância de árvore por obstáculo `tree`; nenhuma decoração alta (`> 1.2` de altura) dentro de `|x|,|z| ≤ MAP_HALF` fora das posições de obstáculo; `dispose()` chama `dispose` das geometrias/materiais criados.
  - `tests/ui/debugpanel.test.ts`: o botão de bioma chama `nextBiome` e mostra o texto devolvido.
- [ ] **Step 2:** `npx vitest run tests/render/biomes.test.ts tests/ui/debugpanel.test.ts` → FAIL.
- [ ] **Step 3:** Implementar tipos, `biomeForPhase`, `common.ts`, `forestDw1.ts`, refatorar `MapView`, ligar debug.
- [ ] **Step 4:** `npx vitest run` + `npx tsc --noEmit` → limpos.
- [ ] **Step 5: Conferir no Chrome:** fase 1 em Floresta DW1; ir até a borda (`x = 100`) e girar 360° — sem vazio; árvore entre câmera e parceiro fica transparente; entrar e sair da Zona Digital restaura o céu; fps no painel/`performance` comparável ao de antes (anotar número).
- [ ] **Step 6: Commit** `feat(biomas): sistema de biomas e Floresta DW1`.

---

### Task 8: Floresta DW3

**Files:**
- Create: `src/render/biomes/forestDw3.ts`
- Modify: `src/render/biomes/index.ts`
- Test: `tests/render/biomes.test.ts`

**Interfaces:**
- Consumes: `BiomeView`, `common.ts` (Task 7); texturas `public/biomas/floresta-dw3/*` (Task 6).
- Produces: `buildBiome('floresta-dw3')`.
- Conteúdo (spec): chão `grama` verde-amarelada clara + trilhas em zigue-zague de `trilha` (faixas planas logo acima do chão com bordas suavizadas, geradas por semente fixa); pinheiros (cones empilhados com `pinheiro`, tronco `casca`) nas posições `tree`; `rock` vira caixa/cano metálico (`metal`) — detalhe "digital"; decoração baixa: cabos no chão, placas baixas, tocos; postes altos só em posições de obstáculo ou fora do mapa; borda = fileiras de pinheiros + penhasco (`penhasco`) além de `MAP_HALF`; luz clara de dia, céu azul claro.

- [ ] **Step 1: Teste que falha:** `buildBiome('floresta-dw3')` cria um pinheiro por obstáculo `tree`, um objeto metálico por `rock`, mesma regra de decoração alta da Task 7, e `dispose()` libera tudo; trocar `dw1 → dw3 → dw1` em `MapView.setBiome` não deixa filhos sobrando no `scene` (contar filhos antes/depois).
- [ ] **Step 2:** `npx vitest run tests/render/biomes.test.ts` → FAIL.
- [ ] **Step 3:** Implementar `forestDw3.ts` e registrar no `index.ts`.
- [ ] **Step 4:** `npx vitest run` + `npx tsc --noEmit` → limpos.
- [ ] **Step 5: Conferir no Chrome:** fase 2 (ou "Trocar bioma" no F2) mostra a Floresta DW3; mesmas checagens de borda/oclusão/Zona/fps da Task 7; trocar várias vezes seguidas não derruba o fps.
- [ ] **Step 6: Commit** `feat(biomas): Floresta DW3`.

---

### Task 9: Conferência final no Chrome + controle

**Files:** nenhum novo (ajustes de valores em `T.CAMERA` se necessário).

- [ ] **Step 1:** `npx vitest run` (≥ 472 + novos) e `npx tsc --noEmit` → limpos; `npm run build` ok.
- [ ] **Step 2:** Partida completa curta no Chrome (`__run.debug.xpMul=0` para evitar modais) cobrindo o Review Focus 1–5: borda do mapa nos dois biomas, Esc/pause/re-lock, Zona Digital, forma sem diagonais e SkullGreymon (só idle).
- [ ] **Step 3:** Controle: pedir ao usuário para conectar o 8BitDo e testar o analógico direito; se não girar, usar "Eixo horizontal/vertical da câmera" nas opções e anotar quais eixos funcionaram (registrar na memória do projeto).
- [ ] **Step 4:** Commit de ajustes de valores, se houver: `chore(camera): ajuste fino da câmera`.
