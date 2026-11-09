-- Sprite novo do Gazimon (ChatGPT, câmera 30°): um pouco maior em cena. Afeta também a colisão (0,9 → 1,1).
UPDATE enemies SET size = 1.1 WHERE digimon_id = 'gazimon' AND role = 'enemy';
