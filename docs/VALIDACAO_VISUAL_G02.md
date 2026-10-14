# Missão G02 — validação visual e fundação artística

## Estado

- **IMPLEMENTADO:** cinco `TileMapLayer` para terreno, caminhos, bordas, decoração e obstáculos em `resources/tilesets/fimbria_ground.tres`.
- **IMPLEMENTADO:** seis materiais originais: grama, terra, caminho de pedra, pedra, água e grama florida. Cada um tem fonte SVG editável e PNG RGBA de 128×80 px.
- **VALIDADO:** Godot 4.6.3 carrega o atlas; a cena popula 100 células de terreno, 6 de caminho, 36 de borda, 4 de decoração e 6 bloqueios.
- **PENDENTE:** inspeção gráfica da cena e capturas em 1280×720 e 1920×1080.

## Captura e limitação

O container não tem `DISPLAY`, `WAYLAND_DISPLAY`, `Xvfb` ou `xvfb-run`. Tentei o Movie Maker do Godot 4.6.3 com renderer headless/dummy tanto com `--resolution 1280x720` como `--resolution 1920x1080`. Em ambas as tentativas, o Movie Maker reportou a viewport interna fixa de 960×640; o renderer deu `texture_2d_get` com textura nula e caiu com sinal 11 (a execução 1920 terminou com código 134), antes de salvar uma captura válida. Não consegui gerar as capturas pedidas; não atribuo aprovação visual ao enquadramento, profundidade, seleção ou legibilidade.

Inspecionei os seis PNGs individualmente e conferi dimensão 128×80, canal alpha/transparência e alinhamento vetorial. Isso valida os arquivos de tile, mas não a composição da cena. A validação gráfica requer abrir o projeto num desktop Godot ou ambiente com servidor gráfico e capturar ambas as resoluções.

## Testes e regressões

Os onze checks de G01 continuam no script. A suíte expandida executa **17 verificações**, incluindo picking após escala, independência da grade em relação ao PNG 2×, integridade/alpha/pivô dos seis tiles, posição de todos os props, alinhamento dos centros das cinco TileMapLayers e conteúdo de cada camada.

Com Godot 4.6.3:

```sh
godot --headless --editor --path godot --quit
godot --headless --path godot --script res://tests/test_iso_board.gd
godot --headless --path godot --quit-after 5
```

**TESTADO:** 17 verificações passaram; importação e inicialização por cinco frames terminaram com código 0, sem erros de script ou textura.

## Próxima validação visual

No desktop, abra `godot/project.godot`, capture a cena nas resoluções alvo e confira escala do losango, costuras, textura/contorno, enquadramento, z-order ao atravessar props, contraste de bloqueios e clareza do destaque. O contrato artístico está em [`../godot/art/ART_CONTRACT.md`](../godot/art/ART_CONTRACT.md). Nenhuma arte final nem sistema de combate foi iniciado.
