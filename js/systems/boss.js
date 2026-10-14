/* Small DOM-free boss contract. It models state/telegraphs/resolution, not a fight. */
(function(root){
  const PHASES=Object.freeze(['GUARDIA','ALVOROCO','ALIVIO']);
  const STATES=Object.freeze({ACTIVE:'ACTIVE',CRITICAL:'CRITICAL',RESOLVED:'RESOLVED'});
  const int=(value,fallback=0)=>Number.isFinite(Number(value))?Math.trunc(Number(value)):fallback;
  class BossEngine{
    constructor({bossId,name,phases=PHASES,initialPhase,nonLethal=true,exposure={min:0,max:100,initial:0},transitions=[],onEvent}={}){
      if(typeof bossId!=='string'||!bossId)return null;
      const validPhases=Array.isArray(phases)&&phases.length>0&&new Set(phases).size===phases.length;
      if(!validPhases||!phases.includes(initialPhase||phases[0]))return null;
      const min=int(exposure.min,0),max=Math.max(min,int(exposure.max,100));
      this.boss={bossId,name:name||bossId,phases:[...phases],phase:initialPhase||phases[0],nonLethal:nonLethal!==false,state:STATES.ACTIVE,hp:100,maxHp:100,exposure:{min,max,value:Math.max(min,Math.min(max,int(exposure.initial,min)))},telegraphs:[],transitions:[...transitions],resolution:null,eventSequence:0};
      this.onEvent=onEvent||(()=>{});
    }
    snapshot(){return JSON.parse(JSON.stringify(this.boss));}
    transition(nextPhase,condition={}){const b=this.boss;if(b.state===STATES.RESOLVED||!b.phases.includes(nextPhase)||nextPhase===b.phase)return {ok:false,reason:'INVALID_PHASE'};const allowed=b.transitions.length===0||b.transitions.some(t=>t.from===b.phase&&t.to===nextPhase&&(!t.when||Object.entries(t.when).every(([key,value])=>condition[key]===value)));if(!allowed)return {ok:false,reason:'TRANSITION_NOT_DECLARED'};const previous=b.phase;b.phase=nextPhase;const event={type:'BOSS_PHASE_CHANGED',bossId:b.bossId,from:previous,to:nextPhase};this.onEvent(event);return {ok:true,event};}
    createTelegraph({abilityId,sourceId=this.boss.bossId,target=null,area=null,resolveTurn=null}={}){if(this.boss.state===STATES.RESOLVED||typeof abilityId!=='string'||!abilityId)return {ok:false,reason:'INVALID_TELEGRAPH'};const telegraph={id:`telegraph:${this.boss.bossId}:${++this.boss.eventSequence}`,abilityId,sourceId,target,area,resolveTurn,status:'PENDING'};this.boss.telegraphs.push(telegraph);return {ok:true,telegraph:{...telegraph}};}
    getTelegraph(id){return this.boss.telegraphs.find(t=>t.id===id)||null;}
    resolveTelegraph(id){const t=this.getTelegraph(id);if(!t)return {ok:false,reason:'UNKNOWN_TELEGRAPH'};if(t.status!=='PENDING')return {ok:false,reason:'TELEGRAPH_NOT_PENDING'};t.status='RESOLVED';return {ok:true,telegraph:{...t}};}
    cancelTelegraph(id){const t=this.getTelegraph(id);if(!t)return {ok:false,reason:'UNKNOWN_TELEGRAPH'};if(t.status!=='PENDING')return {ok:false,reason:'TELEGRAPH_NOT_PENDING'};t.status='CANCELLED';return {ok:true,telegraph:{...t}};}
    changeExposure(delta){if(this.boss.state===STATES.RESOLVED)return {ok:false,reason:'RESOLVED',value:this.boss.exposure.value};const previous=this.boss.exposure.value;const next=Math.max(this.boss.exposure.min,Math.min(this.boss.exposure.max,previous+int(delta,0)));this.boss.exposure.value=next;return {ok:true,value:next,delta:next-previous};}
    setExposure(value){if(this.boss.state===STATES.RESOLVED)return {ok:false,reason:'RESOLVED',value:this.boss.exposure.value};const next=Math.max(this.boss.exposure.min,Math.min(this.boss.exposure.max,int(value,this.boss.exposure.value)));const previous=this.boss.exposure.value;this.boss.exposure.value=next;return {ok:true,value:next,delta:next-previous};}
    applyDamage(amount){const damage=Math.max(0,int(amount,0));if(this.boss.state===STATES.RESOLVED)return {ok:false,reason:'RESOLVED',hp:this.boss.hp};if(!this.boss.nonLethal){this.boss.hp=Math.max(0,this.boss.hp-damage);return {ok:true,hp:this.boss.hp,death:this.boss.hp===0};}this.boss.hp=Math.max(1,this.boss.hp-damage);if(this.boss.hp<=1)this.boss.state=STATES.CRITICAL;return {ok:true,hp:this.boss.hp,death:false,nonLethal:true};}
    resolve({resolution='NON_LETHAL',context={}}={}){if(this.boss.state===STATES.RESOLVED)return {ok:false,reason:'ALREADY_RESOLVED',event:this.boss.resolution};if(resolution!=='NON_LETHAL')return {ok:false,reason:'INVALID_RESOLUTION'};this.boss.telegraphs.filter(telegraph=>telegraph.status==='PENDING').forEach(telegraph=>{telegraph.status='CANCELLED';});this.boss.state=STATES.RESOLVED;this.boss.resolution={resolution,nonLethal:true,context};const event={type:'BOSS_RESOLVED',bossId:this.boss.bossId,resolution,nonLethal:true,context};this.onEvent(event);return {ok:true,event};}
  }
  const createBoss=options=>{const opts=options||{};const phases=Array.isArray(opts.phases)&&opts.phases.length>0&&new Set(opts.phases).size===opts.phases.length;const initial=opts.initialPhase||opts.phases&&opts.phases[0]||PHASES[0];if(typeof opts.bossId!=='string'||!opts.bossId||!phases||!opts.phases.includes(initial))return null;return new BossEngine(opts);};
  const api={PHASES,STATES,BossEngine,createBoss};root.BossSystem=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
