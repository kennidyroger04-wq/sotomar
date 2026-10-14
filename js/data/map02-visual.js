/*
 * MAP_02 — TERRAÇOS DAS ROÇAS (12×9)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Roça acolhedora: campos de terra, degraus de muro baixo, uma casa e uma estrutura de alvenaria.
 *
 * Convenções (idênticas a MAP_01):
 * - Coordenadas lógicas {x, y}; x = 0..11, y = 0..8.
 * - Piso padrão VIS_GRASS_BASE; somente overrides listados.
 * - Props altos têm uma única anchor cell. Casas: anchor + célula extra bloqueada em (x-1, y).
 * - Colisão é declarada SOMENTE em blockedCells.
 * - VIS_ROCKS_GRASS, VIS_WATER_EDGE e VIS_BRIDGE NÃO bloqueiam. VIS_WATER bloqueia (exceto sob VIS_BRIDGE).
 * - reservedCells: SPAWN_DEFAULT, exits existentes e ENCOUNTER_PLACEMENT_* (posições provisórias do runtime).
 * - ASCII (documentação; e = encounter provisório): . grama  : terra  = caminho  ~ água  , borda d'água
 *   T árvore  R pedras  H casa  h célula extra da casa  W muro baixo  X alvenaria  B ponte (trecho)  S spawn  < > ^ v exit
 *        012345678901
 *    y 0 TT.........T
 *    y 1 ..::::..hH.T
 *    y 2 T.::::..:::.
 *    y 3 ..WW.W...=R.
 *    y 4 <=====S====.
 *    y 5 .....R.WW...
 *    y 6 T.R...::::..
 *    y 7 ...X..::::.T
 *    y 8 TT...T....TT
 */
(function(root){
  "use strict";

  const MAP_02_VISUAL = Object.freeze({
    mapId: "MAP_02",

    dimensions: Object.freeze({
      width: 12,
      height: 9
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:2, y:1, assetId:"VIS_DIRT_BASE"}, {x:3, y:1, assetId:"VIS_DIRT_BASE"}, {x:4, y:1, assetId:"VIS_DIRT_BASE"},
      {x:5, y:1, assetId:"VIS_DIRT_BASE"}, {x:2, y:2, assetId:"VIS_DIRT_BASE"}, {x:3, y:2, assetId:"VIS_DIRT_BASE"},
      {x:4, y:2, assetId:"VIS_DIRT_BASE"}, {x:5, y:2, assetId:"VIS_DIRT_BASE"}, {x:8, y:2, assetId:"VIS_DIRT_BASE"},
      {x:9, y:2, assetId:"VIS_DIRT_BASE"}, {x:10, y:2, assetId:"VIS_DIRT_BASE"}, {x:9, y:3, assetId:"VIS_DIRT_PATH"},
      {x:0, y:4, assetId:"VIS_DIRT_PATH"}, {x:1, y:4, assetId:"VIS_DIRT_PATH"}, {x:2, y:4, assetId:"VIS_DIRT_PATH"},
      {x:3, y:4, assetId:"VIS_DIRT_PATH"}, {x:4, y:4, assetId:"VIS_DIRT_PATH"}, {x:5, y:4, assetId:"VIS_DIRT_PATH"},
      {x:6, y:4, assetId:"VIS_DIRT_PATH"}, {x:7, y:4, assetId:"VIS_DIRT_PATH"}, {x:8, y:4, assetId:"VIS_DIRT_PATH"},
      {x:9, y:4, assetId:"VIS_DIRT_PATH"}, {x:10, y:4, assetId:"VIS_DIRT_PATH"}, {x:6, y:6, assetId:"VIS_DIRT_BASE"},
      {x:7, y:6, assetId:"VIS_DIRT_BASE"}, {x:8, y:6, assetId:"VIS_DIRT_BASE"}, {x:9, y:6, assetId:"VIS_DIRT_BASE"},
      {x:6, y:7, assetId:"VIS_DIRT_BASE"}, {x:7, y:7, assetId:"VIS_DIRT_BASE"}, {x:8, y:7, assetId:"VIS_DIRT_BASE"},
      {x:9, y:7, assetId:"VIS_DIRT_BASE"}
    ]),

    props: Object.freeze([
      {id:"map02-house-01", assetId:"VIS_HOUSE_SMALL", x:9, y:1, blocking:true, label:"house-northeast"},
      {id:"map02-masonry-01", assetId:"VIS_MASONRY_STRUCTURE", x:3, y:7, blocking:true, label:"masonry-southwest"},
      {id:"map02-wall-01", assetId:"VIS_LOW_WALL", x:2, y:3, blocking:true},
      {id:"map02-wall-02", assetId:"VIS_LOW_WALL", x:3, y:3, blocking:true},
      {id:"map02-wall-03", assetId:"VIS_LOW_WALL", x:5, y:3, blocking:true},
      {id:"map02-wall-04", assetId:"VIS_LOW_WALL", x:7, y:5, blocking:true},
      {id:"map02-wall-05", assetId:"VIS_LOW_WALL", x:8, y:5, blocking:true},
      {id:"map02-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map02-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map02-tree-03", assetId:"VIS_TREE_SMALL", x:11, y:0, blocking:true},
      {id:"map02-tree-04", assetId:"VIS_TREE_SMALL", x:11, y:1, blocking:true},
      {id:"map02-tree-05", assetId:"VIS_TREE_SMALL", x:0, y:2, blocking:true},
      {id:"map02-tree-06", assetId:"VIS_TREE_SMALL", x:0, y:6, blocking:true},
      {id:"map02-tree-07", assetId:"VIS_TREE_SMALL", x:11, y:7, blocking:true},
      {id:"map02-tree-08", assetId:"VIS_TREE_SMALL", x:0, y:8, blocking:true},
      {id:"map02-tree-09", assetId:"VIS_TREE_SMALL", x:1, y:8, blocking:true},
      {id:"map02-tree-10", assetId:"VIS_TREE_SMALL", x:5, y:8, blocking:true},
      {id:"map02-tree-11", assetId:"VIS_TREE_SMALL", x:10, y:8, blocking:true},
      {id:"map02-tree-12", assetId:"VIS_TREE_SMALL", x:11, y:8, blocking:true},
      {id:"map02-rocks-01", assetId:"VIS_ROCKS_GRASS", x:10, y:3, blocking:false},
      {id:"map02-rocks-02", assetId:"VIS_ROCKS_GRASS", x:5, y:5, blocking:false},
      {id:"map02-rocks-03", assetId:"VIS_ROCKS_GRASS", x:2, y:6, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:11, y:0}, {x:8, y:1}, {x:9, y:1}, {x:11, y:1},
      {x:0, y:2}, {x:2, y:3}, {x:3, y:3}, {x:5, y:3}, {x:7, y:5}, {x:8, y:5},
      {x:0, y:6}, {x:3, y:7}, {x:11, y:7}, {x:0, y:8}, {x:1, y:8}, {x:5, y:8},
      {x:10, y:8}, {x:11, y:8}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:6, y:4},
      {id:"EXIT_MAP_01", x:0, y:4},
      {id:"ENCOUNTER_PLACEMENT_01", x:6, y:4}
    ])
  });

  root.MAP_02_VISUAL = MAP_02_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_02_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
