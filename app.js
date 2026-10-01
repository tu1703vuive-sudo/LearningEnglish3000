const LEVEL_SOURCE = "https://raw.githubusercontent.com/mankhb2k/Vocabulary-English/main/json/Vocabulary-levels.json";
const TOPIC_SOURCE = "https://raw.githubusercontent.com/mankhb2k/Vocabulary-English/main/json/Vocabulary-topics.json";
const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const TRANSLATE_API = "https://api.mymemory.translated.net/get";
const TARGET_WORDS = 3000;
const STAGE_SIZE = 100;
const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30];

const OFFLINE_MEANINGS = {
  "a":"một; một cái","about":"về; khoảng","above":"ở trên","across":"băng qua","action":"hành động",
  "activity":"hoạt động","actor":"nam diễn viên","actress":"nữ diễn viên","add":"thêm","address":"địa chỉ",
  "adult":"người lớn","advice":"lời khuyên","afraid":"sợ","after":"sau","afternoon":"buổi chiều",
  "again":"lại; một lần nữa","age":"tuổi","ago":"trước đây","agree":"đồng ý","air":"không khí",
  "airport":"sân bay","all":"tất cả","also":"cũng","always":"luôn luôn","amazing":"tuyệt vời",
  "and":"và","angry":"tức giận","animal":"động vật","another":"một cái khác","answer":"câu trả lời",
  "any":"bất kỳ","anyone":"bất kỳ ai","anything":"bất cứ điều gì","apartment":"căn hộ","apple":"quả táo",
  "area":"khu vực","arm":"cánh tay","around":"xung quanh","arrive":"đến","art":"nghệ thuật",
  "article":"bài viết","artist":"nghệ sĩ","ask":"hỏi","at":"ở; tại","aunt":"cô; dì; bác gái",
  "autumn":"mùa thu","away":"xa; đi khỏi","baby":"em bé","back":"phía sau; quay lại","bad":"xấu; tệ",
  "bag":"túi","ball":"quả bóng","banana":"quả chuối","band":"ban nhạc","bank":"ngân hàng",
  "bath":"bồn tắm; tắm","bathroom":"phòng tắm","be":"là; thì; ở","beach":"bãi biển","beautiful":"đẹp",
  "because":"bởi vì","become":"trở thành","bed":"giường","bedroom":"phòng ngủ","before":"trước",
  "begin":"bắt đầu","beginning":"sự bắt đầu","behind":"phía sau","believe":"tin","below":"bên dưới",
  "best":"tốt nhất","better":"tốt hơn","between":"ở giữa","bicycle":"xe đạp","big":"to; lớn",
  "bike":"xe đạp","bill":"hóa đơn","bird":"chim","birthday":"sinh nhật","black":"màu đen",
  "blue":"màu xanh dương","boat":"thuyền","body":"cơ thể","book":"sách","boot":"ủng",
  "bored":"chán","boring":"nhàm chán","born":"được sinh ra","both":"cả hai","bottle":"chai",
  "box":"hộp","boy":"cậu bé","boyfriend":"bạn trai","bread":"bánh mì","break":"nghỉ; làm vỡ",
  "breakfast":"bữa sáng","bring":"mang đến","brother":"anh/em trai","brown":"màu nâu","build":"xây dựng",
  "building":"tòa nhà","bus":"xe buýt","business":"kinh doanh; doanh nghiệp","busy":"bận","but":"nhưng",
  "butter":"bơ","buy":"mua","by":"bởi; bằng; cạnh","bye":"tạm biệt","cafe":"quán cà phê",
  "cake":"bánh ngọt","call":"gọi","camera":"máy ảnh","can":"có thể","capital":"thủ đô; vốn",
  "car":"xe hơi","card":"thẻ","career":"sự nghiệp","carrot":"cà rốt","carry":"mang; vác",
  "cat":"mèo","cent":"xu","centre":"trung tâm","century":"thế kỷ","chair":"ghế",
  "change":"thay đổi","cheap":"rẻ","check":"kiểm tra","cheese":"phô mai","chicken":"gà"
};

