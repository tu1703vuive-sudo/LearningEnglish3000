import test from 'node:test';
import assert from 'node:assert/strict';
import { pickSmartSession } from '../src/session.js';

const pool=Array.from({length:20},(_,i)=>({word:`w${i}`,meaning:`m${i}`,pos:'n',topics:[1]}));
const state={srs:{},seen:{},wrong:{}};
for(let i=0;i<4;i++)state.srs[`w${i}`]={box:2,due:'2026-01-01'};
for(let i=4;i<8;i++){state.srs[`w${i}`]={box:1,due:'2099-01-01'};state.wrong[`w${i}`]=2;}

test('smart session returns requested unique size',()=>{
  const s=pickSmartSession(state,pool,10,()=>0.5);
  assert.equal(s.length,10);
  assert.equal(new Set(s.map(x=>x.word)).size,10);
});
