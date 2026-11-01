/** Dưới Gốc Thị · lưu tiến trình theo "mã nhà".
 *  Gắn script này vào Google Sheet (Tiện ích mở rộng → Apps Script), tab tên "saves" với cột: hash | state | updated.
 *  Triển khai: Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone.
 *  Chỉ lưu SHA-256 của mã, JSON tiến trình (≤ 20KB) và thời điểm cập nhật. Không lưu mã gốc, không thu thông tin cá nhân. */
const MAX_STATE = 20000;
const CODE_RE = /^THI-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/;
const LIMIT = 30, WINDOW_S = 600; // tối đa 30 yêu cầu / 10 phút cho mỗi mã

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function sha_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join(''); }
function limited_(h) { const c = CacheService.getScriptCache(), k = 'rl_' + h, n = Number(c.get(k) || 0); if (n >= LIMIT) return true; c.put(k, String(n + 1), WINDOW_S); return false; }
function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('saves'); }
function find_(sh, h) { const last = sh.getLastRow(); if (last < 2) return 0; const f = sh.getRange(2, 1, last - 1, 1).createTextFinder(h).matchEntireCell(true).findNext(); return f ? f.getRow() : 0; }

function doGet() { return out_({ ok: true, service: 'duoi-goc-thi-save', v: 1 }); }
function doPost(e) {
  let b; try { b = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, err: 'bad_json' }); }
  if (!b || typeof b !== 'object' || (b.op !== 'get' && b.op !== 'put')) return out_({ ok: false, err: 'bad_op' });
  const code = String(b.code || ''); if (!CODE_RE.test(code)) return out_({ ok: false, err: 'bad_code' });
  const h = sha_(code); if (limited_(h)) return out_({ ok: false, err: 'rate_limited' });
  const sh = sheet_();
  if (b.op === 'get') { const r = find_(sh, h); if (!r) return out_({ ok: true, state: null, updated: 0 }); const v = sh.getRange(r, 2, 1, 2).getValues()[0]; let st = null; try { st = JSON.parse(v[0]); } catch (err) { } return out_({ ok: true, state: st, updated: Number(v[1]) || 0 }); }
  const st = b.state; if (!st || typeof st !== 'object' || typeof st.ls !== 'object') return out_({ ok: false, err: 'bad_state' });
  const json = JSON.stringify(st); if (json.length > MAX_STATE) return out_({ ok: false, err: 'too_big' });
  let upd = Number(b.updated); if (!isFinite(upd) || upd <= 0) upd = Date.now(); upd = Math.min(upd, Date.now() + 60000);
  const lock = LockService.getScriptLock(); lock.waitLock(5000);
  try { const r = find_(sh, h);
    if (r) { const cur = Number(sh.getRange(r, 3).getValue()) || 0; if (upd < cur) return out_({ ok: true, stale: true, updated: cur }); sh.getRange(r, 2, 1, 2).setValues([[json, upd]]); }
    else sh.appendRow([h, json, upd]);
  } finally { lock.releaseLock(); }
  return out_({ ok: true, updated: upd });
}
