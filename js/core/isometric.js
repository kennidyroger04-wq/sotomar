/* Presentation-only isometric projection. Gameplay continues to use {x,y}. */
(function(root){
  const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  function config(options={}){
    const tileWidth=Math.max(2,finite(options.tileWidth,36));
    const tileHeight=Math.max(2,finite(options.tileHeight,18));
    return {tileWidth,tileHeight,originX:finite(options.originX),originY:finite(options.originY)};
  }
  function centeredConfig({canvasWidth=480,canvasHeight=480,columns=1,rows=1,tileWidth=36,tileHeight=18}={}){
    const width=Math.max(1,finite(canvasWidth,480)),height=Math.max(1,finite(canvasHeight,480));
    const cols=Math.max(1,Math.trunc(finite(columns,1))),rowCount=Math.max(1,Math.trunc(finite(rows,1)));
    const projection=config({tileWidth,tileHeight});
    const halfWidth=projection.tileWidth/2,halfHeight=projection.tileHeight/2;
    return {...projection,originX:width/2+(rowCount-cols)*halfWidth/2,originY:height/2-(cols+rowCount-2)*halfHeight/2};
  }
  function fitProjection({canvasWidth=480,canvasHeight=480,columns=1,rows=1,preferredTileWidth=36,preferredTileHeight=18,padding=0}={}){
    const width=Math.max(1,finite(canvasWidth,480)),height=Math.max(1,finite(canvasHeight,480));
    const cols=Math.max(1,Math.trunc(finite(columns,1))),rowCount=Math.max(1,Math.trunc(finite(rows,1)));
    const preferred=config({tileWidth:preferredTileWidth,tileHeight:preferredTileHeight});
    const availableWidth=Math.max(1,width-Math.max(0,finite(padding))*2),availableHeight=Math.max(1,height-Math.max(0,finite(padding))*2);
    const span=cols+rowCount,scale=Math.min(availableWidth/(span*preferred.tileWidth/2),availableHeight/(span*preferred.tileHeight/2));
    return {...centeredConfig({canvasWidth:width,canvasHeight:height,columns:cols,rows:rowCount,tileWidth:preferred.tileWidth*scale,tileHeight:preferred.tileHeight*scale}),scale,columns:cols,rows:rowCount};
  }
  function fitProjectionWithReferenceBounds({canvasWidth=480,canvasHeight=480,columns=1,rows=1,referenceColumns=columns,referenceRows=rows,preferredTileWidth=36,preferredTileHeight=18,padding=0}={}){
    const width=Math.max(1,finite(canvasWidth,480)),height=Math.max(1,finite(canvasHeight,480));
    const cols=Math.max(1,Math.trunc(finite(columns,1))),rowCount=Math.max(1,Math.trunc(finite(rows,1)));
    const fit=fitProjection({canvasWidth:width,canvasHeight:height,columns:referenceColumns,rows:referenceRows,preferredTileWidth,preferredTileHeight,padding});
    return {...centeredConfig({canvasWidth:width,canvasHeight:height,columns:cols,rows:rowCount,tileWidth:fit.tileWidth,tileHeight:fit.tileHeight}),scale:fit.scale,columns:cols,rows:rowCount,referenceColumns:fit.columns,referenceRows:fit.rows};
  }
  function gridToScreen({x,y,projection}={}){
    const p=config(projection),gridX=finite(x),gridY=finite(y);
    return {x:p.originX+(gridX-gridY)*p.tileWidth/2,y:p.originY+(gridX+gridY)*p.tileHeight/2};
  }
  function pointInDiamond({screenX,screenY,x,y,projection}={}){
    const p=config(projection),center=gridToScreen({x,y,projection:p});
    const horizontal=Math.abs(finite(screenX)-center.x)/(p.tileWidth/2);
    const vertical=Math.abs(finite(screenY)-center.y)/(p.tileHeight/2);
    return horizontal+vertical<=1+1e-9;
  }
  function screenToGrid({screenX,screenY,projection,bounds}={}){
    const p=config(projection),dx=(finite(screenX)-p.originX)/(p.tileWidth/2),dy=(finite(screenY)-p.originY)/(p.tileHeight/2);
    const x=Math.round((dx+dy)/2),y=Math.round((dy-dx)/2);
    const columns=bounds&&Math.max(0,Math.trunc(finite(bounds.columns,0))),rows=bounds&&Math.max(0,Math.trunc(finite(bounds.rows,0)));
    if(bounds&&(x<0||y<0||x>=columns||y>=rows))return {ok:false,reason:'OUTSIDE_BOARD'};
    if(!pointInDiamond({screenX,screenY,x,y,projection:p}))return {ok:false,reason:'OUTSIDE_DIAMOND'};
    return {ok:true,x,y};
  }
  function depthCompare(a,b){
    const aDepth=finite(a&&a.x)+finite(a&&a.y),bDepth=finite(b&&b.x)+finite(b&&b.y);
    if(aDepth!==bDepth)return aDepth-bDepth;
    const aY=finite(a&&a.y),bY=finite(b&&b.y);if(aY!==bY)return aY-bY;
    const aX=finite(a&&a.x),bX=finite(b&&b.x);if(aX!==bX)return aX-bX;
    return String(a&&a.id||'').localeCompare(String(b&&b.id||''));
  }
  function overworldDepthCompare(a,b){
    if(finite(a&&a.x)===finite(b&&b.x)&&finite(a&&a.y)===finite(b&&b.y)){
      const layer={obstacle:0,'visual-prop':1,mob:2,npc:2,player:2};
      const layerOrder=(layer[a&&a.kind]??3)-(layer[b&&b.kind]??3);
      if(layerOrder)return layerOrder;
    }
    return depthCompare(a,b);
  }
  const api={config,centeredConfig,fitProjection,fitProjectionWithReferenceBounds,gridToScreen,screenToGrid,pointInDiamond,depthCompare,overworldDepthCompare};
  root.Isometric=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
