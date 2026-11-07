# DigiBonk — Plano 1: Motor jogável com os 3 iniciais

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uma partida completa jogável no navegador (seleção de temporada/parceiro → 5 fases de 10 min com missão, chefe e hordas insanas → vitória/derrota), com Agumon, Veemon e Guilmon e todas as suas linhas/formas especiais, usando sprites placeholder.

**Architecture:** TypeScript + Vite. A simulação (`src/sim/`) é **TypeScript puro sem Three.js nem DOM**, determinística via RNG com seed e testada com Vitest. Os dados do jogo (`src/data/`) são objetos TS tipados; adicionar um Digimon = só dados. A renderização (`src/render/`) lê o estado da simulação a cada quadro e desenha com Three.js (billboards em `InstancedMesh`); a UI (`src/ui/`) é DOM sobreposto ao canvas.

**Tech Stack:** `three@0.187.0`, `@types/three@0.187.0`, `vite@7.3.7`, `vitest@4.1.12`, `typescript@5.9.3`, Node 22.

**Spec:** `docs/superpowers/specs/2026-11-07-digibonk-design.md`

**Planos seguintes (fora deste):** Plano 2 — pipeline de sprites reais (folhas DS → atlas). Plano 3 — os 8 desbloqueáveis (Gabumon, Patamon, Tentomon, Salamon, Wormmon, Armadillomon, Terriermon, Renamon) como dados + ovos de Digimon reais no loot. Este plano já implementa o **mecanismo** de ovos/desbloqueio e as fusões que dependem de `gabumon`/`wormmon` desbloqueados.

## Global Constraints

- Somente navegador PC; teclado+mouse e gamepad (remapeável). Sem toque/celular.
- Salvamento só em `localStorage`, toda leitura/escrita em try/catch; jogo funciona sem storage.
- Sem nenhuma requisição de rede em tempo de jogo, sem analytics, sem anúncios, sem monetização.
- Nada copiado do PokéBonk (código, arte, nomes de arquivos).
- Combate 100% automático; o jogador controla movimento, escolhas de level-up, digievolução e cartas.
- 4 espaços de ataque; 3 espaços de carta passiva; 5 atributos: `hp`, `atk`, `def`, `spd`, `brain`.
- 5 fases × **600 s**; missão libera o chefe; após 600 s, hordas insanas; vencer chefe da fase 5 = vitória.
- Digievolução nunca automática: o jogo **avisa**, o jogador **escolhe** ou **espera**. Sem regressão.
- Ovo de Digimon coletado desbloqueia o parceiro **imediatamente e para sempre**, mesmo em derrota.
- Texturas de pixel art com `NearestFilter`. Meta de desempenho: 600 inimigos simultâneos a 60 fps num Ryzen 3 3200G + GTX 1660.
- Interface em português (pt-BR). Página "Créditos e aviso legal": fan-game não oficial; Digimon © Akiyoshi Hongo / Toei Animation / Bandai.

## Review Focus

1. **Aba em segundo plano / alt-tab:** ao voltar, o jogo não pode dar um "salto" de vários segundos — `dt` é limitado e o jogo pausa sozinho em `visibilitychange`. → teste na Task 1 (`loop clamps dt`) e Task 14 (pausa ao ocultar).
2. **localStorage indisponível ou corrompido:** jogo abre com dados padrão (só os 3 iniciais), sem exceção. → testes na Task 1.
3. **Vários level-ups de uma vez** (coleta grande de XP): cada nível gera sua própria escolha, em fila, nenhuma é perdida. → teste na Task 3.
4. **Jogador e chefe morrem no mesmo passo:** vitória da fase prevalece (o chefe morto conta primeiro). → teste na Task 9.
5. **Controle 8BitDo com mapeamento não-standard / desconectado no meio da partida:** remapeamento salvo funciona; desconectar não trava o movimento (volta ao teclado). → teste na Task 11.

---

## Estrutura de arquivos

```
index.html
package.json, tsconfig.json, vite.config.ts
src/main.ts                      boot: monta UI, cena, loop
src/core/rng.ts                  RNG com seed (mulberry32)
src/core/loop.ts                 loop de passo fixo com dt limitado
src/core/save.ts                 SaveData + load/store seguros
src/core/input.ts                teclado + gamepad + remapeamento
src/data/types.ts                todos os tipos de dados
src/data/tuning.ts               constantes de balanceamento
src/data/moves.ts                golpes (kits + golpes de cartas)
src/data/forms.ts                formas jogáveis e arestas de evolução
src/data/partners.ts             parceiros por temporada
src/data/cards.ts                cartas passivas/slash/raras
src/data/items.ts                Digiovos, dados de fusão, ovos
src/data/enemies.ts              inimigos, mini-chefes, chefes por fase
src/data/validate.ts             validação cruzada dos dados
src/sim/vec.ts                   helpers 2D (x,z)
src/sim/spatial.ts               hash espacial
src/sim/stats.ts                 atributos efetivos, dano
src/sim/progression.ts           XP, level-up, ofertas
src/sim/combat.ts                golpes, projéteis, colisões, dano
src/sim/director.ts              spawn de hordas e dificuldade
src/sim/loot.ts                  drops, baús, tabelas filtradas por parceiro
src/sim/cards.ts                 equipar/trocar cartas, slash em slot
src/sim/evolution.ts             requisitos, ofertas, aplicar evolução
src/sim/phase.ts                 timer, missão, chefe, overtime
src/sim/run.ts                   RunState, createRun, stepRun
src/render/scene.ts              renderer, câmera, luz
src/render/map.ts                terreno, obstáculos, marcadores
src/render/placeholder.ts        textura placeholder por formId
src/render/billboards.ts         InstancedMesh por espécie + efeitos
src/render/vfx.ts                projéteis/áreas/números de dano
src/ui/*.ts + src/ui/style.css   HUD, modais, menus
tests/**/*.test.ts               Vitest
```

## Tipos centrais (definidos na Task 2, usados em todo o plano)

```ts
// src/data/types.ts
export type StatKey = 'hp' | 'atk' | 'def' | 'spd' | 'brain';
export type Stats = Record<StatKey, number>;
export type Stage = 'child' | 'adult' | 'perfect' | 'ultimate';
export type Season = 'adventure' | 'adventure02' | 'tamers';
export type MovePattern = 'projectile' | 'area' | 'cone' | 'aura' | 'orbital' | 'beam';

export interface MoveDef {
  id: string; name: string; pattern: MovePattern;
  damage: number; cooldown: number; range: number;
  radius?: number; count?: number; pierce?: number; speed?: number; duration?: number;
  maxLevel: number;            // sempre 5
  perLevel: { damage: number; cooldown: number }; // multiplicadores por nível (ex.: 1.25, 0.92)
  color: number;
}
export interface EvoReq {
  minLevel: number;
  minStats?: Partial<Stats>;
  items?: string[];            // ids de Digiovos/cartas raras/dados de fusão que o jogador possui na partida
  unlocked?: string[];         // parceiros que precisam estar desbloqueados no SaveData
  minPhase?: number;
  minKills?: number;
}
export interface EvoEdge { to: string; req: EvoReq }
export interface FormDef {
  id: string; name: string; stage: Stage; line: string; // line = partner id
  baseStats: Stats; growth: Stats;   // growth somado a cada nível
  signature: string;                 // id do golpe principal desta forma
  kit: string[];                     // golpes aprendíveis (sem a signature)
  evolutions: EvoEdge[];
  size: number;                      // escala do billboard (1 = child)
  color: number;                     // cor do placeholder
}
export interface PartnerDef { id: string; childForm: string; season: Season; starter: boolean }
export type CardKind = 'passive' | 'slash' | 'rare';
export interface CardDef {
  id: string; name: string; kind: CardKind; weight: number;
  passive?: Partial<Stats> & { dmgMul?: number; pickupMul?: number; xpMul?: number; cdMul?: number };
  moveId?: string;             // kind 'slash'
  forPartners?: string[];      // kind 'rare': só cai se o parceiro atual estiver aqui
}
export interface ItemDef { id: string; name: string; kind: 'digiegg' | 'fusion' | 'egg'; forPartners?: string[]; unlockPartner?: string; requiresUnlocked?: string[] }
export interface EnemyDef { id: string; name: string; hp: number; dmg: number; speed: number; xp: number; size: number; color: number; minPhase: number }
export interface BossDef { id: string; name: string; phase: number; hp: number; dmg: number; speed: number; size: number; color: number; moves: string[] }
```

