# DigiBonk — Evoluções secretas e Digi Data

Data: 2026-11-08 · Status: desenho aprovado em conversa; documento revisado, aguardando aprovação final

## Intenção

Hoje o jogador vê todas as evoluções e os requisitos desde a primeira partida (painel "Próx. evolução", tela de evolução e
árvore na seleção de parceiro). Isso tira a graça de descobrir. A ideia é trazer a sensação de surpresa do Digimon World:
na primeira vez o jogador **não sabe** o que fazer para digievoluir, e vai aprendendo de duas maneiras:

1. **Digievoluindo por acaso** — ao cumprir os requisitos de uma evolução que nunca viu, o parceiro evolui sozinho e o
   caminho fica registrado para sempre.
2. **Coletando Digi Data no mapa** — cada dado revela, no fim da partida, um requisito de alguma evolução, sem dizer o
   destino. O jogador sabe *de onde* sai o caminho e *o que* ele pede, mas não *para onde* vai.

Sucesso: um jogador novo evolui o Agumon "sem querer", fica curioso, e nas partidas seguintes usa as pistas dos Digi Data
para caçar caminhos que ainda não conhece (ex.: o ramo sombrio).

## Metas

- Evoluções não descobertas ficam totalmente invisíveis na interface.
- Descoberta por evolução automática, com escolha às cegas quando houver mais de uma.
- Digi Data como coletável raro que revela um requisito por dado, mostrado só no fim da partida.
- Tudo que foi descoberto ou revelado persiste no save.

## Não metas

- Digi Data ligado ao parceiro ou à fase atual (por enquanto o sorteio é entre **qualquer** evolução do jogo — decisão do
  usuário, "por enquanto deixamos assim").
- Requisito de "Digimon-chave" separado: foi substituído pela própria pista, que nomeia o Digimon anterior.
- Mudar os requisitos ou os números das evoluções existentes.

## Anti-metas (seria um fracasso mesmo funcionando)

- Vazar o destino de uma evolução secreta: silhueta, retrato, nome, cor, contagem de opções ou requisito ainda não
  revelado, em qualquer tela (HUD, tela de evolução, seleção de parceiro, resultado, avisos).
- O jogador ficar preso sem conseguir evoluir porque a evolução automática não disparou.
- Digi Data revelar algo durante a partida (só "Digi Data coletado").

## Definições

- **Evolução** = uma aresta `from → to` (o `id` da tabela `evolutions`, ex.: `greymon->skullgreymon`). A descoberta é por
  aresta, não por forma: descobrir `blackwargrowlmon->megidramon` não revela `wargrowlmon->megidramon`. *(minha decisão)*
- **Requisito** = cada condição de `EvoReq` contada separadamente: nível; cada status de `minStats`; cada item de `items`;
  abates; quase-mortes; fase (não usada hoje); cada parceiro de `unlocked`. *(minha decisão)*
  - Exceção: `unlocked` (parceiro liberado) não é segredo de jogabilidade e não precisa ser revelado; se a evolução exige
    um parceiro não liberado, ela continua fora de jogo como hoje.
- **Estado de uma evolução no save:**
  - *secreta* — nunca evoluída; pode ter 0..N requisitos revelados.
  - *descoberta* — o jogador já fez essa evolução alguma vez.

## Comportamento

### Evoluções secretas

- Nada da evolução aparece enquanto ela for secreta e sem requisitos revelados.
- **Painel "Próx. evolução" (HUD):** considera só as evoluções descobertas e as secretas com algum requisito revelado.
  - Descoberta: igual a hoje (retrato em silhueta, nome, requisitos que faltam).
  - Secreta com pistas: aparece como **"Greymon → ???"** sem retrato, listando os requisitos revelados que faltam e "???"
    enquanto restar requisito oculto (ver Decisões complementares). *(minha decisão)*
  - Se nenhuma se qualifica, mostra "—".
- **Tela de evolução (E):** lista só as evoluções descobertas que estão disponíveis. Se não houver nenhuma descoberta
  disponível, E não abre nada (como hoje quando não dá para evoluir).
- **Seleção de parceiro (árvore de evoluções):** mostra só as arestas descobertas; secretas com pistas aparecem como
  "→ ??? · <requisitos revelados>". *(minha decisão — a árvore hoje lista tudo e vazaria o segredo)*

### Evolução automática

- A cada tick em que a lista de evoluções disponíveis muda, separar as disponíveis **secretas**.
- **Exatamente 1 secreta disponível:** o parceiro evolui sozinho na hora, a aresta vira *descoberta* no save e aparece o
  aviso **"Nova forma liberada! <Nome>"**.
- **2 ou mais secretas disponíveis ao mesmo tempo:** a partida pausa e abre a tela de evolução com uma carta **"???"** por
  opção (sem retrato, nome, status ou golpe). O jogador escolhe uma com 1/2/3 ou clique; o parceiro evolui, a aresta
  escolhida vira descoberta, a(s) outra(s) continuam secretas. Não dá para cancelar essa tela. *(cancelar não faz sentido:
  ele já cumpriu os requisitos e voltaria a disparar)*
- **Secretas e descobertas disponíveis juntas:** a secreta tem prioridade e segue as regras acima; as descobertas não
  entram nas cartas "???". *(minha decisão — a surpresa é o ponto da mecânica)*
- A evolução automática não dispara durante outros modais (level-up, carta, baú, pausa); espera o modal fechar.
- A forma inicial do parceiro (Agumon etc.) é sempre conhecida.
- Todas as evoluções começam secretas, inclusive a primeira de cada parceiro.

