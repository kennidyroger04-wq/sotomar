/* Versioned local persistence. Rules/UI do not know how the bytes are stored. */
(function(root){
  const SAVE_VERSION = 2;
  const DEFAULT_KEY = 'tatico-rpg-save';
  const CORRUPT_KEY = 'tatico-rpg-save-corrupt';
  const PLAYER_STATS = ['vitalidade','forca','inteligencia','agilidade'];
  const EQUIPMENT_SLOTS = ['hat','weapon','ring'];

  class LocalStorageAdapter {
    constructor(key=DEFAULT_KEY){ this.key=key; this.corruptKey=`${key}:corrupt`; }
    load(){ try { return root.localStorage ? root.localStorage.getItem(this.key) : null; } catch(_){ return null; } }
    save(data){ if(!root.localStorage) return false; root.localStorage.setItem(this.key, JSON.stringify(data)); return true; }
    remove(){ if(root.localStorage) root.localStorage.removeItem(this.key); }
    backupCorrupt(raw){ try { if(root.localStorage) root.localStorage.setItem(this.corruptKey, String(raw)); } catch(_){} }
  }

  class MemoryStorageAdapter {
    constructor(){ this.value=null; this.corrupt=null; }
    load(){ return this.value; }
    save(data){ this.value=JSON.stringify(data); return true; }
    remove(){ this.value=null; }
    backupCorrupt(raw){ this.corrupt=String(raw); }
  }

  function plainObject(value){ return value && typeof value==='object' && !Array.isArray(value) ? value : {}; }
  function finiteInt(value,fallback,min=0,max=Number.MAX_SAFE_INTEGER){
    const n=Number(value); return Number.isFinite(n) ? Math.min(max,Math.max(min,Math.trunc(n))) : fallback;
  }
  function playerMaxHp(player,itemDb){
    const stats=plainObject(player&&player.stats), equipment=plainObject(player&&player.equipment);
    let max=100+finiteInt(stats.vitalidade,0,0,999999)*10;
    Object.values(equipment).forEach(id=>{const item=itemDb&&itemDb[id];const bonus=item&&item.equip&&item.equip.bonus;if(bonus)max+=finiteInt(bonus.hp,0,0,999999);});
    return max;
  }

  class SaveSystem {
    constructor({storage,mapDatabase,itemDb,createInitialPlayerState,createInitialWorldState,stateProvider,normalizeMapId}){
      this.storage=storage || new LocalStorageAdapter();
      this.mapDatabase=mapDatabase || {};
      this.itemDb=itemDb || {};
      this.createInitialPlayerState=createInitialPlayerState;
      this.createInitialWorldState=createInitialWorldState;
      this.stateProvider=stateProvider || (()=>({}));
      this.normalizeMapId=normalizeMapId || (mapId=>mapId);
      this.safeWorld=null;
    }
    defaultSnapshot(){ return {player:this.createInitialPlayerState(),world:this.createInitialWorldState(),progression:{quests:{},currency:{},flags:{}}}; }
    isValidMapPosition(mapId,pos){
      const map=this.mapDatabase[mapId]; if(!map || !pos) return false;
      const x=finiteInt(pos.x,-1),y=finiteInt(pos.y,-1);
      return x>=0&&y>=0&&y<map.terrainRows.length&&x<map.terrainRows[y].length&&map.terrainRows[y][x]!=='T';
    }
    safeMapSpawn(mapId,fallback){
      const map=this.mapDatabase[mapId],spawn=map&&map.spawns&&map.spawns.SPAWN_DEFAULT;
      if(this.isValidMapPosition(mapId,spawn))return {x:finiteInt(spawn.x,0),y:finiteInt(spawn.y,0)};
      return this.isValidMapPosition(mapId,fallback)?{x:finiteInt(fallback.x,0),y:finiteInt(fallback.y,0)}:null;
    }
    sanitizePlayer(raw){
      const out=this.createInitialPlayerState(), source=plainObject(raw);
      out.playerId=typeof source.playerId==='string'&&source.playerId.trim()?source.playerId:'player';
      out.level=finiteInt(source.level,out.level,1,999);
      out.xp=finiteInt(source.xp,out.xp,0,Number.MAX_SAFE_INTEGER);
      out.xpNextLevel=finiteInt(source.xpNextLevel,out.xpNextLevel,1,Number.MAX_SAFE_INTEGER);
      out.pontosDisponiveis=finiteInt(source.pontosDisponiveis,out.pontosDisponiveis,0,999999);
      const stats=plainObject(source.stats);
      PLAYER_STATS.forEach(key=>{out.stats[key]=finiteInt(stats[key],0,0,999999);});
      const inventory=plainObject(source.inventory);
      Object.keys(inventory).forEach(id=>{if(this.itemDb[id]){const qty=finiteInt(inventory[id],0,0,999999);if(qty>0)out.inventory[id]=qty;}});
      const equipment=plainObject(source.equipment);
      EQUIPMENT_SLOTS.forEach(slot=>{const id=equipment[slot];out.equipment[slot]=(typeof id==='string'&&this.itemDb[id]&&this.itemDb[id].equip&&this.itemDb[id].equip.slot===slot)?id:null;});
      out.maxHp=playerMaxHp(out,this.itemDb);
      out.hp=finiteInt(source.hp,out.maxHp,0,out.maxHp);
      return out;
    }
    sanitizeWorld(raw){
      const out=this.createInitialWorldState(), source=plainObject(raw);
      const candidateMap=this.normalizeMapId(typeof source.currentMapId==='string'?source.currentMapId:out.currentMapId);
      out.currentMapId=this.mapDatabase[candidateMap]?candidateMap:out.currentMapId;
      const pos=plainObject(source.player);
      if(this.isValidMapPosition(out.currentMapId,pos)) out.player={x:finiteInt(pos.x,0),y:finiteInt(pos.y,0)};
      else {const spawn=this.safeMapSpawn(out.currentMapId,out.player);if(spawn)out.player=spawn;}
      /* Runtime mobs, timers, encounter IDs and pending returns are transient. */
      out.mapRuntime={};out.moving=false;out.moveInterval=null;out.currentEncounterMobIds=null;out.pendingReturn=null;
      return out;
    }
    sanitizeProgression(raw){
      const p=plainObject(raw);
      const currency={};Object.entries(plainObject(p.currency)).forEach(([id,value])=>{const n=finiteInt(value,0,0,Number.MAX_SAFE_INTEGER);if(n>0)currency[id]=n;});
      return {quests:plainObject(p.quests),currency,flags:plainObject(p.flags)};
    }
    serializePlayer(player){
      const p=this.sanitizePlayer(player);
      return {playerId:p.playerId,level:p.level,xp:p.xp,xpNextLevel:p.xpNextLevel,pontosDisponiveis:p.pontosDisponiveis,stats:{...p.stats},inventory:{...p.inventory},equipment:{...p.equipment},hp:p.hp,maxHp:p.maxHp};
    }
    serializeWorld(world){
      const w=this.sanitizeWorld(world);
      return {currentMapId:w.currentMapId,player:{x:w.player.x,y:w.player.y},mapState:{}};
    }
    serialize({player,world,progression}={}){
      return {version:SAVE_VERSION,savedAt:Date.now(),player:this.serializePlayer(player),world:this.serializeWorld(world),progression:this.sanitizeProgression(progression)};
    }
    saveNow(snapshot){
      const current=snapshot || this.stateProvider();
      const world=this.safeWorld || current.world;
      const data=this.serialize({player:current.player,world,progression:current.progression});
      this.storage.save(data); return data;
    }
    captureSafeState(world){ this.safeWorld=this.serializeWorld(world); }
    clearSafeState(){ this.safeWorld=null; }
    load(){
      const raw=this.storage.load();
      const initial=this.defaultSnapshot();
      if(raw===null||raw===undefined||raw==='') return {...initial,loaded:false,valid:true};
      try{
        const parsed=typeof raw==='string'?JSON.parse(raw):raw;
        const migrated=this.migrate(parsed);
        if(!migrated||migrated.version!==SAVE_VERSION) throw new Error('save version incompatible');
        return {player:this.sanitizePlayer(migrated.player),world:this.sanitizeWorld(migrated.world),progression:this.sanitizeProgression(migrated.progression),loaded:true,valid:true,migratedFrom:migrated.migratedFrom||null};
      }catch(_){ this.storage.backupCorrupt(raw); return {...initial,loaded:true,valid:false}; }
    }
    migrate(parsed){
      if(!parsed||typeof parsed!=='object') return null;
      if(parsed.version===SAVE_VERSION) return parsed;
      if(parsed.version===1)return this.migrateV1ToV2(parsed);
      return null;
    }
    migrateV1ToV2(parsed){
      const copy={...parsed,version:SAVE_VERSION,migratedFrom:1,player:{...(plainObject(parsed.player))}};
      if(!Number.isFinite(Number(copy.player.hp))) copy.player.hp=playerMaxHp(copy.player,this.itemDb);
      return copy;
    }
    remove(){ this.storage.remove(); this.clearSafeState(); }
  }

  const api={SAVE_VERSION,LocalStorageAdapter,MemoryStorageAdapter,SaveSystem,createSaveSystem:options=>new SaveSystem(options)};
  root.SaveSystem=api;
  if(typeof module!=='undefined') module.exports=api;
})(globalThis);
