
/* =========================================================================================
   TACTICAL RPG WEB v11 - Estilo Dofus/Wakfu
   Arquivo único: HTML + CSS + JS.

   NOVIDADES DESTA VERSÃO (sobre a v10) — RELÓGIO DE TURNO + ARQUITETURA MULTI-UNIDADE:
   1) RELÓGIO DE TURNO: 30s regressivos por turno (jogador OU mob), visível no topo
      do painel de combate. Ao zerar, força "Passar Turno" automaticamente
      (`forceEndTurnByTimeout`). O timer é pausado enquanto um modal (Ficha/
      Inventário) está aberto, e reinicia a cada novo turno.
   2) FILA DE INICIATIVA (`game.combatants[]` + `game.turnOrder[]`): o combate não
      é mais um 1v1 engessado. Todas as unidades (jogador + mobs) vivem no mesmo
      array; a ordem de ação é calculada uma vez no início da luta com base na
      Agilidade de cada combatente (`computeInitiativeOrder`), e `advanceTurn()`
      percorre essa fila ciclicamente, pulando quem já morreu.
   3) ARENA 12x12: o tabuleiro de combate cresceu de 8x8 para 12x12 células
      (`COMBAT_GRID_SIZE`), com posições de spawn e obstáculos redistribuídos.
      O Overworld continua em 8x8 — os dois módulos agora usam constantes de
      grade/célula independentes (`OW_*` vs `COMBAT_*`).
   4) ENCONTROS EM GRUPO: ao tocar em um mob no Overworld, `startEncounter` tenta
      puxar um segundo mob próximo (raio 2) para a mesma batalha — uma
      demonstração concreta de que a arena já suporta múltiplas unidades de
      uma vez, preparando o terreno para PvE em grupo / PvP no futuro.
   5) Mobs, equipamentos e loot mantidos da v10, com pequenos ajustes para
      funcionar com o array genérico de combatentes.
   ========================================================================================= */

// =========================================================================================
// MÁQUINA DE ESTADOS DO JOGO
// =========================================================================================
const appState = GameState.create();
let currentState = GAME_STATES.MENU;

function setGameState(newState){
  currentState = newState;
  appState.ui.screen = newState;
  document.getElementById('mainMenuScreen').style.display = (newState===GAME_STATES.MENU) ? 'flex' : 'none';
  document.getElementById('overworldScreen').style.display = (newState===GAME_STATES.OVERWORLD) ? 'flex' : 'none';
  document.getElementById('gameScreen').style.display = (newState===GAME_STATES.COMBAT) ? 'flex' : 'none';
  if(newState===GAME_STATES.MENU) renderMenuProgress();
}
function renderMenuProgress(){
  const root=document.getElementById('menuProgressInfo');
  if(!root)return;
  const itemCount=Object.values(playerState.inventory||{}).reduce((total,quantity)=>total+(Number(quantity)||0),0);
  const values={level:playerState.level,xp:playerState.xp,'xp-max':playerState.xpNextLevel,items:itemCount,points:playerState.pontosDisponiveis};
  Object.entries(values).forEach(([key,value])=>{
    const element=root.querySelector(`[data-stat="${key}"]`);
    if(element)element.textContent=String(value);
  });
  const bar=root.querySelector('[data-stat="xp-bar"]');
  if(bar){
    const xpMax=Math.max(1,Number(playerState.xpNextLevel)||1);
    const percentage=Math.max(0,Math.min(100,(Number(playerState.xp)||0)/xpMax*100));
    bar.style.width=`${percentage}%`;
  }
}


// Dados de mobs, itens e habilidades vivem em js/data/*.
// =========================================================================================
// PROGRESSÃO DO JOGADOR (persistente)
// =========================================================================================
function createInitialPlayerState(){
  return EngineRules.createPlayerState();
}
let playerState = createInitialPlayerState();
appState.player = playerState;
appState.progression = { quests:{}, currency:{}, flags:{} };

function grantXP(amount){
  const leveledUp=EngineRules.grantXp(playerState, amount);
  if(leveledUp) savePersistentState();
  return leveledUp;
}

function getEffectiveStats(){
  return EngineRules.effectiveStats(playerState, ITEM_DB);
}
function calcPlayerMaxHp(){
  return EngineRules.playerMaxHp(playerState, ITEM_DB);
}
function syncPlayerMaxHp(){
  const newMax = calcPlayerMaxHp();
  playerState.maxHp = newMax;
  const combatPlayer=game&&getPlayerCombatant();
  if(combatPlayer){
    combatPlayer.maxHp = newMax;
    combatPlayer.hp = Math.max(0, Math.min(combatPlayer.hp, newMax));
    playerState.hp = combatPlayer.hp;
  } else playerState.hp = Math.max(0, Math.min(Number.isFinite(Number(playerState.hp)) ? Math.trunc(Number(playerState.hp)) : newMax, newMax));
  updateOverworldHp();
}
function syncPersistentHpFromCombat(){
  if(!game) return;
  const player=getPlayerCombatant();
  if(!player) return;
  playerState.maxHp=calcPlayerMaxHp();
  playerState.hp=Math.max(0,Math.min(Math.trunc(Number(player.hp)||0),playerState.maxHp));
  updateOverworldHp();
}
function allocatePoint(stat){
  if(playerState.pontosDisponiveis<=0) return;
  playerState.stats[stat] += 1;
  playerState.pontosDisponiveis -= 1;
  if(stat==='vitalidade') syncPlayerMaxHp();
  savePersistentState();
  renderCharacterModal();
  if(currentState===GAME_STATES.COMBAT) updateSidePanel();
  if(currentState===GAME_STATES.MENU) renderMenuProgress();
}
function addItemsToInventory(loot){
  EngineRules.addLoot(playerState, loot);
  loot.forEach(({id,qty})=>questSystem.recordEvent({type:QuestSystem.EVENT_TYPES.ITEM_ACQUIRED,itemId:id,amount:qty,eventId:`item:${++questEventSequence}`}));
  if(loot && loot.length) savePersistentState();
}
function playerDealsDamage(baseDamage, element){
  const eff = getEffectiveStats();
  const result = EngineRules.damage(baseDamage, element, eff, GameRng);
  return { ...result, attrLabel: STAT_INFO[result.attrKey].label };
}
function equipItem(itemId){
  const item = ITEM_DB[itemId];
  if(!item || !item.equip) return;
  if(!playerState.inventory[itemId] || playerState.inventory[itemId]<=0) return;
  playerState.inventory[itemId] -= 1;
  if(playerState.inventory[itemId]<=0) delete playerState.inventory[itemId];
  const slot = item.equip.slot;
  const previous = playerState.equipment[slot];
  if(previous){ playerState.inventory[previous] = (playerState.inventory[previous]||0) + 1; }
  playerState.equipment[slot] = itemId;
  syncPlayerMaxHp();
  savePersistentState();
  renderCharacterModal();
  renderInventoryModal();
  if(currentState===GAME_STATES.COMBAT) updateSidePanel();
}
function unequipItem(slot){
  const itemId = playerState.equipment[slot];
  if(!itemId) return;
  playerState.equipment[slot] = null;
  playerState.inventory[itemId] = (playerState.inventory[itemId]||0) + 1;
  syncPlayerMaxHp();
  savePersistentState();
  renderCharacterModal();
  renderInventoryModal();
  if(currentState===GAME_STATES.COMBAT) updateSidePanel();
}

// =========================================================================================
// UTILITÁRIOS GENÉRICOS (BFS, LoS, Bresenham)
// =========================================================================================
function getCssVar(varName){ return getComputedStyle(document.documentElement).getPropertyValue(varName).trim(); }
function cellFromClientXY(canvasEl, clientX, clientY, cellSize){
  const result=Viewport.screenToGrid({clientX,clientY,rect:canvasEl.getBoundingClientRect(),logicalWidth:canvasEl.width,logicalHeight:canvasEl.height,gridSize:Math.round(canvasEl.width/cellSize)});
  return result.ok ? {x:result.x,y:result.y} : {x:-1,y:-1};
}

// =========================================================================================
// NOTIFICAÇÃO DE TRANSIÇÃO "⚔️ EM BATALHA!"
// =========================================================================================
function showEncounterFlash(onDone){
  const el = document.getElementById('encounterFlash');
  el.style.display='flex';
  requestAnimationFrame(()=>{ el.classList.add('show'); });
  GameClock.after(()=>{
    el.classList.remove('show');
    GameClock.after(()=>{ el.style.display='none'; onDone(); }, 350);
  }, 650);
}
function showReturnFlash(){
  const cue=UiFeedback.transitionPresentation('return'),el=document.getElementById('encounterFlash'),label=el.querySelector('span');label.textContent=cue.label;el.classList.add(cue.className);el.style.display='flex';
  requestAnimationFrame(()=>el.classList.add('show'));
  GameClock.after(()=>{el.classList.remove('show');GameClock.after(()=>{el.style.display='none';el.classList.remove('returning');label.textContent='⚔️ EM BATALHA! ⚔️';},300);},180);
}

// =========================================================================================
// MÓDULO DE OVERWORLD (mapa 8x8 de exploração)
// =========================================================================================
const LOGICAL_CANVAS_WIDTH=480;
const LOGICAL_CANVAS_HEIGHT=480;
function getCanvasLogicalSize(canvasElement){return {width:Math.max(1,Math.trunc(Number(canvasElement&&canvasElement.clientWidth)||LOGICAL_CANVAS_WIDTH)),height:Math.max(1,Math.trunc(Number(canvasElement&&canvasElement.clientHeight)||LOGICAL_CANVAS_HEIGHT))};}
function getProjectionPadding(view){return Math.max(12,Math.min(view.width,view.height)*.07);}
function canvasContentRect(canvasElement){
  const rect=canvasElement.getBoundingClientRect(),style=window.getComputedStyle(canvasElement),left=parseFloat(style.borderLeftWidth)||0,right=parseFloat(style.borderRightWidth)||0,top=parseFloat(style.borderTopWidth)||0,bottom=parseFloat(style.borderBottomWidth)||0;
  return {left:rect.left+left,top:rect.top+top,width:Math.max(1,rect.width-left-right),height:Math.max(1,rect.height-top-bottom)};
}
function canvasPointFromClient(canvasElement,clientX,clientY){const size=getCanvasLogicalSize(canvasElement);return Viewport.screenToCanvas({clientX,clientY,rect:canvasContentRect(canvasElement),logicalWidth:size.width,logicalHeight:size.height});}
const overworldCanvas = document.getElementById('overworldCanvas');
const owCtx = overworldCanvas.getContext('2d');
let overworldHoverCell = null;
const runtimeMapDatabase = FimbriaRuntime.mapDatabase;
const visualAssetLoader=AssetLoader.create({manifest:VisualAssets});
// This is the explicit V4 selection only, never a directory scan or a render-loop allocation.
visualAssetLoader.preload(Object.keys(VisualAssets.ASSETS));
const characterAssetLoader=AssetLoader.create({manifest:CharacterAssets});
characterAssetLoader.preload(CharacterAssets.ids);
const entityAnimations=EntityAnimation.create({assets:CharacterAssets.ASSETS,walkDurationMs:160});
const audioManager=AudioManager.create({manifest:AudioAssets});
window.GameAudio=audioManager;
function playUiButtonSound(button){
  if(!button||button.disabled)return;
  if(button.matches('[data-buy],[data-sell]'))return;
  if(button.matches('#invBtn,#invBtnMenu,#invBtnOverworld'))return audioManager.play(activeModal==='inventory'?'SFX_UI_CANCEL':'SFX_INVENTORY');
  if(button.matches('#questBtn,#questBtnOverworld'))return audioManager.play(activeModal==='quests'?'SFX_BOOK_CLOSE':'SFX_BOOK_OPEN');
  if(button.dataset.audioAction==='close')return audioManager.play('SFX_UI_CANCEL');
  if(button.matches('.close-x[data-close="quests"]'))return audioManager.play('SFX_BOOK_CLOSE');
  if(button.matches('.close-x,#merchantClose,#menuBtn,#menuBtnOverworld,#backToMenuBtn'))return audioManager.play('SFX_UI_CANCEL');
  if(button.matches('#startExploreBtn,#continueExploringBtn,#endTurnBtn,.quest-accept')||button.matches('.npc-dialog-options button:not([data-audio-action="close"])'))return audioManager.play('SFX_UI_CONFIRM');
  return audioManager.play('SFX_UI_CLICK');
}
document.addEventListener('click',event=>{if(!event.isTrusted)return;audioManager.unlock();const button=event.target.closest&&event.target.closest('button');if(button)playUiButtonSound(button);},true);
document.addEventListener('pointerup',event=>{if(event.isTrusted)audioManager.unlock();},true);
let lastUiHoverSoundAt=-Infinity;
document.addEventListener('pointerover',event=>{
  if(!event.isTrusted||event.pointerType!=='mouse')return;const button=event.target.closest&&event.target.closest('button');
  if(!button||button.disabled||event.relatedTarget&&button.contains(event.relatedTarget))return;
  if(!button.matches('.sotomar-button,.ability,.controls button,.shortcut-bar button,.quest-accept,.npc-dialog-options button,.modal-box button'))return;
  const now=performance.now();if(now-lastUiHoverSoundAt<180)return;lastUiHoverSoundAt=now;audioManager.play('SFX_UI_HOVER');
},true);
let previousAnimationFrameTime=null;
function advanceEntityAnimations(now){const time=Number(now)||0;if(previousAnimationFrameTime!==null)entityAnimations.advance(Math.max(0,time-previousAnimationFrameTime));previousAnimationFrameTime=time;}


function getMap(mapId){ return FimbriaRuntime.resolveMap(mapId); }
function mapBounds(map){return {width:Number(map&&map.width)||0,height:Number(map&&map.height)||0};}
function inBoundsOverworldMap(map,x,y){const {width,height}=mapBounds(map);return x>=0&&y>=0&&x<width&&y<height;}
function isOverworldTerrainObstacle(map,x,y){ return !inBoundsOverworldMap(map,x,y)||map.terrainRows[y][x]==='T'; }
function isOverworldObstacle(map,x,y){ return !inBoundsOverworldMap(map,x,y)||map.terrainRows[y][x]==='T'||(Array.isArray(map.blockedCells)&&map.blockedCells.some(cell=>cell.x===x&&cell.y===y)); }
function isOverworldBlocked(map,x,y){ return isOverworldObstacle(map,x,y)||npcSystem.isOccupied(overworldState.currentMapId,x,y); }
function getRespawnPoint(mapId='MAP_01'){
  const point=FimbriaRuntime.resolveSpawn(mapId,'SPAWN_DEFAULT');
  return point ? {x:point.x,y:point.y} : {x:0,y:0};
}

