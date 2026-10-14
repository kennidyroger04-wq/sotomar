/* MAP_01 — Caieira. External visual/logical layout data, kept data-only. */
(function(root){
  "use strict";
  const MAP_01_VISUAL=Object.freeze({
    mapId:"MAP_01",
    dimensions:Object.freeze({width:12,height:10}),
    baseFloorAssetId:"VIS_GRASS_BASE",
    floorOverrides:Object.freeze([
      {x:5,y:4,assetId:"VIS_DIRT_BASE"},{x:6,y:4,assetId:"VIS_DIRT_BASE"},{x:5,y:5,assetId:"VIS_DIRT_BASE"},{x:6,y:5,assetId:"VIS_DIRT_BASE"},{x:7,y:5,assetId:"VIS_DIRT_BASE"},{x:6,y:6,assetId:"VIS_DIRT_BASE"},
      {x:5,y:1,assetId:"VIS_DIRT_BASE"},{x:6,y:1,assetId:"VIS_DIRT_BASE"},{x:7,y:1,assetId:"VIS_DIRT_BASE"},
      {x:1,y:5,assetId:"VIS_DIRT_BASE"},{x:1,y:6,assetId:"VIS_DIRT_BASE"},{x:2,y:6,assetId:"VIS_DIRT_BASE"},{x:1,y:7,assetId:"VIS_DIRT_BASE"},
      {x:8,y:5,assetId:"VIS_DIRT_PATH"},{x:9,y:5,assetId:"VIS_DIRT_PATH"},{x:10,y:5,assetId:"VIS_DIRT_PATH"},{x:11,y:5,assetId:"VIS_DIRT_PATH"},
      {x:6,y:7,assetId:"VIS_DIRT_PATH"},{x:6,y:8,assetId:"VIS_DIRT_PATH"},{x:6,y:9,assetId:"VIS_DIRT_PATH"},
      {x:6,y:3,assetId:"VIS_DIRT_PATH"},{x:6,y:2,assetId:"VIS_DIRT_PATH"},
      {x:4,y:5,assetId:"VIS_DIRT_PATH"},{x:3,y:5,assetId:"VIS_DIRT_PATH"},{x:2,y:5,assetId:"VIS_DIRT_PATH"},
      {x:2,y:4,assetId:"VIS_DIRT_PATH"},{x:2,y:3,assetId:"VIS_DIRT_PATH"},{x:2,y:2,assetId:"VIS_DIRT_PATH"},{x:1,y:2,assetId:"VIS_DIRT_PATH"},
      {x:10,y:0,assetId:"VIS_WATER"},{x:11,y:0,assetId:"VIS_WATER"},{x:11,y:1,assetId:"VIS_WATER"},{x:9,y:0,assetId:"VIS_WATER_EDGE"},{x:10,y:1,assetId:"VIS_WATER_EDGE"},{x:11,y:2,assetId:"VIS_WATER_EDGE"}
    ]),
    props:Object.freeze([
      {id:"map01-house-01",assetId:"VIS_HOUSE_SMALL",x:4,y:2,blocking:true,label:"house-north"},
      {id:"map01-house-02",assetId:"VIS_HOUSE_SMALL",x:10,y:3,blocking:true,label:"house-east"},
      {id:"map01-house-03",assetId:"VIS_HOUSE_SMALL",x:2,y:9,blocking:true,label:"house-southwest"},
      {id:"map01-masonry-01",assetId:"VIS_MASONRY_STRUCTURE",x:5,y:9,blocking:true,label:"masonry-south"},
      {id:"map01-wall-01",assetId:"VIS_LOW_WALL",x:7,y:9,blocking:true,label:"wall-south"},
      {id:"map01-wall-02",assetId:"VIS_LOW_WALL",x:0,y:5,blocking:true,label:"wall-west"},
      {id:"map01-wall-03",assetId:"VIS_LOW_WALL",x:0,y:6,blocking:true,label:"wall-west"},
      {id:"map01-wall-04",assetId:"VIS_LOW_WALL",x:0,y:7,blocking:true,label:"wall-west"},
      {id:"map01-tree-01",assetId:"VIS_TREE_SMALL",x:0,y:0,blocking:true},{id:"map01-tree-02",assetId:"VIS_TREE_SMALL",x:0,y:1,blocking:true},{id:"map01-tree-03",assetId:"VIS_TREE_SMALL",x:0,y:3,blocking:true},
      {id:"map01-tree-04",assetId:"VIS_TREE_SMALL",x:8,y:0,blocking:true},{id:"map01-tree-05",assetId:"VIS_TREE_SMALL",x:11,y:3,blocking:true},{id:"map01-tree-06",assetId:"VIS_TREE_SMALL",x:11,y:7,blocking:true},
      {id:"map01-tree-07",assetId:"VIS_TREE_SMALL",x:10,y:8,blocking:true},{id:"map01-tree-08",assetId:"VIS_TREE_SMALL",x:4,y:9,blocking:true},{id:"map01-tree-09",assetId:"VIS_TREE_SMALL",x:8,y:9,blocking:true},
      {id:"map01-rocks-01",assetId:"VIS_ROCKS_GRASS",x:7,y:0,blocking:false},{id:"map01-rocks-02",assetId:"VIS_ROCKS_GRASS",x:3,y:7,blocking:false},{id:"map01-rocks-03",assetId:"VIS_ROCKS_GRASS",x:9,y:6,blocking:false},{id:"map01-rocks-04",assetId:"VIS_ROCKS_GRASS",x:5,y:7,blocking:false}
    ]),
    blockedCells:Object.freeze([
      {x:4,y:2},{x:3,y:2},{x:10,y:3},{x:9,y:3},{x:2,y:9},{x:1,y:9},{x:5,y:9},{x:7,y:9},{x:0,y:5},{x:0,y:6},{x:0,y:7},
      {x:0,y:0},{x:0,y:1},{x:0,y:3},{x:8,y:0},{x:11,y:3},{x:11,y:7},{x:10,y:8},{x:4,y:9},{x:8,y:9},{x:10,y:0},{x:11,y:0},{x:11,y:1}
    ]),
    reservedCells:Object.freeze([{id:"SPAWN_DEFAULT",x:6,y:5},{id:"EXIT_MAP_02",x:11,y:5},{id:"EXIT_CARROCAL",x:6,y:9}])
  });
  root.MAP_01_VISUAL=MAP_01_VISUAL;
  if(typeof module!=="undefined")module.exports=MAP_01_VISUAL;
})(typeof globalThis!=="undefined"?globalThis:this);
