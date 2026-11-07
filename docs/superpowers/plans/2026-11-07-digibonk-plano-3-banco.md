# DigiBonk — Plano: Banco de dados (SQLite + migrations) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** os dados do jogo saem de `src/data/*.ts` para um SQLite versionado por migrations, que gera os módulos que o jogo importa. Junto entram as regras novas: crescimento de 0,5% por nível, vantagem de atributo/elemento nos dois sentidos e cartas com nível.

**Architecture:**
- `db/migrations/NNN_*.sql`: esquema em SQL portátil.
- `db/seeds/NNN_*.sql`: o conteúdo.
- `tools/db/`: executor de migrations e exportador, usando `node:sqlite`.
- `src/data/generated/gamedata.ts`: gerado e commitado. Os módulos atuais (`forms.ts`, `moves.ts`…) passam a reexportar dele, mantendo nomes e caminhos.
- As regras ficam em `src/sim` (stats, combat, cards), lendo multiplicadores e taxas dos dados.

**Tech Stack:** TypeScript, Node 22 `node:sqlite` (`DatabaseSync`), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-07-digibonk-banco-de-dados-design.md`

## Global Constraints

- **SQL portátil:**
  - tipos só `TEXT`, `INTEGER`, `REAL`;
  - chaves primárias explícitas, sem `AUTOINCREMENT`;
  - `FOREIGN KEY` e `CHECK` permitidos;
  - booleanos como `INTEGER` 0/1;
  - nada de funções ou sintaxe exclusivas do SQLite nas migrations.
- **Arquivos:**
  - o `.db` é gerado em `db/digibonk.db` e fica no `.gitignore`;
  - `src/data/generated/` vai para o git.
- **Ids e nomes:** os ids atuais (`agumon`, `pepper_breath_rain`, `card_greymon_horn`…) e os nomes exportados (`FORMS`, `MOVES`, `CARDS`, `ITEMS`, `PARTNERS`, `ENEMIES`, `MINIBOSSES`, `BOSSES`) não mudam.
- **Crescimento:** `valor(nível) = base × (1 + taxa × (nível − 1))`, taxa padrão 0,005, que substitui o `growth` fixo.
- **Vantagem:** multiplicador = (vantagem de atributo) × (vantagem de elemento). Valores iniciais: ×1,5 vantagem, ×0,75 desvantagem, ×1 neutro. Vale do jogador nos inimigos e dos inimigos no jogador.
- **Cartas:**
  - nível começa em 1;
  - cópia da mesma carta na partida sobe o nível até o máximo 10;
  - bônus = `base% + porNível% × (nível − 1)`.
  - Slash repetida sobe o nível do golpe dela, até o máximo do golpe.

## Review Focus

1. **Banco do zero:** um clone novo (sem `.db`) roda `npm run db:build`, e o `npm run dev` funciona com o `generated/` commitado.
2. **Migrations re-executadas:** rodar duas vezes não reaplica nada nem falha.
3. **Exportação fiel:** o que o jogo lia antes (golpes, evoluções, requisitos, kits, inimigos, chefes, itens) sai igual, exceto pelos campos novos e pelas regras trocadas.
4. **Inimigo sem Digimon no banco:** tem que dar erro claro na exportação, não `undefined` no jogo.
5. **Carta no nível 10 pegando outra cópia:** fica em 10, sem erro e sem duplicar no slot.

---

### Task 1: Executor de migrations

**Files:**
- Create: `tools/db/db.ts`, `tools/db/migrate.ts`, `db/migrations/000_bootstrap.sql`
- Test: `tests/db/migrate.test.ts`
- Modify: `package.json` (scripts), `.gitignore`

**Interfaces — Produces:**
- `openDb(path: string | ':memory:'): DatabaseSync`
- `migrate(db: DatabaseSync, dir: string): string[]`: aplica, em ordem de nome, os `.sql` ainda não registrados em `schema_migrations(name TEXT PRIMARY KEY, applied_at TEXT)`, cada um numa transação, e devolve os nomes aplicados.
- `seed(db, dir)`: mesmo mecanismo, com a tabela `schema_seeds`.

**Steps:**
- [ ] Testes:
  - `migrate` num banco em memória com uma pasta temporária de 2 migrations aplica as 2 e devolve os nomes;
  - uma 2ª chamada devolve `[]`;
  - uma migration com SQL inválido lança erro e não registra o nome (rollback).
  - Rodar: FAIL (módulo não existe).
- [ ] Implementar com `node:sqlite` (`DatabaseSync`, `exec`, `prepare`). Rodar: PASS.
- [ ] Scripts:
  - `db:migrate` / `db:seed`;
  - `db:build`: apaga `db/digibonk.db`, roda migrate + seed + export;
  - `.gitignore` com `db/*.db`.
- [ ] Commit `feat(db): executor de migrations e seeds (node:sqlite)`.

### Task 2: Esquema (migration 001)

**Files:**
- Create: `db/migrations/001_esquema.sql`
- Test: `tests/db/schema.test.ts`

**Tabelas:**

| Tabela | Colunas |
|---|---|
| `attributes` | `id`, `name` |
| `elements` | `id`, `name` |
| `attribute_matchups` | `attacker`, `defender`, `multiplier` (PK attacker+defender) |
| `element_matchups` | idem |
| `stages` | `id`, `dmg_mul` |
| `digimon` | `id`, `name`, `stage` FK, `attribute` FK, `element` FK, `hp`, `atk`, `def`, `spd`, `brain`, `growth_rate` REAL default 0.005, `size`, `color` |
| `moves` | `id`, `name`, `element` FK, `pattern` CHECK, `damage`, `cooldown`, `range`, `radius`, `count`, `pierce`, `speed`, `duration` (nullable), `max_level`, `dmg_per_level`, `cd_per_level`, `color` |
| `forms` | `digimon_id` PK/FK, `line`, `signature` FK moves |
| `form_kit` | `form_id`, `move_id`, `ord` |
| `evolutions` | `id`, `from_form`, `to_form`, `min_level`, `min_hp`… `min_brain` (nullable), `min_phase`, `min_kills` |
| `evolution_items` | `evolution_id`, `item_id` |
| `evolution_unlocks` | `evolution_id`, `partner_id` |
| `partners` | `id`, `child_form`, `season`, `starter` INTEGER |
| `items` | `id`, `name`, `kind` CHECK, `unlock_partner` nullable |
| `item_partners` | `item_id`, `partner_id` |
| `item_requires` | `item_id`, `partner_id` |
| `cards` | `id`, `name`, `kind` CHECK, `weight`, `move_id` nullable |
| `card_bonuses` | `card_id`, `stat` CHECK (`hp`,`atk`,`def`,`spd`,`brain`,`dmg`,`pickup`,`xp`,`cooldown`), `base_pct`, `per_level_pct` |
| `card_partners` | `card_id`, `partner_id` |
| `enemies` | `digimon_id` FK, `role` CHECK (`enemy`,`miniboss`,`boss`), `hp`, `dmg`, `speed`, `xp`, `size`, `min_phase`, `boss_phase` nullable — PK `(digimon_id, role)` |
| `boss_moves` | `digimon_id`, `move_id`, `ord` |

**Steps:**
- [ ] Teste: depois de `migrate`, `sqlite_master` tem todas as tabelas acima, e um `INSERT` de `digimon` com `attribute` inexistente falha (FK ligada com `PRAGMA foreign_keys = ON` no `openDb`). Rodar: FAIL.
- [ ] Escrever `001_esquema.sql`. Rodar: PASS.
- [ ] Commit `feat(db): esquema dos dados do jogo`.

### Task 3: Seeds com o conteúdo atual + tipagem

**Files:**
- Create:
  - `tools/db/dump-current.ts`: script único que lê os módulos TS atuais e escreve os seeds; fica no repo como registro, mas não roda de novo;
  - `db/seeds/001_tipagem.sql`, `db/seeds/002_conteudo.sql`.
- Test: `tests/db/seed.test.ts`

**Decisões de conteúdo** (do construtor, editáveis no seed):
- **Elementos:** Fogo, Água, Planta, Gelo, Elétrico, Terra, Vento, Luz, Trevas, Aço, Neutro. A tabela de vantagem segue o padrão Cyber Sleuth, com os pares fracos ×0,75 e os fortes ×1,5:
  - Fogo>Planta, Fogo>Gelo;
  - Água>Fogo, Água>Terra;
  - Planta>Água, Planta>Terra;
  - Gelo>Vento, Gelo>Planta;
  - Elétrico>Água, Elétrico>Vento;
  - Terra>Elétrico, Terra>Aço;
  - Vento>Planta, Vento>Fogo;
  - Luz>Trevas, Trevas>Luz;
  - Aço>Gelo, Aço>Luz.
- **Atributos:** Vacina>Vírus>Dados>Vacina; Free neutro.
- **Atributo/elemento de cada Digimon e de cada golpe:** pelo cânone. Linha Agumon e Guilmon: Fogo; Gabumon: Gelo; Veemon: Luz/Vento; Wormmon: Planta. Os golpes herdam o elemento da linha, salvo os óbvios (garras/chifres = Neutro).
- **Status base:** os valores finais que o `form()` calcula hoje (`baseStats`); `growth_rate` 0,005.
- **Cartas passivas em %:** hp 20, atk 15, def 15, spd 10, brain 15, dmg 15, pickup 50, xp 20, cooldown −10; `per_level_pct` = 2 (dmg/stats) e 5 (pickup/xp); cooldown −1.

**Steps:**
- [ ] Teste: depois de `migrate + seed`, as contagens de `digimon`, `moves`, `forms`, `evolutions`, `cards`, `items`, `partners` e `enemies` batem com as dos módulos TS atuais. Todo `digimon` e todo `move` têm elemento; todo `digimon` tem atributo. Rodar: FAIL.
- [ ] Escrever e rodar `dump-current.ts` para gerar `002_conteudo.sql`; escrever `001_tipagem.sql` à mão. Rodar: PASS.
- [ ] Commit `feat(db): seeds com o conteúdo do jogo e a tipagem`.

### Task 4: Exportador + jogo lendo os dados gerados

**Files:**
- Create: `tools/db/export.ts`, `src/data/generated/gamedata.ts` (gerado)
- Modify:
  - `src/data/types.ts`:
    - `FormDef`: `growthRate`, `attribute`, `element`; o campo `growth` sai;
    - `MoveDef`: `element`;
    - `CardDef.passive` → `bonuses: { stat, basePct, perLevelPct }[]`;
    - `EnemyDef` e `BossDef`: `attribute`, `element`;
    - tipos `AttributeId`, `ElementId`.
  - `forms.ts`, `moves.ts`, `cards.ts`, `items.ts`, `partners.ts`, `enemies.ts`: viram reexportações de `generated/gamedata.ts`. Exporta também `ATTRIBUTE_CHART` e `ELEMENT_CHART` (`Record<atk, Record<def, number>>`).
  - `validate.ts`: checa que todo Digimon e todo golpe têm elemento.
- Test: `tests/db/export.test.ts`, `tests/data/validate.test.ts`

**Steps:**
- [ ] Teste: `exportGameData(db)` devolve, para cada forma, golpe, inimigo, chefe, item e partner, os mesmos campos de jogo de antes (comparar com um snapshot JSON tirado dos módulos atuais **antes** da troca, em `tests/db/fixtures/before.json`), mais os campos novos. Inimigo apontando para um Digimon inexistente lança erro com o id. Rodar: FAIL.
- [ ] Implementar `export.ts` (consultas + montagem dos objetos) e a escrita de `gamedata.ts`. Trocar os módulos por reexportações. Rodar: PASS. Rodar também a suíte inteira: o sim usa `growth`, então vão aparecer falhas, que se resolvem na Task 5.
- [ ] Commit `feat(db): jogo lê os dados gerados do banco`.

### Task 5: Regras novas na simulação

**Files:**
- Modify:
  - `src/sim/stats.ts`: crescimento por taxa; bônus de carta em % com nível; `typeMultiplier`;
  - `src/sim/progression.ts`: `PlayerProg.cardLevels: Record<string, number>`;
  - `src/sim/cards.ts`: cópia sobe nível;
  - `src/sim/combat.ts`: multiplicador nos dois sentidos;
  - `src/sim/director.ts`: `Enemy.attribute`, `Enemy.element`;
  - `src/ui/hud.ts`: mostra o nível da carta no slot ("Nv N").
- Test: `tests/sim/stats.test.ts`, `tests/sim/cards.test.ts`, `tests/sim/combat.test.ts`

**Interfaces — Produces:**
- `statAt(base: number, rate: number, level: number): number`
- `typeMultiplier(atkAttr, atkElem, defAttr, defElem): number`
- `cardBonusPct(card: CardDef, stat, level: number): number`
- `gainCard(p: PlayerProg, cardId): 'equipped' | 'leveled' | 'full' | 'maxed'`

**Steps:**
- [ ] Testes, todos devem falhar primeiro:
  - `statAt(5, 0.005, 10) ≈ 5.225`;
  - Agumon (Vacina, Fogo) acerta um inimigo Vírus/Planta: dano × 1,5 × 1,5;
  - inimigo Vírus acerta Agumon Vacina: dano × 0,75;
  - carta passiva atk 15%/+2%: no nível 1 o ataque efetivo é ×1,15, e no nível 3 é ×1,19;
  - pegar a mesma carta 12 vezes deixa o nível em 10, um slot só;
  - Slash repetida sobe o nível do golpe dela até `max_level`.
- [ ] Implementar. Rodar a suíte inteira; atualizar os testes antigos que dependiam do `growth` fixo ou do bônus fixo das cartas, cada um com uma linha de motivo. Rodar: PASS.
- [ ] Verificar no Chrome (`?debug`):
  - partida com Agumon;
  - dar a mesma carta 3× pelo painel e ver o nível na HUD;
  - um golpe de Fogo num inimigo Planta mostra número de dano maior.
- [ ] Commit `feat(sim): crescimento 0,5%, vantagem de atributo/elemento e cartas com nível`.

### Task 6: Documentação e fluxo

**Files:**
- Modify: `README.md` (seção "Banco de dados"), `.claude/skills/adding-digimon-sprites/SKILL.md` (só se citar `src/data` diretamente)

**Steps:**
- [ ] README: como criar uma migration, editar o seed, rodar `npm run db:build` e onde fica o gerado.
- [ ] Clone limpo (`git clone` numa pasta temporária, `npm ci`, `npm test`, `npm run build`): PASS sem o `.db`.
- [ ] Commit `docs: banco de dados no README`.
