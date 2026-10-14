# Relatório G15 — habilidades, criaturas e IA

## Auditoria de paridade

| Fonte original | Conteúdo canônico encontrado | Estado Godot |
|---|---|---|
| `js/data/abilities.js` | Golpe Pesado, Avanço Impactante, Explosão em Cruz, Arremesso de Lança, Postura Fortificada; PA, alcance, cooldown, alvo e efeitos definidos | Golpe e Fortificar têm suporte parcial em `combat_rules_g10.gd`; demais ações não estão ativadas. Registro G15 gerado e comparado com a fonte para evitar perda de dados. |
| `js/systems/combat-effects.js` | Dano/cura/buff/debuff/status/movimentação, LoS, dash, área cruzada, status temporários, Boss não letal | Godot G10 não cobre paridade completa; poison/status/dash/cross continuam pendentes. |
| `js/systems/combat-ai.js` | Planejamento determinístico por alvo, alcance, path, papel e prioridade suporte/controle/dano | Godot G11 usa aproximação melee determinística; IA por habilidade/role não integrada. |
| `js/data/fimbria-runtime.js` e `js/data/fimbria-canonical.js` | Criaturas/variantes; CRE_SINEIRA é contrato, CRE_CORUJA_MUDA é deferred | G11 preserva 12 encontros; só ENC_01 e ENC_05 têm gatilho provisório no mundo. Composições pendentes permanecem inativas. |

## Resultado

**IMPLEMENTADO:** catálogo derivado `godot/resources/combat/ability_registry_g15.json` com gerador verificável. Combate G10/G11 existente permanece íntegro.

**TESTADO:** `node tools/build_godot_ability_registry_g15.js --check`, `node godot/tests/test_abilities_g15.js`, `node godot/tests/test_encounter_catalog_g11.js`, `godot --headless --path godot --script res://tests/test_encounters_g11.gd`.

**PENDENTE:** completar efeitos e IA contra fixtures JavaScript antes de integrar as ações ao overlay; dar suporte às criaturas/encontros adicionais apenas quando regras, posições e gatilhos forem válidos. Valores do runtime identificados como provisórios seguem assim. Nenhuma vantagem artificial foi adicionada.

G15 está PARCIAL; a fonte JavaScript e o motor existente não foram alterados nesta auditoria.
