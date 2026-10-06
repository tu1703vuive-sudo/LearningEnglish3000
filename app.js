import { APP_VERSION, STAGE_SIZE, SENTENCE_DATA_URL, DIALOGUE_DATA_URL } from './src/config.js';
import { keyOf, fisherYates, localDateString } from './src/utils.js';
import { loadState, saveState as persistState, ensureTodayStats, applyLearningAnswer } from './src/state.js';
import { masteredKeys, dueKeys as getDueKeys } from './src/srs.js';
import { loadVocabPack, buildIndexes } from './src/data.js';
import {
  isNewWord as coreIsNewWord, isWeakWord as coreIsWeakWord,
  dueInPool as coreDueInPool, newInPool as coreNewInPool, weakInPool as coreWeakInPool,
  priorityScore as corePriorityScore, pickSmartSession, pickNewSession, pickDueSession, pickWrongSession
} from './src/session.js';
import {
  adaptiveStage as coreAdaptiveStage, adaptiveStageText,
  chooseAdaptiveMode, selectDistractors, typingIsCorrect
} from './src/quiz-engine.js';
import { fetchOnlineAudioData as fetchAudioData, ttsSpeak, playUrl } from './src/audio.js';
import { $, showView } from './src/ui.js';
import {
  SENTENCE_STORAGE_KEY, normalizeSentencePack, normalizeDialoguePack, sentenceTopics,
  emptySentenceProgress, sanitizeSentenceProgress, recordSentenceResult, markSentenceUnderstood, recordDialogueResult,
  topicSentenceStats, pickSentenceSession, buildMeaningChoices, pickDialogueSession
} from './src/sentence-learning.js';
let state = loadState();
let vocab = [];
let topics = [];
let offlinePack = null;
let offlineByWord = new Map();
let vocabByKey = new Map();
let currentSession = [];
let currentIndex = 0;
let score = 0;
let wrongThisSession = [];
let sessionMasteredBefore = 0;
let resultWordsExpanded = false;
let answered = false;
let sessionKind = "normal";
let sessionPreloadToken = 0;
let currentQuestionMode = "envi";
let typingHintUsed = false;
let sentenceRecords = [];
let dialogueRecords = [];
let sentenceTopicList = [];
let sentenceProgress = loadSentenceProgress();
let sentenceSelectedTopicId = '';
let sentenceMode = 'study';
let sentenceSession = [];
let sentenceIndex = 0;
let sentenceScore = 0;
let sentenceAnswered = false;
let sentenceMasteredBefore = 0;
let dialogueSession = [];
let dialogueIndex = 0;
let dialogueScore = 0;
let dialogueAnswered = false;
let dialogueTranslationVisible = false;
function saveState() { persistState(state); }
function todayStatsReset() { ensureTodayStats(state); }
function updateOfflinePackStatus() {
  const card = $("offlinePackCard");
  if (!card) return;
  const count = offlinePack?.words?.length || 0;
  const excluded = offlinePack?.meta?.excludedReviewCount ?? 0;
  const full = count > 0;
  card.classList.toggle("ready", full);
  card.classList.toggle("seed", !full);
  $("offlinePackCount").textContent = `${count} từ`;
  if (full) {
    $("offlinePackStatus").textContent = "Database trust-first đã sẵn sàng";
    $("offlinePackHint").textContent = `${offlinePack?.meta?.quarantinedCount ?? excluded} mục không đủ tin cậy đã bị loại; app không ép đủ 3.000.`;
  } else {
    $("offlinePackStatus").textContent = "Không tải được database sạch";
    $("offlinePackHint").textContent = "Kiểm tra file data/vocab-clean.json. App không fallback sang dữ liệu chưa kiểm định.";
  }
}
async function getLexicalData(word) {
  const k = keyOf(word);
  const local = offlineByWord.get(k);
  const cached = state.lexCache[k] || {};
  return {
    ipa: local?.ipa || "",
    us: cached.us || "",
    uk: cached.uk || "",
    generic: cached.generic || "",
    pos: local?.pos || "",
    definition: local?.meaning || "",
    example: local?.example || "",
    exampleVi: local?.exampleVi || ""
  };
}
function findItem(k) { return vocabByKey.get(keyOf(k)) || null; }
function topicLabel(topic) { return topic.nameVi || topic.name || `Chủ đề ${topic.id}`; }
async function loadOfflinePack() {
  try {
    const checked = await loadVocabPack();
    offlinePack = { meta: checked.meta, words: checked.words, topics: checked.topics };
    vocab = checked.words.map(item => ({ ...item, level:'unknown' }));
    topics = checked.topics;
    const indexes = buildIndexes(vocab);
    vocabByKey = indexes.byKey;
    offlineByWord = new Map(vocab.map(item => [keyOf(item.word), item]));
    const nonEmpty = topics.find(t=>t.words.length);
    const selected = topics.find(t=>t.id===state.selectedTopicId);
    if ((!selected || !selected.words.length) && nonEmpty) state.selectedTopicId=nonEmpty.id;
    return offlinePack;
  } catch (error) {
    console.error(error);
    offlinePack=null; vocab=[]; topics=[]; vocabByKey=new Map(); offlineByWord=new Map();
    return null;
  }
}
async function loadVocabulary() {
  await loadOfflinePack();
  await loadSentenceContent();
  renderHome();
  updateOfflinePackStatus();
}
function getMasteredSet(){ return masteredKeys(state); }
function dueKeys(){ return getDueKeys(state); }
function recordAnswer(item,isCorrect,quizMode=currentQuestionMode){
  const card=applyLearningAnswer(state,item,isCorrect,quizMode);
  saveState();
  return card;
}
function isNewWord(item){ return coreIsNewWord(state,item); }
function isWeakWord(item){ return coreIsWeakWord(state,item); }
function dueInPool(pool){ return coreDueInPool(state,pool); }
function newInPool(pool){ return coreNewInPool(state,pool); }
function weakInPool(pool){ return coreWeakInPool(state,pool); }
function priorityScore(item){ return corePriorityScore(state,item); }
function pickSmartSessionWords(){ return pickSmartSession(state,getActivePool(),state.sessionSize); }
function pickNewWords(){ return pickNewSession(state,getActivePool(),state.sessionSize); }
function pickSessionWords(){ return [...getActivePool()].sort((a,b)=>priorityScore(b)-priorityScore(a)).slice(0,state.sessionSize); }
function pickDueWords(){ return pickDueSession(state,getActivePool(),state.sessionSize); }
function pickWrongWords(){ return pickWrongSession(state,getActivePool(),state.sessionSize); }
function adaptiveStage(item){ return coreAdaptiveStage(state,item); }
function chooseAdaptiveQuestionMode(item,index=0){ return chooseAdaptiveMode(state,item,index,state.mode,sessionKind); }
function makeDistractors(item){ return selectDistractors(item,vocab,currentQuestionMode,3); }
async function fetchOnlineAudioData(word){ return fetchAudioData(word,state.lexCache,saveState); }
async function playBestPronunciation(item,dialect='best'){
  let p=await getLexicalData(item.word);
  if(!(p.us||p.uk||p.generic) && navigator.onLine) p={...p,...(await fetchOnlineAudioData(item.word))};
  if(dialect==='us'&&p.us)return playUrl(p.us,item.word);
  if(dialect==='uk'&&p.uk)return playUrl(p.uk,item.word);
  if(dialect==='generic'&&p.generic)return playUrl(p.generic,item.word);
  playUrl(p.us||p.uk||p.generic,item.word);
}
function selectedTopic() {
  return topics.find(t=>t.id===state.selectedTopicId) || topics.find(t=>t.words.length) || null;
}
function getTopicPool(topic) {
  return (topic?.words || []).map(findItem).filter(Boolean);
}
function getActivePool() {
  if (state.browseMode === "topic") return getTopicPool(selectedTopic());
  return vocab.slice((state.selectedStage-1)*STAGE_SIZE, state.selectedStage*STAGE_SIZE);
}
function activeContextName() {
  if (state.browseMode === "topic") {
    const topic = selectedTopic();
    return topic ? topicLabel(topic) : "Chủ đề";
  }
  return `Chặng ${state.selectedStage}`;
}
function getTopicStats(topic) {
  const pool = getTopicPool(topic);
  const mastered = getMasteredSet();
  const known = pool.filter(item=>mastered.has(keyOf(item.word))).length;
  const fresh = newInPool(pool).length;
  const due = dueInPool(pool).length;
  const weak = pool.filter(item=>(state.wrong[keyOf(item.word)]||0)>0).length;
  const pct = pool.length ? Math.round(known/pool.length*100) : 0;
  return {pool,total:pool.length,known,fresh,due,weak,pct};
}
function renderTopicLearningDetail() {
  if (!$("topicLearningDetail")) return;
  const topic = selectedTopic();
  const stats = getTopicStats(topic);
  $("topicLearningName").textContent = topic ? topicLabel(topic) : "Chưa có chủ đề";
  $("topicLearningProgressText").textContent = `${stats.known}/${stats.total} từ đã thuộc`;
  $("topicLearningPercent").textContent = `${stats.pct}%`;
  $("topicLearningProgress").style.width = `${stats.pct}%`;
  $("topicLearningRing").style.background = `conic-gradient(var(--primary) ${stats.pct}%,var(--line) ${stats.pct}%)`;
  $("topicTotalCount").textContent = stats.total;
  $("topicNewCount").textContent = stats.fresh;
  $("topicDueCount").textContent = stats.due;
  $("topicWeakCount").textContent = stats.weak;
  $("topicStartBtn").textContent = `▶ Học ${Math.min(state.sessionSize,stats.total || state.sessionSize)} từ theo chủ đề`;
  $("topicStartBtn").disabled = !stats.total;
  $("topicNewBtn").disabled = !stats.fresh;
  $("topicDueBtn").disabled = !stats.due;
  $("topicWrongBtn").disabled = !stats.weak;
}
function renderTopicLearning(filter="") {
  const grid = $("topicLearningGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const q = keyOf(filter);
  const matches = topics.filter(t=>!q || keyOf(t.name).includes(q) || keyOf(topicLabel(t)).includes(q));
  for (const topic of matches) {
    const stats = getTopicStats(topic);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "topic-learning-card" + (state.selectedTopicId===topic.id ? " active":"") + (!stats.total ? " empty":"");
    b.disabled = !stats.total;
    b.innerHTML = `
      <span class="topic-learning-card-icon">🧩</span>
      <span class="topic-learning-card-copy">
        <strong>${topicLabel(topic)}</strong>
        <small>${stats.known}/${stats.total} thuộc${stats.due ? ` · ${stats.due} cần ôn` : ""}${!stats.total ? " · chưa có từ khớp sạch" : ""}</small>
        <span class="topic-card-progress"><i style="width:${stats.pct}%"></i></span>
      </span>
      <span class="topic-learning-card-arrow">›</span>`;
    b.onclick = () => {
      state.browseMode = "topic";
      state.selectedTopicId = topic.id;
      saveState();
      renderHome();
      $("topicLearningDetail")?.scrollIntoView({behavior:"smooth",block:"start"});
    };
    grid.appendChild(b);
  }
  if (!matches.length) grid.innerHTML = '<p class="muted small">Không tìm thấy chủ đề.</p>';
  renderTopicLearningDetail();
}
function renderHomeTopicEntry() {
  if (!$("homeTopicName")) return;
  const topic = selectedTopic();
  const stats = getTopicStats(topic);
  $("homeTopicName").textContent = topic ? topicLabel(topic) : "Chưa có chủ đề";
  $("homeTopicMeta").textContent = stats.total
    ? `${stats.known}/${stats.total} thuộc · ${stats.fresh} chưa học${stats.due ? ` · ${stats.due} cần ôn` : ""}`
    : "Chủ đề này chưa có từ được mapping tin cậy";
}

function renderHomeTopicQuickGrid() {
  const grid = $("homeTopicQuickGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const usable = topics.filter(t=>getTopicPool(t).length>0);
  const selected = selectedTopic();
  const ordered = [
    ...(selected ? usable.filter(t=>t.id===selected.id) : []),
    ...usable.filter(t=>!selected || t.id!==selected.id)
  ];
  const preview = ordered.slice(0,8);
  for (const topic of preview) {
    const stats = getTopicStats(topic);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "home-topic-chip" + (state.selectedTopicId===topic.id ? " active" : "");
    b.innerHTML = `
      <span class="home-topic-chip-name">${topicLabel(topic)}</span>
      <span class="home-topic-chip-meta">${stats.total} từ · ${stats.pct}%</span>
      <span class="home-topic-chip-bar"><i style="width:${stats.pct}%"></i></span>`;
    b.onclick = () => {
      state.browseMode = "topic";
      state.selectedTopicId = topic.id;
      saveState();
      renderHome();
      showView("topicView");
    };
    grid.appendChild(b);
  }
  if (!preview.length) {
    grid.innerHTML = '<p class="muted small">Chưa có chủ đề khả dụng.</p>';
  }
  const more = $("openAllTopicsBtn");
  if (more) more.textContent = `Xem tất cả ${usable.length} chủ đề`;
}
// ===== V3.3 Sentence Learning =====
function loadSentenceProgress() {
  try { return sanitizeSentenceProgress(JSON.parse(localStorage.getItem(SENTENCE_STORAGE_KEY) || 'null')); }
  catch { return emptySentenceProgress(); }
}
function saveSentenceProgress() {
  try { localStorage.setItem(SENTENCE_STORAGE_KEY, JSON.stringify(sentenceProgress)); } catch {}
}
async function loadSentenceContent() {
  try {
    const [sentenceRes, dialogueRes] = await Promise.all([fetch(SENTENCE_DATA_URL), fetch(DIALOGUE_DATA_URL)]);
    if (!sentenceRes.ok) throw new Error(`Sentence HTTP ${sentenceRes.status}`);
    sentenceRecords = normalizeSentencePack(await sentenceRes.json());
    if (dialogueRes.ok) dialogueRecords = normalizeDialoguePack(await dialogueRes.json());
    else dialogueRecords = [];
    sentenceTopicList = sentenceTopics(sentenceRecords);
    const validTopic = sentenceTopicList.find(t=>t.id===sentenceProgress.lastTopicId);
    if (!validTopic && sentenceTopicList.length) sentenceProgress.lastTopicId = sentenceTopicList[0].id;
    saveSentenceProgress();
  } catch (error) {
    console.error('Sentence pack error', error);
    sentenceRecords=[]; dialogueRecords=[]; sentenceTopicList=[];
  }
}
function selectedSentenceTopicId() { if (sentenceSelectedTopicId === '__all__') return ''; return sentenceSelectedTopicId || sentenceProgress.lastTopicId || sentenceTopicList[0]?.id || ''; }
function sentenceTopicName(id) { return sentenceTopicList.find(t=>t.id===id)?.name || 'Tất cả tình huống'; }
function renderSentenceHomeEntry() {
  if (!$('homeSentenceMeta')) return;
  const stats = topicSentenceStats(sentenceRecords,sentenceProgress,'');
  $('homeSentenceMeta').textContent = sentenceRecords.length
    ? `${stats.mastered}/${stats.total} câu đã hiểu · ${stats.fresh} câu chưa gặp · ${dialogueRecords.length} hội thoại`
    : 'Chưa tải được Sentence Pack';
}
function renderSentenceOverview() {
  if (!$('sentenceTotalCount')) return;
  const stats = topicSentenceStats(sentenceRecords,sentenceProgress,'');
  $('sentenceTotalCount').textContent = stats.total;
  $('sentenceMasteredCount').textContent = stats.mastered;
  $('sentenceSeenCount').textContent = stats.seen;
  $('sentenceFreshCount').textContent = stats.fresh;
  $('sentenceWeakCount').textContent = stats.weak;
  $('dialogueTotalCount').textContent = dialogueRecords.length;
  $('sentenceProgressPercent').textContent = `${stats.pct}%`;
  $('sentenceProgressBar').style.width = `${stats.pct}%`;
  $('sentenceProgressRing').style.background = `conic-gradient(var(--primary) ${stats.pct}%,var(--line) ${stats.pct}%)`;
}
function renderSentenceTopics(filter='') {
  const grid=$('sentenceTopicGrid'); if(!grid) return;
  grid.innerHTML='';
  const q=keyOf(filter);
  const list=sentenceTopicList.filter(t=>!q || keyOf(t.name).includes(q) || keyOf(t.id).includes(q));
  for(const topic of list){
    const stats=topicSentenceStats(sentenceRecords,sentenceProgress,topic.id);
    const dCount=dialogueRecords.filter(x=>x.topic_id===topic.id).length;
    const b=document.createElement('button');
    b.type='button';
    b.className='sentence-topic-card'+(selectedSentenceTopicId()===topic.id?' active':'');
    b.innerHTML=`<span class="sentence-topic-icon">${sentenceTopicEmoji(topic.id)}</span><span class="sentence-topic-copy"><strong>${topic.name}</strong><small>${stats.mastered}/${stats.total} đã hiểu · ${stats.fresh} mới${dCount?` · ${dCount} hội thoại`:''}</small><span class="topic-card-progress"><i style="width:${stats.pct}%"></i></span></span><span class="topic-learning-card-arrow">›</span>`;
    b.onclick=()=>{sentenceSelectedTopicId=topic.id;sentenceProgress.lastTopicId=topic.id;saveSentenceProgress();renderSentenceHub();};
    grid.appendChild(b);
  }
  if(!list.length) grid.innerHTML='<p class="muted small">Không tìm thấy tình huống.</p>';
}
function sentenceTopicEmoji(id){
  return ({introductions:'👋',friends:'🤝',hobbies:'🎯',permission:'🙋',shopping:'🛍️',restaurant:'🍜',train_station:'🚆',sightseeing:'🗺️',cinema:'🎬',happiness:'😊',worry:'😟',hospital:'🏥',banking:'🏦',post_office:'📦',photo_service:'📷'})[id] || '📝';
}
function renderSentenceHub(){
  renderSentenceOverview();
  renderSentenceTopics($('sentenceTopicSearch')?.value||'');
  document.querySelectorAll('#sentenceModeChoices .sentence-mode-card').forEach(b=>b.classList.toggle('active',b.dataset.sentenceMode===sentenceMode));
  document.querySelectorAll('#sentenceSizeChoices .choice').forEach(b=>b.classList.toggle('active',Number(b.dataset.sentenceSize)===sentenceProgress.sentenceSize));
  const topicId=selectedSentenceTopicId();
  const stats=topicSentenceStats(sentenceRecords,sentenceProgress,topicId);
  const isDialogue=sentenceMode==='dialogue';
  const max=isDialogue ? dialogueRecords.filter(x=>x.topic_id===topicId).length : stats.total;
  const take=Math.min(isDialogue?5:sentenceProgress.sentenceSize,max || (isDialogue?5:sentenceProgress.sentenceSize));
  $('sentenceStartBtn').textContent=isDialogue?`▶ Luyện ${take} hội thoại · ${sentenceTopicName(topicId)}`:`▶ Học ${take} câu · ${sentenceTopicName(topicId)}`;
  $('sentenceStartBtn').disabled=!max;
}
function beginSentenceMode(){
  const topicId=selectedSentenceTopicId();
  sentenceProgress.lastTopicId=topicId; saveSentenceProgress();
  if(sentenceMode==='dialogue') return startDialogueSession();
  sentenceSession=pickSentenceSession(sentenceRecords,sentenceProgress,topicId,sentenceProgress.sentenceSize);
  if(!sentenceSession.length) return alert('Tình huống này chưa có câu để học.');
  sentenceIndex=0; sentenceScore=0; sentenceAnswered=false; sentenceMasteredBefore=topicSentenceStats(sentenceRecords,sentenceProgress,'').mastered;
  if(sentenceMode==='study'){renderSentenceStudy();showView('sentenceStudyView');}
  else {renderSentenceQuiz();showView('sentenceQuizView');}
}
function renderSentenceStudy(){
  const item=sentenceSession[sentenceIndex]; if(!item) return finishSentenceSession('study');
  const total=sentenceSession.length;
  $('sentenceStudyProgressBar').style.width=`${sentenceIndex/total*100}%`;
  $('sentenceStudyProgressText').textContent=`${sentenceIndex+1}/${total}`;
  $('sentenceStudyKnownPill').textContent=`✓ ${sentenceScore}`;
  $('sentenceStudyTopic').textContent=item.topic;
  $('sentenceStudyLevel').textContent=item.level_estimate||'A1';
  $('sentenceStudyEnglish').textContent=item.en;
  $('sentenceStudyVietnamese').textContent=item.vi;
  $('sentenceMeaningBox').classList.add('hidden');
  $('sentenceRevealBtn').classList.remove('hidden');
  $('sentenceStudySource').textContent=`Nguồn: ${item.source?.file||'Sentence Pack V1'}`;
  $('sentenceStudyCorrection').classList.toggle('hidden',!item.review?.correction_applied);
}
function answerSentenceStudy(understood){
  const item=sentenceSession[sentenceIndex]; if(!item)return;
  markSentenceUnderstood(sentenceProgress,item.id,understood);saveSentenceProgress();
  if(understood) sentenceScore++;
  sentenceIndex++;
  if(sentenceIndex>=sentenceSession.length) finishSentenceSession('study'); else renderSentenceStudy();
}
function renderSentenceQuiz(){
  const item=sentenceSession[sentenceIndex]; if(!item) return finishSentenceSession(sentenceMode);
  sentenceAnswered=false;
  const total=sentenceSession.length;
  $('sentenceQuizProgressBar').style.width=`${sentenceIndex/total*100}%`;
  $('sentenceQuizProgressText').textContent=`${sentenceIndex+1}/${total}`;
  $('sentenceQuizScore').textContent=sentenceScore;
  $('sentenceQuizTopic').textContent=item.topic;
  const listening=sentenceMode==='listen';
  $('sentenceQuizModeBadge').textContent=listening?'Nghe hiểu':'Đọc hiểu';
  $('sentenceQuizInstruction').textContent=listening?'Nghe câu rồi chọn ý đúng':'Câu này có ý gì?';
  $('sentenceQuizEnglish').textContent=item.en;
  $('sentenceQuizEnglish').classList.toggle('listening-hidden',listening);
  $('sentenceListenPromptBtn').classList.toggle('hidden',!listening);
  $('sentenceQuizFeedback').textContent=''; $('sentenceQuizFeedback').className='feedback feedback-banner';
  $('sentenceQuizCorrectMeaning').classList.add('hidden');
  $('sentenceQuizNextBar').classList.add('hidden');
  const box=$('sentenceQuizAnswers');box.innerHTML='';
  for(const meaning of buildMeaningChoices(item,sentenceRecords,4)){
    const b=document.createElement('button'); b.className='answer-btn sentence-answer-btn'; b.textContent=meaning;
    b.onclick=()=>answerSentenceQuiz(b,meaning===item.vi,item);
    box.appendChild(b);
  }
  if(listening) setTimeout(()=>ttsSpeak(item.en),120);
}
function answerSentenceQuiz(btn,ok,item){
  if(sentenceAnswered)return; sentenceAnswered=true;
  recordSentenceResult(sentenceProgress,item.id,ok);saveSentenceProgress();
  if(ok) sentenceScore++;
  document.querySelectorAll('#sentenceQuizAnswers .sentence-answer-btn').forEach(b=>{b.disabled=true;if(b.textContent===item.vi)b.classList.add('correct');});
  if(!ok) btn.classList.add('wrong');
  $('sentenceQuizFeedback').className=`feedback feedback-banner ${ok?'ok':'bad'}`;
  $('sentenceQuizFeedback').textContent=ok?'✓ Hiểu đúng':`✕ Ý đúng: ${item.vi}`;
  $('sentenceQuizCorrectMeaning').querySelector('strong').textContent=item.vi;
  $('sentenceQuizCorrectMeaning').classList.remove('hidden');
  $('sentenceQuizEnglish').classList.remove('listening-hidden');
  $('sentenceQuizNextBar').classList.remove('hidden');
  $('sentenceQuizNextBtn').textContent=sentenceIndex===sentenceSession.length-1?'Xem kết quả':'Tiếp tục';
}
function nextSentenceQuiz(){
  if(!sentenceAnswered)return;
  sentenceIndex++;
  if(sentenceIndex>=sentenceSession.length) finishSentenceSession(sentenceMode); else renderSentenceQuiz();
}
function startDialogueSession(){
  const topicId=selectedSentenceTopicId();
  dialogueSession=pickDialogueSession(dialogueRecords,topicId,5);
  if(!dialogueSession.length)return alert('Tình huống này chưa có hội thoại mini.');
  dialogueIndex=0;dialogueScore=0;dialogueAnswered=false;dialogueTranslationVisible=false;sentenceMasteredBefore=topicSentenceStats(sentenceRecords,sentenceProgress,'').mastered;
  renderDialogue();showView('dialogueView');
}
function renderDialogue(){
  const item=dialogueSession[dialogueIndex]; if(!item)return finishSentenceSession('dialogue');
  dialogueAnswered=false;dialogueTranslationVisible=false;
  $('dialogueProgressBar').style.width=`${dialogueIndex/dialogueSession.length*100}%`;
  $('dialogueProgressText').textContent=`${dialogueIndex+1}/${dialogueSession.length}`;
  $('dialogueScore').textContent=dialogueScore;
  $('dialogueTopic').textContent=item.topic;
  $('dialogueTitle').textContent=item.title;
  $('dialogueQuestion').textContent=item.question_vi;
  $('dialogueTranslationBtn').textContent='Hiện bản dịch';
  $('dialogueFeedback').textContent='';$('dialogueFeedback').className='feedback feedback-banner';
  $('dialogueNextBar').classList.add('hidden');
  const lines=$('dialogueLines');lines.innerHTML='';
  item.lines.forEach(line=>{
    const row=document.createElement('div');row.className='dialogue-line';
    row.innerHTML=`<span class="dialogue-speaker">${line.speaker}</span><div><p>${line.en}</p><small class="dialogue-vi hidden">${line.vi}</small></div><button class="dialogue-audio-btn" aria-label="Nghe câu">🔊</button>`;
    row.querySelector('button').onclick=()=>ttsSpeak(line.en);
    lines.appendChild(row);
  });
  const answers=$('dialogueAnswers');answers.innerHTML='';
  item.options_vi.forEach((opt,i)=>{const b=document.createElement('button');b.className='answer-btn sentence-answer-btn';b.textContent=opt;b.onclick=()=>answerDialogue(b,i===item.answer_index,item);answers.appendChild(b);});
}
function toggleDialogueTranslation(){
  dialogueTranslationVisible=!dialogueTranslationVisible;
  document.querySelectorAll('#dialogueLines .dialogue-vi').forEach(x=>x.classList.toggle('hidden',!dialogueTranslationVisible));
  $('dialogueTranslationBtn').textContent=dialogueTranslationVisible?'Ẩn bản dịch':'Hiện bản dịch';
}
function answerDialogue(btn,ok,item){
  if(dialogueAnswered)return;dialogueAnswered=true;
  recordDialogueResult(sentenceProgress,item.id,ok);saveSentenceProgress();
  if(ok)dialogueScore++;
  document.querySelectorAll('#dialogueAnswers .sentence-answer-btn').forEach((b,i)=>{b.disabled=true;if(i===item.answer_index)b.classList.add('correct');});
  if(!ok)btn.classList.add('wrong');
  $('dialogueFeedback').className=`feedback feedback-banner ${ok?'ok':'bad'}`;
  $('dialogueFeedback').textContent=ok?'✓ Hiểu đúng tình huống':'✕ Chưa đúng — xem lại đoạn hội thoại';
  $('dialogueNextBar').classList.remove('hidden');
  $('dialogueNextBtn').textContent=dialogueIndex===dialogueSession.length-1?'Xem kết quả':'Tiếp tục';
}
function nextDialogue(){if(!dialogueAnswered)return;dialogueIndex++;if(dialogueIndex>=dialogueSession.length)finishSentenceSession('dialogue');else renderDialogue();}
function finishSentenceSession(kind){
  const total=kind==='dialogue'?dialogueSession.length:sentenceSession.length;
  const correct=kind==='dialogue'?dialogueScore:sentenceScore;
  const pct=total?Math.round(correct/total*100):0;
  const masteredNow=topicSentenceStats(sentenceRecords,sentenceProgress,'').mastered;
  const delta=Math.max(0,masteredNow-sentenceMasteredBefore);
  $('sentenceResultLabel').textContent=kind==='dialogue'?'Hội thoại · '+sentenceTopicName(selectedSentenceTopicId()):(kind==='listen'?'Nghe hiểu':kind==='read'?'Đọc hiểu':'Học câu')+' · '+sentenceTopicName(selectedSentenceTopicId());
  $('sentenceResultPercent').textContent=`${pct}%`;
  $('sentenceResultRing').style.background=`conic-gradient(var(--success) ${pct}%,var(--line) ${pct}%)`;
  $('sentenceResultTitle').textContent=`${correct}/${total} câu hiểu đúng`;
  $('sentenceResultCorrect').textContent=`${correct}/${total}`;
  $('sentenceResultNewMastered').textContent=`+${delta}`;
  $('sentenceResultTotalMastered').textContent=masteredNow;
  $('sentenceResultText').textContent=kind==='dialogue'?'Tiến độ hội thoại đã được lưu.':'Câu chưa chắc sẽ được ưu tiên xuất hiện lại ở các buổi sau.';
  showView('sentenceResultView');
}

function renderTopics(filter="") {
  const grid = $("topicGrid");
  grid.innerHTML = "";
  const mastered = getMasteredSet();
  const q = keyOf(filter);
  const matches = topics.filter(t => !q || keyOf(t.name).includes(q) || keyOf(topicLabel(t)).includes(q));
  for (const topic of matches) {
    const known = topic.words.filter(k=>mastered.has(k)).length;
    const due = topic.words.filter(k=>state.srs[k]?.due && state.srs[k].due <= localDateString()).length;
    const b = document.createElement("button");
    b.className = "topic-btn" + (state.selectedTopicId===topic.id ? " active":"") + (!topic.words.length ? " empty":"");
    b.disabled = !topic.words.length;
    b.innerHTML = `<strong>${topicLabel(topic)}</strong><small>${known}/${topic.words.length} thuộc${due ? ` · ${due} cần ôn`:""}${!topic.words.length ? " · chưa có từ khớp sạch":""}</small>`;
    b.onclick = () => {
      state.browseMode="topic";
      state.selectedTopicId=topic.id;
      saveState();
      renderHome();
    };
    grid.appendChild(b);
  }
  if (!matches.length) grid.innerHTML = '<p class="muted small">Không tìm thấy chủ đề.</p>';
}
function renderStages() {
  const grid = $("stageGrid");
  grid.innerHTML = "";
  const mastered = getMasteredSet();
  for (let i=1;i<=Math.ceil(vocab.length/STAGE_SIZE);i++) {
    const pool = vocab.slice((i-1)*STAGE_SIZE,i*STAGE_SIZE);
    const known = pool.filter(x=>mastered.has(keyOf(x.word))).length;
    const b = document.createElement("button");
    b.className = "stage-btn" + (state.selectedStage===i ? " active":"") + (pool.length && known===pool.length ? " done":"");
    b.innerHTML = `<strong>Chặng ${i}</strong><small>${known}/${pool.length || 100} từ</small>`;
    b.onclick = () => { state.selectedStage=i; saveState(); renderHome(); };
    grid.appendChild(b);
  }
}
function renderBrowseMode() {
  if (state.browseMode !== "topic" && state.browseMode !== "stage") state.browseMode = "topic";
  document.querySelectorAll(".browse-tab").forEach(b=>b.classList.toggle("active",b.dataset.browse===state.browseMode));
  $("topicPanel").classList.toggle("hidden",state.browseMode!=="topic");
  $("stagePanel").classList.toggle("hidden",state.browseMode!=="stage");
}
function renderHome() {
  todayStatsReset();
  updateOfflinePackStatus();
  const mastered = getMasteredSet();
  const masteredCount = vocab.length ? vocab.filter(x=>mastered.has(keyOf(x.word))).length : mastered.size;
  $("masteredTop").textContent = masteredCount;
  if ($("heroTotalCount")) $("heroTotalCount").textContent = vocab.length;
  const pct = vocab.length ? Math.min(100,Math.round(masteredCount/vocab.length*100)) : 0;
  $("totalPercent").textContent = pct+"%";
  $("totalProgress").style.width = pct+"%";
  const allDueCount = dueKeys().filter(k=>findItem(k)).length;
  if ($("dueStatCount")) $("dueStatCount").textContent = allDueCount;
  $("streakCount").textContent = state.stats.streak || 0;
  $("todayCount").textContent = state.stats.todayAnswers || 0;
  renderBrowseMode();
  renderTopics($("topicSearch")?.value || "");
  renderStages();

  const pool = getActivePool();
  if ($("dueCount")) $("dueCount").textContent = dueInPool(pool).length;
  $("selectionSummary").textContent = activeContextName();
  $("selectionCount").textContent = `${pool.length} từ`;
  renderStartRecommendation();
  updateSettingsSummary();
  renderHomeTopicEntry();
  renderHomeTopicQuickGrid();
  renderSentenceHomeEntry();
  renderTopicLearning($("topicLearningSearch")?.value || "");
  saveState();
}
function modeLabel() {
  if (state.mode === "adaptive") return "Adaptive";
  return state.mode === "vien" ? "Việt → Anh" : state.mode === "listen" ? "Nghe → Nghĩa" : "Anh → Việt";
}
function updateSettingsSummary() {
  if ($("settingsSummary")) $("settingsSummary").textContent = `${state.sessionSize} từ · ${modeLabel()}`;
}
function renderStartRecommendation() {
  if (!$("continueTitle")) return;
  const pool = getActivePool();
  const due = dueInPool(pool).length;
  const fresh = newInPool(pool).length;
  const weak = weakInPool(pool).length;
  const preview = pickSmartSessionWords();
  const dueSet = new Set(dueInPool(pool).map(x=>keyOf(x.word)));
  const newSet = new Set(newInPool(pool).map(x=>keyOf(x.word)));
  let takeDue=0,takeNew=0,takeWeak=0;
  for (const item of preview) {
    const k=keyOf(item.word);
    if (dueSet.has(k)) takeDue++;
    else if (newSet.has(k)) takeNew++;
    else takeWeak++;
  }
  const known = pool.filter(item=>getMasteredSet().has(keyOf(item.word))).length;
  const pct = pool.length ? Math.round(known/pool.length*100) : 0;
  $("continueTitle").textContent = `Học tiếp ${Math.min(state.sessionSize,pool.length || state.sessionSize)} từ`;
  $("continueSubtitle").textContent = `${activeContextName()} · Adaptive · 40% ôn · 40% mới · 20% yếu`;
  $("mixDue").textContent = takeDue;
  $("mixNew").textContent = takeNew;
  $("mixWeak").textContent = takeWeak;
  $("newWordsHint").textContent = `${fresh} từ chưa học`;
  const wrongCount = pool.filter(item=>(state.wrong[keyOf(item.word)]||0)>0).length;
  $("wrongWordsHint").textContent = `${wrongCount} từ yếu trong nhóm`;
  $("continuePercent").textContent = `${pct}%`;
  $("continueRing").style.background = `conic-gradient(var(--primary) ${pct}%,var(--line) ${pct}%)`;
}
function cachedMeaningFor(item) {
  return offlineByWord.get(keyOf(item.word))?.meaning || "";
}

async function ensureMeaningAt(index) {
  if (index < 0 || index >= currentSession.length) return null;
  const item = currentSession[index];
  if (!item.meaning) item.meaning = offlineByWord.get(keyOf(item.word))?.meaning || "";
  return item;
}
async function ensureQuestionWindow(index) {
  if (!currentSession.length) return;
  const wanted = [];
  for (let i = index; i < currentSession.length && wanted.length < 4; i++) wanted.push(i);
  for (let i = 0; i < currentSession.length && wanted.length < 4; i++) {
    if (!wanted.includes(i)) wanted.push(i);
  }
  await Promise.all(wanted.map(ensureMeaningAt));
}
function backgroundPrefetchAssets(index, token) {
  const run = async () => {
    if (token !== sessionPreloadToken) return;
    const targets = [index, index+1].filter(i=>i>=0 && i<currentSession.length);
    for (const i of targets) {
      if (token !== sessionPreloadToken) return;
      const item = currentSession[i];
      try { item.lex = item.lex || await getLexicalData(item.word); } catch (_) {}
    }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(()=>run(), {timeout:1200});
  else setTimeout(()=>run(), 500);
}
async function prepareSession(words, kind="normal") {
  if (!words.length) return alert("Chưa có từ phù hợp trong nhóm này.");
  sessionKind = kind;
  const token = ++sessionPreloadToken;
  currentSession = words.map(item => {
    const local = offlineByWord.get(keyOf(item.word)) || {};
    return {
      ...item,
      meaning: local.meaning || item.meaning || "",
      ipa: local.ipa || item.ipa || "",
      pos: local.pos || item.pos || "",
      example: local.example || item.example || "",
      exampleVi: local.exampleVi || item.exampleVi || "",
      lex: {
        ipa: local.ipa || item.ipa || "",
        us:"", uk:"", generic:"",
        pos: local.pos || item.pos || "",
        definition: local.meaning || item.meaning || "",
        example: local.example || item.example || "",
        exampleVi: local.exampleVi || item.exampleVi || ""
      }
    };
  });
  currentIndex = 0;
  score = 0;
  wrongThisSession = [];
  sessionMasteredBefore = getMasteredSet().size;
  resultWordsExpanded = false;

  const readyCount = currentSession.filter(x=>x.meaning).length;
  if (readyCount < Math.min(4,currentSession.length)) {
    showView("loadingView");
    $("loadingText").textContent = "Chuẩn bị câu đầu tiên…";
    await ensureQuestionWindow(0);
  }
  if (token !== sessionPreloadToken) return;
  renderQuestion();
  showView("quizView");
  backgroundPrefetchAssets(0, token);
}
async function startNormalSession() {
  if (!vocab.length) await loadVocabulary();
  await prepareSession(pickSessionWords(),"normal");
}
async function startSmartSession() {
  if (!vocab.length) await loadVocabulary();
  const words = pickSmartSessionWords();
  if (!words.length) return alert("Nhóm này chưa có từ để học.");
  await prepareSession(words,"smart");
}
async function startNewWordsSession() {
  if (!vocab.length) await loadVocabulary();
  const words = pickNewWords();
  if (!words.length) return alert("Nhóm này không còn từ mới. Bạn có thể bấm Học tiếp để ôn và củng cố.");
  await prepareSession(words,"new");
}
async function startDueReview() {
  if (!vocab.length) await loadVocabulary();
  const words = pickDueWords();
  if (!words.length) return alert(`${activeContextName()} hiện chưa có từ đến hạn ôn.`);
  await prepareSession(words,"due");
}
async function startWrongReview() {
  if (!vocab.length) await loadVocabulary();
  const words = pickWrongWords();
  if (!words.length) return alert(`${activeContextName()} hiện chưa có từ sai để ôn.`);
  await prepareSession(words,"wrong");
}
function resetPronunciationUi(conceal) {
  $("pronunciationBox").classList.toggle("concealed",!!conceal);
  $("ipaText").textContent = "Đang tìm IPA…";
  $("ipaText").classList.remove("is-missing");
  ["audioUsBtn","audioUkBtn","audioDictBtn","audioTtsBtn"].forEach(id=>$(id).classList.add("hidden"));
}
async function fillPronunciationUi(item,reveal=true) {
  resetPronunciationUi(!reveal);
  const expected = keyOf(item.word);
  let p = item.lex || await getLexicalData(item.word);
  if (navigator.onLine && (!p.ipa || !(p.us || p.uk || p.generic))) {
    const online = await fetchOnlineAudioData(item.word);
    p = {...p, ...online, ipa: online.ipa || p.ipa || ""};
    item.lex = {...(item.lex || {}), ...p};
  }
  if (!currentSession[currentIndex] || keyOf(currentSession[currentIndex].word)!==expected) return;
  $("ipaText").textContent = p.ipa || "Chưa có IPA";
  $("ipaText").classList.toggle("is-missing", !p.ipa);
  $("audioUsBtn").classList.toggle("hidden",!p.us);
  $("audioUkBtn").classList.toggle("hidden",!p.uk);
  $("audioDictBtn").classList.toggle("hidden",!p.generic || !!p.us || !!p.uk);
  $("audioTtsBtn").classList.toggle("hidden",!!(p.us||p.uk||p.generic));
  $("audioUsBtn").onclick=()=>playBestPronunciation(item,"us");
  $("audioUkBtn").onclick=()=>playBestPronunciation(item,"uk");
  $("audioDictBtn").onclick=()=>playBestPronunciation(item,"generic");
  $("audioTtsBtn").onclick=()=>ttsSpeak(item.word);
}
function revealPronunciation(item) {
  $("pronunciationBox").classList.remove("concealed");
  fillPronunciationUi(item,true);
}
function addAnswer(label,isCorrect,item) {
  const b=document.createElement("button");
  b.className="answer";
  b.textContent=label;
  b.onclick=()=>chooseAnswer(b,isCorrect,item);
  $("answers").appendChild(b);
}
function setAdaptiveBadge(item) {
  const badge=$("adaptiveStageLabel");
  if (!badge) return;
  const stage=adaptiveStage(item);
  badge.textContent = state.mode === "adaptive" ? adaptiveStageText(stage) : modeLabel();
  badge.className = "adaptive-stage-badge " + (stage === "learning" ? "stage-learning" : stage === "remembering" ? "stage-remembering" : stage === "strong" ? "stage-strong" : stage === "weak" ? "stage-weak" : "");
}
function resetTypingUi() {
  typingHintUsed=false;
  $("typingBox")?.classList.add("hidden");
  if ($("typingAnswerInput")) {
    $("typingAnswerInput").value="";
    $("typingAnswerInput").disabled=false;
    $("typingAnswerInput").classList.remove("correct","wrong");
  }
  if ($("checkTypingBtn")) $("checkTypingBtn").disabled=false;
  if ($("typingHintText")) $("typingHintText").textContent="";
}
function renderQuestion() {
  answered=false;
  $("feedback").className="feedback feedback-banner";
  $("feedback").textContent="";
  $("wordDetail").classList.add("hidden");
  $("nextBtn").classList.add("hidden");
  $("nextBar")?.classList.add("hidden");
  resetTypingUi();
  const item=currentSession[currentIndex];
  if (!item?.meaning) {
    ensureQuestionWindow(currentIndex).then(()=>renderQuestion()).catch(()=>{});
    return;
  }
  currentQuestionMode = chooseAdaptiveQuestionMode(item,currentIndex);
  const total=currentSession.length;
  $("quizProgressBar").style.width=`${currentIndex/total*100}%`;
  $("quizProgressText").textContent=`${currentIndex+1}/${total}`;
  $("scoreValue").textContent=score;
  const kindText=sessionKind==="due" ? "Ôn đến hạn" : sessionKind==="wrong" ? "Ôn từ sai" : sessionKind==="new" ? "Từ mới" : sessionKind==="smart" ? "Adaptive" : "";
  $("contextLabel").textContent=kindText ? `${activeContextName()} · ${kindText}` : activeContextName();
  $("posLabel").textContent=item.pos || item.lex?.pos || "word";
  setAdaptiveBadge(item);
  $("answers").innerHTML="";
  $("listenMainBtn").classList.toggle("hidden",currentQuestionMode!=="listen");
  const options=fisherYates([item,...makeDistractors(item)]);
  if (currentQuestionMode==="envi") {
    $("promptLabel").textContent="Chọn nghĩa tiếng Việt đúng";
    $("questionWord").textContent=item.word;
    options.forEach(opt=>addAnswer(opt.meaning,opt.word===item.word,item));
    fillPronunciationUi(item,true);
  } else if (currentQuestionMode==="vien") {
    $("promptLabel").textContent="Chọn từ tiếng Anh đúng";
    $("questionWord").textContent=item.meaning;
    options.forEach(opt=>addAnswer(opt.word,opt.word===item.word,item));
    fillPronunciationUi(item,false);
  } else if (currentQuestionMode==="listen") {
    $("promptLabel").textContent="Nghe rồi chọn nghĩa đúng";
    $("questionWord").textContent="🎧";
    options.forEach(opt=>addAnswer(opt.meaning,opt.word===item.word,item));
    fillPronunciationUi(item,false);
    setTimeout(()=>playBestPronunciation(item),260);
  } else {
    $("promptLabel").textContent="Nhìn nghĩa và tự gõ từ tiếng Anh";
    $("questionWord").textContent=item.meaning;
    $("answers").innerHTML="";
    $("typingBox").classList.remove("hidden");
    fillPronunciationUi(item,false);
    setTimeout(()=>$("typingAnswerInput")?.focus(),120);
  }
  $("listenMainBtn").onclick=()=>playBestPronunciation(item);
}
async function showWordDetail(item,card,isCorrect) {
  $("wordDetail").classList.remove("hidden");
  $("detailWord").textContent=item.word;
  $("detailPos").textContent=item.pos || item.lex?.pos || "word";
  $("detailMeaning").textContent=item.meaning;
  $("detailAudioBtn").onclick=()=>playBestPronunciation(item);
  const example = item.example || item.lex?.example || offlineByWord.get(keyOf(item.word))?.example || "";
  const exampleBox = $("detailExampleEn").closest(".example-box");
  if (!example) {
    exampleBox?.classList.add("hidden");
  } else {
    exampleBox?.classList.remove("hidden");
    $("detailExampleEn").textContent=example;
    $("detailExampleVi").textContent=item.exampleVi || item.lex?.exampleVi || "";
  }
  const interval = Math.max(0,Math.round((new Date(card.due+"T00:00:00")-new Date(localDateString()+"T00:00:00"))/86400000));
  $("srsNote").textContent = isCorrect
    ? (interval===0 ? "SRS: sẽ ôn lại sớm." : `SRS: lịch ôn tiếp theo sau khoảng ${interval} ngày.`)
    : "SRS: trả lời sai nên từ này được đưa về ôn lại sớm.";
}
async function chooseAnswer(button,isCorrect,item) {
  if (answered) return;
  answered=true;
  const buttons=[...document.querySelectorAll(".answer")];
  buttons.forEach(btn=>btn.disabled=true);
  if (currentQuestionMode!=="envi") revealPronunciation(item);
  const correctText=currentQuestionMode==="vien" ? item.word : item.meaning;
  if (isCorrect) {
    score++;
    button.classList.add("correct");
    $("feedback").className="feedback feedback-banner ok";
    $("feedback").textContent="✓ Chính xác";
  } else {
    button.classList.add("wrong");
    wrongThisSession.push(item);
    const correctButton=buttons.find(x=>x.textContent===correctText);
    if (correctButton) correctButton.classList.add("correct");
    $("feedback").className="feedback feedback-banner bad";
    $("feedback").textContent="✕ Chưa đúng — đáp án đúng đã được đánh dấu";
  }
  const card=recordAnswer(item,isCorrect,currentQuestionMode);
  $("scoreValue").textContent=score;
  $("nextBtn").classList.remove("hidden");
  $("nextBar")?.classList.remove("hidden");
  $("nextBtn").textContent=currentIndex===currentSession.length-1 ? "Xem kết quả" : "Tiếp tục";
  showWordDetail(item,card,isCorrect).catch(()=>{});
}
function submitTypingAnswer() {
  if (answered) return;
  const item=currentSession[currentIndex];
  const input=$("typingAnswerInput");
  const value=input?.value || "";
  if (!value.trim()) {
    $("typingHintText").textContent="Hãy nhập một đáp án trước.";
    input?.focus();
    return;
  }
  const ok=typingIsCorrect(value,item);
  answered=true;
  input.disabled=true;
  $("checkTypingBtn").disabled=true;
  input.classList.add(ok ? "correct" : "wrong");
  revealPronunciation(item);
  if (ok) {
    score++;
    $("feedback").className="feedback feedback-banner ok";
    $("feedback").textContent="✓ Chính xác";
  } else {
    wrongThisSession.push(item);
    $("feedback").className="feedback feedback-banner bad";
    $("feedback").textContent=`✕ Đáp án đúng: ${item.word}`;
  }
  const card=recordAnswer(item,ok,"type");
  $("scoreValue").textContent=score;
  $("nextBtn").classList.remove("hidden");
  $("nextBar")?.classList.remove("hidden");
  $("nextBtn").textContent=currentIndex===currentSession.length-1 ? "Xem kết quả" : "Tiếp tục";
  showWordDetail(item,card,ok).catch(()=>{});
}
function showTypingHint() {
  if (answered) return;
  const item=currentSession[currentIndex];
  const word=String(item?.word||"");
  if (!word) return;
  typingHintUsed=true;
  const parts=word.split(/\s+/).map(part=>part ? part[0] + "•".repeat(Math.max(0,part.length-1)) : "");
  $("typingHintText").textContent=`Gợi ý: ${parts.join(" ")} · ${word.length} ký tự`;
  $("typingAnswerInput")?.focus();
}
async function nextQuestion() {
  if (!answered) return;
  if (currentIndex < currentSession.length-1) {
    const nextIndex = currentIndex + 1;
    const oldText = $("nextBtn").textContent;
    $("nextBtn").disabled = true;
    $("nextBtn").textContent = "Đang mở câu tiếp…";
    await ensureQuestionWindow(nextIndex);
    currentIndex = nextIndex;
    $("nextBtn").disabled = false;
    $("nextBtn").textContent = oldText;
    renderQuestion();
    backgroundPrefetchAssets(currentIndex, sessionPreloadToken);
  } else showResult();
}
function daysUntilDate(dateString) {
  if (!dateString) return null;
  const today = new Date(localDateString()+"T00:00:00");
  const due = new Date(dateString+"T00:00:00");
  return Math.round((due-today)/86400000);
}
function sessionKindLabel() {
  if (sessionKind === "due") return `${activeContextName()} · Ôn đến hạn`;
  if (sessionKind === "wrong") return `${activeContextName()} · Ôn từ sai`;
  if (sessionKind === "new") return `${activeContextName()} · Học từ mới`;
  if (sessionKind === "smart") return `${activeContextName()} · Học thông minh`;
  return activeContextName();
}
function dueLabelForWord(word) {
  const card = state.srs[keyOf(word)];
  const days = daysUntilDate(card?.due);
  if (days === null) return "Chưa xếp lịch";
  if (days <= 0) return "Ôn lại ngay";
  if (days === 1) return "Ngày mai";
  return `${days} ngày nữa`;
}
function renderResultWords() {
  const box = $("resultWordsList");
  if (!box) return;
  const wrongSet = new Set(wrongThisSession.map(x=>keyOf(x.word)));
  box.innerHTML = "";
  currentSession.forEach((item,index)=>{
    const isWrong = wrongSet.has(keyOf(item.word));
    const row = document.createElement("div");
    row.className = "result-word-row" + (!resultWordsExpanded && index >= 5 ? " is-hidden" : "");
    const status = document.createElement("span");
    status.className = `result-word-status ${isWrong ? "wrong":"correct"}`;
    status.textContent = isWrong ? "↻":"✓";
    const main = document.createElement("div");
    main.className = "result-word-main";
    const word = document.createElement("strong");
    word.textContent = item.word;
    const meaning = document.createElement("small");
    meaning.textContent = item.meaning || offlineByWord.get(keyOf(item.word))?.meaning || "";
    main.append(word,meaning);
    const due = document.createElement("span");
    due.className = "result-word-due";
    due.textContent = dueLabelForWord(item.word);
    row.append(status,main,due);
    box.appendChild(row);
  });
  $("resultWordsCount").textContent = `${currentSession.length} từ`;
  const toggle = $("toggleResultWordsBtn");
  toggle.classList.toggle("hidden",currentSession.length <= 5);
  toggle.textContent = resultWordsExpanded ? "Thu gọn" : `Xem cả ${currentSession.length}`;
}
function resultReviewSummary(wrongCount) {
  if (wrongCount > 0) return `${wrongCount} từ sai cần ôn lại ngay.`;
  const entries = currentSession.map(item=>({
    item,
    days: daysUntilDate(state.srs[keyOf(item.word)]?.due)
  })).filter(x=>x.days!==null).sort((a,b)=>a.days-b.days);
  if (!entries.length) return "Lịch ôn đã được cập nhật.";
  const first = entries[0].days;
  const count = entries.filter(x=>x.days===first).length;
  if (first <= 0) return `${count} từ đang đến hạn ôn.`;
  if (first === 1) return `${count} từ sẽ quay lại vào ngày mai.`;
  return `${count} từ sẽ quay lại sau ${first} ngày.`;
}
function showResult() {
  $("quizProgressBar").style.width="100%";
  const total = currentSession.length || 1;
  const wrongCount = total-score;
  const percent = Math.round(score/total*100);
  const masteredNow=getMasteredSet().size;
  const masteredDelta = Math.max(0,masteredNow-sessionMasteredBefore);
  $("resultSessionLabel").textContent = sessionKindLabel();
  $("resultPercent").textContent = `${percent}%`;
  $("resultScoreRing").style.background = `conic-gradient(var(--success) ${percent}%,var(--line) ${percent}%)`;
  $("resultCorrect").textContent = `${score}/${total}`;
  $("resultMasteredDelta").textContent = `+${masteredDelta}`;
  $("resultStreak").textContent = state.stats?.streak || 0;
  $("resultTotalMastered").textContent = `Tổng ${masteredNow}/${vocab.length} từ đã thuộc`;
  $("resultReviewText").textContent = resultReviewSummary(wrongCount);
  $("resultTitle").textContent = `${score}/${total} câu đúng`;
  if (percent === 100) {
    $("resultEmoji").textContent="🏆";
    $("resultText").textContent="Hoàn thành trọn vẹn. Lịch ôn đã được giãn phù hợp.";
  } else if (percent >= 70) {
    $("resultEmoji").textContent="🎉";
    $("resultText").textContent=`${wrongCount} từ cần củng cố thêm trong lần ôn tới.`;
  } else {
    $("resultEmoji").textContent="💪";
    $("resultText").textContent="Các từ chưa chắc đã được đưa về lịch ôn sớm.";
  }
  $("continueLearningBtn").textContent = `Học tiếp ${state.sessionSize} từ →`;
  $("retryWrongBtn").classList.toggle("hidden",wrongThisSession.length===0);
  if (wrongThisSession.length) $("retryWrongBtn").textContent = `Ôn lại ${wrongThisSession.length} từ sai`;
  renderResultWords();
  showView("resultView");
}
function applyTheme() {
  document.body.classList.toggle("dark",!!state.dark);
  $("themeBtn").textContent=state.dark ? "🌙":"☀️";
}
function restoreChoices() {
  if (!["adaptive","envi","vien","listen"].includes(state.mode)) state.mode="adaptive";
  document.querySelectorAll("#sizeChoices .choice, #topicSizeChoices .choice").forEach(x=>x.classList.toggle("active",Number(x.dataset.size)===state.sessionSize));
  document.querySelectorAll("#modeChoices .mode-card, #topicModeChoices .mode-card").forEach(x=>x.classList.toggle("active",x.dataset.mode===state.mode));
}
document.querySelectorAll("#sizeChoices .choice, #topicSizeChoices .choice").forEach(btn=>{
  btn.onclick=()=>{
    state.sessionSize=Number(btn.dataset.size);
    saveState();
    restoreChoices();
    renderStartRecommendation();
    updateSettingsSummary();
    renderTopicLearningDetail();
  };
});
document.querySelectorAll("#modeChoices .mode-card, #topicModeChoices .mode-card").forEach(btn=>{
  btn.onclick=()=>{
    state.mode=btn.dataset.mode;
    saveState();
    restoreChoices();
    renderStartRecommendation();
    updateSettingsSummary();
    renderTopicLearningDetail();
  };
});
document.querySelectorAll(".browse-tab").forEach(btn=>{
  btn.onclick=()=>{
    state.browseMode=btn.dataset.browse;
    saveState();
    renderHome();
  };
});
$("topicSearch").addEventListener("input",e=>renderTopics(e.target.value));
$("topicLearningSearch")?.addEventListener("input",e=>renderTopicLearning(e.target.value));
$("themeBtn").onclick=()=>{state.dark=!state.dark;saveState();applyTheme();};
$("startBtn").onclick=startNormalSession;
$("continueBtn").onclick=startSmartSession;
$("newWordsBtn").onclick=startNewWordsSession;
$("startDueBtn").onclick=startDueReview;
$("reviewWrongBtn").onclick=startWrongReview;
$("openTopicLearningBtn")?.addEventListener("click",()=>{
  state.browseMode="topic";
  saveState();
  renderHome();
  showView("topicView");
});
$("openAllTopicsBtn")?.addEventListener("click",()=>{
  state.browseMode="topic";
  saveState();
  renderHome();
  showView("topicView");
});
$("topicBackBtn")?.addEventListener("click",()=>{renderHome();showView("homeView");});
$("topicStartBtn")?.addEventListener("click",()=>{state.browseMode="topic";saveState();startSmartSession();});
$("topicNewBtn")?.addEventListener("click",()=>{state.browseMode="topic";saveState();startNewWordsSession();});
$("topicDueBtn")?.addEventListener("click",()=>{state.browseMode="topic";saveState();startDueReview();});
$("topicWrongBtn")?.addEventListener("click",()=>{state.browseMode="topic";saveState();startWrongReview();});
$("openSentenceLearningBtn")?.addEventListener("click",()=>{sentenceSelectedTopicId=sentenceProgress.lastTopicId||sentenceTopicList[0]?.id||"";renderSentenceHub();showView("sentenceView");});
$("sentenceBackBtn")?.addEventListener("click",()=>{renderHome();showView("homeView");});
$("sentenceStudyBackBtn")?.addEventListener("click",()=>{renderSentenceHub();showView("sentenceView");});
$("sentenceQuizBackBtn")?.addEventListener("click",()=>{renderSentenceHub();showView("sentenceView");});
$("dialogueBackBtn")?.addEventListener("click",()=>{renderSentenceHub();showView("sentenceView");});
$("sentenceTopicSearch")?.addEventListener("input",e=>renderSentenceTopics(e.target.value));
$("sentenceAllTopicsBtn")?.addEventListener("click",()=>{sentenceSelectedTopicId="__all__";renderSentenceHub();});
document.querySelectorAll("#sentenceModeChoices .sentence-mode-card").forEach(btn=>btn.onclick=()=>{sentenceMode=btn.dataset.sentenceMode;renderSentenceHub();});
document.querySelectorAll("#sentenceSizeChoices .choice").forEach(btn=>btn.onclick=()=>{sentenceProgress.sentenceSize=Number(btn.dataset.sentenceSize);saveSentenceProgress();renderSentenceHub();});
$("sentenceStartBtn")?.addEventListener("click",beginSentenceMode);
$("sentenceRevealBtn")?.addEventListener("click",()=>{$("sentenceMeaningBox").classList.remove("hidden");$("sentenceRevealBtn").classList.add("hidden");});
$("sentenceStudyAudioBtn")?.addEventListener("click",()=>{const item=sentenceSession[sentenceIndex];if(item)ttsSpeak(item.en);});
$("sentenceUnderstandBtn")?.addEventListener("click",()=>answerSentenceStudy(true));
$("sentenceNotYetBtn")?.addEventListener("click",()=>answerSentenceStudy(false));
$("sentenceListenPromptBtn")?.addEventListener("click",()=>{const item=sentenceSession[sentenceIndex];if(item)ttsSpeak(item.en);});
$("sentenceQuizNextBtn")?.addEventListener("click",nextSentenceQuiz);
$("dialogueTranslationBtn")?.addEventListener("click",toggleDialogueTranslation);
$("dialogueNextBtn")?.addEventListener("click",nextDialogue);
$("sentenceResultCloseBtn")?.addEventListener("click",()=>{renderSentenceHub();showView("sentenceView");});
$("sentenceResultContinueBtn")?.addEventListener("click",beginSentenceMode);
$("sentenceResultTopicsBtn")?.addEventListener("click",()=>{renderSentenceHub();showView("sentenceView");});
$("sentenceResultHomeBtn")?.addEventListener("click",()=>{renderHome();showView("homeView");});
$("nextBtn").onclick=nextQuestion;
$("backBtn").onclick=()=>{renderHome();showView("homeView");};
$("homeBtn").onclick=()=>{renderHome();showView("homeView");};
$("resultCloseBtn").onclick=()=>{renderHome();showView("homeView");};
$("continueLearningBtn").onclick=startSmartSession;
$("toggleResultWordsBtn").onclick=()=>{resultWordsExpanded=!resultWordsExpanded;renderResultWords();};
$("retryWrongBtn").onclick=async()=>{
  const uniq=[];
  const seen=new Set();
  for (const item of wrongThisSession) {
    const k=keyOf(item.word);
    if (!seen.has(k)) {seen.add(k);uniq.push(item);}
  }
  if (uniq.length) await prepareSession(uniq,"wrong");
};
if ($("checkTypingBtn")) $("checkTypingBtn").onclick=submitTypingAnswer;
if ($("typingHintBtn")) $("typingHintBtn").onclick=showTypingHint;
if ($("typingAnswerInput")) $("typingAnswerInput").addEventListener("keydown",e=>{if(e.key==="Enter") submitTypingAnswer();});

todayStatsReset();
applyTheme();
restoreChoices();
loadVocabulary();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
