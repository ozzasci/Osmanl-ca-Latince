// KELİME İSTATİSTİKLERİ PANELİ - Chart.js ile

function getStatsData() {
  const dailyStats = JSON.parse(localStorage.getItem("dailyStats") || "{}");
  const correct = Number(localStorage.getItem("totalCorrect") || 0);
  const wrong = Number(localStorage.getItem("totalWrong") || 0);
  const mistakes = JSON.parse(localStorage.getItem("mistakes") || "{}");
  return { dailyStats, correct, wrong, mistakes };
}

document.getElementById("openStatsBtn").onclick = openStatsPanel;
function openStatsPanel() {
  document.getElementById("statsPanel").style.display = "block";
  renderStats();
}

function closeStatsPanel() {
  document.getElementById("statsPanel").style.display = "none";
}

let dailyWordsChartInstance = null;
let successRateChartInstance = null;
function renderStats() {
  const { dailyStats, correct, wrong, mistakes } = getStatsData();

  // Günlük tekrar edilen kelime sayısı
  const labels = Object.keys(dailyStats).sort();
  const data = labels.map(day => dailyStats[day]);
  const dailyCtx = document.getElementById('dailyWordsChart').getContext('2d');
  if (dailyWordsChartInstance) dailyWordsChartInstance.destroy();
  dailyWordsChartInstance = new Chart(dailyCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Tekrar Edilen Kelime Sayısı',
        data,
        backgroundColor: '#2196f3'
      }]
    },
    options: { responsive: true }
  });

  // Başarı oranı
  const doughnutCtx = document.getElementById('successRateChart').getContext('2d');
  if (successRateChartInstance) successRateChartInstance.destroy();
  successRateChartInstance = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels: ['Doğru', 'Yanlış'],
      datasets: [{
        data: [correct, wrong],
        backgroundColor: ['#4caf50', '#f44336']
      }]
    },
    options: { responsive: true }
  });

  // En çok yanlış yapılan kelimeler
  const sortedMistakes = Object.entries(mistakes)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 10);
  const topList = document.getElementById("topMistakesList");
  topList.innerHTML = "";
  if (sortedMistakes.length === 0) {
    topList.innerHTML = "<li>Henüz hata yapılmadı 🎉</li>";
  } else {
    for (const [word, count] of sortedMistakes) {
      const li = document.createElement("li");
      li.textContent = `${word} — ${count} hata`;
      topList.appendChild(li);
    }
  }
}