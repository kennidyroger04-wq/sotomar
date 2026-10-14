/*
 * MAP_07 — DESCIDA DAS RAÍZES (12×10)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Floresta mais fechada; trilha sinuosa que estreita rumo à saída leste.
 *
 * Convenções (idênticas a MAP_01):
 * - Coordenadas lógicas {x, y}; x = 0..11, y = 0..9.
 * - Piso padrão VIS_GRASS_BASE; somente overrides listados.
 * - Props altos têm uma única anchor cell. Casas: anchor + célula extra bloqueada em (x-1, y).
 * - Colisão é declarada SOMENTE em blockedCells.
 * - VIS_ROCKS_GRASS, VIS_WATER_EDGE e VIS_BRIDGE NÃO bloqueiam. VIS_WATER bloqueia (exceto sob VIS_BRIDGE).
 * - reservedCells: SPAWN_DEFAULT, exits existentes e ENCOUNTER_PLACEMENT_* (posições provisórias do runtime).
 * - ASCII (documentação; e = encounter provisório): . grama  : terra  = caminho  ~ água  , borda d'água
 *   T árvore  R pedras  H casa  h célula extra da casa  W muro baixo  X alvenaria  B ponte (trecho)  S spawn  < > ^ v exit
 *        012345678901
 *    y 0 TT.TT..TTTTT
 *    y 1 T...T..T..TT
 *    y 2 T..T...T....
 *    y 3 ..T...RT..T.
 *    y 4 .T====::.RTT
 *    y 5 <==..=See==>
 *    y 6 ..T..R.::.TT
 *    y 7 .T..T......T
 *    y 8 T...T..T..TT
 *    y 9 TT.TT..T.TTT
 */
