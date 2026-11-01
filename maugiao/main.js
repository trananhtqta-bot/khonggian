import { THREE, createWorld, makeUI, mesh, mat, rnd, pick, label, Sound, addNPC, makePet, followPet, avatarCreator, mapView, shareInvite, refGreeting, leafPatch, broom, reader, bow, stats, isMobile, begoButton, qrPlaceholder, doneCard, MOVE_TUT, makeAvatar, setNameTag, animateAvatar } from '../shared/engine.js?v=5';

const B = { x0: -8, x1: 8, z0: -24, z1: -12 }; // classroom
const inside = (x, z) => x > B.x0 && x < B.x1 && z > B.z0 && z < B.z1;
const walkable = (x, z) => x > -21 && x < 21 && z > -25 && z < 19;
const W = createWorld({ fog: ['#f6e6c8', 30, 110], sky: ['#8fc6e8', '#fdf0d4', '#fff1c0'], hemi: ['#fff6e0', '#7a8f4a', 1.3], sun: ['#fff0cc', 2.3], sunDir: [18, 30, 22], spawn: [-1.6, 0, 10.5], spawnYaw: Math.PI, saveKey: 'mg', heightAt: (x, z) => inside(x, z) ? 0.15 : 0, walkable, meColor: '#ffd36b' });
const S = W.sound = new Sound();
const ui = W.ui = makeUI({ title: 'Lớp Mẫu Giáo Ngày Xưa', sub: '<span id="phase">Giờ học</span> · <span id="online">…</span>', accent: '#c0392b', panel: '#fff8e8d9', panelSolid: '#fff8e8', glow: '#ffc85a66', footer: '<a href="https://facebook.com/begotrensong" target="_blank" rel="noopener">Bè Gỗ Trên Sông</a>' });
const ST = stats(ui, 'mg');

// ---------- ground ----------
{ const g = new THREE.PlaneGeometry(140, 140, 70, 70); g.rotateX(-Math.PI / 2); const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const yard = x > -21 && x < 21 && z > -25 && z < 19; const n = Math.sin(x * 0.5) * Math.cos(z * 0.6);
    if (yard) c.set(Math.abs(x) < 2.2 && z > -12 ? '#d8c7a4' : n > 0.3 ? '#cdb98e' : '#a6b86a'); else { c.set(n > 0 ? '#86ab55' : '#97b85e'); p.setY(i, Math.max(0, (Math.hypot(x, z) - 40) * 0.25)); }
    c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })); m.receiveShadow = true; W.scene.add(m); }
// fence + gate
{ const N = 4 * 42, im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), mat('#3f7fb5'), N); const m4 = new THREE.Matrix4(); let i = 0;
  const post = (x, z) => { m4.makeTranslation(x, 0.55, z); im.setMatrixAt(i++, m4); };
  for (let x = -21; x <= 21; x += 1) { if (Math.abs(x) > 2) post(x, 19); post(x, -25); } for (let z = -25; z <= 19; z += 1) { post(-21, z); post(21, z); } im.count = i; W.scene.add(im);
  [[-21, 19, 42, 'x'], [-21, -25, 42, 'x']].forEach(() => { });
  const rail = (x, z, w, d) => { const r = mesh(new THREE.BoxGeometry(w, 0.08, d), '#3f7fb5'); r.position.set(x, 0.9, z); W.scene.add(r); }; rail(-11.5, 19, 19, 0.08); rail(11.5, 19, 19, 0.08); rail(0, -25, 42, 0.08); rail(-21, -3, 0.08, 44); rail(21, -3, 0.08, 44);
  // gate arch (fictional school name)
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d'); g.fillStyle = '#fff3d6'; g.fillRect(0, 0, 1024, 160); g.fillStyle = '#c0392b'; g.font = 'bold 64px Georgia,serif'; g.textAlign = 'center'; g.fillText('TRƯỜNG MẪU GIÁO HOA PHƯỢNG', 512, 100); g.fillStyle = '#3f7fb5'; g.font = '30px Georgia'; g.fillText('Bé ngoan · Học giỏi · Vâng lời cô', 512, 145);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const bd = mesh(new THREE.BoxGeometry(6.1, 1.05, 0.12), '#c99a5a'); bd.position.set(0, 3.2, 19); W.scene.add(bd); [1, -1].forEach(sd => { const b = mesh(new THREE.PlaneGeometry(6, 0.95), new THREE.MeshStandardMaterial({ map: t })); b.position.set(0, 3.2, 19 + sd * 0.07); b.rotation.y = sd > 0 ? 0 : Math.PI; W.scene.add(b); }); // readable from both sides, never mirrored
  [-2.6, 2.6].forEach(x => { const p = mesh(new THREE.BoxGeometry(0.5, 3.8, 0.5), '#e8c27a'); p.position.set(x, 1.9, 19); W.scene.add(p); W.addCollider(x, 19, 0.35); }); }

