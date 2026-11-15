# DigiBonk — câmera em terceira pessoa + biomas Floresta DW1/DW3

Data: 2026-11-15. Status: aguardando aprovação.

## Intenção

O usuário quer que o DigiBonk tenha a sensação de câmera do PokéBonk: **atrás e perto do
parceiro, baixa o bastante para ver o horizonte e o cenário em volta, girando com o mouse**
("tudo isso"). Com o horizonte visível, o mapa precisa deixar de ser um chão verde quadriculado
com rochedos na borda e passar a ter **biomas** com cara de lugar. O primeiro passo são duas
florestas: uma inspirada na Native Forest do **DW1** e outra nas florestas do **DW3** (Wire /
Kicking / Protocol Forest), a partir dos cenários que o colaborador pôs na DW Wiki
(`public/cenarios_dw1/MAYO*`, `public/cenarios_dw3/S335,S350,S355,S370,S400`).

## Objetivos

1. Câmera em terceira pessoa estilo PokéBonk, controlada por mouse (teclado+mouse é o modo
   principal do usuário) e pelo analógico direito do controle (suporte obrigatório; o 8BitDo já
   funciona hoje no analógico esquerdo + botões).
2. Movimento relativo à câmera (W / analógico para frente = para onde a câmera olha).
3. Sprites mostram a vista certa (frente, costas, lado, diagonais) conforme o ângulo entre o
   Digimon e a câmera — parceiro **e** inimigos — reaproveitando todas as folhas existentes.
4. Dois biomas: **Floresta DW1** e **Floresta DW3**. Fase 1 = DW1, fase 2 = DW3, alternando
   daí em diante (até existirem outros biomas). Botão no debug (F2) troca o bioma na hora.
5. Horizonte: céu + borda de mata no lugar do fundo azul liso e dos rochedos.

## Não-objetivos

- Outros biomas (Fábrica, Zona de dados etc.) — ficam para depois, um por fase.
- Mudar a Zona Digital (arena separada continua igual, só precisa funcionar com a câmera nova).
- Mudar mecânica de jogo: posições/raios dos obstáculos (`MAP_OBSTACLES`), tamanho do mapa,
  colisão, golpes automáticos, ritmo/quantidade de spawns (exceção: *onde* eles nascem, ver abaixo).
- Aviso de inimigos fora da vista (setas, minimapa): o usuário aceitou sem aviso, como no PokéBonk.
- A câmera e o bioma são só apresentação + input.
- Usar os cenários como imagem inteira dentro do jogo (telas de fase, fundos de menu) — é outra
  ideia (opção 2), fora deste trabalho.

## Anti-objetivos (falharia mesmo "funcionando")

- Câmera que enjoa ou briga com o jogador: girar sozinha, tremer, atravessar árvores e esconder
  o parceiro, ficar tão baixa que não se veem os inimigos chegando.
- Perder as vistas que o usuário fez com tanto trabalho (diagonais, costas) ou sprites
  "deslizando" de lado quando deveriam mostrar costas.
- Cenário que pareça colagem: perspectiva dos fundos pré-renderizados aplicada no chão, emendas
  visíveis na textura repetida.
- Commitar imagens inteiras dos jogos originais através do jogo. Só **recortes transformados em
  textura** (pedaços de grama, terra, casca, folhagem) entram como assets do jogo; o repo é
  público (mesmo critério já adotado com o Digimon Survive).
- Queda de fps perceptível — a pendência antiga "medir fps com a janela visível" vale aqui.

## Decisões do usuário

- Câmera do PokéBonk em tudo: atrás/perto, horizonte, girar com mouse.
- Mouse + teclado é o principal; controle tem que funcionar também.
- Começar pela floresta; fazer **duas**: uma baseada no DW1, outra no DW3.
- Fase 1 = DW1, fase 2 = DW3, alternando; botão de debug para trocar (proposta aceita: "pode").
- Inimigos nascem fora da vista da câmera (opção 1b); inimigos pelas costas sem aviso.
- Aprovou a descrição da câmera/controles/sprites/cenário ("acho que está tudo certo").

## Como (o que já está decidido)

### Câmera e controles
- Câmera orbital atrás do parceiro: yaw (gira em volta) livre; pitch limitado a uma faixa
  pequena (um pouco acima/abaixo do padrão). Distância e altura próximas, mostrando horizonte.
- **Só gira quando o jogador mexe** — não se ajeita sozinha atrás do parceiro (como no
  PokéBonk; dá para andar de lado e de costas). *(minha sugestão, aceita)*
- Mouse: Pointer Lock durante a partida (cursor some); liberado em pausa, cartas de level up,
  modais e qualquer menu; re-trava ao voltar ao jogo (clique ou tecla, respeitando a regra do
  navegador de exigir gesto do usuário).