---

### Task 1: Projeto, RNG, loop e save

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `src/core/rng.ts`, `src/core/loop.ts`, `src/core/save.ts`
- Test: `tests/core/rng.test.ts`, `tests/core/loop.test.ts`, `tests/core/save.test.ts`

**Interfaces:**
- Produces:
  - `createRng(seed: number): Rng` com `Rng = { next(): number /*[0,1)*/; int(min: number, maxIncl: number): number; pick<T>(arr: readonly T[]): T; weighted<T>(items: readonly T[], weight: (t: T) => number): T }`
  - `createFixedLoop(step: number, maxFrame: number, tick: (dt: number) => void): { advance(realDt: number): number /*ticks executados*/ }`
  - `SaveData = { version: 1; unlocked: string[]; discovered: string[]; records: { bestPhase: number; wins: number; runs: number }; currency: number; bindings: Record<string, string> }`
  - `defaultSave(): SaveData` (unlocked = `['agumon','veemon','guilmon']`), `loadSave(storage?: Storage | null): SaveData`, `storeSave(data: SaveData, storage?: Storage | null): boolean`, `SAVE_KEY = 'digibonk.save.v1'`

- [ ] **Step 1: Scaffold** — `npm init`, instalar versões exatas: `npm i three@0.187.0` e `npm i -D vite@7.3.7 vitest@4.1.12 typescript@5.9.3 @types/three@0.187.0`. Scripts: `dev`, `build` (`tsc --noEmit && vite build`), `test` (`vitest run`). `tsconfig` com `strict: true`, `target ES2022`, `moduleResolution bundler`. `index.html` com `<canvas id="game">`, `<div id="ui">`, `lang="pt-BR"`, `<title>DigiBonk</title>`. `.gitignore`: `node_modules`, `dist`.

- [ ] **Step 2: Escrever testes que falham**

```ts
// tests/core/rng.test.ts
test('same seed same sequence', () => { const a = createRng(42), b = createRng(42);
  expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]); });
test('int is inclusive and in range', () => { const r = createRng(1);
  for (let i = 0; i < 1000; i++) { const v = r.int(2, 4); expect(v).toBeGreaterThanOrEqual(2); expect(v).toBeLessThanOrEqual(4); } });
test('weighted never picks zero weight', () => { const r = createRng(7);
  for (let i = 0; i < 500; i++) expect(r.weighted(['a','b'], x => x === 'a' ? 0 : 1)).toBe('b'); });

// tests/core/loop.test.ts
test('loop clamps dt', () => { let n = 0; const l = createFixedLoop(1/60, 0.25, () => n++);
  l.advance(10); expect(n).toBe(15); });              // 0.25 s no máximo = 15 ticks
test('loop accumulates fractional frames', () => { let n = 0; const l = createFixedLoop(1/60, 0.25, () => n++);
  l.advance(1/120); expect(n).toBe(0); l.advance(1/120); expect(n).toBe(1); });

// tests/core/save.test.ts  (usar um fake Storage em memória)
test('missing storage returns defaults', () => expect(loadSave(null)).toEqual(defaultSave()));
test('corrupt json returns defaults', () => { const s = fakeStorage({ [SAVE_KEY]: '{oops' }); expect(loadSave(s)).toEqual(defaultSave()); });
test('throwing storage returns defaults and store returns false', () => {
  const s = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } } as unknown as Storage;
  expect(loadSave(s)).toEqual(defaultSave()); expect(storeSave(defaultSave(), s)).toBe(false); });
test('round trip', () => { const s = fakeStorage({}); const d = { ...defaultSave(), unlocked: ['agumon','veemon','guilmon','gabumon'] };
  expect(storeSave(d, s)).toBe(true); expect(loadSave(s)).toEqual(d); });
test('starters always unlocked even if save lost them', () => { const s = fakeStorage({ [SAVE_KEY]: JSON.stringify({ ...defaultSave(), unlocked: [] }) });
  expect(loadSave(s).unlocked).toEqual(expect.arrayContaining(['agumon','veemon','guilmon'])); });
```

- [ ] **Step 3: Rodar** `npx vitest run tests/core` → FAIL (módulos inexistentes).
- [ ] **Step 4: Implementar** `rng.ts` (mulberry32), `loop.ts` (acumulador; `realDt` limitado a `maxFrame`), `save.ts` (merge campo a campo com `defaultSave()`, descartar tipos errados, garantir os 3 iniciais). `loadSave`/`storeSave` usam `globalThis.localStorage` quando o argumento é omitido, acessado dentro do try.
- [ ] **Step 5: Rodar** `npx vitest run tests/core` → PASS. `npm run build` → sucesso.
- [ ] **Step 6: Commit** `git add -A && git commit -m "chore: scaffold, rng, loop e save"`

---

### Task 2: Tipos e dados das 3 linhas iniciais

**Files:**
- Create: `src/data/types.ts` (conteúdo da seção "Tipos centrais"), `src/data/tuning.ts`, `src/data/moves.ts`, `src/data/forms.ts`, `src/data/partners.ts`, `src/data/cards.ts`, `src/data/items.ts`, `src/data/enemies.ts`, `src/data/validate.ts`
- Test: `tests/data/validate.test.ts`

**Interfaces:**
- Produces: `MOVES: Record<string, MoveDef>`, `FORMS: Record<string, FormDef>`, `PARTNERS: PartnerDef[]`, `CARDS: Record<string, CardDef>`, `ITEMS: Record<string, ItemDef>`, `ENEMIES: EnemyDef[]`, `BOSSES: BossDef[]` (um por fase, `phase` 1..5), `MINIBOSSES: EnemyDef[]`, `validateData(): string[]` (lista de erros; vazia = ok), `T` (objeto de tuning exportado de `tuning.ts`).

**Conteúdo obrigatório (vem do spec):**

Formas e arestas (id em minúsculas sem espaço). Requisitos são decisões do construtor, mas **estes valores ficam fixados** para manter o balanceamento coerente entre linhas:

