# DigiBonk — reformulação da interface

Data: 2026-11-08 · Status: aguardando aprovação do usuário (revisado após checagem de construtor)

## Por quê

A interface atual é uma caixa azul genérica no meio da tela, com cartões de texto pequenos e nenhum Digimon à vista nos menus. O usuário quer que o jogo **pareça um jogo de Digimon moderno**: o clima do *Digimon Story: Time Stranger*, com cara de **interface tecnológica** (painéis digitais, "sistema"), e a estrutura rica em informação do **PokéBonk** (pokebonk.com), que mostra status, golpes e tipos nas telas. Não é só deixar bonito: as telas passam a **mostrar mais informação**.

## Metas

- Uma identidade visual única (ver "Estilo B2") aplicada a **todas** as telas e ao HUD.
- Escolha de parceiro rica em informação, no estilo PokéBonk.
- HUD "completo" com a barra de tempo da fase "hackeada".
- Level up em forma de **cartas no estilo Digimon Tamers**, com animação de Card Slash.
- Registrar no save os dados que as telas novas mostram (por parceiro, níveis de evolução, chefes).
- Fecha junto a Tarefa 5 do Plano 2 (retratos nos menus + créditos).

## Não-metas

- Não muda regras de jogo, balanceamento, dados de Digimon, sprites ou o cenário 3D.
- Não cria a loja (fica para outro plano). O botão/bloco de loja **não** aparece.
- Não cria tela de configurações nova além do que já existe (Controles).

## Anti-metas (seria um fracasso mesmo funcionando)

- HUD que esconde a ação: os painéis ficam nas bordas, o centro da tela livre.
- Perder a navegação por teclado/controle que os menus têm hoje (setas/D-pad, confirmar, cancelar, atalhos 1/2/3).
- Copiar arte, molduras ou logos oficiais (cartas do Tamers, logo Digimon, UI do Time Stranger/PokéBonk). É inspiração de clima, não cópia.
- Prometer na tela um número que o jogo não registra.

## Estilo B2 (escolhido pelo usuário)

Estrutura do estilo "vibrante" com as cores do estilo "Digivice":

