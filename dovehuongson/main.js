import { THREE, createWorld, makeUI, mesh, mat, rnd, pick, label, waterMaterial, Sound, addNPC, makePet, followPet, avatarCreator, mapView, shareInvite, refGreeting, leafPatch, broom, beadsView, bow, stats, isMobile, doneCard, MOVE_TUT, LIVE } from '../shared/engine.js?v=21';
import { dailyTasks } from '../shared/daily.js?v=21';

// ---------- terrain ----------
const riverX = z => 6 * Math.sin(z * 0.035) + 2 * Math.sin(z * 0.11);
const RW = 4.6;
const PAG = { x: 0, z: -82 }; // pagoda courtyard centre
function ground(x, z) {
  const d = Math.abs(x - riverX(z)); let h = d < RW ? -0.7 * (1 - (d / RW) ** 2) - 0.05 : Math.min(0.25, (d - RW) * 0.3);
  if (z < -68) h = Math.max(h, z < -70 ? 0.25 : h); // pagoda land (no river beyond -70)
  h += Math.max(0, Math.abs(x) - 24) * 0.6 + Math.max(0, z - 74) * 0.6 + Math.max(0, -104 - z) * 0.6;
  if (Math.abs(x - PAG.x) < 7 && z < -88 && z > -99) h = 0.95; // hall platform
  return h;
}
const karstCols = [];
const walkable = (x, z) => ground(x, z) > -0.02 && Math.abs(x) < 26 && z < 74 && z > -103 && !karstCols.some(k => Math.hypot(x - k[0], z - k[1]) < k[2]);
const W = createWorld({ fog: ['#c9d6cf', 25, 150], sky: ['#9fc3d6', '#e9eadf', '#fff4dc'], hemi: ['#f4f1e4', '#5d7a52', 1.2], sun: ['#fff1d6', 2.4], sunDir: [-25, 35, 15], spawn: [12, 0, 62], spawnYaw: Math.PI, saveKey: 'huong', heightAt: (x, z) => Math.max(0, ground(x, z)), walkable, meColor: '#ffd36b' });
const S = W.sound = new Sound();
const ui = W.ui = makeUI({ title: 'Đò về Hương Sơn', sub: 'Trẩy hội non nước<br><small style="font-size:18px;opacity:1">Trải nghiệm mô phỏng văn hóa, không thay thế nghi lễ thật</small>', accent: '#9c3420', panel: '#fbf5e8d9', panelSolid: '#fbf5e8', glow: '#f2c46a66' });
const ST = stats(ui, 'huong');

{ // terrain mesh
  const g = new THREE.PlaneGeometry(90, 200, 90, 200); g.rotateX(-Math.PI / 2); g.translate(0, 0, -15);
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = ground(x, z); p.setY(i, h);
    const n = Math.sin(x * 0.7) * Math.sin(z * 0.5) + Math.sin(x * 0.23 + z * 0.31);
    if (h < -0.05) c.set('#6e7f5f'); else if (z < -70 && Math.abs(x) < 13) c.set('#b9ad94'); else if (Math.abs(x - riverX(z)) < RW + 1.2) c.set('#8fa36a'); else c.set(n > 0.6 ? '#a9c27a' : n > -0.2 ? '#7fa65a' : '#9db86c');
    c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.04); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })); m.receiveShadow = true; W.scene.add(m);
  const wm = waterMaterial('#3e7a6c', '#9cc8b4', 0.9); const w = new THREE.Mesh(new THREE.PlaneGeometry(90, 160), wm); w.rotation.x = -Math.PI / 2; w.position.set(0, -0.12, 5); W.scene.add(w); W.onUpdate((dt, t) => wm.uniforms.t.value = t);
}
// ---------- karst mountains (núi đá vôi) ----------
function karst(x, z, r, h, seed) {
  const g = new THREE.IcosahedronGeometry(1, 3); const p = g.attributes.position; const col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { let X = p.getX(i), Y = p.getY(i), Z = p.getZ(i); const n = 1 + 0.18 * Math.sin(X * 5 + seed) * Math.sin(Z * 4 + seed * 2) + 0.12 * Math.sin(Y * 7 + seed);
    const taper = Y > 0 ? 1 - Y * 0.45 : 1; X *= n * taper; Z *= n * taper; p.setXYZ(i, X, Y, Z);
    const green = Y > 0.3 || Math.sin(X * 9 + Z * 7 + seed) > 0.35; c.set(green ? (Y > 0.6 ? '#5f7f4a' : '#6f8d55') : (Math.sin(Y * 12 + seed) > 0 ? '#9a9a8c' : '#aaa79a')); c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.06); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })); m.scale.set(r, h, r); m.position.set(x, h * 0.55 - 1, z); m.castShadow = !isMobile; m.receiveShadow = true; W.scene.add(m);
  if (Math.abs(x) < 30) karstCols.push([x, z, r * 0.95]);
}
let seed = 1; const KS = [[-19, 50, 6, 18], [20, 40, 7, 24], [-20, 20, 7, 22], [21, 8, 6, 17], [-19, -10, 6, 26], [19, -25, 8, 21], [-21, -38, 6, 19], [20, -55, 7, 25], [-24, -70, 7, 28], [15, -105, 10, 30], [-14, -108, 9, 26], [0, -118, 12, 34], [36, 20, 10, 32], [-38, -20, 11, 36], [38, -60, 10, 30], [-36, 60, 9, 28], [30, 70, 8, 22], [-30, -95, 9, 30], [32, -92, 9, 26]];
KS.forEach(k => karst(k[0], k[1], k[2], k[3], seed++));
for (let i = 0; i < 26; i++) { const z = rnd(-150, 120), s = Math.random() < 0.5 ? -1 : 1; karst(s * rnd(50, 95), z, rnd(8, 15), rnd(25, 50), seed++); }

// ---------- vegetation: trees, lotus, rice ----------
{ const trunkG = new THREE.CylinderGeometry(0.12, 0.18, 1.6, 6), leafG = new THREE.IcosahedronGeometry(1, 1); const N = isMobile ? 70 : 120;
  const tr = new THREE.InstancedMesh(trunkG, mat('#6b4b2f'), N), lf = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }), N); const m4 = new THREE.Matrix4(), c = new THREE.Color(); let i = 0;
  while (i < N) { const x = rnd(-26, 26), z = rnd(-102, 72); if (!walkable(x, z) || Math.abs(x - riverX(z)) < RW + 2 || (z < -66 && Math.abs(x) < 12) || (z > 52 && Math.abs(x - 12) < 6)) continue; const s = rnd(0.8, 1.5);
    m4.makeScale(s, s, s).setPosition(x, 0.8 * s, z); tr.setMatrixAt(i, m4); m4.makeScale(s * 1.3, s * 1.1, s * 1.3).setPosition(x, 2 * s, z); lf.setMatrixAt(i, m4); lf.setColorAt(i, c.set(pick(['#5e8a46', '#6f9a4e', '#4f7a3e', '#7ca356']))); i++; }
  tr.castShadow = lf.castShadow = true; W.scene.add(tr, lf); }
