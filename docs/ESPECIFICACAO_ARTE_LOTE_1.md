# Sotomar/Fímbria — especificação do primeiro lote de arte 2D

Estado: **PENDENTE** de produção e aprovação visual. Este documento define o lote; os seis tiles técnicos atuais não são os assets definitivos.

## Direção

Fantasia 2D isométrica original, colorida e amigável, com silhuetas simples, volumes legíveis em escala de jogo, sombras consistentes e contornos seletivos. Pode usar convenções amplas de RPG tático estilizado, sem reproduzir personagens, motivos, paletas distintivas ou imagens de Dofus ou de qualquer outro jogo.

## Contrato comum

- Grade lógica: losango 64×32 px; pivô de cenário e personagem no centro da base que toca o chão.
- Tiles de terreno: PNG RGBA 128×80 px, origem editável SVG ou arquivo-fonte equivalente; face do losango 128×64 px e extrusão frontal de até 14 px.
- Escala de exibição do TileMapLayer: 0,5×. Uma alteração no tamanho da arte não muda coordenadas, colisão ou caminho lógico.
- Props: PNG RGBA com limites e origem documentados; manter margens transparentes e não aparar frames separadamente.
- Paleta comum com luz superior esquerda, sombras coerentes, contorno escuro de espessura visual próxima a 1 px no tamanho de exibição. Evitar linhas finas que desapareçam a 50%.
- Entregar PNG final, fonte, dimensões, origem/pivô, nome semântico, licença/procedência e miniatura de revisão. Spritesheets usam quadros uniformes e metadata de frame/origem.

## Entregas

| Grupo | Quantidade mínima | Especificação e critérios |
|---|---:|---|
| Grama | 3 tiles | Base limpa e duas variações de detalhe; bordas se encaixam sem costuras perceptíveis. |
| Terra | 2 tiles | Solo compacto, contraste legível contra grama e caminho; variação sem repetir padrão óbvio. |
| Pedra | 2 tiles | Piso rochoso modular e variante; escala de textura compatível com a grade. |
| Caminho | 5 tiles | Centro, horizontal/vertical isométricos, curva e entroncamento; peças encaixáveis. |
| Água | 3 tiles | Centro e duas variações de superfície; sem animação obrigatória no lote inicial. |
| Bordas/transições | 8 tiles | Bordas e cantos grama/terra, terra/água e borda de elevação; lados orientados e testados em mosaico. |
| Árvore | 1 prop | Silhueta amigável com copa e tronco separados visualmente; sombra na base; pivô no pé. |
| Rocha | 1 prop | Silhueta assimétrica, leitura clara sobre grama e caminho; sombra e pivô na base. |
| Personagem básico | 1 personagem | 4 orientações isométricas; idle e walk com ao menos 4 quadros por orientação; pivô nos pés. Ataque, dano e morte ficam para lote posterior. |

## Revisão de lote

1. Montar uma amostra 5×5 com cada encontro de bordas, sem correção manual na cena.
2. Conferir origem e sobreposição de props com células adjacentes e com o personagem.
3. Rever a 100% e na escala de jogo 50%, em fundo claro e escuro.
4. Registrar aprovações e correções em capturas; só então marcar o lote como **VALIDADO**.

## Organização prevista

```text
godot/art/source/tiles/terrain/{grass,dirt,stone,path,water,transitions}/
godot/art/source/props/{trees,rocks}/
godot/art/source/characters/{character_id}/
godot/assets/tiles/terrain/
godot/assets/props/{trees,rocks}/
godot/assets/characters/{character_id}/
godot/resources/atlases/
godot/resources/metadata/
```

Convenção: `grupo_material_variante_orientacao_estado_frame.ext`, em `snake_case`, por exemplo `character_villager_sw_walk_03.png`. Para quadros sem animação, omitir orientação/estado/frame.
