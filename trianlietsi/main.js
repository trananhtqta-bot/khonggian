import { THREE, createWorld, makeUI, mesh, mat, rnd, pick, label, Sound, addNPC, avatarCreator, mapView, shareInvite, refGreeting, leafPatch, broom, reader, bow, stats, isMobile } from '../shared/engine.js';

const walkable = (x, z) => Math.abs(x) < 22 && z > -56 && z < 46;
const W = createWorld({ fog: ['#5d5568', 18, 95], sky: ['#2c3656', '#d79a72', '#ffb27a'], hemi: ['#d9c3c0', '#3a3a40', 0.9], sun: ['#ffb27a', 1.6], sunDir: [-30, 12, -25], spawn: [0, 0, 42], spawnYaw: Math.PI, heightAt: (x, z) => (Math.abs(x) < 4.5 && z > -3 && z < 3) ? 0.6 : 0, walkable, meColor: '#f5e6c8', exposure: 1.05 });
const S = W.sound = new Sound();
const ui = W.ui = makeUI({ title: 'Tri Ân Liệt Sĩ', sub: '<span id="online">…</span>', accent: '#8a2a20', panel: '#f6efe2d9', panelSolid: '#f6efe2', glow: '#f2c46a44', footer: 'Uống nước nhớ nguồn' });
const ST = stats(ui, 'trian');

// ground
{ const g = new THREE.PlaneGeometry(160, 160, 60, 60); g.rotateX(-Math.PI / 2); const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const out = Math.abs(x) > 24 || z < -58 || z > 48; if (out) p.setY(i, Math.max(0, (Math.max(Math.abs(x) - 24, -58 - z, z - 48)) * 0.2) * (1 + Math.sin(x * 0.2 + z * 0.13) * 0.5));
    c.set(Math.abs(x) < 1.8 ? '#a8a29a' : (Math.sin(x * 0.4) * Math.cos(z * 0.5) > 0 ? '#5f7a48' : '#6a8550')); c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.04); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); m.receiveShadow = true; W.scene.add(m);
  const cross = mesh(new THREE.BoxGeometry(44, 0.04, 3), '#a8a29a'); cross.position.set(0, 0.02, -24); W.scene.add(cross); }

// gate
{ const c = document.createElement('canvas'); c.width = 1024; c.height = 180; const g = c.getContext('2d'); g.fillStyle = '#e9dcc0'; g.fillRect(0, 0, 1024, 180); g.fillStyle = '#8a2a20'; g.font = 'bold 76px Georgia,serif'; g.textAlign = 'center'; g.fillText('NGHĨA TRANG LIỆT SĨ', 512, 110); g.font = '30px Georgia'; g.fillText('Tổ quốc ghi công', 512, 160);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const b = mesh(new THREE.BoxGeometry(8, 1.4, 0.4), [mat('#d9ccb0'), mat('#d9ccb0'), mat('#d9ccb0'), mat('#d9ccb0'), new THREE.MeshStandardMaterial({ map: t }), new THREE.MeshStandardMaterial({ map: t })]); b.position.set(0, 4.3, 44); W.scene.add(b);
  [-3.6, 3.6].forEach(x => { const p = mesh(new THREE.BoxGeometry(0.9, 5, 0.9), '#d9ccb0'); p.position.set(x, 2.5, 44); W.scene.add(p); W.addCollider(x, 44, 0.6); });
  const wall = (x, w) => { const m = mesh(new THREE.BoxGeometry(w, 1.2, 0.4), '#c9bca0'); m.position.set(x, 0.6, 44); W.scene.add(m); }; wall(-13, 18); wall(13, 18); W.addBox(-13, 44, 9, 0.3); W.addBox(13, 44, 9, 0.3); }