| De | Para | Requisito |
|---|---|---|
| agumon | greymon | lvl 8, atk ≥ 14 |
| greymon | metalgreymon | lvl 20, atk ≥ 30, def ≥ 22 |
| metalgreymon | wargreymon | lvl 35, atk ≥ 55, minPhase 4 |
| wargreymon | omnimon | lvl 42, unlocked `gabumon`, items `fusion_garurumon` |
| veemon | exveemon | lvl 8, spd ≥ 14 |
| veemon | veedramon | lvl 8, atk ≥ 14, def ≥ 12 |
| veemon | flamedramon | lvl 5, items `digiegg_courage` |
| veemon | raidramon | lvl 5, items `digiegg_friendship` |
| veedramon | aeroveedramon | lvl 20, atk ≥ 28, spd ≥ 24 |
| aeroveedramon | ulforceveedramon | lvl 35, spd ≥ 50, minPhase 4 |
| exveemon | paildramon | lvl 22, unlocked `wormmon`, items `fusion_stingmon` |
| paildramon | imperialdramon_fm | lvl 38, atk ≥ 55, minPhase 4 |
| guilmon | growlmon | lvl 8, atk ≥ 13 |
| growlmon | wargrowlmon | lvl 20, atk ≥ 28, brain ≥ 18 |
| wargrowlmon | gallantmon | lvl 35, items `blue_card` |

Flamedramon e Raidramon são **becos sem saída** de estágio `adult` com atributos de `perfect` (risco/recompensa: forte cedo, teto baixo). Omnimon e Imperialdramon FM são `ultimate` com atributos ~25% acima dos Mega comuns.

Assinaturas por forma (golpe principal): agumon `baby_flame` → greymon `mega_flame` → metalgreymon `giga_destroyer` → wargreymon `gaia_force` → omnimon `transcendent_sword`; veemon `vee_headbutt` → exveemon `vee_laser` / veedramon `v_breath_arrow` / flamedramon `fire_rocket` / raidramon `blue_thunder` → aeroveedramon `dragon_impulse` → ulforceveedramon `shining_v_force`; paildramon `desperado_blaster` → imperialdramon_fm `positron_laser`; guilmon `pyro_sphere` → growlmon `pyro_blaster` → wargrowlmon `atomic_blaster` → gallantmon `lightning_joust`. Cada linha tem mais 3 golpes de `kit` por forma (ex.: agumon `sharp_claws`, `spitfire_blast`, `pepper_breath_rain`), cobrindo pelo menos 4 `MovePattern` diferentes por linha.

Parceiros: `agumon` (adventure, starter), `veemon` (adventure02, starter), `guilmon` (tamers, starter), mais `gabumon` (adventure) e `wormmon` (adventure02) com `starter: false` e formas child mínimas (`gabumon`, `wormmon`: um golpe de assinatura cada, sem arestas) — só para exercitar ovos/fusões; o Plano 3 completa as linhas.

Cartas: ≥ 8 passivas (inclui `card_gatomon_claws` +dmgMul 0.15, `card_birdramon_wings` +spd 6, `card_hyper_speed` cdMul 0.9, `card_data_magnet` pickupMul 1.5), ≥ 6 slash com `moveId` de outros Digimon (inclui `lightning_paw`, `diamond_storm`, `hand_of_fate`, `howling_blaster`, `super_shocker`, `poison_ivy`), rara `blue_card` com `forPartners: ['guilmon']`.

Itens: Digiovos `digiegg_courage`, `digiegg_friendship` (`forPartners: ['veemon']`); fusão `fusion_garurumon` (`forPartners: ['agumon'], requiresUnlocked: ['gabumon']`), `fusion_stingmon` (`forPartners: ['veemon'], requiresUnlocked: ['wormmon']`). Ovos de Digimon `egg_gabumon`, `egg_wormmon` (`unlockPartner`) existem nos dados para testar o mecanismo; o Plano 3 adiciona os demais.

Inimigos: ≥ 10 espécies com `minPhase` 1..5 (ex.: goblimon, gazimon, gotsumon, bakemon, tankmon, kuwagamon, ogremon, snimon, darktyrannomon, vilemon). Mini-chefes Deva: mihiramon, vajramon, indramon, pajiramon, makuramon. Chefes: fase 1 `devimon`, 2 `etemon`, 3 `myotismon`, 4 `kimeramon`, 5 `piedmon`.

`tuning.ts` fixa: `PHASE_SECONDS = 600`, `PHASES = 5`, `MOVE_SLOTS = 4`, `PASSIVE_SLOTS = 3`, `MAX_ENEMIES = 600`, `STAGE_DMG = { child: 1, adult: 1.6, perfect: 2.4, ultimate: 3.5 }`, `STAT_OFFER_AMOUNT = 3`, `OFFERS_PER_LEVEL = 3`, `CARD_OFFER_CHANCE = 0.12`.

- [ ] **Step 1: Teste que falha**

```ts
// tests/data/validate.test.ts
test('data is internally consistent', () => expect(validateData()).toEqual([]));
test('every starter line reaches an ultimate', () => {
  for (const p of PARTNERS.filter(p => p.starter)) expect(reachableStages(p.childForm)).toContain('ultimate'); });
test('omnimon requires gabumon unlocked', () =>
  expect(FORMS.wargreymon.evolutions.find(e => e.to === 'omnimon')!.req.unlocked).toContain('gabumon'));
test('paildramon requires wormmon unlocked', () =>
  expect(FORMS.exveemon.evolutions.find(e => e.to === 'paildramon')!.req.unlocked).toContain('wormmon'));
test('one boss per phase', () => expect(BOSSES.map(b => b.phase).sort()).toEqual([1,2,3,4,5]));
```
(`reachableStages(formId): Stage[]` é exportado de `validate.ts`.)

- [ ] **Step 2: Rodar** `npx vitest run tests/data` → FAIL.
- [ ] **Step 3: Implementar dados + `validateData()`** — checa: todo `signature`/`kit`/`moveId`/`BossDef.moves` existe em `MOVES`; toda aresta `to` existe; todo `items[]` existe em `ITEMS` ou `CARDS`; todo `unlocked[]` é id de parceiro conhecido **ou** listado em `ITEMS[*].unlockPartner`; `kit.length <= MOVE_SLOTS - 1`; `perLevel` e `maxLevel === 5` presentes; ids únicos.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat(data): tipos e dados das linhas iniciais`

---

### Task 3: Atributos, dano e progressão (XP / level-up)

**Files:**
- Create: `src/sim/stats.ts`, `src/sim/progression.ts`
- Test: `tests/sim/stats.test.ts`, `tests/sim/progression.test.ts`

**Interfaces:**
- Consumes: `FORMS`, `MOVES`, `CARDS`, `T`, `Rng`.
- Produces:
  - `PlayerProg = { formId: string; level: number; xp: number; bonus: Stats; slots: (MoveSlot | null)[]; passives: (string | null)[]; items: string[]; pendingLevelUps: number; kills: number; path: string[] }`, `MoveSlot = { moveId: string; level: number; fromCard: boolean }`
  - `effectiveStats(p: PlayerProg): Stats & { dmgMul: number; pickupMul: number; xpMul: number; cdMul: number }` — `base + growth*(level-1) + bonus + passivas`.
  - `outgoingDamage(p: PlayerProg, slot: MoveSlot): number` = `move.damage * move.perLevel.damage^(level-1) * STAGE_DMG[stage] * (atk/10) * dmgMul`.
  - `incomingDamage(raw: number, def: number): number` = `raw * 100 / (100 + def*5)`.
  - `moveCooldown(p, slot): number` = `move.cooldown * perLevel.cooldown^(level-1) * cdMul / (1 + brain*0.01)`.
  - `xpToNext(level: number): number` = `Math.round(5 + level*4 + level**1.6)`.
  - `addXp(p: PlayerProg, amount: number): number` (retorna nº de níveis ganhos; incrementa `pendingLevelUps`).
  - `LevelOffer = { kind: 'learn'; moveId: string } | { kind: 'upgrade'; slot: number } | { kind: 'stat'; stat: StatKey; amount: number } | { kind: 'card'; cardId: string }`
  - `rollOffers(p: PlayerProg, rng: Rng): LevelOffer[]` (3 únicas), `applyOffer(p: PlayerProg, o: LevelOffer): void` (decrementa `pendingLevelUps`).
  - `newPlayerProg(formId: string): PlayerProg` (slot 0 = signature nível 1; resto `null`; `path = [formId]`).

- [ ] **Step 1: Testes que falham**

```ts
test('multiple level ups queue', () => { const p = newPlayerProg('agumon'); const n = addXp(p, 500);
  expect(n).toBeGreaterThan(1); expect(p.pendingLevelUps).toBe(n); });
