
const VOCAB_SOURCE = "https://raw.githubusercontent.com/mankhb2k/Vocabulary-English/main/json/Vocabulary-levels.json";
const TARGET_WORDS = 3000;
const STAGE_SIZE = 100;

const OFFLINE_MEANINGS = {"a": "một; một cái", "about": "về; khoảng", "above": "ở trên", "across": "băng qua", "action": "hành động", "activity": "hoạt động", "actor": "nam diễn viên", "actress": "nữ diễn viên", "add": "thêm", "address": "địa chỉ", "adult": "người lớn", "advice": "lời khuyên", "afraid": "sợ", "after": "sau", "afternoon": "buổi chiều", "again": "lại; một lần nữa", "age": "tuổi", "ago": "trước đây", "agree": "đồng ý", "air": "không khí", "airport": "sân bay", "all": "tất cả", "also": "cũng", "always": "luôn luôn", "amazing": "tuyệt vời", "and": "và", "angry": "tức giận", "animal": "động vật", "another": "một cái khác", "answer": "câu trả lời", "any": "bất kỳ", "anyone": "bất kỳ ai", "anything": "bất cứ điều gì", "apartment": "căn hộ", "apple": "quả táo", "area": "khu vực", "arm": "cánh tay", "around": "xung quanh", "arrive": "đến", "art": "nghệ thuật", "article": "bài viết", "artist": "nghệ sĩ", "ask": "hỏi", "at": "ở; tại", "aunt": "cô; dì; bác gái", "autumn": "mùa thu", "away": "xa; đi khỏi", "baby": "em bé", "back": "phía sau; quay lại", "bad": "xấu; tệ", "bag": "túi", "ball": "quả bóng", "banana": "quả chuối", "band": "ban nhạc", "bank": "ngân hàng", "bath": "bồn tắm; tắm", "bathroom": "phòng tắm", "be": "là; thì; ở", "beach": "bãi biển", "beautiful": "đẹp", "because": "bởi vì", "become": "trở thành", "bed": "giường", "bedroom": "phòng ngủ", "before": "trước", "begin": "bắt đầu", "beginning": "sự bắt đầu", "behind": "phía sau", "believe": "tin", "below": "bên dưới", "best": "tốt nhất", "better": "tốt hơn", "between": "ở giữa", "bicycle": "xe đạp", "big": "to; lớn", "bike": "xe đạp", "bill": "hóa đơn", "bird": "chim", "birthday": "sinh nhật", "black": "màu đen", "blue": "màu xanh dương", "boat": "thuyền", "body": "cơ thể", "book": "sách", "boot": "ủng", "bored": "chán", "boring": "nhàm chán", "born": "được sinh ra", "both": "cả hai", "bottle": "chai", "box": "hộp", "boy": "cậu bé", "boyfriend": "bạn trai", "bread": "bánh mì", "break": "nghỉ; làm vỡ", "breakfast": "bữa sáng", "bring": "mang đến", "brother": "anh/em trai", "brown": "màu nâu", "build": "xây dựng", "building": "tòa nhà", "bus": "xe buýt", "business": "kinh doanh; doanh nghiệp", "busy": "bận", "but": "nhưng", "butter": "bơ", "buy": "mua", "by": "bởi; bằng; cạnh", "bye": "tạm biệt", "cafe": "quán cà phê", "cake": "bánh ngọt", "call": "gọi", "camera": "máy ảnh", "can": "có thể", "capital": "thủ đô; vốn", "car": "xe hơi", "card": "thẻ", "career": "sự nghiệp", "carrot": "cà rốt", "carry": "mang; vác", "cat": "mèo", "cent": "xu", "centre": "trung tâm", "century": "thế kỷ", "chair": "ghế", "change": "thay đổi", "cheap": "rẻ", "check": "kiểm tra", "cheese": "phô mai", "chicken": "gà"};
const EXTRA_WORDS = ["accomplishment", "accountability", "adaptable", "administrator", "adulthood", "adviser", "aerospace", "agriculture", "allocation", "ambition", "analyst", "announcement", "applicant", "architecture", "assignment", "atmosphere", "authority", "awareness", "background", "backup", "benchmark", "biography", "blockchain", "boundary", "bravery", "browser", "campaign", "candidate", "celebration", "championship", "characteristic", "circulation", "citizenship", "collaboration", "colleague", "commitment", "communication", "comparison", "competition", "complaint", "complexity", "concentration", "conclusion", "confidence", "confirmation", "conservation", "construction", "consultant", "contribution", "convenience", "cooperation", "coordination", "creativity", "credibility", "curiosity", "deadline", "decision-making", "dedication", "democracy", "destination", "developer", "development", "device", "diagnosis", "discipline", "discovery", "discussion", "diversity", "documentation", "efficiency", "electricity", "emergency", "emotion", "encouragement", "energy", "entertainment", "environment", "equipment", "evaluation", "evidence", "excellence", "expectation", "expertise", "exploration", "feedback", "flexibility", "foundation", "framework", "freedom", "frequency", "friendship", "geography", "guidance", "hardware", "healthcare", "imagination", "independence", "innovation", "insight", "installation", "instruction", "insurance", "integration", "leadership", "lifestyle", "logic", "maintenance", "manufacturing", "marketing", "measurement", "motivation", "navigation", "negotiation", "network", "nutrition", "opportunity", "organization", "performance", "permission", "personality", "photography", "planning", "platform", "possibility", "presentation", "productivity", "programming", "qualification", "quality", "reaction", "recommendation", "relationship", "reliability", "replacement", "reputation", "requirement", "resource", "responsibility", "satisfaction", "security", "selection", "software", "stability", "standard", "strategy", "strength", "sustainability", "teamwork", "technique", "telecommunication", "timeline", "tradition", "transition", "transportation", "treatment", "troubleshooting", "university", "usability", "validation", "variation", "vocabulary", "warehouse", "workflow", "workplace"];