const lotusPads = []; { const padG = new THREE.CircleGeometry(0.35, 10), N = 90; const pads = new THREE.InstancedMesh(padG, mat('#4f7f3c', { side: THREE.DoubleSide }), N), fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 8, 6), mat('#f19bb5', { emissive: '#5a1a2a', emissiveIntensity: 0.2 }), 40); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < N; i++) { const z = rnd(-66, 70), x = riverX(z) + (Math.random() < 0.5 ? -1 : 1) * rnd(2.6, RW - 0.2); q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); m4.compose(new THREE.Vector3(x, -0.1, z), q, new THREE.Vector3(1, 1, 1)); pads.setMatrixAt(i, m4); if (i < 40) { m4.makeScale(1, 1.3, 1).setPosition(x, 0.05, z); fl.setMatrixAt(i, m4); } }
  W.scene.add(pads, fl); }

// ---------- boats (đò) ----------
function makeBoat() { const g = new THREE.Group(); const hull = new THREE.Shape(); hull.moveTo(-0.55, 0); hull.quadraticCurveTo(0, -0.05, 0.55, 0); hull.lineTo(0.42, -0.32); hull.quadraticCurveTo(0, -0.4, -0.42, -0.32); hull.closePath();
  const hg = new THREE.ExtrudeGeometry(hull, { depth: 4.2, bevelEnabled: false }); hg.translate(0, 0.25, -2.1); const hp = hg.attributes.position; for (let i = 0; i < hp.count; i++) { const z = hp.getZ(i), k = 1 - Math.pow(Math.abs(z) / 2.1, 3) * 0.7; hp.setX(i, hp.getX(i) * k); hp.setY(i, hp.getY(i) + Math.pow(Math.abs(z) / 2.1, 2) * 0.25); } hg.computeVertexNormals();
  g.add(mesh(hg, '#6a4426', { roughness: 0.7 })); for (let z of [-1.2, 0, 1.2]) { const b = mesh(new THREE.BoxGeometry(0.9, 0.05, 0.25), '#8a5a33'); b.position.set(0, 0.2, z); g.add(b); } return g; }
function makeRower(ap) { return makeNPCav({ skin: '#d9a77c', hair: 'bui', top: '#4a3b6b', bottom: '#2b2b33', style: 'ao', hat: 'nonla', ...ap }); }
import { makeAvatar, setNameTag, animateAvatar } from '../shared/engine.js?v=21';
function makeNPCav(ap) { return makeAvatar(ap); }
const NAMES = ['Bà Tư', 'Cô Hạnh', 'Anh Tuấn', 'Chị Thảo', 'Bé Na', 'Chú Ba', 'Minh', 'Ngọc', 'Bác Lộc', 'Linh', 'Hùng', 'Cô Năm', 'Phúc', 'Vy', 'Trang', 'Long'];
const OUTF = [{ top: '#6f8fb8', bottom: '#6f8fb8', style: 'aodai' }, { top: '#8a6a4a', bottom: '#5a4632', style: 'aodai' }, { top: '#b33a2e', bottom: '#f0e8d8', style: 'aodai' }, { top: '#f3efe4', bottom: '#f3efe4', style: 'aodai' }, { top: '#3e5b4a', bottom: '#2b2b2b', style: 'ao' }, { top: '#d9c38a', bottom: '#3a3a3a', style: 'ao' }];
const rndAp = () => ({ ...pick(OUTF), skin: pick(['#f6d7b5', '#eec39a', '#d9a77c']), hair: pick(['ngan', 'bui', 'dai', 'ngan']), hat: Math.random() < 0.3 ? 'nonla' : 'none' });
const boats = [];
function spawnBoat(z, dir, withPlayer) { const g = makeBoat(); W.scene.add(g); const rower = makeRower(); rower.root.position.set(0, 0.2, -1.6); rower.root.scale.setScalar(0.95); g.add(rower.root);
  const oar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 5), '#7a5a35'); oar.position.set(0.45, 0.9, -1.4); g.add(oar);
  const pax = []; if (!withPlayer) for (let i = 0; i < (Math.random() * 3 | 0) + 1; i++) { const a = makeAvatar(rndAp()); a.seated = true; a.root.position.set(0, 0.2, 0.9 - i * 1.1); a.root.scale.setScalar(0.9); setNameTag(a, pick(NAMES), '#fff'); g.add(a.root); pax.push(a); }
  const b = { g, rower, oar, pax, z, dir, speed: rnd(1.2, 1.6), off: rnd(-1.6, 1.6), ph: rnd(0, 6) }; boats.push(b); return b; }
for (let i = 0; i < 6; i++) spawnBoat(rnd(-60, 60), i % 2 ? 1 : -1);
function placeBoat(b, dt, t) { b.z += b.dir * -b.speed * dt; const z = b.z, x = riverX(z) + b.off, x2 = riverX(z - b.dir * 0.5) + b.off; b.g.position.set(x, -0.1 + Math.sin(t * 1.3 + b.ph) * 0.04, z); b.g.rotation.y = Math.atan2(x2 - x, -b.dir * 0.5) + (b.dir > 0 ? 0 : 0); b.g.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.03;
  b.oar.rotation.x = 0.5 + Math.sin(t * 1.8 + b.ph) * 0.35; b.oar.rotation.z = 0.5; animateAvatar(b.rower, dt, 0, t); b.rower.armR.rotation.x = -1 + Math.sin(t * 1.8 + b.ph) * 0.4; b.rower.armL.rotation.x = -1 + Math.sin(t * 1.8 + b.ph) * 0.4; b.pax.forEach(a => animateAvatar(a, dt, 0, t)); }
W.onUpdate((dt, t) => boats.forEach(b => { if (b === myBoat) return; placeBoat(b, dt, t); if (b.z < -64) { b.dir = -1; } if (b.z > 62) b.dir = 1; }));

