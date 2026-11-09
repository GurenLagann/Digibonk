-- Relíquias da Zona Digital: bônus para o resto da partida (até 3), escolhidas ao vencer uma Distorção.
-- stat/stat_pct: bônus de status em %; effect/effect_value: efeito especial (ver src/sim/relics.ts).
CREATE TABLE relics (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL,
  stat         TEXT NOT NULL CHECK (stat IN ('hp', 'atk', 'def', 'spd')),
  stat_pct     DOUBLE PRECISION NOT NULL,
  effect       TEXT NOT NULL CHECK (effect IN ('regen', 'pickup', 'xp', 'elite', 'revive', 'digidata')),
  effect_value DOUBLE PRECISION NOT NULL,
  ord          INTEGER NOT NULL
);
