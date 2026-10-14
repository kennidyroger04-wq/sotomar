/*
 * MAP_10 — BOCA DO GROTÃO (10×9)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Limiar: corredor ordenado por muros baixos, vegetação reduzida, pequenas poças simétricas.
 *
 * Convenções (idênticas a MAP_01):
 * - Coordenadas lógicas {x, y}; x = 0..9, y = 0..8.
 * - Piso padrão VIS_GRASS_BASE; somente overrides listados.
 * - Props altos têm uma única anchor cell. Casas: anchor + célula extra bloqueada em (x-1, y).
 * - Colisão é declarada SOMENTE em blockedCells.
 * - VIS_ROCKS_GRASS, VIS_WATER_EDGE e VIS_BRIDGE NÃO bloqueiam. VIS_WATER bloqueia (exceto sob VIS_BRIDGE).
 * - reservedCells: SPAWN_DEFAULT, exits existentes e ENCOUNTER_PLACEMENT_* (posições provisórias do runtime).
 * - ASCII (documentação; e = encounter provisório): . grama  : terra  = caminho  ~ água  , borda d'água
 *   T árvore  R pedras  H casa  h célula extra da casa  W muro baixo  X alvenaria  B ponte (trecho)  S spawn  < > ^ v exit
 *        0123456789
 *    y 0 TT...~~..T
 *    y 1 T....,,...
 *    y 2 ...XWWWWW.
 *    y 3 T.R.::::RT
 *    y 4 <====See=>
 *    y 5 T.R.::::RT
 *    y 6 ...XWWWWW.
 *    y 7 T....,,...
 *    y 8 TT...~~.TT
 */
