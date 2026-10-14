# Catálogo de personagens G06

## IDs e regras

- `character.warrior_male.g06` — protagonista masculino original, recurso `res://resources/characters/warrior_male_g06.tres`.
- `character.wayfarer.g05` — Guerreira Wayfarer preservada, recurso `res://resources/combat/wayfarer_combat_g05.tres`.
- Os dois IDs usam o mesmo conjunto de regras/atributos registrado no catálogo Godot; a identidade selecionada altera a apresentação e os recursos de equipamento.
- Saqueador Musgoso continua disponível em `character.moss_raider.g05` para a comparação visual.

## Animações do guerreiro

Sete spritesheets originais (`idle`, `walk`, `attack`, `hurt`, `defend`, `cast`, `death`), cada um com 4 orientações (`ne`, `se`, `sw`, `nw`) e 4 quadros por orientação. Total: 112 quadros, cada um em canvas RGBA 128×160, com linha de base dos pés em y=152 e pivô documentado em `(64,152)`.

| Ação | FPS | Loop | Evento visual |
|---|---:|---|---|
| idle | 4 | sim | — |
| walk | 8 | sim | — |
| attack | 6 | não | impacto no quadro 2 |
| hurt | 6 | não | dano recebido no quadro 1 |
| defend | 5 | não | bloqueio no quadro 2 |
| cast | 6 | não | liberação no quadro 2 |
| death | 4 | não | derrota no quadro 3 |

IDs e retângulos ficam em [`godot/resources/characters/warrior_male_g06.json`](../godot/resources/characters/warrior_male_g06.json). Os marcadores são metadados visuais, não aplicam regras de combate.

## Equipamentos e camadas

| Slot | Recurso | PNG |
|---|---|---|
| weapon / espada básica | `res://resources/characters/warrior_male_equipment_g06.tres` | `res://assets/equipment/g06/warrior_male_sword.png` |
| shield / broquel básico | mesmo recurso | `res://assets/equipment/g06/warrior_male_shield.png` |

Cada imagem contém quatro quadros 128×160, um para cada orientação. Os overlays usam o nó de transformação do personagem, acompanham direção, e seguem o híbrido G05: visíveis em idle/walk quando ativados; ocultos nas ações cujas poses já contêm os itens. Começam desligados no protótipo para evitar duplicar a espada/escudo já ilustrados nas folhas do guerreiro. Os slots `helmet` e `armor` estão documentados para expansão, sem recursos produzidos nesta missão.

## Fontes e regeneração

- Masters editáveis: `godot/art/source/generated_g06/male_warrior_{idle,walk,attack,hurt,defend,cast,death}_master.png` e `male_equipment_master.png`.
- `male_warrior_atlas_master.png` é uma prancha conceitual anterior e não alimenta os spritesheets finais.
- Gerar PNGs/JSON: `python3 godot/tools/build_character_art_g06.py`.
- Gerar `SpriteFrames`: após importar os recursos pelo editor, executar `godot --headless --path godot --script res://tools/build_character_resources_g06.gd`.
- Gerar pranchas e GIFs: `python3 godot/tools/review_characters_g06.py`.
- Imagens estáticas de revisão e GIFs ficam em `godot/reviews/g06/`. São composições de revisão, não capturas do renderer Godot.

## Seleção e extensão

`CharacterRoster` mantém o catálogo de personagens e lê/grava `user://character_selection.cfg`. Um ID é salvo, o que mantém a persistência compatível com a inclusão de novas identidades. A tela de entrada oferece Guerreiro e Wayfarer; ambos apontam para o mesmo conjunto de atributos.
