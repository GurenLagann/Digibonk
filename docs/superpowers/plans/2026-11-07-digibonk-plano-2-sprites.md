# DigiBonk — Plano 2: Sprites reais (Digimon World DS)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar os placeholders pelos sprites do Digimon World DS: um recortador automático transforma as 36 folhas de `assets-src/sprites/dwds/` em tiras de 5 quadros, e o jogo passa a desenhar, animar e espelhar esses sprites. Quem não tem sprite (linha Veedramon e Raidramon) continua com placeholder.

**Architecture:** Uma ferramenta Node (`tools/sprites/`), com funções puras testadas em imagens sintéticas, lê os PNGs e gera `public/sprites/<id>.png` (tira horizontal de 5 quadros do mesmo tamanho, alinhados pela base e pelo centro) e `public/sprites/manifest.json`. Em execução, `src/render/sprites.ts` carrega o manifesto. O billboard usa a tira quando ela existe e o placeholder quando não existe. A animação de parado é compartilhada por espécie (offset de UV no material); o jogador também usa os quadros de ataque e de dano.

**Tech Stack:** o do Plano 1 + `pngjs@7.0.0` e `@types/pngjs@6.0.5` (dev, só na ferramenta).

**Spec:** `docs/superpowers/specs/2026-11-07-digibonk-design.md` (§3 Sprites). Decisões do usuário em 2026-11-07: fonte = Digimon World DS; linha solo Veedramon/AeroVeedramon/UlforceVeedramon e Raidramon ficam com placeholder (1a); inimigos sem sprite são trocados (decisão do construtor).

## Global Constraints

- Tudo do Plano 1 continua valendo (sem rede, pt-BR, `NearestFilter`, 60 fps com 600 inimigos).
- Os sprites são servidos do próprio domínio (`public/sprites/`); nenhuma URL externa.
- Fallback obrigatório: espécie sem entrada no manifesto → placeholder do Plano 1, sem erro.
- A ferramenta roda com `npm run sprites` e é determinística (mesma entrada → mesmos bytes).
- Créditos: a tela de créditos cita Digimon World DS (Bandai) e The Spriters Resource, com os rippers identificados nas folhas.

## Review Focus

1. **Folha cuja cor de fundo também aparece no sprite** (ex.: verde no Wormmon, branco no Gallantmon): o recorte não pode abrir buracos no Digimon. → teste na Task 1 (`flat-area heuristic keeps sprite colors`).
2. **Folha em que as 5 poses não estão na ordem padrão** (ex.: Growlmon): o manifesto de exceções precisa permitir reordenar os papéis. → teste na Task 2.
3. **Manifesto ausente ou corrompido / PNG que não carrega:** o jogo continua com placeholders. → teste na Task 3.
4. **Sprites de tamanhos muito diferentes** (Agumon ~50 px, Kimeramon ~200 px): a escala visual precisa ficar legível e proporcional. → verificação visual na Task 4.
5. **Espelhamento:** os sprites do DS olham para a esquerda; andando para a direita, devem virar. → teste na Task 3 (`facingFlip`).

---

## Estrutura de arquivos

```
tools/sprites/png.ts          leitura/escrita PNG (pngjs) ↔ Image {w,h,data:Uint8Array RGBA}
tools/sprites/slice.ts        funções puras: fundo, componentes, escolha dos quadros, tira
tools/sprites/overrides.ts    exceções por folha (ordem dos papéis, cores extras de fundo)
tools/sprites/build.ts        CLI: assets-src → public/sprites + manifest + folha de conferência
src/render/sprites.ts         carrega manifesto + texturas; API de quadros
src/data/enemies.ts           (modificado) troca de espécies sem sprite
src/render/billboards.ts      (modificado) usa sprites reais
src/ui/menus.ts               (modificado) créditos + retratos
tests/tools/slice.test.ts, tests/render/sprites.test.ts
```

## Tipos centrais

