# Relatório G15 — habilidades, efeitos, criaturas e IA

## Estado após G18B

O escopo comum de G15 está implementado e testado, mas **G15 não deve ser declarada integralmente concluída**: os perfis deferidos da Coruja-muda/Sineira seguem sem mecânica, e os perfis `control`, `support` e `pack` ainda precisam de fixtures comportamentais próprias. Também não se definiram recompensas/gatilhos ausentes nem ativaram narrativamente encontros sem gatilho. Os valores provisórios na fonte continuam assim.

| Habilidade (ID) | Custo / recarga | Alcance / forma / alvo | Efeito canônico | Godot / evidência |
|---|---:|---|---|---|
| Golpe Pesado (`golpe`) | 4 PA / 2 turnos | 1 / célula única / inimigo, LoS | Dano físico aleatório inclusivo 35–45, resolvido com atributos, crítico, bônus e resistência | **IMPLEMENTADO, TESTADO** em `combat_effects_g18b.gd`; regressão G10 |
| Avanço Impactante (`avanco`) | 3 PA / sem recarga | 1–3 / linha reta / inimigo, sem LoS | Avança até a célula livre anterior ao alvo (máx. 3), depois causa 20 físico | **IMPLEMENTADO, TESTADO, VALIDADO** por fixture JS/Godot, bloqueio, custos e toque no overlay existente |
| Explosão em Cruz (`cruz`) | 4 PA / sem recarga | 0–3 / cruz de 9 células / célula, LoS | 25–32 mágico por alvo inimigo na área; aplica Vulnerável por 2 turnos com −0,15 em ambas resistências | **IMPLEMENTADO, TESTADO, VALIDADO** por fixture, filtragem de aliados, duração, resistência e prévia/seleção no HUD |
| Arremesso de Lança (`lanca`) | 3 PA / sem recarga | 2–3 / célula única / inimigo, LoS | 18–26 físico e Veneno por 2 turnos; 8 físico no início de cada turno do alvo | **IMPLEMENTADO, TESTADO, VALIDADO** por fixture, ticks e expiração |
| Postura Fortificada (`fortificar`) | 2 PA / 2 turnos | 0 / usuário / próprio, sem LoS | +0,20 resistência física e +0,10 mágica por 2 turnos | **IMPLEMENTADO, TESTADO, VALIDADO** por fixture, duração, recarga e re-aplicação |

Os valores inteiros de dano usam o intervalo inclusivo definido em `js/data/abilities.js`; a resolução final continua sujeita a `js/core/rules.js` (atributos, crítico, bônus e resistência limitada). A validação usa PA, recarga, alcance Manhattan, LoS, tipo de alvo e caminho da investida. O despacho da IA mapeia cada perfil comum ao planejador JavaScript correspondente; evidência comportamental própria existe para ranged_control, e cobertura adicional de control/support/pack permanece pendente.

## Efeitos, estados e perfis

| Regra | Estado |
|---|---|
| Aplicação e reaplicação de efeitos | **IMPLEMENTADO, TESTADO**; mesmo ID e origem atualiza a duração em vez de acumular instâncias |
| Expiração por turno, recarga e PA/PM | **IMPLEMENTADO, TESTADO**; expiração no fim do turno do afetado, veneno no começo do turno, recarga/PA/PM restaurados no começo do turno |
| Resistências e morte | **IMPLEMENTADO, TESTADO**; modificadores de efeitos entram no cálculo de dano; morte gera evento uma vez |
| `MAREJADO`, `ORVALHADO`, `ENCHARCADO` | **VALIDADO como metadados de exposição** em `fimbria-canonical.js`; a fonte não atribui modificadores/duração de combate a essas variantes, portanto não foram inventados |
| `melee`, `ranged_control`, `control`, `support`, `pack` | **IMPLEMENTADO**; despacho de cada perfil testado. Fixture comportamental completa só para ranged_control; control/support/pack seguem PENDENTES para paridade própria |
| `special_deferred` (Coruja-muda) | **PENDENTE**: contrato especial está marcado como deferido na fonte |
| `boss_reference_only` (Sineira) | **PENDENTE**: existe referência/estratégia e regra não letal, mas o contrato completo e as ações especiais não estão definidos para esta integração |

## Encontros ENC_01–ENC_12

O adaptador monta composições canônicas para cenários de combate quando há estatísticas e habilidade resolvível. A montagem foi testada nos doze IDs, mas batalha E2E por composição foi executada somente para ENC_01/ENC_05. Isso não ativa gatilhos: a fonte de localização permite somente esses dois nos pontos provisórios; os outros dez seguem sem acesso narrativo canônico. O quadro está em [RELATORIO_G18B.md](RELATORIO_G18B.md).

**TESTADO:** `node godot/tests/test_abilities_g15.js`, paridade JavaScript G18B, 78 verificações headless G18B e regressão G10/G11. **PENDENTE:** contrato especial da Sineira/Coruja-muda, fixtures específicas de IA control/support/pack, batalha E2E dos dez encontros não ativáveis e políticas de repetição/recompensa não especificadas. O JavaScript de produção não foi alterado.