// central monument (đài tưởng niệm)
const MON = { x: 0, z: 0 }; { const g = new THREE.Group(); const b1 = mesh(new THREE.BoxGeometry(9, 0.6, 6), '#b5ab98'); b1.position.y = 0.3; g.add(b1); const b2 = mesh(new THREE.BoxGeometry(3.2, 1.2, 3.2), '#d6ccb6'); b2.position.y = 1.2; g.add(b2);
  const ob = mesh(new THREE.CylinderGeometry(0.5, 1.1, 12, 4), '#e2d8c4'); ob.rotation.y = Math.PI / 4; ob.position.y = 7.8; g.add(ob); const tip = mesh(new THREE.ConeGeometry(0.55, 1.1, 4), '#e2d8c4'); tip.rotation.y = Math.PI / 4; tip.position.y = 14.3; g.add(tip);
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 256; const sg = sc.getContext('2d'); sg.fillStyle = '#f2c94c'; sg.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; sg.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110); } sg.fill(); const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const star = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: st, transparent: true })); star.position.set(0, 9, 0.85); g.add(star);
  const tc = document.createElement('canvas'); tc.width = 512; tc.height = 256; const tg = tc.getContext('2d'); tg.fillStyle = '#d6ccb6'; tg.fillRect(0, 0, 512, 256); tg.fillStyle = '#7a2a1c'; tg.font = 'bold 64px Georgia'; tg.textAlign = 'center'; tg.fillText('TỔ QUỐC', 256, 110); tg.fillText('GHI CÔNG', 256, 190); const tt = new THREE.CanvasTexture(tc); tt.colorSpace = THREE.SRGBColorSpace;
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.2), new THREE.MeshStandardMaterial({ map: tt })); pl.position.set(0, 1.2, 1.61); g.add(pl);
  const urn = mesh(new THREE.CylinderGeometry(0.7, 0.5, 0.7, 16), '#5a4a32', { metalness: 0.5, roughness: 0.4 }); urn.position.set(0, 0.95, 2.6); g.add(urn);
  g.position.set(MON.x, 0, MON.z); W.scene.add(g); W.addBox(0, 0, 1.7, 1.7); W.addCollider(0, 2.6, 0.7); }
// graves (instanced)
const graves = []; { for (let z = -6; z >= -46; z -= 3.2) for (let x of [-18, -15, -12, -9, -6, 6, 9, 12, 15, 18]) if (!(z > -26 && z < -22)) graves.push({ x, z });
  const N = graves.length, base = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.35, 2), mat('#c9c0ae'), N), head = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 1, 0.18), mat('#e3dccb'), N), star = new THREE.InstancedMesh(new THREE.CircleGeometry(0.17, 5), new THREE.MeshBasicMaterial({ color: '#d8b04a' }), N);
  const m4 = new THREE.Matrix4(); graves.forEach((g, i) => { m4.makeTranslation(g.x, 0.17, g.z); base.setMatrixAt(i, m4); m4.makeTranslation(g.x, 0.75, g.z - 0.9); head.setMatrixAt(i, m4); m4.makeRotationZ(Math.PI / 2).setPosition(g.x, 1.05, g.z - 0.8); star.setMatrixAt(i, m4); W.addBox(g.x, g.z - 0.1, 0.7, 1); });
  base.receiveShadow = head.castShadow = true; W.scene.add(base, head, star);
  const label3 = (t, x, z) => { const l = label(t, '#3a2a20', 0.13); l.position.set(x, 0.55, z - 0.8); }; }
// pines + low hedges
{ const N = 60, cone = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 3.2, 7), new THREE.MeshStandardMaterial({ color: '#2f4a34', flatShading: true }), N), tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.16, 1.2, 5), mat('#4a3626'), N); const m4 = new THREE.Matrix4(); let i = 0;
  for (let z = 40; z > -54 && i < N; z -= 5) for (const x of [-3.2, 3.2, -21.5, 21.5]) { if (i >= N) break; if (Math.abs(x) < 4 && z > -4 && z < 4) continue; const s = rnd(0.9, 1.25); m4.makeScale(s, s, s).setPosition(x, 2.6 * s, z); cone.setMatrixAt(i, m4); m4.makeTranslation(x, 0.6, z); tr.setMatrixAt(i, m4); W.addCollider(x, z, 0.5); i++; } cone.count = tr.count = i; cone.castShadow = true; W.scene.add(cone, tr); }