// ---------- classroom building ----------
const roofG = new THREE.Group(), frontWall = new THREE.Group();
{ const wallM = mat('#f2cf6b'), trim = mat('#e9e2cf'); const H = 3.2;
  const wall = (x, z, w, d, grp = W.scene) => { const m = mesh(new THREE.BoxGeometry(w, H, d), wallM); m.position.set(x, H / 2, z); grp.add(m); return m; };
  W.addOccluder(wall(0, B.z0, 16, 0.3), wall(B.x0, -18, 0.3, 12), wall(B.x1, -18, 0.3, 12)); W.addOccluder(frontWall);
  // front wall with door gap x∈[-1.2,1.2] and windows
  wall(-4.6, B.z1, 6.8, 0.3, frontWall); wall(4.6, B.z1, 6.8, 0.3, frontWall); const top = mesh(new THREE.BoxGeometry(2.4, 0.8, 0.3), wallM); top.position.set(0, H - 0.4, B.z1); frontWall.add(top); W.scene.add(frontWall);
  [-5, -2.8, 2.8, 5].forEach(x => { const w = mesh(new THREE.BoxGeometry(1.4, 1.2, 0.34), '#3f7fb5'); w.position.set(x, 1.8, B.z1); frontWall.add(w); });
  W.addBox(0, B.z0, 8, 0.2); W.addBox(B.x0, -18, 0.2, 6); W.addBox(B.x1, -18, 0.2, 6); W.addBox(-4.6, B.z1, 3.4, 0.2); W.addBox(4.6, B.z1, 3.4, 0.2);
  const floor = mesh(new THREE.BoxGeometry(16, 0.15, 12), '#c96f4a'); floor.position.set(0, 0.075, -18); W.scene.add(floor);
  // checker tiles
  const tiles = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.98, 0.98), mat('#e8d6b8'), 100); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); let k = 0; for (let x = -7.5; x < 8; x++) for (let z = -23.5; z < -12; z++) if ((Math.floor(x) + Math.floor(z)) % 2 === 0 && k < 100) { m4.compose(new THREE.Vector3(x, 0.16, z), q, new THREE.Vector3(1, 1, 1)); tiles.setMatrixAt(k++, m4); } tiles.count = k; tiles.receiveShadow = true; W.scene.add(tiles);
  // roof (tiled, hidden when inside)
  const sh = new THREE.Shape(); sh.moveTo(-7.4, 0); sh.lineTo(0, 2.4); sh.lineTo(7.4, 0); sh.lineTo(-7.4, 0); const rg = new THREE.ExtrudeGeometry(sh, { depth: 18, bevelEnabled: false }); rg.translate(0, 0, -9); const roof = mesh(rg, '#b5543a'); roof.rotation.y = Math.PI / 2; roof.position.set(0, H, -18); roofG.add(roof); W.scene.add(roofG);
  // porch
  const porch = mesh(new THREE.BoxGeometry(16, 0.15, 2), '#d9c9a8'); porch.position.set(0, 0.075, -11); W.scene.add(porch);
  for (let x of [-7.5, -2.5, 2.5, 7.5]) { const c = mesh(new THREE.CylinderGeometry(0.15, 0.15, H, 8), trim); c.position.set(x, H / 2, -10.2); W.scene.add(c); W.addCollider(x, -10.2, 0.15); }
  const ov = mesh(new THREE.BoxGeometry(17, 0.15, 2.6), '#a8483a'); ov.position.set(0, H, -10.9); W.scene.add(ov);
  const il = new THREE.PointLight('#fff1d0', 8, 18, 1.4); il.position.set(0, 2.9, -18); W.scene.add(il); W.classLight = il;
  // ceiling fan
  const fan = new THREE.Group(); for (let i = 0; i < 3; i++) { const b = mesh(new THREE.BoxGeometry(1.4, 0.03, 0.18), '#e9e2cf'); b.position.x = 0.7; const h = new THREE.Group(); h.add(b); h.rotation.y = i * 2.09; fan.add(h); } fan.position.set(0, 3, -17); W.scene.add(fan); W.onUpdate(dt => fan.rotation.y += dt * 4);
}
// chalkboard (canvas texture we redraw)
const boardC = document.createElement('canvas'); boardC.width = 1024; boardC.height = 512; const boardT = new THREE.CanvasTexture(boardC); boardT.colorSpace = THREE.SRGBColorSpace;
{ const b = mesh(new THREE.PlaneGeometry(5, 2.5), new THREE.MeshStandardMaterial({ map: boardT, roughness: 0.9 })); b.position.set(0, 1.9, B.z0 + 0.17); W.scene.add(b); const fr = mesh(new THREE.BoxGeometry(5.3, 2.8, 0.06), '#8a5a33'); fr.position.set(0, 1.9, B.z0 + 0.15); W.scene.add(fr);
  const desk = mesh(new THREE.BoxGeometry(1.6, 0.8, 0.8), '#9a6a3a'); desk.position.set(-3.6, 0.55, -21.8); W.scene.add(desk); W.addBox(-3.6, -21.8, 0.8, 0.4); }
function drawBoard(lines, pic) { const g = boardC.getContext('2d'); g.fillStyle = '#25483a'; g.fillRect(0, 0, 1024, 512); g.fillStyle = '#ffffff10'; for (let i = 0; i < 40; i++) g.fillRect(rnd(0, 1024), rnd(0, 512), rnd(20, 120), 3);
  g.fillStyle = '#f4f1e6'; g.font = '40px "Comic Sans MS",cursive'; g.fillText(`Thứ ${pick(['Hai', 'Ba', 'Tư', 'Năm', 'Sáu'])}, ngày ${(Math.random() * 28 | 0) + 1} tháng 9`, 40, 64);
  g.font = 'bold 80px "Comic Sans MS",cursive'; lines.forEach((l, i) => { g.fillStyle = ['#ffe08a', '#f4f1e6', '#ffb3c6'][i % 3]; g.fillText(l, 60, 170 + i * 100); });
  if (pic === 'sun') { g.strokeStyle = '#ffe08a'; g.lineWidth = 6; g.beginPath(); g.arc(840, 260, 70, 0, 7); g.stroke(); for (let a = 0; a < 6.28; a += 0.6) { g.beginPath(); g.moveTo(840 + Math.cos(a) * 90, 260 + Math.sin(a) * 90); g.lineTo(840 + Math.cos(a) * 125, 260 + Math.sin(a) * 125); g.stroke(); } }
  if (pic === 'flower') { g.fillStyle = '#ff8fab'; for (let a = 0; a < 6.28; a += 1.26) { g.beginPath(); g.arc(840 + Math.cos(a) * 50, 280 + Math.sin(a) * 50, 38, 0, 7); g.fill(); } g.fillStyle = '#ffe08a'; g.beginPath(); g.arc(840, 280, 32, 0, 7); g.fill(); }
  if (pic === 'house') { g.strokeStyle = '#f4f1e6'; g.lineWidth = 6; g.strokeRect(760, 240, 160, 130); g.beginPath(); g.moveTo(740, 240); g.lineTo(840, 150); g.lineTo(940, 240); g.stroke(); g.strokeRect(820, 300, 40, 70); }
  boardT.needsUpdate = true; }
