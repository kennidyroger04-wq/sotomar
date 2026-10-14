# Continuidade da Operação Sotomar/Fímbria

## Checkpoint recuperável

- Última missão concluída: G12 — integração do catálogo e layouts MAP_01–MAP_11.
- Branch de trabalho: `operation/g12-g17`.
- Base remota conhecida antes desta missão: `4ab3e72868f2962d563cad509aa0276a562b70d6` (G11B).
- G12 foi commitada e enviada: `834ae3d4f6048ebf7c0a75b99dfa224e26b672b8`. O working tree deve permanecer limpo após este commit de auditoria documental.
- G11 está protegido pela tag `g11-stable-20261014`; não alterar a branch `main` nem mesclar automaticamente.
- Skill/ambiente cloud não exigiram credenciais nem configuração adicional.

## O que foi feito

G12: ver `docs/RELATORIO_G12.md`. G13 tem uma primeira fatia funcional ainda incompleta: ver `docs/RELATORIO_G13.md` e auditoria de fonte em `docs/RELATORIO_G13_AUDITORIA.md`. Os principais arquivos alterados incluem o gerador do catálogo, `map_registry.json`, `encounter_registry.json`, controlador da cena principal e testes G08/G12. As fontes canônicas JavaScript não foram modificadas.

## Retomada segura

1. `cd /workspace/sotomar`
2. `git status --short --branch` e revisar todos os diffs.
3. Executar `git diff --check`.
4. Executar `node tools/sync_godot_map_registry.js --check`, `node tools/build_godot_encounter_catalog.js --check`, `node godot/tests/test_maps_g12.js`, `godot --headless --path godot --script res://tests/test_maps_g08.gd` e `godot --headless --path godot --script res://tests/test_maps_g12.gd`.
5. Configurar `XDG_DATA_HOME=/tmp/sotomar-godot-data`, `XDG_CONFIG_HOME=/tmp/sotomar-godot-config`, `XDG_CACHE_HOME=/tmp/sotomar-godot-cache` e `HOME=/tmp/sotomar-home` para Godot no container.
6. Completar revisão de diff; criar commit da G12 e fazer push somente para `operation/g12-g17` se a autenticação estiver presente.
7. Completar G13 com coleta/inspeção e falas condicionais; manter recompensas pendentes até G14 e persistência até G17.

## Pendências conhecidas

- MAP_03 e MAP_09 não possuem saída no runtime; requerem informação canônica antes de se tornarem alcançáveis.
- MAP_05↔MAP_07 requer a flag canônica; G13 precisa conectá-la à quest correspondente, após identificá-la na fonte.
- A suíte JavaScript histórica tem 11 assets Kenney ausentes, conforme o histórico da operação; não ignorar essas falhas.
- Revisão visual humana, aparelho físico e hospedagem HTTPS continuam pendentes.
- G13 está parcial; G14–G17 não iniciadas.
