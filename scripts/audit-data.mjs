import fs from 'node:fs';
import { validatePack } from '../src/data.js';
const pack=JSON.parse(fs.readFileSync(new URL('../data/vocab-clean.json',import.meta.url),'utf8'));
const checked=validatePack(pack);
const report={
  valid:checked.valid,
  count:checked.words.length,
  invalidRows:checked.issues.length,
  duplicateWords:checked.issues.filter(x=>x.issues?.includes('duplicate-word')).length,
  missingMeaning:checked.issues.filter(x=>x.issues?.includes('missing-meaning')).length,
  missingIpa:checked.issues.filter(x=>x.issues?.includes('missing-ipa')).length,
  missingPos:checked.issues.filter(x=>x.issues?.includes('missing-pos')).length,
  topics:checked.topics.length,
  topicMappedWords:checked.words.filter(w=>(w.topics||[]).length>0).length,
  topicCoveragePercent:Number((checked.words.filter(w=>(w.topics||[]).length>0).length/checked.words.length*100).toFixed(1))
};
console.log(JSON.stringify(report,null,2));
if(!checked.valid||checked.issues.length)process.exitCode=1;
