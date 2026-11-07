# DigiBonk — Documento de Design (v1)

Data: 2026-11-07
Status: rascunho para aprovação
Nome provisório: **DigiBonk** (escolha minha, trocável)

## 1. Intenção e o porquê

Um fan-game de Digimon, gratuito e sem fins lucrativos, que roda no navegador. É um "survivor" 3D no gênero de Megabonk e PokéBonk. A inspiração direta é o PokéBonk (pokebonk.com), mas o jogo é **reconstruído do zero**: nenhum código, arte ou asset do PokéBonk é reaproveitado.

O que torna o jogo especial é a **digievolução como decisão**. Ela se inspira no Digimon World 1, de forma simplificada: atributos, itens e condições decidem em que o seu Digimon pode virar. Quando os requisitos são cumpridos, o jogador **escolhe** entre digievoluir agora ou esperar uma forma melhor. Somam-se a isso as cartas do Digimon Tamers e os Digiovos do Adventure 02.

O tema que atravessa o jogo inteiro é **arriscar ou garantir**: enfrentar o chefe ou continuar farmando, digievoluir agora ou esperar.

## 2. Metas, não-metas e anti-metas

**Metas (v1)**
- Partida completa e jogável: escolher o parceiro, 5 fases, chefes, vitória ou derrota.
- Digievolução com requisitos e escolha, incluindo formas especiais por item.
- Sistema de cartas: equipadas e de Slash.
- Ovos de Digimon que desbloqueiam parceiros para sempre (salvos no navegador).
- Funcionar bem em PC modesto (referência: Ryzen 3 3200G + GTX 1660) com centenas de inimigos na tela.

**Não-metas (v1, ficam para depois)**
- Loja de melhorias permanentes entre partidas (planejada, ver §10).
- Mapas e inimigos diferentes por temporada.
- Contas, ranking online, clãs, servidor.
- Suporte a celular ou toque.
- App desktop ou Android.

**Anti-metas (seria um fracasso mesmo funcionando)**
- Copiar código, arte ou estrutura de arquivos do PokéBonk.
- Digievolução automática ou sem escolha: ela tem de ser uma decisão do jogador.
- Monetização de qualquer tipo, por ser fan-game de propriedade da Bandai/Toei.
- Ataques manuais obrigatórios: o combate é automático, como no gênero.

## 3. Restrições

- **Tecnologia:** Three.js no navegador, decidido pelo usuário.
- **Visual:** mundo 3D com câmera de cima em ângulo e Digimon como **sprites 2D billboard** (sempre de frente para a câmera), como no PokéBonk. Decidido pelo usuário.
- **Plataforma:** PC no navegador, com teclado e mouse e também gamepad. O usuário tem um 8BitDo Ultimate, e no Chrome o modo D usa mapeamento não-standard, então o remapeamento precisa ser configurável. A plataforma foi decisão minha, porque o usuário não pediu celular.
- **Salvamento:** apenas `localStorage`, envolvido em try/catch.
- **Sprites:** não existe acervo livre e completo de Digimon. A base serão os **rips de estilo DS** (Digimon World DS, Dawn/Dusk, Story) da The Spriters Resource, que o usuário baixa pelo navegador porque o site bloqueia acesso automático. Complementos pontuais podem vir dos pacotes CinzadeNeve (itch.io). As poses têm poucos quadros, então a sensação de movimento vem de efeitos no motor: balanço ao andar, squash/stretch ao atacar, flash branco ao levar dano.
- **Legal:** é fan-game não oficial. A página de créditos e aviso legal deve atribuir os sprites aos rippers e dizer que Digimon pertence a Bandai/Toei/Akiyoshi Hongo.

## 4. Estrutura da partida

