#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const canonical = require(path.join(root, 'js/data/fimbria-canonical.js'));
const validation = canonical.validateReferences();
if (!validation.ok) throw new Error(`Canonical quest references are invalid: ${validation.errors.join(', ')}`);
const npcAliases = Object.fromEntries(Object.entries(canonical.aliases).filter(([id]) => id.startsWith('NPC_')));
const mapQuests = Object.fromEntries(Object.entries(canonical.maps).map(([id, map]) => [id, map.quests]));
const output = `${JSON.stringify({schema_version: 1, source: 'js/data/fimbria-canonical.js', quests: canonical.quests, npc_aliases: npcAliases, map_quests: mapQuests}, null, 2)}\n`;
const destination = path.join(root, 'godot/resources/quests/quest_registry.json');
if (process.argv.includes('--check')) {
  if (!fs.existsSync(destination) || fs.readFileSync(destination, 'utf8') !== output) {
    console.error('Quest registry is stale; run node tools/build_godot_quest_registry.js');
    process.exit(1);
  }
  console.log(`PASS: Quest registry matches ${Object.keys(canonical.quests).length} canonical quests.`);
} else {
  fs.writeFileSync(destination, output);
  console.log(`Updated ${path.relative(root, destination)} from canonical quest data.`);
}
