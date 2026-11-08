# DigiBonk — Plano 5: reformulação da interface

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o estilo B2 a todas as telas e ao HUD, com escolha de parceiro rica em informação, HUD completo com a barra "hackeada", level up em cartas estilo Tamers, descrições dos golpes e os registros novos no save.

**Architecture:** Dados primeiro (descrição dos golpes no banco; registros no save/RunState; dica de próxima evolução como função pura na simulação). Depois uma base visual compartilhada (`theme.css` + helpers de selo, retrato e painel em TS). Cada tela é reescrita sobre essa base como um `Modal` próprio (mesma interface `handle/close/closed` de `src/ui/modal.ts`), mantendo teclado/controle.

**Tech Stack:** TypeScript 5.9, Vite 7, Three.js 0.187 (só o fundo), DOM puro + CSS, vitest 4 (happy-dom para UI), SQLite via `node:sqlite` para os dados.

**Spec:** `docs/superpowers/specs/2026-11-08-digibonk-interface-design.md` (mockups de referência em `.superpowers/brainstorm/1050564-1794112701/content/`: `visual-style-v2.html`, `hud-v4.html`, `telas-entrada.html`, `telas-partida.html`, `levelup-cards.html` — abrir com `Read` para conferir o visual).

## Global Constraints

- Estilo B2: fundo azul-marinho (#12345a → #050b16) com grade ciano e linhas de varredura; painéis de vidro escuro (#0f2a4c → #08162b), contorno #00d9ff (~45%), cantos `16px 4px 16px 4px`, marcador tracejado ciano no canto superior direito dos painéis principais; títulos itálico 900 branco com brilho ciano; rótulos em maiúsculas pequenas ciano claro; botão principal pílula laranja (#ff6a13 → #ffae2e) com selo da tecla; laranja #ff8a1f só para destaque; ganhos "antes → depois" em verde #5dff8f.
- Cores das cartas do level up: ciano golpe novo, verde melhorar, roxo carta passiva, amarelo status.
- Barra do tempo da fase: preenchido **verde**; último minuto: timer pisca vermelho; overtime: barra cheia **vermelha** e timer "+mm:ss".
- Não muda regras, balanceamento, sprites nem o cenário 3D. Sem loja. Painel de debug fica como está.
- Navegação por teclado/controle em toda tela: setas/D-pad, `confirm`, `cancel`, `opt1..3` (ações de `src/core/input.ts`).
- Não copiar arte/molduras/logos oficiais (Tamers, Digimon, Time Stranger, PokéBonk).
- Nunca mostrar número que o jogo não registra.
- Animações em CSS; o HUD não recria DOM por frame (usar `setText`/`setW`/`classList.toggle` como hoje).
- Referência de tela: ≥ 1280×720; sem layout de celular.
- Texto do jogo em pt-BR.

## Review Focus

- **Digimon sem sprite** (28 formas dos parceiros novos, inimigos) em retratos de menu, HUD, evolução e resultado → mostra o placeholder com o nome, nunca imagem quebrada ou vazio. (Tarefa 4)
- **Nomes longos** (HerculesKabuterimon, Imperialdramon FM, "Slash: Diamond Storm") em cartas, HUD e grade → cabem (quebra ou reduz), sem estourar o painel. (Tarefas 6, 7, 8)
- **Escolher duas vezes durante o Card Slash** (apertar 1 e 2 rápido, ou clicar) → aplica só a primeira escolha. (Tarefa 8)
- **Save antigo** sem os campos novos, ou com tipos errados → carrega com zeros, nada quebra. (Tarefa 2)
- **Overtime e troca de fase**: ao começar a fase seguinte o timer volta ao normal (verde, sem "+"), e o aviso de último minuto não aparece no overtime. (Tarefa 7)

---

### Task 1: Descrição dos golpes no banco

**Files:**
- Create: `db/migrations/002_descricao_golpes.sql`, `db/seeds/005_descricoes_golpes.sql`
- Modify: `tools/db/export.ts` (mapeamento de `MOVES`), `src/data/types.ts` (`MoveDef`), `src/data/generated/gamedata.ts` (regenerado)
- Test: `tests/data/validate.test.ts`

**Interfaces:**
- Produces: `MoveDef.description: string` (pt-BR, uma frase).

- [ ] **Step 1: Teste que falha** em `tests/data/validate.test.ts`:

```ts
test('todo golpe tem descrição curta', () => {
  for (const m of Object.values(MOVES)) {
    expect.soft(m.description, m.id).toMatch(/\S/);
    expect.soft(m.description.length, m.id).toBeLessThanOrEqual(90);
  }
});
```

- [ ] **Step 2: Rodar** `npx vitest run tests/data/validate.test.ts` → FAIL (`description` undefined).
- [ ] **Step 3: Migration** `002_descricao_golpes.sql`: `ALTER TABLE moves ADD COLUMN description TEXT NOT NULL DEFAULT '';` (não editar a 001).
- [ ] **Step 4: Seed** `005_descricoes_golpes.sql`: um `UPDATE moves SET description = '...' WHERE id = '...';` para cada um dos 152 golpes (listar com `node --experimental-strip-types -e` ou lendo `gamedata.ts`). Regras da frase: pt-BR, ≤ 90 caracteres, termina com ponto, descreve o que o golpe faz **no jogo** pelo `pattern` (projétil/área/cone/aura/orbital/raio), alvo e elemento, coerente com o nome canônico; não inventa efeito que o jogo não tem (sem "paralisa", "envenena" etc.). Ex.: `baby_flame` → "Cospe uma bola de fogo no inimigo mais próximo.".
- [ ] **Step 5: Export + tipo:** `description: m.description` no objeto de `MOVES` em `export.ts`; `description: string` em `MoveDef`. `npm run db:build`.
- [ ] **Step 6: Rodar** `npx vitest run` → PASS; `npx tsc --noEmit` sem erros.
- [ ] **Step 7: Commit** `feat(dados): descrição curta de cada golpe`.

### Task 2: Registros novos (save e partida)

**Files:**
- Modify: `src/core/save.ts`, `src/sim/progression.ts`, `src/sim/evolution.ts` (`applyForm`), `src/sim/run.ts` (`RunState`, `createRun`, `finish`, laço de mortes)
- Test: `tests/core/save.test.ts`, `tests/sim/run.test.ts`

**Interfaces:**
- Produces:
  - `interface PartnerRecord { runs: number; wins: number; bestPhase: number }`
  - `SaveData.partnerRecords: Record<string, PartnerRecord>` (default `{}`), `partnerRecord(save: SaveData, id: string): PartnerRecord` (devolve zeros se não houver)
  - `PlayerProg.pathLevels: number[]` — paralelo a `path`; `pathLevels[0] = 1`; `applyForm` empilha `p.level`
  - `RunState.stats: { bosses: number; guardians: number }` (chefes de fase e guardiões derrotados nesta partida)
  - `RunState.newRecord: boolean` — true quando `finish` superou o `bestPhase` **daquele parceiro**

- [ ] **Step 1: Testes que falham:**
  - save: `loadSave` de um save sem `partnerRecords` → `{}`; com `partnerRecords: { agumon: { runs: 'x', wins: 2 } }` → `{ agumon: { runs: 0, wins: 2, bestPhase: 0 } }`; round trip preserva; `defaultSave().partnerRecords` é `{}`.
  - run: `abandonRun` numa partida de `agumon` na fase 1 → `save.partnerRecords.agumon` = `{ runs: 1, wins: 0, bestPhase: 1 }` e `newRecord === true`; uma segunda partida abandonada na fase 1 → `runs: 2` e `newRecord === false`.
  - run: depois de `doEvolve(r, 'greymon')` com `prog.level = 9` → `prog.pathLevels` = `[1, 9]`.
  - run: matar um inimigo com `miniboss: true` incrementa `stats.guardians`; matar o chefe da fase incrementa `stats.bosses` (criar o inimigo com `pool.spawn(def, x, z, { hp: 1, dmg: 0 }, { miniboss: true })` / o chefe via `phase.bossId`, zerar o HP e rodar um `stepRun` para passar pelo laço de mortes normal).
- [ ] **Step 2: Rodar** `npx vitest run tests/core/save.test.ts tests/sim/run.test.ts` → FAIL.
- [ ] **Step 3: Implementar.** `loadSave` valida cada registro campo a campo com o `num()` existente. `finish` atualiza o registro do parceiro junto com `records` (antes de `persist`). Contadores no laço de mortes de `stepRun` onde hoje se setam `killedMiniboss`/`bossDead`.
- [ ] **Step 4: Rodar** a suíte inteira → PASS.
- [ ] **Step 5: Commit** `feat(save): registros por parceiro, níveis de evolução e chefes da partida`.

### Task 3: Dica de próxima evolução

**Files:**
- Modify: `src/sim/evolution.ts`
- Test: `tests/sim/evolution.test.ts`

**Interfaces:**
- Produces:
  - `type EvoMissing = { kind: 'level'; need: number } | { kind: 'stat'; stat: StatKey; need: number } | { kind: 'item'; id: string } | { kind: 'phase'; need: number } | { kind: 'kills'; need: number }`
  - `type EvoHint = { kind: 'final' } | { kind: 'none' } | { kind: 'next'; to: string; missing: EvoMissing[] }`
  - `nextEvolutionHint(p: PlayerProg, ctx: EvoContext): EvoHint`

- [ ] **Step 1: Testes que falham:**
  - forma sem `evolutions` (`omnimon`) → `{ kind: 'final' }`.
  - `agumon` Nv 1 sem bônus → `{ kind: 'next', to: 'greymon', missing: [{ kind: 'level', need: 8 }, { kind: 'stat', stat: 'atk', need: 14 }] }`.
  - `agumon` Nv 8 com `bonus.atk = 20` → `missing: []`.
  - `veemon` Nv 8 com `bonus.spd = 10` → escolhe `exveemon` (0 faltando) em vez de `veedramon`.
  - `exveemon` Nv 22 com `fusion_stingmon` mas `wormmon` não liberado no save → o caminho para `paildramon` é ignorado (não aparece como `to`).
  - Todas as arestas impossíveis → `{ kind: 'none' }`.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar** com as mesmas checagens de `availableEvolutions` (status via `effectiveStats`). Ordem dos `missing`: level, stats (na ordem de `minStats`), items, phase, kills. Impossível = `req.unlocked` com parceiro fora de `ctx.save.unlocked`. Escolha = menor `missing.length`; empate pela ordem de `f.evolutions`.
- [ ] **Step 4: Rodar** → PASS.
- [ ] **Step 5: Commit** `feat(sim): dica da próxima evolução`.

### Task 4: Base visual (tema, selos, retratos, painéis)

**Files:**
- Create: `src/ui/theme.css`, `src/ui/theme.ts`, `src/ui/portrait.ts`
- Modify: `src/main.ts` (importar `theme.css`; `setPortraitSource(sprites)` depois de `SpriteLibrary.load()`)
- Test: `tests/ui/theme.test.ts`

**Interfaces:**
- Consumes: `SpriteLibrary.info(id)`, `SpriteLibrary.image(id)` (`src/render/sprites.ts`), `placeholderLabel(name)` (`src/render/placeholderLabel.ts`).
- Produces:
  - CSS (classes globais): `.b2-screen` (fundo com grade/varredura, ocupa a tela, `pointer-events:auto`), `.b2-panel` (vidro + cantos), `.b2-panel.tick` (marcador), `.b2-title`, `.b2-label`, `.b2-btn` (principal), `.b2-btn.secondary`, `.b2-key` (selo de tecla), `.b2-chip`, `.b2-bar` > `i` (barra), `.b2-sel` (seleção laranja), `.b2-gain` (verde). Variáveis em `:root` (`--b2-cyan`, `--b2-orange`, `--b2-green`, `--b2-bg0`, `--b2-bg1`, …).
  - `ATTR_COLORS: Record<AttributeId, string>`, `ELEM_COLORS: Record<ElementId, string>`, `ATTR_NAMES` / `ELEM_NAMES` (pt-BR: Vacina, Dados, Vírus, Livre; Fogo, Água, Planta, Gelo, Elétrico, Terra, Vento, Luz, Trevas, Aço, Neutro)
  - `chip(kind: 'attr' | 'elem', id: string): HTMLSpanElement`
  - `panel(...children): HTMLDivElement`, `btn(label: string, key: string | null, onClick: () => void, secondary = false): HTMLButtonElement`
  - `setPortraitSource(lib: SpriteLibrary | null): void`
  - `portrait(formId: string, opts?: { size?: number; silhouette?: boolean }): HTMLCanvasElement` — desenha o quadro `idle1` (ou o primeiro) da tira com `imageSmoothingEnabled = false`, centrado e escalado inteiro até `size` (padrão 64); sem sprite ou sem fonte → círculo com a cor da forma e `placeholderLabel(name)`; `silhouette` → preto com contorno ciano. Sem contexto 2D (happy-dom) → devolve o canvas vazio, sem lançar erro. Atributo `data-form` = `formId`.
- [ ] **Step 1: Carregar a skill `ui-ux-pro-max`** para um "dark tech game UI" (painéis de vidro, ciano + laranja, títulos itálicos) e decidir com ela fonte, escala tipográfica e espaçamentos. Fonte: se escolher uma fonte própria, empacotar localmente (`@fontsource/*` com versão exata, ou o `.woff2` em `public/fonts/`), nunca de CDN. Registrar as decisões num comentário no topo de `theme.css`.
- [ ] **Step 2: Testes que falham** (happy-dom): `chip('attr','vaccine')` tem texto "Vacina" e cor de fundo de `ATTR_COLORS.vaccine`; todo `AttributeId`/`ElementId` tem cor e nome; `portrait('omnimon')` sem fonte não lança erro e tem `data-form="omnimon"`; `btn('Jogar', 'Enter', fn)` contém um `.b2-key` com "Enter" e chama `fn` no clique.
- [ ] **Step 3: Rodar** → FAIL. **Step 4: Implementar.** **Step 5: Rodar** suíte + `npx tsc --noEmit` → PASS.
- [ ] **Step 6: Commit** `feat(ui): tema B2, selos e retratos`.

### Task 5: Tela inicial, Recordes e fim da tela de temporada

**Files:**
- Create: `src/ui/title.ts`, `src/ui/records.ts`
- Modify: `src/app.ts`, `src/ui/menus.ts` (remover `showTitle`, `showSeason`), `src/main.ts`
- Test: `tests/ui/title.test.ts`, `tests/app.test.ts`

**Interfaces:**
- Consumes: Task 2 (`partnerRecord`, `SaveData.records`), Task 4 (`btn`, `panel`, `portrait`, `.b2-*`), `Modal` de `src/ui/modal.ts`.
- Produces:
  - `AppScreen` = `'title' | 'partner' | 'records' | 'run' | 'results' | 'settings' | 'credits'` (sai `'season'`)
  - `app.partners(): { id: string; childForm: string; season: Season; locked: boolean }[]` — todos, ordenados por temporada (`adventure`, `adventure02`, `tamers`) e, dentro dela, pela ordem de `PARTNERS`; `app.pickPartner(id)` não depende mais de temporada. Remover `season()`, `selectSeason()`, `partnersFor()`.
  - `showTitle(root, app, save, nav: { play(): void; partners(): void; records(): void; settings(): void; credits(): void }): Modal`
  - `showRecords(root, save, back: () => void): Modal`
  - Um `setActiveModal(m: Modal)` exportado de `modal.ts` (ou equivalente) para que telas que não usam `showChoice` entrem em `activeModal()`.
- [ ] **Step 1: Testes que falham:** título tem os 5 itens (Jogar, Parceiros, Recordes, Controles, Créditos) e o cartão de progresso com "x / 11" parceiros, vitórias e partidas de `save.records`; `handle(press('confirm'))` no item inicial chama `nav.play`; `down`/`right` percorrem os itens e `opt1` = Jogar; Recordes lista só parceiros liberados com partidas/vitórias/melhor fase de `partnerRecord`, e `cancel` chama `back`; `app.partners()` devolve 11 em ordem de temporada e `pickPartner` de bloqueado devolve `false`.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** seguindo `telas-entrada.html` (logo "Digi" + "Bonk", Digimon de destaque à direita via `portrait`, botão Jogar grande, 4 blocos com ícone, cartão "Seu progresso", aviso legal no rodapé). Parceiros abre a escolha de parceiro em modo consulta (Task 6). Ajustar `main.ts` (`toTitle`, sem `showSeason`). **Step 4: Rodar** suíte → PASS.
- [ ] **Step 5: Commit** `feat(ui): tela inicial e recordes no estilo B2`.

### Task 6: Escolha de parceiro

**Files:**
- Create: `src/ui/partnerSelect.ts`
- Modify: `src/ui/menus.ts` (remover `showPartner`), `src/main.ts`
- Test: `tests/ui/partners.test.ts` (reescrever)

**Interfaces:**
- Consumes: Task 1 (`MoveDef.description`), Task 2 (`partnerRecord`), Task 4, Task 5 (`app.partners()`, `app.pickPartner`).
- Produces: `showPartnerSelect(root, app, save, opts: { mode: 'pick' | 'view'; back: () => void }): Modal`
- [ ] **Step 1: Testes que falham** (happy-dom):
  - grade mostra os 11 parceiros, nomeados pela forma Child, em ordem de temporada; bloqueados com "???" e retrato `silhouette`.
  - painel de detalhe do selecionado: estágio, temporada, selos de atributo e elemento, 5 barras de status com o número base, assinatura e kit com nome **e** `description`, requisito da 1ª evolução ("Greymon · Nv 8 e Atq 14"; com vários caminhos, uma linha por caminho), partidas/vitórias/melhor fase do `partnerRecord`; **sem** linha evolutiva.
  - bloqueado selecionado: detalhe mostra "???" e "Encontre o ovo deste Digimon nas fases"; `confirm` não chama `pickPartner`.
  - setas navegam na grade (4 colunas: `right` +1, `down` +4, com limite); `confirm` num liberado chama `pickPartner(id)`; `cancel` chama `back`.
  - `mode: 'view'`: sem o botão "Escolher parceiro!", e `confirm` não escolhe.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** seguindo `telas-entrada.html` (painel esquerdo ~58% + grade à direita, botão "Escolher parceiro! [Enter]", "◀ Voltar [Esc]"), um único cartão com todos os parceiros, sem abas. Nomes longos não estouram a célula. **Step 4: Rodar** suíte → PASS.
- [ ] **Step 5: Commit** `feat(ui): escolha de parceiro com detalhes`.

### Task 7: HUD novo

**Files:**
- Create: `src/ui/hudTimer.ts`
- Modify: `src/ui/hud.ts`, `src/ui/toast.ts`, `src/ui/style.css` (remover regras antigas do HUD)
- Test: `tests/ui/hudTimer.test.ts`, `tests/ui/hud.test.ts`

**Interfaces:**
- Consumes: Task 3 (`nextEvolutionHint`), Task 4 (`portrait`, `chip`, tema).
- Produces: `timerView(ph: PhaseState): { text: string; frac: number; mode: 'normal' | 'warning' | 'overtime'; pct: number }` — `normal`: `text = fmtTime(T.PHASE_SECONDS - t)`, `frac = t / T.PHASE_SECONDS`; `warning` quando faltam ≤ 60 s e não é overtime; `overtime`: `frac = 1`, `text = '+' + fmtTime(t - T.PHASE_SECONDS)`.
- [ ] **Step 1: Testes que falham:** `timerView` com `t = 0` → `normal`, "10:00", `frac 0`; `t = 541` → `warning`, "00:59"; `t = 540` → `normal`; `overtime: true, t = 683` → `overtime`, "+01:23", `frac 1`. HUD (happy-dom, `mountHud` + `update(run)` com uma partida de `createRun`): mostra nome, nível, selos de atributo/elemento, vida, barra da fase com classe do modo, timer, missão (os mesmos textos de hoje), 4 golpes e 3 cartas no painel de baixo; painel da direita mostra abates e, para `agumon` Nv 1, "Greymon" e "Nv 8 · Atq 14"; com evolução disponível, esse painel tem a classe de destaque e o texto "Digievoluir [E / Y]"; `omnimon` → "Forma final"; chamar `update` duas vezes não recria nós (mesma referência do elemento do timer).
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar** seguindo `hud-v4.html`: cartão do parceiro (retrato, nome, Nv, selos, vida verde, XP ciano, selos dos itens), topo central (rótulo "FASE n/5 · TEMPO DA FASE" + %, barra hackeada com dígitos correndo / borda piscando / ruído / falhas, timer com falha leve, missão), direita (abates + próxima evolução com retrato `silhouette` e o que falta), baixo centro (golpes: assinatura laranja, recarga escurecendo, nível; divisor; cartas roxas com nível), barra do chefe acima do painel de baixo, seta e toasts no novo visual sem cobrir os painéis. Remover o aviso flutuante `.evo` antigo e o toast "Digievolução disponível!" de `main.ts` (o painel o substitui). Modo `warning`: timer pisca vermelho; `overtime`: barra cheia vermelha.
- [ ] **Step 4: Rodar** suíte → PASS.
- [ ] **Step 5: Verificar no Chrome** (`npm run dev`, `?debug`): HUD em 1280×720 e em tela cheia; evoluir para HerculesKabuterimon (nome longo, sem sprite); com o debug, avançar o tempo da fase (`__run.phase.t = 545`) → pisca vermelho; `__run.phase.t = 700` → barra vermelha e "+01:40"; nenhuma regressão de fps visível.
- [ ] **Step 6: Commit** `feat(ui): HUD completo com barra da fase hackeada`.

### Task 8: Cartas Tamers (level up e carta slash/passiva cheia)

**Files:**
- Create: `src/ui/tamerCards.ts`
- Modify: `src/ui/levelup.ts`, `src/ui/cardmodal.ts`
- Test: `tests/ui/levelup.test.ts`, `tests/ui/cardmodal.test.ts`

**Interfaces:**
- Consumes: Task 1 (`description`), Task 4.
- Produces:
  - `type TamerCardKind = 'learn' | 'upgrade' | 'card' | 'stat'`
  - `interface TamerCardSpec { kind: TamerCardKind; name: string; level: string; art: { glyph?: string; formId?: string }; typeLine: string; text: string; gains?: { label: string; from: string; to: string }[]; pips?: { filled: number; next: boolean; max: number } }`
  - `export const SLASH_MS = 750`
  - `showTamerCards(root, spec: { title: string; subtitle?: string; cards: (TamerCardSpec & { onPick(): void })[]; extra?: { label: string; onPick(): void } }): Modal` — `opt1..3`/setas/`confirm`; ao escolher, a carta toca a animação de Card Slash e `onPick` roda depois de `SLASH_MS`; entradas durante a animação são ignoradas; `extra` (`cancel`) fecha sem animação.
- [ ] **Step 1: Testes que falham** (happy-dom, `vi.useFakeTimers()`):
  - level up de uma partida com `offers` forçadas (uma `learn`, uma `upgrade`, uma `card`): 3 cartas com classes `learn`/`upgrade`/`card`; a `learn` contém o nome e a `description` do golpe; a `upgrade` mostra "Nv 2 → 3" e o dano "antes → depois" calculado com `perLevel.damage`; uma `stat` usa a classe `stat`.
  - apertar `opt2` e logo `opt1`: só a oferta 2 é aplicada, e só depois de `vi.advanceTimersByTime(SLASH_MS)`.
  - carta slash com espaços cheios: 3 cartas (espaços 2–4) com o golpe atual de cada; `cancel` descarta sem animação. Passiva com 3 espaços cheios: mesma coisa com as cartas equipadas e o nível.
- [ ] **Step 2: Rodar** → FAIL.
- [ ] **Step 3: Implementar** seguindo `levelup-cards.html` (moldura por tipo, janela de arte com varredura, faixa de tipo, texto, pips de nível, tecla no rodapé, brilho holográfico, leitor + "Card Slash!"). Título "Level up! Escolha uma carta" + "Nome · Nv a → b". Textos de passiva/status reaproveitam `describeCard` e `STAT_NAMES`. Nomes longos quebram em duas linhas na barra de título da carta.
- [ ] **Step 4: Rodar** suíte → PASS.
- [ ] **Step 5: Verificar no Chrome**: subir de nível (`?debug=xp10` ou botão "+1 nível"), escolher com teclado e com clique; carta "Slash: Diamond Storm" com espaços cheios.
- [ ] **Step 6: Commit** `feat(ui): level up em cartas estilo Tamers com Card Slash`.

### Task 9: Digievolução e resultado

**Files:**
- Create: `src/ui/results.ts`
- Modify: `src/ui/evolve.ts`, `src/ui/menus.ts` (remover `showResults`), `src/main.ts`
- Test: `tests/ui/evolve.test.ts`, `tests/ui/results.test.ts`

**Interfaces:**
- Consumes: Task 2 (`pathLevels`, `stats`, `newRecord`, `partnerRecord`), Task 4, `effectiveStats`, `statAt`.
- Produces: `showEvolve(root, run, onDone)` (mesma assinatura de hoje); `showResults(root, run, onAgain, onMenu): Modal`.
- [ ] **Step 1: Testes que falham:**
  - evolução de `agumon` Nv 9 com Atq suficiente: forma atual à esquerda; cartão "Greymon" com selos, status "antes → depois" (HP/Atq/Def/Vel no nível atual, via `effectiveStats` com a forma trocada numa cópia de `prog`), "Mega Flame" e "substitui Baby Flame mantendo o nível"; `confirm` evolui; `cancel` chama `onDone(null)` sem evoluir; com 2 caminhos (Veemon), setas trocam a opção.
  - resultado de uma partida terminada: título "Derrota"/"Vitória!", fase e tempo; retratos do `path` com "Nv x" de `pathLevels` (a partir do 2º); golpes e cartas finais com nível; abates, nível, chefes (`stats.bosses`), guardiões (`stats.guardians`), melhor fase do `partnerRecord` com "Novo recorde!" só se `newRecord`; cartão "Novo parceiro liberado!" só com `unlockedThisRun` não vazio; `opt1`/`confirm` = jogar de novo, `opt2`/`cancel` = menu.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar** seguindo `telas-partida.html` (seções 2 e 3). **Step 4: Rodar** suíte → PASS.
- [ ] **Step 5: Verificar no Chrome**: evoluir Agumon → Greymon pelo modal; recusar; terminar uma partida com "Desistir" e ver o resultado.
- [ ] **Step 6: Commit** `feat(ui): digievolução e resultado com retratos`.

### Task 10: Pausa, Controles, Créditos e limpeza

**Files:**
- Modify: `src/ui/modal.ts` (`showChoice` no visual B2), `src/ui/menus.ts` (`showPause`, `showSettings`, `showCredits`), `src/ui/style.css` (remover o que ficou sem uso), `README.md`
- Test: `tests/ui/modal.test.ts`, `tests/ui/credits.test.ts`

**Interfaces:**
- Consumes: Task 4.
- [ ] **Step 1: Teste que falha:** créditos contêm "Digimon World 3", "Ragey", "Artzei", "V-pet", "Vital Bracelet", "Pendulum Color", "ChatGPT", "Gemini", "PokéBonk" e "© Akiyoshi Hongo, Toei Animation e Bandai", e **não** contêm "Sprites provisórios"; `cancel` volta.
- [ ] **Step 2: Rodar** → FAIL. **Step 3: Implementar:** `showChoice` com painel B2 (as telas que ainda o usam: pausa, controles, créditos, espera de tecla). Créditos reescritos a partir de `README.md` § "Créditos e aviso legal", incluindo as folhas geradas no ChatGPT (Greymon, MetalGreymon, WarGreymon, Omnimon, ExVeemon, Growlmon, WarGrowlmon, Gallantmon) e no Gemini; atualizar a mesma seção do README. Remover de `style.css` as regras que nenhuma tela usa mais (`.modal`, `.choice`, `.choices`, `.title-bg`, HUD antigo), conferindo com `grep` antes. **Step 4: Rodar** suíte + `npm run build` → PASS.
- [ ] **Step 5: Verificar no Chrome** o fluxo inteiro: título → Parceiros (consulta) → Recordes → Jogar → escolher → partida (HUD, level up, evolução, pausa, controles) → desistir → resultado → menu. Teclado e controle (se houver). Console sem erros.
- [ ] **Step 6: Commit** `feat(ui): pausa, controles e créditos no estilo B2`.