// ---------- docks ----------
function dock(x, z, rot) { const g = new THREE.Group(); for (let i = 0; i < 7; i++) { const p = mesh(new THREE.BoxGeometry(2.2, 0.1, 0.42), i % 2 ? '#8a6440' : '#7b5634'); p.position.set(0, 0.28, i * 0.46); g.add(p); } [[-1, 0], [1, 0], [-1, 2.8], [1, 2.8]].forEach(q => { const p = mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), '#5a3d22'); p.position.set(q[0], -0.2, q[1]); g.add(p); }); g.position.set(x, 0, z); g.rotation.y = rot; W.scene.add(g); }
const DOCK1 = { x: riverX(56) + RW - 0.5, z: 56 }, DOCK2 = { x: riverX(-64) + RW - 0.5, z: -64 };
dock(DOCK1.x + 0.5, DOCK1.z - 1.2, -Math.PI / 2); dock(DOCK2.x + 0.5, DOCK2.z - 1.2, -Math.PI / 2);
// gate sign Bến Đục (painted board, our own text)
function sign(text, x, z, ry, w = 3) { const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#7a2a1c'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#e9c46a'; g.lineWidth = 8; g.strokeRect(8, 8, 496, 112); g.fillStyle = '#f5d98a'; g.font = 'bold 54px Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Group(); const b = mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide })); b.position.y = 2.6; s.add(b); [-1, 1].forEach(k => { const p = mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 6), '#5a3d22'); p.position.set(k * w / 2, 1.5, 0); s.add(p); }); s.position.set(x, 0, z); s.rotation.y = ry; W.scene.add(s); }
sign('Bến Đục', DOCK1.x + 3.5, 60, 0); sign('Bến Trò', DOCK2.x + 5.5, -61, 0);

// ---------- pagoda (chùa) – own stylised design ----------
const ROOF = '#5b4038', RED = '#9b2f22', WALL = '#e8d9b8';
function roof(w, d, y, h = 1.3) { const g = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.6, 0); sh.quadraticCurveTo(-w / 2 + 0.3, 0.15, -w / 4, h * 0.65); sh.lineTo(w / 4, h * 0.65); sh.quadraticCurveTo(w / 2 - 0.3, 0.15, w / 2 + 0.6, 0); sh.lineTo(w / 2 + 0.6, -0.12); sh.lineTo(-w / 2 - 0.6, -0.12);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: d + 1.2, bevelEnabled: false }); geo.translate(0, 0, -(d + 1.2) / 2); const r = mesh(geo, ROOF, { roughness: 0.7 }); g.add(r);
  const ridge = mesh(new THREE.BoxGeometry(w / 2 + 0.4, 0.22, 0.25), '#7a5a3a'); ridge.position.y = h * 0.7; g.add(ridge);
  [-1, 1].forEach(s => { const c = mesh(new THREE.ConeGeometry(0.16, 0.9, 6), '#7a5a3a'); c.position.set(s * (w / 4 + 0.25), h * 0.85, 0); c.rotation.z = -s * 0.5; g.add(c); });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const c = mesh(new THREE.ConeGeometry(0.13, 0.8, 6), '#6b4a36'); c.position.set(a * (w / 2 + 0.5), 0.25, b * (d / 2 + 0.55)); c.rotation.set(b * 0.6, 0, -a * 0.9); g.add(c); });
  const pearl = mesh(new THREE.SphereGeometry(0.22, 12, 10), '#e7b53c', { emissive: '#6a4a08', emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.3 }); pearl.position.y = h * 0.95; g.add(pearl);
  g.position.y = y; return g; }
function makeBuddha(gold) { // seated Buddha in meditation (thiền định), lotus throne
  const g = new THREE.Group(), robe = gold, skin = gold;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + r * 0.22; const p = mesh(new THREE.SphereGeometry(0.26, 10, 8), r ? '#d9b062' : '#b98a3c', { roughness: 0.5, metalness: 0.3 }); p.scale.set(0.55, 0.38 + r * 0.1, 1); p.position.set(Math.sin(a) * (0.82 - r * 0.12), 0.05 + r * 0.14, Math.cos(a) * (0.62 - r * 0.1)); p.rotation.y = a; g.add(p); }
  const seat = mesh(new THREE.CylinderGeometry(0.78, 0.7, 0.18, 24), '#c99a48', { metalness: 0.3 }); seat.position.y = 0.2; seat.scale.z = 0.8; g.add(seat);
  const lap = mesh(new THREE.CapsuleGeometry(0.27, 0.78, 6, 16), robe); lap.rotation.z = Math.PI / 2; lap.scale.set(1, 1, 0.95); lap.position.set(0, 0.45, 0.12); g.add(lap);
  [-1, 1].forEach(s => { const f = mesh(new THREE.SphereGeometry(0.11, 10, 8), skin); f.scale.set(1.2, 0.6, 0.8); f.position.set(s * 0.22, 0.6, 0.3); g.add(f); });
  const pts = [[0.0, 0], [0.42, 0], [0.47, 0.25], [0.43, 0.6], [0.36, 0.85], [0.2, 1.0], [0.11, 1.06], [0, 1.08]].map(([x, y]) => new THREE.Vector2(x, y));
  const torso = mesh(new THREE.LatheGeometry(pts, 28), robe); torso.scale.z = 0.72; torso.position.y = 0.5; g.add(torso);
  const sash = mesh(new THREE.TorusGeometry(0.4, 0.04, 6, 30, Math.PI * 0.9), robe); sash.rotation.set(0.2, 0, -0.9); sash.position.set(0.05, 1.05, 0.12); sash.scale.z = 0.7; g.add(sash);
  [-1, 1].forEach(s => { const up = mesh(new THREE.CapsuleGeometry(0.1, 0.36, 4, 10), robe); up.position.set(s * 0.43, 1.12, 0.02); up.rotation.z = s * 0.18; g.add(up);
    const fo = mesh(new THREE.CapsuleGeometry(0.085, 0.32, 4, 10), robe); fo.position.set(s * 0.26, 0.78, 0.22); fo.rotation.set(1.25, 0, s * 1.05); g.add(fo); });
  const hands = mesh(new THREE.SphereGeometry(0.15, 12, 8), skin); hands.scale.set(1.4, 0.45, 0.9); hands.position.set(0, 0.7, 0.32); g.add(hands);
  const neck = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.14, 12), skin); neck.position.y = 1.6; g.add(neck);
  const head = new THREE.Group(); head.position.y = 1.86; g.add(head);
  const face = mesh(new THREE.SphereGeometry(0.24, 24, 18), skin); face.scale.set(0.92, 1.12, 0.95); head.add(face);
  for (let i = 0; i < 40; i++) { const t = Math.acos(1 - (i + 0.5) / 40 * 0.85), ph = i * 2.4; if (Math.cos(ph) * Math.sin(t) > 0.55 && t > 0.7) continue; const c = mesh(new THREE.SphereGeometry(0.045, 6, 5), '#3a2a18', { roughness: 0.8 }); c.position.set(Math.sin(t) * Math.sin(ph) * 0.235, Math.cos(t) * 0.26 + 0.03, Math.sin(t) * Math.cos(ph) * 0.235); head.add(c); }
  const ush = mesh(new THREE.SphereGeometry(0.12, 12, 10), '#3a2a18', { roughness: 0.8 }); ush.position.y = 0.3; head.add(ush);
  const jewel = mesh(new THREE.SphereGeometry(0.035, 8, 6), '#f3d27a', { metalness: 0.7 }); jewel.position.y = 0.42; head.add(jewel);
  [-1, 1].forEach(s => { const ear = mesh(new THREE.CapsuleGeometry(0.035, 0.2, 3, 6), skin); ear.position.set(s * 0.225, -0.04, 0); head.add(ear);
    const lid = mesh(new THREE.TorusGeometry(0.035, 0.009, 4, 10, Math.PI), '#4a3015'); lid.rotation.z = Math.PI; lid.position.set(s * 0.08, 0.0, 0.225); head.add(lid); });
  const urna = mesh(new THREE.SphereGeometry(0.014, 6, 4), '#f3e1a8'); urna.position.set(0, 0.07, 0.235); head.add(urna);
  const lips = mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 10, Math.PI), '#7a4a1a'); lips.rotation.z = Math.PI; lips.position.set(0, -0.11, 0.222); head.add(lips);
  g.scale.setScalar(1.2); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
