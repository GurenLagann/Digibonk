import type { MoveDef, MovePattern } from './types';

type Extra = Partial<Pick<MoveDef, 'radius' | 'count' | 'pierce' | 'speed' | 'duration'>>;
const list: MoveDef[] = [];
function mv(id: string, name: string, pattern: MovePattern, damage: number, cooldown: number, range: number, color: number, extra: Extra = {}) {
  list.push({ id, name, pattern, damage, cooldown, range, color, maxLevel: 5, perLevel: { damage: 1.25, cooldown: 0.92 }, ...extra });
}
const FIRE = 0xff7a1a, BLUE = 0x3a8bff, RED = 0xe8312f, GOLD = 0xffd84a, WHITE = 0xf2f6ff, GREEN = 0x5fd35f, DARK = 0x7a3cff;

// Agumon line
mv('baby_flame', 'Baby Flame', 'projectile', 10, 1.0, 12, FIRE, { speed: 14, radius: 0.5 });
mv('sharp_claws', 'Sharp Claws', 'cone', 8, 0.8, 3, WHITE, { radius: 3 });
mv('spitfire_blast', 'Spitfire Blast', 'area', 7, 2.4, 10, FIRE, { radius: 2.5, duration: 0.4 });
mv('pepper_breath_rain', 'Pepper Breath', 'projectile', 6, 1.8, 12, FIRE, { count: 3, speed: 13, radius: 0.4 });
mv('mega_flame', 'Mega Flame', 'projectile', 16, 1.1, 13, FIRE, { speed: 15, radius: 0.7, pierce: 1 });
mv('horn_strike', 'Great Horns Attack', 'cone', 14, 0.9, 3.5, WHITE, { radius: 3.5 });
mv('tail_whip', 'Tail Whip', 'aura', 5, 0.5, 3.2, GOLD, { radius: 3.2 });
mv('giga_destroyer', 'Giga Destroyer', 'projectile', 26, 1.4, 15, FIRE, { count: 2, speed: 13, radius: 0.9 });
mv('trident_arm', 'Trident Arm', 'beam', 18, 1.6, 10, WHITE, { radius: 0.8, duration: 0.3 });
mv('metal_aura', 'Metal Ring', 'orbital', 10, 4.0, 3, WHITE, { count: 2, radius: 3, duration: 3 });
mv('gaia_force', 'Gaia Force', 'area', 60, 2.2, 14, FIRE, { radius: 5, duration: 0.5 });
mv('brave_tornado', 'Brave Tornado', 'beam', 40, 1.8, 12, GOLD, { radius: 1.2, duration: 0.4 });
mv('great_tornado', 'Great Tornado', 'aura', 18, 0.6, 4, GOLD, { radius: 4 });
mv('transcendent_sword', 'Transcendent Sword', 'beam', 90, 1.6, 16, WHITE, { radius: 1.4, duration: 0.4 });
mv('supreme_cannon', 'Supreme Cannon', 'area', 80, 2.4, 16, BLUE, { radius: 6, duration: 0.5 });
mv('omni_aura', 'Omni Aura', 'orbital', 30, 4.0, 4, GOLD, { count: 4, radius: 4, duration: 3 });

// Veemon line
mv('vee_headbutt', 'Vee Headbutt', 'cone', 11, 0.9, 3.2, BLUE, { radius: 3.2 });
mv('vee_punch', 'Vee Punch', 'projectile', 7, 0.6, 7, BLUE, { speed: 16, radius: 0.4 });
mv('boom_boom_punch', 'Boom Boom Punch', 'area', 9, 2.2, 6, BLUE, { radius: 2, duration: 0.3 });
mv('vee_laser', 'Vee Laser', 'beam', 20, 1.4, 12, BLUE, { radius: 0.8, duration: 0.3 });
mv('critical_crunch', 'Critical Crunch', 'cone', 16, 0.9, 3.5, WHITE, { radius: 3.5 });
mv('x_cross', 'X-Cross', 'projectile', 14, 1.2, 12, BLUE, { speed: 16, radius: 0.7, pierce: 2 });
mv('v_breath_arrow', 'V-Breath Arrow', 'beam', 22, 1.5, 12, BLUE, { radius: 0.9, duration: 0.3 });
mv('magnum_punch', 'Magnum Punch', 'cone', 18, 1.0, 3.5, WHITE, { radius: 3.5 });
mv('v_wing_blade', 'V-Wing Blade', 'projectile', 18, 1.4, 14, BLUE, { speed: 18, radius: 0.8, pierce: 3 });
mv('dragon_impulse', 'Dragon Impulse', 'beam', 40, 1.6, 14, BLUE, { radius: 1.2, duration: 0.4 });
mv('aero_v_wing', 'Aero V-Wing', 'aura', 14, 0.5, 4, BLUE, { radius: 4 });
mv('shining_v_force', 'Shining V Force', 'beam', 80, 1.4, 16, GOLD, { radius: 1.4, duration: 0.4 });
mv('ulforce_saber', 'Ulforce Saber', 'orbital', 26, 4.0, 3.5, WHITE, { count: 3, radius: 3.5, duration: 3 });
mv('fire_rocket', 'Fire Rocket', 'projectile', 28, 1.2, 13, FIRE, { speed: 18, radius: 0.9, pierce: 2 });
mv('knuckle_fire', 'Knuckle Fire', 'projectile', 14, 1.0, 12, FIRE, { count: 3, speed: 14, radius: 0.5 });
mv('blue_thunder', 'Blue Thunder', 'area', 30, 1.6, 12, GOLD, { radius: 3.5, duration: 0.4 });
mv('lightning_blade', 'Lightning Blade', 'cone', 22, 0.9, 4, GOLD, { radius: 4 });
mv('desperado_blaster', 'Desperado Blaster', 'projectile', 24, 1.2, 14, GOLD, { count: 4, speed: 17, radius: 0.5 });
mv('sting_strike', 'Sting Strike', 'cone', 22, 0.9, 4, GREEN, { radius: 4 });
mv('positron_laser', 'Positron Laser', 'beam', 90, 1.6, 18, GOLD, { radius: 1.5, duration: 0.4 });
mv('giga_crusher', 'Giga Crusher', 'area', 70, 2.4, 15, BLUE, { radius: 6, duration: 0.5 });

