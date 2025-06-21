// SHA-256 hash fonksiyonu (tarayıcı desteğiyle)
async function hashPassword(password) {
  const utf8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function showMainApp() {
  document.getElementById("authContainer").style.display = "none";
  document.getElementById("mainApp").style.display = "block";
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser && document.getElementById("username")) {
    document.getElementById("username").value = currentUser;
  }
}

window.addEventListener("DOMContentLoaded", function() {
  const currentUser = localStorage.getItem("currentUser");
  if (currentUser) showMainApp();
});

document.getElementById("registerBtn").onclick = async function() {
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  if (!username || !password) {
    document.getElementById("authStatus").innerText = "Kullanıcı adı ve şifre gerekli!";
    return;
  }
  if (localStorage.getItem("user_" + username)) {
    document.getElementById("authStatus").innerText = "Bu kullanıcı adı zaten alınmış!";
    return;
  }
  const hash = await hashPassword(password);
  localStorage.setItem("user_" + username, hash);
  localStorage.setItem("currentUser", username);
  document.getElementById("authStatus").innerText = "Kayıt başarılı! Giriş yapıldı.";
  showMainApp();
};

document.getElementById("loginBtn").onclick = async function() {
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  const storedHash = localStorage.getItem("user_" + username);
  if (!storedHash) {
    document.getElementById("authStatus").innerText = "Kullanıcı bulunamadı!";
    return;
  }
  const hash = await hashPassword(password);
  if (storedHash === hash) {
    localStorage.setItem("currentUser", username);
    document.getElementById("authStatus").innerText = "Giriş başarılı!";
    showMainApp();
  } else {
    document.getElementById("authStatus").innerText = "Şifre yanlış!";
  }
};

window.logout = function() {
  localStorage.removeItem("currentUser");
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("authContainer").style.display = "flex";
  document.getElementById("authStatus").innerText = "Çıkış yapıldı.";
  document.getElementById("authUsername").value = "";
  document.getElementById("authPassword").value = "";
};
