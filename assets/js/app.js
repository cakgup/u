(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const BASE_PATH = (config.BASE_PATH || "/u").replace(/\/$/, "");
  const DEFAULT_USERNAME = config.DEFAULT_USERNAME || "yimg";

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  function getRoute() {
    const path = window.location.pathname.replace(/\/+/g, "/");
    const parts = path.split("/").filter(Boolean);
    const baseName = BASE_PATH.replace("/", "");

    if (parts[0] === baseName) {
      const second = parts[1] || "";
      if (!second || second === "index.html" || second === "404.html") return { type: "public", username: DEFAULT_USERNAME };
      if (second === "admin") return { type: "admin" };
      if (second === "diagnostics" || second === "cek-api") return { type: "diagnostics" };
      return { type: "public", username: normalizeUsername(second) || DEFAULT_USERNAME };
    }

    if (parts[0] === "admin") return { type: "admin" };
    if (parts[0] === "diagnostics" || parts[0] === "cek-api") return { type: "diagnostics" };
    if (parts[0] && parts[0] !== "index.html" && parts[0] !== "404.html") return { type: "public", username: normalizeUsername(parts[0]) || DEFAULT_USERNAME };
    return { type: "public", username: DEFAULT_USERNAME };
  }

  function renderLoading() {
    document.getElementById("app").innerHTML = `
      <main class="loading-screen">
        <div style="text-align:center">
          <div class="spinner" style="margin:0 auto 16px"></div>
          <p class="login-desc">Memuat microsite...</p>
        </div>
      </main>
    `;
  }

  function renderPublic(profile, links, options = {}) {
    document.title = profile.display_name || config.APP_NAME || "CakGup Microsite";
    const root = document.getElementById("app");
    root.innerHTML = window.CakgupMicrosite.renderMicrositeMarkup(profile, links, options);
    window.CakgupMicrosite.bindPublicInteractions(profile);
  }

  function renderFallback(reason = "") {
    renderPublic(config.DEFAULT_PROFILE, config.DEFAULT_LINKS || [], { fallbackMode: Boolean(reason) });
  }

  async function showPublic(username) {
    renderLoading();
    try {
      const data = await window.CakgupMicrosite.loadMicrosite(username);
      if (!data.success) throw new Error(data.message || "Data microsite tidak ditemukan.");
      renderPublic(data.microsite || config.DEFAULT_PROFILE, Array.isArray(data.links) ? data.links : config.DEFAULT_LINKS || [], { demoMode: data.demoMode });
    } catch (error) {
      if (config.PUBLIC_FALLBACK_ENABLED && normalizeUsername(username) === normalizeUsername(DEFAULT_USERNAME)) renderFallback(error.message);
      else renderFallback(error.message);
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
          <div class="button-row admin-actions">
            <a class="primary-button" href="${BASE_PATH}/">Buka Microsite</a>
            <a class="outline-button" href="${BASE_PATH}/admin">Admin</a>
          </div>
        </section>
      </main>
    `;
    const result = document.getElementById("diagnosticsResult");
    try {
      const ping = await window.CakgupApi.get({ action: "ping" });
      const site = await window.CakgupApi.get({ action: "getMicrosite", username: DEFAULT_USERNAME });
      result.className = "message message-success";
      result.textContent = `API aktif. Ping: ${ping.message || "OK"}. Link aktif: ${(site.links || []).length}.`;
    } catch (error) {
      result.className = "message message-error";
      result.textContent = error.message || "API belum dapat diakses.";
    }
  }

  function boot() {
    const route = getRoute();
    if (route.type === "admin") return window.CakgupAdmin.renderAdminPage();
    if (route.type === "diagnostics") return showDiagnostics();
    return showPublic(route.username);
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
