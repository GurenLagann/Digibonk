# DigiBonk — Laboratório, Bits e baús pagos (com baú amaldiçoado)

Data: 2026-11-15 · Status: RASCUNHO — prêmios decididos (relíquia no amaldiçoado; Digiovo raro no pago); falta aprovação final

## Por quê
O usuário quer progressão entre partidas, começando pelas **ferramentas da subida de nível** (Atualizar, Pular, Banir,
4ª opção), e quer que os baús do mapa virem uma escolha (custam algo), inclusive com um baú-armadilha.
Inspiração: PokéBonk (Laboratório com Stardust; Poké Bolas pagas com preço crescente; bola amaldiçoada). Só mecânica, sem copiar arte/nomes.

## Objetivos
1. **Duas moedas** (decisão do usuário, opção B):
   - **Bits** — só valem na partida; caem de inimigos; gastos em baús; zeram ao fim.
   - **Moeda permanente 💠** (nome na UI: "Cristais") — ganha no fim de cada partida pelo resultado; gasta no Laboratório; fica em `save.currency` (campo já existe, hoje sem uso).
2. **Laboratório** (tela nova no menu inicial): compra níveis de melhorias de ferramenta:
   - Atualizar +1 uso por nível (3 níveis), Pular +1 (3 níveis), Banir +1 (2 níveis), 4ª opção na subida de nível (1 nível).
   - Preços por nível. Dados no **banco SQLite** (migration + seed), exportados para o jogo como as relíquias (decisão do usuário, opção A).
3. **Baús pagos:** 8 baús por fase continuam; **2 grátis + 6 pagos**; preço sobe a cada baú pago comprado **na partida** (20 → 35 → 55 → 80 → …).
   Baú pago tem chance pequena (`T.CHESTS.EGG_CHANCE`, ~5%) de dar um **Digiovo** que o parceiro atual usa numa evolução e ainda não tem (decisão do usuário 2026-11-15: "sim, raro"); senão, o loot normal.
   Preço flutuando sobre o baú; sem Bits suficientes, encostar não abre (mostra "faltam N Bits").
4. **Baú amaldiçoado:** 1 por fase, visual diferente (escuro, brilho roxo, "Grátis…?"). Abrir invoca um anel de ~12 **Bakemon**
   mais fortes em volta do jogador ("emboscada"). Matar todos os da emboscada → prêmio garantido: **escolha de relíquia** (a mesma oferta da Zona Digital) + muitos Bits (decisão do usuário 2026-11-15). Se o jogador já tiver todas as relíquias → carta rara no lugar.
   Fugir: eles seguem como inimigos comuns, sem prêmio.
5. **HUD:** Bits sob a barra de vida. **Resultado:** "+N 💠" ganhos na partida (e total).

## Não-objetivos (agora)
- Melhorias de atributo permanentes, desbloqueio de itens, mochila, desligar melhorias — ficam para depois.
- Gastar Cristais dentro da partida; roleta; loja de itens.
- Arte nova para baús/moedas (usar formas/cores e ícones existentes; emoji 💠 na UI por enquanto).

## Anti-objetivos
- Baú pago não pode ficar impossível de comprar numa partida normal (o jogador precisa sentir a escolha, não a falta).
- Laboratório não pode tornar o início trivial: só ferramentas, não poder bruto.

## Restrições
- Banco é a fonte de verdade dos dados de conteúdo; seeds antigos não podem ser editados (teste de fidelidade `before.json`) → só migration nova + seed novo.
- Save antigo carrega sem perder nada (`currency` já existe; níveis do Laboratório novos com padrão 0).
- Números de balanceamento (ganho de Bits, preços dos baús, emboscada, fórmula dos Cristais) em `src/data/tuning.ts`.
- Debug (`?debug=`) não deve gravar Cristais/compra no save real? → ver "Deixado ao builder".

## Abordagens
- **A (escolhida): melhorias do Laboratório no banco** — tabela `lab_upgrades` (id, nome, descrição, efeito, máx. nível, ord)
  + `lab_upgrade_costs` (id, nível, preço) ou preços numa coluna; seed com os 4 itens. Exportado em `gamedata.ts` como `LAB_UPGRADES`.
  Segue a regra do usuário (banco = fonte de verdade); custa migration + export.
