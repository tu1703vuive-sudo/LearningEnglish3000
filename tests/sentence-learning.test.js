import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptySentenceProgress, recordSentenceResult, topicSentenceStats,
  pickSentenceSession, buildMeaningChoices, normalizeDialoguePack
} from '../src/sentence-learning.js';

const records = [
  {id:'a',topic_id:'food',topic:'Food',en:'A',vi:'Một'},
  {id:'b',topic_id:'food',topic:'Food',en:'B',vi:'Hai'},
  {id:'c',topic_id:'food',topic:'Food',en:'C',vi:'Ba'},
  {id:'d',topic_id:'work',topic:'Work',en:'D',vi:'Bốn'}
];

test('sentence mastery requires two correct answers in a row',()=>{
  const p=emptySentenceProgress();
  recordSentenceResult(p,'a',true);
  assert.equal(Boolean(p.mastered.a),false);
  recordSentenceResult(p,'a',true);
  assert.equal(p.mastered.a,true);
  recordSentenceResult(p,'a',false);
  assert.equal(p.mastered.a,false);
});

test('topic stats stay inside selected topic',()=>{
  const p=emptySentenceProgress();
  p.mastered.a=true;
  p.mastered.d=true;
  const s=topicSentenceStats(records,p,'food');
  assert.equal(s.total,3);
  assert.equal(s.mastered,1);
});

test('sentence session never escapes topic',()=>{
  const p=emptySentenceProgress();
  const s=pickSentenceSession(records,p,'food',10);
  assert.ok(s.length===3);
  assert.ok(s.every(x=>x.topic_id==='food'));
});

test('meaning choices include correct answer once',()=>{
  const c=buildMeaningChoices(records[0],records,4);
  assert.equal(c.filter(x=>x==='Một').length,1);
  assert.ok(c.length>=2);
});


test('dialogue pack accepts V3.3 question_vi/options_vi schema',()=>{
  const rows=normalizeDialoguePack({records:[{id:'d1',topic_id:'food',lines:[{speaker:'A',en:'Hi'},{speaker:'B',en:'Hello'}],question_vi:'Hỏi gì?',options_vi:['A','B'],answer_index:0}]});
  assert.equal(rows.length,1);
});