test('offers never learn a move already slotted', () => { const p = newPlayerProg('agumon'); const r = createRng(3);
  for (let i = 0; i < 200; i++) rollOffers(p, r).forEach(o => { if (o.kind === 'learn') expect(o.moveId).not.toBe('baby_flame'); }); });
test('offers fall back to stats when nothing else is possible', () => {
  const p = maxedProg('agumon'); // todos os slots cheios e no nível 5, sem carta
  const offers = rollOffers(p, createRng(1)); expect(offers).toHaveLength(3); expect(offers.every(o => o.kind === 'stat' || o.kind === 'card')).toBe(true); });
test('learn fills first empty slot', () => { const p = newPlayerProg('agumon'); applyOffer(p, { kind: 'learn', moveId: 'sharp_claws' });
  expect(p.slots[1]).toEqual({ moveId: 'sharp_claws', level: 1, fromCard: false }); });
test('defense reduces damage', () => expect(incomingDamage(100, 20)).toBe(50));
test('stage multiplies damage', () => { const a = newPlayerProg('agumon'), g = newPlayerProg('greymon');
  g.bonus.atk = effectiveStats(a).atk - effectiveStats(g).atk; // iguala atk
  expect(outgoingDamage(g, { moveId: 'baby_flame', level: 1, fromCard: false }) / outgoingDamage(a, a.slots[0]!)).toBeCloseTo(1.6); });
```
(`maxedProg` é um helper de teste em `tests/helpers.ts`.)

- [ ] **Step 2: Rodar** `npx vitest run tests/sim/stats.test.ts tests/sim/progression.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** `rollOffers`: monta candidatas (learn: golpes do `kit` da forma atual ainda não presentes, só se houver slot vazio; upgrade: slots com `level < 5`; stat: as 5; card: passivas com chance `CARD_OFFER_CHANCE`), sorteia 3 distintas com `rng`; se < 3, completa com stats.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat(sim): atributos, dano e level-up`

---

### Task 4: Hash espacial, inimigos e diretor de hordas

**Files:**
- Create: `src/sim/vec.ts`, `src/sim/spatial.ts`, `src/sim/director.ts`
- Test: `tests/sim/spatial.test.ts`, `tests/sim/director.test.ts`

**Interfaces:**
- Produces:
  - `SpatialHash` com `constructor(cell: number)`, `clear()`, `insert(id: number, x: number, z: number)`, `query(x: number, z: number, r: number, out: number[]): number[]`.
  - `Enemy = { id: number; def: string; x: number; z: number; hp: number; maxHp: number; dmg: number; speed: number; alive: boolean; boss: boolean; miniboss: boolean; hitFlash: number }`
  - `EnemyPool` com `spawn(def: EnemyDef | BossDef, x, z, scale: { hp: number; dmg: number }, flags?: { boss?: boolean; miniboss?: boolean }): Enemy | null` (null se `MAX_ENEMIES` atingido, exceto `boss`/`miniboss`, que sempre entram), `alive(): Enemy[]`, `kill(id)`.
  - `difficulty(phase: number, t: number): { spawnPerSec: number; hpMul: number; dmgMul: number }` — `t` em segundos dentro da fase. Até 600 s: crescimento suave `spawnPerSec = 1.5 + phase*0.8 + t/60*0.6`, `hpMul = dmgMul = (1 + (phase-1)*0.9) * (1 + t/600*0.6)`. **Após 600 s (overtime):** `m = (t-600)/60`; `spawnPerSec *= 4 + 2*m`; `hpMul *= (1 + 0.5*m)**2`; `dmgMul *= (1 + 0.5*m)**2`.
  - `stepDirector(state: { pool: EnemyPool; phase: number; t: number; acc: number; px: number; pz: number }, dt: number, rng: Rng): void` — acumula `spawnPerSec*dt`, spawna em anel de raio 22–28 em volta do jogador, espécie sorteada entre `ENEMIES` com `minPhase <= phase` (peso maior para `minPhase` mais alto).

- [ ] **Step 1: Testes que falham**

```ts
test('hash query finds only near ids', () => { const h = new SpatialHash(4); h.insert(1, 0, 0); h.insert(2, 50, 50);
  expect(h.query(1, 1, 3, [])).toEqual([1]); });
test('overtime is much harsher', () => { const a = difficulty(1, 599), b = difficulty(1, 660);
  expect(b.spawnPerSec / a.spawnPerSec).toBeGreaterThanOrEqual(4); expect(b.hpMul).toBeGreaterThan(a.hpMul * 2); });
test('difficulty grows with phase', () => expect(difficulty(3, 0).hpMul).toBeGreaterThan(difficulty(1, 0).hpMul));
test('pool caps normal enemies but not bosses', () => { const pool = new EnemyPool();
  for (let i = 0; i < T.MAX_ENEMIES + 50; i++) pool.spawn(ENEMIES[0], 0, 0, { hp: 1, dmg: 1 });
  expect(pool.alive().length).toBe(T.MAX_ENEMIES);
  expect(pool.spawn(BOSSES[0], 0, 0, { hp: 1, dmg: 1 }, { boss: true })).not.toBeNull(); });
test('spawns stay in the ring', () => { /* 10 s de stepDirector, todos os inimigos a distância 22..28 do jogador */ });
```

- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** (pool com array pré-alocado + free list). **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat(sim): hash espacial, pool e diretor de hordas`

---

### Task 5: Combate automático

**Files:**
- Create: `src/sim/combat.ts`
- Test: `tests/sim/combat.test.ts`

**Interfaces:**
- Consumes: `PlayerProg`, `effectiveStats`, `outgoingDamage`, `moveCooldown`, `incomingDamage`, `EnemyPool`, `SpatialHash`.
- Produces:
  - `Projectile = { x; z; vx; vz; dmg; radius; pierce; life; moveId; hit: Set<number> }`, `Area = { x; z; radius; dmg; life; tick; moveId; follow: boolean }` (área, aura, cone e beam viram `Area` com formato; orbital = projéteis que giram em volta do jogador).
  - `CombatState = { cooldowns: number[]; projectiles: Projectile[]; areas: Area[]; invuln: number; hp: number; maxHp: number; facingX: number; facingZ: number }`
  - `stepCombat(c: CombatState, p: PlayerProg, px: number, pz: number, pool: EnemyPool, hash: SpatialHash, dt: number, rng: Rng): CombatEvent[]` com `CombatEvent = { type: 'kill'; enemy: Enemy } | { type: 'hit'; enemyId: number; dmg: number } | { type: 'playerHit'; dmg: number }`.
  - Regras: cada slot não-nulo dispara quando seu cooldown zera; alvo = inimigo vivo mais próximo dentro de `range` (cone/beam usam a direção do alvo; aura segue o jogador; sem alvo no alcance = não dispara e o cooldown fica em 0). Contato inimigo↔jogador (distância < soma dos tamanhos × 0.5) causa `incomingDamage(dmg, def)` e 0,5 s de invulnerabilidade. Inimigos se movem em direção ao jogador a `speed` com separação leve via hash.

