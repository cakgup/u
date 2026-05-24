/*******************************************************
 * CAKGUP MICROSITE - GOOGLE APPS SCRIPT API
 * Untuk GitHub Pages: https://cakgup.github.io/u
 *
 * Pola API mengikuti proyek Cakgup Shortlink:
 * - doGet  : ping, ambil microsite publik, list publik, statistik admin opsional
 * - doPost : login admin, simpan profil, simpan link, hapus/nonaktif, reorder, log klik
 *
 * Catatan keamanan:
 * - Disarankan menyimpan token admin di Script Properties:
 *   CAKGUP_MICROSITE_API_TOKEN = token_rahasia_anda
 * - Jika property belum diisi, fallback sementara memakai CONFIG.API_TOKEN.
 *******************************************************/

/**
 * =========================
 * KONFIGURASI UTAMA
 * =========================
 */
const CONFIG = {
  // Jika Apps Script dibuat dari Google Sheet, boleh dikosongkan.
  // Jika Apps Script standalone, script akan otomatis membuat spreadsheet baru.
  SPREADSHEET_ID: "",

  SHEET_MICROSITES: "microsites",
  SHEET_LINKS: "microsite_links",
  SHEET_LOGS: "microsite_click_logs",

  BASE_MICROSITE_URL: "https://cakgup.github.io/u",
  DEFAULT_USERNAME: "yimg",

  // Fallback sementara. Lebih aman gunakan Script Properties.
  API_TOKEN: "cakgup"
};

const SCRIPT_PROPERTY_SPREADSHEET_ID = "CAKGUP_MICROSITE_SPREADSHEET_ID";
const SCRIPT_PROPERTY_API_TOKEN = "CAKGUP_MICROSITE_API_TOKEN";

/**
 * =========================
 * STRUKTUR KOLOM SHEET
 * =========================
 */
const MICROSITE_HEADERS = [
  "id",
  "username",
  "display_name",
  "tagline",
  "bio",
  "logo_url",
  "avatar_url",
  "banner_url",
  "theme",
  "background_color",
  "text_color",
  "primary_color",
  "secondary_color",
  "accent_color",
  "button_style",
  "islamic_script",
  "show_islamic_script",
  "audio_url",
  "audio_title",
  "audio_enabled",
  "audio_loop",
  "audio_volume",
  "is_active",
  "created_at",
  "updated_at",
  "created_by"
];

const LINK_HEADERS = [
  "id",
  "microsite_id",
  "username",
  "title",
  "url",
  "icon",
  "button_color",
  "text_color",
  "sort_order",
  "is_active",
  "created_at",
  "updated_at"
];

const LOG_HEADERS = [
  "id",
  "microsite_id",
  "username",
  "link_id",
  "title",
  "target_url",
  "clicked_at",
  "user_agent",
  "referrer",
  "result"
];

/**
 * =========================
 * doGet
 * =========================
 *
 * Contoh:
 * ?action=ping
 * ?action=getMicrosite&username=yimg
 * ?action=listPublicMicrosites
 * ?action=getMicrositeStats&username=yimg&token=TOKEN
 */
