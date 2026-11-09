# Análise de mecânicas — PokéBonk (2026-11-09)

Partida gravada em pokebonk.com (v0.9.22): Onix → Steelix, Ilex Forest, modo Clássico, dificuldade Normal. Resultado:
vitória em 18:30, nível 85, 13,1 mil abates. A gravação foi feita com capturas e com a leitura do texto da tela.

**Regra:** do PokéBonk aproveitamos as mecânicas, não o jogo. Nomes, arte, itens e textos não entram. Tudo vira
equivalente Digimon.

Legenda de esforço para o DigiBonk: **P** pequeno (horas), **M** médio (um plano de 4–6 tarefas), **G** grande.

---

## 1. Progressão dentro da partida

### 1.1 Tela de subida de nível
- São 4 cartas, cada uma com **raridade**: Comum, Incomum, Raro, Lendário.
  - A raridade muda o tamanho do bônus. Exemplo, na mesma melhoria de golpe: Comum dá +22% de dano, Raro dá +32% de
    dano e −12% de recarga.
- Há três ações com **cargas limitadas** por partida:
  - **Atualizar** (8): sorteia as cartas de novo.
  - **Pular** (8): ignora o nível.
  - **Banir** (7): tira a carta do sorteio pelo resto da partida.
- Cada carta mostra o número **antes → depois** (ex.: "Dano por golpe 113 → 122") e quais golpes ela afeta. Uma carta
  que não afeta nenhum golpe diz isso: "Nenhum dos seus ataques usa isso".
- Tipos de carta:
  - **novo ataque**;
  - **melhoria de ataque**, que leva o nível de 1 a 8;
  - **vitamina**: atributo passivo, até 5 espaços.
- Selo **"No seu plano"**: o jogador monta antes um plano de build com 9 itens, e as cartas desse plano ganham destaque.
- **DigiBonk hoje:** 3 opções sem raridade, sem cargas e sem antes → depois. As cartas passivas têm nível.

### 1.2 Nível infinito (relatado pelo usuário, não aparece na gravação)
- O nível não tem teto.
- Quando não sobra nada para melhorar, cada novo nível dá **aumentos pequenos e aleatórios de atributo, aplicados sem
  abrir a tela**. Exemplos: +0,75% de vida máxima, +0,30 de ataque.
- Assim o jogo nunca trava em telas de escolha que não decidem nada, e o personagem continua crescendo.
- **DigiBonk hoje:** com tudo no máximo, `rollOffers` (`src/sim/progression.ts`) só oferece "+3 de status" e o jogador
  ainda precisa escolher a cada nível. **Melhoria P:** quando o pool de golpes e cartas estiver vazio, aplicar sozinho
  um ganho pequeno e aleatório, mostrando só um aviso ("+0,8% Vida").

### 1.3 Evolução e Maturidade
- Ao atingir o nível, aparece "Onix pode evoluir!" com uma escolha:
  - **evoluir**: muda a forma, a ultimate e dá bônus (Steelix: +40 de armadura);
  - **continuar como está**: ganha **Maturidade**, +12% de dano e de HP, e a ultimate fica mais forte. Formas que não
    evoluem têm Maturidade I e II, nos níveis 24 e 44.
- O item **Everstone** permite recusar uma vez por partida sem perder poder.
- **DigiBonk hoje:** recusar a evolução não dá nada. **Melhoria P:** "Ficar como está" dá um bônus permanente na
  partida. Combina com as evoluções secretas: a forma atual também tem valor.

### 1.4 Fusão de golpes
- É uma máquina no mapa, de **uso único**.
- O jogador escolhe um par de golpes no nível máximo (8) e decide entre **fundir** os dois num golpe novo ou **uni-los**
  num só espaço.
- O golpe fundido começa em ★1 e sobe até ★5 com as cartas seguintes, herdando as melhorias dos dois golpes.
- Na partida, Rock Tomb + Bulldoze viraram "Serpente de Pedra", responsável por **81% do dano**.
- **Equivalente Digimon:** DNA Digivolution e Jogress. **Esforço M.**

### 1.5 Esquecer e reaprender golpes
- Esquecer um golpe **devolve dinheiro**, mais quanto maior o nível dele.
- Um NPC ensina 1 entre 3 golpes para o espaço livre, uma vez por zona.
- **Esforço P a M.**

## 2. O mapa

### 2.1 Fendas (o ponto alto da partida)
- O item **Incenso**, vindo de Alfas e de totens, abre uma fenda com a tecla C. O jogador tem 30 s para entrar com E.
- Cada fenda tem um tipo (Inseto, Fada...) e uma raridade:
  - Comum: 4 ondas;
  - Rara: 5 ondas.
- Dentro da fenda:
  - é uma arena fechada;
  - o **relógio da zona para** (o tempo total continua);
  - há contador de inimigos restantes e um botão para chamar a próxima onda antes da hora;
  - no fim chega **o Alfa da fenda**, com 70 s para derrotá-lo.
- O prêmio é uma **Relíquia**:
  - escolha 1 entre 3;
  - vale pela partida toda, com 3 espaços;
  - cada uma dá bônus de atributo e um efeito especial (ex.: "+8 de sorte; as bolas do mapa custam 12% menos").
- Depois um portal leva de volta ao mapa.
- **Equivalente Digimon:** "Zona Digital" ou "Distorção", aberta por um item, com um Digimon chefe do tipo (Vacina,
  Dados ou Vírus). Pode ser o lugar natural para os **Digi Data** saírem garantidos. **Esforço M.**

