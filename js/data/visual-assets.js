/* Visual V4: explicit, presentation-only selections from the supplied Kenney packs. */
(function(root){
  const PACKAGES=Object.freeze({
    SKETCH_TOWN:{id:'kenney_sketch-town',directory:'assets/vendor/kenney/sketch-town',license:'assets/vendor/kenney/sketch-town/License.txt'},
    ISOMETRIC_LANDSCAPE:{id:'kenney_isometric-landscape',directory:'assets/vendor/kenney/isometric-landscape',license:'assets/vendor/kenney/isometric-landscape/License.txt'},
    ISOMETRIC_BUILDINGS:{id:'kenney_isometric-buildings',directory:'assets/vendor/kenney/isometric-buildings',license:'assets/vendor/kenney/isometric-buildings/License.txt'}
  });
  const asset=(src,packageId,category,anchor,scale,widthTiles)=>Object.freeze({src,packageId,category,anchor:Object.freeze(anchor),scale,widthTiles});
  const ASSETS=Object.freeze({
    VIS_GRASS_BASE:asset('assets/vendor/kenney/sketch-town/Tiles/grass_center_E.png','kenney_sketch-town','terrain',{x:0.5,y:1},1,1),
    VIS_DIRT_BASE:asset('assets/vendor/kenney/sketch-town/Tiles/dirt_center_E.png','kenney_sketch-town','terrain',{x:0.5,y:1},1,1),
    VIS_DIRT_PATH:asset('assets/vendor/kenney/sketch-town/Tiles/grass_path_E.png','kenney_sketch-town','path',{x:0.5,y:1},1,1),
    VIS_WATER:asset('assets/vendor/kenney/sketch-town/Tiles/water_center_E.png','kenney_sketch-town','water',{x:0.5,y:1},1,1),
    VIS_WATER_EDGE:asset('assets/vendor/kenney/isometric-landscape/PNG/landscapeTiles_043.png','kenney_isometric-landscape','water-edge',{x:0.5,y:1},1,1),
    VIS_TREE_SMALL:asset('assets/vendor/kenney/sketch-town/Tiles/tree_single_E.png','kenney_sketch-town','vegetation',{x:0.5,y:1},1,1.45),
    VIS_ROCKS_GRASS:asset('assets/vendor/kenney/sketch-town/Tiles/rocks_grass_E.png','kenney_sketch-town','prop',{x:0.5,y:1},1,1.1),
    VIS_HOUSE_SMALL:asset('assets/vendor/kenney/sketch-town/Tiles/building_centerBeige_E.png','kenney_sketch-town','building',{x:0.5,y:1},1,1.8),
    VIS_BRIDGE:asset('assets/vendor/kenney/sketch-town/Tiles/bridge_E.png','kenney_sketch-town','bridge',{x:0.5,y:1},1,1.3),
    VIS_LOW_WALL:asset('assets/vendor/kenney/sketch-town/Tiles/castle_wall_E.png','kenney_sketch-town','wall',{x:0.5,y:1},1,1.25),
    VIS_MASONRY_STRUCTURE:asset('assets/vendor/kenney/isometric-buildings/PNG/buildingTiles_032.png','kenney_isometric-buildings','structure',{x:0.5,y:1},1,1.35)
  });
  const map01Layout=root.MAP_01_VISUAL||null;
  const MAP_LAYOUTS=Object.freeze({MAP_01:map01Layout,MAP_02:root.MAP_02_VISUAL||null,MAP_03:root.MAP_03_VISUAL||null,MAP_04:root.MAP_04_VISUAL||null,MAP_05:root.MAP_05_VISUAL||null,MAP_06:root.MAP_06_VISUAL||null,MAP_07:root.MAP_07_VISUAL||null,MAP_08:root.MAP_08_VISUAL||null,MAP_09:root.MAP_09_VISUAL||null,MAP_10:root.MAP_10_VISUAL||null,MAP_11:root.MAP_11_VISUAL||null});
  const floorOverrides=Object.freeze({
    '1,8':'VIS_DIRT_PATH','2,7':'VIS_DIRT_PATH','3,6':'VIS_DIRT_PATH','4,5':'VIS_DIRT_PATH','5,4':'VIS_DIRT_PATH',
    '6,3':'VIS_WATER','7,3':'VIS_WATER','8,3':'VIS_WATER','7,4':'VIS_WATER_EDGE','8,4':'VIS_WATER_EDGE',
    '6,4':'VIS_BRIDGE','10,8':'VIS_DIRT_BASE'
  });
  const LEGACY_PROOF=Object.freeze({
    status:'PROOF_ONLY',mapId:'MAP_01',baseFloorAssetId:'VIS_GRASS_BASE',floorOverrides,
    props:Object.freeze([
      Object.freeze({id:'v4-tree-back',assetId:'VIS_TREE_SMALL',x:3,y:3}),
      Object.freeze({id:'v4-house',assetId:'VIS_HOUSE_SMALL',x:9,y:3}),
      Object.freeze({id:'v4-stone',assetId:'VIS_ROCKS_GRASS',x:4,y:7}),
      Object.freeze({id:'v4-wall',assetId:'VIS_LOW_WALL',x:10,y:5}),
      Object.freeze({id:'v4-masonry',assetId:'VIS_MASONRY_STRUCTURE',x:10,y:4}),
      Object.freeze({id:'v4-tree-front',assetId:'VIS_TREE_SMALL',x:9,y:7})
    ])
  });
  const ACTIVE_LAYOUT=map01Layout||LEGACY_PROOF;
  const REQUIRED_CATEGORIES=Object.freeze(['terrain','path','water','vegetation','prop','building','bridge','wall','structure']);
  const VALID_CATEGORIES=Object.freeze([...REQUIRED_CATEGORIES,'water-edge']);
  function get(id){return ASSETS[id]||null;}
  function proofForMap(mapId){return MAP_LAYOUTS[mapId]||(!MAP_LAYOUTS.MAP_01&&mapId===ACTIVE_LAYOUT.mapId?ACTIVE_LAYOUT:null);}
  function floorAssetId(mapId,x,y){const proof=proofForMap(mapId);if(!proof)return null;const key=`${x},${y}`,overrides=proof.floorOverrides;const override=Array.isArray(overrides)?overrides.find(entry=>entry.x===x&&entry.y===y):null;return override?override.assetId:(!Array.isArray(overrides)&&overrides[key])||proof.baseFloorAssetId;}
  function validateManifest(){
    const entries=Object.entries(ASSETS),ids=entries.map(([id])=>id),knownPackages=new Set(Object.values(PACKAGES).map(entry=>entry.id));
    const invalid=entries.filter(([id,entry])=>!id||!entry||typeof entry.src!=='string'||entry.src.startsWith('/')||/^[A-Za-z]:[\\/]/.test(entry.src)||!knownPackages.has(entry.packageId)||!VALID_CATEGORIES.includes(entry.category)||!entry.anchor||entry.anchor.x<0||entry.anchor.x>1||entry.anchor.y<0||entry.anchor.y>1||!(entry.scale>0)||!(entry.widthTiles>0)).map(([id])=>id);
    const layouts=Object.values(MAP_LAYOUTS).filter(Boolean),selectedLayouts=layouts.length?layouts:[ACTIVE_LAYOUT];
    const proofIds=selectedLayouts.flatMap(layout=>[layout.baseFloorAssetId,...(Array.isArray(layout.floorOverrides)?layout.floorOverrides.map(entry=>entry.assetId):Object.values(layout.floorOverrides)),...layout.props.map(entry=>entry.assetId)]);
    const missingProofIds=proofIds.filter(id=>!ASSETS[id]);
    return {ok:new Set(ids).size===ids.length&&!invalid.length&&!missingProofIds.length,ids,invalid,missingProofIds};
  }
  const api=Object.freeze({PACKAGES,ASSETS,PROOF:map01Layout?null:LEGACY_PROOF,MAP_01_LAYOUT:ACTIVE_LAYOUT,MAP_LAYOUTS,REQUIRED_CATEGORIES,VALID_CATEGORIES,get,proofForMap,floorAssetId,validateManifest});
  root.VisualAssets=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
