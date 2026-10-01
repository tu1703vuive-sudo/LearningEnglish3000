import { REVIEW_INTERVALS } from './config.js';
import { addDaysString, keyOf, localDateString } from './utils.js';
export function makeCard(today=localDateString()){return {box:0,due:today,correct:0,wrong:0,last:''};}
export function applySrsAnswer(cardInput,isCorrect,today=localDateString()){const card={...makeCard(today),...(cardInput||{})};if(isCorrect){card.correct=(card.correct||0)+1;card.box=Math.min(REVIEW_INTERVALS.length-1,(card.box||0)+1);card.due=addDaysString(today,REVIEW_INTERVALS[card.box]??30);}else{card.wrong=(card.wrong||0)+1;card.box=Math.max(0,(card.box||0)-2);card.due=today;}card.last=today;return card;}
export const isMasteredCard=card=>(card?.box||0)>=4;
export const isDueCard=(card,today=localDateString())=>!!card?.due&&card.due<=today;
export function masteredKeys(state){return new Set(Object.entries(state?.srs||{}).filter(([,c])=>isMasteredCard(c)).map(([w])=>keyOf(w)));}
export function dueKeys(state,today=localDateString()){return Object.entries(state?.srs||{}).filter(([,c])=>isDueCard(c,today)).map(([w])=>keyOf(w));}
