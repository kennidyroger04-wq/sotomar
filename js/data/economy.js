/* Economy V1 content. Prices are intentionally provisional until balance testing. */
(function(root){
  const CURRENCY_ID='base';
  const PROVISIONAL_NOTE='PROVISÓRIO — balanceamento futuro (Missão 8)';
  const prices={
    pocao_simples:{buy:12,sell:6}, couro_javali:{buy:4,sell:2}, dente_afiado:{buy:7,sell:3},
    presa_robusta:{buy:9,sell:4}, pata_javali:{buy:3,sell:1}, carne_suculenta:{buy:8,sell:4},
    esporo_brilhante:{buy:6,sell:3}, nucleo_flamejante:{buy:18,sell:9}, chapeu_couro:{buy:30,sell:15},
    espada_madeira:{buy:24,sell:12}, cajado_magico:{buy:55,sell:27}, anel_forca:{buy:45,sell:22}, anel_magico:{buy:48,sell:24}
  };
  const canonicalMaterials=['MAT_PLACAS_DE_CASCUDO','MAT_GARRAS','MAT_PO_DE_CAL','MAT_PELO','MAT_CERA','MAT_GLANDULA_DE_CHEIRO','MAT_COURO','MAT_CHIFRE','MAT_PELO_GROSSO','MAT_SEDA','MAT_GLANDULA_DE_FIO','MAT_PRESAS','MAT_PELE_UMIDA','MAT_LINGUA','MAT_GLANDULA_UMIDA','MAT_MUSGO_LUMINOSO','MAT_FIBRA','MAT_COURO_FINO','MAT_PENA_CALCIFICADA','MAT_PENA_MUDA','MAT_SERENO_CRISTALIZADO'];
  const canonicalItems={
    CON_INFUSAO_DE_ERVA_MANSA:{name:'Infusão de Erva Mansa',icon:'🫖',type:'CONSUMABLE',effect:{type:'HEAL',amount:25},useCostAp:2},
    CON_PAO_DE_MEL_E_CASTANHA:{name:'Pão de Mel e Castanha',icon:'🍯',type:'CONSUMABLE',effect:{type:'HEAL',amount:18}},
    EQ_FACAO_DE_ROCA:{name:'Facão de Roça',icon:'🔪',canonicalSlot:'weapon',mechanicsStatus:'simplificado'},
    EQ_FUNDA_DE_COURO:{name:'Funda de Couro',icon:'🪃',canonicalSlot:'weapon',mechanicsStatus:'simplificado'},
    EQ_FUNDA_DE_SEDA:{name:'Funda de Seda',icon:'🪃',canonicalSlot:'weapon',mechanicsStatus:'simplificado'},
    EQ_PRUMO_DE_PEDREIRO:{name:'Prumo de Pedreiro',icon:'⚖️',canonicalSlot:'weapon',mechanicsStatus:'simplificado'},
    EQ_CHAPEU_DE_PALHA_CAIADO:{name:'Chapéu de Palha Caiado',icon:'👒',canonicalSlot:'hat',mechanicsStatus:'simplificado'},
    EQ_TOUCA_DE_SEDA:{name:'Touca de Seda',icon:'🧢',canonicalSlot:'hat',mechanicsStatus:'simplificado'},
    EQ_GIBAO_DE_LAVRADOR:{name:'Gibão de Lavrador',icon:'🧥',canonicalSlot:'body',mechanicsStatus:'preservado_sem_slot_v1'},
    EQ_COURACA_DE_PLACAS:{name:'Couraça de Placas',icon:'🛡️',canonicalSlot:'body',mechanicsStatus:'preservado_sem_slot_v1'},
    EQ_PRUMO_DE_MEDICAO:{name:'Prumo de Medição',icon:'📏',canonicalSlot:'weapon',mechanicsStatus:'simplificado'},
    EQ_PODAO:{name:'Podão',icon:'🪓',canonicalSlot:'weapon',mechanicsStatus:'simplificado'},
    EQ_MALHO_DE_CAL:{name:'Maço de Cal',icon:'🔨',canonicalSlot:'weapon',mechanicsStatus:'simplificado'},
    EQ_MALHO_DE_CHIFRE:{name:'Malho de Chifre',icon:'🔨',canonicalSlot:'weapon',mechanicsStatus:'simplificado'},
    EQ_CAPUZ_DE_COURO_GROSSO:{name:'Capuz de Couro Grosso',icon:'🥷',canonicalSlot:'hat',mechanicsStatus:'simplificado'},
    EQ_MANTO_DE_MUSGO:{name:'Manto de Musgo',icon:'🧣',canonicalSlot:'body',mechanicsStatus:'preservado_sem_slot_v1'},
    EQ_FITA_DE_CERA:{name:'Fita de Cera',icon:'🎗️',canonicalSlot:'ring',mechanicsStatus:'simplificado'},
    EQ_FRAGMENTO_DE_CRAVA:{name:'Fragmento de Crava',icon:'🔹',canonicalSlot:'ring',mechanicsStatus:'simplificado'},
    EQ_PENA_MUDA:{name:'Pena-muda',icon:'🪶',canonicalSlot:'ring',mechanicsStatus:'preservado_sem_slot_v1'},
    EQ_LASCA_DE_SINO:{name:'Lasca de Sino',icon:'🔔',canonicalSlot:'ring',mechanicsStatus:'simplificado'},
    EQ_COLETE_CAIADO:{name:'Colete Caiado',icon:'🥋',canonicalSlot:'body',mechanicsStatus:'adiado'},
    EQ_LENTE_DE_PRUMEIRO:{name:'Lente de Prumeiro',icon:'👓',canonicalSlot:'ring',mechanicsStatus:'adiado'}
  };
  const CATALOG={};
  Object.keys(prices).forEach(id=>CATALOG[id]={itemId:id,buyPrice:prices[id].buy,sellPrice:prices[id].sell,sellable:true,provisional:true,note:PROVISIONAL_NOTE});
  Object.keys(canonicalItems).forEach((id,i)=>{CATALOG[id]={itemId:id,buyPrice:20+i*5,sellPrice:10+i*2,sellable:id!=='MAT_SERENO_CRISTALIZADO',provisional:true,note:PROVISIONAL_NOTE};});
  canonicalMaterials.forEach((id,i)=>{CATALOG[id]={itemId:id,buyPrice:3+i,sellPrice:Math.max(1,1+Math.floor(i/3)),sellable:id!=='MAT_SERENO_CRISTALIZADO',provisional:true,note:PROVISIONAL_NOTE};});
  const BRAM_ORDERS=[
    {id:'ORD_MALHO_DE_CHIFRE',itemId:'EQ_MALHO_DE_CHIFRE',requires:['MAT_CHIFRE'],status:'deferred'},
    {id:'ORD_FUNDA_DE_SEDA',itemId:'EQ_FUNDA_DE_SEDA',requires:['MAT_SEDA'],status:'deferred'},
    {id:'ORD_COURACA_DE_PLACAS',itemId:'EQ_COURACA_DE_PLACAS',requires:['MAT_PLACAS_DE_CASCUDO'],status:'deferred'},
    {id:'ORD_TOUCA_DE_SEDA',itemId:'EQ_TOUCA_DE_SEDA',requires:['MAT_SEDA'],status:'deferred'},
    {id:'ORD_MANTO_DE_MUSGO_LUMINOSO',itemId:'EQ_MANTO_DE_MUSGO',requires:['MAT_MUSGO_LUMINOSO'],status:'deferred'},
    {id:'ORD_FITA_DE_CERA_ORVALHADA',itemId:'EQ_FITA_DE_CERA',requires:['MAT_CERA'],status:'deferred'},
    {id:'ORD_CAPUZ_DE_COURO_GROSSO',itemId:'EQ_CAPUZ_DE_COURO_GROSSO',requires:['MAT_COURO','MAT_PELO_GROSSO'],status:'deferred'},
    {id:'ORD_COLETE_CAIADO',itemId:'EQ_COLETE_CAIADO',requires:['MAT_PO_DE_CAL'],status:'deferred'}
  ];
  const db=(root.ITEM_DB||(typeof ITEM_DB!=='undefined'?ITEM_DB:null));
  if(db){
    Object.keys(prices).forEach(id=>{if(db[id])db[id].economy={...CATALOG[id]};});
    Object.entries(canonicalItems).forEach(([id,item])=>{if(!db[id])db[id]={...item,economy:{...CATALOG[id]}};});
    canonicalMaterials.forEach((id,i)=>{if(!db[id])db[id]={name:id.replaceAll('_',' '),icon:'📦',rarity:'Comum',canonical:true,economy:{...CATALOG[id]}};});
  }
  root.ECONOMY_DATA={CURRENCY_ID,PROVISIONAL_NOTE,CATALOG,BRAM_ORDERS,canonicalMaterials,canonicalItems};
  if(typeof module!=='undefined')module.exports=root.ECONOMY_DATA;
})(globalThis);