function doGet(e) {
  try {
    setupSheets();

    const params = e && e.parameter ? e.parameter : {};
    const action = String(params.action || "getMicrosite").toLowerCase().trim();

    if (action === "ping") {
      return jsonOutput({
        success: true,
        message: "Cakgup Microsite API aktif",
        base_url: CONFIG.BASE_MICROSITE_URL,
        spreadsheet_id: getSpreadsheet().getId(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === "list" || action === "listpublic" || action === "listpublicmicrosites") {
      return jsonOutput(listPublicMicrosites());
    }

    if (action === "getmicrositestats" || action === "stats") {
      if (!isValidToken(params)) {
        return jsonOutput({ success: false, message: "Token tidak valid" });
      }
      return jsonOutput(getMicrositeStats(params));
    }

    if (action === "getmicrosite" || action === "profile" || action === "public") {
      const username = sanitizeUsername(params.username || params.slug || CONFIG.DEFAULT_USERNAME);
      return jsonOutput(getMicrosite(username));
    }

    return jsonOutput({
      success: false,
      message: "Action tidak dikenali pada doGet"
    });

  } catch (error) {
    return jsonOutput({
      success: false,
      message: "Terjadi kesalahan pada doGet",
      error: getErrorMessage(error)
    });
  }
}

/**
 * =========================
 * doPost
 * =========================
 *
 * Action publik tanpa token:
 * - logMicrositeClick
 *
 * Action admin dengan token:
 * - loginAdmin
 * - getAllMicrosites
 * - saveMicrosite
 * - deleteMicrosite / disableMicrosite
 * - saveMicrositeLink
 * - deleteMicrositeLink / disableMicrositeLink
 * - reorderMicrositeLinks
 * - getMicrositeStats
 */
function doPost(e) {
  try {
    setupSheets();

    const body = parsePostBody(e);
    const action = String(body.action || "").toLowerCase().trim();

    if (action === "logmicrositeclick" || action === "logclick") {
      return jsonOutput(logMicrositeClick(body, e));
    }

    if (action === "loginadmin" || action === "login") {
      return jsonOutput({
        success: isValidToken(body),
        message: isValidToken(body) ? "Login berhasil" : "Token tidak valid"
      });
    }

    if (!isValidToken(body)) {
      return jsonOutput({
        success: false,
        message: "Token tidak valid"
      });
    }

    if (action === "getallmicrosites" || action === "listadmin") {
      return jsonOutput(getAllMicrositesForAdmin());
    }

    if (action === "savemicrosite" || action === "upsertmicrosite") {
      return jsonOutput(saveMicrosite(body));
    }

    if (action === "deletemicrosite" || action === "disablemicrosite") {
      return jsonOutput(disableMicrosite(body));
    }

    if (action === "savemicrositelink" || action === "savelink") {
      return jsonOutput(saveMicrositeLink(body));
    }

    if (action === "deletemicrositelink" || action === "disablemicrositelink" || action === "deletelink") {
      return jsonOutput(disableMicrositeLink(body));
    }

    if (action === "reordermicrositelinks" || action === "reorderlinks") {
      return jsonOutput(reorderMicrositeLinks(body));
    }

    if (action === "getmicrositestats" || action === "stats") {
      return jsonOutput(getMicrositeStats(body));
    }

    return jsonOutput({
      success: false,
      message: "Action tidak dikenali pada doPost"
    });

  } catch (error) {
    return jsonOutput({
      success: false,
      message: "Terjadi kesalahan pada doPost",
      error: getErrorMessage(error)
    });
  }
}

/**
 * =========================
 * PUBLIC MICROSITE
 * =========================
 */
function getMicrosite(username) {
  username = sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);

  if (!username) {
    return {
      success: false,
      message: "username wajib diisi"
    };
  }

  const found = findMicrositeByUsername(username);

  if (!found) {
    return {
      success: false,
      message: "Microsite tidak ditemukan",
      username: username
    };
  }

  const site = found.data;

  if (!normalizeBoolean(site.is_active, true)) {
    return {
      success: false,
      message: "Microsite tidak aktif",
      username: username
    };
  }

  const links = getLinksByMicrositeId(site.id)
    .filter(function(link) {
      return normalizeBoolean(link.is_active, true) === true;
    })
    .sort(function(a, b) {
      return Number(a.sort_order || 0) - Number(b.sort_order || 0);
    })
    .map(function(link) {
      return {
        id: link.id,
        title: link.title,
        url: link.url,
        icon: link.icon,
        button_color: link.button_color,
        text_color: link.text_color,
        sort_order: Number(link.sort_order || 0)
      };
    });

  return {
    success: true,
    microsite: buildMicrositePublicObject(site),
    links: links
  };
}

function buildMicrositePublicObject(site) {
  const username = sanitizeUsername(site.username || CONFIG.DEFAULT_USERNAME);

  return {
    id: site.id,
    username: username,
    microsite_url: buildMicrositeUrl(username),
    display_name: site.display_name,
    tagline: site.tagline,
    bio: site.bio,
    logo_url: site.logo_url,
    avatar_url: site.avatar_url,
    banner_url: site.banner_url,
    theme: site.theme,
    background_color: site.background_color,
    text_color: site.text_color,
    primary_color: site.primary_color,
    secondary_color: site.secondary_color,
    accent_color: site.accent_color,
    button_style: site.button_style,
    islamic_script: site.islamic_script,
    show_islamic_script: normalizeBoolean(site.show_islamic_script, true),
    audio_url: site.audio_url,
    audio_title: site.audio_title,
    audio_enabled: normalizeBoolean(site.audio_enabled, true),
    audio_loop: normalizeBoolean(site.audio_loop, true),
    audio_volume: normalizeNumber(site.audio_volume, 0.45)
  };
}

function listPublicMicrosites() {
  const data = getAllMicrositeObjects()
    .filter(function(site) {
      return normalizeBoolean(site.is_active, true) === true;
    })
    .map(function(site) {
      const username = sanitizeUsername(site.username);
      return {
        id: site.id,
        username: username,
        display_name: site.display_name,
        tagline: site.tagline,
        microsite_url: buildMicrositeUrl(username)
      };
    });

  return {
    success: true,
    total: data.length,
    data: data
  };
}

/**
 * =========================
 * ADMIN - MICROSITE PROFILE
 * =========================
 */
function saveMicrosite(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getMicrositesSheet();
    const now = new Date();
    const username = sanitizeUsername(body.username || body.slug || CONFIG.DEFAULT_USERNAME);

    if (!username) {
      return { success: false, message: "username wajib diisi" };
    }

    if (!isValidUsername(username)) {
      return {
        success: false,
        message: "username hanya boleh berisi huruf kecil, angka, dan tanda hubung"
      };
    }

    const idFromBody = String(body.id || "").trim();
    const existingById = idFromBody ? findMicrositeById(idFromBody) : null;
    const existingByUsername = findMicrositeByUsername(username);

    // Update diperbolehkan dengan id maupun username.
    // Jika id tidak dikirim tetapi username sudah ada, data dianggap sebagai update profil existing.
    const existingRecord = existingById || existingByUsername || null;

    if (existingById && existingByUsername && existingByUsername.data.id !== existingById.data.id) {
      return { success: false, message: "username sudah digunakan oleh microsite lain" };
    }

    const current = existingRecord ? existingRecord.data : null;
    const id = current ? current.id : generateId("MS");

    const row = [
      id,
      username,
      getValue(body.display_name, current && current.display_name, "Yayasan Indonesia Maju Gemilang"),
      getValue(body.tagline, current && current.tagline, "Bergerak Bersama untuk Ummat dan Kebaikan"),
      getValue(body.bio, current && current.bio, "Microsite resmi Yayasan Indonesia Maju Gemilang."),
      normalizeAssetUrl(getValue(body.logo_url, current && current.logo_url, "/u/assets/img/logo-yimg.png")),
      normalizeAssetUrl(getValue(body.avatar_url, current && current.avatar_url, "/u/assets/img/logo-yimg.png")),
      normalizeAssetUrl(getValue(body.banner_url, current && current.banner_url, "")),
      getValue(body.theme, current && current.theme, "islami-yimg"),
      getValue(body.background_color, current && current.background_color, "#FFF7ED"),
      getValue(body.text_color, current && current.text_color, "#2D1B12"),
      getValue(body.primary_color, current && current.primary_color, "#C44A00"),
      getValue(body.secondary_color, current && current.secondary_color, "#D40000"),
      getValue(body.accent_color, current && current.accent_color, "#4B006E"),
      getValue(body.button_style, current && current.button_style, "rounded"),
      getValue(body.islamic_script, current && current.islamic_script, "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ"),
      normalizeBoolean(getValue(body.show_islamic_script, current && current.show_islamic_script, true), true),
      normalizeAssetUrl(getValue(body.audio_url, current && current.audio_url, "/u/assets/audio/nasyid.mp3")),
      getValue(body.audio_title, current && current.audio_title, "Nasyid Islami"),
      normalizeBoolean(getValue(body.audio_enabled, current && current.audio_enabled, true), true),
      normalizeBoolean(getValue(body.audio_loop, current && current.audio_loop, true), true),
      normalizeNumber(getValue(body.audio_volume, current && current.audio_volume, 0.45), 0.45),
      normalizeBoolean(getValue(body.is_active, current && current.is_active, true), true),
      current ? current.created_at : now,
      now,
      String(getValue(body.created_by, current && current.created_by, "admin")).trim()
    ];

    if (current) {
      sheet.getRange(existingRecord.rowNumber, 1, 1, MICROSITE_HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return {
      success: true,
      message: current ? "Microsite berhasil diperbarui" : "Microsite berhasil dibuat",
      id: id,
      username: username,
      microsite_url: buildMicrositeUrl(username)
    };

  } finally {
    lock.releaseLock();
  }
}

function disableMicrosite(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const found = body.id ? findMicrositeById(String(body.id).trim()) : findMicrositeByUsername(sanitizeUsername(body.username || body.slug || ""));

    if (!found) {
      return { success: false, message: "Microsite tidak ditemukan" };
    }

    const sheet = getMicrositesSheet();
    const activeCol = MICROSITE_HEADERS.indexOf("is_active") + 1;
    const updatedAtCol = MICROSITE_HEADERS.indexOf("updated_at") + 1;

    sheet.getRange(found.rowNumber, activeCol).setValue(false);
    sheet.getRange(found.rowNumber, updatedAtCol).setValue(new Date());

    return {
      success: true,
      message: "Microsite berhasil dinonaktifkan",
      id: found.data.id,
      username: found.data.username
    };

  } finally {
    lock.releaseLock();
  }
}

function getAllMicrositesForAdmin() {
  const data = getAllMicrositeObjects().map(function(site) {
    const username = sanitizeUsername(site.username);
    return {
      id: site.id,
      username: username,
      display_name: site.display_name,
      tagline: site.tagline,
      is_active: normalizeBoolean(site.is_active, true),
      microsite_url: buildMicrositeUrl(username),
      updated_at: site.updated_at
    };
  });

  return {
    success: true,
    total: data.length,
    data: data
  };
}

/**
 * =========================
 * ADMIN - MICROSITE LINKS
 * =========================
 */
function saveMicrositeLink(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getLinksSheet();
    const now = new Date();

    const linkId = String(body.id || body.link_id || "").trim();
    const existing = linkId ? findLinkById(linkId) : null;
    const current = existing ? existing.data : null;

    const microsite = resolveMicrositeFromBody(body, current);
    if (!microsite) {
      return { success: false, message: "microsite_id atau username tidak ditemukan" };
    }

    const title = String(getValue(body.title, current && current.title, "")).trim();
    const targetUrl = normalizeAssetUrl(getValue(body.url || body.target_url, current && current.url, ""));

    if (!title) {
      return { success: false, message: "title link wajib diisi" };
    }

    if (!targetUrl) {
      return { success: false, message: "url link wajib diisi" };
    }

    if (!isValidUrlOrRelativeAsset(targetUrl)) {
      return {
        success: false,
        message: "url tidak valid. Gunakan URL http/https atau path aset seperti /u/assets/..."
      };
    }

    const id = current ? current.id : generateId("LK");
    const sortOrder = normalizeInteger(getValue(body.sort_order, current && current.sort_order, getNextSortOrder(microsite.id)), 1);

    const row = [
      id,
      microsite.id,
      sanitizeUsername(microsite.username),
      title,
      targetUrl,
      String(getValue(body.icon, current && current.icon, "link")).trim(),
      String(getValue(body.button_color, current && current.button_color, microsite.primary_color || "#C44A00")).trim(),
      String(getValue(body.text_color, current && current.text_color, "#FFFFFF")).trim(),
      sortOrder,
      normalizeBoolean(getValue(body.is_active, current && current.is_active, true), true),
      current ? current.created_at : now,
      now
    ];

    if (current) {
      sheet.getRange(existing.rowNumber, 1, 1, LINK_HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return {
      success: true,
      message: current ? "Link microsite berhasil diperbarui" : "Link microsite berhasil dibuat",
      id: id,
      microsite_id: microsite.id,
      username: microsite.username
    };

  } finally {
    lock.releaseLock();
  }
}

function disableMicrositeLink(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const id = String(body.id || body.link_id || "").trim();

    if (!id) {
      return { success: false, message: "id/link_id wajib diisi" };
    }

    const found = findLinkById(id);

    if (!found) {
      return { success: false, message: "Link microsite tidak ditemukan" };
    }

    const sheet = getLinksSheet();
    const activeCol = LINK_HEADERS.indexOf("is_active") + 1;
    const updatedAtCol = LINK_HEADERS.indexOf("updated_at") + 1;

    sheet.getRange(found.rowNumber, activeCol).setValue(false);
    sheet.getRange(found.rowNumber, updatedAtCol).setValue(new Date());

    return {
      success: true,
      message: "Link microsite berhasil dinonaktifkan",
      id: id
    };

  } finally {
    lock.releaseLock();
  }
}

function reorderMicrositeLinks(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const links = Array.isArray(body.links) ? body.links : [];

    if (links.length === 0) {
      return { success: false, message: "links wajib berupa array" };
    }

    const sheet = getLinksSheet();
    const sortCol = LINK_HEADERS.indexOf("sort_order") + 1;
    const updatedAtCol = LINK_HEADERS.indexOf("updated_at") + 1;
    let updated = 0;

    links.forEach(function(item, index) {
      const id = String(item.id || item.link_id || "").trim();
      const sortOrder = normalizeInteger(item.sort_order, index + 1);
      const found = findLinkById(id);

      if (found) {
        sheet.getRange(found.rowNumber, sortCol).setValue(sortOrder);
        sheet.getRange(found.rowNumber, updatedAtCol).setValue(new Date());
        updated++;
      }
    });

    return {
      success: true,
      message: "Urutan link berhasil diperbarui",
      updated: updated
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * =========================
 * CLICK LOG & STATS
 * =========================
 */
function logMicrositeClick(body, e) {
  try {
    const sheet = getLogsSheet();

    const linkId = String(body.link_id || body.id || "").trim();
    const username = sanitizeUsername(body.username || body.slug || "");
    const foundLink = linkId ? findLinkById(linkId) : null;
    const link = foundLink ? foundLink.data : null;

    const micrositeId = String(body.microsite_id || (link && link.microsite_id) || "").trim();
    const targetUrl = normalizeAssetUrl(body.target_url || body.url || (link && link.url) || "");
    const title = String(body.title || (link && link.title) || "").trim();
    const finalUsername = username || sanitizeUsername(link && link.username) || "";
    const userAgent = String(body.user_agent || body.ua || getParam(e, "ua") || "").trim();
    const referrer = String(body.referrer || body.ref || getParam(e, "referrer") || "").trim();
    const result = String(body.result || "success").trim();

    sheet.appendRow([
      generateId("LG"),
      micrositeId,
      finalUsername,
      linkId,
      title,
      targetUrl,
      new Date(),
      userAgent,
      referrer,
      result
    ]);

    return {
      success: true,
      message: "Klik berhasil dicatat"
    };

  } catch (error) {
    // Log tidak boleh mengganggu proses buka link di frontend.
    return {
      success: false,
      message: "Klik tidak berhasil dicatat, tetapi proses dapat tetap dilanjutkan",
      error: getErrorMessage(error)
    };
  }
}

function getMicrositeStats(body) {
  const microsite = resolveMicrositeFromBody(body, null);

  if (!microsite) {
    return { success: false, message: "microsite_id atau username tidak ditemukan" };
  }

  const logs = getAllLogObjects().filter(function(log) {
    return String(log.microsite_id) === String(microsite.id) || sanitizeUsername(log.username) === sanitizeUsername(microsite.username);
  });

  const links = getLinksByMicrositeId(microsite.id);
  const byLink = {};

  links.forEach(function(link) {
    byLink[link.id] = {
      link_id: link.id,
      title: link.title,
      target_url: link.url,
      total_clicks: 0,
      last_clicked_at: ""
    };
  });

  logs.forEach(function(log) {
    const id = String(log.link_id || "").trim();

    if (!byLink[id]) {
      byLink[id] = {
        link_id: id,
        title: log.title,
        target_url: log.target_url,
        total_clicks: 0,
        last_clicked_at: ""
      };
    }

    byLink[id].total_clicks += 1;
    byLink[id].last_clicked_at = log.clicked_at;
  });

  const linkStats = Object.keys(byLink)
    .map(function(key) { return byLink[key]; })
    .sort(function(a, b) { return b.total_clicks - a.total_clicks; });

  return {
    success: true,
    microsite_id: microsite.id,
    username: microsite.username,
    total_clicks: logs.length,
    links: linkStats
  };
}

/**
 * =========================
 * SHEET SETUP
 * =========================
 */
function setupSheets() {
  const ss = getSpreadsheet();

  if (!ss) {
    throw new Error("Spreadsheet tidak ditemukan. Isi CONFIG.SPREADSHEET_ID atau jalankan script dari Google Sheets.");
  }

  let micrositesSheet = ss.getSheetByName(CONFIG.SHEET_MICROSITES);
  if (!micrositesSheet) {
    micrositesSheet = ss.insertSheet(CONFIG.SHEET_MICROSITES);
  }
  ensureHeaders(micrositesSheet, MICROSITE_HEADERS);

  let linksSheet = ss.getSheetByName(CONFIG.SHEET_LINKS);
  if (!linksSheet) {
    linksSheet = ss.insertSheet(CONFIG.SHEET_LINKS);
  }
  ensureHeaders(linksSheet, LINK_HEADERS);

  let logsSheet = ss.getSheetByName(CONFIG.SHEET_LOGS);
  if (!logsSheet) {
    logsSheet = ss.insertSheet(CONFIG.SHEET_LOGS);
  }
  ensureHeaders(logsSheet, LOG_HEADERS);

  micrositesSheet.setFrozenRows(1);
  linksSheet.setFrozenRows(1);
  logsSheet.setFrozenRows(1);
}

function ensureHeaders(sheet, headers) {
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const currentHeaders = firstRow.map(function(cell) {
    return String(cell || "").trim();
  });

  const isEmpty = currentHeaders.every(function(cell) {
    return cell === "";
  });

  const different = headers.some(function(header, index) {
    return currentHeaders[index] !== header;
  });

  if (isEmpty || different) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
}

/**
 * =========================
 * HELPER SPREADSHEET
 * =========================
 */
function getSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && String(CONFIG.SPREADSHEET_ID).trim() !== "") {
    return SpreadsheetApp.openById(String(CONFIG.SPREADSHEET_ID).trim());
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    return active;
  }

  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty(SCRIPT_PROPERTY_SPREADSHEET_ID);

  if (savedId) {
    return SpreadsheetApp.openById(savedId);
  }

  const created = SpreadsheetApp.create("Cakgup Microsite Database");
  props.setProperty(SCRIPT_PROPERTY_SPREADSHEET_ID, created.getId());

  return created;
}

function getMicrositesSheet() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_MICROSITES);
  if (!sheet) throw new Error("Sheet microsites tidak ditemukan. Jalankan testSetup terlebih dahulu.");
  return sheet;
}

