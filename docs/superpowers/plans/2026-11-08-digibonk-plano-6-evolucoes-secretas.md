# Evoluções secretas e Digi Data — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Esconder as evoluções até o jogador descobri-las (evolução automática ou escolha às cegas) e adicionar Digi Data,
um coletável que revela um requisito por dado na tela de resultado.

**Architecture:** Um módulo puro novo, `src/sim/discovery.ts`, concentra as regras: id de aresta, chaves de requisito,
quais evoluções são conhecidas ou secretas, dica sem vazamento e sorteio de Digi Data. O estado fica em dois campos novos
do `SaveData`. `run.ts` passa a disparar a evolução automática e a escolha às cegas e a coletar Digi Data. A interface
(HUD, tela de evolução, resultado, seleção de parceiro, painel de debug) passa a consultar só o que é visível.

**Tech Stack:** TypeScript, Vite, Three.js, Vitest (happy-dom nos testes de UI).

**Spec:** `docs/superpowers/specs/2026-11-08-digibonk-evolucoes-secretas-design.md`

## Global Constraints

- Lógica de jogo em `src/sim/` (pura e testável) e interface em `src/ui/`.
- Não editar seeds nem migrations do banco. Esta mecânica não precisa de dados novos no banco.
- Todo texto visível ao jogador é em português.
- Testes em Vitest, no estilo dos já existentes em `tests/`.
- Um commit por tarefa, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Não fazer push.
- `npm test` e `npx tsc --noEmit` passam ao fim de cada tarefa.
- Anti-meta do spec: nenhuma tela pode vazar o destino de uma aresta secreta, nem um requisito ainda não revelado. Isso
  inclui retrato, silhueta, nome, cor, número de opções e status.
- **Testes existentes que quebrarem só porque as evoluções agora começam secretas** devem ser corrigidos assim: chamar
  `discoverAll(save)` (Task 2) no save do teste. Não se afrouxa a asserção.

## Review Focus

1. **Requisito oculto já cumprido não pode mudar o HUD.** O "???" continua lá. Teste na Task 2.
2. **Aresta conhecida e aresta secreta disponíveis no mesmo tick:** a secreta evolui sozinha, sem modal. Teste na Task 3.
3. **Sair no meio da partida mantém o que foi descoberto e revelado.** O save é gravado na hora. Teste na Task 3 e na
   Task 4, usando `loadSave(storage)` sem passar por `finish`.
4. **Save antigo sem os campos novos, ou com lixo neles, carrega com tudo secreto.** Teste na Task 1.
5. **Nada para revelar:** nenhum Digi Data surge, e coletar um dado quando o sorteio vem vazio não quebra nem gera linha
   no resultado. Teste na Task 4.

---

### Task 1: Campos novos do save

**Files:**
- Modify: `src/core/save.ts`
- Test: `tests/core/save.test.ts`

**Interfaces:**
- Produces:
  - `SaveData.discoveredEvos: string[]`, com ids de aresta no formato `"<from>-><to>"`.
  - `SaveData.revealedReqs: Record<string, string[]>`, indexado pelo id da aresta, com a lista de chaves de requisito.
  - `defaultSave()` devolve `[]` e `{}` nesses campos.

- [ ] **Step 1: Testes que falham**
  - `defaultSave` tem `discoveredEvos: []` e `revealedReqs: {}`.
  - Um save gravado com `discoveredEvos: ['agumon->greymon', 3]` carrega como `['agumon->greymon']`. Itens que não são
    texto são descartados, como `strArr` faz com o array inteiro. Escolha: filtrar só os itens inválidos, mantendo os
    válidos.
  - `revealedReqs: { 'agumon->greymon': ['level', 7], x: 'lixo' }` carrega como `{ 'agumon->greymon': ['level'] }`.
  - Um JSON antigo sem esses campos carrega com `[]` e `{}`.
