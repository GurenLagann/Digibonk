# DigiBonk — Builds por parceiro (★/✕ e caminho de digievolução) e Digimon Analyzer

Data: 2026-11-20 · Status: APROVADA pelo usuário (desenho em conversa; escopos escolhidos nas perguntas abaixo)

## Por quê
Itens 9, 9b e 11 da análise do PokéBonk (`docs/analises/2026-11-09-pokebonk-mecanicas.md`, seções 6.1 e 6.3), os
próximos da ordem recomendada. Dão controle sobre o sorteio do level up (★/✕), um objetivo para a partida sem
facilitá-la (caminho) e uma vitrine do que já foi descoberto (Analyzer).

## Decisões do usuário (2026-11-20)
- ★/✕ valem para **golpes da linha do parceiro e cartas passivas**. Status ficam de fora.
- Limite: **até 4 ★ e 4 ✕ por parceiro** (golpes + cartas somados em cada marca).
- A build é editada **na tela Parceiros** (botão "Build"), não num cartão novo.
- Caminho de digievolução **só orienta** (decisão de 2026-11-09): painel, selo nas cartas e seleção padrão. Não mexe no sorteio.
- Analyzer nesta versão: **só as formas das linhas dos parceiros**. Inimigos, abates por espécie e "pesquisa" com recompensas ficam para depois.

## Objetivos
1. Build por parceiro guardada no save local: ★, ✕ e caminho.
2. Sorteio do level up respeita ★ (peso ×2) e ✕ (fora do sorteio).
3. Caminho escolhido orienta a partida: painel "Próx. evolução", selo "No seu plano", seleção padrão na tela de evolução.
4. Tela Digimon Analyzer com ficha de cada forma das linhas dos parceiros, sem vazar segredos.

## Não-objetivos
- ★/✕ em status, itens ou relíquias; vários planos por parceiro; compartilhar/importar build por código.
- Caminho que altera pesos do sorteio ou força evoluções.
- Inimigos/chefes no Analyzer, abates por espécie, pesquisa, cosméticos.

## Anti-objetivos
- O level up nunca pode ficar sem opções por causa do ✕ (status continuam sempre disponíveis).
- Nenhuma tela pode revelar o destino de uma aresta secreta não descoberta, nem forma não descoberta.
- Sem build, o sorteio tem de ser **idêntico ao de hoje** (mesma sequência do RNG), para não quebrar testes e sementes.

## Desenho

### Save (`src/core/save.ts`)
```ts
export interface PartnerBuild { fav: string[]; ban: string[]; path: string[] }
// SaveData.builds: Record<partnerId, PartnerBuild>
```
- Chaves de marca: `move:<moveId>` e `card:<cardId>`.
- `path`: ids de forma em ordem, começando pelo Child do parceiro (`['agumon', 'greymon', 'metalgreymon']`). Vazio ou só o Child = sem caminho.
- `loadSave`: `builds` ausente → `{}`. Para cada parceiro conhecido: descarta chaves que não sejam `move:`/`card:` de golpe/carta passiva existente, remove duplicatas, chave em ★ e ✕ fica só no ★, corta em 4 cada lista; `path` só se cada passo for uma aresta existente partindo do Child do parceiro (senão vira `[]`).
- Parceiro desconhecido é descartado. Save antigo carrega sem perda.

### Regras puras (`src/sim/build.ts`)
- `BUILD_MAX = 4` (em `T.BUILD.MAX` no tuning).
- `lineForms(partnerId)`: formas alcançáveis a partir do Child (mesma busca de `reachableForms` em `discovery.ts`).
- `lineMoves(partnerId)`: golpes dos kits dessas formas, sem repetição, com a primeira forma que o traz (`{ moveId, from }`), na ordem Child → Mega.
- `buildOf(save, partnerId)`: a build ou uma vazia.
- `cycleMark(build, key)`: nada → ★ → ✕ → nada. Se a lista de destino estiver cheia, pula para o próximo estado (★ cheio: nada → ✕; ✕ cheio: ★ → nada). Devolve se mudou.
- `offerWeight(prefs, key)`: 0 se ✕, 2 se ★ (`T.BUILD.FAV_WEIGHT`), senão 1.
- Caminho:
  - `pathChoices(save, path)`: próximos passos possíveis a partir da última forma: arestas descobertas (`{ to, secret: false }`) e secretas com pelo menos uma pista (`{ to, secret: true, hints }`). Depois de uma secreta não há mais passos.
  - `setPathStep(build, index, to)`: corta o caminho no índice e acrescenta o passo.
  - `pathTarget(path, formId, off)`: a próxima forma do caminho se a forma atual estiver nele e `off` for falso; senão `null`.

