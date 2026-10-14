'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
global.FIMBRIA_CANONICAL = require(path.join(root, 'js/data/fimbria-canonical.js'));
for (const id of Object.keys(global.FIMBRIA_CANONICAL.maps)) global[`${id}_VISUAL`] = require(path.join(root, `js/data/map${id.slice(-2)}-visual.js`));
const runtime = require(path.join(root, 'js/data/fimbria-runtime.js'));
const registry = require(path.join(root, 'godot/resources/maps/map_registry.json')).maps;
const ids = Object.keys(global.FIMBRIA_CANONICAL.maps);
const cellKey = p => `${p.x},${p.y}`;
function canReach(map, from, to) {
  const blocked = new Set(map.blocked_cells.map(cellKey));
  const queue = [[from.x, from.y]], seen = new Set([cellKey(from)]);
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (x === to.x && y === to.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = {x: x + dx, y: y + dy}, key = cellKey(next);
      if (next.x >= 0 && next.y >= 0 && next.x < map.width && next.y < map.height && !blocked.has(key) && !seen.has(key)) {
        seen.add(key); queue.push([next.x, next.y]);
      }
    }
  }
  return false;
}
assert.deepEqual(Object.keys(registry), ids, 'all and only canonical maps are integrated in catalog order');
for (const id of ids) {
  const map = registry[id], source = runtime.mapDatabase[id], visual = global[`${id}_VISUAL`];
  assert.equal(map.name, global.FIMBRIA_CANONICAL.maps[id].name, `${id} canonical name`);
  assert.deepEqual([map.width, map.height], [source.width, source.height], `${id} source dimensions`);
  assert.deepEqual(map.blocked_cells, visual.blockedCells, `${id} obstacle coordinates`);
  for (const spawn of Object.values(map.spawns)) {
    assert(spawn.x >= 0 && spawn.y >= 0 && spawn.x < map.width && spawn.y < map.height, `${id} spawn is in bounds`);
    assert(!map.blocked_cells.some(cell => cellKey(cell) === cellKey(spawn)), `${id} spawn is unblocked`);
  }
  for (const exit of map.exits) {
    assert(registry[exit.to], `${id}/${exit.id} destination exists`);
    assert(canReach(map, map.spawns.SPAWN_DEFAULT, exit), `${id}/${exit.id} is reachable from default spawn`);
    const target = registry[exit.to], position = exit.target_position;
    assert(position && position.x >= 0 && position.y >= 0 && position.x < target.width && position.y < target.height, `${id}/${exit.id} target spawn is in bounds`);
    assert(!target.blocked_cells.some(cell => cellKey(cell) === cellKey(position)), `${id}/${exit.id} target spawn is unblocked`);
  }
  assert.equal(map.exits.length, source.exits.length, `${id} exit count preserved`);
  for (let i = 0; i < source.exits.length; i++) {
    const sourceExit = source.exits[i], godotExit = map.exits[i];
    assert.equal(godotExit.id, sourceExit.id, `${id} exit ID`);
    assert.equal(godotExit.to, sourceExit.to, `${id} exit target`);
    assert.equal(godotExit.requires_flag, sourceExit.requiresFlag || '', `${id} gate flag`);
    assert.equal(godotExit.status, sourceExit.status, `${id} exit status`);
  }
}
assert.equal(registry.MAP_03.exits.length, 0, 'MAP_03 remains without unsourced portals');
assert.equal(registry.MAP_09.exits.length, 0, 'MAP_09 remains without unsourced portals');
assert.equal(registry.MAP_05.exits.find(e => e.to === 'MAP_07').requires_flag, 'FLAG_ESCADA_MARCO_PRUMO_UNLOCKED', 'MAP_05 gate condition retained');
const graphReachable = (start, flagOpen) => {
  const seen = new Set([start]), queue = [start];
  for (let i = 0; i < queue.length; i++) for (const e of registry[queue[i]].exits) {
    if (e.requires_flag && !flagOpen) continue;
    if (!seen.has(e.to)) { seen.add(e.to); queue.push(e.to); }
  }
  return seen;
};
const closed = graphReachable('MAP_01', false), opened = graphReachable('MAP_01', true);
for (const id of ['MAP_01', 'MAP_02', 'MAP_04', 'MAP_05', 'MAP_06']) assert(closed.has(id), `${id} reachable before gate`);
assert(!closed.has('MAP_07') && opened.has('MAP_07') && opened.has('MAP_08') && opened.has('MAP_10') && opened.has('MAP_11'), 'sourced gate and onward route are respected');
assert(!opened.has('MAP_03') && !opened.has('MAP_09'), 'maps without runtime portals are catalogued but not fabricated into route');
const knownProps = new Set(['VIS_BRIDGE', 'VIS_HOUSE_SMALL', 'VIS_LOW_WALL', 'VIS_MASONRY_STRUCTURE', 'VIS_ROCKS_GRASS', 'VIS_TREE_SMALL']);
const assetFiles = {VIS_ROCKS_GRASS: 'godot/assets/props/g03/rock_moss_stone.png', VIS_TREE_SMALL: 'godot/assets/props/g03/tree_mosswood.png'};
for (const [id, map] of Object.entries(registry)) for (const prop of map.props) {
  assert(knownProps.has(prop.assetId), `${id}/${prop.id} references a recognized source prop`);
  if (assetFiles[prop.assetId]) assert(fs.existsSync(path.join(root, assetFiles[prop.assetId])), `${id}/${prop.id} source texture exists`);
}
console.log(`PASS: G12 canonical map registry, exits, spawns, gate, route reachability and source parity (${ids.length} maps).`);
