// ====== GLOBAL VARIABLES & HELPERS ======
let words = JSON.parse(localStorage.getItem("osmanlicaWords") || "[]");
let filteredWords = words.slice();
function saveWords() { localStorage.setItem("osmanlicaWords", JSON.stringify(words)); }
function getFavorites() { return JSON.parse(localStorage.getItem("favorites") || "[]"); }
function setFavorites(favs) { localStorage.setItem("favorites", JSON.stringify(favs)); }
function isFavorite(word) { return getFavorites().includes(word.osmanlica || word.latince); }
function getLearnedWords() { return JSON.parse(localStorage.getItem("learnedWords") || "[]"); }
function setLearnedWords(list) { localStorage.setItem("learnedWords", JSON.stringify(list)); }
function isLearned(word) { return getLearnedWords().includes(word.osmanlica || word.latince); }
function getQuizResults() { return JSON.parse(localStorage.getItem("quizResults") || "[]"); }
function setQuizResults(arr) { localStorage.setItem("quizResults", JSON.stringify(arr)); }

// ====== PROFIL / ROZET + PROFIL FOTO ======
window.addEventListener('DOMContentLoaded', function() { // DOM yüklendikten sonra tüm eventleri ata!
document.getElementById("profileBtn").onclick = function() {
  let { learned, total, quizCount, badges } = showProfileStats();
  let profilResmi = localStorage.getItem("userProfilePic") || "";
  let html = `
    <h2>Profil & Rozetler</h2>
    <div style="margin-bottom:8px;">
      <label for="profilePicInput" style="cursor:pointer;">
        <img src="${profilResmi || 'https://ui-avatars.com/api/?name=Kullanici'}"
             style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:2px solid #ccc;" alt="Profil" title="Profil resmini değiştir">
      </label>
      <input id="profilePicInput" type="file" accept="image/*" style="display:none">
    </div>
    <p><b>Toplam Kelime:</b> ${total}</p>
    <p><b>Öğrenilen Kelime:</b> ${learned}</p>
    <p><b>Çözülen Quiz:</b> ${quizCount}</p>
    <p><b>Rozetler:</b> ${badges.length ? badges.join(", ") : "Yok"}</p>
    <button onclick="document.getElementById('profileModal').style.display='none'">Kapat</button>`;
  document.getElementById("profileContent").innerHTML = html;
  document.getElementById("profileModal").style.display = "flex";
  document.getElementById("profilePicInput").onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      localStorage.setItem("userProfilePic", ev.target.result);
      document.querySelector("#profileContent img").src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };
};
function showProfileStats() {
  const learned = getLearnedWords().length;
  const total = words.length;
  const quizResults = getQuizResults();
  const badges = [];
  if (learned >= 10) badges.push("10+ kelime");
  if (learned >= 50) badges.push("50+ kelime");
  if (quizResults.length >= 3) badges.push("3+ quiz");
  if (quizResults.length >= 10) badges.push("10+ quiz");
  if (learned >= 1 && quizResults.length >= 1) badges.push("Başlangıç Rozeti");
  return { learned, total, quizCount: quizResults.length, badges };
}

// ====== FLASHCARD ======
function renderFlashcards(list) {
  const container = document.getElementById("flashcardContainer");
  container.innerHTML = "";
  const colors = [
    "#FFEB3B", "#8BC34A", "#03A9F4", "#FF9800",
    "#E91E63", "#9C27B0", "#607D8B", "#F44336"
  ];
  list.forEach((wordObj, idx) => {
    const card = document.createElement("div");
    card.className = "flashcard";
    card.tabIndex = 0;
    card.style.position = "relative";
    let osmanlica = wordObj.osmanlica ? `<div class="osmanlica-arap-font">${wordObj.osmanlica}</div>` : '';
    let latince = wordObj.latince ? `<div class="latince-font">${wordObj.latince}</div>` : '';
    let img = wordObj.elYazisiImg ? `<img class="el-yazisi-img" src="${wordObj.elYazisiImg}" alt="El yazısı">` : "";
    let audioBtn = wordObj.audio ? `<button class="audio-btn" onclick="event.stopPropagation();playAudio('${wordObj.audio}')"><i class="fa fa-volume-up"></i> Dinle</button>` : "";
    const fav = isFavorite(wordObj);
    const learned = isLearned(wordObj);
    card.innerHTML = `
      <button class="favorite-star${fav ? "" : " inactive"}" title="Favorilere ekle/çıkar">&#9733;</button>
      <button class="learned-btn${learned ? " learned" : ""}" title="Öğrendim">${learned ? "✓" : "✔"}</button>
      <div class="flashcard-inner">
        <div class="flashcard-front" style="background:${colors[idx % colors.length]};">${osmanlica}${latince}${img}${audioBtn}</div>
        <div class="flashcard-back">${wordObj.anlam || "-"}</div>
      </div>
    `;
    card.querySelector(".favorite-star").onclick = (e) => { e.stopPropagation(); toggleFavorite(wordObj); };
    card.querySelector(".learned-btn").onclick = (e) => { e.stopPropagation(); toggleLearned(wordObj); };
    card.addEventListener("click", () => card.classList.toggle("flipped"));
    card.addEventListener("keypress", (e) => { if (e.key === "Enter") card.classList.toggle("flipped"); });
    container.appendChild(card);
  });
  updateLearnedStats();
}
function playAudio(urlOrData) { let audio = new Audio(urlOrData); audio.play(); }
function toggleFavorite(word) {
  let favs = getFavorites();
  const key = word.osmanlica || word.latince;
  const idx = favs.indexOf(key);
  if (idx === -1) favs.push(key); else favs.splice(idx, 1);
  setFavorites(favs); renderFlashcards(filteredWords);
}
function toggleLearned(word) {
  let lw = getLearnedWords();
  const key = word.osmanlica || word.latince;
  const idx = lw.indexOf(key);
  if (idx === -1) lw.push(key); else lw.splice(idx, 1);
  setLearnedWords(lw); renderFlashcards(filteredWords); updateLearnedStats();
}
function updateLearnedStats() {
  const total = words.length; const learned = getLearnedWords().length;
  document.getElementById("learnedStats").innerText = total ? `Öğrenilen: ${learned}/${total}` : "";
}

// ====== FİLTRELEME ======
let onlyFavs = false, onlyLearned = false, onlyUnlearned = false;
document.getElementById("showOnlyFavsBtn").onclick = function() {
  onlyFavs = !onlyFavs; onlyLearned = false; onlyUnlearned = false;
  filteredWords = onlyFavs ? words.filter(isFavorite) : words.slice();
  renderFlashcards(filteredWords);
};
document.getElementById("showOnlyLearnedBtn").onclick = function() {
  onlyLearned = !onlyLearned; onlyFavs = false; onlyUnlearned = false;
  filteredWords = onlyLearned ? words.filter(isLearned) : words.slice();
  renderFlashcards(filteredWords);
};
document.getElementById("showOnlyUnlearnedBtn").onclick = function() {
  onlyUnlearned = !onlyUnlearned; onlyFavs = false; onlyLearned = false;
  filteredWords = onlyUnlearned ? words.filter(w=>!isLearned(w)) : words.slice();
  renderFlashcards(filteredWords);
};

// ====== ARAMA ======
document.getElementById("search").oninput = function() {
  const val = this.value.trim().toLowerCase();
  filteredWords = words.filter(w =>
    (w.osmanlica && w.osmanlica.toLowerCase().includes(val)) ||
    (w.latince && w.latince.toLowerCase().includes(val)) ||
    (w.anlam && w.anlam.toLowerCase().includes(val))
  );
  if (onlyFavs) filteredWords = filteredWords.filter(isFavorite);
  if (onlyLearned) filteredWords = filteredWords.filter(isLearned);
  if (onlyUnlearned) filteredWords = filteredWords.filter(w=>!isLearned(w));
  renderFlashcards(filteredWords);
};

// ====== OSMANLICA KLAVYESİ ======
const osmanlicaChars = [
  "ا","ب","پ","ت","ث","ج","چ","ح","خ","د","ذ","ر","ز","ژ","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","گ","ل","م","ن","ه","و","ی","ء","ً","ٌ","ٍ","َ","ُ","ِ","ّ","ْ"
];
document.getElementById("osmanlicaKeyboardBtn").onclick = function() {
  let html = osmanlicaChars.map(harf => `<button onclick="window.insertOsmanlicaChar&&insertOsmanlicaChar('${harf}')">${harf}</button>`).join("");
  document.getElementById("osmanlicaKeyboard").innerHTML = html;
  document.getElementById("osmanlicaKeyboardModal").style.display = "flex";
};
window.insertOsmanlicaChar = function(harf) {
  const inp = document.activeElement;
  if(inp && inp.value!==undefined) {
    let start = inp.selectionStart, end = inp.selectionEnd;
    let val = inp.value;
    inp.value = val.substring(0, start) + harf + val.substring(end);
    inp.focus();
    inp.selectionStart = inp.selectionEnd = start + 1;
  }
};

// ====== OSMANLICA ÇİZİM MODALI ======
window.showDrawModal = function() {
  document.getElementById('drawModal').style.display = 'flex';
  clearCanvas();
  document.getElementById('canvasPreview').innerHTML = "";
};
const canvas = document.getElementById('osmanlicaCanvas');
const ctx = canvas.getContext('2d');
let drawing = false, lastX=0, lastY=0;
canvas.addEventListener('mousedown', e => { drawing = true; [lastX, lastY] = getXY(e); });
canvas.addEventListener('mousemove', e => { if (!drawing) return; drawLine(e); });
canvas.addEventListener('mouseup',   e => { drawing = false; });
canvas.addEventListener('mouseout',  e => { drawing = false; });
canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; [lastX, lastY] = getXY(e.touches[0]); });
canvas.addEventListener('touchmove',  e => { e.preventDefault(); if (!drawing) return; drawLine(e.touches[0]); });
canvas.addEventListener('touchend',   e => { drawing = false; });
function getXY(e) {
  const rect = canvas.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top];
}
function drawLine(e) {
  const [x, y] = getXY(e);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#222";
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  [lastX, lastY] = [x, y];
}
function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
document.getElementById('clearCanvasBtn').onclick = clearCanvas;
document.getElementById('saveCanvasBtn').onclick = function() {
  const dataUrl = canvas.toDataURL('image/png');
  document.getElementById('canvasPreview').innerHTML = `<img src="${dataUrl}"><br><small>Kaydedildi!</small>`;
  window.latestDrawnImage = dataUrl;
};

