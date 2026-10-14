# Relatório G17 — save versionado e continuidade local

## Estado

- **IMPLEMENTADO:** `SaveStateG17` grava JSON schema v1 em dois slots alternados sob `user://`, com geração e SHA-256 canonicalizado. A leitura seleciona a geração válida mais recente; escrita inválida não substitui o save anterior. Dado inválido/corrompido é preservado em backup quando não resta slot válido.
- **IMPLEMENTADO:** snapshot contém protagonista, mapa/célula, HP, atributos, inventário, equipamento, progresso/flags/objetivos/event IDs, encontros, XP/moeda, IDs de recompensa já aplicada e bit de conclusão do arco (permanece falso sem fonte canônica). A migração mantém o protagonista já selecionado pelo `CharacterRoster`.
- **IMPLEMENTADO:** exploração carrega e grava automaticamente no modo desktop/Web, após entrada em mapa, movimento, conversa, aceite, coleta/inspeção e vitória. O modo headless não escreve save durante os testes; o estado também é restaurável por APIs de cada domínio.
- **IMPLEMENTADO:** importação de JSON portátil via API de domínio, validação de IDs/mapa/célula/quantidades/slots/HP e migração do Save V2 JavaScript, com cópia do JSON antigo antes de aplicar.
- **TESTADO:** testes cobrem novo jogo, duas gerações, recarga, movimento/localização, inventário, JSON portátil, JSON inválido, posição inválida, migração JS V2, cópia de backup e recuperação quando o slot mais novo está corrompido. Teste G13 cobre restauração da progressão/deduplicação.

## Limitações

- Exportar/importar é suportado no nível de JSON; a interface ainda não oferece botão de baixar/selecionar arquivo no navegador.
- **VALIDADO:** export Web reconstruído; Chromium mobile carregou a cena e, após reload, voltou à exploração sem erros de console. O IndexedDB `/userfs` contém `sotomar_save_b.json`. Captura após reload em `docs/reports/g17/web_mobile_after_reload.png`. Essa validação técnica não aprova visual ou usabilidade.
- Estados de equipamento e progressão estão no save, mas ainda não existe interface de equipamento ou alocação de pontos. Dados de combate de boss e conclusão do arco não são inventados.
- Protagonista existente `CharacterRoster` continua sendo fonte de escolha e é restaurado pelo ID salvo; os dois IDs são validados.

## Testes

- `godot --headless --path godot --script res://tests/test_saves_g17.gd` — testes de arquivo via diretório `user://` temporário.
- `godot --headless --path godot --script res://tests/test_quests_g13.gd` — snapshot de quest e deduplicação.
- `godot --headless --editor --path godot --quit` — importação de scripts.
- `godot --headless --path godot --export-release Web "$PWD/build/web/index.html"` e `python3 godot/tests/test_web_export_g07.py` — export atual e três verificações de WASM/PCK/template.
- Chromium mobile 390×844 — carregou a seleção, entrou em MAP_01, gravou arquivo em IndexedDB e recarregou para a exploração sem erro de console.

G17 está implementada e a persistência Web tem smoke test técnico; permanece **PARCIAL** porque import/export de arquivo ainda não tem controles visuais no jogo.
