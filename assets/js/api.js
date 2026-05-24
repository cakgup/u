(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const API_BASE_URL = config.API_BASE_URL || "";
  const FETCH_TIMEOUT_MS = Number(config.FETCH_TIMEOUT_MS || 15000);

  function isConfigured() {
    return API_BASE_URL && !API_BASE_URL.includes("PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE");
  }

  function buildApiUrl(params = {}) {
    if (!isConfigured()) {
      throw new Error("API_BASE_URL belum dikonfigurasi pada assets/js/config.js");
    }

    const url = new URL(API_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  }

  function withTimeout(promiseFactory, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    return promiseFactory(controller.signal).finally(() => clearTimeout(timeout));
  }

  async function parseJsonResponse(response) {
    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new Error("Response API bukan JSON valid. Periksa deployment Google Apps Script.");
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  }

  async function get(params = {}) {
    const url = buildApiUrl(params);
    const response = await withTimeout(
      (signal) => fetch(url, { method: "GET", signal }),
      FETCH_TIMEOUT_MS
    );
    return parseJsonResponse(response);
  }

  async function post(payload = {}) {
    if (!isConfigured()) {
      throw new Error("API_BASE_URL belum dikonfigurasi pada assets/js/config.js");
    }

    const response = await withTimeout(
      (signal) => fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal
      }),
      FETCH_TIMEOUT_MS
    );

    return parseJsonResponse(response);
  }

  function postBeacon(payload = {}) {
    if (!isConfigured() || !navigator.sendBeacon) return false;

    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "text/plain;charset=utf-8" });
      return navigator.sendBeacon(API_BASE_URL, blob);
    } catch (error) {
      return false;
    }
  }

  window.CakgupApi = {
    isConfigured,
    buildApiUrl,
    get,
    post,
    postBeacon
  };
})();