const LESSONS = [[['Chữ cái: a ă â', 'a - á - à'], 'sun'], [['Tập đếm: 1 2 3', '🍊🍊🍊 = 3'], 'flower'], [['Bài hát:', 'Cháu đi mẫu giáo'], 'house'], [['Màu sắc:', 'đỏ - vàng - xanh'], 'flower']]; let lessonI = 0; drawBoard(...LESSONS[0]);
// kid desks + seated kids
const classKids = new THREE.Group(); W.scene.add(classKids);
const KIDN = ['Tí', 'Tèo', 'Bin', 'Bống', 'Na', 'Cún', 'Mít', 'Su', 'Bi', 'Gạo', 'Nhím', 'Ốc'];
const kidAp = (i) => ({ skin: pick(['#f6d7b5', '#eec39a', '#e2b48a']), hair: pick(['troc', 'ngan', 'choi', 'ngan']), top: pick(['#ffffff', '#f7f2e6', '#ffd6e0', '#cfe8ff']), bottom: pick(['#2c4a8a', '#c0392b', '#2c4a8a']), style: i % 4 === 1 ? 'yem' : 'ao', hat: i % 5 === 2 ? 'no' : 'none', scale: 0.72 });
const seats = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = -4.5 + c * 3, z = -19.5 + r * 2.4; const d = mesh(new THREE.BoxGeometry(1.8, 0.55, 0.6), '#d9a35a'); d.position.set(x, 0.42, z - 0.55); W.scene.add(d); W.addBox(x, z - 0.55, 0.9, 0.3); const bn = mesh(new THREE.BoxGeometry(1.8, 0.3, 0.35), '#b8803e'); bn.position.set(x, 0.3, z + 0.1); W.scene.add(bn); seats.push([x - 0.45, z], [x + 0.45, z]); }
const kids = []; seats.forEach((s, i) => { if (i === 5) return; if (i % 3 === 2 && isMobile) return; const a = makeAvatar(kidAp(i)); a.seated = true; a.root.position.set(s[0], 0.3, s[1] + 0.1); a.root.rotation.y = Math.PI; setNameTag(a, KIDN[i % 12], '#fff'); classKids.add(a.root); kids.push(a); });
const MYSEAT = seats[5];
// teacher
const teacher = makeAvatar({ skin: '#f3d2b0', hair: 'dai', top: '#e75f7b', bottom: '#f6f1e6', style: 'aodai', hat: 'none' }); setNameTag(teacher, 'Cô Hiền', '#ffe7f0'); teacher.root.position.set(1.8, 0.15, -22.6); W.scene.add(teacher.root); W.addCollider(1.8, -22.6, 0.4);
W.onUpdate((dt, t) => { kids.forEach((k, i) => { animateAvatar(k, dt, 0, t + i); k.head && (k.head.rotation.z = Math.sin(t * 1.5 + i) * 0.08); if (phase === 0 && Math.sin(t * 0.7 + i * 1.7) > 0.97) k.holdUp = true; else if (Math.sin(t * 0.7 + i * 1.7) < 0.5) k.holdUp = false; }); animateAvatar(teacher, dt, 0, t); teacher.root.rotation.y = Math.PI + Math.sin(t * 0.4) * 0.6; teacher.armR.rotation.x = -0.8 + Math.sin(t * 2) * 0.2; });
// classroom decor: bunting
{ const N = 30, im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.15, 0.3, 3), new THREE.MeshStandardMaterial({ color: '#fff' }), N); const m4 = new THREE.Matrix4(), c = new THREE.Color(), e = new THREE.Euler(Math.PI, 0, 0), q = new THREE.Quaternion().setFromEuler(e);
  for (let i = 0; i < N; i++) { const x = -7.5 + i * 0.5, y = 2.9 - Math.sin((i / N) * Math.PI) * 0.4; m4.compose(new THREE.Vector3(x, y + 0.1, -23.6), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(['#e74c3c', '#f1c40f', '#3498db', '#2ecc71'][i % 4])); } W.scene.add(im); }
// bé ngoan chart on side wall
const chartC = document.createElement('canvas'); chartC.width = 512; chartC.height = 512; const chartT = new THREE.CanvasTexture(chartC); chartT.colorSpace = THREE.SRGBColorSpace;
{ const p = mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshStandardMaterial({ map: chartT })); p.position.set(B.x1 - 0.17, 1.8, -19); p.rotation.y = -Math.PI / 2; W.scene.add(p); }

// ---------- schoolyard ----------
// phượng tree
const PHUONG = { x: -9, z: 2 }; { const g = new THREE.Group(); const tr = mesh(new THREE.CylinderGeometry(0.5, 0.8, 4, 9), '#6b5040'); tr.position.y = 2; g.add(tr); [[2.2, 4.5, 0.6], [-2, 4.7, -0.3], [0.3, 5.6, 1], [0.5, 4.3, -2]].forEach(b => { const br = mesh(new THREE.CylinderGeometry(0.15, 0.3, 3, 6), '#6b5040'); br.position.set(b[0] / 2, 3.6, b[2] / 2); br.lookAt(b[0], b[1] + 1, b[2]); br.rotateX(Math.PI / 2); g.add(br); });
  const N = 34, ims = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#fff', flatShading: true, roughness: 0.8 }), N); const m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < N; i++) { const a = rnd(0, 6.28), r = rnd(0, 4.5), s = rnd(0.9, 1.6); m4.makeScale(s, s * 0.6, s).setPosition(Math.cos(a) * r, 5 + rnd(-0.4, 1.4) - r * 0.15, Math.sin(a) * r); ims.setMatrixAt(i, m4); ims.setColorAt(i, c.set(i % 3 ? pick(['#e8382c', '#f04a2a', '#d42b2b']) : '#4f8a3a')); }
  ims.castShadow = true; g.add(ims); g.position.set(PHUONG.x, 0, PHUONG.z); W.scene.add(g); W.addCollider(PHUONG.x, PHUONG.z, 0.9);
  const bench = mesh(new THREE.TorusGeometry(1.6, 0.18, 6, 18), '#bfb39a'); bench.rotation.x = Math.PI / 2; bench.position.set(PHUONG.x, 0.4, PHUONG.z); W.scene.add(bench); }
