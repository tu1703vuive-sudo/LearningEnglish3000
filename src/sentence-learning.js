export const SENTENCE_STORAGE_KEY = 'english3000SentenceProgressV1';

export function normalizeSentencePack(payload) {
  const records = Array.isArray(payload) ? payload : payload?.records;
  if (!Array.isArray(records)) throw new Error('Sentence dataset không hợp lệ.');
  return records.filter(x => x && x.id && x.en && x.vi && x.topic_id).map(x => ({
    ...x,
    id: String(x.id),
    topic_id: String(x.topic_id),
    topic: String(x.topic || x.topic_id),
    level_estimate: String(x.level_estimate || 'A1'),
    en: String(x.en).trim(),
    vi: String(x.vi).trim()
  }));
}

export function normalizeDialoguePack(payload) {
  const records = Array.isArray(payload) ? payload : payload?.records;
  if (!Array.isArray(records)) throw new Error('Dialogue dataset không hợp lệ.');
  return records.filter(x => x && x.id && x.topic_id && Array.isArray(x.lines) && x.lines.length >= 2 && (x.question_vi || x.question) && Array.isArray(x.options_vi || x.options));
}

export function sentenceTopics(records) {
  const map = new Map();
  for (const item of records) {
    const cur = map.get(item.topic_id) || { id:item.topic_id, name:item.topic || item.topic_id, count:0 };
    cur.count++;
    map.set(item.topic_id, cur);
  }
  return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name));
}

export function emptySentenceProgress() {
  return { version:1, lastTopicId:'', sentenceSize:10, seen:{}, correct:{}, wrong:{}, streak:{}, mastered:{}, dialogueSeen:{}, dialogueCorrect:{}, dialogueWrong:{} };
}

export function sanitizeSentenceProgress(value) {
  const base = emptySentenceProgress();
  if (!value || typeof value !== 'object') return base;
  return {
    ...base,
    ...value,
    sentenceSize: [5,10,15,20].includes(Number(value.sentenceSize)) ? Number(value.sentenceSize) : 10,
    seen: value.seen && typeof value.seen === 'object' ? value.seen : {},
    correct: value.correct && typeof value.correct === 'object' ? value.correct : {},
    wrong: value.wrong && typeof value.wrong === 'object' ? value.wrong : {},
    streak: value.streak && typeof value.streak === 'object' ? value.streak : {},
    mastered: value.mastered && typeof value.mastered === 'object' ? value.mastered : {},
    dialogueSeen: value.dialogueSeen && typeof value.dialogueSeen === 'object' ? value.dialogueSeen : {},
    dialogueCorrect: value.dialogueCorrect && typeof value.dialogueCorrect === 'object' ? value.dialogueCorrect : {},
    dialogueWrong: value.dialogueWrong && typeof value.dialogueWrong === 'object' ? value.dialogueWrong : {}
  };
}

export function recordSentenceResult(progress, id, isCorrect) {
  progress.seen[id] = (progress.seen[id] || 0) + 1;
  if (isCorrect) {
    progress.correct[id] = (progress.correct[id] || 0) + 1;
    progress.streak[id] = (progress.streak[id] || 0) + 1;
    if (progress.streak[id] >= 2) progress.mastered[id] = true;
  } else {
    progress.wrong[id] = (progress.wrong[id] || 0) + 1;
    progress.streak[id] = 0;
    progress.mastered[id] = false;
  }
  return progress;
}

export function markSentenceUnderstood(progress, id, understood) {
  progress.seen[id] = (progress.seen[id] || 0) + 1;
  if (understood) {
    progress.correct[id] = (progress.correct[id] || 0) + 1;
    progress.streak[id] = (progress.streak[id] || 0) + 1;
    if (progress.streak[id] >= 2) progress.mastered[id] = true;
  } else {
    progress.wrong[id] = (progress.wrong[id] || 0) + 1;
    progress.streak[id] = 0;
    progress.mastered[id] = false;
  }
  return progress;
}

export function recordDialogueResult(progress, id, isCorrect) {
  progress.dialogueSeen[id] = (progress.dialogueSeen[id] || 0) + 1;
  if (isCorrect) progress.dialogueCorrect[id] = (progress.dialogueCorrect[id] || 0) + 1;
  else progress.dialogueWrong[id] = (progress.dialogueWrong[id] || 0) + 1;
  return progress;
}

export function topicSentenceStats(records, progress, topicId='') {
  const pool = topicId ? records.filter(x=>x.topic_id===topicId) : records;
  const mastered = pool.filter(x=>progress.mastered[x.id]).length;
  const seen = pool.filter(x=>(progress.seen[x.id]||0)>0).length;
  const weak = pool.filter(x=>(progress.wrong[x.id]||0)>(progress.correct[x.id]||0)).length;
  return { total:pool.length, mastered, seen, fresh:Math.max(0,pool.length-seen), weak, pct:pool.length ? Math.round(mastered/pool.length*100) : 0 };
}

function shuffle(items) {
  const arr=[...items];
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  return arr;
}

export function pickSentenceSession(records, progress, topicId, size=10) {
  const pool = topicId ? records.filter(x=>x.topic_id===topicId) : records;
  const ranked = [...pool].sort((a,b)=>{
    const aw = progress.wrong[a.id]||0, bw=progress.wrong[b.id]||0;
    const as = progress.seen[a.id]||0, bs=progress.seen[b.id]||0;
    const am = progress.mastered[a.id]?1:0, bm=progress.mastered[b.id]?1:0;
    return (bm-am)*4 + (bw-aw)*3 + (as-bs);
  });
  const head = ranked.slice(0,Math.min(ranked.length,Math.max(size*2,size)));
  return shuffle(head).slice(0,Math.min(size,head.length));
}

export function buildMeaningChoices(item, records, count=4) {
  const sameTopic = records.filter(x=>x.id!==item.id && x.topic_id===item.topic_id && x.vi!==item.vi);
  const other = records.filter(x=>x.id!==item.id && x.topic_id!==item.topic_id && x.vi!==item.vi);
  const distractors = shuffle(sameTopic).slice(0,count-1);
  if (distractors.length < count-1) distractors.push(...shuffle(other).slice(0,count-1-distractors.length));
  return shuffle([item.vi,...distractors.map(x=>x.vi)]).slice(0,count);
}

export function pickDialogueSession(records, topicId, size=5) {
  const pool = topicId ? records.filter(x=>x.topic_id===topicId) : records;
  return shuffle(pool).slice(0,Math.min(size,pool.length));
}
