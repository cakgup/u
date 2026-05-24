/*******************************************************
 * CAKGUP MICROSITE - SIMPLE & OPTIMIZED GAS API
 * Fokus: login admin, ambil link, tambah/ubah link, hapus link.
 * Tidak ada log klik dan tidak ada update profile.
 *******************************************************/

const CONFIG = {
  SPREADSHEET_ID: "",
  SHEET_LINKS: "microsite_links",
  SHEET_META: "microsite_meta",
  BASE_MICROSITE_URL: "https://cakgup.github.io/u",
  DEFAULT_USERNAME: "yimg",
  DEFAULT_EVENT_TITLE: "Kegiatan Yayasan",
  API_TOKEN: "cakgup",
  CACHE_SECONDS: 90
};

const PROP_SPREADSHEET_ID = "CAKGUP_MICROSITE_SPREADSHEET_ID";
const PROP_API_TOKEN = "CAKGUP_MICROSITE_API_TOKEN";
const LINK_HEADERS = ["id","username","title","subtitle","url","icon","button_color","text_color","sort_order","is_active","created_at","updated_at"];
const META_HEADERS = ["username","event_title","created_at","updated_at"];

function doGet(e) {
  try {
    const params = (e && e.parameter) || {};
    const action = String(params.action || "getMicrosite").toLowerCase().trim();
    const username = sanitizeUsername(params.username || CONFIG.DEFAULT_USERNAME);

    if (action === "ping") {
      return jsonOutput({ success: true, message: "CakGup Microsite API aktif", timestamp: new Date().toISOString() });
    }

    if (action === "getlinks" || action === "links") {
      return jsonOutput({ success: true, username: username, links: getPublicLinksCached(username) });
    }

    if (action === "getmicrosite" || action === "public" || action === "profile") {
      return jsonOutput({ success: true, microsite: getStaticProfile(username), links: getPublicLinksCached(username) });
    }

    return jsonOutput({ success: false, message: "Action doGet tidak dikenali." });
  } catch (error) {
    return jsonOutput({ success: false, message: "Terjadi kesalahan doGet.", error: getErrorMessage(error) });
  }
}

function doPost(e) {
  try {
    const body = parsePostBody(e);
    const action = String(body.action || "").toLowerCase().trim();

    if (action === "loginadmin" || action === "login") {
      const ok = isValidToken(body);
      return jsonOutput({ success: ok, message: ok ? "Login berhasil" : "Token tidak valid" });
    }

    if (!isValidToken(body)) return jsonOutput({ success: false, message: "Token tidak valid" });

    if (action === "getmicrositelinks" || action === "getlinks" || action === "listlinks" || action === "listadmin") {
      const username = sanitizeUsername(body.username || CONFIG.DEFAULT_USERNAME);
      setupSheet();
      const meta = getMicrositeMeta(username);
      return jsonOutput({ success: true, username: username, links: getLinks(username, true), slugs: listSlugs(), meta: meta, event_title: meta.event_title });
    }

    if (action === "listslugs" || action === "getslugs") return jsonOutput({ success: true, slugs: listSlugs() });
    if (action === "renameslug" || action === "renameusername" || action === "updateslug") return jsonOutput(renameSlug(body));
    if (action === "savemicrositemeta" || action === "savemeta" || action === "saveeventtitle") return jsonOutput(saveMicrositeMeta(body));
    if (action === "savemicrositelink" || action === "savelink" || action === "upsertlink") return jsonOutput(saveLink(body));
    if (action === "deletemicrositelink" || action === "deletelink" || action === "hapuslink") return jsonOutput(deleteLink(body));

    return jsonOutput({ success: false, message: "Action doPost tidak dikenali." });
  } catch (error) {
    return jsonOutput({ success: false, message: "Terjadi kesalahan doPost.", error: getErrorMessage(error) });
  }
}