// falling phượng petals
{ const N = 50, im = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.1, 0.08), new THREE.MeshBasicMaterial({ color: '#e8382c', side: THREE.DoubleSide }), N); const ps = Array.from({ length: N }, () => ({ x: rnd(-5, 5), y: rnd(0, 6), z: rnd(-5, 5), s: rnd(0.3, 0.6) })); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1); im.frustumCulled = false; W.scene.add(im);
  W.onUpdate((dt, t) => { ps.forEach((p, i) => { p.y -= p.s * dt; p.x += Math.sin(t + i) * dt * 0.4; if (p.y < 0.02) { p.y = 6; p.x = rnd(-5, 5); p.z = rnd(-5, 5); } e.set(t * 2 + i, t + i, 0); q.setFromEuler(e); v.set(PHUONG.x + p.x, p.y, PHUONG.z + p.z); m4.compose(v, q, one); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; }); }
// school drum
const DRUM = { x: 9.5, z: -9.6 }; let drumMesh; { const g = new THREE.Group(); [[-0.6, 0], [0.6, 0]].forEach(([x]) => { const l = mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), '#7a3a1a'); l.position.set(x, 0.8, 0); g.add(l); }); drumMesh = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 20), '#b3261e'); drumMesh.rotation.z = Math.PI / 2; drumMesh.position.y = 1.5; g.add(drumMesh);
  [-0.46, 0.46].forEach(x => { const s = mesh(new THREE.CircleGeometry(0.52, 20), '#e9d6a8'); s.position.set(x, 1.5, 0); s.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2; g.add(s); }); g.position.set(DRUM.x, 0, DRUM.z); W.scene.add(g); W.addCollider(DRUM.x, DRUM.z, 0.6); }
// swing
const SWING = { x: 8, z: 4 }; const swingSeat = new THREE.Group(); { const g = new THREE.Group(); [[-1.2, -0.4], [-1.2, 0.4], [1.2, -0.4], [1.2, 0.4]].forEach(([x, z]) => { const l = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 6), '#e74c3c'); l.position.set(x, 1.35, z * 0.5); l.rotation.x = z * 0.25; g.add(l); }); const top = mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), '#e74c3c'); top.rotation.z = Math.PI / 2; top.position.y = 2.7; g.add(top);
  swingSeat.position.y = 2.7; [-0.3, 0.3].forEach(x => { const r = mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.2, 4), '#888'); r.position.set(x, -1.1, 0); swingSeat.add(r); }); const s = mesh(new THREE.BoxGeometry(0.75, 0.06, 0.32), '#f1c40f'); s.position.y = -2.2; swingSeat.add(s); g.add(swingSeat); g.position.set(SWING.x, 0, SWING.z); W.scene.add(g); [-1.2, 1.2].forEach(x => W.addCollider(SWING.x + x, SWING.z, 0.2)); }
// slide
const SLIDE = { x: 13, z: -2 }; { const g = new THREE.Group(); const lad = mesh(new THREE.BoxGeometry(0.8, 2, 0.1), '#3498db'); lad.position.set(0, 1, 1.4); lad.rotation.x = -0.25; g.add(lad); const pl = mesh(new THREE.BoxGeometry(0.9, 0.1, 0.9), '#f1c40f'); pl.position.set(0, 1.9, 0.9); g.add(pl); const sl = mesh(new THREE.BoxGeometry(0.8, 0.08, 3.2), '#2ecc71'); sl.position.set(0, 1, -0.6); sl.rotation.x = -0.6; g.add(sl); g.position.set(SLIDE.x, 0, SLIDE.z); W.scene.add(g); W.addBox(SLIDE.x, SLIDE.z, 0.5, 1.6); }
// sandbox
const SAND = { x: -13, z: 11 }; { const s = mesh(new THREE.BoxGeometry(4, 0.2, 3), '#e8d29a'); s.position.set(SAND.x, 0.1, SAND.z); W.scene.add(s); const castle = mesh(new THREE.ConeGeometry(0.4, 0.6, 6), '#d9bf80'); castle.position.set(SAND.x + 0.8, 0.5, SAND.z); W.scene.add(castle); }
// flower bed + watering
const BED = { x: -14, z: -6 }; const flowers = []; { const bed = mesh(new THREE.BoxGeometry(5, 0.3, 2), '#7a5a3a'); bed.position.set(BED.x, 0.15, BED.z); W.scene.add(bed); W.addBox(BED.x, BED.z, 2.5, 1);
  for (let i = 0; i < 10; i++) { const f = new THREE.Group(); const st = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), '#3e7a2a'); st.position.y = 0.25; f.add(st); const h = mesh(new THREE.SphereGeometry(0.12, 8, 6), pick(['#ff6b8b', '#ffd93b', '#ff8c42', '#c77dff'])); h.position.y = 0.52; f.add(h); f.position.set(BED.x - 2 + (i % 5) * 1, 0.3, BED.z - 0.5 + Math.floor(i / 5)); f.scale.setScalar(0.4); W.scene.add(f); flowers.push(f); } }
