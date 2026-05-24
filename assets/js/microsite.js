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
      info: "ℹ️",
      star: "✦",
      heart: "♥",
      whatsapp: "☘",
      instagram: "◎",
      youtube: "▶",
      facebook: "f",
      location: "⌖",
      maps: "⌖",
      email: "✉",
      phone: "☎",
      document: "▣",
      donate: "♥",
      program: "✦"
    };
    return map[key] || "🔗";
  }

  function getProfileCssVars(profile = {}) {
    return [
      `--yimg-orange:${escapeHtml(profile.primary_color || "#C44A00")}`,
      `--yimg-red:${escapeHtml(profile.secondary_color || "#D40000")}`,
      `--yimg-purple:${escapeHtml(profile.accent_color || "#4B006E")}`,
      `--ink:${escapeHtml(profile.text_color || "#2D1B12")}`
    ].join(";");
  }

  function renderMicrositeMarkup(profile = {}, links = [], options = {}) {
    const logo = normalizePathAsset(profile.logo_url || profile.avatar_url, `${BASE_PATH}/assets/img/logo-yimg.png`);
    const banner = normalizePathAsset(profile.banner_url || "", "");
    const displayName = profile.display_name || "Yayasan Indonesia Maju Gemilang";
    const tagline = profile.tagline || "Bergerak Bersama untuk Ummat dan Kebaikan";
    const bio = profile.bio || "Microsite resmi Yayasan Indonesia Maju Gemilang.";
    const script = profile.islamic_script || "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ";
    const showScript = profile.show_islamic_script !== false && String(profile.show_islamic_script) !== "false";
    const activeLinks = Array.isArray(links) ? links.slice().sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)) : [];
    const publicUrl = profile.microsite_url || `${location.origin}${BASE_PATH}/${profile.username || config.DEFAULT_USERNAME || "yimg"}`;
    const style = getProfileCssVars(profile);

    return `
      <main class="public-page" style="${style}">
        ${options.demoMode ? `<div class="demo-alert"><strong>Mode demo.</strong> API Google Apps Script belum dikonfigurasi, sehingga halaman memakai data contoh dari config.js.</div>` : ""}
        <section class="microsite-card">
          <header class="hero">
            ${banner ? `<div class="hero-bg-image" style="background-image:url('${escapeHtml(banner)}')"></div>` : ""}
            <div class="hero-pattern" aria-hidden="true"></div>
            <div>
              ${showScript ? `<div class="islamic-script" lang="ar" dir="rtl">${escapeHtml(script)}</div>` : ""}
              <div class="logo-wrap">
                <img src="${escapeHtml(logo)}" alt="Logo ${escapeHtml(displayName)}" loading="eager">
              </div>
              <h1 class="brand-name gradient-text">${escapeHtml(displayName)}</h1>
              <p class="tagline">${escapeHtml(tagline)}</p>
            </div>
          </header>

          <section class="profile-body">
            <div class="bismillah-divider" lang="ar" dir="rtl">الحمد لله</div>
            <p class="bio">${escapeHtml(bio)}</p>
            <nav class="link-list" aria-label="Tautan microsite">
              ${activeLinks.length ? activeLinks.map((link) => renderLink(profile, link)).join("") : `<div class="empty-links">Belum ada tautan aktif.</div>`}
            </nav>
            <div class="public-actions">
              <button class="share-button" type="button" data-share-url="${escapeHtml(publicUrl)}">Bagikan</button>
              <a class="admin-button" href="${BASE_PATH}/admin">Admin</a>
            </div>
          </section>
        </section>
        <footer class="footer">© ${new Date().getFullYear()} Yayasan Indonesia Maju Gemilang · Dibuat dengan CakGup Microsite</footer>
        ${options.enableAudio !== false ? renderAudioControl(profile) : ""}
        <div id="toast" class="toast" role="status" aria-live="polite"></div>
      </main>
    `;
  }

  function renderLink(profile, link) {
    const title = link.title || "Tautan";
    const url = normalizePathAsset(link.url || "#", "#");
    const color = link.button_color || profile.primary_color || "#C44A00";
    const textColor = link.text_color || "#FFFFFF";
    return `
      <a class="bio-link" href="${escapeHtml(url)}" target="_blank" rel="noopener" data-link-id="${escapeHtml(link.id || "")}" data-link-title="${escapeHtml(title)}" data-link-url="${escapeHtml(url)}" style="background:${escapeHtml(color)};color:${escapeHtml(textColor)}">
        <span class="link-icon" aria-hidden="true">${escapeHtml(iconFor(link.icon))}</span>
        <span class="link-title">${escapeHtml(title)}</span>
        <span class="link-arrow" aria-hidden="true">›</span>
      </a>
    `;
  }

  function renderAudioControl(profile = {}) {
    const enabled = profile.audio_enabled !== false && String(profile.audio_enabled) !== "false";
    if (!enabled) return "";
    const audioUrl = normalizePathAsset(profile.audio_url || `${BASE_PATH}/assets/audio/nasyid.mp3`, `${BASE_PATH}/assets/audio/nasyid.mp3`);
    const loop = profile.audio_loop !== false && String(profile.audio_loop) !== "false";
    const volume = Number(profile.audio_volume || 0.45);
    return `
      <audio id="nasyidAudio" src="${escapeHtml(audioUrl)}" ${loop ? "loop" : ""} preload="none" data-volume="${escapeHtml(String(volume))}"></audio>
      <button id="audioFab" class="audio-fab" type="button" aria-label="Putar backsound islami">
        <span lang="ar" dir="rtl">نَشِيد</span>
        <small>PLAY</small>
      </button>
    `;
  }

  function bindPublicInteractions(profile = {}, links = []) {
    document.querySelectorAll(".share-button").forEach((button) => {
      button.addEventListener("click", async () => {
        const url = button.getAttribute("data-share-url") || window.location.href;
        const title = profile.display_name || document.title;
        try {
          if (navigator.share) {
            await navigator.share({ title, text: profile.tagline || title, url });
          } else {
            await navigator.clipboard.writeText(url);
            showToast("Link microsite disalin.");
          }
        } catch (error) {
          if (error && error.name !== "AbortError") showToast("Gagal membagikan link.");
        }
      });
    });

    document.querySelectorAll(".bio-link").forEach((anchor) => {
      anchor.addEventListener("click", () => {
        const payload = {
          action: "logMicrositeClick",
          microsite_id: profile.id || "",
          username: profile.username || config.DEFAULT_USERNAME || "yimg",
          link_id: anchor.getAttribute("data-link-id") || "",
          title: anchor.getAttribute("data-link-title") || "",
          target_url: anchor.getAttribute("data-link-url") || anchor.href,
          user_agent: navigator.userAgent || "",
          referrer: document.referrer || ""
        };

        if (!window.CakgupApi.postBeacon(payload)) {
          window.CakgupApi.post(payload).catch(() => {});
        }
      });
    });

    bindAudioControl();
  }

  function bindAudioControl() {
    const audio = document.getElementById("nasyidAudio");
    const button = document.getElementById("audioFab");
    if (!audio || !button) return;

    const volume = Number(audio.getAttribute("data-volume") || 0.45);
    audio.volume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0.45;

    function setPlayingState(isPlaying) {
      button.classList.toggle("is-playing", isPlaying);
      button.setAttribute("aria-label", isPlaying ? "Hentikan backsound islami" : "Putar backsound islami");
      const small = button.querySelector("small");
      if (small) small.textContent = isPlaying ? "STOP" : "PLAY";
    }

    button.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          await audio.play();
          setPlayingState(true);
        } catch (error) {
          showToast("Audio belum dapat diputar. Coba tekan sekali lagi.");
        }
      } else {
        audio.pause();
        setPlayingState(false);
      }
    });

    audio.addEventListener("ended", () => setPlayingState(false));
    audio.addEventListener("pause", () => setPlayingState(false));
    audio.addEventListener("play", () => setPlayingState(true));
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  async function loadMicrosite(username) {
    if (!window.CakgupApi.isConfigured()) {
      return {
        success: true,
        demoMode: true,
        microsite: config.DEFAULT_PROFILE,
        links: config.DEFAULT_LINKS
      };
    }

    return window.CakgupApi.get({ action: "getMicrosite", username });
  }

  window.CakgupMicrosite = {
    escapeHtml,
    normalizePathAsset,
    iconFor,
    renderMicrositeMarkup,
    bindPublicInteractions,
    loadMicrosite,
    showToast
  };
})();
