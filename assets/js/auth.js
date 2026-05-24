(function () {
  const config = window.CAKGUP_MICROSITE_CONFIG || {};
  const SESSION_KEY = config.SESSION_KEY || "cakgup_microsite_admin_session";
  const API_TOKEN_SESSION_KEY = config.API_TOKEN_SESSION_KEY || "cakgup_microsite_api_token";

  function getApiToken() {
    return sessionStorage.getItem(API_TOKEN_SESSION_KEY) || "";
  }

  function setApiToken(token) {
    sessionStorage.setItem(API_TOKEN_SESSION_KEY, token || "");
    sessionStorage.setItem(SESSION_KEY, "true");
  }

  async function login(token) {
    const cleanToken = String(token || "").trim();
    if (!cleanToken) throw new Error("Token wajib diisi.");

    const data = await window.CakgupApi.post({
      action: "loginAdmin",
      token: cleanToken,
      api_key: cleanToken
    });

    if (!data.success) {
      throw new Error(data.message || "Token tidak valid.");
    }

    setApiToken(cleanToken);
    return data;
  }

  function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) === "true" && Boolean(getApiToken());
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(API_TOKEN_SESSION_KEY);
  }

  window.CakgupAuth = {
    login,
    isLoggedIn,
    logout,
    getApiToken,
    setApiToken
  };
})();
