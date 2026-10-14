/* Contrato mínimo e serializável de intenção do cliente. Não é protocolo de rede. */
(function(root){
  const COMMAND_TYPES=Object.freeze({MOVE:'MOVE',CAST_ABILITY:'CAST_ABILITY',INTERACT:'INTERACT',END_TURN:'END_TURN'});
  const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
  const isPlainObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
  function isJsonSafe(value,seen=new Set()){
    if(value===null||typeof value==='string'||typeof value==='boolean')return true;
    if(typeof value==='number')return Number.isFinite(value);
    if(typeof value!=='object')return false;
    if(seen.has(value))return false;
    seen.add(value);
    const ok=Array.isArray(value)?value.every(item=>isJsonSafe(item,seen)):Object.keys(value).every(key=>isJsonSafe(value[key],seen));
    seen.delete(value);return ok;
  }
  function cloneJson(value){try{return JSON.parse(JSON.stringify(value));}catch(_){return null;}}
  function validatePayload(type,payload){
    if(!isPlainObject(payload)||!isJsonSafe(payload))return {ok:false,reason:'INVALID_PAYLOAD'};
    if(type===COMMAND_TYPES.MOVE&&(!Number.isInteger(payload.x)||!Number.isInteger(payload.y)))return {ok:false,reason:'INVALID_MOVE_PAYLOAD'};
    if(type===COMMAND_TYPES.CAST_ABILITY&&(!Number.isInteger(payload.target&&payload.target.x)||!Number.isInteger(payload.target&&payload.target.y)||typeof payload.abilityId!=='string'||!payload.abilityId))return {ok:false,reason:'INVALID_CAST_PAYLOAD'};
    if(type===COMMAND_TYPES.INTERACT&&typeof payload.targetId!=='string')return {ok:false,reason:'INVALID_INTERACT_PAYLOAD'};
    return {ok:true};
  }
  function validateCommand(command){
    if(!isPlainObject(command)||!isJsonSafe(command))return {ok:false,reason:'INVALID_COMMAND'};
    if(typeof command.id!=='string'||!command.id.trim())return {ok:false,reason:'INVALID_ID'};
    if(typeof command.type!=='string'||!Object.values(COMMAND_TYPES).includes(command.type))return {ok:false,reason:'UNKNOWN_TYPE'};
    if(typeof command.actorId!=='string'||!command.actorId.trim())return {ok:false,reason:'INVALID_ACTOR'};
    if(command.clientSequence!==undefined&&(!Number.isInteger(command.clientSequence)||command.clientSequence<0))return {ok:false,reason:'INVALID_SEQUENCE'};
    return validatePayload(command.type,command.payload||{});
  }
  function createCommand({id,type,actorId,payload={},clientSequence}={}){
    const command={id,type,actorId,payload};
    if(clientSequence!==undefined)command.clientSequence=clientSequence;
    const validation=validateCommand(command);return validation.ok?cloneJson(command):null;
  }
  const api={COMMAND_TYPES,createCommand,validateCommand,isJsonSafe,cloneJson};
  root.GameCommands=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
