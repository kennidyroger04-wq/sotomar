#!/usr/bin/env node
'use strict';

// Build-time adapter: copies only canonical map geometry and visual metadata
// from the original JavaScript data into a Godot-readable JSON registry.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

global.MAP_01_VISUAL = require(path.join(root, 'js/data/map01-visual.js'));
global.MAP_02_VISUAL = require(path.join(root, 'js/data/map02-visual.js'));
global.MAP_04_VISUAL = require(path.join(root, 'js/data/map04-visual.js'));
global.FIMBRIA_CANONICAL = require(path.join(root, 'js/data/fimbria-canonical.js'));
const runtime = require(path.join(root, 'js/data/fimbria-runtime.js'));
const npcDb = require(path.join(root, 'js/data/npcs.js'));
const names = new Map(Object.values(global.FIMBRIA_CANONICAL.maps).map(entry => [entry.id, entry.name]));
const maps = {};
for (const id of ['MAP_01', 'MAP_02', 'MAP_04']) {
  const visual = id === 'MAP_01' ? global.MAP_01_VISUAL : id === 'MAP_02' ? global.MAP_02_VISUAL : global.MAP_04_VISUAL;
  const source = runtime.mapDatabase[id];
  maps[id] = {
    id,
    name: names.get(id),
    width: visual.dimensions.width,
    height: visual.dimensions.height,
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
