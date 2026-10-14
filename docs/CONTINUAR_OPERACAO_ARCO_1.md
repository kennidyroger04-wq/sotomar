# Continuidade da Operação Sotomar/Fímbria

## Checkpoint recuperável

- Última etapa fechada: G17 save versionado ligado ao ciclo da exploração; G15 permanece parcial por mecânicas/IA ainda sem paridade e G16 não pode ser concluída sem definições canônicas de boss/final.
- Branch de trabalho: `operation/g12-g17`.
- Checkpoints desta continuação: G13 `4df28dc3d669a66c5918de027c742f361d9b5348`; G14 `624817100e5694020c61af08194f082b9426cf32`; G15 `e8771bde028f4f06fc2cceac6aaccdca315845cf`; G16 `ac7cdd4c3086d0f4619a071eab858b3e350eda04`. O checkpoint G17 será acrescentado após push.
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
7. Criar controles visuais de export/import de save, preservando o API JSON e testando seleção de arquivos em browser/mobile.
8. Retomar G15 com port das habilidades/efeitos e IA em paridade JavaScript; decidir boss final somente com fonte canônica.

## Pendências conhecidas

- MAP_03 e MAP_09 não possuem saída no runtime; requerem informação canônica antes de se tornarem alcançáveis.
- MAP_05↔MAP_07 requer `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED`; a QuestState G13 já pode conceder a flag ao concluir MAIN_04, mas o estado de quests ainda é só de sessão.
- A suíte JavaScript histórica tem 11 assets Kenney ausentes, conforme o histórico da operação; não ignorar essas falhas.
- Revisão visual humana, aparelho físico e hospedagem HTTPS continuam pendentes.
- G13 está parcial: coleta/inspeção de pontos e diálogos condicionais ainda precisam integração; sem recompensas/saves. G14–G17 não iniciadas.
