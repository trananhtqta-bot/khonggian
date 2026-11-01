import { addProgress, touch } from './profile.js?v=18';
/* Chuỗi ngày + việc nhỏ mỗi ngày — chỉ lưu trên máy (localStorage), không số ảo */
const K = 'kg_daily';
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
export function load() { let s; try { s = JSON.parse(localStorage.getItem(K)); } catch { } s = s || {}; s.days = s.days || {}; s.streak = s.streak || 0; s.total = s.total || 0; s.best = s.best || 0;
  return s; }
// mỗi 7 ngày được nghỉ 1 ngày mà chuỗi không đứt; cây thị (theo tổng số ngày) không bao giờ teo
const restOk = (s, t) => !s.lastRest || dayDiff(s.lastRest, t) >= 7;
const keeps = (s, t) => { const g = dayDiff(s.last, t); return g <= 1 || (g === 2 && restOk(s, t)); };
export function streakNow(s = load()) { if (!s.last) return 0; return keeps(s, today()) ? s.streak : 0; }
// bạn vừa quay lại sau ≥2 ngày vắng (chỉ tính từ lần chăm cây gần nhất)
export function awayDays(s = load()) { return s.last ? Math.max(0, dayDiff(s.last, today()) - 1) : 0; }
function save(s) { try { localStorage.setItem(K, JSON.stringify(s)); } catch { } }
function mark(page, id) { const s = load(), t = today(); const d = s.days[t] = s.days[t] || {}; const list = d[page] = d[page] || [];
  if (list.includes(id)) return { s, fresh: false, newDay: false }; list.push(id);
  // Tri Ân: chỉ ghi lặng lẽ, không tính vào chuỗi ngày hay cây thị
  let newDay = false; if (page !== 'trian' && s.last !== t) { newDay = true;
    if (!s.last) s.streak = 1; else { const g = dayDiff(s.last, t); if (g === 1) s.streak++; else if (g === 2 && restOk(s, t)) { s.streak++; s.lastRest = t; } else s.streak = 1; }
    s.total++; s.last = t; s.best = Math.max(s.best, s.streak); }
  // giữ 60 ngày gần nhất
  const ks = Object.keys(s.days).sort(); while (ks.length > 60) delete s.days[ks.shift()];
  save(s); return { s, fresh: true, newDay }; }
export function doneToday(page, s = load()) { return ((s.days[today()] || {})[page]) || []; }

export function allDoneCard() { const d = document.createElement('div'); d.className = 'kg-alldone'; d.innerHTML = 'Hôm nay bạn đã trọn một ngày an lành 🌱<br>Cây thị đã được chăm'; d.style.cssText = 'position:fixed;left:50%;top:42%;transform:translate(-50%,-50%);width:min(84vw,360px);background:#fffaf0f2;color:#2f3a22;font-size:20px;line-height:1.5;font-weight:bold;text-align:center;padding:22px 18px;border-radius:18px;box-shadow:0 10px 40px #0006;z-index:60;pointer-events:none;transition:opacity .5s'; document.body.appendChild(d); setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 600); }, 4000); }
export function dailyTasks({ ui, ST, page, tasks, icons, solemn = false, chime }) {
  const add0 = ST.add.bind(ST);
  let btn;
  const n = () => doneToday(page).filter(id => tasks.some(t => t.id === id)).length;
  const label = () => solemn ? `<span>📋</span><small>Việc tri ân</small>` : `<span>📋</span><small>Hôm nay ${n()}/${tasks.length}</small>`;
  const refresh = () => { if (btn) btn.innerHTML = label(); };
  ST.add = (k, v) => { const r = add0(k, v); const t = tasks.find(t => t.keys.includes(k)); if (t) { const m = mark(page, t.id); if (m.fresh) { refresh(); try { if (solemn) touch(); else addProgress('daily-' + page, { xp: 10, skill: page === 'huong' ? 'daocanh' : page === 'mg' ? 'hoctro' : 'chamcay', la: 1 }); } catch { } const all = n() === tasks.length;
        const msg = solemn ? (all ? 'Xin cảm ơn bạn đã đến viếng' : (t.doneMsg || 'Xin cảm ơn bạn')) : (all ? 'Hôm nay bạn đã trọn một ngày an lành · cây thị đã được chăm 🌱' : `✔ Đã xong: ${t.text}`);
        setTimeout(() => (all && !solemn) ? allDoneCard() : ui.toast(msg, 3500), 600); if (!solemn && chime) chime(); } } return r; };
  const open = () => { const done = doneToday(page), st = streakNow();
    ui.modal(`<h2>Việc nhỏ hôm nay</h2>${solemn ? '<p style="text-align:center;font-size:16px;margin:4px 0 10px;opacity:.8">Những việc tri ân lặng lẽ, không tính điểm.</p>' : `<p style="text-align:center;font-size:18px;margin:4px 0 10px">${st ? `Bạn đã ghé <b>${st}</b> ngày liền` : 'Làm một việc nhỏ để bắt đầu chuỗi ngày'}</p><p style="text-align:center;font-size:14px;opacity:.7;margin:-4px 0 8px">Mỗi tuần được nghỉ 1 ngày mà chuỗi vẫn giữ.</p>`}
      ${tasks.map((t, i) => { const ok = done.includes(t.id); return `<button class="kg-btn kgd-row" data-i="${i}" style="display:flex;align-items:center;gap:12px;width:100%;min-height:64px;margin:8px 0;font-size:20px;text-align:left;${ok ? 'opacity:.75' : ''}"><span style="font-size:28px;width:36px;text-align:center">${ok ? '✅' : t.icon}</span><span style="flex:1">${t.text}<br><small style="font-size:15px;opacity:.8">${ok ? 'Đã xong hôm nay' : t.hint}</small></span>${ok ? '' : '<span style="font-size:22px">›</span>'}</button>`; }).join('')}
      <p style="text-align:center;font-size:15px;opacity:.75;margin-top:10px">Bấm vào một việc để được đưa tới chỗ làm.<br>Mai lại có việc mới.</p>
      <button class="kg-btn" id="kgd-x" style="width:100%;min-height:56px;font-size:19px;margin-top:6px">Đóng</button>`,
      c => { c.querySelector('#kgd-x').onclick = () => ui.close(); c.querySelectorAll('.kgd-row').forEach(b => b.onclick = () => { const t = tasks[+b.dataset.i]; ui.close(); if (!done.includes(t.id)) t.go?.(); }); }); };
  btn = icons('📋', 'Hôm nay', open); refresh();
  // nhắc nhẹ một lần mỗi ngày
  try { const k = 'kg_daily_hint_' + page; if (localStorage.getItem(k) !== today() && n() < tasks.length) { localStorage.setItem(k, today()); setTimeout(() => ui.toast(`Việc nhỏ hôm nay: ${tasks.map(t => t.text.toLowerCase()).join(', ')}. Bấm 📋 để xem.`, 6000), 7000); } } catch { }
  return { open, refresh };
}