- Controle: analógico direito gira (eixos 2/3 do Gamepad API padrão); esquerdo move.
- Eixos da câmera no controle **remapeáveis** nas opções, como os botões já são; padrão eixos 2/3. O 8BitDo do usuário em modo D aparece no Chrome com `mapping:""` (não-standard), então 2/3 pode não ser o analógico direito — conferir com o controle real. *(minha decisão)*
- Opções: sensibilidade (mouse e controle) e inverter eixo vertical, salvas no save/opções
  existentes. *(minha sugestão)*
- `input.move()` continua devolvendo intenção em espaço de tela/câmera; a rotação pelo yaw da
  câmera é aplicada antes de `stepRun` (o sim continua recebendo um vetor de mundo).

### Spawn fora da vista
- Decisão do usuário (1b): inimigos nascem **fora do campo de visão da câmera** (atrás/dos lados
  ou além do nevoeiro), para não "brotarem" na frente com a câmera baixa. Muda só a escolha da
  posição em `stepDirector` (`src/sim/director.ts`); a câmera (yaw/FOV) entra como parâmetro
  puro e testável. Nevoeiro fica longe o bastante para mostrar horizonte.

### Vistas dos sprites
- Para cada Digimon, a vista vem do ângulo entre a direção para onde ele está virado (direção de
  movimento; para inimigos, a direção em que andam) e a direção da câmera. Mapeia para o
  `Facing` existente (`side | up | down | diagup | diagdown`) + espelhamento horizontal.
- Sem a vista na folha → a mais próxima disponível (o fallback de `moveFrame`/`deathFrame` já
  cai para `side`). Nenhuma folha precisa ser refeita.
- Billboard continua virado para a câmera (já usa o quaternion da câmera).

### Biomas
- Um conceito de bioma na camada de render (`src/render/`), escolhido pela fase:
  ímpares = Floresta DW1, pares = Floresta DW3. Debug F2 ganha "Trocar bioma".
- Cada bioma define: texturas de chão (repetíveis, sem emenda), árvore/pedra (geometria +
  textura) desenhadas nas posições de `MAP_OBSTACLES`, decoração sem colisão, borda, céu,
  nevoeiro e luz.
- **Floresta DW1:** grama verde-escura densa quase sem terra; árvores de copa redonda e fofa
  em moitas; árvores secas e alguma árvore gigante de raízes; flores, cercas de
  madeira, tocos; luz mais fechada.
- **Floresta DW3:** grama verde-amarelada clara com trilhas de terra arenosa; pinheiros;
  detalhes "digitais" (canos metálicos, cabos no chão, placas, postes); luz clara de dia;
  borda com penhascos de terra.
- Decoração **sem colisão fica baixa** dentro da área jogável (grama alta, flores, tocos, cercas, cabos). Peças altas (árvores grandes, árvores secas, árvore gigante, postes) só nas posições de `MAP_OBSTACLES` ou fora do limite do mapa, para ninguém atravessar árvore. *(minha decisão)*
- Borda: muralha de mata densa (DW1) / pinheiros + penhasco (DW3) no limite `MAP_HALF`,
  substituindo os rochedos. Atrás: céu em degradê + silhueta de mata distante.
- Não existe tinta por fase hoje (o `sync` de `map.ts` só refaz altar/anéis/baús na troca de fase); o bioma é que diferencia as fases.
- Zona Digital mantém seu chão/céu/nevoeiro escuros.
- Texturas: recortadas das imagens `cenarios_dw1/MAYO*` e `cenarios_dw3/S3xx/S400`, tratadas
  para repetir sem emenda, salvas como assets do jogo (ex.: `public/biomas/<bioma>/`). Script de
  recorte/geração versionado em `tools/` para poder refazer.

## Restrições

- Three.js + TypeScript, mesmo projeto; testes com vitest (472 hoje) e `tsc` limpo.
- Lógica testável fora do render (ex.: cálculo de vista câmera↔movimento, rotação da intenção de
  movimento, escolha de bioma por fase) deve ficar em funções puras com teste.
- Conferência no Chrome (como de costume no projeto): andar nas 8 direções com a câmera em
  vários ângulos, ver vistas certas do parceiro e dos inimigos, os dois biomas, a Zona Digital,
  pausa/menus soltando o cursor, controle girando a câmera.
- Não commitar `src/render/sprites.ts`/`vfx.ts` do teste local do Survive.

## Deixado para quem implementar

- Valores exatos de distância, altura, FOV, faixa de pitch, distância do nevoeiro.
- Como evitar que árvores tapem o parceiro (transparência das copas perto da linha de visão,
  aproximar a câmera, etc.).
- Geometria/LOD das árvores e decoração dentro do orçamento de fps.
- Formato exato da escolha de vista (limiares de ângulo) desde que respeite o fallback.
- Onde guardar as opções de sensibilidade dentro do save/opções atuais.
