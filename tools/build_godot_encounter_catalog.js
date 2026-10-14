#!/usr/bin/env node
/* Build the Godot encounter catalog from the original Chapter 1 JS registry. */
const fs = require('node:fs');
const path = require('node:path');
const canonical = require('../js/data/fimbria-canonical.js');
global.FIMBRIA_CANONICAL = canonical;
const abilities = require('../js/data/abilities.js');
global.ABILITIES = abilities;
const runtime = require('../js/data/fimbria-runtime.js');
const mapRegistry = require('../godot/resources/maps/map_registry.json');

const outputPath = path.resolve(__dirname, '../godot/resources/combat/encounter_registry.json');
const checkOnly = process.argv.includes('--check');
const availableMaps = new Set(Object.keys(mapRegistry.maps));
const canonicalRows = Object.values(canonical.encounters);
const placementByMap = {};
for (const mapId of availableMaps) {
  const map = mapRegistry.maps[mapId];
  placementByMap[mapId] = (map.reserved_cells || [])
    .filter(cell => String(cell.id).startsWith('ENCOUNTER_PLACEMENT_'))
    .map(cell => ({ id: cell.id, x: cell.x, y: cell.y, sourceStatus: 'PROVISIONAL_RESERVED_CELL' }));
}

const encounters = {};
for (const source of canonicalRows) {
  const mapCandidates = canonicalRows.filter(row => row.mapId === source.mapId);
  const placementIndex = mapCandidates.findIndex(row => row.id === source.id);
  const reserved = placementByMap[source.mapId] || [];
  const assigned = availableMaps.has(source.mapId) && placementIndex === 0 && reserved.length > 0 ? reserved[0] : null;
  const composition = source.composition.map((member, index) => {
    const resolved = runtime.resolveCreature(member.creatureId);
    const template = resolved?.template || null;
    const ability = template?.attackAbility || null;
    return {
      unit_id: `${source.id}_${index + 1}`,
      creature_id: member.creatureId,
      canonical_base_id: resolved?.baseId || member.creatureId,
      name: template?.name || canonical.creatures[member.creatureId]?.name || member.creatureId,
      exposure: member.exposure,
      stats: template ? {
        hp: template.hp, pa: template.pa, pm: template.pm, agility: template.agilidade,
        strength: Number(template.strength || 0), physical_resistance: Number(template.resistances?.PHYSICAL || 0),
        magical_resistance: Number(template.resistances?.MAGICAL || 0), provisional_balance: template.provisionalBalance === true
      } : null,
      ability: ability ? {
        id: ability.id, name: ability.name, ap_cost: ability.apCost, cooldown: ability.cooldown,
        range_min: ability.range?.min, range_max: ability.range?.max,
        damage: ability.effects?.find(effect => effect.type === 'DAMAGE')?.amount || null,
        damage_type: ability.effects?.find(effect => effect.type === 'DAMAGE')?.damageType || null,
        mechanics_status: ability.effects?.some(effect => ['STATUS', 'BUFF', 'HEAL'].includes(effect.type)) ? 'PARTIAL_EFFECTS_PENDING' : 'BASIC_EFFECTS_AVAILABLE'
      } : null
    };
  });
  const relatedQuests = Object.values(canonical.quests)
    .filter(quest => (quest.objectives || []).some(objective =>
      (objective.type === 'ENCOUNTER' && objective.target === source.id) ||
      (objective.type === 'KILL' && source.composition.some(member => member.creatureId === objective.target))))
    .map(quest => ({ id: quest.id, prerequisites: quest.prerequisites || [], related_objective_ids: quest.objectives.filter(objective =>
      (objective.type === 'ENCOUNTER' && objective.target === source.id) ||
      (objective.type === 'KILL' && source.composition.some(member => member.creatureId === objective.target))).map(objective => objective.id) }));
  const mechanicallyReady = composition.every(member => member.stats && member.ability?.id === 'golpe' && member.ability.mechanics_status === 'BASIC_EFFECTS_AVAILABLE');
  const provisionalRuntimeReady = source.id === 'ENC_01' || source.id === 'ENC_05';
  encounters[source.id] = {
    id: source.id,
    map_id: source.mapId,
    canonical_status: source.status,
    godot_status: provisionalRuntimeReady && mechanicallyReady && assigned ? 'PROVISIONAL_PLAYABLE' : 'PENDING',
    pending_reasons: [
      ...(!availableMaps.has(source.mapId) ? ['MAP_NOT_IN_GODOT_RUNTIME'] : []),
      ...(!assigned ? ['CANONICAL_TRIGGER_OR_UNIQUE_PLACEMENT_UNSPECIFIED'] : []),
      ...(!mechanicallyReady ? ['CREATURE_ABILITY_MECHANICS_NOT_FULLY_IMPLEMENTED'] : []),
      ...(!source.composition.length ? ['EMPTY_COMPOSITION'] : [])
    ],
    activation_condition: 'UNSPECIFIED_IN_CANON',
    repetition_policy: 'UNSPECIFIED_IN_CANON',
    runtime_policy: provisionalRuntimeReady && mechanicallyReady && assigned ? 'MANUAL_INTERACTION_SESSION_ONCE' : 'NO_WORLD_TRIGGER',
    spawn_placement: assigned,
    composition,
    encounter_rewards: [],
    reward_status: 'NONE_DEFINED_ON_ENCOUNTER;QUEST_REWARDS_SEPARATE;NO_REWARD_GRANT_IN_G11',
    quest_dependencies: relatedQuests,
    narrative_events: relatedQuests.flatMap(quest => quest.related_objective_ids.map(objectiveId => ({ quest_id: quest.id, objective_id: objectiveId, source_event: source.composition.some(member => canonical.quests[quest.id].objectives.find(objective => objective.id === objectiveId)?.type === 'KILL') ? 'MOB_KILLED' : 'ENCOUNTER_RESOLVED' })))
  };
}

