-- Laboratório: melhorias permanentes (meta-progressão) compradas com Cristais. Cada melhoria tem níveis; costs = preço de cada nível.
-- effect: reroll = Atualizar+, skip = Pular+, ban = Banir+, offer = quarta opção nas escolhas (ver src/data/lab.ts).
CREATE TABLE lab_upgrades (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  effect      TEXT NOT NULL CHECK (effect IN ('reroll', 'skip', 'ban', 'offer')),
  ord         INTEGER NOT NULL
);
CREATE TABLE lab_upgrade_costs (
  upgrade_id TEXT NOT NULL REFERENCES lab_upgrades (id),
  level      INTEGER NOT NULL,
  cost       INTEGER NOT NULL,
  PRIMARY KEY (upgrade_id, level)
);
