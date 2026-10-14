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
node godot/tests/test_encounter_catalog_g11.js
godot --headless --path godot --script res://tests/test_encounters_g11.gd
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

Para G11, execute `node tools/build_godot_encounter_catalog.js --check`, `node godot/tests/test_encounter_catalog_g11.js` e `godot --headless --path godot --script res://tests/test_encounters_g11.gd`. O catálogo deriva os 12 encontros JavaScript e deixa explícitas as lacunas de ativação, repetição e recompensas; somente `ENC_01` e `ENC_05` têm gatilhos de exploração provisórios nas células reservadas dos mapas Godot já disponíveis. Os testes sintéticos multi-inimigo não acrescentam conteúdo canônico.

Para o lote G06, gere PNGs/manifesto com `python3 godot/tools/build_character_art_g06.py`, importe-os no editor e gere recursos `SpriteFrames` com `godot --headless --path godot --script res://tools/build_character_resources_g06.gd`. A revisão estática gera pranchas e GIFs com `python3 godot/tools/review_characters_g06.py`; consulte [RELATORIO_G06.md](../../docs/RELATORIO_G06.md) e [reviews/g06/review_index.json](../reviews/g06/review_index.json). As composições são ajudas de revisão, não capturas reais do renderer Godot.

Para G12, execute `node godot/tests/test_maps_g12.js` e `godot --headless --path godot --script res://tests/test_maps_g12.gd`. O primeiro verifica paridade, bloqueios, portais, rotas e flags; o segundo renderiza todos os onze layouts pela cena principal. MAP_03/MAP_09 não recebem portais sem origem canônica. Consulte [RELATORIO_G12.md](../../docs/RELATORIO_G12.md).

Para G13, gere/verifique os dados com `node tools/build_godot_quest_registry.js --check` e execute `godot --headless --path godot --script res://tests/test_quests_g13.gd`. O estado ainda é de sessão; recompensas e save são posteriores. Consulte [RELATORIO_G13.md](../../docs/RELATORIO_G13.md).

Para G13/G14, execute `node tools/build_godot_inspection_registry_g13.js --check`, `node godot/tests/test_inspections_g13.js`, `node tools/build_godot_item_registry_g14.js --check`, `godot --headless --path godot --script res://tests/test_inspections_g13.gd` e `godot --headless --path godot --script res://tests/test_inventory_g14.gd`. O inventário e o histórico de transações ainda são apenas de sessão; preços seguem marcados provisórios. Consulte `docs/RELATORIO_G13.md` e `docs/RELATORIO_G14.md`.

Para G15, execute `node tools/build_godot_ability_registry_g15.js --check`, `node godot/tests/test_abilities_g15.js`, `node godot/tests/test_encounter_catalog_g11.js` e `godot --headless --path godot --script res://tests/test_combat_g10.gd`. A paridade das definições não significa que os efeitos ainda pendentes estejam habilitados. Consulte `docs/RELATORIO_G15.md`.

Para G16, execute `node tools/build_godot_boss_registry_g16.js --check`, `node godot/tests/test_boss_g16.js` e `godot --headless --path godot --script res://tests/test_quests_g13.gd`. O teste confere contrato não letal; não há luta da Sineira ativa enquanto mecânicas canônicas faltarem. Consulte `docs/RELATORIO_G16.md`.

Para G17, execute `godot --headless --path godot --script res://tests/test_saves_g17.gd`. A API de save usa `user://` e o modo headless desativa a escrita automática do controlador para isolar os testes. Confira também `docs/RELATORIO_G17.md`.