- B: constantes no tuning — mais rápido, mas foge da regra e teria de migrar depois.
- Moedas: **B (escolhida)** duas moedas; A (uma moeda que sobra para o Lab) descartada: competiria com os baús e incentivaria não abrir.

## Desenho (decidido)
### Save
- `save.currency` = Cristais. Novo `save.lab: Record<string, number>` (id da melhoria → nível comprado), validado no `loadSave` (só ids conhecidos, inteiro 0..máx).
- `buyLab(save, id): boolean` — debita o preço do próximo nível se houver saldo e não estiver no máximo.

### Partida
- `createRun` aplica o Laboratório: `levelTools = T.LEVEL_TOOLS + níveis`; `offerCount = 3 + (4ª opção ? 1 : 0)`; `rollOffers` passa a aceitar a quantidade.
- `RunState.bits` (int), `RunState.chestsBought` (int).
- Inimigo morto: chance `T.BITS.DROP_CHANCE` de soltar pickup `kind: 'bits'` com valor `T.BITS.VALUE` (por estágio/fase, ver tuning); guardião/chefe soltam um monte fixo. Ímã puxa como XP.
- Baús: `Chest` ganha `kind: 'free' | 'paid' | 'cursed'`. `placeChests` marca 2 grátis, 6 pagos e acrescenta 1 amaldiçoado (9 no total).
  Preço do pago = `chestPrice(chestsBought)` = tabela `T.CHESTS.PRICES` (20, 35, 55, 80, 110, …; depois do fim da tabela, último + passo).
  Encostar com saldo → debita, abre, `chestsBought++`; loot = Digiovo útil ao parceiro com `T.CHESTS.EGG_CHANCE` (só se houver um que ele use e não tenha), senão o `lootRoll` normal. Sem saldo → evento `chestLocked` (toast "faltam N Bits", com cooldown).
- Baú amaldiçoado: abrir → spawn de `T.CURSED.COUNT` Bakemon em anel de raio `T.CURSED.RADIUS`, HP/dano × `T.CURSED.HP`/`T.CURSED.DMG` sobre a dificuldade atual, marcados com `ambushId`.
  Quando todos os da emboscada morrem → abre a oferta de relíquia (reusa `relicOffer` da Zona Digital) + `T.CURSED.BITS`; sem relíquia disponível → carta rara (forçar raridade alta no `lootRoll`). Inimigos da emboscada continuam vivos se o jogador fugir.
- Fim da partida (`finish`, qualquer resultado): `crystalsFor(run)` = `fase alcançada × A + abates / B + chefes × C + guardiões × D + bônus de medalha`; soma em `save.currency`; `RunState.crystalsEarned`.
  Valores iniciais em `T.CRYSTALS` mirando ~60–80 numa partida até a fase 2 e ~300 numa vitória.

### UI
- Menu inicial: cartão/botão **Laboratório** (mesmo estilo dos cartões Parceiros/Recordes), mostrando o saldo 💠.
- Tela Laboratório (layout B2 das outras telas): saldo no topo; uma linha por melhoria com nome, efeito, barrinhas de nível, preço do próximo, botão Comprar (desabilitado sem saldo/no máximo); teclado/controle: ↑↓ escolhe, confirmar compra, Esc volta.
- HUD: "Bits N" sob a barra de vida.
- Mapa: preço flutuante sobre baú pago (sprite de texto/canvas), baú amaldiçoado com cor/brilho próprios, baú grátis como hoje.
- Resultado: linha "Cristais +N 💠 (total T)".

## Deixado ao builder
- Estrutura exata das tabelas (preço por nível em tabela separada vs. JSON/colunas) — desde que o seed seja SQL puro portátil como os outros.
- Fórmula exata de `T.CRYSTALS` e `T.BITS` dentro dos alvos acima.
- Se partidas com `?debug=` devem ou não somar Cristais (sugestão: somar, como os recordes hoje; é só dev).
- Visual do preço flutuante (canvas texture) e do baú amaldiçoado (cor/emissivo), seguindo o estilo existente do `map.ts`.
