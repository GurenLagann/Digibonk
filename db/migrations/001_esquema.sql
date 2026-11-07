-- Esquema dos dados do jogo. SQL portátil (SQLite agora, PostgreSQL no servidor):
-- só TEXT/INTEGER/DOUBLE PRECISION (REAL tem 4 bytes no PostgreSQL), chaves explícitas, booleanos como INTEGER 0/1.

-- Tipagem -----------------------------------------------------------------
CREATE TABLE attributes (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE elements (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- multiplicador de dano: atacante × defensor (ausente = 1)
CREATE TABLE attribute_matchups (
  attacker   TEXT NOT NULL REFERENCES attributes(id),
  defender   TEXT NOT NULL REFERENCES attributes(id),
  multiplier DOUBLE PRECISION NOT NULL CHECK (multiplier > 0),
  PRIMARY KEY (attacker, defender)
);

CREATE TABLE element_matchups (
  attacker   TEXT NOT NULL REFERENCES elements(id),
  defender   TEXT NOT NULL REFERENCES elements(id),
  multiplier DOUBLE PRECISION NOT NULL CHECK (multiplier > 0),
  PRIMARY KEY (attacker, defender)
);

CREATE TABLE stages (
  id      TEXT PRIMARY KEY,
  ord     INTEGER NOT NULL,
  dmg_mul DOUBLE PRECISION NOT NULL
);

-- Digimon (entidade única: forma jogável e inimigo apontam para cá) --------
CREATE TABLE digimon (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  stage       TEXT NOT NULL REFERENCES stages(id),
  attribute   TEXT NOT NULL REFERENCES attributes(id),
  element     TEXT NOT NULL REFERENCES elements(id),
  hp          DOUBLE PRECISION NOT NULL,
  atk         DOUBLE PRECISION NOT NULL,
  def         DOUBLE PRECISION NOT NULL,
  spd         DOUBLE PRECISION NOT NULL,
  brain       DOUBLE PRECISION NOT NULL,
  growth_rate DOUBLE PRECISION NOT NULL DEFAULT 0.005, -- valor(nível) = base × (1 + taxa × (nível − 1))
  size        DOUBLE PRECISION NOT NULL,
  color       INTEGER NOT NULL
);

-- Golpes -------------------------------------------------------------------
CREATE TABLE moves (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  element       TEXT NOT NULL REFERENCES elements(id),
  pattern       TEXT NOT NULL CHECK (pattern IN ('projectile', 'area', 'cone', 'aura', 'orbital', 'beam')),
  damage        DOUBLE PRECISION NOT NULL,
  cooldown      DOUBLE PRECISION NOT NULL,
  reach         DOUBLE PRECISION NOT NULL,
  radius        DOUBLE PRECISION,
  count         INTEGER,
  pierce        INTEGER,
  speed         DOUBLE PRECISION,
  duration      DOUBLE PRECISION,
  max_level     INTEGER NOT NULL,
  dmg_per_level DOUBLE PRECISION NOT NULL,
  cd_per_level  DOUBLE PRECISION NOT NULL,
  color         INTEGER NOT NULL,
  ord           INTEGER NOT NULL
);

-- Formas jogáveis, kits e evoluções ------------------------------------------
CREATE TABLE forms (
  digimon_id TEXT PRIMARY KEY REFERENCES digimon(id),
  line       TEXT NOT NULL,
  signature  TEXT NOT NULL REFERENCES moves(id),
  ord        INTEGER NOT NULL
);

CREATE TABLE form_kit (
  form_id TEXT NOT NULL REFERENCES forms(digimon_id),
  move_id TEXT NOT NULL REFERENCES moves(id),
  ord     INTEGER NOT NULL,
  PRIMARY KEY (form_id, move_id)
);

CREATE TABLE partners (
  id         TEXT PRIMARY KEY,
  child_form TEXT NOT NULL REFERENCES forms(digimon_id),
  season     TEXT NOT NULL CHECK (season IN ('adventure', 'adventure02', 'tamers')),
  starter    INTEGER NOT NULL CHECK (starter IN (0, 1)),
  ord        INTEGER NOT NULL
);

CREATE TABLE items (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  kind           TEXT NOT NULL CHECK (kind IN ('digiegg', 'fusion', 'egg')),
  unlock_partner TEXT REFERENCES partners(id),
  ord            INTEGER NOT NULL
);

-- itens que só aparecem para certos parceiros
CREATE TABLE item_partners (
  item_id    TEXT NOT NULL REFERENCES items(id),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  PRIMARY KEY (item_id, partner_id)
);

-- itens que exigem parceiros desbloqueados para aparecer
CREATE TABLE item_requires (
  item_id    TEXT NOT NULL REFERENCES items(id),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  PRIMARY KEY (item_id, partner_id)
);

CREATE TABLE evolutions (
  id        TEXT PRIMARY KEY, -- "<de>-><para>"
  from_form TEXT NOT NULL REFERENCES forms(digimon_id),
  to_form   TEXT NOT NULL REFERENCES forms(digimon_id),
  min_level INTEGER NOT NULL,
  min_hp    DOUBLE PRECISION,
  min_atk   DOUBLE PRECISION,
  min_def   DOUBLE PRECISION,
  min_spd   DOUBLE PRECISION,
  min_brain DOUBLE PRECISION,
  min_phase INTEGER,
  min_kills INTEGER,
  ord       INTEGER NOT NULL
);

CREATE TABLE evolution_items (
  evolution_id TEXT NOT NULL REFERENCES evolutions(id),
  item_id      TEXT NOT NULL, -- item ou carta rara (ex.: blue_card)
  PRIMARY KEY (evolution_id, item_id)
);

CREATE TABLE evolution_unlocks (
  evolution_id TEXT NOT NULL REFERENCES evolutions(id),
  partner_id   TEXT NOT NULL REFERENCES partners(id),
  PRIMARY KEY (evolution_id, partner_id)
);

-- Cartas do Tamers (equipamentos) -------------------------------------------
CREATE TABLE cards (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  kind    TEXT NOT NULL CHECK (kind IN ('passive', 'slash', 'rare')),
  weight  DOUBLE PRECISION NOT NULL,
  move_id TEXT REFERENCES moves(id), -- slash: golpe que entra no lugar
  ord     INTEGER NOT NULL
);

-- bônus em % (bônus = base_pct + per_level_pct × (nível − 1); nível máx. 10)
CREATE TABLE card_bonuses (
  card_id       TEXT NOT NULL REFERENCES cards(id),
  stat          TEXT NOT NULL CHECK (stat IN ('hp', 'atk', 'def', 'spd', 'brain', 'dmg', 'pickup', 'xp', 'cooldown')),
  base_pct      DOUBLE PRECISION NOT NULL,
  per_level_pct DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (card_id, stat)
);

CREATE TABLE card_partners (
  card_id    TEXT NOT NULL REFERENCES cards(id),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  PRIMARY KEY (card_id, partner_id)
);

-- Inimigos, minichefes e chefes ---------------------------------------------
CREATE TABLE enemies (
  digimon_id TEXT NOT NULL REFERENCES digimon(id),
  role       TEXT NOT NULL CHECK (role IN ('enemy', 'miniboss', 'boss')),
  hp         DOUBLE PRECISION NOT NULL,
  dmg        DOUBLE PRECISION NOT NULL,
  speed      DOUBLE PRECISION NOT NULL,
  xp         DOUBLE PRECISION NOT NULL,
  size       DOUBLE PRECISION NOT NULL,
  min_phase  INTEGER NOT NULL, -- chefe: a fase em que ele é o chefe
  ord        INTEGER NOT NULL,
  PRIMARY KEY (digimon_id, role)
);

CREATE TABLE boss_moves (
  digimon_id TEXT NOT NULL REFERENCES digimon(id),
  move_id    TEXT NOT NULL REFERENCES moves(id),
  ord        INTEGER NOT NULL,
  PRIMARY KEY (digimon_id, move_id)
);
