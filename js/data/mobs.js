const MOB_TEMPLATES = {
  javali: {
    name:'Javali Selvagem', element:'terra', hp:80, maxHp:80, pa:6, maxPa:6, pm:3, maxPm:3,
    xpReward:45, currencyReward:6, ai:'melee', agilidade:4,
    attackRange:1, attackCost:3, attackDmg:15, attacksPerTurn:2, resistances:{PHYSICAL:0.05,MAGICAL:0},
    attackAbility:{id:'javali_attack',apCost:3,cooldown:0,range:{min:1,max:1},requiresLoS:false,targeting:{targetType:'ENEMY',shape:'SINGLE'},effects:[{type:'DAMAGE',target:'TARGET',damageType:'PHYSICAL',amount:15}]}
  },
  cogumelo: {
    name:'Cogumelo Mágico', element:'fogo', hp:55, maxHp:55, pa:6, maxPa:6, pm:2, maxPm:2,
    xpReward:55, currencyReward:9, ai:'ranged', agilidade:12,
    attackMinRange:3, attackMaxRange:5, attackCost:4, attackDmg:18, attacksPerTurn:1, resistances:{PHYSICAL:0,MAGICAL:0.1},
    attackAbility:{id:'cogumelo_attack',apCost:4,cooldown:0,range:{min:3,max:5},requiresLoS:true,targeting:{targetType:'ENEMY',shape:'SINGLE'},effects:[{type:'DAMAGE',target:'TARGET',damageType:'MAGICAL',amount:18}]}
  }
};
const MOB_VISUALS = {
  javali:   { emoji:'🐗', colorVar:'--danger' },
  cogumelo: { emoji:'🍄', colorVar:'--mob-fire' }
};
function getMobVisual(mobType){ return MOB_VISUALS[mobType] || MOB_VISUALS.javali; }
