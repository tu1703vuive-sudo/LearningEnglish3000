import { SESSION_RATIOS } from './config.js';
import { fisherYates, keyOf, localDateString } from './utils.js';
import { isDueCard } from './srs.js';
export function isNewWord(state,item){const k=keyOf(item.word);return!state.srs[k]&&!(state.seen[k]>0);}
export function isWeakWord(state,item){const k=keyOf(item.word),c=state.srs[k];return!!c&&((state.wrong[k]||0)>0||(c.box||0)<=2);}
export function dueInPool(state,pool,today=localDateString()){return pool.filter(x=>isDueCard(state.srs[keyOf(x.word)],today));}
export function newInPool(state,pool){return pool.filter(x=>isNewWord(state,x));}
export function weakInPool(state,pool,today=localDateString()){return pool.filter(x=>isWeakWord(state,x)&&!isDueCard(state.srs[keyOf(x.word)],today));}
export function priorityScore(state,item,today=localDateString()){const k=keyOf(item.word),c=state.srs[k];if(isDueCard(c,today))return 1000+(state.wrong[k]||0)*10-(c.box||0);if(!c)return 700;return 300-(c.box||0)*20+(state.wrong[k]||0)*10;}
function take(out,src,limit,used){for(const x of src){if(out.length>=limit)break;const k=keyOf(x.word);if(used.has(k))continue;used.add(k);out.push(x);}}
export function pickSmartSession(state,pool,size=10,rng=Math.random){const n=Math.min(Number(size)||10,pool.length);if(!n)return[];const due=dueInPool(state,pool).sort((a,b)=>(state.wrong[keyOf(b.word)]||0)-(state.wrong[keyOf(a.word)]||0)),fresh=fisherYates(newInPool(state,pool),rng),weak=weakInPool(state,pool).sort((a,b)=>(state.wrong[keyOf(b.word)]||0)-(state.wrong[keyOf(a.word)]||0)),rest=[...pool].sort((a,b)=>priorityScore(state,b)-priorityScore(state,a));const dg=Math.round(n*SESSION_RATIOS.due),fg=Math.round(n*SESSION_RATIOS.fresh),wg=Math.max(0,n-dg-fg),out=[],used=new Set();take(out,due,dg,used);take(out,fresh,out.length+fg,used);take(out,weak,out.length+wg,used);take(out,[...due,...fresh,...weak,...rest],n,used);return out.slice(0,n);}
export function pickNewSession(state,pool,size=10,rng=Math.random){return fisherYates(newInPool(state,pool),rng).slice(0,Math.min(size,pool.length));}
export function pickDueSession(state,pool,size=10){return dueInPool(state,pool).sort((a,b)=>(state.wrong[keyOf(b.word)]||0)-(state.wrong[keyOf(a.word)]||0)).slice(0,size);}
export function pickWrongSession(state,pool,size=10){return pool.filter(x=>(state.wrong[keyOf(x.word)]||0)>0).sort((a,b)=>(state.wrong[keyOf(b.word)]||0)-(state.wrong[keyOf(a.word)]||0)).slice(0,size);}
