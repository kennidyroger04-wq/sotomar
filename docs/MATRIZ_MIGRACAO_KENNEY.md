# Matriz de migração Kenney — auditoria G18C

Revalidação de `js/data/visual-assets.js`, `js/data/character-assets.js`, `js/data/audio-assets.js`, loaders JavaScript, fontes Godot e arquivos reais em 2026-10-15. Os 20 PNGs e 4 licenças referenciados continuam ausentes. O registro abaixo trata caminhos declarados como falta no checkout; não prova falta no ZIP original.

**Leitura de execução:** a exportação Godot Web usa assets locais de `godot/` e não carrega esses pacotes Kenney. O front-end JavaScript legado ainda conserva os manifests sem arquivo, e a suíte original os exige; portanto a migração global ainda não está concluída.

| ID semântico | Referência original declarada | Entidade/categoria | Fonte declarada | Usado no Godot | Usado no JS legado | Arquivo encontrado | Substituto original disponível no Godot | Estado G18C |
|---|---|---|---|---|---|---|---|---|
| `VIS_GRASS_BASE` | `assets/vendor/kenney/sketch-town/Tiles/grass_center_E.png` | Terreno/grama | Kenney Sketch Town | Não | Sim, manifesto | **Ausente** | `godot/assets/tiles/terrain/g03/grass_meadow.png`; não atualizado no manifest JS | PENDENTE migração JS |
| `VIS_DIRT_BASE` | `assets/vendor/kenney/sketch-town/Tiles/dirt_center_E.png` | Terreno/terra | Kenney Sketch Town | Não | Sim | **Ausente** | `godot/assets/tiles/terrain/g03/dirt_ochre.png` | PENDENTE migração JS |
| `VIS_DIRT_PATH` | `assets/vendor/kenney/sketch-town/Tiles/grass_path_E.png` | Caminho | Kenney Sketch Town | Não | Sim | **Ausente** | `godot/assets/tiles/terrain/g03/path_center.png` e peças de curva/linha/cruz | PENDENTE migração JS |
| `VIS_WATER` | `assets/vendor/kenney/sketch-town/Tiles/water_center_E.png` | Água | Kenney Sketch Town | Não | Sim | **Ausente** | `godot/assets/tiles/terrain/g03/water_clear.png`, `water_ripple.png`, `water_lily.png` | PENDENTE migração JS |
| `VIS_WATER_EDGE` | `assets/vendor/kenney/isometric-landscape/PNG/landscapeTiles_043.png` | Borda de água | Kenney Isometric Landscape | Não | Sim | **Ausente** | `transition_grass_water_stones_a.png`/`b.png` | PENDENTE migração JS |
| `VIS_TREE_SMALL` | `assets/vendor/kenney/sketch-town/Tiles/tree_single_E.png` | Árvore | Kenney Sketch Town | Não | Sim | **Ausente** | `godot/assets/props/g03/tree_mosswood.png` | Godot já usa arte original; JS pendente |
| `VIS_ROCKS_GRASS` | `assets/vendor/kenney/sketch-town/Tiles/rocks_grass_E.png` | Rocha/prop | Kenney Sketch Town | Não | Sim | **Ausente** | `godot/assets/props/g03/rock_moss_stone.png` | Godot já usa arte original; JS pendente |
| `VIS_HOUSE_SMALL` | `assets/vendor/kenney/sketch-town/Tiles/building_centerBeige_E.png` | Casa | Kenney Sketch Town | Não | Sim | **Ausente** | `godot/assets/props/g18c/caieira_lime_cottage.png` | Godot integrado; JS pendente |
| `VIS_BRIDGE` | `assets/vendor/kenney/sketch-town/Tiles/bridge_E.png` | Ponte | Kenney Sketch Town | Não | Sim | **Ausente** | Nenhum PNG de ponte original pronto identificado | PENDENTE produção |
| `VIS_LOW_WALL` | `assets/vendor/kenney/sketch-town/Tiles/castle_wall_E.png` | Muro | Kenney Sketch Town | Não | Sim | **Ausente** | Nenhum asset original modular de muro pronto | PENDENTE produção |
| `VIS_MASONRY_STRUCTURE` | `assets/vendor/kenney/isometric-buildings/PNG/buildingTiles_032.png` | Alvenaria/estrutura | Kenney Isometric Buildings | Não | Sim | **Ausente** | Nenhum asset original de ruína/alvenaria modular pronto | PENDENTE produção |
| `VIS_CHAR_PLAYER` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0087.png` | Protagonista | Kenney Tiny Dungeon | Não | Sim, legado | **Ausente** | Wayfarer G03/G05 e guerreiros G06 existem no Godot; manifest JS não migrado | PENDENTE migração JS |
| `VIS_NPC_MIRA` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0084.png` | Mira | Kenney Tiny Dungeon | Não | Sim | **Ausente** | Nenhum sprite individual de NPC | PENDENTE produção |
| `VIS_NPC_LIA` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0099.png` | Lia | Kenney Tiny Dungeon | Não | Sim | **Ausente** | Nenhum sprite individual de NPC | PENDENTE produção |
| `VIS_NPC_NILO` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0088.png` | Nilo | Kenney Tiny Dungeon | Não | Sim | **Ausente** | Nenhum sprite individual de NPC | PENDENTE produção |
| `VIS_NPC_BRAM` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0100.png` | Bram | Kenney Tiny Dungeon | Não | Sim | **Ausente** | Nenhum sprite individual de NPC | PENDENTE produção |
| `VIS_CRE_CASCUDO` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0108.png` | Cascudo-de-cal | Kenney Tiny Dungeon | Não | Sim | **Ausente** | `godot/assets/characters/cascudo_g18c/cascudo_de_cal_idle.png` | G18C Godot integrado; manifest JS pendente |
| `VIS_CRE_PAPA_MEL` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0110.png` | Papa-mel | Kenney Tiny Dungeon | Não | Sim | **Ausente** | Nenhum asset canônico próprio | PENDENTE produção |
| `VIS_CRE_TOPETAO` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0120.png` | Topetão | Kenney Tiny Dungeon | Não | Sim | **Ausente** | Nenhum asset canônico próprio | PENDENTE produção |
| `VIS_CRE_FIANDEIRA` | `assets/vendor/kenney/tiny-dungeon/Tiles/tile_0123.png` | Fiandeira | Kenney Tiny Dungeon | Não | Sim | **Ausente** | Nenhum asset canônico próprio | PENDENTE produção |
| `License.txt` Sketch Town | `assets/vendor/kenney/sketch-town/License.txt` | Licença | Kenney | Não | Declarada por manifest | **Ausente** | Não se aplica a arte original G03/G18C | PENDENTE; não fabricar cópia |
| `License.txt` Isometric Landscape | `assets/vendor/kenney/isometric-landscape/License.txt` | Licença | Kenney | Não | Declarada por manifest | **Ausente** | Não se aplica a arte original G03/G18C | PENDENTE; não fabricar cópia |
| `License.txt` Isometric Buildings | `assets/vendor/kenney/isometric-buildings/License.txt` | Licença | Kenney | Não | Declarada por manifest | **Ausente** | Não se aplica a arte original G03/G18C | PENDENTE; não fabricar cópia |
| `License.txt` Tiny Dungeon | `assets/vendor/kenney/tiny-dungeon/License.txt` | Licença | Kenney | Não | Declarada por manifest | **Ausente** | Não se aplica a arte original G03/G18C | PENDENTE; não fabricar cópia |

## Itens não-Kenney

- Foram recontados **16 arquivos OGG** em `audio/kenney/rpg/` e `audio/kenney/ui/`; as duas licenças de áudio referidas pelo manifesto existem. Não foram movidos nem substituídos nesta missão.
- Os assets originais G03/G05/G06 e o G18C não dependem de licenças Kenney. Os masters G18C têm metadados de procedência própria.
- Não foi criado arquivo vazio nem copiada licença para suprimir verificação.

## Impacto nos testes

- Regressões Godot, fixtures G18B e exportação Web não exigem esses 24 caminhos.
- `node js/tests/run-tests.js` continua **FALHANDO** no bloco de contrato do manifest visual porque o arquivo declarado não existe (362 verificações passam antes da primeira falha). Este estado não foi mascarado.
- Migrar os manifests JS exige assets distintos para NPCs, espécies, ponte, muros e alvenaria; encaminhar todas as espécies a um único sprite quebraria a correspondência entre identidade e arte. Fazer essa troca parcial sem os recursos seria uma falsa conclusão.
