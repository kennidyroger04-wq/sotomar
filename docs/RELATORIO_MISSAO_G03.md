# Missão G03 — primeiro pacote artístico 2D isométrico

## Resumo e status

- **IMPLEMENTADO:** pacote isolado de terreno, props e personagem em `godot/scenes/art_demo.tscn`. `scenes/main.tscn`, lógica da grade e jogo JavaScript não foram alterados.
- **IMPLEMENTADO:** 23 tiles, árvore, rocha, spritesheet de 32 quadros, metadados e TileSet/SpriteFrames próprios da demonstração.
- **TESTADO:** os 20 testes G02B continuam aprovados; oito verificações novas do pacote G03 também passaram no Godot 4.6.3 headless.
- **VALIDADO:** dimensões, alpha, referências de recursos, tamanho e organização dos frames, pivôs declarados, alinhamento de TileMapLayer, profundidade lógica e composição estrutural da cena.
- **PENDENTE:** capturas e inspeção gráfica local. Não aprovo a arte como final nem alego que as transições estejam visualmente sem costuras antes dessa inspeção.
- **PENDENTE:** revisão/ajuste artístico e direção final do lote. Os PNGs são ilustrações originais de protótipo, não assets finais aprovados.

## Qualidade técnica

| Grupo | Arquivos e contrato | Verificação |
|---|---|---|
| Terreno | 3 gramas, 2 terras, 2 pedras, 3 águas | PNG RGBA 128×80; `TileData.texture_origin=(0,-8)`; TileSet conserva passo lógico 128×64 e escala 0,5. |
| Caminho | centro, duas retas, curva e cruzamento (5 peças) | Mesmo tamanho e origem. A cena coloca seis instâncias numa cadeia/ramal lógico. A inspeção raster das junções segue pendente. |
| Bordas/transições | 5 terra/grama, 2 margem d'água, 1 barranco | PNG RGBA 128×80; camada separada dos materiais-base. |
| Props | 1 árvore e 1 afloramento rochoso | PNG RGBA 256×288; pivô na base `(128,280)`; sombra pintada incluída. |
| Personagem | spritesheet 8×4; frames 128×160 | 32 quadros transparentes, pivô nos pés `(64,152)`, quatro orientações, quatro quadros idle e quatro walk por direção; SpriteFrames a 4 fps idle e 8 fps walk. |
| TileSet | `fimbria_art_demo.tres` | 23 fontes separadas; forma isométrica; origem e passo preservam o contrato G02B. |
| Cena | `scenes/art_demo.tscn` | Mapa 10×10, camadas de terreno/caminho/transições, props e animação. Executável separadamente com F6. |

Os masters originais são folhas raster editáveis em `godot/art/source/generated_g03/`; o script `godot/tools/build_art_pack.py` exporta recortes determinísticos e preenche `godot/resources/art_pack_g03.json`. Como a ilustração é pintura raster, não criei versões SVG falsas. A exportação normaliza os recortes às dimensões do contrato, então é necessária revisão visual para detectar qualquer deformação ou recorte indesejado. A procedência é arte original criada para este pacote; nenhum recurso oficial de Dofus foi usado.

## Qualidade artística

**PENDENTE de validação.** As folhas individuais apresentam terreno ilustrado colorido, props e um personagem com roupa consistente. A montagem completa não pôde ser vista neste Cloud porque ele não dispõe de display/servidor gráfico. Ainda precisam ser julgados em desktop: escala e enquadramento, contornos a 50%, costuras de tiles, conexões de caminho, oclusão entre props/personagem e leitura do personagem nas quatro direções. O pacote deve ser tratado como protótipo de produção até essa revisão; não como arte final.

## Testes executados

Com Godot 4.6.3:

```sh
python3 godot/tools/build_art_pack.py
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tools/build_art_demo_resources.gd
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tests/test_iso_board.gd
godot --headless --path godot --script res://tests/test_art_pack_g03.gd
godot --headless --path godot --script res://tools/capture_art_demo.gd -- --validate-only --output-dir /tmp/sotomar-g03-captures
godot --headless --path godot --quit-after 5
```

**TESTADO:** os 20 checks anteriores passaram e os 8 novos passaram. A pré-verificação do roteiro de captura confirmou a cena, as 23 fontes, os SpriteFrames e o manifesto. A inicialização da cena e do projeto terminou sem erros headless. Isso valida a integração e a estrutura técnica, mas não substitui teste visual.

## Capturas no Windows

No PowerShell, a partir da raiz do checkout, use Godot Desktop 4.x:

```powershell
& "C:\Godot\Godot_v4.6.3-stable_win64_console.exe" --path godot --script res://tools/capture_art_demo.gd -- --output-dir captures/g03
```

O roteiro grava `godot/captures/g03/fimbria_g03_1280x720.png`, `fimbria_g03_1920x1080.png` e `capture_log.txt`. O output pode ser validado sem captura gráfica com `--headless` e `--validate-only`. Abra `scenes/art_demo.tscn` com F6 para navegar/animar visualmente sem tocar na cena principal.

## Próximos passos

1. Rodar o roteiro num desktop e revisar as duas imagens em escala de 100% e 50%.
2. Corrigir costuras, alinhamento, pivôs ou escala comprovadamente inadequados e repetir os checks.
3. Revisar idle/walk frame a frame e a identidade do personagem nas quatro orientações.
4. Só após aprovação visual, classificar os recursos aprovados como arte de produção; conservar a cena principal e suas regras intactas.