- [ ] **Step 1: Testes que falham**

```ts
test('no target in range does not consume cooldown', () => { /* inimigo a 100 unidades, stepCombat 1 s → nenhum projétil, cooldowns[0] === 0 */ });
test('projectile kills weak enemy and emits kill once', () => { /* inimigo hp 1 à frente; após 2 s de passos de 1/60, exatamente 1 evento kill */ });
test('pierce limits hits', () => { /* 3 inimigos em linha, golpe com pierce 1 → 2 hits */ });
test('contact damage respects invulnerability', () => { /* inimigo colado por 0.4 s → um único playerHit */ });
test('slash card move in slot fires like a kit move', () => { /* slot 1 = { moveId: 'diamond_storm', fromCard: true } dispara */ });
```

- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar.** **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat(sim): combate automático`

---

### Task 6: Loot, pickups e tabelas filtradas por parceiro

**Files:**
- Create: `src/sim/loot.ts`
- Test: `tests/sim/loot.test.ts`

**Interfaces:**
- Produces:
  - `Pickup = { id: number; x: number; z: number; kind: 'xp' | 'card' | 'item' | 'heal'; value: number; ref?: string }`
  - `Chest = { id: number; x: number; z: number; opened: boolean }`
  - `eligibleItems(partnerId: string, save: SaveData, owned: string[]): ItemDef[]` — Digiovos/fusões só se `forPartners` inclui o parceiro **e** `requiresUnlocked` estão em `save.unlocked`; ovos de Digimon só se `unlockPartner` **não** está desbloqueado; nada que já está em `owned`.
  - `eligibleCards(partnerId: string): CardDef[]` — passivas e slash para todos; raras só se `forPartners` inclui o parceiro.
  - `rollChest(partnerId: string, save: SaveData, owned: string[], phase: number, rng: Rng): { kind: 'card' | 'item' | 'heal'; ref?: string }` — chances: item 18% (ovo de Digimon no máximo 2% do total), card 62%, heal 20%. Fusões só a partir da fase 3; `blue_card` só a partir da fase 4.
  - `dropOnKill(enemy: Enemy, rng): { xp: number; extra?: 'heal' | 'card' }` — `heal` 1%, `card` 0,4% (o spec pede cartas "mais raramente" de inimigos); mini-chefes dropam 1 `rollChest`; chefes dropam 2.
  - `placeChests(phase: number, rng): Chest[]` — 8 baús por fase em posições sorteadas no mapa (distância mínima 15 entre si e do spawn).
  - `collect(pickups, px, pz, radius): Pickup[]` remove e retorna os coletados.

- [ ] **Step 1: Testes que falham**

```ts
test('digiegg only for veemon', () => { expect(eligibleItems('agumon', defaultSave(), []).some(i => i.kind === 'digiegg')).toBe(false);
  expect(eligibleItems('veemon', defaultSave(), []).map(i => i.id)).toContain('digiegg_courage'); });
test('fusion needs unlock', () => { expect(eligibleItems('agumon', defaultSave(), []).map(i => i.id)).not.toContain('fusion_garurumon');
  const s = { ...defaultSave(), unlocked: [...defaultSave().unlocked, 'gabumon'] };
  expect(eligibleItems('agumon', s, []).map(i => i.id)).toContain('fusion_garurumon'); });
test('egg of unlocked partner never drops', () => { const s = { ...defaultSave(), unlocked: [...defaultSave().unlocked, 'gabumon'] };
  expect(eligibleItems('agumon', s, []).map(i => i.id)).not.toContain('egg_gabumon'); });
test('blue card only for guilmon', () => expect(eligibleCards('agumon').map(c => c.id)).not.toContain('blue_card'));
test('owned items do not drop again', () => expect(eligibleItems('veemon', defaultSave(), ['digiegg_courage']).map(i => i.id)).not.toContain('digiegg_courage'));
```

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(sim): loot e tabelas por parceiro`

---

### Task 7: Cartas (3 passivas + slash em slot)

**Files:**
- Create: `src/sim/cards.ts`
- Test: `tests/sim/cards.test.ts`

**Interfaces:**
- Produces:
  - `CardResult = { status: 'equipped'; slot: number } | { status: 'full'; cardId: string }`
  - `offerPassive(p: PlayerProg, cardId: string): CardResult` — equipa no primeiro slot livre de `p.passives`; cheio → `'full'` (a UI pergunta qual trocar).
  - `replacePassive(p, slot: number | null, cardId): void` — `null` = descartar a nova.
  - `slashIntoSlot(p, slot: number, cardId: string): void` — põe `MOVES[card.moveId]` no slot (nível 1, `fromCard: true`); **slot 0 (assinatura) não pode ser substituído** (lança erro).
  - `gainRare(p, cardId)` / `gainItem(p, itemId)` adicionam a `p.items` (sem duplicar).

- [ ] **Step 1: Testes que falham**

```ts
test('4th passive reports full', () => { const p = newPlayerProg('agumon'); ['card_gatomon_claws','card_birdramon_wings','card_hyper_speed'].forEach(c => offerPassive(p, c));
  expect(offerPassive(p, 'card_data_magnet')).toEqual({ status: 'full', cardId: 'card_data_magnet' }); });
test('replace swaps passive and stats change', () => { /* replacePassive(p, 1, 'card_data_magnet') → passives[1] === 'card_data_magnet' e pickupMul 1.5 */ });
test('slash replaces a kit move', () => { /* slot 1 era sharp_claws; slashIntoSlot(p,1,'card_lightning_paw') → slots[1].moveId === 'lightning_paw' */ });
test('signature slot cannot be replaced', () => expect(() => slashIntoSlot(newPlayerProg('agumon'), 0, 'card_lightning_paw')).toThrow());
```

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(sim): cartas passivas e slash`

---

### Task 8: Digievolução

**Files:**
- Create: `src/sim/evolution.ts`
- Test: `tests/sim/evolution.test.ts`

**Interfaces:**
- Produces:
  - `EvoContext = { save: SaveData; phase: number }`
  - `availableEvolutions(p: PlayerProg, ctx: EvoContext): string[]` — ids das arestas cujo `req` é satisfeito (nível, `effectiveStats`, `items ⊆ p.items`, `unlocked ⊆ save.unlocked`, `minPhase`, `minKills`).
  - `EvoNotifier` com `update(available: string[]): string[]` — retorna as formas **novas** desde a última chamada (para avisar só quando surge opção nova; "esperar" não reavisa a mesma lista).
  - `evolve(p: PlayerProg, toFormId: string, ctx: EvoContext): void` — lança erro se `toFormId` não está em `availableEvolutions`. Efeitos: `formId = to`; `path.push(to)`; slot 0 vira a `signature` da nova forma **mantendo o nível** do slot 0; os demais slots são mantidos (o ganho de força vem do `STAGE_DMG`); nível e bônus mantidos; `hp` atual é restaurado ao novo máximo (feito pelo `run`).
  - Registra `to` em `save.discovered` (via `run`, Task 10).

- [ ] **Step 1: Testes que falham**

```ts
test('agumon to greymon needs level and atk', () => { const p = newPlayerProg('agumon'); p.level = 8;
  p.bonus.atk = 0; expect(availableEvolutions(p, ctx())).not.toContain('greymon');
  p.bonus.atk = 20; expect(availableEvolutions(p, ctx())).toContain('greymon'); });
