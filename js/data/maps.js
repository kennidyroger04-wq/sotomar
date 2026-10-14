const mapDatabase = {
  "0,0": {
    name: "Vila de Entrada",
    terrainRows: [
      ".T......",
      "........",
      "..T.....",
      "........",
      "........",
      "........",
      "....T...",
      "........"
    ],
    exits: { right: "1,0" },
    respawnPoint: { x: 3, y: 1 },
    mobs: [ { type:'javali', x:5, y:3 }, { type:'javali', x:2, y:2 } ]
  },
  "1,0": {
    name: "Floresta dos Javalis",
    terrainRows: [
      ".T.T.T.T",
      "........",
      "T.T...T.",
      "........",
      "..T...T.",
      "........",
      "T.T.T...",
      "........"
    ],
    exits: { left: "0,0" },
    mobs: [ { type:'javali', x:5, y:2 }, { type:'javali', x:2, y:5 }, { type:'cogumelo', x:6, y:6 } ]
  }
};
if(typeof module!=='undefined') module.exports=mapDatabase;
