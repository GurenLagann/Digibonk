# Recordes locais Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recordes com melhor tempo de vitória, medalhas por tempo e comparação/ordenação de parceiros.

**Architecture:** O save local (localStorage, `src/core/save.ts`) ganha `bestTime`/`bestKills` por parceiro e `bestTime` geral;
`finish()` em `src/sim/run.ts` grava usando `r.time` (já só avança com a simulação rodando: pausa e modais param o relógio).
Medalha é derivada do tempo por uma função pura em `src/core/medals.ts`. Telas `records.ts` e `results.ts` mostram.

**Tech Stack:** TypeScript, Vitest (+ happy-dom nas telas), DOM via helper `h()` de `src/ui/dom.ts`.

**Spec:** `docs/superpowers/specs/2026-11-15-digibonk-recordes-design.md`

## Global Constraints

- Cortes das medalhas em `T.MEDALS` (`src/data/tuning.ts`): `{ silver: 2100, gold: 1500, champion: 1080 }` segundos (35:00, 25:00, 18:00); bronze = qualquer vitória.
- Comparação é estrita: tempo `< corte` ganha a medalha (2100 exato = bronze).
- Medalhas exibidas como emoji: bronze 🥉, prata 🥈, ouro 🥇, campeão 🏆. Sem medalha: "—".
- Tempo formatado `mm:ss`, ou `h:mm:ss` a partir de 1 hora. Sem vitória: "—".
- Save antigo carrega sem perder nada; textos em pt-BR.

## Review Focus

- Save antigo sem `bestTime`/`bestKills` (ou com lixo como `"abc"`, negativo) → carrega com `bestTime` ausente e `bestKills` 0. (Task 1)
- Derrota nunca grava `bestTime` nem medalha, mas grava `bestKills`. (Task 1)
- Vitória mais lenta que a anterior não troca `bestTime` nem marca recorde/medalha nova. (Task 1)
- Ordenar por tempo com parceiros sem vitória: eles ficam no fim, na ordem de temporada. (Task 2)
- Tela de resultado numa derrota não mostra linha de tempo-recorde nem medalha. (Task 3)

---

### Task 1: Medalhas + save + gravação no fim da partida

**Files:**
- Create: `src/core/medals.ts`
- Modify: `src/data/tuning.ts` (adicionar `MEDALS`), `src/core/save.ts` (`PartnerRecord`, `records`, `loadSave`), `src/sim/run.ts` (`RunState`, `finish()`, estado inicial)
- Test: `tests/core/medals.test.ts` (novo), `tests/core/save.test.ts`, `tests/sim/run.test.ts`

**Interfaces:**
- Produces:
  - `type Medal = 'bronze' | 'silver' | 'gold' | 'champion'`
  - `medalFor(seconds: number | undefined): Medal | null`
  - `MEDAL_ORDER: Medal[]` = `['bronze','silver','gold','champion']`; `MEDAL_ICON: Record<Medal,string>`; `MEDAL_NAME: Record<Medal,string>` = Bronze/Prata/Ouro/Campeão
  - `fmtClock(seconds: number | undefined): string` (formato da Global Constraints; `undefined` → "—")
  - `PartnerRecord { runs; wins; bestPhase; bestTime?: number; bestKills: number }`
  - `SaveData.records { bestPhase; wins; runs; bestTime?: number }`
  - `RunState.newTimeRecord: boolean`, `RunState.medalEarned: Medal | null` (medalha nova só se subiu em relação à anterior do parceiro)

- [ ] **Step 1: Testes que falham**

`tests/core/medals.test.ts`:
```ts
test('medal by victory time', () => {
  expect(medalFor(undefined)).toBeNull();
  expect(medalFor(3000)).toBe('bronze');
  expect(medalFor(2100)).toBe('bronze');
  expect(medalFor(2099)).toBe('silver');
  expect(medalFor(1499)).toBe('gold');
  expect(medalFor(1079)).toBe('champion');
});
test('fmtClock', () => {
  expect(fmtClock(undefined)).toBe('—');
  expect(fmtClock(65)).toBe('01:05');
  expect(fmtClock(3725)).toBe('1:02:05');
});
```
`tests/core/save.test.ts`: save antigo `{ partnerRecords: { agumon: { runs: 2, wins: 1, bestPhase: 5 } } }` → `{ runs: 2, wins: 1, bestPhase: 5, bestKills: 0 }` e `bestTime` indefinido; `bestTime: 'abc'` e `bestTime: -5` → indefinido; `records.bestTime: 1800` preservado.
`tests/sim/run.test.ts` (seguir o padrão do teste existente 'clearing phase 5 is victory and records it'):
- vitória com `r.time = 1400` → `partnerRecords.agumon.bestTime === 1400`, `records.bestTime === 1400`, `newTimeRecord === true`, `medalEarned === 'gold'`;
- segunda vitória com `r.time = 1600` → `bestTime` continua 1400, `newTimeRecord === false`, `medalEarned === null`;
- derrota com `prog.kills = 300` → `bestKills === 300`, `bestTime` indefinido, `medalEarned === null`.
Atualizar as asserções `toEqual({ runs, wins, bestPhase })` existentes (linhas ~118) para incluir `bestKills`.

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run tests/core tests/sim/run.test.ts` → FAIL (módulo/campos inexistentes).

- [ ] **Step 3: Implementar** — `medals.ts` usa `T.MEDALS`; `loadSave` aceita `bestTime` só se número finito > 0; `defaultSave`/`partnerRecord()` com `bestKills: 0`; em `finish()`: tempo = `r.time`, guardar medalha anterior do parceiro antes de atualizar, `bestKills = max(…, r.prog.kills)` em qualquer resultado.

- [ ] **Step 4: Rodar** — `npx vitest run && npx tsc --noEmit -p .` → tudo PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat(recordes): melhor tempo, abates e medalhas no save"`

