const LEVEL_SOURCE = "https://raw.githubusercontent.com/mankhb2k/Vocabulary-English/main/json/Vocabulary-levels.json";
const TOPIC_SOURCE = "https://raw.githubusercontent.com/mankhb2k/Vocabulary-English/main/json/Vocabulary-topics.json";
const DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const TARGET_WORDS = 3000;
const STAGE_SIZE = 100;

const OFFLINE_MEANINGS = {"a": "một; một cái", "about": "về; khoảng", "above": "ở trên", "across": "băng qua", "action": "hành động", "activity": "hoạt động", "actor": "nam diễn viên", "actress": "nữ diễn viên", "add": "thêm", "address": "địa chỉ", "adult": "người lớn", "advice": "lời khuyên", "afraid": "sợ", "after": "sau", "afternoon": "buổi chiều", "again": "lại; một lần nữa", "age": "tuổi", "ago": "trước đây", "agree": "đồng ý", "air": "không khí", "airport": "sân bay", "all": "tất cả", "also": "cũng", "always": "luôn luôn", "amazing": "tuyệt vời", "and": "và", "angry": "tức giận", "animal": "động vật", "another": "một cái khác", "answer": "câu trả lời", "any": "bất kỳ", "anyone": "bất kỳ ai", "anything": "bất cứ điều gì", "apartment": "căn hộ", "apple": "quả táo", "area": "khu vực", "arm": "cánh tay", "around": "xung quanh", "arrive": "đến", "art": "nghệ thuật", "article": "bài viết", "artist": "nghệ sĩ", "ask": "hỏi", "at": "ở; tại", "aunt": "cô; dì; bác gái", "autumn": "mùa thu", "away": "xa; đi khỏi", "baby": "em bé", "back": "phía sau; quay lại", "bad": "xấu; tệ", "bag": "túi", "ball": "quả bóng", "banana": "quả chuối", "band": "ban nhạc", "bank": "ngân hàng", "bath": "bồn tắm; tắm", "bathroom": "phòng tắm", "be": "là; thì; ở", "beach": "bãi biển", "beautiful": "đẹp", "because": "bởi vì", "become": "trở thành", "bed": "giường", "bedroom": "phòng ngủ", "before": "trước", "begin": "bắt đầu", "beginning": "sự bắt đầu", "behind": "phía sau", "believe": "tin", "below": "bên dưới", "best": "tốt nhất", "better": "tốt hơn", "between": "ở giữa", "bicycle": "xe đạp", "big": "to; lớn", "bike": "xe đạp", "bill": "hóa đơn", "bird": "chim", "birthday": "sinh nhật", "black": "màu đen", "blue": "màu xanh dương", "boat": "thuyền", "body": "cơ thể", "book": "sách", "boot": "ủng", "bored": "chán", "boring": "nhàm chán", "born": "được sinh ra", "both": "cả hai", "bottle": "chai", "box": "hộp", "boy": "cậu bé", "boyfriend": "bạn trai", "bread": "bánh mì", "break": "nghỉ; làm vỡ", "breakfast": "bữa sáng", "bring": "mang đến", "brother": "anh/em trai", "brown": "màu nâu", "build": "xây dựng", "building": "tòa nhà", "bus": "xe buýt", "business": "kinh doanh; doanh nghiệp", "busy": "bận", "but": "nhưng", "butter": "bơ", "buy": "mua", "by": "bởi; bằng; cạnh", "bye": "tạm biệt", "cafe": "quán cà phê", "cake": "bánh ngọt", "call": "gọi", "camera": "máy ảnh", "can": "có thể", "capital": "thủ đô; vốn", "car": "xe hơi", "card": "thẻ", "career": "sự nghiệp", "carrot": "cà rốt", "carry": "mang; vác", "cat": "mèo", "cent": "xu", "centre": "trung tâm", "century": "thế kỷ", "chair": "ghế", "change": "thay đổi", "cheap": "rẻ", "check": "kiểm tra", "cheese": "phô mai", "chicken": "gà"};
const EXTRA_WORDS = ["accomplishment", "accountability", "adaptable", "administrator", "adulthood", "adviser", "aerospace", "agriculture", "allocation", "ambition", "analyst", "announcement", "applicant", "architecture", "assignment", "atmosphere", "authority", "awareness", "background", "backup", "benchmark", "biography", "blockchain", "boundary", "bravery", "browser", "campaign", "candidate", "celebration", "championship", "characteristic", "circulation", "citizenship", "collaboration", "colleague", "commitment", "communication", "comparison", "competition", "complaint", "complexity", "concentration", "conclusion", "confidence", "confirmation", "conservation", "construction", "consultant", "contribution", "convenience", "cooperation", "coordination", "creativity", "credibility", "curiosity", "deadline", "decision-making", "dedication", "democracy", "destination", "developer", "development", "device", "diagnosis", "discipline", "discovery", "discussion", "diversity", "documentation", "efficiency", "electricity", "emergency", "emotion", "encouragement", "energy", "entertainment", "environment", "equipment", "evaluation", "evidence", "excellence", "expectation", "expertise", "exploration", "feedback", "flexibility", "foundation", "framework", "freedom", "frequency", "friendship", "geography", "guidance", "hardware", "healthcare", "imagination", "independence", "innovation", "insight", "installation", "instruction", "insurance", "integration", "leadership", "lifestyle", "logic", "maintenance", "manufacturing", "marketing", "measurement", "motivation", "navigation", "negotiation", "network", "nutrition", "opportunity", "organization", "performance", "permission", "personality", "photography", "planning", "platform", "possibility", "presentation", "productivity", "programming", "qualification", "quality", "reaction", "recommendation", "relationship", "reliability", "replacement", "reputation", "requirement", "resource", "responsibility", "satisfaction", "security", "selection", "software", "stability", "standard", "strategy", "strength", "sustainability", "teamwork", "technique", "telecommunication", "timeline", "tradition", "transition", "transportation", "treatment", "troubleshooting", "university", "usability", "validation", "variation", "vocabulary", "warehouse", "workflow", "workplace"];

