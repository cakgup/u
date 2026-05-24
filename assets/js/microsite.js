(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const BASE_PATH = (config.BASE_PATH || "/u").replace(/\/$/, "");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizePathAsset(value, fallback = "") {
    const text = String(value || "").trim();
    if (!text) return fallback;
    if (/^https?:\/\//i.test(text) || text.startsWith("data:")) return text;
    if (text.startsWith("/")) return text;
    return `${BASE_PATH}/${text.replace(/^\.\//, "")}`;
  }

  function iconFor(name) {
    const key = String(name || "link").toLowerCase().trim();
    const map = {
      link: "🔗",
      info: "☾",
      mosque: "🕌",
      star: "✦",
      program: "🤲",
      heart: "♥",
      donate: "♥",
      whatsapp: "☏",
      instagram: "◎",
      youtube: "▶",
      facebook: "f",
      location: "⌖",
      maps: "⌖",
      email: "✉",
      phone: "☎",
      document: "▣",
      form: "✎"
    };
    return map[key] || "🔗";
  }

  function cleanLinks(links = []) {
    return (Array.isArray(links) ? links : [])
      .filter((item) => item && item.is_active !== false && String(item.is_active).toLowerCase() !== "false")
      .sort((a, b) => Number(a.sort_order || 999) - Number(b.sort_order || 999));
  }

  function renderMicrositeMarkup(profile = {}, links = [], options = {}) {
    const p = { ...(config.DEFAULT_PROFILE || {}), ...(profile || {}) };
    const logo = normalizePathAsset(p.logo_url, `${BASE_PATH}/assets/img/logo-yimg.png`);
    const audioUrl = normalizePathAsset(p.audio_url, `${BASE_PATH}/assets/audio/nasyid.mp3`);
    const activeLinks = cleanLinks(links.length ? links : config.DEFAULT_LINKS || []);
    const publicUrl = p.microsite_url || `${location.origin}${BASE_PATH}/${p.username || config.DEFAULT_USERNAME || "yimg"}`;

    return `
      <main class="public-page">
        <section class="stage" aria-label="Microsite Yayasan Indonesia Maju Gemilang">
          <div class="turkish-frame" aria-hidden="true"></div>
          <section class="hero-panel">
            <div class="hero-ornament ornament-left" aria-hidden="true"></div>
            <div class="hero-ornament ornament-right" aria-hidden="true"></div>
            <a class="lantern lantern-right admin-moon-button" href="${BASE_PATH}/admin" aria-label="Login admin" title="Admin">☾</a>
            <div class="logo-aura">
              <img class="brand-logo" src="${escapeHtml(logo)}" alt="Logo Yayasan Indonesia Maju Gemilang" loading="eager">
            </div>
            <section id="prayerSchedule" class="prayer-card" aria-label="Jadwal shalat Kota Bekasi dan sekitarnya">
              <p class="prayer-kicker">Waktu Shalat untuk Daerah</p>
              <h2 class="prayer-city">Kota Bekasi dan Sekitarnya</h2>
              <div class="prayer-next" aria-live="polite">
                <span>
                  <small>Berikutnya</small>
                  <strong id="prayerNextName">Memuat</strong>
                </span>
                <b id="prayerNextTime">--:--</b>
              </div>
              <div id="prayerTimes" class="prayer-times">
                <span class="prayer-chip"><small>Subuh</small><b>--:--</b></span>
                <span class="prayer-chip"><small>Dzuhur</small><b>--:--</b></span>
                <span class="prayer-chip"><small>Ashar</small><b>--:--</b></span>
                <span class="prayer-chip"><small>Maghrib</small><b>--:--</b></span>
                <span class="prayer-chip"><small>Isya</small><b>--:--</b></span>
              </div>
              <p id="prayerDate" class="prayer-date">Memuat jadwal harian...</p>
            </section>
          </section>
          ${renderActivityTitle(p)}

          <nav class="link-list" aria-label="Daftar tautan penting">
            ${activeLinks.length ? activeLinks.map(renderLink).join("") : `<div class="empty-links">Belum ada link aktif.</div>`}
          </nav>

          <footer class="footer">
            <span>© ${new Date().getFullYear()} ${escapeHtml(p.display_name || "Yayasan Indonesia Maju Gemilang")}</span>
          </footer>
        </section>

        ${p.audio_enabled === false || String(p.audio_enabled).toLowerCase() === "false" ? "" : `
          <button id="audioFab" class="audio-fab" type="button" aria-label="Putar atau hentikan nasyid">♫</button>
          <audio id="nasyidAudio" src="${escapeHtml(audioUrl)}" data-src="${escapeHtml(audioUrl)}" ${p.audio_loop === false || String(p.audio_loop).toLowerCase() === "false" ? "" : "loop"} autoplay playsinline preload="auto"></audio>
        `}
        <div id="snowLayer" class="snow-layer" aria-hidden="true"></div>
        <button id="shareFab" class="share-fab" type="button" aria-label="Bagikan halaman">↗</button>
        <div id="toast" class="toast" role="status"></div>
      </main>
    `;
  }


  function renderActivityTitle(profile = {}) {
    const fallback = (config.DEFAULT_PROFILE && config.DEFAULT_PROFILE.event_title) || "";
    const rawTitle = profile.event_title || profile.activity_title || fallback;
    const title = String(rawTitle || "").trim();
    if (!title) return "";
    return `
        <section class="activity-title" aria-label="Judul kegiatan">
          <span>${escapeHtml(title)}</span>
        </section>`;
  }

  function renderLink(link) {
    const bg = link.button_color || "#073b31";
    const text = link.text_color || "#ffffff";
    const subtitle = link.subtitle || link.description || "";
    return `
      <a class="bio-link" href="${escapeHtml(link.url || "#")}" target="_blank" rel="noopener" style="--btn-bg:${escapeHtml(bg)};--btn-text:${escapeHtml(text)}">
        <span class="link-medallion">${escapeHtml(iconFor(link.icon))}</span>
        <span class="link-copy">
          <strong>${escapeHtml(link.title || "Link")}</strong>
          ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
        </span>
        <span class="link-arrow">›</span>
      </a>
    `;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function setupAudio(profile = {}) {
    const audio = document.getElementById("nasyidAudio");
    const button = document.getElementById("audioFab");
    if (!audio || !button) return;

    const autoplayEnabled = profile.audio_autoplay !== false && String(profile.audio_autoplay).toLowerCase() !== "false";
    audio.volume = Number(profile.audio_volume || config.DEFAULT_PROFILE?.audio_volume || 0.34);
    audio.muted = false;
    audio.autoplay = autoplayEnabled;
    audio.playsInline = true;

    function refresh() {
      button.classList.toggle("is-playing", !audio.paused);
    }

    async function ensureSource() {
      if (!audio.getAttribute("src")) {
        audio.setAttribute("src", audio.dataset.src || "");
        audio.load();
      }
    }

    async function playAudio() {
      try {
        await ensureSource();
        await audio.play();
      } catch (error) {
        // Browser tertentu tetap menolak autoplay bersuara sampai ada interaksi pengguna.
      } finally {
        refresh();
      }
    }

    button.addEventListener("click", async () => {
      if (audio.paused) await playAudio();
      else audio.pause();
      refresh();
    });
    audio.addEventListener("play", refresh);
    audio.addEventListener("pause", refresh);

    if (autoplayEnabled) {
      // Upaya autoplay langsung saat halaman dimuat.
      playAudio();
      requestAnimationFrame(playAudio);
      window.addEventListener("pageshow", playAudio, { once: true });

      // Fallback: jika browser memblokir autoplay, audio langsung diputar pada interaksi pertama.
      ["pointerdown", "touchstart", "click", "keydown", "scroll"].forEach((eventName) => {
        window.addEventListener(eventName, playAudio, { once: true, passive: true });
      });
    }
  }

  function setupSnow(profile = {}) {
    if (profile.snow_enabled === false || String(profile.snow_enabled).toLowerCase() === "false") return;
    const layer = document.getElementById("snowLayer");
    if (!layer || layer.children.length) return;
    const symbols = ["❅", "✦", "·", "۞"];
    const count = Math.min(16, Math.max(8, Math.floor(window.innerWidth / 34)));
    for (let i = 0; i < count; i += 1) {
      const flake = document.createElement("span");
      flake.textContent = symbols[i % symbols.length];
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.animationDelay = `${Math.random() * -16}s`;
      flake.style.animationDuration = `${12 + Math.random() * 14}s`;
      flake.style.opacity = `${0.16 + Math.random() * 0.34}`;
      flake.style.fontSize = `${9 + Math.random() * 15}px`;
      layer.appendChild(flake);
    }
  }


  function getJakartaDateParts() {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: config.PRAYER_SCHEDULE?.timezone || "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
    return { year: parts.year, month: parts.month, day: parts.day, iso: `${parts.year}-${parts.month}-${parts.day}` };
  }

  function getJakartaMinutesNow() {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: config.PRAYER_SCHEDULE?.timezone || "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const [hour, minute] = formatter.format(new Date()).split(":").map(Number);
    return (hour || 0) * 60 + (minute || 0);
  }

  function timeToMinutes(value) {
    const match = String(value || "").match(/(\d{1,2})[:.](\d{2})/);
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function normalizePrayerData(jadwal = {}) {
    const rows = [
      ["Subuh", jadwal.subuh],
      ["Dzuhur", jadwal.dzuhur],
      ["Ashar", jadwal.ashar],
      ["Maghrib", jadwal.maghrib],
      ["Isya", jadwal.isya]
    ].map(([name, time]) => ({ name, time: String(time || "--:--").replace(".", ":") }));
    return {
      date: jadwal.tanggal || "Hari ini",
      rows
    };
  }

  async function fetchPrayerSchedule() {
    const scheduleConfig = config.PRAYER_SCHEDULE || {};
    const date = getJakartaDateParts();
    const cacheKey = `${scheduleConfig.cache_key || "cakgup_prayer_schedule"}_${date.iso}`;

    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      if (cached && cached.saved_at && Date.now() - cached.saved_at < 1000 * 60 * 60 * 10) return cached.data;
    } catch (error) {
      // Abaikan cache rusak.
    }

    const base = String(scheduleConfig.api_base_url || "https://api.myquran.com/v2/sholat/jadwal/1301").replace(/\/$/, "");
    const url = `${base}/${date.year}/${date.month}/${date.day}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: "no-store" });
      if (!response.ok) throw new Error("Jadwal shalat belum dapat dimuat.");
      const json = await response.json();
      const jadwal = json?.data?.jadwal || json?.jadwal || json?.data || {};
      const data = normalizePrayerData(jadwal);
      localStorage.setItem(cacheKey, JSON.stringify({ saved_at: Date.now(), data }));
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  function renderPrayerSchedule(data) {
    const card = document.getElementById("prayerSchedule");
    const list = document.getElementById("prayerTimes");
    const nextName = document.getElementById("prayerNextName");
    const nextTime = document.getElementById("prayerNextTime");
    const date = document.getElementById("prayerDate");
    if (!card || !list || !nextName || !nextTime) return;

    const now = getJakartaMinutesNow();
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    let next = rows.find((row) => {
      const minutes = timeToMinutes(row.time);
      return minutes !== null && minutes >= now;
    }) || rows[0] || { name: "--", time: "--:--" };

    nextName.textContent = next.name;
    nextTime.textContent = next.time;
    list.innerHTML = rows.map((row) => `
      <span class="prayer-chip ${row.name === next.name ? "is-next" : ""}">
        <small>${escapeHtml(row.name)}</small>
        <b>${escapeHtml(row.time)}</b>
      </span>
    `).join("");
    if (date) date.textContent = data?.date ? `${data.date} · WIB` : "WIB";
    card.classList.add("is-loaded");
  }

  async function setupPrayerSchedule() {
    const scheduleConfig = config.PRAYER_SCHEDULE || {};
    if (scheduleConfig.enabled === false || String(scheduleConfig.enabled).toLowerCase() === "false") return;
    const card = document.getElementById("prayerSchedule");
    if (!card) return;
    try {
      const data = await fetchPrayerSchedule();
      renderPrayerSchedule(data);
    } catch (error) {
      const date = document.getElementById("prayerDate");
      const nextName = document.getElementById("prayerNextName");
      if (nextName) nextName.textContent = "Belum tersedia";
      if (date) date.textContent = "Jadwal shalat belum dapat dimuat. Coba refresh halaman.";
      card.classList.add("is-error");
    }
  }

  function bindPublicInteractions(profile = {}) {
    setupAudio(profile);
    setupSnow(profile);
    setupPrayerSchedule();
    document.getElementById("shareFab")?.addEventListener("click", async () => {
      const url = profile.microsite_url || location.href;
      try {
        if (navigator.share) await navigator.share({ title: profile.display_name || document.title, url });
        else {
          await navigator.clipboard.writeText(url);
          showToast("Link microsite disalin");
        }
      } catch (error) {
        showToast("Bagikan dibatalkan");
      }
    });
  }

  async function loadMicrosite(username) {
    if (!window.CakgupApi.isConfigured()) {
      return { success: true, demoMode: true, microsite: config.DEFAULT_PROFILE, links: config.DEFAULT_LINKS };
    }
    return window.CakgupApi.get({ action: "getMicrosite", username: username || config.DEFAULT_USERNAME || "yimg" });
  }

  window.CakgupMicrosite = {
    escapeHtml,
    iconFor,
    renderMicrositeMarkup,
    bindPublicInteractions,
    loadMicrosite
  };
})();