1. **Seleção:** o jogador escolhe a **temporada** (Adventure, Adventure 02, Tamers) e depois o parceiro, entre os desbloqueados daquela temporada.
2. **5 fases em sequência**, todas no **mesmo mapa** na v1. As fases podem variar a posição inicial ou a área liberada, e isso fica a critério do construtor.
3. Em cada fase, hordas de Digimon selvagens vêm em direção ao jogador. A dificuldade **sobe continuamente**, em quantidade e em força.
4. **Cada fase tem 10 minutos** (decidido pelo usuário). O tempo aparece na tela.
5. **Missão da fase:** cada fase tem uma pequena missão. Cumpri-la **libera o chefe**. Depois de liberado, o jogador vai até um ponto do mapa (altar ou portal) para enfrentá-lo **quando quiser**, dentro do tempo. O construtor escolhe os tipos de missão: derrotar um mini-chefe, coletar N fragmentos de dados, ativar X pontos do mapa, sobreviver numa zona etc. A missão deve ser possível bem antes dos 10 minutos.
6. Ficar mais tempo na fase rende mais XP, itens e chances de digievolução, mas as hordas pioram continuamente.
7. **Quando o tempo acaba**, começam **hordas insanas**: quantidade e força sobem de forma brutal, feitas para matar o jogador. O chefe continua disponível. A saída é derrotá-lo, se a missão já foi cumprida, ou morrer.
8. Vencer o chefe leva à próxima fase e mantém nível, forma, cartas e ataques. Vencer o chefe da 5ª fase é a **vitória**. Uma partida completa dura **até ~50 minutos**.
9. Morrer encerra a partida. Os desbloqueios permanentes (ovos de Digimon) são mantidos.

## 5. Parceiros e temporadas

Cada temporada tem **um parceiro liberado desde o início**. Os demais vêm dos **ovos de Digimon** (§8).

| Temporada | Inicial liberado | Exemplos desbloqueáveis por ovo |
|---|---|---|
| Adventure | Agumon | Gabumon, Biyomon, Tentomon, Palmon, Gomamon, Patamon, Salamon/Gatomon |
| Adventure 02 | Veemon | Hawkmon, Armadillomon, Wormmon (Patamon e Gatomon do 02 podem compartilhar com o Adventure) |
| Tamers | Guilmon | Terriermon, Renamon, Lopmon, Impmon, Guardromon |

**Elenco v1 (decidido pelo usuário):** 3 iniciais mais 8 desbloqueáveis por ovo, **todos com linha completa até Ultimate (Mega)**.

| Temporada | Inicial | Desbloqueáveis v1 |
|---|---|---|
| Adventure | Agumon | Gabumon, Patamon, Tentomon, Gatomon (Child: Salamon) |
| Adventure 02 | Veemon | Wormmon, Armadillomon |
| Tamers | Guilmon | Terriermon, Renamon |

Linhas (Child → Adult → Perfect → Ultimate). As linhas "solo" vêm dos jogos (Digimon Story, Masters, World), porque no anime alguns parceiros do 02 só passam do Champion por fusão:

- **Agumon** → Greymon → MetalGreymon → WarGreymon
- **Veemon (solo)** → Veedramon → AeroVeedramon → UlforceVeedramon
  - Ramo **ExVeemon**: Veemon → ExVeemon. Com **Wormmon desbloqueado** e as condições raras: ExVeemon → **Paildramon** → **Imperialdramon Fighter Mode**. Sem o Wormmon, o ramo ExVeemon para no Adult (decisão do usuário, opção "a").
  - Formas Digiovo: Flamedramon (Coragem), Raidramon (Amizade)