// Guilmon line
mv('pyro_sphere', 'Pyro Sphere', 'projectile', 11, 1.0, 12, RED, { speed: 14, radius: 0.5 });
mv('rock_breaker', 'Rock Breaker', 'cone', 8, 0.8, 3, WHITE, { radius: 3 });
mv('crimson_fang', 'Crimson Fang', 'orbital', 6, 4.0, 2.5, RED, { count: 1, radius: 2.5, duration: 3 });
mv('pyro_blaster', 'Pyro Blaster', 'projectile', 17, 1.1, 13, RED, { speed: 15, radius: 0.7, pierce: 1 });
mv('dragon_slash', 'Dragon Slash', 'cone', 15, 0.9, 4, WHITE, { radius: 4 });
mv('exhaust_flame', 'Exhaust Flame', 'area', 14, 2.0, 10, RED, { radius: 3, duration: 0.4 });
mv('atomic_blaster', 'Atomic Blaster', 'beam', 34, 1.6, 14, RED, { radius: 1.1, duration: 0.4 });
mv('radiation_blade', 'Radiation Blade', 'cone', 24, 0.9, 4.5, WHITE, { radius: 4.5 });
mv('lightning_joust', 'Lightning Joust', 'beam', 75, 1.4, 16, GOLD, { radius: 1.3, duration: 0.4 });
mv('royal_saber', 'Royal Saber', 'area', 70, 2.0, 14, GOLD, { radius: 5, duration: 0.5 });
mv('shield_of_the_just', 'Shield of the Just', 'aura', 18, 0.5, 4, WHITE, { radius: 4 });

// placeholder partners (plano 3 completa)
mv('petit_fire', 'Petit Fire', 'projectile', 10, 1.0, 12, BLUE, { speed: 14, radius: 0.5 });
mv('sticky_net', 'Sticky Net', 'projectile', 9, 1.0, 11, GREEN, { speed: 12, radius: 0.6, pierce: 1 });

// Slash card moves
mv('lightning_paw', 'Lightning Paw', 'cone', 20, 0.8, 3.5, GOLD, { radius: 3.5 });
mv('diamond_storm', 'Diamond Storm', 'projectile', 9, 1.3, 13, WHITE, { count: 5, speed: 16, radius: 0.4 });
mv('hand_of_fate', 'Hand of Fate', 'beam', 30, 1.8, 14, GOLD, { radius: 1, duration: 0.3 });
mv('howling_blaster', 'Howling Blaster', 'beam', 24, 1.5, 12, BLUE, { radius: 1, duration: 0.3 });
mv('super_shocker', 'Super Shocker', 'area', 18, 2.0, 10, GOLD, { radius: 3, duration: 0.4 });
mv('poison_ivy', 'Poison Ivy', 'cone', 14, 0.9, 4, GREEN, { radius: 4 });

// Boss moves
mv('touch_of_evil', 'Touch of Evil', 'cone', 25, 4.0, 14, DARK, { speed: 22, duration: 0.6 });
mv('dark_network', 'Dark Network', 'projectile', 14, 3.0, 20, DARK, { count: 8, speed: 9, radius: 0.6 });
mv('crimson_lightning', 'Crimson Lightning', 'area', 30, 3.5, 14, RED, { radius: 4, duration: 1.0 });
mv('heat_viper', 'Heat Viper', 'beam', 22, 5.0, 16, FIRE, { radius: 1.2, duration: 2.0 });
mv('trump_sword', 'Trump Sword', 'projectile', 26, 3.0, 22, WHITE, { count: 4, speed: 12, radius: 0.8 });

export const MOVES: Record<string, MoveDef> = Object.fromEntries(list.map(m => [m.id, m]));
export const MOVE_LIST: readonly MoveDef[] = list;
