-- Primeira leva de relíquias da Zona Digital (Distorção). effect_value: regen = vida/s; pickup = +alcance;
-- xp/elite = %; revive = fração da vida ao reviver; digidata = Digi Data extra por Distorção.
INSERT INTO relics (id, name, description, stat, stat_pct, effect, effect_value, ord) VALUES
  ('relic_tag_courage',    'Etiqueta da Coragem',  'Enquanto luta, o corpo se recupera devagar.',                    'atk', 8,  'regen',    2,   0),
  ('relic_crest_reliance', 'Brasão da Confiança',  'Atrai os dados de longe.',                                       'def', 8,  'pickup',   1.5, 1),
  ('relic_crest_knowledge','Brasão do Conhecimento','Aprende mais com cada batalha.',                                'spd', 6,  'xp',       15,  2),
  ('relic_blue_card',      'Card Azul Rachado',    'Golpes mais fortes contra chefes e guardiões.',                  'atk', 6,  'elite',    25,  3),
  ('relic_digiegg_hope',   'Casca do Digiovo da Esperança', 'Uma vez por partida, revive com metade da vida.',       'hp',  10, 'revive',   0.5, 4),
  ('relic_digivice',       'Digivice Antigo',      'Cada Distorção revela um Digi Data a mais.',                     'spd', 6,  'digidata', 1,   5),
  ('relic_crest_friend',   'Brasão da Amizade',    'O corpo se recupera mais rápido.',                               'hp',  12, 'regen',    3,   6),
  ('relic_black_gear',     'Engrenagem Negra',     'Golpes muito mais fortes contra chefes e guardiões.',            'def', 6,  'elite',    35,  7);
