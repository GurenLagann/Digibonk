/**
 * Registro da migração: gera db/seeds/002_conteudo.sql a partir do retrato dos dados TS de antes
 * (tests/db/fixtures/before.json) + atributo/elemento/estágio de cada Digimon e elemento de cada golpe.
 * Depois disso o seed é a fonte de verdade (editar o .sql, não rodar isto de novo).
 * uso: node --experimental-strip-types tools/db/dump-current.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';

const before = JSON.parse(readFileSync('tests/db/fixtures/before.json', 'utf8'));

type Attr = 'vaccine' | 'data' | 'virus' | 'free';
// [atributo, elemento, estágio (só para quem não é forma jogável)]
const TYPING: Record<string, [Attr, string, string?]> = {
  agumon: ['vaccine', 'fire'], greymon: ['vaccine', 'fire'], metalgreymon: ['vaccine', 'fire'], wargreymon: ['vaccine', 'fire'],
  omnimon: ['vaccine', 'light'],
  gabumon: ['data', 'ice'],
  veemon: ['free', 'light'], exveemon: ['free', 'light'], flamedramon: ['free', 'fire'], raidramon: ['free', 'electric'],
  paildramon: ['free', 'wind'], imperialdramon_fm: ['free', 'light'],
  veedramon: ['vaccine', 'wind'], aeroveedramon: ['vaccine', 'wind'], ulforceveedramon: ['vaccine', 'light'],
  wormmon: ['free', 'plant'],
  guilmon: ['virus', 'fire'], growlmon: ['virus', 'fire'], wargrowlmon: ['virus', 'fire'], gallantmon: ['virus', 'light'],
  // inimigos
  snowgoblimon: ['virus', 'ice', 'child'], hagurumon: ['virus', 'steel', 'child'], gazimon: ['virus', 'electric', 'child'],
  bakemon: ['virus', 'dark', 'adult'], guardromon: ['data', 'steel', 'adult'], kuwagamon: ['virus', 'plant', 'adult'],
  ogremon: ['virus', 'earth', 'adult'], snimon: ['vaccine', 'wind', 'adult'], darktyrannomon: ['virus', 'fire', 'adult'],
  devidramon: ['virus', 'dark', 'adult'],
  ladydevimon: ['virus', 'dark', 'perfect'], arukenimon: ['data', 'plant', 'perfect'], skullgreymon: ['virus', 'dark', 'perfect'],
  blackwargrowlmon: ['virus', 'dark', 'perfect'], blackweregarurumon: ['virus', 'dark', 'perfect'],
  devimon: ['virus', 'dark', 'adult'], etemon: ['virus', 'earth', 'perfect'], myotismon: ['virus', 'dark', 'perfect'],
  kimeramon: ['data', 'fire', 'perfect'], piedmon: ['virus', 'dark', 'ultimate'],
};

const MOVE_ELEMENT: Record<string, string> = {
  baby_flame: 'fire', sharp_claws: 'neutral', spitfire_blast: 'fire', pepper_breath_rain: 'fire', mega_flame: 'fire',
  horn_strike: 'neutral', tail_whip: 'neutral', giga_destroyer: 'fire', trident_arm: 'steel', metal_aura: 'steel',
  gaia_force: 'fire', brave_tornado: 'wind', great_tornado: 'wind', transcendent_sword: 'light', supreme_cannon: 'ice',
  omni_aura: 'light', vee_headbutt: 'neutral', vee_punch: 'neutral', boom_boom_punch: 'neutral', vee_laser: 'light',
  critical_crunch: 'neutral', x_cross: 'light', v_breath_arrow: 'fire', magnum_punch: 'neutral', v_wing_blade: 'wind',
  dragon_impulse: 'light', aero_v_wing: 'wind', shining_v_force: 'light', ulforce_saber: 'light', fire_rocket: 'fire',
  knuckle_fire: 'fire', blue_thunder: 'electric', lightning_blade: 'electric', desperado_blaster: 'steel',
  sting_strike: 'plant', positron_laser: 'light', giga_crusher: 'light', pyro_sphere: 'fire', rock_breaker: 'earth',
  crimson_fang: 'neutral', pyro_blaster: 'fire', dragon_slash: 'neutral', exhaust_flame: 'fire', atomic_blaster: 'fire',
  radiation_blade: 'fire', lightning_joust: 'light', royal_saber: 'light', shield_of_the_just: 'light', petit_fire: 'ice',
  sticky_net: 'plant', lightning_paw: 'electric', diamond_storm: 'ice', hand_of_fate: 'light', howling_blaster: 'ice',
  super_shocker: 'electric', poison_ivy: 'plant', touch_of_evil: 'dark', dark_network: 'dark', crimson_lightning: 'dark',
  heat_viper: 'fire', trump_sword: 'dark',
};

// cartas passivas: bônus fixo de antes → % (decisão do construtor, editável no seed)
const PCT: Record<string, [string, number, number]> = {
  hp: ['hp', 20, 2], atk: ['atk', 15, 2], def: ['def', 15, 2], spd: ['spd', 10, 2], brain: ['brain', 15, 2],
  dmgMul: ['dmg', 15, 2], pickupMul: ['pickup', 50, 5], xpMul: ['xp', 20, 5], cdMul: ['cooldown', -10, -1],
};

const q = (v: unknown): string => v === undefined || v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
const row = (vals: unknown[]) => `(${vals.map(q).join(', ')})`;
const out: string[] = ['-- Conteúdo do jogo (gerado uma vez por tools/db/dump-current.ts; daqui em diante, editar este arquivo).'];
const insert = (table: string, cols: string[], rows: unknown[][]) => {
  if (rows.length) out.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES\n  ${rows.map(row).join(',\n  ')};\n`);
};
const typing = (id: string) => { const t = TYPING[id]; if (!t) throw new Error(`sem tipagem: ${id}`); return t; };

const forms = Object.values(before.FORMS) as any[];
const enemyDefs = [...before.ENEMIES.map((e: any) => ({ ...e, role: 'enemy' })), ...before.MINIBOSSES.map((e: any) => ({ ...e, role: 'miniboss' })),
  ...before.BOSSES.map((e: any) => ({ ...e, role: 'boss', minPhase: e.phase, xp: 0 }))];

// digimon: formas (status finais) + inimigos (só identidade; status de jogo ficam em enemies)
insert('digimon', ['id', 'name', 'stage', 'attribute', 'element', 'hp', 'atk', 'def', 'spd', 'brain', 'growth_rate', 'size', 'color'], [
  ...forms.map(f => { const [a, e] = typing(f.id); const s = f.baseStats; return [f.id, f.name, f.stage, a, e, s.hp, s.atk, s.def, s.spd, s.brain, 0.005, f.size, f.color]; }),
  ...enemyDefs.map(e => { const [a, el, st] = typing(e.id); return [e.id, e.name, st, a, el, e.hp, e.dmg, 0, e.speed, 0, 0.005, e.size, e.color]; }),
]);

insert('moves', ['id', 'name', 'element', 'pattern', 'damage', 'cooldown', 'reach', 'radius', 'count', 'pierce', 'speed', 'duration', 'max_level', 'dmg_per_level', 'cd_per_level', 'color', 'ord'],
  Object.values(before.MOVES).map((m: any, i: number) => {
    if (!MOVE_ELEMENT[m.id]) throw new Error(`golpe sem elemento: ${m.id}`);
    return [m.id, m.name, MOVE_ELEMENT[m.id], m.pattern, m.damage, m.cooldown, m.range, m.radius, m.count, m.pierce, m.speed, m.duration, m.maxLevel, m.perLevel.damage, m.perLevel.cooldown, m.color, i];
  }));

insert('forms', ['digimon_id', 'line', 'signature', 'ord'], forms.map((f, i) => [f.id, f.line, f.signature, i]));
insert('form_kit', ['form_id', 'move_id', 'ord'], forms.flatMap(f => f.kit.map((m: string, i: number) => [f.id, m, i])));
insert('partners', ['id', 'child_form', 'season', 'starter', 'ord'], before.PARTNERS.map((p: any, i: number) => [p.id, p.childForm, p.season, p.starter ? 1 : 0, i]));
insert('items', ['id', 'name', 'kind', 'unlock_partner', 'ord'], Object.values(before.ITEMS).map((it: any, i) => [it.id, it.name, it.kind, it.unlockPartner, i]));
insert('item_partners', ['item_id', 'partner_id'], Object.values(before.ITEMS).flatMap((it: any) => (it.forPartners ?? []).map((p: string) => [it.id, p])));
insert('item_requires', ['item_id', 'partner_id'], Object.values(before.ITEMS).flatMap((it: any) => (it.requiresUnlocked ?? []).map((p: string) => [it.id, p])));

const evos = forms.flatMap(f => f.evolutions.map((e: any, i: number) => ({ from: f.id, ...e, ord: i })));
insert('evolutions', ['id', 'from_form', 'to_form', 'min_level', 'min_hp', 'min_atk', 'min_def', 'min_spd', 'min_brain', 'min_phase', 'min_kills', 'ord'],
  evos.map(e => { const s = e.req.minStats ?? {}; return [`${e.from}->${e.to}`, e.from, e.to, e.req.minLevel, s.hp, s.atk, s.def, s.spd, s.brain, e.req.minPhase, e.req.minKills, e.ord]; }));
insert('evolution_items', ['evolution_id', 'item_id'], evos.flatMap(e => (e.req.items ?? []).map((it: string) => [`${e.from}->${e.to}`, it])));
insert('evolution_unlocks', ['evolution_id', 'partner_id'], evos.flatMap(e => (e.req.unlocked ?? []).map((p: string) => [`${e.from}->${e.to}`, p])));

const cards = Object.values(before.CARDS) as any[];
insert('cards', ['id', 'name', 'kind', 'weight', 'move_id', 'ord'], cards.map((c, i) => [c.id, c.name, c.kind, c.weight, c.moveId, i]));
insert('card_bonuses', ['card_id', 'stat', 'base_pct', 'per_level_pct'], cards.flatMap(c => Object.keys(c.passive ?? {}).map(k => {
  if (!PCT[k]) throw new Error(`bônus sem conversão: ${c.id}.${k}`); const [stat, base, per] = PCT[k]; return [c.id, stat, base, per];
})));
insert('card_partners', ['card_id', 'partner_id'], cards.flatMap(c => (c.forPartners ?? []).map((p: string) => [c.id, p])));

insert('enemies', ['digimon_id', 'role', 'hp', 'dmg', 'speed', 'xp', 'size', 'min_phase', 'ord'],
  enemyDefs.map((e, i) => [e.id, e.role, e.hp, e.dmg, e.speed, e.xp, e.size, e.minPhase, i]));
insert('boss_moves', ['digimon_id', 'move_id', 'ord'], before.BOSSES.flatMap((b: any) => b.moves.map((m: string, i: number) => [b.id, m, i])));

writeFileSync('db/seeds/002_conteudo.sql', out.join('\n'));
console.log(`db/seeds/002_conteudo.sql: ${out.length - 1} INSERTs`);