function getStaticProfile(username) {
  username = sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);
  const meta = getMicrositeMeta(username);
  return {
    id: username,
    username: username,
    microsite_url: CONFIG.BASE_MICROSITE_URL + "/" + username,
    display_name: "Yayasan Indonesia Maju Gemilang",
    short_name: "Indonesia Maju Gemilang",
    tagline: "Bersama, Kita Bisa Mewujudkan Kebaikan",
    event_title: meta.event_title || CONFIG.DEFAULT_EVENT_TITLE,
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

function getPublicLinksCached(username) {
  username = sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);
  const key = "links_public_" + username;
  const cache = CacheService.getScriptCache();
  const cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  setupSheet();
  const links = getLinks(username, false);
  cache.put(key, JSON.stringify(links), CONFIG.CACHE_SECONDS);
  return links;
}

function clearLinksCache(username) {
  const cache = CacheService.getScriptCache();
  if (username) cache.remove("links_public_" + sanitizeUsername(username));
  cache.remove("links_public_" + CONFIG.DEFAULT_USERNAME);
}


function listSlugs() {
  setupSheet();
  const rows = readRows(getLinksSheet());
  const metaRows = readRows(getMetaSheet(), false);
  const set = {};
  set[CONFIG.DEFAULT_USERNAME] = true;
  rows.forEach(row => {
    const slug = sanitizeUsername(row.username || CONFIG.DEFAULT_USERNAME);
    if (slug) set[slug] = true;
  });
  metaRows.forEach(row => {
    const slug = sanitizeUsername(row.username || "");
    if (slug) set[slug] = true;
  });
  return Object.keys(set).sort();
}

function renameSlug(body) {
  setupSheet();
  const oldSlug = sanitizeUsername(body.old_username || body.old_slug || body.from || CONFIG.DEFAULT_USERNAME);
  const newSlug = sanitizeUsername(body.new_username || body.new_slug || body.to || "");
  if (!oldSlug) return { success: false, message: "Slug lama tidak valid." };
  if (!newSlug) return { success: false, message: "Slug baru tidak valid." };
  if (oldSlug === newSlug) return { success: false, message: "Slug baru masih sama dengan slug lama." };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getLinksSheet();
    const headers = getHeaders(sheet);
    const usernameCol = headers.indexOf("username") + 1;
    const updatedAtCol = headers.indexOf("updated_at") + 1;
    if (usernameCol < 1 || sheet.getLastRow() < 2) return { success: true, message: "Slug baru siap digunakan.", updated: 0, old_username: oldSlug, new_username: newSlug, slugs: listSlugs() };
    const values = sheet.getRange(2, usernameCol, sheet.getLastRow() - 1, 1).getValues();
    let updated = 0;
    const now = new Date().toISOString();
    for (let i = 0; i < values.length; i++) {
      if (sanitizeUsername(values[i][0] || CONFIG.DEFAULT_USERNAME) === oldSlug) {
        const row = i + 2;
        sheet.getRange(row, usernameCol).setValue(newSlug);
        if (updatedAtCol > 0) sheet.getRange(row, updatedAtCol).setValue(now);
        updated++;
      }
    }

    const metaSheet = getMetaSheet();
    const metaHeaders = getHeaders(metaSheet);
    const metaRows = readRows(metaSheet, false);
    metaRows.forEach((row, index) => {
      if (sanitizeUsername(row.username || "") === oldSlug) {
        row.username = newSlug;
        row.updated_at = now;
        writeObjectToRow(metaSheet, index + 2, metaHeaders, row);
        updated++;
      }
    });

    clearLinksCache(oldSlug);
    clearLinksCache(newSlug);
    return { success: true, message: updated ? "Slug berhasil diubah." : "Slug baru siap digunakan.", updated: updated, old_username: oldSlug, new_username: newSlug, slugs: listSlugs() };
  } finally {
    lock.releaseLock();
  }
}

function getLinks(username, includeInactive) {
  username = sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);
  return readRows(getLinksSheet())
    .filter(row => sanitizeUsername(row.username || CONFIG.DEFAULT_USERNAME) === username)
    .filter(row => includeInactive || toBool(row.is_active, true))
    .sort((a, b) => Number(a.sort_order || 999) - Number(b.sort_order || 999));
}


function getMicrositeMeta(username) {
  setupSheet();
  username = sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);
  const rows = readRows(getMetaSheet(), false);
  const row = rows.find(item => sanitizeUsername(item.username || "") === username) || {};
  return {
    username: username,
    event_title: String(row.event_title || CONFIG.DEFAULT_EVENT_TITLE || "").trim()
  };
}

