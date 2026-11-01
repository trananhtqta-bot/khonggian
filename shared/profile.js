/* Hồ sơ nhân vật dùng chung + nhà riêng + mã nhà (lưu chéo thiết bị).
   localStorage là nơi lưu chính; máy chủ (Apps Script) chỉ là bản sao theo mã. Không thu thông tin cá nhân. */
export const SYNC_URL = 'https://script.google.com/macros/s/AKfycbybb1elUKdMTVSHLM8FfedMJXqqYU4dtkjakYoi4q8Gx152pFlYYEpngP6AIEje9TFT/exec'; // dán URL web app Apps Script (…/exec) vào đây sau khi triển khai
export const SCHEMA_VERSION = 1;
const PK = 'kg_profile', CK = 'kg_house_code', MAX = 20000;
const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // 31 ký tự, bỏ 0 O 1 I L
const CODE_RE = /^THI-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/;
export const SKILLS = { chamcay: 'Chăm cây', daocanh: 'Dạo cảnh', hoctro: 'Học trò', ansang: 'Ăn sáng', cafe: 'Cà phê', hoc: 'Học', thethao: 'Thể thao', nauan: 'Nấu ăn' };
export const SHOP = [
  { id: 'chauhoa', label: 'Chậu hoa', icon: '🪴', cost: 3 },
  { id: 'denlong', label: 'Đèn lồng', icon: '🏮', cost: 5 },
  { id: 'chieu', label: 'Chiếu cói', icon: '🧺', cost: 4 },
  { id: 'ghemay', label: 'Ghế mây', icon: '🪑', cost: 6 },
  { id: 'meo', label: 'Mèo mướp', icon: '🐈', cost: 8 },
  { id: 'canhthi', label: 'Cành thị', icon: '🌿', cost: 2 }];
export const UPGRADES = [{ id: 'tranh', label: 'Nhà tranh', cost: 0 }, { id: 'ngoi', label: 'Nhà ngói', cost: 20 }, { id: 'sanvuon', label: 'Nhà có sân vườn', cost: 45 }];
export const levelOf = xp => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 20)); // 0→1, 20→2, 80→3, 180→4…

export function newCode() { const a = new Uint32Array(10); crypto.getRandomValues(a); let s = ''; for (let i = 0; i < 10; i++) s += ALPHA[a[i] % 31]; return `THI-${s.slice(0, 5)}-${s.slice(5)}`; } // 31^10 ≈ 2^49.5
export function normCode(t) { const s = String(t || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/^THI/, ''); return s.length === 10 ? `THI-${s.slice(0, 5)}-${s.slice(5)}` : ''; }
export const validCode = c => CODE_RE.test(c);
export function getCode() { let c = localStorage.getItem(CK); if (!validCode(c)) { c = newCode(); localStorage.setItem(CK, c); } return c; }

function blank() { return { schemaVersion: SCHEMA_VERSION, created: Date.now(), updated: 0,
  character: { name: '', appearance: { skin: '#eec39a', hair: 'ngan', top: '#f4f1ea', bottom: '#3a3f4a' }, level: 1, xp: 0, skills: {}, inventory: [], currency: { la: 0 } },
  house: { layout: 'tranh', items: [], upgrades: ['tranh'] }, games: {} }; }

