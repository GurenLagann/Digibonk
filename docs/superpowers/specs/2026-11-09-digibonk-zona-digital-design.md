# DigiBonk — Zona Digital (Distorção) com relíquias

Data: 2026-11-09 · Status: aprovado em conversa (item 4 da análise do PokéBonk)

## Intenção

Dar vida ao mapa com um desafio opcional que vale a pena: um portal leva a uma **arena separada**, com ondas de
inimigos de um atributo e um Digimon Alfa no fim. A recompensa é uma **Relíquia** (bônus para o resto da partida) e um
**Digi Data garantido**. Inspirado nas "Fendas" do PokéBonk; só a mecânica, com tema Digimon.

## Decisões do usuário

- Arena **separada** (outro cenário), não uma barreira no próprio mapa.
- Resto do desenho proposto em conversa e aceito.

## Comportamento

- **Portal (Distorção Digital):** ao derrotar um guardião (mini-chefe), surge no lugar um portal com o atributo dele
  (Vacina/Dados/Vírus), por 30 s. Entra quem passar por cima.
- **Entrar:** guarda inimigos, coletáveis, baús e posição do mapa; troca por uma arena vazia e circular (raio 22) num
  cenário próprio (chão digital escuro com grade, parede ciano). Projéteis e áreas em voo somem. Relógio da fase e
  surgimento normal de inimigos **param**.
- **Ondas:** 4 ondas de inimigos daquele atributo (escolhidos entre os que já podem aparecer na fase), surgindo na borda.
  A próxima onda vem quando a atual acaba ou após 15 s.
- **Alfa:** depois das ondas, um inimigo daquele atributo bem mais forte (HP ×10, dano ×1,5, maior). 60 s para vencer.
  Se o tempo acabar, ele some e não há relíquia (o Digi Data também não vem).
- **Recompensa:** 1 Digi Data revelado na hora (como coletar um) e a escolha de 1 Relíquia entre 3 (ou nenhuma).
  Relíquias: até 3 por partida; com os 3 espaços cheios, só o Digi Data.
- **Sair:** um portal de volta aparece no centro da arena; ao passar, o mapa volta exatamente como estava.
- **Morrer na arena** é derrota normal.

## Relíquias (banco: migration 005 + seed 008)

Cada relíquia: um bônus de status em % (hp, atk, def, spd) e um efeito. Efeitos da primeira leva:
`regen` (vida/s), `pickup` (+alcance de coleta), `xp` (+% XP), `elite` (+% dano em chefes e guardiões),
`revive` (revive uma vez com 50% de vida), `digidata` (+1 Digi Data em cada Distorção).

## Fora do escopo

- Portal por item/tecla (Incenso do PokéBonk), raridade de relíquias, relíquias com efeitos complexos.
