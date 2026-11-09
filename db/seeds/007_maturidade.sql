-- Formas da Maturidade e do Modo Paladino (decisões do usuário, 2026-11-09):
--   Agumon:  WarGreymon maduro -> VictoryGreymon
--   Veemon:  Flamedramon, Raidramon e Magnamon pedem Maturidade + o Digiovo de cada um (Magnamon: Digiovo dos Milagres)
--            Imperialdramon FM + Transcendent Sword (a espada do Omnimon) -> Imperialdramon PM, sem Maturidade
--   Guilmon: fica para depois.

-- As formas Armor do Veemon passam a pedir Maturidade (coluna da migration 004).
UPDATE evolutions SET requires_maturity = 1 WHERE id IN ('veemon->flamedramon', 'veemon->raidramon');

INSERT INTO digimon (id, name, stage, attribute, element, hp, atk, def, spd, brain, growth_rate, size, color) VALUES
  ('victorygreymon',    'VictoryGreymon',    'ultimate', 'vaccine', 'fire',  420, 66, 46, 36, 34, 0.005, 2.3, 16752672),
  ('imperialdramon_pm', 'Imperialdramon PM', 'ultimate', 'vaccine', 'light', 520, 76, 58, 46, 44, 0.005, 2.4, 16777164),
  ('magnamon',          'Magnamon',          'perfect',  'free',    'light', 300, 46, 40, 34, 28, 0.005, 1.7, 16766720);

INSERT INTO moves (id, name, element, pattern, damage, cooldown, reach, radius, count, pierce, speed, duration, max_level, dmg_per_level, cd_per_level, color, ord, description) VALUES
  ('dramon_breaker', 'Dramon Breaker', 'fire',  'beam', 100, 1.6, 16, 1.5, NULL, NULL, NULL, 0.4, 5, 1.25, 0.92, 16752672, 158,
    'Um golpe da espada-lança corta tudo numa linha à frente.'),
  ('trident_gaia',   'Trident Gaia',   'fire',  'area',  85, 2.4, 15, 6.0, NULL, NULL, NULL, 0.6, 5, 1.25, 0.92, 16742938, 159,
    'Uma rajada de energia explode em grande área ao redor do alvo.'),
  ('omega_blade',    'Omega Blade',    'light', 'beam', 120, 1.6, 18, 1.6, NULL, NULL, NULL, 0.4, 5, 1.25, 0.92, 16777164, 160,
    'A espada do Omnimon corta tudo numa linha longa à frente.'),
  ('extreme_jihad',  'Extreme Jihad',  'light', 'area',  48, 2.0, 12, 5.0, NULL, NULL, NULL, 0.5, 5, 1.25, 0.92, 16766720, 161,
    'Uma explosão de luz dourada atinge uma grande área ao redor do alvo.');

INSERT INTO forms (digimon_id, line, signature, ord) VALUES
  ('victorygreymon',    'agumon', 'dramon_breaker', 51),
  ('imperialdramon_pm', 'veemon', 'omega_blade',    52),
  ('magnamon',          'veemon', 'extreme_jihad',  53);

-- o kit inclui a assinatura da forma anterior, que assim passa para um espaço livre ao evoluir
INSERT INTO form_kit (form_id, move_id, ord) VALUES
  ('victorygreymon',    'gaia_force',         0),
  ('victorygreymon',    'trident_gaia',       1),
  ('victorygreymon',    'brave_tornado',      2),
  ('imperialdramon_pm', 'positron_laser',     0),
  ('imperialdramon_pm', 'transcendent_sword', 1),
  ('imperialdramon_pm', 'giga_crusher',       2),
  ('magnamon',          'vee_headbutt',       0),
  ('magnamon',          'fire_rocket',        1),
  ('magnamon',          'blue_thunder',       2);

INSERT INTO items (id, name, kind, unlock_partner, ord) VALUES
  ('digiegg_miracles',   'Digiovo dos Milagres', 'digiegg', NULL, 20),
  ('sword_omnimon',      'Transcendent Sword',   'fusion',  NULL, 21);

INSERT INTO item_partners (item_id, partner_id) VALUES
  ('digiegg_miracles',   'veemon'),
  ('sword_omnimon',      'veemon');

INSERT INTO evolutions (id, from_form, to_form, min_level, min_hp, min_atk, min_def, min_spd, min_brain, min_phase, min_kills, min_near_deaths, requires_maturity, ord) VALUES
  ('wargreymon->victorygreymon',          'wargreymon',        'victorygreymon',    50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1,    1),
  ('imperialdramon_fm->imperialdramon_pm', 'imperialdramon_fm', 'imperialdramon_pm', 45, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0),
  ('veemon->magnamon',                    'veemon',            'magnamon',          12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1,    4);

INSERT INTO evolution_items (evolution_id, item_id) VALUES
  ('imperialdramon_fm->imperialdramon_pm', 'sword_omnimon'),
  ('veemon->magnamon',                    'digiegg_miracles');
