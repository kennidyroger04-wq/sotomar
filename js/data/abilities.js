/* Ability data is resolved by CombatEffects; no UI rule is stored here. */
const ABILITIES = {
  golpe: {id:'golpe',name:'Golpe Pesado',apCost:4,cooldown:2,range:{min:1,max:1},requiresLoS:true,targeting:{targetType:'ENEMY',shape:'SINGLE'},effects:[{type:'DAMAGE',target:'TARGET',damageType:'PHYSICAL',amount:[35,45]}]},
  avanco: {id:'avanco',name:'Avanço Impactante',apCost:3,cooldown:0,range:{min:1,max:3},requiresLoS:false,requiresStraightLine:true,targeting:{targetType:'ENEMY',shape:'SINGLE'},effects:[{type:'MOVE',mode:'DASH',maxDistance:3},{type:'DAMAGE',target:'TARGET',damageType:'PHYSICAL',amount:20}]},
  cruz: {id:'cruz',name:'Explosão em Cruz',apCost:4,cooldown:0,range:{min:0,max:3},requiresLoS:true,targeting:{targetType:'CELL',shape:'CROSS'},effects:[{type:'DAMAGE',target:'AREA',targetFilter:'ENEMY',damageType:'MAGICAL',amount:[25,32]},{type:'STATUS',target:'AREA',targetFilter:'ENEMY',statusId:'VULNERABLE',duration:2,modifiers:{physicalResistance:-0.15,magicalResistance:-0.15}}]},
  lanca: {id:'lanca',name:'Arremesso de Lança',apCost:3,cooldown:0,range:{min:2,max:3},requiresLoS:true,targeting:{targetType:'ENEMY',shape:'SINGLE'},effects:[{type:'DAMAGE',target:'TARGET',damageType:'PHYSICAL',amount:[18,26]},{type:'STATUS',target:'TARGET',statusId:'POISON',duration:2,tick:{damageType:'PHYSICAL',amount:8}}]},
  fortificar: {id:'fortificar',name:'Postura Fortificada',apCost:2,cooldown:2,range:{min:0,max:0},requiresLoS:false,targeting:{targetType:'SELF',shape:'SINGLE'},effects:[{type:'BUFF',target:'SELF',statusId:'FORTIFIED',duration:2,modifiers:{physicalResistance:0.2,magicalResistance:0.1}}]}
};
const KEY_TO_MODE = { '1':'golpe', '2':'avanco', '3':'cruz', '4':'lanca', '5':'fortificar' };
function crossCells(center){
  const offsets = [[0,0],[1,0],[-1,0],[2,0],[-2,0],[0,1],[0,-1],[0,2],[0,-2]];
  return offsets.map(([ox,oy]) => ({x: center.x+ox, y: center.y+oy}));
}
if(typeof module!=='undefined') module.exports=ABILITIES;
