/* Keeps logical canvas coordinates stable while matching the visible backing resolution. */
(function(root){
  function configure({canvas,context,logicalWidth=480,logicalHeight=480,devicePixelRatio=1,maxDimension=2560}={}){
    const cssWidth=Number(canvas&&canvas.clientWidth),cssHeight=Number(canvas&&canvas.clientHeight);
    const logicalW=Math.max(1,Math.trunc(Number(logicalWidth)||480));
    const logicalH=Math.max(1,Math.trunc(Number(logicalHeight)||480));
    if(!canvas||!context||!Number.isFinite(cssWidth)||!Number.isFinite(cssHeight)||cssWidth<=0||cssHeight<=0)
      return {ok:false,reason:'CANVAS_HIDDEN'};
    if(typeof context.setTransform!=='function')return {ok:false,reason:'TRANSFORM_UNAVAILABLE'};

    const dpr=Math.max(.5,Math.min(3,Number(devicePixelRatio)||1));
    const cap=Math.max(1,Number(maxDimension)||2560);
    const ratio=Math.min(dpr,cap/Math.max(cssWidth,cssHeight));
    const width=Math.max(1,Math.round(cssWidth*ratio));
    const height=Math.max(1,Math.round(cssHeight*ratio));
    const resized=canvas.width!==width||canvas.height!==height;
    if(resized){canvas.width=width;canvas.height=height;}
    const scaleX=width/logicalW,scaleY=height/logicalH;
    context.setTransform(scaleX,0,0,scaleY,0,0);
    context.imageSmoothingEnabled=true;
    if('imageSmoothingQuality' in context)context.imageSmoothingQuality='high';
    return {ok:true,resized,width,height,scaleX,scaleY,pixelRatio:ratio};
  }
  const api={configure};
  root.CanvasResolution=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
