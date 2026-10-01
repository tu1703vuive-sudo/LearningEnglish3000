const OFFLINE_PACK_SOURCE = "./data/vocab-3000-clean.json";
const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const TARGET_WORDS = 3000;
const STAGE_SIZE = 100;
const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30];


const $ = id => document.getElementById(id);
const keyOf = word => String(word || "").trim().toLowerCase();
const shuffled = arr => [...arr].sort(() => Math.random() - .5);

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function addDaysString(dateString, days) {
  const [y,m,d] = dateString.split("-").map(Number);
  const date = new Date(y, m-1, d);
  date.setDate(date.getDate()+days);
  return localDateString(date);
}

const defaultState = {
  dataVersion:"3.1.4-clean-3pdf",
  selectedStage:1,
  selectedTopicId:1,
  selectedLevel:"A1",
  browseMode:"topic",
  sessionSize:10,
  mode:"envi",
  mastered:[],
  wrong:{},
  seen:{},
  meaningCache:{},
  pronCache:{},
  lexCache:{},
  exampleViCache:{},
  srs:{},
  stats:{ lastStudyDate:"", streak:0, totalAnswers:0, todayDate:"", todayAnswers:0, todayCorrect:0 },
  dark:false
};

let state = { ...defaultState, ...JSON.parse(localStorage.getItem("english3000State") || "{}") };
for (const k of ["wrong","seen","meaningCache","pronCache","lexCache","exampleViCache","srs"]) state[k] ||= {};
state.mastered ||= [];
state.stats = { ...defaultState.stats, ...(state.stats || {}) };
if (state.dataVersion !== "3.1.4-clean-3pdf") {
  state.dataVersion = "3.1.4-clean-3pdf";
  state.selectedTopicId = 1;
  if (state.browseMode === "level") state.browseMode = "topic";
}
if (state.browseMode === "level") state.browseMode = "topic";

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
let meaningJobs = new Map();
let sessionPreloadToken = 0;

function saveState() { localStorage.setItem("english3000State", JSON.stringify(state)); }
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(id).classList.add("active");
  document.body.classList.toggle("result-mode", id === "resultView");
  window.scrollTo({top:0,behavior:"smooth"});
}
function todayStatsReset() {
  const today = localDateString();
  if (state.stats.todayDate !== today) {
    state.stats.todayDate = today;
    state.stats.todayAnswers = 0;
    state.stats.todayCorrect = 0;
  }
}
function registerStudyDay() {
  const today = localDateString();
  todayStatsReset();
  if (state.stats.lastStudyDate === today) return;
  const yesterday = addDaysString(today, -1);
  state.stats.streak = state.stats.lastStudyDate === yesterday ? state.stats.streak + 1 : 1;
  state.stats.lastStudyDate = today;
}
function migrateSrs() {
  const today = localDateString();
  for (const word of state.mastered) {
    const k = keyOf(word);
    if (!state.srs[k]) state.srs[k] = { box:4, due:addDaysString(today,14), correct:2, wrong:0, last:today };
  }
  for (const [word,count] of Object.entries(state.wrong || {})) {
    const k = keyOf(word);
    if (count > 0 && !state.srs[k]) state.srs[k] = { box:0, due:today, correct:0, wrong:count, last:today };
  }
  saveState();
}

async function fetchJson(url) {
  const r = await fetch(url, {cache:"force-cache"});
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}


function applyOfflinePack(pack) {
  offlinePack = pack;
  const rawWords = Array.isArray(pack?.words) ? pack.words : [];
  offlineByWord = new Map(rawWords.map(item => [keyOf(item.word), item]));
  vocab = rawWords.map(item => ({
    word: item.word,
    level: "unknown",
    topics: Array.isArray(item.topicIds) ? item.topicIds : [],
    meaning: item.meaning || "",
    ipa: item.ipa || "",
    pos: item.pos || "",
    example: item.example || "",
    exampleVi: item.exampleVi || "",
    sourceKind: item.sourceKind || "primary"
  }));
  vocabByKey = new Map(vocab.map(item => [keyOf(item.word), item]));
  topics = (pack?.topics || []).map(topic => ({
    id: topic.id,
    name: topic.name || topic.nameVi || `Chủ đề ${topic.id}`,
    nameVi: topic.nameVi || topic.name || `Chủ đề ${topic.id}`,
    words: (topic.words || []).map(keyOf).filter(k => vocabByKey.has(k))
  }));
  const nonEmpty = topics.find(t => t.words.length);
  const selected = topics.find(t => t.id === state.selectedTopicId);
  if ((!selected || !selected.words.length) && nonEmpty) state.selectedTopicId = nonEmpty.id;
}

