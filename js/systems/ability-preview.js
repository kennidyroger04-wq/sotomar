/* Target preview adapter: asks CombatEffectEngine for every logical cell. */
(function(root){
  function inBounds(state,x,y){const board=state&&state.board;return Array.isArray(board)&&y>=0&&y<board.length&&Array.isArray(board[y])&&x>=0&&x<board[y].length;}
  function getTargetableCells({state,actor,ability,engine}={}){
    const board=state&&state.board;
    if(!Array.isArray(board)||!actor||!ability||!engine||typeof engine.validate!=='function')return [];
    if(ability.targeting&&ability.targeting.targetType==='SELF'){
      const validation=engine.validate(state,actor,ability,{x:actor.x,y:actor.y});
      return validation&&validation.ok?[{x:actor.x,y:actor.y}]:[];
    }
    const cells=[];
    for(let y=0;y<board.length;y++)for(let x=0;x<board[y].length;x++){
      const validation=engine.validate(state,actor,ability,{x,y});
      if(validation&&validation.ok)cells.push({x,y});
    }
    return cells;
  }
  function getValidation({state,actor,ability,engine,cell}={}){
    if(!cell||!engine||typeof engine.validate!=='function')return {ok:false,reason:'TARGET'};
    return engine.validate(state,actor,ability,{x:cell.x,y:cell.y});
  }
  function getAffectedCells({state,actor,ability,engine,cell}={}){
    const validation=getValidation({state,actor,ability,engine,cell});
    if(!validation.ok||!ability||!engine||typeof engine.areaCells!=='function')return [];
    const shape=ability.targeting&&ability.targeting.shape;
    if(!shape||shape==='SINGLE')return [];
    return engine.areaCells(shape,{x:cell.x,y:cell.y}).filter(target=>inBounds(state,target.x,target.y));
  }
  function preview(options={}){
    const targetableCells=getTargetableCells(options),hover=options.hoverCell;
    const validation=hover?getValidation({...options,cell:hover}):null;
    return {targetableCells,affectedCells:validation&&validation.ok?getAffectedCells({...options,cell:hover}):[],validation};
  }
  const api={getTargetableCells,getValidation,getAffectedCells,preview};
  root.AbilityPreview=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
