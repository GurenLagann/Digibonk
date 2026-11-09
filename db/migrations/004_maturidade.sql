-- Maturidade: evoluções que só valem depois de o parceiro amadurecer (ficar na forma, com bônus).
-- Ao amadurecer, as evoluções normais da forma travam e só estas continuam.
ALTER TABLE evolutions ADD COLUMN requires_maturity INTEGER;