function createInitialWorldState(){
  return { currentMapId:'MAP_01', player:getRespawnPoint('MAP_01'), mapRuntime:{}, moving:false, moveInterval:null, currentEncounterMobIds:null, pendingReturn:null };
}
let overworldState = createInitialWorldState();
appState.world = overworldState;
const saveSystem = SaveSystem.createSaveSystem({
  storage: new SaveSystem.LocalStorageAdapter(),
  mapDatabase:runtimeMapDatabase, itemDb: ITEM_DB,
  createInitialPlayerState, createInitialWorldState,
  normalizeMapId:FimbriaRuntime.normalizeMapId,
  stateProvider:()=>({player:playerState,world:overworldState,progression:appState.progression})
});
const loadedSave = saveSystem.load();
if(loadedSave.loaded){
  playerState = loadedSave.player;
  overworldState = loadedSave.world;
  appState.player = playerState;
  appState.world = overworldState;
  appState.progression = loadedSave.progression;
}
function savePersistentState(){ saveSystem.saveNow(); }
let worldStateEngine = null;
const runtimeQuestDb=FimbriaQuestAdapter.createQuestDatabase(QUEST_DB,FIMBRIA_CANONICAL.quests);
const questSystem = QuestSystem.createQuestSystem({
  questDb: runtimeQuestDb,
  progression: appState.progression.quests || (appState.progression.quests={}),
  autoComplete:false,
  flagProvider:(flag)=>!!(worldStateEngine&&worldStateEngine.hasFlag(flag)),
  inventoryProvider:()=>playerState,
  flagSink:(flag)=>{ if(worldStateEngine) worldStateEngine.setFlag(flag,true); },
  eventAdapter:(event)=>FimbriaRuntime.adaptQuestEvent(event),
  rewardSink:(rewards)=>{
    if(rewards.xp) grantXP(rewards.xp);
    if(Array.isArray(rewards.items)) addItemsToInventory(rewards.items.map(item=>({id:item.itemId,qty:item.amount})));
  },
  onChanged:()=>{ renderQuestPanel(); savePersistentState(); }
});
worldStateEngine = WorldState.createWorldState({
  progressionProvider:()=>appState.progression,
  questSystem,
  onChanged:()=>savePersistentState()
});
const inspectionSystem=FimbriaInspections.createInspectionSystem({
  runtime:FimbriaRuntime,
  worldState:worldStateEngine,
  questSystem,
  itemSink:({itemId,amount})=>EngineRules.addLoot(playerState,[{id:itemId,qty:amount}])
});
const fimbriaNarrative = FimbriaNarrative.createNarrativeAdapter({
  questSystem,
  worldState:worldStateEngine,
  inventoryProvider:()=>playerState,
  onChanged:()=>{ renderQuestPanel(); savePersistentState(); }
});
function handleSineiraNarrativeEvent(event){return fimbriaNarrative.handleBossResolved(event);}
function inspectSineiraSeal(options={}){return fimbriaNarrative.inspectSeal(options);}
function createSineiraNarrativeEncounter(options={}){
  return SineiraStrategy.createSineiraEncounter({...options,onEvent:event=>{if(event.type==='BOSS_RESOLVED')handleSineiraNarrativeEvent(event);}});
}
const mapGateEngine = MapGates.createGateEngine({
  flagProvider:flag=>worldStateEngine.hasFlag(flag),
  questStateProvider:id=>questSystem.getQuestState(id)
});
function inspectWorldPoint(pointId,options={}){ return worldStateEngine.inspect(pointId,options); }
function canonicalExitsFrom(mapId){ return mapGateEngine.destinations(mapId,FIMBRIA_CANONICAL.exits); }
let questEventSequence = 0;
const npcSystem = NpcSystem.createNpcSystem({
  npcDb:FimbriaQuestAdapter.createNpcDatabase(NPC_DB,FIMBRIA_CANONICAL.quests,FIMBRIA_CANONICAL.aliases),
  questSystem,
  worldProvider:()=>overworldState,
  playerProvider:()=>game&&getPlayerCombatant()||playerState,
  mapIdResolver:FimbriaRuntime.normalizeMapId,
  onChanged:(event)=>{ if(event.type==='HEALED') updateOverworldHint('Nilo restaurou suas forças.'); renderQuestPanel(); savePersistentState(); }
});
const economySystem = EconomySystem.createEconomySystem({
  playerProvider:()=>playerState,
  progressionProvider:()=>appState.progression,
  itemDb:ITEM_DB,
  catalog:ECONOMY_DATA.CATALOG,
  currencyId:ECONOMY_DATA.CURRENCY_ID,
  onChanged:(event)=>{ renderInventoryModal(); renderMerchantModal(); savePersistentState(); }
});
const consumableSystem = ConsumableSystem.createConsumableSystem({
  itemDb:ITEM_DB,
  playerProvider:()=>playerState,
  inventoryProvider:()=>playerState,
  combatProvider:()=>game&&!game.gameOver&&currentState===GAME_STATES.COMBAT?{player:getPlayerCombatant(),canUse:getCurrentCombatant()===getPlayerCombatant()}:null,
  onChanged:(event)=>{
    if(event.inCombat&&event.target) playerState.hp=Math.max(0,Math.min(event.target.hp,calcPlayerMaxHp()));
    else EngineRules.clampPlayerHp(playerState,ITEM_DB);
    updateOverworldHp();
    renderInventoryModal();
    if(game) updateSidePanel();
    savePersistentState();
  }
});
let mobMoveTimer = null;
const MIN_ALIVE_MOBS = 2;
const MAX_MOB_SLOTS  = 4;

function ensureMapRuntimeState(mapId){
  if(overworldState.mapRuntime[mapId]) return;
  const map = getMap(mapId);
  overworldState.mapRuntime[mapId] = {
    mobs: map.mobs.map((m,i)=>({ id:`${mapId}_mob_${i}`, type:m.type, x:m.x, y:m.y, isAlive:true, engaged:false }))
  };
  ensureMinimumMobs(mapId);
}
function getCurrentMap(){ return getMap(overworldState.currentMapId); }
function getCurrentRuntime(){ return overworldState.mapRuntime[overworldState.currentMapId]; }
function getMobAt(x,y){
  const runtime=getCurrentRuntime();
  if(!runtime) return null;
  return runtime.mobs.find(m=>m.isAlive && !m.engaged && m.x===x && m.y===y) || null;
}
function ensureMinimumMobs(mapId){
  const map = getMap(mapId);
  if(!map.mobs || map.mobs.length===0) return;
  const runtime = overworldState.mapRuntime[mapId];
  if(!runtime) return;
  const aliveCount = runtime.mobs.filter(m=>m.isAlive && !m.engaged).length;
  if(aliveCount >= MIN_ALIVE_MOBS) return;
  if(runtime.mobs.length >= MAX_MOB_SLOTS) return;
  const cell = findRandomFreeCell(map, runtime);
  if(!cell) return;
  const availableTypes = [...new Set(map.mobs.map(m=>m.type))];
  const randomType = availableTypes[GameRng.int(0, availableTypes.length-1)];
  runtime.mobs.push({
    id: `${mapId}_mob_spawn_${runtime.mobs.length}_${Date.now()}`,
    type: randomType, x: cell.x, y: cell.y, isAlive:true, engaged:false
  });
}

function updateMapNameLabel(){ document.getElementById('mapNameLabel').textContent = getCurrentMap().name; }
function updateOverworldHint(text){ document.getElementById('owHint').textContent = text; }
function updateOverworldHp(){
  const hp=Math.max(0,Math.trunc(Number(playerState.hp)||0));
  const maxHp=Math.max(1,Math.trunc(Number(playerState.maxHp)||calcPlayerMaxHp()));
  const el=document.getElementById('owHpStatus');
  if(el) el.textContent=`HP ${hp} / ${maxHp}`;
  const hpEl=document.getElementById('owHudHp'),levelEl=document.getElementById('owHudLevel');
  if(hpEl) hpEl.textContent=`${hp}/${maxHp}`;
  if(levelEl) levelEl.textContent=playerState.level;
}

function renderQuestTracker(){
  const container=document.getElementById('questTracker');
  if(!container) return;
  const tracker=UiHud.activeQuestTracker(questSystem.getActiveQuests());
  container.replaceChildren();
  if(!tracker){
    const empty=document.createElement('div');empty.className='quest-tracker-empty';empty.textContent='Nenhuma quest ativa.';container.appendChild(empty);return;
  }
  const title=document.createElement('div');title.className='quest-tracker-title';title.textContent=`📜 ${tracker.title}`;container.appendChild(title);
  tracker.objectives.forEach(objective=>{
    const line=document.createElement('div');line.className=`quest-tracker-objective ${objective.complete?'complete':''}`;
    line.textContent=`${objective.label}: ${objective.current}/${objective.required}`;container.appendChild(line);
  });
}

function renderQuestPanel(){
  const activeEl=document.getElementById('questActiveList'), availableEl=document.getElementById('questAvailableList'), completedEl=document.getElementById('questCompletedList');
  if(!activeEl||!availableEl||!completedEl) return;
  const renderList=(container,entries,emptyText,withAccept)=>{
    container.replaceChildren();
    if(!entries.length){const empty=document.createElement('div');empty.className='quest-empty';empty.textContent=emptyText;container.appendChild(empty);return;}
    entries.forEach(({quest,objectives,state})=>{
      const ready=objectives.length>0&&objectives.every(o=>o.complete);const card=document.createElement('div');card.className=`quest-card ${state==='COMPLETED'?'completed':''}`;card.setAttribute('aria-label',`${quest.title} — ${state==='COMPLETED'?'Concluída':ready?'Pronta':'Em andamento'}`);
      const title=document.createElement('div');title.className='quest-title';title.textContent=quest.title;card.appendChild(title);
      const desc=document.createElement('div');desc.className='quest-desc';desc.textContent=quest.description;card.appendChild(desc);
      const status=document.createElement('div');status.className='quest-status';status.textContent=state==='COMPLETED'?'Concluída':ready?'Pronta para concluir':'Em andamento';card.appendChild(status);
      objectives.forEach(o=>{const line=document.createElement('div');line.className=`quest-objective ${o.complete?'complete':''}`;line.textContent=`${UiFeedback.objectiveLabel(o)}: ${o.current}/${o.required}`;card.appendChild(line);});
      if(withAccept){const button=document.createElement('button');button.className='quest-accept';button.textContent='Aceitar';button.onclick=()=>{questSystem.acceptQuest(quest.id);};card.appendChild(button);}
      container.appendChild(card);
    });
  };
  renderList(activeEl,questSystem.getActiveQuests(),'Nenhuma quest ativa.',false);
  renderList(availableEl,questSystem.getAvailableQuests(),'Nenhuma quest disponível. Converse com um NPC para receber novas tarefas.',false);
  renderList(completedEl,questSystem.getCompletedQuests(),'Nenhuma quest concluída.',false);
  renderQuestTracker();
}

