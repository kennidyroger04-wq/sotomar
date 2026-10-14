# Relatório G16 — auditoria de boss e fim do Arco 1

## Determinação canônica

`CRE_SINEIRA` é a única entidade explicitamente classificada como `BOSS` e associada à arena MAP_11. MAIN_07 exige sua resolução não letal e a inspeção do selo. O contrato identifica a Sineira como um cágado-de-sino não maligno, registra as fases `GUARDIA`, `ALVOROCO`, `ALIVIO` e a pressão de Sereno como mecânica ainda provisória.

A fonte **não declara explicitamente que a Sineira é o boss final do Arco 1** e não contém confronto implementável, regras de fases, condições de retorno ou conclusão narrativa definitiva. MAIN_08 depende de MAIN_07 e das flags `FLAG_SINEIRA_RESOLVED` e `FLAG_SEAL_INSPECTED`; não há texto final ou estado de encerramento do arco. Não inferir final pela ordem de missão ou nome da arena.

`CRE_CORUJA_MUDA` aparece como encontro especial deferido em MAP_09 e evento não letal pendente em SIDE_03. Não é classificada como boss.

## Estado

- **IMPLEMENTADO:** snapshot técnico `godot/resources/combat/boss_registry_g16.json` gerado diretamente da fonte, incluindo os contratos de boss e o estado deferido da Coruja. G13 já valida os eventos `BOSS_DEFEATED` e rejeita a resolução letal quando `requireNonLethal` está marcado.
- **TESTADO:** gerador `--check`, paridade do catálogo e teste headless G13 de rejeição letal/aceite não letal.
- **PENDENTE:** arena/combate da Sineira, trigger do encontro, ocupação multi-tile, fases, retorno, decalque/posição do selo e encerramento de arco. Nada disso foi inventado ou ativado.
- **PENDENTE:** não há base canônica suficiente para afirmar qual é o boss final nem declarar o Arco 1 concluído.

Sem nova regra narrativa, MAP_11 permanece acessível como cenário; a luta não é iniciada e o tracker continua sem concluir MAIN_07/08.
