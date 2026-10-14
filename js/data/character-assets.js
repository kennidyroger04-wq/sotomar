/* Visual V6A: provisional character/creature sprites from the supplied Tiny Dungeon pack. */
(function(root){
  const PACKAGE=Object.freeze({id:'kenney_tiny-dungeon',directory:'assets/vendor/kenney/tiny-dungeon',license:'assets/vendor/kenney/tiny-dungeon/License.txt'});
  const sprite=(src,category,animations=null)=>{
    const entry={src,packageId:PACKAGE.id,category,anchor:Object.freeze({x:0.5,y:1}),scale:0.95,widthTiles:0.9};
    if(animations)entry.animations=Object.freeze(Object.fromEntries(Object.entries(animations).map(([state,animation])=>[state,Object.freeze({...animation,frames:Object.freeze([...(animation.frames||[])])})])));
    return Object.freeze(entry);
  };
  const base='assets/vendor/kenney/tiny-dungeon/Tiles/';
  const ASSETS=Object.freeze({
    VIS_CHAR_PLAYER:sprite(`${base}tile_0087.png`,'player'),
    VIS_NPC_MIRA:sprite(`${base}tile_0084.png`,'npc'),
    VIS_NPC_LIA:sprite(`${base}tile_0099.png`,'npc'),
    VIS_NPC_NILO:sprite(`${base}tile_0088.png`,'npc'),
    VIS_NPC_BRAM:sprite(`${base}tile_0100.png`,'npc'),
    VIS_CRE_CASCUDO:sprite(`${base}tile_0108.png`,'creature'),
    VIS_CRE_PAPA_MEL:sprite(`${base}tile_0110.png`,'creature'),
    VIS_CRE_TOPETAO:sprite(`${base}tile_0120.png`,'creature'),
    VIS_CRE_FIANDEIRA:sprite(`${base}tile_0123.png`,'creature')
  });
  const NPC_SPRITES=Object.freeze({guarda_mira:'VIS_NPC_MIRA',exploradora_lia:'VIS_NPC_LIA',curandeiro_nilo:'VIS_NPC_NILO',mercador_bram:'VIS_NPC_BRAM'});
  const CREATURE_SPRITES=Object.freeze({CRE_CASCUDO_DE_CAL:'VIS_CRE_CASCUDO',CRE_PAPA_MEL:'VIS_CRE_PAPA_MEL',CRE_TOPETAO:'VIS_CRE_TOPETAO',CRE_FIANDEIRA:'VIS_CRE_FIANDEIRA'});
  function get(id){return ASSETS[id]||null;}
  function spriteForNpc(id){return NPC_SPRITES[id]||null;}
  function spriteForCreature(id){return CREATURE_SPRITES[id]||null;}
  function validateManifest(){
    const entries=Object.entries(ASSETS),ids=entries.map(([id])=>id),categories=new Set(['player','npc','creature']);
    const invalid=entries.filter(([id,entry])=>!id||!entry||typeof entry.src!=='string'||entry.src.startsWith('/')||/^[A-Za-z]:[\\/]/.test(entry.src)||entry.packageId!==PACKAGE.id||!categories.has(entry.category)||entry.anchor.x<0||entry.anchor.x>1||entry.anchor.y<0||entry.anchor.y>1||!(entry.scale>0)||!(entry.widthTiles>0)||entry.animations&&Object.entries(entry.animations).some(([state,animation])=>!['IDLE','WALK','ATTACK','HURT','DEATH'].includes(state)||!Array.isArray(animation.frames)||!animation.frames.length||animation.frames.some(frame=>{const assetId=typeof frame==='string'?frame:frame&&frame.assetId;return !ASSETS[assetId];}))).map(([id])=>id);
    return {ok:new Set(ids).size===ids.length&&!invalid.length,ids,invalid};
  }
  const api=Object.freeze({PACKAGE,ASSETS,NPC_SPRITES,CREATURE_SPRITES,ids:Object.freeze(Object.keys(ASSETS)),PLAYER_ID:'VIS_CHAR_PLAYER',get,spriteForNpc,spriteForCreature,validateManifest});
  root.CharacterAssets=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
