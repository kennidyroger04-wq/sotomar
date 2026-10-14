/* Small DOM-free, presentation-only animation state and cell interpolation. */
(function(root){
  const STATES=Object.freeze({IDLE:'IDLE',WALK:'WALK',ATTACK:'ATTACK',HURT:'HURT',DEATH:'DEATH'});
  const VALID_STATES=new Set(Object.values(STATES));
  const positive=(value,fallback)=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):fallback;
  const frameAsset=frame=>typeof frame==='string'?frame:frame&&typeof frame.assetId==='string'?frame.assetId:null;
  class EntityAnimationSystem{
    constructor({assets={},walkDurationMs=160,actionDurationMs=240}={}){
      this.assets=assets;this.walkDurationMs=positive(walkDurationMs,160);this.actionDurationMs=positive(actionDurationMs,240);this.entities=new Map();this.cues=new Map();this.activeUnitId=null;
    }
    entry(id,assetId=null){
      if(!this.entities.has(id))this.entities.set(id,{assetId,state:STATES.IDLE,elapsed:0,duration:Infinity,segment:null,impulse:null});
      const item=this.entities.get(id);if(assetId)item.assetId=assetId;return item;
    }
    animation(item,state){const asset=item.assetId&&this.assets[item.assetId];return asset&&asset.animations&&asset.animations[state]||null;}
    setState(id,state,{assetId=null,durationMs=null}={}){
      if(!VALID_STATES.has(state))return {ok:false,reason:'INVALID_STATE'};
      const item=this.entry(id,assetId);item.state=state;item.elapsed=0;item.finished=false;item.segment=null;item.impulse=null;
      const metadata=this.animation(item,state),frames=metadata&&Array.isArray(metadata.frames)?metadata.frames.length:0;
      const frameDuration=metadata&&positive(metadata.frameDurationMs,0);
      item.duration=durationMs===null?(state===STATES.IDLE||metadata&&metadata.loop&&state!==STATES.DEATH?Infinity:frameDuration&&frames?frameDuration*frames:this.actionDurationMs):positive(durationMs,this.actionDurationMs);
      return {ok:true,state};
    }
    startMove(id,from,to,{assetId=null,durationMs=this.walkDurationMs}={}){
      if(!from||!to||![from.x,from.y,to.x,to.y].every(Number.isFinite))return {ok:false,reason:'INVALID_POSITION'};
      const item=this.entry(id,assetId);item.state=STATES.WALK;item.elapsed=0;item.finished=false;item.duration=positive(durationMs,this.walkDurationMs);
      item.segment={from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},duration:item.duration};return {ok:true};
    }
    advance(deltaMs){
      const delta=Math.max(0,Number(deltaMs)||0);this.entities.forEach(item=>{
        item.elapsed+=delta;
        if(item.segment&&item.elapsed>=item.segment.duration){item.segment=null;if(item.state!==STATES.ATTACK){item.state=STATES.IDLE;item.elapsed=0;item.duration=Infinity;}}
        else if(!item.segment&&item.state===STATES.DEATH&&item.elapsed>=item.duration)item.finished=true;
        else if(!item.segment&&item.state!==STATES.IDLE&&item.state!==STATES.DEATH&&item.elapsed>=item.duration){item.state=STATES.IDLE;item.elapsed=0;item.duration=Infinity;}
      });
      this.cues.forEach((list,id)=>{const remaining=list.map(cue=>({...cue,remaining:cue.remaining-delta})).filter(cue=>cue.remaining>0);if(remaining.length)this.cues.set(id,remaining);else this.cues.delete(id);});
    }
    state(id){return this.entry(id).state;}
    isDeathVisible(id){const item=this.entities.get(id);return !!item&&item.state===STATES.DEATH&&!item.finished;}
    position(id,logicalPosition){const item=this.entities.get(id);if(!item||!item.segment)return logicalPosition;const segment=item.segment,raw=Math.min(1,item.elapsed/segment.duration),t=raw*raw*(3-2*raw);return {x:segment.from.x+(segment.to.x-segment.from.x)*t,y:segment.from.y+(segment.to.y-segment.from.y)*t};}
    visualOffset(id){const item=this.entities.get(id);if(!item||!item.impulse||![STATES.ATTACK,STATES.HURT].includes(item.state))return {x:0,y:0};const progress=Math.min(1,item.elapsed/item.duration),push=item.state===STATES.HURT?0.12*Math.sin(progress*Math.PI):progress<0.45?0.22*progress/0.45:-0.055*(progress-0.45)/0.55;return {x:item.impulse.x*push,y:item.impulse.y*push};}
    opacity(id){const item=this.entities.get(id);if(!item||item.state!==STATES.DEATH)return 1;return Math.max(0,1-item.elapsed/Math.max(1,item.duration));}
    setActiveUnit(id){this.activeUnitId=id||null;}
    activeUnit(){return this.activeUnitId;}
    reset(){this.entities.clear();this.cues.clear();this.activeUnitId=null;}
    triggerFeedback(id,type,{durationMs=420,detail=null}={}){if(!id||!type)return;const list=this.cues.get(id)||[];list.push({type,detail,remaining:positive(durationMs,420)});this.cues.set(id,list);}
    feedbackFor(id){return (this.cues.get(id)||[]).map(cue=>({...cue}));}
    frameAssetId(id,baseAssetId){
      const item=this.entry(id,baseAssetId),available=state=>{const def=this.animation(item,state);return def&&Array.isArray(def.frames)&&def.frames.length?def:null;};
      let selected=available(item.state),selectedState=item.state;
      if(!selected){selected=available(STATES.IDLE);selectedState=STATES.IDLE;}
      if(!selected)return baseAssetId||null;
      const frameMs=positive(selected.frameDurationMs,selected.loop?120:(item.duration/selected.frames.length)||120);
      const index=selected.loop?Math.floor(item.elapsed/frameMs)%selected.frames.length:Math.min(selected.frames.length-1,Math.floor(item.elapsed/frameMs));
      return frameAsset(selected.frames[index])||frameAsset(selected.frames[0])||baseAssetId||null;
    }
    applyCombatEvents(events,resolveActor,assetIdForActor=()=>null){
      const attacks=[];
      (events||[]).forEach(event=>{
        const actor=event.actorId&&resolveActor(event.actorId),target=event.targetId&&resolveActor(event.targetId),source=event.sourceId&&resolveActor(event.sourceId);
        if(event.type==='ABILITY_CAST'&&actor){attacks.push({actor,target:event.target});if(event.target)this.triggerFeedback(`cell:${event.target.x},${event.target.y}`,'target',{durationMs:320});}
        else if(event.type==='UNIT_MOVED'&&actor)this.startMove(actor.id,event.from,event.to,{assetId:assetIdForActor(actor)});
        else if(event.type==='DAMAGE_APPLIED'&&target){this.setState(target.id,STATES.HURT,{assetId:assetIdForActor(target)});const dx=target.x-(actor&&actor.x||0),dy=target.y-(actor&&actor.y||0),length=Math.hypot(dx,dy)||1;this.entry(target.id).impulse={x:dx/length,y:dy/length};this.triggerFeedback(target.id,'hit',{durationMs:380,detail:event.amount});}
        else if(event.type==='HEAL_APPLIED'&&target)this.triggerFeedback(target.id,'heal',{durationMs:520,detail:event.amount});
        else if(event.type==='STATUS_APPLIED'&&target)this.triggerFeedback(target.id,'status',{durationMs:900,detail:event.statusId});
        else if(event.type==='UNIT_DIED'&&target&&target.nonLethalBoss!==true){this.setState(target.id,STATES.DEATH,{assetId:assetIdForActor(target)});this.triggerFeedback(target.id,'death',{durationMs:this.actionDurationMs});}
        else if(event.type==='BOSS_CRITICAL'&&target){this.setState(target.id,STATES.HURT,{assetId:assetIdForActor(target)});const dx=target.x-(source&&source.x||0),dy=target.y-(source&&source.y||0),length=Math.hypot(dx,dy)||1;this.entry(target.id).impulse={x:dx/length,y:dy/length};this.triggerFeedback(target.id,'recoil',{durationMs:420});}
        else if(event.type==='BOSS_RESOLVED'&&event.bossId)this.setState(event.bossId,STATES.IDLE);
      });
      attacks.forEach(({actor,target})=>{const item=this.entry(actor.id,assetIdForActor(actor)),segment=item.segment,dx=Number(target&&target.x)-actor.x,dy=Number(target&&target.y)-actor.y,length=Math.hypot(dx,dy)||1;this.setState(actor.id,STATES.ATTACK,{assetId:assetIdForActor(actor)});item.segment=segment;item.impulse={x:dx/length,y:dy/length};});
    }
  }
  const api=Object.freeze({STATES,EntityAnimationSystem,create:options=>new EntityAnimationSystem(options)});
  root.EntityAnimation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
