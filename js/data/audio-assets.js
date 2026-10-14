/* V7C selected, local Kenney sound effects. No archive or preview dependency. */
(function(root){
  const PACKAGES=Object.freeze({
    UI:Object.freeze({id:'kenney_ui-audio',directory:'audio/kenney/ui',license:'audio/kenney/ui/License.txt'}),
    RPG:Object.freeze({id:'kenney_rpg-audio',directory:'audio/kenney/rpg',license:'audio/kenney/rpg/License.txt'})
  });
  const definitions={
    SFX_UI_CLICK:['UI','click1.ogg'],SFX_UI_HOVER:['UI','rollover1.ogg'],SFX_UI_CONFIRM:['UI','switch1.ogg'],SFX_UI_CANCEL:['UI','switch2.ogg'],
    SFX_FOOTSTEP_01:['RPG','footstep00.ogg'],SFX_FOOTSTEP_02:['RPG','footstep01.ogg'],SFX_FOOTSTEP_03:['RPG','footstep02.ogg'],SFX_FOOTSTEP_04:['RPG','footstep03.ogg'],
    SFX_ATTACK_LIGHT:['RPG','knifeSlice.ogg'],SFX_ATTACK_ALT:['RPG','knifeSlice2.ogg'],SFX_ACTION_DRAW:['RPG','drawKnife1.ogg'],SFX_IMPACT:['RPG','metalClick.ogg'],
    SFX_COINS:['RPG','handleCoins.ogg'],SFX_INVENTORY:['RPG','handleSmallLeather.ogg'],SFX_BOOK_OPEN:['RPG','bookOpen.ogg'],SFX_BOOK_CLOSE:['RPG','bookClose.ogg']
  };
  const ASSETS=Object.freeze(Object.fromEntries(Object.entries(definitions).map(([id,[pack,file]])=>[id,Object.freeze({id,src:`${PACKAGES[pack].directory}/${file}`,packageId:PACKAGES[pack].id,file})])));
  const get=id=>ASSETS[id]||null;
  function validateManifest(){const ids=Object.keys(ASSETS);const invalid=ids.filter(id=>!ASSETS[id].src||ASSETS[id].src.startsWith('/')||/\.zip|Preview/i.test(ASSETS[id].src));return {ok:ids.length===16&&new Set(ids).size===ids.length&&!invalid.length,ids,invalid};}
  const api=Object.freeze({PACKAGES,ASSETS,ids:Object.freeze(Object.keys(ASSETS)),get,validateManifest});root.AudioAssets=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
