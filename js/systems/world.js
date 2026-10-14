/* Small persistent world-state service: flags plus generic point inspection. */
(function(root){
  class WorldStateEngine{
    constructor({progressionProvider,questSystem,onChanged}={}){this.progressionProvider=progressionProvider||(()=>({flags:{}}));this.questSystem=questSystem||null;this.onChanged=onChanged||(()=>{});}
    progression(){const p=this.progressionProvider()||{};if(!p.flags)p.flags={};return p;}
    setQuestSystem(questSystem){this.questSystem=questSystem;return this;}
    hasFlag(flag){return this.progression().flags[flag]===true;}
    setFlag(flag,value=true){if(typeof flag!=='string'||!flag)return {ok:false,reason:'INVALID_FLAG'};const next=value===true,previous=this.hasFlag(flag);this.progression().flags[flag]=next;if(previous!==next)this.onChanged({type:'WORLD_FLAG_CHANGED',flag,value:next});return {ok:true,flag,value:next,changed:previous!==next};}
    clearFlag(flag){return this.setFlag(flag,false);}
    inspect(pointId,{flag,questEvent=true,eventId}={}){if(typeof pointId!=='string'||!pointId)return {ok:false,reason:'INVALID_POINT'};const event={type:'POINT_INSPECTED',pointId,eventId:eventId||`point:${pointId}`};const changed=this.questSystem&&questEvent?this.questSystem.recordEvent(event):false;const flagResult=flag?this.setFlag(flag,true):{ok:true,changed:false};this.onChanged({type:'POINT_INSPECTED',pointId,flag:flag||null,questChanged:changed});return {ok:true,pointId,event,questChanged:changed,flagChanged:!!flagResult.changed};}
  }
  root.WorldState={WorldStateEngine,createWorldState:options=>new WorldStateEngine(options)};if(typeof module!=='undefined')module.exports=root.WorldState;
})(globalThis);