// ====== KELİME EKLEME MODALI ======
document.getElementById("addWordShowBtn").onclick = function() {
  document.getElementById("addWordModal").style.display = "flex";
  document.getElementById("addOsmanlica").value = "";
  document.getElementById("addLatince").value = "";
  document.getElementById("addAnlam").value = "";
  document.getElementById("addElYazisiImg").value = "";
  document.getElementById("addAudio").value = "";
};
document.getElementById("addWordBtn").onclick = function() {
  const osmanlica = document.getElementById("addOsmanlica").value.trim();
  const latince = document.getElementById("addLatince").value.trim();
  const anlam = document.getElementById("addAnlam").value.trim();
  const imgInput = document.getElementById("addElYazisiImg");
  const audioInput = document.getElementById("addAudio");
  let imgData = window.latestDrawnImage || "";
  window.latestDrawnImage = undefined;
  function finalize(audioData) {
    words.push({ osmanlica, latince, anlam, elYazisiImg: imgData, audio: audioData });
    saveWords();
    filteredWords = words.slice(); renderFlashcards(filteredWords);
  }
  if ((!osmanlica && !latince) || !anlam) { alert("En az Osmanlıca veya Latince ve anlamı zorunlu!"); return; }
  if (!imgData && imgInput.files && imgInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      imgData = e.target.result;
      if (audioInput.files && audioInput.files[0]) {
        const reader2 = new FileReader();
        reader2.onload = function(ev) {
          finalize(ev.target.result);
        }
        reader2.readAsDataURL(audioInput.files[0]);
      } else { finalize(""); }
    };
    reader.readAsDataURL(imgInput.files[0]);
  } else if (audioInput.files && audioInput.files[0]) {
    const reader2 = new FileReader();
    reader2.onload = function(ev) {
      finalize(ev.target.result);
    }
    reader2.readAsDataURL(audioInput.files[0]);
  } else { finalize(""); }
  document.getElementById("addWordModal").style.display = "none";
};

