-- Melhorias do Laboratório e preço em Cristais de cada nível.
INSERT INTO lab_upgrades (id, name, description, effect, ord) VALUES
  ('lab_reroll', 'Atualizar+', 'Mais atualizações de opções por partida.',  'reroll', 0),
  ('lab_skip',   'Pular+',     'Mais pulos de escolha por partida.',        'skip',   1),
  ('lab_ban',    'Banir+',     'Mais banimentos de opções por partida.',    'ban',    2),
  ('lab_offer',  'Quarta opção', 'Cada escolha mostra uma opção a mais.',   'offer',  3);
INSERT INTO lab_upgrade_costs (upgrade_id, level, cost) VALUES
  ('lab_reroll', 1, 100), ('lab_reroll', 2, 250), ('lab_reroll', 3, 500),
  ('lab_skip',   1, 100), ('lab_skip',   2, 250), ('lab_skip',   3, 500),
  ('lab_ban',    1, 150), ('lab_ban',    2, 400),
  ('lab_offer',  1, 800);
