# Continuidade da Operação Sotomar/Fímbria

## Continuidade após G18D

- Branch ativa: `operation/g18d-sprite-factory`, derivada de `operation/g18c-art` em `e82f371da4917ab4f9f0736dba32fbbab9a9bdba`; não fazer merge automático em `main`.
- Checkpoint recuperável antes da G18D: tag `checkpoint-g18d-start-20261015` e branch `checkpoint/g18c-start`.
- A fábrica `godot/tools/sprite_factory/build_g18d.py` lê JSONs de `godot/art/source/sprite_factory/specs/`, renderiza PNGs e gera masters/quadros/contact sheets/GIFs. Em seguida, o script Godot `godot/tools/sprite_factory/build_godot_resources.gd` constrói os SpriteFrames.
- Set das sete criaturas comuns está no board G10: 560 quadros, 140 animações direcionais, testes Python/GDScript. As propostas de anatomia não são cânone nem arte aprovada.
- Lia/Nilo/Bram agora têm módulo humanoide, idle/walk e integração nos markers MAP_01; revisar as propostas visuais. Prosseguir com cenários modulares/FX próprios, depois especiais, sem tocar células, falas, regras ou gatilhos canônicos.
- Sineira (cágado vivo e não maligno), Coruja-muda deferida e estados do Sereno continuam sem mecânica visual inventada. Variantes comuns usam sprite da espécie-base.
- Kenney no JavaScript legado continua separado: não alterar manifests sem substituir cada ID por arte correspondente e validar licenças/origem.
- Capturas G18D, caso disponíveis, ficam em `reports/g18d/captures/`; nenhum teste físico ou aprovação artística humana deve ser afirmado.
- Consulte `RELATORIO_G18D.md`, `FABRICA_SPRITES.md`, `CATALOGO_VISUAL_ARCO_1.md` e `PROGRESSO_ASSETS_ARCO_1.md`.

## Checkpoint recuperável

- Última missão: G18B integrou as cinco habilidades comuns, efeitos/IA e combate Web até vitória ENC_05 e retorno à exploração. G16 segue dependente do contrato canônico da Sineira/encerramento.
- Branch atual: `operation/g18b`, baseada na G18A validada (`b07589d3ef37411c0126391fd8680a46cd19e24d`).
- Checkpoint pré-G18B: branch `checkpoint/g18b-start` e tag `checkpoint-g18b-start-20261014`; checkpoints G18A e anteriores permanecem intactos.
- Checkpoints G13–G17: G13 `4df28dc3d669a66c5918de027c742f361d9b5348`; G14 `624817100e5694020c61af08194f082b9426cf32`; G15 `e8771bde028f4f06fc2cceac6aaccdca315845cf`; G16 `ac7cdd4c3086d0f4619a071eab858b3e350eda04`; G17 `979a3e4d4b521addd18e8a574636308f750abf70`.
- G11 permanece protegida pela tag `g11-stable-20261014`; não alterar `main` nem mesclar automaticamente.

## Trabalho anterior

G12–G17: ver os respectivos relatórios. G18A e capturas: `docs/RELATORIO_G18A.md` e `docs/reports/g18a/`. O projeto Web foi exportado localmente e testado com Chromium. Fontes JS canônicas permanecem inalteradas.

## Retomada segura

1. `cd /workspace/sotomar` e conferir `git status --short --branch`/`git diff` na branch `operation/g18b`.
2. Manter `operation/g12-g17` e `g11-stable-20261014` intactas; não mesclar na `main` automaticamente.
3. Para Godot no container, definir `XDG_DATA_HOME=/tmp/sotomar-godot-data`, `XDG_CONFIG_HOME=/tmp/sotomar-godot-config`, `XDG_CACHE_HOME=/tmp/sotomar-godot-cache` e `HOME=/tmp/sotomar-home`.
4. Regressões centrais G18A: `godot --headless --path godot --script res://tests/test_mobile_layout_g18a.gd`, `godot --headless --path godot --script res://tests/test_saves_g17.gd`, `godot --headless --path godot --script res://tests/test_inventory_g14.gd` e `godot --headless --path godot --script res://tests/test_combat_g10.gd`.
5. Servir `/workspace/build/web` por HTTP local e rodar `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node godot/tools/capture_web_g18a.js http://127.0.0.1:PORT/index.html docs/reports/g18a`.
6. Fluxo automatizado de arquivo: `NODE_PATH=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules node godot/tests/test_web_save_flow_g18a.js http://127.0.0.1:PORT/index.html`.
7. Próxima etapa segura: avaliar derrota/retry Web emulado e as pendências narrativas/canônicas; não inferir conteúdo.

## Pendências conhecidas

