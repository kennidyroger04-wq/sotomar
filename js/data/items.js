const ITEM_DB = {
  pocao_simples:   { name:'Poção Simples', icon:'🧪', rarity:'Comum', type:'CONSUMABLE', desc:'Recupera 30 HP. Pode ser usada no mapa ou durante o combate.', effect:{type:'HEAL',amount:30}, useCostAp:2 },
  QITEM_DECALQUE_DO_SELO: { name:'Decalque do Selo', icon:'📜', rarity:'Especial', desc:'Evidência de quest obtida ao inspecionar o selo da Arena da Sineira.', questItem:true, canonical:true, economy:{itemId:'QITEM_DECALQUE_DO_SELO',buyPrice:0,sellPrice:0,sellable:false,provisional:true} },
  QITEM_TUFO_PALIDO: { name:'Tufo Pálido', icon:'🌿', rarity:'Especial', desc:'Quest item canônico encontrado nos Terraços das Roças.', questItem:true, canonical:true, economy:{itemId:'QITEM_TUFO_PALIDO',buyPrice:0,sellPrice:0,sellable:false} },
  QITEM_REGISTRO_DE_NIVEL: { name:'Registro de Nível', icon:'📜', rarity:'Especial', desc:'Quest item canônico inspecionado no Marco-Prumo.', questItem:true, canonical:true, economy:{itemId:'QITEM_REGISTRO_DE_NIVEL',buyPrice:0,sellPrice:0,sellable:false} },
  QITEM_PAGINA_DAS_BATIDAS: { name:'Página das Batidas', icon:'📜', rarity:'Especial', desc:'Quest item canônico inspecionado na Ponte Quebrada.', questItem:true, canonical:true, economy:{itemId:'QITEM_PAGINA_DAS_BATIDAS',buyPrice:0,sellPrice:0,sellable:false} },
  QITEM_PAGINAS_DE_AURELO: { name:'Páginas de Aurelo', icon:'📜', rarity:'Especial', desc:'Quest item canônico inspecionado no Acampamento de Aurelo.', questItem:true, canonical:true, economy:{itemId:'QITEM_PAGINAS_DE_AURELO',buyPrice:0,sellPrice:0,sellable:false} },
  couro_javali:    { name:'Couro de Javali',   icon:'🟫', rarity:'Comum',   desc:'Pele resistente e áspera. Usada para confeccionar armaduras leves.' },
  dente_afiado:    { name:'Dente Afiado',      icon:'🦷', rarity:'Incomum', desc:'Presa afiada como uma navalha. Ingrediente valioso para armas rústicas.' },
  presa_robusta:   { name:'Presa Robusta',     icon:'🦴', rarity:'Incomum', desc:'Presa grande e densa, muito procurada por ferreiros da região.' },
  pata_javali:     { name:'Pata de Javali',    icon:'🐾', rarity:'Comum',   desc:'Pata do javali, usada em rituais tribais e na culinária local.' },
  carne_suculenta: { name:'Carne Suculenta',   icon:'🍖', rarity:'Raro',    desc:'Corte nobre e fresco. Restaura energias quando consumido após a batalha.' },
  esporo_brilhante: { name:'Esporo Brilhante', icon:'✨', rarity:'Comum',  desc:'Um esporo luminoso e levemente quente ao toque.' },
  nucleo_flamejante:{ name:'Núcleo Flamejante', icon:'🔥', rarity:'Raro',  desc:'Núcleo instável que ainda emite calor intenso mesmo fora do corpo do cogumelo.' },
  chapeu_couro: {
    name:'Chapéu de Couro', icon:'🎩', rarity:'Incomum',
    desc:'Um chapéu resistente feito com couro de javali curtido. Protege a cabeça em combate.',
    equip:{ slot:'hat', bonus:{ hp:20 }, bonusLabel:'+20 HP Máximo' }
  },
  espada_madeira: {
    name:'Espada de Madeira', icon:'🗡️', rarity:'Comum',
    desc:'Uma espada de treino simples, mas ainda assim cortante o suficiente para lutar.',
    equip:{ slot:'weapon', bonus:{ forca:3 }, bonusLabel:'+3 Força' }
  },
  cajado_magico: {
    name:'Cajado Mágico', icon:'🪄', rarity:'Raro',
    desc:'Cajado entalhado que canaliza a energia flamejante extraída do núcleo do cogumelo.',
    equip:{ slot:'weapon', bonus:{ inteligencia:8 }, bonusLabel:'+8 Inteligência' }
  },
  anel_forca: {
    name:'Anel de Força', icon:'💍', rarity:'Raro',
    desc:'Um anel simples que fortalece os músculos de quem o usa.',
    equip:{ slot:'ring', bonus:{ forca:5 }, bonusLabel:'+5 Força' }
  },
  anel_magico: {
    name:'Anel Mágico', icon:'💫', rarity:'Raro',
    desc:'Anel enfeitiçado que amplifica os poderes arcanos do seu portador.',
    equip:{ slot:'ring', bonus:{ inteligencia:5 }, bonusLabel:'+5 Inteligência' }
  }
};
const RARITY_CLASS = { 'Comum':'rarity-comum', 'Incomum':'rarity-incomum', 'Raro':'rarity-raro' };
const LOOT_TABLES = {
  javali:   { materials:['couro_javali','dente_afiado','presa_robusta','pata_javali','carne_suculenta'],
              equipChance:0.35, equipPool:['chapeu_couro','anel_forca','espada_madeira'] },
  cogumelo: { materials:['esporo_brilhante','nucleo_flamejante'],
              equipChance:0.40, equipPool:['cajado_magico','anel_magico'] }
};


const STAT_INFO = {
  vitalidade:   {label:'Vitalidade',   desc:'+10 HP Máximo por ponto'},
  forca:        {label:'Força',        desc:'+1% Dano Terra/Físico por ponto'},
  inteligencia: {label:'Inteligência', desc:'+1% Dano de Fogo/Cura por ponto'},
  agilidade:    {label:'Agilidade',    desc:'+0.5% Crítico por ponto e define a ordem de iniciativa'}
};
if(typeof module!=='undefined') module.exports=ITEM_DB;
