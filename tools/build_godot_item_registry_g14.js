#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const legacy = require('../js/data/items.js');
const economy = require('../js/data/economy.js');
const canonical = require('../js/data/fimbria-canonical.js');
const output = path.join(__dirname, '../godot/resources/items/item_registry.json');
const items = structuredClone(legacy);
for (const [id, definition] of Object.entries(economy.canonicalItems)) items[id] = {...definition};
for (const id of economy.canonicalMaterials) items[id] = {name:id.replaceAll('_',' '),icon:'📦',rarity:'Comum',canonical:true};
for (const [id, definition] of Object.entries(canonical.items || {})) {
  items[id] = {...(items[id] || {}), name:definition.name, canonical:true, mechanicsStatus:definition.mechanicsStatus || 'deferred'};
}
for (const [id, item] of Object.entries(items)) {
  const market = economy.CATALOG[id];
  if (market) item.economy = {...market};
  item.itemId = id;
}
const registry = {schemaVersion:1, source:'js/data/items.js + js/data/economy.js + js/data/fimbria-canonical.js', currencyId:economy.CURRENCY_ID, provisionalEconomy:true, items, orders:economy.BRAM_ORDERS};
const content = JSON.stringify(registry, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== content) { console.error('FAIL: Godot item registry differs from JavaScript sources.'); process.exit(1); }
  console.log(`PASS: ${Object.keys(items).length} item definitions match the JavaScript sources.`);
} else { fs.mkdirSync(path.dirname(output), {recursive:true}); fs.writeFileSync(output, content); console.log(`Wrote ${Object.keys(items).length} item definitions.`); }