// ====== DIŞA/İÇE AKTAR ======
document.getElementById("exportWordsBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(words, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kelimelerim.json";
  a.click();
  URL.revokeObjectURL(url);
};
document.getElementById("importWordsBtn").onclick = () => {
  document.getElementById("importWordsFile").click();
};
document.getElementById("importWordsFile").onchange = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    let text = ev.target.result;
    let parsed = [];
    try {
      if (file.name.endsWith(".json") || isLikelyJson(text)) {
        parsed = parseJSONFlexible(text);
      } else if (file.name.endsWith(".csv")) {
        parsed = parseCSV(text);
      } else if (file.name.endsWith(".txt")) {
        parsed = parseTXT(text);
      } else {
        parsed = parseJSONFlexible(text);
        if (!Array.isArray(parsed) || parsed.length === 0) parsed = parseCSV(text);
        if (!Array.isArray(parsed) || parsed.length === 0) parsed = parseTXT(text);
      }
    } catch (err) { alert("Dosya okuma hatası: " + err.message); return; }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      alert("Dosyada uygun kelime bulunamadı. Dosya biçimi ve içeriğini kontrol edin.");
      return;
    }
    words = parsed.map(mapToUnifiedWord);
    saveWords();
    filteredWords = words.slice();
    renderFlashcards(filteredWords);
    alert("Kelime listesi başarıyla yüklendi!");
  };
  reader.readAsText(file);
};
function isLikelyJson(text) { return text.trim().startsWith("{") || text.trim().startsWith("["); }
function parseJSONFlexible(text) {
  let obj = JSON.parse(text);
  if (Array.isArray(obj)) return obj;
  if (typeof obj === "object" && obj !== null) {
    if (Array.isArray(obj.latin_phrases)) return obj.latin_phrases;
    if (Object.keys(obj).length && typeof Object.values(obj)[0] === "object") {
      return Object.entries(obj).map(([k, v]) => ({ osmanlica: k, ...v }));
    } else {
      return [obj];
    }
  }
  return [];
}
function parseCSV(text) {
  let lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith("#"));
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map(s => s.trim().toLowerCase());
  let hasHeader = header.includes("osmanlica") || header.includes("latince") || header.includes("kelime") || header.includes("anlam") || header.includes("phrase") || header.includes("meaning") || header.includes("çoğul") || header.includes("tekil");
  let startIdx = hasHeader ? 1 : 0;
  let result = [];
  for (let i = startIdx; i < lines.length; i++) {
    let parts = lines[i].split(",");
    if (parts.length < 2) continue;
    let obj = {};
    if (header.length === parts.length && hasHeader) {
      header.forEach((h, idx) => obj[h] = parts[idx].trim());
    } else {
      obj.kelime = parts[0].trim();
      obj.anlam = parts[1].trim();
    }
    result.push(obj);
  }
  return result;
}
function parseTXT(text) {
  return text.split('\n')
    .map(line => line.trim())
    .filter(line => line && line.includes(":"))
    .map(line => {
      let [kelime, ...rest] = line.split(":");
      let anlam = rest.join(":").trim();
      return { kelime: kelime.trim(), anlam };
    });
}
function mapToUnifiedWord(obj) {
  if (obj.çoğul && obj.tekil) {
    return {
      osmanlica: obj.çoğul || "",
      latince: "",
      anlam: obj.tekil || "",
      elYazisiImg: obj.elYazisiImg || "",
      audio: obj.audio || ""
    };
  }
  if (obj["İsm-i Fâil"] && obj["Masdar"]) {
    return {
      osmanlica: obj["İsm-i Fâil"] || "",
      latince: "",
      anlam: obj["Masdar"] || "",
      elYazisiImg: obj.elYazisiImg || "",
      audio: obj.audio || ""
    };
  }
  return {
    osmanlica: obj.osmanlica || obj.kelime || obj.phrase || "",
    latince: obj.latince || "",
    anlam: obj.anlam || obj.meaning || obj.turkce || "",
    elYazisiImg: obj.elYazisiImg || "",
    audio: obj.audio || ""
  };
}
document.getElementById("telegramBtn").onclick = function() {
  window.open("https://t.me/Kadimlisan"); // Grup linkinizi buraya yazın
};
// ====== YORUM DEFTERİ ======
document.getElementById("notesBtn").onclick = () => {
  document.getElementById("notesArea").value = localStorage.getItem("userNotes") || "";
  document.getElementById("notesModal").style.display = "flex";
};
document.getElementById("notesArea").oninput = function() {
  localStorage.setItem("userNotes", this.value);
};