- [ ] **Step 2:** `npx vitest run tests/core/save.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** Implementar os campos e a validação em `loadSave`.
- [ ] **Step 4:** Rodar os testes. Esperado: PASS, e `npm test` inteiro verde.
- [ ] **Step 5:** Commit `feat(save): campos de evoluções descobertas e requisitos revelados`.

### Task 2: Módulo de descoberta (regras puras)

**Files:**
- Create: `src/sim/discovery.ts`
- Modify: `tests/helpers.ts`, para adicionar `discoverAll`
- Test: `tests/sim/discovery.test.ts`

**Interfaces:**
- Consumes:
  - `SaveData` (Task 1).
  - `availableEvolutions`, `EvoMissing`, `EvoHint` e `EvoContext` de `src/sim/evolution.ts`.
  - `FORMS`.
- Produces (todos exportados de `src/sim/discovery.ts`):
  - **Tipos:**
    - `type ReqKey = 'level' | 'kills' | 'nearDeaths' | 'phase' | \`stat:${StatKey}\` | \`item:${string}\``
    - `interface Reveal { edge: string; key: ReqKey }`
  - **Arestas e chaves:**
    - `edgeId(from: string, to: string): string` devolve `` `${from}->${to}` ``.
    - `findEdge(id: string): { from: string; index: number; total: number; edge: EvoEdge } | undefined`. `index` é
      a posição em `FORMS[from].evolutions`, começando em 0, e `total` é o tamanho dessa lista.
    - `reqKeys(req: EvoReq): ReqKey[]`. Uma chave por condição, nesta ordem: `level`; cada `stat:*` na ordem de
      `minStats`; cada `item:*`; `kills`; `nearDeaths`; `phase`. Só entram as condições definidas, e `unlocked` nunca
      entra.
  - **Estado no save:**
    - `isDiscovered(save, edge: string): boolean`
    - `discover(save, edge: string): void`. Idempotente.
    - `revealedKeys(save, edge: string): ReqKey[]`
    - `reveal(save, r: Reveal): void`. Idempotente.
  - **Evoluções disponíveis:**
    - `knownAvailable(p: PlayerProg, ctx: EvoContext): string[]` são as formas de `availableEvolutions` cuja aresta
      está descoberta.
    - `secretAvailable(p: PlayerProg, ctx: EvoContext): string[]` é o resto.
  - **Dica sem vazamento:** `visibleHint(p: PlayerProg, ctx: EvoContext): VisibleHint`, com
    `type VisibleHint = EvoHint | { kind: 'secret'; from: string; missing: EvoMissing[]; hidden: boolean }`.
  - **Sorteio de Digi Data:** `drawPool(save): Reveal[]`. Percorre as arestas de todas as `FORMS` e devolve um item por
    chave de `reqKeys` que satisfaz três condições:
    - a aresta não foi descoberta;
    - todo `req.unlocked` dela está em `save.unlocked`;
    - a chave ainda não foi revelada.
  - **Teste:** `discoverAll(save: SaveData): SaveData` em `tests/helpers.ts`. Marca todas as arestas de todas as
    `FORMS` e devolve o próprio save.

**Regra de `visibleHint`** (spec, "Decisões complementares"):

1. A forma sem evoluções devolve `{ kind: 'final' }`.
2. Ficam de fora as arestas cujo `req.unlocked` não está satisfeito, como já faz `nextEvolutionHint`.
3. Se alguma aresta descoberta sobrou, usar o ranking de `nextEvolutionHint` só entre elas: menos `missing` vence e o
   empate fica com a primeira. Devolver `{ kind: 'next', to, missing }`.
4. Senão, olhar as arestas secretas com pelo menos uma chave revelada. Para cada uma:
   - `missing` contém só as chaves reveladas e ainda não cumpridas, no mesmo formato de `EvoMissing`, com `have` para
     `nearDeaths`;
   - `hidden` é `reqKeys(req).length > revealedKeys.length`, esteja o requisito oculto cumprido ou não.
   - Vence quem tem menos `missing`, e o empate fica com a primeira. Devolver `{ kind: 'secret', from: p.formId, missing,
     hidden }`. O destino nunca entra no objeto.
5. Se não houver nenhuma, devolver `{ kind: 'none' }`.

