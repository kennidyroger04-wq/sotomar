/* Small lazy, cached HTMLAudio SFX manager. Playback is presentation-only. */
(function(root){
  const clamp=value=>Math.max(0,Math.min(1,Number.isFinite(Number(value))?Number(value):0));
  class AudioManager{
    constructor({manifest,audioFactory=null,config={}}={}){
      this.manifest=manifest||null;this.audioFactory=audioFactory||(()=>typeof Audio==='undefined'?null:new Audio());this.cache=new Map();this.variationIndex=new Map();this.unlocked=false;
      this.settings={masterVolume:0.8,sfxVolume:0.55,muted:false,...config};this.settings.masterVolume=clamp(this.settings.masterVolume);this.settings.sfxVolume=clamp(this.settings.sfxVolume);this.settings.muted=!!this.settings.muted;
    }
    config(){return {...this.settings};}
    setConfig(values={}){if(Object.prototype.hasOwnProperty.call(values,'masterVolume'))this.settings.masterVolume=clamp(values.masterVolume);if(Object.prototype.hasOwnProperty.call(values,'sfxVolume'))this.settings.sfxVolume=clamp(values.sfxVolume);if(Object.prototype.hasOwnProperty.call(values,'muted'))this.settings.muted=!!values.muted;this.cache.forEach(entry=>{if(entry.audio)entry.audio.volume=this.settings.muted?0:clamp(this.settings.masterVolume*this.settings.sfxVolume);});return this.config();}
    status(id){const entry=this.cache.get(id);return entry?entry.state:'idle';}
    unlock(){this.unlocked=true;return true;}
    load(id){
      if(this.cache.has(id))return this.cache.get(id);
      const asset=this.manifest&&typeof this.manifest.get==='function'?this.manifest.get(id):null;
      if(!asset||typeof asset.src!=='string'){const missing={state:'missing',audio:null};this.cache.set(id,missing);return missing;}
      let audio;try{audio=this.audioFactory();}catch(_){audio=null;}
      if(!audio){const unavailable={state:'unavailable',audio:null};this.cache.set(id,unavailable);return unavailable;}
      const entry={state:'ready',audio};audio.preload='none';audio.src=asset.src;audio.oncanplaythrough=()=>{if(entry.state==='loading')entry.state='ready';};audio.onerror=()=>{entry.state='failed';};this.cache.set(id,entry);return entry;
    }
    play(id){
      if(this.settings.muted)return {ok:false,reason:'MUTED'};
      if(!this.unlocked)return {ok:false,reason:'GESTURE_REQUIRED'};
      const entry=this.load(id);if(!entry.audio)return {ok:false,reason:entry.state==='missing'?'UNKNOWN_ASSET':entry.state==='failed'?'AUDIO_FAILED':'AUDIO_UNAVAILABLE'};if(entry.state==='failed')return {ok:false,reason:'AUDIO_FAILED'};
      try{entry.audio.volume=clamp(this.settings.masterVolume*this.settings.sfxVolume);entry.audio.currentTime=0;const result=entry.audio.play();if(result&&typeof result.catch==='function')result.catch(()=>{entry.state='blocked';});return {ok:true};}catch(_){entry.state='blocked';return {ok:false,reason:'PLAY_BLOCKED'};}
    }
    playRandom(ids){const list=(ids||[]).filter(id=>this.manifest&&this.manifest.get(id));if(!list.length)return {ok:false,reason:'UNKNOWN_ASSET'};const key=list.join('|'),index=this.variationIndex.get(key)||0;this.variationIndex.set(key,(index+1)%list.length);return this.play(list[index]);}
  }
  const api=Object.freeze({AudioManager,create:options=>new AudioManager(options)});root.AudioManager=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
