/* Original, compact quest content. IDs are the permanent data identity. */
const QUEST_DB = {
  primeira_batalha: {
    id:'primeira_batalha', title:'Primeira Batalha',
    description:'Mostre que consegue proteger a estrada contra um javali.', prerequisites:[],
    objectives:[{id:'kill_javali_1',type:'KILL',target:'javali',amount:1,label:'Javalis derrotados'}],
    rewards:{xp:35,items:[{itemId:'pocao_simples',amount:1}],currency:[]}
  },
  rastros_na_mata: {
    id:'rastros_na_mata', title:'Rastros na Mata',
    description:'Derrote javalis e reúna couro suficiente para a oficina local.', prerequisites:['primeira_batalha'],
    objectives:[
      {id:'kill_javali_2',type:'KILL',target:'javali',amount:2,label:'Javalis derrotados'},
      {id:'collect_couro_javali',type:'COLLECT',target:'couro_javali',amount:2,label:'Couros obtidos'}
    ],
    rewards:{xp:60,items:[{itemId:'dente_afiado',amount:1}],currency:[]}
  },
  reconhecimento_da_floresta: {
    id:'reconhecimento_da_floresta', title:'Reconhecimento da Floresta',
    description:'Visite a floresta ao leste e converse com a exploradora ao retornar.', prerequisites:['rastros_na_mata'],
    objectives:[
      {id:'visit_floresta',type:'EXPLORE',target:'1,0',amount:1,label:'Mapa visitado'},
      {id:'talk_exploradora',type:'TALK',target:'exploradora_lia',amount:1,label:'Conversa com Lia'}
    ],
    rewards:{xp:45,items:[],currency:[]}
  }
};
if(typeof module!=='undefined') module.exports=QUEST_DB;
