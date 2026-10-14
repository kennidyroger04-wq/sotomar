# Continuidade da Operação Sotomar/Fímbria

## Checkpoint recuperável

- Última etapa fechada: G17 save versionado ligado ao ciclo da exploração; G15 permanece parcial por mecânicas/IA ainda sem paridade e G16 não pode ser concluída sem definições canônicas de boss/final.
- Branch de trabalho: `operation/g12-g17`.
- Checkpoints desta continuação: G13 `4df28dc3d669a66c5918de027c742f361d9b5348`; G14 `624817100e5694020c61af08194f082b9426cf32`; G15 `e8771bde028f4f06fc2cceac6aaccdca315845cf`; G16 `ac7cdd4c3086d0f4619a071eab858b3e350eda04`; G17 `979a3e4d4b521addd18e8a574636308f750abf70`. Todos foram enviados a `origin/operation/g12-g17`.
- G12: `834ae3d4f6048ebf7c0a75b99dfa224e26b672b8`; G13–G17 estão descritas nos relatórios de cada missão.
- G11 está protegido pela tag `g11-stable-20261014`; não alterar a branch `main` nem mesclar automaticamente.
- Skill/ambiente cloud não exigiram credenciais nem configuração adicional.

## O que foi feito

G12: ver `docs/RELATORIO_G12.md`. Para G13–G17, consultar `docs/RELATORIO_G13.md`, `docs/RELATORIO_G14.md`, `docs/RELATORIO_G15.md`, `docs/RELATORIO_G16.md` e `docs/RELATORIO_G17.md`. A captura técnica de Web mobile pós-reload está em `docs/reports/g17/web_mobile_after_reload.png`. As fontes JavaScript canônicas não foram modificadas.

## Retomada segura

1. `cd /workspace/sotomar`
2. `git status --short --branch` e revisar todos os diffs.
3. Executar `git diff --check`.
4. Executar `node tools/sync_godot_map_registry.js --check`, `node tools/build_godot_encounter_catalog.js --check`, `node tools/build_godot_quest_registry.js --check`, testes G12/G13 e as regressões enumeradas em `godot/tests/README.md`.
5. Configurar `XDG_DATA_HOME=/tmp/sotomar-godot-data`, `XDG_CONFIG_HOME=/tmp/sotomar-godot-config`, `XDG_CACHE_HOME=/tmp/sotomar-godot-cache` e `HOME=/tmp/sotomar-home` para Godot no container.
6. Executar os comandos G01–G17 listados em `godot/tests/README.md`; a regressão completa mais recente teve 302 verificações PASS. Rebuild Web e Chromium foram aprovados tecnicamente.
7. Criar controles visuais de export/import de save, preservando o API JSON e testando seleção de arquivos em browser/mobile.
8. Retomar G15 com port das habilidades/efeitos e IA em paridade JavaScript; só ativar habilidades após fixtures; decidir boss final somente com fonte canônica.

## Pendências conhecidas

- MAP_03 e MAP_09 não possuem saída no runtime; requerem informação canônica antes de se tornarem alcançáveis.
- MAIN_02, MAIN_03, MAIN_07 e algumas missões secundárias têm objetivos, entregas ou resoluções TBD; não inventar lore, item ou conclusão.
- MAP_05↔MAP_07 requer `FLAG_ESCADA_MARCO_PRUMO_UNLOCKED`; a progressão MAIN_04 concede a flag pelo objetivo/entrega canônicos.
- A suíte JavaScript histórica tem 11 assets Kenney ausentes, conforme o histórico da operação; não ignorar essas falhas.
- G15 permanece parcial: três habilidades e efeitos de estado/IA ainda sem integração Godot em paridade.
- G16 permanece parcial: Sineira é boss canônico da MAP_11, mas não há confirmação de que seja o boss final nem regras suficientes para lutar/encerrar o Arco 1.
- G14 não tem interface visual completa para equipar/comprar/vender; os preços são provisórios. G17 persiste em IndexedDB, mas ainda não oferece seletor/baixador de arquivo.
- Revisão visual humana, aparelho físico e hospedagem HTTPS continuam pendentes. A tela mobile mostrou escala compacta e sobreposição do HUD; a captura não representa aprovação visual.
