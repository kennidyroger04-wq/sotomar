/* NPC lookup, distance validation and services. Dialogue rendering stays in main.js. */
(function(root){
  const ROLES=Object.freeze({QUEST:'QUEST',HEALER:'HEALER',MERCHANT:'MERCHANT',GENERIC:'GENERIC'});
  const int=(v,d=0)=>Number.isFinite(Number(v))?Math.trunc(Number(v)):d;
  class NpcEngine {
    constructor({npcDb,questSystem,worldProvider,playerProvider,onChanged,mapIdResolver}={}){
      this.npcDb=npcDb||{};this.questSystem=questSystem;this.worldProvider=worldProvider||(()=>({}));this.playerProvider=playerProvider||(()=>null);this.onChanged=onChanged||(()=>{});this.mapIdResolver=mapIdResolver||((mapId)=>mapId);this.interactionSequence=0;
    }
    mapId(mapId){return this.mapIdResolver(mapId);}
    getDefinition(id){return this.npcDb[id]||null;}
    listForMap(mapId){const resolved=this.mapId(mapId);return Object.values(this.npcDb).filter(n=>this.mapId(n.mapId)===resolved);}
    getAt(mapId,x,y){return this.listForMap(mapId).find(n=>n.position.x===x&&n.position.y===y)||null;}
    isOccupied(mapId,x,y){return !!this.getAt(mapId,x,y);}
    distanceTo(npcId,mapId,position){const n=this.getDefinition(npcId);if(!n||this.mapId(n.mapId)!==this.mapId(mapId))return Infinity;return Math.abs(n.position.x-position.x)+Math.abs(n.position.y-position.y);}
    canInteract(npcId,mapId,position,radius=1){return this.distanceTo(npcId,mapId,position)<=radius;}
    nearby(mapId,position,radius=1){return this.listForMap(mapId).filter(n=>this.canInteract(n.id,mapId,position,radius));}
    questStatuses(npc){
      if(!this.questSystem||!npc.quests)return [];
      return npc.quests.map(id=>({questId:id,quest:this.questSystem.getDefinition(id),state:this.questSystem.getQuestState(id),ready:this.questSystem.isComplete(id)&&this.questSystem.getQuestState(id)==='ACTIVE'}));
    }
    indicator(npcId){
      const npc=this.getDefinition(npcId);if(!npc)return '';
      const statuses=this.questStatuses(npc);if(statuses.some(s=>s.ready))return '?';if(statuses.some(s=>s.state==='AVAILABLE'))return '!';if(statuses.some(s=>s.state==='ACTIVE'))return '…';if(statuses.some(s=>s.state==='COMPLETED'))return '✓';return '';
    }
    dialogueFor(npc){
      const statuses=this.questStatuses(npc);
      const questOptions=[
        ...statuses.filter(s=>s.ready).map(s=>({id:'deliver_quest',questId:s.questId,label:`Entregar: ${s.quest.title}`})),
        ...statuses.filter(s=>s.state==='AVAILABLE').map(s=>({id:'accept_quest',questId:s.questId,label:`Aceitar: ${s.quest.title}`}))
      ];
      if(npc.role==='QUEST'){
        const ready=statuses.find(s=>s.ready),available=statuses.find(s=>s.state==='AVAILABLE'),active=statuses.find(s=>s.state==='ACTIVE');
        if(ready)return {state:'ready',text:npc.dialogue.ready,options:[...questOptions,{id:'close',label:'Mais tarde'}]};
        if(available)return {state:'available',text:npc.dialogue.available,options:[...questOptions,{id:'close',label:'Agora não'}]};
        if(active)return {state:'active',text:npc.dialogue.active,options:[{id:'close',label:'Continuar'}]};
        return {state:'completed',text:npc.dialogue.completed,options:[{id:'close',label:'Até mais'}]};
      }
      if(npc.role==='HEALER')return {state:questOptions.length?'quest':'service',text:npc.dialogue.greeting,options:[...questOptions,{id:'heal',label:'Recuperar forças'},{id:'close',label:'Agora não'}]};
      if(npc.role==='MERCHANT')return {state:questOptions.length?'quest':'service',text:npc.dialogue.greeting,options:[...questOptions,{id:'open_merchant',label:'Abrir comércio'},{id:'close',label:'Agora não'}]};
      return {state:questOptions.length?'quest':'generic',text:npc.dialogue.greeting,options:[...questOptions,{id:'close',label:'Até mais'}]};
    }
    interact(npcId){
      const world=this.worldProvider(),npc=this.getDefinition(npcId);if(!npc||!this.canInteract(npcId,world.currentMapId,world.player))return {ok:false,reason:'DISTANT'};
      if(this.questSystem) this.questSystem.recordEvent({type:'NPC_TALKED',npcId,eventId:`npc-talk:${++this.interactionSequence}`});
      return {ok:true,npc,dialogue:this.dialogueFor(npc)};
    }
    execute(npcId,action){
      const world=this.worldProvider(),npc=this.getDefinition(npcId);if(!npc||!this.canInteract(npcId,world.currentMapId,world.player))return {ok:false,reason:'DISTANT'};
      if(action.id==='accept_quest'&&this.questSystem){const accepted=this.questSystem.acceptQuest(action.questId);if(accepted)this.onChanged({type:'QUEST_ACCEPTED',questId:action.questId});return {ok:accepted,refresh:true};}
      if(action.id==='deliver_quest'&&this.questSystem){const delivered=this.questSystem.completeQuest(action.questId);if(delivered)this.onChanged({type:'QUEST_DELIVERED',questId:action.questId});return {ok:delivered,refresh:true};}
      if(action.id==='heal'){const target=this.playerProvider(),max=int(target&&target.maxHp,0);if(target&&max>0){const healed=target.hp<max;target.hp=max;if(healed)this.onChanged({type:'HEALED'});return {ok:true,healed};}return {ok:true,healed:false};}
      if(action.id==='open_merchant'&&npc.role==='MERCHANT')return {ok:true,openMerchant:true};
      return {ok:true};
    }
  }
  const api={ROLES,NpcEngine,createNpcSystem:options=>new NpcEngine(options)};root.NpcSystem=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
