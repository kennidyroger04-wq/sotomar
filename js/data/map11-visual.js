/*
 * MAP_11 — ARENA DA SINEIRA (12×10)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Arena solene: simetria concêntrica em torno do spawn, anel de caminho, pilares nos cantos. Sem posição para a Sineira.
 *
 * Convenções (idênticas a MAP_01):
 * - Coordenadas lógicas {x, y}; x = 0..11, y = 0..9.
 * - Piso padrão VIS_GRASS_BASE; somente overrides listados.
 * - Props altos têm uma única anchor cell. Casas: anchor + célula extra bloqueada em (x-1, y).
 * - Colisão é declarada SOMENTE em blockedCells.
 * - VIS_ROCKS_GRASS, VIS_WATER_EDGE e VIS_BRIDGE NÃO bloqueiam. VIS_WATER bloqueia (exceto sob VIS_BRIDGE).
 * - reservedCells: SPAWN_DEFAULT, exits existentes e ENCOUNTER_PLACEMENT_* (posições provisórias do runtime).
 * - ASCII (documentação; sem encounter): . grama  : terra  = caminho  ~ água  , borda d'água
 *   T árvore  R pedras  H casa  h célula extra da casa  W muro baixo  X alvenaria  B ponte (trecho)  S spawn  < > ^ v exit
 *        012345678901
 *    y 0 TT........TT
 *    y 1 .R..,~~~,...
 *    y 2 ...X==W==X..
 *    y 3 .R.=.....=..
 *    y 4 ..W=.:::.=R.
 *    y 5 <===.:S:.X..
 *    y 6 ..W=.:::.=R.
 *    y 7 .R.=.....=..
 *    y 8 ...X==W==X..
 *    y 9 TT..,~~~,.TT
 */
