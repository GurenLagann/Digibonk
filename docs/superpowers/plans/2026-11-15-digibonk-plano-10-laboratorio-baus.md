# Laboratório, Bits e baús pagos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Progressão entre partidas (Cristais → Laboratório de ferramentas da subida de nível) e baús do mapa como escolha (Bits da partida, preço crescente, Digiovo raro, baú amaldiçoado com emboscada que dá relíquia).

**Architecture:** Conteúdo do Laboratório no banco SQLite (migration + seed novos → `LAB_UPGRADES` no `gamedata.ts`, como as relíquias). Regras puras em `src/sim/` e `src/core/` com testes vitest; números em `T` (`src/data/tuning.ts`). Render/UI só leem o estado (`map.ts`, `vfx.ts`, `hud.ts`, telas B2).

**Tech Stack:** TypeScript, Three.js r187, Vite, vitest + happy-dom, node:sqlite (Node ≥ 22.13).

**Spec:** `docs/superpowers/specs/2026-11-15-digibonk-laboratorio-baus-design.md`

## Global Constraints

- Banco = fonte de verdade do conteúdo; **não editar seeds/migrations antigos** (teste de fidelidade `tests/db/fixtures/before.json`) → só `db/migrations/006_laboratorio.sql` + `db/seeds/010_laboratorio.sql`; SQL puro portátil como os outros.
- Depois de mexer no banco: `npm run db:build` regenera `src/data/generated/gamedata.ts` (não editar esse arquivo à mão).
- Save antigo carrega sem perder nada: `currency` já existe (= Cristais); `lab` novo com padrão `{}` (nível 0).
- Todo número de balanceamento em `T` (`src/data/tuning.ts`): `T.BITS`, `T.CHESTS`, `T.CURSED`, `T.CRYSTALS`.
- Laboratório: Atualizar +1 por nível (3 níveis, 100/250/500), Pular +1 (3 níveis, 100/250/500), Banir +1 (2 níveis, 150/400), 4ª opção (1 nível, 800).
- Baús por fase: 2 grátis + 6 pagos + 1 amaldiçoado. Preço do pago pela quantidade já comprada **na partida**: `[20, 35, 55, 80, 110, 145, 185, 230]`, depois +50 por baú.
- Digiovo no baú pago: chance `T.CHESTS.EGG_CHANCE = 0.05`, só Digiovo (`kind: 'digiegg'`) que a linha do parceiro usa numa evolução e que ele ainda não tem.
- Baú amaldiçoado: 12 Bakemon em anel (raio 9), vida × 2,5 e dano × 1,5 sobre a dificuldade atual; todos mortos → oferta de relíquia (como a Zona Digital) + Bits; relíquias cheias/sem livres → carta rara; fugir = sem prêmio.
- Cristais no fim (qualquer resultado): `fase × 20 + abates / 200 + chefes × 15 + guardiões × 10 + medalha` (vitória sem medalha 20, prata 40, ouro 70, campeão 100), arredondado para baixo.
- Textos da UI em pt-BR; nomes "Bits", "Cristais", emoji 💠; estilo B2 das telas existentes (`src/ui/theme.ts`).
- Só mecânica do PokéBonk; nada de arte/nome copiado.

## Review Focus

1. **Save antigo ou adulterado** (`lab` ausente, id desconhecido, nível negativo/fracionário/acima do máximo, `currency` negativa) → carrega com níveis válidos 0..máx e saldo ≥ 0. (Task 2)
2. **Entrar na Zona Digital durante a emboscada** (o `pool` é trocado) → o prêmio não sai antes da hora; ao voltar, a emboscada continua contando. (Task 6)
3. **Encostar num baú pago sem Bits, ficar parado em cima, sair e voltar** → não abre, Bits nunca ficam negativos, um aviso por aproximação (não um por quadro). (Task 5)
4. **4ª opção com poucas ofertas possíveis** (todos os golpes no máximo, cartas banidas) → até 4 ofertas sem repetir, nunca `undefined`. (Task 3)
5. **Fim de partida duas vezes** (derrota dentro da Zona Digital, vitória com relíquia pendente) → Cristais somados uma única vez. (Task 7)

---

### Task 1: Laboratório no banco

**Files:**
- Create: `db/migrations/006_laboratorio.sql`, `db/seeds/010_laboratorio.sql`, `src/data/lab.ts`
- Modify: `tools/db/export.ts` (query + linha `export const LAB_UPGRADES` no gerador), `src/data/types.ts`
- Regenerate: `src/data/generated/gamedata.ts` (`npm run db:build`)
- Test: `tests/db/export.test.ts`, `tests/db/schema.test.ts` (seguir o padrão das relíquias)

