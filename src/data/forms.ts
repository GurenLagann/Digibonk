import type { EvoEdge, FormDef, Stage, Stats } from './types';

const BASE: Record<Stage, Stats> = {
  child: { hp: 60, atk: 10, def: 8, spd: 10, brain: 8 },
  adult: { hp: 120, atk: 18, def: 15, spd: 13, brain: 12 },
  perfect: { hp: 220, atk: 32, def: 26, spd: 24, brain: 20 },
  ultimate: { hp: 380, atk: 55, def: 42, spd: 34, brain: 32 },
};
const GROWTH: Stats = { hp: 6, atk: 0.6, def: 0.5, spd: 0.4, brain: 0.4 };
const SIZE: Record<Stage, number> = { child: 1, adult: 1.5, perfect: 1.9, ultimate: 2.2 };

function add(a: Stats, m: Partial<Stats> = {}, mul = 1): Stats {
  return { hp: Math.round((a.hp + (m.hp ?? 0)) * mul), atk: (a.atk + (m.atk ?? 0)) * mul, def: (a.def + (m.def ?? 0)) * mul, spd: (a.spd + (m.spd ?? 0)) * mul, brain: (a.brain + (m.brain ?? 0)) * mul };
}

interface F {
  id: string; name: string; stage: Stage; line: string; signature: string; kit: string[];
  color: number; evolutions?: EvoEdge[]; mod?: Partial<Stats>; statStage?: Stage; mul?: number; growth?: Partial<Stats>;
}
const list: FormDef[] = [];
function form(f: F) {
  const st = f.statStage ?? f.stage;
  list.push({
    id: f.id, name: f.name, stage: f.stage, line: f.line, signature: f.signature, kit: f.kit,
    baseStats: add(BASE[st], f.mod, f.mul ?? 1), growth: add(GROWTH, f.growth),
    evolutions: f.evolutions ?? [], size: SIZE[f.stage], color: f.color,
  });
}

// ---- Agumon (Adventure)
form({ id: 'agumon', name: 'Agumon', stage: 'child', line: 'agumon', signature: 'baby_flame', kit: ['sharp_claws', 'spitfire_blast', 'pepper_breath_rain'], color: 0xff9a2e,
  evolutions: [{ to: 'greymon', req: { minLevel: 8, minStats: { atk: 14 } } }] });
form({ id: 'greymon', name: 'Greymon', stage: 'adult', line: 'agumon', signature: 'mega_flame', kit: ['horn_strike', 'tail_whip', 'spitfire_blast'], color: 0xff8a1e,
  mod: { hp: 20, atk: 2, spd: -2 }, evolutions: [{ to: 'metalgreymon', req: { minLevel: 20, minStats: { atk: 30, def: 22 } } }] });
form({ id: 'metalgreymon', name: 'MetalGreymon', stage: 'perfect', line: 'agumon', signature: 'giga_destroyer', kit: ['trident_arm', 'metal_aura', 'horn_strike'], color: 0xd8742a,
  mod: { hp: 30, atk: 2, def: 2, spd: -2 }, evolutions: [
    { to: 'wargreymon', req: { minLevel: 35, minStats: { atk: 55 }, minPhase: 4 } },
  ] });
form({ id: 'wargreymon', name: 'WarGreymon', stage: 'ultimate', line: 'agumon', signature: 'gaia_force', kit: ['brave_tornado', 'great_tornado', 'trident_arm'], color: 0xffb020,
  evolutions: [{ to: 'omnimon', req: { minLevel: 42, unlocked: ['gabumon'], items: ['fusion_garurumon'] } }] });
form({ id: 'omnimon', name: 'Omnimon', stage: 'ultimate', line: 'agumon', signature: 'transcendent_sword', kit: ['supreme_cannon', 'omni_aura', 'brave_tornado'], color: 0xf4f4ff, mul: 1.25 });

// ---- Veemon (Adventure 02)
form({ id: 'veemon', name: 'Veemon', stage: 'child', line: 'veemon', signature: 'vee_headbutt', kit: ['vee_punch', 'boom_boom_punch', 'x_cross'], color: 0x3a7bff,
  evolutions: [
    { to: 'exveemon', req: { minLevel: 8, minStats: { spd: 14 } } },
    { to: 'veedramon', req: { minLevel: 8, minStats: { atk: 14, def: 12 } } },
    { to: 'flamedramon', req: { minLevel: 5, items: ['digiegg_courage'] } },
    { to: 'raidramon', req: { minLevel: 5, items: ['digiegg_friendship'] } },
  ] });
