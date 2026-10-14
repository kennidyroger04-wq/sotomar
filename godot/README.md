# Sotomar/Fímbria — protótipo Godot 4

Protótipo jogável 2D isométrico em Godot 4.6.3/GDScript. Mantém a grade, regras de movimento e TileMapLayers originais, agora com seleção entre o guerreiro e a Wayfarer. As fontes artísticas G03–G06 são originais; não usam recursos oficiais de Dofus.

## Abrir e jogar

1. Instale Godot 4.x no computador.
2. No Project Manager, escolha **Import** e selecione `godot/project.godot` (ou abra esse arquivo diretamente no editor).
3. Execute o projeto com **F5**; a seleção abre primeiro e recupera a opção local anterior. Use os botões dos cartões, ←/→ ou A/D para escolher e Enter/Espaço para entrar.
4. Clique numa célula para destacá-la; botão direito para caminhar até ela. As setas ou WASD movem uma célula. Obstáculos aparecem com um X e não podem ser atravessados.
5. Para a comparação, abra `scenes/character_compare_g06.tscn` e execute a cena atual com **F6**. Setas alternam direção, teclas 1–7 alternam ações e G inspeciona overlays de equipamentos.

## Verificações e geração de tiles

Na raiz do repositório:

```sh
python3 godot/tools/generate_tiles.py
# Requer Inkscape; reexporta PNGs 128x80 das fontes SVG editáveis.
godot --headless --path godot --script res://tools/build_terrain_tileset.gd
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tests/test_iso_board.gd
godot --headless --path godot --quit-after 5
```

A suíte de 20 checks cobre projeção, seleção/escalonamento, movimento determinístico, bloqueios, profundidade, integridade e contato geométrico dos tiles, redimensionamento da janela e alinhamento/conteúdo dos `TileMapLayer`. Headless valida carga e lógica, não aprova aparência gráfica.

O pacote G06 tem 112 quadros masculinos em sete folhas 512×640, recursos `SpriteFrames`, equipamento direcional, persistência por ID, seleção inicial e uma cena comparativa. Leia [RELATORIO_G06.md](../docs/RELATORIO_G06.md) e [CATALOGO_ASSETS_G06.md](../docs/CATALOGO_ASSETS_G06.md). Os recursos Wayfarer G03/G05 permanecem nos mesmos caminhos.

O lote G03 mantém 23 tiles, uma árvore, uma rocha e o spritesheet do personagem em `assets/`. Os masters raster estão em `art/source/generated_g03/`; execute `python3 godot/tools/build_art_pack.py` para recortar/exportar as imagens e `godot --headless --editor --path godot --quit` para importá-las. Regenere `resources/tilesets/fimbria_art_demo.tres` e `resources/animations/wayfarer_v1.tres` com `godot --headless --path godot --script res://tools/build_art_demo_resources.gd`.

Valide G03 com `godot --headless --path godot --script res://tests/test_art_pack_g03.gd`. A revisão visual local tem roteiro próprio: `godot --path godot --script res://tools/capture_art_demo.gd -- --output-dir captures/g03`. Não marque arte final como aprovada sem conferir as capturas.

## Capturas visuais locais

No Windows, com Godot Desktop 4.x instalado, rode no PowerShell a partir da raiz do repositório (substitua o executável pelo caminho local):

```powershell
& "C:\Godot\Godot_v4.6.3-stable_win64_console.exe" --path godot --script res://tools/capture_visual.gd -- --output-dir captures/g02b
```

O script abre a cena no desktop, seleciona `(4, 2)`, exibe legenda, captura PNG em 1280×720 e 1920×1080 e escreve `capture_log.txt` e as imagens em `godot/captures/g02b/`. O console registra erros de runtime; o log contém as verificações de recursos e gravação. Para apenas testar carregamento de recursos em modo headless, acrescente `--validate-only`; essa opção não produz capturas.

O contrato geométrico/artístico está em [`art/ART_CONTRACT.md`](art/ART_CONTRACT.md) e a especificação do primeiro lote em [`../docs/ESPECIFICACAO_ARTE_LOTE_1.md`](../docs/ESPECIFICACAO_ARTE_LOTE_1.md). Headless valida carga e lógica, não aprova aparência gráfica.
