// GERADO por tools/db/export.ts a partir de db/migrations + db/seeds — não editar à mão.
// Para mudar dados: edite o seed (db/seeds) e rode `npm run db:build`.
import type { AttributeId, BossDef, CardDef, ElementId, EnemyDef, FormDef, ItemDef, MoveDef, PartnerDef } from '../types';

export const MOVES: Record<string, MoveDef> = {
 "baby_flame": {
  "id": "baby_flame",
  "name": "Baby Flame",
  "element": "fire",
  "pattern": "projectile",
  "damage": 10,
  "cooldown": 1,
  "range": 12,
  "radius": 0.5,
  "speed": 14,
  "description": "Cospe uma bola de fogo no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "sharp_claws": {
  "id": "sharp_claws",
  "name": "Sharp Claws",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Arranha os inimigos à frente com garras afiadas em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "spitfire_blast": {
  "id": "spitfire_blast",
  "name": "Spitfire Blast",
  "element": "fire",
  "pattern": "area",
  "damage": 7,
  "cooldown": 2.4,
  "range": 10,
  "radius": 2.5,
  "duration": 0.4,
  "description": "Explode uma rajada de fogo em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "pepper_breath_rain": {
  "id": "pepper_breath_rain",
  "name": "Pepper Breath",
  "element": "fire",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Dispara bolas de fogo contra os inimigos mais próximos.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "mega_flame": {
  "id": "mega_flame",
  "name": "Mega Flame",
  "element": "fire",
  "pattern": "projectile",
  "damage": 16,
  "cooldown": 1.1,
  "range": 13,
  "radius": 0.7,
  "pierce": 1,
  "speed": 15,
  "description": "Lança uma bola de fogo enorme que atravessa os inimigos.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "horn_strike": {
  "id": "horn_strike",
  "name": "Great Horns Attack",
  "element": "neutral",
  "pattern": "cone",
  "damage": 14,
  "cooldown": 0.9,
  "range": 3.5,
  "radius": 3.5,
  "description": "Investe com os chifres num golpe em cone à frente.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "tail_whip": {
  "id": "tail_whip",
  "name": "Tail Whip",
  "element": "neutral",
  "pattern": "aura",
  "damage": 5,
  "cooldown": 0.5,
  "range": 3.2,
  "radius": 3.2,
  "description": "Gira a cauda numa aura contínua que fere quem chega perto.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "giga_destroyer": {
  "id": "giga_destroyer",
  "name": "Giga Destroyer",
  "element": "fire",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 1.4,
  "range": 15,
  "radius": 0.9,
  "count": 2,
  "speed": 13,
  "description": "Dispara mísseis de fogo contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "trident_arm": {
  "id": "trident_arm",
  "name": "Trident Arm",
  "element": "steel",
  "pattern": "beam",
  "damage": 18,
  "cooldown": 1.6,
  "range": 10,
  "radius": 0.8,
  "duration": 0.3,
  "description": "Perfura os inimigos com um raio de aço em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "metal_aura": {
  "id": "metal_aura",
  "name": "Metal Ring",
  "element": "steel",
  "pattern": "orbital",
  "damage": 10,
  "cooldown": 4,
  "range": 3,
  "radius": 3,
  "count": 2,
  "duration": 3,
  "description": "Anéis de metal giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "gaia_force": {
  "id": "gaia_force",
  "name": "Gaia Force",
  "element": "fire",
  "pattern": "area",
  "damage": 60,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Faz uma explosão colossal de fogo em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "brave_tornado": {
  "id": "brave_tornado",
  "name": "Brave Tornado",
  "element": "wind",
  "pattern": "beam",
  "damage": 40,
  "cooldown": 1.8,
  "range": 12,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Dispara um raio giratório de vento em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "great_tornado": {
  "id": "great_tornado",
  "name": "Great Tornado",
  "element": "wind",
  "pattern": "aura",
  "damage": 18,
  "cooldown": 0.6,
  "range": 4,
  "radius": 4,
  "description": "Cria um redemoinho de vento contínuo ao redor do parceiro.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "transcendent_sword": {
  "id": "transcendent_sword",
  "name": "Transcendent Sword",
  "element": "light",
  "pattern": "beam",
  "damage": 90,
  "cooldown": 1.6,
  "range": 16,
  "radius": 1.4,
  "duration": 0.4,
  "description": "Corta os inimigos com um raio de luz em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "supreme_cannon": {
  "id": "supreme_cannon",
  "name": "Supreme Cannon",
  "element": "ice",
  "pattern": "area",
  "damage": 80,
  "cooldown": 2.4,
  "range": 16,
  "radius": 6,
  "duration": 0.5,
  "description": "Dispara um canhão de gelo que explode em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "omni_aura": {
  "id": "omni_aura",
  "name": "Omni Aura",
  "element": "light",
  "pattern": "orbital",
  "damage": 30,
  "cooldown": 4,
  "range": 4,
  "radius": 4,
  "count": 4,
  "duration": 3,
  "description": "Esferas de luz giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "vee_headbutt": {
  "id": "vee_headbutt",
  "name": "Vee Headbutt",
  "element": "neutral",
  "pattern": "cone",
  "damage": 11,
  "cooldown": 0.9,
  "range": 3.2,
  "radius": 3.2,
  "description": "Dá uma cabeçada nos inimigos à frente, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "vee_punch": {
  "id": "vee_punch",
  "name": "Vee Punch",
  "element": "neutral",
  "pattern": "projectile",
  "damage": 7,
  "cooldown": 0.6,
  "range": 7,
  "radius": 0.4,
  "speed": 16,
  "description": "Lança um soco veloz que voa até o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "boom_boom_punch": {
  "id": "boom_boom_punch",
  "name": "Boom Boom Punch",
  "element": "neutral",
  "pattern": "area",
  "damage": 9,
  "cooldown": 2.2,
  "range": 6,
  "radius": 2,
  "duration": 0.3,
  "description": "Soca o alvo mais próximo e fere os inimigos em área à sua volta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "vee_laser": {
  "id": "vee_laser",
  "name": "Vee Laser",
  "element": "light",
  "pattern": "beam",
  "damage": 20,
  "cooldown": 1.4,
  "range": 12,
  "radius": 0.8,
  "duration": 0.3,
  "description": "Atira um raio de luz em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "critical_crunch": {
  "id": "critical_crunch",
  "name": "Critical Crunch",
  "element": "neutral",
  "pattern": "cone",
  "damage": 16,
  "cooldown": 0.9,
  "range": 3.5,
  "radius": 3.5,
  "description": "Morde com força os inimigos à frente, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "x_cross": {
  "id": "x_cross",
  "name": "X-Cross",
  "element": "light",
  "pattern": "projectile",
  "damage": 14,
  "cooldown": 1.2,
  "range": 12,
  "radius": 0.7,
  "pierce": 2,
  "speed": 16,
  "description": "Lança um projétil de luz em forma de X contra o inimigo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "v_breath_arrow": {
  "id": "v_breath_arrow",
  "name": "V-Breath Arrow",
  "element": "fire",
  "pattern": "beam",
  "damage": 22,
  "cooldown": 1.5,
  "range": 12,
  "radius": 0.9,
  "duration": 0.3,
  "description": "Sopra uma flecha de fogo em linha reta, atravessando inimigos.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "magnum_punch": {
  "id": "magnum_punch",
  "name": "Magnum Punch",
  "element": "neutral",
  "pattern": "cone",
  "damage": 18,
  "cooldown": 1,
  "range": 3.5,
  "radius": 3.5,
  "description": "Desfere um soco poderoso nos inimigos à frente, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "v_wing_blade": {
  "id": "v_wing_blade",
  "name": "V-Wing Blade",
  "element": "wind",
  "pattern": "projectile",
  "damage": 18,
  "cooldown": 1.4,
  "range": 14,
  "radius": 0.8,
  "pierce": 3,
  "speed": 18,
  "description": "Lança lâminas de vento no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "dragon_impulse": {
  "id": "dragon_impulse",
  "name": "Dragon Impulse",
  "element": "light",
  "pattern": "beam",
  "damage": 40,
  "cooldown": 1.6,
  "range": 14,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Dispara um raio de luz dracônico em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "aero_v_wing": {
  "id": "aero_v_wing",
  "name": "Aero V-Wing",
  "element": "wind",
  "pattern": "aura",
  "damage": 14,
  "cooldown": 0.5,
  "range": 4,
  "radius": 4,
  "description": "Asas de vento giram numa aura contínua ao redor do parceiro.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "shining_v_force": {
  "id": "shining_v_force",
  "name": "Shining V Force",
  "element": "light",
  "pattern": "beam",
  "damage": 80,
  "cooldown": 1.4,
  "range": 16,
  "radius": 1.4,
  "duration": 0.4,
  "description": "Dispara um raio de luz brilhante em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "ulforce_saber": {
  "id": "ulforce_saber",
  "name": "Ulforce Saber",
  "element": "light",
  "pattern": "orbital",
  "damage": 26,
  "cooldown": 4,
  "range": 3.5,
  "radius": 3.5,
  "count": 3,
  "duration": 3,
  "description": "Lâminas de luz giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "fire_rocket": {
  "id": "fire_rocket",
  "name": "Fire Rocket",
  "element": "fire",
  "pattern": "projectile",
  "damage": 28,
  "cooldown": 1.2,
  "range": 13,
  "radius": 0.9,
  "pierce": 2,
  "speed": 18,
  "description": "Lança um foguete de fogo no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "knuckle_fire": {
  "id": "knuckle_fire",
  "name": "Knuckle Fire",
  "element": "fire",
  "pattern": "projectile",
  "damage": 14,
  "cooldown": 1,
  "range": 12,
  "radius": 0.5,
  "count": 3,
  "speed": 14,
  "description": "Arremessa um soco flamejante contra o inimigo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "blue_thunder": {
  "id": "blue_thunder",
  "name": "Blue Thunder",
  "element": "electric",
  "pattern": "area",
  "damage": 30,
  "cooldown": 1.6,
  "range": 12,
  "radius": 3.5,
  "duration": 0.4,
  "description": "Faz cair um trovão azul em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "lightning_blade": {
  "id": "lightning_blade",
  "name": "Lightning Blade",
  "element": "electric",
  "pattern": "cone",
  "damage": 22,
  "cooldown": 0.9,
  "range": 4,
  "radius": 4,
  "description": "Corta os inimigos à frente com uma lâmina elétrica, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "desperado_blaster": {
  "id": "desperado_blaster",
  "name": "Desperado Blaster",
  "element": "steel",
  "pattern": "projectile",
  "damage": 24,
  "cooldown": 1.2,
  "range": 14,
  "radius": 0.5,
  "count": 4,
  "speed": 17,
  "description": "Atira projéteis de aço contra os inimigos mais próximos.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "sting_strike": {
  "id": "sting_strike",
  "name": "Sting Strike",
  "element": "plant",
  "pattern": "cone",
  "damage": 22,
  "cooldown": 0.9,
  "range": 4,
  "radius": 4,
  "description": "Espeta os inimigos à frente com ferrões, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "positron_laser": {
  "id": "positron_laser",
  "name": "Positron Laser",
  "element": "light",
  "pattern": "beam",
  "damage": 90,
  "cooldown": 1.6,
  "range": 18,
  "radius": 1.5,
  "duration": 0.4,
  "description": "Dispara um raio laser de luz em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "giga_crusher": {
  "id": "giga_crusher",
  "name": "Giga Crusher",
  "element": "light",
  "pattern": "area",
  "damage": 70,
  "cooldown": 2.4,
  "range": 15,
  "radius": 6,
  "duration": 0.5,
  "description": "Faz uma explosão de luz em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "pyro_sphere": {
  "id": "pyro_sphere",
  "name": "Pyro Sphere",
  "element": "fire",
  "pattern": "projectile",
  "damage": 11,
  "cooldown": 1,
  "range": 12,
  "radius": 0.5,
  "speed": 14,
  "description": "Lança uma esfera de fogo no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15216943
 },
 "rock_breaker": {
  "id": "rock_breaker",
  "name": "Rock Breaker",
  "element": "earth",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Quebra rochas num golpe de terra em cone à frente.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "crimson_fang": {
  "id": "crimson_fang",
  "name": "Crimson Fang",
  "element": "neutral",
  "pattern": "orbital",
  "damage": 6,
  "cooldown": 4,
  "range": 2.5,
  "radius": 2.5,
  "count": 1,
  "duration": 3,
  "description": "Presas rubras giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15216943
 },
 "pyro_blaster": {
  "id": "pyro_blaster",
  "name": "Pyro Blaster",
  "element": "fire",
  "pattern": "projectile",
  "damage": 17,
  "cooldown": 1.1,
  "range": 13,
  "radius": 0.7,
  "pierce": 1,
  "speed": 15,
  "description": "Dispara uma rajada de fogo contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15216943
 },
 "dragon_slash": {
  "id": "dragon_slash",
  "name": "Dragon Slash",
  "element": "neutral",
  "pattern": "cone",
  "damage": 15,
  "cooldown": 0.9,
  "range": 4,
  "radius": 4,
  "description": "Corta os inimigos à frente com um golpe dracônico em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "exhaust_flame": {
  "id": "exhaust_flame",
  "name": "Exhaust Flame",
  "element": "fire",
  "pattern": "area",
  "damage": 14,
  "cooldown": 2,
  "range": 10,
  "radius": 3,
  "duration": 0.4,
  "description": "Expele chamas em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15216943
 },
 "atomic_blaster": {
  "id": "atomic_blaster",
  "name": "Atomic Blaster",
  "element": "fire",
  "pattern": "beam",
  "damage": 34,
  "cooldown": 1.6,
  "range": 14,
  "radius": 1.1,
  "duration": 0.4,
  "description": "Dispara um raio atômico de fogo em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15216943
 },
 "radiation_blade": {
  "id": "radiation_blade",
  "name": "Radiation Blade",
  "element": "fire",
  "pattern": "cone",
  "damage": 24,
  "cooldown": 0.9,
  "range": 4.5,
  "radius": 4.5,
  "description": "Fatia os inimigos à frente com uma lâmina de fogo, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "lightning_joust": {
  "id": "lightning_joust",
  "name": "Lightning Joust",
  "element": "light",
  "pattern": "beam",
  "damage": 75,
  "cooldown": 1.4,
  "range": 16,
  "radius": 1.3,
  "duration": 0.4,
  "description": "Atravessa os inimigos com uma lança de luz, em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "royal_saber": {
  "id": "royal_saber",
  "name": "Royal Saber",
  "element": "light",
  "pattern": "area",
  "damage": 70,
  "cooldown": 2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Golpeia com a espada real de luz em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "shield_of_the_just": {
  "id": "shield_of_the_just",
  "name": "Shield of the Just",
  "element": "light",
  "pattern": "aura",
  "damage": 18,
  "cooldown": 0.5,
  "range": 4,
  "radius": 4,
  "description": "Um escudo de luz contínuo ao redor fere quem se aproximar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "petit_fire": {
  "id": "petit_fire",
  "name": "Petit Fire",
  "element": "ice",
  "pattern": "projectile",
  "damage": 10,
  "cooldown": 1,
  "range": 12,
  "radius": 0.5,
  "speed": 14,
  "description": "Cospe uma pequena bola de gelo no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "sticky_net": {
  "id": "sticky_net",
  "name": "Sticky Net",
  "element": "plant",
  "pattern": "projectile",
  "damage": 9,
  "cooldown": 1,
  "range": 11,
  "radius": 0.6,
  "pierce": 1,
  "speed": 12,
  "description": "Lança uma teia pegajosa no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "lightning_paw": {
  "id": "lightning_paw",
  "name": "Lightning Paw",
  "element": "electric",
  "pattern": "cone",
  "damage": 20,
  "cooldown": 0.8,
  "range": 3.5,
  "radius": 3.5,
  "description": "Golpeia os inimigos à frente com a pata elétrica, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "diamond_storm": {
  "id": "diamond_storm",
  "name": "Diamond Storm",
  "element": "ice",
  "pattern": "projectile",
  "damage": 9,
  "cooldown": 1.3,
  "range": 13,
  "radius": 0.4,
  "count": 5,
  "speed": 16,
  "description": "Lança uma saraivada de cristais de gelo nos inimigos.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "hand_of_fate": {
  "id": "hand_of_fate",
  "name": "Hand of Fate",
  "element": "light",
  "pattern": "beam",
  "damage": 30,
  "cooldown": 1.8,
  "range": 14,
  "radius": 1,
  "duration": 0.3,
  "description": "Dispara um raio de luz do destino em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "howling_blaster": {
  "id": "howling_blaster",
  "name": "Howling Blaster",
  "element": "ice",
  "pattern": "beam",
  "damage": 24,
  "cooldown": 1.5,
  "range": 12,
  "radius": 1,
  "duration": 0.3,
  "description": "Uiva um raio de gelo em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "super_shocker": {
  "id": "super_shocker",
  "name": "Super Shocker",
  "element": "electric",
  "pattern": "area",
  "damage": 18,
  "cooldown": 2,
  "range": 10,
  "radius": 3,
  "duration": 0.4,
  "description": "Descarrega choques elétricos em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "poison_ivy": {
  "id": "poison_ivy",
  "name": "Poison Ivy",
  "element": "plant",
  "pattern": "cone",
  "damage": 14,
  "cooldown": 0.9,
  "range": 4,
  "radius": 4,
  "description": "Chicoteia os inimigos à frente com trepadeiras, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "touch_of_evil": {
  "id": "touch_of_evil",
  "name": "Touch of Evil",
  "element": "dark",
  "pattern": "cone",
  "damage": 25,
  "cooldown": 4,
  "range": 14,
  "speed": 22,
  "duration": 0.6,
  "description": "Toca os inimigos à frente com garras sombrias, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 8011007
 },
 "dark_network": {
  "id": "dark_network",
  "name": "Dark Network",
  "element": "dark",
  "pattern": "projectile",
  "damage": 14,
  "cooldown": 3,
  "range": 20,
  "radius": 0.6,
  "count": 8,
  "speed": 9,
  "description": "Lança projéteis sombrios no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 8011007
 },
 "crimson_lightning": {
  "id": "crimson_lightning",
  "name": "Crimson Lightning",
  "element": "dark",
  "pattern": "area",
  "damage": 30,
  "cooldown": 3.5,
  "range": 14,
  "radius": 4,
  "duration": 1,
  "description": "Faz raios rubros de trevas caírem em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15216943
 },
 "heat_viper": {
  "id": "heat_viper",
  "name": "Heat Viper",
  "element": "fire",
  "pattern": "beam",
  "damage": 22,
  "cooldown": 5,
  "range": 16,
  "radius": 1.2,
  "duration": 2,
  "description": "Estica um chicote de fogo em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "trump_sword": {
  "id": "trump_sword",
  "name": "Trump Sword",
  "element": "dark",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 3,
  "range": 22,
  "radius": 0.8,
  "count": 4,
  "speed": 12,
  "description": "Arremessa espadas sombrias contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "little_horn": {
  "id": "little_horn",
  "name": "Little Horn",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Cutuca os inimigos à frente com o chifre, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "frost_breath": {
  "id": "frost_breath",
  "name": "Petit Fire Hook",
  "element": "ice",
  "pattern": "area",
  "damage": 7,
  "cooldown": 2.4,
  "range": 10,
  "radius": 2.5,
  "duration": 0.4,
  "description": "Sopra uma rajada de gelo em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "gabu_tackle": {
  "id": "gabu_tackle",
  "name": "Gabu Tackle",
  "element": "neutral",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Avança em investida contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "fox_fire": {
  "id": "fox_fire",
  "name": "Fox Fire",
  "element": "ice",
  "pattern": "projectile",
  "damage": 16,
  "cooldown": 1.1,
  "range": 13,
  "radius": 0.7,
  "pierce": 1,
  "speed": 15,
  "description": "Lança uma chama gelada no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "slamming_attack": {
  "id": "slamming_attack",
  "name": "Slamming Attack",
  "element": "neutral",
  "pattern": "cone",
  "damage": 14,
  "cooldown": 0.9,
  "range": 3.5,
  "radius": 3.5,
  "description": "Esmaga os inimigos à frente com uma pancada, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "kaiser_nail": {
  "id": "kaiser_nail",
  "name": "Kaiser Nail",
  "element": "ice",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 1.4,
  "range": 15,
  "radius": 0.9,
  "count": 2,
  "speed": 13,
  "description": "Dispara garras de gelo contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "garuru_kick": {
  "id": "garuru_kick",
  "name": "Garuru Kick",
  "element": "neutral",
  "pattern": "beam",
  "damage": 18,
  "cooldown": 1.6,
  "range": 10,
  "radius": 0.8,
  "duration": 0.3,
  "description": "Chuta uma onda de impacto em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "wolf_howl": {
  "id": "wolf_howl",
  "name": "Wolf Howl",
  "element": "ice",
  "pattern": "area",
  "damage": 22,
  "cooldown": 2.2,
  "range": 12,
  "radius": 3.5,
  "duration": 0.4,
  "description": "Uiva e congela o ar, ferindo os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "cocytus_breath": {
  "id": "cocytus_breath",
  "name": "Cocytus Breath",
  "element": "ice",
  "pattern": "area",
  "damage": 60,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Sopra um frio mortal que fere os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "garuru_tomahawk": {
  "id": "garuru_tomahawk",
  "name": "Garuru Tomahawk",
  "element": "ice",
  "pattern": "projectile",
  "damage": 30,
  "cooldown": 1.3,
  "range": 15,
  "radius": 0.9,
  "count": 3,
  "pierce": 2,
  "speed": 15,
  "description": "Arremessa machados de gelo no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "metal_wolf_claw": {
  "id": "metal_wolf_claw",
  "name": "Metal Wolf Claw",
  "element": "ice",
  "pattern": "beam",
  "damage": 40,
  "cooldown": 1.8,
  "range": 12,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Dispara uma garra de gelo em linha reta, atravessando inimigos.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 3836927
 },
 "boom_bubble": {
  "id": "boom_bubble",
  "name": "Boom Bubble",
  "element": "wind",
  "pattern": "projectile",
  "damage": 10,
  "cooldown": 1,
  "range": 12,
  "radius": 0.5,
  "speed": 14,
  "description": "Sopra bolhas explosivas no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 10414335
 },
 "patamon_dive": {
  "id": "patamon_dive",
  "name": "Patamon Dive",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Mergulha sobre os inimigos à frente, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "wing_flap": {
  "id": "wing_flap",
  "name": "Wing Flap",
  "element": "wind",
  "pattern": "area",
  "damage": 7,
  "cooldown": 2.4,
  "range": 10,
  "radius": 2.5,
  "duration": 0.4,
  "description": "Bate as asas e fere os inimigos em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 10414335
 },
 "spiral_bubble": {
  "id": "spiral_bubble",
  "name": "Spiral Bubble",
  "element": "wind",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Lança bolhas giratórias de vento no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 10414335
 },
 "angel_rod": {
  "id": "angel_rod",
  "name": "Angel Rod",
  "element": "light",
  "pattern": "cone",
  "damage": 14,
  "cooldown": 0.9,
  "range": 3.5,
  "radius": 3.5,
  "description": "Golpeia os inimigos à frente com o cajado, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "holy_aura": {
  "id": "holy_aura",
  "name": "Holy Aura",
  "element": "light",
  "pattern": "aura",
  "damage": 5,
  "cooldown": 0.5,
  "range": 3.2,
  "radius": 3.2,
  "description": "Uma aura sagrada contínua ao redor fere quem se aproximar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "gate_of_destiny": {
  "id": "gate_of_destiny",
  "name": "Gate of Destiny",
  "element": "light",
  "pattern": "area",
  "damage": 22,
  "cooldown": 2.2,
  "range": 12,
  "radius": 3.5,
  "duration": 0.4,
  "description": "Abre um portal de luz que fere os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "excalibur": {
  "id": "excalibur",
  "name": "Excalibur",
  "element": "light",
  "pattern": "beam",
  "damage": 18,
  "cooldown": 1.6,
  "range": 10,
  "radius": 0.8,
  "duration": 0.3,
  "description": "Corta os inimigos com um raio da espada sagrada, em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "holy_ring": {
  "id": "holy_ring",
  "name": "Holy Ring",
  "element": "light",
  "pattern": "orbital",
  "damage": 10,
  "cooldown": 4,
  "range": 3,
  "radius": 3,
  "count": 2,
  "duration": 3,
  "description": "Anéis sagrados giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "seven_heavens": {
  "id": "seven_heavens",
  "name": "Seven Heavens",
  "element": "light",
  "pattern": "orbital",
  "damage": 30,
  "cooldown": 4,
  "range": 4,
  "radius": 4,
  "count": 4,
  "duration": 3,
  "description": "Sete esferas de luz giram ao redor do parceiro.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "strike_of_seven_stars": {
  "id": "strike_of_seven_stars",
  "name": "Strike of the Seven Stars",
  "element": "light",
  "pattern": "projectile",
  "damage": 30,
  "cooldown": 1.3,
  "range": 15,
  "radius": 0.9,
  "count": 3,
  "pierce": 2,
  "speed": 15,
  "description": "Lança estrelas de luz contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "testament": {
  "id": "testament",
  "name": "Testament",
  "element": "light",
  "pattern": "area",
  "damage": 60,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Faz uma explosão de luz sagrada em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "double_punch": {
  "id": "double_punch",
  "name": "Double Punch",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Soca duas vezes os inimigos à frente, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "static_spark": {
  "id": "static_spark",
  "name": "Static Spark",
  "element": "electric",
  "pattern": "area",
  "damage": 7,
  "cooldown": 2.4,
  "range": 10,
  "radius": 2.5,
  "duration": 0.4,
  "description": "Solta faíscas elétricas em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "beetle_buzz": {
  "id": "beetle_buzz",
  "name": "Beetle Buzz",
  "element": "electric",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Dispara faíscas elétricas no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "electro_shocker": {
  "id": "electro_shocker",
  "name": "Electro Shocker",
  "element": "electric",
  "pattern": "projectile",
  "damage": 16,
  "cooldown": 1.1,
  "range": 13,
  "radius": 0.7,
  "pierce": 1,
  "speed": 15,
  "description": "Atira uma descarga elétrica no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "beetle_horn": {
  "id": "beetle_horn",
  "name": "Beetle Horn",
  "element": "neutral",
  "pattern": "cone",
  "damage": 14,
  "cooldown": 0.9,
  "range": 3.5,
  "radius": 3.5,
  "description": "Espeta os inimigos à frente com o chifre, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "horn_buster": {
  "id": "horn_buster",
  "name": "Horn Buster",
  "element": "electric",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 1.4,
  "range": 15,
  "radius": 0.9,
  "count": 2,
  "speed": 13,
  "description": "Dispara uma rajada elétrica do chifre contra o inimigo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "electro_beam": {
  "id": "electro_beam",
  "name": "Electro Beam",
  "element": "electric",
  "pattern": "beam",
  "damage": 18,
  "cooldown": 1.6,
  "range": 10,
  "radius": 0.8,
  "duration": 0.3,
  "description": "Dispara um raio elétrico em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "thunder_ring": {
  "id": "thunder_ring",
  "name": "Thunder Ring",
  "element": "electric",
  "pattern": "orbital",
  "damage": 10,
  "cooldown": 4,
  "range": 3,
  "radius": 3,
  "count": 2,
  "duration": 3,
  "description": "Anéis de raios giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "giga_blaster": {
  "id": "giga_blaster",
  "name": "Giga Blaster",
  "element": "electric",
  "pattern": "area",
  "damage": 60,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Faz uma explosão elétrica gigante em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "high_electro_shocker": {
  "id": "high_electro_shocker",
  "name": "High Electro Shocker",
  "element": "electric",
  "pattern": "beam",
  "damage": 40,
  "cooldown": 1.8,
  "range": 12,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Dispara um raio elétrico potente em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "mega_electro_shocker": {
  "id": "mega_electro_shocker",
  "name": "Mega Electro Shocker",
  "element": "electric",
  "pattern": "projectile",
  "damage": 30,
  "cooldown": 1.3,
  "range": 15,
  "radius": 0.9,
  "count": 3,
  "pierce": 2,
  "speed": 15,
  "description": "Atira uma enorme descarga elétrica no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16771146
 },
 "puppy_howl": {
  "id": "puppy_howl",
  "name": "Puppy Howl",
  "element": "light",
  "pattern": "projectile",
  "damage": 10,
  "cooldown": 1,
  "range": 12,
  "radius": 0.5,
  "speed": 14,
  "description": "Uiva uma onda de luz contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "puppy_claw": {
  "id": "puppy_claw",
  "name": "Puppy Claw",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Arranha os inimigos à frente com as garras, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "holy_bark": {
  "id": "holy_bark",
  "name": "Holy Bark",
  "element": "light",
  "pattern": "area",
  "damage": 7,
  "cooldown": 2.4,
  "range": 10,
  "radius": 2.5,
  "duration": 0.4,
  "description": "Late e solta uma onda de luz em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "salamon_rush": {
  "id": "salamon_rush",
  "name": "Salamon Rush",
  "element": "neutral",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Avança em investida contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "cats_eye": {
  "id": "cats_eye",
  "name": "Cat's Eye",
  "element": "light",
  "pattern": "area",
  "damage": 12,
  "cooldown": 2.2,
  "range": 11,
  "radius": 3,
  "duration": 0.4,
  "description": "Brilha com o olho de gato e fere os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "neko_punch": {
  "id": "neko_punch",
  "name": "Neko Punch",
  "element": "neutral",
  "pattern": "cone",
  "damage": 14,
  "cooldown": 0.9,
  "range": 3.5,
  "radius": 3.5,
  "description": "Soca com a pata felina os inimigos à frente, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "celestial_arrow": {
  "id": "celestial_arrow",
  "name": "Celestial Arrow",
  "element": "light",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 1.4,
  "range": 15,
  "radius": 0.9,
  "count": 2,
  "speed": 13,
  "description": "Dispara flechas celestiais contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "heavens_charm": {
  "id": "heavens_charm",
  "name": "Heaven's Charm",
  "element": "light",
  "pattern": "orbital",
  "damage": 10,
  "cooldown": 4,
  "range": 3,
  "radius": 3,
  "count": 2,
  "duration": 3,
  "description": "Amuletos de luz giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "holy_arrow_rain": {
  "id": "holy_arrow_rain",
  "name": "Holy Arrow Rain",
  "element": "light",
  "pattern": "area",
  "damage": 22,
  "cooldown": 2.2,
  "range": 12,
  "radius": 3.5,
  "duration": 0.4,
  "description": "Faz chover flechas sagradas em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "eden_javelin": {
  "id": "eden_javelin",
  "name": "Eden's Javelin",
  "element": "light",
  "pattern": "beam",
  "damage": 40,
  "cooldown": 1.8,
  "range": 12,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Arremessa uma lança de luz em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "sefirot_crystal": {
  "id": "sefirot_crystal",
  "name": "Sefirot Crystal",
  "element": "light",
  "pattern": "projectile",
  "damage": 30,
  "cooldown": 1.3,
  "range": 15,
  "radius": 0.9,
  "count": 3,
  "pierce": 2,
  "speed": 15,
  "description": "Lança cristais de luz no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "holy_halo": {
  "id": "holy_halo",
  "name": "Holy Halo",
  "element": "light",
  "pattern": "orbital",
  "damage": 30,
  "cooldown": 4,
  "range": 4,
  "radius": 4,
  "count": 4,
  "duration": 3,
  "description": "Auréolas de luz giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "silk_thread": {
  "id": "silk_thread",
  "name": "Silk Thread",
  "element": "plant",
  "pattern": "area",
  "damage": 7,
  "cooldown": 2.4,
  "range": 10,
  "radius": 2.5,
  "duration": 0.4,
  "description": "Lança fios de seda que ferem os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "worm_tackle": {
  "id": "worm_tackle",
  "name": "Worm Tackle",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Investe contra os inimigos à frente, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "leaf_rain": {
  "id": "leaf_rain",
  "name": "Leaf Rain",
  "element": "plant",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Dispara uma chuva de folhas no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "spiking_strike": {
  "id": "spiking_strike",
  "name": "Spiking Strike",
  "element": "neutral",
  "pattern": "cone",
  "damage": 14,
  "cooldown": 0.9,
  "range": 3.5,
  "radius": 3.5,
  "description": "Perfura os inimigos à frente com espinhos, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "moon_shooter": {
  "id": "moon_shooter",
  "name": "Moon Shooter",
  "element": "plant",
  "pattern": "area",
  "damage": 12,
  "cooldown": 2.2,
  "range": 11,
  "radius": 3,
  "duration": 0.4,
  "description": "Faz uma explosão de pólen lunar em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "spiking_finish": {
  "id": "spiking_finish",
  "name": "Spiking Finish",
  "element": "plant",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 1.4,
  "range": 15,
  "radius": 0.9,
  "count": 2,
  "speed": 13,
  "description": "Lança um espinho letal no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "jewel_sting": {
  "id": "jewel_sting",
  "name": "Jewel Sting",
  "element": "plant",
  "pattern": "beam",
  "damage": 18,
  "cooldown": 1.6,
  "range": 10,
  "radius": 0.8,
  "duration": 0.3,
  "description": "Dispara um ferrão de joia em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "royal_swarm": {
  "id": "royal_swarm",
  "name": "Royal Swarm",
  "element": "plant",
  "pattern": "orbital",
  "damage": 10,
  "cooldown": 4,
  "range": 3,
  "radius": 3,
  "count": 2,
  "duration": 3,
  "description": "Um enxame real gira ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6280031
 },
 "dimension_scissor": {
  "id": "dimension_scissor",
  "name": "Dimension Scissor",
  "element": "dark",
  "pattern": "beam",
  "damage": 40,
  "cooldown": 1.8,
  "range": 12,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Corta o espaço com um raio sombrio em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 8011007
 },
 "grand_scissor": {
  "id": "grand_scissor",
  "name": "Grand Scissor",
  "element": "dark",
  "pattern": "area",
  "damage": 60,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Faz tesouras sombrias cortarem em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 8011007
 },
 "dark_insect_swarm": {
  "id": "dark_insect_swarm",
  "name": "Dark Insect Swarm",
  "element": "dark",
  "pattern": "orbital",
  "damage": 30,
  "cooldown": 4,
  "range": 4,
  "radius": 4,
  "count": 4,
  "duration": 3,
  "description": "Um enxame sombrio gira ao redor do parceiro.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 8011007
 },
 "diamond_shell": {
  "id": "diamond_shell",
  "name": "Diamond Shell",
  "element": "earth",
  "pattern": "projectile",
  "damage": 10,
  "cooldown": 1,
  "range": 12,
  "radius": 0.5,
  "speed": 14,
  "description": "Arremessa fragmentos de carapaça no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12618314
 },
 "rolling_upper": {
  "id": "rolling_upper",
  "name": "Rolling Upper",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Dá um golpe ascendente nos inimigos à frente, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "mud_ball": {
  "id": "mud_ball",
  "name": "Mud Ball",
  "element": "earth",
  "pattern": "area",
  "damage": 7,
  "cooldown": 2.4,
  "range": 10,
  "radius": 2.5,
  "duration": 0.4,
  "description": "Lança lama que explode em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12618314
 },
 "armor_roll": {
  "id": "armor_roll",
  "name": "Armor Roll",
  "element": "earth",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Rola a armadura contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12618314
 },
 "tail_hammer": {
  "id": "tail_hammer",
  "name": "Tail Hammer",
  "element": "earth",
  "pattern": "projectile",
  "damage": 16,
  "cooldown": 1.1,
  "range": 13,
  "radius": 0.7,
  "pierce": 1,
  "speed": 15,
  "description": "Lança uma martelada de terra contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12618314
 },
 "megaton_press": {
  "id": "megaton_press",
  "name": "Megaton Press",
  "element": "earth",
  "pattern": "area",
  "damage": 12,
  "cooldown": 2.2,
  "range": 11,
  "radius": 3,
  "duration": 0.4,
  "description": "Esmaga o chão e fere os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12618314
 },
 "kachina_bombs": {
  "id": "kachina_bombs",
  "name": "Kachina Bombs",
  "element": "earth",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 1.4,
  "range": 15,
  "radius": 0.9,
  "count": 2,
  "speed": 13,
  "description": "Lança bombas de terra no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12618314
 },
 "justice_beam": {
  "id": "justice_beam",
  "name": "Justice Beam",
  "element": "light",
  "pattern": "beam",
  "damage": 18,
  "cooldown": 1.6,
  "range": 10,
  "radius": 0.8,
  "duration": 0.3,
  "description": "Dispara um raio de luz da justiça em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "harmony_ring": {
  "id": "harmony_ring",
  "name": "Harmony Ring",
  "element": "earth",
  "pattern": "orbital",
  "damage": 10,
  "cooldown": 4,
  "range": 3,
  "radius": 3,
  "count": 2,
  "duration": 3,
  "description": "Anéis de terra giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12618314
 },
 "strike_of_the_blade": {
  "id": "strike_of_the_blade",
  "name": "Strike of the Blade",
  "element": "steel",
  "pattern": "beam",
  "damage": 40,
  "cooldown": 1.8,
  "range": 12,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Corta com um raio de lâmina de aço em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12109008
 },
 "heavenly_blade": {
  "id": "heavenly_blade",
  "name": "Heavenly Blade",
  "element": "steel",
  "pattern": "area",
  "damage": 60,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Gira lâminas de aço que ferem os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12109008
 },
 "metal_wing_rain": {
  "id": "metal_wing_rain",
  "name": "Metal Wing Rain",
  "element": "steel",
  "pattern": "projectile",
  "damage": 30,
  "cooldown": 1.3,
  "range": 15,
  "radius": 0.9,
  "count": 3,
  "pierce": 2,
  "speed": 15,
  "description": "Dispara penas de metal contra o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12109008
 },
 "bunny_blast": {
  "id": "bunny_blast",
  "name": "Bunny Blast",
  "element": "wind",
  "pattern": "projectile",
  "damage": 10,
  "cooldown": 1,
  "range": 12,
  "radius": 0.5,
  "speed": 14,
  "description": "Dispara uma rajada de vento no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 10414335
 },
 "terrier_tornado": {
  "id": "terrier_tornado",
  "name": "Terrier Tornado",
  "element": "wind",
  "pattern": "area",
  "damage": 7,
  "cooldown": 2.4,
  "range": 10,
  "radius": 2.5,
  "duration": 0.4,
  "description": "Cria um tornado que fere os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 10414335
 },
 "bunny_pummel": {
  "id": "bunny_pummel",
  "name": "Bunny Pummel",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Golpeia os inimigos à frente com socos, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "ear_spin": {
  "id": "ear_spin",
  "name": "Ear Spin",
  "element": "wind",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Gira as orelhas e lança vento no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 10414335
 },
 "gargo_laser": {
  "id": "gargo_laser",
  "name": "Gargo Laser",
  "element": "steel",
  "pattern": "projectile",
  "damage": 16,
  "cooldown": 1.1,
  "range": 13,
  "radius": 0.7,
  "pierce": 1,
  "speed": 15,
  "description": "Atira um laser de aço no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12109008
 },
 "gargo_pellets": {
  "id": "gargo_pellets",
  "name": "Gargo Pellets",
  "element": "steel",
  "pattern": "area",
  "damage": 12,
  "cooldown": 2.2,
  "range": 11,
  "radius": 3,
  "duration": 0.4,
  "description": "Dispara balas de aço em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12109008
 },
 "tri_beam": {
  "id": "tri_beam",
  "name": "Tri-Beam",
  "element": "light",
  "pattern": "beam",
  "damage": 18,
  "cooldown": 1.6,
  "range": 10,
  "radius": 0.8,
  "duration": 0.3,
  "description": "Dispara um raio triplo de luz em linha reta.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "rapid_fire": {
  "id": "rapid_fire",
  "name": "Rapid Fire",
  "element": "steel",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 1.4,
  "range": 15,
  "radius": 0.9,
  "count": 2,
  "speed": 13,
  "description": "Metralha o inimigo mais próximo com projéteis de aço.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12109008
 },
 "golden_tri_ring": {
  "id": "golden_tri_ring",
  "name": "Golden Tri-Ring",
  "element": "light",
  "pattern": "orbital",
  "damage": 10,
  "cooldown": 4,
  "range": 3,
  "radius": 3,
  "count": 2,
  "duration": 3,
  "description": "Anéis dourados de luz giram ao redor do parceiro.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "mega_barrage": {
  "id": "mega_barrage",
  "name": "Mega Barrage",
  "element": "steel",
  "pattern": "projectile",
  "damage": 30,
  "cooldown": 1.3,
  "range": 15,
  "radius": 0.9,
  "count": 3,
  "pierce": 2,
  "speed": 15,
  "description": "Despeja uma saraivada de projéteis de aço no inimigo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12109008
 },
 "gargo_missiles": {
  "id": "gargo_missiles",
  "name": "Gargo Missiles",
  "element": "steel",
  "pattern": "area",
  "damage": 60,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Lança mísseis de aço que explodem em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 12109008
 },
 "power_pummel": {
  "id": "power_pummel",
  "name": "Power Pummel",
  "element": "neutral",
  "pattern": "beam",
  "damage": 40,
  "cooldown": 1.8,
  "range": 12,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Desfere um golpe potente em linha reta à frente.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "power_paw": {
  "id": "power_paw",
  "name": "Power Paw",
  "element": "neutral",
  "pattern": "cone",
  "damage": 8,
  "cooldown": 0.8,
  "range": 3,
  "radius": 3,
  "description": "Golpeia os inimigos à frente com a pata, em cone.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "fox_kick": {
  "id": "fox_kick",
  "name": "Fox Kick",
  "element": "neutral",
  "pattern": "projectile",
  "damage": 6,
  "cooldown": 1.8,
  "range": 12,
  "radius": 0.4,
  "count": 3,
  "speed": 13,
  "description": "Chuta uma onda de impacto no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 15922943
 },
 "fox_tail_inferno": {
  "id": "fox_tail_inferno",
  "name": "Fox Tail Inferno",
  "element": "fire",
  "pattern": "projectile",
  "damage": 16,
  "cooldown": 1.1,
  "range": 13,
  "radius": 0.7,
  "pierce": 1,
  "speed": 15,
  "description": "Lança chamas das caudas de raposa no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "dragon_wheel": {
  "id": "dragon_wheel",
  "name": "Dragon Wheel",
  "element": "fire",
  "pattern": "area",
  "damage": 12,
  "cooldown": 2.2,
  "range": 11,
  "radius": 3,
  "duration": 0.4,
  "description": "Gira uma roda de fogo que fere os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "talisman_of_light": {
  "id": "talisman_of_light",
  "name": "Talisman of Light",
  "element": "light",
  "pattern": "projectile",
  "damage": 26,
  "cooldown": 1.4,
  "range": 15,
  "radius": 0.9,
  "count": 2,
  "speed": 13,
  "description": "Lança talismãs de luz no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "thousand_spells": {
  "id": "thousand_spells",
  "name": "Thousand Spells",
  "element": "light",
  "pattern": "area",
  "damage": 22,
  "cooldown": 2.2,
  "range": 12,
  "radius": 3.5,
  "duration": 0.4,
  "description": "Libera mil feitiços de luz em área sobre o inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "talisman_spell": {
  "id": "talisman_spell",
  "name": "Talisman Spell",
  "element": "light",
  "pattern": "orbital",
  "damage": 10,
  "cooldown": 4,
  "range": 3,
  "radius": 3,
  "count": 2,
  "duration": 3,
  "description": "Talismãs de luz giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "amethyst_wind": {
  "id": "amethyst_wind",
  "name": "Amethyst Wind",
  "element": "wind",
  "pattern": "area",
  "damage": 60,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Levanta um vento de ametista que fere os inimigos em área sobre o alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 10414335
 },
 "spirit_strike": {
  "id": "spirit_strike",
  "name": "Spirit Strike",
  "element": "light",
  "pattern": "projectile",
  "damage": 30,
  "cooldown": 1.3,
  "range": 15,
  "radius": 0.9,
  "count": 3,
  "pierce": 2,
  "speed": 15,
  "description": "Lança um golpe espiritual de luz no inimigo mais próximo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "crystal_sphere": {
  "id": "crystal_sphere",
  "name": "Crystal Sphere",
  "element": "light",
  "pattern": "orbital",
  "damage": 30,
  "cooldown": 4,
  "range": 4,
  "radius": 4,
  "count": 4,
  "duration": 3,
  "description": "Esferas de cristal giram ao redor do parceiro, ferindo quem tocar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16767050
 },
 "ground_zero": {
  "id": "ground_zero",
  "name": "Ground Zero",
  "element": "dark",
  "pattern": "projectile",
  "damage": 32,
  "cooldown": 1.4,
  "range": 16,
  "radius": 1,
  "count": 1,
  "pierce": 4,
  "speed": 12,
  "description": "Dispara um míssil orgânico que atravessa vários inimigos em linha.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 10181046
 },
 "black_tornado": {
  "id": "black_tornado",
  "name": "Black Tornado",
  "element": "dark",
  "pattern": "beam",
  "damage": 42,
  "cooldown": 1.8,
  "range": 12,
  "radius": 1.2,
  "duration": 0.4,
  "description": "Gira como um tornado negro e perfura os inimigos à frente.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 4934507
 },
 "black_gaia_force": {
  "id": "black_gaia_force",
  "name": "Black Gaia Force",
  "element": "dark",
  "pattern": "area",
  "damage": 64,
  "cooldown": 2.2,
  "range": 14,
  "radius": 5,
  "duration": 0.5,
  "description": "Lança uma esfera de energia negra que explode em grande área.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 6950317
 },
 "megiddo_flame": {
  "id": "megiddo_flame",
  "name": "Megiddo Flame",
  "element": "dark",
  "pattern": "area",
  "damage": 72,
  "cooldown": 2.4,
  "range": 15,
  "radius": 5.5,
  "duration": 0.6,
  "description": "Chamas do apocalipse incineram uma grande área ao redor do alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 11735598
 },
 "hell_howling": {
  "id": "hell_howling",
  "name": "Hell Howling",
  "element": "dark",
  "pattern": "aura",
  "damage": 20,
  "cooldown": 0.6,
  "range": 4.5,
  "radius": 4.5,
  "description": "Um rugido infernal contínuo fere quem se aproximar.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 8024096
 },
 "dramon_breaker": {
  "id": "dramon_breaker",
  "name": "Dramon Breaker",
  "element": "fire",
  "pattern": "beam",
  "damage": 100,
  "cooldown": 1.6,
  "range": 16,
  "radius": 1.5,
  "duration": 0.4,
  "description": "Um golpe da espada-lança corta tudo numa linha à frente.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16752672
 },
 "trident_gaia": {
  "id": "trident_gaia",
  "name": "Trident Gaia",
  "element": "fire",
  "pattern": "area",
  "damage": 85,
  "cooldown": 2.4,
  "range": 15,
  "radius": 6,
  "duration": 0.6,
  "description": "Uma rajada de energia explode em grande área ao redor do alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16742938
 },
 "omega_blade": {
  "id": "omega_blade",
  "name": "Omega Blade",
  "element": "light",
  "pattern": "beam",
  "damage": 120,
  "cooldown": 1.6,
  "range": 18,
  "radius": 1.6,
  "duration": 0.4,
  "description": "A espada do Omnimon corta tudo numa linha longa à frente.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16777164
 },
 "extreme_jihad": {
  "id": "extreme_jihad",
  "name": "Extreme Jihad",
  "element": "light",
  "pattern": "area",
  "damage": 48,
  "cooldown": 2,
  "range": 12,
  "radius": 5,
  "duration": 0.5,
  "description": "Uma explosão de luz dourada atinge uma grande área ao redor do alvo.",
  "maxLevel": 5,
  "perLevel": {
   "damage": 1.25,
   "cooldown": 0.92
  },
  "color": 16766720
 }
};
export const FORMS: Record<string, FormDef> = {
 "agumon": {
  "id": "agumon",
  "name": "Agumon",
  "stage": "child",
  "line": "agumon",
  "attribute": "vaccine",
  "element": "fire",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 10,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "baby_flame",
  "kit": [
   "sharp_claws",
   "spitfire_blast",
   "pepper_breath_rain"
  ],
  "evolutions": [
   {
    "to": "greymon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "atk": 14
     }
    }
   }
  ],
  "size": 1,
  "color": 16751150
 },
 "greymon": {
  "id": "greymon",
  "name": "Greymon",
  "stage": "adult",
  "line": "agumon",
  "attribute": "vaccine",
  "element": "fire",
  "baseStats": {
   "hp": 140,
   "atk": 20,
   "def": 15,
   "spd": 11,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "mega_flame",
  "kit": [
   "horn_strike",
   "tail_whip",
   "spitfire_blast"
  ],
  "evolutions": [
   {
    "to": "metalgreymon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 30,
      "def": 22
     }
    }
   },
   {
    "to": "skullgreymon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 38
     },
     "minNearDeaths": 3
    }
   }
  ],
  "size": 1.5,
  "color": 16747038
 },
 "metalgreymon": {
  "id": "metalgreymon",
  "name": "MetalGreymon",
  "stage": "perfect",
  "line": "agumon",
  "attribute": "vaccine",
  "element": "fire",
  "baseStats": {
   "hp": 250,
   "atk": 34,
   "def": 28,
   "spd": 22,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "giga_destroyer",
  "kit": [
   "trident_arm",
   "metal_aura",
   "horn_strike"
  ],
  "evolutions": [
   {
    "to": "wargreymon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "atk": 55
     }
    }
   }
  ],
  "size": 1.9,
  "color": 14185514
 },
 "wargreymon": {
  "id": "wargreymon",
  "name": "WarGreymon",
  "stage": "ultimate",
  "line": "agumon",
  "attribute": "vaccine",
  "element": "fire",
  "baseStats": {
   "hp": 380,
   "atk": 55,
   "def": 42,
   "spd": 34,
   "brain": 32
  },
  "growthRate": 0.005,
  "signature": "gaia_force",
  "kit": [
   "brave_tornado",
   "great_tornado",
   "trident_arm"
  ],
  "evolutions": [
   {
    "to": "omnimon",
    "req": {
     "minLevel": 42,
     "items": [
      "fusion_garurumon"
     ],
     "unlocked": [
      "gabumon"
     ]
    }
   },
   {
    "to": "victorygreymon",
    "req": {
     "minLevel": 50,
     "requiresMaturity": true
    }
   }
  ],
  "size": 2.2,
  "color": 16756768
 },
 "omnimon": {
  "id": "omnimon",
  "name": "Omnimon",
  "stage": "ultimate",
  "line": "agumon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 475,
   "atk": 68.75,
   "def": 52.5,
   "spd": 42.5,
   "brain": 40
  },
  "growthRate": 0.005,
  "signature": "transcendent_sword",
  "kit": [
   "supreme_cannon",
   "omni_aura",
   "brave_tornado"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 16053503
 },
 "veemon": {
  "id": "veemon",
  "name": "Veemon",
  "stage": "child",
  "line": "veemon",
  "attribute": "free",
  "element": "light",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 10,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "vee_headbutt",
  "kit": [
   "vee_punch",
   "boom_boom_punch",
   "x_cross"
  ],
  "evolutions": [
   {
    "to": "exveemon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "spd": 14
     }
    }
   },
   {
    "to": "veedramon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "atk": 14,
      "def": 12
     }
    }
   },
   {
    "to": "flamedramon",
    "req": {
     "minLevel": 5,
     "items": [
      "digiegg_courage"
     ],
     "requiresMaturity": true
    }
   },
   {
    "to": "raidramon",
    "req": {
     "minLevel": 5,
     "items": [
      "digiegg_friendship"
     ],
     "requiresMaturity": true
    }
   },
   {
    "to": "magnamon",
    "req": {
     "minLevel": 12,
     "items": [
      "digiegg_miracles"
     ],
     "requiresMaturity": true
    }
   }
  ],
  "size": 1,
  "color": 3832831
 },
 "exveemon": {
  "id": "exveemon",
  "name": "ExVeemon",
  "stage": "adult",
  "line": "veemon",
  "attribute": "free",
  "element": "light",
  "baseStats": {
   "hp": 120,
   "atk": 18,
   "def": 13,
   "spd": 17,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "vee_laser",
  "kit": [
   "critical_crunch",
   "x_cross",
   "vee_punch"
  ],
  "evolutions": [
   {
    "to": "paildramon",
    "req": {
     "minLevel": 22,
     "items": [
      "fusion_stingmon"
     ],
     "unlocked": [
      "wormmon"
     ]
    }
   }
  ],
  "size": 1.5,
  "color": 4885503
 },
 "veedramon": {
  "id": "veedramon",
  "name": "Veedramon",
  "stage": "adult",
  "line": "veemon",
  "attribute": "vaccine",
  "element": "wind",
  "baseStats": {
   "hp": 120,
   "atk": 19,
   "def": 17,
   "spd": 13,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "v_breath_arrow",
  "kit": [
   "magnum_punch",
   "boom_boom_punch",
   "x_cross"
  ],
  "evolutions": [
   {
    "to": "aeroveedramon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 28,
      "spd": 24
     }
    }
   }
  ],
  "size": 1.5,
  "color": 2780136
 },
 "aeroveedramon": {
  "id": "aeroveedramon",
  "name": "AeroVeedramon",
  "stage": "perfect",
  "line": "veemon",
  "attribute": "vaccine",
  "element": "wind",
  "baseStats": {
   "hp": 220,
   "atk": 32,
   "def": 26,
   "spd": 28,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "dragon_impulse",
  "kit": [
   "v_wing_blade",
   "aero_v_wing",
   "magnum_punch"
  ],
  "evolutions": [
   {
    "to": "ulforceveedramon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "spd": 50
     }
    }
   }
  ],
  "size": 1.9,
  "color": 3898608
 },
 "ulforceveedramon": {
  "id": "ulforceveedramon",
  "name": "UlforceVeedramon",
  "stage": "ultimate",
  "line": "veemon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 380,
   "atk": 55,
   "def": 38,
   "spd": 42,
   "brain": 32
  },
  "growthRate": 0.005,
  "signature": "shining_v_force",
  "kit": [
   "ulforce_saber",
   "v_wing_blade",
   "aero_v_wing"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 3120127
 },
 "flamedramon": {
  "id": "flamedramon",
  "name": "Flamedramon",
  "stage": "adult",
  "line": "veemon",
  "attribute": "free",
  "element": "fire",
  "baseStats": {
   "hp": 220,
   "atk": 32,
   "def": 26,
   "spd": 24,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "fire_rocket",
  "kit": [
   "knuckle_fire",
   "critical_crunch",
   "boom_boom_punch"
  ],
  "evolutions": [],
  "size": 1.5,
  "color": 16734762
 },
 "raidramon": {
  "id": "raidramon",
  "name": "Raidramon",
  "stage": "adult",
  "line": "veemon",
  "attribute": "free",
  "element": "electric",
  "baseStats": {
   "hp": 220,
   "atk": 32,
   "def": 26,
   "spd": 28,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "blue_thunder",
  "kit": [
   "lightning_blade",
   "x_cross",
   "vee_punch"
  ],
  "evolutions": [],
  "size": 1.5,
  "color": 2764618
 },
 "paildramon": {
  "id": "paildramon",
  "name": "Paildramon",
  "stage": "perfect",
  "line": "veemon",
  "attribute": "free",
  "element": "wind",
  "baseStats": {
   "hp": 240,
   "atk": 35,
   "def": 26,
   "spd": 24,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "desperado_blaster",
  "kit": [
   "sting_strike",
   "x_cross",
   "critical_crunch"
  ],
  "evolutions": [
   {
    "to": "imperialdramon_fm",
    "req": {
     "minLevel": 38,
     "minStats": {
      "atk": 55
     }
    }
   }
  ],
  "size": 1.9,
  "color": 2776024
 },
 "imperialdramon_fm": {
  "id": "imperialdramon_fm",
  "name": "Imperialdramon FM",
  "stage": "ultimate",
  "line": "veemon",
  "attribute": "free",
  "element": "light",
  "baseStats": {
   "hp": 475,
   "atk": 68.75,
   "def": 52.5,
   "spd": 42.5,
   "brain": 40
  },
  "growthRate": 0.005,
  "signature": "positron_laser",
  "kit": [
   "giga_crusher",
   "desperado_blaster",
   "sting_strike"
  ],
  "evolutions": [
   {
    "to": "imperialdramon_pm",
    "req": {
     "minLevel": 45,
     "items": [
      "sword_omnimon"
     ]
    }
   }
  ],
  "size": 2.2,
  "color": 1720232
 },
 "guilmon": {
  "id": "guilmon",
  "name": "Guilmon",
  "stage": "child",
  "line": "guilmon",
  "attribute": "virus",
  "element": "fire",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 10,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "pyro_sphere",
  "kit": [
   "rock_breaker",
   "crimson_fang",
   "spitfire_blast"
  ],
  "evolutions": [
   {
    "to": "growlmon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "atk": 13
     }
    }
   }
  ],
  "size": 1,
  "color": 15216943
 },
 "growlmon": {
  "id": "growlmon",
  "name": "Growlmon",
  "stage": "adult",
  "line": "guilmon",
  "attribute": "virus",
  "element": "fire",
  "baseStats": {
   "hp": 130,
   "atk": 20,
   "def": 15,
   "spd": 13,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "pyro_blaster",
  "kit": [
   "dragon_slash",
   "exhaust_flame",
   "crimson_fang"
  ],
  "evolutions": [
   {
    "to": "wargrowlmon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 28,
      "brain": 18
     }
    }
   },
   {
    "to": "blackwargrowlmon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 34
     },
     "minNearDeaths": 3
    }
   }
  ],
  "size": 1.5,
  "color": 14166570
 },
 "wargrowlmon": {
  "id": "wargrowlmon",
  "name": "WarGrowlmon",
  "stage": "perfect",
  "line": "guilmon",
  "attribute": "virus",
  "element": "fire",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 28,
   "spd": 24,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "atomic_blaster",
  "kit": [
   "radiation_blade",
   "exhaust_flame",
   "dragon_slash"
  ],
  "evolutions": [
   {
    "to": "gallantmon",
    "req": {
     "minLevel": 35,
     "items": [
      "blue_card"
     ]
    }
   },
   {
    "to": "megidramon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "atk": 60
     },
     "minNearDeaths": 12
    }
   }
  ],
  "size": 1.9,
  "color": 13115434
 },
 "gallantmon": {
  "id": "gallantmon",
  "name": "Gallantmon",
  "stage": "ultimate",
  "line": "guilmon",
  "attribute": "virus",
  "element": "light",
  "baseStats": {
   "hp": 380,
   "atk": 55,
   "def": 48,
   "spd": 34,
   "brain": 32
  },
  "growthRate": 0.005,
  "signature": "lightning_joust",
  "kit": [
   "royal_saber",
   "shield_of_the_just",
   "radiation_blade"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 15790320
 },
 "gabumon": {
  "id": "gabumon",
  "name": "Gabumon",
  "stage": "child",
  "line": "gabumon",
  "attribute": "data",
  "element": "ice",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 10,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "petit_fire",
  "kit": [
   "little_horn",
   "frost_breath",
   "gabu_tackle"
  ],
  "evolutions": [
   {
    "to": "garurumon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "spd": 13
     }
    }
   }
  ],
  "size": 1,
  "color": 9418751
 },
 "wormmon": {
  "id": "wormmon",
  "name": "Wormmon",
  "stage": "child",
  "line": "wormmon",
  "attribute": "free",
  "element": "plant",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 10,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "sticky_net",
  "kit": [
   "silk_thread",
   "worm_tackle",
   "leaf_rain"
  ],
  "evolutions": [
   {
    "to": "stingmon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "def": 12
     }
    }
   }
  ],
  "size": 1,
  "color": 7330906
 },
 "garurumon": {
  "id": "garurumon",
  "name": "Garurumon",
  "stage": "adult",
  "line": "gabumon",
  "attribute": "vaccine",
  "element": "ice",
  "baseStats": {
   "hp": 130,
   "atk": 19,
   "def": 15,
   "spd": 17,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "fox_fire",
  "kit": [
   "slamming_attack",
   "frost_breath",
   "little_horn"
  ],
  "evolutions": [
   {
    "to": "weregarurumon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 26,
      "spd": 26
     }
    }
   }
  ],
  "size": 1.5,
  "color": 3836927
 },
 "weregarurumon": {
  "id": "weregarurumon",
  "name": "WereGarurumon",
  "stage": "perfect",
  "line": "gabumon",
  "attribute": "vaccine",
  "element": "ice",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 27,
   "spd": 27,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "kaiser_nail",
  "kit": [
   "garuru_kick",
   "wolf_howl",
   "slamming_attack"
  ],
  "evolutions": [
   {
    "to": "metalgarurumon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "spd": 40
     }
    }
   }
  ],
  "size": 1.9,
  "color": 3836927
 },
 "metalgarurumon": {
  "id": "metalgarurumon",
  "name": "MetalGarurumon",
  "stage": "ultimate",
  "line": "gabumon",
  "attribute": "data",
  "element": "ice",
  "baseStats": {
   "hp": 380,
   "atk": 54,
   "def": 44,
   "spd": 38,
   "brain": 32
  },
  "growthRate": 0.005,
  "signature": "cocytus_breath",
  "kit": [
   "garuru_tomahawk",
   "metal_wolf_claw",
   "kaiser_nail"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 3836927
 },
 "patamon": {
  "id": "patamon",
  "name": "Patamon",
  "stage": "child",
  "line": "patamon",
  "attribute": "data",
  "element": "light",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 10,
   "brain": 10
  },
  "growthRate": 0.005,
  "signature": "boom_bubble",
  "kit": [
   "patamon_dive",
   "wing_flap",
   "spiral_bubble"
  ],
  "evolutions": [
   {
    "to": "angemon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "brain": 12
     }
    }
   }
  ],
  "size": 1,
  "color": 16767050
 },
 "angemon": {
  "id": "angemon",
  "name": "Angemon",
  "stage": "adult",
  "line": "patamon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 130,
   "atk": 19,
   "def": 15,
   "spd": 13,
   "brain": 15
  },
  "growthRate": 0.005,
  "signature": "hand_of_fate",
  "kit": [
   "angel_rod",
   "holy_aura",
   "patamon_dive"
  ],
  "evolutions": [
   {
    "to": "magnaangemon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 24,
      "brain": 22
     }
    }
   }
  ],
  "size": 1.5,
  "color": 16767050
 },
 "magnaangemon": {
  "id": "magnaangemon",
  "name": "MagnaAngemon",
  "stage": "perfect",
  "line": "patamon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 27,
   "spd": 23,
   "brain": 23
  },
  "growthRate": 0.005,
  "signature": "gate_of_destiny",
  "kit": [
   "excalibur",
   "holy_ring",
   "angel_rod"
  ],
  "evolutions": [
   {
    "to": "seraphimon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "brain": 36
     }
    }
   }
  ],
  "size": 1.9,
  "color": 16767050
 },
 "seraphimon": {
  "id": "seraphimon",
  "name": "Seraphimon",
  "stage": "ultimate",
  "line": "patamon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 380,
   "atk": 54,
   "def": 44,
   "spd": 34,
   "brain": 35
  },
  "growthRate": 0.005,
  "signature": "seven_heavens",
  "kit": [
   "strike_of_seven_stars",
   "testament",
   "excalibur"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 16767050
 },
 "tentomon": {
  "id": "tentomon",
  "name": "Tentomon",
  "stage": "child",
  "line": "tentomon",
  "attribute": "vaccine",
  "element": "electric",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 11,
   "spd": 10,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "super_shocker",
  "kit": [
   "double_punch",
   "static_spark",
   "beetle_buzz"
  ],
  "evolutions": [
   {
    "to": "kabuterimon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "def": 12
     }
    }
   }
  ],
  "size": 1,
  "color": 16771146
 },
 "kabuterimon": {
  "id": "kabuterimon",
  "name": "Kabuterimon",
  "stage": "adult",
  "line": "tentomon",
  "attribute": "vaccine",
  "element": "electric",
  "baseStats": {
   "hp": 130,
   "atk": 19,
   "def": 19,
   "spd": 13,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "electro_shocker",
  "kit": [
   "beetle_horn",
   "static_spark",
   "double_punch"
  ],
  "evolutions": [
   {
    "to": "megakabuterimon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 24,
      "def": 26
     }
    }
   }
  ],
  "size": 1.5,
  "color": 16771146
 },
 "megakabuterimon": {
  "id": "megakabuterimon",
  "name": "MegaKabuterimon",
  "stage": "perfect",
  "line": "tentomon",
  "attribute": "vaccine",
  "element": "electric",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 31,
   "spd": 23,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "horn_buster",
  "kit": [
   "electro_beam",
   "thunder_ring",
   "beetle_horn"
  ],
  "evolutions": [
   {
    "to": "herculeskabuterimon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "def": 46
     }
    }
   }
  ],
  "size": 1.9,
  "color": 16771146
 },
 "herculeskabuterimon": {
  "id": "herculeskabuterimon",
  "name": "HerculesKabuterimon",
  "stage": "ultimate",
  "line": "tentomon",
  "attribute": "vaccine",
  "element": "electric",
  "baseStats": {
   "hp": 380,
   "atk": 54,
   "def": 48,
   "spd": 34,
   "brain": 32
  },
  "growthRate": 0.005,
  "signature": "giga_blaster",
  "kit": [
   "high_electro_shocker",
   "mega_electro_shocker",
   "horn_buster"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 16771146
 },
 "salamon": {
  "id": "salamon",
  "name": "Salamon",
  "stage": "child",
  "line": "gatomon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 12,
   "brain": 9
  },
  "growthRate": 0.005,
  "signature": "puppy_howl",
  "kit": [
   "puppy_claw",
   "holy_bark",
   "salamon_rush"
  ],
  "evolutions": [
   {
    "to": "gatomon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "spd": 15
     }
    }
   }
  ],
  "size": 1,
  "color": 16767050
 },
 "gatomon": {
  "id": "gatomon",
  "name": "Gatomon",
  "stage": "adult",
  "line": "gatomon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 130,
   "atk": 19,
   "def": 15,
   "spd": 16,
   "brain": 14
  },
  "growthRate": 0.005,
  "signature": "lightning_paw",
  "kit": [
   "cats_eye",
   "neko_punch",
   "puppy_claw"
  ],
  "evolutions": [
   {
    "to": "angewomon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "spd": 24,
      "brain": 20
     }
    }
   }
  ],
  "size": 1.5,
  "color": 16767050
 },
 "stingmon": {
  "id": "stingmon",
  "name": "Stingmon",
  "stage": "adult",
  "line": "wormmon",
  "attribute": "data",
  "element": "plant",
  "baseStats": {
   "hp": 130,
   "atk": 19,
   "def": 15,
   "spd": 16,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "sting_strike",
  "kit": [
   "spiking_strike",
   "moon_shooter",
   "silk_thread"
  ],
  "evolutions": [
   {
    "to": "jewelbeemon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 24,
      "spd": 24
     }
    }
   }
  ],
  "size": 1.5,
  "color": 6280031
 },
 "angewomon": {
  "id": "angewomon",
  "name": "Angewomon",
  "stage": "perfect",
  "line": "gatomon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 27,
   "spd": 26,
   "brain": 23
  },
  "growthRate": 0.005,
  "signature": "celestial_arrow",
  "kit": [
   "heavens_charm",
   "holy_arrow_rain",
   "cats_eye"
  ],
  "evolutions": [
   {
    "to": "ophanimon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "brain": 36
     }
    }
   }
  ],
  "size": 1.9,
  "color": 16767050
 },
 "jewelbeemon": {
  "id": "jewelbeemon",
  "name": "JewelBeemon",
  "stage": "perfect",
  "line": "wormmon",
  "attribute": "free",
  "element": "plant",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 27,
   "spd": 27,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "spiking_finish",
  "kit": [
   "jewel_sting",
   "royal_swarm",
   "spiking_strike"
  ],
  "evolutions": [
   {
    "to": "grankuwagamon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "spd": 40
     }
    }
   }
  ],
  "size": 1.9,
  "color": 6280031
 },
 "ophanimon": {
  "id": "ophanimon",
  "name": "Ophanimon",
  "stage": "ultimate",
  "line": "gatomon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 380,
   "atk": 54,
   "def": 44,
   "spd": 37,
   "brain": 35
  },
  "growthRate": 0.005,
  "signature": "eden_javelin",
  "kit": [
   "sefirot_crystal",
   "holy_halo",
   "celestial_arrow"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 16767050
 },
 "grankuwagamon": {
  "id": "grankuwagamon",
  "name": "GranKuwagamon",
  "stage": "ultimate",
  "line": "wormmon",
  "attribute": "virus",
  "element": "dark",
  "baseStats": {
   "hp": 380,
   "atk": 58,
   "def": 44,
   "spd": 34,
   "brain": 32
  },
  "growthRate": 0.005,
  "signature": "dimension_scissor",
  "kit": [
   "grand_scissor",
   "dark_insect_swarm",
   "spiking_finish"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 8011007
 },
 "armadillomon": {
  "id": "armadillomon",
  "name": "Armadillomon",
  "stage": "child",
  "line": "armadillomon",
  "attribute": "free",
  "element": "earth",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 11,
   "spd": 10,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "diamond_shell",
  "kit": [
   "rolling_upper",
   "mud_ball",
   "armor_roll"
  ],
  "evolutions": [
   {
    "to": "ankylomon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "def": 12
     }
    }
   }
  ],
  "size": 1,
  "color": 12618314
 },
 "ankylomon": {
  "id": "ankylomon",
  "name": "Ankylomon",
  "stage": "adult",
  "line": "armadillomon",
  "attribute": "data",
  "element": "earth",
  "baseStats": {
   "hp": 130,
   "atk": 19,
   "def": 20,
   "spd": 13,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "tail_hammer",
  "kit": [
   "megaton_press",
   "mud_ball",
   "rolling_upper"
  ],
  "evolutions": [
   {
    "to": "shakkoumon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "def": 28
     }
    }
   }
  ],
  "size": 1.5,
  "color": 12618314
 },
 "shakkoumon": {
  "id": "shakkoumon",
  "name": "Shakkoumon",
  "stage": "perfect",
  "line": "armadillomon",
  "attribute": "vaccine",
  "element": "earth",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 32,
   "spd": 23,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "kachina_bombs",
  "kit": [
   "justice_beam",
   "harmony_ring",
   "tail_hammer"
  ],
  "evolutions": [
   {
    "to": "slashangemon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "def": 48
     }
    }
   }
  ],
  "size": 1.9,
  "color": 12618314
 },
 "slashangemon": {
  "id": "slashangemon",
  "name": "SlashAngemon",
  "stage": "ultimate",
  "line": "armadillomon",
  "attribute": "vaccine",
  "element": "steel",
  "baseStats": {
   "hp": 380,
   "atk": 57,
   "def": 48,
   "spd": 34,
   "brain": 32
  },
  "growthRate": 0.005,
  "signature": "strike_of_the_blade",
  "kit": [
   "heavenly_blade",
   "metal_wing_rain",
   "kachina_bombs"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 12109008
 },
 "terriermon": {
  "id": "terriermon",
  "name": "Terriermon",
  "stage": "child",
  "line": "terriermon",
  "attribute": "vaccine",
  "element": "wind",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 12,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "bunny_blast",
  "kit": [
   "terrier_tornado",
   "bunny_pummel",
   "ear_spin"
  ],
  "evolutions": [
   {
    "to": "gargomon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "spd": 15
     }
    }
   }
  ],
  "size": 1,
  "color": 10414335
 },
 "gargomon": {
  "id": "gargomon",
  "name": "Gargomon",
  "stage": "adult",
  "line": "terriermon",
  "attribute": "virus",
  "element": "steel",
  "baseStats": {
   "hp": 130,
   "atk": 21,
   "def": 15,
   "spd": 13,
   "brain": 12
  },
  "growthRate": 0.005,
  "signature": "gargo_laser",
  "kit": [
   "bunny_pummel",
   "gargo_pellets",
   "terrier_tornado"
  ],
  "evolutions": [
   {
    "to": "rapidmon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "atk": 26,
      "spd": 22
     }
    }
   }
  ],
  "size": 1.5,
  "color": 12109008
 },
 "rapidmon": {
  "id": "rapidmon",
  "name": "Rapidmon",
  "stage": "perfect",
  "line": "terriermon",
  "attribute": "vaccine",
  "element": "steel",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 27,
   "spd": 27,
   "brain": 20
  },
  "growthRate": 0.005,
  "signature": "tri_beam",
  "kit": [
   "rapid_fire",
   "golden_tri_ring",
   "gargo_laser"
  ],
  "evolutions": [
   {
    "to": "megagargomon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "atk": 46
     }
    }
   }
  ],
  "size": 1.9,
  "color": 12109008
 },
 "megagargomon": {
  "id": "megagargomon",
  "name": "MegaGargomon",
  "stage": "ultimate",
  "line": "terriermon",
  "attribute": "vaccine",
  "element": "steel",
  "baseStats": {
   "hp": 380,
   "atk": 58,
   "def": 46,
   "spd": 34,
   "brain": 32
  },
  "growthRate": 0.005,
  "signature": "mega_barrage",
  "kit": [
   "gargo_missiles",
   "power_pummel",
   "tri_beam"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 12109008
 },
 "renamon": {
  "id": "renamon",
  "name": "Renamon",
  "stage": "child",
  "line": "renamon",
  "attribute": "data",
  "element": "ice",
  "baseStats": {
   "hp": 60,
   "atk": 10,
   "def": 8,
   "spd": 11,
   "brain": 10
  },
  "growthRate": 0.005,
  "signature": "diamond_storm",
  "kit": [
   "power_paw",
   "fox_kick"
  ],
  "evolutions": [
   {
    "to": "kyubimon",
    "req": {
     "minLevel": 8,
     "minStats": {
      "brain": 12
     }
    }
   }
  ],
  "size": 1,
  "color": 3836927
 },
 "kyubimon": {
  "id": "kyubimon",
  "name": "Kyubimon",
  "stage": "adult",
  "line": "renamon",
  "attribute": "data",
  "element": "fire",
  "baseStats": {
   "hp": 130,
   "atk": 19,
   "def": 15,
   "spd": 15,
   "brain": 15
  },
  "growthRate": 0.005,
  "signature": "fox_tail_inferno",
  "kit": [
   "dragon_wheel",
   "fox_kick",
   "power_paw"
  ],
  "evolutions": [
   {
    "to": "taomon",
    "req": {
     "minLevel": 20,
     "minStats": {
      "spd": 22,
      "brain": 22
     }
    }
   }
  ],
  "size": 1.5,
  "color": 16742938
 },
 "taomon": {
  "id": "taomon",
  "name": "Taomon",
  "stage": "perfect",
  "line": "renamon",
  "attribute": "data",
  "element": "light",
  "baseStats": {
   "hp": 240,
   "atk": 32,
   "def": 27,
   "spd": 23,
   "brain": 25
  },
  "growthRate": 0.005,
  "signature": "talisman_of_light",
  "kit": [
   "thousand_spells",
   "talisman_spell",
   "fox_tail_inferno"
  ],
  "evolutions": [
   {
    "to": "sakuyamon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "brain": 38
     }
    }
   }
  ],
  "size": 1.9,
  "color": 16767050
 },
 "sakuyamon": {
  "id": "sakuyamon",
  "name": "Sakuyamon",
  "stage": "ultimate",
  "line": "renamon",
  "attribute": "data",
  "element": "light",
  "baseStats": {
   "hp": 380,
   "atk": 54,
   "def": 44,
   "spd": 36,
   "brain": 37
  },
  "growthRate": 0.005,
  "signature": "amethyst_wind",
  "kit": [
   "spirit_strike",
   "crystal_sphere",
   "talisman_of_light"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 16767050
 },
 "skullgreymon": {
  "id": "skullgreymon",
  "name": "SkullGreymon",
  "stage": "perfect",
  "line": "agumon",
  "attribute": "virus",
  "element": "dark",
  "baseStats": {
   "hp": 270,
   "atk": 42,
   "def": 18,
   "spd": 20,
   "brain": 8
  },
  "growthRate": 0.005,
  "signature": "ground_zero",
  "kit": [
   "mega_flame",
   "touch_of_evil",
   "tail_whip"
  ],
  "evolutions": [
   {
    "to": "blackwargreymon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "atk": 62
     },
     "minNearDeaths": 8
    }
   }
  ],
  "size": 2.2,
  "color": 11037416
 },
 "blackwargreymon": {
  "id": "blackwargreymon",
  "name": "BlackWarGreymon",
  "stage": "ultimate",
  "line": "agumon",
  "attribute": "virus",
  "element": "dark",
  "baseStats": {
   "hp": 370,
   "atk": 64,
   "def": 36,
   "spd": 34,
   "brain": 22
  },
  "growthRate": 0.005,
  "signature": "black_gaia_force",
  "kit": [
   "ground_zero",
   "black_tornado",
   "great_tornado"
  ],
  "evolutions": [],
  "size": 2.2,
  "color": 2829114
 },
 "megidramon": {
  "id": "megidramon",
  "name": "Megidramon",
  "stage": "ultimate",
  "line": "guilmon",
  "attribute": "virus",
  "element": "dark",
  "baseStats": {
   "hp": 420,
   "atk": 68,
   "def": 32,
   "spd": 26,
   "brain": 14
  },
  "growthRate": 0.005,
  "signature": "megiddo_flame",
  "kit": [
   "atomic_blaster",
   "hell_howling",
   "radiation_blade"
  ],
  "evolutions": [],
  "size": 2.4,
  "color": 9116186
 },
 "blackwargrowlmon": {
  "id": "blackwargrowlmon",
  "name": "BlackWarGrowlmon",
  "stage": "perfect",
  "line": "guilmon",
  "attribute": "virus",
  "element": "dark",
  "baseStats": {
   "hp": 260,
   "atk": 40,
   "def": 20,
   "spd": 22,
   "brain": 10
  },
  "growthRate": 0.005,
  "signature": "atomic_blaster",
  "kit": [
   "pyro_blaster",
   "radiation_blade",
   "touch_of_evil"
  ],
  "evolutions": [
   {
    "to": "megidramon",
    "req": {
     "minLevel": 35,
     "minStats": {
      "atk": 60
     },
     "minNearDeaths": 8
    }
   }
  ],
  "size": 2.2,
  "color": 15231626
 },
 "victorygreymon": {
  "id": "victorygreymon",
  "name": "VictoryGreymon",
  "stage": "ultimate",
  "line": "agumon",
  "attribute": "vaccine",
  "element": "fire",
  "baseStats": {
   "hp": 420,
   "atk": 66,
   "def": 46,
   "spd": 36,
   "brain": 34
  },
  "growthRate": 0.005,
  "signature": "dramon_breaker",
  "kit": [
   "gaia_force",
   "trident_gaia",
   "brave_tornado"
  ],
  "evolutions": [],
  "size": 2.3,
  "color": 16752672
 },
 "imperialdramon_pm": {
  "id": "imperialdramon_pm",
  "name": "Imperialdramon PM",
  "stage": "ultimate",
  "line": "veemon",
  "attribute": "vaccine",
  "element": "light",
  "baseStats": {
   "hp": 520,
   "atk": 76,
   "def": 58,
   "spd": 46,
   "brain": 44
  },
  "growthRate": 0.005,
  "signature": "omega_blade",
  "kit": [
   "positron_laser",
   "transcendent_sword",
   "giga_crusher"
  ],
  "evolutions": [],
  "size": 2.4,
  "color": 16777164
 },
 "magnamon": {
  "id": "magnamon",
  "name": "Magnamon",
  "stage": "perfect",
  "line": "veemon",
  "attribute": "free",
  "element": "light",
  "baseStats": {
   "hp": 300,
   "atk": 46,
   "def": 40,
   "spd": 34,
   "brain": 28
  },
  "growthRate": 0.005,
  "signature": "extreme_jihad",
  "kit": [
   "vee_headbutt",
   "fire_rocket",
   "blue_thunder"
  ],
  "evolutions": [],
  "size": 1.7,
  "color": 16766720
 }
};
export const CARDS: Record<string, CardDef> = {
 "card_gatomon_claws": {
  "id": "card_gatomon_claws",
  "name": "Garras do Gatomon",
  "kind": "passive",
  "weight": 10,
  "bonuses": [
   {
    "stat": "dmg",
    "basePct": 15,
    "perLevelPct": 2
   }
  ]
 },
 "card_birdramon_wings": {
  "id": "card_birdramon_wings",
  "name": "Asas do Birdramon",
  "kind": "passive",
  "weight": 10,
  "bonuses": [
   {
    "stat": "spd",
    "basePct": 10,
    "perLevelPct": 2
   }
  ]
 },
 "card_hyper_speed": {
  "id": "card_hyper_speed",
  "name": "Hyper Speed",
  "kind": "passive",
  "weight": 8,
  "bonuses": [
   {
    "stat": "cooldown",
    "basePct": -10,
    "perLevelPct": -1
   }
  ]
 },
 "card_data_magnet": {
  "id": "card_data_magnet",
  "name": "Ímã de Dados",
  "kind": "passive",
  "weight": 8,
  "bonuses": [
   {
    "stat": "pickup",
    "basePct": 50,
    "perLevelPct": 5
   }
  ]
 },
 "card_monzaemon_hug": {
  "id": "card_monzaemon_hug",
  "name": "Abraço do Monzaemon",
  "kind": "passive",
  "weight": 10,
  "bonuses": [
   {
    "stat": "hp",
    "basePct": 20,
    "perLevelPct": 2
   }
  ]
 },
 "card_andromon_armor": {
  "id": "card_andromon_armor",
  "name": "Armadura do Andromon",
  "kind": "passive",
  "weight": 10,
  "bonuses": [
   {
    "stat": "def",
    "basePct": 15,
    "perLevelPct": 2
   }
  ]
 },
 "card_wisemon_book": {
  "id": "card_wisemon_book",
  "name": "Livro do Wisemon",
  "kind": "passive",
  "weight": 8,
  "bonuses": [
   {
    "stat": "brain",
    "basePct": 15,
    "perLevelPct": 2
   },
   {
    "stat": "xp",
    "basePct": 20,
    "perLevelPct": 5
   }
  ]
 },
 "card_greymon_horn": {
  "id": "card_greymon_horn",
  "name": "Chifre do Greymon",
  "kind": "passive",
  "weight": 10,
  "bonuses": [
   {
    "stat": "atk",
    "basePct": 15,
    "perLevelPct": 2
   }
  ]
 },
 "card_lightning_paw": {
  "id": "card_lightning_paw",
  "name": "Slash: Lightning Paw",
  "kind": "slash",
  "weight": 6,
  "moveId": "lightning_paw",
  "bonuses": []
 },
 "card_diamond_storm": {
  "id": "card_diamond_storm",
  "name": "Slash: Diamond Storm",
  "kind": "slash",
  "weight": 6,
  "moveId": "diamond_storm",
  "bonuses": []
 },
 "card_hand_of_fate": {
  "id": "card_hand_of_fate",
  "name": "Slash: Hand of Fate",
  "kind": "slash",
  "weight": 5,
  "moveId": "hand_of_fate",
  "bonuses": []
 },
 "card_howling_blaster": {
  "id": "card_howling_blaster",
  "name": "Slash: Howling Blaster",
  "kind": "slash",
  "weight": 5,
  "moveId": "howling_blaster",
  "bonuses": []
 },
 "card_super_shocker": {
  "id": "card_super_shocker",
  "name": "Slash: Super Shocker",
  "kind": "slash",
  "weight": 6,
  "moveId": "super_shocker",
  "bonuses": []
 },
 "card_poison_ivy": {
  "id": "card_poison_ivy",
  "name": "Slash: Poison Ivy",
  "kind": "slash",
  "weight": 6,
  "moveId": "poison_ivy",
  "bonuses": []
 },
 "blue_card": {
  "id": "blue_card",
  "name": "Blue Card",
  "kind": "rare",
  "weight": 1,
  "forPartners": [
   "guilmon"
  ],
  "bonuses": []
 }
};
export const ITEMS: Record<string, ItemDef> = {
 "digiegg_courage": {
  "id": "digiegg_courage",
  "name": "Digiovo da Coragem",
  "kind": "digiegg",
  "forPartners": [
   "veemon"
  ]
 },
 "digiegg_friendship": {
  "id": "digiegg_friendship",
  "name": "Digiovo da Amizade",
  "kind": "digiegg",
  "forPartners": [
   "veemon"
  ]
 },
 "fusion_garurumon": {
  "id": "fusion_garurumon",
  "name": "Dados de Fusão: MetalGarurumon",
  "kind": "fusion",
  "forPartners": [
   "agumon"
  ],
  "requiresUnlocked": [
   "gabumon"
  ]
 },
 "fusion_stingmon": {
  "id": "fusion_stingmon",
  "name": "Dados de Fusão: Stingmon",
  "kind": "fusion",
  "forPartners": [
   "veemon"
  ],
  "requiresUnlocked": [
   "wormmon"
  ]
 },
 "egg_gabumon": {
  "id": "egg_gabumon",
  "name": "Ovo do Gabumon",
  "kind": "egg",
  "unlockPartner": "gabumon"
 },
 "egg_wormmon": {
  "id": "egg_wormmon",
  "name": "Ovo do Wormmon",
  "kind": "egg",
  "unlockPartner": "wormmon"
 },
 "egg_patamon": {
  "id": "egg_patamon",
  "name": "Ovo do Patamon",
  "kind": "egg",
  "unlockPartner": "patamon"
 },
 "egg_tentomon": {
  "id": "egg_tentomon",
  "name": "Ovo do Tentomon",
  "kind": "egg",
  "unlockPartner": "tentomon"
 },
 "egg_gatomon": {
  "id": "egg_gatomon",
  "name": "Ovo do Gatomon",
  "kind": "egg",
  "unlockPartner": "gatomon"
 },
 "egg_armadillomon": {
  "id": "egg_armadillomon",
  "name": "Ovo do Armadillomon",
  "kind": "egg",
  "unlockPartner": "armadillomon"
 },
 "egg_terriermon": {
  "id": "egg_terriermon",
  "name": "Ovo do Terriermon",
  "kind": "egg",
  "unlockPartner": "terriermon"
 },
 "egg_renamon": {
  "id": "egg_renamon",
  "name": "Ovo do Renamon",
  "kind": "egg",
  "unlockPartner": "renamon"
 },
 "digiegg_miracles": {
  "id": "digiegg_miracles",
  "name": "Digiovo dos Milagres",
  "kind": "digiegg",
  "forPartners": [
   "veemon"
  ]
 },
 "sword_omnimon": {
  "id": "sword_omnimon",
  "name": "Transcendent Sword",
  "kind": "fusion",
  "forPartners": [
   "veemon"
  ]
 }
};
export const PARTNERS: PartnerDef[] = [
 {
  "id": "agumon",
  "childForm": "agumon",
  "season": "adventure",
  "starter": true
 },
 {
  "id": "gabumon",
  "childForm": "gabumon",
  "season": "adventure",
  "starter": false
 },
 {
  "id": "veemon",
  "childForm": "veemon",
  "season": "adventure02",
  "starter": true
 },
 {
  "id": "wormmon",
  "childForm": "wormmon",
  "season": "adventure02",
  "starter": false
 },
 {
  "id": "guilmon",
  "childForm": "guilmon",
  "season": "tamers",
  "starter": true
 },
 {
  "id": "patamon",
  "childForm": "patamon",
  "season": "adventure",
  "starter": false
 },
 {
  "id": "tentomon",
  "childForm": "tentomon",
  "season": "adventure",
  "starter": false
 },
 {
  "id": "gatomon",
  "childForm": "salamon",
  "season": "adventure",
  "starter": false
 },
 {
  "id": "armadillomon",
  "childForm": "armadillomon",
  "season": "adventure02",
  "starter": false
 },
 {
  "id": "terriermon",
  "childForm": "terriermon",
  "season": "tamers",
  "starter": false
 },
 {
  "id": "renamon",
  "childForm": "renamon",
  "season": "tamers",
  "starter": false
 }
];
export const ENEMIES: EnemyDef[] = [
 {
  "id": "snowgoblimon",
  "name": "Snow Goblimon",
  "attribute": "virus",
  "element": "ice",
  "hp": 12,
  "dmg": 6,
  "speed": 2.6,
  "xp": 1,
  "size": 0.9,
  "color": 9093706,
  "minPhase": 1
 },
 {
  "id": "hagurumon",
  "name": "Hagurumon",
  "attribute": "virus",
  "element": "steel",
  "hp": 10,
  "dmg": 5,
  "speed": 3.2,
  "xp": 1,
  "size": 0.9,
  "color": 10132136,
  "minPhase": 1
 },
 {
  "id": "gazimon",
  "name": "Gazimon",
  "attribute": "virus",
  "element": "electric",
  "hp": 20,
  "dmg": 7,
  "speed": 2,
  "xp": 2,
  "size": 0.9,
  "color": 10193786,
  "minPhase": 1
 },
 {
  "id": "bakemon",
  "name": "Bakemon",
  "attribute": "virus",
  "element": "dark",
  "hp": 18,
  "dmg": 8,
  "speed": 3,
  "xp": 2,
  "size": 1.1,
  "color": 15263984,
  "minPhase": 2
 },
 {
  "id": "guardromon",
  "name": "Guardromon",
  "attribute": "data",
  "element": "steel",
  "hp": 45,
  "dmg": 10,
  "speed": 1.6,
  "xp": 4,
  "size": 1.3,
  "color": 5925450,
  "minPhase": 2
 },
 {
  "id": "kuwagamon",
  "name": "Kuwagamon",
  "attribute": "virus",
  "element": "plant",
  "hp": 40,
  "dmg": 12,
  "speed": 3.4,
  "xp": 4,
  "size": 1.4,
  "color": 12595242,
  "minPhase": 3
 },
 {
  "id": "ogremon",
  "name": "Ogremon",
  "attribute": "virus",
  "element": "earth",
  "hp": 60,
  "dmg": 14,
  "speed": 2.4,
  "xp": 5,
  "size": 1.4,
  "color": 4885050,
  "minPhase": 3
 },
 {
  "id": "snimon",
  "name": "Snimon",
  "attribute": "vaccine",
  "element": "wind",
  "hp": 50,
  "dmg": 14,
  "speed": 3.8,
  "xp": 5,
  "size": 1.4,
  "color": 8049242,
  "minPhase": 4
 },
 {
  "id": "darktyrannomon",
  "name": "DarkTyrannomon",
  "attribute": "virus",
  "element": "fire",
  "hp": 90,
  "dmg": 18,
  "speed": 2.4,
  "xp": 8,
  "size": 1.7,
  "color": 3816026,
  "minPhase": 4
 },
 {
  "id": "devidramon",
  "name": "Devidramon",
  "attribute": "virus",
  "element": "dark",
  "hp": 40,
  "dmg": 16,
  "speed": 4.2,
  "xp": 6,
  "size": 1.1,
  "color": 6961802,
  "minPhase": 5
 }
];
export const MINIBOSSES: EnemyDef[] = [
 {
  "id": "ladydevimon",
  "name": "LadyDevimon",
  "attribute": "virus",
  "element": "dark",
  "hp": 600,
  "dmg": 20,
  "speed": 3,
  "xp": 40,
  "size": 2.2,
  "color": 15249978,
  "minPhase": 2
 },
 {
  "id": "arukenimon",
  "name": "Arukenimon",
  "attribute": "data",
  "element": "plant",
  "hp": 800,
  "dmg": 24,
  "speed": 2.8,
  "xp": 50,
  "size": 2.2,
  "color": 5933800,
  "minPhase": 2
 },
 {
  "id": "skullgreymon",
  "name": "SkullGreymon",
  "attribute": "virus",
  "element": "dark",
  "hp": 1000,
  "dmg": 28,
  "speed": 3,
  "xp": 60,
  "size": 2.2,
  "color": 11037416,
  "minPhase": 3
 },
 {
  "id": "blackwargrowlmon",
  "name": "BlackWarGrowlmon",
  "attribute": "virus",
  "element": "dark",
  "hp": 1200,
  "dmg": 30,
  "speed": 3.2,
  "xp": 70,
  "size": 2.2,
  "color": 15231626,
  "minPhase": 4
 },
 {
  "id": "blackweregarurumon",
  "name": "BlackWereGarurumon",
  "attribute": "virus",
  "element": "dark",
  "hp": 1400,
  "dmg": 32,
  "speed": 3.6,
  "xp": 80,
  "size": 2,
  "color": 15263850,
  "minPhase": 4
 }
];
export const BOSSES: BossDef[] = [
 {
  "id": "devimon",
  "name": "Devimon",
  "attribute": "virus",
  "element": "dark",
  "phase": 1,
  "hp": 1500,
  "dmg": 20,
  "speed": 2.6,
  "size": 2.8,
  "color": 3811914,
  "moves": [
   "touch_of_evil"
  ]
 },
 {
  "id": "etemon",
  "name": "Etemon",
  "attribute": "virus",
  "element": "earth",
  "phase": 2,
  "hp": 3500,
  "dmg": 26,
  "speed": 2.4,
  "size": 2.8,
  "color": 13148266,
  "moves": [
   "dark_network"
  ]
 },
 {
  "id": "myotismon",
  "name": "Myotismon",
  "attribute": "virus",
  "element": "dark",
  "phase": 3,
  "hp": 7000,
  "dmg": 32,
  "speed": 2.8,
  "size": 3,
  "color": 5909098,
  "moves": [
   "crimson_lightning"
  ]
 },
 {
  "id": "kimeramon",
  "name": "Kimeramon",
  "attribute": "data",
  "element": "fire",
  "phase": 4,
  "hp": 12000,
  "dmg": 40,
  "speed": 2.4,
  "size": 3.4,
  "color": 14207136,
  "moves": [
   "heat_viper"
  ]
 },
 {
  "id": "piedmon",
  "name": "Piedmon",
  "attribute": "virus",
  "element": "dark",
  "phase": 5,
  "hp": 20000,
  "dmg": 48,
  "speed": 3,
  "size": 3,
  "color": 15263976,
  "moves": [
   "trump_sword"
  ]
 }
];
export const ATTRIBUTE_CHART: Record<AttributeId, Record<AttributeId, number>> = {
 "data": {
  "data": 1,
  "free": 1,
  "vaccine": 1.5,
  "virus": 0.75
 },
 "free": {
  "data": 1,
  "free": 1,
  "vaccine": 1,
  "virus": 1
 },
 "vaccine": {
  "data": 0.75,
  "free": 1,
  "vaccine": 1,
  "virus": 1.5
 },
 "virus": {
  "data": 1.5,
  "free": 1,
  "vaccine": 0.75,
  "virus": 1
 }
};
export const ELEMENT_CHART: Record<ElementId, Record<ElementId, number>> = {
 "dark": {
  "dark": 1,
  "earth": 1,
  "electric": 1,
  "fire": 1,
  "ice": 1,
  "light": 1.5,
  "neutral": 1,
  "plant": 1,
  "steel": 1,
  "water": 1,
  "wind": 1
 },
 "earth": {
  "dark": 1,
  "earth": 1,
  "electric": 1.5,
  "fire": 1,
  "ice": 1,
  "light": 1,
  "neutral": 1,
  "plant": 0.75,
  "steel": 1.5,
  "water": 0.75,
  "wind": 1
 },
 "electric": {
  "dark": 1,
  "earth": 0.75,
  "electric": 1,
  "fire": 1,
  "ice": 1,
  "light": 1,
  "neutral": 1,
  "plant": 1,
  "steel": 1,
  "water": 1.5,
  "wind": 1.5
 },
 "fire": {
  "dark": 1,
  "earth": 1,
  "electric": 1,
  "fire": 1,
  "ice": 1.5,
  "light": 1,
  "neutral": 1,
  "plant": 1.5,
  "steel": 1,
  "water": 0.75,
  "wind": 0.75
 },
 "ice": {
  "dark": 1,
  "earth": 1,
  "electric": 1,
  "fire": 0.75,
  "ice": 1,
  "light": 1,
  "neutral": 1,
  "plant": 1.5,
  "steel": 0.75,
  "water": 1,
  "wind": 1.5
 },
 "light": {
  "dark": 1.5,
  "earth": 1,
  "electric": 1,
  "fire": 1,
  "ice": 1,
  "light": 1,
  "neutral": 1,
  "plant": 1,
  "steel": 0.75,
  "water": 1,
  "wind": 1
 },
 "neutral": {
  "dark": 1,
  "earth": 1,
  "electric": 1,
  "fire": 1,
  "ice": 1,
  "light": 1,
  "neutral": 1,
  "plant": 1,
  "steel": 1,
  "water": 1,
  "wind": 1
 },
 "plant": {
  "dark": 1,
  "earth": 1.5,
  "electric": 1,
  "fire": 0.75,
  "ice": 0.75,
  "light": 1,
  "neutral": 1,
  "plant": 1,
  "steel": 1,
  "water": 1.5,
  "wind": 0.75
 },
 "steel": {
  "dark": 1,
  "earth": 0.75,
  "electric": 1,
  "fire": 1,
  "ice": 1.5,
  "light": 1.5,
  "neutral": 1,
  "plant": 1,
  "steel": 1,
  "water": 1,
  "wind": 1
 },
 "water": {
  "dark": 1,
  "earth": 1.5,
  "electric": 0.75,
  "fire": 1.5,
  "ice": 1,
  "light": 1,
  "neutral": 1,
  "plant": 0.75,
  "steel": 1,
  "water": 1,
  "wind": 1
 },
 "wind": {
  "dark": 1,
  "earth": 1,
  "electric": 0.75,
  "fire": 1.5,
  "ice": 0.75,
  "light": 1,
  "neutral": 1,
  "plant": 1.5,
  "steel": 1,
  "water": 1,
  "wind": 1
 }
};