const HALL_ROOF = [], HALL_PILLARS = []; const HALL = new THREE.Group(); HALL.position.set(PAG.x, 0, -93.5); W.scene.add(HALL);
{ const base = mesh(new THREE.BoxGeometry(14, 0.95, 11), '#9c9686'); base.position.y = 0.47; HALL.add(base);
  for (let i = 0; i < 4; i++) { const st = mesh(new THREE.BoxGeometry(5, 0.24, 0.6), '#a8a292'); st.position.set(0, 0.12 + i * 0.24, 5.5 + (3 - i) * 0.6 - 0.3); HALL.add(st); }
  const walls = mesh(new THREE.BoxGeometry(11, 3.4, 0.3), WALL); walls.position.set(0, 2.65, -4); HALL.add(walls); [-1, 1].forEach(s => { const sw = mesh(new THREE.BoxGeometry(0.3, 3.4, 8), WALL); sw.position.set(s * 5.5, 2.65, 0); HALL.add(sw); });
  for (let i = 0; i < 6; i++) { const c = mesh(new THREE.CylinderGeometry(0.2, 0.22, 3.4, 10), mat(RED, { transparent: true })); c.position.set(-5 + i * 2, 2.65, 4); HALL.add(c); HALL_PILLARS.push(c); }
  const r1 = roof(13, 10, 4.35, 1.6); HALL.add(r1); const r2 = roof(8, 6, 6.1, 1.3); HALL.add(r2); const mid = mesh(new THREE.BoxGeometry(7, 0.9, 5), WALL); mid.position.y = 5.9; HALL.add(mid);
  HALL_ROOF.push(r1, r2, mid); W.addOccluder(walls, ...HALL.children.filter(o => o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.depth === 8));
  // altar & seated statue (simple, respectful)
  const alt = mesh(new THREE.BoxGeometry(4, 1.1, 1.4), '#7a2a1c'); alt.position.set(0, 1.5, -2.8); HALL.add(alt);
  const gold = mat('#c9973a', { metalness: 0.55, roughness: 0.42, emissive: '#2a1a03', emissiveIntensity: 0.25 });
  const statue = makeBuddha(gold); statue.position.set(0, 2.05, -3.15); HALL.add(statue);
  const mandorla = mesh(new THREE.CircleGeometry(1.15, 40), mat('#8a5a22', { metalness: 0.4, roughness: 0.6 })); mandorla.position.set(0, 3.55, -3.62); HALL.add(mandorla);
  const ring = mesh(new THREE.TorusGeometry(1.15, 0.05, 8, 48), gold); ring.position.copy(mandorla.position); HALL.add(ring);
  const lampL = new THREE.PointLight('#ffb35c', 6, 9, 1.6); lampL.position.set(0, 3, -1.2); HALL.add(lampL);
  [-1.5, 1.5].forEach(x => { const cnd = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), '#f4ead2'); cnd.position.set(x, 2.25, -2.5); HALL.add(cnd); const fl = mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#ffcf6a', { emissive: '#ffa21f', emissiveIntensity: 2 })); fl.position.set(x, 2.5, -2.5); fl.scale.y = 1.6; HALL.add(fl); });
  W.addBox(PAG.x, -93.5 - 4, 5.6, 0.3); W.addBox(PAG.x - 5.5, -93.5, 0.3, 4); W.addBox(PAG.x + 5.5, -93.5, 0.3, 4); W.addBox(PAG.x, -96.3, 2, 0.8);
  for (let i = 0; i < 6; i++) W.addCollider(PAG.x - 5 + i * 2, -89.5, 0.25);
}
// Chánh điện: lift roof away & pull camera back so the statue is always in view
{ let inHall = false, saved = null; W.onUpdate(() => { const P = W.player, q = Math.abs(P.pos.x - PAG.x) < 5.6 && P.pos.z < -89 && P.pos.z > -98;
  if (q !== inHall) { inHall = q; HALL_ROOF.forEach(r => r.visible = !q); HALL_PILLARS.forEach(c => c.material.opacity = q ? 0.18 : 1); if (q) { saved = [P.camDist, P.camPitch]; P.camDist = 7.5; P.camPitch = 0.42; } else if (saved) { [P.camDist, P.camPitch] = saved; } } });
  W.camLimit = (c, t) => { if (Math.abs(W.player.pos.x - PAG.x) < 5.6 && W.player.pos.z < -89 && W.player.pos.z > -98) { c.x = THREE.MathUtils.clamp(c.x, PAG.x - 5, PAG.x + 5); c.z = Math.max(c.z, t.z + 2.5); } }; }
// cushions (bồ đoàn)
const cushions = []; for (let i = 0; i < 6; i++) { const x = PAG.x - 2.5 + (i % 3) * 2.5, z = -94 + Math.floor(i / 3) * 1.6; const c = mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.18, 16), i % 2 ? '#c9822a' : '#b8662a'); c.position.set(x, 1.04, z); W.scene.add(c); cushions.push({ x, z }); }
// incense urn (lư hương) and bell tower (gác chuông)
const URN = { x: PAG.x, z: -82 }; { const g = new THREE.Group(); const bowl = mesh(new THREE.CylinderGeometry(0.9, 0.6, 0.8, 18), '#5a4a32', { metalness: 0.5, roughness: 0.4 }); bowl.position.y = 1.1; g.add(bowl); const leg = mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.7, 10), '#4a3c28', { metalness: 0.5 }); leg.position.y = 0.35; g.add(leg); const ash = mesh(new THREE.CircleGeometry(0.85, 18), '#c9c1b0'); ash.rotation.x = -Math.PI / 2; ash.position.y = 1.5; g.add(ash); g.position.set(URN.x, 0.25, URN.z); W.scene.add(g); W.addCollider(URN.x, URN.z, 0.9); }
const BELL = { x: PAG.x + 8, z: -86 }; let bellMesh; { const g = new THREE.Group(); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const p = mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.2, 8), RED); p.position.set(a * 1.2, 1.6, b * 1.2); g.add(p); }); const r = roof(2.6, 2.6, 3.2, 1.1); g.add(r);
  bellMesh = mesh(new THREE.CylinderGeometry(0.45, 0.7, 1.4, 18, 1, true), '#5c6a52', { metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide }); bellMesh.geometry.translate(0, -0.7, 0); bellMesh.position.y = 3; g.add(bellMesh); g.position.set(BELL.x, 0.25, BELL.z); W.scene.add(g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => W.addCollider(BELL.x + a * 1.2, BELL.z + b * 1.2, 0.2)); }
