# Relatório G18A — consolidação técnica e interface

## Checkpoint

- **Branch:** `operation/g18a`, criada a partir de `operation/g12-g17`.
- **Base verificada:** `90190d1a62698928df19cdecdba3442e6d33d93e`; coincidiu com `origin/operation/g12-g17` após `git fetch`.
- **Recuperação:** branch local `checkpoint/g18a-start` e tag `checkpoint-g18a-start-20261014` apontam para a base original. `g11-stable-20261014` não foi alterada.
- **Estado da versão JS:** fontes não foram alteradas.

## Status por etapa

| Etapa | Estado | Evidência e limite |
|---|---|---|
| A — interface mobile | **IMPLEMENTADO, TESTADO, VALIDADO tecnicamente** | Zoom inicial agora enquadra o tabuleiro; retirado o aviso que cruzava o rastreador; mochila e missões não ocupam a mesma área; painéis e ações refluem por orientação. Capturas reais do Chromium em quatro viewports e sem erro de console/requisição. A validação é técnica, não uma aprovação artística ou de aparelho físico. |
| B — mochila/equipamento | **IMPLEMENTADO, TESTADO** | Inventário rolável exibe nomes, descrições e quantidades; mostra slots, atributos, equipar/desequipar e uso da Poção Simples. As regras seguem em `InventoryStateG14`, `EquipmentStateG14`, `CharacterStatsG14` e `ServicesControllerG14`; a UI não duplica essas regras. Save é atualizado depois de cada operação. A troca visual do equipamento sobre o sprite não foi integrada. |
| C — serviços | **IMPLEMENTADO parcialmente, TESTADO** | O serviço canônico de Nilo recupera HP e informa estado cheio/curado. Bram permanece sem comércio: a fonte diz que ainda não negocia. Preços da tabela continuam PROVISÓRIOS e nenhuma oferta de mercado foi ativada. |
| D — backup | **IMPLEMENTADO, TESTADO, VALIDADO no Chromium emulado** | Exportação baixa JSON versionado. No Web, um input HTML transparente sobre o botão recebe o toque real e abre o seletor sem clique JavaScript automatizado. Arquivo é validado e resumido antes da confirmação. Uma cópia única do save atual é escrita antes da importação; falha de backup aborta a restauração. O estado importado foi confirmado, salvo e recuperado após reload. Não houve teste em iOS/Android físico. |
| E — paridade de habilidades | **PENDENTE** | Catálogo de cinco habilidades segue sincronizado. Só Golpe e parte de Fortificar existem em combate. Avanço, Cruz, Lança, status, duração/expiração e dano mágico não foram habilitados. A matriz está atualizada em `RELATORIO_G15.md`. |
| F — IA/encontros | **PENDENTE** | IA atual faz aproximação melee determinística. Não escolhe habilidades por papel, não avalia linha de visão/estados especiais e não integra os 12 encontros ao mundo. Somente os gatilhos provisórios anteriores continuam ativos; nada foi adicionado por conveniência. |
| G — quest/save | **IMPLEMENTADO e TESTADO no escopo alterado** | Ações de equipamento/consumível chamam o save; serviço de Nilo persiste HP; validação de preview não altera estado; import confirmado cria cópia recuperável antes de aplicar. Regressão de quest, recompensa idempotente e recuperação de slot passou. |
| H — testes/Web | **TESTADO** | 15 scripts GDScript, verificações JS/Python dos catálogos/export, build Web e Chromium. Suíte JS original permanece **FALHOU** na checagem de asset ausente; não foi mascarada. |
| I — lacunas narrativas | **IMPLEMENTADO** | Matriz de lacunas abaixo, também refletida em `PROGRESSO_ARCO_1.md`. Sem final narrativo inventado. |

## Interface e evidências visuais

| Viewport | Captura da exploração |
|---|---|
| 390×844 | [mobile-390x844.png](reports/g18a/mobile-390x844.png) |
| 844×390 | [mobile-844x390.png](reports/g18a/mobile-844x390.png) |
| 360×800 | [mobile-360x800.png](reports/g18a/mobile-360x800.png) |
| 1280×720 | [desktop-1280x720.png](reports/g18a/desktop-1280x720.png) |

Outras capturas: [mochila em 390×844](reports/g18a/mobile-390x844-inventory.png), [prévia de restauração](reports/g18a/mobile-import-preview.png), [estado após restaurar](reports/g18a/mobile-import-restored.png), [continuação após reload](reports/g18a/mobile-after-import-reload.png) e [abertura do combate Web](reports/g18a/mobile-combat-start.png). A prévia mostra personagem/mapa/célula/nível/itens e as ações explícitas Cancelar/Restaurar. O combate apresenta Topetão e não deixa a HUD de exploração cobrir as ações. Não há aprovação artística humana.

