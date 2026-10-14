#!/usr/bin/env node
const fs=require('node:fs');const path=require('node:path');
const canonical=require('../js/data/fimbria-canonical.js');
const out=path.join(__dirname,'../godot/resources/combat/boss_registry_g16.json');
const content=JSON.stringify({schemaVersion:1,source:'js/data/fimbria-canonical.js',bosses:canonical.bosses||{},specialEncounter:canonical.sineiraEncounter||{},owlEncounter:canonical.owlEncounter||{}},null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(out)||fs.readFileSync(out,'utf8')!==content){console.error('FAIL: boss registry differs from canonical source');process.exit(1)}console.log(`PASS: ${Object.keys(canonical.bosses||{}).length} canonical boss contracts match the source.`)}else{fs.writeFileSync(out,content);console.log(`Wrote ${Object.keys(canonical.bosses||{}).length} boss contracts.`)}