function enterOverworld(){
  ensureMapRuntimeState(overworldState.currentMapId);
  updateMapNameLabel();
  updateOverworldHint('Toque em uma célula para andar. Toque em um mob para lutar!');
  setGameState(GAME_STATES.OVERWORLD);
  recordOverworldVisit(overworldState.currentMapId);
  renderQuestPanel();
  savePersistentState();
  startMobMovementTimer();
}
function transitionThroughExit(exit){
  const transition=FimbriaRuntime.prepareTransition({mapId:overworldState.currentMapId,exitId:exit.id,flagProvider:flag=>appState.progression.flags&&appState.progression.flags[flag]===true});
  if(!transition.ok){updateOverworldHint(transition.reason==='GATE_CLOSED'?'Esta passagem permanece bloqueada.':'Transição indisponível.');return false;}
  // The adapter resolves map and spawn before state changes, avoiding an invalid intermediate location.
  overworldState.currentMapId=transition.targetMapId;overworldState.player={...transition.targetPosition};overworldHoverCell=null;
  ensureMapRuntimeState(transition.targetMapId);ensureMinimumMobs(transition.targetMapId);updateMapNameLabel();
  updateOverworldHint(`Você chegou em: ${getCurrentMap().name}`);
  recordOverworldVisit(transition.targetMapId);savePersistentState();return true;
}
function recordOverworldVisit(mapId){
  FimbriaQuestAdapter.acceptMapAssignedQuests(mapId,FIMBRIA_CANONICAL.maps,questSystem);
  questSystem.recordEvent({type:QuestSystem.EVENT_TYPES.MAP_VISITED,mapId});
}
function bfsOverworldPath(map, start, target){
  const {width,height}=mapBounds(map),{dist,parent}=bfsGeneric(start.x,start.y,(x,y)=>isOverworldBlocked(map,x,y),Math.max(width,height));
  const k = target.x+','+target.y;
  if(!dist.has(k)) return null;
  return reconstructPath(parent, start.x, start.y, target.x, target.y);
}
function inspectCanonicalPoint(point){
  if(!point||point.mapId!==overworldState.currentMapId||overworldState.player.x!==point.x||overworldState.player.y!==point.y)return false;
  const result=inspectionSystem.inspect(point.id);
  if(result.ok)updateOverworldHint(result.duplicate?'Este ponto já foi inspecionado.':`Você encontrou: ${ITEM_DB[result.itemId].name}.`);
  return result.ok;
}
function moveAlongPath(path,onArrive=null){
  if(overworldState.moving || path.length===0) return;
  overworldState.moving = true;
  let i=0;
  overworldState.moveInterval = GameClock.every(()=>{
    if(i>=path.length){ stopMoving(); if(onArrive)onArrive(); return; }
    const step = path[i]; i++;
    const from={x:overworldState.player.x,y:overworldState.player.y};
    entityAnimations.startMove('player',from,step,{assetId:CharacterAssets.PLAYER_ID});
    audioManager.playRandom(['SFX_FOOTSTEP_01','SFX_FOOTSTEP_02','SFX_FOOTSTEP_03','SFX_FOOTSTEP_04']);
    overworldState.player.x = step.x;
    overworldState.player.y = step.y;
    const mobHere = getMobAt(step.x, step.y);
    if(mobHere){ stopMoving(); startEncounter(mobHere); return; }
    const exit=FimbriaRuntime.exitAt(overworldState.currentMapId,step.x,step.y);
    if(exit){stopMoving();transitionThroughExit(exit);return;}
  }, 160);
}
function stopMoving(){
  if(overworldState.moveInterval) GameClock.cancel(overworldState.moveInterval);
  overworldState.moveInterval=null;
  overworldState.moving=false;
  if(currentState===GAME_STATES.OVERWORLD) savePersistentState();
}
function handleOverworldClick(x,y){
  if(currentState!==GAME_STATES.OVERWORLD || overworldState.moving) return;
  if(!inBoundsOverworldMap(getCurrentMap(),x,y)) return;
  const map = getCurrentMap();
  const inspectionPoint=inspectionSystem.pointAt(overworldState.currentMapId,x,y);
  if(inspectionPoint){
    if(overworldState.player.x===x&&overworldState.player.y===y){inspectCanonicalPoint(inspectionPoint);return;}
    if(isOverworldObstacle(map,x,y)){updateOverworldHint('Esse ponto não pode ser alcançado.');return;}
    const inspectionPath=bfsOverworldPath(map,overworldState.player,{x,y});
    if(!inspectionPath){updateOverworldHint('Não há caminho livre até esse ponto.');return;}
    moveAlongPath(inspectionPath,()=>inspectCanonicalPoint(inspectionPoint));
    return;
  }
  const npc=npcSystem.getAt(overworldState.currentMapId,x,y);
  if(npc){
    if(npcSystem.canInteract(npc.id,overworldState.currentMapId,overworldState.player)) openNpcDialogue(npc.id);
    else updateOverworldHint(`Aproxime-se de ${npc.name} para interagir.`);
    return;
  }
  if(isOverworldObstacle(map,x,y)){ updateOverworldHint('Não é possível atravessar essa árvore.'); return; }
  const path = bfsOverworldPath(map, overworldState.player, {x,y});
  if(!path){ updateOverworldHint('Não há caminho livre até essa célula.'); return; }
  if(path.length===0) return;
  moveAlongPath(path);
}
function moveMobsRandomly(){
  if(currentState!==GAME_STATES.OVERWORLD) return;
  ensureMinimumMobs(overworldState.currentMapId);
  const runtime = getCurrentRuntime();
  if(!runtime) return;
  const map = getCurrentMap();
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(const mob of runtime.mobs){
    if(!mob.isAlive || mob.engaged) continue;
    if(GameRng.random()>0.7) continue;
    const [dx,dy] = dirs[GameRng.int(0,3)];
    const nx=mob.x+dx, ny=mob.y+dy;
    if(!inBoundsOverworldMap(map,nx,ny) || isOverworldBlocked(map,nx,ny)) continue;
    mob.x=nx; mob.y=ny;
    if(nx===overworldState.player.x && ny===overworldState.player.y){ startEncounter(mob); return; }
  }
}
function startMobMovementTimer(){ stopMobMovementTimer(); mobMoveTimer=GameClock.every(moveMobsRandomly, 3000); }
function stopMobMovementTimer(){ if(mobMoveTimer){ GameClock.cancel(mobMoveTimer); mobMoveTimer=null; } }
function findRandomFreeCell(map, runtime){
  for(let tries=0; tries<30; tries++){
    const {width,height}=mapBounds(map),x=GameRng.int(0,width-1),y=GameRng.int(0,height-1);
    if(isOverworldObstacle(map,x,y)) continue;
    if(npcSystem.isOccupied(overworldState.currentMapId,x,y)) continue;
    if(x===overworldState.player.x && y===overworldState.player.y) continue;
    if(runtime.mobs.some(m=>m.isAlive && m.x===x && m.y===y)) continue;
    return {x,y};
  }
  return null;
}
function scheduleRespawn(mapId, mobId){
  const delay = GameRng.int(5000, 10000);
  GameClock.after(()=>{
    const runtime = overworldState.mapRuntime[mapId];
    if(!runtime) return;
    const mob = runtime.mobs.find(m=>m.id===mobId);
    if(!mob) return;
    const map = getMap(mapId);
    const cell = findRandomFreeCell(map, runtime);
    if(cell){ mob.x=cell.x; mob.y=cell.y; }
    mob.isAlive = true;
    mob.engaged = false;
  }, delay);
}

// =========================================================================================
// GATILHO DE COMBATE (Overworld -> Combate) — agora suporta ENCONTROS EM GRUPO
// =========================================================================================
// startEncounter: engaja o mob tocado e, se houver outro mob livre a até 2
// células de distância, também o puxa para a mesma luta — uma demonstração
// concreta do combate multi-unidade (1 jogador vs até 2 mobs simultâneos).
function startEncounter(primaryMob){
  overworldState.pendingReturn = { mapId: overworldState.currentMapId, x: overworldState.player.x, y: overworldState.player.y };
  saveSystem.captureSafeState(overworldState);
  savePersistentState();
  primaryMob.engaged = true;
  const groupIds = [primaryMob.id];

  const runtime = getCurrentRuntime();
  if(runtime){
    const nearby = runtime.mobs.find(m=> m.id!==primaryMob.id && m.isAlive && !m.engaged && manhattan(m, overworldState.player)<=2);
    if(nearby){ nearby.engaged=true; groupIds.push(nearby.id); }
  }
  overworldState.currentEncounterMobIds = groupIds;

  const mobsSpec = groupIds.map(id=>{
    const m = runtime.mobs.find(mm=>mm.id===id);
    return { id: m.id, type: m.type };
  });

  stopMobMovementTimer();
  showEncounterFlash(()=>{ startCombat(mobsSpec); });
}

// returnToOverworldAfterCombat: resolve o destino de CADA mob envolvido no
// encontro (derrotado -> respawn agendado; sobrevivente -> volta a vagar).
function returnToOverworldAfterCombat(){
  const runtime = getCurrentRuntime();
  const ids = overworldState.currentEncounterMobIds || [];
  const defeatedPlayer=!!(game&&getPlayerCombatant()&&getPlayerCombatant().hp<=0);
  if(defeatedPlayer){
    ids.forEach(id=>{const mob=runtime&&runtime.mobs.find(m=>m.id===id);if(mob)mob.engaged=false;});
    overworldState.currentEncounterMobIds=null;
    overworldState.currentMapId='MAP_01';
    overworldState.player=getRespawnPoint('MAP_01');
    ensureMapRuntimeState('MAP_01');
    playerState.maxHp=calcPlayerMaxHp();
    playerState.hp=playerState.maxHp;
    resetCombatState();
    document.getElementById('overlay').style.display='none';
    updateMapNameLabel();
    updateOverworldHp();
    updateOverworldHint('Você se recuperou na vila e voltou ao ponto seguro.');
    setGameState(GAME_STATES.OVERWORLD);
    showReturnFlash();
    saveSystem.clearSafeState();
    savePersistentState();
    startMobMovementTimer();
    return;
  }
  let anyDefeated = false;
  ids.forEach(id=>{
    const mob = runtime && runtime.mobs.find(m=>m.id===id);
    if(!mob) return;
    const combatant = game && game.combatants.find(c=>c.id===id);
    const defeated = !!(combatant && combatant.hp<=0);
    if(defeated){
      anyDefeated = true;
      mob.isAlive=false; mob.engaged=false;
      scheduleRespawn(overworldState.currentMapId, mob.id);
    } else {
      mob.engaged=false;
    }
  });
  overworldState.currentEncounterMobIds=null;

  resetCombatState();

  document.getElementById('overlay').style.display='none';
  ensureMinimumMobs(overworldState.currentMapId);
  updateMapNameLabel();
  updateOverworldHint(anyDefeated
    ? 'Você retornou à exploração. Os mobs derrotados devem reaparecer em breve!'
    : 'Você retornou à exploração. Continue procurando por desafios!');
  setGameState(GAME_STATES.OVERWORLD);
  showReturnFlash();
  saveSystem.clearSafeState();
  savePersistentState();
  updateOverworldHp();
  startMobMovementTimer();
}

