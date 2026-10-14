/*
 * MAP_03 — COLMEAL VELHO (9×8)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Área opcional antiga: casa e muros com falhas, caminho fragmentado, árvores retomando o espaço. Sem exits.
 *
 * Convenções (idênticas a MAP_01):
 * - Coordenadas lógicas {x, y}; x = 0..8, y = 0..7.
 * - Piso padrão VIS_GRASS_BASE; somente overrides listados.
 * - Props altos têm uma única anchor cell. Casas: anchor + célula extra bloqueada em (x-1, y).
 * - Colisão é declarada SOMENTE em blockedCells.
 * - VIS_ROCKS_GRASS, VIS_WATER_EDGE e VIS_BRIDGE NÃO bloqueiam. VIS_WATER bloqueia (exceto sob VIS_BRIDGE).
 * - reservedCells: SPAWN_DEFAULT, exits existentes e ENCOUNTER_PLACEMENT_* (posições provisórias do runtime).
 * - ASCII (documentação; e = encounter provisório): . grama  : terra  = caminho  ~ água  , borda d'água
 *   T árvore  R pedras  H casa  h célula extra da casa  W muro baixo  X alvenaria  B ponte (trecho)  S spawn  < > ^ v exit
 *        012345678
 *    y 0 TT.....TT
 *    y 1 T....hH..
 *    y 2 .WW...=W.
 *    y 3 ...T.==..
 *    y 4 .=.=Se:..
 *    y 5 .W.....X.
 *    y 6 T...R...T
 *    y 7 TTT....TT
 */
(function(root){
  "use strict";

  const MAP_03_VISUAL = Object.freeze({
    mapId: "MAP_03",

    dimensions: Object.freeze({
      width: 9,
      height: 8
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:6, y:2, assetId:"VIS_DIRT_PATH"}, {x:5, y:3, assetId:"VIS_DIRT_PATH"}, {x:6, y:3, assetId:"VIS_DIRT_PATH"},
      {x:1, y:4, assetId:"VIS_DIRT_PATH"}, {x:3, y:4, assetId:"VIS_DIRT_PATH"}, {x:4, y:4, assetId:"VIS_DIRT_PATH"},
      {x:5, y:4, assetId:"VIS_DIRT_PATH"}, {x:6, y:4, assetId:"VIS_DIRT_BASE"}
    ]),

    props: Object.freeze([
      {id:"map03-house-01", assetId:"VIS_HOUSE_SMALL", x:6, y:1, blocking:true, label:"house-northeast"},
      {id:"map03-masonry-01", assetId:"VIS_MASONRY_STRUCTURE", x:7, y:5, blocking:true, label:"masonry-southeast"},
      {id:"map03-wall-01", assetId:"VIS_LOW_WALL", x:1, y:2, blocking:true},
      {id:"map03-wall-02", assetId:"VIS_LOW_WALL", x:2, y:2, blocking:true},
      {id:"map03-wall-03", assetId:"VIS_LOW_WALL", x:7, y:2, blocking:true},
      {id:"map03-wall-04", assetId:"VIS_LOW_WALL", x:1, y:5, blocking:true},
      {id:"map03-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map03-tree-02", assetId:"VIS_TREE_SMALL", x:1, y:0, blocking:true},
      {id:"map03-tree-03", assetId:"VIS_TREE_SMALL", x:7, y:0, blocking:true},
      {id:"map03-tree-04", assetId:"VIS_TREE_SMALL", x:8, y:0, blocking:true},
      {id:"map03-tree-05", assetId:"VIS_TREE_SMALL", x:0, y:1, blocking:true},
      {id:"map03-tree-06", assetId:"VIS_TREE_SMALL", x:3, y:3, blocking:true},
      {id:"map03-tree-07", assetId:"VIS_TREE_SMALL", x:0, y:6, blocking:true},
      {id:"map03-tree-08", assetId:"VIS_TREE_SMALL", x:8, y:6, blocking:true},
      {id:"map03-tree-09", assetId:"VIS_TREE_SMALL", x:0, y:7, blocking:true},
      {id:"map03-tree-10", assetId:"VIS_TREE_SMALL", x:1, y:7, blocking:true},
      {id:"map03-tree-11", assetId:"VIS_TREE_SMALL", x:2, y:7, blocking:true},
      {id:"map03-tree-12", assetId:"VIS_TREE_SMALL", x:7, y:7, blocking:true},
      {id:"map03-tree-13", assetId:"VIS_TREE_SMALL", x:8, y:7, blocking:true},
      {id:"map03-rocks-01", assetId:"VIS_ROCKS_GRASS", x:4, y:6, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:1, y:0}, {x:7, y:0}, {x:8, y:0}, {x:0, y:1}, {x:5, y:1},
      {x:6, y:1}, {x:1, y:2}, {x:2, y:2}, {x:7, y:2}, {x:3, y:3}, {x:1, y:5},
      {x:7, y:5}, {x:0, y:6}, {x:8, y:6}, {x:0, y:7}, {x:1, y:7}, {x:2, y:7},
      {x:7, y:7}, {x:8, y:7}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:4, y:4},
      {id:"ENCOUNTER_PLACEMENT_01", x:4, y:4},
      {id:"ENCOUNTER_PLACEMENT_02", x:5, y:4}
    ])
  });

  root.MAP_03_VISUAL = MAP_03_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_03_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