// memorial wall (tường tri ân)
const WALL = { x: 0, z: -51 }; const wallC = document.createElement('canvas'); wallC.width = 1024; wallC.height = 512; const wallT = new THREE.CanvasTexture(wallC); wallT.colorSpace = THREE.SRGBColorSpace;
{ const w = mesh(new THREE.BoxGeometry(14, 3.4, 0.6), '#8f8676'); w.position.set(WALL.x, 1.7, WALL.z - 0.4); W.scene.add(w); const f = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.0), new THREE.MeshStandardMaterial({ map: wallT, roughness: 0.6 })); f.position.set(WALL.x, 1.7, WALL.z - 0.09); W.scene.add(f); W.addBox(WALL.x, WALL.z - 0.4, 7, 0.4); }
const OWN = () => JSON.parse(localStorage.getItem('trian_msgs') || '[]');
const SEED = ['Đời đời nhớ ơn các anh hùng liệt sĩ', 'Các anh nằm xuống cho quê hương đứng lên', 'Con cháu mãi ghi nhớ công ơn', 'Hòa bình hôm nay là máu xương các anh', 'Uống nước nhớ nguồn', 'Xin thắp nén hương lòng tưởng nhớ'];
function drawWall() { const g = wallC.getContext('2d'); g.fillStyle = '#3b3631'; g.fillRect(0, 0, 1024, 512); g.fillStyle = '#e9cf8a'; g.font = 'bold 46px Georgia'; g.textAlign = 'center'; g.fillText('TƯỜNG TRI ÂN', 512, 62); g.font = 'italic 26px Georgia'; const all = [...OWN().map(m => `“${m.t}” — ${m.n}`), ...SEED].slice(0, 12); all.forEach((t, i) => { g.fillStyle = i < OWN().length ? '#fff4d6' : '#d8ccb0'; g.fillText(t.slice(0, 60), i % 2 ? 760 : 264, 120 + Math.floor(i / 2) * 64); }); wallT.needsUpdate = true; }
drawWall();
// path lanterns (emissive) + a few real lights
{ const N = 24, im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), mat('#ffd9a0', { emissive: '#ffae4a', emissiveIntensity: 1.6 }), N), posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 5), mat('#3a3a3a'), N); const m4 = new THREE.Matrix4(); let i = 0;
  for (let z = 38; z > -50 && i < N; z -= 8) for (const x of [-1.9, 1.9]) { m4.makeTranslation(x, 1.15, z); im.setMatrixAt(i, m4); m4.makeTranslation(x, 0.5, z); posts.setMatrixAt(i, m4); i++; } im.count = posts.count = i; W.scene.add(im, posts);
  [[0, 3.5, 4], [0, 2, -24], [0, 2, -48]].forEach(([x, y, z]) => { const l = new THREE.PointLight('#ffb35c', 5, 14, 1.6); l.position.set(x, y, z); W.scene.add(l); }); }