function getOverworldDimensions(map){
  const rows=Number(map&&map.height)||Array.isArray(map&&map.terrainRows)&&map.terrainRows.length||0;
  const columns=Number(map&&map.width)||rows&&Math.max(...map.terrainRows.map(row=>String(row).length))||0;
  return {columns:Math.max(1,columns),rows:Math.max(1,rows)};
}
function getOverworldProjection(map=getCurrentMap()){
  const {columns,rows}=getOverworldDimensions(map),view=getCanvasLogicalSize(overworldCanvas),registeredMaps=Object.values(FimbriaRuntime.mapDatabase||{});
  const referenceColumns=Math.max(columns,...registeredMaps.map(entry=>getOverworldDimensions(entry).columns));
  const referenceRows=Math.max(rows,...registeredMaps.map(entry=>getOverworldDimensions(entry).rows));
  const projection=Isometric.fitProjectionWithReferenceBounds({canvasWidth:view.width,canvasHeight:view.height,columns,rows,referenceColumns,referenceRows,preferredTileWidth:54,preferredTileHeight:27,padding:getProjectionPadding(view)});
  // A small presentation-only bias balances the vertical composition; picking shares this projection.
  projection.originY+=getProjectionPadding(view)*.3;
  return projection;
}
function overworldCenter(cell,projection){return Isometric.gridToScreen({x:cell.x,y:cell.y,projection});}
function overworldDiamondPath(cell,projection,inset=0){
  const center=overworldCenter(cell,projection),halfWidth=Math.max(1,projection.tileWidth/2-inset),halfHeight=Math.max(1,projection.tileHeight/2-inset);
  owCtx.beginPath();owCtx.moveTo(center.x,center.y-halfHeight);owCtx.lineTo(center.x+halfWidth,center.y);owCtx.lineTo(center.x,center.y+halfHeight);owCtx.lineTo(center.x-halfWidth,center.y);owCtx.closePath();
  return center;
}
function drawOverworldDiamond(cell,projection,fill,stroke='rgba(0,0,0,0.25)',lineWidth=1){
  overworldDiamondPath(cell,projection);owCtx.fillStyle=fill;owCtx.fill();owCtx.strokeStyle=stroke;owCtx.lineWidth=lineWidth;owCtx.stroke();
}
function drawOverworldFloor(cell,projection,mapId,fill,stroke,lineWidth){
  const center=overworldCenter(cell,projection),assetId=VisualAssets.floorAssetId(mapId,cell.x,cell.y);
  const drew=assetId&&visualAssetLoader.draw(owCtx,assetId,{x:center.x,y:center.y,projection});
  if(!drew)drawOverworldDiamond(cell,projection,fill,stroke,lineWidth);
  return !!drew;
}
function drawOverworldObstacle(cell,projection){
  const anchor=overworldCenter(cell,projection),radius=Math.max(5,projection.tileHeight*0.42);
  owCtx.save();owCtx.fillStyle=getCssVar('--ow-tree');owCtx.beginPath();owCtx.ellipse(anchor.x,anchor.y-projection.tileHeight*0.18,radius,radius*0.72,0,0,Math.PI*2);owCtx.fill();owCtx.strokeStyle='rgba(255,255,255,0.14)';owCtx.lineWidth=1;owCtx.stroke();owCtx.restore();
}
function drawOverworldVisualProp(entry,projection){
  const center=overworldCenter(entry,projection);
  if(visualAssetLoader.draw(owCtx,entry.assetId,{x:center.x,y:center.y,projection}))return;
  // A failed or pending image remains a presentation concern and keeps a safe local fallback.
  drawOverworldObstacle(entry,projection);
}
function drawOverworldIndicator(npc,projection,indicator){
  const anchor=overworldCenter(npc.position,projection),x=anchor.x+projection.tileWidth*0.22,y=anchor.y-projection.tileHeight*1.15;
  owCtx.fillStyle='#12141a';owCtx.beginPath();owCtx.arc(x,y,10,0,Math.PI*2);owCtx.fill();
  owCtx.fillStyle=indicator==='?'?getCssVar('--accent2'):indicator==='!'?getCssVar('--ok'):getCssVar('--muted');
  owCtx.font='bold 14px sans-serif';owCtx.textAlign='center';owCtx.textBaseline='middle';owCtx.fillText(indicator,x,y);
}
const OVERWORLD_BACKDROP_STYLES=Object.freeze({
  MAP_01:{base:'#263328',light:'#40513b',accent:'#c18a46',motif:'village'},
  MAP_02:{base:'#26382b',light:'#4c603d',accent:'#a4a968',motif:'field'},
  MAP_03:{base:'#25372d',light:'#425c43',accent:'#8b9c62',motif:'grove'},
  MAP_04:{base:'#202f28',light:'#3b5140',accent:'#8c744d',motif:'forest'},
  MAP_05:{base:'#2e302d',light:'#555346',accent:'#b59a67',motif:'stone'},
  MAP_06:{base:'#1e3440',light:'#315564',accent:'#79b4b4',motif:'water'},
  MAP_07:{base:'#1c302a',light:'#344b38',accent:'#74885c',motif:'forest'},
  MAP_08:{base:'#2d3029',light:'#56503a',accent:'#c09250',motif:'camp'},
  MAP_09:{base:'#353630',light:'#65634d',accent:'#c6c5a0',motif:'stone'},
  MAP_10:{base:'#252e35',light:'#44515a',accent:'#a5a9a1',motif:'cold'},
  MAP_11:{base:'#34332f',light:'#625b49',accent:'#dfc98d',motif:'arena'}
});
function drawOverworldBackdrop(mapId){
  const view=getCanvasLogicalSize(overworldCanvas),viewWidth=view.width,viewHeight=view.height;
  const style=OVERWORLD_BACKDROP_STYLES[mapId]||OVERWORLD_BACKDROP_STYLES.MAP_01;
  const gradient=owCtx.createLinearGradient(0,0,viewWidth,viewHeight);
  gradient.addColorStop(0,style.light);gradient.addColorStop(1,style.base);
  owCtx.fillStyle=gradient;owCtx.fillRect(0,0,viewWidth,viewHeight);

  const shade=owCtx.createRadialGradient(viewWidth/2,viewHeight/2,Math.min(viewWidth,viewHeight)*.075,viewWidth/2,viewHeight/2,Math.max(viewWidth,viewHeight)*.7);
  shade.addColorStop(0,'rgba(8,14,17,0)');shade.addColorStop(1,'rgba(8,14,17,.44)');
  owCtx.fillStyle=shade;owCtx.fillRect(0,0,viewWidth,viewHeight);

  owCtx.save();owCtx.globalAlpha=.19;owCtx.strokeStyle=style.accent;owCtx.lineWidth=1;
  for(let i=0;i<5;i++){
    const y=viewHeight*(.08+i*.2);
    owCtx.beginPath();owCtx.moveTo(-16,y);
    owCtx.bezierCurveTo(viewWidth*.25,y-26+(i%2)*32,viewWidth*.72,y+24-(i%2)*28,viewWidth+16,y-6);
    owCtx.stroke();
  }
  owCtx.restore();

  owCtx.save();owCtx.globalAlpha=.25;owCtx.strokeStyle=style.accent;owCtx.fillStyle=style.accent;owCtx.lineWidth=1.5;
  if(style.motif==='water'){
    for(let i=0;i<7;i++){
      const y=viewHeight*(.06+i*.14);
      owCtx.beginPath();owCtx.moveTo(0,y);owCtx.bezierCurveTo(viewWidth*.25,y-20,viewWidth*.55,y+24,viewWidth,y-8);owCtx.stroke();
    }
  } else if(style.motif==='forest'||style.motif==='grove'){
    [[.07,.13],[.91,.11],[.1,.83],[.92,.86],[.48,.05],[.53,.94]].forEach(([rx,ry],i)=>{
      const x=rx*viewWidth,y=ry*viewHeight,r=7+(i%3)*2;
      owCtx.beginPath();owCtx.arc(x,y,r,0,Math.PI*2);owCtx.fill();
      owCtx.beginPath();owCtx.arc(x-r*.3,y-r*.25,r*.55,0,Math.PI*2);owCtx.stroke();
    });
  } else if(style.motif==='stone'||style.motif==='arena'||style.motif==='cold'){
    [[0,0],[viewWidth,0],[0,viewHeight],[viewWidth,viewHeight]].forEach(([x,y],i)=>{
      owCtx.beginPath();owCtx.arc(x,y,36+i%2*12,0,Math.PI*.5);owCtx.stroke();
      owCtx.beginPath();owCtx.arc(x,y,52+i%2*12,0,Math.PI*.5);owCtx.stroke();
    });
  } else {
    owCtx.beginPath();owCtx.moveTo(0,viewHeight*.76);owCtx.quadraticCurveTo(viewWidth*.4,viewHeight*.58,viewWidth,viewHeight*.68);owCtx.stroke();
    owCtx.beginPath();owCtx.moveTo(0,viewHeight*.8);owCtx.quadraticCurveTo(viewWidth*.4,viewHeight*.62,viewWidth,viewHeight*.72);owCtx.stroke();
  }
  owCtx.restore();
}
function renderOverworldFrame(now){
  advanceEntityAnimations(now);
  updateOverworldHp();
  const view=getCanvasLogicalSize(overworldCanvas);
  CanvasResolution.configure({canvas:overworldCanvas,context:owCtx,logicalWidth:view.width,logicalHeight:view.height,devicePixelRatio:window.devicePixelRatio||1});
  owCtx.clearRect(0,0,view.width,view.height);
  const map=getCurrentMap(),dimensions=getOverworldDimensions(map),projection=getOverworldProjection(map);
  drawOverworldBackdrop(overworldState.currentMapId);
  for(let y=0;y<dimensions.rows;y++)for(let x=0;x<dimensions.columns;x++){
    const isTree=isOverworldObstacle(map,x,y),isExit=Array.isArray(map.exits)&&map.exits.some(exit=>exit.x===x&&exit.y===y),isHover=overworldHoverCell&&overworldHoverCell.x===x&&overworldHoverCell.y===y;
    let color=(x+y)%2===0?getCssVar('--ow-grass1'):getCssVar('--ow-grass2');
    if(isExit)color='rgba(90,169,255,0.30)';if(isHover)color='rgba(255,207,90,0.45)';
    const drew=drawOverworldFloor({x,y},projection,overworldState.currentMapId,color,isHover?'#ffcf5a':isExit?'rgba(153,205,255,0.95)':'rgba(0,0,0,0.25)',isHover?2:isExit?1.5:1);
    if(drew&&(isExit||isHover))drawOverworldDiamond({x,y},projection,color,isHover?'#ffcf5a':'rgba(153,205,255,0.95)',isHover?2:1.5);
  }
  const scene=[];
  for(let y=0;y<dimensions.rows;y++)for(let x=0;x<dimensions.columns;x++)if(isOverworldTerrainObstacle(map,x,y))scene.push({id:`obstacle:${x},${y}`,kind:'obstacle',x,y});
  const visualProof=VisualAssets.proofForMap(overworldState.currentMapId);
  if(visualProof)visualProof.props.forEach(prop=>scene.push({...prop,kind:'visual-prop'}));
  const runtime=getCurrentRuntime();
  if(runtime)runtime.mobs.forEach((mob,index)=>{if(mob.isAlive&&!mob.engaged)scene.push({id:`mob:${mob.id}`,kind:'mob',x:mob.x,y:mob.y,mob,index});});
  npcSystem.listForMap(overworldState.currentMapId).forEach(npc=>scene.push({id:`npc:${npc.id}`,kind:'npc',x:npc.position.x,y:npc.position.y,npc}));
  scene.push({id:'player',kind:'player',x:overworldState.player.x,y:overworldState.player.y});
  scene.sort(Isometric.overworldDepthCompare).forEach(entry=>{
    if(entry.kind==='obstacle')drawOverworldObstacle(entry,projection);
    else if(entry.kind==='visual-prop')drawOverworldVisualProp(entry,projection);
    else if(entry.kind==='mob'){const visual=getMobVisual(entry.mob.type);drawOverworldToken(entry.mob.x,entry.mob.y,Math.sin(now/280+entry.index)*3,getCssVar(visual.colorVar),visual.emoji,projection,CharacterAssets.spriteForCreature(entry.mob.type));}
    else if(entry.kind==='npc'){const visual=entry.npc.visual||{emoji:'●',colorVar:'--accent2'};drawOverworldToken(entry.npc.position.x,entry.npc.position.y,0,getCssVar(visual.colorVar),visual.emoji,projection,CharacterAssets.spriteForNpc(entry.npc.id));const indicator=npcSystem.indicator(entry.npc.id);if(indicator)drawOverworldIndicator(entry.npc,projection,indicator);}
    else {const logical={x:overworldState.player.x,y:overworldState.player.y},visual=entityAnimations.position('player',logical);drawOverworldToken(visual.x,visual.y,0,getCssVar('--accent'),'🧙',projection,entityAnimations.frameAssetId('player',CharacterAssets.PLAYER_ID));}
  });
}
function drawOverworldToken(gx,gy,yOffset,color,emoji,projection,spriteId=null){
  const anchor=overworldCenter({x:gx,y:gy},projection),radius=Math.max(8,projection.tileHeight*0.58),cx=anchor.x,cy=anchor.y-radius+yOffset;
  owCtx.save();owCtx.fillStyle='rgba(5,8,12,0.34)';owCtx.beginPath();owCtx.ellipse(anchor.x,anchor.y-projection.tileHeight*0.04,projection.tileWidth*0.2,projection.tileHeight*0.14,0,0,Math.PI*2);owCtx.fill();owCtx.restore();
  if(spriteId&&characterAssetLoader.draw(owCtx,spriteId,{x:anchor.x,y:anchor.y+yOffset,projection,smoothing:false}))return;
  owCtx.beginPath();owCtx.arc(cx,cy,radius,0,Math.PI*2);owCtx.fillStyle=color;owCtx.fill();owCtx.lineWidth=2;owCtx.strokeStyle='rgba(0,0,0,0.6)';owCtx.stroke();
  owCtx.font='24px sans-serif';owCtx.textAlign='center';owCtx.textBaseline='middle';owCtx.fillText(emoji,cx,cy+1);
}
function overworldCellFromClientXY(clientX,clientY){
  const point=canvasPointFromClient(overworldCanvas,clientX,clientY);
  if(!point.ok)return {x:-1,y:-1};
  const map=getCurrentMap(),dimensions=getOverworldDimensions(map),picked=Isometric.screenToGrid({screenX:point.logicalX,screenY:point.logicalY,projection:getOverworldProjection(map),bounds:dimensions});
  return picked.ok?{x:picked.x,y:picked.y}:{x:-1,y:-1};
}
overworldCanvas.addEventListener('pointermove',(e)=>{
  if(currentState!==GAME_STATES.OVERWORLD)return;
  const {x,y}=overworldCellFromClientXY(e.clientX,e.clientY);overworldHoverCell=x>=0&&y>=0?{x,y}:null;
});
overworldCanvas.addEventListener('pointerleave',()=>{overworldHoverCell=null;});
overworldCanvas.addEventListener('pointerup',(e)=>{
  if(currentState!==GAME_STATES.OVERWORLD || (e.pointerType==='mouse'&&e.button!==0)) return;
  const {x,y}=overworldCellFromClientXY(e.clientX,e.clientY);handleOverworldClick(x,y);
}, {passive:true});

// =========================================================================================
// ESTADO DE COMBATE — ARQUITETURA MULTI-UNIDADE (combatants[] + fila de iniciativa)
// =========================================================================================
const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');
// Presentation-only configuration: the combat engine keeps its logical 12x12 grid.
let combatProjection = Isometric.fitProjection({canvasWidth:LOGICAL_CANVAS_WIDTH,canvasHeight:LOGICAL_CANVAS_HEIGHT,columns:COMBAT_GRID_SIZE,rows:COMBAT_GRID_SIZE,preferredTileWidth:72,preferredTileHeight:36,padding:18});
function updateCombatProjection(){const view=getCanvasLogicalSize(canvas);combatProjection=Isometric.fitProjection({canvasWidth:view.width,canvasHeight:view.height,columns:COMBAT_GRID_SIZE,rows:COMBAT_GRID_SIZE,preferredTileWidth:72,preferredTileHeight:36,padding:getProjectionPadding(view)});return combatProjection;}
let game = null;

const PLAYER_SPAWN = { x:2, y:10 };
const MOB_SPAWNS_BY_COUNT = {
  1: [ {x:9,y:1} ],
  2: [ {x:9,y:1}, {x:10,y:3} ],
  3: [ {x:9,y:1}, {x:10,y:3}, {x:8,y:4} ]
};
const COMBAT_OBSTACLES = [[5,5],[6,5],[5,6],[6,6],[2,2],[9,9],[3,8],[8,3]];

// getCombatantById / getPlayerCombatant / getAliveMobs / getUnitAt: acessores
// genéricos usados por toda a lógica de combate — a mesma referência de objeto
// (não cópias) é compartilhada entre `game.combatants` e `game.player`.
function getCombatantById(id){ return game.combatants.find(c=>c.id===id); }
function getPlayerCombatant(){ return game.combatants.find(c=>c.side==='player'); }
function getAliveMobs(){ return game.combatants.filter(c=>c.side==='mob' && c.hp>0); }
function getUnitAt(x,y){ return game.combatants.find(c=>c.hp>0 && c.x===x && c.y===y) || null; }
function isObstacle(x,y){ return game.board[y][x]==='obstacle'; }
const combatEngine = CombatEffects.createCombatEngine({rules:EngineRules,rng:GameRng});
const localAuthority = LocalAuthority.createLocalAuthority({
  combatEngine,
  stateProvider:()=>game,
  abilityProvider:abilityId=>ABILITIES[abilityId]||null
});
function handleCombatEvents(events){
  entityAnimations.applyCombatEvents(events,getCombatantById,actor=>actor.side==='player'?CharacterAssets.PLAYER_ID:CharacterAssets.spriteForCreature(actor.mobType));
  (events||[]).forEach(event=>{
    const target=event.targetId&&getCombatantById(event.targetId);
    const targetName=target&&target.name||event.bossId||'Unidade';
    if(event.type===CombatEffects.EVENT_TYPES.ABILITY_CAST){const ability=ABILITIES[event.abilityId],effects=ability&&ability.effects||[],isTactical=effects.some(effect=>['BUFF','DEBUFF','STATUS','HEAL'].includes(effect.type)),isMagical=effects.some(effect=>effect.damageType==='MAGICAL');if(isTactical||isMagical)audioManager.play('SFX_ACTION_DRAW');else audioManager.playRandom(['SFX_ATTACK_LIGHT','SFX_ATTACK_ALT']);}
    else if(event.type===CombatEffects.EVENT_TYPES.UNIT_MOVED)audioManager.playRandom(['SFX_FOOTSTEP_01','SFX_FOOTSTEP_02','SFX_FOOTSTEP_03','SFX_FOOTSTEP_04']);
    else if(event.type===CombatEffects.EVENT_TYPES.DAMAGE_APPLIED&&event.damageType===CombatEffects.DAMAGE_TYPES.PHYSICAL)audioManager.play('SFX_IMPACT');
    if(event.type===CombatEffects.EVENT_TYPES.DAMAGE_APPLIED&&target){spawnFloatingText(target.x,target.y,`-${event.amount} HP`,'#ff5a5a');logCombat('dmg',UiFeedback.eventMessage(event,targetName));}
    else if(event.type===CombatEffects.EVENT_TYPES.HEAL_APPLIED&&target){spawnFloatingText(target.x,target.y,`+${event.amount} HP`,'#5aff8a');logCombat('heal',UiFeedback.eventMessage(event,targetName));}
    else if(event.type===CombatEffects.EVENT_TYPES.UNIT_MOVED&&target)logCombat('move',`${target.name} se moveu.`);
    else if(event.type===CombatEffects.EVENT_TYPES.STATUS_APPLIED&&target)logCombat('sys',UiFeedback.eventMessage(event,targetName));
    else if(event.type===CombatEffects.EVENT_TYPES.STATUS_EXPIRED&&target)logCombat('sys',UiFeedback.eventMessage(event,targetName));
    else if(event.type===CombatEffects.EVENT_TYPES.BOSS_CRITICAL)logCombat('sys',UiFeedback.eventMessage(event,targetName));
    else if(event.type==='BOSS_RESOLVED')logCombat('sys',UiFeedback.eventMessage(event,targetName));
    else if(event.type==='BOSS_PHASE_CHANGED'||event.type==='CRAVA_INTERACTED')logCombat('sys',UiFeedback.eventMessage(event,targetName));
    if(event.type===CombatEffects.EVENT_TYPES.STATUS_APPLIED&&target)spawnFloatingText(target.x,target.y,`✦ ${event.statusId||'STATUS'}`,'#c49aff');
    else if(event.type===CombatEffects.EVENT_TYPES.UNIT_DIED&&target&&target.side==='mob')questSystem.recordEvent({type:QuestSystem.EVENT_TYPES.MOB_KILLED,mobType:target.mobType,eventId:`${game&&game.combatId||'combat'}:${target.id}`});
  });
}

