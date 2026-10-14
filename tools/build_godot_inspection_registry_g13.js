#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const inspections = require(path.join(root, 'js/systems/fimbria-inspections.js'));
const canonical = require(path.join(root, 'js/data/fimbria-canonical.js'));
const points = inspections.POINTS.map(point => ({
  ...point,
  item_name: canonical.questItems[point.itemId]?.name || point.itemId,
  position_status: 'PROVISIONAL_LOGICAL',
}));
const output = `${JSON.stringify({schema_version: 1, source: 'js/systems/fimbria-inspections.js', points}, null, 2)}\n`;
const destination = path.join(root, 'godot/resources/quests/inspection_points.json');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) {
    console.error('Inspection point registry is stale; run node tools/build_godot_inspection_registry_g13.js'); process.exit(1);
  }
  console.log(`PASS: ${points.length} inspection points match their JavaScript source.`);
} else {
  fs.writeFileSync(destination, output);
  console.log(`Updated ${path.relative(root, destination)} from canonical inspection data.`);
}