### 2.2 Alfas e aliados
- Os Alfas são inimigos-elite maiores. Ao derrotar um, o jogador pode **capturá-lo para lutar ao seu lado só naquela
  partida**.
- Um aliado dá um bônus passivo (+8 de sorte, +1,2 de coleta, +8% de XP) e usa um golpe próprio.
- O **Vínculo** sobe com o uso: cada nível dá +10% de dano e de apoio.
- Na partida, 3 aliados fizeram 4% do dano.
- **Equivalente Digimon:** um Digimon "domado" vira aliado temporário. **Esforço G**, porque precisa de IA aliada.

### 2.3 Altares: risco escolhido pelo jogador
| Altar | Efeito |
|---|---|
| Porygon | Troca um atributo por outro. |
| Unown | Dano extra contra elites e chefes (+14% a +25%). |
| Gengar | Mais dificuldade, em troca de mais XP e mais prêmios. A maldição acumula: +5% de inimigos por nível. |
| Rhydon | Até 3 "rugidos". Cada um dá ao guardião +30% de HP, +12% de dano e mais escolta, e o guardião deixa uma bola extra. |
- **Equivalente Digimon:** totens ou terminais. **Esforço M**, e pode crescer aos poucos.

### 2.4 Bolas pagas e surpresas
- As Poké Bolas do mapa custam dinheiro e o preço sobe na partida (31 → 50 → 108 ₽). Algumas são grátis.
- Itens com efeito:
  - orbes de tipo: aumentam o dano de um tipo;
  - pedras: dão bônus;
  - vara de pesca: pescar na água.
- Há a **bola amaldiçoada** ("grátis... tem certeza?"), que é uma armadilha de fantasmas.
- Uma "máquina" de prêmios pode soltar itens ou Voltorbs que explodem.
- Há eventos curtos: um enxame que cerca o jogador, um ímã que puxa toda a XP, uma explosão que limpa a área.
- **DigiBonk hoje:** baús grátis em lugares fixos. **Melhoria P a M:** dar preço aos baús (moeda da partida), com uma
  variante "amaldiçoada".

## 3. Estrutura da partida
- **Mapa:** 3 zonas, cada uma com um guardião sorteado de uma lista, e um **Santuário** final com chefe.
- **Clima e maldições** visíveis no HUD: "Céu limpo · Gengar ×2 · Maldição ×1".
- **Dificuldade multiplica a recompensa:** Normal ×1, Difícil ×1,75 com inimigos +70%, Pesadelo ×2,5 com inimigos +160%.
- **Contra o relógio:** medalhas Bronze (qualquer vitória), Prata (< 24:00), Ouro (< 18:00) e Campeão (< 13:30).
- **Sequência:** contador de abates seguidos (×12.595 na partida).
- **Controles:** pulo e planar (Espaço), deslizar (Shift), ultimate (R) com carga visível, fixar alvo com o botão direito.

## 4. Fora da partida (meta-progressão)
- **Mochila:** até 3 consumíveis gastos ao começar. Rare Candy dá +2 níveis, Lucky Egg +25% de XP, Amulet Coin +50% de
  dinheiro, Mel atrai um Alfa a mais, Master Ball garante a primeira captura.
- **Moedas:** Stardust (permanente, gasta no Laboratório) e Bonkoins (roletas). Pokédólares só valem na partida.
- **Pesquisa:** soltar ou derrotar Pokémon soma pontos para liberar lendários (ex.: 2/3 para liberar Raikou).
- **Também tem:** tarefas diárias e semanais, conquistas, temporadas com ranking e clãs.
- **Seleção de personagem:**
  - "passiva de classe" (Onix: +25 de armadura, +15% de HP, −8% de velocidade, rochas a cada 6 s);
  - kit de golpes que se liberam por nível;
  - tabela de fraquezas e resistências;
  - kits compartilhados por tipo.

## 5. Telas de informação
- **Pausa:** ficha completa.
  - Atributos de ataque, defesa e utilidade, com o melhor que o base destacado em verde.
  - Cada golpe com dano total, % do dano total e **dano por segundo dos últimos 15 s**.
  - Os itens com o efeito ativo no momento.
- **Resultado:**
  - dano por golpe, inclusive dos golpes já esquecidos;
  - aliados;
  - abates por espécie;
  - tarefas concluídas;
  - recompensas;
  - posição no ranking.

---

## Recomendação de ordem para o DigiBonk

| # | Mecânica | Esforço | Por quê |
|---|---|---|---|
| 1 | Nível infinito com ganho automático (1.2) | P | Acaba com telas inúteis no fim da partida. |
| 2 | Raridade das cartas + atualizar/pular/banir + antes→depois (1.1) | P–M | Cada nível fica uma decisão de verdade. |
| 3 | "Ficar como está" com bônus (1.3) | P | Completa as evoluções secretas. |
| 4 | Zona Digital com relíquias (2.1) | M | Dá vida ao mapa e é a fonte natural de Digi Data. |
| 5 | Jogress de golpes no nível máximo (1.4) | M | É o "pico de poder" da partida e combina com DNA Digivolution. |
| 6 | Altares de risco (2.3) e baús pagos (2.4) | M | Escolhas no mapa. |
| 7 | Digimon aliados (2.2) | G | Precisa de IA aliada. |
| 8 | Ficha de dano por golpe na pausa e no resultado (5) | P | Ajuda a balancear tudo isso. |