**Interfaces:**
- Produces: `type LabEffect = 'reroll' | 'skip' | 'ban' | 'offer'`; `interface LabUpgradeDef { id: string; name: string; description: string; effect: LabEffect; costs: number[] }` (`costs[i]` = preço do nível i+1; `costs.length` = nível máximo); `LAB_UPGRADES: Record<string, LabUpgradeDef>` e `LAB_LIST: readonly LabUpgradeDef[]` (ordem do `ord`) em `src/data/lab.ts`.

- [ ] **Step 1: Teste** — em `tests/db/export.test.ts`:
```ts
test('Laboratório: 4 melhorias com preços por nível', () => {
  expect(Object.values(g.LAB_UPGRADES).map((u: any) => [u.id, u.effect, u.costs])).toEqual([
    ['lab_reroll', 'reroll', [100, 250, 500]],
    ['lab_skip', 'skip', [100, 250, 500]],
    ['lab_ban', 'ban', [150, 400]],
    ['lab_offer', 'offer', [800]],
  ]);
});
```
- [ ] **Step 2:** `npx vitest run tests/db` → FAIL (`LAB_UPGRADES` undefined).
- [ ] **Step 3:** Migration: `lab_upgrades(id TEXT PK, name, description, effect TEXT CHECK IN ('reroll','skip','ban','offer'), ord INTEGER)` + `lab_upgrade_costs(upgrade_id TEXT REFERENCES lab_upgrades, level INTEGER, cost INTEGER, PRIMARY KEY(upgrade_id, level))`. Seed com os 4 (nomes: "Atualizar+", "Pular+", "Banir+", "Quarta opção"; descrições curtas em pt-BR). Export: `costs` ordenados por `level`. `src/data/lab.ts` no padrão de `src/data/relics.ts`.
- [ ] **Step 4:** `npm run db:build && npx vitest run tests/db` → PASS (fidelidade `before.json` intacta).
- [ ] **Step 5:** Commit `feat(lab): melhorias do Laboratório no banco`.

### Task 2: Save — níveis do Laboratório e compra

**Files:**
- Create: `src/core/lab.ts`
- Modify: `src/core/save.ts` (`SaveData.lab`, `defaultSave`, `loadSave`)
- Test: `tests/core/lab.test.ts`, `tests/core/save.test.ts`

**Interfaces:**
- Consumes: `LAB_UPGRADES`, `LAB_LIST` (Task 1).
- Produces: `SaveData.lab: Record<string, number>`; em `src/core/lab.ts`: `labLevel(save, id): number`; `nextLabCost(save, id): number | null` (null = no máximo); `buyLab(save, id): boolean` (debita `currency`, sobe 1 nível; false sem saldo/no máximo/id desconhecido; não grava no storage — quem chama faz `storeSave`); `labBonuses(save): { reroll: number; skip: number; ban: number; extraOffers: number }`.

- [ ] **Step 1: Testes** — `buyLab` com 99 Cristais → false e nada muda; com 100 → true, `currency` 0, `labLevel` 1, `nextLabCost` 250; `lab_offer` comprado → `nextLabCost` null e `buyLab` false; `labBonuses` com reroll 2, ban 1, offer 1 → `{ reroll: 2, skip: 0, ban: 1, extraOffers: 1 }`. Em `save.test.ts`: `loadSave` de JSON sem `lab` → `{}`; com `{ lab: { lab_reroll: 9, lab_ban: -1, lab_skip: 1.5, xyz: 2 }, currency: -5 }` → `{ lab_reroll: 3 }` (ban/skip descartados, xyz descartado) e `currency` 0.
- [ ] **Step 2:** `npx vitest run tests/core` → FAIL.
- [ ] **Step 3:** Implementar. `loadSave`: só ids de `LAB_UPGRADES`, inteiro, `1..costs.length` (acima do máximo corta no máximo; ≤0 ou não inteiro descarta); `currency` = `max(0, num(...))`.
- [ ] **Step 4:** `npx vitest run tests/core` → PASS.
- [ ] **Step 5:** Commit `feat(lab): níveis no save e compra`.

### Task 3: Partida aplica o Laboratório (usos e 4ª opção)

