/**
 * Konfigurasi publik CakGup Microsite.
 * Ganti API_BASE_URL dengan URL Web App Google Apps Script dari file gas/Code.gs.
 */
window.CAKGUP_MICROSITE_CONFIG = {
  APP_NAME: "Microsite Yayasan Indonesia Maju Gemilang",
  BASE_PATH: "/u",
  DEFAULT_USERNAME: "yimg",
  API_BASE_URL: "https://script.google.com/macros/s/AKfycbybAACwBMZeiOERkFpZruMwgVWpmB45ddToZMScbGOPOJY2DRS0cfdBLJtHgaDnxxDzjw/exec",
  SESSION_KEY: "cakgup_microsite_admin_session",
  API_TOKEN_SESSION_KEY: "cakgup_microsite_api_token",
  FETCH_TIMEOUT_MS: 12000,
  PUBLIC_FALLBACK_ENABLED: true,
  DEFAULT_PROFILE: {
    id: "demo-yimg",
    username: "yimg",
    microsite_url: "https://cakgup.github.io/u/yimg",
    display_name: "Yayasan Indonesia Maju Gemilang",
    tagline: "Bergerak Bersama untuk Ummat dan Kebaikan",
    bio: "Microsite resmi Yayasan Indonesia Maju Gemilang sebagai gerbang informasi, program, layanan, dan tautan penting yayasan.",
    logo_url: "/u/assets/img/logo-yimg.png",
    avatar_url: "/u/assets/img/logo-yimg.png",
    banner_url: "",
    theme: "islami-yimg",
    background_color: "#FFF7ED",
    text_color: "#2D1B12",
    primary_color: "#C44A00",
    secondary_color: "#D40000",
    accent_color: "#4B006E",
    button_style: "rounded",
    islamic_script: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى",
    show_islamic_script: true,
    audio_url: "/u/assets/audio/nasyid.mp3",
    audio_title: "Nasyid Islami",
    audio_enabled: true,
    audio_loop: true,
    audio_volume: 0.38,
    audio_autoplay: true,
    snow_enabled: true
  },
  DEFAULT_LINKS: [
    { id: "demo-1", title: "Tentang Yayasan", url: "https://example.com", icon: "info", button_color: "#C44A00", text_color: "#FFFFFF", sort_order: 1 },
    { id: "demo-2", title: "Program Kami", url: "https://example.com", icon: "star", button_color: "#D40000", text_color: "#FFFFFF", sort_order: 2 },
    { id: "demo-3", title: "Donasi", url: "https://example.com", icon: "heart", button_color: "#4B006E", text_color: "#FFFFFF", sort_order: 3 },
    { id: "demo-4", title: "WhatsApp Admin", url: "https://wa.me/6280000000000", icon: "whatsapp", button_color: "#25D366", text_color: "#FFFFFF", sort_order: 4 },
    { id: "demo-5", title: "Lokasi Yayasan", url: "https://maps.google.com", icon: "location", button_color: "#FF6900", text_color: "#FFFFFF", sort_order: 5 }
  ]
};
