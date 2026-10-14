/* Generic consumable rules. UI supplies the target and only renders the result. */
(function(root){
  const TYPES=Object.freeze({CONSUMABLE:'CONSUMABLE'});
  const EFFECTS=Object.freeze({HEAL:'HEAL'});
  const int=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
  class ConsumableEngine{
    constructor({itemDb,playerProvider,inventoryProvider,combatProvider,onChanged}={}){
      this.itemDb=itemDb||{};this.playerProvider=playerProvider||(()=>null);this.inventoryProvider=inventoryProvider||this.playerProvider;this.combatProvider=combatProvider||(()=>null);this.onChanged=onChanged||(()=>{});
    }
    getDefinition(itemId){return this.itemDb[itemId]||null;}
    getTarget(){const combat=this.combatProvider();return combat&&combat.player?combat.player:this.playerProvider();}
    canUse(itemId){
      const item=this.getDefinition(itemId),inventory=this.inventoryProvider(),target=this.getTarget(),combat=this.combatProvider();
      if(!item||item.type!==TYPES.CONSUMABLE||!inventory||int(inventory.inventory&&inventory.inventory[itemId],0)<=0)return {ok:false,reason:'UNAVAILABLE'};
      if(!target||int(target.hp,0)<=0)return {ok:false,reason:'DEAD'};
      if(combat&&combat.canUse===false)return {ok:false,reason:'TURN'};
      const max=int(target.maxHp,0);if(max<=0||int(target.hp,0)>=max)return {ok:false,reason:'FULL'};
      const cost=combat?Math.max(0,int(item.useCostAp,0)):0;
      if(combat&&int(target.pa,0)<cost)return {ok:false,reason:'PA'};
      if(!item.effect||item.effect.type!==EFFECTS.HEAL)return {ok:false,reason:'EFFECT'};
      return {ok:true,item,target,inventory,combat,cost};
    }
    use(itemId){
      const check=this.canUse(itemId);if(!check.ok)return check;
      const amount=Math.max(0,int(check.item.effect.amount,0));if(amount<=0)return {ok:false,reason:'EFFECT'};
      const before=int(check.target.hp,0),after=Math.min(int(check.target.maxHp,0),before+amount),healed=after-before;
      if(healed<=0)return {ok:false,reason:'FULL'};
      if(check.combat&&check.cost>0)check.target.pa-=check.cost;
      check.target.hp=after;check.inventory.inventory[itemId]-=1;if(check.inventory.inventory[itemId]<=0)delete check.inventory.inventory[itemId];
      const result={ok:true,itemId,healed,remaining:check.inventory.inventory[itemId]||0,paCost:check.cost,inCombat:!!check.combat,target:check.target};
      this.onChanged({type:'CONSUMABLE_USED',...result});return result;
    }
  }
  const api={TYPES,EFFECTS,ConsumableEngine,createConsumableSystem:options=>new ConsumableEngine(options)};
  root.ConsumableSystem=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