// computeInitiativeOrder: ordena os IDs dos combatentes por Agilidade
// (jogador via getEffectiveStats, mobs via MOB_TEMPLATES), com um pequeno
// desempate aleatório para evitar empates determinísticos.
function computeInitiativeOrder(combatants){
  return EngineRules.initiative(combatants, getEffectiveStats().agilidade, MOB_TEMPLATES, GameRng);
}

// createInitialState: monta a arena 12x12 e a lista de combatentes a partir de
// `mobsSpec` (array de {id,type}) — id vem do Overworld quando disponível,
// garantindo correspondência 1:1 entre o mob no mapa e o combatente na luta.
function createInitialState(mobsSpec){
  const board = [];
  for(let y=0;y<COMBAT_GRID_SIZE;y++){ const row=[]; for(let x=0;x<COMBAT_GRID_SIZE;x++) row.push('empty'); board.push(row); }
  COMBAT_OBSTACLES.forEach(([x,y])=>{ board[y][x]='obstacle'; });

  syncPlayerMaxHp();
  const playerMaxHp = playerState.maxHp;
  const playerCombatant = {
    id:'player', side:'player', name:'Jogador',
    x:PLAYER_SPAWN.x, y:PLAYER_SPAWN.y, hp:playerState.hp, maxHp:playerMaxHp,
    pa:6, maxPa:6, pm:4, maxPm:4,
    cooldowns:{}, effects:[], resistances:{PHYSICAL:0,MAGICAL:0}, combatStats:getEffectiveStats(), sprite:null
  };

  const spawnPositions = MOB_SPAWNS_BY_COUNT[mobsSpec.length] || MOB_SPAWNS_BY_COUNT[1];
  const mobCombatants = mobsSpec.map((spec,i)=>{
    const template = MOB_TEMPLATES[spec.type];
    const pos = spawnPositions[i] || spawnPositions[spawnPositions.length-1];
    return {...EngineRules.createMob(spec, template, pos),cooldowns:{},effects:[],resistances:{...(template.resistances||{})},combatStats:{agilidade:template.agilidade||0}};
  });

  const combatants = [playerCombatant, ...mobCombatants];
  const turnOrder = computeInitiativeOrder(combatants);

  return {
    board, combatants, turnOrder, turnIndex:0, turnNumber:1, telegraphs:[],
    mode:null, hoverCell:null, gameOver:false, floatingTexts:[], eventSequence:0, commandSequence:0,
    player: playerCombatant, // referência de conveniência (MESMO objeto)
    avancoPaths:null
  };
}

function startCanonicalEncounter(encounterId){
  const result=FimbriaRuntime.createEncounterSpec(encounterId);
  if(!result.ok){updateOverworldHint(`Encontro indisponível: ${result.reason}.`);return result;}
  startCombat(result.mobsSpec);
  return result;
}
// startCombat: aceita tanto um array [{id,type}] (fluxo normal via Overworld)
// quanto uma string solta (compatibilidade/testes) — nesse caso gera um id sintético.
function startCombat(mobsSpec){
  const spec = Array.isArray(mobsSpec)
    ? mobsSpec
    : [{ id:`mob_solo_${Date.now()}`, type: mobsSpec || 'javali' }];
  syncPlayerMaxHp();
  game = createInitialState(spec);
  game.combatId = `combat_${Date.now()}_${GameRng.int(0,999999)}`;
  appState.combat = game;
  clearLog();
  const mobNames = game.combatants.filter(c=>c.side==='mob').map(c=>c.name).join(' e ');
  const firstName = getCombatantById(game.turnOrder[0]).side==='player' ? 'Jogador' : getCombatantById(game.turnOrder[0]).name;
  logCombat('sys', `${mobNames} apareceu! Iniciativa calculada — ${firstName} começa.`);
  setGameState(GAME_STATES.COMBAT);
  startTurnFor(getCurrentCombatant());
}

function backToMenu(){
  closeNpcDialogue();
  if(game && !game.gameOver && overworldState.currentEncounterMobIds){
    const runtime=getCurrentRuntime();
    overworldState.currentEncounterMobIds.forEach(id=>{
      const mob = runtime && runtime.mobs.find(m=>m.id===id);
      if(mob) mob.engaged=false;
    });
    overworldState.currentEncounterMobIds=null;
  }
  stopMobMovementTimer();
  resetCombatState();
  closeAllModals();
  document.getElementById('overlay').style.display='none';
  setGameState(GAME_STATES.MENU);
}
function resetGame(){
  saveSystem.remove();
  closeNpcDialogue();
  stopMobMovementTimer();
  closeAllModals();
  document.getElementById('overlay').style.display='none';
  playerState = createInitialPlayerState();
  appState.player = playerState;
  overworldState = createInitialWorldState();
  appState.world = overworldState;
  appState.progression = { quests:{}, currency:{}, flags:{} };
  questSystem.setProgression(appState.progression.quests);
  renderQuestPanel();
  resetCombatState();
  clearLog();
  logCombat('sys','Nova partida iniciada do zero. Progresso do personagem reiniciado.');
}
// resetCombatState: zera `game`, log, timer de turno e a UI de combate por completo.
function resetCombatState(){
  game = null;
  entityAnimations.reset();
  appState.combat = null;
  clearTurnTimer();
  clearLog();
  UiHud.hotbarEntries(ABILITIES).forEach(({abilityId})=>{
    const id=`btn${abilityId[0].toUpperCase()}${abilityId.slice(1)}`;
    const el = document.getElementById(id);
    if(el){el.classList.remove('active');el.disabled=true;}
  });
  document.getElementById('endTurnBtn').disabled = true;
  document.getElementById('combatantsRow').innerHTML='';
  const banner = document.getElementById('turnBanner');
  banner.textContent = 'Turno: Jogador';
  banner.className = 'turn-banner turn-player';
  document.getElementById('turnTimerBar').style.width='100%';
  document.getElementById('turnTimerVal').textContent = `${TURN_DURATION_SEC}s`;
}

function bfs(startX,startY, mover){
  return bfsGeneric(startX,startY, (x,y)=>{
    if(isObstacle(x,y)) return true;
    const occ=getUnitAt(x,y);
    return !!(occ && occ!==mover);
  }, COMBAT_GRID_SIZE);
}
// =========================================================================================
// RELÓGIO DE TURNO — 30s regressivos; força "Passar Turno" ao zerar
// =========================================================================================
let turnTimerInterval = null;
let turnTimeLeft = TURN_DURATION_SEC;
function startTurnTimer(){
  clearTurnTimer();
  turnTimeLeft = TURN_DURATION_SEC;
  updateTurnTimerDisplay();
  turnTimerInterval = GameClock.every(()=>{
    if(activeModal) return; // pausa enquanto o jogador consulta Ficha/Inventário
    turnTimeLeft--;
    updateTurnTimerDisplay();
    if(turnTimeLeft<=0){
      clearTurnTimer();
      forceEndTurnByTimeout();
    }
  }, 1000);
}
function clearTurnTimer(){ if(turnTimerInterval){ GameClock.cancel(turnTimerInterval); turnTimerInterval=null; } }
function updateTurnTimerDisplay(){
  const valEl=document.getElementById('turnTimerVal');
  const barEl=document.getElementById('turnTimerBar');
  if(valEl) valEl.textContent = `${Math.max(0,turnTimeLeft)}s`;
  if(barEl) barEl.style.width = Math.max(0,(turnTimeLeft/TURN_DURATION_SEC)*100)+'%';
}
// forceEndTurnByTimeout: chamado quando o relógio zera — cancela o modo de
// habilidade em aberto (se for turno do jogador) e passa a vez adiante.
function forceEndTurnByTimeout(){
  if(!game || game.gameOver) return;
  const current = getCurrentCombatant();
  if(!current) return;
  const name = current.side==='player' ? 'Jogador' : current.name;
  logCombat('timer', `⏱️ Tempo esgotado! Turno de ${name} passado automaticamente.`);
  if(current.side==='player'){ game.mode=null; game.hoverCell=null; }
  finishCurrentTurn();
}