const $ = (id) => document.getElementById(id);

const defaultState = {
  selectedStage: 1,
  sessionSize: 10,
  mode: "envi",
  mastered: [],
  wrong: {},
  seen: {},
  meaningCache: {},
  dark: false
};

let state = { ...defaultState, ...JSON.parse(localStorage.getItem("english3000State") || "{}") };
if (!state.wrong) state.wrong = {};
if (!state.seen) state.seen = {};
if (!state.meaningCache) state.meaningCache = {};

let vocab = [];
let currentSession = [];
let currentIndex = 0;
let score = 0;
let wrongThisSession = [];
let answered = false;

function saveState() {
  localStorage.setItem("english3000State", JSON.stringify(state));
}

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});
}

function uniqueWords(items) {
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    if (typeof raw !== "string") continue;
    const word = raw.trim();
    if (!word || word.length > 40) continue;
    if (/^(adj\.|adv\.|n\.|v\.)$/i.test(word)) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(word);
  }
  return out;
}

async function loadVocabulary() {
  try {
    const r = await fetch(VOCAB_SOURCE, { cache: "force-cache" });
    if (!r.ok) throw new Error("Không tải được dữ liệu");
    const data = await r.json();
    const rows = [];
    Object.entries(data.levels || {}).forEach(([level, item]) => {
      (item.words || []).forEach(word => rows.push({word, level}));
    });

    const clean = [];
    const used = new Set();
    for (const item of rows) {
      const key = String(item.word).trim().toLowerCase();
      if (!key || used.has(key) || key.length > 40) continue;
      if (/^(adj\.|adv\.|n\.|v\.)$/i.test(key)) continue;
      used.add(key);
      clean.push({word:item.word.trim(), level:item.level});
    }

    for (const w of EXTRA_WORDS) {
      if (clean.length >= TARGET_WORDS) break;
      const key = w.toLowerCase();
      if (!used.has(key)) {
        used.add(key);
        clean.push({word:w, level:"B2"});
      }
    }

    vocab = clean.slice(0, TARGET_WORDS);
    if (vocab.length < 100) throw new Error("Dữ liệu quá ít");
  } catch (e) {
    // Offline fallback: đủ để app vẫn chạy và người dùng có thể học nhóm đầu.
    vocab = Object.keys(OFFLINE_MEANINGS).map(word => ({word, level:"A1"}));
  }
  renderHome();
}

async function translateWord(word) {
  const key = word.toLowerCase();
  if (OFFLINE_MEANINGS[key]) return OFFLINE_MEANINGS[key];
  if (state.meaningCache[key]) return state.meaningCache[key];

  const cachedOnly = !navigator.onLine;
  if (cachedOnly) return "chưa có nghĩa offline";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);

  try {
    const url = "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(word) + "&langpair=en|vi";
    const r = await fetch(url, { signal: controller.signal });
    const data = await r.json();
    let translated = data?.responseData?.translatedText?.trim();
    if (translated && translated.toLowerCase() !== key && translated.length < 120) {
      state.meaningCache[key] = translated;
      saveState();
      return translated;
    }
  } catch (e) {
  } finally {
    clearTimeout(timer);
  }

  try {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=" + encodeURIComponent(word);
    const r = await fetch(url);
    const data = await r.json();
    const translated = data?.[0]?.map(x => x?.[0] || "").join("").trim();
    if (translated) {
      state.meaningCache[key] = translated;
      saveState();
      return translated;
    }
  } catch (e) {}

  return "chưa tải được nghĩa";
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = .82;
  speechSynthesis.speak(u);
}

