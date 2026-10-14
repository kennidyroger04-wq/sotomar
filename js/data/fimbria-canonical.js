/* Canonical Chapter 1 content registry. Data only: no boss, map renderer or new quest mechanics. */
(function(root){
  const exposures=Object.freeze(['NORMAL','ORVALHADO','MAREJADO','ENCHARCADO']);
  const npcIds=Object.freeze(['NPC_MIRA','NPC_LIA','NPC_NILO','NPC_BRAM']);
  const creatureRows=[
    ['CRE_CASCUDO_DE_CAL','Cascudo-de-cal',['NORMAL','ENCHARCADO'],'melee'],
    ['CRE_PAPA_MEL','Papa-mel',['NORMAL','ORVALHADO'],'melee'],
    ['CRE_TOPETAO','Topetão',['NORMAL','MAREJADO'],'melee'],
    ['CRE_FIANDEIRA','Fiandeira',['NORMAL','MAREJADO','ENCHARCADO'],'ranged_control'],
    ['CRE_SAPO_DE_POCA','Sapo-de-poça',['MAREJADO'],'control'],
    ['CRE_LERDO_DE_MUSGO','Lerdo-de-musgo',['MAREJADO','ENCHARCADO'],'support'],
    ['CRE_FAREJADOR_DE_BREJO','Farejador-de-brejo',['MAREJADO'],'pack'],
    ['CRE_CORUJA_MUDA','Coruja-muda',exposures,'special_deferred'],
    ['CRE_SINEIRA','Sineira',exposures,'boss_reference_only']
  ];
  const creatures={};creatureRows.forEach(([id,name,allowedExposures,ai])=>{creatures[id]={id,name,allowedExposures:[...allowedExposures],ai,mechanicsStatus:id==='CRE_SINEIRA'?'boss_deferred':id==='CRE_CORUJA_MUDA'?'special_deferred':'data_only'};});
  const variants={
    CRE_PAPA_MEL_ORVALHADO:['CRE_PAPA_MEL','ORVALHADO'],
    CRE_TOPETAO_MAREJADO:['CRE_TOPETAO','MAREJADO'],
    CRE_FIANDEIRA_MAREJADA:['CRE_FIANDEIRA','MAREJADO'],
    CRE_FIANDEIRA_ENCHARCADA:['CRE_FIANDEIRA','ENCHARCADO'],
    CRE_SAPO_DE_POCA_MAREJADO:['CRE_SAPO_DE_POCA','MAREJADO'],
    CRE_LERDO_DE_MUSGO_MAREJADO:['CRE_LERDO_DE_MUSGO','MAREJADO'],
    CRE_LERDO_DE_MUSGO_ENCHARCADO:['CRE_LERDO_DE_MUSGO','ENCHARCADO'],
    CRE_FAREJADOR_DE_BREJO_MAREJADO:['CRE_FAREJADOR_DE_BREJO','MAREJADO'],
    CRE_CASCUDO_DE_CAL_ENCHARCADO:['CRE_CASCUDO_DE_CAL','ENCHARCADO']
  };
  Object.entries(variants).forEach(([id,[baseId,exposure]])=>{creatures[id]={id,name:creatures[baseId].name,baseId,exposure,allowedExposures:[exposure],mechanicsStatus:'variant_data_only'};});
  const maps={
    MAP_01:{id:'MAP_01',name:'Caieira',type:'HUB',encounters:[],quests:['MAIN_01','MAIN_03','MAIN_06','MAIN_08','SIDE_01','SIDE_02','SIDE_03','SIDE_04','SIDE_05'],npcs:[...npcIds],connections:['MAP_02','MAP_04'],tbd:['cisterna exposure','side delivery points']},
    MAP_02:{id:'MAP_02',name:'Terraços das Roças',type:'TUTORIAL',encounters:['ENC_01','ENC_02'],quests:['MAIN_01'],npcs:[],connections:['MAP_01']},
    MAP_03:{id:'MAP_03',name:'Colmeal Velho',type:'OPTIONAL',encounters:['ENC_03','ENC_04'],quests:['SIDE_01'],npcs:[],connections:[],tbd:['topology/access']},
    MAP_04:{id:'MAP_04',name:'Trilha do Lenhador',type:'ROUTE',encounters:['ENC_05','ENC_06'],quests:['MAIN_02','SIDE_02'],npcs:[],connections:['MAP_01','MAP_05','MAP_06']},
    MAP_05:{id:'MAP_05',name:'Marco-Prumo',type:'INVESTIGATION',encounters:['ENC_07'],quests:['MAIN_04'],npcs:[],connections:['MAP_04','MAP_07'],tbd:['MAP_07 gate']},
    MAP_06:{id:'MAP_06',name:'Ponte Quebrada',type:'ALTERNATE_ROUTE',encounters:['ENC_08'],quests:['MAIN_04'],npcs:[],connections:['MAP_04','MAP_07'],tbd:['MAP_07 gate']},
    MAP_07:{id:'MAP_07',name:'Descida das Raízes',type:'CLOSED_EXTERIOR',encounters:['ENC_09'],quests:['MAIN_05'],npcs:[],connections:['MAP_05','MAP_06','MAP_08','MAP_09'],tbd:['entry and MAP_09 anchoring']},
    MAP_08:{id:'MAP_08',name:'Acampamento de Aurelo',type:'INVESTIGATION',encounters:['ENC_10'],quests:['MAIN_05','SIDE_05'],npcs:[],connections:['MAP_07','MAP_10']},
    MAP_09:{id:'MAP_09',name:'Pedras Brancas',type:'OPTIONAL_CLEARING',encounters:['ENC_11'],quests:['MAIN_05','SIDE_03'],npcs:[],connections:['MAP_07'],specialEncounter:'CORUJA_MUDA_DEFERRED',tbd:['anchoring','owl spawn']},
    MAP_10:{id:'MAP_10',name:'Boca do Grotão',type:'BIOME_TRANSITION',encounters:['ENC_12'],quests:['MAIN_07'],npcs:[],connections:['MAP_08','MAP_11']},
    MAP_11:{id:'MAP_11',name:'Arena da Sineira',type:'BOSS_ARENA',encounters:[],quests:['MAIN_07'],npcs:[],connections:['MAP_10'],bossReference:'CRE_SINEIRA',tbd:['boss mechanics and multi-tile occupancy']}
  };
  const encounterRows=[
    ['ENC_01','MAP_02',[['CRE_CASCUDO_DE_CAL','NORMAL']]],['ENC_02','MAP_02',[['CRE_CASCUDO_DE_CAL','NORMAL'],['CRE_CASCUDO_DE_CAL','NORMAL']]],
    ['ENC_03','MAP_03',[['CRE_PAPA_MEL','NORMAL'],['CRE_CASCUDO_DE_CAL','NORMAL']]],['ENC_04','MAP_03',[['CRE_PAPA_MEL_ORVALHADO','ORVALHADO']]],
    ['ENC_05','MAP_04',[['CRE_TOPETAO','NORMAL']]],['ENC_06','MAP_04',[['CRE_TOPETAO','NORMAL'],['CRE_FIANDEIRA','NORMAL']]],
    ['ENC_07','MAP_05',[['CRE_FIANDEIRA','NORMAL'],['CRE_FIANDEIRA_MAREJADA','MAREJADO']]],
    ['ENC_08','MAP_06',[['CRE_SAPO_DE_POCA','MAREJADO'],['CRE_SAPO_DE_POCA','MAREJADO'],['CRE_FIANDEIRA_MAREJADA','MAREJADO']]],
    ['ENC_09','MAP_07',[['CRE_LERDO_DE_MUSGO_MAREJADO','MAREJADO'],['CRE_FAREJADOR_DE_BREJO','MAREJADO'],['CRE_FAREJADOR_DE_BREJO','MAREJADO']]],
    ['ENC_10','MAP_08',[['CRE_LERDO_DE_MUSGO_ENCHARCADO','ENCHARCADO'],['CRE_FAREJADOR_DE_BREJO','MAREJADO']]],
    ['ENC_11','MAP_09',[['CRE_FAREJADOR_DE_BREJO','MAREJADO'],['CRE_FAREJADOR_DE_BREJO','MAREJADO'],['CRE_TOPETAO_MAREJADO','MAREJADO']]],
    ['ENC_12','MAP_10',[['CRE_CASCUDO_DE_CAL_ENCHARCADO','ENCHARCADO'],['CRE_SAPO_DE_POCA','MAREJADO'],['CRE_FIANDEIRA_ENCHARCADA','ENCHARCADO']]]
  ];
  const encounters={};encounterRows.forEach(([id,mapId,composition])=>{encounters[id]={id,mapId,composition:composition.map(([creatureId,exposure])=>({creatureId,exposure})),status:'data_only'};});
  const exits=[{id:'EXIT_CARROCAL',from:'MAP_01',to:'MAP_04',bidirectional:true,status:'open_sandbox_access'},{id:'EXIT_ESCADA_MARCO_PRUMO',from:'MAP_05',to:'MAP_07',requiresFlag:'FLAG_ESCADA_MARCO_PRUMO_UNLOCKED',bidirectional:true,status:'prepared_tbd'}];
  const questItems={
    QITEM_TUFO_PALIDO:{name:'Tufo Pálido',questRefs:['MAIN_02','MAIN_03'],origin:'MAP_02',originPointId:'POINT_TUFO_PALIDO',acquisitionMethod:'INSPECT',questItem:true},
    QITEM_REGISTRO_DE_NIVEL:{name:'Registro de Nível',questRefs:['MAIN_04'],origin:'MAP_05',originPointId:'POINT_MARCO_PRUMO_REGISTRO',acquisitionMethod:'INSPECT',questItem:true},
    QITEM_PAGINA_DAS_BATIDAS:{name:'Página das Batidas',questRefs:['MAIN_04'],origin:'MAP_06',originPointId:'POINT_PONTE_PAGINA_BATIDAS',acquisitionMethod:'INSPECT',questItem:true},
    QITEM_PAGINAS_DE_AURELO:{name:'Páginas de Aurelo',questRefs:['MAIN_05'],origin:'MAP_08',originPointId:'POINT_ACAMPAMENTO_PAGINAS_AURELO',acquisitionMethod:'INSPECT',questItem:true},
    QITEM_DECALQUE_DO_SELO:{name:'Decalque do Selo',questRefs:['MAIN_07','MAIN_08'],origin:'MAP_11',questItem:true},
    ITEM_COLETE_CAIADO:{name:'Colete Caiado',rewardRefs:['MAIN_01'],canonicalSlot:'body',mechanicsStatus:'deferred'},
    ITEM_PENA_MUDA:{name:'Pena-muda',rewardRefs:['SIDE_03'],mechanicsStatus:'deferred'},
    ITEM_UNGUENTO_MUSGO_CLARO:{name:'Unguento de Musgo Claro',rewardRefs:['SIDE_05'],mechanicsStatus:'deferred'}
  };
  const quest=(id,title,prerequisites,objectives,meta={})=>({id,title,description:meta.description||title,prerequisites,rewards:{xp:0,items:meta.rewards||[],currency:[]},objectives,canonical:true,contentStatus:meta.contentStatus||'registered',...meta});
  const quests={
    MAIN_01:quest('MAIN_01','A Cerca Quebrada',[],[{id:'main01_talk_mira',type:'TALK',target:'NPC_MIRA',amount:1},{id:'main01_map02',type:'EXPLORE',target:'MAP_02',amount:1},{id:'main01_cascudo',type:'KILL',target:'CRE_CASCUDO_DE_CAL',amount:1},{id:'main01_turnin',type:'TALK',target:'NPC_MIRA',amount:1}],{rewards:[{itemId:'ITEM_COLETE_CAIADO',amount:1}],rewardStatus:'canonical_item_deferred',runtimeStatus:'PARTIAL',remainingBlocker:'canonical map/mob/NPC adapters'}),
    MAIN_02:quest('MAIN_02','Rastros Subindo',['MAIN_01'],[{id:'main02_map04',type:'EXPLORE',target:'MAP_04',amount:1},{id:'main02_tufo',type:'COLLECT',target:'QITEM_TUFO_PALIDO',amount:1},{id:'main02_topetao',type:'KILL',target:'CRE_TOPETAO',amount:1},{id:'main02_turnin',type:'TALK',target:'NPC_LIA',amount:1}],{deliveryTbd:true,worldFlagReward:'FLAG_CARROCAL_UNLOCKED',runtimeStatus:'DATA-ONLY',remainingBlocker:'canonical map/mob adapters'}),
    MAIN_03:quest('MAIN_03','Sopa com Sal Demais',['MAIN_02'],[{id:'main03_show_nilo',type:'TALK',target:'NPC_NILO',amount:1},{id:'main03_turnin',type:'TALK',target:'NPC_NILO',amount:1}],{pendingObjectives:['COLLECT: materiais não definidos pelo cânone'],contentStatus:'partial_registered',runtimeStatus:'PARTIAL',remainingBlocker:'materials and canonical NPC adapter'}),
    MAIN_04:quest('MAIN_04','O Prumo Molhado',['MAIN_03'],[{id:'main04_route',type:'OR',alternatives:[{type:'EXPLORE',target:'MAP_05'},{type:'EXPLORE',target:'MAP_06'}],amount:1,label:'Marco-Prumo ou Ponte Quebrada'},{id:'main04_registro',type:'COLLECT',target:'QITEM_REGISTRO_DE_NIVEL',amount:1},{id:'main04_batidas',type:'COLLECT',target:'QITEM_PAGINA_DAS_BATIDAS',amount:1},{id:'main04_turnin',type:'TALK',target:'NPC_LIA',amount:1}],{contentStatus:'or_supported',worldFlagReward:'FLAG_ESCADA_MARCO_PRUMO_UNLOCKED',runtimeStatus:'PARTIAL',remainingBlocker:'canonical map adapter'}),
    MAIN_05:quest('MAIN_05','Abaixo da Fronteira',['MAIN_04'],[{id:'main05_talk_mira',type:'TALK',target:'NPC_MIRA',amount:1},{id:'main05_map07',type:'EXPLORE',target:'MAP_07',amount:1},{id:'main05_map08',type:'EXPLORE',target:'MAP_08',amount:1},{id:'main05_paginas',type:'COLLECT',target:'QITEM_PAGINAS_DE_AURELO',amount:1},{id:'main05_return',type:'EXPLORE',target:'MAP_01',amount:1}],{optionalObjectives:[{type:'EXPLORE',target:'MAP_09'}],runtimeStatus:'DATA-ONLY',remainingBlocker:'canonical map adapter'}),
    MAIN_06:quest('MAIN_06','O Que Mira Calou',['MAIN_05'],[{id:'main06_cisterna',type:'EXPLORE',target:'MAP_01',amount:1},{id:'main06_mira',type:'TALK',target:'NPC_MIRA',amount:1}],{sceneParticipants:['NPC_MIRA','NPC_BRAM','NPC_LIA'],contentStatus:'scene_deferred',runtimeStatus:'DATA-ONLY',remainingBlocker:'multi-NPC scene'}),
    MAIN_07:quest('MAIN_07','Osúma',['MAIN_06'],[{id:'main07_map10',type:'EXPLORE',target:'MAP_10',amount:1},{id:'main07_map11',type:'EXPLORE',target:'MAP_11',amount:1},{id:'main07_sineira',type:'BOSS',target:'CRE_SINEIRA',amount:1,requireNonLethal:true},{id:'main07_seal',type:'INSPECT',target:'SELO_CENTRAL',amount:1}],{contentStatus:'narrative_ready',runtimeStatus:'PARTIAL',remainingBlocker:'MAIN_07 completion/return'}),
    MAIN_08:quest('MAIN_08','Cal na Porta',['MAIN_07'],[{id:'main08_decalque',type:'COLLECT',target:'QITEM_DECALQUE_DO_SELO',amount:1},{id:'main08_mira',type:'TALK',target:'NPC_MIRA',amount:1}],{requiredFlags:['FLAG_SINEIRA_RESOLVED','FLAG_SEAL_INSPECTED'],contentStatus:'registered',runtimeStatus:'PARTIAL',remainingBlocker:'MAIN_07'}),
    SIDE_01:quest('SIDE_01','Mel e Cera',[],[{id:'side01_map03',type:'EXPLORE',target:'MAP_03',amount:1},{id:'side01_nilo',type:'TALK',target:'NPC_NILO',amount:1}],{pendingObjectives:['COLLECT: mel/cera não definidos'],contentStatus:'partial_registered',runtimeStatus:'DATA-ONLY',remainingBlocker:'MAP_03 topology/materials'}),
    SIDE_02:quest('SIDE_02','Contrato Atrasado',[],[{id:'side02_map04',type:'EXPLORE',target:'MAP_04',amount:1},{id:'side02_bram',type:'TALK',target:'NPC_BRAM',amount:1}],{problemResolutionTbd:true,runtimeStatus:'PARTIAL',remainingBlocker:'canonical MAP_04 runtime adapter'}),
    SIDE_03:quest('SIDE_03','A Clareira Branca',[],[{id:'side03_map09',type:'EXPLORE',target:'MAP_09',amount:1},{id:'side03_lia',type:'TALK',target:'NPC_LIA',amount:1}],{rewards:[{itemId:'ITEM_PENA_MUDA',amount:1}],pendingEvents:['ENCOUNTER_RESOLVED'],contentStatus:'nonlethal_encounter_deferred',runtimeStatus:'BLOCKED',remainingBlocker:'Coruja/M10'}),
    SIDE_04:quest('SIDE_04','Caiação Adiantada',[],[{id:'side04_mira',type:'TALK',target:'NPC_MIRA',amount:1}],{pendingObjectives:['COLLECT: cal não definido'],contentStatus:'partial_registered',runtimeStatus:'DATA-ONLY',remainingBlocker:'canonical materials'}),
    SIDE_05:quest('SIDE_05','Pote Vazio',[],[{id:'side05_nilo',type:'TALK',target:'NPC_NILO',amount:1}],{rewards:[{itemId:'ITEM_UNGUENTO_MUSGO_CLARO',amount:1}],pendingObjectives:['COLLECT: musgo/materiais não definidos'],contentStatus:'partial_registered',runtimeStatus:'BLOCKED',remainingBlocker:'habitat/materials TBD'})
  };
  const flags=['FLAG_CARROCAL_UNLOCKED','FLAG_ESCADA_MARCO_PRUMO_UNLOCKED','FLAG_MIRA_CONFESSED','FLAG_SINEIRA_RESOLVED','FLAG_SEAL_INSPECTED','FLAG_CORUJA_MUDA_RESOLVED'];
  const aliases={ENC_E01:'ENC_01',ENC_E02:'ENC_02',ENC_E03:'ENC_03',ENC_E04:'ENC_04',ENC_E05:'ENC_05',ENC_E06:'ENC_06',ENC_E07:'ENC_07',ENC_E08:'ENC_08',ENC_E09:'ENC_09',ENC_E10:'ENC_10',ENC_E11:'ENC_11',ENC_E12:'ENC_12',NPC_MIRA:'guarda_mira',NPC_LIA:'exploradora_lia',NPC_NILO:'curandeiro_nilo',NPC_BRAM:'mercador_bram'};
  const legacy={javali:{classification:'LEGACY NECESSÁRIO',canonical:false,reason:'protótipo jogável e testes'},cogumelo:{classification:'LEGACY NECESSÁRIO',canonical:false,reason:'protótipo jogável e testes'}};
  const arenaMetadata={
    MAP_11:{id:'MAP_11',elements:['SELO_CENTRAL','CRAVAS','COLUNAS','CANAIS_SERENO','CAL_ANTIGA','PLATAFORMAS_LATERAIS'],sealPointId:'SELO_CENTRAL',coordinates:'TBD',layoutStatus:'placeholder',sineiraExit:{stateFlag:'FLAG_SINEIRA_RESOLVED',movement:'UNKNOWN'}}
  };
  const bosses={CRE_SINEIRA:{bossId:'CRE_SINEIRA',name:'Sineira',kind:'BOSS',arenaId:'MAP_11',nonLethal:true,phases:['GUARDIA','ALVOROCO','ALIVIO'],identity:{description:'Grande cágado-de-sino; casco calcificado em forma de sino, musgo luminoso e veios pálidos.',alignment:'não maligna',exposure:'pressão de Sereno aumentada'},exposure:{id:'SINEIRA_SERENO_PRESSURE',min:0,max:100,initial:50,note:'PROVISÓRIO — BALANCEAMENTO FUTURO'},mechanicsStatus:'contract_only'}};
  const mysteries={BATTIDAS:{relation:'UNKNOWN',note:'A origem e a causa permanecem indefinidas.'},SETE_ENTALHES:{meaning:'UNKNOWN',note:'O significado permanece indefinido.'}};
  const registry={exposures,creatures,variants,maps,encounters,exits,questItems,quests,npcIds,flags,aliases,legacy,arenaMetadata,bosses,mysteries,owlEncounter:{id:'CORUJA_MUDA_SPECIAL',mapId:'MAP_09',creatureId:'CRE_CORUJA_MUDA',status:'deferred'},sineiraEncounter:{id:'SINEIRA_BOSS_SPECIAL',mapId:'MAP_11',creatureId:'CRE_SINEIRA',status:'boss_deferred'}};
  function validateReferences(){
    const errors=[];const ids=(obj,label)=>{const keys=Object.keys(obj);if(new Set(keys).size!==keys.length)errors.push(`${label}:duplicate`);};
    ids(registry.creatures,'creatures');ids(registry.maps,'maps');ids(registry.encounters,'encounters');ids(registry.quests,'quests');ids(registry.questItems,'questItems');
    Object.values(registry.encounters).forEach(e=>{if(!registry.maps[e.mapId])errors.push(`${e.id}:map`);e.composition.forEach(c=>{const creature=registry.creatures[c.creatureId];if(!creature)errors.push(`${e.id}:creature:${c.creatureId}`);if(!registry.exposures.includes(c.exposure))errors.push(`${e.id}:exposure:${c.exposure}`);if(creature&&!creature.allowedExposures.includes(c.exposure))errors.push(`${e.id}:unsupported_exposure:${c.creatureId}:${c.exposure}`);});});
    Object.values(registry.maps).forEach(m=>{m.encounters.forEach(id=>{if(!registry.encounters[id])errors.push(`${m.id}:encounter:${id}`);});m.quests.forEach(id=>{if(!registry.quests[id])errors.push(`${m.id}:quest:${id}`);});m.connections.forEach(id=>{if(!registry.maps[id])errors.push(`${m.id}:connection:${id}`);});});
    Object.values(registry.quests).forEach(q=>{(q.objectives||[]).forEach(o=>{if(!['KILL','COLLECT','EXPLORE','TALK','BOSS','OR','ENCOUNTER','INSPECT'].includes(o.type))errors.push(`${q.id}:type:${o.type}`);if((o.type==='KILL'||o.type==='BOSS')&&!registry.creatures[o.target])errors.push(`${q.id}:creature:${o.target}`);if(o.type==='COLLECT'&&!registry.questItems[o.target])errors.push(`${q.id}:item:${o.target}`);if(o.type==='EXPLORE'&&!registry.maps[o.target])errors.push(`${q.id}:map:${o.target}`);if(o.type==='TALK'&&!registry.npcIds.includes(o.target))errors.push(`${q.id}:npc:${o.target}`);if(o.type==='OR')(o.alternatives||[]).forEach(a=>{if(a.type==='EXPLORE'&&!registry.maps[a.target])errors.push(`${q.id}:or_map:${a.target}`);});});(q.prerequisites||[]).forEach(id=>{if(!registry.quests[id])errors.push(`${q.id}:prerequisite:${id}`);});});
    return {ok:errors.length===0,errors};
  }
  registry.validateReferences=validateReferences;
  const db=(root.ITEM_DB||(typeof ITEM_DB!=='undefined'?ITEM_DB:null));
  if(db)Object.entries(questItems).forEach(([id,item])=>{if(!db[id])db[id]={name:item.name,icon:'📜',rarity:'Especial',desc:'Conteúdo canônico de quest; origem/uso permanecem conforme TBD.',questItem:item.questItem===true,canonical:true,canonicalSlot:item.canonicalSlot,mechanicsStatus:item.mechanicsStatus,economy:{itemId:id,buyPrice:0,sellPrice:0,sellable:false,provisional:true}};});
  const questDb=(root.QUEST_DB||(typeof QUEST_DB!=='undefined'?QUEST_DB:null));
  if(questDb)Object.assign(questDb,quests);
  root.FIMBRIA_CANONICAL=registry;
  if(typeof module!=='undefined')module.exports=registry;
})(globalThis);