// =========================================================================================
// RENDERIZAÇÃO DO COMBATE (arena 12x12)
// =========================================================================================
function render(now){
  now = now || performance.now();
  advanceEntityAnimations(now);
  const view=getCanvasLogicalSize(canvas);
  updateCombatProjection();
  CanvasResolution.configure({canvas,context:ctx,logicalWidth:view.width,logicalHeight:view.height,devicePixelRatio:window.devicePixelRatio||1});
  ctx.clearRect(0,0,view.width,view.height);
  const highlights = computeHighlights();
  for(let y=0;y<COMBAT_GRID_SIZE;y++){
    for(let x=0;x<COMBAT_GRID_SIZE;x++){
      let color=(x+y)%2===0 ? getCssVar('--grid-empty') : getCssVar('--grid-empty2');
      if(isObstacle(x,y)) color=getCssVar('--grid-obstacle');
      const hl = highlights.get(x+','+y);
      if(hl) color = hl;
      const targetCue=entityAnimations.feedbackFor(`cell:${x},${y}`).some(cue=>cue.type==='target');
      drawProjectedDiamond({x,y},color,targetCue?'#ffcf5a':'rgba(0,0,0,0.35)',targetCue?2:1);
    }
  }
  drawPendingTelegraphs();
  if(game.hoverCell&&inBoundsCombat(game.hoverCell.x,game.hoverCell.y)){
    let fill='rgba(255,227,163,.12)',stroke='#ffe3a3';
    if(game.mode&&ABILITIES[game.mode]){const validation=combatEngine.validate(game,getCurrentCombatant(),ABILITIES[game.mode],game.hoverCell);fill=validation.ok?'rgba(90,255,138,.18)':'rgba(255,90,90,.18)';stroke=validation.ok?'#5aff8a':'#ff5a5a';}
    ctx.save();drawProjectedDiamond(game.hoverCell,fill,stroke,2);ctx.restore();
  }
  const scene=[];
  for(let y=0;y<COMBAT_GRID_SIZE;y++)for(let x=0;x<COMBAT_GRID_SIZE;x++)if(isObstacle(x,y))scene.push({id:`obstacle:${x},${y}`,kind:'obstacle',x,y});
  game.combatants.forEach(unit=>{if(unit.hp>0||entityAnimations.isDeathVisible(unit.id))scene.push({id:`unit:${unit.id}`,kind:'unit',x:unit.x,y:unit.y,unit});});
  scene.sort(Isometric.depthCompare).forEach(entry=>{
    if(entry.kind==='obstacle')drawObstacleVisual(entry);
    else if(entry.unit.side==='player')drawUnitVisual(entry.unit,getCssVar('--accent'),'J',CharacterAssets.PLAYER_ID);
    else { const visual=getMobVisual(entry.unit.mobType);drawUnitVisual(entry.unit,getCssVar(visual.colorVar),visual.emoji,CharacterAssets.spriteForCreature(entry.unit.mobType)); }
  });
  updateFloatingTexts(now);
  drawFloatingTexts(now);
  updateSidePanel();
}
function projectedCellCenter(cell){return Isometric.gridToScreen({x:cell.x,y:cell.y,projection:combatProjection});}
function projectedDiamondPath(cell,inset=0){
  const center=projectedCellCenter(cell),halfWidth=Math.max(1,combatProjection.tileWidth/2-inset),halfHeight=Math.max(1,combatProjection.tileHeight/2-inset);
  ctx.beginPath();ctx.moveTo(center.x,center.y-halfHeight);ctx.lineTo(center.x+halfWidth,center.y);ctx.lineTo(center.x,center.y+halfHeight);ctx.lineTo(center.x-halfWidth,center.y);ctx.closePath();
  return center;
}
function drawProjectedDiamond(cell,fill,stroke,lineWidth=1){
  projectedDiamondPath(cell);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();
}
function drawObstacleVisual(cell){
  const anchor=projectedCellCenter(cell),radius=Math.max(5,combatProjection.tileHeight*0.42);
  ctx.save();ctx.fillStyle='rgba(8,12,20,0.42)';ctx.beginPath();ctx.ellipse(anchor.x,anchor.y-combatProjection.tileHeight*0.18,radius,radius*0.72,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,0.14)';ctx.lineWidth=1;ctx.stroke();ctx.restore();
}
function drawPendingTelegraphs(){
  const cells=UiFeedback.activeTelegraphCells(game&&game.telegraphs||[]);
  if(!cells.length)return;
  ctx.save();ctx.fillStyle='rgba(255,90,90,0.22)';ctx.strokeStyle='#ffcf5a';ctx.lineWidth=2;
  cells.forEach(cell=>{if(!inBoundsCombat(cell.x,cell.y))return;projectedDiamondPath(cell,2);ctx.fill();ctx.stroke();});
  ctx.restore();
}
function feedbackRing(unit,anchor){
  const cues=entityAnimations.feedbackFor(unit.id);if(!cues.length)return;
  const cue=cues[cues.length-1],styles={hit:['#ff6464','rgba(255,80,80,.14)'],heal:['#72ffac','rgba(90,255,138,.14)'],status:['#c49aff','rgba(192,132,255,.12)'],death:['#b8becb','rgba(160,170,185,.1)'],recoil:['#ffcf5a','rgba(255,207,90,.14)']},style=styles[cue.type];if(!style)return;
  const pulse=.88+Math.sin(performance.now()/45)*.08,radius=Math.max(9,combatProjection.tileHeight*.58)*pulse;
  ctx.save();ctx.globalAlpha=Math.min(1,cue.remaining/180);ctx.fillStyle=style[1];ctx.strokeStyle=style[0];ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(anchor.x,anchor.y-radius*.45,radius,radius*.72,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
}
function drawUnitVisual(unit, color, letter, spriteId=null){
  const interpolated=entityAnimations.position(unit.id,unit),impulse=entityAnimations.visualOffset(unit.id),visualPosition={x:interpolated.x+impulse.x,y:interpolated.y+impulse.y},anchor=projectedCellCenter(visualPosition),radius=Math.max(7,combatProjection.tileHeight*0.58),cx=anchor.x,cy=anchor.y-radius;
  ctx.save();ctx.globalAlpha*=entityAnimations.opacity(unit.id);
  const current=getCurrentCombatant();
  if(current&&current.id===unit.id){
    const pulse=.9+Math.sin(performance.now()/220)*.08;ctx.save();ctx.globalAlpha*=pulse;drawProjectedDiamond(unit,'rgba(255,207,90,.14)','#ffcf5a',2);ctx.restore();
  }
  let spriteDrawn=false;
  if(unit.sprite){
    const previous=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=false;
    ctx.drawImage(unit.sprite,cx-combatProjection.tileWidth/2,anchor.y-combatProjection.tileHeight,combatProjection.tileWidth,combatProjection.tileWidth);
    ctx.imageSmoothingEnabled=previous;spriteDrawn=true;
  } else if(spriteId){
    spriteDrawn=characterAssetLoader.draw(ctx,entityAnimations.frameAssetId(unit.id,spriteId),{x:anchor.x,y:anchor.y,projection:combatProjection,smoothing:false});
  }
  if(!spriteDrawn) {
    ctx.beginPath();
    ctx.arc(cx,cy,radius,0,Math.PI*2);
    ctx.fillStyle=color;
    ctx.fill();
    ctx.lineWidth=2;
    ctx.strokeStyle='rgba(0,0,0,0.6)';
    ctx.stroke();
    ctx.fillStyle='#0c1420';
    ctx.font='bold 15px sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(letter, cx, cy+1);
  }
  feedbackRing(unit,anchor);
  if(unit.hp<=0){ctx.restore();return;}
  const barW=Math.max(22,combatProjection.tileWidth*0.72),barH=4;
  const bx=cx-barW/2,by=cy-radius-7;
  ctx.fillStyle='#12141a';
  ctx.fillRect(bx,by,barW,barH);
  const pct=Math.max(0,unit.hp/unit.maxHp);
  ctx.fillStyle = pct>0.5 ? '#5aff8a' : (pct>0.25 ? '#ffcf5a' : '#ff5a5a');
  ctx.fillRect(bx,by,barW*pct,barH);
  ctx.strokeStyle='rgba(0,0,0,0.5)';
  ctx.strokeRect(bx,by,barW,barH);
  ctx.restore();
}

function computeHighlights(){
  const map = new Map();
  const current = getCurrentCombatant();
  if(game.gameOver || !current || current.side!=='player') return map;
  const p = current;

  if(game.mode===null){
    if(p.pm>0){
      const {dist} = bfs(p.x,p.y,p);
      dist.forEach((d,key)=>{
        if(d>0 && d<=p.pm){
          const [x,y]=key.split(',').map(Number);
          if(!getUnitAt(x,y)) map.set(x+','+y, 'rgba(90,255,138,0.45)');
        }
      });
    }
  }
  else if(ABILITIES[game.mode]){
    const ability = ABILITIES[game.mode];
    const abilityPreview=AbilityPreview.preview({state:game,actor:p,ability,engine:combatEngine,hoverCell:game.hoverCell});
    abilityPreview.targetableCells.forEach(cell=>map.set(cell.x+','+cell.y,'rgba(120,90,255,0.30)'));
    abilityPreview.affectedCells.forEach(cell=>map.set(cell.x+','+cell.y,'rgba(255,90,90,0.55)'));
    if(game.hoverCell&&abilityPreview.validation&&!abilityPreview.validation.ok){
      const {x,y}=game.hoverCell;
      if(inBoundsCombat(x,y))map.set(x+','+y,'rgba(120,120,120,0.35)');
    }
  }
  return map;
}
function pulseTurnBanner(combatant){
  const banner=document.getElementById('turnBanner');banner.classList.remove('turn-started');void banner.offsetWidth;banner.classList.add('turn-started');
  GameClock.after(()=>banner.classList.remove('turn-started'),520);
}
// =========================================================================================
// FLOATING TEXT
// =========================================================================================
function spawnFloatingText(gridX,gridY,text,color){
  game.floatingTexts.push({gridX,gridY,jitter:GameRng.random()*14-7,text,color,born:performance.now(),duration:1000});
}
function updateFloatingTexts(now){ game.floatingTexts = game.floatingTexts.filter(ft => (now-ft.born) < ft.duration); }
function drawFloatingTexts(now){
  ctx.save();
  ctx.font='bold 14px sans-serif';
  ctx.textAlign='center';
  game.floatingTexts.forEach(ft=>{
    const age = now-ft.born;
    const progress = Math.min(1, age/ft.duration);
    ctx.globalAlpha = Math.max(0,1-progress);
    const yOffset = -progress*36;
    const anchor=projectedCellCenter({x:ft.gridX,y:ft.gridY}),x=anchor.x+ft.jitter,y=anchor.y-combatProjection.tileHeight+yOffset;
    ctx.strokeStyle='rgba(0,0,0,0.65)'; ctx.lineWidth=3;
    ctx.strokeText(ft.text,x,y);
    ctx.fillStyle=ft.color;
    ctx.fillText(ft.text,x,y);
  });
  ctx.restore();
  ctx.globalAlpha=1;
}
// =========================================================================================
// PAINEL LATERAL — cartões de combatentes gerados dinamicamente (N unidades)
// =========================================================================================
const HUD_HOTBAR=UiHud.hotbarEntries(ABILITIES);
const abilityButtonId=abilityId=>`btn${abilityId[0].toUpperCase()}${abilityId.slice(1)}`;
function renderAbilityHotbar(){
  const hotbar=document.getElementById('abilityHotbar');
  if(!hotbar) return;
  const symbols={golpe:'⚔',avanco:'➤',cruz:'✣',lanca:'➶',fortificar:'⛨'};
  hotbar.replaceChildren();
  HUD_HOTBAR.forEach(entry=>{
    const button=document.createElement('button');button.type='button';button.className='ability';button.id=abilityButtonId(entry.abilityId);
    button.dataset.abilityId=entry.abilityId;
    button.title=`${entry.key} — ${entry.name} (${entry.apCost} PA)`;
    button.setAttribute('aria-label',`${entry.name}, custo ${entry.apCost} PA`);
    button.innerHTML=`<span class="ability-icon" aria-hidden="true">${symbols[entry.abilityId]||'✦'}</span><span class="key">${entry.key}</span><b class="sr-only">${entry.name}</b><span class="cost">${entry.apCost} PA</span>`;
    button.onclick=()=>setMode(entry.abilityId);hotbar.appendChild(button);
  });
}
function updateCombatHud(player){
  if(!player) return;
  const values={combatHudHp:`${Math.max(0,player.hp)}/${player.maxHp}`,combatHudPa:`${Math.max(0,player.pa)}/${player.maxPa}`,combatHudPm:`${Math.max(0,player.pm)}/${player.maxPm}`,combatHudLevel:playerState.level};
  Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value;});
}
function updateSidePanel(){
  const row = document.getElementById('combatantsRow');
  const current = getCurrentCombatant();
  row.innerHTML = game.combatants.map(c=>{
    const dead = c.hp<=0;
    let nameHtml;
    if(c.side==='player'){
      nameHtml = `🧙 Jogador <span class="level-badge">Nv. ${playerState.level}</span>`;
    } else {
      const v = getMobVisual(c.mobType);
      nameHtml = `${v.emoji} ${c.name}`;
    }
    const isCurrent=current&&current.id===c.id;
    return `<div class="unit-card ${dead?'dead':''} ${isCurrent?'current':''}" aria-label="${isCurrent?'Atuando: ':''}${c.name||'Unidade'}">
      <h3><span>${nameHtml}</span></h3>
      <div class="stat-row"><span class="stat-label">HP</span><div class="bar-bg"><div class="bar-fill fill-hp" style="width:${Math.max(0,(c.hp/c.maxHp)*100)}%"></div></div><span class="stat-value">${Math.max(0,c.hp)}/${c.maxHp}</span></div>
      <div class="stat-row"><span class="stat-label">PA</span><div class="bar-bg"><div class="bar-fill fill-pa" style="width:${Math.max(0,(c.pa/c.maxPa)*100)}%"></div></div><span class="stat-value">${Math.max(0,c.pa)}/${c.maxPa}</span></div>
      <div class="stat-row"><span class="stat-label">PM</span><div class="bar-bg"><div class="bar-fill fill-pm" style="width:${Math.max(0,(c.pm/c.maxPm)*100)}%"></div></div><span class="stat-value">${Math.max(0,c.pm)}/${c.maxPm}</span></div>
    </div>`;
  }).join('');

  const banner=document.getElementById('turnBanner');
  if(current){
    const isPlayerTurn = current.side==='player';
    banner.textContent = `Rodada ${game.turnNumber} — Vez de ${isPlayerTurn ? 'Jogador' : current.name}`;
    banner.className = isPlayerTurn ? 'turn-banner turn-player' : 'turn-banner turn-boar';
  }

  const p = getPlayerCombatant();
  updateCombatHud(p);
  const isPlayerTurnNow = current && current.side==='player' && !game.gameOver;
  const abilityButtons=Object.fromEntries(HUD_HOTBAR.map(entry=>[entry.abilityId,abilityButtonId(entry.abilityId)]));
  Object.entries(abilityButtons).forEach(([abilityId,buttonId])=>{
    const ability=ABILITIES[abilityId],button=document.getElementById(buttonId),cooldown=(p.cooldowns&&p.cooldowns[ability.id])||0;
    if(!button) return;
    button.disabled=!isPlayerTurnNow||p.pa<ability.apCost||cooldown>0;
    button.setAttribute('aria-label',`${ability.name}, ${cooldown>0?`recarga ${cooldown}`:`custo ${ability.apCost} PA`}${p.pa<ability.apCost?' — PA insuficiente':''}`);
    const cost=button.querySelector('.cost');if(cost)cost.textContent=cooldown>0?`CD ${cooldown}`:`${ability.apCost} PA`;
  });
  document.getElementById('endTurnBtn').disabled = !isPlayerTurnNow;

  Object.values(abilityButtons).forEach(id=> document.getElementById(id).classList.remove('active'));
  const modeToBtn=abilityButtons;
  if(game.mode && modeToBtn[game.mode]) document.getElementById(modeToBtn[game.mode]).classList.add('active');

  let hintTxt='Movimento livre: clique numa célula verde. 1-5 habilidades, C ficha, I mochila, ESC cancela.';
  if(game.mode==='golpe') hintTxt='[Golpe Pesado] Clique num alvo adjacente com LoS livre. ESC cancela.';
  if(game.mode==='avanco') hintTxt='[Avanço] Clique em uma célula destacada para avançar naquela direção. ESC cancela.';
  if(game.mode==='cruz') hintTxt='[Explosão em Cruz] Passe o mouse para pré-visualizar a área. ESC cancela.';
  if(game.mode==='lanca') hintTxt='[Lança] Alvo a 2-3 células com LoS livre. ESC cancela.';
  if(game.mode==='fortificar') hintTxt='[Postura Fortificada] Defesa temporária aplicada.';
  if(!isPlayerTurnNow) hintTxt = game.gameOver ? 'Partida encerrada.' : 'Aguarde a vez do próximo combatente...';
  document.getElementById('hint').textContent=hintTxt;
  const selection=document.getElementById('selectionStatus');
  if(selection){
    selection.className='selection-status';
    if(!game.mode) selection.textContent='Nenhuma habilidade selecionada.';
    else if(game.hoverCell&&ABILITIES[game.mode]){
      const validation=combatEngine.validate(game,p,ABILITIES[game.mode],game.hoverCell);
      selection.textContent=validation.ok?`Alvo válido: célula ${game.hoverCell.x},${game.hoverCell.y}.`:UiFeedback.reasonMessage(validation.reason);
      selection.classList.add(validation.ok?'ready':'invalid');
    } else selection.textContent=`${ABILITIES[game.mode]&&ABILITIES[game.mode].name||'Habilidade'} selecionada. Escolha uma célula.`;
  }
}
function logCombat(cls,msg){
  const div=document.createElement('div'); div.className=cls; div.textContent=msg;
  const logEl=document.getElementById('combatLog');
  logEl.appendChild(div); logEl.scrollTop=logEl.scrollHeight;
}
function clearLog(){ const el=document.getElementById('combatLog'); if(el) el.innerHTML=''; }

// =========================================================================================
// GERENCIADOR DE MODAIS (Ficha e Inventário)
// =========================================================================================
let activeModal = null;
let modalReturnFocus = null;
let npcDialogReturnFocus = null;
function restoreFocus(target){if(target&&typeof target.focus==='function'&&document.contains(target))target.focus();}
function closeAllModals({restore=true}={}){
  const wasMerchant=activeModal==='merchant';
  document.getElementById('characterModal').style.display='none';
  document.getElementById('inventoryModal').style.display='none';
  document.getElementById('questModal').style.display='none';
  document.getElementById('merchantModal').style.display='none';
  hideTooltip();
  activeModal=null;
  appState.ui.activeModal=null;
  if(wasMerchant&&currentState===GAME_STATES.OVERWORLD)startMobMovementTimer();
  if(currentState===GAME_STATES.MENU)renderMenuProgress();
  const target=modalReturnFocus;modalReturnFocus=null;if(restore)restoreFocus(target);
}
function openModal(name){
  const trigger=document.activeElement;closeAllModals({restore:false});modalReturnFocus=trigger;
  activeModal=name;
  appState.ui.activeModal=name;
  if(name==='char'){ document.getElementById('characterModal').style.display='flex'; renderCharacterModal(); }
  else if(name==='inventory'){ document.getElementById('inventoryModal').style.display='flex'; renderInventoryModal(); }
  else if(name==='quests'){ document.getElementById('questModal').style.display='flex'; renderQuestPanel(); }
  const modalIds={char:'characterModal',inventory:'inventoryModal',quests:'questModal'};
  const modal=document.getElementById(modalIds[name]);const close=modal&&modal.querySelector('.close-x');if(close)requestAnimationFrame(()=>close.focus());
}
function toggleModal(name){ if(activeModal===name) closeAllModals(); else openModal(name); }

