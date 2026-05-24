(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const API_BASE_URL = config.API_BASE_URL || "";
  const FETCH_TIMEOUT_MS = Number(config.FETCH_TIMEOUT_MS || 12000);

  function isConfigured() {
    return API_BASE_URL && !API_BASE_URL.includes("PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE");
  }

  function buildApiUrl(params = {}) {
    if (!isConfigured()) throw new Error("API_BASE_URL belum dikonfigurasi.");
    const url = new URL(API_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });
    return url.toString();
  }

  function withTimeout(promiseFactory) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    return promiseFactory(controller.signal).finally(() => clearTimeout(timer));
  }

  async function parseJsonResponse(response) {
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch (error) { throw new Error("Response API bukan JSON valid."); }
    if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`);
    return data;
  }

  async function get(params = {}) {
    const url = buildApiUrl(params);
    const response = await withTimeout((signal) => fetch(url, { method: "GET", signal }));
    return parseJsonResponse(response);
  }

  async function post(payload = {}) {
    if (!isConfigured()) throw new Error("API_BASE_URL belum dikonfigurasi.");
    const response = await withTimeout((signal) => fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal
    }));
    return parseJsonResponse(response);
  }

  window.CakgupApi = { isConfigured, buildApiUrl, get, post };
})();