// ====== TOPLULUK/FORUM ======
document.getElementById("discussionsBtn").onclick = () => {
  window.open("https://github.com/ozzasci/latince-osmanlica-ezber/discussions", "_blank");
};

// ====== GAZETE OKUMA ======
// Gazete modalını menüden aç
document.getElementById("openGazeteBtnMenu").addEventListener("click", function() {
  window.open("http://www.osmanlicagazeteler.org", "_blank");
 
});

// ====== QUIZ ve QUIZ SONUÇLARI ======
const QUIZ_QUESTION_COUNT = 10;
function saveQuizResult(result) {
  let allResults = getQuizResults();
  allResults.push(result); setQuizResults(allResults);
}
function showQuizResults() {
  const results = getQuizResults();
  if (!results.length) { alert("Henüz hiç quiz çözülmemiş."); return; }
  let html = `<h2>Quiz Sonuçları</h2><table class="quiz-results-table">
    <tr>
      <th>Tarih</th>
      <th>Doğru</th>
      <th>Yanlış</th>
      <th>Başarı %</th>
      <th>Yanlışlar</th>
    </tr>`;
  for (let r of results.slice().reverse()) {
    html += `<tr>
      <td>${new Date(r.date).toLocaleString()}</td>
      <td style="color:green">${r.score}</td>
      <td style="color:red">${r.total - r.score}</td>
      <td>${Math.round(100 * r.score / r.total)}</td>
      <td>${r.wrongs && r.wrongs.length
        ? `<details><summary>Gör</summary><ul>` + r.wrongs.map(w =>
            `<li><b>${w.question}</b> → Doğru: ${w.correct}, Senin: ${w.user || "-"}</li>`
          ).join("") + `</ul></details>`
        : "-"}</td>
    </tr>`;
  }
  html += "</table>";
  html += `<button onclick="document.getElementById('quizResultsModal').style.display='none'">Kapat</button>`;
  document.getElementById("quizResultsContent").innerHTML = html;
  document.getElementById("quizResultsModal").style.display = "flex";
}
document.getElementById("showQuizResultsBtn").addEventListener("click", showQuizResults);

