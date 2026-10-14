/* Presentation-only HUD helpers. They do not own combat, quest, or save state. */
(function(root){
  const HOTBAR_SLOTS=Object.freeze([
    {key:'1',abilityId:'golpe'},
    {key:'2',abilityId:'avanco'},
    {key:'3',abilityId:'cruz'},
    {key:'4',abilityId:'lanca'},
    {key:'5',abilityId:'fortificar'}
  ]);

  function hotbarEntries(abilities={}){
    return HOTBAR_SLOTS.map(slot=>{
      const ability=abilities[slot.abilityId];
      if(!ability) throw new Error(`HUD ability is missing: ${slot.abilityId}`);
      return {key:slot.key,abilityId:slot.abilityId,name:ability.name,apCost:ability.apCost};
    });
  }

  function activeQuestTracker(activeQuests=[]){
    const entry=activeQuests[0];
    if(!entry) return null;
    return {
      id:entry.quest.id,
      title:entry.quest.title,
      objectives:(entry.objectives||[]).map(objective=>({
        label:objective.label||objective.type,
        current:objective.current,
        required:objective.required,
        complete:objective.complete===true
      }))
    };
  }

  const api={HOTBAR_SLOTS,hotbarEntries,activeQuestTracker};
  root.UiHud=api;
  if(typeof module!=='undefined') module.exports=api;
})(globalThis);
