# ChatGPT prompts for DigiBonk sprites

ChatGPT is the default source for evolved forms. It returns a 1536×1024 PNG with a **transparent background**, and it holds size and baseline across a whole 8×8 sheet. (Gemini, in `gemini-prompt.md`, needs one animation per image.)

Two sheets per Digimon, each in a **new conversation**:

1. **Base sheet**: 8 rows × 8 frames. Walk and run, each in right / left / front / back.
2. **Diagonal sheet**: 4 rows × 8 frames, 3/4 views facing left. Attach the base sheet that ChatGPT just made.

Ask for diagonals separately. When diagonals were requested together with everything else, ChatGPT returned 15 mixed rows with no real 3/4 view.

## Attachments

| Prompt | Image 1 (character) | Image 2 (format) |
|---|---|---|
| Base, Digimon already has an approved sheet | that sheet | `assets-src/sprites/gemini-src/metalgreymon-chatgpt.png` |
| Base, new Digimon | none (ChatGPT knows it by name) | `assets-src/sprites/gemini-src/greymon-chatgpt-v2.png` |
| Diagonal | the approved base sheet of this Digimon | none |

For a new Digimon, replace the first paragraph of the base prompt with: `Desenhe {DIGIMON} (Digimon) no mesmo estilo de pixel art da imagem anexa. Use a imagem só como modelo de estilo e de formato; não desenhe o personagem dela.`

## Base prompt

```
Refaça a folha de sprites do personagem da imagem 1, mantendo exatamente o mesmo
personagem, as mesmas cores, as mesmas proporções e o mesmo estilo de pixel art.
Use a imagem 2 só como modelo de formato (grade, fundo transparente, organização).
Não mude o design do personagem.

FORMATO
- PNG com fundo 100% transparente, sem sombra no chão, sem brilho/aura em volta,
  sem textos, títulos, rótulos ou molduras.
- Grade de 8 linhas × 8 colunas, cada célula do mesmo tamanho.
- O personagem tem exatamente o mesmo tamanho em todos os 64 quadros, os pés
  sempre na mesma altura (linha de chão fixa) e centralizado na célula.
- Contorno escuro de 1 px em volta do personagem, pixels nítidos, sem anti-aliasing
  borrado.

CÂMERA (IMPORTANTE)
- Câmera elevada olhando de cima em ~30 graus (estilo RPG de visão de cima, como Pokémon
  dos jogos de DS). Em TODAS as vistas, inclusive de perfil, aparece um pouco do topo
  da cabeça e das costas, e os pés ficam levemente achatados no chão.
- Nada de vista totalmente de lado na altura dos olhos.

LINHAS (de cima para baixo)
1. Andando para a DIREITA (vista de perfil)
2. Andando para a ESQUERDA (vista de perfil)
3. Andando para BAIXO (de frente para a câmera)
4. Andando para CIMA (de costas para a câmera)
5. Correndo para a DIREITA
6. Correndo para a ESQUERDA
7. Correndo para BAIXO (de frente)
8. Correndo para CIMA (de costas)

ANIMAÇÃO
- Cada linha é UM ciclo contínuo de 8 quadros que fecha em loop: o quadro 8
  emenda suavemente no quadro 1.
- Andar: passos curtos, uma perna à frente e depois a outra, braços balançando
  pouco. Correr: passada larga, corpo inclinado para frente, braços balançando
  mais, cauda mais esticada.
- Nas linhas de frente e de costas as pernas precisam se mexer de verdade
  (esquerda avança, depois direita), e o corpo sobe e desce levemente.
- A cauda fica sempre centralizada atrás do corpo nas vistas de frente e costas,
  balançando pouco de um lado para o outro. Ela não pode pular de lado.
- Mesma expressão em todos os quadros (boca levemente aberta), sem abrir e
  fechar a boca aleatoriamente.
- As linhas 2 e 6 devem ser o espelho exato das linhas 1 e 5.
```