function getLinksSheet() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_LINKS);
  if (!sheet) throw new Error("Sheet microsite_links tidak ditemukan. Jalankan testSetup terlebih dahulu.");
  return sheet;
}

function getLogsSheet() {
  const sheet = getSpreadsheet().getSheetByName(CONFIG.SHEET_LOGS);
  if (!sheet) throw new Error("Sheet microsite_click_logs tidak ditemukan. Jalankan testSetup terlebih dahulu.");
  return sheet;
}

function getAllMicrositeObjects() {
  return getAllObjects(getMicrositesSheet(), MICROSITE_HEADERS);
}

function getAllLinkObjects() {
  return getAllObjects(getLinksSheet(), LINK_HEADERS);
}

function getAllLogObjects() {
  return getAllObjects(getLogsSheet(), LOG_HEADERS);
}

function getAllObjects(sheet, headers) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  return values.map(function(row) {
    return rowToObject(row, headers);
  });
}

function rowToObject(row, headers) {
  const obj = {};

  headers.forEach(function(header, index) {
    obj[header] = row[index];
  });

  return obj;
}

function findMicrositeByUsername(username) {
  username = sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);
  return findRowByColumn(getMicrositesSheet(), MICROSITE_HEADERS, "username", username, true);
}

function findMicrositeById(id) {
  return findRowByColumn(getMicrositesSheet(), MICROSITE_HEADERS, "id", String(id || "").trim(), false);
}

