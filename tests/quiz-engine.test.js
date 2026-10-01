import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDistractors, buildChoices, typingIsCorrect } from '../src/quiz-engine.js';
import { normalizeDisplay } from '../src/utils.js';

const target={word:'above',meaning:'ở trên',pos:'prep, adv',topics:[1]};
const vocab=[target,
 {word:'below',meaning:'ở dưới',pos:'prep, adv',topics:[1]},
 {word:'around',meaning:'xung quanh',pos:'prep, adv',topics:[1]},
 {word:'between',meaning:'ở giữa',pos:'prep',topics:[1]},
 {word:'apple',meaning:'quả táo',pos:'n',topics:[2]},
 {word:'over',meaning:'ở trên',pos:'prep',topics:[1]},
 {word:'airport',meaning:'sân bay',pos:'n',topics:[3]}];

test('distractors prefer same POS/topic and never duplicate visible answers',()=>{
  const d=selectDistractors(target,vocab,'envi',3,()=>0.5);
  assert.equal(d.length,3);
  assert.ok(d.every(x=>x.word!=='above'));
  const labels=d.map(x=>normalizeDisplay(x.meaning));
  assert.equal(new Set(labels).size,labels.length);
  assert.ok(!labels.includes(normalizeDisplay(target.meaning)));
  assert.ok(d.slice(0,2).every(x=>x.topics.includes(1)));
});

test('choices contain exactly one target and unique answer labels',()=>{
  const c=buildChoices(target,vocab,'envi',()=>0.4);
  assert.equal(c.filter(x=>x.word==='above').length,1);
  const labels=c.map(x=>normalizeDisplay(x.meaning));
  assert.equal(new Set(labels).size,labels.length);
});

test('typing accepts hyphen/space variants but not wrong word',()=>{
  const item={word:'post-it'};
  assert.equal(typingIsCorrect('post it',item),true);
  assert.equal(typingIsCorrect('poster',item),false);
});