(function(root){
  "use strict";

  const MAP_11_VISUAL = Object.freeze({
    mapId: "MAP_11",

    dimensions: Object.freeze({
      width: 12,
      height: 10
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:4, y:1, assetId:"VIS_WATER_EDGE"}, {x:5, y:1, assetId:"VIS_WATER"}, {x:6, y:1, assetId:"VIS_WATER"},
      {x:7, y:1, assetId:"VIS_WATER"}, {x:8, y:1, assetId:"VIS_WATER_EDGE"}, {x:3, y:2, assetId:"VIS_DIRT_PATH"},
      {x:4, y:2, assetId:"VIS_DIRT_PATH"}, {x:5, y:2, assetId:"VIS_DIRT_PATH"}, {x:6, y:2, assetId:"VIS_DIRT_PATH"},
      {x:7, y:2, assetId:"VIS_DIRT_PATH"}, {x:8, y:2, assetId:"VIS_DIRT_PATH"}, {x:9, y:2, assetId:"VIS_DIRT_PATH"},
      {x:3, y:3, assetId:"VIS_DIRT_PATH"}, {x:9, y:3, assetId:"VIS_DIRT_PATH"}, {x:3, y:4, assetId:"VIS_DIRT_PATH"},
      {x:5, y:4, assetId:"VIS_DIRT_BASE"}, {x:6, y:4, assetId:"VIS_DIRT_BASE"}, {x:7, y:4, assetId:"VIS_DIRT_BASE"},
      {x:9, y:4, assetId:"VIS_DIRT_PATH"}, {x:0, y:5, assetId:"VIS_DIRT_PATH"}, {x:1, y:5, assetId:"VIS_DIRT_PATH"},
      {x:2, y:5, assetId:"VIS_DIRT_PATH"}, {x:3, y:5, assetId:"VIS_DIRT_PATH"}, {x:5, y:5, assetId:"VIS_DIRT_BASE"},
      {x:6, y:5, assetId:"VIS_DIRT_BASE"}, {x:7, y:5, assetId:"VIS_DIRT_BASE"}, {x:9, y:5, assetId:"VIS_DIRT_PATH"},
      {x:3, y:6, assetId:"VIS_DIRT_PATH"}, {x:5, y:6, assetId:"VIS_DIRT_BASE"}, {x:6, y:6, assetId:"VIS_DIRT_BASE"},
      {x:7, y:6, assetId:"VIS_DIRT_BASE"}, {x:9, y:6, assetId:"VIS_DIRT_PATH"}, {x:3, y:7, assetId:"VIS_DIRT_PATH"},
      {x:9, y:7, assetId:"VIS_DIRT_PATH"}, {x:3, y:8, assetId:"VIS_DIRT_PATH"}, {x:4, y:8, assetId:"VIS_DIRT_PATH"},
      {x:5, y:8, assetId:"VIS_DIRT_PATH"}, {x:6, y:8, assetId:"VIS_DIRT_PATH"}, {x:7, y:8, assetId:"VIS_DIRT_PATH"},
      {x:8, y:8, assetId:"VIS_DIRT_PATH"}, {x:9, y:8, assetId:"VIS_DIRT_PATH"}, {x:4, y:9, assetId:"VIS_WATER_EDGE"},
      {x:5, y:9, assetId:"VIS_WATER"}, {x:6, y:9, assetId:"VIS_WATER"}, {x:7, y:9, assetId:"VIS_WATER"},
      {x:8, y:9, assetId:"VIS_WATER_EDGE"}
    ]),

    props: Object.freeze([
      {id:"map11-masonry-01", assetId:"VIS_MASONRY_STRUCTURE", x:3, y:2, blocking:true, label:"masonry-northwest"},
      {id:"map11-masonry-02", assetId:"VIS_MASONRY_STRUCTURE", x:9, y:2, blocking:true, label:"masonry-northeast"},
      {id:"map11-masonry-03", assetId:"VIS_MASONRY_STRUCTURE", x:9, y:5, blocking:true, label:"masonry-east"},
      {id:"map11-masonry-04", assetId:"VIS_MASONRY_STRUCTURE", x:3, y:8, blocking:true, label:"masonry-southwest"},
      {id:"map11-masonry-05", assetId:"VIS_MASONRY_STRUCTURE", x:9, y:8, blocking:true, label:"masonry-southeast"},
      {id:"map11-wall-01", assetId:"VIS_LOW_WALL", x:6, y:2, blocking:true},
      {id:"map11-wall-02", assetId:"VIS_LOW_WALL", x:2, y:4, blocking:true},
      {id:"map11-wall-03", assetId:"VIS_LOW_WALL", x:2, y:6, blocking:true},
      {id:"map11-wall-04", assetId:"VIS_LOW_WALL", x:6, y:8, blocking:true},
      {id:"map11-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map11-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map11-tree-03", assetId:"VIS_TREE_SMALL", x:10, y:0, blocking:true},
      {id:"map11-tree-04", assetId:"VIS_TREE_SMALL", x:11, y:0, blocking:true},
      {id:"map11-tree-05", assetId:"VIS_TREE_SMALL", x:0, y:9, blocking:true},
      {id:"map11-tree-06", assetId:"VIS_TREE_SMALL", x:1, y:9, blocking:true},
      {id:"map11-tree-07", assetId:"VIS_TREE_SMALL", x:10, y:9, blocking:true},
      {id:"map11-tree-08", assetId:"VIS_TREE_SMALL", x:11, y:9, blocking:true},
      {id:"map11-rocks-01", assetId:"VIS_ROCKS_GRASS", x:1, y:1, blocking:false},
      {id:"map11-rocks-02", assetId:"VIS_ROCKS_GRASS", x:1, y:3, blocking:false},
      {id:"map11-rocks-03", assetId:"VIS_ROCKS_GRASS", x:10, y:4, blocking:false},
      {id:"map11-rocks-04", assetId:"VIS_ROCKS_GRASS", x:10, y:6, blocking:false},
      {id:"map11-rocks-05", assetId:"VIS_ROCKS_GRASS", x:1, y:7, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:10, y:0}, {x:11, y:0}, {x:5, y:1}, {x:6, y:1},
      {x:7, y:1}, {x:3, y:2}, {x:6, y:2}, {x:9, y:2}, {x:2, y:4}, {x:9, y:5},
      {x:2, y:6}, {x:3, y:8}, {x:6, y:8}, {x:9, y:8}, {x:0, y:9}, {x:1, y:9},
      {x:5, y:9}, {x:6, y:9}, {x:7, y:9}, {x:10, y:9}, {x:11, y:9}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:6, y:5},
      {id:"EXIT_MAP_10", x:0, y:5}
    ])
  });

  root.MAP_11_VISUAL = MAP_11_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_11_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