test('veemon branches by stats', () => { /* spd alto → exveemon; atk+def → veedramon; ambos → os dois */ });
test('digiegg unlocks flamedramon early', () => { const p = newPlayerProg('veemon'); p.level = 5; p.items.push('digiegg_courage');
  expect(availableEvolutions(p, ctx())).toContain('flamedramon'); });
test('paildramon blocked without wormmon unlocked', () => { const p = progAt('exveemon', 22); p.items.push('fusion_stingmon');
  expect(availableEvolutions(p, ctx())).not.toContain('paildramon');
  expect(availableEvolutions(p, ctx({ unlocked: ['agumon','veemon','guilmon','wormmon'] }))).toContain('paildramon'); });
test('notifier only reports new options', () => { const n = new EvoNotifier();
  expect(n.update(['greymon'])).toEqual(['greymon']); expect(n.update(['greymon'])).toEqual([]); });
test('evolve upgrades signature keeping level and records path', () => { const p = progAt('agumon', 8); p.bonus.atk = 20; p.slots[0]!.level = 3;
  evolve(p, 'greymon', ctx()); expect(p.slots[0]).toMatchObject({ moveId: 'mega_flame', level: 3 }); expect(p.path).toEqual(['agumon','greymon']); });
test('evolve rejects unavailable form', () => expect(() => evolve(newPlayerProg('agumon'), 'wargreymon', ctx())).toThrow());
```

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(sim): digievolução com escolha`

---

### Task 9: Fases, missões, chefe e overtime

**Files:**
- Create: `src/sim/phase.ts`
- Test: `tests/sim/phase.test.ts`

**Interfaces:**
- Produces:
  - `MissionKind = 'miniboss' | 'collect' | 'activate'`
  - `Mission = { kind: MissionKind; done: boolean; progress: number; goal: number; points: { x: number; z: number; charge: number }[] }` — `miniboss`: derrotar 1 Deva (goal 1, spawnado aos 60 s); `collect`: 6 fragmentos espalhados (goal 6); `activate`: 3 pontos, jogador parado dentro de raio 3 por 5 s cada (goal 3).
  - `PhaseState = { phase: number; t: number; mission: Mission; bossUnlocked: boolean; bossAltar: { x: number; z: number }; bossActive: boolean; bossId: number | null; overtime: boolean; cleared: boolean }`
  - `newPhase(phase: number, rng: Rng): PhaseState` — missão sorteada (fase 1 nunca `miniboss`).
  - `stepPhase(s: PhaseState, input: { px: number; pz: number; dt: number; killedMiniboss: boolean; collectedFragment: boolean; bossDead: boolean; playerDead: boolean }): PhaseEvent[]` com `PhaseEvent = 'missionProgress' | 'bossUnlocked' | 'overtimeStarted' | 'bossStarted' | 'phaseCleared' | 'playerDied'`.
  - Chefe começa quando `bossUnlocked` e jogador entra no raio 4 do altar. `t > 600` liga `overtime` (o chefe segue disponível).
  - **Mesmo passo com `bossDead` e `playerDead`: emite `phaseCleared` e não `playerDied`.**

- [ ] **Step 1: Testes que falham**

```ts
test('boss locked until mission done', () => { /* stepPhase até t=300 sem progresso → bossUnlocked false */ });
test('collect mission unlocks boss at 6 fragments', () => { /* 6× collectedFragment → evento bossUnlocked */ });
test('activate requires standing still in range for 5s per point', () => { /* 4.9 s dentro → charge < 1; sair e voltar reinicia? Não: carga acumula, não reinicia */ });
test('overtime starts after 600s', () => { /* t de 599.9 para 600.1 → evento overtimeStarted uma vez */ });
test('boss starts only near altar', () => { /* bossUnlocked, jogador longe → nada; perto → bossStarted */ });
test('simultaneous boss and player death clears phase', () => { const s = unlockedActive();
  expect(stepPhase(s, { ...noop(), bossDead: true, playerDead: true })).toContain('phaseCleared');
  expect(stepPhase(s, { ...noop(), bossDead: true, playerDead: true })).not.toContain('playerDied'); });
```
Decisão fixada: a carga de um ponto `activate` **acumula** (sair do raio pausa, não zera).

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(sim): fases, missões, chefe e overtime`

---

### Task 10: RunState — integração da simulação

**Files:**
- Create: `src/sim/run.ts`
- Test: `tests/sim/run.test.ts`

**Interfaces:**
- Consumes: tudo de `src/sim/*`, `SaveData`.
- Produces:
  - `InputState = { mx: number; mz: number }` (vetor de movimento, magnitude ≤ 1).
  - `RunState = { partnerId; seed; rng; save; prog: PlayerProg; combat: CombatState; px; pz; pool: EnemyPool; hash; director; phase: PhaseState; pickups: Pickup[]; chests: Chest[]; evo: EvoNotifier; paused: boolean; ended: null | 'victory' | 'defeat'; time: number; offers: LevelOffer[] | null; pendingCard: string | null }`
  - `createRun(opts: { partnerId: string; seed: number; save: SaveData }): RunState`
  - `stepRun(run: RunState, input: InputState, dt: number): RunEvent[]` — não faz nada se `paused` ou `ended` ou `offers !== null` ou `pendingCard !== null` (modais congelam o jogo). Ordem por passo: mover jogador (velocidade `4 + spd*0.08`, limitado ao mapa `±100`, colisão com obstáculos de `MAP_OBSTACLES`), diretor, combate, pickups/baús (abrir baú = encostar), loot de kills, fase, evolução (notifier), level-up (se `pendingLevelUps > 0` e `offers === null` → `offers = rollOffers(...)`).
  - `RunEvent = { type: 'levelUp' } | { type: 'evolutionAvailable'; forms: string[] } | { type: 'bossUnlocked' } | { type: 'bossStarted' } | { type: 'overtime' } | { type: 'phaseCleared'; phase: number } | { type: 'victory' } | { type: 'defeat' } | { type: 'cardFound'; cardId: string } | { type: 'itemFound'; itemId: string } | { type: 'partnerUnlocked'; partnerId: string } | { type: 'kill'; x: number; z: number } | { type: 'hit'; x: number; z: number; dmg: number }`
  - `chooseOffer(run, index: number): void`, `doEvolve(run, formId: string): void` (registra em `save.discovered` e chama `storeSave`), `resolveCard(run, choice: { passiveSlot?: number | null; moveSlot?: number }): void`.
  - Ao coletar `egg_*`: adiciona `unlockPartner` a `save.unlocked`, chama `storeSave` **na hora** e emite `partnerUnlocked`.
  - `phaseCleared` na fase < 5 → `phase = newPhase(n+1)`, limpa inimigos/pickups, novos baús, jogador volta ao centro com HP cheio. Fase 5 → `ended = 'victory'`. Fim (vitória ou derrota) atualiza `save.records` (`bestPhase`, `wins`, `runs`) e chama `storeSave`.
  - `MAP_OBSTACLES: { x: number; z: number; r: number }[]` exportado de `src/sim/map.ts` (gerado com RNG fixo seed 1234; ~60 rochas/árvores; nenhuma a menos de 8 do centro) — o render usa a mesma lista.

- [ ] **Step 1: Testes que falham**

```ts
test('modal offers freeze the run', () => { const r = createRun(opts()); r.offers = [{ kind: 'stat', stat: 'atk', amount: 3 }];
  const t = r.time; stepRun(r, { mx: 1, mz: 0 }, 1/60); expect(r.time).toBe(t); });
test('egg unlocks partner immediately and persists even on defeat', () => { /* injeta pickup egg_gabumon sob o jogador; step; save.unlocked contém gabumon; força defeat; loadSave(fake) ainda contém gabumon */ });
test('headless bot survives a full phase timeline without NaN', () => {
  const r = createRun(opts({ seed: 99 })); r.prog.bonus.hp = 100000; // imortal pro teste
  for (let i = 0; i < 60 * 660; i++) { autoResolveModals(r); stepRun(r, circleInput(i), 1/60); }
  expect(r.phase.overtime).toBe(true);
  expect(r.pool.alive().length).toBeLessThanOrEqual(T.MAX_ENEMIES + 6);
  expect(Number.isFinite(r.px) && Number.isFinite(r.pz)).toBe(true); });
