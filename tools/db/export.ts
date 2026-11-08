/**
 * Banco → dados do jogo. Monta os mesmos objetos que src/data exportava (FORMS, MOVES, CARDS, ...)
 * e escreve src/data/generated/gamedata.ts, que vai para o git (o .db não).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Db } from './db.ts';

type Row = Record<string, any>;
const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);
const nonEmpty = <T>(a: T[]) => (a.length ? a : undefined);

export function exportGameData(db: Db) {
  const all = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as Row[];
  const group = (sql: string, key: string, val: string) => {
    const m = new Map<string, any[]>();
    for (const r of all(sql)) { if (!m.has(r[key])) m.set(r[key], []); m.get(r[key])!.push(r[val]); }
    return (k: string) => m.get(k) ?? [];
  };

  const chart = (table: string, ids: string[]) => {
    const c: Record<string, Record<string, number>> = {};
    for (const a of ids) { c[a] = {}; for (const d of ids) c[a][d] = 1; }
    for (const r of all(`SELECT attacker, defender, multiplier FROM ${table}`)) c[r.attacker][r.defender] = r.multiplier;
    return c;
  };
  const ATTRIBUTE_CHART = chart('attribute_matchups', all('SELECT id FROM attributes').map(r => r.id));
  const ELEMENT_CHART = chart('element_matchups', all('SELECT id FROM elements').map(r => r.id));

  const MOVES = Object.fromEntries(all('SELECT * FROM moves ORDER BY ord').map(m => [m.id, {
    id: m.id, name: m.name, element: m.element, pattern: m.pattern, damage: m.damage, cooldown: m.cooldown, range: m.reach,
    radius: opt(m.radius), count: opt(m.count), pierce: opt(m.pierce), speed: opt(m.speed), duration: opt(m.duration),
    description: m.description, maxLevel: m.max_level, perLevel: { damage: m.dmg_per_level, cooldown: m.cd_per_level }, color: m.color,
  }]));

  const kit = group('SELECT form_id, move_id FROM form_kit ORDER BY form_id, ord', 'form_id', 'move_id');
  const evoItems = group('SELECT evolution_id, item_id FROM evolution_items', 'evolution_id', 'item_id');
  const evoUnlocks = group('SELECT evolution_id, partner_id FROM evolution_unlocks', 'evolution_id', 'partner_id');
  const evolutions = new Map<string, any[]>();
  for (const e of all('SELECT * FROM evolutions ORDER BY from_form, ord')) {
    const minStats = Object.fromEntries((['hp', 'atk', 'def', 'spd', 'brain'] as const)
      .filter(k => e[`min_${k}`] !== null).map(k => [k, e[`min_${k}`]]));
    const req = {
      minLevel: e.min_level, minStats: Object.keys(minStats).length ? minStats : undefined,
      items: nonEmpty(evoItems(e.id)), unlocked: nonEmpty(evoUnlocks(e.id)), minPhase: opt(e.min_phase), minKills: opt(e.min_kills),
    };
    if (!evolutions.has(e.from_form)) evolutions.set(e.from_form, []);
    evolutions.get(e.from_form)!.push({ to: e.to_form, req });
  }
  const FORMS = Object.fromEntries(all(`SELECT f.*, d.* FROM forms f JOIN digimon d ON d.id = f.digimon_id ORDER BY f.ord`).map(f => [f.id, {
    id: f.id, name: f.name, stage: f.stage, line: f.line, attribute: f.attribute, element: f.element,
    baseStats: { hp: f.hp, atk: f.atk, def: f.def, spd: f.spd, brain: f.brain }, growthRate: f.growth_rate,
    signature: f.signature, kit: kit(f.id), evolutions: evolutions.get(f.id) ?? [], size: f.size, color: f.color,
  }]));

  const PARTNERS = all('SELECT * FROM partners ORDER BY ord').map(p => ({ id: p.id, childForm: p.child_form, season: p.season, starter: p.starter === 1 }));

  const itemPartners = group('SELECT item_id, partner_id FROM item_partners', 'item_id', 'partner_id');
  const itemRequires = group('SELECT item_id, partner_id FROM item_requires', 'item_id', 'partner_id');
  const ITEMS = Object.fromEntries(all('SELECT * FROM items ORDER BY ord').map(i => [i.id, {
    id: i.id, name: i.name, kind: i.kind, forPartners: nonEmpty(itemPartners(i.id)), unlockPartner: opt(i.unlock_partner),
    requiresUnlocked: nonEmpty(itemRequires(i.id)),
  }]));

  const cardPartners = group('SELECT card_id, partner_id FROM card_partners', 'card_id', 'partner_id');
  const bonuses = new Map<string, any[]>();
  for (const b of all('SELECT * FROM card_bonuses ORDER BY card_id, stat')) {
    if (!bonuses.has(b.card_id)) bonuses.set(b.card_id, []);
    bonuses.get(b.card_id)!.push({ stat: b.stat, basePct: b.base_pct, perLevelPct: b.per_level_pct });
  }
  const CARDS = Object.fromEntries(all('SELECT * FROM cards ORDER BY ord').map(c => [c.id, {
    id: c.id, name: c.name, kind: c.kind, weight: c.weight, moveId: opt(c.move_id), forPartners: nonEmpty(cardPartners(c.id)),
    bonuses: bonuses.get(c.id) ?? [],
  }]));

  const bossMoves = group('SELECT digimon_id, move_id FROM boss_moves ORDER BY digimon_id, ord', 'digimon_id', 'move_id');
  // LEFT JOIN: um inimigo sem Digimon vira erro com o id, e não some (mesmo com as chaves estrangeiras desligadas)
  const enemies = (role: string) => all(`SELECT e.*, d.id AS found, d.name, d.color, d.attribute, d.element FROM enemies e
    LEFT JOIN digimon d ON d.id = e.digimon_id WHERE e.role = ? ORDER BY e.ord`, role).map(e => {
    if (e.found === null) throw new Error(`inimigo ${e.digimon_id} (${role}): Digimon inexistente na tabela digimon`);
    return e;
  });
  const enemy = (e: Row) => ({ id: e.digimon_id, name: e.name, attribute: e.attribute, element: e.element, hp: e.hp, dmg: e.dmg,
    speed: e.speed, xp: e.xp, size: e.size, color: e.color, minPhase: e.min_phase });
  const ENEMIES = enemies('enemy').map(enemy);
  const MINIBOSSES = enemies('miniboss').map(enemy);
  const BOSSES = enemies('boss').map(e => ({ id: e.digimon_id, name: e.name, attribute: e.attribute, element: e.element, phase: e.min_phase,
    hp: e.hp, dmg: e.dmg, speed: e.speed, size: e.size, color: e.color, moves: bossMoves(e.digimon_id) }));

  return { FORMS, MOVES, CARDS, ITEMS, PARTNERS, ENEMIES, MINIBOSSES, BOSSES, ATTRIBUTE_CHART, ELEMENT_CHART };
}

export const GENERATED = 'src/data/generated/gamedata.ts';

/** escreve o módulo gerado; JSON.stringify descarta os campos undefined */
export function exportToFile(db: Db, path = GENERATED): string {
  const g = exportGameData(db);
  const j = (v: unknown) => JSON.stringify(v, null, 1);
  const src = `// GERADO por tools/db/export.ts a partir de db/migrations + db/seeds — não editar à mão.
// Para mudar dados: edite o seed (db/seeds) e rode \`npm run db:build\`.
import type { AttributeId, BossDef, CardDef, ElementId, EnemyDef, FormDef, ItemDef, MoveDef, PartnerDef } from '../types';

export const MOVES: Record<string, MoveDef> = ${j(g.MOVES)};
export const FORMS: Record<string, FormDef> = ${j(g.FORMS)};
export const CARDS: Record<string, CardDef> = ${j(g.CARDS)};
export const ITEMS: Record<string, ItemDef> = ${j(g.ITEMS)};
export const PARTNERS: PartnerDef[] = ${j(g.PARTNERS)};
export const ENEMIES: EnemyDef[] = ${j(g.ENEMIES)};
export const MINIBOSSES: EnemyDef[] = ${j(g.MINIBOSSES)};
export const BOSSES: BossDef[] = ${j(g.BOSSES)};
export const ATTRIBUTE_CHART: Record<AttributeId, Record<AttributeId, number>> = ${j(g.ATTRIBUTE_CHART)};
export const ELEMENT_CHART: Record<ElementId, Record<ElementId, number>> = ${j(g.ELEMENT_CHART)};
`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, src);
  return path;
}