// ribbon tree with red ribbons
const TREE = { x: PAG.x - 8, z: -84 }; const ribbonsG = new THREE.Group(); { const g = new THREE.Group(); const tr = mesh(new THREE.CylinderGeometry(0.35, 0.6, 3.5, 8), '#5b4430'); tr.position.y = 1.75; g.add(tr); [[0, 4.3, 0, 2.4], [1.4, 3.8, 0.5, 1.6], [-1.3, 3.9, -0.4, 1.7], [0.3, 5, -0.8, 1.5]].forEach(q => { const l = mesh(new THREE.IcosahedronGeometry(q[3], 1), '#4e7d3e', { flatShading: true }); l.position.set(q[0], q[1], q[2]); g.add(l); });
  g.add(ribbonsG); g.position.set(TREE.x, 0.25, TREE.z); W.scene.add(g); W.addCollider(TREE.x, TREE.z, 0.7); }
function addRibbon() { const r = mesh(new THREE.BoxGeometry(0.06, 0.6, 0.02), '#d0261f', { emissive: '#400', emissiveIntensity: 0.3 }); const a = rnd(0, 6.28), rr = rnd(1.2, 2.3); r.position.set(Math.cos(a) * rr, rnd(3, 3.8), Math.sin(a) * rr); ribbonsG.add(r); }
for (let i = 0; i < 24; i++) addRibbon();
W.onUpdate((dt, t) => ribbonsG.children.forEach((r, i) => r.rotation.z = Math.sin(t * 2 + i) * 0.2));
// stone lanterns + red flags along path
for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const x = PAG.x + s * 3.2, z = -70 - i * 4; const g = new THREE.Group(); const b = mesh(new THREE.BoxGeometry(0.4, 1, 0.4), '#a39d8c'); b.position.y = 0.5; g.add(b); const top = mesh(new THREE.ConeGeometry(0.45, 0.4, 4), '#8a8576'); top.position.y = 1.4; top.rotation.y = Math.PI / 4; g.add(top); const l = mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mat('#ffd38a', { emissive: '#ff9e2c', emissiveIntensity: 1.2 })); l.position.y = 1.1; g.add(l); g.position.set(x, 0.25, z); W.scene.add(g); W.addCollider(x, z, 0.3); }
// cổng tam quan
{ const g = new THREE.Group(); [-2.2, 2.2].forEach(x => { const p = mesh(new THREE.BoxGeometry(0.6, 4, 0.6), '#d9cfb5'); p.position.set(x, 2, 0); g.add(p); W.addCollider(PAG.x + x, -68, 0.45); }); g.add(roof(5, 1.4, 4, 1)); g.position.set(PAG.x, 0.25, -68); W.scene.add(g); }
// cave Hương Tích
const CAVE = { x: -11, z: -100 }; { const g = new THREE.Group(); const arch = mesh(new THREE.TorusGeometry(3, 1.4, 8, 16, Math.PI), '#7d7a6e', { flatShading: true }); arch.position.y = 0; g.add(arch); const back = mesh(new THREE.CircleGeometry(3, 20, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#1b1510' })); back.position.z = -0.6; g.add(back);
  for (let i = 0; i < 9; i++) { const st = mesh(new THREE.ConeGeometry(rnd(0.08, 0.2), rnd(0.5, 1.4), 6), '#a29a86'); st.rotation.x = Math.PI; st.position.set(rnd(-2.2, 2.2), rnd(2.1, 2.7), -0.3); g.add(st); }
  const cl = new THREE.PointLight('#ffae5a', 4, 7, 1.5); cl.position.set(0, 1, 0.5); g.add(cl); const cs = mesh(new THREE.BoxGeometry(1.4, 0.7, 0.6), '#6a2a1c'); cs.position.set(0, 0.35, -0.2); g.add(cs);
  g.position.set(CAVE.x, 0.25, CAVE.z); g.rotation.y = 0.35; W.scene.add(g); const sg = label('Động Hương Tích', '#ffe7a8', 0.5); sg.position.set(CAVE.x, 5, CAVE.z); W.scene.add(sg); }
const BANK = { x: riverX(-58) - RW + 0.6, z: -58 }; // thả hoa đăng from west bank? use east bank near dock2
const BANK2 = { x: DOCK2.x - 0.2, z: -58 };

// ---------- particles: smoke, lanterns, petals ----------
const smokeMat = new THREE.MeshBasicMaterial({ color: '#f4f1ea', transparent: true, opacity: 0.35, depthWrite: false }); const smokeG = new THREE.SphereGeometry(0.1, 6, 4); const smokes = [];
function puff(x, y, z) { const m = new THREE.Mesh(smokeG, smokeMat.clone()); m.position.set(x, y, z); W.scene.add(m); smokes.push({ m, life: 0 }); }
const sticks = new THREE.Group(); W.scene.add(sticks);
function lightIncense(x, z, y = 1.75) { for (let i = 0; i < 3; i++) { const s = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.7, 4), '#a02a20'); s.position.set(x + (i - 1) * 0.08 + rnd(-0.3, 0.3), y, z + rnd(-0.3, 0.3)); s.rotation.z = (i - 1) * 0.08; const tip = mesh(new THREE.SphereGeometry(0.025, 6, 4), mat('#ff6a2a', { emissive: '#ff4a10', emissiveIntensity: 3 })); tip.position.y = 0.36; s.add(tip); s.userData.life = 90; sticks.add(s); } }
W.onUpdate((dt, t) => { for (let i = smokes.length - 1; i >= 0; i--) { const s = smokes[i]; s.life += dt; s.m.position.y += dt * 0.5; s.m.position.x += Math.sin(t * 2 + i) * dt * 0.15; s.m.scale.setScalar(1 + s.life * 1.6); s.m.material.opacity = Math.max(0, 0.32 - s.life * 0.08); if (s.life > 4) { W.scene.remove(s.m); smokes.splice(i, 1); } }
  sticks.children.forEach(s => { s.userData.life -= dt; if (Math.random() < dt * 2.5) { const p = s.getWorldPosition(new THREE.Vector3()); puff(p.x, p.y + 0.37, p.z); } }); for (const s of [...sticks.children]) if (s.userData.life < 0) sticks.remove(s); });
