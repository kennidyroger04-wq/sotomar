# Biblioteca e pipeline artístico 2D

Estado: **PLANEJADO**. Os assets do ZIP não estão disponíveis neste checkout; esta estrutura é uma proposta para assets recuperados e arte original nova.

```text
art/
  source/                 # originais editáveis: .kra, .aseprite, .psd, referências licenciadas
  exports/                # PNG exportado e revisado
  palettes/               # paletas e amostras de cor
assets/
  tiles/terrain/<set>/    # losangos base, caminhos, água, variações
  tiles/edges/<set>/      # bordas, cantos, transições e máscaras
  props/<biome>/<name>/   # árvores, rochas, pontes, edifícios em peças
  characters/<id>/        # spritesheets por personagem e metadata
  creatures/<id>/
  effects/<id>/            # impactos, projéteis, estados
  ui/<group>/
  audio/<group>/
  licenses/<source>/       # texto original da licença e procedência
resources/
  tilesets/<biome>/        # TileSet/TileMapLayer resources
  animation_sets/<id>/     # SpriteFrames e metadata
scenes/
  world/ actors/ combat/ ui/
```

## Contrato de produção

- Tiles modulares usam grade e losango consistentes; terreno, borda, elevação, decoração e colisão são camadas distintas. Reutilizar peças e variações por biome em vários mapas.
- Registrar por recurso: ID estável, caminho, dimensões em pixels, tamanho lógico em células, ponto de apoio/origem, pivô, colisão, direção, animações, licença e hash. Não codificar caminho de arquivo diretamente em regra de jogo.
- Personagens começam com quatro orientações isométricas (NE, SE, SW, NW); adicionar oito direções apenas se o jogo e a arte precisarem. Convenção de frames por ação: `idle`, `walk`, `attack`, `hurt` e `death`, com duração e origem alinhadas por frame.
- Guardar fontes editáveis separadas de exportações. Exportações em PNG/spritesheets devem ter nomes semânticos e metadados que preservem retângulos de atlas, pivôs e duração. Evitar dependência do nome automático `tile_####` para novos recursos.
- No Godot, mapear animações para `SpriteFrames`/`AnimatedSprite2D` e tiles para `TileSet`/`TileMapLayer`; dados visuais não controlam as regras ou a posição lógica.
- Fazer preview de atlas e cenas de escala em cada mudança de lote. Verificar margens, transparência, pivô, leitura de silhueta, pixel bleeding, escala nativa e ampliação. Revisar em movimento e em mapa com camadas de profundidade.
- Substituir placeholders por ID de recurso mantendo interfaces estáveis. Validar uma região e seus casos antes de expandir para mapas seguintes.
- Manter uma ficha de origem/licença por pacote e por criação. Nenhuma licença ausente deve ser presumida como recuperada.

## Fluxo inspirado na Vila do Marco

Produzir um pequeno conjunto modular, validar visualmente a cena e corrigir escala/alinhamento, então expandir por biome e reutilizar componentes. Aplicar isso às cenas isométricas 2D de Fímbria sem iniciar uma migração completa. Referências estéticas são gerais; personagens, cenários, paletas finais e spritesheets devem ser originais.
