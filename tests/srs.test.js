import test from 'node:test';
import assert from 'node:assert/strict';
import { applySrsAnswer, isMasteredCard, dueKeys, masteredKeys } from '../src/srs.js';

test('correct answers progress through SRS and mastery derives from box',()=>{
  let card=null;
  for(let i=0;i<4;i++)card=applySrsAnswer(card,true,'2026-10-01');
  assert.equal(card.box,4);
  assert.equal(isMasteredCard(card),true);
  const state={srs:{above:card,ability:{box:2,due:'2026-10-01'}}};
  assert.deepEqual([...masteredKeys(state)],['above']);
});

test('wrong answer lowers box and becomes due now',()=>{
  const card=applySrsAnswer({box:4,due:'2026-11-01',correct:5,wrong:0,last:'2026-09-01'},false,'2026-10-01');
  assert.equal(card.box,2);
  assert.equal(card.due,'2026-10-01');
  assert.equal(isMasteredCard(card),false);
});

test('dueKeys returns only due entries',()=>{
  const state={srs:{a:{due:'2026-10-01'},b:{due:'2026-10-02'},c:{}}};
  assert.deepEqual(dueKeys(state,'2026-10-01'),['a']);
});
