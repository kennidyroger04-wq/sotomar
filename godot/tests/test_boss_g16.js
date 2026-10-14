const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const source=require('../../js/data/fimbria-canonical.js');const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../resources/combat/boss_registry_g16.json'),'utf8'));
assert.deepEqual(data.bosses,source.bosses);assert.deepEqual(data.specialEncounter,source.sineiraEncounter);assert.deepEqual(data.owlEncounter,source.owlEncounter);
assert.equal(data.bosses.CRE_SINEIRA.nonLethal,true);assert.equal(data.bosses.CRE_SINEIRA.mechanicsStatus,'contract_only');assert.equal(data.owlEncounter.status,'deferred');
console.log('PASS: Sineira and Coruja-muda IDs, nonlethal contract and deferred status match the canonical source.');