- [ ] **Step 1: Testes que falham** em `tests/sim/discovery.test.ts`:
  - `reqKeys` da aresta `greymon->skullgreymon` é `['level', 'stat:atk', 'nearDeaths']`.
  - `reqKeys` da aresta `exveemon->paildramon` não contém nada de `unlocked`.
  - `findEdge('greymon->skullgreymon')` devolve `{ from: 'greymon', index: 1, total: 2 }`. A ordem real no gerado já
    foi conferida: MetalGreymon é 0 e SkullGreymon é 1.
  - Com `defaultSave`, e Agumon no Nv 9 com Atq suficiente:
    - `knownAvailable` é `[]`;
    - `secretAvailable` é `['greymon']`;
    - `visibleHint` é `{ kind: 'none' }`.
  - Depois de `discover(save, 'agumon->greymon')`, `knownAvailable` vira `['greymon']`.
  - Greymon com `reveal({ edge: 'greymon->skullgreymon', key: 'stat:atk' })`, Nv 20 e Atq 40 (já cumprido), com 0
    quase-mortes:
    - a dica é `{ kind: 'secret', from: 'greymon', missing: [], hidden: true }`;
    - com 5 quase-mortes, a dica é **igual**, porque o requisito oculto cumprido não muda nada (Review Focus 1).
  - A mesma Greymon com `metalgreymon` descoberta devolve `kind: 'next'`, com `to: 'metalgreymon'`.
  - `drawPool(defaultSave())`:
    - não contém chaves de arestas que exigem `wormmon` enquanto ele não está em `unlocked`;
    - perde a chave revelada depois de `reveal`;
    - fica sem nenhuma chave de uma aresta depois de `discover` dela.
  - `drawPool(discoverAll(defaultSave()))` é `[]`.
- [ ] **Step 2:** `npx vitest run tests/sim/discovery.test.ts`. Esperado: FAIL, porque o módulo ainda não existe.
- [ ] **Step 3:** Implementar `src/sim/discovery.ts` e `discoverAll`.
- [ ] **Step 4:** Rodar os testes. Esperado: PASS, e `npm test` verde.
- [ ] **Step 5:** Commit `feat(sim): regras de evoluções secretas`.

### Task 3: Evolução automática e escolha às cegas na partida

**Files:**
- Modify: `src/sim/run.ts`, `src/sim/debug.ts`
- Test: `tests/sim/run.test.ts`, `tests/sim/debug.test.ts`

**Interfaces:**
- Consumes: tudo da Task 2.
- Produces:
  - **Estado:** `RunState.blindChoice: string[] | null`, começando em `null`. São ids de forma.
  - **Evento novo:** `RunEvent` ganha `{ type: 'formDiscovered'; formId: string }`.
  - **`chooseBlind(r: RunState, index: number): string | null`.** Evolui para `r.blindChoice[index]`, zera
    `blindChoice` e devolve o id da forma. Índice inválido devolve `null` e não faz nada.
  - **`doEvolve(r, formId)`:** além do que já faz, chama `discover(r.save, edgeId(formAnterior, formId))` antes de
    `persist`. O id da forma anterior é lido antes de evoluir.
  - **`debugEvolve`:** se existir aresta da forma atual para `formId`, marca essa aresta como descoberta e chama
    `storeSave`. `save.discovered` continua sem mudança, então o teste atual da linha 16 se mantém.
  - **Novas funções de debug** em `src/sim/debug.ts`, ambas gravando no storage:
    - `debugRevealAll(save: SaveData, storage?: Storage | null): void` descobre todas as arestas.
    - `debugForgetAll(save: SaveData, storage?: Storage | null): void` zera `discoveredEvos` e `revealedReqs`.

**Comportamento em `stepRun`:**
- A guarda do topo também retorna quando `r.blindChoice !== null`.
- O bloco "evolution + level-up" vem antes de montar as ofertas de level-up. Nele:
  - `secret = secretAvailable(...)`.
  - **1 secreta:** chamar `doEvolve(r, secret[0])` e emitir `formDiscovered`.
  - **2 ou mais:** fazer `r.blindChoice = secret`.
  - Em qualquer um desses casos, sair do bloco e deixar o level-up para o próximo tick.
  - Só então rodar o `EvoNotifier`, que passa a receber `knownAvailable` no lugar de `availableEvolutions`.

