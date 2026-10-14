'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const source = require(path.join(root, 'js/systems/fimbria-inspections.js')).POINTS;
const canonical = require(path.join(root, 'js/data/fimbria-canonical.js'));
const registry = JSON.parse(fs.readFileSync(path.join(root, 'godot/resources/quests/inspection_points.json'), 'utf8'));
assert.equal(registry.points.length, source.length);
for (let i = 0; i < source.length; i++) {
  const original = source[i], point = registry.points[i];
  assert.deepEqual([point.id, point.mapId, point.x, point.y, point.itemId, point.flag], [original.id, original.mapId, original.x, original.y, original.itemId, original.flag]);
  assert.equal(point.position_status, 'PROVISIONAL_LOGICAL');
  assert(canonical.questItems[point.itemId], `${point.id} uses a canonical quest item`);
}
console.log(`PASS: ${source.length} inspection points, IDs, item IDs and provisional coordinates match the JavaScript source.`);