`godot/tools/capture_web_g18a.js` gera capturas das telas de seleção, exploração e mochila nas quatro resoluções e registra erros de console/rede em `browser-check.json`. `godot/tests/test_web_save_flow_g18a.js` valida baixar o save, selecionar o arquivo com Chromium, revisar, confirmar, retomar em MAP_04 após reload e abrir ENC_05. Vitória/recompensas Web não foram executadas; estão cobertas por testes headless G10/G13.

## Testes executados

- **Godot headless:** todos os `godot/tests/test_*.gd` — 15 scripts, **596 linhas `PASS:`**, zero scripts falhos. G10: 24; G14: 29; G17: 14; layout G18A: 21. Logs individuais em `/tmp/g18a-test_*-final.log` quando gerados.
- **Godot/Web:** `godot --headless --path godot --export-release Web /workspace/build/web/index.html` completou; `python3 godot/tests/test_web_export_g07.py` — 3 aprovados.
- **Chromium:** 390×844, 844×390, 360×800 e 1280×720: canvas carregado, cena capturada, sem erro de console/requisição; ver `browser-check.json`. Exportação, seletor de arquivo, prévia, confirmação, restauração MAP_04, reload/resume e abertura de ENC_05 passaram em emulação mobile. Vitória Web e teste físico não executados.
- **JavaScript/Python Godot:** seis arquivos JS aprovados (38 assertions reportadas; 22 fixtures de combate e catálogo dos 12 encontros) e cinco scripts Python aprovados, incluindo os três testes da exportação Web.
- **Suíte JS original:** `node js/tests/run-tests.js` falhou em `js/tests/run-tests.js:501`, primeiro `existsSync` de asset visual. Foram emitidos 362 resultados aprovados antes da falha. O inventário atual em `docs/ASSETS_AUSENTES.md` lista 20 PNGs e 4 licenças Kenney ausentes; essa verificação não prova recuperação de nenhum recurso. A falha é independente do Godot e permanece explícita.

## Matriz de lacunas narrativas

| Classe | Lacunas/evidência | Ação técnica desta missão |
|---|---|---|
| A. Fonte existente, ainda não integrada | Definições de Avanço, Cruz, Lança e regras de efeitos em `js/data/abilities.js`/`js/systems/combat-effects.js`; perfis de IA em `js/systems/combat-ai.js`; catálogo ENC_01–ENC_12. | Reexecutada a auditoria de paridade; não habilitadas sem fixtures equivalentes. |
| B. Fonte existente, porém incompleta | MAP_03/MAP_09 sem conexões; MAIN_02/03 e MAIN_07/08 têm objetivos/dados incompletos; missões secundárias com destino/entrega pendentes; Coruja-muda deferida; Sineira definida como boss/contrato não letal, sem regras completas de luta. Ver relatórios G12–G16 e `js/data/fimbria-canonical.js`. | Preservado estado e progresso; nenhum portal, condição ou recompensa novo foi inferido. |
| C. Decisão narrativa ausente | Fonte não identifica a Sineira como chefe final nem define confronto final/epílogo/encerramento do Arco 1. | Não inventado nem implementado. Requer definição do proprietário. |
| D. Problema técnico | IA G15 sem habilidades/status; sprites de equipamento ainda não refletem o slot em exploração; 20 PNGs e 4 licenças ausentes no checkout; nenhuma validação em dispositivo físico ou hospedagem pública. | Registrado como pendente, sem misturar com lacuna narrativa. |

## Pendências e conclusão

- **G14:** controles funcionais de mochila/equipamento/consumível já existem; mercado permanece fechado conforme diálogo canônico. A aparência do avatar equipado continua pendente.
- **G15:** PARCIAL. Os 22 fixtures JS G10 e 22 testes de combate não demonstram equivalência de Avanço/Cruz/Lança nem todos os efeitos temporários.
- **G16/Arco 1:** PARCIAL. Sineira e encerramento não têm definição suficiente. O Arco 1 não está concluído.
- **Web:** pipeline exportado e testado localmente. Nada foi publicado; não há URL HTTPS pública.
- **Arte:** capturas inspecionadas para colisões e legibilidade básica. Esta inspeção não constitui aprovação final de arte ou usabilidade.
