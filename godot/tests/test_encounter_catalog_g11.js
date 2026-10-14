#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const canonical = require(path.join(root, 'js/data/fimbria-canonical.js'));
global.FIMBRIA_CANONICAL = canonical;
const abilities = require(path.join(root, 'js/data/abilities.js'));
global.ABILITIES = abilities;
const runtime = require(path.join(root, 'js/data/fimbria-runtime.js'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'godot/resources/combat/encounter_registry.json'), 'utf8'));

assert.equal(Object.keys(catalog.encounters).length, Object.keys(canonical.encounters).length, 'catalog count');
for (const source of Object.values(canonical.encounters)) {
  const generated = catalog.encounters[source.id];
  assert.ok(generated, `${source.id} is present`);
  assert.equal(generated.map_id, source.mapId, `${source.id} map`);
  assert.equal(generated.canonical_status, source.status, `${source.id} source status`);
  assert.deepEqual(generated.composition.map(row => [row.creature_id, row.exposure]), source.composition.map(row => [row.creatureId, row.exposure]), `${source.id} composition`);
  for (let index = 0; index < source.composition.length; index += 1) {
    const sourceMember = source.composition[index];
    const actual = generated.composition[index];
    const creature = runtime.resolveCreature(sourceMember.creatureId).template;
    assert.equal(actual.stats.hp, creature.hp, `${source.id} unit ${index + 1} HP`);
    assert.equal(actual.stats.agility, creature.agilidade, `${source.id} unit ${index + 1} initiative stat`);
    assert.equal(actual.ability.id, creature.attackAbility.id, `${source.id} unit ${index + 1} ability`);
  }
  assert.equal(generated.activation_condition, 'UNSPECIFIED_IN_CANON', `${source.id} activation gap recorded`);
  assert.equal(generated.repetition_policy, 'UNSPECIFIED_IN_CANON', `${source.id} repeat gap recorded`);
  assert.ok(generated.pending_reasons.every(reason => typeof reason === 'string' && reason.length > 0), `${source.id} pending reasons are flat labels`);
}
assert.deepEqual(catalog.audit.provisional_playable_encounters, ['ENC_01', 'ENC_05']);
assert.equal(catalog.audit.canonical_rewards_defined, false);
console.log(`G11 catalog parity: ${Object.keys(catalog.encounters).length} encounters matched the JavaScript source.`);
