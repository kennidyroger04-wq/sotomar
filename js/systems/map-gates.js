/* Data-driven gate evaluator. It does not create maps or perform movement. */
(function(root){
  class GateEngine{
    constructor({flagProvider,questStateProvider}={}){this.flagProvider=flagProvider||(()=>false);this.questStateProvider=questStateProvider||(()=>false);}
    isOpen(rule){if(!rule||!rule.from||!rule.to)return false;if(rule.requiresFlag&&!this.flagProvider(rule.requiresFlag))return false;if(rule.requiresQuest&&this.questStateProvider(rule.requiresQuest)!=='COMPLETED')return false;return rule.enabled!==false;}
    destinations(from,rules){return (rules||[]).filter(rule=>this.isOpen(rule)&&(rule.from===from||(rule.bidirectional&&rule.to===from))).map(rule=>rule.from===from?rule.to:rule.from);}
  }
  root.MapGates={GateEngine,createGateEngine:options=>new GateEngine(options)};if(typeof module!=='undefined')module.exports=root.MapGates;
})(globalThis);