function startQuiz() {
  if (filteredWords.length < 4) { alert("Quiz için en az 4 kelime gerekir!"); return; }
  let quizWords = shuffle(filteredWords).slice(0, QUIZ_QUESTION_COUNT);
  let score = 0, current = 0, wrongAnswers = [], quizStartDate = new Date();
  showQuestion();
  function showQuestion() {
    if (current >= quizWords.length) return showResult();
    const question = quizWords[current];
    let questionText = question.osmanlica || question.latince;
    let options = [question.anlam];
    while (options.length < 4) {
      let wrong = filteredWords[Math.floor(Math.random() * filteredWords.length)];
      let wrongAns = wrong.anlam;
      if (wrongAns && !options.includes(wrongAns)) options.push(wrongAns);
    }
    options = shuffle(options);
    let userAnswer = prompt(
      `Soru ${current+1}/${quizWords.length}\n"${questionText}" anlamı nedir?\n` +
      options.map((opt, i) => `${i+1}) ${opt}`).join('\n')
    );
    if (!userAnswer) { if (confirm("Quizden çıkmak istiyor musunuz?")) return; return showQuestion(); }
    let ansIndex = parseInt(userAnswer.trim(), 10) - 1;
    if (options[ansIndex] === question.anlam) {
      score++; alert("Doğru!");
    } else {
      wrongAnswers.push({
        question: questionText,
        correct: question.anlam,
        user: options[ansIndex]
      });
      alert(`Yanlış! Doğru cevap: ${question.anlam}`);
    }
    current++; showQuestion();
  }
  function showResult() {
    saveQuizResult({
      date: quizStartDate,
      score,
      total: quizWords.length,
      wrongs: wrongAnswers
    });
    let msg = `Quiz Bitti!\nDoğru: ${score}/${quizWords.length}\nBaşarı: %${Math.round(100*score/quizWords.length)}`;
    if (wrongAnswers.length) {
      msg += "\nYanlışlarınız:\n";
      wrongAnswers.forEach(w => {
        msg += `- ${w.question}: Doğru = ${w.correct}, Senin cevabın = ${w.user}\n`;
      });
    }
    alert(msg);
  }
}
function shuffle(arr) {
  let a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
document.getElementById("startQuiz").addEventListener("click", startQuiz);
// Geri Bildirim Modalını Aç
document.getElementById("feedbackBtn").onclick = function() {
  document.getElementById("feedbackText").value = "";
  document.getElementById("feedbackType").value = "Öneri";
  document.getElementById("feedbackResult").innerText = "";
  document.getElementById("feedbackModal").style.display = "flex";
};

// Geri Bildirim Gönder
document.getElementById("feedbackSendBtn").onclick = function() {
  const type = document.getElementById("feedbackType").value;
  const msg = document.getElementById("feedbackText").value.trim();
  if (!msg) {
    document.getElementById("feedbackResult").innerText = "Lütfen bir mesaj yazınız.";
    return;
  }
  let feedbacks = JSON.parse(localStorage.getItem("userFeedbacks") || "[]");
  feedbacks.push({ type, msg, date: new Date().toISOString() });
  localStorage.setItem("userFeedbacks", JSON.stringify(feedbacks));
  document.getElementById("feedbackResult").innerText = "Görüşünüz kaydedildi, teşekkürler!";
  document.getElementById("feedbackText").value = "";
};

// ====== KELİME OYUNLARI GELİŞMİŞ ======
document.getElementById("wordGamesBtn").onclick = function() {
  let html = `<h2>Kelime Oyunları</h2>
    <select id="oyunTuruSec" style="font-size:1em;margin-bottom:7px;">
      <option value="zincir">Kelime Zinciri</option>
      <option value="dogruyanlis">Doğru/Yanlış</option>
      <option value="harf">Harf Tahmin</option>
    </select>
    <div id="oyunAlani"></div>
    <button onclick="document.getElementById('wordGamesModal').style.display='none'">Kapat</button>
    <div id="oyunGecmisi"></div>
    <style>
      .oyun-skor {margin:6px 0;font-weight:bold;}
      .oyun-kelime-ipuclu {font-size:1.3em;letter-spacing:6px;margin:8px 0;}
      .oyun-dogru {color:green;}
      .oyun-yanlis {color:red;}
    </style>`;
  document.getElementById("gamesContent").innerHTML = html;
  document.getElementById("wordGamesModal").style.display = "flex";
  document.getElementById("oyunTuruSec").onchange = oyunAlaniGoster;
  window.oyunGecmis = JSON.parse(localStorage.getItem("oyunGecmisi")||"[]");
  oyunAlaniGoster();
  oyunGecmisiGoster();
};

function oyunAlaniGoster() {
  const tur = document.getElementById("oyunTuruSec").value;
  const area = document.getElementById("oyunAlani");
  if (tur === "zincir") {
    window.zincir = [];
    area.innerHTML = `
      <div class="oyun-skor">Skor: <span id="zincirSkor">0</span></div>
      <div id="zincirOyun"></div>
      <input id="zincirInput" placeholder="Bir kelime gir" style="font-size:1.1em;">
      <button onclick="window.oyunKelimeEkle()">Ekle</button>
      <div id="zincirBilgi" style="margin-top:10px;font-size:1em;color:#7b1fa2"></div>
    `;
    window.oyunKelimeEkle = function() {
      let val = document.getElementById("zincirInput").value.trim();
      if (!val) { oyunZincirBilgi("Kelime giriniz!"); return; }
      if (window.zincir.length) {
        let last = window.zincir[window.zincir.length-1];
        if (val[0] !== last.slice(-1)) {
          oyunZincirBilgi("Zincir kuralı: Son harfle başlamalı!"); return;
        }
      }
      window.zincir.push(val);
      oyunZincirGuncelle();
      document.getElementById("zincirInput").value = "";
      document.getElementById("zincirSkor").innerText = window.zincir.length;
      if (window.zincir.length >= 5) { // min 5 zincir ile başarı
        oyunGecmisKaydet({
          tur: "Kelime Zinciri",
          skor: window.zincir.length,
          tarih: new Date().toISOString()
        });
      }
    }
    function oyunZincirGuncelle() {
      document.getElementById("zincirOyun").innerHTML = window.zincir.map(k => `<span style="margin:2px;padding:3px 7px;border-radius:7px;background:#e1bee7">${k}</span>`).join(" ➔ ");
    }
    function oyunZincirBilgi(msg) {
      document.getElementById("zincirBilgi").innerText = msg;
    }
  } else if (tur === "dogruyanlis") {
    // Oyun: random kelime, anlamı göster, doğru mu yanlış mı
    let skor = 0, toplam = 0;
    function yeniSoru() {
      let kel = words[Math.floor(Math.random()*words.length)];
      let dogruMu = Math.random()<0.5;
      let anlam = dogruMu ? kel.anlam : words[Math.floor(Math.random()*words.length)].anlam;
      area.innerHTML = `
        <div class="oyun-skor">Skor: <span id="oyunSkor">${skor}</span> / <span id="oyunToplam">${toplam}</span></div>
        <div><b>${kel.osmanlica || kel.latince}</b></div>
        <div>${anlam}</div>
        <button onclick="cevap(true)">Doğru</button>
        <button onclick="cevap(false)">Yanlış</button>
      `;
      window.cevap = (secim) => {
        toplam++;
        if ((anlam === kel.anlam) === secim) {
          skor++;
          alert("Doğru!");
        } else {
          alert("Yanlış!");
        }
        if (toplam >= 10) {
          oyunGecmisKaydet({
            tur: "Doğru/Yanlış",
            skor, toplam,
            tarih: new Date().toISOString()
          });
          area.innerHTML = `<div class="oyun-skor">Oyun Bitti! Skor: ${skor}/${toplam}</div>
            <button onclick="oyunAlaniGoster()">Yeniden Oyna</button>`;
        } else yeniSoru();
      };
    }
    yeniSoru();
  } else if (tur === "harf") {
    // Oyun: kelime harflerini _ ile gizle, her doğru harf açılır
    let kelArr = words.filter(w=>w.osmanlica||w.latince);
    let kel = kelArr[Math.floor(Math.random()*kelArr.length)];
    let secili = (kel.osmanlica || kel.latince || "").toLowerCase();
    let gorunen = Array.from(secili).map(h=>h===" "?" ":"_");
    let kalan = new Set(secili.replace(/ /g,"").split(""));
    let skor = 0;
    area.innerHTML = `
      <div class="oyun-skor">Skor: <span id="harfSkor">${skor}</span></div>
      <div class="oyun-kelime-ipuclu" id="harfIpuclu">${gorunen.join(" ")}</div>
      <input id="harfTahmin" maxlength="1" style="width:30px;font-size:1.3em;text-align:center;" autofocus>
      <button onclick="harfTahminEt()">Tahmin Et</button>
      <div id="harfBilgi"></div>
    `;
    window.harfTahminEt = function() {
      let harf = document.getElementById("harfTahmin").value.toLowerCase();
      document.getElementById("harfTahmin").value = "";
      if (!harf || harf.length!==1) return;
      let bulundu = false;
      Array.from(secili).forEach((h,i)=>{
        if (h===harf) { gorunen[i]=harf; bulundu=true;}
      });
      if (bulundu) {
        kalan.delete(harf);
        skor++;
        document.getElementById("harfBilgi").innerHTML = `<span class="oyun-dogru">Doğru!</span>`;
      } else {
        document.getElementById("harfBilgi").innerHTML = `<span class="oyun-yanlis">Yok!</span>`;
      }
      document.getElementById("harfIpuclu").innerText = gorunen.join(" ");
      document.getElementById("harfSkor").innerText = skor;
      if(!gorunen.includes("_")) {
        oyunGecmisKaydet({
          tur: "Harf Tahmin",
          skor,
          kelime: secili,
          tarih: new Date().toISOString()
        });
        document.getElementById("harfBilgi").innerHTML = `<b>Kazandınız! Kelime: ${secili}</b>
          <button onclick="oyunAlaniGoster()">Yeniden Oyna</button>`;
      }
    };
  }
}
function oyunGecmisKaydet(obj) {
  window.oyunGecmis = window.oyunGecmis || [];
  window.oyunGecmis.push(obj);
  localStorage.setItem("oyunGecmisi", JSON.stringify(window.oyunGecmis));
  oyunGecmisiGoster();
}
function oyunGecmisiGoster() {
  let gecmis = window.oyunGecmis||[];
  if (!gecmis.length) { document.getElementById("oyunGecmisi").innerHTML = ""; return; }
  let html = `<h4>Oyun Geçmişiniz</h4>
    <ul style="max-height:100px;overflow:auto;">` +
    gecmis.slice(-10).reverse().map(g=>
      `<li><b>${g.tur}</b> - Skor: ${g.skor}${g.toplam?"/"+g.toplam:""} <span style="font-size:0.9em;color:#555">(${new Date(g.tarih).toLocaleString()})</span></li>`
    ).join("") + `</ul>`;
  document.getElementById("oyunGecmisi").innerHTML = html;
}

// ====== İLETİŞİM MODALI ======
document.getElementById("contactBtn").onclick = function() {
  document.getElementById("contactName").value = "";
  document.getElementById("contactMessage").value = "";
  document.getElementById("contactResult").innerText = "";
  document.getElementById("contactModal").style.display = "flex";
};
document.getElementById("contactSendBtn").onclick = function() {
  const name = document.getElementById("contactName").value.trim();
  const msg = document.getElementById("contactMessage").value.trim();
  if (!msg) {
    document.getElementById("contactResult").innerText = "Lütfen bir mesaj yazınız.";
    return;
  }
  let iletiler = JSON.parse(localStorage.getItem("contactMessages") || "[]");
  iletiler.push({ name, msg, date: new Date().toISOString() });
  localStorage.setItem("contactMessages", JSON.stringify(iletiler));
  document.getElementById("contactResult").innerText = "Görüşünüz kaydedildi, teşekkürler!";
  document.getElementById("contactMessage").value = "";
};

// ====== İLK YÜKLEME ======
renderFlashcards(filteredWords);
}); // DOMContentLoaded