(function(root){
  "use strict";

  const MAP_07_VISUAL = Object.freeze({
    mapId: "MAP_07",

    dimensions: Object.freeze({
      width: 12,
      height: 10
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:2, y:4, assetId:"VIS_DIRT_PATH"}, {x:3, y:4, assetId:"VIS_DIRT_PATH"}, {x:4, y:4, assetId:"VIS_DIRT_PATH"},
      {x:5, y:4, assetId:"VIS_DIRT_PATH"}, {x:6, y:4, assetId:"VIS_DIRT_BASE"}, {x:7, y:4, assetId:"VIS_DIRT_BASE"},
      {x:0, y:5, assetId:"VIS_DIRT_PATH"}, {x:1, y:5, assetId:"VIS_DIRT_PATH"}, {x:2, y:5, assetId:"VIS_DIRT_PATH"},
      {x:5, y:5, assetId:"VIS_DIRT_PATH"}, {x:6, y:5, assetId:"VIS_DIRT_PATH"}, {x:7, y:5, assetId:"VIS_DIRT_PATH"},
      {x:8, y:5, assetId:"VIS_DIRT_PATH"}, {x:9, y:5, assetId:"VIS_DIRT_PATH"}, {x:10, y:5, assetId:"VIS_DIRT_PATH"},
      {x:11, y:5, assetId:"VIS_DIRT_PATH"}, {x:7, y:6, assetId:"VIS_DIRT_BASE"}, {x:8, y:6, assetId:"VIS_DIRT_BASE"}
    ]),

    props: Object.freeze([
      {id:"map07-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map07-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map07-tree-03", assetId:"VIS_TREE_SMALL", x:3, y:0, blocking:true},
      {id:"map07-tree-04", assetId:"VIS_TREE_SMALL", x:4, y:0, blocking:true},
      {id:"map07-tree-05", assetId:"VIS_TREE_SMALL", x:7, y:0, blocking:true},
      {id:"map07-tree-06", assetId:"VIS_TREE_SMALL", x:8, y:0, blocking:true},
      {id:"map07-tree-07", assetId:"VIS_TREE_SMALL", x:9, y:0, blocking:true},
      {id:"map07-tree-08", assetId:"VIS_TREE_SMALL", x:10, y:0, blocking:true},
      {id:"map07-tree-09", assetId:"VIS_TREE_SMALL", x:11, y:0, blocking:true},
      {id:"map07-tree-10", assetId:"VIS_TREE_SMALL", x:0, y:1, blocking:true},
      {id:"map07-tree-11", assetId:"VIS_TREE_SMALL", x:4, y:1, blocking:true},
      {id:"map07-tree-12", assetId:"VIS_TREE_SMALL", x:7, y:1, blocking:true},
      {id:"map07-tree-13", assetId:"VIS_TREE_SMALL", x:10, y:1, blocking:true},
      {id:"map07-tree-14", assetId:"VIS_TREE_SMALL", x:11, y:1, blocking:true},
      {id:"map07-tree-15", assetId:"VIS_TREE_SMALL", x:0, y:2, blocking:true},
      {id:"map07-tree-16", assetId:"VIS_TREE_SMALL", x:3, y:2, blocking:true},
      {id:"map07-tree-17", assetId:"VIS_TREE_SMALL", x:7, y:2, blocking:true},
      {id:"map07-tree-18", assetId:"VIS_TREE_SMALL", x:2, y:3, blocking:true},
      {id:"map07-tree-19", assetId:"VIS_TREE_SMALL", x:7, y:3, blocking:true},
      {id:"map07-tree-20", assetId:"VIS_TREE_SMALL", x:10, y:3, blocking:true},
      {id:"map07-tree-21", assetId:"VIS_TREE_SMALL", x:1, y:4, blocking:true},
      {id:"map07-tree-22", assetId:"VIS_TREE_SMALL", x:10, y:4, blocking:true},
      {id:"map07-tree-23", assetId:"VIS_TREE_SMALL", x:11, y:4, blocking:true},
      {id:"map07-tree-24", assetId:"VIS_TREE_SMALL", x:2, y:6, blocking:true},
      {id:"map07-tree-25", assetId:"VIS_TREE_SMALL", x:10, y:6, blocking:true},
      {id:"map07-tree-26", assetId:"VIS_TREE_SMALL", x:11, y:6, blocking:true},
      {id:"map07-tree-27", assetId:"VIS_TREE_SMALL", x:1, y:7, blocking:true},
      {id:"map07-tree-28", assetId:"VIS_TREE_SMALL", x:4, y:7, blocking:true},
      {id:"map07-tree-29", assetId:"VIS_TREE_SMALL", x:11, y:7, blocking:true},
      {id:"map07-tree-30", assetId:"VIS_TREE_SMALL", x:0, y:8, blocking:true},
      {id:"map07-tree-31", assetId:"VIS_TREE_SMALL", x:4, y:8, blocking:true},
      {id:"map07-tree-32", assetId:"VIS_TREE_SMALL", x:7, y:8, blocking:true},
      {id:"map07-tree-33", assetId:"VIS_TREE_SMALL", x:10, y:8, blocking:true},
      {id:"map07-tree-34", assetId:"VIS_TREE_SMALL", x:11, y:8, blocking:true},
      {id:"map07-tree-35", assetId:"VIS_TREE_SMALL", x:0, y:9, blocking:true},
      {id:"map07-tree-36", assetId:"VIS_TREE_SMALL", x:1, y:9, blocking:true},
      {id:"map07-tree-37", assetId:"VIS_TREE_SMALL", x:3, y:9, blocking:true},
      {id:"map07-tree-38", assetId:"VIS_TREE_SMALL", x:4, y:9, blocking:true},
      {id:"map07-tree-39", assetId:"VIS_TREE_SMALL", x:7, y:9, blocking:true},
      {id:"map07-tree-40", assetId:"VIS_TREE_SMALL", x:9, y:9, blocking:true},
      {id:"map07-tree-41", assetId:"VIS_TREE_SMALL", x:10, y:9, blocking:true},
      {id:"map07-tree-42", assetId:"VIS_TREE_SMALL", x:11, y:9, blocking:true},
      {id:"map07-rocks-01", assetId:"VIS_ROCKS_GRASS", x:6, y:3, blocking:false},
      {id:"map07-rocks-02", assetId:"VIS_ROCKS_GRASS", x:9, y:4, blocking:false},
      {id:"map07-rocks-03", assetId:"VIS_ROCKS_GRASS", x:5, y:6, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:3, y:0}, {x:4, y:0}, {x:7, y:0}, {x:8, y:0},
      {x:9, y:0}, {x:10, y:0}, {x:11, y:0}, {x:0, y:1}, {x:4, y:1}, {x:7, y:1},
      {x:10, y:1}, {x:11, y:1}, {x:0, y:2}, {x:3, y:2}, {x:7, y:2}, {x:2, y:3},
      {x:7, y:3}, {x:10, y:3}, {x:1, y:4}, {x:10, y:4}, {x:11, y:4}, {x:2, y:6},
      {x:10, y:6}, {x:11, y:6}, {x:1, y:7}, {x:4, y:7}, {x:11, y:7}, {x:0, y:8},
      {x:4, y:8}, {x:7, y:8}, {x:10, y:8}, {x:11, y:8}, {x:0, y:9}, {x:1, y:9},
      {x:3, y:9}, {x:4, y:9}, {x:7, y:9}, {x:9, y:9}, {x:10, y:9}, {x:11, y:9}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:6, y:5},
      {id:"EXIT_MAP_05", x:0, y:5},
      {id:"EXIT_MAP_08", x:11, y:5},
      {id:"ENCOUNTER_PLACEMENT_01", x:6, y:5},
      {id:"ENCOUNTER_PLACEMENT_02", x:7, y:5},
      {id:"ENCOUNTER_PLACEMENT_03", x:8, y:5}
    ])
  });

  root.MAP_07_VISUAL = MAP_07_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_07_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