function renderHome() {
  const mastered = new Set(state.mastered || []);
  $("masteredTop").textContent = mastered.size;
  const pct = Math.min(100, Math.round(mastered.size / TARGET_WORDS * 100));
  $("totalPercent").textContent = pct + "%";
  $("totalProgress").style.width = pct + "%";

  const grid = $("stageGrid");
  grid.innerHTML = "";
  for (let i=1;i<=30;i++) {
    const start = (i-1)*STAGE_SIZE;
    const end = Math.min(i*STAGE_SIZE, TARGET_WORDS);
    const stageWords = vocab.slice(start,end);
    const known = stageWords.filter(x => mastered.has(x.word.toLowerCase())).length;

    const b = document.createElement("button");
    b.className = "stage-btn" + (state.selectedStage===i ? " active":"") + (known>=100 ? " done":"");
    b.innerHTML = `<strong>Chặng ${i}</strong><small>${known}/100 từ</small>`;
    b.onclick = () => {
      state.selectedStage = i;
      saveState();
      renderHome();
    };
    grid.appendChild(b);
  }
}

function pickSessionWords() {
  const start = (state.selectedStage-1) * STAGE_SIZE;
  const stage = vocab.slice(start, start + STAGE_SIZE);
  if (!stage.length) return [];

  const wrongFirst = [...stage].sort((a,b) =>
    (state.wrong[b.word.toLowerCase()] || 0) - (state.wrong[a.word.toLowerCase()] || 0)
  );

  // Ưu tiên từ chưa thuộc, sau đó mới đến từ đã thuộc.
  const notMastered = wrongFirst.filter(x => !state.mastered.includes(x.word.toLowerCase()));
  const mastered = wrongFirst.filter(x => state.mastered.includes(x.word.toLowerCase()));
  return [...notMastered, ...mastered].slice(0, state.sessionSize);
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - .5);
}