const EXTRA_WORDS = `accomplishment accountability adaptable administrator adulthood adviser aerospace agriculture allocation ambition analyst announcement applicant architecture assignment atmosphere authority awareness background backup benchmark biography blockchain boundary bravery browser campaign candidate celebration championship characteristic circulation citizenship collaboration colleague commitment communication comparison competition complaint complexity concentration conclusion confidence confirmation conservation construction consultant contribution convenience cooperation coordination creativity credibility curiosity deadline decision-making dedication democracy destination developer development device diagnosis discipline discovery discussion diversity documentation efficiency electricity emergency emotion encouragement energy entertainment environment equipment evaluation evidence excellence expectation expertise exploration feedback flexibility foundation framework freedom frequency friendship geography guidance hardware healthcare imagination independence innovation insight installation instruction insurance integration leadership lifestyle logic maintenance manufacturing marketing measurement motivation navigation negotiation network nutrition opportunity organization performance permission personality photography planning platform possibility presentation productivity programming qualification quality reaction recommendation relationship reliability replacement reputation requirement resource responsibility satisfaction security selection software stability standard strategy strength sustainability teamwork technique telecommunication timeline tradition transition transportation treatment troubleshooting university usability validation variation vocabulary warehouse workflow workplace`.split(/\s+/);

const TOPIC_VI = {
  1:"Chào hỏi & bản thân",2:"Gia đình & bạn bè",3:"Số, thời gian & ngày tháng",4:"Đồ ăn & thức uống",
  5:"Màu sắc & mô tả",6:"Nghề nghiệp & công việc",7:"Nhà cửa & sinh hoạt",8:"Thói quen hằng ngày",
  9:"Thời tiết",10:"Giao thông",11:"Sở thích & thời gian rảnh",12:"Quốc gia & quốc tịch",
  13:"Quần áo & phụ kiện",14:"Thiên nhiên & động vật",15:"Mua sắm & tiền bạc",16:"Sức khỏe & cơ thể",
  18:"Văn phòng cơ bản",19:"Trường học",20:"Nhà hàng & nấu ăn",21:"Tình huống khẩn cấp",
  22:"Cảm xúc",23:"Ngoại hình & tính cách",24:"Đời sống số",25:"Du lịch & kỳ nghỉ",
  27:"Khách sạn & sân bay",28:"Kết bạn",29:"Giao tiếp xã giao",34:"Họp & thuyết trình",
  37:"Văn hóa & xã hội",38:"Truyền thông & giải trí",39:"Giáo dục nâng cao",44:"Tài chính & ngân hàng",
  49:"Môi trường & bền vững",51:"Động từ & hành động cốt lõi",53:"Tính từ & trạng từ cốt lõi",54:"Từ trừu tượng & học thuật"
};

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

let vocab = [];
let topics = [];
let currentSession = [];
let currentIndex = 0;
let score = 0;
let wrongThisSession = [];
let answered = false;
let sessionKind = "normal";

function saveState() { localStorage.setItem("english3000State", JSON.stringify(state)); }
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(id).classList.add("active");
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

function buildCoreVocabulary(levelData) {
  const rows = [];
  Object.entries(levelData?.levels || {}).forEach(([level,item]) => {
    (item.words || []).forEach(word => rows.push({word, level}));
  });
  const used = new Set();
  const clean = [];
  for (const item of rows) {
    const word = String(item.word || "").trim();
    const key = keyOf(word);
    if (!key || used.has(key) || key.length > 55 || /^(adj\.|adv\.|n\.|v\.)$/i.test(key)) continue;
    used.add(key);
    clean.push({word, level:item.level, topics:[]});
    if (clean.length >= TARGET_WORDS) break;
  }
  for (const word of EXTRA_WORDS) {
    if (clean.length >= TARGET_WORDS) break;
    const key = keyOf(word);
    if (!used.has(key)) {
      used.add(key);
      clean.push({word, level:"B2", topics:[]});
    }
  }
  return clean.slice(0,TARGET_WORDS);
}

function attachTopics(topicData) {
  const itemMap = new Map(vocab.map(item => [keyOf(item.word), item]));
  topics = [];
  for (const raw of topicData?.topics || []) {
    const keys = [];
    const seen = new Set();
    for (const word of raw.words || []) {
      const k = keyOf(word);
      if (!itemMap.has(k) || seen.has(k)) continue;
      seen.add(k);
      keys.push(k);
      itemMap.get(k).topics.push(raw.id);
    }
    if (keys.length) topics.push({id:raw.id, name:raw.name, words:keys});
  }
  if (!topics.length) topics = [{id:1,name:"Core Vocabulary",words:vocab.map(x=>keyOf(x.word))}];
  if (!topics.some(t => t.id === state.selectedTopicId)) state.selectedTopicId = topics[0].id;
}

