/*******************************************************
 * CAKGUP MICROSITE - SIMPLE GOOGLE APPS SCRIPT API
 * Fokus: ambil link publik, rekam/tambah link, ubah link,
 * dan hapus link. Tidak ada log klik dan tidak ada update profil.
 *******************************************************/

const CONFIG = {
  SPREADSHEET_ID: "",
  SHEET_LINKS: "microsite_links",
  BASE_MICROSITE_URL: "https://cakgup.github.io/u",
  DEFAULT_USERNAME: "yimg",
  API_TOKEN: "cakgup"
};

const PROP_SPREADSHEET_ID = "CAKGUP_MICROSITE_SPREADSHEET_ID";
const PROP_API_TOKEN = "CAKGUP_MICROSITE_API_TOKEN";

const LINK_HEADERS = [
  "id",
  "username",
  "title",
  "subtitle",
  "url",
  "icon",
  "button_color",
  "text_color",
  "sort_order",
  "is_active",
  "created_at",
  "updated_at"
];

function doGet(e) {
  try {
    setupSheet();
    const params = e && e.parameter ? e.parameter : {};
    const action = String(params.action || "getMicrosite").toLowerCase().trim();

    if (action === "ping") {
      return jsonOutput({
        success: true,
        message: "CakGup Microsite API aktif",
        spreadsheet_id: getSpreadsheet().getId(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "getlinks" || action === "links") {
      const username = sanitizeUsername(params.username || CONFIG.DEFAULT_USERNAME);
      return jsonOutput({ success: true, username: username, links: getLinks(username, false) });
    }

    if (action === "getmicrosite" || action === "public" || action === "profile") {
      const username = sanitizeUsername(params.username || CONFIG.DEFAULT_USERNAME);
      return jsonOutput({
        success: true,
        microsite: getStaticProfile(username),
        links: getLinks(username, false)
      });
    }

    return jsonOutput({ success: false, message: "Action doGet tidak dikenali." });
  } catch (error) {
    return jsonOutput({ success: false, message: "Terjadi kesalahan doGet.", error: getErrorMessage(error) });
  }
}

function doPost(e) {
  try {
    setupSheet();
    const body = parsePostBody(e);
    const action = String(body.action || "").toLowerCase().trim();

    if (action === "loginadmin" || action === "login") {
      const ok = isValidToken(body);
      return jsonOutput({ success: ok, message: ok ? "Login berhasil" : "Token tidak valid" });
    }

    if (!isValidToken(body)) {
      return jsonOutput({ success: false, message: "Token tidak valid" });
    }

    if (action === "getmicrositelinks" || action === "getlinks" || action === "listlinks" || action === "listadmin") {
      const username = sanitizeUsername(body.username || CONFIG.DEFAULT_USERNAME);
      return jsonOutput({ success: true, username: username, links: getLinks(username, true) });
    }

    if (action === "savemicrositelink" || action === "savelink" || action === "upsertlink") {
      return jsonOutput(saveLink(body));
    }

    if (action === "deletemicrositelink" || action === "deletelink" || action === "hapuslink") {
      return jsonOutput(deleteLink(body));
    }

    return jsonOutput({ success: false, message: "Action doPost tidak dikenali." });
  } catch (error) {
    return jsonOutput({ success: false, message: "Terjadi kesalahan doPost.", error: getErrorMessage(error) });
  }
}

function getStaticProfile(username) {
  username = sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);
  return {
    id: username,
    username: username,
    microsite_url: CONFIG.BASE_MICROSITE_URL + "/" + username,
    display_name: "Yayasan Indonesia Maju Gemilang",
    short_name: "Indonesia Maju Gemilang",
    tagline: "Bersama, Kita Bisa Mewujudkan Kebaikan",
    bio: "Hadir sebagai ruang kolaborasi kebaikan untuk memberdayakan umat, menebar manfaat, dan membangun masa depan yang gemilang dengan semangat kebersamaan.",
    logo_url: "/u/assets/img/logo-yimg.png",
    islamic_script: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى",
    islamic_translation: "Dan tolong-menolonglah kamu dalam kebajikan dan takwa.",
    audio_url: "/u/assets/audio/nasyid.mp3",
    audio_enabled: true,
    audio_loop: true,
    audio_volume: 0.34,
    audio_autoplay: true,
    snow_enabled: true
  };
}

function getLinks(username, includeInactive) {
  username = sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);
  const rows = readRows(getLinksSheet());
  return rows
    .filter(function (row) { return sanitizeUsername(row.username || CONFIG.DEFAULT_USERNAME) === username; })
    .filter(function (row) { return includeInactive || toBool(row.is_active, true); })
    .sort(function (a, b) { return Number(a.sort_order || 999) - Number(b.sort_order || 999); });
}

function saveLink(body) {
  const username = sanitizeUsername(body.username || CONFIG.DEFAULT_USERNAME);
  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();

  if (!username) return { success: false, message: "Username tidak valid." };
  if (!title) return { success: false, message: "Judul link wajib diisi." };
  if (!isValidUrl(url)) return { success: false, message: "URL wajib diawali http:// atau https://" };

  const sheet = getLinksSheet();
  const headers = getHeaders(sheet);
  const now = new Date().toISOString();
  const id = String(body.id || "").trim() || makeId("LNK");
  const rowIndex = findRowIndexById(sheet, id);

  const data = {
    id: id,
    username: username,
    title: title,
    subtitle: String(body.subtitle || body.description || "").trim(),
    url: url,
    icon: String(body.icon || "link").trim(),
    button_color: normalizeColor(body.button_color || "#073b31"),
    text_color: normalizeColor(body.text_color || "#FFFFFF"),
    sort_order: Number(body.sort_order || 1),
    is_active: toBool(body.is_active, true),
    created_at: rowIndex > 0 ? getCellValue(sheet, rowIndex, headers, "created_at") || now : now,
    updated_at: now
  };

  if (rowIndex > 0) {
    writeObjectToRow(sheet, rowIndex, headers, data);
    return { success: true, message: "Link berhasil diubah.", link: data };
  }

  appendObject(sheet, headers, data);
  return { success: true, message: "Link berhasil direkam.", link: data };
}

function deleteLink(body) {
  const id = String(body.id || "").trim();
  if (!id) return { success: false, message: "ID link wajib diisi." };

  const sheet = getLinksSheet();
  const rowIndex = findRowIndexById(sheet, id);
  if (rowIndex < 1) return { success: false, message: "Link tidak ditemukan." };

  sheet.deleteRow(rowIndex);
  return { success: true, message: "Link berhasil dihapus.", id: id };
}

function setupSheet() {
  ensureHeaders(getLinksSheet(), LINK_HEADERS);
}

function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID) return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty(PROP_SPREADSHEET_ID);
  if (storedId) return SpreadsheetApp.openById(storedId);

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;

  const created = SpreadsheetApp.create("CakGup Microsite - Database Link");
  props.setProperty(PROP_SPREADSHEET_ID, created.getId());
  return created;
}