- MAP_03 e MAP_09 continuam sem acesso canônico. MAIN_02/03 e MAIN_07/08, secundárias, Coruja-muda e Sineira mantêm os TBD documentados em G12–G16.
- G14: interface de mochila/equipamento/consumível e cura de Nilo implementadas; visual do equipamento no avatar pendente. Bram não oferece comércio pela fala canônica e preços continuam provisórios.
- G15 comum concluída: cinco habilidades e perfis comuns em paridade automatizada; Sineira/Coruja-muda continuam deferidas.
- G16/Arco 1 parcial: a fonte não confirma Sineira como boss final nem define confronto/epílogo.
- `node js/tests/run-tests.js` em G18A emitiu 362 aprovações antes de falhar em `js/tests/run-tests.js:501` pela ausência de asset. A auditoria atual lista 20 PNGs e 4 licenças Kenney em `docs/ASSETS_AUSENTES.md`.
- Chromium emulado completou ENC_05 com Lança e Golpe e voltou à exploração; derrota/retry, aparelho físico, revisão artística humana e publicação HTTPS não foram feitos.
# Continuidade após G18B

Branch ativa: `operation/g18b`, criada em `b07589d` (G18A). Checkpoint remoto inicial: branch `checkpoint/g18b-start` e tag `checkpoint-g18b-start-20261014`.

O combate agora executa as cinco habilidades comuns por `CombatEffectsG18B` no overlay G10, com IA comum determinística e fixtures partilhadas. Execute os comandos de regressão/export listados em `RELATORIO_G18B.md` antes de qualquer promoção. O fluxo Chromium touch completo ENC_05 → Lança/veneno → Golpe → vitória → retorno à exploração está evidenciado em `docs/reports/g18b/captures/`; derrota/retry em Web continua pendente.

ENC_01 e ENC_05 mantêm os gatilhos provisórios já existentes. ENC_02–ENC_12 podem ser montados tecnicamente a partir do catálogo para testes, mas não ganharam gatilhos. Recompensas/repetição indefinidas permanecem sem inferência. A Sineira e Coruja-muda estão fora da implementação comum até existir contrato canônico suficiente. Não promover a G15 como integralmente completa para esses contratos.

O JavaScript original continua bloqueado em `js/tests/run-tests.js:501` por assets Kenney ausentes (362 verificações passaram antes da falha). Não alterar o teste nem esconder a falta dos assets; consultar `ASSETS_AUSENTES.md`.

## Continuidade após G18C

- Branch de arte: `operation/g18c-art`, criada a partir do SHA G18B `6abb5fb0683a7287026b4413afc9e2c14590c755`.
- Checkpoint inicial remoto: `checkpoint/g18c-start` e tag `checkpoint-g18c-start-20261015`.
- Primeiro checkpoint de arte enviado: `2a43a797317029a3228fefde2eacf27a5f86d180` (`feat(art): integrate Caieira cottage and Cascudo idle`). Relatório, catálogo, matriz e continuidade G18C foram registrados em commit separado.
- Segundo lote de arte enviado: `1ee6343` (`feat(art): add Mira's directional idle sprite`), com integração e testes de diálogo/posição preservados.
- Metadados de importação do master da Mira estão no checkpoint `c436dc2`.
- Arte desta fatia: casa de Caieira (`VIS_HOUSE_SMALL`), idle do Cascudo (`CRE_CASCUDO_DE_CAL`) e idle da Mira (`NPC_MIRA`) integrados ao Godot. Capturas Web em `reports/g18c/captures/`; contact sheets de revisão em `godot/reviews/g18c/` e `reports/g18c/contact-sheets/`.
- Foram reexecutados os 17 testes `godot/tests/test_*.gd`, cinco scripts Python, sete scripts JavaScript auxiliares, verificações de registries, importação Godot e export Web. As 83 novas verificações estão em `godot/tests/test_assets_g18c.gd`; `test_iso_board.gd` valida pivôs/escalas por categoria.
- Chromium: a regressão ENC_05 G18B concluiu habilidade e retorno à exploração sem erros; `godot/tools/capture_combat_cascudo_g18c.js` abre/captura ENC_01 com o Cascudo original. Servir `build/web` em porta livre e passar URL/diretório a esses scripts. Teste Chromium emulado, sem alegação de teste físico.
- A suíte JS original continua falhando em `js/tests/run-tests.js:501` depois de 362 verificações por 20 PNGs/4 licenças ausentes; caminhos exatos em `MATRIZ_MIGRACAO_KENNEY.md`. Os 16 OGG/licenças de áudio foram preservados.
- Próximos lotes: sprites individuais de Lia/Nilo/Bram; muro/alvenaria de Caieira; depois as outras seis criaturas comuns como espécies diferentes, cenários regionais, especiais, efeitos e ícones. Migrar manifests JS só quando existirem correspondentes reais por ID.
- Não mesclado em `main`, sem publicação externa. Revisão artística e aprovação pelo proprietário continuam pendentes.
