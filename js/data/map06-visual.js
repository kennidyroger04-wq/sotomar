/*
 * MAP_06 — PONTE QUEBRADA (11×9)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Rio atravessa a largura; ponte reduzida a um toco e dois pilares; margem oposta visível e inacessível. Sem conexão com MAP_07.
 *
 * Convenções (idênticas a MAP_01):
 * - Coordenadas lógicas {x, y}; x = 0..10, y = 0..8.
 * - Piso padrão VIS_GRASS_BASE; somente overrides listados.
 * - Props altos têm uma única anchor cell. Casas: anchor + célula extra bloqueada em (x-1, y).
 * - Colisão é declarada SOMENTE em blockedCells.
 * - VIS_ROCKS_GRASS, VIS_WATER_EDGE e VIS_BRIDGE NÃO bloqueiam. VIS_WATER bloqueia (exceto sob VIS_BRIDGE).
 * - reservedCells: SPAWN_DEFAULT, exits existentes e ENCOUNTER_PLACEMENT_* (posições provisórias do runtime).
 * - ASCII (documentação; e = encounter provisório): . grama  : terra  = caminho  ~ água  , borda d'água
 *   T árvore  R pedras  H casa  h célula extra da casa  W muro baixo  X alvenaria  B ponte (trecho)  S spawn  < > ^ v exit
 *        01234567890
 *    y 0 TT...^...TT
 *    y 1 T....=....T
 *    y 2 ..T..=..T..
 *    y 3 T....=....T
 *    y 4 ..R.:SeeR..
 *    y 5 ,,,,W=W,,,,
 *    y 6 ~~~~~B~~~~~
 *    y 7 ~~~~X~X~~~~
 *    y 8 TTT,,=,,TTT
 */