test('clearing phase 5 is victory and records it', () => { /* força phase 5 com bossDead → ended 'victory', records.wins 1 */ });
test('player stays inside map bounds', () => { /* input mx=1 por 120 s → px <= 100 */ });
```
(`autoResolveModals` escolhe a oferta 0, descarta cartas e nunca evolui; `circleInput` em `tests/helpers.ts`.)

- [ ] **Step 2: Rodar** `npx vitest run tests/sim/run.test.ts` → FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Rodar** `npx vitest run` (suíte inteira) → PASS; o teste headless deve rodar em < 20 s.
- [ ] **Step 5: Commit** `feat(sim): integração da partida`

---

### Task 11: Entrada (teclado + gamepad + remapeamento)

**Files:**
- Create: `src/core/input.ts`
- Test: `tests/core/input.test.ts`

**Interfaces:**
- Produces:
  - `Action = 'up' | 'down' | 'left' | 'right' | 'confirm' | 'cancel' | 'evolve' | 'pause' | 'opt1' | 'opt2' | 'opt3'`
  - `DEFAULT_BINDINGS: Record<Action, string[]>` — teclado: WASD + setas, `Enter`/`Space` confirmar, `Escape` pausa/cancelar, `KeyE` evoluir, `Digit1..3` opções. Gamepad (strings `pad:b<N>` / `pad:a<N>±`): `pad:b0` confirmar, `pad:b1` cancelar, `pad:b3` evoluir, `pad:b9` pausa, eixos `pad:a0`/`pad:a1` movimento.
  - `createInput(target: { addEventListener: Window['addEventListener'] }, getPads: () => (Gamepad | null)[], bindings: Record<string, string>): Input` com `Input = { poll(): void; move(): { mx: number; mz: number }; pressed(a: Action): boolean /*borda de subida desde o último poll*/; rebind(a: Action, code: string): void; bindings(): Record<string, string>; captureNext(): Promise<string> }`.
  - Zona morta do analógico 0.2; vetor normalizado para magnitude ≤ 1. Bindings salvos em `SaveData.bindings` (`action → código`), sobrescrevendo o padrão para aquela ação.

- [ ] **Step 1: Testes que falham** (com `target` e `getPads` falsos)

```ts
test('WASD diagonal is normalized', () => { /* W+D → magnitude ≈ 1 */ });
test('pad stick beats deadzone', () => { /* eixo 0.1 → 0; eixo 0.8 → mx 0.8 */ });
test('rebound pad button triggers action', () => { const i = make(); i.rebind('evolve', 'pad:b5'); /* botão 5 pressionado → pressed('evolve') */ });
test('pad disconnect falls back to keyboard', () => { /* getPads retorna [] após estar conectado; tecla D ainda move */ });
test('pressed is edge-triggered', () => { /* segurar Enter 3 polls → true só no primeiro */ });
```

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Commit** `feat(core): entrada com gamepad remapeável`

---

### Task 12: Renderização (cena, mapa, billboards placeholder)

**Files:**
- Create: `src/render/scene.ts`, `src/render/map.ts`, `src/render/placeholder.ts`, `src/render/billboards.ts`, `src/render/vfx.ts`, `src/main.ts` (versão inicial: cena + loop + partida de Agumon direto, sem menus)

**Interfaces:**
- Consumes: `RunState`, `MAP_OBSTACLES`, `FORMS`, `ENEMIES`, `BOSSES`, `createFixedLoop`, `createInput`.
- Produces:
  - `createScene(canvas: HTMLCanvasElement): { renderer; scene; camera; resize(): void }` — câmera perspectiva FOV 45, offset fixo `(0, 18, 14)` em relação ao jogador, olhando para ele; `devicePixelRatio` limitado a 1.5.
  - `buildMap(scene): void` — chão 200×200 com textura procedural, obstáculos de `MAP_OBSTACLES` (cilindros/cones low-poly), marcador do altar e dos pontos de missão.
  - `placeholderTexture(id: string, label: string, color: number): THREE.CanvasTexture` — 64×64, círculo colorido com borda e as 3 primeiras letras; `NearestFilter`; cache por id.
  - `Billboards` com `sync(run: RunState, time: number): void` — um `InstancedMesh` (plano 1×1, `alphaTest 0.5`) por espécie de inimigo/chefe, capacidade `MAX_ENEMIES`; jogador e chefe como mesh individual. Quaternion = da câmera (câmera de ângulo fixo). Efeitos: balanço vertical `sin(t*10)*0.05*size` ao mover, squash `scaleY 0.85` por 0.08 s ao disparar, flash branco (`hitFlash > 0`) via cor de instância, espelhamento horizontal pela direção X.
  - `Vfx` com `sync(run, events: RunEvent[]): void` — projéteis/áreas como meshes simples coloridos com `MoveDef.color`; números de dano flutuantes (pool de 64 sprites).

- [ ] **Step 1: Implementar** os módulos acima e um `main.ts` mínimo. Flags de debug lidas de `?debug=` (separadas por vírgula, só em `import.meta.env.DEV`): `spawn600` (enche o pool), `xp10` (XP ×10), `items` (baús sempre dão item elegível). Partida: `createRun({ partnerId: 'agumon', seed: Date.now(), save: loadSave() })`, loop fixo 1/60 com `maxFrame 0.25`, auto-escolha da 1ª oferta (temporário até a Task 13).
- [ ] **Step 2: Verificar build** `npm run build` → sucesso, sem erros de tipo.
- [ ] **Step 3: Verificar no navegador** — `npm run dev`, abrir `http://localhost:5173` no Chrome. Esperado: mapa visível, Agumon placeholder no centro se move com WASD e analógico, inimigos surgem em anel e vêm em direção a ele, Baby Flame dispara sozinho e mata, números de dano aparecem. Com o overlay de FPS do Chrome (Rendering → Frame rendering stats), forçar 600 inimigos (`?debug=spawn600`, flag de debug lida em `main.ts`) e confirmar ≥ 55 fps.
- [ ] **Step 4: Commit** `feat(render): cena, mapa e billboards placeholder`

---

### Task 13: HUD e modais de jogo

**Files:**
- Create: `src/ui/dom.ts` (helper `h(tag, attrs, ...children)`), `src/ui/hud.ts`, `src/ui/levelup.ts`, `src/ui/evolve.ts`, `src/ui/cardmodal.ts`, `src/ui/toast.ts`, `src/ui/style.css`
- Modify: `src/main.ts` (remove auto-escolha; liga modais e eventos)

