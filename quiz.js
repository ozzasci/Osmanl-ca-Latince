let wordList = JSON.parse(localStorage.getItem("wordList") || "[]");
let filteredWords = wordList;
let currentQuestion = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let totalQuestions = 10;
let timerInterval;
let timeLeft = 30;
let spacedRepetition = JSON.parse(localStorage.getItem("spacedRepetition") || "{}");

// Profil ayarlarını yükle
function loadProfileSettings() {
  const profile = JSON.parse(localStorage.getItem("profile") || "{}");
  if (profile.theme) {
    applyTheme(profile.theme);
  }
  if (profile.fontSize) {
    applyFontSize(profile.fontSize);
  }
  if (profile.background) {
    document.body.style.backgroundImage = `url(${profile.background})`;
    document.body.style.backgroundSize = 'cover';
  }
}

// Temayı uygula
function applyTheme(theme) {
  document.body.classList.remove('light', 'dark', 'blue', 'green');
  if (theme === 'dark') document.body.classList.add('dark-mode');
  else document.body.classList.add(`${theme}-theme`);
}

// Yazı tipi boyutunu uygula
function applyFontSize(size) {
  document.body.classList.remove('font-small', 'font-medium', 'font-large');
  document.body.classList.add(`font-${size}`);
}

// Testi başlat
function startQuiz() {
  if (!wordList.length) {
    alert("Kelime listesi boş! Lütfen ana sayfada bir dosya yükleyin.");
    window.location.href = "index.html";
    return;
  }
  currentQuestion = 0;
  correctAnswers = 0;
  wrongAnswers = 0;
  updateProgress();
  updateScore();
  loadCategories();
  nextQuestion();
}

// Kategorileri yükle
function loadCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  categoryFilter.innerHTML = '<option value="all">Tümü</option>';
  const categories = [...new Set(wordList.map(item => item.category || "Tanımsız"))];
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
  categoryFilter.addEventListener("change", () => {
    const selected = categoryFilter.value;
    filteredWords = selected === "all" ? wordList : wordList.filter(item => (item.category || "Tanımsız") === selected);
    if (filteredWords.length < 4) {
      alert("Seçilen kategoride yeterli kelime yok!");
      categoryFilter.value = "all";
      filteredWords = wordList;
    }
    restartQuiz();
  });
}

// İlerleme çubuğunu güncelle
function updateProgress() {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const percentage = (currentQuestion / totalQuestions) * 100;
  progressFill.style.width = `${percentage}%`;
  progressText.textContent = `Soru: ${currentQuestion} / ${totalQuestions}`;
}

// Skoru güncelle
function updateScore() {
  document.getElementById("score").textContent = `Skor: ${correctAnswers} doğru, ${wrongAnswers} yanlış`;
}

// Zamanlayıcıyı başlat
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 30;
  document.getElementById("timer").textContent = `Kalan süre: ${timeLeft} saniye`;
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = `Kalan süre: ${timeLeft} saniye`;
    if (timeLeft <= 0) {
      checkAnswer(null, filteredWords[Math.floor(Math.random() * filteredWords.length)].phrase);
    }
  }, 1000);
}

// Sonraki soruyu yükle
function nextQuestion() {
  if (currentQuestion >= totalQuestions) {
    endQuiz();
    return;
  }
  clearInterval(timerInterval);
  startTimer();
  currentQuestion++;
  updateProgress();
  const isInputQuestion = Math.random() > 0.5;
  const questionWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
  const questionText = isInputQuestion
    ? `Aşağıdaki anlam hangi kelimeye aittir: "${questionWord.meaning}"?`
    : `Aşağıdaki kelime hangi anlama gelir: "${questionWord.osmanlica || questionWord.cogul || questionWord.isim || questionWord['İsm-i Fâil'] || questionWord.phrase}"?`;
  
  document.getElementById("quizQuestion").textContent = questionText;
  
  const quizOptions = document.getElementById("quizOptions");
  const inputContainer = document.getElementById("inputContainer");
  
  if (isInputQuestion) {
    quizOptions.style.display = "none";
    inputContainer.style.display = "block";
    document.getElementById("quizAnswerInput").value = "";
    document.getElementById("submitAnswer").onclick = () => {
      const userAnswer = document.getElementById("quizAnswerInput").value.trim();
      checkAnswer(userAnswer, questionWord.phrase);
    };
  } else {
    quizOptions.style.display = "block";
    inputContainer.style.display = "none";
    quizOptions.innerHTML = "";
    const options = [questionWord];
    while (options.length < 4) {
      const randomWord = filteredWords[Math.floor(Math.random() * filteredWords.length)];
      if (!options.some(opt => opt.phrase === randomWord.phrase)) {
        options.push(randomWord);
      }
    }
    options.sort(() => Math.random() - 0.5);
    options.forEach(word => {
      const button = document.createElement("button");
      button.textContent = word.meaning;
      button.onclick = () => checkAnswer(word.phrase, questionWord.phrase);
      quizOptions.appendChild(button);
    });
  }
}