const $ = (id) => document.getElementById(id);

const defaultState = {
  selectedStage: 1,
  selectedTopicId: 1,
  selectedLevel: "A1",
  browseMode: "topic",
  sessionSize: 10,
  mode: "envi",
  mastered: [],
  wrong: {},
  seen: {},
  meaningCache: {},
  pronCache: {},
  dark: false
};

let state = { ...defaultState, ...JSON.parse(localStorage.getItem("english3000State") || "{}") };
state.wrong ||= {};
state.seen ||= {};
state.meaningCache ||= {};
state.pronCache ||= {};
state.mastered ||= [];

let vocab = [];
let topics = [];
let currentSession = [];
let currentIndex = 0;
let score = 0;
let wrongThisSession = [];
let answered = false;

function keyOf(word) { return String(word || "").trim().toLowerCase(); }
function saveState() { localStorage.setItem("english3000State", JSON.stringify(state)); }
function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function shuffled(arr) { return [...arr].sort(() => Math.random() - .5); }

async function fetchJson(url) {
  const r = await fetch(url, { cache: "force-cache" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function buildCoreVocabulary(levelData) {
  const rows = [];
  Object.entries(levelData?.levels || {}).forEach(([level, item]) => {
    (item.words || []).forEach(word => rows.push({ word, level }));
  });

  const used = new Set();
  const clean = [];
  for (const item of rows) {
    const word = String(item.word || "").trim();
    const key = keyOf(word);
    if (!key || used.has(key) || key.length > 55) continue;
    if (/^(adj\.|adv\.|n\.|v\.)$/i.test(key)) continue;
    used.add(key);
    clean.push({ word, level: item.level, topics: [] });
    if (clean.length >= TARGET_WORDS) break;
  }

  for (const word of EXTRA_WORDS) {
    if (clean.length >= TARGET_WORDS) break;
    const key = keyOf(word);
    if (!used.has(key)) {
      used.add(key);
      clean.push({ word, level: "B2", topics: [] });
    }
  }
  return clean;
}

function attachTopics(topicData) {
  const itemMap = new Map(vocab.map(item => [keyOf(item.word), item]));
  const nextTopics = [];
  for (const raw of topicData?.topics || []) {
    const keys = [];
    const seen = new Set();
    for (const word of raw.words || []) {
      const key = keyOf(word);
      if (!itemMap.has(key) || seen.has(key)) continue;
      seen.add(key);
      keys.push(key);
      itemMap.get(key).topics.push(raw.id);
    }
    if (keys.length) nextTopics.push({ id: raw.id, name: raw.name, words: keys });
  }
  topics = nextTopics;

  if (!topics.length) {
    topics = [{ id: 1, name: "Core Vocabulary", words: vocab.map(x => keyOf(x.word)) }];
  }
  if (!topics.some(t => t.id === state.selectedTopicId)) state.selectedTopicId = topics[0].id;
}

async function loadVocabulary() {
  try {
    const [levelData, topicData] = await Promise.all([
      fetchJson(LEVEL_SOURCE),
      fetchJson(TOPIC_SOURCE)
    ]);
    vocab = buildCoreVocabulary(levelData);
    if (vocab.length < 100) throw new Error("Dữ liệu level quá ít");
    attachTopics(topicData);
  } catch (e) {
    vocab = Object.keys(OFFLINE_MEANINGS).map(word => ({ word, level: "A1", topics: [1] }));
    topics = [{ id: 1, name: "Từ cơ bản offline", words: vocab.map(x => keyOf(x.word)) }];
    state.selectedTopicId = 1;
  }
  saveState();
  renderHome();
}

async function translateWord(word) {
  const key = keyOf(word);
  if (OFFLINE_MEANINGS[key]) return OFFLINE_MEANINGS[key];
  if (state.meaningCache[key]) return state.meaningCache[key];
  if (!navigator.onLine) return "chưa có nghĩa offline";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(word) + "&langpair=en|vi";
    const r = await fetch(url, { signal: controller.signal });
    const data = await r.json();
    const translated = data?.responseData?.translatedText?.trim();
    if (translated && keyOf(translated) !== key && translated.length < 120) {
      state.meaningCache[key] = translated;
      saveState();
      return translated;
    }
  } catch (_) {
  } finally { clearTimeout(timer); }

  return "chưa tải được nghĩa";
}

function normalizeAudioUrl(url) {
  if (!url) return "";
  if (url.startsWith("//")) return "https:" + url;
  return url;
}

async function getPronunciation(word) {
  const key = keyOf(word);
  if (state.pronCache[key]) return state.pronCache[key];

  const result = { ipa: "", us: "", uk: "", generic: "" };
  if (!navigator.onLine || /\s/.test(key)) {
    state.pronCache[key] = result;
    saveState();
    return result;
  }

  try {
    const r = await fetch(DICTIONARY_API + encodeURIComponent(word));
    if (!r.ok) throw new Error("dictionary lookup failed");
    const data = await r.json();
    const entries = Array.isArray(data) ? data : [];

    for (const entry of entries) {
      if (!result.ipa && entry.phonetic) result.ipa = entry.phonetic;
      for (const ph of entry.phonetics || []) {
        if (!result.ipa && ph.text) result.ipa = ph.text;
        const url = normalizeAudioUrl(ph.audio || "");
        if (!url) continue;
        if (!result.generic) result.generic = url;
        const lower = url.toLowerCase();
        if (!result.us && (lower.includes("-us.") || lower.includes("_us_") || lower.includes("/us/") || lower.includes("american"))) result.us = url;
        if (!result.uk && (lower.includes("-uk.") || lower.includes("_uk_") || lower.includes("-gb.") || lower.includes("_gb_") || lower.includes("/uk/") || lower.includes("british"))) result.uk = url;
      }
    }
  } catch (_) {}

  state.pronCache[key] = result;
  saveState();
  return result;
}

function ttsSpeak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = .82;
  const voices = speechSynthesis.getVoices?.() || [];
  const preferred = voices.find(v => /en-US/i.test(v.lang) && /natural|enhanced|premium/i.test(v.name))
    || voices.find(v => /en-US/i.test(v.lang))
    || voices.find(v => /^en/i.test(v.lang));
  if (preferred) u.voice = preferred;
  speechSynthesis.speak(u);
}

function playUrl(url, fallbackWord) {
  if (!url) return ttsSpeak(fallbackWord);
  const audio = new Audio(url);
  audio.play().catch(() => ttsSpeak(fallbackWord));
}

async function playBestPronunciation(item, dialect = "best") {
  const p = await getPronunciation(item.word);
  if (dialect === "us" && p.us) return playUrl(p.us, item.word);
  if (dialect === "uk" && p.uk) return playUrl(p.uk, item.word);
  if (dialect === "generic" && p.generic) return playUrl(p.generic, item.word);
  playUrl(p.us || p.uk || p.generic, item.word);
}

function getMasteredSet() { return new Set(state.mastered || []); }
function findItem(key) { return vocab.find(x => keyOf(x.word) === key); }

function topicLabel(topic) {
  const known = {
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
  return known[topic.id] || topic.name;
}

function getActivePool() {
  if (state.browseMode === "topic") {
    const topic = topics.find(t => t.id === state.selectedTopicId) || topics[0];
    return (topic?.words || []).map(findItem).filter(Boolean);
  }
  if (state.browseMode === "level") return vocab.filter(x => x.level === state.selectedLevel);
  const start = (state.selectedStage - 1) * STAGE_SIZE;
  return vocab.slice(start, start + STAGE_SIZE);
}

function activeContextName() {
  if (state.browseMode === "topic") {
    const topic = topics.find(t => t.id === state.selectedTopicId);
    return topic ? topicLabel(topic) : "Chủ đề";
  }
  if (state.browseMode === "level") return `Trình độ ${state.selectedLevel}`;
  return `Chặng ${state.selectedStage}`;
}

function renderTopics(filter = "") {
  const grid = $("topicGrid");
  grid.innerHTML = "";
  const mastered = getMasteredSet();
  const q = keyOf(filter);
  const matches = topics.filter(t => !q || keyOf(t.name).includes(q) || keyOf(topicLabel(t)).includes(q));

  for (const topic of matches) {
    const known = topic.words.filter(k => mastered.has(k)).length;
    const b = document.createElement("button");
    b.className = "topic-btn" + (state.selectedTopicId === topic.id ? " active" : "");
    b.innerHTML = `<strong>${topicLabel(topic)}</strong><small>${known}/${topic.words.length} từ · ${topic.name}</small>`;
    b.onclick = () => { state.selectedTopicId = topic.id; saveState(); renderHome(); };
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
    const pool = vocab.filter(x => x.level === level);
    const known = pool.filter(x => mastered.has(keyOf(x.word))).length;
    const b = document.createElement("button");
    b.className = "level-btn" + (state.selectedLevel === level ? " active" : "");
    b.innerHTML = `<strong>${level} · ${names[level]}</strong><small>${known}/${pool.length} từ đã thuộc</small>`;
    b.onclick = () => { state.selectedLevel = level; saveState(); renderHome(); };
    grid.appendChild(b);
  }
}

function renderStages() {
  const grid = $("stageGrid");
  grid.innerHTML = "";
  const mastered = getMasteredSet();
  for (let i = 1; i <= 30; i++) {
    const pool = vocab.slice((i - 1) * STAGE_SIZE, i * STAGE_SIZE);
    const known = pool.filter(x => mastered.has(keyOf(x.word))).length;
    const b = document.createElement("button");
    b.className = "stage-btn" + (state.selectedStage === i ? " active" : "") + (pool.length && known === pool.length ? " done" : "");
    b.innerHTML = `<strong>Chặng ${i}</strong><small>${known}/${pool.length || 100} từ</small>`;
    b.onclick = () => { state.selectedStage = i; saveState(); renderHome(); };
    grid.appendChild(b);
  }
}

function renderBrowseMode() {
  document.querySelectorAll(".browse-tab").forEach(b => b.classList.toggle("active", b.dataset.browse === state.browseMode));
  $("topicPanel").classList.toggle("hidden", state.browseMode !== "topic");
  $("levelPanel").classList.toggle("hidden", state.browseMode !== "level");
  $("stagePanel").classList.toggle("hidden", state.browseMode !== "stage");
}

function renderHome() {
  const mastered = getMasteredSet();
  const masteredCount = vocab.length ? vocab.filter(x => mastered.has(keyOf(x.word))).length : mastered.size;
  $("masteredTop").textContent = masteredCount;
  const pct = Math.min(100, Math.round(masteredCount / TARGET_WORDS * 100));
  $("totalPercent").textContent = pct + "%";
  $("totalProgress").style.width = pct + "%";

  renderBrowseMode();
  renderTopics($("topicSearch")?.value || "");
  renderLevels();
  renderStages();

  const pool = getActivePool();
  $("selectionSummary").textContent = activeContextName();
  $("selectionCount").textContent = `${pool.length} từ`;
}

function pickSessionWords() {
  const pool = getActivePool();
  if (!pool.length) return [];
  const sorted = [...pool].sort((a, b) => (state.wrong[keyOf(b.word)] || 0) - (state.wrong[keyOf(a.word)] || 0));
  const newWords = sorted.filter(x => !state.mastered.includes(keyOf(x.word)));
  const oldWords = sorted.filter(x => state.mastered.includes(keyOf(x.word)));
  return [...newWords, ...oldWords].slice(0, Math.min(state.sessionSize, pool.length));
}

async function prepareSession(words) {
  showView("loadingView");
  currentSession = [];

  for (let i = 0; i < words.length; i++) {
    $("loadingText").textContent = `Đang chuẩn bị từ ${i + 1}/${words.length}…`;
    const meaning = await translateWord(words[i].word);
    currentSession.push({ ...words[i], meaning });
  }

  currentIndex = 0;
  score = 0;
  wrongThisSession = [];
  renderQuestion();
  showView("quizView");
}

async function startNormalSession() {
  if (!vocab.length) await loadVocabulary();
  const words = pickSessionWords();
  if (!words.length) return alert("Nhóm này chưa có dữ liệu phù hợp.");
  await prepareSession(words);
}

async function startWrongReview() {
  if (!vocab.length) await loadVocabulary();
  const wrongKeys = Object.entries(state.wrong)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
  const pool = wrongKeys.map(findItem).filter(Boolean).slice(0, state.sessionSize);
  if (!pool.length) return alert("Bạn chưa có từ sai để ôn.");
  await prepareSession(pool);
}

function makeDistractors(item) {
  return shuffled(currentSession.filter(x => x.word !== item.word && x.meaning !== item.meaning)).slice(0, 3);
}

function resetPronunciationUi(conceal) {
  $("pronunciationBox").classList.toggle("concealed", !!conceal);
  $("ipaText").textContent = "Đang tải…";
  ["audioUsBtn","audioUkBtn","audioDictBtn","audioTtsBtn"].forEach(id => $(id).classList.add("hidden"));
}

async function fillPronunciationUi(item, reveal = true) {
  resetPronunciationUi(!reveal);
  const expected = keyOf(item.word);
  const p = await getPronunciation(item.word);
  if (!currentSession[currentIndex] || keyOf(currentSession[currentIndex].word) !== expected) return;

  $("ipaText").textContent = p.ipa || "IPA chưa có trong từ điển";
  $("audioUsBtn").classList.toggle("hidden", !p.us);
  $("audioUkBtn").classList.toggle("hidden", !p.uk);
  $("audioDictBtn").classList.toggle("hidden", !p.generic || !!p.us || !!p.uk);
  $("audioTtsBtn").classList.toggle("hidden", !!(p.us || p.uk || p.generic));

  $("audioUsBtn").onclick = () => playBestPronunciation(item, "us");
  $("audioUkBtn").onclick = () => playBestPronunciation(item, "uk");
  $("audioDictBtn").onclick = () => playBestPronunciation(item, "generic");
  $("audioTtsBtn").onclick = () => ttsSpeak(item.word);
}

function revealPronunciation(item) {
  $("pronunciationBox").classList.remove("concealed");
  fillPronunciationUi(item, true);
}

function addAnswer(label, isCorrect, item) {
  const b = document.createElement("button");
  b.className = "answer";
  b.textContent = label;
  b.onclick = () => chooseAnswer(b, isCorrect, item);
  $("answers").appendChild(b);
}

function renderQuestion() {
  answered = false;
  $("feedback").className = "feedback";
  $("feedback").textContent = "";
  $("nextBtn").classList.add("hidden");

  const item = currentSession[currentIndex];
  const total = currentSession.length;
  $("quizProgressBar").style.width = `${currentIndex / total * 100}%`;
  $("quizProgressText").textContent = `${currentIndex + 1}/${total}`;
  $("scoreValue").textContent = score;
  $("contextLabel").textContent = activeContextName();
  $("levelLabel").textContent = item.level || "—";

  const options = shuffled([item, ...makeDistractors(item)]);
  $("answers").innerHTML = "";
  $("listenMainBtn").classList.toggle("hidden", state.mode !== "listen");

  if (state.mode === "envi") {
    $("promptLabel").textContent = "Chọn nghĩa tiếng Việt đúng";
    $("questionWord").textContent = item.word;
    options.forEach(opt => addAnswer(opt.meaning, opt.word === item.word, item));
    fillPronunciationUi(item, true);
  } else if (state.mode === "vien") {
    $("promptLabel").textContent = "Chọn từ tiếng Anh đúng";
    $("questionWord").textContent = item.meaning;
    options.forEach(opt => addAnswer(opt.word, opt.word === item.word, item));
    fillPronunciationUi(item, false);
  } else {
    $("promptLabel").textContent = "Chạm loa, nghe rồi chọn nghĩa đúng";
    $("questionWord").textContent = "🎧";
    options.forEach(opt => addAnswer(opt.meaning, opt.word === item.word, item));
    fillPronunciationUi(item, false);
  }

  $("listenMainBtn").onclick = () => playBestPronunciation(item);
}

function chooseAnswer(button, isCorrect, item) {
  if (answered) return;
  answered = true;
  const key = keyOf(item.word);
  state.seen[key] = (state.seen[key] || 0) + 1;
  document.querySelectorAll(".answer").forEach(btn => btn.disabled = true);

  if (isCorrect) {
    score++;
    button.classList.add("correct");
    state.wrong[key] = Math.max(0, (state.wrong[key] || 0) - 1);
    const correctKey = "correct:" + key;
    state.seen[correctKey] = (state.seen[correctKey] || 0) + 1;
    if (state.seen[correctKey] >= 2 && !state.mastered.includes(key)) state.mastered.push(key);
    $("feedback").className = "feedback ok";
    $("feedback").textContent = `✓ Chính xác — ${item.word} = ${item.meaning}`;
  } else {
    button.classList.add("wrong");
    state.wrong[key] = (state.wrong[key] || 0) + 1;
    wrongThisSession.push(item);
    const correctText = state.mode === "vien" ? item.word : item.meaning;
    const correctButton = [...document.querySelectorAll(".answer")].find(x => x.textContent === correctText);
    if (correctButton) correctButton.classList.add("correct");
    $("feedback").className = "feedback bad";
    $("feedback").textContent = `✕ ${item.word} = ${item.meaning}`;
  }

  if (state.mode !== "envi") revealPronunciation(item);
  saveState();
  $("scoreValue").textContent = score;
  $("nextBtn").classList.remove("hidden");
  $("nextBtn").textContent = currentIndex === currentSession.length - 1 ? "Xem kết quả" : "Tiếp tục";
}

function nextQuestion() {
  if (!answered) return;
  if (currentIndex < currentSession.length - 1) {
    currentIndex++;
    renderQuestion();
  } else showResult();
}

function showResult() {
  $("quizProgressBar").style.width = "100%";
  const wrongCount = currentSession.length - score;
  $("resultCorrect").textContent = score;
  $("resultWrong").textContent = wrongCount;
  $("resultMastered").textContent = state.mastered.length;
  $("resultTitle").textContent = `${score}/${currentSession.length} câu đúng`;

  if (score === currentSession.length) {
    $("resultEmoji").textContent = "🏆";
    $("resultText").textContent = "Bạn làm đúng toàn bộ. Có thể chuyển sang nhóm từ tiếp theo.";
  } else if (score >= Math.ceil(currentSession.length * .7)) {
    $("resultEmoji").textContent = "🎉";
    $("resultText").textContent = `Khá tốt. Hãy ôn lại ${wrongCount} từ vừa sai để nhớ chắc hơn.`;
  } else {
    $("resultEmoji").textContent = "💪";
    $("resultText").textContent = `Bạn nên làm lại ${wrongCount} từ sai trước khi học nhóm mới.`;
  }
  $("retryWrongBtn").classList.toggle("hidden", wrongThisSession.length === 0);
  showView("resultView");
}

function applyTheme() {
  document.body.classList.toggle("dark", !!state.dark);
  $("themeBtn").textContent = state.dark ? "🌙" : "☀️";
}

function restoreChoices() {
  document.querySelectorAll("#sizeChoices .choice").forEach(x => x.classList.toggle("active", Number(x.dataset.size) === state.sessionSize));
  document.querySelectorAll("#modeChoices .mode-card").forEach(x => x.classList.toggle("active", x.dataset.mode === state.mode));
}

document.querySelectorAll("#browseTabs .browse-tab").forEach(btn => {
  btn.onclick = () => { state.browseMode = btn.dataset.browse; saveState(); renderHome(); };
});

document.querySelectorAll("#sizeChoices .choice").forEach(btn => {
  btn.onclick = () => {
    state.sessionSize = Number(btn.dataset.size);
    document.querySelectorAll("#sizeChoices .choice").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    saveState();
  };
});

document.querySelectorAll("#modeChoices .mode-card").forEach(btn => {
  btn.onclick = () => {
    state.mode = btn.dataset.mode;
    document.querySelectorAll("#modeChoices .mode-card").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    saveState();
  };
});

$("topicSearch").addEventListener("input", e => renderTopics(e.target.value));
$("themeBtn").onclick = () => { state.dark = !state.dark; saveState(); applyTheme(); };
$("startBtn").onclick = startNormalSession;
$("reviewWrongBtn").onclick = startWrongReview;
$("nextBtn").onclick = nextQuestion;
$("backBtn").onclick = () => { renderHome(); showView("homeView"); };
$("homeBtn").onclick = () => { renderHome(); showView("homeView"); };
$("retryWrongBtn").onclick = async () => {
  const uniq = [];
  const seen = new Set();
  for (const item of wrongThisSession) {
    const key = keyOf(item.word);
    if (!seen.has(key)) { seen.add(key); uniq.push(item); }
  }
  if (uniq.length) await prepareSession(uniq);
};

applyTheme();
restoreChoices();
loadVocabulary();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