// incense/candle/flowers placed on graves
const offerings = new THREE.Group(); W.scene.add(offerings); const smokes = []; const smokeG = new THREE.SphereGeometry(0.08, 6, 4);
function incense(x, z, y) { for (let i = 0; i < 3; i++) { const s = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), '#a02a20'); s.position.set(x + (i - 1) * 0.06, y + 0.25, z); const tip = mesh(new THREE.SphereGeometry(0.022, 6, 4), mat('#ff6a2a', { emissive: '#ff4a10', emissiveIntensity: 3 })); tip.position.y = 0.26; s.add(tip); s.userData.life = 120; offerings.add(s); } }
function flowers(x, z, y) { const g = new THREE.Group(); for (let i = 0; i < 7; i++) { const st = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.4, 4), '#3e6a2a'); st.position.set(rnd(-0.08, 0.08), 0.2, rnd(-0.05, 0.05)); st.rotation.z = rnd(-0.3, 0.3); g.add(st); const h = mesh(new THREE.SphereGeometry(0.06, 8, 6), pick(['#f6f2ea', '#f3e6a0', '#f6f2ea'])); h.position.set(st.position.x + st.rotation.z * -0.2, 0.42, st.position.z); g.add(h); } g.position.set(x, y, z); offerings.add(g); }
W.onUpdate((dt, t) => { offerings.children.forEach(s => { if (s.userData.life === undefined) return; s.userData.life -= dt; if (Math.random() < dt * 1.6 && smokes.length < 60) { const p = s.getWorldPosition(new THREE.Vector3()); const m = new THREE.Mesh(smokeG, new THREE.MeshBasicMaterial({ color: '#efe9e0', transparent: true, opacity: 0.3, depthWrite: false })); m.position.set(p.x, p.y + 0.27, p.z); W.scene.add(m); smokes.push({ m, l: 0 }); } });
  for (const s of [...offerings.children]) if (s.userData.life !== undefined && s.userData.life < 0) offerings.remove(s);
  for (let i = smokes.length - 1; i >= 0; i--) { const s = smokes[i]; s.l += dt; s.m.position.y += dt * 0.4; s.m.position.x += Math.sin(t + i) * dt * 0.1; s.m.scale.setScalar(1 + s.l * 1.5); s.m.material.opacity = Math.max(0, 0.28 - s.l * 0.07); if (s.l > 4) { W.scene.remove(s.m); smokes.splice(i, 1); } } });
// pre-place some offerings by earlier visitors
graves.forEach((g, i) => { if (i % 5 === 0) flowers(g.x + 0.35, g.z - 0.55, 0.35); if (i % 7 === 0) incense(g.x - 0.3, g.z - 0.6, 0.35); });

// visitors (quiet, slow)
const NAMES = ['Bác Hòa', 'Cô Lan', 'Anh Dũng', 'Chị Mai', 'Ông Tư', 'Cháu Minh', 'Bà Sáu', 'Đoàn viên Quang'];
const vAp = () => ({ skin: pick(['#f0cfa8', '#d9a77c', '#e8bf96']), hair: pick(['ngan', 'bui', 'ngan']), top: pick(['#f4f1ea', '#2b2b30', '#f4f1ea', '#3a4a6a']), bottom: pick(['#2b2b30', '#1e2a40']), style: 'ao', hat: 'none' });
const vSpots = graves.filter((g, i) => i % 6 === 0).map(g => [g.x, g.z + 1.4, Math.PI, 'stand']);
for (let i = 0; i < (isMobile ? 5 : 8); i++) addNPC(W, { name: NAMES[i], ap: vAp(), area: [-4, 4, -45, 38], spots: [...vSpots, [0, 4.2, Math.PI, 'stand']], speed: 0.9 });