// lunch tables under porch roof extension
const LUNCH = { x: -13, z: -16 }; { for (let i = 0; i < 2; i++) { const t = mesh(new THREE.BoxGeometry(3, 0.1, 1.2), '#c99a5a'); t.position.set(LUNCH.x, 0.6, LUNCH.z + i * 2.6); W.scene.add(t); W.addBox(LUNCH.x, LUNCH.z + i * 2.6, 1.5, 0.6); for (let k = 0; k < 3; k++) { const bw = mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.12, 10), '#f6f1e6'); bw.position.set(LUNCH.x - 1 + k, 0.71, LUNCH.z + i * 2.6); W.scene.add(bw); } }
  const tent = mesh(new THREE.BoxGeometry(5, 0.1, 6), '#2f7d5a'); tent.position.set(LUNCH.x, 2.6, LUNCH.z + 1.3); W.scene.add(tent); [[-2.4, -1.6], [2.4, -1.6], [-2.4, 4.2], [2.4, 4.2]].forEach(([x, z]) => { const p = mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), '#ddd'); p.position.set(LUNCH.x + x, 1.3, LUNCH.z + z); W.scene.add(p); }); }
// flag pole
{ const p = mesh(new THREE.CylinderGeometry(0.06, 0.08, 7, 8), '#ddd'); p.position.set(0, 3.5, 6); W.scene.add(p); W.addCollider(0, 6, 0.3); const fc = document.createElement('canvas'); fc.width = 120; fc.height = 80; const g = fc.getContext('2d'); g.fillStyle = '#da251d'; g.fillRect(0, 0, 120, 80); g.fillStyle = '#ffde00'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; g.lineTo(60 + Math.cos(a) * 26, 40 + Math.sin(a) * 26); } g.fill();
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace; const fg = new THREE.PlaneGeometry(1.5, 1, 10, 1); fg.translate(0.75, 0, 0); const f = mesh(fg, new THREE.MeshStandardMaterial({ map: ft, side: THREE.DoubleSide })); f.position.set(0.06, 6.4, 6); W.scene.add(f); const fp = fg.attributes.position, base = Float32Array.from(fp.array); W.onUpdate((dt, t) => { for (let i = 0; i < fp.count; i++) { const x = base[i * 3]; fp.setZ(i, Math.sin(x * 3 - t * 4) * 0.12 * x); } fp.needsUpdate = true; }); }
// trees around + houses beyond fence
{ const N = 26; const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.25, 2, 6), mat('#6b4b2f'), N), lf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.3, 1), new THREE.MeshStandardMaterial({ color: '#fff', flatShading: true }), N); const m4 = new THREE.Matrix4(), c = new THREE.Color();
  for (let i = 0; i < N; i++) { const a = i / N * 6.28, r = rnd(26, 38), x = Math.cos(a) * r, z = Math.sin(a) * r * 0.9; m4.makeTranslation(x, 1, z); tr.setMatrixAt(i, m4); m4.makeTranslation(x, 2.6, z); lf.setMatrixAt(i, m4); lf.setColorAt(i, c.set(pick(['#5e8a46', '#6f9a4e', '#4f7a3e']))); } W.scene.add(tr, lf);
  for (let i = 0; i < 8; i++) { const x = -35 + i * 10, z = 30 + rnd(0, 6); const h = mesh(new THREE.BoxGeometry(5, rnd(3, 6), 5), pick(['#f2e3c6', '#e8d0a8', '#d9e3cf', '#f3d6c6'])); h.position.set(x, h.geometry.parameters.height / 2, z); W.scene.add(h); const r = mesh(new THREE.ConeGeometry(4, 1.6, 4), '#b5543a'); r.rotation.y = Math.PI / 4; r.position.set(x, h.geometry.parameters.height + 0.8, z); W.scene.add(r); } }

// ---------- yard NPC kids ----------
const yardKids = []; for (let i = 0; i < (isMobile ? 6 : 9); i++) { const n = addNPC(W, { name: KIDN[(i + 3) % 12], ap: kidAp(i + 7), area: [-18, 18, -8, 16], spots: [[SAND.x, SAND.z + 1.6, Math.PI, 'stand'], [PHUONG.x + 1.8, PHUONG.z, -Math.PI / 2, 'sit'], [SWING.x, SWING.z + 2, Math.PI, 'stand']], speed: 1.6, pet: i === 1 ? 'chick' : null }); yardKids.push(n); }

// ---------- phases ----------
let phase = 0; const PH = [{ n: 'Giờ học', sky: 1, light: 1 }, { n: 'Giờ ra chơi', sky: 1, light: 1 }, { n: 'Giờ ăn trưa', sky: 1, light: 0.9 }, { n: 'Giờ ngủ trưa', sky: 0.55, light: 0.35 }];
function setPhase(p) { phase = p % 4; document.getElementById('phase').textContent = PH[phase].n; classKids.visible = phase === 0 || phase === 3; kids.forEach(k => { k.seated = phase === 0; k.root.rotation.x = phase === 3 ? -1.2 : 0; k.root.position.y = phase === 3 ? 0.6 : 0.3; }); yardKids.forEach(n => n.av.root.visible = phase === 1 || phase === 2);
  W.hemi && (W.hemi.intensity = 1.3 * PH[phase].light); W.sun && (W.sun.intensity = 2.3 * PH[phase].light); W.classLight.intensity = phase === 3 ? 1.5 : 8;
  if (phase === 0) { lessonI = (lessonI + 1) % LESSONS.length; drawBoard(...LESSONS[lessonI]); }
  ui.toast({ 0: '🥁 Tùng tùng tùng! Vào lớp thôi các bé', 1: '🥁 Ra chơi! Xích đu, cầu trượt, hộp cát đang chờ', 2: '🍚 Giờ ăn trưa · ra bàn ăn dưới mái che', 3: '😴 Giờ ngủ trưa · cả lớp nằm ngủ, suỵt…' }[phase], 3500);
  if (phase === 3) { S.stopMusic(); S.music({ scale: [0, 2, 4, 7, 9], root: 261.6, beat: 1.4, inst: 'pluck', rest: 0.6 }); } else startMusic(); }
