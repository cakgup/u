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
        ${options.fallbackMode ? `<div class="demo-alert">API belum mengembalikan data aktif. Halaman memakai data cadangan.</div>` : ""}
        <section class="stage" aria-label="Microsite Yayasan Indonesia Maju Gemilang">
          <div class="turkish-frame" aria-hidden="true"></div>
          <section class="hero-panel">
            <div class="hero-ornament ornament-left" aria-hidden="true"></div>
            <div class="hero-ornament ornament-right" aria-hidden="true"></div>
            <div class="lantern lantern-left" aria-hidden="true">۞</div>
            <div class="lantern lantern-right" aria-hidden="true">۞</div>
            <div class="logo-aura">
              <img class="brand-logo" src="${escapeHtml(logo)}" alt="Logo Yayasan Indonesia Maju Gemilang" loading="eager">
            </div>
            <div class="gold-divider compact-divider"><span>◆</span></div>
            <p class="arabic-script">${escapeHtml(p.islamic_script)}</p>
            <p class="script-translation">“${escapeHtml(p.islamic_translation || "Dan tolong-menolonglah kamu dalam kebajikan dan takwa.")}”</p>
            <p class="hero-desc">${escapeHtml(p.bio)}</p>
          </section>


          <nav class="link-list" aria-label="Daftar tautan penting">
            ${activeLinks.length ? activeLinks.map(renderLink).join("") : `<div class="empty-links">Belum ada link aktif.</div>`}
          </nav>

          <footer class="footer">
            <span>© ${new Date().getFullYear()} ${escapeHtml(p.display_name || "Yayasan Indonesia Maju Gemilang")}</span>
          </footer>
        </section>

        ${p.audio_enabled === false || String(p.audio_enabled).toLowerCase() === "false" ? "" : `
          <button id="audioFab" class="audio-fab" type="button" aria-label="Putar atau hentikan nasyid">♫</button>
          <audio id="nasyidAudio" data-src="${escapeHtml(audioUrl)}" ${p.audio_loop === false || String(p.audio_loop).toLowerCase() === "false" ? "" : "loop"} preload="none"></audio>
        `}
        <div id="snowLayer" class="snow-layer" aria-hidden="true"></div>
        <button id="shareFab" class="share-fab" type="button" aria-label="Bagikan halaman">↗</button>
        <div id="toast" class="toast" role="status"></div>
      </main>
    `;
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

    audio.volume = Number(profile.audio_volume || config.DEFAULT_PROFILE?.audio_volume || 0.34);
    let attempted = false;

    function refresh() { button.classList.toggle("is-playing", !audio.paused); }
    async function playAudio() {
      try {
        if (!audio.src) {
          audio.src = audio.dataset.src || "";
          audio.load();
        }
        await audio.play();
        refresh();
      } catch (error) {
        refresh();
      }
    }
    function tryAutoplay() {
      if (attempted) return;
      attempted = true;
      playAudio();
    }

    button.addEventListener("click", async () => {
      if (audio.paused) await playAudio();
      else audio.pause();
      refresh();
    });
    audio.addEventListener("play", refresh);
    audio.addEventListener("pause", refresh);

    if (profile.audio_autoplay !== false && String(profile.audio_autoplay).toLowerCase() !== "false") {
      tryAutoplay();
      ["click", "touchstart", "keydown", "scroll"].forEach((eventName) => {
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

  function bindPublicInteractions(profile = {}) {
    setupAudio(profile);
    setupSnow(profile);
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
