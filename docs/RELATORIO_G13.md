# Relatório G13 — estado inicial de missões e progressão

**Estado:** PARCIALMENTE IMPLEMENTADO, TESTADO; objetivos sem sistema de coleta/inspeção, diálogos condicionais e persistência PENDENTES.
**Branch:** `operation/g12-g17`. G13 não está concluída.

## Implementado

- `tools/build_godot_quest_registry.js` gera o recurso Godot a partir de `js/data/fimbria-canonical.js`, validando as referências antes da exportação. Inclui os 13 IDs MAIN_01–MAIN_08 e SIDE_01–SIDE_05, aliases NPC e atribuição por mapa.
- `QuestProgressStateG13` separado do controlador mantém aceitação, pré-requisitos, progresso, eventos processados e flags durante a sessão.
- A aceitação por conversa segue os alvos TALK e mostra um botão explícito no diálogo. Missões atribuídas por mapa sem objetivo TALK são aceitas na entrada, como no adapter JavaScript.
- Eventos TALK, EXPLORE, MOB_KILLED e ENCOUNTER_RESOLVED são encaminhados da cena/conclusão G11. Eventos repetidos com o mesmo `eventId` não incrementam progresso de novo.
- Há suporte a objetivos OR de exploração, flags requeridas, flags de progressão e exigência de resolução não letal para objetivos BOSS.
- O HUD mostra até dois títulos/objetivos disponíveis ou aceitos. MAIN_04 concede `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED`, que o gate do mapa G12 consulta.
- O estado não concede itens, XP ou moeda. A conclusão lógica usa apenas objetivos existentes; `deliveryTbd`, `problemResolutionTbd`, `pendingObjectives` e cenas/confrontos deferidos continuam bloqueando conclusão.

## Pendente para concluir G13

- Não existe ainda interação de mundo para coletar itens ou inspecionar pontos; eventos COLLECT/INSPECT só são aceitos pelo modelo de domínio e testes.
- Falas NPC ainda são estáticas; não há troca de saudação por estado disponível/ativo/pronto/concluído nem fluxo de entrega em diálogo.
- MAIN_02, MAIN_03 e outras missões com materiais/entrega TBD continuam incompletas. MAIN_07 não tem combate Sineira/retorno; SIDE_03 não tem encontro não letal da Coruja.
- Recompensas não são concedidas, aguardando a transação idempotente de itens em G14.
- O estado de missão é somente em memória; G17 deverá persistir e recuperar progresso e deduplicação.
- O fluxo visual do botão de aceitar foi exercitado em cena headless, mas não inspecionado em captura gráfica nem validado em aparelho.

## Testes

**Aprovado:**

- `node tools/build_godot_quest_registry.js --check` — 13 definições coincidem com a fonte.
- `godot --headless --path godot --script res://tests/test_quests_g13.gd` — aceitação explícita, aliases, pré-requisitos, replay idempotente, morte canônica, flags obrigatórias, flag do gate, ramo OR, bloqueios TBD, aceite de missão atribuída por mapa e filtro não letal.
- `godot --headless --path godot --script res://tests/test_maps_g08.gd` — HUD mostra missão e diálogo Mira oferece aceitação; regressões de mapas passaram.
- `godot --headless --path godot --script res://tests/test_encounters_g11.gd` — vitória do Topetão emite progresso de KILL para MAIN_02; 26 verificações passaram.
- Godot 4.6.3 importou scripts e cenas; export Web Release e validação estrutural foram incluídos na regressão G01–G13.

**Falha JavaScript registrada:** `node js/tests/run-tests.js` termina com código 1 na linha 501 porque arquivos referenciados do pacote Kenney estão ausentes em `assets/vendor/kenney/...`. Centenas de verificações anteriores passam; não foi alterado o teste nem contornada a falha.

## Próximo passo

G13 precisa fechar interações de coleta/inspeção e estados condicionais de diálogo com dados canônicos, então testar fluxo de missão completo sem recompensa. G14 deverá fornecer a camada transacional de recompensas antes de qualquer item/XP ser concedido. G17 continua responsável pela persistência do estado de quests.
