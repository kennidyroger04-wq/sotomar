# Contrato artístico 2D isométrico — protótipo Fímbria

Estado: **IMPLEMENTADO** para o conjunto técnico inicial; precisa de inspeção visual gráfica antes de aprovar arte final.

## Grade e dimensão

- Célula lógica e projeção gameplay: **64×32 px de viewport**, losango nominal **2:1**. O centro de `(x, y)` é `origin + ((x-y)×32, (x+y)×16)`. A grade pertence a `iso_board_logic.gd` e não é inferida de imagens.
- Textura: PNG RGBA **128×80 px**, com fonte SVG editável também em 128×80. Os `TileMapLayer` usam escala **0,5×**, então cada material ocupa uma célula de 64×32 no plano. Trocar arte não muda dimensões lógicas.
- Face superior tem pontos SVG `(64,0) (128,32) (64,64) (0,32)`: losango 2:1 que preenche exatamente o passo de 128×64 da grade do TileSet. A extrusão frontal ocupa a região abaixo da face e vai até y=78.
- O TileSet usa `tile_size=128×64`, forma isométrica, layout `DIAMOND_DOWN` e fontes individuais com regiões de 128×80 px.

## Pivô e alinhamento

- O centro da face superior (SVG `64,32`) coincide com o centro lógico da célula. Vizinhos isométricos avançam `(+64,+32)` e `(-64,+32)` no espaço da textura; os vértices compartilhados coincidem, sem fresta geométrica. A escala `(0.5,0.5)` reduz a face a 64×32 px.
- `TileData.texture_origin=(0,-8)` no espaço da textura aplica deslocamento vertical de 4 px após a escala e compensa a extensão inferior. A camada posiciona o centro da célula zero no mesmo `origin` da seleção, props e personagem.
- Props e personagens usam a célula como posição lógica; o ponto de apoio visual fica nos pés/base. A dimensão de um sprite pode exceder a célula sem alterar movimento ou colisão.

## Camadas e responsabilidade

| Nó | Conteúdo inicial | Regra |
|---|---|---|
| `TerrainTiles` | Grama, terra, água | Um material base por célula. Água não navegável também está no conjunto lógico de bloqueios. |
| `PathTiles` | Caminho de pedra | Sobrepõe o chão, sem alterar movimento ou custo. |
| `BorderTiles` | Pedra na borda do protótipo | Só visual; cliffs e transições futuras recebem IDs próprios. |
| `DecorationTiles` | Grama florida | Puramente visual; pivô na célula de origem. |
| `ObstacleTiles` | Base rochosa | Bloqueios continuam em dados lógicos; textura não determina colisão. |
| `GroundAndGrid` | Grade, seleção e marcas de bloqueio | Picking usa só dimensões lógicas. |
| `Scenery` / `Actors` | Árvore, rocha, arbustos e personagem | `z_index` deriva da posição lógica (`x+y`), não do tamanho do PNG. |

TileSet: `resources/tilesets/fimbria_ground.tres`. IDs estáveis nesta versão: 0 `terrain_grass_base`, 1 `terrain_dirt`, 2 `path_stone`, 3 `terrain_stone`, 4 `terrain_water`, 5 `terrain_grass_flowers`.

## Transparência, nomes e produção

- Exportar PNG RGBA e preservar transparência fora da silhueta. Manter as texturas no mesmo tamanho, centro e escala.
- Nomes semânticos em `snake_case`. Fontes SVG ficam em `art/source/tiles/isometric/`; PNGs exportados em `assets/tiles/terrain/`.
- Regenerar PNGs por `python3 godot/tools/generate_tiles.py` (requer Inkscape). Conferir dimensões e alpha após exportação.
- Este protótipo usa seis texturas separadas. Se virarem spritesheet, cada quadro mantém a região 128×80, ordem declarada por ID, margem transparente de pelo menos 2 px e metadata de retângulo/origem. Não aparar quadros individualmente; preservar extrusão e pivô.
- Cores vivas, contornos legíveis e fantasia estilizada são direções gerais para criação própria. Não copiar nem extrair material de Dofus ou de outros jogos.

## Arte definitiva que falta produzir

- Variações conectáveis de grama, terra, pedra e caminhos com bordas/cantos.
- Água central, bordas, cantos e transições terra/água; cliffs, elevações e sombras compatíveis com movimentação.
- Props originais por tamanho/biome: árvores em silhuetas variadas, rochas pequenas/grandes, vegetação, pontes, edifícios e sinais.
- Personagens e criaturas com 4 orientações, pivô nos pés e animações idle/walk/attack/hurt/death.
- Sombras e efeitos de ação em spritesheets com duração/origem por frame; ícones e elementos de UI.
- Fontes editáveis, paletas por biome, metadata e procedência/licença de cada lote.

Especificação do primeiro lote definitivo: [`../../docs/ESPECIFICACAO_ARTE_LOTE_1.md`](../../docs/ESPECIFICACAO_ARTE_LOTE_1.md). A arte técnica deste protótipo não conta como arte definitiva.

O pacote ilustrado G03 está isolado em `scenes/art_demo.tscn`, com masters raster editáveis em `art/source/generated_g03/` e PNGs derivados em `assets/`. É um protótipo artístico original; a arte não é considerada final até inspeção de capturas gráficas. O contrato da cena principal e as coordenadas lógicas existentes não mudaram.

O conceito técnico anterior permanece em `art/source/tiles/isometric/concept_tile_sheet.png`. Os tiles técnicos provisórios do TileSet principal continuam separados do lote G03.
