import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const pack=JSON.parse(fs.readFileSync(new URL('../data/vocab-clean.json',import.meta.url),'utf8'));
const golden=JSON.parse(fs.readFileSync(new URL('./fixtures/golden-vocab.json',import.meta.url),'utf8'));
const byWord=new Map(pack.words.map(x=>[x.word.toLowerCase(),x]));
test('golden regression fixture remains byte-equivalent on core fields',()=>{
  assert.ok(golden.words.length>=100 && golden.words.length<=300);
  for(const g of golden.words){
    const w=byWord.get(g.word.toLowerCase());
    assert.ok(w,`missing ${g.word}`);
    assert.equal(w.meaning,g.meaning,`${g.word}: meaning`);
    assert.equal(w.ipa,g.ipa,`${g.word}: ipa`);
    assert.equal(w.pos,g.pos,`${g.word}: pos`);
  }
});