async function prepareSession(words) {
  showView("loadingView");
  $("loadingText").textContent = `Đang chuẩn bị ${words.length} từ…`;

  currentSession = [];
  for (let i=0;i<words.length;i++) {
    $("loadingText").textContent = `Đang tải nghĩa ${i+1}/${words.length}…`;
    const meaning = await translateWord(words[i].word);
    currentSession.push({...words[i], meaning});
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
  if (!words.length) return alert("Chặng này chưa có dữ liệu.");
  await prepareSession(words);
}

async function startWrongReview() {
  if (!vocab.length) await loadVocabulary();
  const wrongKeys = Object.entries(state.wrong)
    .filter(([,count]) => count > 0)
    .sort((a,b) => b[1]-a[1])
    .map(([w]) => w);

  const pool = vocab.filter(x => wrongKeys.includes(x.word.toLowerCase())).slice(0, state.sessionSize);
  if (!pool.length) {
    alert("Bạn chưa có từ sai để ôn.");
    return;
  }
  await prepareSession(pool);
}

function makeDistractors(item) {
  let pool = currentSession.filter(x => x.word !== item.word && x.meaning !== item.meaning);
  if (pool.length < 3) {
    pool = vocab
      .filter(x => x.word !== item.word)
      .slice(0, Math.max(20, state.sessionSize))
      .map(x => ({...x, meaning: state.meaningCache[x.word.toLowerCase()] || OFFLINE_MEANINGS[x.word.toLowerCase()] || x.word}));
  }
  return shuffled(pool).slice(0,3);
}

function renderQuestion() {
  answered = false;
  $("feedback").className = "feedback";
  $("feedback").textContent = "";
  $("nextBtn").classList.add("hidden");

  const item = currentSession[currentIndex];
  const total = currentSession.length;
  const pct = ((currentIndex) / total) * 100;

  $("quizProgressBar").style.width = pct + "%";
  $("quizProgressText").textContent = `${currentIndex+1}/${total}`;
  $("scoreValue").textContent = score;
  $("stageLabel").textContent = `Chặng ${state.selectedStage}`;
  $("levelLabel").textContent = item.level || "A1";

  const options = shuffled([item, ...makeDistractors(item)]);
  const answerBox = $("answers");
  answerBox.innerHTML = "";

  $("audioBtn").classList.toggle("hidden", state.mode !== "listen");
  $("wordAudioBtn").classList.toggle("hidden", state.mode === "listen");

  if (state.mode === "envi") {
    $("promptLabel").textContent = "Chọn nghĩa tiếng Việt đúng";
    $("questionWord").textContent = item.word;
    options.forEach(opt => addAnswer(opt.meaning, opt.word === item.word, item));
  } else if (state.mode === "vien") {
    $("promptLabel").textContent = "Chọn từ tiếng Anh đúng";
    $("questionWord").textContent = item.meaning;
    options.forEach(opt => addAnswer(opt.word, opt.word === item.word, item));
  } else {
    $("promptLabel").textContent = "Nghe rồi chọn nghĩa đúng";
    $("questionWord").textContent = "🎧";
    options.forEach(opt => addAnswer(opt.meaning, opt.word === item.word, item));
    setTimeout(() => speak(item.word), 350);
  }

  $("wordAudioBtn").onclick = () => speak(item.word);
  $("audioBtn").onclick = () => speak(item.word);
}

function addAnswer(label, isCorrect, item) {
  const b = document.createElement("button");
  b.className = "answer";
  b.textContent = label;
  b.onclick = () => chooseAnswer(b, isCorrect, item);
  $("answers").appendChild(b);
}

function chooseAnswer(button, isCorrect, item) {
  if (answered) return;
  answered = true;

  const key = item.word.toLowerCase();
  state.seen[key] = (state.seen[key] || 0) + 1;

  document.querySelectorAll(".answer").forEach(btn => btn.disabled = true);

  if (isCorrect) {
    score++;
    button.classList.add("correct");
    state.wrong[key] = Math.max(0, (state.wrong[key] || 0) - 1);

    // Sau 2 lần trả lời đúng thì coi như đã thuộc.
    const correctKey = "correct:" + key;
    state.seen[correctKey] = (state.seen[correctKey] || 0) + 1;
    if (state.seen[correctKey] >= 2 && !state.mastered.includes(key)) {
      state.mastered.push(key);
    }

    $("feedback").className = "feedback ok";
    $("feedback").textContent = `✓ Chính xác — ${item.word} = ${item.meaning}`;
  } else {
    button.classList.add("wrong");
    state.wrong[key] = (state.wrong[key] || 0) + 1;
    wrongThisSession.push(item);

    // đánh dấu đáp án đúng
    const answers = [...document.querySelectorAll(".answer")];
    const correctText = state.mode === "vien" ? item.word : item.meaning;
    const correctButton = answers.find(x => x.textContent === correctText);
    if (correctButton) correctButton.classList.add("correct");

    $("feedback").className = "feedback bad";
    $("feedback").textContent = `✕ ${item.word} = ${item.meaning}`;
  }

  saveState();
  $("scoreValue").textContent = score;
  $("nextBtn").classList.remove("hidden");
  $("nextBtn").textContent = currentIndex === currentSession.length-1 ? "Xem kết quả" : "Tiếp tục";
}

function nextQuestion() {
  if (!answered) return;
  if (currentIndex < currentSession.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    showResult();
  }
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
  } else if (score >= Math.ceil(currentSession.length*.7)) {
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

function restoreChoices() {
  document.querySelectorAll("#sizeChoices .choice").forEach(x =>
    x.classList.toggle("active", Number(x.dataset.size) === state.sessionSize)
  );
  document.querySelectorAll("#modeChoices .mode-card").forEach(x =>
    x.classList.toggle("active", x.dataset.mode === state.mode)
  );
}

$("themeBtn").onclick = () => { state.dark = !state.dark; saveState(); applyTheme(); };
$("startBtn").onclick = startNormalSession;
$("reviewWrongBtn").onclick = startWrongReview;
$("nextBtn").onclick = nextQuestion;
$("backBtn").onclick = () => { renderHome(); showView("homeView"); };
$("homeBtn").onclick = () => { renderHome(); showView("homeView"); };
$("retryWrongBtn").onclick = async () => {
  const uniq = [];
  const seen = new Set();
  for (const w of wrongThisSession) {
    const k = w.word.toLowerCase();
    if (!seen.has(k)) { seen.add(k); uniq.push(w); }
  }
  if (!uniq.length) return;
  await prepareSession(uniq);
};

applyTheme();
restoreChoices();
loadVocabulary();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
