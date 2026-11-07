/**
 * Registro da migração para o banco: retrato JSON dos módulos de dados TS de ANTES da troca.
 * O teste do exportador compara a saída do banco com este retrato. Não precisa rodar de novo.
 * uso: node --experimental-strip-types tools/db/snapshot-current.ts > tests/db/fixtures/before.json
 */
const m = async (f: string) => import(new URL(`../../src/data/${f}.ts`, import.meta.url).href);
const [forms, moves, cards, items, partners, enemies] = await Promise.all(['forms', 'moves', 'cards', 'items', 'partners', 'enemies'].map(m));
console.log(JSON.stringify({
  FORMS: forms.FORMS, MOVES: moves.MOVES, CARDS: cards.CARDS, ITEMS: items.ITEMS, PARTNERS: partners.PARTNERS,
  ENEMIES: enemies.ENEMIES, MINIBOSSES: enemies.MINIBOSSES, BOSSES: enemies.BOSSES,
}, null, 1));
