/* Central state shape. UI may observe it, while rules receive only the slice they need. */
globalThis.GameState = Object.freeze({
  create: () => ({ player:null, world:null, combat:null, progression:{quests:{},currency:{},flags:{}}, ui:{ screen:'MENU', activeModal:null, dialog:null } })
});
