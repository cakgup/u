
(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const BASE_PATH = (config.BASE_PATH || "/u").replace(/\/$/, "");
  const DEFAULT_USERNAME = config.DEFAULT_USERNAME || "yimg";
  const $ = (selector) => document.querySelector(selector);

  const state = { links: [], slugs: [DEFAULT_USERNAME], currentSlug: DEFAULT_USERNAME, editingId: "" };

  function h(value) { return window.CakgupMicrosite.escapeHtml(value); }
  function token() { return window.CakgupAuth.getToken(); }
  function normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || DEFAULT_USERNAME;
  }

  function publicUrlFor(slug = state.currentSlug) {
    return `${location.origin}${BASE_PATH}/${normalizeSlug(slug)}`;
  }

  function ensureSlugList(slug) {
    const next = normalizeSlug(slug);
    const merged = new Set([DEFAULT_USERNAME, next, ...(state.slugs || []).map(normalizeSlug)]);
    state.slugs = [...merged].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }

  function publicProfile() {
    const slug = normalizeSlug(state.currentSlug || DEFAULT_USERNAME);
    return {
      ...(config.DEFAULT_PROFILE || {}),
      id: slug,
      username: slug,
      microsite_url: publicUrlFor(slug)
    };
  }

  function renderLoginPage(message = "") {
    const root = $("#app");
    root.innerHTML = `
      <main class="admin-page admin-light">
        <section class="admin-login-card">
          <div class="admin-login-brand">
            <img src="${BASE_PATH}/assets/img/logo-yimg.png" alt="Logo Yayasan Indonesia Maju Gemilang">
          </div>
          <p class="eyebrow">Microsite Admin</p>
          <h1>Kelola Link Yayasan</h1>
          <p class="login-desc">Masukkan password admin untuk merekam, mengubah, menonaktifkan, dan menghapus tombol link microsite.</p>
          ${!window.CakgupApi.isConfigured() ? `<p class="message message-error">API_BASE_URL belum dikonfigurasi.</p>` : ""}
          <form id="loginForm" class="login-form">
            <label class="label" for="tokenInput">Password Admin</label>
            <input id="tokenInput" class="input" type="password" autocomplete="current-password" placeholder="Contoh: cakgup" ${!window.CakgupApi.isConfigured() ? "disabled" : ""}>
            <div class="button-row admin-actions">
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
      const input = $("#tokenInput");
      try {
        button.disabled = true;
        button.textContent = "Memvalidasi...";
        msg.className = "message";
        msg.textContent = "Memvalidasi password admin...";
        await window.CakgupAuth.login(input.value);
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
      <main class="admin-page admin-light">
        <div class="admin-shell admin-reference-shell">
          <header class="admin-reference-header">
            <div class="admin-reference-brand">
              <img src="${BASE_PATH}/assets/img/logo-yimg.png" alt="Logo YIMG">
              <div>
                <p class="eyebrow">Dashboard Admin</p>
                <h1>Kelola Tombol Link Microsite</h1>
                <p>Gunakan password <strong>cakgup</strong> untuk login admin. Data tombol tersimpan melalui Google Apps Script.</p>
              </div>
            </div>
            <div class="button-row top-actions">
              <a id="openPublicButton" class="outline-button" href="${publicUrlFor()}" target="_blank" rel="noopener">Buka Publik</a>
              <button id="reloadButton" class="secondary-button" type="button">Muat Ulang</button>
              <button id="logoutButton" class="ghost-button" type="button">Keluar</button>
            </div>
          </header>

          <section class="admin-reference-grid">
            <div class="admin-reference-main">
              <section class="admin-card action-strip">
                <button class="primary-button" type="button" id="focusFormButton">Simpan Link</button>
                <button class="soft-button" type="button" id="cancelEditButton">Batal Edit</button>
              </section>

              <section class="admin-card">
                <h2>Slug / URL Microsite</h2>
                ${renderSlugManager()}
              </section>

              <section class="admin-card">
                <h2>Tambah / Edit Tombol Link</h2>
                ${renderLinkForm()}
              </section>

              <section class="admin-card">
                <h2>Daftar Komponen Link</h2>
                <div id="linkEditorList" class="reference-link-list">
                  ${renderLinkList()}
                </div>
              </section>

              <section class="admin-card">
                <h2>Statistik Singkat</h2>
                ${renderStats()}
              </section>
            </div>

            <aside class="admin-reference-preview">
              <div class="phone-shell">
                <div id="previewScreen" class="preview-screen"></div>
              </div>
            </aside>
          </section>
        </div>
      </main>
    `;
    bindEvents();
    updatePreview();
  }


  function renderSlugManager() {
    const current = normalizeSlug(state.currentSlug || DEFAULT_USERNAME);
    ensureSlugList(current);
    const options = state.slugs.map((slug) => `<option value="${h(slug)}" ${slug === current ? "selected" : ""}>${h(slug)}</option>`).join("");
    return `
      <div class="slug-manager">
        <div class="slug-current-card">
          <span class="slug-label">Slug aktif</span>
          <strong>/${h(current)}</strong>
          <a href="${publicUrlFor(current)}" target="_blank" rel="noopener">${h(publicUrlFor(current))}</a>
        </div>
        <div class="form-grid reference-form-grid slug-form-grid">
          <div>
            <label class="label" for="slugSelectInput">Pilih Slug Tersedia</label>
            <select id="slugSelectInput" class="select">${options}</select>
          </div>
          <div>
            <label class="label" for="slugInput">Add / Edit Slug</label>
            <input id="slugInput" class="input" type="text" value="${h(current)}" placeholder="Contoh: microsite_lain">
          </div>
        </div>
        <p class="slug-help">Gunakan huruf kecil, angka, tanda hubung (-), atau underscore (_). Contoh URL: <strong>${h(location.origin + BASE_PATH)}/microsite_lain</strong></p>
        <div class="button-row admin-actions">
          <button id="useSlugButton" class="secondary-button" type="button">Gunakan / Buat Slug</button>
          <button id="renameSlugButton" class="outline-button" type="button">Ubah Slug Aktif</button>
          <a id="openSlugLink" class="ghost-button" href="${publicUrlFor(current)}" target="_blank" rel="noopener">Buka URL Ini</a>
        </div>
        <p id="slugMessage" class="message hidden"></p>
      </div>
    `;
  }

  function renderLinkForm() {
    return `
      <form id="linkForm" class="reference-link-form">
        <input id="linkIdInput" type="hidden" value="">
        <div class="form-grid reference-form-grid">
          <div>
            <label class="label" for="linkTitleInput">Judul Link</label>
            <input id="linkTitleInput" class="input" type="text" placeholder="Contoh: Donasi" required>
          </div>
          <div>
            <label class="label" for="linkIconInput">Icon</label>
            <select id="linkIconInput" class="select">
              <option value="link">Link</option>
              <option value="mosque">Tentang/Masjid</option>
              <option value="program">Program</option>
              <option value="donate">Donasi</option>
              <option value="form">Pendaftaran</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="location">Lokasi</option>
              <option value="email">Email</option>
              <option value="document">Dokumen</option>
            </select>
          </div>
          <div class="field-full">
            <label class="label" for="linkUrlInput">URL Tujuan</label>
            <input id="linkUrlInput" class="input" type="url" placeholder="https://..." required>
          </div>
          <div class="field-full optional-field">
            <label class="label" for="linkSubtitleInput">Subjudul / Deskripsi Singkat</label>
            <input id="linkSubtitleInput" class="input" type="text" placeholder="Contoh: Salurkan donasi terbaik Anda">
          </div>
          <div>
            <label class="label" for="linkColorInput">Warna Tombol</label>
            <input id="linkColorInput" class="input color-input" type="color" value="#0f4e44">
          </div>
          <div>
            <label class="label" for="linkSortInput">Urutan</label>
            <input id="linkSortInput" class="input" type="number" min="1" value="1">
          </div>
          <label class="check-row reference-check"><input id="linkActiveInput" type="checkbox" checked> Link aktif</label>
        </div>
        <div class="button-row admin-actions">
          <button class="primary-button" type="submit">Simpan Link</button>
          <button id="resetLinkFormButton" class="soft-button" type="button">Reset Form</button>
        </div>
        <p id="linkMessage" class="message hidden"></p>
      </form>
    `;
  }

  function renderLinkList() {
    const items = [...state.links].sort((a, b) => Number(a.sort_order || 999) - Number(b.sort_order || 999));
    if (!items.length) return `<div class="empty-links">Belum ada link. Tambahkan melalui form di atas.</div>`;
    return items.map(renderLinkEditorCard).join("");
  }

  function renderLinkEditorCard(link) {
    const isInactive = link.is_active === false || String(link.is_active).toLowerCase() === "false";
    const activeText = isInactive ? "Nonaktif" : "Aktif";
    const toggleText = isInactive ? "Aktifkan" : "Nonaktifkan";
    return `
      <article class="reference-link-card ${isInactive ? "is-inactive" : ""}">
        <div class="link-card-main">
          <div class="link-card-icon">${h(window.CakgupMicrosite.iconFor(link.icon))}</div>
          <div>
            <h3>${h(link.title || "Tanpa Judul")}</h3>
            <p>${h(link.url || "")}</p>
            ${link.subtitle ? `<small>${h(link.subtitle)}</small>` : ""}
          </div>
        </div>
        <div class="link-card-side">
          <span class="number-badge">#${h(link.sort_order || "-")}</span>
          <span class="status-badge ${isInactive ? "off" : "on"}">${h(activeText)}</span>
        </div>
        <div class="button-row link-card-actions">
          <button class="soft-button edit-link-button" type="button" data-id="${h(link.id || "")}">Edit</button>
          <button class="warning-button toggle-link-button" type="button" data-id="${h(link.id || "")}">${h(toggleText)}</button>
          <button class="danger-button delete-link-button" type="button" data-id="${h(link.id || "")}">Hapus</button>
        </div>
      </article>
    `;
  }

  function renderStats() {
    const total = state.links.length;
    const active = state.links.filter((item) => !(item.is_active === false || String(item.is_active).toLowerCase() === "false")).length;
    const inactive = total - active;
    return `
      <div class="stats-grid">
        <div class="stat-card"><strong>${total}</strong><span>Total Link</span></div>
        <div class="stat-card"><strong>${active}</strong><span>Link Aktif</span></div>
        <div class="stat-card"><strong>${inactive}</strong><span>Link Nonaktif</span></div>
      </div>
    `;
  }

  function bindEvents() {
    $("#logoutButton")?.addEventListener("click", () => {
      window.CakgupAuth.logout();
      renderLoginPage("Anda sudah keluar dari dashboard admin.");
    });

    $("#slugSelectInput")?.addEventListener("change", async (event) => {
      const slug = normalizeSlug(event.target.value || DEFAULT_USERNAME);
      state.currentSlug = slug;
      if ($("#slugInput")) $("#slugInput").value = slug;
      await reloadLinks();
    });

    $("#useSlugButton")?.addEventListener("click", async () => {
      const slug = normalizeSlug($("#slugInput")?.value || DEFAULT_USERNAME);
      state.currentSlug = slug;
      ensureSlugList(slug);
      await reloadLinks();
    });

    $("#renameSlugButton")?.addEventListener("click", renameCurrentSlug);


    $("#reloadButton")?.addEventListener("click", () => renderAdminPage());
    $("#focusFormButton")?.addEventListener("click", () => $("#linkTitleInput")?.focus());
    $("#cancelEditButton")?.addEventListener("click", () => resetLinkForm());
    $("#linkForm")?.addEventListener("submit", submitLinkForm);
    $("#resetLinkFormButton")?.addEventListener("click", () => resetLinkForm());

    document.querySelectorAll(".edit-link-button").forEach((btn) => {
      btn.addEventListener("click", () => fillLinkForm(btn.getAttribute("data-id")));
    });
    document.querySelectorAll(".toggle-link-button").forEach((btn) => {
      btn.addEventListener("click", () => toggleLink(btn.getAttribute("data-id")));
    });
    document.querySelectorAll(".delete-link-button").forEach((btn) => {
      btn.addEventListener("click", () => deleteLink(btn.getAttribute("data-id")));
    });
    document.querySelectorAll("#linkForm input, #linkForm select").forEach((el) => {
      el.addEventListener("input", updatePreview);
      el.addEventListener("change", updatePreview);
    });
  }

  async function renderAdminPage() {
    if (!window.CakgupAuth.isLoggedIn()) {
      renderLoginPage();
      return;
    }
    const root = $("#app");
    root.innerHTML = `<main class="admin-page admin-light"><div class="loading-screen"><div><div class="spinner"></div><p class="login-desc">Memuat daftar link...</p></div></div></main>`;
    try {
      await loadSlugs();
      const data = await window.CakgupApi.post({ action: "getMicrositeLinks", token: token(), username: state.currentSlug });
      if (!data.success) throw new Error(data.message || "Gagal memuat daftar link.");
      state.currentSlug = normalizeSlug(data.username || state.currentSlug || DEFAULT_USERNAME);
      ensureSlugList(state.currentSlug);
      state.links = Array.isArray(data.links) ? data.links : [];
      renderAdminLayout();
    } catch (error) {
      renderLoginPage(error.message || "Gagal memuat data admin.");
    }
  }

  function buildFormLink() {
    return {
      id: $("#linkIdInput")?.value || "",
      username: normalizeSlug(state.currentSlug || DEFAULT_USERNAME),
      title: $("#linkTitleInput")?.value.trim() || "",
      subtitle: $("#linkSubtitleInput")?.value.trim() || "",
      url: $("#linkUrlInput")?.value.trim() || "",
      icon: $("#linkIconInput")?.value || "link",
      button_color: $("#linkColorInput")?.value || "#0f4e44",
      text_color: "#FFFFFF",
      sort_order: Number($("#linkSortInput")?.value || 1),
      is_active: Boolean($("#linkActiveInput")?.checked)
    };
  }

  async function submitLinkForm(event) {
    event.preventDefault();
    const button = event.submitter;
    const msg = $("#linkMessage");
    const link = buildFormLink();

    try {
      if (!link.title) throw new Error("Judul link wajib diisi.");
      if (!/^https?:\/\//i.test(link.url)) throw new Error("URL harus diawali http:// atau https://");
      button.disabled = true;
      button.textContent = "Menyimpan...";
      msg.className = "message";
      msg.textContent = "Menyimpan link...";
      const result = await window.CakgupApi.post({ action: "saveMicrositeLink", token: token(), ...link });
      if (!result.success) throw new Error(result.message || "Gagal menyimpan link.");
      msg.className = "message message-success";
      msg.textContent = "Link berhasil disimpan.";
      resetLinkForm(false);
      await reloadLinks();
    } catch (error) {
      msg.className = "message message-error";
      msg.textContent = error.message || "Gagal menyimpan link.";
    } finally {
      button.disabled = false;
      button.textContent = "Simpan Link";
    }
  }

  async function loadSlugs() {
    try {
      const data = await window.CakgupApi.post({ action: "listSlugs", token: token() });
      if (data.success && Array.isArray(data.slugs)) {
        state.slugs = data.slugs.map(normalizeSlug).filter(Boolean);
      }
    } catch (error) {
      // Jika endpoint lama belum diperbarui, admin tetap berjalan dengan slug default.
      state.slugs = state.slugs && state.slugs.length ? state.slugs : [DEFAULT_USERNAME];
    }
    ensureSlugList(state.currentSlug || DEFAULT_USERNAME);
  }

  async function reloadLinks() {
    const slug = normalizeSlug(state.currentSlug || DEFAULT_USERNAME);
    state.currentSlug = slug;
    ensureSlugList(slug);
    const data = await window.CakgupApi.post({ action: "getMicrositeLinks", token: token(), username: slug });
    if (!data.success) throw new Error(data.message || "Gagal memuat daftar link.");
    state.links = Array.isArray(data.links) ? data.links : [];
    renderAdminLayout();
  }

  async function renameCurrentSlug() {
    const oldSlug = normalizeSlug(state.currentSlug || DEFAULT_USERNAME);
    const newSlug = normalizeSlug($("#slugInput")?.value || "");
    const msg = $("#slugMessage");
    try {
      if (!newSlug) throw new Error("Slug baru wajib diisi.");
      if (newSlug === oldSlug) throw new Error("Slug baru masih sama dengan slug aktif.");
      if (!confirm(`Ubah slug /${oldSlug} menjadi /${newSlug}? Semua link pada slug lama akan dipindahkan.`)) return;
      if (msg) { msg.className = "message"; msg.textContent = "Mengubah slug..."; }
      const result = await window.CakgupApi.post({ action: "renameSlug", token: token(), old_username: oldSlug, new_username: newSlug });
      if (!result.success) throw new Error(result.message || "Gagal mengubah slug.");
      state.currentSlug = newSlug;
      await loadSlugs();
      await reloadLinks();
    } catch (error) {
      if (msg) { msg.className = "message message-error"; msg.textContent = error.message || "Gagal mengubah slug."; }
      else alert(error.message || "Gagal mengubah slug.");
    }
  }

  function fillLinkForm(id) {
    const link = state.links.find((item) => String(item.id) === String(id));
    if (!link) return;
    state.editingId = link.id || "";
    $("#linkIdInput").value = link.id || "";
    $("#linkTitleInput").value = link.title || "";
    $("#linkSubtitleInput").value = link.subtitle || "";
    $("#linkUrlInput").value = link.url || "";
    $("#linkIconInput").value = link.icon || "link";
    $("#linkColorInput").value = normalizeColor(link.button_color || "#0f4e44");
    $("#linkSortInput").value = link.sort_order || 1;
    $("#linkActiveInput").checked = !(link.is_active === false || String(link.is_active).toLowerCase() === "false");
    $("#linkMessage").className = "message";
    $("#linkMessage").textContent = "Mode edit link aktif.";
    $("#linkTitleInput").focus();
    updatePreview();
  }

  async function toggleLink(id) {
    const link = state.links.find((item) => String(item.id) === String(id));
    if (!link) return;
    const isInactive = link.is_active === false || String(link.is_active).toLowerCase() === "false";
    const nextActive = isInactive;
    const actionText = nextActive ? "mengaktifkan" : "menonaktifkan";
    if (!confirm(`Yakin ingin ${actionText} link ini?`)) return;
    try {
      const result = await window.CakgupApi.post({
        action: "saveMicrositeLink",
        token: token(),
        ...link,
        username: link.username || normalizeSlug(state.currentSlug || DEFAULT_USERNAME),
        is_active: nextActive
      });
      if (!result.success) throw new Error(result.message || "Gagal memperbarui status link.");
      await reloadLinks();
    } catch (error) {
      alert(error.message || "Gagal memperbarui status link.");
    }
  }

  async function deleteLink(id) {
    if (!id || !confirm("Hapus permanen link ini dari Google Sheets?")) return;
    try {
      const result = await window.CakgupApi.post({ action: "deleteMicrositeLink", token: token(), id, username: state.currentSlug });
      if (!result.success) throw new Error(result.message || "Gagal menghapus link.");
      await reloadLinks();
    } catch (error) {
      alert(error.message || "Gagal menghapus link.");
    }
  }

  function resetLinkForm(clearMessage = true) {
    state.editingId = "";
    if ($("#linkIdInput")) $("#linkIdInput").value = "";
    $("#linkForm")?.reset();
    if ($("#linkColorInput")) $("#linkColorInput").value = "#0f4e44";
    if ($("#linkSortInput")) $("#linkSortInput").value = String((state.links || []).length + 1);
    if ($("#linkActiveInput")) $("#linkActiveInput").checked = true;
    if (clearMessage && $("#linkMessage")) $("#linkMessage").className = "message hidden";
    updatePreview();
  }

  function normalizeColor(value) {
    const text = String(value || "").trim();
    return /^#[0-9a-f]{6}$/i.test(text) ? text : "#0f4e44";
  }

  function updatePreview() {
    const preview = $("#previewScreen");
    if (!preview) return;
    const draft = buildFormLink();
    let links = state.links.map((item) => ({ ...item }));
    if (draft.title || draft.url) {
      const idx = links.findIndex((item) => String(item.id) === String(draft.id));
      if (idx >= 0) links[idx] = { ...links[idx], ...draft };
      else links.push({ ...draft, id: "draft" });
    }
    preview.innerHTML = window.CakgupMicrosite.renderMicrositeMarkup(publicProfile(), links, {});
  }

  window.CakgupAdmin = { renderAdminPage };
})();
