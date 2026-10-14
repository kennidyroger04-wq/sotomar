/* Static NPC content. Positions are overworld cells, not persistent state. */
const NPC_DB = {
  guarda_mira: {
    id:'guarda_mira', name:'Mira, Guarda da Estrada', role:'QUEST', mapId:'0,0', position:{x:1,y:1}, visual:{emoji:'🛡️',colorVar:'--accent'},
    quests:['primeira_batalha','rastros_na_mata','reconhecimento_da_floresta'],
    dialogue:{greeting:'A estrada precisa de olhos atentos. Posso confiar uma tarefa a você?',available:'Há trabalho para quem quer ajudar a vila.',active:'Continue avançando; ainda há trabalho pela estrada.',ready:'Você voltou com tudo o que era necessário. Vamos registrar seu feito.',completed:'A vila agradece sua ajuda. Fique atento a novos chamados.'}
  },
  exploradora_lia: {
    id:'exploradora_lia', name:'Lia, Exploradora', role:'GENERIC', mapId:'0,0', position:{x:6,y:1}, visual:{emoji:'🧭',colorVar:'--accent2'},
    dialogue:{greeting:'As trilhas mudam depois da ponte. Posso compartilhar o que aprendi.',active:'Você encontrou o caminho. Conte-me o que viu por lá.',completed:'Seu relato já foi anotado. Boa caminhada.'}
  },
  curandeiro_nilo: {
    id:'curandeiro_nilo', name:'Nilo, Curandeiro', role:'HEALER', mapId:'0,0', position:{x:6,y:4}, visual:{emoji:'✚',colorVar:'--ok'},
    dialogue:{greeting:'Minhas ervas estão prontas. Deseja recuperar suas forças?',healed:'Pronto. Respire fundo e siga com cuidado.',full:'Você já está em boas condições.'}
  },
  mercador_bram: {
    id:'mercador_bram', name:'Bram, Comerciante', role:'MERCHANT', mapId:'0,0', position:{x:1,y:6}, visual:{emoji:'🧺',colorVar:'--xp'},
    dialogue:{greeting:'Estou organizando minhas mercadorias. Volte em breve; ainda não negocio por aqui.'}
  }
};
if(typeof module!=='undefined') module.exports=NPC_DB;