### Digi Data

- Novo tipo de coletável no mapa (`kind: 'digidata'`), com visual próprio (pequeno cubo/fragmento de dados brilhando).
- **Frequência:** raro — cerca de 1 a 2 por fase, em posição aleatória longe do jogador. Valor em `tuning.ts`
  (`DIGIDATA_PER_PHASE`). *(minha decisão, ajustável)*
- **Sorteio:** ao ser coletado (não ao surgir), sorteia um **requisito oculto** entre todas as evoluções do jogo que ainda
  são secretas e têm requisito oculto, e guarda esse requisito na lista "revelados nesta partida". Se não há nada para
  revelar, o dado não surge. *(sortear o requisito, e não a evolução, deixa as chances iguais por pista)*
- Ao coletar: só o aviso **"Digi Data coletado"**. Nada muda no HUD durante a partida.
- No fim da partida (vitória ou derrota), as pistas vão para o save.

### Tela de resultado

- Nova seção **"Digi Data"** com uma linha por dado coletado na partida:
  - **"Caminho Greymon ① — Atq 38"**
- O nome é sempre o da forma **anterior** (`from`). O destino nunca aparece.
- O número ①②③ diferencia caminhos que saem do mesmo Digimon. É fixo por aresta: a posição dela entre **todas** as
  arestas de `from` (na ordem de `FORMS[from].evolutions`), para o número não mudar quando uma delas for descoberta. Só
  aparece quando `from` tem mais de uma aresta. *(minha decisão)*
- Formato do requisito: o mesmo texto curto já usado no HUD (`Nv 20`, `Atq 38`, `HP < 25%: 3×`, nome do item, `N abates`).
- Se nenhum dado foi coletado, a seção não aparece.

### Persistência (save)

- `SaveData` ganha:
  - `discoveredEvos: string[]` — ids das arestas descobertas.
  - `revealedReqs: Record<string, string[]>` — por id de aresta, as chaves dos requisitos revelados (ex.:
    `"level"`, `"stat:atk"`, `"item:dark_core"`, `"kills"`, `"nearDeaths"`, `"phase"`).
- `loadSave` valida os dois campos como os outros (descarta lixo).
- Saves antigos: começam com tudo secreto. O campo `discovered` (formas) continua existindo e sendo atualizado, sem
  relação com esta mecânica. *(minha decisão — jogo em desenvolvimento, não vale migrar)*

### Debug

- O painel F2 ganha **"Revelar todas as evoluções"** (marca todas como descobertas) e **"Esquecer evoluções"** (zera
  `discoveredEvos` e `revealedReqs`).
- O botão de debug que força evolução continua funcionando e marca a aresta como descoberta.
- Com `?debug`, o "Revelar tudo" é necessário para os testes manuais antigos funcionarem como antes.

## Restrições

- Lógica de jogo em `src/sim/` (pura, testável), interface em `src/ui/`, como o resto do projeto.
- Não editar seeds antigos do banco (`tests/db/fixtures/before.json`); esta mecânica não precisa de dados novos no banco.
- Textos da interface em português.
- Testes em Vitest no mesmo estilo de `tests/sim/evolution.test.ts`.

## O que fica para quem implementa

- Visual do Digi Data no mundo e do aviso.
- Como a pausa da escolha às cegas se integra ao fluxo de modais em `main.ts`.
- Nomes de funções e onde exatamente guardar "revelados nesta partida" no `RunState`.
- Estilo das cartas "???" (reaproveitar `evo-card`).

## Decisões complementares (após revisão)

- **Quando grava no save:** imediatamente. A aresta descoberta é gravada no momento da evolução, e o requisito de cada
  Digi Data é gravado no momento da coleta, sendo **exibido** só na tela de resultado. Sair para o título no meio da
  partida não perde nada (as pistas não exibidas ficam no save e já aparecem no HUD da próxima partida). *(minha decisão)*
- **Painel "Próx. evolução", sem vazamento:**
  - Arestas descobertas têm prioridade; uma secreta com pistas só aparece se não houver descoberta pendente nessa forma.
  - O ranking entre candidatas usa **apenas requisitos visíveis** (revelados ou de arestas descobertas).
  - Uma secreta mostra os requisitos revelados que faltam e **um único "???"** enquanto houver qualquer requisito oculto,
    cumprido ou não, para não entregar quantidade nem progresso. *(minha decisão)*
  - Isso pede uma função de dica nova para o caso secreto, não um ajuste da `nextEvolutionHint` atual.
- **Sorteio de Digi Data:** o sorteio deixa de fora as arestas que nunca podem acontecer neste save, isto é, as que
  exigem parceiro não liberado. Também ficam de fora os requisitos já revelados no save **ou nesta partida**.
  *(minha decisão: uma pista impossível pareceria bug)*
- **Surgimento e esgotamento:**
  - Os dados surgem no início de cada fase, porque `startPhase` limpa os coletáveis.
  - Só surgem enquanto o número de requisitos sorteáveis for maior que o de dados já no mapa.
  - Se ainda assim o sorteio vier vazio na coleta, o dado é consumido, aparece "Digi Data coletado" e nenhuma linha vai
    para o resultado. *(minha decisão)*
- **Evolução descoberta nunca é automática:** só acontece pelo E. O aviso antigo "Evolução disponível" (`EvoNotifier`)
  passa a considerar só as arestas descobertas.