function closeNpcDialogue(){
  const modal=document.getElementById('npcDialogModal');if(modal)modal.style.display='none';
  appState.ui.dialog=null;
  if(currentState===GAME_STATES.OVERWORLD)startMobMovementTimer();
  const target=npcDialogReturnFocus;npcDialogReturnFocus=null;restoreFocus(target);
}
function renderNpcDialogue(session){
  if(!session||!session.npc)return;
  document.getElementById('npcDialogName').textContent=session.npc.name;
  document.getElementById('npcDialogText').textContent=session.dialogue.text||session.npc.dialogue.greeting;
  const options=document.getElementById('npcDialogOptions');options.replaceChildren();
  (session.dialogue.options||[]).forEach(option=>{const button=document.createElement('button');button.textContent=option.label;button.dataset.audioAction=option.id;button.onclick=()=>handleNpcDialogueOption(session.npc.id,option);options.appendChild(button);});
}
function openNpcDialogue(npcId){
  if(currentState!==GAME_STATES.OVERWORLD)return;
  npcDialogReturnFocus=document.activeElement;
  const session=npcSystem.interact(npcId);
  if(!session.ok){updateOverworldHint('Aproxime-se do NPC para interagir.');return;}
  audioManager.play('SFX_UI_CONFIRM');
  stopMobMovementTimer();
  appState.ui.dialog={npcId};
  document.getElementById('npcDialogModal').style.display='flex';
  requestAnimationFrame(()=>document.getElementById('npcDialogClose').focus());
  renderNpcDialogue(session);
}
function handleNpcDialogueOption(npcId,option){
  if(option.id==='close'){closeNpcDialogue();return;}
  const result=npcSystem.execute(npcId,option);
  if(!result.ok){updateOverworldHint('Essa interação não está disponível agora.');return;}
  if(option.id==='heal'){
    const npc=npcSystem.getDefinition(npcId);
    renderNpcDialogue({npc,dialogue:{text:result.healed?(npc.dialogue.healed||'Suas forças foram restauradas.'): (npc.dialogue.full||'Você já está em boas condições.'),options:[{id:'close',label:'Obrigado'}]}});
    return;
  }
  if(option.id==='open_merchant'){
    closeNpcDialogue();
    openMerchantModal();
    return;
  }
  const npc=npcSystem.getDefinition(npcId);
  renderNpcDialogue({npc,dialogue:npcSystem.dialogueFor(npc)});
}

function renderCharacterModal(){
  document.getElementById('charLevel').textContent = playerState.level;
  document.getElementById('xpText').textContent = `${playerState.xp}/${playerState.xpNextLevel} XP`;
  document.getElementById('xpBarFill').style.width = Math.min(100,(playerState.xp/playerState.xpNextLevel)*100)+'%';
  const pts = playerState.pontosDisponiveis;
  document.getElementById('pointsAvailable').textContent = pts>0 ? `✨ ${pts} ponto(s) de atributo disponível(is)` : 'Nenhum ponto disponível no momento';
  renderEquipmentSlots();
  const list=document.getElementById('statsList');
  list.innerHTML='';
  Object.entries(STAT_INFO).forEach(([key,info])=>{
    const row=document.createElement('div');
    row.className='stat-line';
    row.innerHTML = `<div class="stat-name">${info.label}<span class="stat-desc">${info.desc}</span></div>
      <div class="stat-controls"><span class="stat-num">${playerState.stats[key]}</span>${pts>0?`<button class="plus-btn" data-stat="${key}">+</button>`:''}</div>`;
    list.appendChild(row);
  });
  list.querySelectorAll('.plus-btn').forEach(btn=>{ btn.onclick=()=>allocatePoint(btn.getAttribute('data-stat')); });
}
const EQUIP_SLOT_LABELS = { hat:'🎩 Chapéu', weapon:'⚔️ Arma', ring:'💍 Anel' };
function renderEquipmentSlots(){
  const container = document.getElementById('equipSection');
  container.innerHTML = Object.entries(EQUIP_SLOT_LABELS).map(([slot,label])=>{
    const itemId = playerState.equipment[slot];
    const item = itemId ? ITEM_DB[itemId] : null;
    const valueHtml = item
      ? `${item.icon} ${item.name}<span class="equip-bonus">${item.equip.bonusLabel}</span>`
      : `<span class="equip-empty">Vazio</span>`;
    return `<div class="equip-slot">
        <div class="equip-slot-label">${label}</div>
        <div class="equip-slot-value">${valueHtml}</div>
        ${item ? `<button class="unequip-btn" data-slot="${slot}">Remover</button>` : ''}
      </div>`;
  }).join('');
  container.querySelectorAll('.unequip-btn').forEach(btn=>{ btn.onclick = ()=> unequipItem(btn.getAttribute('data-slot')); });
}

const INVENTORY_SLOTS = 16;
let selectedInventoryItemId = null;
function renderInventoryModal(){
  const grid = document.getElementById('inventoryGrid');
  document.getElementById('inventoryCurrency').textContent=`🪙 ${economySystem.getBalance()}`;
  grid.innerHTML='';
  selectedInventoryItemId = null;
  document.getElementById('invActionPanel').style.display='none';
  const entries = Object.entries(playerState.inventory).filter(([id,qty])=>qty>0);
  document.getElementById('invEmptyMsg').style.display = entries.length===0 ? 'block' : 'none';
  for(let i=0;i<INVENTORY_SLOTS;i++){
    const slot=document.createElement('div'); slot.className='inv-slot';
    const entry=entries[i];
    if(entry){
      const [id,qty]=entry; const item=ITEM_DB[id];
      slot.classList.add('filled', RARITY_CLASS[item.rarity]);
      slot.innerHTML = `<div class="inv-icon">${item.icon}</div><div class="inv-qty">x${qty}</div>`;
      slot.addEventListener('mouseenter',(e)=>showTooltip(e,item));
      slot.addEventListener('mousemove', moveTooltip);
      slot.addEventListener('mouseleave', hideTooltip);
      slot.addEventListener('click', ()=> selectInventoryItem(id));
    } else { slot.classList.add('empty'); }
    grid.appendChild(slot);
  }
}
function openMerchantModal(){
  const trigger=document.activeElement;closeAllModals({restore:false});modalReturnFocus=trigger;
  stopMobMovementTimer();
  activeModal='merchant'; appState.ui.activeModal='merchant';
  document.getElementById('merchantModal').style.display='flex';
  renderMerchantModal();
  requestAnimationFrame(()=>document.getElementById('merchantClose').focus());
}
function renderMerchantModal(){
  const list=document.getElementById('merchantList'); if(!list)return;
  document.getElementById('merchantCurrency').textContent=`🪙 ${economySystem.getBalance()}`;
  list.replaceChildren();
  Object.values(ECONOMY_DATA.CATALOG).filter(entry=>ITEM_DB[entry.itemId]&&entry.itemId.indexOf('EQ_')!==0).forEach(entry=>{
    const item=ITEM_DB[entry.itemId], qty=playerState.inventory[entry.itemId]||0;
    const row=document.createElement('div');row.className='merchant-row';
    row.innerHTML=`<span>${item.icon||'📦'} ${item.name} <small>x${qty}</small></span><span><button data-buy="1">Comprar ${entry.buyPrice}</button><button data-sell="1" ${entry.sellable===false||!qty?'disabled':''}>Vender ${entry.sellPrice}</button></span>`;
    row.querySelector('[data-buy]').onclick=()=>{const r=economySystem.buy(entry.itemId,1);if(r.ok)audioManager.play('SFX_COINS');document.getElementById('merchantFeedback').textContent=r.ok?`Comprado: ${item.name}.`:`Compra recusada: ${r.reason}.`;renderMerchantModal();};
    row.querySelector('[data-sell]').onclick=()=>{const r=economySystem.sell(entry.itemId,1);if(r.ok)audioManager.play('SFX_COINS');document.getElementById('merchantFeedback').textContent=r.ok?`Vendido: ${item.name}.`:`Venda recusada: ${r.reason}.`;renderMerchantModal();};
    list.appendChild(row);
  });
}
function useSelectedConsumable(){
  if(!selectedInventoryItemId)return;
  const itemId=selectedInventoryItemId;
  const result=consumableSystem.use(itemId);
  if(!result.ok){
    const messages={FULL:'HP já está cheio.',PA:'PA insuficiente.',TURN:'Aguarde seu turno para usar um item.',DEAD:'Personagem derrotado não pode usar itens.',UNAVAILABLE:'Item indisponível.'};
    if(game)logCombat('sys',messages[result.reason]||'Não foi possível usar este item.');
    else updateOverworldHint(messages[result.reason]||'Não foi possível usar este item.');
    return;
  }
  const message=`${ITEM_DB[itemId].name} usada: +${result.healed} HP${result.inCombat?` (${result.paCost} PA)`:''}.`;
  if(game&&currentState===GAME_STATES.COMBAT)logCombat('heal',message);else updateOverworldHint(message);
}
function selectInventoryItem(id){
  selectedInventoryItemId = id;
  const item = ITEM_DB[id];
  const panel = document.getElementById('invActionPanel');
  panel.style.display='block';
  panel.innerHTML = `
    <div class="ia-name">${item.icon} ${item.name}</div>
    <div class="ia-rarity" style="color:${getCssVar('--r-'+item.rarity.toLowerCase())}">${item.rarity}</div>
    <div class="ia-desc">${item.desc}</div>
    ${item.type==='CONSUMABLE'
      ? `<button class="ia-use-btn" id="iaUseBtn">Usar${currentState===GAME_STATES.COMBAT?` (${item.useCostAp||0} PA)`:''}</button>`
      : item.equip
      ? `<div class="ia-bonus">${item.equip.bonusLabel} (slot: ${EQUIP_SLOT_LABELS[item.equip.slot]})</div>
         <button class="ia-equip-btn" id="iaEquipBtn">Equipar</button>`
      : ''}
  `;
  if(item.type==='CONSUMABLE') document.getElementById('iaUseBtn').onclick=useSelectedConsumable;
  if(item.equip){ document.getElementById('iaEquipBtn').onclick = ()=>{ equipItem(id); }; }
}
function showTooltip(e,item){
  const tt=document.getElementById('itemTooltip');
  document.getElementById('ttName').textContent = item.name;
  const rarityEl=document.getElementById('ttRarity');
  rarityEl.textContent = item.rarity;
  rarityEl.style.color = getCssVar(`--r-${item.rarity.toLowerCase()}`);
  document.getElementById('ttDesc').textContent = item.desc;
  tt.style.display='block';
  moveTooltip(e);
}
function moveTooltip(e){
  const tt=document.getElementById('itemTooltip');
  const offset=16, margin=8;
  let left=e.clientX+offset, top=e.clientY+offset;
  const rect=tt.getBoundingClientRect();
  if(left+rect.width>window.innerWidth) left=e.clientX-rect.width-offset;
  if(top+rect.height>window.innerHeight) top=e.clientY-rect.height-offset;
  left=Math.max(margin,Math.min(left,window.innerWidth-rect.width-margin));
  top=Math.max(margin,Math.min(top,window.innerHeight-rect.height-margin));
  tt.style.left=left+'px'; tt.style.top=top+'px';
}
function hideTooltip(){ document.getElementById('itemTooltip').style.display='none'; }

document.getElementById('charBtn').onclick = ()=>toggleModal('char');
document.getElementById('invBtn').onclick  = ()=>toggleModal('inventory');
document.getElementById('charBtnMenu').onclick = ()=>toggleModal('char');
document.getElementById('invBtnMenu').onclick  = ()=>toggleModal('inventory');
document.getElementById('charBtnOverworld').onclick = ()=>toggleModal('char');
document.getElementById('invBtnOverworld').onclick  = ()=>toggleModal('inventory');
document.getElementById('questBtn').onclick = ()=>toggleModal('quests');
document.getElementById('questBtnOverworld').onclick = ()=>toggleModal('quests');
document.querySelectorAll('.close-x').forEach(btn=>{ btn.onclick = closeAllModals; });
document.getElementById('npcDialogClose').onclick = closeNpcDialogue;
document.getElementById('merchantClose').onclick = closeAllModals;

// =========================================================================================
// AÇÕES DO JOGADOR NO COMBATE
// =========================================================================================
function setMode(mode){
  const current = getCurrentCombatant();
  if(!current || current.side!=='player' || game.gameOver) return;
  if(ABILITIES[mode]&&ABILITIES[mode].targeting.targetType==='SELF'){tryCastAbility(mode,current.x,current.y);return;}
  game.mode = (game.mode===mode) ? null : mode;
  game.hoverCell=null;
}
renderAbilityHotbar();
document.getElementById('endTurnBtn').onclick= ()=>endPlayerTurn();
document.getElementById('resetBtn').onclick  = ()=>{ if(window.confirm('Reiniciar tudo e apagar o progresso salvo?')) resetGame(); };
document.getElementById('continueExploringBtn').onclick = ()=>returnToOverworldAfterCombat();
document.getElementById('menuBtn').onclick   = ()=>backToMenu();
document.getElementById('menuBtnOverworld').onclick = ()=>backToMenu();
document.getElementById('backToMenuBtn').onclick = ()=>backToMenu();
document.getElementById('startExploreBtn').onclick = ()=>enterOverworld();

document.addEventListener('keydown',(e)=>{
  if(e.isTrusted)audioManager.unlock();
  if(appState.ui.dialog){ if(e.key==='Escape'){audioManager.play('SFX_UI_CANCEL');closeNpcDialogue();} return; }
  if(e.key==='c' || e.key==='C'){audioManager.play(activeModal==='char'?'SFX_UI_CANCEL':'SFX_UI_CLICK');toggleModal('char'); return; }
  if(e.key==='i' || e.key==='I'){audioManager.play(activeModal==='inventory'?'SFX_UI_CANCEL':'SFX_INVENTORY');toggleModal('inventory'); return; }
  if(activeModal){ if(e.key==='Escape'){audioManager.play(activeModal==='quests'?'SFX_BOOK_CLOSE':'SFX_UI_CANCEL');closeAllModals();} return; }
  if((e.key==='e'||e.key==='E')&&currentState===GAME_STATES.OVERWORLD){
    const nearest=npcSystem.nearby(overworldState.currentMapId,overworldState.player,1)[0];
    if(nearest){openNpcDialogue(nearest.id);return;}
  }
  if(currentState!==GAME_STATES.COMBAT || !game) return;
  const current = getCurrentCombatant();
  if(!current || current.side!=='player' || game.gameOver) return;
  if(KEY_TO_MODE[e.key]){ setMode(KEY_TO_MODE[e.key]); }
  else if(e.key==='Escape'){ if(game.mode)audioManager.play('SFX_UI_CANCEL');game.mode=null; game.hoverCell=null; }
});

