/* Shared, dependency-free game constants. */
const GAME_STATES = Object.freeze({ MENU:'MENU', OVERWORLD:'OVERWORLD', COMBAT:'COMBAT' });
const OW_GRID_SIZE = 8;
const OW_CELL = 60;
const COMBAT_GRID_SIZE = 12;
const COMBAT_CELL = 40;
const TURN_DURATION_SEC = 30;
function inBoundsSized(x,y,size){ return x>=0 && x<size && y>=0 && y<size; }
function inBoundsOW(x,y){ return inBoundsSized(x,y,OW_GRID_SIZE); }
function inBoundsCombat(x,y){ return inBoundsSized(x,y,COMBAT_GRID_SIZE); }