function saveMicrositeMeta(body) {
  setupSheet();
  const username = sanitizeUsername(body.username || CONFIG.DEFAULT_USERNAME);
  const eventTitle = String(body.event_title || body.activity_title || "").trim();
  const now = new Date().toISOString();
  const sheet = getMetaSheet();
  const headers = getHeaders(sheet);
  const rows = readRows(sheet, false);
  const rowIndex = rows.findIndex(row => sanitizeUsername(row.username || "") === username);
  const values = { username: username, event_title: eventTitle, created_at: now, updated_at: now };

  if (rowIndex >= 0) {
    const existing = rows[rowIndex];
    values.created_at = existing.created_at || now;
    values.updated_at = now;
    writeObjectToRow(sheet, rowIndex + 2, headers, values);
  } else {
    appendObject(sheet, headers, values);
  }

  clearLinksCache(username);
  return {
    success: true,
    message: "Judul kegiatan berhasil disimpan.",
    meta: { username: username, event_title: eventTitle },
    event_title: eventTitle
  };
}

function saveLink(body) {
  setupSheet();
  const username = sanitizeUsername(body.username || CONFIG.DEFAULT_USERNAME);
  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  if (!username) return { success: false, message: "Username tidak valid." };
  if (!title) return { success: false, message: "Judul link wajib diisi." };
  if (!isValidUrl(url)) return { success: false, message: "URL wajib diawali http:// atau https://" };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
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

    if (rowIndex > 0) writeObjectToRow(sheet, rowIndex, headers, data);
    else appendObject(sheet, headers, data);
    clearLinksCache(username);
    return { success: true, message: rowIndex > 0 ? "Link berhasil diubah." : "Link berhasil direkam.", link: data };
  } finally {
    lock.releaseLock();
  }
}

function deleteLink(body) {
  setupSheet();
  const id = String(body.id || "").trim();
  if (!id) return { success: false, message: "ID link wajib diisi." };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getLinksSheet();
    const rowIndex = findRowIndexById(sheet, id);
    if (rowIndex < 1) return { success: false, message: "Link tidak ditemukan." };
    const headers = getHeaders(sheet);
    const username = getCellValue(sheet, rowIndex, headers, "username") || CONFIG.DEFAULT_USERNAME;
    sheet.deleteRow(rowIndex);
    clearLinksCache(username);
    return { success: true, message: "Link berhasil dihapus.", id: id };
  } finally {
    lock.releaseLock();
  }
}

function setupSheet() {
  ensureHeaders(getLinksSheet(), LINK_HEADERS);
  ensureHeaders(getMetaSheet(), META_HEADERS);
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

function getMetaSheet() {
  const ss = getSpreadsheet();
  return ss.getSheetByName(CONFIG.SHEET_META) || ss.insertSheet(CONFIG.SHEET_META);
}

function ensureHeaders(sheet, requiredHeaders) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
    sheet.setFrozenRows(1);
    return;
  }
  const current = getHeaders(sheet);
  const missing = requiredHeaders.filter(header => current.indexOf(header) === -1);
  if (missing.length) {
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
    sheet.setFrozenRows(1);
  }
}

function getHeaders(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(value => String(value || "").trim());
}

function readRows(sheet, requireContent) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const headers = getHeaders(sheet);
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues().map(row => {
    const object = {};
    headers.forEach((header, index) => { if (header) object[header] = row[index]; });
    return object;
  });
  if (requireContent === false) return rows;
  return rows.filter(object => object.id || object.title || object.url);
}

function appendObject(sheet, headers, object) {
  sheet.appendRow(headers.map(header => object[header] !== undefined ? object[header] : ""));
}

function writeObjectToRow(sheet, rowIndex, headers, object) {
  const row = headers.map(header => object[header] !== undefined ? object[header] : getCellValue(sheet, rowIndex, headers, header));
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row]);
}