- [ ] **Step 1: Testes que falham** em `tests/sim/run.test.ts`. Use storage falso e `loadSave(storage)` para conferir o
  que foi gravado.
  - **Agumon, save vazio, Nv 9 e Atq suficiente:**
    - um `stepRun` deixa a forma em `greymon`;
    - emite `formDiscovered` com `greymon`;
    - `loadSave(storage).discoveredEvos` contém `agumon->greymon` sem chamar `finish`, o que cobre Review Focus 3.
  - **Veemon com Spd, Def e Atq que liberam `exveemon` e `veedramon`, save vazio:**
    - depois do `stepRun`, `blindChoice` tem os dois e a forma continua `veemon`;
    - um `stepRun` seguinte não avança `r.time`;
    - `chooseBlind(r, 1)` evolui para o segundo, zera `blindChoice` e deixa o primeiro ainda secreto.
  - **Mesmo Veemon, com `veemon->exveemon` descoberta:** um `stepRun` evolui sozinho para `veedramon`, sem
    `blindChoice`. Cobre Review Focus 2.
  - **Mesmo Veemon, com as duas descobertas:** nada acontece sozinho. Emite `evolutionAvailable` como antes.
  - `chooseBlind` com índice fora do intervalo devolve `null`.
  - Em `tests/sim/debug.test.ts`:
    - `debugEvolve` de `agumon` para `greymon` marca a aresta;
    - `debugRevealAll` faz `drawPool` ficar vazio;
    - `debugForgetAll` deixa os dois campos vazios.
- [ ] **Step 2:** `npx vitest run tests/sim/run.test.ts tests/sim/debug.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** Implementar. Depois rodar `npm test` e corrigir os testes antigos que agora evoluem sozinhos ou não
  encontram evolução, usando `discoverAll(save)` (Global Constraints). Listar no relatório quais foram corrigidos.
- [ ] **Step 4:** `npm test` e `npx tsc --noEmit` passam.
- [ ] **Step 5:** Commit `feat(sim): evolução automática e escolha às cegas`.

### Task 4: Digi Data na partida

**Files:**
- Modify: `src/sim/loot.ts`, `src/sim/run.ts`, `src/data/tuning.ts`, `src/render/vfx.ts`
- Test: `tests/sim/run.test.ts`

**Interfaces:**
- Consumes: `drawPool`, `reveal`, `Reveal` (Task 2).
- Produces:
  - **Coletável:** `Pickup.kind` ganha `'digidata'`.
  - **Tuning:** `T.DIGIDATA_PER_PHASE_MIN = 1` e `T.DIGIDATA_PER_PHASE_MAX = 2`.
  - **Estado da partida:**
    - `RunState.dataRng: Rng` é `createRng((seed ^ 0x5eed_da7a) >>> 0)`. É um gerador separado, para não mudar a
      sequência de `r.rng`, da qual os testes com seed dependem.
    - `RunState.digiDataThisRun: Reveal[]` lista o que foi sorteado nesta partida, para o resultado.
  - **Evento novo:** `RunEvent` ganha `{ type: 'digiData' }`.

**Comportamento:**
- **Ao montar a fase (`setupPhase`):**
  - `n = min(dataRng.int(MIN, MAX), drawPool(save).length)`.
  - Colocar `n` coletáveis `digidata` em posições aleatórias, sorteadas com `dataRng`, a pelo menos 15 da origem e
    dentro de `T.MAP_HALF - 8`.
- **Ao coletar um `digidata`:**
  - emitir `digiData`;
  - calcular `pool = drawPool(save)`;
  - se não estiver vazio, sortear um item com `dataRng.pick`, fazer `reveal` e `push` em `digiDataThisRun`, e chamar
    `persist(r)`;
  - se estiver vazio, só emitir o evento.
- **Render:** cor `0x3cff8a` em `PICKUP_COLORS`.

- [ ] **Step 1: Testes que falham**
  - Com save vazio, `createRun` coloca entre 1 e 2 `digidata` em `pickups`.
  - Com `discoverAll(save)`, coloca 0. Cobre Review Focus 5.
  - Mover um `digidata` para a posição do jogador e dar `stepRun`:
    - emite `digiData`;
    - `digiDataThisRun` fica com 1 item;
    - `loadSave(storage).revealedReqs` já contém a chave, sem chamar `finish`.
  - Esvaziar o pool com `discoverAll`, depois de criar a partida, e coletar um `digidata`: emite `digiData`,
    `digiDataThisRun` continua vazio e nada quebra.
  - Os testes antigos com seed continuam passando sem mudar valores esperados.
- [ ] **Step 2:** Rodar os testes. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test` e `npx tsc --noEmit` passam.
- [ ] **Step 5:** Commit `feat(sim): Digi Data no mapa`.

