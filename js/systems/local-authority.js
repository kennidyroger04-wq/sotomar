/* Boundary local-only: dispatches intentions to existing rules/engines, without networking. */
(function(root){
  const Commands=root.GameCommands||(typeof require==='function'?require('../core/commands.js'):null);
  const TYPES=Commands.COMMAND_TYPES;
  const clone=Commands.cloneJson;
  function safeEvents(events){return Array.isArray(events)?events.filter(event=>event&&typeof event==='object').map(event=>clone(event)).filter(Boolean):[];}
  class LocalGameAuthority{
    constructor({combatEngine=null,stateProvider=()=>null,abilityProvider=()=>null,handlers={},stateVersion=0}={}){
      this.combatEngine=combatEngine;this.stateProvider=stateProvider;this.abilityProvider=abilityProvider;this.handlers=handlers;this.stateVersion=Number.isInteger(stateVersion)&&stateVersion>=0?stateVersion:0;this.processed=new Map();
    }
    dispatch(command){
      const valid=Commands.validateCommand(command);
      if(!valid.ok)return this.result(command&&command.id||null,false,valid.reason,[]);
      if(this.processed.has(command.id))return clone(this.processed.get(command.id));
      let outcome;
      const handler=this.handlers[command.type];
      if(handler) outcome=handler(command,this);
      else if(command.type===TYPES.END_TURN)outcome=this.endTurn(command);
      else if(command.type===TYPES.CAST_ABILITY)outcome=this.castAbility(command);
      else outcome={accepted:false,reason:'UNHANDLED_COMMAND',events:[]};
      const accepted=!!(outcome&&outcome.accepted);
      if(accepted)this.stateVersion+=1;
      const result={commandId:command.id,accepted,reason:outcome&&outcome.reason||null,events:safeEvents(outcome&&outcome.events),stateVersion:this.stateVersion};
      this.processed.set(command.id,result);return clone(result);
    }
    result(commandId,accepted,reason,events){return {commandId,accepted,reason:reason||null,events:safeEvents(events),stateVersion:this.stateVersion};}
    endTurn(command){
      const state=this.stateProvider();
      if(!this.combatEngine||!state)return {accepted:false,reason:'AUTHORITY_UNAVAILABLE',events:[]};
      const outcome=this.combatEngine.endTurn(state,command.actorId);
      return {accepted:!!(outcome&&outcome.ok),reason:outcome&&outcome.reason,events:outcome&&outcome.events,stateChanged:!!(outcome&&outcome.ok)};
    }
    castAbility(command){
      const state=this.stateProvider(),ability=this.abilityProvider(command.payload.abilityId);
      if(!this.combatEngine||!state||!ability)return {accepted:false,reason:'ABILITY_UNAVAILABLE',events:[]};
      const outcome=this.combatEngine.cast(state,{actorId:command.actorId,ability,target:command.payload.target});
      return {accepted:!!(outcome&&outcome.ok),reason:outcome&&outcome.reason,events:outcome&&outcome.events,stateChanged:!!(outcome&&outcome.ok)};
    }
  }
  const api={LocalGameAuthority,createLocalAuthority:options=>new LocalGameAuthority(options),normalizeEvents:safeEvents};
  root.LocalAuthority=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
