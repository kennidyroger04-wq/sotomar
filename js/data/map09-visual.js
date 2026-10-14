/*
 * MAP_09 — PEDRAS BRANCAS (9×8)
 * Dados de layout visual/lógico. Somente dados: sem DOM, sem gameplay.
 * Área opcional: terra pálida em losango, três marcos de alvenaria em triângulo, pedras espalhadas, pouca vegetação. Sem exits.
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
 *    y 0 T.......T
 *    y 1 .R..:..R.
 *    y 2 ..X:::X..
 *    y 3 .::::::R.
 *    y 4 .R::See:.
 *    y 5 ..:::::..
 *    y 6 ..R.X.R..
 *    y 7 T.......T
 */
(function(root){
  "use strict";

  const MAP_09_VISUAL = Object.freeze({
    mapId: "MAP_09",

    dimensions: Object.freeze({
      width: 9,
      height: 8
    }),

    baseFloorAssetId: "VIS_GRASS_BASE",

    floorOverrides: Object.freeze([
      {x:4, y:1, assetId:"VIS_DIRT_BASE"}, {x:2, y:2, assetId:"VIS_DIRT_BASE"}, {x:3, y:2, assetId:"VIS_DIRT_BASE"},
      {x:4, y:2, assetId:"VIS_DIRT_BASE"}, {x:5, y:2, assetId:"VIS_DIRT_BASE"}, {x:6, y:2, assetId:"VIS_DIRT_BASE"},
      {x:1, y:3, assetId:"VIS_DIRT_BASE"}, {x:2, y:3, assetId:"VIS_DIRT_BASE"}, {x:3, y:3, assetId:"VIS_DIRT_BASE"},
      {x:4, y:3, assetId:"VIS_DIRT_BASE"}, {x:5, y:3, assetId:"VIS_DIRT_BASE"}, {x:6, y:3, assetId:"VIS_DIRT_BASE"},
      {x:7, y:3, assetId:"VIS_DIRT_BASE"}, {x:1, y:4, assetId:"VIS_DIRT_BASE"}, {x:2, y:4, assetId:"VIS_DIRT_BASE"},
      {x:3, y:4, assetId:"VIS_DIRT_BASE"}, {x:4, y:4, assetId:"VIS_DIRT_BASE"}, {x:5, y:4, assetId:"VIS_DIRT_BASE"},
      {x:6, y:4, assetId:"VIS_DIRT_BASE"}, {x:7, y:4, assetId:"VIS_DIRT_BASE"}, {x:2, y:5, assetId:"VIS_DIRT_BASE"},
      {x:3, y:5, assetId:"VIS_DIRT_BASE"}, {x:4, y:5, assetId:"VIS_DIRT_BASE"}, {x:5, y:5, assetId:"VIS_DIRT_BASE"},
      {x:6, y:5, assetId:"VIS_DIRT_BASE"}, {x:4, y:6, assetId:"VIS_DIRT_BASE"}
    ]),

    props: Object.freeze([
      {id:"map09-masonry-01", assetId:"VIS_MASONRY_STRUCTURE", x:2, y:2, blocking:true, label:"masonry-northwest"},
      {id:"map09-masonry-02", assetId:"VIS_MASONRY_STRUCTURE", x:6, y:2, blocking:true, label:"masonry-northeast"},
      {id:"map09-masonry-03", assetId:"VIS_MASONRY_STRUCTURE", x:4, y:6, blocking:true, label:"masonry-south"},
      {id:"map09-tree-01", assetId:"VIS_TREE_SMALL", x:0, y:0, blocking:true},
      {id:"map09-tree-02", assetId:"VIS_TREE_SMALL", x:8, y:0, blocking:true},
      {id:"map09-tree-03", assetId:"VIS_TREE_SMALL", x:0, y:7, blocking:true},
      {id:"map09-tree-04", assetId:"VIS_TREE_SMALL", x:8, y:7, blocking:true},
      {id:"map09-rocks-01", assetId:"VIS_ROCKS_GRASS", x:1, y:1, blocking:false},
      {id:"map09-rocks-02", assetId:"VIS_ROCKS_GRASS", x:7, y:1, blocking:false},
      {id:"map09-rocks-03", assetId:"VIS_ROCKS_GRASS", x:7, y:3, blocking:false},
      {id:"map09-rocks-04", assetId:"VIS_ROCKS_GRASS", x:1, y:4, blocking:false},
      {id:"map09-rocks-05", assetId:"VIS_ROCKS_GRASS", x:2, y:6, blocking:false},
      {id:"map09-rocks-06", assetId:"VIS_ROCKS_GRASS", x:6, y:6, blocking:false}
    ]),

    blockedCells: Object.freeze([
      {x:0, y:0}, {x:8, y:0}, {x:2, y:2}, {x:6, y:2}, {x:4, y:6}, {x:0, y:7},
      {x:8, y:7}
    ]),

    reservedCells: Object.freeze([
      {id:"SPAWN_DEFAULT", x:4, y:4},
      {id:"ENCOUNTER_PLACEMENT_01", x:4, y:4},
      {id:"ENCOUNTER_PLACEMENT_02", x:5, y:4},
      {id:"ENCOUNTER_PLACEMENT_03", x:6, y:4}
    ])
  });

  root.MAP_09_VISUAL = MAP_09_VISUAL;

  if(typeof module !== "undefined"){
    module.exports = MAP_09_VISUAL;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