const lanterns = []; function floatLantern(x, z, name) { const g = new THREE.Group(); for (let k = 0; k < 8; k++) { const p = mesh(new THREE.SphereGeometry(0.16, 8, 6), k % 2 ? '#f7a8c0' : '#fbd0dc', { emissive: '#ff8fb0', emissiveIntensity: 0.25 }); p.scale.set(1, 0.4, 0.5); const a = k / 8 * 6.28; p.position.set(Math.cos(a) * 0.15, 0.08, Math.sin(a) * 0.15); p.rotation.y = -a; p.rotation.z = 0.5; g.add(p); }
  const f = mesh(new THREE.SphereGeometry(0.06, 8, 6), mat('#ffe39a', { emissive: '#ffb03a', emissiveIntensity: 3 })); f.position.y = 0.2; g.add(f); const pl = new THREE.PointLight('#ffb35a', 1.5, 4, 2); pl.position.y = 0.4; if (lanterns.length < 6) g.add(pl); if (name) { const lb = label(name, '#ffe7c0', 0.22); lb.position.y = 0.7; g.add(lb); }
  g.position.set(x, -0.05, z); W.scene.add(g); lanterns.push({ g, z, life: 0, off: x - riverX(z) }); }
W.onUpdate((dt, t) => { for (let i = lanterns.length - 1; i >= 0; i--) { const l = lanterns[i]; l.life += dt; l.z += dt * 0.7; l.off *= 1 - dt * 0.1; l.g.position.set(riverX(l.z) + l.off, -0.05 + Math.sin(t * 2 + i) * 0.03, l.z); l.g.rotation.y += dt * 0.2; if (l.life > 90) { W.scene.remove(l.g); lanterns.splice(i, 1); } } });
// falling petals
{ const N = isMobile ? 60 : 120, g = new THREE.PlaneGeometry(0.08, 0.06), im = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color: '#f6b8c8', side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), N); const ps = Array.from({ length: N }, () => ({ x: rnd(-15, 15), y: rnd(0, 10), z: rnd(-15, 15), s: rnd(0.3, 0.7), r: rnd(0, 6) })); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  im.frustumCulled = false; W.scene.add(im); W.onUpdate((dt, t) => { const P = W.player.pos; ps.forEach((p, i) => { p.y -= p.s * dt; p.x += Math.sin(t + i) * dt * 0.3; if (p.y < 0) { p.y = 10; p.x = rnd(-15, 15); p.z = rnd(-15, 15); } e.set(t * p.s * 3 + p.r, t + p.r, 0); q.setFromEuler(e); v.set(P.x + p.x, p.y, P.z + p.z); m4.compose(v, q, one); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; }); }

// ---------- NPC visitors ----------
const pagSpots = [[URN.x, URN.z + 1.3, Math.PI, 'stand'], [URN.x + 1.2, URN.z + 1, Math.PI, 'stand'], ...cushions.map(c => [c.x, c.z + 0.05, Math.PI, 'sit']), [TREE.x + 1.2, TREE.z, -Math.PI / 2, 'stand'], [BELL.x - 1.8, BELL.z, Math.PI / 2, 'stand']];
for (let i = 0; i < (isMobile ? 7 : 10); i++) { const n = addNPC(W, { name: NAMES[i], ap: rndAp(), area: [PAG.x - 9, PAG.x + 9, -92, -70], spots: pagSpots, pet: i === 2 ? 'dog' : i === 5 ? 'cat' : null }); n.pos.x = rnd(-8, 8); n.pos.z = rnd(-88, -72); n.av.root.position.copy(n.pos); }
for (let i = 0; i < 3; i++) addNPC(W, { name: NAMES[10 + i], ap: rndAp(), area: [DOCK1.x + 1, DOCK1.x + 8, 50, 66] });
W.npcs.forEach(n => { if (n.spot && n.spot[3] === 'sit') { n.av.seated = true; } });

// ---------- player pet ----------
let myPet = null; W.setPet = (k) => { if (myPet) W.scene.remove(myPet.root); myPet = k && k !== 'none' ? makePet(k) : null; if (myPet) { myPet.root.position.copy(W.player.pos); W.scene.add(myPet.root); } };
W.onUpdate(dt => { if (myPet && !W.player.riding) followPet(myPet, W.player.pos, W.player.yaw, dt, W); });

// ---------- riding the đò ----------
let myBoat = null;
function boardBoat(toPagoda = true) { const P = W.player; myBoat = spawnBoat(toPagoda ? 54 : -62, toPagoda ? 1 : -1, true); myBoat.off = 0; myBoat.speed = 2.6; W.standUp(); P.av.seated = true; if (myPet) myPet.root.visible = false; ui.toast('Cô lái đò chèo ra suối Yến… thả lỏng và ngắm cảnh nhé'); S.chime(); ST.add('do');
  const rl = document.createElement('div'); rl.id = 'kg-ride'; rl.textContent = toPagoda ? 'Đang về Bến Trò…' : 'Đang về Bến Đục…'; rl.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(118px + env(safe-area-inset-top));background:#0009;color:#fff;font-size:18px;padding:4px 12px;border-radius:10px;z-index:30;pointer-events:none'; document.body.appendChild(rl);
  P.riding = (dt) => { placeBoat(myBoat, dt, W.time); const bp = myBoat.g.position; const fw = new THREE.Vector3(0, 0, 0.3).applyEuler(myBoat.g.rotation); P.pos.set(bp.x + fw.x, bp.y + 0.2, bp.z + fw.z); P.yaw = myBoat.g.rotation.y; P.speed = 0;
    if ((toPagoda && myBoat.z < -62) || (!toPagoda && myBoat.z > 54)) { P.riding = null; rl.remove(); const d = toPagoda ? DOCK2 : DOCK1; W.teleport(d.x + 1.5, d.z, toPagoda ? Math.PI : 0); W.scene.remove(myBoat.g); boats.splice(boats.indexOf(myBoat), 1); myBoat = null; if (myPet) { myPet.root.visible = true; myPet.root.position.copy(W.player.pos); } ui.toast(toPagoda ? 'Đã tới Bến Trò · đi qua cổng tam quan lên chùa' : 'Đã về Bến Đục'); S.bell(130, 0.25); } }; }

// ---------- interactions ----------
const LOC = [['Bình an', 'Mong bạn và gia đình luôn bình an.'], ['Chăm chỉ', 'Siêng năng mỗi ngày, việc nhỏ cũng thành.'], ['Sức khoẻ', 'Ăn ngủ điều độ, giữ thân tâm khoẻ.'], ['Thương người', 'Sống chân thành, quý người quanh ta.'], ['Học hành', 'Chăm học mỗi ngày, hiểu thêm một điều.'], ['Hiếu thảo', 'Cha mẹ mạnh khoẻ, con cháu sum vầy.'], ['Thảnh thơi', 'Buông bớt lo âu, lòng nhẹ như mây.'], ['Kiên nhẫn', 'Việc khó cứ bước từng bước, rồi sẽ qua.']];
W.addInteract({ pos: { x: DOCK1.x + 1.2, z: DOCK1.z }, r: 3.5, label: '🛶 Lên đò đi chùa', use: () => boardBoat(true) });
// big, obvious "LÊN ĐÒ" guide: bouncing arrow over the jetty + chevrons on the ground from spawn
const guide = new THREE.Group(); W.scene.add(guide);
{ const arrowM = mat('#ffcc33', { emissive: '#e08a00', emissiveIntensity: 0.6 }); const arr = new THREE.Group(); const cone = mesh(new THREE.ConeGeometry(0.45, 0.8, 4), arrowM); cone.rotation.x = Math.PI; arr.add(cone); const sh = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 8), arrowM); sh.position.y = 0.7; arr.add(sh);
  arr.position.set(DOCK1.x + 0.8, 3.2, DOCK1.z); guide.add(arr); const lb = label('LÊN ĐÒ', '#ffe27a', 0.6); lb.position.set(DOCK1.x + 0.8, 4.8, DOCK1.z); guide.add(lb);
  for (let i = 1; i <= 3; i++) { const c = mesh(new THREE.ConeGeometry(0.35, 0.7, 3), arrowM); c.rotation.set(-Math.PI / 2, 0, 0); const k = i / 4, x = 12 + (DOCK1.x + 1.5 - 12) * k, z = 62 + (DOCK1.z - 62) * k; c.position.set(x, 0.08, z); c.rotation.z = Math.atan2(DOCK1.x - 12, -(DOCK1.z - 62)); guide.add(c); }
  W.onUpdate((dt, t) => { arr.position.y = 3.1 + Math.sin(t * 3) * 0.3; arr.rotation.y = t; guide.visible = !W.player.riding && W.player.pos.z > 30; }); }
