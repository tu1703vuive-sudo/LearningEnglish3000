import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validatePack } from '../src/data.js';

const pack=JSON.parse(fs.readFileSync(new URL('../data/vocab-clean.json',import.meta.url),'utf8'));
test('runtime pack validates without invalid rows and is not hard-coded to 3000',()=>{
  const r=validatePack(pack);
  assert.equal(r.valid,true);
  assert.equal(r.issues.length,0);
  assert.equal(r.words.length,pack.meta.count);
  assert.notEqual(r.words.length,3000);
});

test('validator rejects duplicate and incomplete rows',()=>{
  const r=validatePack({words:[{word:'a',meaning:'m',ipa:'/a/',pos:'n'},{word:'A',meaning:'x',ipa:'',pos:''}],topics:[]});
  assert.equal(r.words.length,1);
  assert.ok(r.issues.length>=1);
});