---

### Task 2: Tela Recordes (totais, medalhas, ordenação)

**Files:**
- Modify: `src/ui/records.ts`, CSS das classes `rec-*` (onde já estão: `grep -rn "rec-row" src/ui`)
- Test: `tests/ui/records.test.ts` (novo, happy-dom como `tests/ui/results.test.ts`)

**Interfaces:**
- Consumes: `medalFor`, `MEDAL_ORDER`, `MEDAL_ICON`, `fmtClock`, `PartnerRecord` (Task 1)
- Produces: `export type RecordSort = 'time' | 'wins' | 'kills'`; `export function sortPartners(ids: string[], save: SaveData, by: RecordSort): string[]` (pura)

- [ ] **Step 1: Testes que falham**
- `sortPartners`: por `'time'` crescente, sem vitória no fim mantendo a ordem de entrada; `'wins'` e `'kills'` decrescentes, empate mantém a ordem de entrada.
- Tela: totais mostram `Mais rápido` = `fmtClock(records.bestTime)` e a contagem de medalhas (ex.: save com agumon 1400s e veemon 2500s → texto contém "🥇 1" e "🥉 1"); cada `.rec-row[data-partner]` mostra medalha, melhor tempo, vitórias, partidas, abates.
- Ordenação: começa em Tempo; tecla de direção (ação de input `right`/`left` usada pelos outros menus — conferir em `src/ui/partnerSelect.ts`) e clique nos botões trocam a ordem; a ordem das `.rec-row` muda.

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run tests/ui/records.test.ts` → FAIL.

- [ ] **Step 3: Implementar** — topo: Vitórias, Partidas, Mais rápido, Parceiros, linha de medalhas `🥉 n · 🥈 n · 🥇 n · 🏆 n`; barra "ordenar:" com 3 botões (ativo destacado); re-render só da lista ao trocar. Layout responsivo seguindo as classes B2 existentes.

- [ ] **Step 4: Rodar** — `npx vitest run && npx tsc --noEmit -p .` → PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat(recordes): tela com tempo, medalhas e ordenação por parceiro"`

---

### Task 3: Resultado da partida — tempo recorde e medalha

**Files:**
- Modify: `src/ui/results.ts` (painel `res-nums`)
- Test: `tests/ui/results.test.ts`

**Interfaces:**
- Consumes: `RunState.newTimeRecord`, `RunState.medalEarned`, `MEDAL_ICON`, `MEDAL_NAME`, `fmtClock`, `partnerRecord(save, id).bestTime`

- [ ] **Step 1: Testes que falham**
- Vitória com `newTimeRecord = true`, `medalEarned = 'gold'` → contém "Novo recorde de tempo!" e "🥇 Ouro".
- Vitória sem recorde → linha "Melhor tempo" com `fmtClock(bestTime)`, sem "Novo recorde de tempo!".
- Derrota → não contém "Melhor tempo" nem emoji de medalha.

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run tests/ui/results.test.ts` → FAIL.

- [ ] **Step 3: Implementar** — em vitória, `num('Melhor tempo', fmtClock(bestTime), newTimeRecord ? span.res-rec 'Novo recorde de tempo!' : null)`; se `medalEarned`, linha "Medalha: {ícone} {nome}".

- [ ] **Step 4: Rodar** — `npx vitest run && npx tsc --noEmit -p . && npm run build` → PASS.

- [ ] **Step 5: Conferir no Chrome** — `?debug=1`, vencer forçando (`__run` fase 5 + matar chefe ou o atalho de debug existente), ver resultado e tela Recordes em largura de celular e em ~2500px.

- [ ] **Step 6: Commit** — `git commit -m "feat(recordes): tempo recorde e medalha no resultado"`
