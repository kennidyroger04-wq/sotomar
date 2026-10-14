/* Stable, non-visual exploration points and their one-time quest-item rewards. */
(function(root){
  const POINTS=Object.freeze([
    Object.freeze({id:'POINT_TUFO_PALIDO',mapId:'MAP_02',x:2,y:2,itemId:'QITEM_TUFO_PALIDO',flag:'FLAG_INSPECTED_TUFO_PALIDO'}),
    Object.freeze({id:'POINT_MARCO_PRUMO_REGISTRO',mapId:'MAP_05',x:3,y:2,itemId:'QITEM_REGISTRO_DE_NIVEL',flag:'FLAG_INSPECTED_REGISTRO_DE_NIVEL'}),
    Object.freeze({id:'POINT_PONTE_PAGINA_BATIDAS',mapId:'MAP_06',x:3,y:2,itemId:'QITEM_PAGINA_DAS_BATIDAS',flag:'FLAG_INSPECTED_PAGINA_DAS_BATIDAS'}),
    Object.freeze({id:'POINT_ACAMPAMENTO_PAGINAS_AURELO',mapId:'MAP_08',x:2,y:2,itemId:'QITEM_PAGINAS_DE_AURELO',flag:'FLAG_INSPECTED_PAGINAS_DE_AURELO'})
  ]);
  class InspectionEngine{
    constructor({points=POINTS,runtime,worldState,itemSink=()=>{},questSystem}={}){
      this.points=points;this.runtime=runtime;this.worldState=worldState;this.itemSink=itemSink;this.questSystem=questSystem;
      if(runtime)points.forEach(point=>{const map=runtime.resolveMap(point.mapId);if(map&&Array.isArray(map.pointsOfInterest)&&!map.pointsOfInterest.some(entry=>entry.id===point.id))map.pointsOfInterest.push({...point,coordinateStatus:'PROVISIONAL_LOGICAL',status:'CANONICAL_INSPECTION'});});
    }
    pointAt(mapId,x,y){return this.points.find(point=>point.mapId===mapId&&point.x===x&&point.y===y)||null;}
    getPoint(pointId){return this.points.find(point=>point.id===pointId)||null;}
    validate(){
      const errors=[],ids=new Set();
      this.points.forEach(point=>{
        if(ids.has(point.id))errors.push(`duplicate:${point.id}`);ids.add(point.id);
        if(!this.runtime||!this.runtime.isWalkable(point.mapId,point))errors.push(`not-walkable:${point.id}`);
        const map=this.runtime&&this.runtime.resolveMap(point.mapId);
        if(map&&(Object.values(map.spawns||{}).some(p=>p.x===point.x&&p.y===point.y)||map.exits.some(p=>p.x===point.x&&p.y===point.y)))errors.push(`reserved-cell:${point.id}`);
      });
      return {ok:errors.length===0,errors};
    }
    inspect(pointId){
      const point=this.getPoint(pointId);if(!point)return {ok:false,reason:'UNKNOWN_POINT'};
      if(!this.runtime||!this.runtime.isWalkable(point.mapId,point))return {ok:false,reason:'UNAVAILABLE_POINT'};
      if(!this.worldState)return {ok:false,reason:'WORLD_STATE_UNAVAILABLE'};
      const duplicate=this.worldState.hasFlag(point.flag);
      if(!duplicate){this.itemSink({itemId:point.itemId,amount:1,pointId:point.id});this.worldState.setFlag(point.flag,true);}
      this.worldState.inspect(point.id,{eventId:`inspection:${point.id}`});
      if(this.questSystem)this.questSystem.recordEvent({type:'ITEM_ACQUIRED',itemId:point.itemId,amount:1,eventId:`inspection-item:${point.id}`});
      return {ok:true,duplicate,pointId,itemId:point.itemId};
    }
  }
  const api={POINTS,InspectionEngine,createInspectionSystem:options=>new InspectionEngine(options)};
  root.FimbriaInspections=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
