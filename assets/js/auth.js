(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const SESSION_KEY = config.SESSION_KEY || "cakgup_yimg_admin_session";
  const TOKEN_KEY = config.API_TOKEN_SESSION_KEY || "cakgup_yimg_api_token";

  function getToken() { return sessionStorage.getItem(TOKEN_KEY) || ""; }
  function isLoggedIn() { return sessionStorage.getItem(SESSION_KEY) === "1" && Boolean(getToken()); }

  async function login(token) {
    const clean = String(token || "").trim();
    if (!clean) throw new Error("Token wajib diisi.");
    const data = await window.CakgupApi.post({ action: "loginAdmin", token: clean });
    if (!data.success) throw new Error(data.message || "Token tidak valid.");
    sessionStorage.setItem(SESSION_KEY, "1");
    sessionStorage.setItem(TOKEN_KEY, clean);
    return data;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  window.CakgupAuth = { getToken, isLoggedIn, login, logout };
})();