async function loadVocabulary() {
  try {
    const [levelData, topicData] = await Promise.all([fetchJson(LEVEL_SOURCE), fetchJson(TOPIC_SOURCE)]);
    vocab = buildCoreVocabulary(levelData);
    if (vocab.length < 100) throw new Error("Too few words");
    attachTopics(topicData);
  } catch (e) {
    vocab = Object.keys(OFFLINE_MEANINGS).map(word => ({word,level:"A1",topics:[1]}));
    topics = [{id:1,name:"Từ cơ bản offline",words:vocab.map(x=>keyOf(x.word))}];
    state.selectedTopicId = 1;
  }
  migrateSrs();
  renderHome();
}

async function translateText(text, cacheBucket, cacheKey) {
  if (!text) return "";
  if (cacheBucket && cacheKey && state[cacheBucket]?.[cacheKey]) return state[cacheBucket][cacheKey];
  if (!navigator.onLine) return "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const url = `${TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=en|vi`;
    const r = await fetch(url, {signal:controller.signal});
    const data = await r.json();
    const translated = data?.responseData?.translatedText?.trim();
    if (translated && translated.toLowerCase() !== text.toLowerCase() && translated.length < 500) {
      if (cacheBucket && cacheKey) {
        state[cacheBucket] ||= {};
        state[cacheBucket][cacheKey] = translated;
        saveState();
      }
      return translated;
    }
  } catch (_) {
  } finally {
    clearTimeout(timer);
  }
  return "";
}

async function translateWord(word) {
  const k = keyOf(word);
  if (OFFLINE_MEANINGS[k]) return OFFLINE_MEANINGS[k];
  if (state.meaningCache[k]) return state.meaningCache[k];
  const value = await translateText(word, "meaningCache", k);
  return value || "chưa có nghĩa";
}

function normalizeAudioUrl(url) {
  if (!url) return "";
  return url.startsWith("//") ? "https:" + url : url;
}