async function loadOfflinePack() {
  try {
    const response = await fetch(OFFLINE_PACK_SOURCE, {cache:"no-cache"});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const pack = await response.json();
    if (!Array.isArray(pack?.words) || pack.words.length !== 3000) throw new Error("Database không đủ 3000 từ sạch");
    applyOfflinePack(pack);
    return pack;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function updateOfflinePackStatus() {
  const card = $("offlinePackCard");
  if (!card) return;
  const count = offlinePack?.words?.length || 0;
  const excluded = offlinePack?.meta?.excludedReviewCount ?? 0;
  const full = count === 3000;
  card.classList.toggle("ready", full);
  card.classList.toggle("seed", !full);
  $("offlinePackCount").textContent = `${count}/3000`;
  if (full) {
    $("offlinePackStatus").textContent = "Database Quiz sạch đã sẵn sàng";
    $("offlinePackHint").textContent = `${excluded} mục nghi ngờ của nguồn gốc đã bị loại khỏi Quiz; nghĩa + IPA + từ loại chạy local.`;
  } else {
    $("offlinePackStatus").textContent = "Không tải được database sạch";
    $("offlinePackHint").textContent = "Kiểm tra file data/vocab-3000-clean.json. App không tự chuyển sang database cũ để tránh học sai nghĩa.";
  }
}

async function loadVocabulary() {
  const localPack = await loadOfflinePack();
  if (!localPack) {
    vocab = [];
    topics = [];
    vocabByKey = new Map();
    updateOfflinePackStatus();
    renderHome();
    return;
  }
  migrateSrs();
  renderHome();
  updateOfflinePackStatus();
}


async function translateWord(word) {
  const local = offlineByWord.get(keyOf(word));
  return local?.meaning || "";
}

function normalizeAudioUrl(url) {
  if (!url) return "";
  return url.startsWith("//") ? "https:" + url : url;
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

async function fetchOnlineAudioData(word) {
  const k = keyOf(word);
  const cached = state.lexCache[k] || {};
  if (cached.us || cached.uk || cached.generic) return cached;
  if (!navigator.onLine) return cached;
  const result = {...cached};
  try {
    const r = await fetch(DICTIONARY_API + encodeURIComponent(word), {cache:"force-cache"});
    if (!r.ok) return result;
    const data = await r.json();
    for (const entry of (Array.isArray(data) ? data : [])) {
      for (const p of entry.phonetics || []) {
        const audio = normalizeAudioUrl(p.audio);
        if (!audio) continue;
        const low = audio.toLowerCase();
        if (!result.us && (low.includes("-us.") || low.includes("_us.") || low.includes("us.mp3"))) result.us = audio;
        else if (!result.uk && (low.includes("-uk.") || low.includes("_uk.") || low.includes("uk.mp3"))) result.uk = audio;
        else if (!result.generic) result.generic = audio;
      }
    }
    state.lexCache[k] = result;
    saveState();
  } catch (_) {}
  return result;
}

function ttsSpeak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = .82;
  speechSynthesis.speak(u);
}
function playUrl(url, fallbackWord) {
  if (!url) return ttsSpeak(fallbackWord);
  const audio = new Audio(url);
  audio.play().catch(() => ttsSpeak(fallbackWord));
}
async function playBestPronunciation(item, dialect="best") {
  let p = await getLexicalData(item.word);
  if (!(p.us || p.uk || p.generic) && navigator.onLine) {
    p = {...p, ...(await fetchOnlineAudioData(item.word))};
  }
  if (dialect === "us" && p.us) return playUrl(p.us,item.word);
  if (dialect === "uk" && p.uk) return playUrl(p.uk,item.word);
  if (dialect === "generic" && p.generic) return playUrl(p.generic,item.word);
  playUrl(p.us || p.uk || p.generic, item.word);
}

function findItem(k) { return vocabByKey.get(keyOf(k)) || null; }
function topicLabel(topic) { return topic.nameVi || topic.name || `Chủ đề ${topic.id}`; }
function getMasteredSet() { return new Set(state.mastered || []); }

function srsFor(word) {
  const k = keyOf(word);
  return state.srs[k] || null;
}
function dueKeys() {
  const today = localDateString();
  return Object.entries(state.srs)
    .filter(([,v]) => v?.due && v.due <= today)
    .map(([k]) => k);
}
function recordAnswer(item, isCorrect) {
  const k = keyOf(item.word);
  const today = localDateString();
  registerStudyDay();
  todayStatsReset();

  let card = state.srs[k] || {box:0,due:today,correct:0,wrong:0,last:""};
  if (isCorrect) {
    card.correct = (card.correct || 0) + 1;
    card.box = Math.min(5, (card.box || 0) + 1);
    card.due = addDaysString(today, REVIEW_INTERVALS[card.box] ?? 30);
    state.wrong[k] = Math.max(0,(state.wrong[k] || 0)-1);
    if (card.box >= 4 && !state.mastered.includes(k)) state.mastered.push(k);
  } else {
    card.wrong = (card.wrong || 0) + 1;
    card.box = Math.max(0,(card.box || 0)-2);
    card.due = today;
    state.wrong[k] = (state.wrong[k] || 0) + 1;
    if (card.box < 4) state.mastered = state.mastered.filter(x => x !== k);
  }
  card.last = today;
  state.srs[k] = card;
  state.seen[k] = (state.seen[k] || 0) + 1;
  state.stats.totalAnswers = (state.stats.totalAnswers || 0) + 1;
  state.stats.todayAnswers = (state.stats.todayAnswers || 0) + 1;
  if (isCorrect) state.stats.todayCorrect = (state.stats.todayCorrect || 0) + 1;
  saveState();
  return card;
}

function getActivePool() {
  if (state.browseMode === "topic") {
    const topic = topics.find(t=>t.id===state.selectedTopicId) || topics.find(t=>t.words.length);
    return (topic?.words || []).map(findItem).filter(Boolean);
  }
  return vocab.slice((state.selectedStage-1)*STAGE_SIZE, state.selectedStage*STAGE_SIZE);
}
function activeContextName() {
  if (state.browseMode === "topic") {
    const topic = topics.find(t=>t.id===state.selectedTopicId);
    return topic ? topicLabel(topic) : "Chủ đề";
  }
  return `Chặng ${state.selectedStage}`;
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
    b.onclick = () => { state.selectedTopicId=topic.id; saveState(); renderHome(); };
    grid.appendChild(b);
  }
  if (!matches.length) grid.innerHTML = '<p class="muted small">Không tìm thấy chủ đề.</p>';
}
function renderStages() {
  const grid = $("stageGrid");
  grid.innerHTML = "";
  const mastered = getMasteredSet();
  for (let i=1;i<=30;i++) {
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
  const pct = vocab.length ? Math.min(100,Math.round(masteredCount/vocab.length*100)) : 0;
  $("totalPercent").textContent = pct+"%";
  $("totalProgress").style.width = pct+"%";
  const allDueCount = dueKeys().filter(k=>findItem(k)).length;
  if ($("dueStatCount")) $("dueStatCount").textContent = allDueCount;
  if ($("dueCount")) $("dueCount").textContent = allDueCount;
  $("streakCount").textContent = state.stats.streak || 0;
  $("todayCount").textContent = state.stats.todayAnswers || 0;

  renderBrowseMode();
  renderTopics($("topicSearch")?.value || "");
  renderStages();

  const pool = getActivePool();
  $("selectionSummary").textContent = activeContextName();
  $("selectionCount").textContent = `${pool.length} từ`;
  renderStartRecommendation();
  updateSettingsSummary();
  saveState();
}

function isNewWord(item) {
  return !state.srs[keyOf(item.word)] && !(state.seen[keyOf(item.word)] > 0);
}
function isWeakWord(item) {
  const k = keyOf(item.word);
  const card = state.srs[k];
  return !!card && ((state.wrong[k] || 0) > 0 || (card.box || 0) <= 2);
}
function dueInPool(pool) {
  const today = localDateString();
  return pool.filter(item => state.srs[keyOf(item.word)]?.due && state.srs[keyOf(item.word)].due <= today);
}
function newInPool(pool) {
  return pool.filter(isNewWord);
}
function weakInPool(pool) {
  const today = localDateString();
  return pool.filter(item => isWeakWord(item) && !(state.srs[keyOf(item.word)]?.due <= today));
}
function uniqueByWord(items) {
  const seen = new Set();
  return items.filter(item => {
    const k = keyOf(item.word);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function pickSmartSessionWords() {
  const pool = getActivePool();
  const due = dueInPool(pool).sort((a,b)=>(state.wrong[keyOf(b.word)]||0)-(state.wrong[keyOf(a.word)]||0));
  const fresh = shuffled(newInPool(pool));
  const weak = weakInPool(pool).sort((a,b)=>(state.wrong[keyOf(b.word)]||0)-(state.wrong[keyOf(a.word)]||0));
  const rest = [...pool].sort((a,b)=>priorityScore(b)-priorityScore(a));
  return uniqueByWord([...due,...fresh,...weak,...rest]).slice(0,Math.min(state.sessionSize,pool.length));
}
function pickNewWords() {
  const pool = getActivePool();
  return shuffled(newInPool(pool)).slice(0,Math.min(state.sessionSize,pool.length));
}
function modeLabel() {
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
  const takeDue = Math.min(due,state.sessionSize);
  const takeNew = Math.min(fresh,Math.max(0,state.sessionSize-takeDue));
  const takeWeak = Math.min(weak,Math.max(0,state.sessionSize-takeDue-takeNew));
  const known = pool.filter(item=>getMasteredSet().has(keyOf(item.word))).length;
  const pct = pool.length ? Math.round(known/pool.length*100) : 0;

  $("continueTitle").textContent = `Học tiếp ${Math.min(state.sessionSize,pool.length || state.sessionSize)} từ`;
  $("continueSubtitle").textContent = `${activeContextName()} · ${modeLabel()}`;
  $("mixDue").textContent = takeDue;
  $("mixNew").textContent = takeNew;
  $("mixWeak").textContent = takeWeak;
  $("newWordsHint").textContent = `${fresh} từ chưa học`;
  const wrongCount = Object.values(state.wrong || {}).filter(x=>x>0).length;
  $("wrongWordsHint").textContent = `${wrongCount} từ yếu`;
  $("continuePercent").textContent = `${pct}%`;
  $("continueRing").style.background = `conic-gradient(var(--primary) ${pct}%,var(--line) ${pct}%)`;
}

function priorityScore(item) {
  const k = keyOf(item.word);
  const card = state.srs[k];
  const today = localDateString();
  if (card?.due && card.due <= today) return 1000 + (state.wrong[k] || 0) * 10 - (card.box || 0);
  if (!card) return 700;
  return 300 - (card.box || 0) * 20 + (state.wrong[k] || 0) * 10;
}
function pickSessionWords() {
  const pool = getActivePool();
  return [...pool].sort((a,b)=>priorityScore(b)-priorityScore(a)).slice(0,Math.min(state.sessionSize,pool.length));
}
function pickDueWords() {
  const keys = dueKeys();
  return keys.map(findItem).filter(Boolean)
    .sort((a,b)=>(state.wrong[keyOf(b.word)]||0)-(state.wrong[keyOf(a.word)]||0))
    .slice(0,state.sessionSize);
}
function pickWrongWords() {
  return Object.entries(state.wrong)
    .filter(([,count])=>count>0)
    .sort((a,b)=>b[1]-a[1])
    .map(([k])=>findItem(k))
    .filter(Boolean)
    .slice(0,state.sessionSize);
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

async function backgroundPreloadMeanings(token) { return; }

function backgroundPrefetchAssets(index, token) {
  const run = async () => {
    if (token !== sessionPreloadToken) return;
    const targets = [index, index+1].filter(i=>i>=0 && i<currentSession.length);
    for (const i of targets) {
      if (token !== sessionPreloadToken) return;
      const item = currentSession[i];
      // Local/offline lexical data resolves immediately. Online dictionary work is
      // deliberately deferred until after the question is already visible.
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
  meaningJobs.clear();

  // Build the session immediately from local/cache data. Do NOT fetch IPA/audio/
  // examples for all 10–30 words before entering the quiz.
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
  sessionMasteredBefore = state.mastered.length;
  resultWordsExpanded = false;

  // Only wait for enough meanings to draw question 1 + its choices.
  const readyCount = currentSession.filter(x=>x.meaning).length;
  if (readyCount < Math.min(4,currentSession.length)) {
    showView("loadingView");
    $("loadingText").textContent = "Chuẩn bị câu đầu tiên…";
    await ensureQuestionWindow(0);
  }

  if (token !== sessionPreloadToken) return;
  renderQuestion();
  showView("quizView");

  // Everything else happens in the background while the learner answers.
  backgroundPreloadMeanings(token).catch(()=>{});
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
  if (!words.length) return alert("Hôm nay chưa có từ đến hạn ôn.");
  await prepareSession(words,"due");
}
async function startWrongReview() {
  if (!vocab.length) await loadVocabulary();
  const words = pickWrongWords();
  if (!words.length) return alert("Bạn chưa có từ sai để ôn.");
  await prepareSession(words,"wrong");
}

function makeDistractors(item) {
  let pool = currentSession.filter(x =>
    x && x.word !== item.word && x.meaning && x.meaning !== item.meaning
  );
  if (pool.length >= 3) return shuffled(pool).slice(0,3);

  const fallback = vocab
    .filter(x=>x.word!==item.word)
    .map(x=>({ ...x, meaning: cachedMeaningFor(x) }))
    .filter(x=>x.meaning && x.meaning!==item.meaning)
    .slice(0,80);

  return shuffled([...pool,...fallback]).filter((x,i,a)=>
    a.findIndex(y=>keyOf(y.word)===keyOf(x.word))===i
  ).slice(0,3);
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

  // V3.1.2: local pack may have meaning but miss IPA/audio. Enrich only missing
  // pronunciation fields from the dictionary when online, then cache them.
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
function renderQuestion() {
  answered=false;
  $("feedback").className="feedback feedback-banner";
  $("feedback").textContent="";
  $("wordDetail").classList.add("hidden");
  $("nextBtn").classList.add("hidden");
  $("nextBar")?.classList.add("hidden");

  const item=currentSession[currentIndex];
  if (!item?.meaning) {
    ensureQuestionWindow(currentIndex).then(()=>renderQuestion()).catch(()=>{});
    return;
  }
  const total=currentSession.length;
  $("quizProgressBar").style.width=`${currentIndex/total*100}%`;
  $("quizProgressText").textContent=`${currentIndex+1}/${total}`;
  $("scoreValue").textContent=score;
  $("contextLabel").textContent=sessionKind==="due" ? "Ôn đến hạn" : sessionKind==="wrong" ? "Ôn từ sai" : sessionKind==="new" ? "Từ mới" : sessionKind==="smart" ? "Học tiếp" : activeContextName();
  $("posLabel").textContent=item.pos || item.lex?.pos || "word";
  $("answers").innerHTML="";
  $("listenMainBtn").classList.toggle("hidden",state.mode!=="listen");

  const options=shuffled([item,...makeDistractors(item)]);
  if (state.mode==="envi") {
    $("promptLabel").textContent="Chọn nghĩa tiếng Việt đúng";
    $("questionWord").textContent=item.word;
    options.forEach(opt=>addAnswer(opt.meaning,opt.word===item.word,item));
    fillPronunciationUi(item,true);
  } else if (state.mode==="vien") {
    $("promptLabel").textContent="Chọn từ tiếng Anh đúng";
    $("questionWord").textContent=item.meaning;
    options.forEach(opt=>addAnswer(opt.word,opt.word===item.word,item));
    fillPronunciationUi(item,false);
  } else {
    $("promptLabel").textContent="Nghe rồi chọn nghĩa đúng";
    $("questionWord").textContent="🎧";
    options.forEach(opt=>addAnswer(opt.meaning,opt.word===item.word,item));
    fillPronunciationUi(item,false);
    setTimeout(()=>playBestPronunciation(item),280);
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

  if (state.mode!=="envi") revealPronunciation(item);
  const correctText=state.mode==="vien" ? item.word : item.meaning;

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

  const card=recordAnswer(item,isCorrect);
  $("scoreValue").textContent=score;
  $("nextBtn").classList.remove("hidden");
  $("nextBar")?.classList.remove("hidden");
  $("nextBtn").textContent=currentIndex===currentSession.length-1 ? "Xem kết quả" : "Tiếp tục";
  showWordDetail(item,card,isCorrect).catch(()=>{});
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
  if (sessionKind === "due") return "Ôn đến hạn";
  if (sessionKind === "wrong") return "Ôn từ sai";
  if (sessionKind === "new") return "Học từ mới";
  if (sessionKind === "smart") return "Học tiếp thông minh";
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
  const masteredDelta = Math.max(0,state.mastered.length-sessionMasteredBefore);

  $("resultSessionLabel").textContent = sessionKindLabel();
  $("resultPercent").textContent = `${percent}%`;
  $("resultScoreRing").style.background = `conic-gradient(var(--success) ${percent}%,var(--line) ${percent}%)`;
  $("resultCorrect").textContent = `${score}/${total}`;
  $("resultMasteredDelta").textContent = `+${masteredDelta}`;
  $("resultStreak").textContent = state.stats?.streak || 0;
  $("resultTotalMastered").textContent = `Tổng ${state.mastered.length}/3000 từ đã thuộc`;
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
  document.querySelectorAll("#sizeChoices .choice").forEach(x=>x.classList.toggle("active",Number(x.dataset.size)===state.sessionSize));
  document.querySelectorAll("#modeChoices .mode-card").forEach(x=>x.classList.toggle("active",x.dataset.mode===state.mode));
}

document.querySelectorAll("#sizeChoices .choice").forEach(btn=>{
  btn.onclick=()=>{
    state.sessionSize=Number(btn.dataset.size);
    document.querySelectorAll("#sizeChoices .choice").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    saveState();
    renderStartRecommendation();
    updateSettingsSummary();
  };
});
document.querySelectorAll("#modeChoices .mode-card").forEach(btn=>{
  btn.onclick=()=>{
    state.mode=btn.dataset.mode;
    document.querySelectorAll("#modeChoices .mode-card").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    saveState();
    renderStartRecommendation();
    updateSettingsSummary();
  };
});
document.querySelectorAll(".browse-tab").forEach(btn=>{
  btn.onclick=()=>{
    state.browseMode=btn.dataset.browse === "level" ? "topic" : btn.dataset.browse;
    saveState();
    renderHome();
  };
});

$("topicSearch").addEventListener("input",e=>renderTopics(e.target.value));
$("themeBtn").onclick=()=>{state.dark=!state.dark;saveState();applyTheme();};
$("startBtn").onclick=startNormalSession;
$("continueBtn").onclick=startSmartSession;
$("newWordsBtn").onclick=startNewWordsSession;
$("startDueBtn").onclick=startDueReview;
$("reviewWrongBtn").onclick=startWrongReview;
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

todayStatsReset();
applyTheme();
restoreChoices();
loadVocabulary();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