function getLinksSheet() {
  const ss = getSpreadsheet();
  return ss.getSheetByName(CONFIG.SHEET_LINKS) || ss.insertSheet(CONFIG.SHEET_LINKS);
}

function ensureHeaders(sheet, requiredHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.setFrozenRows(1);
    return;
  }

  const current = getHeaders(sheet);
  const missing = requiredHeaders.filter(function (header) { return current.indexOf(header) === -1; });
  if (missing.length) {
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
    sheet.setFrozenRows(1);
  }
}

function getHeaders(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (value) { return String(value || "").trim(); });
}

function readRows(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];

  const headers = getHeaders(sheet);
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(function (row) {
    const object = {};
    headers.forEach(function (header, index) {
      if (header) object[header] = row[index];
    });
    return object;
  }).filter(function (object) { return object.id || object.title || object.url; });
}

function appendObject(sheet, headers, object) {
  const row = headers.map(function (header) { return object[header] !== undefined ? object[header] : ""; });
  sheet.appendRow(row);
}

function writeObjectToRow(sheet, rowIndex, headers, object) {
  const row = headers.map(function (header) { return object[header] !== undefined ? object[header] : getCellValue(sheet, rowIndex, headers, header); });
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
}

function findRowIndexById(sheet, id) {
  if (!id || sheet.getLastRow() < 2) return -1;
  const headers = getHeaders(sheet);
  const idCol = headers.indexOf("id") + 1;
  if (idCol < 1) return -1;

  const values = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i += 1) {
    if (String(values[i][0]) === String(id)) return i + 2;
  }
  return -1;
}

