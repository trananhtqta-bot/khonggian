// Hub: tạo nhân vật, thẻ nhân vật, nhà riêng, mã nhà
const normCode = s => String(s || '').toUpperCase().replace(/\s+/g, '').trim();
import { load as loadDaily, doneToday } from './daily.js?v=22';
import { getProfile, update, hasCharacter, levelOf, SKILLS, SHOP, UPGRADES, buyItem, buyUpgrade, getCode, useCode, syncOnLoad, schedulePush, deleteHouse } from './profile.js?v=22';
const LIVE = !!window.KG_LIVE;
const $ = s => document.querySelector(s);
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SK = ['#f6d7b5', '#eec39a', '#d9a77c', '#b98260', '#8d5a3b'], HAIR = { ngan: 'Tóc ngắn', dai: 'Tóc dài', buoi: 'Buộc', troc: 'Trọc' }, TOPS = ['#f4f1ea', '#e75f7b', '#4f86c6', '#6aa84f', '#f2c46a'];
const card = 'max-width:380px;margin:14px auto;background:#24382f;border-radius:16px;padding:14px 16px;text-align:left;box-sizing:border-box';
const btn = 'border:0;border-radius:12px;background:#c79a3b;color:#1b1206;font-weight:bold;font-size:18px;min-height:48px;padding:10px 14px;cursor:pointer';
const lockedBtn = 'border:2px dashed #8fa89a;border-radius:12px;background:#1f3029;color:#f3ead7;font-weight:bold;font-size:18px;min-height:48px;padding:8px 12px;cursor:pointer;text-align:left';
const TASKS = { huong: 2, mg: 2 }; const TASK_IDS = { huong: ['do', 'quet'], mg: null }; // Hương Sơn: thắp hương, thỉnh chuông không tính // Tri Ân không có lá thị
const stars = lv => '★'.repeat(Math.min(lv, 5)) + (lv > 5 ? ' +' + (lv - 5) : '');
// Hình vẽ tự làm (SVG thuần, không dùng tài nguyên ngoài) — v22
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(c * k))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(c => f(c).toString(16).padStart(2, '0')).join(''); };
let uid = 0;
function person(a, s = 64) { const id = 'p' + (++uid), top = a.top || '#7a9cc6', bot = a.bottom || '#3d4a5c', sk = a.skin || '#f6d7b5', hair = '#2a1a10';
  const back = a.hair === 'dai' ? `<path d="M17 26 Q15 52 22 58 L42 58 Q49 52 47 26Z" fill="${hair}"/>` : '';
  const front = a.hair === 'troc' ? `<path d="M19 20 Q32 9 45 20" stroke="${shade(sk, .9)}" stroke-width="2" fill="none" opacity=".6"/>`
    : `<path d="M17.5 27 Q16 10 32 9 Q48 10 46.5 27 Q44 19 38 17 Q35 22 26 21 Q21 21 17.5 27Z" fill="${hair}"/><path d="M24 13 Q30 10 36 12" stroke="#fff" stroke-opacity=".18" stroke-width="2" fill="none" stroke-linecap="round"/>`
      + (a.hair === 'buoi' ? `<circle cx="32" cy="7" r="5.5" fill="${hair}"/><rect x="28" y="10" width="8" height="2.5" rx="1.2" fill="#c0392b"/>` : '');
  return `<svg class="kg-person" width="${s}" height="${s * 1.25}" viewBox="0 0 64 80" aria-hidden="true"><defs>
<radialGradient id="${id}s" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${shade(sk, 1.06)}"/><stop offset="1" stop-color="${shade(sk, .9)}"/></radialGradient>
<linearGradient id="${id}t" x1="0" x2="1"><stop offset="0" stop-color="${shade(top, 1.08)}"/><stop offset="1" stop-color="${shade(top, .82)}"/></linearGradient></defs>
<ellipse cx="32" cy="77" rx="16" ry="2.6" fill="#000" opacity=".22"/>
<g class="kg-bob">${back}
<rect x="22" y="60" width="8.5" height="14" rx="3.5" fill="${bot}"/><rect x="33.5" y="60" width="8.5" height="14" rx="3.5" fill="${bot}"/>
<ellipse cx="26" cy="75" rx="5.2" ry="2.4" fill="#5a3a22"/><ellipse cx="38" cy="75" rx="5.2" ry="2.4" fill="#5a3a22"/>
<path d="M14.5 46 Q13 56 17 60" stroke="${shade(top, .9)}" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M49.5 46 Q51 56 47 60" stroke="${shade(top, .9)}" stroke-width="6" stroke-linecap="round" fill="none"/>
<circle cx="17" cy="61" r="3.2" fill="url(#${id}s)"/><circle cx="47" cy="61" r="3.2" fill="url(#${id}s)"/>
<path d="M19 42 Q32 37 45 42 Q49 52 46 64 Q32 67 18 64 Q15 52 19 42Z" fill="url(#${id}t)"/>
<path d="M28 39.5 L32 44 L36 39.5" stroke="${shade(top, .7)}" stroke-width="1.6" fill="none" stroke-linejoin="round"/>
<circle cx="32" cy="48" r="1.1" fill="${shade(top, .65)}"/><circle cx="32" cy="54" r="1.1" fill="${shade(top, .65)}"/>
<rect x="29" y="34" width="6" height="6" rx="2" fill="${shade(sk, .9)}"/>
<ellipse cx="17" cy="26" rx="2.6" ry="3.4" fill="${shade(sk, .95)}"/><ellipse cx="47" cy="26" rx="2.6" ry="3.4" fill="${shade(sk, .95)}"/>
<ellipse cx="32" cy="24" rx="15" ry="14.5" fill="url(#${id}s)"/>
${front}
<g class="kg-blink"><ellipse cx="26.5" cy="26" rx="2" ry="2.5" fill="#2a1d14"/><ellipse cx="37.5" cy="26" rx="2" ry="2.5" fill="#2a1d14"/><circle cx="27.2" cy="25.1" r=".7" fill="#fff"/><circle cx="38.2" cy="25.1" r=".7" fill="#fff"/></g>
<path d="M23.5 21.5 Q26.5 20.3 29 21.3 M35 21.3 Q37.5 20.3 40.5 21.5" stroke="#3b2a1e" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/>
<ellipse cx="22.5" cy="30.5" rx="2.8" ry="1.7" fill="#f08a8a" opacity=".45"/><ellipse cx="41.5" cy="30.5" rx="2.8" ry="1.7" fill="#f08a8a" opacity=".45"/>
<path d="M29 31 Q32 33.6 35 31" stroke="#9a4a32" stroke-width="1.5" fill="none" stroke-linecap="round"/></g></svg>`; }
const ITEM = {
  chauhoa: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-9 0 L9 0 L6.5 13 L-6.5 13Z" fill="#b8643a"/><rect x="-10" y="-2" width="20" height="4" rx="1.5" fill="#cf7a4a"/><path d="M0 -2 Q-2 -12 -8 -16 M0 -2 Q1 -14 6 -19 M0 -2 Q4 -9 11 -11" stroke="#3f7d34" stroke-width="2" fill="none"/><circle cx="-8" cy="-17" r="3.6" fill="#f06a8a"/><circle cx="6" cy="-20" r="3.6" fill="#ffd34d"/><circle cx="11" cy="-12" r="3" fill="#f06a8a"/></g>`,
  denlong: (x, y) => `<g transform="translate(${x} ${y})" class="kg-swing"><line x1="0" y1="-10" x2="0" y2="0" stroke="#5a3a22" stroke-width="1.2"/><rect x="-3" y="-1" width="6" height="3" fill="#7a4a1a"/><ellipse cx="0" cy="10" rx="8" ry="10" fill="#d9362b"/><path d="M-4 1.5 Q-6 10 -4 18.5 M4 1.5 Q6 10 4 18.5" stroke="#a8261e" stroke-width="1" fill="none"/><ellipse cx="0" cy="10" rx="4" ry="7" fill="#ffb347" opacity=".35"/><rect x="-3" y="19" width="6" height="3" fill="#7a4a1a"/><path d="M0 22 v6" stroke="#f2c46a" stroke-width="2"/></g>`,
  chieu: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-30 0 L30 0 L38 14 L-38 14Z" fill="#e3c27a"/>${[-24, -12, 0, 12, 24].map(k => `<path d="M${k} 0 L${k * 1.27} 14" stroke="#c9a456" stroke-width="1"/>`).join('')}<path d="M-34 7 H34" stroke="#c0392b" stroke-width="2"/></g>`,
  ghemay: (x, y) => `<g transform="translate(${x} ${y})" fill="none" stroke="#a8743a" stroke-width="2.4" stroke-linecap="round"><path d="M-10 -22 Q-11 -6 -9 0 H9 Q11 -6 10 -22 Q0 -26 -10 -22Z" fill="#d9a85c" stroke="#a8743a"/><path d="M-8 -16 H8 M-8 -10 H8" stroke="#b8844a" stroke-width="1.2"/><path d="M-11 0 H11 M-9 0 L-11 14 M9 0 L11 14 M-6 0 L-6 12 M6 0 L6 12"/></g>`,
  meo: (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="8" rx="13" ry="7" fill="#d79a4a"/><path d="M12 8 Q22 4 20 -4" stroke="#d79a4a" stroke-width="3.5" fill="none" stroke-linecap="round" class="kg-tail"/><circle cx="-10" cy="0" r="7" fill="#e0a85a"/><path d="M-16 -4 L-15 -11 L-11 -6Z M-4 -4 L-5 -11 L-9 -6Z" fill="#e0a85a"/><path d="M-3 4 h-3 M3 6 h-5 M-6 9 h-4" stroke="#b5782f" stroke-width="1.6"/><path d="M-13 0 q1.2 -1.4 2.4 0 M-9 0 q1.2 -1.4 2.4 0" stroke="#3a2a1a" stroke-width="1" fill="none"/><circle cx="-10" cy="3" r=".9" fill="#c0607a"/></g>`,
  canhthi: (x, y) => `<g transform="translate(${x} ${y})"><path d="M-6 0 Q-8 8 -4 14 H4 Q8 8 6 0Z" fill="#5b88a8"/><path d="M-6 3 H6" stroke="#e8f0f4" stroke-width="1.4"/><path d="M0 0 Q-2 -12 -10 -18 M0 -6 Q6 -14 12 -16" stroke="#6b4a2a" stroke-width="1.8" fill="none"/><ellipse cx="-11" cy="-19" rx="5" ry="3" fill="#3f8a3a" transform="rotate(-30 -11 -19)"/><ellipse cx="13" cy="-17" rx="5" ry="3" fill="#4f9a44" transform="rotate(20 13 -17)"/><circle cx="-4" cy="-13" r="4.5" fill="#f2b625"/><circle cx="6" cy="-11" r="4" fill="#f2b625"/></g>`
};
const SLOTS = { chauhoa: [[118, 168], [242, 168], [100, 186], [260, 186]], denlong: [[132, 92], [228, 92]], chieu: [[180, 176]], ghemay: [[290, 170]], meo: [[150, 186]], canhthi: [[74, 172]] };
function houseSVG(p) { const L = p.house.layout, items = p.house.items, cnt = {}; items.forEach(i => cnt[i] = (cnt[i] || 0) + 1);
  const tranh = L === 'tranh', wall = tranh ? '#d8bf8f' : '#f1e4c6';
  const roof = tranh
    ? `<path d="M80 92 Q130 60 180 34 Q230 60 280 92 Q180 100 80 92Z" fill="url(#hth)"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${92 + i * 13} ${90 - (i < 7 ? i : 13 - i) * 0} q2 -10 ${i < 7 ? 6 : -6} -${18 + (i < 7 ? i : 13 - i) * 5}" stroke="#a88442" stroke-width="1.2" fill="none" opacity=".6"/>`).join('')}<path d="M80 92 Q180 102 280 92" stroke="#8a6a32" stroke-width="3" fill="none"/>`
    : `<path d="M74 94 Q90 90 102 70 L180 30 L258 70 Q270 90 286 94 Q180 102 74 94Z" fill="url(#hrf)"/>${[48, 58, 68, 78, 88].map(yy => `<path d="M${180 - (yy - 30) * 1.9} ${yy} Q180 ${yy + 3} ${180 + (yy - 30) * 1.9} ${yy}" stroke="#8a2f1e" stroke-width="1.3" fill="none" opacity=".55"/>`).join('')}<path d="M100 70 L180 30 L260 70" stroke="#7a2a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M74 94 q-6 -2 -8 -8 M286 94 q6 -2 8 -8" stroke="#7a2a1a" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const garden = L === 'sanvuon' ? `<path d="M0 160 H360 V210 H0Z" fill="#8cbf6a"/><g opacity=".95"><circle cx="26" cy="128" r="22" fill="#4f9a44"/><circle cx="40" cy="116" r="16" fill="#62ad52"/><rect x="24" y="140" width="6" height="22" fill="#6b4a2a"/>
    <circle cx="334" cy="124" r="24" fill="#4f9a44"/><circle cx="320" cy="112" r="15" fill="#62ad52"/><rect x="331" y="140" width="6" height="22" fill="#6b4a2a"/>${[300, 312, 324].map(x => `<circle cx="${x}" cy="150" r="3" fill="#f2b625"/>`).join('')}</g>
    <path d="M150 210 Q165 186 172 168 H188 Q195 186 210 210Z" fill="#c9a77a"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 ${176 + i * 0} h0" />`).join('')}
    <path d="M0 168 H120 M240 168 H360" stroke="#b5462f" stroke-width="2" opacity=".5"/>` : `<path d="M0 162 H360 V210 H0Z" fill="#7fb25c"/><path d="M90 160 H270 L290 178 H70Z" fill="#cbb08a"/>`;
  const its = Object.entries(cnt).flatMap(([id, n]) => (SLOTS[id] || []).slice(0, Math.min(n, (SLOTS[id] || []).length)).map(([x, y]) => ITEM[id] ? ITEM[id](x, y) : '')).join('');
  return `<svg viewBox="0 0 360 210" style="width:100%;display:block;border-radius:12px" role="img" aria-label="Nhà của bạn"><defs>
<linearGradient id="hsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7dca6"/><stop offset=".6" stop-color="#e3ebcf"/><stop offset="1" stop-color="#c8deb2"/></linearGradient>
<linearGradient id="hrf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9573a"/><stop offset="1" stop-color="#9c3a24"/></linearGradient>
<linearGradient id="hth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9b867"/><stop offset="1" stop-color="#b08a44"/></linearGradient>
<linearGradient id="hwl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(wall, .86)}"/><stop offset=".25" stop-color="${wall}"/><stop offset="1" stop-color="${shade(wall, .94)}"/></linearGradient>
<radialGradient id="hin" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#8a5a2a"/></radialGradient></defs>
<rect width="360" height="210" fill="url(#hsk)"/><circle cx="300" cy="40" r="20" fill="#fff6d8" opacity=".9"/>
<path d="M0 132 Q60 104 120 124 T240 118 T360 126 V170 H0Z" fill="#a9c98e" opacity=".8"/>
<g stroke="#6f9a52" stroke-width="2.4" stroke-linecap="round" opacity=".85">${[8, 18, 342, 352].map((x, i) => `<path d="M${x} 166 Q${x + (i % 2 ? 4 : -4)} 120 ${x + (i % 2 ? 10 : -6)} 86"/>`).join('')}</g>
${garden}
<ellipse cx="180" cy="162" rx="112" ry="6" fill="#000" opacity=".12"/>
<rect x="96" y="88" width="168" height="72" fill="url(#hwl)"/>
<rect x="96" y="88" width="168" height="8" fill="#000" opacity=".1"/>
${[100, 140, 220, 260].map(x => `<rect x="${x - 3}" y="92" width="6" height="68" fill="#8a5a32"/>`).join('')}
<rect x="160" y="108" width="40" height="52" rx="2" fill="url(#hin)"/><path d="M180 108 V160" stroke="#6b4320" stroke-width="2"/><rect x="160" y="108" width="40" height="52" rx="2" fill="none" stroke="#6b4320" stroke-width="2.5"/>
${[[112, 106], [222, 106]].map(([x, y]) => `<rect x="${x}" y="${y}" width="26" height="24" fill="#ffe4a8"/>${[0, 1, 2, 3].map(k => `<path d="M${x + 4 + k * 6} ${y} V${y + 24}" stroke="#6b4320" stroke-width="2"/>`).join('')}<rect x="${x}" y="${y}" width="26" height="24" fill="none" stroke="#6b4320" stroke-width="2.5"/>`).join('')}
<rect x="88" y="158" width="184" height="6" rx="2" fill="#9a7a5a"/>
${roof}${its}</svg>`; }
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