- **Guilmon** → Growlmon → WarGrowlmon → Gallantmon
- **Gabumon** → Garurumon → WereGarurumon → MetalGarurumon
- **Patamon** → Angemon → MagnaAngemon → Seraphimon
- **Tentomon** → Kabuterimon → MegaKabuterimon → HerculesKabuterimon
- **Salamon** → Gatomon → Angewomon → Ophanimon
- **Wormmon** → Stingmon → JewelBeemon → GranKuwagamon (linha solo dos jogos)
- **Armadillomon** → Ankylomon → Shakkoumon → SlashAngemon (linha linear do Digimon UP; no anime o Shakkoumon é fusão com o Angemon)
- **Terriermon** → Gargomon → Rapidmon → MegaGargomon
- **Renamon** → Kyubimon → Taomon → Sakuyamon
- **Omnimon:** fusão WarGreymon + MetalGarurumon. Exige o Gabumon desbloqueado e jogar de Agumon.

São cerca de **50 formas jogáveis**. **Ordem de construção (decisão minha):** primeiro o motor completo com as 3 linhas iniciais. Depois os 8 desbloqueáveis entram como dados (kit, atributos, requisitos e sprite), um por vez. A v1 só está "pronta" com os 11, mas o jogo fica jogável desde a primeira etapa.

## 6. Combate

- **Totalmente automático.** O jogador controla o **movimento**. Os ataques disparam sozinhos, mirando no inimigo mais próximo ou conforme o padrão do golpe.
- **Espaços de ataque:** 4 por Digimon (meu palpite). Cada golpe tem o próprio tempo de recarga, dano, alcance e padrão (projétil, área, cone, aura, orbital etc.).
- **Kit padrão por Digimon**, baseado nos golpes do anime. O parceiro começa com o golpe principal, como o Baby Flame do Agumon, e aprende os outros do seu kit ao subir de nível.
- **Digievoluir melhora o kit.** O golpe principal se transforma (Baby Flame → Mega Flame → Giga Destroyer → Gaia Force), os outros ganham força, e a forma nova tem atributos e "estilo" próprios: Greymon é lento e pesado, ExVeemon é rápido.
- **Atributos** (simplificado do DW1, meu palpite): **HP, Ataque, Defesa, Velocidade, Cérebro** (alcance, recarga ou XP). Eles servem para a força **e** para os requisitos de digievolução.
- **Level-up:** XP vem dos inimigos derrotados, em forma de dados coletáveis. A cada nível o jogo oferece 3 opções entre aprender um golpe do kit, melhorar um golpe, aumentar um atributo e, raramente, uma carta.
- **Chefes:** Digimon maiores, com barra de vida e padrões próprios. Pelo menos um por fase.

## 7. Digievolução

- **Requisitos por forma**, no estilo DW1 simplificado. Cada forma-alvo define uma combinação de: nível mínimo, atributos mínimos, item ou carta necessários e, opcionalmente, uma condição de partida (por exemplo, abates ou fase).
- Quando **qualquer** forma-alvo fica disponível, o jogo avisa. O jogador abre a escolha **na hora que quiser** e pode:
  - digievoluir para uma das formas disponíveis; ou
  - **esperar**, mantendo a forma atual na esperança de chegar a outra. O aviso volta quando surgir uma nova opção.
- Algumas formas **só aparecem com itens específicos**:
  - **Digiovos** (Coragem, Amizade, Amor, Sabedoria, Pureza, Sinceridade, Esperança, Luz, Milagres, Bondade, Destino): escondidos nas fases e válidos **só naquela partida**. Desbloqueiam as formas Digiovo, como Veemon + Coragem → Flamedramon.
  - **Cartas raras** (Blue Card e similares): desbloqueiam formas especiais, como as do Tamers.
- **Fusões e formas especiais** (Omnimon, Imperialdramon e outras) exigem condições raras na partida **e** o desbloqueio do parceiro de fusão. Exemplo: Omnimon só existe se Gabumon já foi desbloqueado. **O construtor decide** como a fusão funciona em jogo (o parceiro aparece como item ou evento, ou é uma condição abstrata), mantendo a regra de que precisa do desbloqueio.
- Digievolução é **permanente dentro da partida**. Sem regressão na v1.
- Cada partida termina com o "caminho evolutivo" do jogador visível na tela de resultado.

## 8. Itens e progressão

