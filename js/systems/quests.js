/* Generic event-driven quest engine. It has no DOM, combat or map dependencies. */
(function(root){
  const QUEST_STATES=Object.freeze({LOCKED:'LOCKED',AVAILABLE:'AVAILABLE',ACTIVE:'ACTIVE',COMPLETED:'COMPLETED'});
  const EVENT_TYPES=Object.freeze({MOB_KILLED:'MOB_KILLED',ITEM_ACQUIRED:'ITEM_ACQUIRED',MAP_VISITED:'MAP_VISITED',NPC_TALKED:'NPC_TALKED',BOSS_RESOLVED:'BOSS_RESOLVED',ENCOUNTER_RESOLVED:'ENCOUNTER_RESOLVED',POINT_INSPECTED:'POINT_INSPECTED'});
  const VALID_TYPES=new Set(['KILL','COLLECT','EXPLORE','TALK','BOSS','OR','ENCOUNTER','INSPECT']);
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
  const int=(v,fallback=0)=>Number.isFinite(Number(v))?Math.max(0,Math.trunc(Number(v))):fallback;

  class QuestEngine {
    constructor({questDb,progression,rewardSink,onChanged,flagSink,eventAdapter,flagProvider,inventoryProvider,autoComplete=true}={}){
      this.questDb=questDb||{}; this.progression=object(progression); this.rewardSink=rewardSink||(()=>{}); this.flagSink=flagSink||(()=>{}); this.flagProvider=flagProvider||(()=>false); this.inventoryProvider=inventoryProvider||(()=>({})); this.eventAdapter=eventAdapter|| (event=>event); this.onChanged=onChanged||(()=>{}); this.autoComplete=autoComplete!==false;
      this.normalizeProgression();
    }
    normalizeProgression(){
      Object.keys(this.progression).forEach(id=>{if(!this.questDb[id])delete this.progression[id];});
      Object.entries(this.questDb).forEach(([id,quest])=>{
        const r=this.progression[id];
        if(!r)return;
        if(!['ACTIVE','COMPLETED'].includes(r.state)){delete this.progression[id];return;}
        r.progress=object(r.progress);r.seenEvents=object(r.seenEvents);r.rewardClaimed=r.state==='COMPLETED'||r.rewardClaimed===true;
        (quest.objectives||[]).forEach(o=>{if(o.id)r.progress[o.id]=Math.min(int(o.amount,1),int(r.progress[o.id],0));});
      });
    }
    setProgression(progression){this.progression=object(progression);this.normalizeProgression();}
    getDefinition(id){return this.questDb[id]||null;}
    getRecord(id){return this.progression[id]||null;}
    getQuestState(id){const q=this.getDefinition(id);if(!q)return QUEST_STATES.LOCKED;const r=this.getRecord(id);if(r&&r.state==='COMPLETED')return QUEST_STATES.COMPLETED;if(r&&r.state==='ACTIVE')return QUEST_STATES.ACTIVE;return this.isAvailable(id)?QUEST_STATES.AVAILABLE:QUEST_STATES.LOCKED;}
    requiredFlagsMet(q){return (q.requiredFlags||[]).every(flag=>this.flagProvider(flag)===true);}
    isAvailable(id){const q=this.getDefinition(id);if(!q)return false;const state=this.getQuestStateWithoutAvailability(id);if(state==='ACTIVE'||state==='COMPLETED')return false;return (q.prerequisites||[]).every(prereq=>this.getQuestStateWithoutAvailability(prereq)==='COMPLETED')&&this.requiredFlagsMet(q);}
    getQuestStateWithoutAvailability(id){const r=this.getRecord(id);return r&&r.state?r.state:QUEST_STATES.LOCKED;}
    objectiveProgress(record,objective){return int(record&&record.progress&&record.progress[objective.id],0);}
    createRecord(q){const progress={},owner=object(this.inventoryProvider()),inventory=object(owner.inventory||owner);(q.objectives||[]).forEach(o=>{if(!o.id||!VALID_TYPES.has(o.type))return;const initial=o.type==='COLLECT'?int(inventory[o.target],0):0;progress[o.id]=Math.min(int(o.amount,1),initial);});return {state:'ACTIVE',progress,seenEvents:{},rewardClaimed:false};}
    acceptQuest(id){if(!this.isAvailable(id))return false;this.progression[id]=this.createRecord(this.questDb[id]);this.onChanged({type:'QUEST_ACCEPTED',questId:id});return true;}
    getObjectiveViews(id){const q=this.getDefinition(id),r=this.getRecord(id);if(!q)return [];return (q.objectives||[]).map(o=>({id:o.id,type:o.type,target:o.target,label:o.label||o.type,current:Math.min(this.objectiveProgress(r,o),int(o.amount,1)),required:int(o.amount,1),complete:this.objectiveProgress(r,o)>=int(o.amount,1)}));}
    isComplete(id){const q=this.getDefinition(id),r=this.getRecord(id);if(!q||!r)return false;if(r.state==='COMPLETED')return true;const objectives=(q.objectives||[]).filter(o=>VALID_TYPES.has(o.type));return r.state==='ACTIVE'&&objectives.length>0&&objectives.every(o=>this.objectiveProgress(r,o)>=int(o.amount,1));}
    matches(objective,event){
      if(objective.type==='KILL')return event.type===EVENT_TYPES.MOB_KILLED&&event.mobType===objective.target;
      if(objective.type==='BOSS'){if(objective.requireNonLethal===true&&!(event.type===EVENT_TYPES.BOSS_RESOLVED&&event.resolution==='NON_LETHAL'&&event.nonLethal===true))return false;return (event.type==='BOSS_KILLED'||event.type===EVENT_TYPES.BOSS_RESOLVED||event.type===EVENT_TYPES.MOB_KILLED)&&(!objective.target||event.mobType===objective.target||event.bossId===objective.target||event.creatureId===objective.target);}
      if(objective.type==='COLLECT')return event.type===EVENT_TYPES.ITEM_ACQUIRED&&event.itemId===objective.target;
      if(objective.type==='EXPLORE')return event.type===EVENT_TYPES.MAP_VISITED&&event.mapId===objective.target;
      if(objective.type==='TALK')return event.type===EVENT_TYPES.NPC_TALKED&&event.npcId===objective.target;
      if(objective.type==='ENCOUNTER')return event.type===EVENT_TYPES.ENCOUNTER_RESOLVED&&(!objective.target||event.encounterId===objective.target);
      if(objective.type==='INSPECT')return event.type===EVENT_TYPES.POINT_INSPECTED&&(!objective.target||event.pointId===objective.target);
      if(objective.type==='OR')return (objective.alternatives||[]).some(alternative=>this.matches(alternative,event));
      return false;
    }
    recordEvent(event={}){
      event=this.eventAdapter(event)||event;
      let changed=false;
      Object.entries(this.progression).forEach(([id,record])=>{
        const q=this.questDb[id];if(!q||record.state!=='ACTIVE')return;
        const eventId=event.eventId;
        if(eventId&&record.seenEvents&&record.seenEvents[eventId])return;
        if(eventId){record.seenEvents=record.seenEvents||{};record.seenEvents[eventId]=true;}
        (q.objectives||[]).forEach(o=>{if(!VALID_TYPES.has(o.type)||!this.matches(o,event))return;const needed=int(o.amount,1),old=this.objectiveProgress(record,o),delta=o.type==='EXPLORE'||o.type==='TALK'||o.type==='OR'||o.type==='ENCOUNTER'||o.type==='INSPECT'?1:int(event.amount,1);const next=Math.min(needed,old+delta);if(next!==old){record.progress[o.id]=next;changed=true;}});
        if(this.autoComplete&&this.isComplete(id)) this.completeQuest(id);
      });
      if(changed)this.onChanged({type:'QUEST_PROGRESS',event});
      return changed;
    }
    completeQuest(id){if(!this.isComplete(id)||this.getQuestStateWithoutAvailability(id)!=='ACTIVE')return false;const r=this.progression[id];if(r.rewardClaimed)return false;r.state='COMPLETED';r.rewardClaimed=true;const q=this.questDb[id];this.rewardSink(q.rewards||{},q);if(q.worldFlagReward)this.flagSink(q.worldFlagReward,q);this.onChanged({type:'QUEST_COMPLETED',questId:id});return true;}
    getActiveQuests(){return Object.entries(this.questDb).filter(([id])=>this.getQuestState(id)==='ACTIVE').map(([id,q])=>({quest:q,state:'ACTIVE',objectives:this.getObjectiveViews(id)}));}
    getAvailableQuests(){return Object.entries(this.questDb).filter(([id])=>this.isAvailable(id)).map(([id,q])=>({quest:q,state:'AVAILABLE',objectives:this.getObjectiveViews(id)}));}
    getCompletedQuests(){return Object.entries(this.questDb).filter(([id])=>this.getQuestState(id)==='COMPLETED').map(([id,q])=>({quest:q,state:'COMPLETED',objectives:this.getObjectiveViews(id)}));}
  }
  const api={QUEST_STATES,EVENT_TYPES,QuestEngine,createQuestSystem:options=>new QuestEngine(options)};
  root.QuestSystem=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
