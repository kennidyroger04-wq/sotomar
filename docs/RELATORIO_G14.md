# Relatório G14 — inventário, equipamentos, transações e serviços

## Estado

**IMPLEMENTADO:** catálogo Godot gerado de JavaScript; estados de inventário/equipamento/atributos; transação de recompensa idempotente na sessão; consumíveis, cura e operações de mercado no modelo; inventário de toque integrado à exploração e a inspeções canônicas.

**TESTADO:** testes headless G14 cobrem IDs/quantidades, equipamento e troca, bônus, consumíveis, custos de PA, cura, compra/venda, itens de missão não vendáveis, fundos insuficientes, replay de recompensa e rejeição atômica de recompensa inválida.

**PENDENTE:** estado de inventário ainda não persiste entre reloads (G17); não há interface visual completa para equipar/vender/comprar; Bram declara no diálogo canônico que ainda não negocia. Os preços existentes são explicitamente provisórios e não foram tratados como balanceamento validado. Serviços e economia não são expostos como oferta de NPC sem configuração canônica.

## Matriz de paridade JavaScript → Godot

| JavaScript | Godot | Estado/limite |
|---|---|---|
| `js/data/items.js` | `godot/resources/items/item_registry.json` via `tools/build_godot_item_registry_g14.js` | 61 definições carregadas; fonte reproduzível e `--check` |
| `js/data/economy.js` | Mesmo catálogo | preços, itens canônicos e ordens copiados, todos com marcadores de preço provisório/deferimento |
| `js/core/rules.js` | `InventoryStateG14`, `EquipmentStateG14`, `CharacterStatsG14`, `RewardTransactionG14` | itens, slots, bônus, XP/nível; nenhuma regra JS foi modificada |
| `js/systems/consumables.js` | `ServicesControllerG14.use_consumable` | Poção e custo de PA/cura implementados |
| `js/systems/economy.js` | `ServicesControllerG14.buy/sell` | limites e preços copiados; operações marcadas provisórias |
| `js/data/npcs.js` e `js/systems/npcs.js` | `ServicesControllerG14.heal`; controller de exploração | cura modelada; Bram não oferece comércio enquanto a fala-fonte indicar indisponibilidade |
| recompensa de quest | `RewardTransactionG14` | valida lote inteiro antes da alteração; ID deduplica durante a sessão; itens reais só entram no inventário por ID conhecido |

## Integração com inspeções G13

Ao inspecionar um ponto, o controlador aplica a reivindicação por ID de transação estável. Após commit, marca a claim `COMMITTED` e emite `COLLECT`; repetição do mesmo ponto/transação não duplica itens. O botão “Mochila” mostra nome e quantidade dos itens obtidos. As quatro posições seguem provisórias; o ponto do Selo permanece ausente por coordenada TBD.

## Testes

- `node tools/build_godot_item_registry_g14.js --check` — 61 entradas reproduzem as fontes JavaScript.
- `godot --headless --path godot --script res://tests/test_inventory_g14.gd` — aprovado.
- `godot --headless --editor --path godot --quit` — importação Godot 4.6.3 aprovada.
- `godot --headless --path godot res://scenes/main.tscn --quit-after 5` — cena principal inicia sem erro após a integração G14.
- `godot --headless --path godot --script res://tests/test_inspections_g13.gd` — inspeção confirma transação, item no inventário e quantidade exibida no controle móvel.

Não houve validação gráfica humana ou em dispositivo físico. Teste automatizado não equivale a aprovação de usabilidade.
