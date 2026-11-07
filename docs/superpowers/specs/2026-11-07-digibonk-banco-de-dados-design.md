# DigiBonk — Banco de dados dos dados do jogo (v1)

## Intenção

Tirar os dados do jogo dos arquivos TypeScript e colocá-los num banco **SQLite**, versionado com **migrations**, que vira a **fonte de verdade**:
- Digimon e seus status;
- golpes;
- itens;
- equipamentos (cartas do Tamers);
- tipagem (atributos e elementos) e vantagens.

O jogo continua rodando 100% no navegador. Um script gera os dados que o jogo lê a partir do banco.

O porquê:
1. **Organizar e editar** os dados num lugar só, com um modelo relacional claro.
2. **Preparar o servidor futuro.** Contas, loja online e progresso na nuvem vão precisar de um banco. As mesmas migrations devem montar o modelo lá, provavelmente em PostgreSQL.
3. **Trazer regras novas** que dependem desses dados: crescimento por nível, vantagem de atributo e de elemento, e cartas com nível.

## Objetivos

- Migrations numeradas em **SQL puro portátil** (subconjunto que SQLite e PostgreSQL entendem igual), aplicadas em ordem por um executor próprio, que registra quais já rodaram.
- Seeds separados das migrations, com o conteúdo do jogo. Tudo em texto no git; o arquivo `.db` é gerado e não vai para o git.
- Script de exportação: banco → dados do jogo. Os arquivos atuais de `src/data` com conteúdo passam a ser gerados.
- Regras novas no jogo:
  - **Crescimento por nível dos Digimon:** cada atributo sobe 0,5% do valor base por nível.
  - **Atributo:** triângulo Vacina > Vírus > Dados > Vacina; Free é neutro.
  - **Elemento:** cada Digimon e cada golpe têm um elemento, com uma tabela de vantagens.
  - **Cartas com nível:** bônus em porcentagem, que sobe a cada nível.

## Fora do escopo (v1)

- Servidor, contas, loja online, progresso na nuvem. O progresso do jogador continua no `localStorage`.
- Editor visual de dados. Edita-se o SQL dos seeds; para inspecionar, abre-se o `.db` gerado num visualizador de SQLite.
- Novos Digimon ou parceiros (Plano 3). Sprites (em avaliação).

## Anti-objetivos

- Regras de jogo escondidas em código que um servidor teria de reimplementar diferente. Valores e tabelas de vantagem ficam no banco; o código só aplica as fórmulas abaixo.
- SQL específico de SQLite (tipos dinâmicos, `AUTOINCREMENT`, funções próprias) nas migrations.
- Quebrar o jogo: depois da troca, a partida deve se comportar como hoje, exceto pelas regras novas.

## Decisões tomadas pelo usuário

- SQLite agora, servidor depois; o banco já nasce pensando na migração.
- Migrations em SQL puro portátil + executor próprio, sem ferramenta de migrations.
- O banco é a fonte de verdade já nesta versão, e as regras novas entram no jogo.
- **Crescimento por nível:** `valor(nível) = base × (1 + 0,005 × (nível − 1))`, somado nível a nível, sem composição. Exemplo: ataque base 5 dá ≈ 5,23 no nível 10. A taxa fica guardada por linha, com padrão de 0,5%.
  - **Substitui** o crescimento fixo por nível de hoje (`growth` em `forms.ts`, ex.: +6 vida/+0,6 ataque por nível).
  - Consequência aceita: o nível pesa pouco, e a força vem de evoluções, cartas e pontos de atributo do level up.
  - Inimigos e chefes podem precisar de reajuste depois; isso fica fora desta versão, a ser revisado jogando.
- **Tipagem:** "mais ou menos" o sistema dos jogos recentes (Cyber Sleuth/Survive): triângulo de atributos + elementos com fraquezas.
- **Vale nos dois sentidos:** inimigos, minichefes e chefes têm atributo e elemento, e o dano que eles causam ao jogador também usa os multiplicadores.
- **Um Digimon é uma entidade só:** os inimigos podem ser digievoluções dos parceiros. Greymon jogável e Greymon inimigo são o mesmo registro de Digimon (nome, estágio, atributo, elemento, status base). Formas jogáveis e inimigos apontam para ele e acrescentam só os próprios dados de jogo.
- **Cartas:** o bônus é em **porcentagem** e sobe um pouco a cada nível da carta.
- **Nível da carta:** pegar na partida uma cópia de uma carta que você já tem sobe o nível dela, até o **máximo de 10**. O nível volta a 1 a cada partida.