```ts
// tools/sprites/slice.ts
export interface Image { w: number; h: number; data: Uint8Array } // RGBA
export interface Rect { x: number; y: number; w: number; h: number }
export interface Component { rect: Rect; pixels: number }
export type Role = 'idle1' | 'idle2' | 'idle3' | 'attack' | 'hurt';
export const DEFAULT_ROLES: Role[] = ['idle1', 'idle2', 'idle3', 'attack', 'hurt'];

// public/sprites/manifest.json
export interface SpriteManifest { version: 1; sprites: Record<string, { file: string; frameW: number; frameH: number; frames: Role[]; source: number }> }
```

---

### Task 1: Recortador — fundo e componentes

**Files:**
- Create: `tools/sprites/png.ts`, `tools/sprites/slice.ts`, `tests/tools/slice.test.ts`; Modify: `package.json` (dev deps `pngjs@7.0.0`, `@types/pngjs@6.0.5`), `vite.config.ts` (incluir `tests/tools`), `tsconfig.json` (incluir `tools`; `allowImportingTsExtensions: true`, porque o Node com `--experimental-strip-types` exige imports com `.ts`).

**Interfaces — Produces:**
- `backgroundColors(img: Image, minShare = 0.04, minFlat = 0.9): Set<number>` — cor RGB empacotada `r<<16|g<<8|b`; é fundo se cobre ≥ `minShare` dos pixels **e** ≥ `minFlat` dos seus pixels têm os 4 vizinhos da mesma cor (área chapada). Pixels com alfa 0 contam como fundo sempre.
- `foregroundMask(img: Image, bg: Set<number>): Uint8Array` (1 = sprite).
- `components(mask: Uint8Array, w: number, h: number, minPixels = 120, minFill = 0.15): Component[]` — conectividade 8; descarta componentes com poucos pixels ou com `pixels / (rect.w*rect.h) < minFill` (linhas de moldura).
- `pickBattleFrames(comps: Component[], count = 5): Component[]` — os `count` maiores por `pixels`, ordenados em ordem de leitura (linha = mesma faixa vertical com tolerância de 30% da altura média; depois x).

- [ ] **Step 1: Testes que falham** (imagens sintéticas criadas no teste)

```ts
test('flat background detected, sprite colors kept', () => {
  // 100x60 fundo verde chapado + 2 "sprites" 20x20 com textura xadrez de vermelho/verde-escuro
  const bg = backgroundColors(img); expect(bg.has(GREEN)).toBe(true); expect(bg.has(RED)).toBe(false);
});
test('flat-area heuristic keeps sprite colors', () => {
  // sprite contém pixels isolados da MESMA cor do fundo, em xadrez → continuam no mask (não são chapados)
  // mas o fundo verde é removido; o sprite não é partido em vários componentes
});
test('cell background on outer background', () => { /* fundo azul + 3 células magenta com sprite dentro → azul e magenta são fundo; 3 componentes */ });
test('thin frame lines are dropped', () => { /* retângulo de 1px de contorno preto 80x80 → nenhum componente */ });
test('battle frames: 5 largest in reading order', () => { /* 7 componentes de tamanhos variados em 2 linhas → os 5 maiores, linha de cima primeiro, esquerda→direita */ });
```

- [ ] **Step 2:** `npx vitest run tests/tools` → FAIL.
- [ ] **Step 3:** Implementar `png.ts` (`readPng(path): Image`, `writePng(path, img)`) e `slice.ts`.
- [ ] **Step 4:** → PASS.
- [ ] **Step 5: Commit** `feat(tools): recortador de folhas — fundo e componentes`

---

### Task 2: Tiras, exceções e o build

**Files:**
- Modify: `tools/sprites/slice.ts`; Create: `tools/sprites/overrides.ts`, `tools/sprites/build.ts`; Modify: `package.json` (script `"sprites": "node --experimental-strip-types tools/sprites/build.ts"`), `.gitignore` (nada novo — `public/sprites` **é** versionado; `assets-src` também).
- Test: `tests/tools/slice.test.ts`

