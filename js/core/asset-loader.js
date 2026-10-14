/* Visual V4: small cached Image loader. It deliberately has no gameplay dependencies. */
(function(root){
  class VisualAssetLoader{
    constructor({manifest,imageFactory}={}){
      this.manifest=manifest||null;
      this.imageFactory=imageFactory||(()=>typeof Image==='undefined'?null:new Image());
      this.entries=new Map();
    }
    resolve(id){return this.manifest&&typeof this.manifest.get==='function'?this.manifest.get(id):null;}
    status(id){return this.entries.get(id)||{state:'idle',image:null,error:null};}
    load(id){
      const known=this.entries.get(id);if(known)return known.promise||Promise.resolve(known);
      const asset=this.resolve(id);if(!asset){const missing={state:'missing',image:null,error:'UNKNOWN_ASSET'};this.entries.set(id,missing);return Promise.resolve(missing);}
      const image=this.imageFactory();if(!image){const unavailable={state:'unavailable',image:null,error:'IMAGE_UNAVAILABLE'};this.entries.set(id,unavailable);return Promise.resolve(unavailable);}
      const entry={state:'loading',image:null,error:null};
      entry.promise=new Promise(resolve=>{
        image.onload=()=>{entry.state='ready';entry.image=image;resolve(entry);};
        image.onerror=()=>{entry.state='failed';entry.error='IMAGE_FAILED';resolve(entry);};
        image.src=asset.src;
      });
      this.entries.set(id,entry);return entry.promise;
    }
    preload(ids){return Promise.all((ids||[]).map(id=>this.load(id)));}
    draw(ctx,id,{x,y,projection,smoothing}={}){
      const asset=this.resolve(id),entry=this.status(id),image=entry.image;
      if(!asset||entry.state!=='ready'||!image||!image.naturalWidth||!image.naturalHeight)return false;
      const width=projection.tileWidth*asset.widthTiles*asset.scale,height=width*(image.naturalHeight/image.naturalWidth);
      const hasSmoothing=typeof smoothing==='boolean',previous=hasSmoothing?ctx.imageSmoothingEnabled:undefined;
      if(hasSmoothing)ctx.imageSmoothingEnabled=smoothing;
      ctx.drawImage(image,x-width*asset.anchor.x,y-height*asset.anchor.y,width,height);
      if(hasSmoothing)ctx.imageSmoothingEnabled=previous;
      return true;
    }
  }
  const api=Object.freeze({VisualAssetLoader,create:options=>new VisualAssetLoader(options)});
  root.AssetLoader=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