function findLinkById(id) {
  return findRowByColumn(getLinksSheet(), LINK_HEADERS, "id", String(id || "").trim(), false);
}

function findRowByColumn(sheet, headers, columnName, value, caseInsensitive) {
  const lastRow = sheet.getLastRow();
  const colIndex = headers.indexOf(columnName);

  if (lastRow < 2 || colIndex === -1) {
    return null;
  }

  const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  const needle = caseInsensitive ? String(value || "").toLowerCase() : String(value || "");

  for (let i = 0; i < values.length; i++) {
    const obj = rowToObject(values[i], headers);
    const hay = caseInsensitive ? String(obj[columnName] || "").toLowerCase() : String(obj[columnName] || "");

    if (hay === needle) {
      return {
        rowNumber: i + 2,
        data: obj
      };
    }
  }

  return null;
}

function getLinksByMicrositeId(micrositeId) {
  return getAllLinkObjects().filter(function(link) {
    return String(link.microsite_id) === String(micrositeId);
  });
}

function getNextSortOrder(micrositeId) {
  const links = getLinksByMicrositeId(micrositeId);

  if (links.length === 0) return 1;

  const max = links.reduce(function(currentMax, link) {
    return Math.max(currentMax, Number(link.sort_order || 0));
  }, 0);

  return max + 1;
}

