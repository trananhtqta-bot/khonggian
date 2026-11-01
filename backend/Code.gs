/** Dưới Gốc Thị · lưu tiến trình theo "mã nhà" (v16).
 *  Script gắn vào Google Sheet, tab "saves" với cột: hash | state | updated.
 *  Lần đầu: chạy hàm setup() một lần trong trình soạn thảo (tạo pepper bí mật trong Script Properties + trigger dọn dữ liệu cũ).
 *  Triển khai: Deploy → Web app · Execute as: Me · Who has access: Anyone.
 *  Chỉ lưu HMAC-SHA256(mã, pepper), JSON tiến trình (khoá kg_*, ≤ 20KB) và thời điểm cập nhật. Không lưu mã gốc. */
const MAX_STATE = 20000, MAX_VAL = 4096, MAX_KEYS = 60;
const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_RE = new RegExp('^THI-[' + ALPHA + ']{5}-[' + ALPHA + ']{5}$');
const KEY_RE = /^kg_[a-z0-9_-]{1,40}$/;
const PER_CODE = 30, PER_CODE_WIN = 600;   // mỗi mã: 30 yêu cầu / 10 phút
const GLOBAL_PER_MIN = 300;                // toàn hệ thống: 300 yêu cầu / phút
const NEW_ROWS_PER_HOUR = 200, MAX_ROWS = 50000;
const RETAIN_MS = 365 * 24 * 3600 * 1000;  // 12 tháng

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function hex_(bytes) { return bytes.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join(''); }
function pepper_() {
  const props = PropertiesService.getScriptProperties(); let p = props.getProperty('PEPPER');
  if (!p) { const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return null;
    try { p = props.getProperty('PEPPER'); if (!p) { p = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid(); props.setProperty('PEPPER', p); } } finally { lock.releaseLock(); } }
  return p; }
function hmac_(code, pep) { return hex_(Utilities.computeHmacSha256Signature(code, pep, Utilities.Charset.UTF_8)); }
function legacy_(code) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, code, Utilities.Charset.UTF_8)); } // bản v15 (SHA-256 không pepper)
function bump_(c, k, ttl) { const n = Number(c.get(k) || 0) + 1; c.put(k, String(n), ttl); return n; }
function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('saves'); }
function find_(sh, h) { const last = sh.getLastRow(); if (last < 2) return 0; const f = sh.getRange(2, 1, last - 1, 1).createTextFinder(h).matchEntireCell(true).findNext(); return f ? f.getRow() : 0; }
function cleanState_(st) {
  if (!st || typeof st !== 'object' || !st.ls || typeof st.ls !== 'object' || Array.isArray(st.ls)) return null;
  const keys = Object.keys(st.ls); if (keys.length > MAX_KEYS) return null; const ls = {};
  for (const k of keys) { const v = st.ls[k]; if (!KEY_RE.test(k) || typeof v !== 'string' || v.length > MAX_VAL) return null; ls[k] = v; }
  return { v: Number(st.v) || 1, updated: Number(st.updated) || 0, ls }; }

function doGet() { return out_({ ok: true, service: 'duoi-goc-thi-save', v: 2 }); }
function doPost(e) {
  try { return handle_(e); } catch (err) { return out_({ ok: false, err: 'server' }); } }
function handle_(e) {
  const cache = CacheService.getScriptCache();
  if (bump_(cache, 'rl_g_' + Math.floor(Date.now() / 60000), 120) > GLOBAL_PER_MIN) return out_({ ok: false, err: 'busy' });
  let b; try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, err: 'bad_json' }); }
  if (!b || typeof b !== 'object' || ['get', 'put', 'del'].indexOf(b.op) < 0) return out_({ ok: false, err: 'bad_op' });
  const code = String(b.code || ''); if (!CODE_RE.test(code)) return out_({ ok: false, err: 'bad_code' });
  const pep = pepper_(); if (!pep) return out_({ ok: false, err: 'busy' });
  const h = hmac_(code, pep);
  if (bump_(cache, 'rl_' + h, PER_CODE_WIN) > PER_CODE) return out_({ ok: false, err: 'rate_limited' });
  const sh = sheet_();

  if (b.op === 'get') {
    let r = find_(sh, h);
    if (!r) { const lr = find_(sh, legacy_(code)); if (lr) { sh.getRange(lr, 1).setValue(h); r = lr; } } // nâng cấp dòng cũ sang HMAC
    if (!r) return out_({ ok: true, state: null, updated: 0 });
    const v = sh.getRange(r, 2, 1, 2).getValues()[0]; let st = null; try { st = JSON.parse(v[0]); } catch (err) { }
    return out_({ ok: true, state: st, updated: Number(v[1]) || 0 }); }

  const lock = LockService.getScriptLock(); if (!lock.tryLock(5000)) return out_({ ok: false, err: 'busy' });
  try {
    let r = find_(sh, h); if (!r) { const lr = find_(sh, legacy_(code)); if (lr) { sh.getRange(lr, 1).setValue(h); r = lr; } }
    if (b.op === 'del') { if (r) sh.deleteRow(r); return out_({ ok: true, deleted: !!r }); }
    const st = cleanState_(b.state); if (!st) return out_({ ok: false, err: 'bad_state' });
    const json = JSON.stringify(st); if (json.length > MAX_STATE) return out_({ ok: false, err: 'too_big' });
    let upd = Number(b.updated); if (!isFinite(upd) || upd <= 0) upd = Date.now(); upd = Math.min(upd, Date.now() + 60000);
    if (r) { const cur = Number(sh.getRange(r, 3).getValue()) || 0; if (upd < cur) return out_({ ok: true, stale: true, updated: cur }); sh.getRange(r, 2, 1, 2).setValues([[json, upd]]); return out_({ ok: true, updated: upd }); }
    if (sh.getLastRow() - 1 >= MAX_ROWS) return out_({ ok: false, err: 'full' });
    if (bump_(cache, 'rl_new_' + Math.floor(Date.now() / 3600000), 7200) > NEW_ROWS_PER_HOUR) return out_({ ok: false, err: 'full' });
    sh.appendRow([h, json, upd]); return out_({ ok: true, updated: upd });
  } finally { lock.releaseLock(); } }

/** Xoá các dòng không cập nhật trong 12 tháng. Chạy bằng trigger hằng ngày (setup() tạo sẵn). */
function purgeOld() {
  const lock = LockService.getScriptLock(); if (!lock.tryLock(30000)) return;
  try { const sh = sheet_(), last = sh.getLastRow(); if (last < 2) return; const cut = Date.now() - RETAIN_MS;
    const vals = sh.getRange(2, 3, last - 1, 1).getValues();
    for (let i = vals.length - 1; i >= 0; i--) if ((Number(vals[i][0]) || 0) < cut) sh.deleteRow(i + 2);
  } finally { lock.releaseLock(); } }

/** Chạy MỘT LẦN trong trình soạn thảo: tạo pepper (nếu chưa có), định dạng cột Plain text, tạo trigger dọn dữ liệu hằng ngày. */
function setup() {
  pepper_();
  const sh = sheet_(); sh.getRange('A:C').setNumberFormat('@');
  if (!ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'purgeOld')) ScriptApp.newTrigger('purgeOld').timeBased().everyDays(1).atHour(3).create();
  Logger.log('OK: pepper ' + (PropertiesService.getScriptProperties().getProperty('PEPPER') ? 'đã có' : 'LỖI') + ', trigger purgeOld đã có.'); }
