# DigiBonk — Relevo nos biomas (morros e plataformas andáveis)

Data: 2026-11-15 · Status: APROVADA (opção A do usuário)

## Por quê
O usuário achou os cenários planos demais. Quer relevo **onde se joga**, não só no fundo.

## Decisão (opção A)
- Chão com relevo **andável** de até ~2 de altura; tudo que fica no chão acompanha a altura: parceiro, inimigos,
  sombras, itens, projéteis, áreas de golpe, baús, portais, altares/NPCs, pontos de missão, terminal, números de dano, câmera.
- **Só visual:** a simulação continua 2D (x/z); colisão, spawn, ímã e balanceamento não mudam.
- Florestas (DW1/DW3): colinas e vales suaves. Fábrica e Núcleo: **plataformas em degraus com rampas**.
- Borda: o relevo continua até a muralha/borda e se apaga para 0 além dela (fundo e Zona Digital ficam planos).

## Restrições
- Altura máxima ~2 (câmera sempre por cima, inimigo não some atrás de morro).
- Ponto de nascimento (raio ~6 em volta de 0,0) plano.
- Zona Digital (arena longe do mapa) plana.
- Decalques planos (grades, painéis, neon) só onde o chão é plano por baixo deles; nada "enterrado" ou flutuando.
- Desempenho: manter ~60 fps (malha do chão com resolução ~1,5 unidade só na área jogável + borda).

## Abordagens
- **A (escolhida):** função de altura por bioma, só no render. Barato e sem risco de balanceamento.
- B: relevo só na borda — não resolve o "plano" onde se joga.
- C: relevo que bloqueia (penhascos) — mexe em colisão/spawn/ímã; muito mais trabalho.

## Desenho
- `src/render/terrain.ts`: geradores puros de altura (colinas; degraus com rampas), plano no nascimento e longe do mapa;
  `groundY(x, z)` global com a função do bioma atual (`setGround`).
- `BiomeView.height(x, z)`; cada bioma monta o chão como malha deslocada e põe obstáculos/decoração na altura.
- `MapView.setBiome` registra a altura do bioma; render (billboards, vfx, map, câmera) usa `groundY`.
- Áreas de golpe desenhadas sem teste de profundidade (marcador no chão sempre visível no relevo).

## Deixado ao builder
- Formas exatas do ruído/degraus, número de níveis (2–3), largura das rampas, resolução da malha.
- Suavizar a altura da câmera se os degraus derem tranco.
