# Continuidade da Operação Sotomar/Fímbria

## Checkpoint recuperável

- Última etapa fechada: camada G14 de inventário/recompensa/consumíveis e integração de inspeção→inventário; interfaces de equipamento/loja e persistência ainda pendentes.
- Branch de trabalho: `operation/g12-g17`.
- Checkpoint remoto de G13 nesta continuação: `4df28dc3d669a66c5918de027c742f361d9b5348`; criar e confirmar o checkpoint G14 antes de seguir para G15.
- G12: `834ae3d4f6048ebf7c0a75b99dfa224e26b672b8`; G13 parcial: `0ac9fc8590444984b735286bbcbde80335e0a95c`. Ambos enviados a `origin/operation/g12-g17`.
- G11 está protegido pela tag `g11-stable-20261014`; não alterar a branch `main` nem mesclar automaticamente.
- Skill/ambiente cloud não exigiram credenciais nem configuração adicional.

## O que foi feito

G12: ver `docs/RELATORIO_G12.md`. G13 tem uma primeira fatia funcional ainda incompleta: ver `docs/RELATORIO_G13.md` e auditoria de fonte em `docs/RELATORIO_G13_AUDITORIA.md`. Os principais arquivos alterados incluem o gerador do catálogo, `map_registry.json`, `encounter_registry.json`, controlador da cena principal e testes G08/G12. As fontes canônicas JavaScript não foram modificadas.

## Retomada segura

1. `cd /workspace/sotomar`
2. `git status --short --branch` e revisar todos os diffs.
3. Executar `git diff --check`.
4. Executar `node tools/sync_godot_map_registry.js --check`, `node tools/build_godot_encounter_catalog.js --check`, `node tools/build_godot_quest_registry.js --check`, testes G12/G13 e as regressões enumeradas em `godot/tests/README.md`.
5. Configurar `XDG_DATA_HOME=/tmp/sotomar-godot-data`, `XDG_CONFIG_HOME=/tmp/sotomar-godot-config`, `XDG_CACHE_HOME=/tmp/sotomar-godot-cache` e `HOME=/tmp/sotomar-home` para Godot no container.
6. Conferir `git status --short --branch`; commits G12/G13 já foram enviados à branch de operação.
7. Concluir auditoria G15 das habilidades/IA e contratos de criaturas usando `js/data/abilities.js`, `js/systems/combat-effects.js`, `js/systems/combat-ai.js` e o catálogo G11.

## Pendências conhecidas

- MAP_03 e MAP_09 não possuem saída no runtime; requerem informação canônica antes de se tornarem alcançáveis.
- MAP_05↔MAP_07 requer `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED`; a QuestState G13 já pode conceder a flag ao concluir MAIN_04, mas o estado de quests ainda é só de sessão.
- A suíte JavaScript histórica tem 11 assets Kenney ausentes, conforme o histórico da operação; não ignorar essas falhas.
- Revisão visual humana, aparelho físico e hospedagem HTTPS continuam pendentes.
- G13 está parcial: coleta/inspeção de pontos e diálogos condicionais ainda precisam integração; sem recompensas/saves. G14–G17 não iniciadas.
