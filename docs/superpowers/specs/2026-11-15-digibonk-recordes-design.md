# DigiBonk — Recordes locais (tempo, medalhas, comparar parceiros)

Data: 2026-11-15 · Status: APROVADA pelo usuário

## Por quê
O usuário quer três coisas na tela Recordes: **bater o próprio tempo**, **comparar parceiros** e **colecionar medalhas**.
Hoje o save guarda só partidas, vitórias e melhor fase (geral e por parceiro). Ranking online fica para quando houver servidor.

## Objetivos
- Registrar o tempo de cada vitória e guardar o melhor tempo por parceiro e o geral.
- Medalhas por parceiro conforme o tempo da vitória: Bronze (vencer), Prata (< 35:00), Ouro (< 25:00), Campeão (< 18:00).
- Tela Recordes: totais no topo (vitórias, partidas, mais rápido, contagem de medalhas) e lista por parceiro com
  medalha, melhor tempo, vitórias, partidas e mais abates numa partida, ordenável por Tempo / Vitórias / Abates.
- Resultado da partida: "Novo recorde de tempo!" e a medalha conquistada (quando melhora a do parceiro).

## Não-objetivos
- Recorde "por mapa": o bioma vem da fase, não há escolha de mapa.
- Ranking online, validação contra trapaça.
- Mexer no banco SQLite (o save é localStorage e continua sendo).

## Restrições
- Save antigo precisa carregar sem perder nada (campos novos com padrão ausente/0).
- Tempo = soma do tempo de jogo das 5 fases, com hora extra e Zona Digital, sem pausas/menus.
- Cortes das medalhas em `src/data/tuning.ts` (palpite, calibrar jogando).

## Abordagens
1. **Estender o save local (escolhida).** `PartnerRecord` ganha `bestTime`, `bestKills`; medalha é derivada do `bestTime`
   (não precisa ser guardada). Barato, combina com o que existe.
2. Guardar histórico de partidas (lista) e derivar tudo. Mais flexível, mas o save cresce sem limite e não há uso hoje.
3. Ir para o banco/servidor. Fora de escopo (decisão anterior: servidor depois).

## Desenho
- `RunState` acumula `elapsed` (s) só enquanto a simulação roda (mesmo relógio que já avança `r.time`, conferir se pausa o para).
- `finish()`: em vitória, `pr.bestTime = min(pr.bestTime ?? ∞, elapsed)`; `rec.bestTime` idem; `pr.bestKills = max(…, prog.kills)` em qualquer resultado.
  Sinaliza `r.newTimeRecord` e a medalha nova (`r.medalEarned`) se subiu de nível.
- `medalFor(seconds | undefined): 'bronze'|'silver'|'gold'|'champion'|null` puro, com `T.MEDALS = { silver: 2100, gold: 1500, champion: 1080 }`.
- Tela Recordes reescrita no layout atual (B2): totais + barra de ordenação (teclado/controle: esquerda/direita troca a ordem) + linhas.
- Resultado: linha extra com o tempo, "Novo recorde de tempo!" e o ícone da medalha.

## Decisões do builder (minhas)
- Medalha mostrada como emoji (🥉🥈🥇🏆) por enquanto; arte própria depois se o usuário quiser.
- Parceiro sem vitória mostra "—" no tempo e na medalha; ordenação por tempo coloca esses no fim.
- Formato do tempo `mm:ss` (ou `h:mm:ss` acima de uma hora).
