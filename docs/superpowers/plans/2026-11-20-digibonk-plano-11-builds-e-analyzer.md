# Builds por parceiro e Digimon Analyzer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ★/✕ por parceiro no sorteio do level up, caminho de digievolução que só orienta a partida, e a tela Digimon Analyzer com as formas das linhas dos parceiros.

**Architecture:** A build vive no save local (`SaveData.builds`), validada em `loadSave`. Regras puras em `src/sim/build.ts` (marcas, pesos, caminho) e `src/sim/analyzer.ts` (dados da vitrine, já sem segredos). `rollOffers` recebe um `prefs` opcional; sem ele, o RNG é consumido exatamente como hoje. A UI (`build.ts`, `analyzer.ts`, HUD, level up, evolução) só lê esses resultados.

**Tech Stack:** TypeScript, Three.js r187, Vite, vitest + happy-dom, DOM via `h()` de `src/ui/dom.ts`.

**Spec:** `docs/superpowers/specs/2026-11-20-digibonk-builds-e-analyzer-design.md`

## Global Constraints

- Até **4 ★ e 4 ✕ por parceiro** (`T.BUILD.MAX = 4`); ★ = peso **×2** (`T.BUILD.FAV_WEIGHT = 2`); ✕ = peso 0.
- Chaves de marca: `move:<moveId>` e `card:<cardId>` (só cartas `kind: 'passive'`). Status nunca são marcados nem filtrados.
- Sem build (ou build vazia), `rollOffers` tem de produzir **a mesma sequência** de hoje para a mesma semente.
- Nenhuma tela revela destino de aresta não descoberta nem forma não descoberta. Linhas de parceiros bloqueados ficam como ???.
- Caminho **só orienta**: não altera pesos, não força evolução.
- Save antigo carrega sem perder nada (`builds` ausente → `{}`).
- Banco (`db/`) não muda: builds são dados do jogador, não conteúdo.
- Rodar `npm test` e `npx tsc --noEmit` antes de cada commit. Commits em português, no estilo `feat(build): ...`, `feat(analyzer): ...`.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `src/data/tuning.ts` (modificar) | `T.BUILD` |
| `src/core/save.ts` (modificar) | `PartnerBuild`, `SaveData.builds`, validação em `loadSave` |
| `src/sim/build.ts` (criar) | linha do parceiro, marcas ★/✕, pesos, caminho |
| `src/sim/progression.ts` (modificar) | `rollOffers(..., prefs?)` |
| `src/sim/run.ts` (modificar) | `RunState.build`, `pathOff`, `runPathTarget`, `planStats`, prefs nas chamadas |
| `src/sim/discovery.ts` (modificar) | `visibleHint(p, ctx, prefer?)` |
| `src/sim/analyzer.ts` (criar) | `analyzerData(save)` |
| `src/ui/hud.ts`, `levelup.ts`, `tamerCards.ts`, `evolve.ts` (modificar) | orientação do caminho |
| `src/ui/build.ts` (criar) | editor de build |
| `src/ui/partnerSelect.ts` (modificar) | botão Build e resumo |
| `src/ui/analyzer.ts` (criar) | tela do Analyzer |
| `src/ui/title.ts`, `src/app.ts`, `src/main.ts` (modificar) | cartão e rota do Analyzer |
| `src/ui/style.css` (modificar) | estilos `bd-*` e `an-*` |
| `tools/painel/conteudo.json`, `README.md` (modificar) | documentação |

---

### Task 1: Build no save

**Files:**
- Modify: `src/data/tuning.ts`, `src/core/save.ts`
- Test: `tests/core/save.test.ts`

**Interfaces:**
- Produces: `interface PartnerBuild { fav: string[]; ban: string[]; path: string[] }`, `SaveData.builds: Record<string, PartnerBuild>`, `T.BUILD = { MAX: 4, FAV_WEIGHT: 2 }`.

- [ ] **Step 1: Write the failing tests** (acrescentar ao fim de `tests/core/save.test.ts`; reaproveitar os imports que já existem no arquivo e acrescentar os que faltarem)

```ts
import { defaultSave, loadSave, SAVE_KEY } from '../../src/core/save';
import { CARD_LIST } from '../../src/data/cards';
import { fakeStorage } from '../helpers';

describe('builds no save', () => {
  const load = (builds: unknown) => loadSave(fakeStorage({ [SAVE_KEY]: JSON.stringify({ ...defaultSave(), builds }) }));

  test('save sem builds carrega com {}', () => {
    const { builds, ...old } = defaultSave();
    expect(loadSave(fakeStorage({ [SAVE_KEY]: JSON.stringify(old) })).builds).toEqual({});
  });
  test('mantém marcas válidas e caminho válido', () => {
    const s = load({ agumon: { fav: ['move:sharp_claws', 'card:card_hyper_speed'], ban: ['move:tail_whip'], path: ['agumon', 'greymon', 'metalgreymon'] } });
    expect(s.builds.agumon).toEqual({ fav: ['move:sharp_claws', 'card:card_hyper_speed'], ban: ['move:tail_whip'], path: ['agumon', 'greymon', 'metalgreymon'] });
  });
  test('descarta chaves inválidas, duplicatas e ✕ que também é ★', () => {
    const s = load({ agumon: { fav: ['move:sharp_claws', 'move:sharp_claws', 'move:nao_existe', 'stat:atk', 7], ban: ['move:sharp_claws', 'card:nao_existe'], path: [] } });
    expect(s.builds.agumon).toEqual({ fav: ['move:sharp_claws'], ban: [], path: [] });
  });
  test('carta rara (Slash) não pode ser marcada', () => {
    const slash = CARD_LIST.find(c => c.kind !== 'passive')!;
    expect(load({ agumon: { fav: [`card:${slash.id}`], ban: [], path: [] } }).builds.agumon.fav).toEqual([]);
  });
  test('corta em 4 ★ e 4 ✕', () => {
    const moves = ['sharp_claws', 'spitfire_blast', 'pepper_breath_rain', 'horn_strike', 'tail_whip'].map(m => `move:${m}`);
    const s = load({ agumon: { fav: moves, ban: [], path: [] } });
    expect(s.builds.agumon.fav).toHaveLength(4);
  });
  test('caminho que não sai do Child do parceiro ou pula aresta vira []', () => {
    expect(load({ agumon: { fav: [], ban: [], path: ['greymon', 'metalgreymon'] } }).builds.agumon.path).toEqual([]);
    expect(load({ agumon: { fav: [], ban: [], path: ['agumon', 'metalgreymon'] } }).builds.agumon.path).toEqual([]);
  });
  test('parceiro desconhecido é descartado', () => {
    expect(load({ naoexiste: { fav: [], ban: [], path: [] } }).builds).toEqual({});
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/core/save.test.ts`
Expected: FAIL (`builds` undefined).

- [ ] **Step 3: Implement**

Em `src/data/tuning.ts`, dentro de `T` (perto de `LEVEL_TOOLS`):

```ts
  /** builds por parceiro: limite de ★ e de ✕, e peso do ★ no sorteio do level up */
  BUILD: { MAX: 4, FAV_WEIGHT: 2 },
```

Em `src/core/save.ts`:

```ts
import { CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';

/** build de um parceiro: marcas `move:<id>`/`card:<id>` e caminho de formas a partir do Child */
export interface PartnerBuild { fav: string[]; ban: string[]; path: string[] }
```

Acrescentar `builds: Record<string, PartnerBuild>;` em `SaveData`, `builds: {}` em `defaultSave()`, e as funções:

```ts
/** marca válida: golpe existente ou carta passiva existente */
export function isBuildKey(k: unknown): k is string {
  if (typeof k !== 'string') return false;
  if (k.startsWith('move:')) return Object.hasOwn(MOVES, k.slice(5));
  if (k.startsWith('card:')) { const c = Object.hasOwn(CARDS, k.slice(5)) ? CARDS[k.slice(5)] : undefined; return c?.kind === 'passive'; }
  return false;
}
const marks = (v: unknown, skip: ReadonlySet<string>) => {
  const out: string[] = [];
  for (const k of Array.isArray(v) ? v : []) if (isBuildKey(k) && !skip.has(k) && !out.includes(k) && out.length < T.BUILD.MAX) out.push(k);
  return out;
};
/** caminho válido: começa no Child do parceiro e cada passo é uma aresta existente */
function loadPath(v: unknown, child: string): string[] {
  const p = strArr(v);
  if (!p || p.length === 0 || p[0] !== child) return [];
  for (let i = 1; i < p.length; i++) if (!FORMS[p[i - 1]]?.evolutions.some(e => e.to === p[i])) return [];
  return p.length > 1 ? p : [];
}
function loadBuilds(v: unknown): Record<string, PartnerBuild> {
  const out: Record<string, PartnerBuild> = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [id, b] of Object.entries(v as object)) {
    const partner = PARTNERS.find(p => p.id === id);
    if (!partner || !b || typeof b !== 'object') continue;
    const r = b as Record<string, unknown>;
    const fav = marks(r.fav, new Set());
    out[id] = { fav, ban: marks(r.ban, new Set(fav)), path: loadPath(r.path, partner.childForm) };
  }
  return out;
}
```

