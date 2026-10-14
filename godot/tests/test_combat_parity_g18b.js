const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'godot/resources/combat/g18b_parity_fixtures.json'), 'utf8'));
const Rules = require(path.join(root, 'js/core/rules.js'));
const Abilities = require(path.join(root, 'js/data/abilities.js'));
const Effects = require(path.join(root, 'js/systems/combat-effects.js'));
const AI = require(path.join(root, 'js/systems/combat-ai.js'));
const EncounterCatalog = require(path.join(root, 'godot/resources/combat/encounter_registry.json'));

function unit(data) {
  return {
    ...data,
    maxHp: data.maxHp,
    maxPa: data.maxPa,
    maxPm: data.maxPm,
    cooldowns: { ...data.cooldowns },
    effects: structuredClone(data.effects),
    resistances: { ...data.resistances },
    combatStats: { ...data.combatStats },
  };
}
function state(units, { width = 8, height = 6, blocked = [] } = {}) {
  const board = Array.from({ length: height }, () => Array(width).fill('empty'));
  for (const [x, y] of blocked) board[y][x] = 'obstacle';
  return { board, combatants: units.map(unit), eventSequence: 0 };
}
function deterministicRng(rolls = []) {
  let next = 0;
  let current = null;
  return {
    int: (min, max) => {
      current = rolls[next] || { base: 0, crit: 0.99 };
      return min + Math.floor(current.base * (max - min + 1));
    },
    random: () => {
      const item = current || rolls[next] || { base: 0, crit: 0.99 };
      current = null;
      next += 1;
      return item.crit;
    },
  };
}

// G18B fixture parity is an additive check; it exercises the canonical JS rules unchanged.
{
  const f = fixture.avanco;
  const game = state([f.actor, f.target]);
  const engine = Effects.createCombatEngine({ rules: Rules, rng: deterministicRng([f.roll]) });
  const cast = engine.cast(game, { actorId: 'player', ability: Abilities.avanco, target: { x: f.target_cell[0], y: f.target_cell[1] } });
  assert.equal(cast.ok, true);
  assert.equal(game.combatants[0].pa, f.expected.ap_cost);
  assert.deepEqual([game.combatants[0].x, game.combatants[0].y], f.expected.player_cell);
  assert.equal(game.combatants[1].hp, f.expected.target_hp);
  const blocked = state([f.actor, f.target], { blocked: [f.blocked_path_cell] });
  assert.equal(engine.validate(blocked, blocked.combatants[0], Abilities.avanco, { x: 4, y: 2 }).reason, f.expected.blocked_reason);
  const poor = state([{ ...f.actor, pa: 2 }, f.target]);
  assert.equal(engine.validate(poor, poor.combatants[0], Abilities.avanco, { x: 4, y: 2 }).reason, f.expected.low_ap_reason);
}

{
  const f = fixture.cruz;
  const game = state(f.actors);
  const engine = Effects.createCombatEngine({ rules: Rules, rng: deterministicRng([f.roll, f.roll]) });
  const cast = engine.cast(game, { actorId: 'player', ability: Abilities.cruz, target: { x: f.target_cell[0], y: f.target_cell[1] } });
  assert.equal(cast.ok, true);
  assert.equal(game.combatants[0].pa, 2);
  for (const id of ['center', 'arm']) {
    const target = game.combatants.find((entry) => entry.id === id);
    assert.equal(target.hp, f.expected.hostile_hp);
    assert.equal(target.effects[0].statusId, f.expected.status);
    assert.equal(target.effects[0].duration, f.expected.duration);
    assert.equal(engine.resistance(target, 'PHYSICAL'), f.expected.resistance_modifier);
    assert.equal(target.effects.length, f.expected.hostile_status_count);
  }
  assert.equal(game.combatants.find((entry) => entry.id === 'ally').hp, f.expected.ally_hp);
  assert.equal(game.combatants.find((entry) => entry.id === 'ally').effects.length, 0);
}