**Interfaces — Produces:**
- `extract(img: Image, rect: Rect, bg: Set<number>): Image` — recorta e zera alfa dos pixels de fundo.
- `buildStrip(frames: Image[]): { strip: Image; frameW: number; frameH: number }` — todos os quadros no mesmo tamanho (máximo w e h + 2 px de margem), cada um alinhado **pela base e centralizado** em x.
- `OVERRIDES: Record<string, { roles?: Role[]; extraBg?: number[]; minShare?: number }>` — começa vazio; preenchido na Step 5 a partir da folha de conferência.
- `build.ts`: para cada `assets-src/sprites/dwds/<id>.png` (id = id da forma/inimigo no jogo; `SOURCES` com o asset id do Spriters Resource fica em `overrides.ts`) → `public/sprites/<id>.png` + `manifest.json` (ordenado por id) + `assets-src/sprites/contact-sheet.png` (todas as tiras empilhadas com fundo xadrez, para conferência; **não** versionado — adicionar ao `.gitignore`). Imprime um aviso para folha com < 5 componentes.

- [ ] **Step 1: Testes que falham**

```ts
test('strip aligns frames by bottom-center', () => { /* quadros 10x20 e 30x10 → frameW 32, frameH 22; o quadro 2 tem a base na linha 20 */ });
test('extract makes background transparent', () => { /* pixel de fundo → alfa 0; pixel de sprite → alfa 255 */ });
test('override reorders roles', () => { /* rolesFor('growlmon', {growlmon:{roles:[...]}}) devolve a ordem da exceção; sem exceção → DEFAULT_ROLES */ });
test('build is deterministic', () => { /* rodar buildOne duas vezes na mesma imagem sintética → bytes iguais */ });
```

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Rodar e conferir** `npm run sprites` → 36 tiras, nenhum aviso. Abrir `assets-src/sprites/contact-sheet.png` (com a ferramenta Read) e conferir, uma por uma: (a) as 5 poses são do Digimon certo, sem texto/ícone/moldura; (b) sem buracos de fundo; (c) a ordem é parado×3, ataque, dano. Corrigir exceções em `OVERRIDES` e repetir até tudo certo.
- [ ] **Step 6: Commit** `feat(tools): tiras de sprites + manifesto` (inclui `assets-src/sprites/dwds/*.png`, `public/sprites/*`).

---

### Task 3: Biblioteca de sprites em execução + troca de inimigos

**Files:**
- Create: `src/render/sprites.ts`, `tests/render/sprites.test.ts`; Modify: `src/data/enemies.ts`, `tests/data/validate.test.ts` (se algum id citado mudar)

**Interfaces — Produces:**
- `parseManifest(json: unknown): SpriteManifest | null` — valida formato; inválido → `null`.
- `frameIndex(role: Role, frames: Role[]): number` (papel ausente → 0).
- `idleFrame(time: number, phase = 0): Role` — ciclo `idle1, idle2, idle3, idle2` a 6 quadros/s.
- `facingFlip(dirX: number): number` — DS olha para a esquerda: `dirX > 0.05 → -1`, senão `1`.
- `class SpriteLibrary { static async load(base = './sprites/'): Promise<SpriteLibrary>; has(id: string): boolean; texture(id): THREE.Texture | null; info(id) }` — falha de rede/JSON → biblioteca vazia (todos `has` = false).

Troca de espécies (ids novos; nomes e cores do placeholder mantidos no padrão): `gazimon → tsukaimon` (Tsukaimon), `tankmon → guardromon` (Guardromon), `snimon → minotarumon` (Minotarumon); mini-chefes `mihiramon, vajramon, indramon, pajiramon, makuramon → ladydevimon, arukenimon, infermon, blackwargrowlmon, blackweregarurumon` com os mesmos atributos na mesma ordem. Toasts/HUD que falam "Deva" passam a dizer "guardião" (`'Um guardião apareceu!'`, `'Derrote o guardião!'`).

- [ ] **Step 1: Testes que falham**