### Task 5: HUD, tela de evolução, cartas "???" e avisos

**Files:**
- Create: `src/ui/evoText.ts`
- Modify:
  - `src/ui/hud.ts`
  - `src/ui/evolve.ts`
  - `src/ui/theme.css`
  - `src/main.ts`
  - `src/ui/partnerSelect.ts`, que passa a importar de `evoText`
- Test: `tests/ui/hud.test.ts`, `tests/ui/evolve.test.ts`

**Interfaces:**
- Consumes:
  - `visibleHint`, `knownAvailable`, `findEdge`, `ReqKey` (Task 2);
  - `blindChoice`, `chooseBlind`, eventos `formDiscovered` e `digiData` (Tasks 3 e 4).
- Produces (`src/ui/evoText.ts`):
  - **`reqKeyText(req: EvoReq, key: ReqKey): string`**. Formatos:
    - `level` → `Nv 20`
    - `stat:atk` → `Atq 38`, usando `STAT_SHORT`
    - `item:x` → nome do item ou da carta
    - `kills` → `1000 abates`
    - `nearDeaths` → `HP < 25%: 3×`
    - `phase` → `Fase 2`
  - **`pathLabel(edge: string): string`**:
    - devolve `Caminho Greymon ②` quando `total > 1`, usando `①②③④⑤` pelo `index`;
    - devolve `Caminho Agumon` quando `total === 1`.
- Produces (`src/ui/evolve.ts`):
  - `canEvolve(run)` passa a usar `knownAvailable`.
  - `showEvolve` passa a listar só `knownAvailable`.
  - Nova `showBlindEvolve(root: HTMLElement, run: RunState, onDone: (formId: string) => void): Modal`.

**Comportamento:**
- **HUD:**
  - `ready` vem de `knownAvailable`, e a dica vem de `visibleHint`.
  - Para `kind: 'secret'`:
    - o nome é `` `${FORMS[from].name} → ???` ``;
    - não há retrato (`evoPort` escondido);
    - o texto é `evoMissingText(missing)`, seguido de ` · ???` quando `hidden`. Se `missing` estiver vazio, só `???`.
- **`showBlindEvolve`:**
  - título `Digievolução!`, com o rótulo `Algo está despertando… escolha um caminho`;
  - uma carta `.evo-card.evo-mystery` por opção, mostrando só um `?` grande e a tecla 1/2/3;
  - nenhum retrato, canvas, nome, selo ou status;
  - setas selecionam, Enter confirma e 1/2/3 escolhem e confirmam;
  - `cancel` e `pause` são ignorados;
  - ao confirmar, chama `chooseBlind` e depois `onDone(formId)`.
- **`main.ts`:**
  - no loop, `if (run.blindChoice) { showBlindEvolve(...); return; }` vem antes de `offers`;
  - `onDone` faz `toast(\`Nova forma liberada! ${FORMS[id].name}\`, 'rare')`;
  - `announce` trata `formDiscovered` com o mesmo aviso, e `digiData` com `toast('Digi Data coletado')`.
- **CSS de `.evo-mystery`:** carta no mesmo tamanho de `.evo-card`, com o `?` centralizado em
  `calc(96 * var(--u))`, usando as cores do tema.

