/* Deterministic, DOM-free combat request, effect and event pipeline. */
(function(root){
  const EFFECT_TYPES=Object.freeze({DAMAGE:'DAMAGE',HEAL:'HEAL',BUFF:'BUFF',DEBUFF:'DEBUFF',STATUS:'STATUS',MOVE:'MOVE'});
  const EVENT_TYPES=Object.freeze({TURN_STARTED:'TURN_STARTED',TURN_ENDED:'TURN_ENDED',ABILITY_CAST:'ABILITY_CAST',DAMAGE_APPLIED:'DAMAGE_APPLIED',HEAL_APPLIED:'HEAL_APPLIED',STATUS_APPLIED:'STATUS_APPLIED',STATUS_EXPIRED:'STATUS_EXPIRED',UNIT_MOVED:'UNIT_MOVED',UNIT_DIED:'UNIT_DIED',BOSS_CRITICAL:'BOSS_CRITICAL'});
  const DAMAGE_TYPES=Object.freeze({PHYSICAL:'PHYSICAL',MAGICAL:'MAGICAL'});
  const int=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
  const key=(x,y)=>`${x},${y}`;

  class CombatEffectEngine{
    constructor({rules,rng}={}){this.rules=rules;this.rng=rng||{random:()=>1,int:(min)=>min};}
    actors(state){return Array.isArray(state&&state.combatants)?state.combatants:[];}
    actor(state,id){return this.actors(state).find(unit=>unit.id===id)||null;}
    alive(unit){return !!unit&&unit.hp>0;}
    emit(state,events,type,data={}){state.eventSequence=(state.eventSequence||0)+1;const event={id:`combat-event:${state.eventSequence}`,type,...data};events.push(event);return event;}
    gridSize(state){return Array.isArray(state&&state.board)?state.board.length:0;}
    inBounds(state,x,y){const board=state&&state.board;return Array.isArray(board)&&y>=0&&y<board.length&&Array.isArray(board[y])&&x>=0&&x<board[y].length;}
    obstacle(state,x,y){return !this.inBounds(state,x,y)||state.board[y][x]==='obstacle';}
    at(state,x,y,exceptId=null){return this.actors(state).find(unit=>unit.id!==exceptId&&this.alive(unit)&&unit.x===x&&unit.y===y)||null;}
    lineOfSight(state,from,to){
      const dx=Math.abs(to.x-from.x),dy=Math.abs(to.y-from.y),sx=from.x<to.x?1:-1,sy=from.y<to.y?1:-1;let x=from.x,y=from.y,err=dx-dy;
      while(!(x===to.x&&y===to.y)){const e2=2*err;if(e2>-dy){err-=dy;x+=sx;}if(e2<dx){err+=dx;y+=sy;}if(x===to.x&&y===to.y)break;if(this.obstacle(state,x,y)||this.at(state,x,y,from.id))return false;}return true;
    }
    range(actor,target){return Math.abs(actor.x-target.x)+Math.abs(actor.y-target.y);}
    effects(unit){if(!Array.isArray(unit.effects))unit.effects=[];return unit.effects;}
    cooldowns(unit){if(!unit.cooldowns||typeof unit.cooldowns!=='object')unit.cooldowns={};return unit.cooldowns;}
    modifiers(unit){return this.effects(unit).reduce((all,effect)=>{Object.entries(effect.modifiers||{}).forEach(([name,value])=>{all[name]=(all[name]||0)+(Number(value)||0);});return all;},{});}
    resistance(unit,damageType){const base=unit.resistances&&unit.resistances[damageType]||0,mods=this.modifiers(unit);const suffix=damageType===DAMAGE_TYPES.MAGICAL?'magicalResistance':'physicalResistance';return this.rules.sanitizeResistance(base+(Number(mods[suffix])||0));}
    stats(unit){return unit.combatStats||unit.stats||{};}
    damageBonus(unit){return Number(this.modifiers(unit).damage)||0;}
    areaCells(shape,center){
      if(shape==='CROSS')return [[0,0],[1,0],[-1,0],[2,0],[-2,0],[0,1],[0,-1],[0,2],[0,-2]].map(([x,y])=>({x:center.x+x,y:center.y+y}));
      if(shape==='LINE')return [center];
      return [center];
    }
    targetUnits(state,actor,ability,target,effect,context){
      const mode=effect.target||'TARGET';
      if(mode==='SELF')return [actor];
      if(mode==='TARGET')return context.targetUnitId?[this.actor(state,context.targetUnitId)].filter(Boolean):[this.at(state,target.x,target.y)].filter(Boolean);
      const filter=effect.targetFilter||ability.targeting&&ability.targeting.targetType||'ANY';
      return this.areaCells(ability.targeting&&ability.targeting.shape,target).filter(cell=>this.inBounds(state,cell.x,cell.y)).map(cell=>this.at(state,cell.x,cell.y)).filter(unit=>unit&&this.matchesTarget(actor,unit,filter));
    }
    matchesTarget(actor,target,targetType){return targetType==='ANY'||targetType==='CELL'||targetType==='SELF'&&actor.id===target.id||targetType==='ALLY'&&actor.side===target.side||targetType==='ENEMY'&&actor.side!==target.side;}
    dashPathIsClear(state,actor,target,effect){
      const dx=Math.sign(target.x-actor.x),dy=Math.sign(target.y-actor.y),distance=Math.max(Math.abs(target.x-actor.x),Math.abs(target.y-actor.y)),maxDistance=Math.max(0,int(effect.maxDistance,0));
      if((dx&&dy)||distance<=0||distance>maxDistance)return false;
      for(let step=1;step<distance;step++){const x=actor.x+dx*step,y=actor.y+dy*step;if(this.obstacle(state,x,y)||this.at(state,x,y,actor.id))return false;}
      return true;
    }
    validate(state,actor,ability,target){
      if(!actor||!this.alive(actor))return {ok:false,reason:'DEAD'};
      if(!ability)return {ok:false,reason:'ABILITY'};
      const cost=Math.max(0,int(ability.apCost,0));if(actor.pa<cost)return {ok:false,reason:'PA'};
      if((this.cooldowns(actor)[ability.id]||0)>0)return {ok:false,reason:'COOLDOWN'};
      const targeting=ability.targeting||{},point=targeting.targetType==='SELF'?{x:actor.x,y:actor.y}:target;
      if(!point||!this.inBounds(state,int(point.x,-1),int(point.y,-1)))return {ok:false,reason:'TARGET'};
      const distance=this.range(actor,point),range=ability.range||{};
      if(distance<int(range.min,0)||distance>int(range.max,0))return {ok:false,reason:'RANGE'};
      if(ability.requiresLoS&&!this.lineOfSight(state,actor,point))return {ok:false,reason:'LOS'};
      const unit=this.at(state,point.x,point.y);
      if(targeting.targetType==='ENEMY'&&(!unit||unit.side===actor.side))return {ok:false,reason:'TARGET'};
      if(targeting.targetType==='ALLY'&&(!unit||unit.side!==actor.side))return {ok:false,reason:'TARGET'};
      if(ability.requiresStraightLine&&actor.x!==point.x&&actor.y!==point.y)return {ok:false,reason:'TARGET'};
      const dash=(ability.effects||[]).find(effect=>effect.type===EFFECT_TYPES.MOVE&&effect.mode==='DASH');
      if(dash&&!this.dashPathIsClear(state,actor,point,dash))return {ok:false,reason:'PATH'};
      return {ok:true,target:point,targetUnitId:unit&&unit.id,cost};
    }
    applyTemporal(state,events,actor,target,effect){
      const id=effect.statusId||effect.id||effect.type.toLowerCase(),sourceId=actor.id,duration=Math.max(1,int(effect.duration,1));
      const list=this.effects(target),existing=list.find(entry=>entry.id===id&&entry.sourceId===sourceId);
      const entry={id,sourceId,kind:effect.type,statusId:effect.statusId||null,duration,modifiers:{...(effect.modifiers||{})},tick:effect.tick?{...effect.tick}:null};
      if(existing)Object.assign(existing,entry);else list.push(entry);
      this.emit(state,events,EVENT_TYPES.STATUS_APPLIED,{actorId:actor.id,targetId:target.id,statusId:id,duration,kind:effect.type,refreshed:!!existing});
    }
    die(state,events,actor,sourceId){
      if(!actor||actor.hp>0)return;
      // Exceção explícita para bosses não letais: a unidade permanece viva,
      // não entra no fluxo UNIT_DIED e pode continuar recebendo ações da estratégia.
      if(actor.nonLethalBoss===true){actor.hp=Math.max(1,Number(actor.hp)||1);actor.deathProcessed=false;this.emit(state,events,EVENT_TYPES.BOSS_CRITICAL,{targetId:actor.id,bossId:actor.bossId||null,sourceId:sourceId||null,nonLethal:true});return;}
      if(actor.deathProcessed)return;
      actor.deathProcessed=true;this.emit(state,events,EVENT_TYPES.UNIT_DIED,{targetId:actor.id,sourceId:sourceId||null});
    }
    applyDamage(state,events,actor,target,effect){
      if(!this.alive(target))return;
      const base=Array.isArray(effect.amount)?this.rng.int(effect.amount[0],effect.amount[1]):int(effect.amount,0);
      const damageType=effect.damageType===DAMAGE_TYPES.MAGICAL?DAMAGE_TYPES.MAGICAL:DAMAGE_TYPES.PHYSICAL;
      const resolved=this.rules.resolveCombatDamage({base,damageType,attackerStats:this.stats(actor),damageBonus:this.damageBonus(actor),targetResistance:this.resistance(target,damageType),rng:this.rng});
      const before=target.hp;this.rules.applyDamage(target,resolved.dmg);
      this.emit(state,events,EVENT_TYPES.DAMAGE_APPLIED,{actorId:actor.id,targetId:target.id,amount:before-target.hp,damageType,resistance:resolved.resistance,isCrit:resolved.isCrit});
      this.die(state,events,target,actor.id);
    }
    applyHeal(state,events,actor,target,effect){const amount=Array.isArray(effect.amount)?this.rng.int(effect.amount[0],effect.amount[1]):int(effect.amount,0);const healed=this.rules.heal(target,amount);if(healed>0)this.emit(state,events,EVENT_TYPES.HEAL_APPLIED,{actorId:actor.id,targetId:target.id,amount:healed});}
    move(state,events,actor,target,effect){
      let destination=null;
      if(effect.mode==='DASH'){
        const dx=Math.sign(target.x-actor.x),dy=Math.sign(target.y-actor.y),steps=Math.min(Math.max(Math.abs(target.x-actor.x),Math.abs(target.y-actor.y)),Math.max(0,int(effect.maxDistance,0)));if((dx&&dy)||steps<=0)return;
        for(let i=1;i<=steps;i++){const x=actor.x+dx*i,y=actor.y+dy*i;if(this.obstacle(state,x,y)||this.at(state,x,y,actor.id))break;destination={x,y};}
      } else destination=effect.destination||target;
      if(!destination||this.obstacle(state,destination.x,destination.y)||this.at(state,destination.x,destination.y,actor.id))return;
      const from={x:actor.x,y:actor.y};actor.x=destination.x;actor.y=destination.y;this.emit(state,events,EVENT_TYPES.UNIT_MOVED,{actorId:actor.id,from,to:{x:actor.x,y:actor.y},reason:effect.mode||'MOVE'});
    }
    resolveEffects(state,actor,ability,target,context,events){
      for(const effect of ability.effects||[]){
        if(!this.alive(actor))break;
        if(effect.type===EFFECT_TYPES.MOVE){this.move(state,events,actor,target,effect);continue;}
        const targets=this.targetUnits(state,actor,ability,target,effect,context);
        targets.forEach(unit=>{if(!this.alive(unit)&&effect.type!==EFFECT_TYPES.DAMAGE)return;if(effect.type===EFFECT_TYPES.DAMAGE)this.applyDamage(state,events,actor,unit,effect);else if(effect.type===EFFECT_TYPES.HEAL)this.applyHeal(state,events,actor,unit,effect);else if([EFFECT_TYPES.BUFF,EFFECT_TYPES.DEBUFF,EFFECT_TYPES.STATUS].includes(effect.type))this.applyTemporal(state,events,actor,unit,effect);});
      }
    }
    cast(state,{actorId,ability,target}={}){
      const actor=this.actor(state,actorId),validated=this.validate(state,actor,ability,target),events=[];if(!validated.ok)return {...validated,events};
      actor.pa-=validated.cost;if(ability.cooldown>0)this.cooldowns(actor)[ability.id]=int(ability.cooldown,0);
      this.emit(state,events,EVENT_TYPES.ABILITY_CAST,{actorId:actor.id,abilityId:ability.id,target:{x:validated.target.x,y:validated.target.y},apCost:validated.cost});
      this.resolveEffects(state,actor,ability,validated.target,validated,events);
      return {ok:true,events};
    }
    startTurn(state,actorId){
      const actor=this.actor(state,actorId),events=[];if(!this.alive(actor))return {ok:false,reason:'DEAD',events};
      this.emit(state,events,EVENT_TYPES.TURN_STARTED,{actorId});
      Object.keys(this.cooldowns(actor)).forEach(id=>{this.cooldowns(actor)[id]=Math.max(0,int(this.cooldowns(actor)[id])-1);if(this.cooldowns(actor)[id]===0)delete this.cooldowns(actor)[id];});
      this.effects(actor).filter(entry=>entry.statusId==='POISON'&&entry.tick).forEach(entry=>this.applyDamage(state,events,{id:entry.sourceId,combatStats:{}},actor,{type:EFFECT_TYPES.DAMAGE,damageType:entry.tick.damageType,amount:entry.tick.amount}));
      if(this.alive(actor)){actor.pa=actor.maxPa;actor.pm=actor.maxPm;}
      return {ok:this.alive(actor),events};
    }
    endTurn(state,actorId){
      const actor=this.actor(state,actorId),events=[];if(!actor)return {ok:false,events};
      this.emit(state,events,EVENT_TYPES.TURN_ENDED,{actorId});
      this.effects(actor).slice().forEach(entry=>{entry.duration-=1;if(entry.duration<=0){actor.effects.splice(actor.effects.indexOf(entry),1);this.emit(state,events,EVENT_TYPES.STATUS_EXPIRED,{targetId:actor.id,statusId:entry.id,sourceId:entry.sourceId});}});
      return {ok:true,events};
    }
  }
  const api={EFFECT_TYPES,EVENT_TYPES,DAMAGE_TYPES,CombatEffectEngine,createCombatEngine:options=>new CombatEffectEngine(options)};
  root.CombatEffects=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
