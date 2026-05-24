(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const BASE_PATH = (config.BASE_PATH || "/u").replace(/\/$/, "");
  const DEFAULT_USERNAME = config.DEFAULT_USERNAME || "yimg";

  function getRoute() {
    const path = window.location.pathname.replace(/\/+/g, "/");
    const parts = path.split("/").filter(Boolean);

    // GitHub Pages project path: /u, /u/admin, /u/{username}
    if (parts[0] === BASE_PATH.replace("/", "")) {
      const second = parts[1] || "";
      const third = parts[2] || "";

      if (!second || second === "index.html" || second === "404.html") {
        return { type: "public", username: DEFAULT_USERNAME };
      }

      if (second === "admin") {
        return { type: "admin", section: third || "dashboard" };
      }

      if (second === "diagnostics" || second === "cek-api") {
        return { type: "diagnostics" };
      }

      return { type: "public", username: normalizeUsername(second) || DEFAULT_USERNAME };
    }

    // Local testing with plain /admin or /{username}
    if (parts[0] === "admin") {
      return { type: "admin", section: parts[1] || "dashboard" };
    }

    if (parts[0] === "diagnostics" || parts[0] === "cek-api") {
      return { type: "diagnostics" };
    }

    if (parts[0] && parts[0] !== "index.html" && parts[0] !== "404.html") {
      return { type: "public", username: normalizeUsername(parts[0]) || DEFAULT_USERNAME };
    }

    return { type: "public", username: DEFAULT_USERNAME };
  }

  function normalizeUsername(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/_/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function renderLoading() {
    const root = document.getElementById("app");
    root.innerHTML = `
      <main class="loading-screen">
        <div style="text-align:center">
          <div class="spinner" style="margin:0 auto 16px"></div>
          <p class="login-desc">Memuat microsite...</p>
        </div>
      </main>
    `;
  }

  function renderNotFound(username, message) {
    const root = document.getElementById("app");
    const h = window.CakgupMicrosite.escapeHtml;
    root.innerHTML = `
      <main class="not-found-screen">
        <section class="panel login-card">
          <img class="login-logo" src="${BASE_PATH}/assets/img/logo-yimg.png" alt="Logo YIMG">
          <h1 class="login-title gradient-text">Microsite Tidak Ditemukan</h1>
          <p class="login-desc">Halaman <strong>/${h(username)}</strong> belum tersedia atau sedang tidak aktif.</p>
          <p class="message message-error">${h(message || "Data microsite tidak ditemukan.")}</p>
          <div class="button-row" style="justify-content:center;margin-top:14px">
            <a class="primary-button" href="${BASE_PATH}/">Kembali ke Beranda</a>
          </div>
        </section>
      </main>
    `;
  }

  function renderPublic(profile, links, options = {}) {
    document.title = profile.display_name || config.APP_NAME || "CakGup Microsite";
    const root = document.getElementById("app");
    root.innerHTML = window.CakgupMicrosite.renderMicrositeMarkup(profile, links, options);
    window.CakgupMicrosite.bindPublicInteractions(profile, links);
  }

  function shouldUseFallback(username) {
    return Boolean(config.PUBLIC_FALLBACK_ENABLED) && normalizeUsername(username) === normalizeUsername(DEFAULT_USERNAME);
  }

  function renderDefaultFallback(reason = "") {
    const profile = { ...(config.DEFAULT_PROFILE || {}), fallback_reason: reason };
    const links = config.DEFAULT_LINKS || [];
    renderPublic(profile, links, { demoMode: !window.CakgupApi.isConfigured(), fallbackMode: window.CakgupApi.isConfigured() });
  }

  async function showPublic(username) {
    renderLoading();

    try {
      const data = await window.CakgupMicrosite.loadMicrosite(username);
      if (!data.success) {
        if (shouldUseFallback(username)) {
          renderDefaultFallback(data.message || "Data API belum tersedia.");
          return;
        }
        renderNotFound(username, data.message);
        return;
      }

      const profile = data.microsite || config.DEFAULT_PROFILE;
      const links = Array.isArray(data.links) ? data.links : [];
      renderPublic(profile, links, { demoMode: data.demoMode });
    } catch (error) {
      if (!window.CakgupApi.isConfigured() || shouldUseFallback(username)) {
        renderDefaultFallback(error.message || "Gagal menghubungi API.");
        return;
      }
      renderNotFound(username, error.message || "Gagal menghubungi API.");
    }
  }

  async function showDiagnostics() {
    const root = document.getElementById("app");
    root.innerHTML = `
      <main class="admin-page">
        <section class="panel login-card">
          <img class="login-logo" src="${BASE_PATH}/assets/img/logo-yimg.png" alt="Logo YIMG">
          <h1 class="login-title gradient-text">Cek API Microsite</h1>
          <p class="login-desc">Memvalidasi koneksi frontend ke Google Apps Script.</p>
          <div id="diagnosticsResult" class="message">Menjalankan pengecekan...</div>
          <div class="button-row" style="justify-content:center;margin-top:14px">
            <a class="primary-button" href="${BASE_PATH}/">Buka Microsite</a>
            <a class="outline-button" href="${BASE_PATH}/admin">Admin</a>
          </div>
        </section>
      </main>
    `;

    const result = document.getElementById("diagnosticsResult");
    try {
      if (!window.CakgupApi.isConfigured()) throw new Error("API_BASE_URL belum dikonfigurasi.");
      const ping = await window.CakgupApi.get({ action: "ping" });
      const site = await window.CakgupApi.get({ action: "getMicrosite", username: DEFAULT_USERNAME });
      result.className = "message message-success";
      result.textContent = `API aktif. Ping: ${ping.message || "OK"}. Data ${DEFAULT_USERNAME}: ${site.success ? "tersedia" : "belum tersedia"}.`;
    } catch (error) {
      result.className = "message message-error";
      result.textContent = error.message || "API belum dapat diakses.";
    }
  }

  function boot() {
    const route = getRoute();

    if (route.type === "admin") {
      window.CakgupAdmin.renderAdminPage();
      return;
    }

    if (route.type === "diagnostics") {
      showDiagnostics();
      return;
    }

    showPublic(route.username);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