- **Fundo:** azul-marinho escuro (radial de ~#12345a para ~#050b16) com grade fina ciano, linhas de varredura discretas. Nos menus o jogo 3D continua visível atrás, escurecido.
- **Painéis:** vidro escuro (gradiente #0f2a4c→#08162b, levemente translúcido), contorno ciano (#00d9ff ~45%), brilho ciano suave por dentro e por fora, **cantos alternados** (grandes arredondados em dois cantos opostos, quase retos nos outros dois — ex.: `16px 4px 16px 4px`), um pequeno marcador tracejado ciano no canto superior direito dos painéis principais.
- **Títulos:** itálico, peso 900, branco com brilho ciano.
- **Rótulos:** maiúsculas pequenas, espaçadas, ciano claro.
- **Botão principal:** pílula grande laranja (gradiente #ff6a13→#ffae2e) com sombra "3D" e brilho; mostra a tecla de atalho num selo (`Enter`, `1`, `Esc`).
- **Botão secundário:** pílula com contorno ciano.
- **Laranja (#ff8a1f) é reservado para destaque:** item selecionado, botão principal, golpe assinatura.
- **Selos de atributo/elemento:** pílulas coloridas (ex.: Vacina azul, Fogo laranja) — uma cor por atributo e por elemento.
- **Barras de status:** gradiente ciano→azul com brilho; ganhos ("antes → depois") em verde (#5dff8f).

Fonte, ícones e cores exatas por atributo/elemento ficam a cargo do construtor, dentro desse estilo. O usuário pediu para usar a skill **ui-ux-pro-max** (ou outra melhor) para refinar o design durante a implementação.

Mockups aprovados (referência visual, em `.superpowers/brainstorm/1050564-1794112701/content/`, fora do git): `visual-style-v2.html` (B2), `hud-v4.html`, `telas-entrada.html`, `telas-partida.html`, `levelup-cards.html`.

## Telas

### Tela inicial
- Logo grande "Digi**Bonk**" (Digi branco/ciano, Bonk laranja, itálico com brilho) e subtítulo "Survivor de Digimon · fan-game não oficial".
- Um Digimon de destaque grande ao lado (sprite).
- Botão "▶ Jogar" grande; abaixo, blocos com ícone: **Parceiros** (x/11 liberados), **Recordes** (melhor fase), **Controles**, **Créditos**. Todos selecionáveis por teclado/controle, como hoje.
  - **Parceiros** abre a escolha de parceiro em **modo só de consulta** (mesma tela, sem o botão de escolher; "Voltar" volta à tela inicial). Decisão do usuário.
  - **Recordes** abre uma **tela nova simples** com os números gerais (vitórias, partidas, melhor fase, parceiros liberados) e uma lista por parceiro liberado (retrato, partidas, vitórias, melhor fase). Decisão do usuário.
- Cartão "Seu progresso": vitórias, partidas, parceiros liberados.
- Aviso legal curto no rodapé.
- A tela "Escolha a temporada" **deixa de existir**: Jogar vai direto para a escolha de parceiro.

### Escolha de parceiro (estilo PokéBonk)
- **Painel esquerdo (detalhe do selecionado):** estágio e temporada, nome, selos de atributo e elemento, sprite grande, barras dos 5 status base (HP, Atq, Def, Vel, Int) com o número, golpe assinatura e os golpes do kit, cada um com a descrição curta do golpe (ver "Descrições dos golpes"), o requisito da 1ª evolução ("Greymon · Nv 8 e Atq 14"; se houver vários caminhos, listar todos), e as estatísticas do jogador com aquele parceiro (partidas, vitórias, melhor fase).
- **Sem linha evolutiva** (decisão do usuário: ela ramifica durante o jogo).
- **Painel direito:** **um único cartão com todos os parceiros**, em ordem de temporada (Adventure, 02, Tamers), retrato + nome; bloqueados em silhueta preta com "???" e a dica "encontre o ovo nas fases". Sem abas.
- Parceiro bloqueado pode ser selecionado para ver a silhueta, mas não pode ser escolhido; o painel esquerdo mostra só "???" e como desbloquear.
- Botão "Escolher parceiro! [Enter]" e "◀ Voltar [Esc]".

### HUD da partida ("completo", versão 4)
- **Canto superior esquerdo — cartão do parceiro:** retrato, nome, nível, selos de atributo/elemento, barra de vida (verde) e de XP (ciano). Itens de evolução que o jogador tem (DigiEgg, dados de fusão) aparecem como selos pequenos neste cartão.
- **Topo, centro:**
  - Rótulo "FASE n/5 · TEMPO DA FASE" e a porcentagem.
  - **Barra de carregamento do tempo da fase**, parte preenchida **verde**, com efeito de dados sendo hackeados: dígitos binários correndo dentro da parte cheia, borda de escrita piscando, ruído logo após a borda e falhas rápidas (rosa/ciano) de vez em quando.
  - **Timer** abaixo da barra (com uma falha visual leve ocasional).
  - Objetivo da fase abaixo do timer (o texto de missão que existe hoje: fragmentos, ativação, guardião, "chefe liberado — vá ao altar", "derrote X").
  - **Último minuto:** o timer pisca em vermelho.
  - **Tempo esgotado (overtime, já existe no jogo):** a barra fica **completamente cheia e vermelha**, e o timer passa a contar o **tempo extra** ("+01:23").
- **Canto superior direito:** abates e **próxima evolução** — silhueta do Digimon e **só o que ainda falta** ("Nv 8 · Atq 14"). *(Decisões minhas:)* entre vários caminhos, ignora os impossíveis nesta partida (exigem parceiro não liberado no save) e escolhe o que tem **menos requisitos faltando** (empate: ordem dos dados); em forma final mostra "Forma final". Isso vira uma função pura testada na simulação. Quando uma evolução está disponível, esse painel acende (laranja) e mostra "Digievoluir [E / Y]" no lugar do aviso flutuante atual.
- **Embaixo, centro:** um painel com os **4 golpes** (assinatura com contorno laranja, recarga escurecendo o ícone, nível no canto) e as **3 cartas** (roxo, com nível), separados por um divisor.
- **Barra de vida do chefe:** mesmo estilo, logo acima do painel de golpes quando há chefe.
- A seta que aponta para o altar e os avisos (toasts) ganham o novo visual; os toasts saem do caminho dos painéis.

### Level up — cartas estilo Tamers
- Título "Level up! Escolha uma carta" e "Nome · Nv 7 → 8".
- Cada opção é uma **carta em pé** com:
  - moldura colorida pelo tipo — **ciano** golpe novo, **verde** melhorar, **roxo** carta passiva, **amarelo** status;
  - nome e nível no topo;
  - janela de arte (ícone do elemento/efeito, ou o sprite do parceiro na melhoria de assinatura) com linhas de varredura;
  - faixa de tipo ("Golpe novo · Fogo");
  - texto de efeito: a **descrição curta do golpe** (ver "Descrições dos golpes") e os números (o que muda aparece "antes → depois" em verde); cartas passivas e de status usam texto montado a partir do bônus;
  - rodapé com indicador de nível em pips e a tecla de atalho;
  - brilho holográfico passando de tempos em tempos.
- **Card Slash:** ao escolher, a carta desce por um leitor brilhante, pisca e aparece "Card Slash!" antes de fechar. Deve ser curto (≈0,6–0,9 s) para não travar o ritmo.
- O conteúdo das opções é o mesmo de hoje (só muda a apresentação).
- A escolha de espaço para carta **slash** (substituir um golpe) usa o mesmo visual de carta.

### Digievolução
- "Digievolução!" + "dá para recusar e evoluir depois" (comportamento atual).
- Forma atual à esquerda (sprite, nome), setas, e cada opção num cartão grande: sprite, nome, estágio, selos de atributo/elemento, **status no nível atual "antes → depois"**, novo golpe assinatura ("substitui X mantendo o nível").
- Botões "Agora não [Esc]" e "Digievoluir! [Enter]".

### Resultado
- "Vitória!" ou "Derrota" grande (vermelho na derrota).
- Fase alcançada e tempo de partida.
- **Caminho evolutivo em retratos**, com o **nível em que cada evolução aconteceu**.
- Golpes e cartas que o jogador tinha no fim, com nível.
- Números em destaque: abates, nível, **chefes derrotados**, melhor fase.
- Cartão laranja "Novo parceiro liberado!" com o retrato, quando houver.
- Botões "Menu" e "Jogar de novo".

### Demais telas (mesmo visual, sem mudar o que fazem)
Pausa, Controles (remapeamento), Créditos, e o painel de debug fica como está (ferramenta de dev).

**Créditos:** reescrever de acordo com as fontes reais dos sprites hoje: Digimon World 3 (rips), V-pet e folhas geradas no ChatGPT/Gemini; manter o aviso legal (Digimon © Akiyoshi Hongo / Toei Animation / Bandai; não afiliado). Conferir `README.md` e `assets-src/` para os créditos de rips.

## Descrições dos golpes (decisão do usuário)

Cada golpe ganha uma **frase curta de descrição** (pt-BR, uma linha, ~60–90 caracteres, ex.: "Explosão ao redor que queima inimigos próximos."), guardada no banco de dados: nova coluna `description` em `moves` via **migration nova** (não editar a 001), preenchida nos seeds, exportada para `gamedata.ts` e exposta em `MoveDef`. São **152 golpes** hoje. A frase descreve o que o golpe faz no jogo (padrão, alvo, efeito), coerente com o nome canônico; não inventa efeitos que o jogo não tem. Um teste garante que nenhum golpe fica sem descrição.

## Dados novos no save (decisão do usuário: registrar)

O save hoje só tem recordes gerais (`bestPhase`, `wins`, `runs`). Passar a registrar:

- **Por parceiro:** partidas, vitórias, melhor fase.
- **Por partida (para a tela de resultado, não precisa persistir):** o nível em que cada evolução aconteceu, o número de **chefes de fase** derrotados e o de **guardiões** (minichefes) derrotados — dois números separados. *(Decisão minha.)*
- "Melhor fase" na tela de resultado é o **recorde com aquele parceiro**, com um selo "Novo recorde!" quando a partida o superou. A fase alcançada na partida já aparece no topo. *(Decisão minha.)*

Saves antigos devem continuar carregando (campos novos começam zerados); os números "começam do zero" e o usuário sabe disso.

## Restrições

- Projeto existente: Three.js + TypeScript + Vite, UI em DOM puro (`src/ui/*.ts`, `src/ui/style.css`), sem framework. Manter assim.
- Menus navegáveis por teclado e controle (o `showChoice`/`modal.ts` atual faz isso); as telas novas mantêm setas/D-pad, confirmar, cancelar e atalhos.
- Sprites de retrato vêm das tiras em `public/sprites/` (quadro `idle1`, ou o primeiro); Digimon sem sprite usa o placeholder (nome no círculo) — o retrato precisa funcionar para os dois.
- Testes com vitest (há testes de UI com happy-dom em `tests/ui/`); manter a suíte verde.
- Desempenho: o HUD atualiza todo frame; animações devem ser CSS (sem recriar DOM por frame), seguindo o padrão atual de `setText`/`setW`.
- Funciona em telas largas e em janelas menores (≥ 1280×720 como referência); não precisa de layout de celular.

## O que fica para o construtor

- Fonte (pode manter system-ui ou trazer uma fonte "tech" empacotada localmente), ícones, paleta exata por atributo/elemento, tempos e curvas das animações, organização dos arquivos CSS/TS.
- Como desenhar o retrato (canvas a partir da tira, ou CSS `background-position`).
- Ordem de implementação das telas.
