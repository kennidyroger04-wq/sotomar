# Catálogo G04 de assets

Este catálogo acrescenta IDs de referência estáveis para integração futura. Os IDs são nomes lógicos; não implica integração com gameplay.

## Tiles (23)

IDs em `tile.g03.<grupo>.<nome>`:

- **Terrain:** `tile.g03.terrain.grass_meadow`, `grass_clover`, `grass_fern`, `dirt_ochre`, `dirt_dappled`, `stone_moss`, `stone_lichen`, `water_clear`, `water_ripple`, `water_lily`.
- **Path:** `tile.g03.path.path_center`, `path_straight_ne_sw`, `path_straight_nw_se`, `path_bend`, `path_cross`.
- **Transition:** `tile.g03.transition.transition_grass_earth_edge_north`, `transition_grass_earth_edge_east`, `transition_grass_earth_edge_south`, `transition_grass_earth_edge_west`, `transition_grass_earth_diagonal`, `transition_grass_water_stones_a`, `transition_grass_water_stones_b`, `transition_earth_cliff_edge`.

Os sufixos após o prefixo são os nomes exatos do campo `name` em `godot/resources/art_pack_g03.json`. Referências PNG e master editável estão no mesmo manifesto, que continua sendo a origem dos dados do pacote.

## Props e personagem

| ID | Recurso | Tamanho / pivô |
|---|---|---|
| `prop.g03.tree_mosswood` | `res://assets/props/g03/tree_mosswood.png` | 256×288 / (128,280) |
| `prop.g03.rock_moss_stone` | `res://assets/props/g03/rock_moss_stone.png` | 256×288 / (128,280) |
| `character.g03.wayfarer_v1` | `res://assets/characters/wayfarer_v1/wayfarer_v1.png` | folha 1024×640; quadro 128×160 / (64,152) |

Animações: `character.g03.wayfarer_v1.<idle|walk>.<se|sw|nw|ne>`. Os quatro quadros de cada ação/direção e FPS constam em `godot/resources/animations/wayfarer_v1.tres` e `godot/resources/art_pack_g03.json`.

## Masters raster editáveis

| ID | Arquivo | Dimensão |
|---|---|---:|
| `source.g03.terrain_materials` | `art/source/generated_g03/terrain_materials_master.png` | 1619×971 |
| `source.g03.paths` | `art/source/generated_g03/paths_master.png` | 1536×1024 |
| `source.g03.transitions` | `art/source/generated_g03/transitions_master.png` | 1774×887 |
| `source.g03.props` | `art/source/generated_g03/props_master.png` | 1774×887 |
| `source.g03.wayfarer` | `art/source/generated_g03/wayfarer_character_master.png` | 1774×887 |

## Revisão e estado

As pranchas locais estão em `godot/reviews/g04/`; o resultado legível está em `docs/RELATORIO_G04.md`. Estado técnico: **APROVADO TECNICAMENTE** após testes de dimensões, transparência, pivôs, referências e recursos Godot. Estado artístico: **PENDENTE DE REVISÃO VISUAL** em renderização/loop no Godot. Nenhum asset foi aprovado como arte final.
