/* Runtime adapters for canonical Fímbria IDs. Numbers are provisional and centralized. */
(function(root){
  const canonical=root.FIMBRIA_CANONICAL||(typeof FIMBRIA_CANONICAL!=='undefined'?FIMBRIA_CANONICAL:null);
  const mapVisuals={MAP_01:root.MAP_01_VISUAL||null,MAP_02:root.MAP_02_VISUAL||null,MAP_03:root.MAP_03_VISUAL||null,MAP_04:root.MAP_04_VISUAL||null,MAP_05:root.MAP_05_VISUAL||null,MAP_06:root.MAP_06_VISUAL||null,MAP_07:root.MAP_07_VISUAL||null,MAP_08:root.MAP_08_VISUAL||null,MAP_09:root.MAP_09_VISUAL||null,MAP_10:root.MAP_10_VISUAL||null,MAP_11:root.MAP_11_VISUAL||null};
  const abilities=(root.ABILITIES||(typeof ABILITIES!=='undefined'?ABILITIES:(typeof require!=='undefined'?require('./abilities.js'):{})));
  const provisional={
    CRE_CASCUDO_DE_CAL:{name:'Cascudo-de-cal',hp:70,maxHp:70,pa:6,maxPa:6,pm:3,maxPm:3,agilidade:5,ai:'melee',xpReward:20,currencyReward:0,attackAbility:abilities.golpe},
    CRE_PAPA_MEL:{name:'Papa-mel',hp:60,maxHp:60,pa:6,maxPa:6,pm:4,maxPm:4,agilidade:8,ai:'melee',xpReward:24,currencyReward:0,attackAbility:abilities.golpe},
    CRE_TOPETAO:{name:'Topetão',hp:90,maxHp:90,pa:6,maxPa:6,pm:3,maxPm:3,agilidade:6,ai:'melee',xpReward:30,currencyReward:0,attackAbility:abilities.golpe},
    CRE_FIANDEIRA:{name:'Fiandeira',hp:65,maxHp:65,pa:6,maxPa:6,pm:3,maxPm:3,agilidade:10,ai:'control',xpReward:32,currencyReward:0,attackAbility:abilities.lanca},
    CRE_SAPO_DE_POCA:{name:'Sapo-de-poça',hp:75,maxHp:75,pa:6,maxPa:6,pm:3,maxPm:3,agilidade:7,ai:'melee',xpReward:28,currencyReward:0,attackAbility:abilities.golpe},
    CRE_LERDO_DE_MUSGO:{name:'Lerdo-de-musgo',hp:100,maxHp:100,pa:6,maxPa:6,pm:2,maxPm:2,agilidade:3,ai:'support',xpReward:35,currencyReward:0,attackAbility:abilities.fortificar},
    CRE_FAREJADOR_DE_BREJO:{name:'Farejador-de-brejo',hp:72,maxHp:72,pa:6,maxPa:6,pm:4,maxPm:4,agilidade:11,ai:'pack',xpReward:30,currencyReward:0,attackAbility:abilities.golpe}
  };
  Object.values(provisional).forEach(template=>{template.resistances={PHYSICAL:0,MAGICAL:0};template.provisionalBalance=true;template.balanceNote='PROVISÓRIO — BALANCEAMENTO FUTURO';});
  const variants={};
  if(canonical)Object.entries(canonical.variants).forEach(([variantId,variant])=>{const base=provisional[variant.baseId||variant[0]];if(!base)return;variants[variantId]={...base,name:base.name,canonicalBaseId:variant.baseId||variant[0],exposure:variant.exposure||variant[1],variantMetadata:{exposure:variant.exposure||variant[1]},provisionalBalance:true};});
  const allTemplates={...provisional,...variants};
  const mobDb=(root.MOB_TEMPLATES||(typeof MOB_TEMPLATES!=='undefined'?MOB_TEMPLATES:null));
  if(mobDb)Object.assign(mobDb,allTemplates);
  const MAP_DIMENSIONS=Object.freeze({MAP_01:[12,10],MAP_02:[12,9],MAP_03:[9,8],MAP_04:[12,9],MAP_05:[10,9],MAP_06:[11,9],MAP_07:[12,10],MAP_08:[10,8],MAP_09:[9,8],MAP_10:[10,9],MAP_11:[12,10]});
  const legacyMapAliases=Object.freeze({'0,0':'MAP_01','1,0':'MAP_02'});
  const exitBlueprints=Object.freeze([
    {id:'EXIT_MAP01_MAP02',from:'MAP_01',to:'MAP_02',side:'east',targetSpawnId:'SPAWN_FROM_MAP_01',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP02_MAP01',from:'MAP_02',to:'MAP_01',side:'west',targetSpawnId:'SPAWN_FROM_MAP_02',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_CARROCAL',from:'MAP_01',to:'MAP_04',side:'south',targetSpawnId:'SPAWN_FROM_MAP_01',status:'CANONICAL_OPEN_SANDBOX'},
    {id:'EXIT_MAP04_MAP01',from:'MAP_04',to:'MAP_01',side:'north',targetSpawnId:'SPAWN_FROM_MAP_04',status:'CANONICAL_OPEN_SANDBOX'},
    {id:'EXIT_MAP04_MAP05',from:'MAP_04',to:'MAP_05',side:'east',targetSpawnId:'SPAWN_FROM_MAP_04',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP05_MAP04',from:'MAP_05',to:'MAP_04',side:'west',targetSpawnId:'SPAWN_FROM_MAP_05',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP04_MAP06',from:'MAP_04',to:'MAP_06',side:'south',targetSpawnId:'SPAWN_FROM_MAP_04',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP06_MAP04',from:'MAP_06',to:'MAP_04',side:'north',targetSpawnId:'SPAWN_FROM_MAP_06',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_ESCADA_MARCO_PRUMO',from:'MAP_05',to:'MAP_07',side:'east',targetSpawnId:'SPAWN_FROM_MAP_05',requiresFlag:'FLAG_ESCADA_MARCO_PRUMO_UNLOCKED',status:'CANONICAL_TBD_GATE'},
    {id:'EXIT_MAP07_MAP05',from:'MAP_07',to:'MAP_05',side:'west',targetSpawnId:'SPAWN_FROM_MAP_07',requiresFlag:'FLAG_ESCADA_MARCO_PRUMO_UNLOCKED',status:'CANONICAL_TBD_GATE'},
    {id:'EXIT_MAP07_MAP08',from:'MAP_07',to:'MAP_08',side:'east',targetSpawnId:'SPAWN_FROM_MAP_07',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP08_MAP07',from:'MAP_08',to:'MAP_07',side:'west',targetSpawnId:'SPAWN_FROM_MAP_08',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP08_MAP10',from:'MAP_08',to:'MAP_10',side:'east',targetSpawnId:'SPAWN_FROM_MAP_08',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP10_MAP08',from:'MAP_10',to:'MAP_08',side:'west',targetSpawnId:'SPAWN_FROM_MAP_10',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP10_MAP11',from:'MAP_10',to:'MAP_11',side:'east',targetSpawnId:'SPAWN_FROM_MAP_10',status:'PROVISIONAL_RUNTIME'},
    {id:'EXIT_MAP11_MAP10',from:'MAP_11',to:'MAP_10',side:'west',targetSpawnId:'SPAWN_FROM_MAP_11',status:'PROVISIONAL_RUNTIME'}
  ]);
  const center=(width,height)=>({x:Math.floor(width/2),y:Math.floor(height/2)});
  const edgePosition=(width,height,side)=>side==='west'?{x:0,y:Math.floor(height/2)}:side==='east'?{x:width-1,y:Math.floor(height/2)}:side==='north'?{x:Math.floor(width/2),y:0}:{x:Math.floor(width/2),y:height-1};
  const inward=(position,side)=>side==='west'?{x:position.x+1,y:position.y}:side==='east'?{x:position.x-1,y:position.y}:side==='north'?{x:position.x,y:position.y+1}:{x:position.x,y:position.y-1};
  const terrain=(width,height)=>Array.from({length:height},()=>'.'.repeat(width));
  function canonicalMobs(mapId,width,height){
    const encounter=canonical&&Object.values(canonical.encounters).find(entry=>entry.mapId===mapId);
    if(!encounter)return [];
    const origin=center(width,height);
    return encounter.composition.map((entry,index)=>({id:`${encounter.id}_PLACEMENT_${index+1}`,type:entry.creatureId,x:Math.min(width-2,origin.x+index),y:origin.y,placementStatus:'PROVISIONAL_RUNTIME'}));
  }
  function buildRuntimeMaps(){
    const maps={};if(!canonical)return maps;
    Object.values(canonical.maps).forEach(metadata=>{
      const [width,height]=MAP_DIMENSIONS[metadata.id]||[];
      if(!width||!height)return;
      const defaultSpawn=center(width,height);
      const visual=mapVisuals[metadata.id],blockedCells=visual?visual.blockedCells.map(cell=>({x:cell.x,y:cell.y})):[];
      maps[metadata.id]={id:metadata.id,name:metadata.name,width,height,terrainRows:terrain(width,height),blockedCells,spawns:{SPAWN_DEFAULT:defaultSpawn},respawnPoint:{...defaultSpawn},exits:[],mobs:canonicalMobs(metadata.id,width,height),pointsOfInterest:metadata.id==='MAP_11'?[{id:'SELO_CENTRAL',coordinateStatus:'TBD',status:'CANONICAL_REFERENCE'}]:[],canonical:true,geometryStatus:'PROVISIONAL_RUNTIME',metadata};
    });
    exitBlueprints.forEach(blueprint=>{
      const map=maps[blueprint.from],target=maps[blueprint.to];if(!map||!target)return;
      const position=edgePosition(map.width,map.height,blueprint.side),exit={...blueprint,x:position.x,y:position.y};
      map.exits.push(exit);
      if(!target.spawns[blueprint.targetSpawnId]){
        const reverse=exitBlueprints.find(candidate=>candidate.from===blueprint.to&&candidate.to===blueprint.from);
        const entry=reverse?inward(edgePosition(target.width,target.height,reverse.side),reverse.side):center(target.width,target.height);
        target.spawns[blueprint.targetSpawnId]={...entry};
      }
    });
    return maps;
  }
  const mapDatabase=buildRuntimeMaps();
  const mapAdapters={};
  Object.values(mapDatabase).forEach(map=>{mapAdapters[map.id]={...map,layoutStatus:'placeholder',visualStatus:'placeholder'};});
  const reverseNpcAliases={};if(canonical)Object.entries(canonical.aliases).forEach(([canonicalId,actualId])=>{if(canonicalId.indexOf('NPC_')===0)reverseNpcAliases[actualId]=canonicalId;});
  function resolveCreature(creatureId){if(!allTemplates[creatureId])return null;const base=allTemplates[creatureId].canonicalBaseId||creatureId;return {id:creatureId,baseId:base,template:allTemplates[creatureId],exposure:allTemplates[creatureId].exposure||'NORMAL'};}
  function createEncounterSpec(encounterId){
    const encounter=canonical&&canonical.encounters[encounterId];if(!encounter)return {ok:false,reason:'UNKNOWN_ENCOUNTER'};
    const missing=encounter.composition.map(entry=>entry.creatureId).filter(id=>!resolveCreature(id));if(missing.length)return {ok:false,reason:'UNSUPPORTED_CREATURE',missing:[...new Set(missing)]};
    return {ok:true,encounterId,mobsSpec:encounter.composition.map((entry,index)=>({id:`${encounterId}_${index+1}`,type:entry.creatureId,canonicalId:entry.creatureId,exposure:entry.exposure}))};
  }
  function createCombatants(encounterId,positions=[]){
    const spec=createEncounterSpec(encounterId);if(!spec.ok)return spec;
    const rules=root.EngineRules||(typeof require!=='undefined'?require('../core/rules.js'):null);if(!rules)return {ok:false,reason:'RULES_UNAVAILABLE'};
    const combatants=spec.mobsSpec.map((mob,index)=>{const resolved=resolveCreature(mob.type),position=positions[index]||{x:1+index,y:1};return {...rules.createMob(mob,resolved.template,position),canonicalId:mob.canonicalId,exposure:mob.exposure};});
    return {ok:true,encounterId,combatants};
  }
  function adaptQuestEvent(event={}){const copy={...event};if(copy.npcId&&reverseNpcAliases[copy.npcId])copy.npcId=reverseNpcAliases[copy.npcId];return copy;}
  function normalizeMapId(mapId){return legacyMapAliases[mapId]||mapId;}
  function resolveMap(mapId){return mapAdapters[normalizeMapId(mapId)]||null;}
  function resolveSpawn(mapId,spawnId='SPAWN_DEFAULT'){const map=resolveMap(mapId),spawn=map&&map.spawns&&map.spawns[spawnId];return spawn?{x:spawn.x,y:spawn.y}:null;}
  function isWalkable(mapId,position){const map=resolveMap(mapId),x=Math.trunc(Number(position&&position.x)),y=Math.trunc(Number(position&&position.y));const blocked=map&&Array.isArray(map.blockedCells)&&map.blockedCells.some(cell=>cell.x===x&&cell.y===y);return !!(map&&Number.isFinite(x)&&Number.isFinite(y)&&x>=0&&y>=0&&x<map.width&&y<map.height&&map.terrainRows[y][x]!=='T'&&!blocked);}
  function exitAt(mapId,x,y){const map=resolveMap(mapId);return map&&map.exits.find(exit=>exit.x===x&&exit.y===y)||null;}
  function prepareTransition({mapId,exitId,flagProvider=()=>false}={}){
    const map=resolveMap(mapId),exit=map&&map.exits.find(candidate=>candidate.id===exitId);
    if(!exit)return {ok:false,reason:'UNKNOWN_EXIT'};
    if(exit.requiresFlag&&!flagProvider(exit.requiresFlag))return {ok:false,reason:'GATE_CLOSED',exitId:exit.id};
    const targetPosition=resolveSpawn(exit.to,exit.targetSpawnId);
    if(!targetPosition||!isWalkable(exit.to,targetPosition))return {ok:false,reason:'INVALID_TARGET_SPAWN',exitId:exit.id};
    return {ok:true,exitId:exit.id,targetMapId:exit.to,targetPosition};
  }
  function validateMapRegistry(){
    const errors=[];Object.values(mapDatabase).forEach(map=>{
      if(!map.width||!map.height||map.terrainRows.length!==map.height||map.terrainRows.some(row=>row.length!==map.width))errors.push(`${map.id}:dimensions`);
      Object.entries(map.spawns).forEach(([id,position])=>{if(!isWalkable(map.id,position))errors.push(`${map.id}:spawn:${id}`);});
      map.exits.forEach(exit=>{if(!isWalkable(map.id,exit)||!resolveMap(exit.to)||!resolveSpawn(exit.to,exit.targetSpawnId))errors.push(`${map.id}:exit:${exit.id}`);});
    });return {ok:errors.length===0,errors};
  }
  const api={provisional,variants,templates:allTemplates,MAP_DIMENSIONS,legacyMapAliases,mapDatabase,mapAdapters,normalizeMapId,resolveMap,resolveSpawn,isWalkable,exitAt,prepareTransition,validateMapRegistry,resolveCreature,createEncounterSpec,createCombatants,adaptQuestEvent,normalCreatureIds:Object.keys(provisional)};
  root.FimbriaRuntime=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
