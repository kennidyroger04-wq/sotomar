const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'godot/resources/combat/g10_parity_fixtures.json'), 'utf8'));
const Rules = require(path.join(root, 'js/core/rules.js'));
const Geometry = require(path.join(root, 'js/core/geometry.js'));
const Abilities = require(path.join(root, 'js/data/abilities.js'));
const Effects = require(path.join(root, 'js/systems/combat-effects.js'));
const AI = require(path.join(root, 'js/systems/combat-ai.js'));

function rng({random = 0.99, int = 40} = {}) {
  return {random: () => random, int: () => int};
}
function stateWith(player, mob) {
  return {board: Array.from({length: 6}, () => Array(8).fill('empty')), combatants: [player, mob], eventSequence: 0};
}

const ordered = Rules.initiative(
  fixture.initiative.combatants.map(unit => ({id: unit.id, side: unit.side, mobType: unit.id === 'cascudo' ? fixture.creature_id : undefined})),
  fixture.initiative.combatants[0].agility,
  {[fixture.creature_id]: {agilidade: fixture.initiative.combatants[1].agility}},
  {random: () => 0}
);
assert.deepEqual(ordered, fixture.initiative.order, 'initiative fixture');

const movement = fixture.movement;
const geometryState = {board: Array.from({length: 8}, () => Array(8).fill('empty'))};
movement.blocked.forEach(([x, y]) => { geometryState.board[y][x] = 'obstacle'; });
const bfs = Geometry.bfs(movement.start[0], movement.start[1], (x, y) => geometryState.board[y][x] === 'obstacle', 8);
const pathTo = Geometry.reconstructPath(bfs.parent, ...movement.start, ...movement.goal);
assert.equal(pathTo.length, fixture.movement.path_length, 'movement path length and neighbor order');
const mover = {id: 'player', side: 'player', x: movement.start[0], y: movement.start[1], hp: 100, pm: movement.pm};
const moved = AI.applyPath(geometryState, mover, pathTo, Rules);
assert.equal(moved.ok, true);
assert.equal(mover.pm, fixture.movement.remaining_pm);
assert.deepEqual([mover.x, mover.y], movement.goal);

const damageFixture = fixture.damage;
const plainDamage = Rules.resolveCombatDamage({base: damageFixture.base_roll, damageType: Effects.DAMAGE_TYPES.PHYSICAL,
  attackerStats: {forca: damageFixture.strength, agilidade: 10}, targetResistance: 0, rng: rng({random: damageFixture.crit_roll})});
assert.equal(plainDamage.dmg, damageFixture.noncritical);
const criticalDamage = Rules.resolveCombatDamage({base: damageFixture.base_roll, damageType: Effects.DAMAGE_TYPES.PHYSICAL,
  attackerStats: {forca: damageFixture.strength, agilidade: 10}, targetResistance: 0, rng: rng({random: damageFixture.critical_roll})});
assert.equal(criticalDamage.dmg, damageFixture.critical);

const player = {id: 'player', side: 'player', x: 1, y: 1, hp: 100, maxHp: 100, pa: 6, maxPa: 6, pm: 4, maxPm: 4,
  cooldowns: {}, effects: [], resistances: {PHYSICAL: 0, MAGICAL: 0}, combatStats: {forca: 10, agilidade: 10}};
const mob = {id: 'cascudo', side: 'mob', x: 2, y: 1, hp: 70, maxHp: 70, pa: 6, maxPa: 6, pm: 3, maxPm: 3,
  cooldowns: {}, effects: [], resistances: {PHYSICAL: 0, MAGICAL: 0}, combatStats: {agilidade: 5}};
let game = stateWith(player, mob);
let engine = Effects.createCombatEngine({rules: Rules, rng: rng()});
let result = engine.cast(game, {actorId: player.id, ability: Abilities.golpe, target: {x: mob.x, y: mob.y}});
assert.equal(result.ok, true, 'Golpe Pesado cast');
assert.equal(mob.hp, damageFixture.target_hp_after);
assert.equal(player.pa, 2);
assert.equal(player.cooldowns.golpe, 2);

player.pa = 6;
const fortifier = {...player, x: 1, y: 1, cooldowns: {}, effects: [], resistances: {PHYSICAL: 0, MAGICAL: 0}};
const fortifyState = stateWith(fortifier, {...mob, x: 2, y: 1, hp: 70, pa: 6, cooldowns: {}, effects: []});
engine = Effects.createCombatEngine({rules: Rules, rng: rng()});
result = engine.cast(fortifyState, {actorId: fortifier.id, ability: Abilities.fortificar, target: {x: 1, y: 1}});
assert.equal(result.ok, true, 'Fortificar cast');
assert.equal(engine.resistance(fortifier, 'PHYSICAL'), fixture.defense.physical_resistance);
assert.equal(engine.resistance(fortifier, 'MAGICAL'), fixture.defense.magical_resistance);
const guarded = engine.cast(fortifyState, {actorId: 'cascudo', ability: Abilities.golpe, target: {x: 1, y: 1}});
assert.equal(guarded.ok, true, 'enemy attack while fortified');
assert.equal(fortifier.hp, 100 - fixture.defense.physical_damage_received);

const playerAI = {...player, x: 2, y: 2, pa: 6, pm: 4, hp: 100};
const melee = {...mob, x: 4, y: 3, pa: 6, pm: 3, hp: 70};
const aiState = stateWith(playerAI, melee);
aiState.board[2][3] = 'obstacle';
aiState.board[2][4] = 'obstacle';
aiState.board[4][4] = 'obstacle';
const plan = AI.planMeleeTurn(aiState, melee, Abilities.golpe);
assert.equal(plan.ok, true);
assert.deepEqual([plan.cell.x, plan.cell.y], [2, 3]);
assert.equal(plan.path.length, 2);

const lethalTarget = {...mob, hp: 30, maxHp: 30, x: 2, y: 1, cooldowns: {}, effects: []};
const killer = {...player, pa: 6, x: 1, y: 1, cooldowns: {}, effects: []};
const lethalState = stateWith(killer, lethalTarget);
engine = Effects.createCombatEngine({rules: Rules, rng: rng({int: 45})});
result = engine.cast(lethalState, {actorId: killer.id, ability: Abilities.golpe, target: {x: 2, y: 1}});
assert(lethalTarget.hp === fixture.outcomes.defeated_hp);
assert(result.events.some(event => event.type === fixture.outcomes.victory));
assert.equal(engine.validate(lethalState, lethalTarget, Abilities.golpe, {x: 1, y: 1}).reason, 'DEAD');

console.log('G10 JavaScript parity fixtures: 22 assertions passed');