(function(root){
  "use strict";

  const MAP_06_VISUAL = Object.freeze({
    mapId: "MAP_06",

    dimensions: Object.freeze({
      width: 11,
      height: 9
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:5, y:0, assetId:"VIS_DIRT_PATH"}, {x:5, y:1, assetId:"VIS_DIRT_PATH"}, {x:5, y:2, assetId:"VIS_DIRT_PATH"},
      {x:5, y:3, assetId:"VIS_DIRT_PATH"}, {x:4, y:4, assetId:"VIS_DIRT_BASE"}, {x:5, y:4, assetId:"VIS_DIRT_BASE"},
      {x:6, y:4, assetId:"VIS_DIRT_BASE"}, {x:7, y:4, assetId:"VIS_DIRT_BASE"}, {x:0, y:5, assetId:"VIS_WATER_EDGE"},
      {x:1, y:5, assetId:"VIS_WATER_EDGE"}, {x:2, y:5, assetId:"VIS_WATER_EDGE"}, {x:3, y:5, assetId:"VIS_WATER_EDGE"},
      {x:4, y:5, assetId:"VIS_WATER_EDGE"}, {x:5, y:5, assetId:"VIS_DIRT_PATH"}, {x:6, y:5, assetId:"VIS_WATER_EDGE"},
      {x:7, y:5, assetId:"VIS_WATER_EDGE"}, {x:8, y:5, assetId:"VIS_WATER_EDGE"}, {x:9, y:5, assetId:"VIS_WATER_EDGE"},
      {x:10, y:5, assetId:"VIS_WATER_EDGE"}, {x:0, y:6, assetId:"VIS_WATER"}, {x:1, y:6, assetId:"VIS_WATER"},
      {x:2, y:6, assetId:"VIS_WATER"}, {x:3, y:6, assetId:"VIS_WATER"}, {x:4, y:6, assetId:"VIS_WATER"},
      {x:5, y:6, assetId:"VIS_WATER"}, {x:6, y:6, assetId:"VIS_WATER"}, {x:7, y:6, assetId:"VIS_WATER"},
      {x:8, y:6, assetId:"VIS_WATER"}, {x:9, y:6, assetId:"VIS_WATER"}, {x:10, y:6, assetId:"VIS_WATER"},
      {x:0, y:7, assetId:"VIS_WATER"}, {x:1, y:7, assetId:"VIS_WATER"}, {x:2, y:7, assetId:"VIS_WATER"},
      {x:3, y:7, assetId:"VIS_WATER"}, {x:4, y:7, assetId:"VIS_WATER"}, {x:5, y:7, assetId:"VIS_WATER"},
      {x:6, y:7, assetId:"VIS_WATER"}, {x:7, y:7, assetId:"VIS_WATER"}, {x:8, y:7, assetId:"VIS_WATER"},
      {x:9, y:7, assetId:"VIS_WATER"}, {x:10, y:7, assetId:"VIS_WATER"}, {x:0, y:8, assetId:"VIS_WATER_EDGE"},
      {x:1, y:8, assetId:"VIS_WATER_EDGE"}, {x:2, y:8, assetId:"VIS_WATER_EDGE"}, {x:3, y:8, assetId:"VIS_WATER_EDGE"},
      {x:4, y:8, assetId:"VIS_WATER_EDGE"}, {x:5, y:8, assetId:"VIS_DIRT_PATH"}, {x:6, y:8, assetId:"VIS_WATER_EDGE"},
      {x:7, y:8, assetId:"VIS_WATER_EDGE"}, {x:8, y:8, assetId:"VIS_WATER_EDGE"}, {x:9, y:8, assetId:"VIS_WATER_EDGE"},
      {x:10, y:8, assetId:"VIS_WATER_EDGE"}
    ]),

    props: Object.freeze([
      {id:"map06-masonry-01", assetId:"VIS_MASONRY_STRUCTURE", x:4, y:7, blocking:true, label:"masonry-south"},
      {id:"map06-masonry-02", assetId:"VIS_MASONRY_STRUCTURE", x:6, y:7, blocking:true, label:"masonry-south"},
      {id:"map06-wall-01", assetId:"VIS_LOW_WALL", x:4, y:5, blocking:true},
      {id:"map06-wall-02", assetId:"VIS_LOW_WALL", x:6, y:5, blocking:true},
      {id:"map06-bridge-01", assetId:"VIS_BRIDGE", x:5, y:6, blocking:false, label:"bridge-stub"},
      {id:"map06-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map06-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map06-tree-03", assetId:"VIS_TREE_SMALL", x:9, y:0, blocking:true},
      {id:"map06-tree-04", assetId:"VIS_TREE_SMALL", x:10, y:0, blocking:true},
      {id:"map06-tree-05", assetId:"VIS_TREE_SMALL", x:0, y:1, blocking:true},
      {id:"map06-tree-06", assetId:"VIS_TREE_SMALL", x:10, y:1, blocking:true},
      {id:"map06-tree-07", assetId:"VIS_TREE_SMALL", x:2, y:2, blocking:true},
      {id:"map06-tree-08", assetId:"VIS_TREE_SMALL", x:8, y:2, blocking:true},
      {id:"map06-tree-09", assetId:"VIS_TREE_SMALL", x:0, y:3, blocking:true},
      {id:"map06-tree-10", assetId:"VIS_TREE_SMALL", x:10, y:3, blocking:true},
      {id:"map06-tree-11", assetId:"VIS_TREE_SMALL", x:0, y:8, blocking:true},
      {id:"map06-tree-12", assetId:"VIS_TREE_SMALL", x:1, y:8, blocking:true},
      {id:"map06-tree-13", assetId:"VIS_TREE_SMALL", x:2, y:8, blocking:true},
      {id:"map06-tree-14", assetId:"VIS_TREE_SMALL", x:8, y:8, blocking:true},
      {id:"map06-tree-15", assetId:"VIS_TREE_SMALL", x:9, y:8, blocking:true},
      {id:"map06-tree-16", assetId:"VIS_TREE_SMALL", x:10, y:8, blocking:true},
      {id:"map06-rocks-01", assetId:"VIS_ROCKS_GRASS", x:2, y:4, blocking:false},
      {id:"map06-rocks-02", assetId:"VIS_ROCKS_GRASS", x:8, y:4, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:9, y:0}, {x:10, y:0}, {x:0, y:1}, {x:10, y:1},
      {x:2, y:2}, {x:8, y:2}, {x:0, y:3}, {x:10, y:3}, {x:4, y:5}, {x:6, y:5},
      {x:0, y:6}, {x:1, y:6}, {x:2, y:6}, {x:3, y:6}, {x:4, y:6}, {x:6, y:6},
      {x:7, y:6}, {x:8, y:6}, {x:9, y:6}, {x:10, y:6}, {x:0, y:7}, {x:1, y:7},
      {x:2, y:7}, {x:3, y:7}, {x:4, y:7}, {x:5, y:7}, {x:6, y:7}, {x:7, y:7},
      {x:8, y:7}, {x:9, y:7}, {x:10, y:7}, {x:0, y:8}, {x:1, y:8}, {x:2, y:8},
      {x:8, y:8}, {x:9, y:8}, {x:10, y:8}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:5, y:4},
      {id:"EXIT_MAP_04", x:5, y:0},
      {id:"ENCOUNTER_PLACEMENT_01", x:5, y:4},
      {id:"ENCOUNTER_PLACEMENT_02", x:6, y:4},
      {id:"ENCOUNTER_PLACEMENT_03", x:7, y:4}
    ])
  });

  root.MAP_06_VISUAL = MAP_06_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_06_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