W.addInteract({ pos: { x: DOCK2.x + 1.2, z: DOCK2.z }, r: 3, label: '🛶 Lên đò về Bến Đục', use: () => boardBoat(false) });
W.addInteract({ pos: URN, r: 2.6, label: '🪔 Thắp hương', use: () => { lightIncense(URN.x, URN.z, 1.9); bow(W.player.av); S.tone(196, 3, 0.08); ui.toast('Nén hương thơm, lòng thành kính 🙏'); ui.feed(`${W.player.name} vừa thắp hương`); ST.add('huong'); } });
W.addInteract({ pos: BELL, r: 2.8, label: '🔔 Thỉnh chuông', use: () => { S.bell(98, 0.4); let k = 0; const sw = () => { bellMesh.rotation.z = Math.sin(k) * 0.15 * Math.exp(-k * 0.15); k += 0.3; if (k < 20) requestAnimationFrame(sw); }; sw(); ui.toast('Boong… tiếng chuông vọng khắp non'); ST.add('chuong'); } });
W.addInteract({ pos: TREE, r: 2.8, label: '🎀 Treo dây đỏ · lời chúc', use: () => { const l = pick(LOC); addRibbon(); S.chime(); ST.add('loc'); ui.modal(`<h2>Lời chúc: ${l[0]}</h2><p style="text-align:center;font-size:18px;line-height:1.6">${l[1]}</p><p style="text-align:center;font-size:18px;opacity:.85">Một dải lụa đỏ đã được treo lên cây</p><p style="text-align:center;font-size:18px;opacity:.85">Lời chúc tham khảo, không phải lời tiên đoán</p>`); } });
W.addInteract({ pos: BANK2, r: 2.6, label: '🪷 Thả hoa đăng', use: () => { ui.modal(`<h2>Thả hoa đăng</h2><input class="kg-in" id="wish" maxlength="40" placeholder="Lời nguyện (không bắt buộc)"><button class="kg-btn main" id="okw" style="width:100%;margin-top:10px">Thả xuống suối</button>`, c => c.querySelector('#okw').onclick = () => { ui.close(); floatLantern(riverX(-60) + 2.5, -60, LIVE ? '' : W.player.name); S.pluck(523); S.pluck(659, 0.2); ui.toast('Đèn hoa đăng trôi theo dòng suối 🪷'); ui.feed(`${W.player.name} vừa thả hoa đăng`); ST.add('hoadang'); }); } });
cushions.forEach((c, i) => W.addInteract({ pos: { x: c.x, z: c.z }, r: 0.9, label: '🧘 Ngồi bồ đoàn', use: () => { W.sit(new THREE.Vector3(c.x, 1.13, c.z), Math.PI); ui.toast('Ngồi tĩnh tâm · bấm Lạy hoặc Tràng hạt'); } }));
W.addInteract({ pos: { x: CAVE.x + 0.5, z: CAVE.z + 2 }, r: 3, label: '🕯️ Thắp nến trong động', use: () => { lightIncense(CAVE.x, CAVE.z + 0.6, 0.9); S.bell(146, 0.15); ui.toast('Ánh nến lung linh trong động Hương Tích'); } });
// chores: sweep courtyard leaves (công quả)
const BROOM = { x: PAG.x + 5, z: -75 }; const broomRack = broom(); broomRack.position.set(BROOM.x, 1.2, BROOM.z); broomRack.rotation.set(0, 0, 0.2); W.scene.add(broomRack);
const leaves = leafPatch(W, { center: [PAG.x, -78], radius: 7, count: 70, colors: ['#c9a04a', '#b5803a', '#e0b860', '#9a6b2a'], onDone: () => { stopSweep(); doneCard(ui, { icon: '🧹', title: 'Sân chùa đã sạch', msg: 'Sân chùa sạch bong. Cảm ơn bạn đã góp sức 🙏' }); S.chime(); ST.add('quet'); setTimeout(() => leaves.reset(), 30000); } });
let held = null; function stopSweep() { leaves.active = false; W.player.av.sweeping = false; if (held) { held.parent?.remove(held); held = null; } sweepI.label = '🧹 Quét sân chùa'; broomRack.visible = true; }
const sweepI = W.addInteract({ pos: BROOM, r: 2.2, label: '🧹 Quét sân chùa', use: () => { if (leaves.active) return stopSweep(); leaves.active = true; W.player.av.sweeping = true; held = broom(); W.player.av.hand.add(held); broomRack.visible = false; sweepI.label = '✋ Cất chổi'; ui.toast(`Đi quanh sân để quét ${leaves.left} chiếc lá`); } });