No `return` de `loadSave`, acrescentar `builds: loadBuilds(r.builds),`.

Se `npx tsc --noEmit` acusar ciclo de import (`data/*` não importa `core/save`, então não deve), mova `isBuildKey`/`loadBuilds` para `src/core/buildSave.ts` e importe de lá.

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/core/save.test.ts && npx tsc --noEmit`
Expected: PASS. Corrija outros testes que comparam `defaultSave()` com objeto literal, acrescentando `builds: {}`.

- [ ] **Step 5: Commit**

```bash
git add src/data/tuning.ts src/core/save.ts tests/core/save.test.ts
git commit -m "feat(build): builds por parceiro no save (★/✕ e caminho validados)"
```

---

### Task 2: Regras de ★/✕ (`src/sim/build.ts`)

**Files:**
- Create: `src/sim/build.ts`
- Test: `tests/sim/build.test.ts`

**Interfaces:**
- Consumes: `PartnerBuild`, `T.BUILD`.
- Produces:
  - `lineForms(partnerId: string): string[]` (Child primeiro, busca em largura)
  - `lineMoves(partnerId: string): { moveId: string; from: string }[]` (assinatura + kit de cada forma, sem repetir, ordem de `lineForms`)
  - `buildOf(save: SaveData, partnerId: string): PartnerBuild` (cria e guarda uma vazia se não houver)
  - `markOf(b: PartnerBuild, key: string): 'fav' | 'ban' | null`
  - `cycleMark(b: PartnerBuild, key: string): boolean`
  - `interface OfferPrefs { weight(key: string): number }`
  - `buildPrefs(b: PartnerBuild): OfferPrefs`

- [ ] **Step 1: Write the failing tests**

```ts
import { defaultSave } from '../../src/core/save';
import { buildOf, buildPrefs, cycleMark, lineForms, lineMoves, markOf } from '../../src/sim/build';

