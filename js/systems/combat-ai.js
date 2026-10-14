/* Deterministic, DOM-free tactical planning for common combat roles. */
(function(root){
  const Geometry=root.Geometry||(typeof require!=='undefined'?require('../core/geometry.js'):null);
  const Rules=root.EngineRules||(typeof require!=='undefined'?require('../core/rules.js'):null);
  const alive=unit=>!!unit&&unit.hp>0;
  const distance=(a,b)=>Geometry.manhattan(a,b);
  const inBounds=(state,x,y)=>Array.isArray(state&&state.board)&&y>=0&&y<state.board.length&&Array.isArray(state.board[y])&&x>=0&&x<state.board[y].length;
  const obstacle=(state,x,y)=>!inBounds(state,x,y)||state.board[y][x]==='obstacle';
  const unitAt=(state,x,y,exceptId)=> (state.combatants||[]).find(unit=>unit.id!==exceptId&&alive(unit)&&unit.x===x&&unit.y===y)||null;
  const blocked=(state,x,y,actorId)=>obstacle(state,x,y)||!!unitAt(state,x,y,actorId);
  const hasLineOfSight=(state,from,to,actorId)=>Geometry.hasLineOfSight(from,to,(x,y)=>blocked(state,x,y,actorId),(x,y)=>inBounds(state,x,y));
  const effectsOf=ability=>Array.isArray(ability&&ability.effects)?ability.effects:[];
  const roleOf=ability=>{
    const effects=effectsOf(ability);
    if(effects.some(effect=>effect.type==='HEAL'||effect.type==='BUFF'))return 'SUPPORT';
    if(effects.some(effect=>effect.type==='DEBUFF'||effect.type==='STATUS'))return 'CONTROL';
    if(effects.some(effect=>effect.type==='DAMAGE'))return 'DAMAGE';
    return 'OTHER';
  };
  function targetTypeAllows(actor,target,ability){
    const type=ability.targeting&&ability.targeting.targetType||'ENEMY';
    return type==='ANY'||type==='ENEMY'&&actor.side!==target.side||type==='ALLY'&&actor.side===target.side;
  }
  function usefulTarget(target,ability,role){
    if(!alive(target))return false;
    const effects=effectsOf(ability);
    if(role==='SUPPORT'&&effects.some(effect=>effect.type==='HEAL')&&target.hp>=target.maxHp)return false;
    if(role==='SUPPORT'&&effects.some(effect=>effect.type==='BUFF')&&effects.some(effect=>target.effects&&target.effects.some(active=>active.statusId===effect.statusId)))return false;
    return true;
  }
  function targetCandidates(state,actor,ability,role){
    const type=ability.targeting&&ability.targeting.targetType||'ENEMY';
    const targets=type==='SELF'?[actor]:(state.combatants||[]).filter(target=>target.id!==actor.id&&targetTypeAllows(actor,target,ability));
    return targets.filter(target=>usefulTarget(target,ability,role)).sort((a,b)=>distance(actor,a)-distance(actor,b)||String(a.id).localeCompare(String(b.id)));
  }
  function attackCells(state,actor,target,ability){
    const range=ability.range||{},min=Number.isFinite(Number(range.min))?Number(range.min):0,max=Number.isFinite(Number(range.max))?Number(range.max):0,cells=[];
    if((ability.targeting&&ability.targeting.targetType)==='SELF')return [{x:actor.x,y:actor.y}];
    for(let y=0;y<state.board.length;y++)for(let x=0;x<state.board[y].length;x++){
      const cell={x,y};
      if(distance(cell,target)<min||distance(cell,target)>max||obstacle(state,x,y)||unitAt(state,x,y,actor.id))continue;
      if(ability.requiresStraightLine&&cell.x!==target.x&&cell.y!==target.y)continue;
      if(ability.requiresLoS&&!hasLineOfSight(state,cell,target,actor.id))continue;
      cells.push(cell);
    }
    return cells;
  }
  function pathTo(state,actor,cell){
    const result=Geometry.bfs(actor.x,actor.y,(x,y)=>blocked(state,x,y,actor.id),state.board.length);
    return Geometry.reconstructPath(result.parent,actor.x,actor.y,cell.x,cell.y);
  }
  function groupPositionScore(state,actor,target,cell){
    const allies=(state.combatants||[]).filter(unit=>alive(unit)&&unit.id!==actor.id&&unit.side===actor.side);
    const sideX=Math.sign(cell.x-target.x),sideY=Math.sign(cell.y-target.y);
    return allies.reduce((score,ally)=>score+(Math.sign(ally.x-target.x)===sideX&&Math.sign(ally.y-target.y)===sideY?1:0),0);
  }
  function compareCandidate(a,b,kind){
    const distancePreference=kind==='RANGED'?(b.targetDistance-a.targetDistance):0;
    return a.path.length-b.path.length||distancePreference||a.groupScore-b.groupScore||a.targetDistance-b.targetDistance||a.cell.y-b.cell.y||a.cell.x-b.cell.x||String(a.targetId).localeCompare(String(b.targetId));
  }
  function planAbilityTurn(state,actor,ability,kind='DAMAGE'){
    if(!alive(actor))return {ok:false,reason:'DEAD'};
    if(!ability)return {ok:false,reason:'ABILITY'};
    const apCost=Math.max(0,Math.trunc(Number(ability.apCost)||0));
    if(actor.pa<apCost)return {ok:false,reason:'PA'};
    if(actor.cooldowns&&actor.cooldowns[ability.id]>0)return {ok:false,reason:'COOLDOWN'};
    const role=kind==='AUTO'?roleOf(ability):kind;
    const targets=targetCandidates(state,actor,ability,role),possible=[];
    targets.forEach(target=>attackCells(state,actor,target,ability).forEach(cell=>{const path=pathTo(state,actor,cell);if(path&&path.length<=actor.pm)possible.push({ok:true,targetId:target.id,target:{x:target.x,y:target.y},cell,path,targetDistance:distance(cell,target),groupScore:groupPositionScore(state,actor,target,cell),role});}));
    if(!possible.length)return {ok:false,reason:'NO_PATH'};
    possible.sort((a,b)=>compareCandidate(a,b,kind));
    return possible[0];
  }
  function chooseAbility(state,actor,abilities,kind='AUTO'){
    const list=Array.isArray(abilities)?abilities.filter(Boolean):abilities?[abilities]:[];
    const priorities=kind==='AUTO'?['SUPPORT','CONTROL','DAMAGE','OTHER']:[kind];
    for(const role of priorities){
      const plans=list.map(ability=>({ability,plan:planAbilityTurn(state,actor,ability,role)})).filter(entry=>entry.plan.ok);
      if(plans.length){plans.sort((a,b)=>compareCandidate(a.plan,b.plan,role==='DAMAGE'?'RANGED':'MELEE')||String(a.ability.id).localeCompare(String(b.ability.id)));return {...plans[0].plan,ability:plans[0].ability};}
    }
    const reasons=list.map(ability=>planAbilityTurn(state,actor,ability,kind).reason);
    return {ok:false,reason:reasons.includes('PA')?'PA':reasons.includes('COOLDOWN')?'COOLDOWN':reasons.includes('NO_TARGET')?'NO_TARGET':'NO_PATH'};
  }
  function planMeleeTurn(state,actor,ability){return planAbilityTurn(state,actor,ability,'MELEE');}
  function planRangedTurn(state,actor,abilities){return chooseAbility(state,actor,abilities,'RANGED');}
  function planControlTurn(state,actor,abilities){return chooseAbility(state,actor,abilities,'CONTROL');}
  function planSupportTurn(state,actor,abilities){return chooseAbility(state,actor,abilities,'SUPPORT');}
  function planTurn(state,actor,abilities){return chooseAbility(state,actor,abilities,'AUTO');}
  function applyPath(state,actor,path,rules=Rules){
    if(!alive(actor)||!Array.isArray(path))return {ok:false,reason:'PATH'};
    if(path.length>actor.pm)return {ok:false,reason:'PM'};
    let previous={x:actor.x,y:actor.y};
    for(const cell of path){
      if(Math.abs(cell.x-previous.x)+Math.abs(cell.y-previous.y)!==1||blocked(state,cell.x,cell.y,actor.id))return {ok:false,reason:'PATH'};
      previous=cell;
    }
    if(!rules.consumePm(actor,path.length))return {ok:false,reason:'PM'};
    const from={x:actor.x,y:actor.y};
    if(path.length){const destination=path[path.length-1];actor.x=destination.x;actor.y=destination.y;}
    return {ok:true,from,to:{x:actor.x,y:actor.y},distance:path.length};
  }
  const api={planMeleeTurn,planRangedTurn,planControlTurn,planSupportTurn,planTurn,applyPath,roleOf};
  root.CombatAI=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