form({ id: 'exveemon', name: 'ExVeemon', stage: 'adult', line: 'veemon', signature: 'vee_laser', kit: ['critical_crunch', 'x_cross', 'vee_punch'], color: 0x4a8bff,
  mod: { spd: 4, def: -2 }, evolutions: [{ to: 'paildramon', req: { minLevel: 22, unlocked: ['wormmon'], items: ['fusion_stingmon'] } }] });
form({ id: 'veedramon', name: 'Veedramon', stage: 'adult', line: 'veemon', signature: 'v_breath_arrow', kit: ['magnum_punch', 'boom_boom_punch', 'x_cross'], color: 0x2a6be8,
  mod: { atk: 1, def: 2, spd: 0 }, evolutions: [{ to: 'aeroveedramon', req: { minLevel: 20, minStats: { atk: 28, spd: 24 } } }] });
form({ id: 'aeroveedramon', name: 'AeroVeedramon', stage: 'perfect', line: 'veemon', signature: 'dragon_impulse', kit: ['v_wing_blade', 'aero_v_wing', 'magnum_punch'], color: 0x3b7cf0,
  mod: { spd: 4 }, evolutions: [{ to: 'ulforceveedramon', req: { minLevel: 35, minStats: { spd: 50 }, minPhase: 4 } }] });
form({ id: 'ulforceveedramon', name: 'UlforceVeedramon', stage: 'ultimate', line: 'veemon', signature: 'shining_v_force', kit: ['ulforce_saber', 'v_wing_blade', 'aero_v_wing'], color: 0x2f9bff,
  mod: { spd: 8, def: -4 } });
form({ id: 'flamedramon', name: 'Flamedramon', stage: 'adult', statStage: 'perfect', line: 'veemon', signature: 'fire_rocket', kit: ['knuckle_fire', 'critical_crunch', 'boom_boom_punch'], color: 0xff5a2a });
form({ id: 'raidramon', name: 'Raidramon', stage: 'adult', statStage: 'perfect', line: 'veemon', signature: 'blue_thunder', kit: ['lightning_blade', 'x_cross', 'vee_punch'], color: 0x2a2f4a, mod: { spd: 4 } });
form({ id: 'paildramon', name: 'Paildramon', stage: 'perfect', line: 'veemon', signature: 'desperado_blaster', kit: ['sting_strike', 'x_cross', 'critical_crunch'], color: 0x2a5bd8,
  mod: { hp: 20, atk: 3 }, evolutions: [{ to: 'imperialdramon_fm', req: { minLevel: 38, minStats: { atk: 55 }, minPhase: 4 } }] });
form({ id: 'imperialdramon_fm', name: 'Imperialdramon FM', stage: 'ultimate', line: 'veemon', signature: 'positron_laser', kit: ['giga_crusher', 'desperado_blaster', 'sting_strike'], color: 0x1a3fa8, mul: 1.25 });

// ---- Guilmon (Tamers)
form({ id: 'guilmon', name: 'Guilmon', stage: 'child', line: 'guilmon', signature: 'pyro_sphere', kit: ['rock_breaker', 'crimson_fang', 'spitfire_blast'], color: 0xe8312f,
  evolutions: [{ to: 'growlmon', req: { minLevel: 8, minStats: { atk: 13 } } }] });
form({ id: 'growlmon', name: 'Growlmon', stage: 'adult', line: 'guilmon', signature: 'pyro_blaster', kit: ['dragon_slash', 'exhaust_flame', 'crimson_fang'], color: 0xd82a2a,
  mod: { hp: 10, atk: 2 }, evolutions: [{ to: 'wargrowlmon', req: { minLevel: 20, minStats: { atk: 28, brain: 18 } } }] });
form({ id: 'wargrowlmon', name: 'WarGrowlmon', stage: 'perfect', line: 'guilmon', signature: 'atomic_blaster', kit: ['radiation_blade', 'exhaust_flame', 'dragon_slash'], color: 0xc8202a,
  mod: { hp: 20, def: 2 }, evolutions: [{ to: 'gallantmon', req: { minLevel: 35, items: ['blue_card'] } }] });
form({ id: 'gallantmon', name: 'Gallantmon', stage: 'ultimate', line: 'guilmon', signature: 'lightning_joust', kit: ['royal_saber', 'shield_of_the_just', 'radiation_blade'], color: 0xf0f0f0,
  mod: { def: 6 } });

// ---- Placeholders (Plano 3 completa)
form({ id: 'gabumon', name: 'Gabumon', stage: 'child', line: 'gabumon', signature: 'petit_fire', kit: [], color: 0x8fb7ff });
form({ id: 'wormmon', name: 'Wormmon', stage: 'child', line: 'wormmon', signature: 'sticky_net', kit: [], color: 0x6fdc5a });

export const FORMS: Record<string, FormDef> = Object.fromEntries(list.map(f => [f.id, f]));
export const FORM_LIST: readonly FormDef[] = list;