let phaseT = 0; W.onUpdate(dt => { phaseT += dt; if (phaseT > 75) { phaseT = 0; drumRoll(); setPhase(phase + 1); } });
function drumRoll() { [0, 0.5, 1.0].forEach(d => setTimeout(() => { S.drum(); drumMesh.scale.set(1.08, 1, 1.08); setTimeout(() => drumMesh.scale.set(1, 1, 1), 120); }, d * 1000)); }

// ---------- stickers (bông hoa bé ngoan) ----------
const flowersSt = () => ST.s.hoa || 0;
function giveFlower(why) { ST.add('hoa'); drawChart(); S.chime(); doneCard(ui, { icon: '🌸', title: 'Cô tặng bé 1 bông hoa', msg: `Vì bé ${why}. Bé có ${ST.s.hoa || 0} bông hoa bé ngoan rồi!` }); ui.feed(`${W.player.name} được bông hoa bé ngoan`); }
function drawChart() { const g = chartC.getContext('2d'); g.fillStyle = '#fff8e6'; g.fillRect(0, 0, 512, 512); g.fillStyle = '#c0392b'; g.font = 'bold 44px Georgia'; g.textAlign = 'center'; g.fillText('BÉ NGOAN', 256, 60); g.textAlign = 'left'; g.font = '28px Georgia'; const names = [W.player.name || 'Bé', ...KIDN.slice(0, 5)];
  names.forEach((n, i) => { g.fillStyle = '#333'; g.fillText(n, 20, 120 + i * 66); const k = i === 0 ? Math.min(10, flowersSt()) : (i * 3 + 2) % 7; for (let j = 0; j < k; j++) { g.fillStyle = ['#ff6b8b', '#ff8c42', '#ffd93b'][j % 3]; g.beginPath(); g.arc(180 + j * 32, 110 + i * 66, 12, 0, 7); g.fill(); } }); chartT.needsUpdate = true; }

// ---------- pet ----------
let myPet = null; W.setPet = k => { if (myPet) W.scene.remove(myPet.root); myPet = k && k !== 'none' ? makePet(k) : null; if (myPet) { myPet.root.position.copy(W.player.pos); W.scene.add(myPet.root); } }; W.onUpdate(dt => myPet && followPet(myPet, W.player.pos, W.player.yaw, dt, W));

// ---------- interactions ----------
W.addInteract({ pos: DRUM, r: 2.4, label: '🥁 Đánh trống trường', use: () => { drumRoll(); phaseT = 0; setTimeout(() => setPhase(phase + 1), 1200); ST.add('trong'); } });
W.addInteract({ pos: { x: MYSEAT[0], z: MYSEAT[1] }, r: 1.1, label: '🪑 Ngồi vào chỗ', use: () => { W.sit(new THREE.Vector3(MYSEAT[0], 0.3, MYSEAT[1] + 0.1), Math.PI); if (phase === 0) { ui.toast('Khoanh tay lên bàn, nhìn lên bảng nào!'); setTimeout(() => giveFlower('ngồi học ngoan'), 6000); } } });
W.addInteract({ pos: { x: 1.8, z: -21.4 }, r: 1.8, label: '🙋 Chào cô', use: () => { bow(W.player.av); S.pluck(784); ui.toast('“Con chào cô ạ!” · Cô Hiền mỉm cười'); teacher.holdUp = true; setTimeout(() => teacher.holdUp = false, 1500); } });
let swinging = false; W.addInteract({ pos: { x: SWING.x, z: SWING.z + 0.6 }, r: 1.6, label: '🌀 Chơi xích đu', use: () => { swinging = !swinging; if (swinging) { W.sit(new THREE.Vector3(SWING.x, 0.45, SWING.z), Math.PI); S.sweep(); ST.add('xichdu'); } else W.standUp(); } });
W.onUpdate((dt, t) => { const a = swinging && W.player.av.seated ? Math.sin(t * 2.2) * 0.5 : swingSeat.rotation.x * (1 - dt * 2); swingSeat.rotation.x = a; if (swinging) { if (!W.player.av.seated) swinging = false; else { W.player.pos.set(SWING.x, 2.7 - Math.cos(a) * 2.25, SWING.z + Math.sin(a) * 2.25); } } });
let sliding = 0; W.addInteract({ pos: { x: SLIDE.x, z: SLIDE.z + 2.4 }, r: 1.6, label: '🛝 Cầu trượt', use: () => { sliding = 0.001; S.sweep(); ST.add('cautruot'); } });
W.onUpdate(dt => { if (!sliding) return; sliding += dt; const P = W.player; W.frozen = true; const k = sliding; if (k < 0.8) P.pos.set(SLIDE.x, k / 0.8 * 1.95, SLIDE.z + 1.8 - k / 0.8 * 0.9); else if (k < 1.8) { const u = (k - 0.8); P.av.seated = true; P.pos.set(SLIDE.x, 1.95 - u * 1.9, SLIDE.z + 0.9 - u * 3.1); P.yaw = Math.PI; } else { sliding = 0; W.frozen = false; P.av.seated = false; P.pos.set(SLIDE.x, 0, SLIDE.z - 2.6); ui.toast('Vèoooo! 😆'); } });
W.addInteract({ pos: SAND, r: 2.6, label: '🏖️ Xây lâu đài cát', use: () => { const c = mesh(new THREE.ConeGeometry(rnd(0.2, 0.4), rnd(0.4, 0.8), 6), '#d9bf80'); c.position.set(SAND.x + rnd(-1.6, 1.6), 0.4, SAND.z + rnd(-1, 1)); W.scene.add(c); bow(W.player.av); S.pluck(392); } });
W.addInteract({ pos: { x: LUNCH.x + 2, z: LUNCH.z }, r: 2.4, label: '🍚 Ăn cơm', use: () => { W.sit(new THREE.Vector3(LUNCH.x + 0.2, 0, LUNCH.z + 0.8), Math.PI); ui.toast(phase === 2 ? 'Cơm canh rau ngót, thịt kho trứng… ngon quá! 🍲' : 'Chưa tới giờ ăn đâu nha, lén ăn bánh quy thôi 🍪'); if (phase === 2) setTimeout(() => giveFlower('ăn hết suất cơm'), 4000); } });
// watering chore
let can = null; const waterI = W.addInteract({ pos: { x: BED.x + 3.2, z: BED.z }, r: 2.2, label: '🚿 Tưới cây', use: () => { if (can) return; can = new THREE.Group(); const b = mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.3, 10), '#3fa34d'); can.add(b); const sp = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), '#3fa34d'); sp.rotation.z = 1; sp.position.set(0.2, 0.08, 0); can.add(sp); W.player.av.hand.add(can); W.player.av.holdUp = true;
  let k = 0; const grow = setInterval(() => { flowers.forEach(f => f.scale.setScalar(Math.min(1.2, f.scale.x + 0.08))); S.noise(0.3, 0.05, 2000); if (++k > 10) { clearInterval(grow); W.player.av.hand.remove(can); can = null; W.player.av.holdUp = false; giveFlower('tưới cây chăm chỉ'); setTimeout(() => flowers.forEach(f => f.scale.setScalar(0.4)), 40000); } }, 400); } });
