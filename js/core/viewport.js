/* Helpers puros para viewport/canvas: escala visual nunca altera a grade lógica. */
(function(root){
  function finite(value,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback;}
  function screenToCanvas({clientX,clientY,rect,logicalWidth,logicalHeight}={}){
    const left=finite(rect&&rect.left),top=finite(rect&&rect.top),width=finite(rect&&rect.width),height=finite(rect&&rect.height);
    const logicalW=Math.max(1,finite(logicalWidth,1)),logicalH=Math.max(1,finite(logicalHeight,1));
    if(width<=0||height<=0)return {ok:false,reason:'CANVAS_SIZE'};
    if(!Number.isFinite(Number(clientX))||!Number.isFinite(Number(clientY)))return {ok:false,reason:'POINTER'};
    const localX=finite(clientX)-left,localY=finite(clientY)-top;
    if(localX<0||localY<0||localX>=width||localY>=height)return {ok:false,reason:'OUTSIDE'};
    const logicalX=localX*logicalW/width,logicalY=localY*logicalH/height;
    return {ok:true,localX,localY,logicalX,logicalY};
  }
  function screenToGrid({clientX,clientY,rect,logicalWidth,logicalHeight,gridSize}={}){
    const canvas=screenToCanvas({clientX,clientY,rect,logicalWidth,logicalHeight});
    if(!canvas.ok)return canvas;
    const logicalW=Math.max(1,finite(logicalWidth,1)),logicalH=Math.max(1,finite(logicalHeight,1)),size=Math.max(1,Math.trunc(finite(gridSize,1)));
    const {logicalX,logicalY}=canvas;
    const x=Math.floor(logicalX/(logicalW/size)),y=Math.floor(logicalY/(logicalH/size));
    if(x<0||y<0||x>=size||y>=size)return {ok:false,reason:'OUTSIDE'};
    return {...canvas,x,y};
  }
  const api={screenToCanvas,screenToGrid};root.Viewport=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