function handleBoardInteraction(x,y){
  if(currentState!==GAME_STATES.COMBAT || !game) return;
  if(activeModal) return;
  const current = getCurrentCombatant();
  if(!current || current.side!=='player' || game.gameOver) return;
  if(!inBoundsCombat(x,y)) return;
  if(game.mode===null) tryMove(x,y);
  else if(game.mode==='avanco') tryCastAbility('avanco',x,y);
  else if(ABILITIES[game.mode]) tryCastAbility(game.mode,x,y);
}
function combatCellFromClientXY(clientX,clientY){
  const point=canvasPointFromClient(canvas,clientX,clientY);
  if(!point.ok)return {x:-1,y:-1};
  updateCombatProjection();
  const picked=Isometric.screenToGrid({screenX:point.logicalX,screenY:point.logicalY,projection:combatProjection,bounds:{columns:COMBAT_GRID_SIZE,rows:COMBAT_GRID_SIZE}});
  return picked.ok?{x:picked.x,y:picked.y}:{x:-1,y:-1};
}
canvas.addEventListener('pointermove',(e)=>{
  if(currentState!==GAME_STATES.COMBAT || !game) return;
  const {x,y}=combatCellFromClientXY(e.clientX,e.clientY);
  game.hoverCell = inBoundsCombat(x,y) ? {x,y} : null;
});
canvas.addEventListener('pointerleave',()=>{ if(game) game.hoverCell=null; });
canvas.addEventListener('pointerup',(e)=>{
  if(currentState!==GAME_STATES.COMBAT || !game) return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  const {x,y}=combatCellFromClientXY(e.clientX,e.clientY);
  game.hoverCell = inBoundsCombat(x,y) ? {x,y} : null;
  handleBoardInteraction(x,y);
}, {passive:true});

function tryMove(x,y){
  const p = getCurrentCombatant();
  if(p.pm<=0) return;
  if(getUnitAt(x,y)){ logCombat('sys','Célula ocupada.'); return; }
  const {dist}=bfs(p.x,p.y,p);
  const d=dist.get(x+','+y);
  if(d===undefined || d===0 || !EngineRules.consumePm(p,d)) return;
  p.x=x; p.y=y;
  logCombat('move',`Jogador se move (${d} PM usados).`);
}

function tryCastAbility(key, clickX, clickY){
  const ability = ABILITIES[key];
  const p = getCurrentCombatant();
  const result=combatEngine.cast(game,{actorId:p.id,ability,target:{x:clickX,y:clickY}});
  if(!result.ok){
    logCombat('sys',UiFeedback.reasonMessage(result.reason,`${ability.name}: ação indisponível.`));return;
  }
  handleCombatEvents(result.events);
  logCombat('dmg',`Jogador usou ${ability.name}.`);
  game.mode=null;
  game.avancoPaths=null;
  checkVictory();
}

function tryAvanco(x,y){
  tryCastAbility('avanco',x,y);
}

// =========================================================================================
// FLUXO DE TURNOS — fila de iniciativa genérica
// =========================================================================================
function endPlayerTurn(){
  const current = getCurrentCombatant();
  if(!current || current.side!=='player' || game.gameOver) return;
  game.mode=null; game.hoverCell=null;
  logCombat('sys','--- Fim do turno do Jogador ---');
  finishCurrentTurn();
}
function finishCurrentTurn(){
  const current=getCurrentCombatant();
  if(!current||game.gameOver)return;
  const command=GameCommands.createCommand({
    id:`end-turn:${game.combatId||'combat'}:${++game.commandSequence}`,
    type:GameCommands.COMMAND_TYPES.END_TURN,
    actorId:current.id,
    payload:{},
    clientSequence:game.commandSequence
  });
  const result=localAuthority.dispatch(command);
  if(!result.accepted){logCombat('sys',`Fim de turno recusado: ${result.reason||'indisponível'}.`);return;}
  handleCombatEvents(result.events);
  checkVictory();
  if(!game.gameOver)advanceTurn();
}

// advanceTurn: avança o ponteiro na fila de iniciativa, pulando combatentes
// mortos, e inicia o turno de quem for o próximo (jogador OU mob).
function advanceTurn(){
  clearTurnTimer();
  if(game.gameOver) return;
  const next=EngineRules.nextAliveIndex(game.turnOrder, game.turnIndex, getCombatantById);
  if(next<0) return;
  game.turnIndex=next;
  if(game.turnIndex===0) game.turnNumber++;
  startTurnFor(getCurrentCombatant());
}
function isCombatantAliveInOrder(id){ const c=getCombatantById(id); return c && c.hp>0; }
function getCurrentCombatant(){ return game.combatants.find(c=>c.id===game.turnOrder[game.turnIndex]); }

// startTurnFor: restaura PA/PM do combatente ativo, reinicia o relógio de
// turno e, se for um mob, dispara sua IA após um pequeno delay de "leitura".
function startTurnFor(c){
  if(!c || game.gameOver) return;
  entityAnimations.setActiveUnit(c.id);
  const result=combatEngine.startTurn(game,c.id);
  handleCombatEvents(result.events);
  checkVictory();
  if(game.gameOver||!result.ok)return;
  startTurnTimer();
  if(c.side==='player'){
    logCombat('sys', `Turno ${game.turnNumber} — Jogador começa.`);
    updateSidePanel();
  } else {
    logCombat('sys', `Turno de ${c.name} começa.`);
    updateSidePanel();
    GameClock.after(()=>runMobTurn(c), 500);
  }
  pulseTurnBanner(c);
}

// =========================================================================================
// IA DOS MOBS — dispatcher genérico (melee/ranged) recebendo o combatente ativo
// =========================================================================================
function runMobTurn(mobCombatant){
  if(game.gameOver || mobCombatant.hp<=0){ advanceTurn(); return; }
  const template = MOB_TEMPLATES[mobCombatant.mobType];
  if(template.ai==='ranged') runRangedMobAI(mobCombatant, template);
  else if(template.ai==='control'||template.ai==='support') runTacticalMobAI(mobCombatant, template);
  else runMeleeMobAI(mobCombatant, template);
}

function runTacticalMobAI(b, template){
  GameClock.after(()=>{
    if(game.gameOver)return;
    const planner=template.ai==='support'?CombatAI.planSupportTurn:CombatAI.planControlTurn;
    const plan=planner(game,b,[template.attackAbility]);
    if(!plan.ok){GameClock.after(finishCurrentTurn,400);return;}
    if(plan.path.length){const moved=CombatAI.applyPath(game,b,plan.path,EngineRules);if(!moved.ok){GameClock.after(finishCurrentTurn,400);return;}logCombat('move',`${template.name} ajustou posição em ${moved.distance} célula(s).`);}
    const target=getCombatantById(plan.targetId)||b;
    const result=combatEngine.cast(game,{actorId:b.id,ability:plan.ability,target:{x:target.x,y:target.y}});
    if(!result.ok){GameClock.after(finishCurrentTurn,400);return;}
    handleCombatEvents(result.events);logCombat('sys',`${template.name} executou uma ação tática.`);checkVictory();if(!game.gameOver)GameClock.after(finishCurrentTurn,400);
  },600);
}

function runMeleeMobAI(b, template){
  GameClock.after(()=>meleeAttackPhase(b, template, 0), 600);
}
function meleeAttackPhase(b, template, count){
  if(game.gameOver) return;
  if(count>=template.attacksPerTurn){GameClock.after(finishCurrentTurn,400);return;}
  const plan=CombatAI.planMeleeTurn(game,b,template.attackAbility);
  if(!plan.ok){GameClock.after(finishCurrentTurn,400);return;}
  if(plan.path.length){
    const moved=CombatAI.applyPath(game,b,plan.path,EngineRules);
    if(!moved.ok){GameClock.after(finishCurrentTurn,400);return;}
    logCombat('move',`${template.name} moveu ${moved.distance} célula(s) em direção ao alvo.`);
  }
  const target=getCombatantById(plan.targetId);
  if(!target||target.hp<=0){GameClock.after(finishCurrentTurn,400);return;}
  const result=combatEngine.cast(game,{actorId:b.id,ability:template.attackAbility,target:{x:target.x,y:target.y}});
  if(!result.ok){GameClock.after(finishCurrentTurn,400);return;}
  handleCombatEvents(result.events);
  logCombat('dmg',`${template.name} ataca!`);
  checkVictory();
  if(game.gameOver)return;
  GameClock.after(()=>meleeAttackPhase(b,template,count+1),650);
}

function runRangedMobAI(b, template){
  GameClock.after(()=>rangedAttackPhase(b, template, 0), 600);
}
function rangedAttackPhase(b, template, count){
  if(game.gameOver) return;
  if(count>=template.attacksPerTurn){GameClock.after(finishCurrentTurn,400);return;}
  const plan=CombatAI.planRangedTurn(game,b,[template.attackAbility]);
  if(!plan.ok){GameClock.after(finishCurrentTurn,400);return;}
  if(plan.path.length){
    const moved=CombatAI.applyPath(game,b,plan.path,EngineRules);
    if(!moved.ok){GameClock.after(finishCurrentTurn,400);return;}
    logCombat('move',`${template.name} ajustou posição em ${moved.distance} célula(s).`);
  }
  const target=getCombatantById(plan.targetId);
  if(!target||target.hp<=0){GameClock.after(finishCurrentTurn,400);return;}
  const result=combatEngine.cast(game,{actorId:b.id,ability:plan.ability,target:{x:target.x,y:target.y}});
  if(!result.ok){GameClock.after(finishCurrentTurn,400);return;}
  handleCombatEvents(result.events);
  logCombat('dmg',`${template.name} lança um projétil flamejante!`);
  checkVictory();
  if(game.gameOver)return;
  GameClock.after(()=>rangedAttackPhase(b,template,count+1),650);
}

function findBestAdjacentCell(mover, target){
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  const candidates=[];
  dirs.forEach(([dx,dy])=>{
    const nx=target.x+dx, ny=target.y+dy;
    if(inBoundsCombat(nx,ny) && !isObstacle(nx,ny) && !getUnitAt(nx,ny)) candidates.push({x:nx,y:ny});
  });
  if(candidates.length===0) return null;
  const {dist}=bfs(mover.x,mover.y,mover);
  let best=null, bestDist=Infinity;
  candidates.forEach(c=>{ const d=dist.get(c.x+','+c.y); if(d!==undefined && d<bestDist){ bestDist=d; best=c; } });
  return best;
}

// =========================================================================================
// FIM DE BATALHA (vitória quando TODOS os mobs caem; derrota se o jogador cai)
// =========================================================================================
function rollLoot(mobType){
  return EngineRules.rollLoot(mobType, LOOT_TABLES, GameRng);
}
function checkVictory(){
  if(game.gameOver) return;
  const aliveMobs = getAliveMobs();
  const player = getPlayerCombatant();
  if(player.hp<=0){ game.gameOver=true; clearTurnTimer(); handleDefeat(); }
  else if(aliveMobs.length===0){ game.gameOver=true; clearTurnTimer(); handleVictory(); }
}
// handleVictory: soma XP e loot de CADA mob derrotado nesta batalha (grupo ou solo).
function handleVictory(){
  syncPersistentHpFromCombat();
  const defeatedMobs = game.combatants.filter(c=>c.side==='mob');
  let totalXp = 0;
  let totalCurrency = 0;
  let allLoot = [];
  defeatedMobs.forEach(mob=>{
    const template = MOB_TEMPLATES[mob.mobType];
    totalXp += template.xpReward;
    totalCurrency += Number(template.currencyReward)||0;
    const loot = rollLoot(mob.mobType);
    addItemsToInventory(loot);
    allLoot = allLoot.concat(loot);
  });
  const leveledUp = grantXP(totalXp);
  if(totalCurrency) economySystem.addCurrency(totalCurrency);
  const lootText = allLoot.map(({id,qty}) => `${ITEM_DB[id].icon} ${ITEM_DB[id].name} x${qty}`).join(', ') || 'nenhum item desta vez';

  document.getElementById('overlayTitle').textContent='Vitória!';
  document.getElementById('overlayText').textContent = defeatedMobs.length>1
    ? `Você derrotou ${defeatedMobs.length} inimigos!`
    : `${defeatedMobs[0].name} foi derrotado.`;
  document.getElementById('rewardBox').style.display='block';
  document.getElementById('levelUpBanner').style.display = leveledUp ? 'block' : 'none';
  document.getElementById('xpGained').textContent = `+${totalXp} XP${totalCurrency?` · +${totalCurrency} moedas`:''}`;
  document.getElementById('lootList').textContent = lootText;
  document.getElementById('continueExploringBtn').textContent='🗺️ Voltar ao Mapa';
  document.getElementById('overlay').style.display='flex';
  savePersistentState();
  logCombat('xp', `Vitória! +${totalXp} XP. Itens adicionados ao inventário: ${lootText}.`);
  if(leveledUp) logCombat('xp', `🎉 LEVEL UP! Jogador agora é nível ${playerState.level} (+5 pontos de atributo).`);
}
function handleDefeat(){
  syncPersistentHpFromCombat();
  const runtime=getCurrentRuntime();
  (overworldState.currentEncounterMobIds||[]).forEach(id=>{const mob=runtime&&runtime.mobs.find(m=>m.id===id);if(mob)mob.engaged=false;});
  overworldState.currentEncounterMobIds=null;
  overworldState.currentMapId='MAP_01';
  overworldState.player=getRespawnPoint('MAP_01');
  playerState.maxHp=calcPlayerMaxHp();
  playerState.hp=playerState.maxHp;
  saveSystem.clearSafeState();
  document.getElementById('overlayTitle').textContent='Derrota...';
  document.getElementById('overlayText').textContent='Você foi derrotado. A vila cuidará de você no retorno.';
  document.getElementById('rewardBox').style.display='none';
  document.getElementById('continueExploringBtn').textContent='🏠 Retornar à Vila';
  document.getElementById('overlay').style.display='flex';
  savePersistentState();
  logCombat('sys','Derrota. Nenhum XP ganho nesta batalha.');
}

// =========================================================================================
// LOOP PRINCIPAL (requestAnimationFrame)
// =========================================================================================
function gameLoop(now){
  if(currentState===GAME_STATES.OVERWORLD){
    renderOverworldFrame(now);
  } else if(currentState===GAME_STATES.COMBAT && game){
    render(now);
  }
  requestAnimationFrame(gameLoop);
}

// ---------- INICIALIZAÇÃO ----------
resetCombatState();
setGameState(GAME_STATES.MENU);
requestAnimationFrame(gameLoop);