- [ ] **Step 1: Testes que falham**
  - `reqKeyText` cobre os 6 formatos.
  - `pathLabel('greymon->skullgreymon')` e `pathLabel('agumon->greymon')`.
  - **HUD:**
    - com save vazio e Agumon pronta para Greymon (antes de qualquer `stepRun`), o painel não contém `Greymon` e não
      tem `canvas` no retrato da evolução;
    - no Greymon com `stat:atk` revelado, o painel mostra `Greymon → ???` e `???`, e não mostra `SkullGreymon`.
  - **`showEvolve`** com save vazio não lista Greymon. Os testes atuais de `evolve.test.ts` passam a usar
    `discoverAll`.
  - **`showBlindEvolve`** com `blindChoice = ['exveemon', 'veedramon']`:
    - `textContent` não contém `ExVeemon` nem `Veedramon`;
    - não há `canvas`;
    - `cancel` não fecha;
    - `opt2` evolui para `veedramon` e chama `onDone('veedramon')`.
- [ ] **Step 2:** Rodar os testes. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test` e `npx tsc --noEmit` passam.
- [ ] **Step 5:** Commit `feat(ui): evoluções secretas no HUD e escolha às cegas`.

### Task 6: Resultado, seleção de parceiro e painel de debug

**Files:**
- Modify: `src/ui/results.ts`, `src/ui/partnerSelect.ts`, `src/ui/debugpanel.ts`, `src/main.ts`, `src/ui/theme.css`
- Test: `tests/ui/results.test.ts`, `tests/ui/partners.test.ts`, `tests/ui/debugpanel.test.ts`

**Interfaces:**
- Consumes:
  - `reqKeyText`, `pathLabel` (Task 5);
  - `digiDataThisRun` (Task 4);
  - `isDiscovered`, `revealedKeys`, `edgeId`, `findEdge` (Task 2);
  - `debugRevealAll`, `debugForgetAll` (Task 3).
- Produces:
  - **Resultado:** painel `.res-data`, com o rótulo `Digi Data` e uma linha por item de `digiDataThisRun`:
    `` `${pathLabel(edge)} — ${reqKeyText(edge.req, key)}` ``. Não aparece quando a lista está vazia.
  - **Seleção de parceiro**, ao listar `f.evolutions`:
    - aresta descoberta: mostra como hoje, `Nome · reqText`;
    - aresta secreta com chaves reveladas: mostra
      `` `→ ??? · ${chaves reveladas com reqKeyText, unidas por ' e '}` ``;
    - aresta secreta sem nada revelado: não aparece;
    - o rótulo `Evolui em` só aparece se houver alguma linha.
  - **Debug:** `DebugActions` ganha `revealAll(): void` e `forgetAll(): void`. O painel mostra os botões
    `Revelar todas as evoluções` e `Esquecer evoluções` na seção Geral. Os dois funcionam sem partida, porque usam o
    `save` do `main.ts`, e mostram um toast de confirmação.

- [ ] **Step 1: Testes que falham**
  - O resultado com `digiDataThisRun = [{ edge: 'greymon->skullgreymon', key: 'stat:atk' }]` contém
    `Caminho Greymon ② — Atq 38` e não contém `SkullGreymon`.
  - Com a lista vazia, não há `.res-data`.
  - A seleção de parceiro do Agumon:
    - com save vazio, não contém `Greymon`;
    - com `agumon->greymon` descoberta, contém `Greymon · Nv`.
  - O painel de debug tem os dois botões, e clicar neles chama as ações.
- [ ] **Step 2:** Rodar os testes. Esperado: FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test`, `npx tsc --noEmit` e `npm run build` passam.
- [ ] **Step 5:** Commit `feat(ui): Digi Data no resultado, árvore secreta e debug`.

### Task 7: Verificação no navegador

Feita pelo controlador, sem subagente. Usar `npm run dev` e `?debug`.

- [ ] **Agumon com save limpo:** usar "Esquecer evoluções". O painel começa com "—". Ao atingir os requisitos, o
  Agumon evolui sozinho e aparece o aviso "Nova forma liberada!".
- [ ] **Escolha às cegas:** com Veemon, montar status que liberam duas evoluções e ver as cartas "???".
- [ ] **Digi Data:** coletar um e ver o aviso "Digi Data coletado". No fim da partida, a seção Digi Data mostra
  "Caminho …". Na partida seguinte, o HUD mostra a pista.
- [ ] **Console:** sem erros.
