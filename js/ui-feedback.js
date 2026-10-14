/* Apresentação pura: não decide regras, apenas traduz estados já calculados. */
(function(root){
  const REASONS=Object.freeze({PA:'PA insuficiente.',COOLDOWN:'Habilidade em recarga.',RANGE:'Fora de alcance.',LOS:'Sem linha de visão.',TARGET:'Alvo inválido.',PATH:'Caminho bloqueado.',DEAD:'Unidade derrotada não pode agir.',TURN:'Aguarde seu turno.',ABILITY:'Habilidade indisponível.'});
  function reasonMessage(reason,fallback='Ação indisponível.'){return REASONS[reason]||fallback;}
  function eventMessage(event={},targetName='Unidade'){
    if(event.type==='DAMAGE_APPLIED')return `${targetName} sofreu ${event.amount} dano.`;
    if(event.type==='HEAL_APPLIED')return `${targetName} recuperou ${event.amount} HP.`;
    if(event.type==='STATUS_APPLIED')return `${targetName} recebeu ${event.statusId}.`;
    if(event.type==='STATUS_EXPIRED')return `${event.statusId} expirou em ${targetName}.`;
    if(event.type==='UNIT_DIED')return `${targetName} foi derrotado.`;
    if(event.type==='BOSS_CRITICAL')return `${targetName} chegou ao estado crítico, mas permanece vivo.`;
    if(event.type==='BOSS_RESOLVED')return `${targetName} foi resolvida sem morte.`;
    if(event.type==='BOSS_PHASE_CHANGED')return `Fase alterada: ${event.from} → ${event.to}.`;
    if(event.type==='CRAVA_INTERACTED')return `Crava utilizada. Pressão reduzida.`;
    if(event.type==='QUEST_PROGRESS')return 'Objetivo de quest atualizado.';
    if(event.type==='ITEM_ACQUIRED')return `Item recebido: ${event.itemId}.`;
    return null;
  }
  function activeTelegraphCells(telegraphs=[]){
    const cells=[];(Array.isArray(telegraphs)?telegraphs:[]).filter(t=>t&&t.status==='PENDING').forEach(t=>{
      const area=t.area&&Array.isArray(t.area.cells)?t.area.cells:[];area.forEach(cell=>{if(cell&&Number.isFinite(Number(cell.x))&&Number.isFinite(Number(cell.y)))cells.push({x:Number(cell.x),y:Number(cell.y),telegraphId:t.id});});
      const target=t.target;if(target&&Number.isFinite(Number(target.x))&&Number.isFinite(Number(target.y))&&!area.length)cells.push({x:Number(target.x),y:Number(target.y),telegraphId:t.id});
    });return cells;
  }
  function objectiveLabel(view={}){const labels={KILL:'Derrotar',COLLECT:'Obter',EXPLORE:'Explorar',TALK:'Falar com',BOSS:'Resolver',INSPECT:'Inspecionar',ENCOUNTER:'Resolver encontro',OR:'Escolher rota'};return labels[view.type]||'Objetivo';}
  function transitionPresentation(kind){return kind==='return'?Object.freeze({className:'returning',label:'↩ EXPLORAÇÃO'}):Object.freeze({className:'',label:'⚔️ EM BATALHA! ⚔️'});}
  const api={REASONS,reasonMessage,eventMessage,activeTelegraphCells,objectiveLabel,transitionPresentation};root.UiFeedback=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