Add a sentence for each asymmetric part the Digimon has, such as `O canhão fica sempre no braço esquerdo dele.` for MetalGreymon.

## Diagonal prompt

```
Use o personagem da imagem anexa (mesmo design, cores, proporções e estilo de
pixel art, MESMO TAMANHO dos sprites da imagem). Faça uma folha nova só com as
vistas DIAGONAIS (3/4), que ainda não existem na imagem.

FORMATO
- PNG com fundo 100% transparente, sem sombra no chão, sem brilho em volta,
  sem textos ou rótulos.
- Grade de 4 linhas × 8 colunas, células iguais e bem espaçadas (nenhum sprite
  encostando no outro).
- Personagem do mesmo tamanho em todos os quadros, pés na mesma linha de chão,
  centralizado na célula.

CÂMERA (IMPORTANTE)
- Câmera elevada olhando de cima em ~30 graus (estilo RPG de visão de cima, como Pokémon
  dos jogos de DS). Em TODAS as vistas, inclusive de perfil, aparece um pouco do topo
  da cabeça e das costas, e os pés ficam levemente achatados no chão.
- Nada de vista totalmente de lado na altura dos olhos.

LINHAS
1. Andando na diagonal PARA BAIXO E PARA A ESQUERDA: vista 3/4 de frente. O
   corpo está virado para a esquerda e para a câmera ao mesmo tempo; vemos o
   rosto, o peito/barriga e o lado esquerdo do corpo. Cauda saindo para trás à
   direita.
2. Andando na diagonal PARA CIMA E PARA A ESQUERDA: vista 3/4 de costas. O
   corpo está virado para a esquerda e para longe da câmera; vemos as costas,
   a nuca e o lado do corpo, o rosto quase não aparece. Cauda vindo em direção
   à câmera, à direita.
3. Correndo na mesma diagonal da linha 1 (3/4 de frente, para a esquerda).
4. Correndo na mesma diagonal da linha 2 (3/4 de costas, para a esquerda).

ANIMAÇÃO
- Cada linha é um ciclo de 8 quadros em loop (o 8º emenda no 1º).
- Andar: passos curtos alternando as pernas. Correr: passada larga, corpo
  inclinado, braços e cauda balançando mais.
- Todos os quadros de uma linha precisam ter o MESMO ângulo de câmera. Não
  misturar perfil, frente ou costas no meio.
```

To redo one bad row, use a new conversation with the approved sheet attached: `Refaça só a linha N desta folha (…descrição da linha…), mesmo tamanho e estilo, 1 linha × 8 quadros, fundo transparente.`

## Evaluating a result

The chat preview shows the transparent background as a dark smudge. That is normal; judge the cut frames instead.

Ask for a redo when:

- a row mixes viewing angles, or a "diagonal" row is really a profile;
- the size or the ground line changes between frames, which makes the sprite shake in game;
- rows touch each other or the row count is wrong;
- the sprites are much smaller than in the attached sheet;
- the background is not transparent and not flat white.

These are minor and can stay: small dark shadows under the feet, a raised foot drawn in perspective (it looks like a blob), slight stripe changes between frames.

## Cutting

```bash
bash tools/sprites/cut-chatgpt.sh ID base.png 70 -,walk,walkdown,walkup,-,run,rundown,runup \
                                     diag.png 50 walkdiagdown,walkdiagup,rundiagdown,rundiagup
npm run sprites:vpet
```

- The left rows (2 and 6) are used as they are, and the right rows are skipped with `-`. Check that every left frame really faces left.
- **Scale**: aim for frames about 80–90 px tall. Each sheet gets its own scale so that every view ends up the same height. Take the median frame height H from `node --experimental-strip-types tools/sprites/alpha-grid.ts SHEET.png ROWS` (the 4th number of each box): `scale = 85 / H × 100`. Diagonal sheets are usually drawn larger, about 50% where the base sheet is 70%.
- Save the source sheets in `assets-src/sprites/gemini-src/<id>-chatgpt*.png`.