**Interfaces:**
- Consumes: `RunState`, `RunEvent`, `chooseOffer`, `doEvolve`, `resolveCard`, `availableEvolutions`, `Input`.
- Produces: `mountHud(root: HTMLElement): { update(run: RunState): void }`; `showLevelUp(run, input): void`; `showEvolve(run, input): void`; `showCardChoice(run, input): void`; `toast(text: string, kind?: 'info' | 'rare'): void`.

Conteúdo da HUD (pt-BR): barra de HP, nível + barra de XP, `Fase N/5`, timer `mm:ss` (vermelho e pulsando em overtime, texto "HORDAS INSANAS"), objetivo da missão com progresso ("Derrote o Deva", "Fragmentos 3/6", "Pontos 1/3"), "Chefe liberado — vá ao altar" com seta indicando a direção do altar, 4 ícones de golpe com nível e recarga, 3 slots de carta, ícones dos itens-chave (Digiovos/fusões/cartas raras), barra de vida do chefe quando ativo, indicador "Digievolução disponível! [E]" quando o notifier tem opções.

Modais (todos navegáveis por teclado, mouse e gamepad; `opt1..3` como atalho):
- Level-up: 3 cartões com nome, descrição curta e efeito numérico.
- Digievolução: forma atual → opções disponíveis (nome, estágio, golpe principal novo, atributos base) + botão **"Esperar"**. Abre só quando o jogador aperta `evolve`; nunca abre sozinho.
- Carta cheia: escolher qual das 3 passivas trocar ou descartar a nova. Carta slash: escolher slot 1–3 ou descartar.

- [ ] **Step 1: Implementar.**
- [ ] **Step 2: `npm run build`** → sucesso.
- [ ] **Step 3: Verificar no navegador** — Agumon chega ao nível 8 com atk ≥ 14 (usar `?debug=xp10`, que multiplica XP por 10), aparece o aviso, `E` abre o modal, "Esperar" fecha sem evoluir e o aviso **não** reaparece até surgir opção nova; evoluir troca o placeholder para Greymon e o golpe para Mega Flame. Level-up pausa o jogo (inimigos parados). Abrir um baú com 3 passivas equipadas mostra o modal de troca.
- [ ] **Step 4: Commit** `feat(ui): HUD e modais de jogo`

---

### Task 14: Menus, fluxo completo e pausa

**Files:**
- Create: `src/ui/title.ts`, `src/ui/select.ts`, `src/ui/pause.ts`, `src/ui/results.ts`, `src/ui/settings.ts`, `src/ui/credits.ts`, `src/app.ts`
- Modify: `src/main.ts` (delegar para `app.ts`)
- Test: `tests/app.test.ts`

**Interfaces:**
- Produces: `AppScreen = 'title' | 'season' | 'partner' | 'run' | 'results' | 'settings' | 'credits'`; `createApp(deps: { save: SaveData; storage: Storage | null; startRun(partnerId: string): void }): { screen(): AppScreen; go(s: AppScreen): void; selectSeason(s: Season): void; partnersFor(s: Season): { id: string; locked: boolean }[] }`.
- Fluxo: Título (Jogar / Controles / Créditos) → Temporada (Adventure, Adventure 02, Tamers) → Parceiro (todos os `PARTNERS` da temporada; bloqueados aparecem como silhueta "?" com dica "Encontre o ovo nas fases") → partida → Resultado (vitória/derrota, fase alcançada, tempo, abates, **caminho evolutivo** `prog.path` com placeholders em sequência, parceiros desbloqueados nesta partida) → Título.
- Pausa: `Escape`/`pad:b9` e **automaticamente em `document.visibilitychange` oculto**; menu Continuar / Controles / Desistir (desistir = derrota).
- Controles: lista de ações com tecla/botão atual; clicar → `captureNext()` → `rebind` → `storeSave`. Botão "Restaurar padrão".
- Créditos: texto fixo do aviso legal (Global Constraints) + "Sprites provisórios".

- [ ] **Step 1: Testes que falham**

```ts
test('locked partners are listed but locked', () => { const a = createApp(deps());
  expect(a.partnersFor('adventure')).toEqual([{ id: 'agumon', locked: false }, { id: 'gabumon', locked: true }]); });
test('unlocked partner shows as available', () => { const a = createApp(deps({ unlocked: ['agumon','veemon','guilmon','wormmon'] }));
  expect(a.partnersFor('adventure02')).toContainEqual({ id: 'veemon', locked: false }); });
```
(`gabumon` e `wormmon` vêm da Task 2.)

- [ ] **Step 2–4:** FAIL → implementar → PASS (`npx vitest run`).
- [ ] **Step 5: Verificar no navegador** — fluxo completo título → temporada → parceiro → partida → desistir → resultado → título; alt-tab durante a partida pausa sozinho; remapear "Evoluir" para outro botão do 8BitDo e confirmar que funciona após recarregar a página.
- [ ] **Step 6: Commit** `feat(ui): menus, pausa e fluxo completo`

---

### Task 15: Chefes, mini-chefes e verificação final

**Files:**
- Modify: `src/sim/combat.ts` (padrões de chefe), `src/sim/run.ts` (spawn de chefe/Deva/fragmentos), `src/render/billboards.ts` (escala de chefe)
- Test: `tests/sim/boss.test.ts`

**Interfaces:**
- Produces: `stepBoss(boss: Enemy, def: BossDef, px, pz, dt, rng, spawnHostile: (p: HostileProjectile) => void): void` — cada chefe alterna entre perseguir e usar seus `moves` (projéteis hostis em leque, investida, área no chão com aviso de 1 s). `HostileProjectile = { x; z; vx; vz; dmg; radius; life }` guardado em `CombatState.hostiles` e colidindo com o jogador.
- Chefes: Devimon (Touch of Evil — investida), Etemon (Dark Network — leque de 8), Myotismon (Crimson Lightning — área com aviso + morcegos), Kimeramon (Heat Viper — feixe varrendo), Piedmon (Trump Sword — 4 espadas em cruz + teleporte). HP base escalado por `difficulty(phase, t).hpMul` no momento do spawn.

- [ ] **Step 1: Testes que falham**

```ts
test('area attack telegraphs before damaging', () => { /* área criada; jogador dentro por 0.9 s → 0 dano; em 1.1 s → dano */ });
test('boss spawn scales with time spent', () => { /* chefe spawnado em t=500 tem mais HP que em t=100 */ });
test('every boss move id exists', () => BOSSES.forEach(b => b.moves.forEach(m => expect(MOVES[m]).toBeDefined())));
```

- [ ] **Step 2–4:** FAIL → implementar → PASS.
- [ ] **Step 5: Verificação final**
  - `npx vitest run` → todos PASS.
  - `npm run build` → sucesso; `dist/` sem requisições externas (`grep -r "http" dist/assets/*.js` só mostra URLs do próprio three.js/comentários, nenhum fetch).
  - Partida real no Chrome com cada inicial, usando `?debug=xp10`: Agumon chega a WarGreymon; Veemon pega `digiegg_courage` e vira Flamedramon (forçar drop com `?debug=items`); Guilmon com `blue_card` vira Gallantmon; com save editado incluindo `gabumon`/`wormmon`, Omnimon e Paildramon → Imperialdramon FM aparecem nas opções. Deixar o timer passar de 10:00 numa fase e confirmar hordas insanas matando em ~1–2 min. Vencer as 5 fases com debug e ver o resultado com o caminho evolutivo.
- [ ] **Step 6: Commit** `feat(sim): chefes e verificação final do plano 1`