// sweeping chore (paper scraps inside classroom)
const scraps = leafPatch(W, { center: [0, -15], radius: 3, count: 40, y: 0.17, colors: ['#ffffff', '#ffe08a', '#ffb3c6', '#cfe8ff'], onDone: () => { stopSweep(); giveFlower('quét lớp sạch sẽ'); setTimeout(() => scraps.reset(), 40000); } });
const rack = broom(); rack.position.set(-7.4, 1.2, -13); rack.rotation.z = 0.2; W.scene.add(rack); let held = null;
function stopSweep() { scraps.active = false; W.player.av.sweeping = false; if (held) { held.parent?.remove(held); held = null; } rack.visible = true; sweepI.label = '🧹 Trực nhật · quét lớp'; }
const sweepI = W.addInteract({ pos: { x: -6.8, z: -13.4 }, r: 1.6, label: '🧹 Trực nhật · quét lớp', use: () => { if (scraps.active) return stopSweep(); scraps.active = true; W.player.av.sweeping = true; held = broom(); W.player.av.hand.add(held); rack.visible = false; sweepI.label = '✋ Cất chổi'; ui.toast(`Quét ${scraps.left} mẩu giấy vụn trong lớp nhé`); } });

// ---------- inside view handling ----------
let wasIn = false; W.onUpdate(() => { const P = W.player, i = inside(P.pos.x, P.pos.z) || (P.pos.z < -10 && Math.abs(P.pos.x) < 8.5 && P.pos.z > -24); if (i !== wasIn) { wasIn = i; roofG.visible = !i; frontWall.children.forEach(m => { m.material = m.material.clone(); m.material.transparent = i; m.material.opacity = i ? 0.25 : 1; }); P.camDist = i ? 4.6 : (isMobile ? 7.2 : 6.5); P.camPitch = i ? 0.6 : 0.34; } });
W.camLimit = (c, t) => { if (wasIn) { c.x = Math.max(B.x0 + 0.4, Math.min(B.x1 - 0.4, c.x)); c.z = Math.min(B.z1 - 0.4, Math.max(B.z0 + 0.4, c.z)); c.y = Math.min(c.y, 3.0); } };

