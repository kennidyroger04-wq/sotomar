# Continuidade da Operação Sotomar/Fímbria

## Checkpoint recuperável

- Última missão: G18A consolidou a interface mobile, ações de inventário/equipamento, cura de Nilo e fluxo Web de backup; G15 permanece parcial e G16 depende de definições canônicas para confronto/encerramento.
- Branch atual: `operation/g18a`, baseada na branch preservada `operation/g12-g17`.
- Base verificada: `90190d1a62698928df19cdecdba3442e6d33d93e`, igual a `origin/operation/g12-g17` após fetch.
- Checkpoint pré-G18A: branch local `checkpoint/g18a-start` e tag `checkpoint-g18a-start-20261014`.
- Checkpoints G13–G17: G13 `4df28dc3d669a66c5918de027c742f361d9b5348`; G14 `624817100e5694020c61af08194f082b9426cf32`; G15 `e8771bde028f4f06fc2cceac6aaccdca315845cf`; G16 `ac7cdd4c3086d0f4619a071eab858b3e350eda04`; G17 `979a3e4d4b521addd18e8a574636308f750abf70`.
- G11 permanece protegida pela tag `g11-stable-20261014`; não alterar `main` nem mesclar automaticamente.

## Trabalho anterior

G12–G17: ver os respectivos relatórios. G18A e capturas: `docs/RELATORIO_G18A.md` e `docs/reports/g18a/`. O projeto Web foi exportado localmente e testado com Chromium. Fontes JS canônicas permanecem inalteradas.

## Retomada segura

1. `cd /workspace/sotomar` e conferir `git status --short --branch`/`git diff` na branch `operation/g18a`.
2. Manter `operation/g12-g17` e `g11-stable-20261014` intactas; não mesclar na `main` automaticamente.
3. Para Godot no container, definir `XDG_DATA_HOME=/tmp/sotomar-godot-data`, `XDG_CONFIG_HOME=/tmp/sotomar-godot-config`, `XDG_CACHE_HOME=/tmp/sotomar-godot-cache` e `HOME=/tmp/sotomar-home`.
4. Regressões centrais G18A: `godot --headless --path godot --script res://tests/test_mobile_layout_g18a.gd`, `godot --headless --path godot --script res://tests/test_saves_g17.gd`, `godot --headless --path godot --script res://tests/test_inventory_g14.gd` e `godot --headless --path godot --script res://tests/test_combat_g10.gd`.
5. Servir `/workspace/build/web` por HTTP local e rodar `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node godot/tools/capture_web_g18a.js http://127.0.0.1:PORT/index.html docs/reports/g18a`.
6. Fluxo automatizado de arquivo: `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node godot/tests/test_web_save_flow_g18a.js http://127.0.0.1:PORT/index.html`.
7. Próxima etapa segura: provar equivalência de Avanço/Cruz/Lança e efeitos temporários com fixtures JavaScript/Godot antes de ativá-los ou ampliar a IA. Separadamente, solicitar decisão narrativa sobre acessos TBD, Sineira e encerramento; não inferir conteúdo.

## Pendências conhecidas

- MAP_03 e MAP_09 continuam sem acesso canônico. MAIN_02/03 e MAIN_07/08, secundárias, Coruja-muda e Sineira mantêm os TBD documentados em G12–G16.
- G14: interface de mochila/equipamento/consumível e cura de Nilo implementadas; visual do equipamento no avatar pendente. Bram não oferece comércio pela fala canônica e preços continuam provisórios.
- G15 parcial: Golpe/Fortificar parciais; Avanço/Cruz/Lança, efeitos temporários e IA sem paridade completa.
- G16/Arco 1 parcial: a fonte não confirma Sineira como boss final nem define confronto/epílogo.
- `node js/tests/run-tests.js` em G18A emitiu 362 aprovações antes de falhar em `js/tests/run-tests.js:501` pela ausência de asset. A auditoria atual lista 20 PNGs e 4 licenças Kenney em `docs/ASSETS_AUSENTES.md`.
- Chromium mobile emulado passou; aparelho físico, revisão artística humana e publicação HTTPS não foram feitos.
