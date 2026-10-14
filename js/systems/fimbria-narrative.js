/* Pequeno adaptador narrativo pós-Sineira. Reutiliza QuestSystem e WorldState. */
(function(root){
  const canonical=root.FIMBRIA_CANONICAL||(typeof FIMBRIA_CANONICAL!=='undefined'?FIMBRIA_CANONICAL:null);
  const IDS=Object.freeze({boss:'CRE_SINEIRA',seal:'SELO_CENTRAL',resolvedFlag:'FLAG_SINEIRA_RESOLVED',sealFlag:'FLAG_SEAL_INSPECTED',decalque:'QITEM_DECALQUE_DO_SELO'});
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};

  class FimbriaNarrativeAdapter{
    constructor({questSystem,worldState,inventoryProvider,itemSink,onChanged}={}){
      this.questSystem=questSystem||null;this.worldState=worldState||null;this.inventoryProvider=inventoryProvider||(()=>({inventory:{}}));this.itemSink=itemSink||(({itemId,amount})=>{const owner=object(this.inventoryProvider()),inventory=owner.inventory||owner;inventory[itemId]=(Number(inventory[itemId])||0)+Math.max(1,Number(amount)||1);});this.onChanged=onChanged||(()=>{});
    }
    flags(){return this.worldState&&this.worldState.progression?this.worldState.progression().flags||{}:{};}
    canInspectSeal(){return !!(this.worldState&&this.worldState.hasFlag(IDS.resolvedFlag));}
    handleBossResolved(event={}){
      if(event.type!=='BOSS_RESOLVED')return {ok:false,reason:'EVENT_TYPE'};
      if(event.bossId!==IDS.boss)return {ok:false,reason:'BOSS_ID'};
      if(event.resolution!=='NON_LETHAL'||event.nonLethal!==true)return {ok:false,reason:'INVALID_RESOLUTION'};
      if(!this.worldState)return {ok:false,reason:'WORLD_STATE'};
      if(this.worldState.hasFlag(IDS.resolvedFlag))return {ok:false,reason:'ALREADY_RESOLVED',duplicate:true};
      const flag=this.worldState.setFlag(IDS.resolvedFlag,true);
      const questChanged=this.questSystem?this.questSystem.recordEvent({...event,eventId:event.eventId||`boss:${IDS.boss}:resolved`}):false;
      this.onChanged({type:'SINEIRA_RESOLVED',flag,questChanged});
      return {ok:true,flagChanged:!!flag.changed,questChanged,logicalState:this.logicalState()};
    }
    inspectSeal({eventId}={}){
      if(!this.canInspectSeal())return {ok:false,reason:'SINEIRA_NOT_RESOLVED'};
      if(!this.worldState)return {ok:false,reason:'WORLD_STATE'};
      const already=this.worldState.hasFlag(IDS.sealFlag);
      const inspection=this.worldState.inspect(IDS.seal,{flag:IDS.sealFlag,eventId:eventId||`point:${IDS.seal}`});
      if(!inspection.ok)return inspection;
      let itemGranted=false;
      const owner=object(this.inventoryProvider()),inventory=owner.inventory||owner;
      if(!already&&!Number(inventory[IDS.decalque])){this.itemSink({itemId:IDS.decalque,amount:1});itemGranted=true;if(this.questSystem)this.questSystem.recordEvent({type:'ITEM_ACQUIRED',itemId:IDS.decalque,amount:1,eventId:`item:${IDS.decalque}`});}
      const main07Completed=!!(this.questSystem&&this.questSystem.isComplete('MAIN_07')&&this.questSystem.completeQuest('MAIN_07'));
      this.onChanged({type:'SEAL_INSPECTED',inspection,itemGranted,main07Completed});
      return {ok:true,inspection,itemGranted,main07Completed,duplicate:already,logicalState:this.logicalState()};
    }
    logicalState(){return {sineiraResolved:!!(this.worldState&&this.worldState.hasFlag(IDS.resolvedFlag)),sineiraAlive:true,blocksSeal:!this.canInspectSeal(),exit:'UNKNOWN'};}
  }
  const api={IDS,FimbriaNarrativeAdapter,createNarrativeAdapter:options=>new FimbriaNarrativeAdapter(options)};
  root.FimbriaNarrative=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
