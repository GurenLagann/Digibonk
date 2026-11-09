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

## 6. Telas do menu: Pokédex, Laboratório, Builds e Ranking

### 6.1 Pokédex (enciclopédia)
- Abas: **Pokémon** (251), **Ataques** (734), **Vitaminas** (26) e **Itens** (132).
- **Pokémon:**
  - contadores de vistos (250/251), shinies (37) e famílias capturadas (125);
  - filtros: Todos, Vistos, Capturados, Shiny e por tipo;
  - a ficha traz descrição, altura e peso, status de pesquisa, status base, linha evolutiva, golpes na partida e plano
    de build.
- **Ataques:**
  - filtros por físico, especial ou fusão;
  - **24 padrões de ataque**: projétil, esfera explosiva, bomba, rajada, teleguiado, bumerangue, drenagem, raio, cone,
    onda, onda de choque, corrente, impacto celeste, meteoro, armadilha, vórtice, golpe, investida, giro, aura, órbita,
    rastro, clima e potencializador;
  - os ataques de fusão aparecem como "Fusão de assinatura".
- **Vitaminas:** 26 atributos passivos. Os incomuns são os mais interessantes:
  - "Incenso Maldito": mais inimigos e mais fortes, em troca de +6% de XP e de dinheiro;
  - "Dado Viciado": um atributo aleatório;
  - espinhos, sobrecura, surgimento de elites.
- **Itens:** 132, por raridade (Comum a Lendário), com filtros Desbloqueados, Bloqueados e **Arquivados**.
- **Caderno de pesquisa (o "Analyzer"):**
  - derrotar Pokémon soma pesquisa para a família, e Alfas, chefes e jaulas somam mais;
  - completar uma família libera os Pokémon dela como avatar;
  - completar famílias de um tipo libera uma **moldura de tipo** (18 molduras);
  - marcos do pesquisador a cada 5, 15, 30, 45 e 60 famílias, cada um com recompensa.
- **DigiBonk hoje:** só existe `save.discovered`, uma lista de formas, sem tela. **Proposta M:** um "Digimon Analyzer"
  com ficha por Digimon, evoluções descobertas (já temos isso) e pistas de Digi Data. Abates por espécie dariam
  "pesquisa" e liberariam cosméticos.

### 6.2 Laboratório (meta-progressão com moeda permanente)
- **Treinamento:** atributos permanentes em vários níveis.
  - +4% de dano, +8 de HP, +2,5% de velocidade, +5% de XP, +8% de dinheiro, +5 de sorte, +0,6 de coleta,
    +0,2 de regeneração, +2 de armadura, +1% de crítico, +2% de velocidade de ataque, +3% de área.
  - Cada melhoria pode ser **desligada** depois de chegar ao máximo, para jogar mais difícil.
- **Equipe da partida:** espaços e ferramentas, desbloqueados uma vez.
  - 4º espaço de ataque, +espaços de vitamina, +usos de Atualizar, Pular e Banir, **quarta opção** na subida de nível.
  - Começar com um Revive, +25% de pesquisa, +1 espaço de Alfa de apoio.
  - **Arquivo:** espaços para tirar itens do sorteio. Ganha +5 por nível e +1 por item desbloqueado.
  - Ultimate carrega 4% mais rápido, mochila com 3 itens.
  - **Afinidade:** aumenta a raridade das cartas dos ataques favoritos.
- **Itens:** desbloqueio de itens no pool, 132 ao todo.
- **DigiBonk hoje:** `save.currency` existe, mas não é usado. **Proposta M:** uma moeda permanente ganha por partida e
  uma tela de melhorias. Começar só pelos itens de "equipe da partida", que liberam as mecânicas da seção 1.1
  (atualizar, banir, 4ª opção), mais 4–6 atributos. Assim a raridade e o banir viram progressão.

### 6.3 Builds (preferências por personagem)
- Para cada Pokémon e sua linha, o jogador marca com **★** o que quer que apareça mais e com **✕** o que não quer ver.
  Vale ao começar cada partida com ele.
- O editor tem quatro grupos:
  - Ataques (até 8);
  - Vitaminas (até 5);
  - Fusões (até 3);
  - Itens.
- Os ataques mostram a origem: "Kit dele", "Linha dele" ou "Kit de Skarmory", que são kits emprestados de Pokémon da
  mesma liga ou tipo.
  - Um selo "Para a sua fusão" marca o que alimenta uma fusão planejada.
- Há vários planos por Pokémon, com Renomear, Duplicar e Esvaziar, e **compartilhar e importar por código**. A aba
  "Aluguel" usa builds de outros jogadores.
- **Ideia do usuário (2026-11-09): caminho de digievolução na build.**
  - O jogador escolhe na build do parceiro a linha que quer seguir (ex.: Agumon → Greymon → SkullGreymon →
    BlackWarGreymon).
  - Só entram arestas **descobertas**. As secretas aparecem como "Greymon → ???", com as pistas de Digi Data já
    reveladas, para não estragar a surpresa.
  - Na partida:
    - o painel "Próx. evolução" mira a forma da build;
    - as cartas que ajudam o caminho ganham um selo, como o "No seu plano";
    - na escolha entre evoluções descobertas, a da build já vem selecionada.
  - Em aberto: decidir se o caminho também **altera o sorteio das cartas** (ex.: oferecer mais os status pedidos) ou se
    só orienta.
- **DigiBonk hoje:** nada. **Proposta P–M:** começar só com ★ e ✕ por parceiro. O ★ dobra o peso no sorteio da
  subida de nível e o ✕ tira do sorteio. É barato e combina com a raridade.

### 6.4 Ranking (precisa de servidor)
- Tabelas:
  - por **abates**, global (soma da melhor partida de cada uma das 9 regiões) e por região;
  - **por Pokémon**;
  - **Sobrevivência** (tempo sobrevivido);
  - **Contra o relógio** (vitória mais rápida);
  - **Clãs** e **Cooperativo**.
- Temporadas de cerca de 1 mês. O top 100 ganha insígnia, moldura e Stardust, de 100 a 1500 conforme a faixa. Os
  recordes são "validados contra trapaças".
- **DigiBonk hoje:** a tela Recordes é local (melhor fase, vitórias e partidas por parceiro). O servidor ficou para
  depois na decisão do banco. **Proposta P (local):** recordes por parceiro, por mapa e contra o relógio, com medalhas
  Bronze, Prata, Ouro e Campeão. O ranking online fica para quando houver servidor.

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
| 9 | ★/✕ por parceiro (6.3) | P–M | Dá controle sobre o sorteio; casa com a raridade. |
| 10 | Laboratório com moeda permanente (6.2) | M | Transforma atualizar, banir e 4ª opção em progressão; usa `save.currency`. |
| 11 | Digimon Analyzer (6.1) | M | Vitrine das evoluções secretas e do Digi Data. |
| 12 | Recordes locais por mapa e contra o relógio (6.4) | P | O ranking online fica para quando houver servidor. |