/* ---------- làm sạch dữ liệu (chống XSS khi nhập mã của người khác) ---------- */
export function cleanName(t = '') { return String(t).replace(/https?:\/\/\S+|www\.\S+|\S+\.(com|vn|net|org|me|ly|io)\S*/gi, '').replace(/[+\d][\d .\-]{6,}\d/g, '').replace(/[<>"'`&\\{}=]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }
const num = (v, max = 1e7) => { v = Math.floor(Number(v)); return isFinite(v) ? Math.max(0, Math.min(max, v)) : 0; };
const color = (v, d) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) ? v : d;
const ident = v => typeof v === 'string' && /^[a-z0-9_-]{1,24}$/i.test(v);
const HAIRS = ['ngan', 'dai', 'buoi', 'troc'];
function sanitizeProfile(p) { const b = blank(), c = p.character || {}, a = c.appearance || {}, h = p.house || {};
  const skills = {}; if (c.skills && typeof c.skills === 'object') for (const [k, v] of Object.entries(c.skills)) { const kk = k === 'hanhhuong' ? 'daocanh' : k; if (SKILLS[kk]) skills[kk] = num((skills[kk] || 0) + num(v)); } // v18: 'Hành hương' → 'Dạo cảnh'
  const ups = Array.isArray(h.upgrades) ? h.upgrades.filter(u => UPGRADES.some(x => x.id === u)) : []; if (!ups.includes('tranh')) ups.unshift('tranh');
  const games = {}; if (p.games && typeof p.games === 'object') for (const [k, v] of Object.entries(p.games).slice(0, 50)) if (ident(k) && v && typeof v === 'object') games[k] = { plays: num(v.plays), last: num(v.last, 1e14) };
  const xp = num(c.xp);
  return { schemaVersion: SCHEMA_VERSION, created: num(p.created, 1e14) || Date.now(), updated: Math.min(num(p.updated, 1e14), Date.now() + 60000), migrated: !!p.migrated,
    character: { name: cleanName(c.name || '').slice(0, 16), appearance: { skin: color(a.skin, b.character.appearance.skin), hair: HAIRS.includes(a.hair) ? a.hair : 'ngan', top: color(a.top, b.character.appearance.top), bottom: color(a.bottom, b.character.appearance.bottom) },
      level: levelOf(xp), xp, skills, inventory: Array.isArray(c.inventory) ? [...new Set(c.inventory.filter(ident))].slice(0, 200) : [], currency: { la: num(c.currency?.la) } },
    house: { layout: ups.includes(h.layout) ? h.layout : ups[ups.length - 1], items: Array.isArray(h.items) ? h.items.filter(i => SHOP.some(x => x.id === i)).slice(0, 60) : [], upgrades: [...new Set(ups)] }, games }; }
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const J = v => { try { return JSON.parse(v); } catch { return null; } };
// mỗi khoá chỉ nhận dạng dữ liệu mình biết; khoá lạ bị bỏ
function sanitizeKey(k, v) {
  if (typeof v !== 'string' || v.length > 4096) return null;
  if (k === PK) { const o = J(v); return o && typeof o === 'object' ? JSON.stringify(sanitizeProfile(o)) : null; }
  if (/^kg_av_[a-z]{1,12}$/.test(k)) { const o = J(v); if (!o || typeof o !== 'object') return null; const r = { name: cleanName(o.name || '').slice(0, 16), skin: color(o.skin, '#eec39a') }; for (const f of ['hair', 'outfit', 'hat', 'pet']) if (ident(o[f])) r[f] = o[f]; return JSON.stringify(r); }
  if (k === 'kg_daily') { const o = J(v); if (!o || typeof o !== 'object') return null; const r = { streak: num(o.streak, 1e5), total: num(o.total, 1e5), best: num(o.best, 1e5), days: {} }; if (DATE.test(o.last)) r.last = o.last; if (DATE.test(o.lastRest)) r.lastRest = o.lastRest;
    if (o.days && typeof o.days === 'object') for (const [d, pg] of Object.entries(o.days).slice(-400)) if (DATE.test(d) && pg && typeof pg === 'object') { const x = r.days[d] = {}; for (const [pn, l] of Object.entries(pg)) if (/^[a-z]{1,12}$/.test(pn) && Array.isArray(l)) x[pn] = l.filter(ident).slice(0, 20); } return JSON.stringify(r); }
  if (k === 'kg_beads') return String(num(v));
  if (k === 'kg_mg_flowerscale') { const f = Number(v); return isFinite(f) ? String(Math.max(0.4, Math.min(1.2, f))) : null; }
  if (/^kg_tut_[a-z0-9_-]{1,24}$/.test(k)) return '1';
  if (/^kg_daily_hint_[a-z]{1,12}$/.test(k)) return DATE.test(v) ? v : null;
  if (/^kg_pos_[a-z0-9_-]{1,24}$/.test(k)) { const o = J(v); return Array.isArray(o) && o.length === 3 && o.every(n => typeof n === 'number' && isFinite(n) && Math.abs(n) < 1e4) ? JSON.stringify(o) : null; }
  if (/^kg_stats_[a-z0-9_-]{1,24}$/.test(k)) { const o = J(v); if (!o || typeof o !== 'object') return null; const r = {}; for (const [n, x] of Object.entries(o).slice(0, 50)) if (ident(n)) r[n] = num(x); return JSON.stringify(r); }
  return null; }
// di chuyển dữ liệu cũ (trước v14) sang hồ sơ
function migrate(p) {
  if (!p || typeof p !== 'object') p = null;
  if (!p) { p = blank(); p.migrated = true;
    for (const k of ['kg_av_huong', 'kg_av_mg', 'kg_av_trian']) { try { const a = JSON.parse(localStorage.getItem(k)); if (a && a.name && !p.character.name) { p.character.name = cleanName(a.name).slice(0, 16); p.character.appearance.skin = a.skin || p.character.appearance.skin; p.character.appearance.hair = a.hair || p.character.appearance.hair; } } catch { } }
    try { const d = JSON.parse(localStorage.getItem('kg_daily')) || {}; const tot = d.total || 0; p.character.xp = tot * 10; p.character.currency.la = tot; if (tot) p.character.skills.chamcay = tot; } catch { }
    p.character.level = levelOf(p.character.xp); }
  // các bản schema sau thêm bước nâng cấp ở đây: if (p.schemaVersion < 2) {...}
  const b = blank(); p.character = { ...b.character, ...p.character }; p.character.appearance = { ...b.character.appearance, ...p.character.appearance };
  p.character.currency = { ...b.character.currency, ...p.character.currency }; p.house = { ...b.house, ...p.house }; p.games = p.games || {}; return sanitizeProfile(p); }
export function getProfile() { let p = null; try { p = JSON.parse(localStorage.getItem(PK)); } catch { } const fresh = !p; p = migrate(p); if (fresh && p.character.name) saveProfile(p, true); return p; }
export const hasCharacter = () => !!getProfile().character.name;
export function saveProfile(p, quiet) { p.updated = Date.now(); try { localStorage.setItem(PK, JSON.stringify(p)); } catch { } if (!quiet) schedulePush(); return p; }
export function update(fn) { const p = getProfile(); fn(p); return saveProfile(p); }
// API cho các mini-game: cộng tiến trình vào cùng một nhân vật
export function addProgress(game, { xp = 0, skill = null, skillPts = 1, la = 0, item = null } = {}) {
  return update(p => { const c = p.character; c.xp += xp; c.level = levelOf(c.xp); if (skill) c.skills[skill] = (c.skills[skill] || 0) + skillPts; if (la) c.currency.la += la; if (item) c.inventory.push(item);
    const g = p.games[game] = p.games[game] || { plays: 0 }; g.plays++; g.last = Date.now(); }); }
export function buyItem(id) { const it = SHOP.find(s => s.id === id); let ok = false; update(p => { if (it && p.character.currency.la >= it.cost) { p.character.currency.la -= it.cost; p.house.items.push(id); ok = true; } }); return ok; }
export function buyUpgrade(id) { const u = UPGRADES.find(s => s.id === id); let ok = false; update(p => { if (u && !p.house.upgrades.includes(id) && p.character.currency.la >= u.cost) { p.character.currency.la -= u.cost; p.house.upgrades.push(id); p.house.layout = id; ok = true; } }); return ok; }

/* ---------- đồng bộ ---------- */
const SYNC_KEYS = k => k.startsWith('kg_') && k !== CK && !k.startsWith('kg_live') && k !== 'kg_sync_at';
export function snapshot() { const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (SYNC_KEYS(k)) { const v = sanitizeKey(k, localStorage.getItem(k)); if (v !== null) ls[k] = v; } } return { v: SCHEMA_VERSION, updated: getProfile().updated || Date.now(), ls }; }
// lời tri ân (trian_msgs) KHÔNG đồng bộ: chỉ ở trên máy này
export function restore(state) { if (!state || !state.ls || typeof state.ls !== 'object') return false; const clean = {};
  for (const [k, v] of Object.entries(state.ls)) if (SYNC_KEYS(k)) { const c = sanitizeKey(k, v); if (c !== null) clean[k] = c; }
  for (const k of Object.keys(localStorage)) if (SYNC_KEYS(k)) localStorage.removeItem(k); for (const [k, v] of Object.entries(clean)) localStorage.setItem(k, v); return true; }
async function call(body) { if (!SYNC_URL && !globalThis.KG_SYNC_URL) return null; const ac = new AbortController(), to = setTimeout(() => ac.abort(), 5000); try { const r = await fetch(globalThis.KG_SYNC_URL || SYNC_URL, { signal: ac.signal, method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }); const j = await r.json(); return j && typeof j === 'object' ? j : null; } catch { return null; } finally { clearTimeout(to); } }
let timer = 0;
export function schedulePush(ms = 4000) { clearTimeout(timer); timer = setTimeout(push, ms); }
export async function push() { const s = snapshot(), body = JSON.stringify(s); if (body.length > MAX) return null; const j = await call({ op: 'put', code: getCode(), state: s, updated: s.updated }); if (j && j.ok) localStorage.setItem('kg_sync_at', String(num(j.updated, 1e14))); return j; }
export async function pull(code = getCode()) { const j = await call({ op: 'get', code }); return j && j.ok ? j : null; }
// lúc tải trang: nếu bản trên máy chủ mới hơn thì lấy về (trả true nếu đã thay đổi dữ liệu)
export async function syncOnLoad() { const j = await pull(); if (!j || !j.state) { if (getProfile().updated) schedulePush(1500); return false; }
  const local = getProfile().updated || 0; if (Math.min(num(j.updated, 1e14), Date.now() + 60000) > local) { restore(j.state); return true; } if (local > j.updated) schedulePush(1500); return false; }
// nhập mã nhà từ máy khác
export async function useCode(raw) { const c = normCode(raw); if (!validCode(c)) return { ok: false, err: 'Mã không đúng dạng THI-XXXXX-XXXXX' }; const j = await pull(c); if (!j) return { ok: false, err: 'Không kết nối được, thử lại sau nhé' }; if (!j.state) return { ok: false, err: 'Không tìm thấy nhà với mã này' }; restore(j.state); localStorage.setItem(CK, c); return { ok: true }; }
// đẩy khi có thay đổi trong game (gọi từ daily/engine)
export const touch = () => { try { const p = getProfile(); saveProfile(p); } catch { } };
// xoá nhà: xoá bản trên máy chủ + toàn bộ tiến trình trên máy này, tạo mã mới
export async function deleteHouse() { const code = getCode(); clearTimeout(timer); const j = (SYNC_URL || globalThis.KG_SYNC_URL) ? await call({ op: 'del', code }) : { ok: true };
  if (!j || !j.ok) return { ok: false, err: 'Không kết nối được máy chủ, chưa xoá. Thử lại sau nhé' };
  for (const k of Object.keys(localStorage)) if (k.startsWith('kg_') && !k.startsWith('kg_live')) localStorage.removeItem(k); localStorage.removeItem('trian_msgs'); return { ok: true }; }