// Cevabı kontrol et
function checkAnswer(selected, correct) {
  clearInterval(timerInterval);
  const correctWord = filteredWords.find(w => w.phrase === correct);
  if (selected === correct) {
    correctAnswers++;
    updateSpacedRepetition(correct, "easy");
    alert("Doğru!");
  } else {
    wrongAnswers++;
    updateSpacedRepetition(correct, "hard");
    alert(`Yanlış! Doğru cevap: ${correctWord.osmanlica || correctWord.cogul || correctWord.isim || correctWord['İsm-i Fâil'] || correct} (${correctWord.meaning})`);
  }
  updateScore();
  nextQuestion();
}

// Testi bitir
function endQuiz() {
  clearInterval(timerInterval);
  document.getElementById("quizContainer").style.display = "none";
  document.getElementById("categoryFilter").style.display = "none";
  document.getElementById("progressContainer").style.display = "none";
  document.getElementById("score").style.display = "none";
  document.getElementById("timer").style.display = "none";
  document.getElementById("goBack").style.display = "none";
  document.getElementById("endQuiz").style.display = "none";
  
  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.style.display = "block";
  document.getElementById("resultSummary").textContent = `Test bitti! ${correctAnswers} doğru, ${wrongAnswers} yanlış. Başarı oranı: ${((correctAnswers / totalQuestions) * 100).toFixed(2)}%`;
}

// Testi yeniden başlat
function restartQuiz() {
  document.getElementById("quizContainer").style.display = "block";
  document.getElementById("categoryFilter").style.display = "block";
  document.getElementById("progressContainer").style.display = "block";
  document.getElementById("score").style.display = "block";
  document.getElementById("timer").style.display = "block";
  document.getElementById("goBack").style.display = "inline-block";
  document.getElementById("endQuiz").style.display = "inline-block";
  document.getElementById("resultsContainer").style.display = "none";
  startQuiz();
}

// Aralıklı tekrar güncelle
function updateSpacedRepetition(phrase, difficulty) {
  const sr = spacedRepetition[phrase] || { nextReview: 0, interval: 1 };
  let multiplier;
  if (difficulty === "easy") multiplier = 2;
  else if (difficulty === "medium") multiplier = 1.5;
  else multiplier = 0.5;
  
  sr.interval = Math.max(1, sr.interval * multiplier);
  sr.nextReview = Date.now() + sr.interval * 24 * 60 * 60 * 1000;
  spacedRepetition[phrase] = sr;
  localStorage.setItem("spacedRepetition", JSON.stringify(spacedRepetition));
}

// Karanlık mod geçişi
function toggleDarkMode() {
  const themeSelect = document.getElementById("themeSelect") || { value: document.body.classList.contains("dark-mode") ? "light" : "dark" };
  themeSelect.value = document.body.classList.contains("dark-mode") ? "light" : "dark";
  applyTheme(themeSelect.value);
  const profile = JSON.parse(localStorage.getItem("profile") || "{}");
  profile.theme = themeSelect.value;
  localStorage.setItem("profile", JSON.stringify(profile));
}

// Olay dinleyicileri
document.getElementById("endQuiz").addEventListener("click", endQuiz);
document.getElementById("restartQuiz").addEventListener("click", restartQuiz);
document.getElementById("toggleDarkMode").addEventListener("click", toggleDarkMode);

// Profil ayarlarını ve testi başlat
loadProfileSettings();
startQuiz();