function getCellValue(sheet, rowIndex, headers, headerName) {
  const col = headers.indexOf(headerName) + 1;
  if (col < 1) return "";
  return sheet.getRange(rowIndex, col).getValue();
}

function parsePostBody(e) {
  const params = e && e.parameter ? Object.assign({}, e.parameter) : {};
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : "";
  if (!raw) return params;

  try {
    const json = JSON.parse(raw);
    return Object.assign(params, json);
  } catch (error) {
    raw.split("&").forEach(function (pair) {
      const parts = pair.split("=");
      if (parts[0]) params[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join("=") || "");
    });
    return params;
  }
}

function isValidToken(payload) {
  const token = String(payload.token || payload.api_token || "").trim();
  const stored = String(PropertiesService.getScriptProperties().getProperty(PROP_API_TOKEN) || "").trim();
  const fallback = String(CONFIG.API_TOKEN || "cakgup").trim();
  // Password admin default tetap: cakgup. Jika Script Properties diisi,
  // token tersebut juga diterima tanpa menonaktifkan password default.
  return Boolean(token) && (token === fallback || (stored && token === stored));
}

function sanitizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function isValidUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function normalizeColor(value) {
  const text = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(text) ? text : "#FFFFFF";
}

function toBool(value, defaultValue) {
  if (value === true || value === false) return value;
  const text = String(value).toLowerCase().trim();
  if (["true", "1", "yes", "ya", "aktif"].indexOf(text) >= 0) return true;
  if (["false", "0", "no", "tidak", "nonaktif"].indexOf(text) >= 0) return false;
  return defaultValue;
}

function makeId(prefix) {
  return prefix + "-" + Utilities.getUuid().slice(0, 8) + "-" + Date.now();
}

function jsonOutput(object) {
  return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON);
}

function getErrorMessage(error) {
  return error && error.message ? error.message : String(error);
}

function testSetup() {
  setupSheet();
  Logger.log("Spreadsheet: " + getSpreadsheet().getUrl());
}

function testCreateDefaultLinks() {
  setupSheet();
  const defaults = [
    { title: "Tentang Kami", subtitle: "Mengenal Yayasan Indonesia Maju Gemilang", url: "https://example.com", icon: "mosque", button_color: "#073b31", sort_order: 1 },
    { title: "Program Kebaikan", subtitle: "Program dan kegiatan untuk umat", url: "https://example.com", icon: "program", button_color: "#d76a00", sort_order: 2 },
    { title: "Donasi", subtitle: "Salurkan donasi terbaik Anda", url: "https://example.com", icon: "donate", button_color: "#b30f21", sort_order: 3 },
    { title: "Pendaftaran", subtitle: "Daftar program dan kegiatan", url: "https://example.com", icon: "form", button_color: "#5a176d", sort_order: 4 },
    { title: "WhatsApp", subtitle: "Hubungi kami via WhatsApp", url: "https://wa.me/6280000000000", icon: "whatsapp", button_color: "#0b7d3b", sort_order: 5 },
    { title: "Instagram", subtitle: "Ikuti kami di Instagram", url: "https://instagram.com", icon: "instagram", button_color: "#d23669", sort_order: 6 },
    { title: "Lokasi", subtitle: "Temukan lokasi kami", url: "https://maps.google.com", icon: "location", button_color: "#1b1b1b", sort_order: 7 }
  ];
  defaults.forEach(function (item) {
    saveLink(Object.assign({ username: CONFIG.DEFAULT_USERNAME, is_active: true, text_color: "#FFFFFF" }, item));
  });
  Logger.log("Default links berhasil dibuat.");
}
