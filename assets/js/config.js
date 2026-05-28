const CAKGUP_BASE_PATH = window.location.pathname.split("/").filter(Boolean)[0] === "u" ? "/u" : "";

window.CAKGUP_MICROSITE_CONFIG = {
  APP_NAME: "Microsite Yayasan Baghasasi",
  BASE_PATH: CAKGUP_BASE_PATH,
  DEFAULT_USERNAME: "baghasasi",
  LEGACY_USERNAMES: ["yimg"],
  API_BASE_URL: "https://script.google.com/macros/s/AKfycbybAACwBMZeiOERkFpZruMwgVWpmB45ddToZMScbGOPOJY2DRS0cfdBLJtHgaDnxxDzjw/exec",
  SESSION_KEY: "cakgup_baghasasi_admin_session",
  API_TOKEN_SESSION_KEY: "cakgup_baghasasi_api_token",
  FETCH_TIMEOUT_MS: 12000,
  PUBLIC_FALLBACK_ENABLED: true,
  DEFAULT_BUTTON_COLOR: "#1A3A6B",
  LEGACY_BUTTON_COLORS: ["#4d2b0f", "#494d0f", "#214d0f", "#4d0f2d", "#0f164d", "#073b31", "#0f4e44"],
  PRAYER_SCHEDULE: {
    enabled: true,
    title: "Waktu Shalat",
    city: "Kota Bekasi dan Sekitarnya",
    timezone: "Asia/Jakarta",
    api_base_url: "https://api.myquran.com/v2/sholat/jadwal/1301",
    cache_key: "cakgup_baghasasi_prayer_schedule"
  },
  DEFAULT_PROFILE: {
    id: "baghasasi",
    username: "baghasasi",
    microsite_url: "https://cakgup.github.io/u/baghasasi",
    display_name: "Yayasan Baghasasi",
    short_name: "Baghasasi",
    tagline: "Bersama, Kita Bisa Mewujudkan Kebaikan",
    event_title: "Kegiatan Yayasan",
    bio: "Hadir sebagai ruang kolaborasi kebaikan untuk memberdayakan umat, menebar manfaat, dan membangun masa depan yang gemilang dengan semangat kebersamaan.",
    logo_url: "assets/img/logo-baghasasi.png",
    islamic_script: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى",
    islamic_translation: "Dan tolong-menolonglah kamu dalam kebajikan dan takwa.",
    audio_url: "assets/audio/nasyid.mp3",
    audio_enabled: true,
    audio_loop: true,
    audio_volume: 0.34,
    audio_autoplay: true,
    snow_enabled: true
  },
  DEFAULT_LINKS: [
    { id: "demo-1", title: "Tentang Kami", subtitle: "Mengenal Yayasan Baghasasi", url: "https://example.com", icon: "mosque", button_color: "#1A3A6B", text_color: "#ffffff", sort_order: 1, is_active: true },
    { id: "demo-2", title: "Program Kebaikan", subtitle: "Program dan kegiatan untuk umat", url: "https://example.com", icon: "program", button_color: "#d76a00", text_color: "#ffffff", sort_order: 2, is_active: true },
    { id: "demo-3", title: "Donasi", subtitle: "Salurkan donasi terbaik Anda", url: "https://example.com", icon: "donate", button_color: "#b30f21", text_color: "#ffffff", sort_order: 3, is_active: true },
    { id: "demo-4", title: "Pendaftaran", subtitle: "Daftar program dan kegiatan", url: "https://example.com", icon: "form", button_color: "#5a176d", text_color: "#ffffff", sort_order: 4, is_active: true },
    { id: "demo-5", title: "WhatsApp", subtitle: "Hubungi kami via WhatsApp", url: "https://wa.me/6280000000000", icon: "whatsapp", button_color: "#0b7d3b", text_color: "#ffffff", sort_order: 5, is_active: true },
    { id: "demo-6", title: "Instagram", subtitle: "Ikuti kami di Instagram", url: "https://instagram.com", icon: "instagram", button_color: "#d23669", text_color: "#ffffff", sort_order: 6, is_active: true },
    { id: "demo-7", title: "Lokasi", subtitle: "Temukan lokasi kami", url: "https://maps.google.com", icon: "location", button_color: "#1b1b1b", text_color: "#ffffff", sort_order: 7, is_active: true }
  ]
};
