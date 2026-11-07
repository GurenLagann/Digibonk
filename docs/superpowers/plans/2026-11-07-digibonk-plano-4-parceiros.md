# DigiBonk — Plano: os 8 parceiros desbloqueáveis — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** completar o elenco v1. Os 8 parceiros desbloqueáveis por ovo, cada um com a linha até o Mega:
- Gabumon e Wormmon já existem como Child, mas sem evolução;
- os outros 6 são novos: Patamon, Tentomon, Salamon/Gatomon, Armadillomon, Terriermon e Renamon.

**Architecture:** quase tudo é **dado**, em seeds novos do banco: Digimon, golpes, formas, kits, evoluções, parceiros, ovos e tipagem. O código só muda onde precisar aceitar mais parceiros por temporada. Os sprites estão **em avaliação** (decisão do usuário), então as formas novas usam o placeholder colorido que o render já tem.

**Tech Stack:** SQLite (seeds), `npm run db:build`, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-07-digibonk-design.md` §5 (elenco e linhas), §8 (ovos); `docs/superpowers/specs/2026-11-07-digibonk-banco-de-dados-design.md` (modelo de dados).

## Global Constraints

**Linhas** (spec §5):

| Linha | Child → Adult → Perfect → Ultimate |
|---|---|
| Gabumon | Gabumon → Garurumon → WereGarurumon → MetalGarurumon |
| Patamon | Patamon → Angemon → MagnaAngemon → Seraphimon |
| Tentomon | Tentomon → Kabuterimon → MegaKabuterimon → HerculesKabuterimon |
| Salamon | Salamon → Gatomon → Angewomon → Ophanimon (o parceiro é "Gatomon", o Child é Salamon) |
| Wormmon | Wormmon → Stingmon → JewelBeemon → GranKuwagamon |
| Armadillomon | Armadillomon → Ankylomon → Shakkoumon → SlashAngemon |
| Terriermon | Terriermon → Gargomon → Rapidmon → MegaGargomon |
| Renamon | Renamon → Kyubimon → Taomon → Sakuyamon |

**Temporadas:**
- **Adventure:** Agumon (inicial), Gabumon, Patamon, Tentomon, Gatomon.
- **Adventure 02:** Veemon (inicial), Wormmon, Armadillomon.
- **Tamers:** Guilmon (inicial), Terriermon, Renamon.

**Regras de conteúdo:**
- Cada parceiro novo tem um ovo (`egg_<parceiro>`, kind `egg`, `unlock_partner`). Os ovos de Gabumon e Wormmon já existem.
- **Padrão de cada forma** (igual às linhas atuais):
  - golpe assinatura + 3 golpes de kit;
  - assinatura que evolui pela linha (como Baby Flame → Mega Flame → Giga Destroyer → Gaia Force), baseada nos golpes do anime;
  - atributo e elemento canônicos.
- **Requisitos de evolução**, no padrão das linhas atuais:
  - Adult: nível 8;
  - Perfect: nível 20;
  - Ultimate: nível 35;
  - mais um status mínimo coerente com o "estilo" da linha.

  Todo requisito precisa ser **alcançável** com o crescimento de 0,5%/nível + os pontos de atributo do level up.
- Os dados entram **só pelos seeds** (`db/seeds/003_…`, `004_…`) + `npm run db:build`. Nenhum dado é escrito à mão em `src/data`.
- Sprites: nada novo. As formas sem sprite usam o placeholder.

## Review Focus

1. **Requisito impossível:** um requisito de status que não dá para atingir no nível mínimo, mesmo pondo todos os pontos do level up naquele status. A forma nunca apareceria.
2. **Ovo invisível:** o ovo de um parceiro novo que nunca cai, porque falta o `unlock_partner` ou porque o filtro do loot o exclui.
3. **Temporada com 5 parceiros:** a escolha mostra todos e dá para selecionar o 4º e o 5º, inclusive com teclado e controle, não só com as teclas 1 a 3.
4. **Golpe sem elemento ou kit com golpe inexistente:** tem que falhar no `db:build` pelas chaves estrangeiras, não no jogo.
5. **Placeholder com nome longo** (ex.: "HerculesKabuterimon") cabendo no billboard e na HUD.

---

### Task 1: Escolha de parceiro com até 5 por temporada

**Files:**
- Modify: `src/ui/menus.ts` e/ou `src/ui/modal.ts`, conforme o que faltar
- Test: `tests/ui/partners.test.ts`

**Steps:**
- [ ] Teste (happy-dom):
  - com 5 parceiros desbloqueados numa temporada, a escolha mostra 5 opções;
  - setas/`down` + `confirm` selecionam a 5ª;
  - os bloqueados aparecem como "?" e não podem ser escolhidos.
  - Rodar: FAIL se faltar suporte.
- [ ] Ajustar só o necessário. Rodar: PASS.
- [ ] Commit `feat(ui): escolha de parceiro com mais de 3 por temporada`.

### Task 2: Linhas da temporada Adventure (seed 003)

**Files:**
- Create: `db/seeds/003_parceiros_adventure.sql`
- Regenerate: `src/data/generated/gamedata.ts`
- Test: `tests/data/partners.test.ts`

**Conteúdo:**
- Gabumon: evoluções + Garurumon, WereGarurumon, MetalGarurumon.
- Patamon, Tentomon e Salamon: linhas completas.
- Golpes, kits, tipagem e ovos `egg_patamon`, `egg_tentomon`, `egg_gatomon`.
- Parceiros `patamon`, `tentomon`, `gatomon` (child_form `salamon`).
- O MetalGarurumon da linha é o mesmo que a fusão do Omnimon já pressupõe.

**Steps:**
- [ ] Teste:
  - cada um dos 4 parceiros alcança `ultimate` (`reachableStages`);
  - `validateData()` sem erros;
  - todo requisito de status é alcançável. Para cada evolução, no `minLevel`, `statAt(base) + STAT_OFFER_AMOUNT × (minLevel − 1)` ≥ o mínimo exigido.
  - Rodar: FAIL.
- [ ] Escrever o seed e rodar `npm run db:build`. Rodar: PASS. Suíte inteira verde.
- [ ] Commit `feat(dados): linhas da temporada Adventure (Gabumon, Patamon, Tentomon, Gatomon)`.

### Task 3: Linhas da temporada 02 e Tamers (seed 004)

**Files:**
- Create: `db/seeds/004_parceiros_02_tamers.sql`
- Regenerate: `gamedata.ts`
- Test: `tests/data/partners.test.ts`

**Conteúdo:**
- Wormmon: evoluções + Stingmon, JewelBeemon, GranKuwagamon.
- Armadillomon, Terriermon e Renamon: linhas completas.
- Ovos `egg_armadillomon`, `egg_terriermon`, `egg_renamon` e os parceiros correspondentes.

**Steps:**
- [ ] Teste: as mesmas checagens da Task 2, para os 4 parceiros. Rodar: FAIL.
- [ ] Seed + `db:build`. Rodar: PASS. Suíte verde.
- [ ] Commit `feat(dados): linhas do 02 e do Tamers (Wormmon, Armadillomon, Terriermon, Renamon)`.

### Task 4: Ovos no jogo + verificação

**Files:**
- Modify: só se o teste mostrar falha (`src/sim/loot.ts`, `src/ui/menus.ts`)
- Test: `tests/sim/eggs.test.ts`

**Steps:**
- [ ] Teste: para cada um dos 8 parceiros desbloqueáveis:
  - o ovo dele está entre os `eligibleItems` enquanto ele está bloqueado e some depois de desbloqueado;
  - coletar o ovo dispara `partnerUnlocked` e grava no save.
  - Rodar: FAIL/PASS conforme o caso.
- [ ] No Chrome (`?debug`):
  - dar o ovo do Patamon pelo painel;
  - voltar ao menu e ver o Patamon liberado no Adventure;
  - jogar com ele e evoluir até o Ultimate pelo painel;
  - conferir que o placeholder e a HUD mostram os nomes longos sem quebrar.
- [ ] Commit `test(parceiros): ovos e desbloqueio dos 8 parceiros`.

### Task 5: README

- [ ] Atualizar a lista de parceiros e linhas no README.
- [ ] Commit `docs: elenco completo no README`.
