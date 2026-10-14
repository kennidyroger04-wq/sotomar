#!/usr/bin/env node
'use strict';

// Build-time adapter: copies only canonical map geometry and visual metadata
// from the original JavaScript data into a Godot-readable JSON registry.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

global.FIMBRIA_CANONICAL = require(path.join(root, 'js/data/fimbria-canonical.js'));
for (const id of Object.keys(global.FIMBRIA_CANONICAL.maps)) {
  const suffix = id.slice(-2);
  global[`${id}_VISUAL`] = require(path.join(root, `js/data/map${suffix}-visual.js`));
}
const runtime = require(path.join(root, 'js/data/fimbria-runtime.js'));
const npcDb = require(path.join(root, 'js/data/npcs.js'));
const maps = {};
for (const [id, canonical] of Object.entries(global.FIMBRIA_CANONICAL.maps)) {
  const visual = global[`${id}_VISUAL`];
  const source = runtime.mapDatabase[id];
  if (!visual || !source) throw new Error(`${id}: canonical runtime or visual layout missing`);
  if (visual.mapId !== id || visual.dimensions.width !== source.width || visual.dimensions.height !== source.height) {
    throw new Error(`${id}: visual dimensions/identity do not match canonical runtime`);
  }
  maps[id] = {
    id,
    name: canonical.name,
    width: source.width,
    height: source.height,
    geometry_status: source.geometryStatus,
    canonical_connections: canonical.connections || [],
    base_floor_asset_id: visual.baseFloorAssetId,
    floor_overrides: visual.floorOverrides,
    props: visual.props,
    blocked_cells: visual.blockedCells,
    reserved_cells: visual.reservedCells,
    spawns: source.spawns,
    npcs: Object.values(npcDb)
      .filter(npc => runtime.normalizeMapId(npc.mapId) === id)
      .map(npc => ({ id: npc.id, name: npc.name, role: npc.role, x: npc.position.x, y: npc.position.y })),
    exits: source.exits.map(exit => ({
      id: exit.id,
      to: exit.to,
      x: exit.x,
      y: exit.y,
      target_spawn_id: exit.targetSpawnId,
      target_position: runtime.resolveSpawn(exit.to, exit.targetSpawnId),
      requires_flag: exit.requiresFlag || "",
      status: exit.status,
    })),
  };
}
const output = `${JSON.stringify({schema_version: 1, maps}, null, 2)}\n`;
const destination = path.join(root, 'godot/resources/maps/map_registry.json');
if (process.argv.includes('--check')) {
  const current = fs.existsSync(destination) ? fs.readFileSync(destination, 'utf8') : '';
  if (current !== output) {
    console.error('Godot map registry is stale; run node tools/sync_godot_map_registry.js');
    process.exit(1);
  }
  console.log('PASS: Godot map registry matches the original JavaScript maps.');
} else {
  fs.writeFileSync(destination, output);
  console.log(`Updated ${path.relative(root, destination)} from the original JavaScript maps.`);
}
