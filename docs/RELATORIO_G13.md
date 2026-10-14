# Relatório G13 — missões, progressão e interações de exploração

**Estado:** infraestrutura IMPLEMENTADA e TESTADA; conteúdo narrativo continua PARCIAL por objetivos TBD, transações e persistência pendentes.
**Branch:** `operation/g12-g17`. G13 não está concluída.

## Implementado

- `tools/build_godot_quest_registry.js` gera o recurso Godot a partir de `js/data/fimbria-canonical.js`, validando as referências antes da exportação. Inclui os 13 IDs MAIN_01–MAIN_08 e SIDE_01–SIDE_05, aliases NPC e atribuição por mapa.
- `QuestProgressStateG13` separado do controlador mantém aceitação, pré-requisitos, progresso, eventos processados e flags durante a sessão.
- A aceitação por conversa segue os alvos TALK e mostra um botão explícito no diálogo. Missões atribuídas por mapa sem objetivo TALK são aceitas na entrada, como no adapter JavaScript.
- Eventos TALK, EXPLORE, MOB_KILLED e ENCOUNTER_RESOLVED são encaminhados da cena/conclusão G11. Eventos repetidos com o mesmo `eventId` não incrementam progresso de novo.
- Há suporte a objetivos OR de exploração, flags requeridas, flags de progressão e exigência de resolução não letal para objetivos BOSS.
- Diálogos NPC consultam estados `unavailable`, `available`, `active`, `ready` e `completed`, usando os textos existentes no catálogo G09 quando definidos. Aceite explícito permanece necessário.
- O registro de inspeção é gerado do adapter canônico JavaScript e verifica mapa, célula walkable, colisões com spawns/saídas e distância de interação. Os quatro pontos carregados estão marcados como posicionamento `PROVISIONAL_LOGICAL`.
- Inspeções emitem `INSPECT` idempotente e enfileiram o item canônico como `PENDING_G14_TRANSACTION`. A integração G14 confirma a transação antes de mudar a reivindicação para `COMMITTED` e emitir `COLLECT`.
- MAIN_04 tem teste do ramo OR e da flag `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED` usada pelo gate MAP_05↔MAP_07. A flag só surge após a conclusão permitida pelo estado canônico.
- O HUD mostra até dois títulos/objetivos disponíveis ou aceitos. MAIN_04 concede `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED`, que o gate do mapa G12 consulta.
- O estado não concede itens, XP ou moeda. A conclusão lógica usa apenas objetivos existentes; `deliveryTbd`, `problemResolutionTbd`, `pendingObjectives` e cenas/confrontos deferidos continuam bloqueando conclusão.

## Conteúdo G13 pendente

- Decalque do Selo permanece sem marcador físico, pois a posição canônica do selo em MAP_11 continua TBD.
- Parte dos textos/estados de diálogo não está definida em fonte canônica; nenhum texto de lore novo foi criado. Entrega visual em diálogo depende de estados especificados e validação gráfica.
- MAIN_02, MAIN_03 e outras missões com materiais/entrega TBD continuam incompletas. MAIN_07 não tem combate Sineira/retorno; SIDE_03 não tem encontro não letal da Coruja.
- Recompensas não são concedidas, aguardando a transação idempotente de itens em G14.
- O estado de missão é somente em memória; G17 deverá persistir e recuperar progresso e deduplicação.
- O fluxo visual do botão de aceitar foi exercitado em cena headless, mas não inspecionado em captura gráfica nem validado em aparelho.

## Testes

**Aprovado:**

- `node tools/build_godot_quest_registry.js --check` — 13 definições coincidem com a fonte.
- `node tools/build_godot_inspection_registry_g13.js --check` e `node godot/tests/test_inspections_g13.js` — os 4 pontos/IDs/itens/posições correspondem ao adapter original.
- `godot --headless --path godot --script res://tests/test_inspections_g13.gd` — catálogo, walkability, distância, aviso móvel, idempotência e handoff G14 sem concessão antecipada.
- `godot --headless --path godot --script res://tests/test_quests_g13.gd` — aceitação, estados de diálogo, aliases, pré-requisitos, deduplicação, bloqueios TBD, não letalidade e gate MAIN_04.
- `godot --headless --path godot --script res://tests/test_maps_g08.gd` — HUD mostra missão e diálogo Mira oferece aceitação; regressões de mapas passaram.
- `godot --headless --path godot --script res://tests/test_encounters_g11.gd` — vitória do Topetão emite progresso de KILL para MAIN_02; 26 verificações passaram.
- `godot --headless --path godot --script res://tests/test_maps_g12.gd` — onze mapas; importação `godot --headless --editor --path godot --quit` também aprovada em Godot 4.6.3.

**Falha JavaScript registrada:** `node js/tests/run-tests.js` termina com código 1 na linha 501 porque arquivos referenciados do pacote Kenney estão ausentes em `assets/vendor/kenney/...`. Centenas de verificações anteriores passam; não foi alterado o teste nem contornada a falha.

## Próximo passo

G13 tem infraestrutura funcional de progresso, inspeção e estado de diálogo. A integração das reivindicações com inventário/entrega é a primeira etapa de G14. Missões narrativas com conteúdo TBD não são declaradas concluídas; não houve validação visual humana. G17 continua responsável pela persistência.