// nearest grave interaction
const G = { pos: { x: 0, z: 0 }, r: 1.9, label: '🕯️ Thắp hương', use: () => doIncense() };
W.addInteract(G); let near = null;
W.onUpdate(() => { const P = W.player.pos; let b = null, bd = 99; for (const g of graves) { const d = Math.hypot(g.x - P.x, g.z + 1.3 - P.z); if (d < bd) { bd = d; b = g; } } near = bd < 2 ? b : null; if (b) { G.pos.x = b.x; G.pos.z = b.z + 1.3; } G.enabled = !!near; });
function doIncense() { if (near) { incense(near.x - 0.3, near.z - 0.6, 0.35); bow(W.player.av); S.bell(110, 0.12); ST.add('huong'); ui.toast('Nén hương thơm dâng lên người đã khuất'); } }
W.addInteract({ pos: { x: 0, z: 3.8 }, r: 2.4, label: '🕯️ Dâng hương Đài tưởng niệm', use: () => { incense(0, 2.6, 1.3); bow(W.player.av); S.bell(98, 0.2); ST.add('huong'); ui.toast('Kính cẩn nghiêng mình trước anh linh các anh hùng liệt sĩ'); } });
W.addInteract({ pos: { x: WALL.x, z: WALL.z + 2 }, r: 3, label: '✍️ Viết lời tri ân', use: () => writeMsg() });
function writeMsg() { ui.modal(`<h2>Lời tri ân</h2><input class="kg-in" id="tm" maxlength="60" placeholder="Viết đôi lời tưởng nhớ…"><button class="kg-btn main" id="ok" style="width:100%;margin-top:10px">Khắc lên tường</button><p style="font-size:12px;opacity:.65;text-align:center">Lời của bạn được lưu trên máy này</p>`, c => c.querySelector('#ok').onclick = () => { const t = c.querySelector('#tm').value.trim(); if (!t) return; const a = OWN(); a.unshift({ t, n: W.player.name }); localStorage.setItem('trian_msgs', JSON.stringify(a.slice(0, 6))); drawWall(); ui.close(); ui.toast('Lời tri ân đã được khắc lên tường'); ST.add('loi'); }); }
// sweep leaves around graves
const leaves = leafPatch(W, { center: [12, -14], radius: 6, count: 50, colors: ['#8a6a3a', '#a07a3a', '#6a5a30'], onDone: () => { stopSweep(); ui.toast('Phần mộ đã sạch sẽ, ấm áp hơn'); ST.add('quet'); setTimeout(() => leaves.reset(), 40000); } });
const rack = broom(); rack.position.set(4.2, 1.2, -8); rack.rotation.z = 0.2; W.scene.add(rack); let held = null;
function stopSweep() { leaves.active = false; W.player.av.sweeping = false; if (held) { held.parent?.remove(held); held = null; } rack.visible = true; sw.label = '🧹 Quét lá quanh mộ'; }
const sw = W.addInteract({ pos: { x: 4.2, z: -7.4 }, r: 1.6, label: '🧹 Quét lá quanh mộ', use: () => { if (leaves.active) return stopSweep(); leaves.active = true; W.player.av.sweeping = true; held = broom(); W.player.av.hand.add(held); rack.visible = false; sw.label = '✋ Cất chổi'; ui.toast('Nhẹ nhàng quét lá quanh các phần mộ'); } });