test('lineForms começa no Child e inclui Greymon e MetalGreymon', () => {
  const f = lineForms('agumon');
  expect(f[0]).toBe('agumon');
  expect(f).toEqual(expect.arrayContaining(['greymon', 'metalgreymon', 'skullgreymon']));
  expect(new Set(f).size).toBe(f.length);
});
test('lineMoves traz assinatura e kit com a primeira forma de origem, sem repetir', () => {
  const m = lineMoves('agumon');
  expect(m[0]).toEqual({ moveId: 'baby_flame', from: 'agumon' });
  expect(m.find(x => x.moveId === 'spitfire_blast')!.from).toBe('agumon'); // também no kit do Greymon
  expect(m.find(x => x.moveId === 'horn_strike')!.from).toBe('greymon');
  expect(new Set(m.map(x => x.moveId)).size).toBe(m.length);
});
test('buildOf cria build vazia e a guarda no save', () => {
  const s = defaultSave();
  const b = buildOf(s, 'agumon');
  expect(b).toEqual({ fav: [], ban: [], path: [] });
  expect(s.builds.agumon).toBe(b);
});
test('cycleMark: nada → ★ → ✕ → nada', () => {
  const b = { fav: [], ban: [], path: [] };
  cycleMark(b, 'move:sharp_claws'); expect(markOf(b, 'move:sharp_claws')).toBe('fav');
  cycleMark(b, 'move:sharp_claws'); expect(markOf(b, 'move:sharp_claws')).toBe('ban');
  cycleMark(b, 'move:sharp_claws'); expect(markOf(b, 'move:sharp_claws')).toBeNull();
});
test('cycleMark respeita o limite de 4: ★ cheio pula para ✕; ✕ cheio volta para nada', () => {
  const b = { fav: ['move:a', 'move:b', 'move:c', 'move:d'], ban: [], path: [] };
  cycleMark(b, 'move:e'); expect(markOf(b, 'move:e')).toBe('ban');
  const c = { fav: ['move:e'], ban: ['move:a', 'move:b', 'move:c', 'move:d'], path: [] };
  cycleMark(c, 'move:e'); expect(markOf(c, 'move:e')).toBeNull();
  const d = { fav: ['move:a', 'move:b', 'move:c', 'move:d'], ban: ['move:w', 'move:x', 'move:y', 'move:z'], path: [] };
  expect(cycleMark(d, 'move:e')).toBe(false);
});
test('buildPrefs: ★ = 2, ✕ = 0, resto = 1', () => {
  const p = buildPrefs({ fav: ['move:a'], ban: ['card:b'], path: [] });
  expect(p.weight('move:a')).toBe(2); expect(p.weight('card:b')).toBe(0); expect(p.weight('move:c')).toBe(1);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/sim/build.test.ts` → FAIL (módulo não existe).

- [ ] **Step 3: Implement `src/sim/build.ts`**

```ts
/** Builds por parceiro: ★ (peso maior no level up), ✕ (fora do sorteio) e caminho de digievolução (só orienta). */
import type { PartnerBuild, SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';

export interface OfferPrefs { weight(key: string): number }

export function lineForms(partnerId: string): string[] {
  const child = PARTNERS.find(p => p.id === partnerId)?.childForm;
  if (!child) return [];
  const out: string[] = [], queue = [child];
  while (queue.length) {
    const id = queue.shift()!;
    if (out.includes(id) || !FORMS[id]) continue;
    out.push(id);
    for (const e of FORMS[id].evolutions) queue.push(e.to);
  }
  return out;
}

export function lineMoves(partnerId: string): { moveId: string; from: string }[] {
  const out: { moveId: string; from: string }[] = [];
  for (const f of lineForms(partnerId)) for (const m of [FORMS[f].signature, ...FORMS[f].kit])
    if (!out.some(x => x.moveId === m)) out.push({ moveId: m, from: f });
  return out;
}

export function buildOf(save: SaveData, partnerId: string): PartnerBuild {
  return (save.builds[partnerId] ??= { fav: [], ban: [], path: [] });
}

export function markOf(b: PartnerBuild, key: string): 'fav' | 'ban' | null {
  return b.fav.includes(key) ? 'fav' : b.ban.includes(key) ? 'ban' : null;
}

const drop = (xs: string[], k: string) => { const i = xs.indexOf(k); if (i >= 0) xs.splice(i, 1); };

/** nada → ★ → ✕ → nada, pulando o estado cuja lista está cheia; false se nada mudou */
export function cycleMark(b: PartnerBuild, key: string): boolean {
  const cur = markOf(b, key);
  const order: ('fav' | 'ban' | null)[] = cur === null ? ['fav', 'ban'] : cur === 'fav' ? ['ban', null] : [null];
  for (const next of order) {
    if (next === 'fav' && b.fav.length >= T.BUILD.MAX) continue;
    if (next === 'ban' && b.ban.length >= T.BUILD.MAX) continue;
    drop(b.fav, key); drop(b.ban, key);
    if (next) b[next].push(key);
    return true;
  }
  return false;
}

export function buildPrefs(b: PartnerBuild): OfferPrefs {
  return { weight: key => (b.ban.includes(key) ? 0 : b.fav.includes(key) ? T.BUILD.FAV_WEIGHT : 1) };
}
```

- [ ] **Step 4: Run tests** → `npx vitest run tests/sim/build.test.ts && npx tsc --noEmit` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/build.ts tests/sim/build.test.ts
git commit -m "feat(build): marcas ★/✕ com limite e pesos do sorteio"
```

---

### Task 3: Caminho de digievolução (`src/sim/build.ts`)

**Files:**
- Modify: `src/sim/build.ts`
- Test: `tests/sim/build.test.ts`

**Interfaces:**
- Consumes: `isDiscovered`, `revealedKeys`, `edgeId` de `src/sim/discovery.ts`; `ReqKey`.
- Produces:
  - `interface PathChoice { to: string; secret: boolean; hints: ReqKey[] }`
  - `pathChoices(save: SaveData, path: string[], partnerId: string): PathChoice[]` (passos a partir do fim do caminho; caminho vazio = a partir do Child)
  - `setPathStep(b: PartnerBuild, partnerId: string, index: number, to: string): void` (`index` = posição do passo novo, ≥ 1)
  - `clearPathFrom(b: PartnerBuild, index: number): void`
  - `pathTarget(path: string[], formId: string, off: boolean): string | null`

- [ ] **Step 1: Write the failing tests** (acrescentar)

```ts
import { discover, reveal } from '../../src/sim/discovery';
import { clearPathFrom, pathChoices, pathTarget, setPathStep } from '../../src/sim/build';

describe('caminho', () => {
  test('sem descobertas nem pistas, não há passos', () => {
    expect(pathChoices(defaultSave(), [], 'agumon')).toEqual([]);
  });
  test('aresta descoberta vira passo aberto; secreta só com pista', () => {
    const s = defaultSave();
    discover(s, 'agumon->greymon');
    expect(pathChoices(s, [], 'agumon')).toEqual([{ to: 'greymon', secret: false, hints: [] }]);
    const path = ['agumon', 'greymon'];
    expect(pathChoices(s, path, 'agumon')).toEqual([]);
    reveal(s, { edge: 'greymon->skullgreymon', key: 'level' });
    expect(pathChoices(s, path, 'agumon')).toEqual([{ to: 'skullgreymon', secret: true, hints: ['level'] }]);
  });
  test('depois de uma secreta não há mais passos', () => {
    const s = defaultSave();
    reveal(s, { edge: 'skullgreymon->blackwargreymon', key: 'level' });
    expect(pathChoices(s, ['agumon', 'greymon', 'skullgreymon'], 'agumon')).toEqual([]);
  });
  test('setPathStep corta e acrescenta; clearPathFrom limpa; caminho de 1 forma vira []', () => {
    const b = { fav: [], ban: [], path: ['agumon', 'greymon', 'metalgreymon'] };
    setPathStep(b, 'agumon', 2, 'skullgreymon'); expect(b.path).toEqual(['agumon', 'greymon', 'skullgreymon']);
    clearPathFrom(b, 2); expect(b.path).toEqual(['agumon', 'greymon']);
    clearPathFrom(b, 1); expect(b.path).toEqual([]);
    const e = { fav: [], ban: [], path: [] as string[] };
    setPathStep(e, 'agumon', 1, 'greymon'); expect(e.path).toEqual(['agumon', 'greymon']);
  });
  test('pathTarget: próxima forma enquanto no caminho e não desligado', () => {
    const p = ['agumon', 'greymon', 'metalgreymon'];
    expect(pathTarget(p, 'agumon', false)).toBe('greymon');
    expect(pathTarget(p, 'greymon', false)).toBe('metalgreymon');
    expect(pathTarget(p, 'metalgreymon', false)).toBeNull();
    expect(pathTarget(p, 'skullgreymon', false)).toBeNull();
    expect(pathTarget(p, 'agumon', true)).toBeNull();
  });
});
```

Antes de rodar, confira em `src/data/generated/gamedata.ts` que `greymon->skullgreymon` e `skullgreymon->blackwargreymon` existem; se o id for outro, ajuste o teste para os ids reais.

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** (acrescentar a `src/sim/build.ts`)

```ts
import { edgeId, isDiscovered, revealedKeys, type ReqKey } from './discovery';

export interface PathChoice { to: string; secret: boolean; hints: ReqKey[] }

const childOf = (partnerId: string) => PARTNERS.find(p => p.id === partnerId)?.childForm ?? '';

/** próximos passos: arestas descobertas e secretas com pista; depois de uma secreta, nada */
export function pathChoices(save: SaveData, path: string[], partnerId: string): PathChoice[] {
  const steps = path.length ? path : [childOf(partnerId)];
  for (let i = 1; i < steps.length; i++) if (!isDiscovered(save, edgeId(steps[i - 1], steps[i]))) return [];
  const from = steps[steps.length - 1];
  return (FORMS[from]?.evolutions ?? []).flatMap(e => {
    const id = edgeId(from, e.to);
    if (isDiscovered(save, id)) return [{ to: e.to, secret: false, hints: [] }];
    const hints = revealedKeys(save, id);
    return hints.length ? [{ to: e.to, secret: true, hints }] : [];
  });
}

export function setPathStep(b: PartnerBuild, partnerId: string, index: number, to: string): void {
  const base = b.path.length ? b.path.slice(0, index) : [childOf(partnerId)];
  b.path = [...base, to];
}

export function clearPathFrom(b: PartnerBuild, index: number): void {
  b.path = b.path.slice(0, index);
  if (b.path.length < 2) b.path = [];
}

export function pathTarget(path: string[], formId: string, off: boolean): string | null {
  if (off) return null;
  const i = path.indexOf(formId);
  return i >= 0 && i + 1 < path.length ? path[i + 1] : null;
}
```

- [ ] **Step 4: Run** → `npx vitest run tests/sim/build.test.ts && npx tsc --noEmit` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/build.ts tests/sim/build.test.ts
git commit -m "feat(build): caminho de digievolução com passos descobertos e secretos com pista"
```

---

### Task 4: Sorteio com ★/✕ (`rollOffers`)

**Files:**
- Modify: `src/sim/progression.ts` (função `rollOffers`, ~linhas 99–129)
- Test: `tests/sim/progression.test.ts`

**Interfaces:**
- Consumes: `OfferPrefs` de `src/sim/build.ts` (só tipo).
- Produces: `rollOffers(p, rng, exclude?, count?, prefs?: OfferPrefs): LevelOffer[]` e `prefKey(p: PlayerProg, o: LevelOffer): string | null` (exportada).

- [ ] **Step 1: Write the failing tests** (acrescentar)

```ts
import { buildPrefs } from '../../src/sim/build';

describe('★/✕ no sorteio', () => {
  const roll = (seed: number, prefs?: ReturnType<typeof buildPrefs>) => { const p = newPlayerProg('agumon'); const r = createRng(seed); return Array.from({ length: 50 }, () => rollOffers(p, r, new Set(), 3, prefs)); };

  test('sem prefs e com build vazia, a sequência é idêntica', () => {
    expect(roll(42, buildPrefs({ fav: [], ban: [], path: [] }))).toEqual(roll(42));
    expect(roll(42, undefined)).toEqual(roll(42));
  });
  test('✕ nunca aparece como golpe novo, melhoria ou carta', () => {
    const prefs = buildPrefs({ fav: [], ban: ['move:sharp_claws', 'move:baby_flame', 'card:card_hyper_speed'], path: [] });
    for (let seed = 1; seed <= 40; seed++) for (const offers of roll(seed, prefs)) for (const o of offers) {
      if (o.kind === 'learn') expect(o.moveId).not.toBe('sharp_claws');
      if (o.kind === 'upgrade') expect(o.slot).not.toBe(0); // slot 0 = baby_flame
      if (o.kind === 'card') expect(o.cardId).not.toBe('card_hyper_speed');
    }
  });
  test('★ aparece mais que sem marca', () => {
    const count = (prefs?: ReturnType<typeof buildPrefs>) => { let n = 0; for (let s = 1; s <= 60; s++) for (const offers of roll(s, prefs)) n += offers.filter(o => o.kind === 'learn' && o.moveId === 'pepper_breath_rain').length; return n; };
    expect(count(buildPrefs({ fav: ['move:pepper_breath_rain'], ban: [], path: [] }))).toBeGreaterThan(count());
  });
  test('com tudo do kit em ✕, status preenchem as 3 opções', () => {
    const prefs = buildPrefs({ fav: [], ban: ['move:baby_flame', 'move:sharp_claws', 'move:spitfire_blast', 'move:pepper_breath_rain'], path: [] });
    for (const offers of roll(7, prefs)) { expect(offers).toHaveLength(3); expect(offers.every(o => o.kind === 'stat' || o.kind === 'card')).toBe(true); }
  });
});
```

- [ ] **Step 2: Run** → FAIL (5º argumento ignorado; ✕ aparece).

- [ ] **Step 3: Implement**

Em `src/sim/progression.ts`:

```ts
import type { OfferPrefs } from './build';

/** chave de ★/✕ de uma oferta (status não têm) */
export function prefKey(p: PlayerProg, o: LevelOffer): string | null {
  if (o.kind === 'learn') return `move:${o.moveId}`;
  if (o.kind === 'upgrade') { const s = p.slots[o.slot]; return s ? `move:${s.moveId}` : null; }
  if (o.kind === 'card') return `card:${o.cardId}`;
  return null;
}
```

Dentro de `rollOffers` (assinatura nova `..., count: number = T.OFFERS_PER_LEVEL, prefs?: OfferPrefs)`):

1. `const w = (o: LevelOffer) => { const k = prefKey(p, o); return prefs && k ? prefs.weight(k) : 1; };`
2. No bloco da carta: `const cards = CARD_LIST.filter(c => ... && (!prefs || prefs.weight(\`card:${c.id}\`) > 0));` e `rng.weighted(cards, c => c.weight * (prefs ? prefs.weight(\`card:${c.id}\`) : 1))`.
3. Trocar `const shuffled = pool.filter(ok);` + o laço Fisher–Yates por:

```ts
  const candidates = pool.filter(o => ok(o) && w(o) > 0);
  let shuffled: LevelOffer[];
  if (candidates.every(o => w(o) === 1)) {
    shuffled = candidates;
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
  } else {
    // sorteio ponderado sem reposição (Efraimidis–Spirakis): chave u^(1/w), maior primeiro
    shuffled = candidates.map(o => ({ o, k: rng.next() ** (1 / w(o)) })).sort((a, b) => b.k - a.k).map(x => x.o);
  }
```

O resto da função (status, `fromPool`, raridade) fica igual. O ramo sem pesos consome o RNG exatamente como antes.

- [ ] **Step 4: Run** → `npx vitest run tests/sim && npx tsc --noEmit` PASS (todos os testes de `tests/sim` têm de continuar passando sem mudança).

- [ ] **Step 5: Commit**

```bash
git add src/sim/progression.ts tests/sim/progression.test.ts
git commit -m "feat(build): ★ dobra o peso e ✕ tira do sorteio do level up"
```

---

### Task 5: Build na partida (`run.ts`)

**Files:**
- Modify: `src/sim/run.ts`
- Test: `tests/sim/run.test.ts`

**Interfaces:**
- Consumes: `buildOf`, `buildPrefs`, `pathTarget` (Tasks 2–3); `rollOffers(..., prefs)` (Task 4).
- Produces: `RunState.build: PartnerBuild`, `RunState.pathOff: boolean`, `runPathTarget(r: RunState): string | null`, `planStats(r: RunState): StatKey[]`.

- [ ] **Step 1: Write the failing tests** (acrescentar a `tests/sim/run.test.ts`)

```ts
import { defaultSave } from '../../src/core/save';
import { createRun, doEvolve, planStats, rerollOffers, runPathTarget } from '../../src/sim/run';
import { discover, reveal } from '../../src/sim/discovery';
import { applyForm } from '../../src/sim/evolution';

describe('build na partida', () => {
  const mk = (path: string[]) => {
    const save = defaultSave();
    save.builds.agumon = { fav: [], ban: ['move:sharp_claws'], path };
    return createRun({ partnerId: 'agumon', seed: 1, save, storage: null });
  };
  test('a partida copia a build e o caminho mira a próxima forma', () => {
    const r = mk(['agumon', 'greymon', 'metalgreymon']);
    expect(r.build.ban).toEqual(['move:sharp_claws']);
    expect(runPathTarget(r)).toBe('greymon');
  });
  test('✕ da build vale nas ofertas da partida', () => {
    const r = mk([]);
    r.prog.pendingLevelUps = 1; r.levelTools.reroll = 99; r.offers = [];
    for (let i = 0; i < 30; i++) { rerollOffers(r); for (const o of r.offers!) if (o.kind === 'learn') expect(o.moveId).not.toBe('sharp_claws'); }
  });
  test('evoluir fora do caminho desliga a orientação', () => {
    const r = mk(['agumon', 'greymon', 'metalgreymon']);
    applyForm(r.prog, 'greymon'); expect(runPathTarget(r)).toBe('metalgreymon');
    r.prog.level = 99; r.prog.nearDeaths = 99; r.prog.bonus.atk = 999; r.prog.bonus.def = 999;
    discover(r.save, 'greymon->skullgreymon');
    doEvolve(r, 'skullgreymon');
    expect(r.pathOff).toBe(true);
    expect(runPathTarget(r)).toBeNull();
  });
  // se a aresta greymon->skullgreymon pedir fase ou item, satisfaça também (r.phase.phase / r.prog.items) antes do doEvolve
  test('planStats: só status conhecidos que faltam na aresta alvo', () => {
    const r = mk(['agumon', 'greymon']);
    expect(planStats(r)).toEqual([]); // aresta agumon->greymon não descoberta e sem pista
    reveal(r.save, { edge: 'agumon->greymon', key: 'stat:atk' });
    expect(planStats(r)).toEqual(['atk']); // Agumon tem atk 10 < 14
    discover(r.save, 'agumon->greymon');
    r.prog.bonus.atk = 10;
    expect(planStats(r)).toEqual([]); // já cumpre
  });
});
```

Confira em `rerollOffers` (run.ts ~linha 563) se ele exige `r.offers` não nulo e `levelTools.reroll > 0`; ajuste o preparo do teste ao que a função pede.

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement**

Em `src/sim/run.ts`:
- Imports: `import type { PartnerBuild } from '../core/save';`, `import { buildPrefs, pathTarget, type OfferPrefs } from './build';`, `edgeId`, `isDiscovered`, `revealedKeys` de `./discovery`, `FORMS`, `effectiveStats` se ainda não importados.
- Em `RunState`: `build: PartnerBuild; prefs: OfferPrefs; pathOff: boolean;`
- Em `createRun`, no objeto: 
  ```ts
  build: structuredClone(opts.save.builds[partner.id] ?? { fav: [], ban: [], path: [] }), pathOff: false,
  ```
  e logo depois de montar `r`: `r.prefs = buildPrefs(r.build);` (ou inclua `prefs` no literal calculando a build antes).
- Nas **4 chamadas** de `rollOffers` (linhas ~452, ~469, ~566, ~577, e a de `banOffer` ~589), acrescentar `r.prefs` como 5º argumento.
- Em `doEvolve`, antes de `evolve(...)` (qualquer evolução que não seja o próximo passo do caminho desliga a orientação):
  ```ts
  if (!r.pathOff && r.build.path.length && runPathTarget(r) !== formId) r.pathOff = true;
  ```
- Em `stayMature`, depois de `mature(r.prog)`:
  ```ts
  const t = runPathTarget(r);
  if (t && !FORMS[r.prog.formId].evolutions.find(e => e.to === t)?.req.requiresMaturity) r.pathOff = true;
  ```
- Funções novas:
  ```ts
  /** próxima forma do caminho da build, enquanto a partida segue nele */
  export function runPathTarget(r: RunState): string | null { return pathTarget(r.build.path, r.prog.formId, r.pathOff); }

  /** status que faltam para a aresta do caminho e que o jogador conhece (aresta descoberta ou pista revelada) */
  export function planStats(r: RunState): StatKey[] {
    const to = runPathTarget(r); if (!to) return [];
    const from = r.prog.formId, edge = FORMS[from].evolutions.find(e => e.to === to); if (!edge) return [];
    const id = edgeId(from, to), known = isDiscovered(r.save, id), rev = revealedKeys(r.save, id);
    const s = effectiveStats(r.prog);
    return (Object.entries(edge.req.minStats ?? {}) as [StatKey, number][])
      .filter(([k, v]) => (known || rev.includes(`stat:${k}`)) && s[k] < v).map(([k]) => k);
  }
  ```

- [ ] **Step 4: Run** → `npm test && npx tsc --noEmit` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/run.ts tests/sim/run.test.ts
git commit -m "feat(build): partida usa ★/✕ da build e acompanha o caminho"
```

---

### Task 6: Orientação na partida (HUD, level up, tela de evolução)

**Files:**
- Modify: `src/sim/discovery.ts` (`visibleHint`), `src/ui/hud.ts` (~linha 163), `src/ui/tamerCards.ts`, `src/ui/levelup.ts` (`offerCard`), `src/ui/evolve.ts` (`select(0)` no fim de `showEvolve`), `src/ui/style.css`
- Test: `tests/sim/discovery.test.ts`, `tests/ui/levelup.test.ts`, `tests/ui/evolve.test.ts`

**Interfaces:**
- Consumes: `runPathTarget`, `planStats` (Task 5).
- Produces: `visibleHint(p, ctx, prefer?: string | null)`; `TamerCardSpec.tag?: string`.

- [ ] **Step 1: Write the failing tests**

`tests/sim/discovery.test.ts`:

```ts
test('visibleHint com prefer mira a aresta preferida, descoberta ou secreta com pista', () => {
  const s = defaultSave();
  discover(s, 'greymon->metalgreymon'); discover(s, 'greymon->skullgreymon');
  const p = progAt('greymon', 1);
  expect(visibleHint(p, { save: s, phase: 1 }, 'skullgreymon')).toMatchObject({ kind: 'next', to: 'skullgreymon' });
  const s2 = defaultSave(); discover(s2, 'greymon->metalgreymon'); reveal(s2, { edge: 'greymon->skullgreymon', key: 'level' });
  expect(visibleHint(p, { save: s2, phase: 1 }, 'skullgreymon')).toMatchObject({ kind: 'secret', from: 'greymon' });
  const s3 = defaultSave(); discover(s3, 'greymon->metalgreymon');
  expect(visibleHint(p, { save: s3, phase: 1 }, 'skullgreymon')).toMatchObject({ kind: 'next', to: 'metalgreymon' }); // sem pista: comportamento atual
});
```

`tests/ui/levelup.test.ts` (acrescentar; `discover` vem de `../../src/sim/discovery`):

```ts
test('carta de status que cobre o caminho ganha "No seu plano"', () => {
  const save = defaultSave();
  discover(save, 'agumon->greymon');
  save.builds.agumon = { fav: [], ban: [], path: ['agumon', 'greymon'] };
  const r = createRun({ partnerId: 'agumon', seed: 1, save, storage: null });
  r.prog.pendingLevelUps = 1;
  r.offers = [
    { kind: 'stat', stat: 'atk', amount: 3, rarity: 'common' },
    { kind: 'stat', stat: 'def', amount: 3, rarity: 'common' },
    { kind: 'stat', stat: 'spd', amount: 3, rarity: 'common' },
  ];
  const root = document.createElement('div');
  showLevelUp(root, r);
  const tags = [...root.querySelectorAll('.tc-tag')].map(e => e.textContent);
  expect(tags).toEqual(['No seu plano']); // Agumon atk 10 < 14 pedido pelo Greymon
});
```

`tests/ui/evolve.test.ts` (acrescentar; `applyForm` vem de `../../src/sim/evolution`):

```ts
test('a evolução do caminho já vem selecionada', () => {
  const save = discoverAll(defaultSave());
  save.builds.agumon = { fav: [], ban: [], path: ['agumon', 'greymon', 'skullgreymon'] };
  const r = createRun({ partnerId: 'agumon', seed: 1, save, storage: null });
  applyForm(r.prog, 'greymon');
  r.prog.level = 99; r.prog.bonus.atk = 999; r.prog.bonus.def = 999; r.prog.nearDeaths = 99;
  const root = document.createElement('div');
  showEvolve(root, r, () => {});
  expect(root.querySelector('.evo-tab.b2-sel')!.textContent).toContain(FORMS.skullgreymon.name);
});
```

Se uma das duas arestas do Greymon pedir fase ou item, satisfaça antes de abrir a tela (`r.phase.phase = 5`, `r.prog.items.push(...)`), conferindo os requisitos em `src/data/generated/gamedata.ts`.

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement**

`src/sim/discovery.ts`, em `visibleHint`, nova assinatura `visibleHint(p, ctx, prefer: string | null = null)` e, logo depois de calcular `edges`:

```ts
  const pref = prefer ? edges.find(e => e.to === prefer) : undefined;
  if (pref) {
    const id = edgeId(p.formId, pref.to);
    if (isDiscovered(ctx.save, id))
      return { kind: 'next', to: pref.to, missing: reqKeys(pref.req).map(k => missingOf(p, s, ctx, pref.req, k)).filter((m): m is EvoMissing => !!m) };
    const rev = revealedKeys(ctx.save, id);
    if (rev.length) return { kind: 'secret', from: p.formId, missing: rev.map(k => missingOf(p, s, ctx, pref.req, k)).filter((m): m is EvoMissing => !!m), hidden: reqKeys(pref.req).some(k => !rev.includes(k)) };
  }
```

`src/ui/hud.ts`: `const hint = visibleHint(p, ctx, runPathTarget(run));` (importar `runPathTarget` de `../sim/run`). Também ordenar `avail` para o alvo vir primeiro quando estiver pronto: `const t = runPathTarget(run); const avail = knownAvailable(p, ctx).sort((a, b) => (b === t ? 1 : 0) - (a === t ? 1 : 0));`.

`src/ui/tamerCards.ts`: em `TamerCardSpec`, `/** selo extra, ex.: "No seu plano" */ tag?: string;` e, ao lado do selo de raridade: `c.tag ? h('span', { class: 'tc-tag' }, c.tag) : null,`.

`src/ui/levelup.ts`, em `offerCard`:

```ts
function offerCard(run: RunState, o: LevelOffer): TamerCardSpec {
  const spec = offerCardBase(run, o);
  const withRarity = o.rarity ? { ...spec, rarity: { id: o.rarity, label: RARITY_NAMES[o.rarity] } } : spec;
  return o.kind === 'stat' && planStats(run).includes(o.stat) ? { ...withRarity, tag: 'No seu plano' } : withRarity;
}
```

`src/ui/evolve.ts`, trocar `select(0);` por:

```ts
  const target = runPathTarget(run);
  select(Math.max(0, forms.indexOf(target ?? '')));
```

`src/ui/style.css` (perto de `.tc-rar`):

```css
.tc-tag { position: absolute; top: 6px; left: 6px; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; background: #2fbf71; color: #04130a; }
```

- [ ] **Step 4: Run** → `npm test && npx tsc --noEmit` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/discovery.ts src/ui/hud.ts src/ui/tamerCards.ts src/ui/levelup.ts src/ui/evolve.ts src/ui/style.css tests/
git commit -m "feat(build): caminho orienta o painel de evolução, o level up e a escolha de evolução"
```

---

### Task 7: Editor de build e botão na tela Parceiros

**Files:**
- Create: `src/ui/build.ts`
- Modify: `src/ui/partnerSelect.ts`, `src/main.ts` (só se a reabertura precisar), `src/ui/style.css`
- Test: `tests/ui/build.test.ts`, `tests/ui/partners.test.ts`

**Interfaces:**
- Consumes: `buildOf`, `lineMoves`, `markOf`, `cycleMark`, `pathChoices`, `setPathStep`, `clearPathFrom` (Tasks 2–3); `storeSave`.
- Produces: `showBuild(root: HTMLElement, save: SaveData, partnerId: string, back: () => void, storage?: Storage | null): Modal`; `showPartnerSelect(..., opts: { mode; back; initial?: number })`.

- [ ] **Step 1: Write the failing tests** (`tests/ui/build.test.ts`)

```ts
// @vitest-environment happy-dom
import { defaultSave, SAVE_KEY } from '../../src/core/save';
import type { Input } from '../../src/core/input';
import { CARD_LIST } from '../../src/data/cards';
import { discover } from '../../src/sim/discovery';
import { lineMoves } from '../../src/sim/build';
import { activeModal } from '../../src/ui/modal';
import { showBuild } from '../../src/ui/build';
import { fakeStorage } from '../helpers';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);
function setup(save = defaultSave()) {
  const storage = fakeStorage({}); const root = document.createElement('div'); let back = 0;
  const m = showBuild(root, save, 'agumon', () => { back++; }, storage);
  return { root, m, save, storage, back: () => back };
}
beforeEach(() => { activeModal()?.close(); });

test('lista golpes da linha e cartas passivas; golpe de forma não descoberta fica ???', () => {
  const { root } = setup();
  const rows = [...root.querySelectorAll('[data-key]')].map(e => e.getAttribute('data-key'));
  expect(rows).toContain('move:baby_flame');
  expect(rows).toContain(`card:${CARD_LIST.find(c => c.kind === 'passive')!.id}`);
  const greyMove = lineMoves('agumon').find(m => m.from === 'greymon')!;
  const el = root.querySelector(`[data-key="move:${greyMove.moveId}"]`)!;
  expect(el.textContent).toContain('???');
  expect(el.classList.contains('locked')).toBe(true);
});
test('clicar alterna nada → ★ → ✕ e atualiza o contador', () => {
  const { root, save } = setup();
  const el = () => root.querySelector<HTMLElement>('[data-key="move:sharp_claws"]')!;
  el().click(); expect(save.builds.agumon.fav).toEqual(['move:sharp_claws']);
  expect(root.querySelector('.bd-count')!.textContent).toContain('★ 1/4');
  el().click(); expect(save.builds.agumon.ban).toEqual(['move:sharp_claws']);
});
test('caminho: escolhe passo descoberto e limpa', () => {
  const save = defaultSave(); discover(save, 'agumon->greymon');
  const { root } = setup(save);
  root.querySelector<HTMLElement>('[data-step="greymon"]')!.click();
  expect(save.builds.agumon.path).toEqual(['agumon', 'greymon']);
  root.querySelector<HTMLElement>('.bd-path-clear')!.click();
  expect(save.builds.agumon.path).toEqual([]);
});
test('Esc salva e volta', () => {
  const { m, storage, back } = setup();
  m.handle(press('cancel'));
  expect(back()).toBe(1);
  expect(JSON.parse(storage.getItem(SAVE_KEY)!).builds.agumon).toBeTruthy();
});
```

Em `tests/ui/partners.test.ts`:

```ts
test('botão Build abre o editor do parceiro liberado e fica desabilitado no bloqueado', () => {
  const { root } = setup('view', ['agumon']);
  const b = root.querySelector<HTMLButtonElement>('.ps-build')!;
  expect(b.disabled).toBe(false);
  b.click();
  expect(root.querySelector('.bd-screen')).toBeTruthy();
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement `src/ui/build.ts`**

```ts
import { storeSave, type SaveData } from '../core/save';
import { CARD_LIST, CARDS } from '../data/cards';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { PARTNERS } from '../data/partners';
import { T } from '../data/tuning';
import { buildOf, clearPathFrom, cycleMark, lineMoves, markOf, pathChoices, setPathStep } from '../sim/build';
import { reqKeyText } from './evoText';
import { h } from './dom';
import { setActiveModal, type Modal } from './modal';
import { btn } from './theme';

const MARK_ICON = { fav: '★', ban: '✕' } as const;

/** Editor de build: ★/✕ em golpes da linha e cartas passivas, e o caminho de digievolução. Esc salva e volta. */
export function showBuild(root: HTMLElement, save: SaveData, partnerId: string, back: () => void, storage?: Storage | null): Modal {
  const b = buildOf(save, partnerId);
  const child = PARTNERS.find(p => p.id === partnerId)!.childForm;
  let closed = false, sel = 0;
  const count = h('div', { class: 'b2-label bd-count' });
  const moves = h('div', { class: 'b2-panel bd-col' });
  const cards = h('div', { class: 'b2-panel bd-col' });
  const path = h('div', { class: 'b2-panel bd-path' });
  const rows: HTMLElement[] = [];

  const row = (key: string, name: string, sub: string, locked: boolean) => {
    const mark = markOf(b, key);
    const el = h('button', { type: 'button', class: 'bd-row' + (locked ? ' locked' : '') + (mark ? ` ${mark}` : ''), 'data-key': key, disabled: locked,
      onclick: () => { if (!locked && cycleMark(b, key)) render(); } },
      h('b', { class: 'bd-mark' }, mark ? MARK_ICON[mark] : '·'), h('span', { class: 'bd-name' }, name), h('span', { class: 'b2-label' }, sub));
    rows.push(el);
    return el;
  };

  function renderPath() {
    const steps = b.path.length ? b.path : [child];
    const chosen = steps.map((id, i) => {
      const secret = i > 0 && !save.discoveredEvos.includes(`${steps[i - 1]}->${id}`);
      return h('span', { class: 'bd-step' + (secret ? ' secret' : '') }, secret ? '???' : FORMS[id].name);
    });
    const next = pathChoices(save, b.path, partnerId).map(c => h('button', { type: 'button', class: 'b2-btn secondary bd-next', 'data-step': c.to,
      onclick: () => { setPathStep(b, partnerId, steps.length, c.to); render(); } },
      h('span', { class: 'b2-btn-label' }, c.secret ? `??? · ${c.hints.map(k => reqKeyText(FORMS[steps[steps.length - 1]].evolutions.find(e => e.to === c.to)!.req, k)).join(' e ')}` : FORMS[c.to].name)));
    path.replaceChildren(
      h('div', { class: 'b2-label' }, 'Caminho de digievolução · só orienta a partida'),
      h('div', { class: 'bd-steps' }, ...chosen.flatMap((c, i) => (i ? [h('span', { class: 'bd-arrow' }, '→'), c] : [c]))),
      next.length ? h('div', { class: 'bd-nexts' }, ...next) : h('div', { class: 'b2-label' }, b.path.length ? 'Fim do caminho conhecido' : 'Descubra evoluções para montar o caminho'),
      b.path.length ? h('button', { type: 'button', class: 'b2-btn secondary bd-path-clear', onclick: () => { clearPathFrom(b, 1); render(); } },
        h('span', { class: 'b2-btn-label' }, 'Limpar caminho'), h('span', { class: 'b2-key' }, 'X')) : null);
  }

  function render() {
    rows.length = 0;
    count.textContent = `★ ${b.fav.length}/${T.BUILD.MAX} · ✕ ${b.ban.length}/${T.BUILD.MAX}`;
    moves.replaceChildren(h('div', { class: 'b2-label' }, 'Golpes da linha'),
      ...lineMoves(partnerId).map(m => {
        const known = save.discovered.includes(m.from) || m.from === child;
        return known ? row(`move:${m.moveId}`, MOVES[m.moveId].name, `Kit do ${FORMS[m.from].name}`, false)
          : row(`move:${m.moveId}`, '???', 'golpe de forma não descoberta', true);
      }));
    cards.replaceChildren(h('div', { class: 'b2-label' }, 'Cartas'),
      ...CARD_LIST.filter(c => c.kind === 'passive').map(c => row(`card:${c.id}`, CARDS[c.id].name, 'Passiva', false)));
    renderPath();
    rows.forEach((r, i) => r.classList.toggle('b2-sel', i === sel));
  }

  function leave() { if (closed) return; storeSave(save, storage); m.close(); back(); }
  const screen = h('div', { class: 'b2-screen bd-screen' },
    h('div', { class: 'bd-head' }, btn('Voltar', 'Esc', () => leave(), true), h('h1', { class: 'b2-title' }, `Build · ${FORMS[child].name}`), count),
    h('div', { class: 'bd-body' }, moves, cards), path);
  root.append(screen);
  render();

  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      if (input.pressed('cancel') || input.pressed('pause')) return leave();
      if (input.pressed('up')) sel = Math.max(0, sel - 1);
      else if (input.pressed('down')) sel = Math.min(rows.length - 1, sel + 1);
      else if (input.pressed('confirm')) rows[sel]?.click();
      else if (input.pressed('skip') && b.path.length) { clearPathFrom(b, 1); }
      else return;
      render();
    },
  };
  setActiveModal(m);
  return m;
}
```

`src/ui/partnerSelect.ts`:
- `opts` ganha `initial?: number`; trocar `select(0);` por `select(opts.initial ?? 0);`.
- Criar o botão: `const buildBtn = btn('Build', '2', () => openBuild()); buildBtn.classList.add('ps-build');` e colocá-lo no `ps-foot` (criar o `ps-foot` também no modo `view`): `h('div', { class: 'ps-foot' }, buildBtn, pickBtn)`.
- Em `render()`: `buildBtn.disabled = p.locked;` e, no detalhe de parceiro liberado, um resumo: `h('div', { class: 'b2-label ps-buildsum' }, buildSummary(save, p.id))`, com
  ```ts
  function buildSummary(save: SaveData, id: string): string {
    const b = save.builds[id]; if (!b) return 'Build vazia';
    const path = b.path.length ? ` · Caminho: ${b.path.map((f, i) => (i && !save.discoveredEvos.includes(`${b.path[i - 1]}->${f}`) ? '???' : FORMS[f].name)).join(' → ')}` : '';
    return `★ ${b.fav.length} · ✕ ${b.ban.length}${path}`;
  }
  ```
- `function openBuild() { if (ps[sel].locked) return; const at = sel; m.close(); showBuild(root, save, ps[at].id, () => showPartnerSelect(root, app, save, { ...opts, initial: at })); }`
- No `handle`: `else if (input.pressed('opt2')) openBuild();`.

`src/ui/style.css`:

```css
.bd-screen { display: grid; gap: 12px; padding: 16px; grid-template-rows: auto 1fr auto; max-height: 100vh; }
.bd-head { display: flex; align-items: center; gap: 12px; }
.bd-head .bd-count { margin-left: auto; font-size: 14px; }
.bd-body { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; min-height: 0; }
.bd-col { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; }
.bd-row { display: grid; grid-template-columns: 24px 1fr auto; align-items: center; gap: 8px; padding: 6px 8px; text-align: left; background: transparent; border: 1px solid transparent; color: inherit; cursor: pointer; }
.bd-row.b2-sel, .bd-row:hover { border-color: var(--b2-accent, #3d9bff); }
.bd-row.fav .bd-mark { color: #ffd23f; }
.bd-row.ban .bd-mark { color: #ff5a5a; }
.bd-row.locked { opacity: .45; cursor: default; }
.bd-path { display: flex; flex-direction: column; gap: 8px; }
.bd-steps { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-weight: 700; }
.bd-step.secret { color: #9a7dff; }
.bd-nexts { display: flex; flex-wrap: wrap; gap: 6px; }
@media (max-width: 720px) { .bd-body { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Run** → `npm test && npx tsc --noEmit` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/build.ts src/ui/partnerSelect.ts src/ui/style.css tests/ui/build.test.ts tests/ui/partners.test.ts
git commit -m "feat(build): editor de build (★/✕ e caminho) na tela Parceiros"
```

---

### Task 8: Dados do Analyzer (`src/sim/analyzer.ts`)

**Files:**
- Create: `src/sim/analyzer.ts`
- Test: `tests/sim/analyzer.test.ts`

**Interfaces:**
- Consumes: `lineForms` (Task 2), `isDiscovered`, `revealedKeys`, `edgeId`, `ReqKey`.
- Produces:
  ```ts
  export interface AnalyzerEdge { form: string | null; req: EvoReq; hints: ReqKey[] } // form null = secreta (req só dá o texto das pistas)
  export interface AnalyzerForm { id: string; known: boolean; from: AnalyzerEdge[]; to: AnalyzerEdge[] }
  export interface AnalyzerGroup { partnerId: string; locked: boolean; forms: AnalyzerForm[] }
  export interface AnalyzerData { groups: AnalyzerGroup[]; known: number; total: number }
  export function analyzerData(save: SaveData): AnalyzerData
  ```
  Formas não conhecidas (`known: false`) têm `from: []` e `to: []`. Grupos bloqueados têm todas as formas `known: false`.

- [ ] **Step 1: Write the failing tests**

```ts
import { defaultSave } from '../../src/core/save';
import { PARTNERS } from '../../src/data/partners';
import { lineForms } from '../../src/sim/build';
import { analyzerData } from '../../src/sim/analyzer';
import { discover, reveal } from '../../src/sim/discovery';

test('um grupo por parceiro, contagem de descobertas sobre todas as formas das linhas', () => {
  const s = defaultSave(); s.discovered = ['agumon', 'greymon'];
  const d = analyzerData(s);
  expect(d.groups.map(g => g.partnerId)).toEqual(expect.arrayContaining(PARTNERS.map(p => p.id)));
  const all = new Set(PARTNERS.flatMap(p => lineForms(p.id)));
  expect(d.total).toBe(all.size);
  expect(d.known).toBe(2);
});
test('parceiro bloqueado: linha inteira desconhecida', () => {
  const s = defaultSave(); s.discovered = ['gabumon'];
  const g = analyzerData(s).groups.find(x => x.partnerId === 'gabumon')!;
  expect(g.locked).toBe(true);
  expect(g.forms.every(f => !f.known)).toBe(true);
});
test('arestas: descoberta mostra destino; secreta com pista só pistas; sem pista some', () => {
  const s = defaultSave(); s.discovered = ['agumon', 'greymon'];
  discover(s, 'agumon->greymon');
  reveal(s, { edge: 'greymon->skullgreymon', key: 'level' });
  const forms = analyzerData(s).groups.find(g => g.partnerId === 'agumon')!.forms;
  const grey = forms.find(f => f.id === 'greymon')!;
  expect(grey.from).toEqual([expect.objectContaining({ form: 'agumon' })]);
  expect(grey.to).toEqual([{ form: null, req: expect.anything(), hints: ['level'] }]); // metalgreymon sem pista some
});
test('forma não descoberta não traz arestas', () => {
  const s = defaultSave(); s.discovered = ['agumon'];
  const mg = analyzerData(s).groups.find(g => g.partnerId === 'agumon')!.forms.find(f => f.id === 'metalgreymon')!;
  expect(mg).toEqual({ id: 'metalgreymon', known: false, from: [], to: [] });
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement**

```ts
/** Digimon Analyzer: formas das linhas dos parceiros, só com o que o jogador já sabe. */
import type { SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { PARTNERS } from '../data/partners';
import type { EvoReq } from '../data/types';
import { lineForms } from './build';
import { edgeId, isDiscovered, revealedKeys, type ReqKey } from './discovery';

export interface AnalyzerEdge { form: string | null; req: EvoReq; hints: ReqKey[] }
export interface AnalyzerForm { id: string; known: boolean; from: AnalyzerEdge[]; to: AnalyzerEdge[] }
export interface AnalyzerGroup { partnerId: string; locked: boolean; forms: AnalyzerForm[] }
export interface AnalyzerData { groups: AnalyzerGroup[]; known: number; total: number }

export function analyzerData(save: SaveData): AnalyzerData {
  const all = new Set<string>();
  const groups = PARTNERS.map(p => {
    const locked = !save.unlocked.includes(p.id);
    const forms = lineForms(p.id).map(id => {
      all.add(id);
      const known = !locked && save.discovered.includes(id);
      if (!known) return { id, known: false, from: [], to: [] };
      const from = Object.values(FORMS).flatMap(f => f.evolutions.filter(e => e.to === id && isDiscovered(save, edgeId(f.id, id)))
        .map(e => ({ form: f.id, req: e.req, hints: [] as ReqKey[] })));
      const to = FORMS[id].evolutions.flatMap(e => {
        const eid = edgeId(id, e.to);
        if (isDiscovered(save, eid)) return [{ form: e.to, req: e.req, hints: [] as ReqKey[] }];
        const hints = revealedKeys(save, eid);
        return hints.length ? [{ form: null, req: e.req, hints }] : [];
      });
      return { id, known, from, to };
    });
    return { partnerId: p.id, locked, forms };
  });
  const known = [...all].filter(id => save.discovered.includes(id) && groups.some(g => !g.locked && g.forms.some(f => f.id === id && f.known))).length;
  return { groups, known, total: all.size };
}
```

O `EvoReq` de uma secreta vai junto só para a UI formatar as pistas (`reqKeyText(req, key)`); ele não contém o id do destino. A UI mostra apenas as chaves de `hints`.

- [ ] **Step 4: Run** → `npx vitest run tests/sim/analyzer.test.ts && npx tsc --noEmit` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sim/analyzer.ts tests/sim/analyzer.test.ts
git commit -m "feat(analyzer): dados das formas dos parceiros sem vazar segredos"
```

---

### Task 9: Tela do Analyzer e cartão no menu

**Files:**
- Create: `src/ui/analyzer.ts`
- Modify: `src/ui/title.ts`, `src/app.ts`, `src/main.ts`, `src/ui/style.css`
- Test: `tests/ui/analyzer.test.ts`, teste do título existente (procure `showTitle` em `tests/`)

**Interfaces:**
- Consumes: `analyzerData` (Task 8), `reqText` de `src/ui/partnerSelect.ts`, `reqKeyText` de `src/ui/evoText.ts`, `portrait`, `chip`, `STAGE_NAMES`, `STAT_NAMES`, `STAT_KEYS`.
- Produces: `showAnalyzer(root: HTMLElement, save: SaveData, back: () => void): Modal`; `TitleNav.analyzer(): void`; `AppScreen` com `'analyzer'`.

- [ ] **Step 1: Write the failing tests** (`tests/ui/analyzer.test.ts`)

```ts
// @vitest-environment happy-dom
import { defaultSave } from '../../src/core/save';
import type { Input } from '../../src/core/input';
import { FORMS } from '../../src/data/forms';
import { discover, reveal } from '../../src/sim/discovery';
import { activeModal } from '../../src/ui/modal';
import { showAnalyzer } from '../../src/ui/analyzer';

const press = (...a: string[]) => ({ pressed: (x: string) => a.includes(x) } as unknown as Input);
function setup() {
  const save = defaultSave(); save.discovered = ['agumon', 'greymon'];
  discover(save, 'agumon->greymon'); reveal(save, { edge: 'greymon->skullgreymon', key: 'level' });
  const root = document.createElement('div'); let back = 0;
  const m = showAnalyzer(root, save, () => { back++; });
  return { root, m, back: () => back };
}
beforeEach(() => { activeModal()?.close(); });

test('contador e lista com ??? para formas não descobertas', () => {
  const { root } = setup();
  expect(root.querySelector('.an-count')!.textContent).toMatch(/Descobertas 2\/\d+/);
  expect(root.querySelector('[data-form="metalgreymon"]')!.textContent).toContain('???');
  expect(root.textContent).not.toContain(FORMS.metalgreymon.name);
  expect(root.textContent).not.toContain(FORMS.skullgreymon.name);
});
test('ficha da forma descoberta: nome, kit, vem de, evolui para ??? com pista', () => {
  const { root } = setup();
  root.querySelector<HTMLElement>('[data-form="greymon"]')!.click();
  const card = root.querySelector('.an-card')!.textContent!;
  expect(card).toContain('Greymon');
  expect(card).toContain('Agumon'); // vem de
  expect(card).toContain('???');
});
test('Esc volta', () => {
  const { m, back } = setup();
  m.handle(press('cancel'));
  expect(back()).toBe(1);
});
```

No teste do título, acrescentar: existe um cartão `.tt-analyzer` e clicar nele chama `nav.analyzer`.

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement `src/ui/analyzer.ts`**

```ts
import type { SaveData } from '../core/save';
import { FORMS } from '../data/forms';
import { MOVES } from '../data/moves';
import { PARTNERS } from '../data/partners';
import { analyzerData, type AnalyzerForm } from '../sim/analyzer';
import { STAT_KEYS } from '../sim/progression';
import { h, STAGE_NAMES, STAT_NAMES } from './dom';
import { reqKeyText } from './evoText';
import { setActiveModal, type Modal } from './modal';
import { reqText } from './partnerSelect';
import { portrait } from './portrait';
import { btn, chip } from './theme';

/** Digimon Analyzer: vitrine das formas das linhas dos parceiros. ↑↓ escolhe, Esc volta. */
export function showAnalyzer(root: HTMLElement, save: SaveData, back: () => void): Modal {
  const data = analyzerData(save);
  const flat: AnalyzerForm[] = data.groups.flatMap(g => g.forms);
  let sel = Math.max(0, flat.findIndex(f => f.known)), closed = false;
  const card = h('div', { class: 'b2-panel an-card' });
  const buttons: HTMLElement[] = [];

  const list = h('div', { class: 'b2-panel an-list' }, ...data.groups.map(g => {
    const head = g.locked ? '???' : FORMS[PARTNERS.find(p => p.id === g.partnerId)!.childForm].name;
    return h('div', { class: 'an-group' }, h('div', { class: 'b2-label' }, head), h('div', { class: 'an-forms' }, ...g.forms.map(f => {
      const i = flat.indexOf(f);
      const el = h('button', { type: 'button', class: 'an-form' + (f.known ? '' : ' unknown'), 'data-form': f.id, title: f.known ? FORMS[f.id].name : '???',
        onclick: () => select(i) }, portrait(f.id, { size: 40, silhouette: !f.known }), h('span', {}, f.known ? FORMS[f.id].name : '???'));
      buttons[i] = el;
      return el;
    })));
  }));

  function renderCard(f: AnalyzerForm) {
    if (!f.known) {
      card.replaceChildren(portrait(f.id, { size: 140, silhouette: true }), h('div', { class: 'b2-title' }, '???'), h('p', {}, 'Forma não descoberta'));
      return;
    }
    const d = FORMS[f.id];
    const edge = (e: AnalyzerForm['to'][number], dir: 'from' | 'to') => e.form
      ? h('div', { class: 'an-edge' }, `${dir === 'from' ? '←' : '→'} ${FORMS[e.form].name} · ${reqText(e.req)}`)
      : h('div', { class: 'an-edge secret' }, `→ ??? · ${e.hints.map(k => reqKeyText(e.req, k)).join(' e ')}`);
    card.replaceChildren(
      h('div', { class: 'an-top' }, portrait(d.id, { size: 120 }),
        h('div', {}, h('div', { class: 'b2-label' }, STAGE_NAMES[d.stage]), h('div', { class: 'b2-title' }, d.name),
          h('div', { class: 'ps-chips' }, chip('attr', d.attribute), chip('elem', d.element)))),
      h('div', { class: 'b2-label' }, 'Status base'),
      h('div', { class: 'an-stats' }, ...STAT_KEYS.map(k => h('span', {}, `${STAT_NAMES[k]} ${d.baseStats[k]}`))),
      h('div', { class: 'b2-label' }, 'Golpes'),
      h('div', { class: 'an-moves' }, ...[d.signature, ...d.kit].map(m => h('span', {}, MOVES[m]?.name ?? m))),
      f.from.length ? h('div', { class: 'b2-label' }, 'Vem de') : null, ...f.from.map(e => edge(e, 'from')),
      f.to.length ? h('div', { class: 'b2-label' }, 'Evolui para') : null, ...f.to.map(e => edge(e, 'to')));
  }

  function select(i: number) {
    sel = Math.max(0, Math.min(flat.length - 1, i));
    buttons.forEach((b, j) => b.classList.toggle('b2-sel', j === sel));
    renderCard(flat[sel]);
  }
  function leave() { if (closed) return; m.close(); back(); }

  const screen = h('div', { class: 'b2-screen an-screen' },
    h('div', { class: 'an-head' }, btn('Voltar', 'Esc', () => leave(), true), h('h1', { class: 'b2-title' }, 'Digimon Analyzer'),
      h('div', { class: 'b2-label an-count' }, `Descobertas ${data.known}/${data.total}`)),
    h('div', { class: 'an-body' }, list, card));
  root.append(screen);
  select(sel);

  const m: Modal = {
    get closed() { return closed; },
    close() { if (!closed) { closed = true; screen.remove(); } },
    handle(input) {
      if (closed) return;
      if (input.pressed('cancel') || input.pressed('pause')) return leave();
      if (input.pressed('up') || input.pressed('left')) select(sel - 1);
      else if (input.pressed('down') || input.pressed('right')) select(sel + 1);
    },
  };
  setActiveModal(m);
  return m;
}
```

Se `STAGE_NAMES`/`STAT_NAMES` não forem exportados de `./dom` com esses nomes, use os imports que `partnerSelect.ts` usa (ele importa `h, STAGE_NAMES, STAT_NAMES, STAT_SHORT` de `./dom`). Se importar `reqText` de `partnerSelect.ts` criar ciclo, mova `reqText` para `src/ui/evoText.ts` e reexporte de `partnerSelect.ts`.

`src/app.ts`: `export type AppScreen = 'title' | 'partner' | 'records' | 'lab' | 'analyzer' | 'run' | 'results' | 'settings' | 'credits';`

`src/ui/title.ts`:
- `TitleNav` ganha `analyzer(): void;`.
- Depois de criar `tiles` (para o Analyzer ficar no índice 7 e não renumerar os outros), criar e anexar ao `stack`:
  ```ts
  const known = analyzerData(save);
  stack.append(side('tt-analyzer', '🔬', 'Analyzer', `${known.known} / ${known.total} formas descobertas`, nav.analyzer));
  ```
- `NAV` (índices: 0 Jogar, 1 Parceiros, 2 Recordes, 3 Laboratório, 4 Controles, 5 Créditos, 6 DW Wiki, 7 Analyzer):
  ```ts
  const NAV = {
    right: [1, 1, 2, 3, 5, 6, 6, 7], left: [0, 0, 0, 0, 4, 4, 5, 0],
    down: [4, 2, 3, 7, 4, 5, 6, 5], up: [0, 1, 1, 2, 0, 7, 7, 3],
  };
  ```
  e atualizar o comentário dos índices e o de `handle`.

`src/main.ts`, junto de `lab:` (~linha 98): `analyzer: () => { m.close(); app.go('analyzer'); showAnalyzer(ui, save, toTitle); },` e o import.

`src/ui/style.css`:

```css
.an-screen { display: grid; gap: 12px; padding: 16px; grid-template-rows: auto 1fr; max-height: 100vh; }
.an-head { display: flex; align-items: center; gap: 12px; }
.an-head .an-count { margin-left: auto; font-size: 14px; }
.an-body { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 12px; min-height: 0; }
.an-list { overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.an-forms { display: flex; flex-wrap: wrap; gap: 6px; }
.an-form { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 76px; padding: 4px; font-size: 11px; background: transparent; border: 1px solid transparent; color: inherit; cursor: pointer; }
.an-form.b2-sel, .an-form:hover { border-color: var(--b2-accent, #3d9bff); }
.an-form.unknown { opacity: .6; }
.an-card { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; }
.an-top { display: flex; gap: 12px; align-items: center; }
.an-stats, .an-moves { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.an-edge.secret { color: #9a7dff; }
@media (max-width: 720px) { .an-body { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Run** → `npm test && npx tsc --noEmit && npm run build` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/analyzer.ts src/ui/title.ts src/app.ts src/main.ts src/ui/style.css tests/
git commit -m "feat(analyzer): tela Digimon Analyzer e cartão no menu inicial"
```

---

### Task 10: Conferência no jogo e documentação

**Files:**
- Modify: `tools/painel/conteudo.json`, `README.md`, `docs/painel/index.html` (gerado)

- [ ] **Step 1: Conferir no navegador** (`docker compose up -d` ou `npm run dev`; abrir `http://digibonk.local` ou `http://localhost:5173`):
  - Parceiros → Agumon → Build (tecla 2): marcar ★/✕, montar caminho, Esc; reabrir e conferir que ficou salvo.
  - Jogar com ✕ num golpe do kit: ele não aparece no level up.
  - Com caminho, o painel "Próx. evolução" mira o alvo, a carta de status do requisito tem "No seu plano" e a tela de evolução já abre na forma do caminho.
  - Menu → Analyzer: contador, ??? nas não descobertas, ficha com "Vem de"/"Evolui para".
  - Largura de celular (≤ 720 px): editor e Analyzer em uma coluna, sem rolagem horizontal.

- [ ] **Step 2: Atualizar `tools/painel/conteudo.json`**
  - `atualizado`: data do dia.
  - Em `planos`, acrescentar `{ "n": "Plano 11", "d": "<dd/mm>", "t": "Builds e Digimon Analyzer", "p": "★/✕ por parceiro no level up (até 4 de cada; ★ dobra o peso, ✕ tira do sorteio), caminho de digievolução que orienta painel, cartas e tela de evolução, e o Digimon Analyzer com as formas das linhas dos parceiros.", "f": "plans/2026-11-20-digibonk-plano-11-builds-e-analyzer.md" }`.
  - Em `proximos`, remover "★/✕ por parceiro nas builds", "Caminho de digievolução na build (só orienta)" e "Digimon Analyzer".

- [ ] **Step 3: Atualizar `README.md`**
  - Em "Como funciona uma partida", novo item **Builds** (★/✕, limite 4, caminho que só orienta, botão Build/tecla 2 na tela Parceiros) e **Digimon Analyzer** (cartão no menu).
  - Em "Próximos passos", tirar Builds e Analyzer; deixar Digimon aliados, Laboratório maior, sprites, ranking online, e acrescentar "Analyzer com inimigos e pesquisa".

- [ ] **Step 4: Gerar o painel e rodar tudo**

Run: `npm run painel && npm test && npx tsc --noEmit`
Expected: PASS; `docs/painel/index.html` com o Plano 11.

- [ ] **Step 5: Commit**

```bash
git add tools/painel/conteudo.json docs/painel/index.html README.md
git commit -m "docs: plano 11 (builds e Analyzer) no painel e no README"
```