{
  const f = fixture.lanca;
  const game = state(f.actors);
  const engine = Effects.createCombatEngine({ rules: Rules, rng: deterministicRng([f.roll]) });
  const cast = engine.cast(game, { actorId: 'player', ability: Abilities.lanca, target: { x: 4, y: 2 } });
  const target = game.combatants[1];
  assert.equal(cast.ok, true);
  assert.equal(game.combatants[0].pa, f.expected.ap_cost);
  assert.equal(target.hp, f.expected.after_cast_hp);
  assert.equal(target.effects[0].statusId, f.expected.status);
  assert.equal(target.effects[0].duration, f.expected.duration);
  assert.equal(engine.startTurn(game, 'mob').events.some((event) => event.type === Effects.EVENT_TYPES.DAMAGE_APPLIED), true);
  assert.equal(target.hp, f.expected.after_first_tick_hp);
  engine.endTurn(game, 'mob');
  engine.startTurn(game, 'mob');
  assert.equal(target.hp, f.expected.after_second_tick_hp);
  const end = engine.endTurn(game, 'mob');
  assert.equal(target.effects.length, 0);
  assert.equal(end.events.some((event) => event.type === Effects.EVENT_TYPES.STATUS_EXPIRED), f.expected.expired_after_second_end);
}

{
  const f = fixture.fortificar;
  const game = state([f.actor]);
  const engine = Effects.createCombatEngine({ rules: Rules, rng: deterministicRng() });
  const first = engine.cast(game, { actorId: 'player', ability: Abilities.fortificar, target: { x: 1, y: 2 } });
  const player = game.combatants[0];
  assert.equal(first.ok, true);
  assert.equal(player.pa, 4);
  assert.equal(engine.resistance(player, 'PHYSICAL'), f.expected.physical_resistance);
  assert.equal(engine.resistance(player, 'MAGICAL'), f.expected.magical_resistance);
  assert.equal(player.effects[0].duration, f.expected.duration);
  assert.equal(player.cooldowns.fortificar, f.expected.cooldown);
  engine.endTurn(game, 'player');
  assert.equal(player.effects[0].duration, 1);
  engine.startTurn(game, 'player');
  const expired = engine.endTurn(game, 'player');
  assert.equal(player.effects.length, 0);
  assert.equal(expired.events.some((event) => event.type === Effects.EVENT_TYPES.STATUS_EXPIRED), f.expected.expired_after_second_end);
  engine.startTurn(game, 'player');
  engine.startTurn(game, 'player');
  const recast = engine.cast(game, { actorId: 'player', ability: Abilities.fortificar, target: { x: 1, y: 2 } });
  assert.equal(recast.ok, true);
  assert.equal(player.effects.length, f.expected.refresh_count);
}

{
  const f = fixture.ai_lanca;
  const game = state(f.actors, { blocked: f.blocked });
  const plan = AI.planRangedTurn(game, game.combatants[1], [Abilities.lanca]);
  assert.equal(plan.ok, true);
  assert.equal(plan.ability.id, f.expected.ability_id);
  assert.equal(plan.targetId, f.expected.target_id);
  assert.deepEqual([plan.cell.x, plan.cell.y], f.expected.cell);
  assert.deepEqual(plan.path.map(({ x, y }) => [x, y]), f.expected.path);
  assert.equal(AI.applyPath(game, game.combatants[1], plan.path, Rules).ok, true);
  assert.equal(game.combatants[1].pm, f.expected.remaining_pm);
  const engine = Effects.createCombatEngine({ rules: Rules, rng: deterministicRng([{ base: 0, crit: 0.99 }]) });
  assert.equal(engine.cast(game, { actorId: 'fiandeira', ability: plan.ability, target: plan.target }).ok, true);
}

{
  for (const id of fixture.multiple_encounters.ids) {
    const entry = EncounterCatalog.encounters[id];
    assert.ok(entry, `${id} remains present in the catalog`);
    assert.ok(entry.composition.length > 0, `${id} retains its canonical composition`);
    assert.ok(entry.composition.every((member) => Abilities[member.ability.id]), `${id} profile abilities map to canonical ability definitions`);
  }
  assert.deepEqual(EncounterCatalog.audit.provisional_playable_encounters, fixture.multiple_encounters.expected.world_trigger_ids);
  assert.deepEqual(EncounterCatalog.audit.pending_encounters, fixture.multiple_encounters.ids.filter((id) => !fixture.multiple_encounters.expected.world_trigger_ids.includes(id)));
}

console.log('G18B JavaScript parity fixtures: Avanço, Cruz, Lança, Fortificar, IA/LoS and ENC_01–ENC_12 passed');
