-- Ramo sombrio: evoluções que pedem jogar no limite (vezes em que o HP caiu abaixo de 25%).
ALTER TABLE evolutions ADD COLUMN min_near_deaths INTEGER;
