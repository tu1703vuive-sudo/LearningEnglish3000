import test from 'node:test';
import assert from 'node:assert/strict';
import { hydrateTopicsWithWordMap, normalizeTopicKey } from '../src/topic-mapping.js';

test('Vietnamese topic labels normalize consistently', () => {
  assert.equal(normalizeTopicKey('Sức khỏe'), 'suc khoe');
  assert.equal(normalizeTopicKey('rau, củ, quả'), 'rau cu qua');
  assert.equal(normalizeTopicKey('Tết trung thu'), 'tet trung thu');
});

test('hydrates an empty topic from word map without inventing vocab', () => {
  const vocab=[{word:'travel'},{word:'airport'},{word:'hospital'}];
  const topics=[
    {id:'travel',nameVi:'du lịch',words:[]},
    {id:'health',nameVi:'sức khỏe',words:[]}
  ];
  const map={rows:[
    {word:'travel',topic:'du lịch'},
    {word:'airport',topic:'du lịch'},
    {word:'hospital',topic:'bệnh viện'},
    {word:'missing-word',topic:'du lịch'}
  ]};
  const out=hydrateTopicsWithWordMap(topics,vocab,map);
  assert.deepEqual(out.topics[0].words,['travel','airport']);
  assert.deepEqual(out.topics[1].words,[]);
  assert.equal(out.report.matchedTopics,1);
  assert.equal(out.report.unmatchedSourceWords,1);
  assert.deepEqual(out.report.unmatchedTopicNames,['bệnh viện']);
});

test('keeps existing mapping and adds source mapping only once', () => {
  const vocab=[{word:'computer'},{word:'desk'}];
  const topics=[{id:1,nameVi:'máy tính',words:['computer']}];
  const map=[{word:'computer',topic:'máy tính'},{word:'desk',topic:'máy tính'}];
  const out=hydrateTopicsWithWordMap(topics,vocab,map);
  assert.deepEqual(out.topics[0].words,['computer','desk']);
  assert.equal(out.report.assignedLinks,1);
});
