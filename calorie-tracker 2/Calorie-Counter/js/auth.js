const API = "http://localhost:3000";

// LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("error-message");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: document.getElementById("email").value,
          password: document.getElementById("password").value,
        }),
      });
      const data = await res.json();
      if (!res.ok) { errorEl.textContent = data.error; errorEl.style.display = "block"; return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      window.location.href = "dashboard.html";
    } catch {
      errorEl.textContent = "Cannot reach server. Is it running?";
      errorEl.style.display = "block";
    }
  });
}

// LOGOUT
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    localStorage.clear();
    window.location.href = "login.html";
  });
}

// Redirect to login if no token
function requireAuth() {
  if (!localStorage.getItem("token")) window.location.href = "login.html";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}