```ts
test('invalid manifest is null', () => { expect(parseManifest('x')).toBeNull(); expect(parseManifest({ version: 2 })).toBeNull(); });
test('idle cycles through 4 steps', () => expect([0, 1/6, 2/6, 3/6].map(t => idleFrame(t))).toEqual(['idle1','idle2','idle3','idle2']));
test('facingFlip mirrors when moving right', () => { expect(facingFlip(1)).toBe(-1); expect(facingFlip(-1)).toBe(1); expect(facingFlip(0)).toBe(1); });
test('every enemy and boss has a sprite source', () => { /* todo id de ENEMIES/MINIBOSSES/BOSSES existe em assets-src/sprites/dwds */ });
test('only veedramon line and raidramon lack sprites among forms', () => { /* FORMS sem PNG == ['aeroveedramon','raidramon','ulforceveedramon','veedramon'] */ });
```

- [ ] **Step 2–4:** FAIL → implementar → PASS (suíte inteira).
- [ ] **Step 5: Commit** `feat(render): biblioteca de sprites + inimigos com sprite`

---

### Task 4: Billboards com sprites reais

**Files:** Modify `src/render/billboards.ts`, `src/main.ts` (carrega `SpriteLibrary` antes de criar `Billboards`; mostra "Carregando…" na tela de título até pronto).

**Comportamento:**
- Espécie com sprite: material próprio com a tira; `texture.repeat.x = 1/5`; `offset.x = frameIndex(idleFrame(time + phaseDaEspécie))/5`. Plano com proporção do quadro (`frameW/frameH`).
- Escala visual: altura em mundo = `frameH * PX` com `PX = 0.032`; inimigos comuns limitados a `[0.9, 3.2]`, jogador/chefes a `[1.2, 7]`.
- Jogador: quadro `attack` por 0,15 s após disparar; `hurt` por 0,2 s após levar dano (`invuln > 0.3`); senão ciclo parado. `FLIP_SPRITES = true`; espelha com `facingFlip` usando a direção do movimento (ou, parado, a mira).
- Sem sprite: comportamento atual (placeholder, sem espelhar).
- A sombra elíptica própria continua (os sprites do DS já trazem sombra; se ficar dupla, a nossa fica só para placeholders — decidir olhando).

- [ ] **Step 1:** Implementar.
- [ ] **Step 2:** `npm run build` → sucesso; `npx vitest run` → PASS.
- [ ] **Step 3: Verificar no Chrome:** partida com Agumon (`?debug=xp10`): sprite animado parado, quadro de ataque ao disparar, de dano ao apanhar, espelha ao andar para a direita; inimigos animados; evoluir para Greymon troca a tira; Veemon → ExVeemon/Veedramon: Veedramon aparece como placeholder sem erro; chefe (Devimon) grande e legível; `?debug=spawn600` ≥ 55 fps.
- [ ] **Step 4: Commit** `feat(render): billboards com sprites do Digimon World DS`

---

### Task 5: Retratos nos menus + créditos

**Files:** Modify `src/ui/menus.ts`, `src/ui/evolve.ts`, `src/ui/style.css`

- Seleção de parceiro e modal de digievolução: mostrar o quadro `idle1` da tira (via `<canvas>` desenhado a partir da textura/imagem, `image-rendering: pixelated`); bloqueado → silhueta preta do mesmo quadro (ou "?" se não houver sprite).
- Resultado: o caminho evolutivo vira uma fileira de retratos com o nome embaixo.
- Créditos: "Sprites: Digimon World DS (© Bandai). Rips publicados no The Spriters Resource por Mighty Jetters, redblueyellow, A.J. Nitro, Dazz, Atlanta, Garamonde e outros (créditos completos nas folhas originais em assets-src)." + o aviso legal do Plano 1. Remover "Sprites provisórios".

- [ ] **Step 1:** Implementar. **Step 2:** build + suíte → PASS. **Step 3: Verificar no Chrome** seleção de parceiro (Gabumon bloqueado em silhueta), modal de evolução com retratos, resultado com a fileira de retratos, créditos.
- [ ] **Step 4: Commit** `feat(ui): retratos e créditos dos sprites`
