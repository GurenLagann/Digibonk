-- Ramo sombrio dos iniciais + evolução sem requisito de fase.
--   Agumon:  Greymon -> SkullGreymon -> BlackWarGreymon (alternativa a MetalGreymon/WarGreymon)
--   Guilmon: Growlmon -> BlackWarGrowlmon -> Megidramon  (alternativa a WarGrowlmon/Gallantmon)
--            WarGrowlmon -> Megidramon também existe, mais difícil
-- Como no Digimon World: Next Order, o ramo sombrio vem do "descuido": muito Ataque e jogar no limite
-- (vezes em que o HP caiu abaixo de 25%, coluna min_near_deaths da migration 003).

-- Evolução não depende mais da fase da partida (nível, status, itens, abates e quase-mortes).
UPDATE evolutions SET min_phase = NULL WHERE min_phase IS NOT NULL;

-- SkullGreymon já existia só como mini-chefe (o inimigo usa os números da tabela enemies);
-- os status abaixo são os da forma jogável: canhão de vidro, muito Ataque e pouca Defesa.
UPDATE digimon SET hp = 270, atk = 42, def = 18, spd = 20, brain = 8 WHERE id = 'skullgreymon';
UPDATE digimon SET hp = 260, atk = 40, def = 20, spd = 22, brain = 10 WHERE id = 'blackwargrowlmon';

INSERT INTO digimon (id, name, stage, attribute, element, hp, atk, def, spd, brain, growth_rate, size, color) VALUES
  ('blackwargreymon', 'BlackWarGreymon', 'ultimate', 'virus', 'dark', 370, 64, 36, 34, 22, 0.005, 2.2, 2829114),
  ('megidramon',      'Megidramon',      'ultimate', 'virus', 'dark', 420, 68, 32, 26, 14, 0.005, 2.4, 9116186);

INSERT INTO moves (id, name, element, pattern, damage, cooldown, reach, radius, count, pierce, speed, duration, max_level, dmg_per_level, cd_per_level, color, ord, description) VALUES
  ('ground_zero',      'Ground Zero',      'dark', 'projectile', 32, 1.4, 16, 1.0, 1, 4, 12, NULL, 5, 1.25, 0.92, 10181046, 153,
    'Dispara um míssil orgânico que atravessa vários inimigos em linha.'),
  ('black_tornado',    'Black Tornado',    'dark', 'beam',       42, 1.8, 12, 1.2, NULL, NULL, NULL, 0.4, 5, 1.25, 0.92, 4934507, 154,
    'Gira como um tornado negro e perfura os inimigos à frente.'),
  ('black_gaia_force', 'Black Gaia Force', 'dark', 'area',       64, 2.2, 14, 5.0, NULL, NULL, NULL, 0.5, 5, 1.25, 0.92, 6950317, 155,
    'Lança uma esfera de energia negra que explode em grande área.'),
  ('megiddo_flame',    'Megiddo Flame',    'dark', 'area',       72, 2.4, 15, 5.5, NULL, NULL, NULL, 0.6, 5, 1.25, 0.92, 11735598, 156,
    'Chamas do apocalipse incineram uma grande área ao redor do alvo.'),
  ('hell_howling',     'Hell Howling',     'dark', 'aura',       20, 0.6, 4.5, 4.5, NULL, NULL, NULL, NULL, 5, 1.25, 0.92, 8024096, 157,
    'Um rugido infernal contínuo fere quem se aproximar.');

INSERT INTO forms (digimon_id, line, signature, ord) VALUES
  ('skullgreymon',    'agumon',  'ground_zero',      47),
  ('blackwargreymon', 'agumon',  'black_gaia_force', 48),
  ('megidramon',      'guilmon', 'megiddo_flame',    49),
  ('blackwargrowlmon', 'guilmon', 'atomic_blaster',  50);

-- o kit inclui a assinatura da forma anterior, que assim passa para um espaço livre ao evoluir
INSERT INTO form_kit (form_id, move_id, ord) VALUES
  ('skullgreymon',    'mega_flame',     0),
  ('skullgreymon',    'touch_of_evil',  1),
  ('skullgreymon',    'tail_whip',      2),
  ('blackwargreymon', 'ground_zero',    0),
  ('blackwargreymon', 'black_tornado',  1),
  ('blackwargreymon', 'great_tornado',  2),
  ('megidramon',      'atomic_blaster', 0),
  ('megidramon',      'hell_howling',   1),
  ('megidramon',      'radiation_blade', 2),
  ('blackwargrowlmon', 'pyro_blaster',  0),
  ('blackwargrowlmon', 'radiation_blade', 1),
  ('blackwargrowlmon', 'touch_of_evil', 2);

-- Ramo "bom" pede status equilibrados (MetalGreymon: Atq 30 e Def 22); o sombrio pede Atq alto e quase-mortes.
INSERT INTO evolutions (id, from_form, to_form, min_level, min_hp, min_atk, min_def, min_spd, min_brain, min_phase, min_kills, min_near_deaths, ord) VALUES
  ('greymon->skullgreymon',             'greymon',          'skullgreymon',     20, NULL, 38, NULL, NULL, NULL, NULL, NULL, 3,  1),
  ('skullgreymon->blackwargreymon',     'skullgreymon',     'blackwargreymon',  35, NULL, 62, NULL, NULL, NULL, NULL, NULL, 8,  0),
  ('growlmon->blackwargrowlmon',        'growlmon',         'blackwargrowlmon', 20, NULL, 34, NULL, NULL, NULL, NULL, NULL, 3,  1),
  ('blackwargrowlmon->megidramon',      'blackwargrowlmon', 'megidramon',       35, NULL, 60, NULL, NULL, NULL, NULL, NULL, 8,  0),
  ('wargrowlmon->megidramon',           'wargrowlmon',      'megidramon',       35, NULL, 60, NULL, NULL, NULL, NULL, NULL, 12, 1);
