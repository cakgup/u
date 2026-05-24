(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const BASE_PATH = (config.BASE_PATH || "/u").replace(/\/$/, "");
  const $ = (selector) => document.querySelector(selector);

  const state = {
    profile: null,
    links: [],
    stats: null,
    username: config.DEFAULT_USERNAME || "yimg"
  };

  function h(value) {
    return window.CakgupMicrosite.escapeHtml(value);
  }

  function renderLoginPage(message = "") {
    const root = $("#app");
    root.innerHTML = `
      <main class="admin-page">
        <section class="panel login-card">
          <img class="login-logo" src="${BASE_PATH}/assets/img/logo-yimg.png" alt="Logo Yayasan Indonesia Maju Gemilang">
          <h1 class="login-title gradient-text">Admin Microsite</h1>
          <p class="login-desc">Masukkan token Google Apps Script untuk mengelola profil, tautan, audio, dan tampilan microsite.</p>
          ${!window.CakgupApi.isConfigured() ? `<p class="message message-error">API_BASE_URL belum dikonfigurasi pada <code>assets/js/config.js</code>. Tempel URL Web App Google Apps Script terlebih dahulu.</p>` : ""}
          <form id="loginForm">
            <label class="label" for="tokenInput">API Token</label>
            <input id="tokenInput" class="input" type="password" autocomplete="current-password" placeholder="Masukkan token admin" ${!window.CakgupApi.isConfigured() ? "disabled" : ""}>
            <div class="button-row" style="margin-top:14px">
              <button class="primary-button" type="submit" ${!window.CakgupApi.isConfigured() ? "disabled" : ""}>Masuk Admin</button>
              <a class="outline-button" href="${BASE_PATH}/">Lihat Microsite</a>
            </div>
            <p id="loginMessage" class="message ${message ? "message-error" : "hidden"}">${h(message)}</p>
          </form>
        </section>
      </main>
    `;

    $("#loginForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.submitter;
      const msg = $("#loginMessage");
      const token = $("#tokenInput")?.value || "";
      try {
        button.disabled = true;
        button.textContent = "Memvalidasi...";
        msg.className = "message";
        msg.textContent = "Memvalidasi token...";
        await window.CakgupAuth.login(token);
        renderAdminPage();
      } catch (error) {
        msg.className = "message message-error";
        msg.textContent = error.message || "Login gagal.";
      } finally {
        button.disabled = false;
        button.textContent = "Masuk Admin";
      }
    });
  }

  function renderAdminLayout() {
    const root = $("#app");
    root.innerHTML = `
      <main class="admin-page">
        <div class="admin-shell">
          <header class="admin-topbar">
            <div class="admin-brand">
              <img src="${BASE_PATH}/assets/img/logo-yimg.png" alt="Logo YIMG">
              <div>
                <h1 class="admin-title gradient-text">CakGup Microsite</h1>
                <p class="admin-subtitle">Dashboard Yayasan Indonesia Maju Gemilang</p>
              </div>
            </div>
            <div class="button-row">
              <a class="outline-button" href="${BASE_PATH}/${h(state.username)}" target="_blank" rel="noopener">Buka Publik</a>
              <button id="reloadButton" class="secondary-button" type="button">Muat Ulang</button>
              <button id="logoutButton" class="ghost-button" type="button">Keluar</button>
            </div>
          </header>

          <section class="admin-grid">
            <div class="panel">
              <div class="panel-header">
                <div>
                  <h2 class="panel-title">Pengaturan Microsite</h2>
                  <p class="panel-desc">Kelola identitas yayasan, nuansa islami, audio nasyid, dan daftar tombol link.</p>
                </div>
              </div>
              <div class="panel-body">
                ${renderProfileForm()}
                ${renderLinkForm()}
                ${renderLinkList()}
                ${renderStats()}
              </div>
            </div>

            <aside class="preview-sticky">
              <div class="panel">
                <div class="panel-header">
                  <div>
                    <h2 class="panel-title">Preview</h2>
                    <p class="panel-desc">Tampilan simulasi mobile. Audio disembunyikan di preview.</p>
                  </div>
                </div>
                <div class="panel-body">
                  <div class="preview-phone">
                    <div id="previewScreen" class="preview-screen"></div>
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>
    `;

    bindAdminEvents();
    updatePreviewFromForm();
  }

  function renderProfileForm() {
    const p = state.profile || config.DEFAULT_PROFILE || {};
    return `
      <form id="profileForm" class="form-section">
        <input id="profileId" type="hidden" value="${h(p.id || "")}">
        <h3 class="form-section-title">Profil dan Branding</h3>
        <div class="form-grid">
          <div>
            <label class="label" for="usernameInput">Username / Slug</label>
            <input id="usernameInput" class="input" type="text" value="${h(p.username || state.username)}" placeholder="yimg">
          </div>
          <div>
            <label class="label" for="displayNameInput">Nama Tampilan</label>
            <input id="displayNameInput" class="input" type="text" value="${h(p.display_name || "")}">
          </div>
          <div class="field-full">
            <label class="label" for="taglineInput">Tagline</label>
            <input id="taglineInput" class="input" type="text" value="${h(p.tagline || "")}">
          </div>
          <div class="field-full">
            <label class="label" for="bioInput">Bio / Deskripsi</label>
            <textarea id="bioInput" class="textarea">${h(p.bio || "")}</textarea>
          </div>
          <div>
            <label class="label" for="logoUrlInput">Logo URL</label>
            <input id="logoUrlInput" class="input" type="text" value="${h(p.logo_url || "/u/assets/img/logo-yimg.png")}">
          </div>
          <div>
            <label class="label" for="bannerUrlInput">Banner URL</label>
            <input id="bannerUrlInput" class="input" type="text" value="${h(p.banner_url || "")}" placeholder="opsional">
          </div>
        </div>

        <h3 class="form-section-title">Tema Warna Logo</h3>
        <div class="form-grid">
          <div>
            <label class="label" for="primaryColorInput">Oranye / Primary</label>
            <input id="primaryColorInput" class="input" type="color" value="${h(p.primary_color || "#C44A00")}">
          </div>
          <div>
            <label class="label" for="secondaryColorInput">Merah / Secondary</label>
            <input id="secondaryColorInput" class="input" type="color" value="${h(p.secondary_color || "#D40000")}">
          </div>
          <div>
            <label class="label" for="accentColorInput">Ungu / Accent</label>
            <input id="accentColorInput" class="input" type="color" value="${h(p.accent_color || "#4B006E")}">
          </div>
          <div>
            <label class="label" for="textColorInput">Warna Teks</label>
            <input id="textColorInput" class="input" type="color" value="${h(p.text_color || "#2D1B12")}">
          </div>
        </div>

        <h3 class="form-section-title">Nuansa Islami dan Audio</h3>
        <div class="form-grid">
          <div class="field-full">
            <label class="label" for="islamicScriptInput">Script Islami</label>
            <input id="islamicScriptInput" class="input" type="text" value="${h(p.islamic_script || "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ")}">
          </div>
          <div>
            <label class="label" for="audioUrlInput">Audio URL</label>
            <input id="audioUrlInput" class="input" type="text" value="${h(p.audio_url || "/u/assets/audio/nasyid.mp3")}">
          </div>
          <div>
            <label class="label" for="audioTitleInput">Judul Audio</label>
            <input id="audioTitleInput" class="input" type="text" value="${h(p.audio_title || "Nasyid Islami")}">
          </div>
          <label class="check-row"><input id="showScriptInput" type="checkbox" ${p.show_islamic_script === false || String(p.show_islamic_script) === "false" ? "" : "checked"}> Tampilkan script islami</label>
          <label class="check-row"><input id="audioEnabledInput" type="checkbox" ${p.audio_enabled === false || String(p.audio_enabled) === "false" ? "" : "checked"}> Aktifkan backsound</label>
          <label class="check-row"><input id="audioLoopInput" type="checkbox" ${p.audio_loop === false || String(p.audio_loop) === "false" ? "" : "checked"}> Loop audio</label>
          <label class="check-row"><input id="siteActiveInput" type="checkbox" checked> Microsite aktif</label>
        </div>

        <div class="button-row">
          <button class="primary-button" type="submit">Simpan Profil</button>
          <button id="copyPublicUrlButton" class="secondary-button" type="button">Salin URL Publik</button>
        </div>
        <p id="profileMessage" class="message hidden"></p>
      </form>
    `;
  }

  function renderLinkForm() {
    return `
      <form id="linkForm" class="form-section">
        <input id="linkIdInput" type="hidden" value="">
        <h3 class="form-section-title">Tambah / Edit Tombol Link</h3>
        <div class="form-grid">
          <div>
            <label class="label" for="linkTitleInput">Judul Link</label>
            <input id="linkTitleInput" class="input" type="text" placeholder="Contoh: Donasi">
          </div>
          <div>
            <label class="label" for="linkIconInput">Icon</label>
            <select id="linkIconInput" class="select">
              <option value="link">Link</option>
              <option value="info">Info</option>
              <option value="star">Program</option>
              <option value="heart">Donasi</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="location">Lokasi</option>
              <option value="email">Email</option>
              <option value="document">Dokumen</option>
            </select>
          </div>
          <div class="field-full">
            <label class="label" for="linkUrlInput">URL Tujuan</label>
            <input id="linkUrlInput" class="input" type="url" placeholder="https://...">
          </div>
          <div>
            <label class="label" for="linkColorInput">Warna Tombol</label>
            <input id="linkColorInput" class="input" type="color" value="#C44A00">
          </div>
          <div>
            <label class="label" for="linkSortInput">Urutan</label>
            <input id="linkSortInput" class="input" type="number" min="1" value="1">
          </div>
          <label class="check-row"><input id="linkActiveInput" type="checkbox" checked> Link aktif</label>
        </div>
        <div class="button-row">
          <button class="primary-button" type="submit">Simpan Link</button>
          <button id="resetLinkFormButton" class="secondary-button" type="button">Reset Form</button>
        </div>
        <p id="linkMessage" class="message hidden"></p>
      </form>
    `;
  }

  function renderLinkList() {
    const items = state.links || [];
    return `
      <section class="form-section">
        <h3 class="form-section-title">Daftar Komponen Link</h3>
        <div id="linkEditorList" class="link-editor-list">
          ${items.length ? items.map(renderLinkEditorCard).join("") : `<div class="empty-links">Belum ada link. Tambahkan melalui form di atas.</div>`}
        </div>
      </section>
    `;
  }

  function renderLinkEditorCard(link) {
    return `
      <article class="link-editor-card">
        <div class="link-card-head">
          <div>
            <h4 class="link-card-title">${h(window.CakgupMicrosite.iconFor(link.icon))} ${h(link.title || "Tanpa Judul")}</h4>
            <p class="link-card-url">${h(link.url || "")}</p>
          </div>
          <span class="pill-button">#${h(link.sort_order || "-")}</span>
        </div>
        <div class="button-row">
          <button class="secondary-button edit-link-button" type="button" data-id="${h(link.id || "")}">Edit</button>
          <button class="danger-button delete-link-button" type="button" data-id="${h(link.id || "")}">Nonaktifkan</button>
        </div>
      </article>
    `;
  }

  function renderStats() {
    const totalClicks = state.stats?.total_clicks || 0;
    const totalLinks = state.links?.length || 0;
    const top = (state.stats?.links || [])[0];
    return `
      <section class="form-section">
        <h3 class="form-section-title">Statistik Singkat</h3>
        <div class="stats-grid">
          <div class="stat-card"><p class="stat-number">${h(totalLinks)}</p><p class="stat-label">Total Link</p></div>
          <div class="stat-card"><p class="stat-number">${h(totalClicks)}</p><p class="stat-label">Total Klik</p></div>
          <div class="stat-card"><p class="stat-number">${h(top?.total_clicks || 0)}</p><p class="stat-label">Klik Link Teratas</p></div>
        </div>
      </section>
    `;
  }

  function bindAdminEvents() {
    $("#logoutButton")?.addEventListener("click", () => {
      window.CakgupAuth.logout();
      renderLoginPage("Anda sudah keluar dari dashboard admin.");
    });

    $("#reloadButton")?.addEventListener("click", () => renderAdminPage());
    $("#profileForm")?.addEventListener("submit", submitProfileForm);
    $("#linkForm")?.addEventListener("submit", submitLinkForm);
    $("#resetLinkFormButton")?.addEventListener("click", resetLinkForm);
    $("#copyPublicUrlButton")?.addEventListener("click", copyPublicUrl);

    document.querySelectorAll("#profileForm input, #profileForm textarea, #profileForm select").forEach((el) => {
      el.addEventListener("input", updatePreviewFromForm);
      el.addEventListener("change", updatePreviewFromForm);
    });

    document.querySelectorAll(".edit-link-button").forEach((btn) => {
      btn.addEventListener("click", () => fillLinkForm(btn.getAttribute("data-id")));
    });

    document.querySelectorAll(".delete-link-button").forEach((btn) => {
      btn.addEventListener("click", () => disableLink(btn.getAttribute("data-id")));
    });
  }

  async function renderAdminPage() {
    if (!window.CakgupAuth.isLoggedIn()) {
      renderLoginPage();
      return;
    }

    if (!window.CakgupApi.isConfigured()) {
      renderLoginPage("API_BASE_URL belum dikonfigurasi.");
      return;
    }

    const root = $("#app");
    root.innerHTML = `<main class="loading-screen"><div><div class="spinner"></div><p class="login-desc">Memuat data microsite...</p></div></main>`;

    try {
      const data = await window.CakgupMicrosite.loadMicrosite(state.username);
      if (data.success) {
        state.profile = data.microsite || config.DEFAULT_PROFILE;
        state.links = Array.isArray(data.links) ? data.links : [];
        state.username = state.profile.username || state.username;
      } else {
        state.profile = { ...(config.DEFAULT_PROFILE || {}), username: state.username, id: "" };
        state.links = [];
      }

      await loadStatsQuietly();
      renderAdminLayout();
    } catch (error) {
      state.profile = { ...(config.DEFAULT_PROFILE || {}), username: state.username, id: "" };
      state.links = [];
      state.stats = null;
      renderAdminLayout();
      setMessage("#profileMessage", `Data belum dapat dimuat dari API: ${error.message}. Anda tetap dapat menyimpan profil baru.`, true);
    }
  }

  async function loadStatsQuietly() {
    try {
      const token = window.CakgupAuth.getApiToken();
      const data = await window.CakgupApi.get({ action: "getMicrositeStats", username: state.username, token });
      state.stats = data.success ? data : null;
    } catch (error) {
      state.stats = null;
    }
  }

  function collectProfileForm() {
    const username = normalizeUsername($("#usernameInput")?.value || state.username);
    return {
      action: "saveMicrosite",
      token: window.CakgupAuth.getApiToken(),
      api_key: window.CakgupAuth.getApiToken(),
      id: $("#profileId")?.value || "",
      username,
      display_name: $("#displayNameInput")?.value.trim() || "Yayasan Indonesia Maju Gemilang",
      tagline: $("#taglineInput")?.value.trim() || "Bergerak Bersama untuk Ummat dan Kebaikan",
      bio: $("#bioInput")?.value.trim() || "Microsite resmi Yayasan Indonesia Maju Gemilang.",
      logo_url: $("#logoUrlInput")?.value.trim() || "/u/assets/img/logo-yimg.png",
      avatar_url: $("#logoUrlInput")?.value.trim() || "/u/assets/img/logo-yimg.png",
      banner_url: $("#bannerUrlInput")?.value.trim() || "",
      theme: "islami-yimg",
      background_color: "#FFF7ED",
      text_color: $("#textColorInput")?.value || "#2D1B12",
      primary_color: $("#primaryColorInput")?.value || "#C44A00",
      secondary_color: $("#secondaryColorInput")?.value || "#D40000",
      accent_color: $("#accentColorInput")?.value || "#4B006E",
      button_style: "rounded",
      islamic_script: $("#islamicScriptInput")?.value.trim() || "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
      show_islamic_script: Boolean($("#showScriptInput")?.checked),
      audio_url: $("#audioUrlInput")?.value.trim() || "/u/assets/audio/nasyid.mp3",
      audio_title: $("#audioTitleInput")?.value.trim() || "Nasyid Islami",
      audio_enabled: Boolean($("#audioEnabledInput")?.checked),
      audio_loop: Boolean($("#audioLoopInput")?.checked),
      audio_volume: 0.45,
      is_active: Boolean($("#siteActiveInput")?.checked),
      created_by: "admin"
    };
  }

  async function submitProfileForm(event) {
    event.preventDefault();
    const button = event.submitter;
    const payload = collectProfileForm();

    if (!payload.username) {
      setMessage("#profileMessage", "Username wajib diisi dan hanya boleh berisi huruf kecil, angka, serta tanda hubung.", true);
      return;
    }

    try {
      button.disabled = true;
      button.textContent = "Menyimpan...";
      setMessage("#profileMessage", "Menyimpan profil microsite...");
      const data = await window.CakgupApi.post(payload);
      if (!data.success) throw new Error(data.message || "Gagal menyimpan profil.");
      state.username = payload.username;
      setMessage("#profileMessage", `Profil berhasil disimpan. URL publik: ${data.microsite_url || BASE_PATH + "/" + payload.username}`, false, true);
      await renderAdminPage();
    } catch (error) {
      setMessage("#profileMessage", error.message || "Gagal menyimpan profil.", true);
    } finally {
      button.disabled = false;
      button.textContent = "Simpan Profil";
    }
  }

  function collectLinkForm() {
    return {
      action: "saveMicrositeLink",
      token: window.CakgupAuth.getApiToken(),
      api_key: window.CakgupAuth.getApiToken(),
      id: $("#linkIdInput")?.value || "",
      microsite_id: state.profile?.id || "",
      username: state.username,
      title: $("#linkTitleInput")?.value.trim() || "",
      url: $("#linkUrlInput")?.value.trim() || "",
      icon: $("#linkIconInput")?.value || "link",
      button_color: $("#linkColorInput")?.value || state.profile?.primary_color || "#C44A00",
      text_color: "#FFFFFF",
      sort_order: Number($("#linkSortInput")?.value || (state.links.length + 1)),
      is_active: Boolean($("#linkActiveInput")?.checked)
    };
  }

  async function submitLinkForm(event) {
    event.preventDefault();
    const button = event.submitter;
    const payload = collectLinkForm();

    if (!state.profile?.id) {
      setMessage("#linkMessage", "Simpan profil microsite terlebih dahulu sebelum menambahkan link.", true);
      return;
    }
    if (!payload.title || !payload.url) {
      setMessage("#linkMessage", "Judul link dan URL tujuan wajib diisi.", true);
      return;
    }

    try {
      button.disabled = true;
      button.textContent = "Menyimpan...";
      setMessage("#linkMessage", "Menyimpan link...");
      const data = await window.CakgupApi.post(payload);
      if (!data.success) throw new Error(data.message || "Gagal menyimpan link.");
      setMessage("#linkMessage", "Link berhasil disimpan.", false, true);
      resetLinkForm();
      await renderAdminPage();
    } catch (error) {
      setMessage("#linkMessage", error.message || "Gagal menyimpan link.", true);
    } finally {
      button.disabled = false;
      button.textContent = "Simpan Link";
    }
  }

  function fillLinkForm(id) {
    const link = state.links.find((item) => String(item.id) === String(id));
    if (!link) return;
    $("#linkIdInput").value = link.id || "";
    $("#linkTitleInput").value = link.title || "";
    $("#linkUrlInput").value = link.url || "";
    $("#linkIconInput").value = link.icon || "link";
    $("#linkColorInput").value = normalizeHexColor(link.button_color || state.profile?.primary_color || "#C44A00");
    $("#linkSortInput").value = link.sort_order || 1;
    $("#linkActiveInput").checked = link.is_active !== false && String(link.is_active) !== "false";
    setMessage("#linkMessage", `Mode edit link: ${link.title || link.id}`);
    $("#linkTitleInput")?.focus();
  }

  function resetLinkForm() {
    $("#linkIdInput").value = "";
    $("#linkTitleInput").value = "";
    $("#linkUrlInput").value = "";
    $("#linkIconInput").value = "link";
    $("#linkColorInput").value = state.profile?.primary_color || "#C44A00";
    $("#linkSortInput").value = (state.links?.length || 0) + 1;
    $("#linkActiveInput").checked = true;
    $("#linkMessage").className = "message hidden";
  }

  async function disableLink(id) {
    if (!id) return;
    const confirmed = window.confirm("Nonaktifkan link ini? Link tidak akan tampil pada halaman publik.");
    if (!confirmed) return;

    try {
      const token = window.CakgupAuth.getApiToken();
      const data = await window.CakgupApi.post({
        action: "deleteMicrositeLink",
        token,
        api_key: token,
        id
      });
      if (!data.success) throw new Error(data.message || "Gagal menonaktifkan link.");
      await renderAdminPage();
    } catch (error) {
      window.alert(error.message || "Gagal menonaktifkan link.");
    }
  }

  function updatePreviewFromForm() {
    const screen = $("#previewScreen");
    if (!screen) return;
    const profile = {
      ...(state.profile || config.DEFAULT_PROFILE || {}),
      ...collectProfileForm(),
      microsite_url: `${location.origin}${BASE_PATH}/${normalizeUsername($("#usernameInput")?.value || state.username)}`
    };
    screen.innerHTML = window.CakgupMicrosite.renderMicrositeMarkup(profile, state.links || [], { enableAudio: false });
  }

  async function copyPublicUrl() {
    const username = normalizeUsername($("#usernameInput")?.value || state.username);
    const url = `${location.origin}${BASE_PATH}/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("#profileMessage", `URL publik disalin: ${url}`, false, true);
    } catch (error) {
      setMessage("#profileMessage", url, false, true);
    }
  }

  function setMessage(selector, text, isError = false, isSuccess = false) {
    const el = $(selector);
    if (!el) return;
    el.className = `message ${isError ? "message-error" : ""} ${isSuccess ? "message-success" : ""}`;
    el.textContent = text;
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

  function normalizeHexColor(value) {
    const text = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(text) ? text : "#C44A00";
  }

  window.CakgupAdmin = {
    renderLoginPage,
    renderAdminPage
  };
})();