const result = {
  schema_version: 1,
  source_files: ['js/data/fimbria-canonical.js', 'js/data/fimbria-runtime.js', 'js/data/abilities.js', 'godot/resources/maps/map_registry.json'],
  source_status_note: 'Canonical encounters have data_only status. Triggers, repeat policies, specific positions and encounter reward tables are not authored canon. Runtime assignments are explicitly provisional.',
  available_godot_maps: [...availableMaps],
  reserved_placement_candidates: placementByMap,
  encounters,
  deferred_special_encounters: [canonical.owlEncounter, canonical.sineiraEncounter],
  audit: {
    canonical_encounter_count: canonicalRows.length,
    godot_available_map_count: availableMaps.size,
    provisional_playable_encounters: Object.values(encounters).filter(item => item.godot_status === 'PROVISIONAL_PLAYABLE').map(item => item.id),
    pending_encounters: Object.values(encounters).filter(item => item.godot_status === 'PENDING').map(item => item.id),
    canonical_rewards_defined: false,
    canonical_trigger_conditions_defined: false,
    canonical_repeat_policies_defined: false
  }
};
const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (checkOnly) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, 'utf8') !== serialized) {
    console.error('Encounter catalog is stale. Run node tools/build_godot_encounter_catalog.js to regenerate it.');
    process.exit(1);
  }
  console.log(`Encounter catalog current: ${Object.keys(encounters).length} canonical encounters (${result.audit.provisional_playable_encounters.length} provisional playable, ${result.audit.pending_encounters.length} pending).`);
} else {
  fs.writeFileSync(outputPath, serialized);
  console.log(`Wrote ${Object.keys(encounters).length} canonical encounters (${result.audit.provisional_playable_encounters.length} provisional playable, ${result.audit.pending_encounters.length} pending).`);
}