## Modelo de dados (o que o banco precisa representar)

| Conceito | Conteúdo |
|---|---|
| Atributos | Vacina, Dados, Vírus, Free |
| Vantagem de atributo | atacante × defensor → multiplicador |
| Elementos | lista de elementos |
| Vantagem de elemento | elemento do golpe × elemento do alvo → multiplicador |
| Estágios | Child, Adult, Perfect, Ultimate (com o multiplicador de dano já existente em `tuning`) |
| Digimon | id estável (`agumon`), nome, estágio, atributo, elemento, status base (vida, ataque, defesa, velocidade, cérebro), taxa de crescimento por nível |
| Formas jogáveis | os Digimon que o jogador pode ser, com golpe assinatura e modificadores atuais |
| Evoluções | de → para, com requisitos (nível mínimo, status mínimos, itens, parceiros desbloqueados, fase, abates) |
| Kit de golpes | quais golpes cada forma aprende |
| Golpes | id, nome, elemento, padrão (projétil, área, cone, aura, orbital, raio), dano, recarga, alcance, demais parâmetros atuais, crescimento por nível do golpe |
| Inimigos / minichefes / chefes | apontam para um Digimon e guardam os campos de jogo atuais (vida, dano, velocidade, XP, tamanho, fase mínima, golpes de chefe); atributo e elemento vêm do Digimon |
| Itens | Digiovos, dados de fusão, ovos de parceiro, com restrições atuais (para quais parceiros, requisitos de desbloqueio) |
| Cartas (equipamentos) | passivas: bônus em % por status + % ganho por nível; slash: golpe que substituem; raras; peso de sorteio; parceiros restritos |
| Parceiros | os atuais (forma inicial, temporada, inicial ou desbloqueável) |

Os ids de hoje (`agumon`, `card_greymon_horn`, `pepper_breath_rain`...) são mantidos, para não quebrar o save nem os testes.

## Fluxo

1. `migrate` aplica do zero as migrations pendentes num `.db` local e registra cada uma.
2. `seed` preenche o conteúdo.
3. `export` lê o banco e gera os módulos de dados que o jogo importa.
4. `npm run build` / `npm run dev` usam os dados gerados.
5. Os testes rodam as migrations num banco novo em memória e verificam a exportação.

## Decisões do construtor (pode ajustar)

- **Executor:** `node:sqlite`, embutido no Node 22, sem dependência nova. Conferido: funciona na máquina, com aviso de experimental.
- **Lista de elementos inicial:** Fogo, Água, Planta, Gelo, Elétrico, Terra, Vento, Luz, Trevas, Aço e Neutro. A tabela de vantagens e o elemento de cada Digimon e de cada golpe ficam no seed, editáveis.
- **Multiplicadores iniciais** (dados, editáveis): vantagem ×1,5, desvantagem ×0,75, neutro ×1. Atributo e elemento se multiplicam entre si.
- **Golpes de chefe e ataques de contato dos inimigos:** os golpes de chefe (`touch_of_evil`...) são golpes comuns com elemento. O dano de contato usa o elemento do Digimon inimigo.
- **Porcentagem das cartas:** incide sobre o status efetivo. Bônus que não são de status (recarga, ímã, XP) já são multiplicadores e viram porcentagem direta.
- **Carta Slash repetida:** sobe o nível do golpe que ela deu.
- **Valores iniciais das cartas:** os bônus fixos de hoje viram porcentagens equivalentes, com ganho por nível escolhido pelo construtor.
- **Dados gerados ficam no git**, para o projeto funcionar logo depois de clonar. O banco `.db` não vai para o git.
- **Nomes exportados mantidos** (`FORMS`, `MOVES`, `CARDS`, `ENEMIES`...), para não mexer em quem os usa. O seed guarda os valores finais (o que hoje o helper `form()` calcula).
- **Cores, tamanhos e parâmetros visuais dos golpes** vão para o banco como colunas.
- **Pontos de atributo do level up:** os pontos escolhidos continuam somando por cima do crescimento automático.
- **Formato dos dados gerados** (TS ou JSON) e nomes de arquivos e tabelas.
- **Organização** dos scripts e pastas (`db/migrations`, `db/seeds`, ferramentas em `tools/db`).

## Riscos

- `node:sqlite` é experimental no Node 22. Se mudar, troca-se só o executor; o SQL não muda.
- Converter os bônus fixos das cartas para % e trocar o crescimento fixo pelos 0,5% mudam o equilíbrio do jogo. Revisar jogando.
