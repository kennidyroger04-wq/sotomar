#!/usr/bin/env node
const fs=require('node:fs');const path=require('node:path');
const abilities=require('../js/data/abilities.js');
const out=path.join(__dirname,'../godot/resources/combat/ability_registry_g15.json');
const content=JSON.stringify({schemaVersion:1,source:'js/data/abilities.js',abilities},null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.existsSync(out)||fs.readFileSync(out,'utf8')!==content){console.error('FAIL: ability registry differs from JavaScript source');process.exit(1)}console.log(`PASS: ${Object.keys(abilities).length} canonical abilities match JavaScript.`)}else{fs.writeFileSync(out,content);console.log(`Wrote ${Object.keys(abilities).length} abilities.`)}