**Dentro da partida**
- **Cartas equipadas (passivas):** **3 espaços**. Cada carta dá um bônus constante, como "Garras do Gatomon" (+dano) ou "Asas do Birdramon" (+velocidade). Ao achar uma carta com os espaços cheios, o jogador escolhe qual trocar ou descartar.
- **Cartas de Slash (ativas):** são **golpes extras de outros Digimon**, como Lightning Paw ou Diamond Storm. Elas ocupam **um dos 4 espaços de ataque**, substituindo um golpe do kit. Assim surgem combinações que o parceiro não teria sozinho.
- **Cartas raras e Digiovos:** liberam digievoluções (§7).
- As cartas e os Digiovos são achados **explorando o mapa** (baús, pontos de interesse) e, mais raramente, ao derrotar inimigos e chefes. O mapa precisa dar motivos para sair do lugar.

**Permanente (entre partidas)**
- **Ovos de Digimon:** itens **muito raros** nas fases. Ao ser coletado, o ovo desbloqueia **para sempre** um parceiro jogável. O desbloqueio vale mesmo se a partida terminar em derrota (decisão minha, para não frustrar).
- Ficam salvos no `localStorage`: parceiros desbloqueados, digievoluções já descobertas (para uma Digidex) e recordes.

## 9. Controles

- **Teclado:** WASD ou setas para mover, uma tecla para abrir a escolha de digievolução, Esc para pausar.
- **Gamepad:** analógico esquerdo para mover, botões equivalentes, remapeáveis.
- **Mouse:** menus e escolhas de level-up.

## 10. Para depois (fora da v1)

- **Loja entre partidas:** moeda ganha nas partidas paga melhorias permanentes. O usuário já confirmou que quer, mas fica para depois da v1. A v1 já pode registrar uma moeda para não precisar de migração depois (critério do construtor).
- Mapas e inimigos por temporada (Ilha File, Mundo Digital do 02, Shinjuku).
- Celular, toque, contas e ranking.

## 11. Decisões tomadas na revisão (minhas, a confirmar com o usuário)

- **Arte: placeholders primeiro.** O jogo é construído com sprites provisórios: formas e cores simples por Digimon, com o nome. Os sprites reais entram depois, por troca de dados. O usuário baixa as folhas pelo navegador quando o pipeline estiver pronto e informa onde as salvou. O sistema de billboard deve funcionar com **uma pose frontal + poucos quadros**, sem depender de vistas laterais ou de costas (espelhar horizontalmente para esquerda e direita).
- **Itens globais, filtrados pelo parceiro.** A temporada escolhida não muda a tabela de itens. Digiovos e cartas raras só aparecem se puderem levar a alguma forma do parceiro atual; cartas comuns aparecem para todos.
- **Inimigos e chefes** ficam a critério do construtor, limitados aos sprites disponíveis. A preferência é por Digimon reconhecíveis das três primeiras temporadas: Devimon, Etemon, Myotismon e os Dark Masters no Adventure; os Digimon do Digimon Emperor no 02; os Deva no Tamers.
- **Formas especiais na v1:** Flamedramon e Raidramon (Digiovos da Coragem e da Amizade), Omnimon e Imperialdramon Fighter Mode. Gallantmon Crimson Mode fica para depois.

## 12. A critério do construtor

- Organização do código, build (Vite é sugestão) e estrutura de pastas.
- Números de balanceamento: tempos, curvas de XP, dano, quantos inimigos.
- Formato dos dados (Digimon, golpes, requisitos e cartas em JSON ou TS data, de forma que adicionar um Digimon seja só dados mais sprites).
- Layout do mapa único e onde ficam baús, chefes e ovos.
- Visual da interface, desde que legível e no clima Digimon.
- Pipeline dos sprites: recorte das folhas, atlas, escala de pixel art sem borrar (`NearestFilter`).
- Técnicas de performance: instancing, pooling, spatial hashing.
