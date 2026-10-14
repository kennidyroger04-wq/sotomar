/* Pequena estratégia determinística da Sineira. Não contém UI nem layout final. */
(function(root){
  const BossApi=root.BossSystem||((typeof require!=='undefined')?require('./boss.js'):null);
  const Effects=root.CombatEffects||((typeof require!=='undefined')?require('./combat-effects.js'):null);
  const Rules=root.EngineRules||((typeof require!=='undefined')?require('../core/rules.js'):null);
  const Canonical=root.FIMBRIA_CANONICAL||((typeof require!=='undefined')?require('../data/fimbria-canonical.js'):null);
  const PHASES=Object.freeze(['GUARDIA','ALVOROCO','ALIVIO']);
  const ACTIONS=Object.freeze({
    BATIDA:Object.freeze({id:'SINEIRA_BATIDA',kind:'AREA',label:'Batida',ability:{id:'SINEIRA_BATIDA',name:'Batida',apCost:0,cooldown:0,range:{min:0,max:8},requiresLoS:false,targeting:{targetType:'CELL',shape:'CROSS'},effects:[{type:'DAMAGE',target:'AREA',targetFilter:'ENEMY',damageType:'MAGICAL',amount:12}]}}),
    INVESTIDA:Object.freeze({id:'SINEIRA_INVESTIDA',kind:'DASH',label:'Investida',ability:{id:'SINEIRA_INVESTIDA',name:'Investida',apCost:0,cooldown:0,range:{min:1,max:3},requiresLoS:false,requiresStraightLine:true,targeting:{targetType:'ENEMY',shape:'SINGLE'},effects:[{type:'MOVE',mode:'DASH',maxDistance:3},{type:'DAMAGE',target:'TARGET',damageType:'PHYSICAL',amount:10}]}}),
    PRESSAO:Object.freeze({id:'SINEIRA_PRESSAO',kind:'PRESSURE',label:'Pressão do Sereno'})
  });
  const ARENA_ELEMENTS=Object.freeze(['SELO_CENTRAL','CRAVAS','COLUNAS','CANAIS_SERENO','CAL_ANTIGA','PLATAFORMAS_LATERAIS']);
  const DEFAULT_RULES=Object.freeze({
    alvorocoTurn:2,
    alivioExposure:0,
    cravaRelief:25,
    pressureDelta:15,
    balanceNote:'PROVISÓRIO — BALANCEAMENTO FUTURO'
  });
  const canonicalBoss=Canonical&&Canonical.bosses&&Canonical.bosses.CRE_SINEIRA;
  const asInt=(value,fallback)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;

  function bossOptions(overrides){
    const source=canonicalBoss||{};
    return {
      bossId:'CRE_SINEIRA',name:'Sineira',phases:PHASES,initialPhase:'GUARDIA',nonLethal:true,
      exposure:{...(source.exposure||{min:0,max:100,initial:50})},
      transitions:[
        {from:'GUARDIA',to:'ALVOROCO',when:{event:'TURN_THRESHOLD'}},
        {from:'ALVOROCO',to:'ALIVIO',when:{exposure:0}}
      ],...(overrides||{})
    };
  }

  class SineiraEncounter{
    constructor(options={}){
      this.rules={...DEFAULT_RULES,...(options.rules||{})};
      this.boss=BossApi.createBoss(bossOptions(options.boss));
      this.arena={arenaId:'MAP_11',layoutStatus:'placeholder',fixture:true,fixtureNote:'TEST FIXTURE / NÃO CANÔNICA',elements:ARENA_ELEMENTS.slice(),cravas:Array.isArray(options.cravas)?options.cravas.slice():[]};
      this.turn=0;this.usedCravas=new Set();this.events=[];this.combatEngine=options.combatEngine||null;this.rulesEngine=options.rulesEngine||Rules;this.externalOnEvent=options.onEvent||(()=>{});
      if(this.boss)this.boss.onEvent=event=>{this.events.push(event);this.externalOnEvent(event);};
    }
    emit(type,data){const event={type,bossId:'CRE_SINEIRA',turn:this.turn,...data};this.events.push(event);return event;}
    phase(){return this.boss?this.boss.snapshot().phase:null;}
    snapshot(){return {boss:this.boss&&this.boss.snapshot(),arena:{...this.arena,cravas:this.arena.cravas.slice()},turn:this.turn,usedCravas:Array.from(this.usedCravas),events:this.events.slice()};}
    beginTurn(turnNumber){
      if(!this.boss)return {ok:false,reason:'BOSS'};
      const next=asInt(turnNumber,this.turn+1);if(next<this.turn)return {ok:false,reason:'TURN_ORDER'};this.turn=next;
      const transitions=[];const phase=this.phase();
      if(phase==='GUARDIA'&&this.turn>=this.rules.alvorocoTurn){const result=this.boss.transition('ALVOROCO',{event:'TURN_THRESHOLD'});if(result.ok)transitions.push(result.event);}
      if(this.phase()==='ALVOROCO'&&this.boss.snapshot().exposure.value<=this.rules.alivioExposure){const result=this.boss.transition('ALIVIO',{exposure:0});if(result.ok)transitions.push(result.event);}
      return {ok:true,turn:this.turn,phase:this.phase(),transitions};
    }
    actionsForPhase(){const phase=this.phase();if(phase==='GUARDIA')return ['BATIDA'];if(phase==='ALVOROCO')return this.turn%2===0?['PRESSAO']:['INVESTIDA'];return [];}
    chooseAction(){const available=this.actionsForPhase();return available[0]||null;}
    planAction({actionId,target,turn,area}={}){
      if(!this.boss||this.phase()==='ALIVIO')return {ok:false,reason:'PHASE'};
      const requested=actionId||this.chooseAction(),action=Object.values(ACTIONS).find(entry=>entry.id===requested||entry.id===String(requested).toUpperCase()||entry.label===requested);
      if(!action)return {ok:false,reason:'ACTION'};
      const resolveTurn=Math.max(this.turn+1,asInt(turn,this.turn+1));
      const result=this.boss.createTelegraph({abilityId:action.id,sourceId:'CRE_SINEIRA',target:target||{kind:action.kind},area:area||null,resolveTurn});
      if(!result.ok)return result;
      result.telegraph.actionId=action.id;result.telegraph.kind=action.kind;result.telegraph.label=action.label;result.telegraph.plannedEffect=action.kind==='PRESSURE'?{exposureDelta:this.rules.pressureDelta}:null;
      return result;
    }
    resolveAction(telegraphId,combatState){
      const telegraph=this.boss&&this.boss.getTelegraph(telegraphId);if(!telegraph)return {ok:false,reason:'TELEGRAPH'};
      if(telegraph.status!=='PENDING')return {ok:false,reason:'TELEGRAPH_STATUS'};
      if(this.turn<telegraph.resolveTurn)return {ok:false,reason:'NOT_DUE'};
      const action=Object.values(ACTIONS).find(entry=>entry.id===telegraph.actionId||entry.id===telegraph.abilityId);if(!action)return {ok:false,reason:'ACTION'};
      const marked=this.boss.resolveTelegraph(telegraphId);if(!marked.ok)return marked;
      let effect={ok:true,actionId:action.id};
      if(action.kind==='PRESSURE')effect.pressure=this.boss.changeExposure(this.rules.pressureDelta);
      else if(combatState&&this.combatEngine){
        const target=telegraph.target&&Number.isFinite(Number(telegraph.target.x))?{x:Number(telegraph.target.x),y:Number(telegraph.target.y)}:null;
        const actorId='CRE_SINEIRA';effect.combat=this.combatEngine.cast(combatState,{actorId,ability:action.ability,target:target||{x:0,y:0}});
      }
      this.emit('SINEIRA_ACTION_RESOLVED',{actionId:action.id,telegraphId:telegraph.id});
      return effect;
    }
    interactCrava(cravaId){
      if(!this.arena.cravas.includes(cravaId))return {ok:false,reason:'CRAVA'};
      if(this.usedCravas.has(cravaId))return {ok:false,reason:'ALREADY_USED'};
      this.usedCravas.add(cravaId);const pressure=this.boss.changeExposure(-Math.abs(this.rules.cravaRelief));
      const result={ok:true,cravaId,pressure};this.emit('CRAVA_INTERACTED',result);
      if(this.phase()==='ALVOROCO'&&pressure.value<=this.rules.alivioExposure)this.boss.transition('ALIVIO',{exposure:0});
      return result;
    }
    applyIncomingDamage(amount){if(!this.boss)return {ok:false,reason:'BOSS'};const result=this.boss.applyDamage(amount);return {ok:true,...result,hp:this.boss.snapshot().hp};}
    createBossCombatant(position){
      const p=position||{x:0,y:0};const hp=this.boss?this.boss.snapshot().maxHp:100;
      return {id:'CRE_SINEIRA',bossId:'CRE_SINEIRA',side:'mob',name:'Sineira',x:p.x,y:p.y,hp,maxHp:hp,pa:0,maxPa:0,pm:0,maxPm:0,cooldowns:{},effects:[],resistances:{PHYSICAL:0,MAGICAL:0},combatStats:{},nonLethalBoss:true};
    }
    tryResolve(context={}){
      if(!this.boss||this.phase()!=='ALIVIO'||this.boss.snapshot().exposure.value>this.rules.alivioExposure)return {ok:false,reason:'OBJECTIVE'};
      return this.boss.resolve({resolution:'NON_LETHAL',context:{arenaId:'MAP_11',...context}});
    }
  }
  const api={PHASES,ACTIONS,ARENA_ELEMENTS,DEFAULT_RULES,bossOptions,SineiraEncounter,createSineiraEncounter:options=>{
    const requested=(options&&options.boss)||{};
    if(requested.bossId!==undefined&&requested.bossId!=='CRE_SINEIRA')return null;
    if(requested.nonLethal===false)return null;
    if(requested.phases!==undefined&&(JSON.stringify(requested.phases)!==JSON.stringify(PHASES)))return null;
    const encounter=new SineiraEncounter(options);return encounter.boss?encounter:null;
  }};
  root.SineiraStrategy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