async function getLexicalData(word) {
  const k = keyOf(word);
  if (state.lexCache[k]) return state.lexCache[k];
  const result = {ipa:"",us:"",uk:"",generic:"",pos:"",definition:"",example:""};
  if (!navigator.onLine) return result;
  try {
    const r = await fetch(DICTIONARY_API + encodeURIComponent(word), {cache:"force-cache"});
    if (!r.ok) throw new Error("dictionary");
    const data = await r.json();
    const entries = Array.isArray(data) ? data : [];
    for (const entry of entries) {
      if (!result.ipa && entry.phonetic) result.ipa = entry.phonetic;
      for (const p of entry.phonetics || []) {
        if (!result.ipa && p.text) result.ipa = p.text;
        const audio = normalizeAudioUrl(p.audio);
        if (!audio) continue;
        const low = audio.toLowerCase();
        if (!result.us && (low.includes("-us.") || low.includes("_us.") || low.includes("us.mp3"))) result.us = audio;
        else if (!result.uk && (low.includes("-uk.") || low.includes("_uk.") || low.includes("uk.mp3"))) result.uk = audio;
        else if (!result.generic) result.generic = audio;
      }
      for (const meaning of entry.meanings || []) {
        if (!result.pos && meaning.partOfSpeech) result.pos = meaning.partOfSpeech;
        for (const def of meaning.definitions || []) {
          if (!result.definition && def.definition) result.definition = def.definition;
          if (!result.example && def.example) result.example = def.example;
        }
      }
    }
    state.lexCache[k] = result;
    state.pronCache[k] = {ipa:result.ipa,us:result.us,uk:result.uk,generic:result.generic};
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
  const p = await getLexicalData(item.word);
  if (dialect === "us" && p.us) return playUrl(p.us,item.word);
  if (dialect === "uk" && p.uk) return playUrl(p.uk,item.word);
  if (dialect === "generic" && p.generic) return playUrl(p.generic,item.word);
  playUrl(p.us || p.uk || p.generic, item.word);
}

function findItem(k) { return vocab.find(x => keyOf(x.word) === k); }
function topicLabel(topic) { return TOPIC_VI[topic.id] || topic.name; }
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
    const topic = topics.find(t=>t.id===state.selectedTopicId) || topics[0];
    return (topic?.words || []).map(findItem).filter(Boolean);
  }
  if (state.browseMode === "level") return vocab.filter(x=>x.level===state.selectedLevel);
  return vocab.slice((state.selectedStage-1)*STAGE_SIZE, state.selectedStage*STAGE_SIZE);
}
function activeContextName() {
  if (state.browseMode === "topic") {
    const topic = topics.find(t=>t.id===state.selectedTopicId);
    return topic ? topicLabel(topic) : "Chủ đề";
  }
  if (state.browseMode === "level") return `Trình độ ${state.selectedLevel}`;
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
    b.className = "topic-btn" + (state.selectedTopicId===topic.id ? " active":"");
    b.innerHTML = `<strong>${topicLabel(topic)}</strong><small>${known}/${topic.words.length} thuộc${due ? ` · ${due} cần ôn`:""} · ${topic.name}</small>`;
    b.onclick = () => { state.selectedTopicId=topic.id; saveState(); renderHome(); };
    grid.appendChild(b);
  }
  if (!matches.length) grid.innerHTML = '<p class="muted small">Không tìm thấy chủ đề.</p>';
}
function renderLevels() {
  const grid = $("levelGrid");
  grid.innerHTML = "";
  const mastered = getMasteredSet();
  const names = {A1:"Cơ bản",A2:"Sơ trung cấp",B1:"Trung cấp",B2:"Trung cao cấp"};
  for (const level of ["A1","A2","B1","B2"]) {
    const pool = vocab.filter(x=>x.level===level);
    const known = pool.filter(x=>mastered.has(keyOf(x.word))).length;
    const b = document.createElement("button");
    b.className = "level-btn" + (state.selectedLevel===level ? " active":"");
    b.innerHTML = `<strong>${level} · ${names[level]}</strong><small>${known}/${pool.length} từ đã thuộc</small>`;
    b.onclick = () => { state.selectedLevel=level; saveState(); renderHome(); };
    grid.appendChild(b);
  }
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
  document.querySelectorAll(".browse-tab").forEach(b=>b.classList.toggle("active",b.dataset.browse===state.browseMode));
  $("topicPanel").classList.toggle("hidden",state.browseMode!=="topic");
  $("levelPanel").classList.toggle("hidden",state.browseMode!=="level");
  $("stagePanel").classList.toggle("hidden",state.browseMode!=="stage");
}
function renderHome() {
  todayStatsReset();
  const mastered = getMasteredSet();
  const masteredCount = vocab.length ? vocab.filter(x=>mastered.has(keyOf(x.word))).length : mastered.size;
  $("masteredTop").textContent = masteredCount;
  const pct = Math.min(100,Math.round(masteredCount/TARGET_WORDS*100));
  $("totalPercent").textContent = pct+"%";
  $("totalProgress").style.width = pct+"%";
  $("dueCount").textContent = dueKeys().filter(k=>findItem(k)).length;
  $("streakCount").textContent = state.stats.streak || 0;
  $("todayCount").textContent = state.stats.todayAnswers || 0;

  renderBrowseMode();
  renderTopics($("topicSearch")?.value || "");
  renderLevels();
  renderStages();

  const pool = getActivePool();
  $("selectionSummary").textContent = activeContextName();
  $("selectionCount").textContent = `${pool.length} từ`;
  saveState();
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

async function hydrateWord(item) {
  const [meaning, lex] = await Promise.all([translateWord(item.word), getLexicalData(item.word)]);
  return {...item, meaning, lex};
}
async function prepareSession(words, kind="normal") {
  if (!words.length) return alert("Chưa có từ phù hợp trong nhóm này.");
  sessionKind = kind;
  showView("loadingView");
  currentSession = new Array(words.length);
  let next = 0;
  let finished = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= words.length) break;
      $("loadingText").textContent = `Đang chuẩn bị ${finished}/${words.length} từ…`;
      currentSession[i] = await hydrateWord(words[i]);
      finished++;
      $("loadingText").textContent = `Đã chuẩn bị ${finished}/${words.length} từ…`;
    }
  }
  await Promise.all(Array.from({length:Math.min(4,words.length)},()=>worker()));

  currentIndex=0;
  score=0;
  wrongThisSession=[];
  renderQuestion();
  showView("quizView");
}
async function startNormalSession() {
  if (!vocab.length) await loadVocabulary();
  await prepareSession(pickSessionWords(),"normal");
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
  let pool = currentSession.filter(x=>x.word!==item.word && x.meaning!==item.meaning);
  if (pool.length >= 3) return shuffled(pool).slice(0,3);
  const fallback = vocab.filter(x=>x.word!==item.word).slice(0,50).map(x=>({
    ...x,
    meaning: state.meaningCache[keyOf(x.word)] || OFFLINE_MEANINGS[keyOf(x.word)] || x.word
  }));
  return shuffled([...pool,...fallback]).slice(0,3);
}