// actions
ui.button('kg-acts', '💐 Đặt hoa', () => { if (!near) return ui.toast('Hãy lại gần một phần mộ'); flowers(near.x + 0.35, near.z - 0.55, 0.35); bow(W.player.av); S.chime(); ST.add('hoa'); });
ui.button('kg-acts', '🙇 Mặc niệm', () => silence());
ui.button('kg-acts', '📜 Thơ', () => reader(ui, { title: 'Lời tưởng niệm', sub: 'Đọc chậm, nhẹ', lines: ['Các anh đã nằm xuống', 'cho đất nước đứng lên,', 'cho tiếng cười trẻ thơ', 'vang trên mỗi con đường.', 'Hôm nay chúng con về đây,', 'thắp nén hương thơm,', 'lặng lẽ nói lời cảm ơn', 'mà cả đời không nói hết.'], beat: 3.2, onLine: () => S.pluck(220, 0, 0.05), onEnd: () => S.bell(98, 0.12) }));
function silence() { const a = W.player.av; W.frozen = true; a.pray = true; S.stopMusic(); let n = 60; ui.modal(`<h2>Phút mặc niệm</h2><p style="text-align:center;font-size:48px;margin:8px" id="sl">60</p><p style="text-align:center;opacity:.7">Đứng nghiêm, cúi đầu tưởng nhớ</p><button class="kg-btn" id="st" style="width:100%">Kết thúc</button>`, c => { const end = () => { clearInterval(iv); W.frozen = false; a.pray = false; ui.close(); bow(a); S.bell(98, 0.2); ST.add('macniem'); startMusic(); }; c.querySelector('#st').onclick = end; const iv = setInterval(() => { n--; const e = c.querySelector('#sl'); if (e) e.textContent = n; if (n % 15 === 0) S.bell(82, 0.08); if (n <= 0) end(); }, 1000); }); S.bell(82, 0.15); }
const icons = (t, f) => ui.button('kg-icons', t, f);
icons('🗺️', () => mapView(W, ui, [{ label: 'Cổng nghĩa trang', icon: '⛩️', desc: 'Lối vào', pos: [0, 40], yaw: Math.PI }, { label: 'Đài tưởng niệm', icon: '🕯️', desc: 'Dâng hương chung', pos: [0, 5], yaw: Math.PI }, { label: 'Khu mộ', icon: '🪦', desc: 'Thắp hương, đặt hoa, quét lá', pos: [6, -12.5], yaw: Math.PI }, { label: 'Tường tri ân', icon: '✍️', desc: 'Khắc lời tưởng nhớ', pos: [0, -46], yaw: Math.PI }], 'Sơ đồ nghĩa trang'));
icons('📊', () => { const s = ST.s; ui.modal(`<h2>Hành trình tri ân</h2><div style="font-size:15px;line-height:2">🕯️ Nén hương: <b>${s.huong || 0}</b><br>💐 Bó hoa: <b>${s.hoa || 0}</b><br>🙇 Phút mặc niệm: <b>${s.macniem || 0}</b><br>🧹 Quét lá: <b>${s.quet || 0}</b><br>✍️ Lời tri ân: <b>${s.loi || 0}</b></div>`); });
icons('💌', () => shareInvite(ui, { name: W.player.name, text: `${W.player.name} mời bạn cùng thắp một nén hương tri ân các anh hùng liệt sĩ.`, place: 'trian' }));
icons('🔊', b => { if (S.musicOn) { S.stopMusic(); b.textContent = '🔇'; } else { startMusic(); b.textContent = '🔊'; } });
function startMusic() { S.init(); S.music({ scale: [0, 3, 5, 7, 10], root: 196, beat: 1.6, inst: 'flute', gong: 12, rest: 0.5 }); }
const online = () => { const e = document.getElementById('online'); if (e) e.textContent = `${60 + (Math.random() * 25 | 0)} người đang tưởng niệm`; }; online(); setInterval(online, 10000);
setInterval(() => ui.feed(pick([`${pick(NAMES)} vừa thắp hương`, `${pick(NAMES)} đặt một bó hoa cúc trắng`, `${pick(NAMES)} viết lời tri ân`])), 14000);

let amb = false; W.onFirstInput = () => { if (amb) return; amb = true; S.init(); S.ambient('wind', 0.12); startMusic(); };
W.start(); document.getElementById('load').style.opacity = 0; setTimeout(() => document.getElementById('load').remove(), 900);
refGreeting(ui, r => `${r} mời bạn cùng thắp hương tri ân`);
await avatarCreator(W, ui, { key: 'kg_av_trian', title: 'Trang phục viếng', outfits: [{ id: 'trang', label: 'Áo sơ mi trắng', ap: { top: '#f4f1ea', bottom: '#2b2b30', style: 'ao' } }, { id: 'den', label: 'Áo sẫm màu', ap: { top: '#2b2b30', bottom: '#2b2b30', style: 'ao' } }, { id: 'aodai', label: 'Áo dài trắng', ap: { top: '#f4f1ea', bottom: '#f4f1ea', style: 'aodai' } }, { id: 'quandoi', label: 'Quân phục cựu chiến binh', ap: { top: '#5a6a3a', bottom: '#5a6a3a', style: 'quandoi' } }, { id: 'doanvien', label: 'Áo xanh tình nguyện', ap: { top: '#2f7fd0', bottom: '#2b2b30', style: 'ao' } }],
  hats: { none: 'Không', nonla: 'Nón lá' } });
if (!amb) W.onFirstInput();
window.__W = W;