**Files:**
- Modify: `src/sim/progression.ts` (`rollOffers`), `src/sim/run.ts` (`createRun`, `RunState`, chamadas de `rollOffers`), `src/sim/debug.ts` (chamada de `rollOffers`), `src/ui/levelup.ts` (desenhar 4 cartas sem quebrar o layout)
- Test: `tests/sim/progression.test.ts`, `tests/sim/run.test.ts` (ou o arquivo onde `levelTools` já é testado)

**Interfaces:**
- Consumes: `labBonuses(save)` (Task 2).
- Produces: `rollOffers(p, rng, exclude = new Set(), count = T.OFFERS_PER_LEVEL): LevelOffer[]`; `RunState.offerCount: number`; `createRun` faz `levelTools = { reroll: T.LEVEL_TOOLS.reroll + b.reroll, skip: … , ban: … }` e `offerCount = T.OFFERS_PER_LEVEL + b.extraOffers`. Todas as chamadas em `run.ts`/`debug.ts` passam `r.offerCount`.

- [ ] **Step 1: Testes** — save com `lab: { lab_reroll: 3, lab_ban: 2, lab_offer: 1 }` → `createRun(...).levelTools` = `{ reroll: 5, skip: 2, ban: 3 }` e a primeira oferta de nível tem 4 itens; `rollOffers(p, rng, new Set(), 4)` com prog cujo kit está todo no máximo e todos os status banidos menos 1 → resultado sem `undefined` e sem chaves `offerKey` repetidas (Review Focus 4).
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Implementar (`want = count`; `banOffer` continua repondo 1).
- [ ] **Step 4:** `npx vitest run tests/sim tests/ui` → PASS; abrir `?debug` no Chrome com save de 4ª opção e conferir a subida de nível com 4 cartas.
- [ ] **Step 5:** Commit `feat(lab): ferramentas e 4ª opção na partida`.

### Task 4: Bits

**Files:**
- Modify: `src/data/tuning.ts` (`T.BITS`), `src/sim/loot.ts` (`Pickup['kind']` ganha `'bits'`; `isMagnetic` true), `src/sim/run.ts` (`RunState.bits`, drop no abate, coleta), `src/render/vfx.ts` (`PICKUP_COLORS.bits = 0xffc23a`), `src/ui/hud.ts` ("Bits N" sob a barra de vida)
- Test: `tests/sim/bits.test.ts`

**Interfaces:**
- Produces: `T.BITS = { DROP_CHANCE: 0.05, PER_PHASE: 1, GUARDIAN_PER_PHASE: 25, BOSS_PER_PHASE: 60 }` (valor do pickup = `PER_PHASE × fase`; guardião/chefe soltam um pickup de `X_PER_PHASE × fase`); `RunState.bits: number` (inteiro ≥ 0, zera em `createRun`).

- [ ] **Step 1: Testes** — com `rng` forçado (< DROP_CHANCE) um inimigo comum morto na fase 2 deixa pickup `{ kind: 'bits', value: 2 }`; coletar soma em `r.bits`; guardião na fase 1 deixa 25; chefe na fase 3 deixa 180; `isMagnetic('bits')` true.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar: sorteio dos Bits com `r.rng` logo depois do `dropOnKill` (inimigo comum; guardião/chefe sem sorteio). Se algum teste antigo depender da sequência exata do `rng`, ajustar o teste e citar no commit.
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** Commit `feat(baus): Bits da partida`.

### Task 5: Baús pagos e Digiovo raro

**Files:**
- Modify: `src/data/tuning.ts` (`T.CHESTS`), `src/sim/loot.ts` (`Chest`, `placeChests`, `chestPrice`, `eggsForPartner`), `src/sim/run.ts` (abrir baú, `RunState.chestsBought`, evento `chestLocked`)
- Test: `tests/sim/chests.test.ts`

**Interfaces:**
- Produces: `T.CHESTS = { FREE: 2, PAID: 6, PRICES: [20, 35, 55, 80, 110, 145, 185, 230], PRICE_STEP: 50, EGG_CHANCE: 0.05 }`; `interface Chest { id; x; z; opened: boolean; kind: 'free' | 'paid' | 'cursed'; near?: boolean }`; `placeChests(phase, rng, free = T.CHESTS.FREE, paid = T.CHESTS.PAID): Chest[]` (9 baús: os 2 primeiros `free`, 6 `paid`, último `cursed`; mesmas regras de distância de hoje); `chestPrice(bought: number): number`; `eggsForPartner(partnerId: string, owned: string[]): string[]` (ids com `ITEMS[id].kind === 'digiegg'` em `req.items` das evoluções de todas as formas com `FORMS[x].line === FORMS[childForm].line`, menos `owned`); `RunState.chestsBought: number`; `RunEvent` ganha `{ type: 'chestLocked'; missing: number }` e `{ type: 'chestOpened'; x; z; kind: Chest['kind'] }`.