function resetPronunciationUi(conceal) {
  $("pronunciationBox").classList.toggle("concealed",!!conceal);
  $("ipaText").textContent = "Đang tải…";
  ["audioUsBtn","audioUkBtn","audioDictBtn","audioTtsBtn"].forEach(id=>$(id).classList.add("hidden"));
}
async function fillPronunciationUi(item,reveal=true) {
  resetPronunciationUi(!reveal);
  const expected = keyOf(item.word);
  const p = item.lex || await getLexicalData(item.word);
  if (!currentSession[currentIndex] || keyOf(currentSession[currentIndex].word)!==expected) return;
  $("ipaText").textContent = p.ipa || "IPA chưa có";
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
  $("feedback").className="feedback";
  $("feedback").textContent="";
  $("wordDetail").classList.add("hidden");
  $("nextBtn").classList.add("hidden");

  const item=currentSession[currentIndex];
  const total=currentSession.length;
  $("quizProgressBar").style.width=`${currentIndex/total*100}%`;
  $("quizProgressText").textContent=`${currentIndex+1}/${total}`;
  $("scoreValue").textContent=score;
  $("contextLabel").textContent=sessionKind==="due" ? "Ôn đến hạn" : sessionKind==="wrong" ? "Ôn từ sai" : activeContextName();
  $("levelLabel").textContent=item.level || "—";
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
  $("detailPos").textContent=item.lex?.pos || item.level || "word";
  $("detailMeaning").textContent=item.meaning;
  $("detailAudioBtn").onclick=()=>playBestPronunciation(item);

  const example = item.lex?.example || `This sentence helps me remember the word "${item.word}".`;
  $("detailExampleEn").textContent=example;
  const ek = `${keyOf(item.word)}::${example}`;
  $("detailExampleVi").textContent="Đang dịch ví dụ…";
  const vi = state.exampleViCache[ek] || await translateText(example,"exampleViCache",ek);
  $("detailExampleVi").textContent=vi || "Chưa có bản dịch ví dụ.";

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
    $("feedback").className="feedback ok";
    $("feedback").textContent=`✓ Chính xác — ${item.word} = ${item.meaning}`;
  } else {
    button.classList.add("wrong");
    wrongThisSession.push(item);
    const correctButton=buttons.find(x=>x.textContent===correctText);
    if (correctButton) correctButton.classList.add("correct");
    $("feedback").className="feedback bad";
    $("feedback").textContent=`✕ ${item.word} = ${item.meaning}`;
  }

  const card=recordAnswer(item,isCorrect);
  $("scoreValue").textContent=score;
  $("nextBtn").classList.remove("hidden");
  $("nextBtn").textContent=currentIndex===currentSession.length-1 ? "Xem kết quả" : "Tiếp tục";
  showWordDetail(item,card,isCorrect).catch(()=>{});
}
function nextQuestion() {
  if (!answered) return;
  if (currentIndex < currentSession.length-1) {
    currentIndex++;
    renderQuestion();
  } else showResult();
}
function showResult() {
  $("quizProgressBar").style.width="100%";
  const wrongCount=currentSession.length-score;
  $("resultCorrect").textContent=score;
  $("resultWrong").textContent=wrongCount;
  $("resultMastered").textContent=state.mastered.length;
  $("resultTitle").textContent=`${score}/${currentSession.length} câu đúng`;
  if (score===currentSession.length) {
    $("resultEmoji").textContent="🏆";
    $("resultText").textContent="Rất tốt. Các từ đúng đã được giãn lịch ôn xa hơn.";
  } else if (score>=Math.ceil(currentSession.length*.7)) {
    $("resultEmoji").textContent="🎉";
    $("resultText").textContent=`Khá tốt. ${wrongCount} từ sai đã được đưa về lịch ôn sớm.`;
  } else {
    $("resultEmoji").textContent="💪";
    $("resultText").textContent="Nên ôn ngay các từ sai trước khi chuyển sang nhóm mới.";
  }
  $("retryWrongBtn").classList.toggle("hidden",wrongThisSession.length===0);
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
  };
});
document.querySelectorAll("#modeChoices .mode-card").forEach(btn=>{
  btn.onclick=()=>{
    state.mode=btn.dataset.mode;
    document.querySelectorAll("#modeChoices .mode-card").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    saveState();
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
$("themeBtn").onclick=()=>{state.dark=!state.dark;saveState();applyTheme();};
$("startBtn").onclick=startNormalSession;
$("startDueBtn").onclick=startDueReview;
$("reviewWrongBtn").onclick=startWrongReview;
$("nextBtn").onclick=nextQuestion;
$("backBtn").onclick=()=>{renderHome();showView("homeView");};
$("homeBtn").onclick=()=>{renderHome();showView("homeView");};
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
