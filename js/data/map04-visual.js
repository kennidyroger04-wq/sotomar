/*
 * MAP_04 — TRILHA DO LENHADOR (12×9)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Cruzamento no eixo da trilha; norte claro (vila), floresta engrossando para sul e bordas.
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
 *    y 0 TT....^...TT
 *    y 1 T.....=....T
 *    y 2 .hH...=.WW..
 *    y 3 ...=..=.....
 *    y 4 ...==:S====>
 *    y 5 T..T..=....T
 *    y 6 TT....=R.T.T
 *    y 7 TTT.T.=..TTT
 *    y 8 TTTTT.v.TTTT
 */
(function(root){
  "use strict";

  const MAP_04_VISUAL = Object.freeze({
    mapId: "MAP_04",

    dimensions: Object.freeze({
      width: 12,
      height: 9
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:6, y:0, assetId:"VIS_DIRT_PATH"}, {x:6, y:1, assetId:"VIS_DIRT_PATH"}, {x:6, y:2, assetId:"VIS_DIRT_PATH"},
      {x:3, y:3, assetId:"VIS_DIRT_PATH"}, {x:6, y:3, assetId:"VIS_DIRT_PATH"}, {x:3, y:4, assetId:"VIS_DIRT_PATH"},
      {x:4, y:4, assetId:"VIS_DIRT_PATH"}, {x:5, y:4, assetId:"VIS_DIRT_BASE"}, {x:6, y:4, assetId:"VIS_DIRT_BASE"},
      {x:7, y:4, assetId:"VIS_DIRT_PATH"}, {x:8, y:4, assetId:"VIS_DIRT_PATH"}, {x:9, y:4, assetId:"VIS_DIRT_PATH"},
      {x:10, y:4, assetId:"VIS_DIRT_PATH"}, {x:11, y:4, assetId:"VIS_DIRT_PATH"}, {x:6, y:5, assetId:"VIS_DIRT_PATH"},
      {x:6, y:6, assetId:"VIS_DIRT_PATH"}, {x:6, y:7, assetId:"VIS_DIRT_PATH"}, {x:6, y:8, assetId:"VIS_DIRT_PATH"}
    ]),

    props: Object.freeze([
      {id:"map04-house-01", assetId:"VIS_HOUSE_SMALL", x:2, y:2, blocking:true, label:"house-northwest"},
      {id:"map04-wall-01", assetId:"VIS_LOW_WALL", x:8, y:2, blocking:true},
      {id:"map04-wall-02", assetId:"VIS_LOW_WALL", x:9, y:2, blocking:true},
      {id:"map04-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map04-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map04-tree-03", assetId:"VIS_TREE_SMALL", x:10, y:0, blocking:true},
      {id:"map04-tree-04", assetId:"VIS_TREE_SMALL", x:11, y:0, blocking:true},
      {id:"map04-tree-05", assetId:"VIS_TREE_SMALL", x:0, y:1, blocking:true},
      {id:"map04-tree-06", assetId:"VIS_TREE_SMALL", x:11, y:1, blocking:true},
      {id:"map04-tree-07", assetId:"VIS_TREE_SMALL", x:0, y:5, blocking:true},
      {id:"map04-tree-08", assetId:"VIS_TREE_SMALL", x:3, y:5, blocking:true},
      {id:"map04-tree-09", assetId:"VIS_TREE_SMALL", x:11, y:5, blocking:true},
      {id:"map04-tree-10", assetId:"VIS_TREE_SMALL", x:0, y:6, blocking:true},
      {id:"map04-tree-11", assetId:"VIS_TREE_SMALL", x:1, y:6, blocking:true},
      {id:"map04-tree-12", assetId:"VIS_TREE_SMALL", x:9, y:6, blocking:true},
      {id:"map04-tree-13", assetId:"VIS_TREE_SMALL", x:11, y:6, blocking:true},
      {id:"map04-tree-14", assetId:"VIS_TREE_SMALL", x:0, y:7, blocking:true},
      {id:"map04-tree-15", assetId:"VIS_TREE_SMALL", x:1, y:7, blocking:true},
      {id:"map04-tree-16", assetId:"VIS_TREE_SMALL", x:2, y:7, blocking:true},
      {id:"map04-tree-17", assetId:"VIS_TREE_SMALL", x:4, y:7, blocking:true},
      {id:"map04-tree-18", assetId:"VIS_TREE_SMALL", x:9, y:7, blocking:true},
      {id:"map04-tree-19", assetId:"VIS_TREE_SMALL", x:10, y:7, blocking:true},
      {id:"map04-tree-20", assetId:"VIS_TREE_SMALL", x:11, y:7, blocking:true},
      {id:"map04-tree-21", assetId:"VIS_TREE_SMALL", x:0, y:8, blocking:true},
      {id:"map04-tree-22", assetId:"VIS_TREE_SMALL", x:1, y:8, blocking:true},
      {id:"map04-tree-23", assetId:"VIS_TREE_SMALL", x:2, y:8, blocking:true},
      {id:"map04-tree-24", assetId:"VIS_TREE_SMALL", x:3, y:8, blocking:true},
      {id:"map04-tree-25", assetId:"VIS_TREE_SMALL", x:4, y:8, blocking:true},
      {id:"map04-tree-26", assetId:"VIS_TREE_SMALL", x:8, y:8, blocking:true},
      {id:"map04-tree-27", assetId:"VIS_TREE_SMALL", x:9, y:8, blocking:true},
      {id:"map04-tree-28", assetId:"VIS_TREE_SMALL", x:10, y:8, blocking:true},
      {id:"map04-tree-29", assetId:"VIS_TREE_SMALL", x:11, y:8, blocking:true},
      {id:"map04-rocks-01", assetId:"VIS_ROCKS_GRASS", x:7, y:6, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:10, y:0}, {x:11, y:0}, {x:0, y:1}, {x:11, y:1},
      {x:1, y:2}, {x:2, y:2}, {x:8, y:2}, {x:9, y:2}, {x:0, y:5}, {x:3, y:5},
      {x:11, y:5}, {x:0, y:6}, {x:1, y:6}, {x:9, y:6}, {x:11, y:6}, {x:0, y:7},
      {x:1, y:7}, {x:2, y:7}, {x:4, y:7}, {x:9, y:7}, {x:10, y:7}, {x:11, y:7},
      {x:0, y:8}, {x:1, y:8}, {x:2, y:8}, {x:3, y:8}, {x:4, y:8}, {x:8, y:8},
      {x:9, y:8}, {x:10, y:8}, {x:11, y:8}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:6, y:4},
      {id:"EXIT_MAP_01", x:6, y:0},
      {id:"EXIT_MAP_05", x:11, y:4},
      {id:"EXIT_MAP_06", x:6, y:8},
      {id:"ENCOUNTER_PLACEMENT_01", x:6, y:4}
    ])
  });

  root.MAP_04_VISUAL = MAP_04_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_04_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