// ---------- action bar ----------
const DONGDAO = { 'Nu na nu nống': ['Nu na nu nống', 'Cái cống nằm trong', 'Cái ong nằm ngoài', 'Củ khoai chấm mật', 'Phật ngồi Phật khóc', 'Con cóc nhảy ra', 'Con gà ú ụ', 'Nhà mụ thổi xôi', 'Nhà tôi nấu chè', 'Tè he chân rụt!'], 'Chi chi chành chành': ['Chi chi chành chành', 'Cái đanh thổi lửa', 'Con ngựa chết trương', 'Ba vương ngũ đế', 'Bắt dế đi tìm', 'Ù à ù ập!'], 'Dung dăng dung dẻ': ['Dung dăng dung dẻ', 'Dắt trẻ đi chơi', 'Đến ngõ nhà trời', 'Lạy cậu lạy mợ', 'Cho cháu về quê', 'Cho dê đi học', 'Cho cóc ở nhà', 'Cho gà bới bếp', 'Ngồi xệp xuống đây!'], 'Rồng rắn lên mây': ['Rồng rắn lên mây', 'Có cây lúc lắc', 'Hỏi thăm thầy thuốc', 'Có nhà hay không?'] };
ui.button('kg-acts', '🎵 Đồng dao', () => ui.modal(`<h2>Hát đồng dao</h2>${Object.keys(DONGDAO).map(k => `<button class="kg-btn" data-k="${k}" style="width:100%;margin:4px 0">${k}</button>`).join('')}`, c => c.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { ui.close(); const k = b.dataset.k; let n = 0; reader(ui, { title: k, sub: 'Vỗ tay theo nhịp nào! 👏', lines: DONGDAO[k], beat: 1.6, onLine: () => { S.pluck([523, 587, 659, 784, 880][n++ % 5]); S.drum(0.3); W.player.av.holdUp = !W.player.av.holdUp; }, onEnd: () => { W.player.av.holdUp = false; ST.add('dongdao'); if ((ST.s.dongdao || 0) % 2 === 1) giveFlower('thuộc bài đồng dao'); } }); })));
ui.button('kg-acts', '🙋 Giơ tay', () => { const a = W.player.av; a.holdUp = true; S.pluck(880); setTimeout(() => a.holdUp = false, 1600); if (phase === 0 && W.player.av.seated) { ui.toast('Cô gọi bé lên… trả lời đúng rồi! 👏'); setTimeout(() => giveFlower('phát biểu xây dựng bài'), 1500); } });
ui.button('kg-acts', '👏 Vỗ tay', () => { bow(W.player.av); [0, 200, 400].forEach(d => setTimeout(() => S.noise(0.05, 0.25, 3000), d)); });
const icons = (t, l, f) => ui.button('kg-icons', `<span>${t}</span><small>${l}</small>`, f);
icons('🗺️', 'Sơ đồ', () => mapView(W, ui, [{ label: 'Cổng trường', desc: 'Nơi mẹ đưa bé tới', icon: '🏫', pos: [-1.6, 10.5], yaw: Math.PI }, { label: 'Lớp học', desc: 'Bảng đen, bàn ghế, cô Hiền', icon: '📚', pos: [0, -16.6], yaw: Math.PI }, { label: 'Gốc phượng', desc: 'Ghế đá dưới tán hoa đỏ', icon: '🌳', pos: [PHUONG.x + 2.4, PHUONG.z + 2], yaw: -2.3 }, { label: 'Sân chơi', desc: 'Xích đu, cầu trượt', icon: '🛝', pos: [SWING.x + 1, SWING.z + 3], yaw: Math.PI }, { label: 'Trống trường', desc: 'Đánh trống chuyển giờ', icon: '🥁', pos: [DRUM.x, DRUM.z + 2], yaw: Math.PI }, { label: 'Vườn hoa & bàn ăn', desc: 'Tưới cây, ăn trưa', icon: '🌼', pos: [BED.x + 3.5, BED.z + 2], yaw: Math.PI }], 'Sơ đồ trường'));
icons('🌸', 'Hoa bé ngoan', () => { drawChart(); ui.modal(`<h2>Bông hoa bé ngoan</h2><p style="text-align:center;font-size:40px;margin:6px">${'🌸'.repeat(Math.min(10, flowersSt())) || '·'}</p><p style="text-align:center">Bé có <b>${flowersSt()}</b> bông · ${flowersSt() >= 10 ? 'Phiếu bé ngoan tuần này! 🎖️' : `còn ${10 - flowersSt()} bông nữa là được phiếu bé ngoan`}</p><p style="font-size:13px;opacity:.7;text-align:center">Kiếm hoa: ngồi học, giơ tay, hát đồng dao, tưới cây, trực nhật, ăn hết cơm</p>`); });
icons('💌', 'Mời bạn', () => shareInvite(ui, { name: W.player.name, text: `${W.player.name} rủ bạn về lại lớp mẫu giáo ngày xưa · đánh trống trường, hát Nu na nu nống!`, place: 'maugiao' }));
icons('🎁', 'Ủng hộ', () => ui.modal(`<h2>Ủng hộ Bè Gỗ</h2><p style="text-align:center">Thích lớp học này? Mời cô nuôi một ly trà đá 🧋</p>${qrPlaceholder('Mã QR SePay sẽ được cập nhật tại đây trong thời gian tới')}<p style="text-align:center;font-size:14px;opacity:.75">Hoàn toàn tự nguyện</p>${begoButton()}`));
icons('🔊', 'Âm thanh', b => { if (S.musicOn) { S.stopMusic(); b.firstChild.textContent = '🔇'; } else { startMusic(); b.firstChild.textContent = '🔊'; } });
function startMusic() { S.init(); S.stopMusic(); S.music({ scale: [0, 2, 4, 7, 9], root: 392, beat: 0.42, inst: 'pluck', rest: 0.25 }); }

const online = () => { const e = document.getElementById('online'); if (e) e.textContent = `${90 + (Math.random() * 30 | 0)} bạn cùng lớp online`; }; online(); setInterval(online, 9000);
setInterval(() => { const n = pick(['Tí', 'Tèo', 'Bống', 'Na', 'Mít', 'Gạo']) + ' (' + pick(['Hà Nội', 'Huế', 'Sài Gòn', 'Cần Thơ', 'Đà Nẵng']) + ')'; ui.feed(pick([`${n} vừa đánh trống trường`, `${n} được bông hoa bé ngoan 🌸`, `${n} đang hát Chi chi chành chành`, `${n} vừa trượt cầu trượt`])); }, 10000);

let amb = false; W.onFirstInput = () => { if (amb) return; amb = true; S.init(); S.ambient('birds', 0.12); startMusic(); };
W.start(); document.getElementById('load').style.opacity = 0; setTimeout(() => document.getElementById('load').remove(), 700);
refGreeting(ui, r => `${r} rủ bạn về lớp mẫu giáo ngày xưa 🎒`);
await avatarCreator(W, ui, { key: 'kg_av_mg', title: 'Chuẩn bị đi học nào!', outfits: [{ id: 'dongphuc', label: 'Áo trắng quần xanh', ap: { top: '#ffffff', bottom: '#2c4a8a', style: 'ao' } }, { id: 'yem', label: 'Áo yếm đỏ', ap: { top: '#c0392b', bottom: '#f6f1e6', style: 'yem' } }, { id: 'hong', label: 'Váy hồng', ap: { top: '#ffb3c6', bottom: '#ffb3c6', style: 'aodai' } }, { id: 'kesoc', label: 'Áo kẻ sọc', ap: { top: '#7fb3e0', bottom: '#5a4632', style: 'ao' } }, { id: 'cogiao', label: 'Áo dài cô giáo', ap: { top: '#e75f7b', bottom: '#f6f1e6', style: 'aodai' } }],
  hats: { none: 'Không', tai_beo: 'Mũ tai bèo', no: 'Nơ cài tóc' }, hairs: { troc: 'Đầu trọc', ngan: 'Tóc ngắn', choi: 'Hai búi', dai: 'Tóc dài' }, pets: { none: 'Không', cat: 'Mèo mướp', chick: 'Gà con' }, defaults: { scale: 0.85 } });
if (!amb) W.onFirstInput(); drawChart(); setPhase(0);
W.restorePos(); ui.tutorial('move', MOVE_TUT);
window.__W = W;
