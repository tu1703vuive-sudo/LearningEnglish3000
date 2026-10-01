import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateState, loadState } from '../src/state.js';

test('migration converts legacy mastered array into SRS and removes stale fields',()=>{
  const s=migrateState({mastered:['Above'],selectedLevel:'A1',mode:'adaptive'},'2026-10-01');
  assert.equal(s.srs.above.box,4);
  assert.equal('mastered' in s,false);
  assert.equal('selectedLevel' in s,false);
  assert.equal(s.schemaVersion,4);
});

test('malformed JSON never crashes loadState',()=>{
  const storage={getItem(){return '{bad json';},setItem(){}};
  const s=loadState(storage);
  assert.equal(s.schemaVersion,4);
  assert.equal(s.sessionSize,10);
});