function resolveMicrositeFromBody(body, currentLink) {
  if (body.microsite_id) {
    const found = findMicrositeById(String(body.microsite_id).trim());
    return found ? found.data : null;
  }

  if (body.username || body.slug) {
    const found = findMicrositeByUsername(sanitizeUsername(body.username || body.slug));
    return found ? found.data : null;
  }

  if (currentLink && currentLink.microsite_id) {
    const found = findMicrositeById(String(currentLink.microsite_id).trim());
    return found ? found.data : null;
  }

  const defaultFound = findMicrositeByUsername(CONFIG.DEFAULT_USERNAME);
  return defaultFound ? defaultFound.data : null;
}

/**
 * =========================
 * HELPER VALIDASI & FORMAT
 * =========================
 */
function parsePostBody(e) {
  if (!e) return {};

  if (e.postData && e.postData.contents) {
    const raw = e.postData.contents;

    try {
      return JSON.parse(raw);
    } catch (error) {
      // fallback ke parameter jika body bukan JSON valid
    }
  }

  return e.parameter || {};
}

function isValidToken(body) {
  const props = PropertiesService.getScriptProperties();
  const savedToken = props.getProperty(SCRIPT_PROPERTY_API_TOKEN);
  const expectedToken = String(savedToken || CONFIG.API_TOKEN || "").trim();

  const token = body.token || body.api_key || body.apiKey || body.apiToken || body.api_token || "";

  return expectedToken !== "" && String(token || "").trim() === expectedToken;
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

function isValidUsername(value) {
  return /^[a-z0-9-]+$/.test(String(value || ""));
}

function normalizeAssetUrl(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function isValidUrlOrRelativeAsset(value) {
  const text = normalizeAssetUrl(value);

  if (!text) return false;

  // Terima aset lokal GitHub Pages, contoh: /u/assets/audio/nasyid.mp3
  if (/^\/u\/assets\//i.test(text) || /^assets\//i.test(text)) {
    return !/[<>\"]/g.test(text);
  }

  return isValidUrl(text);
}

function isValidUrl(value) {
  const text = normalizeAssetUrl(value);

  if (!/^https?:\/\//i.test(text)) return false;
  if (/[\s<>\"]/g.test(text)) return false;

  const afterProtocol = text.replace(/^https?:\/\//i, "");
  const host = afterProtocol.split("/")[0];

  if (!host) return false;
  if (host.indexOf(".") === -1 && host.toLowerCase() !== "localhost") return false;

  return true;
}

function normalizeBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  if (typeof value === "boolean") return value;

  const text = String(value).toLowerCase().trim();

  if (["true", "1", "yes", "ya", "y", "aktif", "on"].indexOf(text) !== -1) return true;
  if (["false", "0", "no", "tidak", "n", "nonaktif", "off"].indexOf(text) !== -1) return false;

  return defaultValue;
}

function normalizeNumber(value, defaultValue) {
  const number = Number(value);
  if (isNaN(number)) return defaultValue;
  return number;
}

function normalizeInteger(value, defaultValue) {
  const number = parseInt(value, 10);
  if (isNaN(number)) return defaultValue;
  return number;
}

function getValue(value, currentValue, defaultValue) {
  if (value !== undefined && value !== null) return value;
  if (currentValue !== undefined && currentValue !== null && currentValue !== "") return currentValue;
  return defaultValue;
}

function generateId(prefix) {
  return String(prefix || "ID") + "-" + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function buildMicrositeUrl(username) {
  return CONFIG.BASE_MICROSITE_URL.replace(/\/$/, "") + "/" + sanitizeUsername(username || CONFIG.DEFAULT_USERNAME);
}

function getParam(e, key) {
  if (e && e.parameter && e.parameter[key] !== undefined) return e.parameter[key];
  return "";
}

function getErrorMessage(error) {
  if (!error) return "Unknown error";
  if (error.stack) return String(error.stack);
  if (error.message) return String(error.message);
  return String(error);
}

/**
 * =========================
 * OUTPUT JSON
 * =========================
 */
function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =========================
 * TEST MANUAL
 * =========================
 */
function testSetup() {
  setupSheets();

  return {
    success: true,
    message: "Sheet microsites, microsite_links, dan microsite_click_logs berhasil disiapkan",
    spreadsheet_id: getSpreadsheet().getId(),
    spreadsheet_url: getSpreadsheet().getUrl()
  };
}

function testCreateDefaultMicrosite() {
  setupSheets();

  const result = saveMicrosite({
    token: getActiveTokenForTest(),
    action: "saveMicrosite",
    username: CONFIG.DEFAULT_USERNAME,
    display_name: "Yayasan Indonesia Maju Gemilang",
    tagline: "Bergerak Bersama untuk Ummat dan Kebaikan",
    bio: "Microsite resmi Yayasan Indonesia Maju Gemilang sebagai gerbang informasi, program, dan layanan yayasan.",
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
    is_active: true,
    created_by: "admin"
  });

  Logger.log(JSON.stringify(result));
  return result;
}

function testCreateDefaultLinks() {
  setupSheets();

  const links = [
    { title: "Tentang Yayasan", url: "https://example.com", icon: "info", button_color: "#C44A00", sort_order: 1 },
    { title: "Program Kami", url: "https://example.com", icon: "star", button_color: "#D40000", sort_order: 2 },
    { title: "Donasi", url: "https://example.com", icon: "heart", button_color: "#4B006E", sort_order: 3 },
    { title: "WhatsApp Admin", url: "https://wa.me/6280000000000", icon: "whatsapp", button_color: "#25D366", sort_order: 4 }
  ];

  const results = links.map(function(item) {
    item.token = getActiveTokenForTest();
    item.action = "saveMicrositeLink";
    item.username = CONFIG.DEFAULT_USERNAME;
    return saveMicrositeLink(item);
  });

  Logger.log(JSON.stringify(results));
  return results;
}

function testGetDefaultMicrosite() {
  setupSheets();

  const result = getMicrosite(CONFIG.DEFAULT_USERNAME);
  Logger.log(JSON.stringify(result));
  return result;
}

function getActiveTokenForTest() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty(SCRIPT_PROPERTY_API_TOKEN) || CONFIG.API_TOKEN;
}
