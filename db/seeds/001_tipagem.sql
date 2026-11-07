-- Tipagem: atributos, elementos, vantagens e estágios. Valores editáveis.
INSERT INTO attributes (id, name) VALUES
  ('vaccine', 'Vacina'), ('data', 'Dados'), ('virus', 'Vírus'), ('free', 'Free');

-- triângulo: Vacina > Vírus > Dados > Vacina (×1,5 vantagem, ×0,75 desvantagem); Free neutro
INSERT INTO attribute_matchups (attacker, defender, multiplier) VALUES
  ('vaccine', 'virus', 1.5), ('virus', 'data', 1.5), ('data', 'vaccine', 1.5),
  ('virus', 'vaccine', 0.75), ('data', 'virus', 0.75), ('vaccine', 'data', 0.75);

INSERT INTO elements (id, name) VALUES
  ('fire', 'Fogo'), ('water', 'Água'), ('plant', 'Planta'), ('ice', 'Gelo'), ('electric', 'Elétrico'),
  ('earth', 'Terra'), ('wind', 'Vento'), ('light', 'Luz'), ('dark', 'Trevas'), ('steel', 'Aço'), ('neutral', 'Neutro');

-- forte (×1,5) e o inverso fraco (×0,75); pares sem linha = ×1
INSERT INTO element_matchups (attacker, defender, multiplier) VALUES
  ('fire', 'plant', 1.5), ('fire', 'ice', 1.5),
  ('water', 'fire', 1.5), ('water', 'earth', 1.5),
  ('plant', 'water', 1.5), ('plant', 'earth', 1.5),
  ('ice', 'wind', 1.5), ('ice', 'plant', 1.5),
  ('electric', 'water', 1.5), ('electric', 'wind', 1.5),
  ('earth', 'electric', 1.5), ('earth', 'steel', 1.5),
  ('wind', 'plant', 1.5), ('wind', 'fire', 1.5),
  ('light', 'dark', 1.5), ('dark', 'light', 1.5),
  ('steel', 'ice', 1.5), ('steel', 'light', 1.5),
  ('plant', 'fire', 0.75), ('ice', 'fire', 0.75),
  ('fire', 'water', 0.75), ('earth', 'water', 0.75),
  ('water', 'plant', 0.75), ('earth', 'plant', 0.75),
  ('wind', 'ice', 0.75), ('plant', 'ice', 0.75),
  ('water', 'electric', 0.75), ('wind', 'electric', 0.75),
  ('electric', 'earth', 0.75), ('steel', 'earth', 0.75),
  ('fire', 'wind', 0.75), ('plant', 'wind', 0.75),
  ('ice', 'steel', 0.75), ('light', 'steel', 0.75);

INSERT INTO stages (id, ord, dmg_mul) VALUES
  ('child', 1, 1), ('adult', 2, 1.6), ('perfect', 3, 2.4), ('ultimate', 4, 3.5);
