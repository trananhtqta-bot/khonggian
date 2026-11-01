// Hub: tạo nhân vật, thẻ nhân vật, nhà riêng, mã nhà
const normCode = s => String(s || '').toUpperCase().replace(/\s+/g, '').trim();
import { load as loadDaily, doneToday } from './daily.js?v=20';
import { getProfile, update, hasCharacter, levelOf, SKILLS, SHOP, UPGRADES, buyItem, buyUpgrade, getCode, useCode, syncOnLoad, schedulePush, deleteHouse } from './profile.js?v=20';
const LIVE = !!window.KG_LIVE;
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SK = ['#f6d7b5', '#eec39a', '#d9a77c', '#b98260', '#8d5a3b'], HAIR = { ngan: 'Tóc ngắn', dai: 'Tóc dài', buoi: 'Buộc', troc: 'Trọc' }, TOPS = ['#f4f1ea', '#e75f7b', '#4f86c6', '#6aa84f', '#f2c46a'];
const card = 'max-width:380px;margin:14px auto;background:#24382f;border-radius:16px;padding:14px 16px;text-align:left;box-sizing:border-box';
const btn = 'border:0;border-radius:12px;background:#c79a3b;color:#1b1206;font-weight:bold;font-size:18px;min-height:48px;padding:10px 14px;cursor:pointer';
const lockedBtn = 'border:2px dashed #8fa89a;border-radius:12px;background:#1f3029;color:#f3ead7;font-weight:bold;font-size:18px;min-height:48px;padding:8px 12px;cursor:pointer;text-align:left';
const TASKS = { huong: 2, mg: 2 }; const TASK_IDS = { huong: ['do', 'quet'], mg: null }; // Hương Sơn: thắp hương, thỉnh chuông không tính // Tri Ân không có lá thị
const stars = lv => '★'.repeat(Math.min(lv, 5)) + (lv > 5 ? ' +' + (lv - 5) : '');
function person(a, s = 64) { return `<svg width="${s}" height="${s * 1.25}" viewBox="0 0 64 80" aria-hidden="true"><rect x="18" y="40" width="28" height="26" rx="8" fill="${a.top}"/><rect x="21" y="64" width="9" height="14" rx="3" fill="${a.bottom}"/><rect x="34" y="64" width="9" height="14" rx="3" fill="${a.bottom}"/><circle cx="32" cy="24" r="15" fill="${a.skin}"/>${a.hair === 'troc' ? '' : `<path d="M17 22 Q32 2 47 22 Q40 14 32 14 Q24 14 17 22Z" fill="#2a1d14"/>`}${a.hair === 'dai' ? '<rect x="15" y="20" width="6" height="22" rx="3" fill="#2a1d14"/><rect x="43" y="20" width="6" height="22" rx="3" fill="#2a1d14"/>' : ''}${a.hair === 'buoi' ? '<circle cx="32" cy="7" r="5" fill="#2a1d14"/>' : ''}<circle cx="27" cy="25" r="1.8" fill="#222"/><circle cx="37" cy="25" r="1.8" fill="#222"/><path d="M28 31 Q32 34 36 31" stroke="#a0522d" stroke-width="1.6" fill="none"/></svg>`; }
function creator(done) {
  const p = getProfile(), a = { ...p.character.appearance }; let name = p.character.name || '';
  const box = document.createElement('div'); box.id = 'kg-create'; box.style.cssText = 'position:fixed;inset:0;background:#1b2a24f2;z-index:40;overflow:auto;padding:20px 16px;box-sizing:border-box';
  const chips = (f, list, isColor) => list.map(([k, v]) => `<button data-f="${f}" data-v="${k}" style="margin:3px;min-width:${isColor ? 48 : 48}px;height:48px;border-radius:24px;border:2px solid ${a[f] === k ? '#f2c46a' : '#fff3'};background:${isColor ? k : '#2f4a3e'};color:#f3ead7;padding:0 10px;font-size:18px">${isColor ? '' : v}</button>`).join('');
  const draw = () => { box.innerHTML = `<div style="max-width:380px;margin:0 auto;text-align:center"><h2 style="margin:4px 0">Tạo nhân vật của bạn</h2><p style="opacity:.8;margin:4px 0 8px;font-size:18px">Nhân vật này đi cùng bạn qua mọi trò chơi dưới gốc thị.</p>
    <div id="kgcp">${person(a, 90)}</div>
    <input id="kgcn" maxlength="16" value="${esc(name)}" placeholder="Tên nhân vật (biệt danh)" style="width:100%;box-sizing:border-box;font-size:18px;padding:12px;min-height:48px;border-radius:12px;border:0;margin:8px 0 2px">
    <p style="font-size:18px;opacity:.7;margin:0 0 8px">Dùng biệt danh, đừng nhập tên thật hay số điện thoại.</p>
    <div style="text-align:left;font-size:18px">Màu da<br>${chips('skin', SK.map(c => [c, c]), true)}<br>Kiểu tóc<br>${chips('hair', Object.entries(HAIR))}<br>Áo<br>${chips('top', TOPS.map(c => [c, c]), true)}</div>
    <button id="kgcgo" style="${btn};width:100%;margin-top:14px;font-size:19px;padding:14px">Bắt đầu</button><p id="kgce" style="color:#ffb4a8;font-size:18px"></p>${LIVE ? '' : '<button id="kgchave" style="background:none;border:0;color:#f3ead7;text-decoration:underline;font-size:18px;min-height:48px;cursor:pointer">Đã có mã nhà? Nhập mã ở đây</button>'}</div>`;
    const hv = box.querySelector('#kgchave'); if (hv) hv.onclick = () => { box.remove(); codeOpen = true; render(); const d = document.querySelector('#kgenter'); if (d) { d.open = true; d.scrollIntoView({ block: 'center' }); document.getElementById('kgin').focus(); } };
    box.querySelector('#kgcn').oninput = e => name = e.target.value;
    box.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { a[b.dataset.f] = b.dataset.v; draw(); });
    box.querySelector('#kgcgo').onclick = () => { const n = name.replace(/[<>`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); if (!n) { box.querySelector('#kgce').textContent = 'Đặt một biệt danh nhé'; return; } if (/\d{6,}|@|https?:/i.test(n)) { box.querySelector('#kgce').textContent = 'Biệt danh không chứa số điện thoại hay email nhé'; return; }
      update(p => { p.character.name = n; p.character.appearance = { ...p.character.appearance, ...a }; }); box.remove(); done(); }; };
  draw(); document.body.appendChild(box);
}
function houseSVG(p) { const L = p.house.layout, roof = L === 'tranh' ? '#c9a45a' : '#b5462f', items = p.house.items;
  const it = items.slice(0, 12).map((id, i) => { const s = SHOP.find(x => x.id === id); return s ? `<text x="${40 + (i % 6) * 54}" y="${i < 6 ? 196 : 170}" font-size="24" text-anchor="middle">${s.icon}</text>` : ''; }).join('');
  return `<svg viewBox="0 0 360 210" style="width:100%;display:block;border-radius:12px;background:linear-gradient(#cfe3c7,#a9cf98)" role="img" aria-label="Nhà của bạn">
  ${L === 'sanvuon' ? '<rect x="0" y="150" width="360" height="60" fill="#8cbf6a"/><circle cx="30" cy="120" r="22" fill="#3f8a3a"/><circle cx="330" cy="118" r="24" fill="#3f8a3a"/>' : '<rect x="0" y="160" width="360" height="50" fill="#7fb25c"/>'}
  <rect x="100" y="80" width="160" height="80" fill="${L === 'tranh' ? '#d9c39a' : '#efe3c8'}" stroke="#6b4a2a" stroke-width="2"/>
  <path d="M84 84 L180 28 L276 84Z" fill="${roof}" stroke="#6b4a2a" stroke-width="2"/>
  <rect x="164" y="112" width="32" height="48" fill="#7a5232"/><rect x="116" y="100" width="30" height="24" fill="#bfe0f2" stroke="#6b4a2a"/><rect x="214" y="100" width="30" height="24" fill="#bfe0f2" stroke="#6b4a2a"/>${it}</svg>`; }
function shopBtn(attr, icon, label, cost, la, extraStyle = '') { const miss = cost - la;
  return miss > 0 ? `<button ${attr} style="${lockedBtn}">🔒 ${icon} ${label} · ${cost}🍃<br><small style="font-size:18px;font-weight:normal">còn thiếu ${miss} lá</small></button>` : `<button ${attr} style="${btn};${extraStyle}">${icon} ${label} · ${cost}🍃</button>`; }
let codeOpen = false;
function render() {
  const p = getProfile(), c = p.character, lv = levelOf(c.xp), lo = 20 * (lv - 1) ** 2, hi = 20 * lv ** 2, pct = Math.round(100 * (c.xp - lo) / (hi - lo));
  const ds = loadDaily(), left = Object.entries(TASKS).reduce((n, [pg, t]) => n + Math.max(0, t - doneToday(pg, ds).filter(id => !TASK_IDS[pg] || TASK_IDS[pg].includes(id)).length), 0);
  const skills = Object.entries(c.skills).filter(([, v]) => v > 0).map(([k, v]) => `<span style="display:inline-block;background:#2f4a3e;border-radius:10px;padding:2px 8px;margin:2px;font-size:18px">${SKILLS[k] || esc(k)} · ${v}</span>`).join('');
  $('#me').innerHTML = `<div style="${card};display:flex;gap:12px;align-items:center"><div>${person(c.appearance, 60)}</div><div style="flex:1"><b id="kgname" style="font-size:19px"></b>
   <div style="font-size:18px;margin-top:2px">Chăm chỉ <span style="color:#f2c46a;letter-spacing:1px" aria-label="Chăm chỉ ${lv} sao">${stars(lv)}</span></div>
   <div style="height:8px;background:#0004;border-radius:4px;margin:6px 0"><div style="height:8px;width:${pct}%;background:#f2c46a;border-radius:4px"></div></div>
   <div style="font-size:18px;font-weight:bold">🍃 <span id="kgla"></span> lá thị</div>
   <div style="font-size:18px;margin:4px 0">${left ? `Hôm nay còn ${left} việc, được thêm ${left} lá` : 'Hôm nay xong hết việc rồi 🌱'}</div>${skills}</div></div>`;
  $('#kgname').textContent = LIVE ? 'Nhân vật của bạn' : c.name; $('#kgla').textContent = String(c.currency.la);
  const next = UPGRADES.find(u => !p.house.upgrades.includes(u.id)), la = c.currency.la;
  $('#house').innerHTML = `<div style="${card}"><b style="font-size:19px">🏡 Nhà của bạn</b> <span style="font-size:18px">· ${(UPGRADES.find(u => u.id === p.house.layout) || UPGRADES[0]).label}</span>
   <div style="margin:8px 0">${houseSVG(p)}</div><p style="font-size:18px;margin:4px 0 8px">Làm việc nhỏ mỗi ngày để nhận lá thị, rồi sắm đồ trang trí nhà.</p>
   <div style="display:flex;flex-wrap:wrap;gap:8px">${SHOP.map(s => shopBtn(`data-buy="${s.id}"`, s.icon, s.label, s.cost, la)).join('')}
   ${next ? shopBtn(`data-up="${next.id}"`, '⬆️', next.label, next.cost, la, 'background:#e8d3a0') : ''}</div><p id="hmsg" style="font-size:18px;min-height:20px;margin:6px 0 0"></p></div>`;
  $('#house').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const ok = buyItem(b.dataset.buy); render(); $('#hmsg').textContent = ok ? 'Đã đặt vào nhà ✨' : 'Chưa đủ lá thị, làm thêm việc nhỏ nhé'; });
  $('#house').querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const ok = buyUpgrade(b.dataset.up); render(); $('#hmsg').textContent = ok ? 'Nhà đã được nâng cấp 🎉' : 'Chưa đủ lá thị để nâng cấp'; });
  renderCode();
}
function renderCode() {
  if (LIVE) { $('#code').innerHTML = ''; return; }
  if (!codeOpen) { $('#code').innerHTML = `<div style="max-width:380px;margin:14px auto"><button id="kgother" style="${btn};width:100%;background:#2f4a3e;color:#f3ead7;border:2px solid #8fa89a">📱 Chơi trên máy khác</button></div>`; $('#kgother').onclick = () => { codeOpen = true; renderCode(); }; return; }
  const code = getCode();
  $('#code').innerHTML = `<div style="${card}"><b style="font-size:19px">🔑 Mã nhà</b><div id="kgcode" style="font-family:monospace;font-size:24px;letter-spacing:1px;margin:8px 0;color:#f2c46a"></div>
   <button id="kgcopy" style="${btn}">Sao chép mã</button>
   <p style="font-size:18px;line-height:1.5;margin:8px 0">Giữ mã này để chơi tiếp trên máy khác. Đừng đưa mã cho người lạ, như chìa khóa nhà.</p>
   <details id="kgenter" style="margin-top:6px"><summary style="cursor:pointer;font-size:18px;min-height:48px;display:flex;align-items:center;justify-content:center;border:2px solid #8fa89a;border-radius:12px;padding:0 12px">🔑 Nhập mã nhà</summary><input id="kgin" placeholder="THI-XXXXX-XXXXX" autocapitalize="characters" style="width:100%;box-sizing:border-box;font-size:18px;min-height:48px;padding:10px;border-radius:10px;border:0;margin:8px 0;font-family:monospace">
   <button id="kguse" style="${btn};width:100%">Vào nhà bằng mã này</button><p style="font-size:18px">Tiến trình trên máy này sẽ được thay bằng tiến trình của mã đó.</p></details><p id="kgmsg" role="status" style="font-size:18px;min-height:20px;margin:6px 0 0"></p></div>
   <div id="kgdelbox" style="${card};margin-top:28px;border:2px solid #a83c28"><b style="font-size:19px;color:#ffb4a4">⚠️ Xoá nhà</b><p style="font-size:18px;margin:6px 0">Xoá bản lưu của mã này trên máy chủ và toàn bộ tiến trình, lời tri ân trên máy này. Không khôi phục được.</p>
   <button id="kgdel" style="${btn};background:#b3261e;color:#fff;border:0;width:100%;min-height:48px">Xoá nhà…</button>
   <div id="kgdel2" style="display:none"><p style="font-size:18px;margin:10px 0 4px">Bước 2: gõ lại mã nhà của bạn để xác nhận</p><input id="kgdelin" placeholder="THI-XXXXX-XXXXX" autocapitalize="characters" autocomplete="off" style="width:100%;box-sizing:border-box;font-size:18px;min-height:48px;padding:10px;border-radius:10px;border:0;margin:4px 0 8px;font-family:monospace">
   <button id="kgdelgo" style="${btn};background:#b3261e;color:#fff;border:0;width:100%;min-height:48px" disabled>Xoá vĩnh viễn</button><button id="kgdelno" style="${btn};width:100%;margin-top:8px">Huỷ</button></div><p id="kgdelmsg" role="status" style="font-size:18px;margin:6px 0 0"></p></div>`;
  $('#kgcode').textContent = code;
  $('#kgdel').onclick = () => { $('#kgdel').style.display = 'none'; $('#kgdel2').style.display = 'block'; $('#kgdelin').focus(); };
  $('#kgdelno').onclick = () => { $('#kgdel').style.display = ''; $('#kgdel2').style.display = 'none'; $('#kgdelin').value = ''; $('#kgdelgo').disabled = true; };
  $('#kgdelin').oninput = () => { $('#kgdelgo').disabled = normCode($('#kgdelin').value) !== code; };
  $('#kgdelgo').onclick = async () => { if (normCode($('#kgdelin').value) !== code) return; $('#kgdelmsg').textContent = 'Đang xoá…'; const r = await deleteHouse(); if (r.ok) { $('#kgdelmsg').textContent = 'Đã xoá nhà. Đang tải lại…'; setTimeout(() => location.reload(), 600); } else $('#kgdelmsg').textContent = r.err; };
  $('#kgcopy').onclick = async () => { try { await navigator.clipboard.writeText(code); $('#kgmsg').textContent = 'Đã sao chép mã'; } catch { $('#kgmsg').textContent = 'Hãy chép tay mã ở trên'; } };
  $('#kguse').onclick = async () => { $('#kgmsg').textContent = 'Đang tìm nhà…'; const r = await useCode($('#kgin').value); if (r.ok) { $('#kgmsg').textContent = 'Đã vào nhà! Đang tải lại…'; setTimeout(() => location.reload(), 600); } else $('#kgmsg').textContent = r.err; };
}
export async function initHub() {
  // vẽ ngay từ dữ liệu trên máy; đồng bộ chạy nền (tối đa 5 giây), không chặn trang
  if (!LIVE) getCode();
  if (!hasCharacter()) creator(() => { render(); schedulePush(500); }); render();
  syncOnLoad().then(changed => { if (changed) { const cr = document.getElementById('kg-create'); if (cr && hasCharacter()) cr.remove(); render(); } }).catch(() => { });
}
