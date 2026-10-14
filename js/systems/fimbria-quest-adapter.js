/* Minimal bridge from canonical chapter data into existing runtime registries. */
(function(root){
  function createQuestDatabase(legacyQuests={},canonicalQuests={}){
    return {...legacyQuests,...canonicalQuests};
  }
  function createNpcDatabase(legacyNpcs={},canonicalQuests={},npcAliases={}){
    const questIdsByNpc={};
    Object.entries(canonicalQuests).forEach(([questId,quest])=>{
      (quest.objectives||[]).filter(objective=>objective.type==='TALK').forEach(objective=>{
        const npcId=npcAliases[objective.target]||objective.target;
        (questIdsByNpc[npcId]||(questIdsByNpc[npcId]=[])).push(questId);
      });
    });
    return Object.fromEntries(Object.entries(legacyNpcs).map(([npcId,npc])=>[
      npcId,{...npc,quests:[...new Set(questIdsByNpc[npcId]||[])]}
    ]));
  }
  function acceptMapAssignedQuests(mapId,canonicalMaps,questSystem){
    const accepted=[],metadata=canonicalMaps&&canonicalMaps[mapId];
    (metadata&&metadata.quests||[]).forEach(questId=>{
      const quest=questSystem&&questSystem.getDefinition(questId);
      if(quest&&quest.canonical&&!(quest.objectives||[]).some(objective=>objective.type==='TALK')&&questSystem.isAvailable(questId)&&questSystem.acceptQuest(questId))accepted.push(questId);
    });
    return accepted;
  }
  const api={createQuestDatabase,createNpcDatabase,acceptMapAssignedQuests};
  root.FimbriaQuestAdapter=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
