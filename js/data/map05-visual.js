/*
 * MAP_05 — MARCO-PRUMO (10×9)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Composição deliberada: eixo leste-oeste, marco de alvenaria ao norte do spawn, pilares enquadrando o gate leste.
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
 *    y 0 TT......TT
 *    y 1 T.....R..T
 *    y 2 ..W.WXW..X
 *    y 3 ....:::...
 *    y 4 <====Se==>
 *    y 5 ...R......
 *    y 6 ..W......X
 *    y 7 TR....R..T
 *    y 8 TT......TT
 */
(function(root){
  "use strict";

  const MAP_05_VISUAL = Object.freeze({
    mapId: "MAP_05",

    dimensions: Object.freeze({
      width: 10,
      height: 9
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:5, y:2, assetId:"VIS_DIRT_BASE"}, {x:4, y:3, assetId:"VIS_DIRT_BASE"}, {x:5, y:3, assetId:"VIS_DIRT_BASE"},
      {x:6, y:3, assetId:"VIS_DIRT_BASE"}, {x:0, y:4, assetId:"VIS_DIRT_PATH"}, {x:1, y:4, assetId:"VIS_DIRT_PATH"},
      {x:2, y:4, assetId:"VIS_DIRT_PATH"}, {x:3, y:4, assetId:"VIS_DIRT_PATH"}, {x:4, y:4, assetId:"VIS_DIRT_PATH"},
      {x:5, y:4, assetId:"VIS_DIRT_PATH"}, {x:6, y:4, assetId:"VIS_DIRT_PATH"}, {x:7, y:4, assetId:"VIS_DIRT_PATH"},
      {x:8, y:4, assetId:"VIS_DIRT_PATH"}, {x:9, y:4, assetId:"VIS_DIRT_PATH"}
    ]),

    props: Object.freeze([
      {id:"map05-masonry-01", assetId:"VIS_MASONRY_STRUCTURE", x:5, y:2, blocking:true, label:"masonry-north"},
      {id:"map05-masonry-02", assetId:"VIS_MASONRY_STRUCTURE", x:9, y:2, blocking:true, label:"masonry-northeast"},
      {id:"map05-masonry-03", assetId:"VIS_MASONRY_STRUCTURE", x:9, y:6, blocking:true, label:"masonry-southeast"},
      {id:"map05-wall-01", assetId:"VIS_LOW_WALL", x:2, y:2, blocking:true},
      {id:"map05-wall-02", assetId:"VIS_LOW_WALL", x:4, y:2, blocking:true},
      {id:"map05-wall-03", assetId:"VIS_LOW_WALL", x:6, y:2, blocking:true},
      {id:"map05-wall-04", assetId:"VIS_LOW_WALL", x:2, y:6, blocking:true},
      {id:"map05-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map05-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map05-tree-03", assetId:"VIS_TREE_SMALL", x:8, y:0, blocking:true},
      {id:"map05-tree-04", assetId:"VIS_TREE_SMALL", x:9, y:0, blocking:true},
      {id:"map05-tree-05", assetId:"VIS_TREE_SMALL", x:0, y:1, blocking:true},
      {id:"map05-tree-06", assetId:"VIS_TREE_SMALL", x:9, y:1, blocking:true},
      {id:"map05-tree-07", assetId:"VIS_TREE_SMALL", x:0, y:7, blocking:true},
      {id:"map05-tree-08", assetId:"VIS_TREE_SMALL", x:9, y:7, blocking:true},
      {id:"map05-tree-09", assetId:"VIS_TREE_SMALL", x:0, y:8, blocking:true},
      {id:"map05-tree-10", assetId:"VIS_TREE_SMALL", x:1, y:8, blocking:true},
      {id:"map05-tree-11", assetId:"VIS_TREE_SMALL", x:8, y:8, blocking:true},
      {id:"map05-tree-12", assetId:"VIS_TREE_SMALL", x:9, y:8, blocking:true},
      {id:"map05-rocks-01", assetId:"VIS_ROCKS_GRASS", x:6, y:1, blocking:false},
      {id:"map05-rocks-02", assetId:"VIS_ROCKS_GRASS", x:3, y:5, blocking:false},
      {id:"map05-rocks-03", assetId:"VIS_ROCKS_GRASS", x:1, y:7, blocking:false},
      {id:"map05-rocks-04", assetId:"VIS_ROCKS_GRASS", x:6, y:7, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:8, y:0}, {x:9, y:0}, {x:0, y:1}, {x:9, y:1},
      {x:2, y:2}, {x:4, y:2}, {x:5, y:2}, {x:6, y:2}, {x:9, y:2}, {x:2, y:6},
      {x:9, y:6}, {x:0, y:7}, {x:9, y:7}, {x:0, y:8}, {x:1, y:8}, {x:8, y:8},
      {x:9, y:8}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:5, y:4},
      {id:"EXIT_MAP_04", x:0, y:4},
      {id:"EXIT_MAP_07", x:9, y:4},
      {id:"ENCOUNTER_PLACEMENT_01", x:5, y:4},
      {id:"ENCOUNTER_PLACEMENT_02", x:6, y:4}
    ])
  });

  root.MAP_05_VISUAL = MAP_05_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_05_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
