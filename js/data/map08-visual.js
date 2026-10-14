/*
 * MAP_08 — ACAMPAMENTO DE AURELO (10×8)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Clareira de terra batida; estrutura de alvenaria com pedras ao redor e cerca baixa com abertura ao sul. Sem barracas.
 *
 * Convenções (idênticas a MAP_01):
 * - Coordenadas lógicas {x, y}; x = 0..9, y = 0..7.
 * - Piso padrão VIS_GRASS_BASE; somente overrides listados.
 * - Props altos têm uma única anchor cell. Casas: anchor + célula extra bloqueada em (x-1, y).
 * - Colisão é declarada SOMENTE em blockedCells.
 * - VIS_ROCKS_GRASS, VIS_WATER_EDGE e VIS_BRIDGE NÃO bloqueiam. VIS_WATER bloqueia (exceto sob VIS_BRIDGE).
 * - reservedCells: SPAWN_DEFAULT, exits existentes e ENCOUNTER_PLACEMENT_* (posições provisórias do runtime).
 * - ASCII (documentação; e = encounter provisório): . grama  : terra  = caminho  ~ água  , borda d'água
 *   T árvore  R pedras  H casa  h célula extra da casa  W muro baixo  X alvenaria  B ponte (trecho)  S spawn  < > ^ v exit
 *        0123456789
 *    y 0 TT......TT
 *    y 1 T........T
 *    y 2 ....RXR...
 *    y 3 ....:::...
 *    y 4 <===:Se==>
 *    y 5 ..R.:::...
 *    y 6 T..WW.WW.T
 *    y 7 TT......TT
 */
(function(root){
  "use strict";

  const MAP_08_VISUAL = Object.freeze({
    mapId: "MAP_08",

    dimensions: Object.freeze({
      width: 10,
      height: 8
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:4, y:3, assetId:"VIS_DIRT_BASE"}, {x:5, y:3, assetId:"VIS_DIRT_BASE"}, {x:6, y:3, assetId:"VIS_DIRT_BASE"},
      {x:0, y:4, assetId:"VIS_DIRT_PATH"}, {x:1, y:4, assetId:"VIS_DIRT_PATH"}, {x:2, y:4, assetId:"VIS_DIRT_PATH"},
      {x:3, y:4, assetId:"VIS_DIRT_PATH"}, {x:4, y:4, assetId:"VIS_DIRT_BASE"}, {x:5, y:4, assetId:"VIS_DIRT_BASE"},
      {x:6, y:4, assetId:"VIS_DIRT_BASE"}, {x:7, y:4, assetId:"VIS_DIRT_PATH"}, {x:8, y:4, assetId:"VIS_DIRT_PATH"},
      {x:9, y:4, assetId:"VIS_DIRT_PATH"}, {x:4, y:5, assetId:"VIS_DIRT_BASE"}, {x:5, y:5, assetId:"VIS_DIRT_BASE"},
      {x:6, y:5, assetId:"VIS_DIRT_BASE"}
    ]),

    props: Object.freeze([
      {id:"map08-masonry-01", assetId:"VIS_MASONRY_STRUCTURE", x:5, y:2, blocking:true, label:"masonry-north"},
      {id:"map08-wall-01", assetId:"VIS_LOW_WALL", x:3, y:6, blocking:true},
      {id:"map08-wall-02", assetId:"VIS_LOW_WALL", x:4, y:6, blocking:true},
      {id:"map08-wall-03", assetId:"VIS_LOW_WALL", x:6, y:6, blocking:true},
      {id:"map08-wall-04", assetId:"VIS_LOW_WALL", x:7, y:6, blocking:true},
      {id:"map08-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map08-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map08-tree-03", assetId:"VIS_TREE_SMALL", x:8, y:0, blocking:true},
      {id:"map08-tree-04", assetId:"VIS_TREE_SMALL", x:9, y:0, blocking:true},
      {id:"map08-tree-05", assetId:"VIS_TREE_SMALL", x:0, y:1, blocking:true},
      {id:"map08-tree-06", assetId:"VIS_TREE_SMALL", x:9, y:1, blocking:true},
      {id:"map08-tree-07", assetId:"VIS_TREE_SMALL", x:0, y:6, blocking:true},
      {id:"map08-tree-08", assetId:"VIS_TREE_SMALL", x:9, y:6, blocking:true},
      {id:"map08-tree-09", assetId:"VIS_TREE_SMALL", x:0, y:7, blocking:true},
      {id:"map08-tree-10", assetId:"VIS_TREE_SMALL", x:1, y:7, blocking:true},
      {id:"map08-tree-11", assetId:"VIS_TREE_SMALL", x:8, y:7, blocking:true},
      {id:"map08-tree-12", assetId:"VIS_TREE_SMALL", x:9, y:7, blocking:true},
      {id:"map08-rocks-01", assetId:"VIS_ROCKS_GRASS", x:4, y:2, blocking:false},
      {id:"map08-rocks-02", assetId:"VIS_ROCKS_GRASS", x:6, y:2, blocking:false},
      {id:"map08-rocks-03", assetId:"VIS_ROCKS_GRASS", x:2, y:5, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:8, y:0}, {x:9, y:0}, {x:0, y:1}, {x:9, y:1},
      {x:5, y:2}, {x:0, y:6}, {x:3, y:6}, {x:4, y:6}, {x:6, y:6}, {x:7, y:6},
      {x:9, y:6}, {x:0, y:7}, {x:1, y:7}, {x:8, y:7}, {x:9, y:7}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:5, y:4},
      {id:"EXIT_MAP_07", x:0, y:4},
      {id:"EXIT_MAP_10", x:9, y:4},
      {id:"ENCOUNTER_PLACEMENT_01", x:5, y:4},
      {id:"ENCOUNTER_PLACEMENT_02", x:6, y:4}
    ])
  });

  root.MAP_08_VISUAL = MAP_08_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_08_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