(function(root){
  "use strict";

  const MAP_10_VISUAL = Object.freeze({
    mapId: "MAP_10",

    dimensions: Object.freeze({
      width: 10,
      height: 9
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:5, y:0, assetId:"VIS_WATER"}, {x:6, y:0, assetId:"VIS_WATER"}, {x:5, y:1, assetId:"VIS_WATER_EDGE"},
      {x:6, y:1, assetId:"VIS_WATER_EDGE"}, {x:4, y:3, assetId:"VIS_DIRT_BASE"}, {x:5, y:3, assetId:"VIS_DIRT_BASE"},
      {x:6, y:3, assetId:"VIS_DIRT_BASE"}, {x:7, y:3, assetId:"VIS_DIRT_BASE"}, {x:0, y:4, assetId:"VIS_DIRT_PATH"},
      {x:1, y:4, assetId:"VIS_DIRT_PATH"}, {x:2, y:4, assetId:"VIS_DIRT_PATH"}, {x:3, y:4, assetId:"VIS_DIRT_PATH"},
      {x:4, y:4, assetId:"VIS_DIRT_PATH"}, {x:5, y:4, assetId:"VIS_DIRT_PATH"}, {x:6, y:4, assetId:"VIS_DIRT_PATH"},
      {x:7, y:4, assetId:"VIS_DIRT_PATH"}, {x:8, y:4, assetId:"VIS_DIRT_PATH"}, {x:9, y:4, assetId:"VIS_DIRT_PATH"},
      {x:4, y:5, assetId:"VIS_DIRT_BASE"}, {x:5, y:5, assetId:"VIS_DIRT_BASE"}, {x:6, y:5, assetId:"VIS_DIRT_BASE"},
      {x:7, y:5, assetId:"VIS_DIRT_BASE"}, {x:5, y:7, assetId:"VIS_WATER_EDGE"}, {x:6, y:7, assetId:"VIS_WATER_EDGE"},
      {x:5, y:8, assetId:"VIS_WATER"}, {x:6, y:8, assetId:"VIS_WATER"}
    ]),

    props: Object.freeze([
      {id:"map10-masonry-01", assetId:"VIS_MASONRY_STRUCTURE", x:3, y:2, blocking:true, label:"masonry-northwest"},
      {id:"map10-masonry-02", assetId:"VIS_MASONRY_STRUCTURE", x:3, y:6, blocking:true, label:"masonry-southwest"},
      {id:"map10-wall-01", assetId:"VIS_LOW_WALL", x:4, y:2, blocking:true},
      {id:"map10-wall-02", assetId:"VIS_LOW_WALL", x:5, y:2, blocking:true},
      {id:"map10-wall-03", assetId:"VIS_LOW_WALL", x:6, y:2, blocking:true},
      {id:"map10-wall-04", assetId:"VIS_LOW_WALL", x:7, y:2, blocking:true},
      {id:"map10-wall-05", assetId:"VIS_LOW_WALL", x:8, y:2, blocking:true},
      {id:"map10-wall-06", assetId:"VIS_LOW_WALL", x:4, y:6, blocking:true},
      {id:"map10-wall-07", assetId:"VIS_LOW_WALL", x:5, y:6, blocking:true},
      {id:"map10-wall-08", assetId:"VIS_LOW_WALL", x:6, y:6, blocking:true},
      {id:"map10-wall-09", assetId:"VIS_LOW_WALL", x:7, y:6, blocking:true},
      {id:"map10-wall-10", assetId:"VIS_LOW_WALL", x:8, y:6, blocking:true},
      {id:"map10-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map10-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map10-tree-03", assetId:"VIS_TREE_SMALL", x:9, y:0, blocking:true},
      {id:"map10-tree-04", assetId:"VIS_TREE_SMALL", x:0, y:1, blocking:true},
      {id:"map10-tree-05", assetId:"VIS_TREE_SMALL", x:0, y:3, blocking:true},
      {id:"map10-tree-06", assetId:"VIS_TREE_SMALL", x:9, y:3, blocking:true},
      {id:"map10-tree-07", assetId:"VIS_TREE_SMALL", x:0, y:5, blocking:true},
      {id:"map10-tree-08", assetId:"VIS_TREE_SMALL", x:9, y:5, blocking:true},
      {id:"map10-tree-09", assetId:"VIS_TREE_SMALL", x:0, y:7, blocking:true},
      {id:"map10-tree-10", assetId:"VIS_TREE_SMALL", x:0, y:8, blocking:true},
      {id:"map10-tree-11", assetId:"VIS_TREE_SMALL", x:1, y:8, blocking:true},
      {id:"map10-tree-12", assetId:"VIS_TREE_SMALL", x:8, y:8, blocking:true},
      {id:"map10-tree-13", assetId:"VIS_TREE_SMALL", x:9, y:8, blocking:true},
      {id:"map10-rocks-01", assetId:"VIS_ROCKS_GRASS", x:2, y:3, blocking:false},
      {id:"map10-rocks-02", assetId:"VIS_ROCKS_GRASS", x:8, y:3, blocking:false},
      {id:"map10-rocks-03", assetId:"VIS_ROCKS_GRASS", x:2, y:5, blocking:false},
      {id:"map10-rocks-04", assetId:"VIS_ROCKS_GRASS", x:8, y:5, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:5, y:0}, {x:6, y:0}, {x:9, y:0}, {x:0, y:1},
      {x:3, y:2}, {x:4, y:2}, {x:5, y:2}, {x:6, y:2}, {x:7, y:2}, {x:8, y:2},
      {x:0, y:3}, {x:9, y:3}, {x:0, y:5}, {x:9, y:5}, {x:3, y:6}, {x:4, y:6},
      {x:5, y:6}, {x:6, y:6}, {x:7, y:6}, {x:8, y:6}, {x:0, y:7}, {x:0, y:8},
      {x:1, y:8}, {x:5, y:8}, {x:6, y:8}, {x:8, y:8}, {x:9, y:8}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:5, y:4},
      {id:"EXIT_MAP_08", x:0, y:4},
      {id:"EXIT_MAP_11", x:9, y:4},
      {id:"ENCOUNTER_PLACEMENT_01", x:5, y:4},
      {id:"ENCOUNTER_PLACEMENT_02", x:6, y:4},
      {id:"ENCOUNTER_PLACEMENT_03", x:7, y:4}
    ])
  });

  root.MAP_10_VISUAL = MAP_10_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_10_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