- [ ] **Step 1: Testes** —
  - `placeChests(1, rng)` → 9 baús, contagem por kind `{ free: 2, paid: 6, cursed: 1 }`.
  - `[0,1,2,7,8,9].map(chestPrice)` → `[20, 35, 55, 230, 280, 330]`.
  - Pago com `bits = 19` e `chestsBought = 0`: entrar no raio → 1 `chestLocked { missing: 1 }`; ficar 30 passos parado em cima → nenhum evento novo; sair e voltar → mais 1; `bits` continua 19 (Review Focus 3).
  - Com `bits = 50`: abre, `bits = 30`, `chestsBought = 1`; o próximo pago custa 35.
  - Grátis abre com `bits = 0` e não muda `chestsBought`.
  - `eggsForPartner('veemon', [])` contém `digiegg_courage`, `digiegg_friendship`, `digiegg_miracles`; `eggsForPartner('agumon', [])` → `[]`; com `digiegg_courage` em `owned` ele some.
  - Baú pago com `rng` < `EGG_CHANCE` e parceiro Veemon → pickup `{ kind: 'item', ref: <um digiegg do eggsForPartner> }`; com Agumon → loot normal (`lootRoll`).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar. `near` liga ao entrar no raio (`CHEST_RADIUS`) e desliga ao sair; o aviso só sai na transição. Debitar só se `bits >= preço`. `kind: 'cursed'` fica para a Task 6 (aqui ignora-se no laço de abrir).
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** Commit `feat(baus): baús pagos com preço crescente e Digiovo raro`.

### Task 6: Baú amaldiçoado e emboscada

**Files:**
- Modify: `src/data/tuning.ts` (`T.CURSED`), `src/sim/run.ts` (abrir amaldiçoado, `RunState.ambush`, checar fim da emboscada, prêmio), `src/sim/zone.ts` (extrair a montagem da oferta de relíquia para reuso)
- Test: `tests/sim/cursed.test.ts`

**Interfaces:**
- Consumes: `difficulty(phase, t)` de `src/sim/director.ts`, `EnemyPool.spawn`, `RELIC_LIST`, `RELIC_SLOTS`.
- Produces: `T.CURSED = { COUNT: 12, RADIUS: 9, HP: 2.5, DMG: 1.5, BITS_PER_PHASE: 40 }`; `RunState.ambush: { ids: number[] } | null`; `relicChoices(r: RunState, n: number): string[]` (exportada de `zone.ts`, usada pela Distorção e pelo baú; vazia se relíquias cheias ou nenhuma livre); `RunEvent` ganha `{ type: 'ambush' }` e `{ type: 'ambushCleared' }`.

- [ ] **Step 1: Testes** —
  - Encostar no amaldiçoado (sem custo) → 12 inimigos `def === 'bakemon'` a ~9 do jogador, `maxHp` = vida do Bakemon × `difficulty(...).hpMul` × 2,5; evento `ambush`; `r.ambush.ids.length === 12`.
  - Matar os 12 (zerar `hp` e rodar `stepRun`) → `ambushCleared`, `r.relicOffer` com 3 ids, `bits` += `40 × fase`, `r.ambush === null`.
  - Com 3 relíquias já tidas → sem `relicOffer`, cai um pickup `{ kind: 'card' }` de carta rara elegível (se não houver nenhuma, `heal`).
  - Matar 11 e o 12º ainda vivo → nada.
  - **Review Focus 2:** abrir o amaldiçoado, entrar na Zona Digital (`enterZone`) e rodar passos dentro dela com o pool vazio → nenhum `ambushCleared`; sair da zona → emboscada continua com os ids vivos.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar. Checagem só quando `!r.zone`; vivo = `r.pool.get(id)` existe. Spawn com `{ hp: d.hpMul * T.CURSED.HP, dmg: d.dmgMul * T.CURSED.DMG }`, `flags` normais e o limite normal de `MAX_ENEMIES`; se `spawn` devolver null, o id não entra na lista (com 0 ids, prêmio imediato não sai: `ambush = null` e evento `ambush` não é emitido).
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** Commit `feat(baus): baú amaldiçoado com emboscada e relíquia`.