// ---------- action bar ----------
const doBtn = ui.button('kg-acts', '🛶 Lên đò', () => { const P = W.player; if (P.riding) return; if (P.pos.z > 0) { if (Math.hypot(P.pos.x - DOCK1.x, P.pos.z - DOCK1.z) > 3.5) W.teleport(DOCK1.x + 1.2, DOCK1.z, Math.PI); boardBoat(true); } else { if (Math.hypot(P.pos.x - DOCK2.x, P.pos.z - DOCK2.z) > 3.5) W.teleport(DOCK2.x + 1.5, DOCK2.z, 0); boardBoat(false); } });
doBtn.style.fontSize = '18px'; W.onUpdate(() => { const t = W.player.riding ? '' : (W.player.pos.z > 0 ? '🛶 Lên đò đi chùa' : '🛶 Đò về Bến Đục'); doBtn.style.display = t ? '' : 'none'; if (t && doBtn.textContent !== t) doBtn.textContent = t; });
ui.button('kg-acts', '🙏 Lạy', () => { bow(W.player.av); S.mo(); ST.add('lay'); });
ui.button('kg-acts', '📿 Tràng hạt', () => beadsView(ui, { mantra: 'Nam mô A Di Đà Phật', sound: S, onRound: () => doneCard(ui, { icon: '📿', title: 'Tròn một chuỗi 108 hạt', msg: 'Nam mô A Di Đà Phật. Tâm an, đường đi nhẹ.' }) }));
const icons = (t, l, f) => ui.button('kg-icons', `<span>${t}</span><small>${l}</small>`, f);
icons('🗺️', 'Bản đồ', () => mapView(W, ui, [{ label: 'Bến Đục', desc: 'Nơi xuống đò bắt đầu trẩy hội', icon: '🛶', pos: [DOCK1.x + 2, DOCK1.z], yaw: Math.PI }, { label: 'Bến Trò', desc: 'Bờ suối thả hoa đăng', icon: '🪷', pos: [DOCK2.x + 2, DOCK2.z + 1], yaw: Math.PI }, { label: 'Sân chùa', desc: 'Lư hương, gác chuông, cây treo dây đỏ', icon: '🛕', pos: [PAG.x, -76], yaw: Math.PI }, { label: 'Chánh điện', desc: 'Ngồi bồ đoàn, lạy Phật', icon: '🧘', pos: [PAG.x, -91.5], yaw: Math.PI }, { label: 'Động Hương Tích', desc: 'Hang đá thắp nến', icon: '⛰️', pos: [CAVE.x + 1, CAVE.z + 3.5], yaw: Math.PI }], 'Bản đồ Hương Sơn'));
icons('📊', 'Hành trình', () => { const s = ST.s; ui.modal(`<h2>Chuyến đi của bạn</h2><div style="font-size:18px;line-height:2">🛶 Đi đò: <b>${s.do || 0}</b><br>🎀 Treo dây đỏ: <b>${s.loc || 0}</b><br>🪷 Hoa đăng: <b>${s.hoadang || 0}</b><br>🧹 Quét sân: <b>${s.quet || 0}</b></div>`); });
if (!LIVE) icons('💌', 'Mời bạn', () => shareInvite(ui, { name: W.player.name, text: `${W.player.name} rủ bạn đi đò trẩy hội Hương Sơn online, cùng thắp hương và thả hoa đăng!`, place: 'huong' }));
icons('🔊', 'Âm thanh', (b) => { if (S.musicOn) { S.stopMusic(); b.firstChild.textContent = '🔇'; } else { startMusic(); b.firstChild.textContent = '🔊'; } });
function startMusic() { S.init(); S.music({ scale: [0, 2, 5, 7, 9], root: 293.66, beat: 0.7, inst: 'flute', gong: 24, rest: 0.4 }); }

// simulated shared presence
for (let i = 0; i < 4; i++) floatLantern(riverX(-50 + i * 12) + rnd(-2, 2), -50 + i * 12, LIVE ? "" : pick(NAMES));

// ---------- start ----------
let ambient = false; W.onFirstInput = () => { if (ambient) return; ambient = true; S.init(); S.ambient('water', 0.18); S.ambient('birds', 0.0); startMusic(); };
W.start(); document.getElementById('load').style.opacity = 0; setTimeout(() => document.getElementById('load').remove(), 700);
refGreeting(ui, r => `${r} mời bạn cùng trẩy hội Hương Sơn 🙏`);
await avatarCreator(W, ui, { key: 'kg_av_huong', title: 'Sửa soạn đi trẩy hội', namePH: 'Tên / pháp danh', hint: 'Lên chùa nên mặc kín đáo, màu nhã: áo tràng, áo dài kín, sơ mi dài tay và quần dài.', strict: true, outfits: [{ id: 'trang', label: 'Áo tràng lam (phật tử)', ap: { top: '#6f8fb8', bottom: '#6f8fb8', style: 'aodai' } }, { id: 'nau', label: 'Áo tràng nâu', ap: { top: '#8a6a4a', bottom: '#6a523a', style: 'aodai' } }, { id: 'aodai_kem', label: 'Áo dài màu kem', ap: { top: '#e8dcc0', bottom: '#e8dcc0', style: 'aodai' } }, { id: 'aodai_xam', label: 'Áo dài xám nhạt', ap: { top: '#a9a9a4', bottom: '#d8d4ca', style: 'aodai' } }, { id: 'somi', label: 'Sơ mi dài tay, quần dài', ap: { top: '#e9e6dc', bottom: '#3a3f4a', style: 'ao' } }],
  hats: { none: 'Không', nonla: 'Nón lá', khan: 'Khăn vấn' }, pets: { none: 'Không', dog: 'Chó vàng', cat: 'Mèo mướp', buffalo: 'Nghé con' } });
if (!ambient) W.onFirstInput();
W.restorePos(); ui.tutorial('move', MOVE_TUT);
{ let shown = false; W.onUpdate(() => { if (shown || W.player.riding) return; const P = W.player.pos; if (Math.hypot(P.x - DOCK1.x, P.z - DOCK1.z) < 9) { shown = true; ui.toast('Đến Bến Đục rồi! Lại gần bến và bấm “Lên đò” để đi chùa', 4500); } }); }
window.__W = W;

const clickAct = t => [...document.querySelectorAll('#kg-acts button')].find(b => b.textContent.includes(t))?.click();
dailyTasks({ ui, ST, page: 'huong', icons, chime: () => S.chime(), tasks: [
  { id: 'do', icon: '🛶', text: 'Lên đò', hint: 'Ngồi đò ngắm suối Yến', keys: ['do'], go: () => clickAct('Lên đò') },
  { id: 'quet', icon: '🧹', text: 'Quét sân chùa', hint: 'Giúp nhà chùa quét lá ở sân', keys: ['quet'], go: () => ui.fade(() => { W.player.riding = null; W.teleport(PAG.x, -78 + 8, Math.PI); ui.toast('Cầm chổi quét hết lá trên sân nhé', 4500); }) }] });
// Thắp hương, thỉnh chuông: việc tâm linh, không thưởng lá, không tính chuỗi ngày hay bộ đếm (như Tri Ân)