### Sorteio (`src/sim/progression.ts`)
- `rollOffers(p, rng, exclude, count, prefs?)` com `prefs?: { weight(key: string): number }`.
- Chave de golpe novo = `move:<moveId>`; de melhoria = `move:<moveId do espaço>`; de carta = `card:<id>`.
- Peso 0 sai do pool (e do sorteio de carta). Status não consultam `prefs`.
- Embaralhamento: se nenhum peso do pool for diferente de 1, usa exatamente o Fisher–Yates atual (mesmas chamadas ao RNG). Senão, ordem ponderada sem reposição (chave `u^(1/w)`, maior primeiro).
- Carta passiva: `rng.weighted(cards, c => c.weight × peso)`, com as de peso 0 filtradas antes.

### Partida (`src/sim/run.ts`)
- `RunState.build: PartnerBuild` (cópia da build do parceiro em `createRun`) e `RunState.pathOff: boolean`.
- Todas as chamadas de `rollOffers` passam `prefs` derivado de `r.build`.
- Ao evoluir (manual ou automática) para algo diferente de `pathTarget(...)`, `pathOff = true`. Amadurecer não desliga, a menos que a próxima aresta do caminho não seja de Maturidade.
- `runPathTarget(r)` = `pathTarget(r.build.path, r.prog.formId, r.pathOff)`.
- `planStats(r)`: status de `minStats` da aresta alvo que ainda faltam **e são conhecidos** (aresta descoberta, ou chave `stat:` revelada).

### Interface
- **Tela Parceiros (`partnerSelect.ts`)**: botão "Build" (ação `opt2`, tecla 2) habilitado em parceiro liberado, nos dois modos (`pick` e `view`). Abre `showBuild`; ao voltar, reabre a seleção no mesmo parceiro. O detalhe mostra "★ n · ✕ n" e o caminho resumido quando houver.
- **Editor (`src/ui/build.ts`, layout B2)**:
  - coluna Golpes (`lineMoves`, com "Kit do <forma>"; golpes de forma não descoberta aparecem como "??? · golpe de forma não descoberta" e não podem ser marcados);
  - coluna Cartas (passivas);
  - contador "★ 2/4 · ✕ 1/4";
  - painel Caminho: lista dos passos; cada passo pode ser trocado entre `pathChoices` ou limpo; secreta mostra "??? · pistas";
  - ↑↓←→ navega, confirmar alterna a marca/escolhe passo, a ação `skip` (X) limpa o caminho a partir do passo selecionado, Esc salva e volta (`storeSave`).
- **HUD (`hud.ts`)**: com alvo de caminho, o painel "Próx. evolução" usa a aresta do caminho (`visibleHint(p, ctx, prefer)` ganha `prefer?: string`: aresta descoberta → `next` dela; secreta com pistas → `secret` dela; sem pista → comportamento atual).
- **Level up (`levelup.ts` / `tamerCards.ts`)**: `TamerCardSpec.tag?: string`; carta de status cujo `stat` está em `planStats(run)` ganha a tag "No seu plano".
- **Tela de evolução (`evolve.ts`)**: seleção inicial = índice do alvo do caminho, se estiver nas opções; senão 0.
- **Analyzer (`src/ui/analyzer.ts`)**:
  - cartão "Analyzer" (🔬) na tela inicial, na coluna ao lado de Parceiros/Recordes/Laboratório; `NAV` ganha o índice novo;
  - `AppScreen` ganha `'analyzer'`;
  - topo: "Descobertas X/Y" (Y = formas das linhas de todos os parceiros);
  - esquerda: lista agrupada por parceiro (ordem de temporada); parceiro bloqueado = grupo "???" com silhuetas; forma não descoberta = silhueta + "???";
  - direita: ficha da forma selecionada. Descoberta: retrato, estágio, atributo, elemento, status base, assinatura e kit, "Vem de" e "Evolui para" com requisitos (`reqText`); arestas secretas "→ ??? · pistas" quando há pista, ocultas sem pista; "Vem de" mostra só origens descobertas. Não descoberta: silhueta e "Forma não descoberta".
- Dados do Analyzer por função pura `analyzerData(save)` em `src/sim/analyzer.ts`, que já devolve tudo filtrado (a UI não decide o que é segredo).

## Testes
- `tests/core/save.test.ts`: validação de `builds` (chaves inválidas, duplicatas, ★∩✕, limite 4, caminho inválido, parceiro desconhecido, save sem `builds`).
- `tests/sim/build.test.ts`: `lineMoves`, `cycleMark` com limites, `pathChoices` (descoberta, secreta com/sem pista, nada depois de secreta), `pathTarget`.
- `tests/sim/progression.test.ts`: sem `prefs` a sequência é idêntica à atual (mesma semente → mesmas ofertas); ✕ nunca aparece (golpe novo, melhoria, carta) em muitas sementes; ★ aparece com frequência maior; status sempre preenchem.
- `tests/sim/run.test.ts`: `pathOff` ao sair do caminho; `planStats` só com requisitos conhecidos.
- `tests/sim/analyzer.test.ts`: contagem, bloqueio por parceiro, nada de nome/destino de forma ou aresta não descoberta no resultado.
- `tests/ui/build.test.ts`, `tests/ui/analyzer.test.ts` (happy-dom), ajustes em `partners.test.ts`, `hud.test.ts`, `levelup.test.ts`, `evolve.test.ts`, `title`/`app`.