### Task 7: Cristais no fim da partida

**Files:**
- Create: `src/core/crystals.ts`
- Modify: `src/data/tuning.ts` (`T.CRYSTALS`), `src/sim/run.ts` (`finish`, `RunState.crystalsEarned`)
- Test: `tests/core/crystals.test.ts`, `tests/sim/run.test.ts`

**Interfaces:**
- Consumes: `medalFor`, `MedalId` de `src/core/medals.ts`.
- Produces: `T.CRYSTALS = { PER_PHASE: 20, KILLS_PER: 200, BOSS: 15, GUARDIAN: 10, WIN: 20, MEDAL: { silver: 40, gold: 70, champion: 100 } }`; `crystalsFor(o: { phase: number; kills: number; bosses: number; guardians: number; won: boolean; medal: MedalId | null }): number`; `RunState.crystalsEarned: number`.

- [ ] **Step 1: Testes** — `crystalsFor({ phase: 2, kills: 4000, bosses: 1, guardians: 1, won: false, medal: null })` = 40 + 20 + 15 + 10 = 85; vitória fase 5, 15000 abates, 5 chefes, 5 guardiões, ouro = 100 + 75 + 75 + 50 + 70 = 370; vitória sem medalha soma 20. Em `run`: `finish` soma em `save.currency` e grava; **Review Focus 5**: derrota dentro da Zona Digital e vitória com `relicOffer` pendente somam exatamente uma vez (chamar `stepRun` mais vezes depois do fim não muda `currency`).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar (fase = `T.PHASES` na vitória, senão `r.phase.phase`; medalha = a de `pr.bestTime` atual na vitória).
- [ ] **Step 4:** `npx vitest run` → PASS.
- [ ] **Step 5:** Commit `feat(lab): Cristais ao fim da partida`.

### Task 8: Telas e mapa

**Files:**
- Create: `src/ui/lab.ts`
- Modify: `src/ui/title.ts` (cartão Laboratório com saldo 💠; vizinhos das setas), `src/main.ts` (nav `lab`), `src/ui/results.ts` (linha "Cristais +N 💠 (total T)"), `src/ui/hud.ts` (Bits, se não feito na Task 4), `src/ui/toast.ts` uso em `main.ts` para `chestLocked` ("Faltam N Bits") e `ambush` ("Emboscada!"), `src/render/map.ts` (preço flutuante sobre baú pago fechado — sprite de canvas, atualiza quando `chestPrice(chestsBought)` muda; amaldiçoado escuro com brilho roxo e "Grátis…?"; grátis como hoje), `src/ui/style.css`
- Test: `tests/ui/lab.test.ts`, `tests/ui/title.test.ts`, `tests/ui/results.test.ts`

**Interfaces:**
- Consumes: `LAB_LIST`, `labLevel`, `nextLabCost`, `buyLab` (Tasks 1–2), `storeSave`, `RunState.bits/chestsBought/crystalsEarned`, `chestPrice`.
- Produces: `showLab(root: HTMLElement, save: SaveData, back: () => void): Modal`; `TitleNav.lab(): void`.

- [ ] **Step 1: Testes (happy-dom)** — `showLab` com 120 Cristais: 4 linhas na ordem do `LAB_LIST`, cada uma com nome, barrinhas `n/máx` e preço; "Comprar" de Atualizar habilitado, de Quarta opção desabilitado; clicar Comprar → saldo mostra 20, barrinha 1/3, save gravado no storage; ↑↓ move o foco, Enter compra, Esc chama `back`. `showTitle` tem cartão "Laboratório" com o saldo; `showResults` mostra "Cristais +85 💠" para `crystalsEarned = 85`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implementar no layout B2 (copiar a estrutura de `src/ui/records.ts`).
- [ ] **Step 4:** `npx vitest run && npx tsc --noEmit && npm run build` → PASS. Conferir no Chrome (`?debug`): cartão e tela do Laboratório (compra e saldo), HUD com Bits, preço flutuando e subindo após comprar, aviso "Faltam N Bits", Digiovo com Veemon (forçar via debug se preciso), emboscada do amaldiçoado e oferta de relíquia, "Cristais +N" no resultado; largura de celular no Laboratório; 60 fps.
- [ ] **Step 5:** Commit `feat(lab): tela do Laboratório, HUD de Bits e baús no mapa`.
