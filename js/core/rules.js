/* Pure game rules. Mutations target explicit state objects, never DOM. */
(function(root){
  const DAMAGE_TYPES=Object.freeze({PHYSICAL:'PHYSICAL',MAGICAL:'MAGICAL'});
  const Rules={
    createPlayerState:()=>({playerId:'player',level:1,xp:0,xpNextLevel:100,pontosDisponiveis:0,stats:{vitalidade:0,forca:0,inteligencia:0,agilidade:0},inventory:{},equipment:{hat:null,weapon:null,ring:null},hp:100,maxHp:100}),
    effectiveStats(player,itemDb){
      const s={...player.stats,flatHpBonus:0};
      Object.values(player.equipment).forEach(id=>{const bonus=id&&itemDb[id]&&itemDb[id].equip&&itemDb[id].equip.bonus;if(!bonus)return; Object.entries(bonus).forEach(([k,v])=>k==='hp'?s.flatHpBonus+=v:s[k]=(s[k]||0)+v);}); return s;
    },
    playerMaxHp:(player,itemDb)=>100+Rules.effectiveStats(player,itemDb).vitalidade*10+Rules.effectiveStats(player,itemDb).flatHpBonus,
    clampPlayerHp:(player,itemDb)=>{const max=Rules.playerMaxHp(player,itemDb);player.maxHp=max;player.hp=Math.max(0,Math.min(Number.isFinite(Number(player.hp))?Math.trunc(Number(player.hp)):max,max));return player.hp;},
    grantXp(player,amount){ let leveled=false; player.xp+=amount; while(player.xp>=player.xpNextLevel){player.xp-=player.xpNextLevel;player.level++;player.xpNextLevel=Math.round(player.xpNextLevel*1.5);player.pontosDisponiveis+=5;leveled=true;} return leveled; },
    addLoot:(player,loot)=>loot.forEach(({id,qty})=>player.inventory[id]=(player.inventory[id]||0)+qty),
    damage(base,element,stats,rng){ const attrKey=element==='fogo'?'inteligencia':'forca',attrValue=stats[attrKey]||0,isCrit=rng.random()<(stats.agilidade||0)*.005; return {dmg:Math.round(base*(1+attrValue/100)*(isCrit?1.5:1)),isCrit,attrKey,attrValue}; },
    sanitizeResistance(value){const n=Number(value);return Number.isFinite(n)?Math.max(-0.5,Math.min(0.85,n)):0;},
    resolveCombatDamage({base,damageType,attackerStats={},damageBonus=0,targetResistance=0,rng}={}){
      const safeBase=Math.max(0,Math.trunc(Number(base)||0));
      const type=damageType===DAMAGE_TYPES.MAGICAL?DAMAGE_TYPES.MAGICAL:DAMAGE_TYPES.PHYSICAL;
      const source=Rules.damage(safeBase,type===DAMAGE_TYPES.MAGICAL?'fogo':'terra',attackerStats,rng||{random:()=>1});
      const bonus=Math.max(-0.9,Math.min(5,Number.isFinite(Number(damageBonus))?Number(damageBonus):0));
      const resistance=Rules.sanitizeResistance(targetResistance);
      return {...source,damageType:type,resistance,dmg:Math.max(0,Math.round(source.dmg*(1+bonus)*(1-resistance)))};
    },
    heal:(combatant,amount)=>{if(!combatant||combatant.hp<=0)return 0;const before=combatant.hp;combatant.hp=Math.min(combatant.maxHp,combatant.hp+Math.max(0,Math.trunc(Number(amount)||0)));return combatant.hp-before;},
    canSpendAp:(combatant,cost)=>combatant.hp>0&&combatant.pa>=cost,
    spendAp:(combatant,cost)=>{if(!Rules.canSpendAp(combatant,cost))return false;combatant.pa-=cost;return true;},
    canMove:(combatant,distance)=>combatant.hp>0&&distance!==undefined&&distance<=combatant.pm,
    consumePm:(combatant,distance)=>{if(!Rules.canMove(combatant,distance))return false;combatant.pm-=distance;return true;},
    applyDamage:(combatant,amount)=>{combatant.hp=Math.max(0,combatant.hp-amount);return combatant.hp===0;},
    initiative(combatants,playerAgility,mobTemplates,rng){ return combatants.map(c=>({id:c.id,score:(c.side==='player'?playerAgility:(mobTemplates[c.mobType].agilidade||0))+rng.random()*.01})).sort((a,b)=>b.score-a.score).map(x=>x.id); },
    nextAliveIndex(order,currentIndex,byId){ for(let i=1;i<=order.length;i++){const index=(currentIndex+i)%order.length,c=byId(order[index]);if(c&&c.hp>0)return index;} return -1; },
    createMob:(spec,template,position)=>({combatantId:spec.id,id:spec.id,mobId:spec.id,side:'mob',mobType:spec.type,name:template.name,x:position.x,y:position.y,hp:template.hp,maxHp:template.maxHp,pa:template.pa,maxPa:template.maxPa,pm:template.pm,maxPm:template.maxPm}),
    rollLoot(mobType,tables,rng){ const t=tables[mobType]||tables.javali,materials=t.materials.slice(); for(let i=materials.length-1;i>0;i--){const j=rng.int(0,i);[materials[i],materials[j]]=[materials[j],materials[i]];} const loot=materials.slice(0,Math.min(rng.int(1,2),materials.length)).map(id=>({id,qty:rng.int(1,2)})); if(rng.random()<t.equipChance)loot.push({id:t.equipPool[rng.int(0,t.equipPool.length-1)],qty:1}); return loot; }
  };
  Rules.DAMAGE_TYPES=DAMAGE_TYPES;
  root.EngineRules=Rules; if(typeof module!=='undefined')module.exports=Rules;
})(globalThis);