function findRowIndexById(sheet, id) {
  if (!id || sheet.getLastRow() < 2) return -1;
  const headers = getHeaders(sheet);
  const idCol = headers.indexOf("id") + 1;
  if (idCol < 1) return -1;
  const values = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) if (String(values[i][0] || "") === String(id)) return i + 2;
  return -1;
}

function getCellValue(sheet, rowIndex, headers, key) {
  const col = headers.indexOf(key) + 1;
  if (col < 1) return "";
  return sheet.getRange(rowIndex, col).getValue();
}

function parsePostBody(e) {
  if (!e || !e.postData) return {};
  const raw = String(e.postData.contents || "");
  const type = String(e.postData.type || "").toLowerCase();
  const trimmed = raw.trim();
  if (!trimmed) return {};

  // GitHub Pages/frontend mengirim JSON sebagai text/plain untuk menghindari preflight CORS.
  // Karena itu, body tetap harus diparse sebagai JSON meskipun Content-Type bukan application/json.
  if (type.indexOf("application/json") !== -1 || trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return {};
    }
  }

  const data = {};
  raw.split("&").forEach(pair => {
    if (!pair) return;
    const parts = pair.split("=");
    data[decodeURIComponent(parts[0] || "")] = decodeURIComponent((parts.slice(1).join("=") || "").replace(/\+/g, " "));
  });
  return data;
}

function isValidToken(body) {
  const props = PropertiesService.getScriptProperties();
  const propertyToken = String(props.getProperty(PROP_API_TOKEN) || "").trim();
  const defaultToken = String(CONFIG.API_TOKEN || "cakgup").trim();
  const provided = String((body && (body.token || body.password || body.api_token)) || "").trim();

  // Password default 'cakgup' tetap diterima agar admin sederhana tidak terkunci
  // meskipun Script Properties belum diset atau berbeda.
  return Boolean(provided) && (provided === defaultToken || (propertyToken && provided === propertyToken));
}

function sanitizeUsername(value) {
  const text = String(value || CONFIG.DEFAULT_USERNAME).trim().toLowerCase()
    .replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return text || CONFIG.DEFAULT_USERNAME;
}

function isValidUrl(value) { return /^https?:\/\//i.test(String(value || "").trim()); }
function normalizeColor(value) { const text = String(value || "").trim(); return /^#[0-9a-f]{6}$/i.test(text) ? text : "#FFFFFF"; }
function toBool(value, defaultValue) { if (value === undefined || value === null || value === "") return defaultValue; return value === true || String(value).toLowerCase() === "true" || String(value) === "1"; }
function makeId(prefix) { return prefix + "_" + Utilities.getUuid().slice(0, 8) + "_" + Date.now(); }
function getErrorMessage(error) { return error && error.message ? error.message : String(error); }
function jsonOutput(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }

function testSetup() {
  setupSheet();
  Logger.log("Spreadsheet: " + getSpreadsheet().getUrl());
}

function testCreateDefaultLinks() {
  setupSheet();
  const defaults = [
    ["Tentang Kami", "Mengenal Yayasan Indonesia Maju Gemilang", "https://github.com/cakgup", "info", "#073b31", 1],
    ["Program Kebaikan", "Program dan kegiatan untuk umat", "https://github.com/cakgup", "star", "#b45a15", 2],
    ["Donasi", "Salurkan donasi terbaik Anda", "https://github.com/cakgup", "heart", "#9f1d2d", 3],
    ["Pendaftaran", "Daftar program dan kegiatan", "https://github.com/cakgup", "document", "#5a216b", 4],
    ["WhatsApp", "Hubungi kami via WhatsApp", "https://wa.me/6280000000000", "whatsapp", "#0f6b45", 5],
    ["Instagram", "Ikuti kami di Instagram", "https://instagram.com/", "instagram", "#c13584", 6],
    ["Lokasi", "Temukan lokasi kami", "https://maps.google.com/", "location", "#161616", 7]
  ];
  defaults.forEach(item => saveLink({ username: CONFIG.DEFAULT_USERNAME, title: item[0], subtitle: item[1], url: item[2], icon: item[3], button_color: item[4], text_color: "#FFFFFF", sort_order: item[5], is_active: true }));
  Logger.log("Default links berhasil dibuat.");
}
