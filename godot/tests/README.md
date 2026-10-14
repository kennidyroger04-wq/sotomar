# Testes headless

Na raiz do repositório, execute os testes de regressão e pacotes de arte:

```sh
godot --headless --path godot --script res://tests/test_iso_board.gd
godot --headless --path godot --script res://tests/test_art_pack_g03.gd
python3 godot/tests/test_art_pack_g04.py
godot --headless --path godot --script res://tests/test_combat_art_g05.gd
python3 godot/tests/test_art_pack_g05.py
godot --headless --path godot --script res://tests/test_characters_g06.gd
python3 godot/tests/test_art_pack_g06.py
godot --headless --path godot --script res://tests/test_web_mobile_g07.gd
godot --headless --path godot --script res://tests/test_npcs_g09.gd
python3 godot/tests/test_publish_g09.py
node tools/sync_godot_map_registry.js --check
godot --headless --path godot --script res://tests/test_maps_g08.gd
godot --headless --path godot --script res://tests/benchmark_map_sizes_g08.gd
godot --headless --path godot --script res://tests/test_combat_g10.gd
node godot/tests/test_combat_parity_g10.js
godot --headless --editor --path godot --quit
godot --headless --path godot --export-release Web "$PWD/build/web/index.html"
python3 godot/tests/test_web_export_g07.py
godot --headless --editor --path godot --quit
godot --headless --path godot res://scenes/combat_art_demo.tscn --quit-after 5
godot --headless --path godot res://scenes/character_select.tscn --quit-after 5
godot --headless --path godot res://scenes/main.tscn --quit-after 5
godot --headless --path godot res://scenes/character_compare_g06.tscn --quit-after 5
```

Para abrir o demo no Godot Desktop:

```sh
godot --path godot res://scenes/combat_art_demo.tscn
```

Ver [RELATORIO_G05.md](../../docs/RELATORIO_G05.md) para o resultado consolidado e [reviews/g05/README.md](../reviews/g05/README.md) para controles e pranchas.

Para G08, `node tools/sync_godot_map_registry.js` gera o catálogo Godot a partir dos mapas JavaScript originais MAP_01, MAP_02 e MAP_04; `--check` detecta divergências. O teste `test_maps_g08.gd` cobre dimensões variáveis, dados canônicos, posições dos NPCs, tiles, bloqueios, câmera e transições. O benchmark inclui 16×16, 24×20, 30×24 e 40×40 (somente estresse). Consulte [RELATORIO_G08.md](../../docs/RELATORIO_G08.md) e as capturas em `reports/g08/`.

Para G09, `test_npcs_g09.gd` confere as falas canônicas, alcance, toque/teclado, alinhamento dos pés e dimensões da caixa de diálogo. `test_publish_g09.py` e `validate_g09_web_export.py` verificam o deploy gated e o conteúdo real do diretório publicado. Veja [RELATORIO_G09.md](../../docs/RELATORIO_G09.md) e [ACESSO_WEB_G09.md](../../docs/ACESSO_WEB_G09.md).

Para G10, `test_combat_g10.gd` cobre regras, entrada em `ENC_01`, IA, retorno de vitória e nova tentativa após derrota. `test_combat_parity_g10.js` compara fixtures partilhadas com as regras e o planejador JavaScript originais. O combate está acessível na exploração de `MAP_02` pelo botão “Investigar Cascudo-de-cal” ou tocando a célula do marcador. Os valores de combate atuais de `CRE_CASCUDO_DE_CAL` continuam marcados como balanceamento provisório no runtime existente.

Para o lote G06, gere PNGs/manifesto com `python3 godot/tools/build_character_art_g06.py`, importe-os no editor e gere recursos `SpriteFrames` com `godot --headless --path godot --script res://tools/build_character_resources_g06.gd`. A revisão estática gera pranchas e GIFs com `python3 godot/tools/review_characters_g06.py`; consulte [RELATORIO_G06.md](../../docs/RELATORIO_G06.md) e [reviews/g06/review_index.json](../reviews/g06/review_index.json). As composições são ajudas de revisão, não capturas reais do renderer Godot.
