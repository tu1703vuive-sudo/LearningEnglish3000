export const keyOf = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
export const normalizeDisplay = value => keyOf(value).replace(/[.,;:!?()[\]{}"“”]/g, '').replace(/\s+/g, ' ').trim();
export const normalizePos = value => keyOf(value).replace(/\./g, '');
export function fisherYates(input, rng = Math.random) { const a=[...input]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
export function safeJsonParse(raw, fallback=null){try{return raw?JSON.parse(raw):fallback;}catch{return fallback;}}
export function localDateString(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`;}
export function addDaysString(dateString,days){const [y,m,d]=dateString.split('-').map(Number);const date=new Date(y,m-1,d);date.setDate(date.getDate()+days);return localDateString(date);}
