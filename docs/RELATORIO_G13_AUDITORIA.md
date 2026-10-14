# G13 — auditoria de missões e progressão narrativa

**Estado do snapshot inicial:** fonte auditada, antes da integração. A implementação parcial posterior está descrita em `RELATORIO_G13.md`; G13 segue incompleta.
**Branch-base:** `operation/g12-g17` no checkpoint G12 `834ae3d4f6048ebf7c0a75b99dfa224e26b672b8`.

## Fonte e evidências

- Fonte de dados: `js/data/fimbria-canonical.js`; `validateReferences()` retorna `{ok:true, errors:[]}`.
- Há 13 IDs de missão: MAIN_01–MAIN_08 e SIDE_01–SIDE_05.
- Os tipos canônicos encontrados incluem TALK, EXPLORE, KILL, COLLECT, OR, BOSS e INSPECT. Os pré-requisitos MAIN_01→MAIN_02→MAIN_03→MAIN_04→MAIN_05→MAIN_06→MAIN_07→MAIN_08 permanecem explícitos; missões secundárias não listam pré-requisitos.
- Os alvos NPC canônicos têm aliases para `guarda_mira`, `exploradora_lia`, `curandeiro_nilo` e `mercador_bram`. As falas existentes estão em `godot/resources/npcs/npc_dialogues_g09.json`, mas ainda não são condicionadas pelo estado das missões.
- Os encontros G11 emitem `MOB_KILLED` e `ENCOUNTER_RESOLVED` no resultado de vitória e guardam o resultado no state store. `game_controller.gd` ainda não encaminha esses eventos a um sistema de missões.
- O gate `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED` é concedido por MAIN_04 na definição canônica; o controlador de mapa G12 já exige essa flag, mas ainda não há integração com quest state para concedê-la.

## Lacunas canônicas que bloqueiam conclusão automática

| Missão | Lacuna registrada na fonte | Tratamento necessário |
|---|---|---|
| MAIN_01 | recompensa do Colete Caiado marcada `canonical_item_deferred`; status parcial | não conceder item ainda; manter progresso separado da aplicação de recompensa |
| MAIN_02 | entrega/Tufo e adaptadores marcados data-only/TBD | não inventar ponto de coleta ou regra de entrega |
| MAIN_03 | coleta de materiais não definidos | impedir conclusão automática até haver objetivo canônico |
| MAIN_04 | objetivos explícitos e flag canônica; ramo OR MAP_05/MAP_06 | pode ser implementável após IDs de inspeção/interação confirmados |
| MAIN_06 | cena multi-NPC deferida | não simular falas de Bram/Lia como cena concluída |
| MAIN_07 | boss Sineira e inspeção do selo têm mecânicas/retorno pendentes | não declarar conclusão do arco |
| MAIN_08 | depende de MAIN_07 e de itens/flags ainda incompletos | manter bloqueada por pré-requisitos |
| SIDE_01/SIDE_04/SIDE_05 | materiais não definidos ou mapa/material em TBD | não criar coleta fictícia |
| SIDE_03 | encontro não letal da Coruja está deferido; evento pendente | não usar vitória comum como resolução narrativa |
| SIDE_02 | resolução do contrato permanece TBD | não inventar resolução |

MAP_03 e MAP_09 também não possuem entrada alcançável no runtime atual; G12 documenta isso em `RELATORIO_G12.md`.

## Próxima implementação segura

1. Criar um registry Godot gerado a partir da fonte canônica, sem editar o JavaScript.
2. Criar `QuestState` isolado com pré-requisitos, progresso por objetivo, contagem e processamento idempotente de `eventId`.
3. Traduzir os eventos já existentes e explorar mapas/conversas para os IDs canônicos através dos aliases.
4. Testar objetivos OR, repetição de eventos, flags e estados bloqueados.
5. Expor acompanhamento mobile sem sugerir que objetivos TBD estão concluíveis.
6. Não aplicar recompensas até G14 fornecer uma transação de item/currency validada.

No momento deste snapshot, nenhum estado de missão ou regra tinha sido alterado; consulte o relatório de implementação posterior para o estado atual.
