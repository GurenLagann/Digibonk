# Painel dos devs

Gera `docs/painel/index.html`: planos concluídos, próximos passos, pendências, gráficos de sprites e as linhas de
digievolução com a miniatura de cada sprite.

```bash
npm run painel               # roda os testes para mostrar a contagem
npm run painel -- --sem-testes
```

- Linhas, requisitos e sprites vêm do jogo (`src/data/generated/gamedata.ts` e `public/sprites/manifest.json`).
- O texto curado (planos, próximos passos, pendências, data) fica em `conteudo.json`: edite lá e gere de novo.
- Folhas com defeito conhecido ficam em `SPRITE_ADJUST` (`dados.ts`).
