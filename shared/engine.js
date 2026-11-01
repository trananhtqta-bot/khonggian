import { getProfile, update as updProfile } from './profile.js?v=17';
// Dưới Gốc Thị - small 3D engine (our own code). three.js r164 vendored.
import * as THREE from './three.module.min.js?v=17';
export { THREE };
export const isMobile = matchMedia('(pointer:coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[(Math.random() * a.length) | 0];

/* ---------------- materials helpers ---------------- */
const matCache = new Map();
export function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }));
  return matCache.get(k);
}
export function mesh(geo, color, o, pos, rot, scale) {
  const m = new THREE.Mesh(geo, typeof color === 'string' || typeof color === 'number' ? mat(color, o) : color);
  if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot); if (scale) m.scale.set(...scale);
  m.castShadow = true; m.receiveShadow = true; return m;
}
export const LIVE = (() => { try { const q = new URLSearchParams(location.search).get('live'); if (q === '1') sessionStorage.setItem('kg_live', '1'); if (q === '0') sessionStorage.removeItem('kg_live'); return sessionStorage.getItem('kg_live') === '1'; } catch (e) { return false; } })();
export const LIVE_LABEL = 'Game dựng với hỗ trợ AI · Trải nghiệm mô phỏng văn hóa, không phải nghi lễ thật';
export function label(text, color = '#fff', size = 0.32) {
  const c = document.createElement('canvas'), x = c.getContext('2d'); c.width = 256; c.height = 64;
  x.font = 'bold 30px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.55)'; x.strokeText(text, 128, 32); x.fillStyle = color; x.fillText(text, 128, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true, fog: false }));
  s.scale.set(size * 4, size, 1); s.renderOrder = 5; return s;
}
export function skyDome(top, bottom, horizonGlow = '#ffffff') {
  const g = new THREE.SphereGeometry(400, 24, 12);
  const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, bot: { value: new THREE.Color(bottom) }, glow: { value: new THREE.Color(horizonGlow) } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform vec3 top,bot,glow;varying vec3 vP;void main(){float h=clamp(vP.y,0.,1.);vec3 c=mix(bot,top,pow(h,.6));c=mix(c,glow,exp(-h*12.)*.5);gl_FragColor=vec4(c,1.);}' });
  const s = new THREE.Mesh(g, m); s.renderOrder = -10; return s;
}
export function waterMaterial(c1 = '#3f7f72', c2 = '#8fc2ad', opacity = 0.93) {
  const m = new THREE.ShaderMaterial({ transparent: opacity < 1, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: 0 }, c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) }, op: { value: opacity } }]),
    vertexShader: '#include <fog_pars_vertex>\nvarying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}',
    fragmentShader: '#include <fog_pars_fragment>\nuniform float t,op;uniform vec3 c1,c2;varying vec3 vW;void main(){float w=sin(vW.x*1.3+t*1.1)*sin(vW.z*1.1-t*.8)+.5*sin((vW.x+vW.z)*2.9+t*1.9)+.25*sin(vW.z*6.-t*3.);vec3 c=mix(c1,c2,.5+.22*w);c+=smoothstep(1.05,1.5,w)*.22;gl_FragColor=vec4(c,op);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n#include <fog_fragment>\n}' });
  return m;
}

/* ---------------- avatar ---------------- */
export const SKINS = ['#f6d7b5', '#eec39a', '#d9a77c', '#b98260', '#8d5a3b'];
export const HAIRS = { troc: 'Trọc', ngan: 'Ngắn', bui: 'Búi', dai: 'Dài', choi: 'Hai bím' };
export function makeAvatar(ap = {}) {
  ap = { skin: SKINS[0], hair: 'ngan', hairColor: '#2a1a10', top: '#7a9cc6', bottom: '#3d4a5c', style: 'ao', hat: 'none', scarf: false, scale: 1, ...ap };
  const root = new THREE.Group(), skin = mat(ap.skin, { roughness: 0.65 });
  const legG = new THREE.CapsuleGeometry(0.085, 0.32, 3, 8), armG = new THREE.CapsuleGeometry(0.065, 0.3, 3, 8);
  const mkLimb = (geo, m, x, y) => { const p = new THREE.Group(); p.position.set(x, y, 0); const l = mesh(geo, m); l.position.y = -0.2; p.add(l); return p; };
  const AD = !!ap.adult, HIP = AD ? 0.74 : 0.5;
  const legL = mkLimb(legG, mat(ap.bottom), -0.1, HIP), legR = mkLimb(legG, mat(ap.bottom), 0.1, HIP); if (AD) { legL.scale.set(1.05, 1.5, 1.05); legR.scale.set(1.05, 1.5, 1.05); }
  root.add(legL, legR);
  const upper = new THREE.Group(); upper.position.y = HIP; root.add(upper);
  const long = ap.style === 'aodai' || ap.style === 'trang' || ap.style === 'aotrang';
  const torso = mesh(new THREE.CylinderGeometry(0.17, long ? 0.3 : 0.22, long ? 0.75 : 0.5, 12), ap.top, { roughness: 0.9 });
  torso.position.y = long ? 0.13 : 0.25; if (AD) { torso.scale.set(1.08, 1.25, 0.9); torso.position.y = long ? 0.17 : 0.31; } upper.add(torso);
  if (ap.style === 'yem') { const y = mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), ap.bottom); y.position.set(0, 0.25, 0.18); upper.add(y); }
  if (ap.scarf) { const s = mesh(new THREE.ConeGeometry(0.09, 0.22, 3), '#d32f2f'); s.position.set(0, 0.42, 0.17); s.rotation.set(Math.PI, 0, 0); upper.add(s);
    const n = mesh(new THREE.TorusGeometry(0.15, 0.03, 6, 14), '#d32f2f'); n.rotation.x = Math.PI / 2; n.position.y = 0.5; upper.add(n); }
  if (ap.style === 'quandoi') { const b = mesh(new THREE.TorusGeometry(0.21, 0.03, 6, 16), '#5a3d1e'); b.rotation.x = Math.PI / 2; b.position.y = 0.05; upper.add(b); }
  const armL = mkLimb(armG, mat(ap.top), -0.24, 0.47), armR = mkLimb(armG, mat(ap.top), 0.24, 0.47);
  [armL, armR].forEach(a => { const h = mesh(new THREE.SphereGeometry(0.065, 8, 6), skin); h.position.y = -0.42; a.add(h); }); upper.add(armL, armR);
  if (AD) [armL, armR].forEach(a => { a.scale.set(1, 1.3, 1); a.position.y = 0.58; });
  const HEADY = AD ? 0.86 : 0.82; const head = new THREE.Group(); head.position.y = HEADY; if (AD) head.scale.setScalar(0.62); upper.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.3, 20, 16), skin));
  const eyeM = mat('#1d140e', { roughness: 0.3 });
  [-0.1, 0.1].forEach(x => { const e = mesh(new THREE.SphereGeometry(0.04, 8, 6), eyeM); e.position.set(x, 0.0, 0.27); e.scale.set(1, 1.25, 0.6); head.add(e);
    if (AD) return; const hl = mesh(new THREE.SphereGeometry(0.012, 6, 4), '#ffffff', { emissive: '#ffffff' }); hl.position.set(x + 0.012, 0.018, 0.295); head.add(hl);
    const b = mesh(new THREE.CircleGeometry(0.045, 10), new THREE.MeshBasicMaterial({ color: '#f29a9a', transparent: true, opacity: 0.55 })); b.position.set(x * 1.75, -0.08, 0.255); b.rotation.y = x * 2.2; head.add(b); });
  const mouth = mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 10, Math.PI), '#8a3a2a'); mouth.position.set(0, -0.1, 0.285); mouth.rotation.z = Math.PI; head.add(mouth);
  const hm = mat(ap.hairColor, { roughness: 0.55 });
  if (ap.hair !== 'troc') { const cap = mesh(new THREE.SphereGeometry(0.315, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hm); cap.rotation.x = -0.25; head.add(cap);
    const fr = mesh(new THREE.SphereGeometry(0.31, 16, 8, -0.9, 1.8, 0.35, 0.55), hm); fr.rotation.y = 0; head.add(fr); }
  if (ap.hair === 'bui') { const b = mesh(new THREE.SphereGeometry(0.13, 12, 10), hm); b.position.set(0, 0.2, -0.24); head.add(b); }
  if (ap.hair === 'dai') { const b = mesh(new THREE.CapsuleGeometry(0.2, 0.35, 4, 10), hm); b.position.set(0, -0.2, -0.16); b.scale.z = 0.5; head.add(b); }
  if (ap.hair === 'choi') [-1, 1].forEach(s => { const b = mesh(new THREE.CapsuleGeometry(0.06, 0.2, 3, 8), hm); b.position.set(0.27 * s, -0.12, -0.08); b.rotation.z = s * 0.3; head.add(b);
    const r = mesh(new THREE.SphereGeometry(0.05, 8, 6), '#e53950'); r.position.set(0.25 * s, 0.02, -0.08); head.add(r); });
  if (ap.hair === 'troc') { const t = mesh(new THREE.SphereGeometry(0.302, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), mat(ap.skin, { roughness: 0.4 })); head.add(t); }
  if (ap.hat === 'nonla') { const h = mesh(new THREE.ConeGeometry(0.55, 0.3, 24, 1, true), '#e9d49b', { side: THREE.DoubleSide, roughness: 0.9 }); h.position.y = 0.32; head.add(h); }
  if (ap.hat === 'tai_beo') { const h = mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.2, 18), '#5f6b3a'); h.position.y = 0.25; head.add(h); }
  if (ap.hat === 'no') { const h = mesh(new THREE.TorusKnotGeometry(0.06, 0.03, 30, 6), '#ff6f91'); h.position.set(0.2, 0.25, 0); head.add(h); }
  if (ap.hat === 'khan') { const h = mesh(new THREE.TorusGeometry(0.29, 0.06, 8, 20), '#c0392b'); h.rotation.x = Math.PI / 2 - 0.2; h.position.y = 0.12; head.add(h); }
  // held prop slot (broom, beads, incense…)
  const hand = new THREE.Group(); hand.position.y = -0.42; armR.add(hand);
  root.scale.setScalar(ap.scale);
  const av = { hip: HIP, headY: HEADY, tagY: AD ? 2.05 : 1.85, root, legL, legR, armL, armR, upper, head, hand, ap, walk: 0, seat: 0, bow: 0, bowT: 0, wave: 0 };
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return av;
}
export function setNameTag(av, name, color) { if (av.tag) av.root.remove(av.tag); if (LIVE) { av.tag = null; return; } av.tag = label(name, color); av.tag.position.y = av.tagY || 1.85; av.root.add(av.tag); }
export function animateAvatar(av, dt, speed = 0, t = performance.now() / 1000) {
  av.walk += dt * speed * 3.2;
  const s = Math.sin(av.walk) * clamp(speed / 2.5, 0, 1) * 0.7;
  av.seat += ((av.seated ? 1 : 0) - av.seat) * Math.min(1, dt * 6);
  if (av.bowT > 0) { av.bowT -= dt; } const bw = av.bowT > 0 ? Math.sin(Math.PI * clamp(1 - av.bowT / 2.2, 0, 1)) : 0;
  av.legL.rotation.x = s - av.seat * 1.45; av.legR.rotation.x = -s - av.seat * 1.45;
  av.root.children.forEach(() => {});
  av.upper.position.y = (av.hip || 0.5) - av.seat * (av.hip > 0.6 ? 0.5 : 0.32) + Math.abs(Math.sin(av.walk)) * 0.03 * clamp(speed, 0, 1);
  av.legL.position.y = av.legR.position.y = (av.hip || 0.5) - av.seat * (av.hip > 0.6 ? 0.5 : 0.32);
  av.upper.rotation.x = bw * (av.seated ? 1.1 : 0.85);
  const join = (av.seated || av.bowT > 0 || av.pray) ? 1 : 0;
  av.armL.rotation.x = -s * (1 - join) - join * 1.1 - (av.holdUp || 0); av.armR.rotation.x = s * (1 - join) - join * 1.1 - (av.holdUp || 0);
  av.armL.rotation.z = join * 0.55; av.armR.rotation.z = -join * 0.55;
  if (av.sweeping) { av.armR.rotation.x = -0.6 + Math.sin(t * 6) * 0.5; av.armR.rotation.z = -0.2; av.armL.rotation.x = -0.5 + Math.sin(t * 6) * 0.4; }
  av.head.rotation.y = Math.sin(t * 0.5 + av.root.id) * 0.12 * (speed < 0.1 ? 1 : 0);
  av.head.position.y = (av.headY || 0.82) + Math.sin(t * 2 + av.root.id) * 0.008;
}
export function bow(av) { av.bowT = 2.2; }

/* ---------------- pets ---------------- */
export function makePet(kind = 'dog') {
  const g = new THREE.Group(), P = { dog: ['#d9a35a', '#f3e2c4'], cat: ['#9b8a76', '#efe6da'], chick: ['#ffd84a', '#ff9f1c'], buffalo: ['#5d5d66', '#3b3b44'] }[kind] || ['#ccc', '#eee'];
  const b = mesh(new THREE.SphereGeometry(0.22, 12, 10), P[0]); b.scale.set(kind === 'chick' ? 1 : 0.9, 0.8, kind === 'chick' ? 1 : 1.35); b.position.y = 0.3; g.add(b);
  const h = mesh(new THREE.SphereGeometry(kind === 'chick' ? 0.15 : 0.17, 12, 10), P[0]); h.position.set(0, kind === 'chick' ? 0.52 : 0.48, kind === 'chick' ? 0.08 : 0.3); g.add(h);
  [-0.07, 0.07].forEach(x => { const e = mesh(new THREE.SphereGeometry(0.025, 6, 4), '#111'); e.position.set(x, h.position.y + 0.03, h.position.z + 0.14); g.add(e); });
  if (kind === 'dog' || kind === 'cat') [-1, 1].forEach(s => { const e = mesh(new THREE.ConeGeometry(0.06, 0.13, 4), P[0]); e.position.set(0.09 * s, h.position.y + 0.15, h.position.z - 0.02); e.rotation.z = kind === 'dog' ? s * 0.6 : 0; g.add(e); });
  if (kind === 'dog' || kind === 'cat' || kind === 'buffalo') { const sn = mesh(new THREE.SphereGeometry(0.08, 8, 6), P[1]); sn.position.set(0, h.position.y - 0.04, h.position.z + 0.14); g.add(sn); }
  if (kind === 'buffalo') [-1, 1].forEach(s => { const hn = mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 10, Math.PI), '#e8e0cc'); hn.position.set(0.05 * s, h.position.y + 0.12, h.position.z); hn.rotation.set(0, 0, s > 0 ? 0 : Math.PI); g.add(hn); });
  if (kind === 'chick') { const bk = mesh(new THREE.ConeGeometry(0.04, 0.08, 4), P[1]); bk.rotation.x = Math.PI / 2; bk.position.set(0, 0.5, 0.25); g.add(bk); }
  const tail = mesh(new THREE.CapsuleGeometry(0.03, 0.18, 2, 6), P[0]); tail.position.set(0, 0.38, -0.3); tail.rotation.x = -0.8; g.add(tail);
  const legs = []; if (kind !== 'chick') [[-0.1, 0.18], [0.1, 0.18], [-0.1, -0.18], [0.1, -0.18]].forEach(p => { const l = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 6), P[0]); l.position.set(p[0], 0.1, p[1]); g.add(l); legs.push(l); });
  return { root: g, tail, legs, kind, ph: Math.random() * 6 };
}

/* ---------------- audio ---------------- */
export class Sound {
  constructor() { this.ac = null; }
  init() { if (this.ac) return; const A = window.AudioContext || window.webkitAudioContext; if (!A) return; this.ac = new A(); this.out = this.ac.createGain(); this.out.gain.value = 0.7; this.out.connect(this.ac.destination);
    const len = this.ac.sampleRate * 2, b = this.ac.createBuffer(1, len, this.ac.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < len; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } this.brown = b;
    const wb = this.ac.createBuffer(1, len, this.ac.sampleRate), wd = wb.getChannelData(0); for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1; this.white = wb; }
  get t() { return this.ac.currentTime; }
  tone(f, dur = 1, vol = 0.1, type = 'sine', at = 0, attack = 0.01, dest) { if (!this.ac) return; const o = this.ac.createOscillator(), g = this.ac.createGain(), t = this.t + at;
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest || this.out); o.start(t); o.stop(t + dur + 0.05); return o; }
  noise(dur, vol, type = 'bandpass', f = 1000, q = 1, at = 0, buf) { if (!this.ac) return; const n = this.ac.createBufferSource(), fl = this.ac.createBiquadFilter(), g = this.ac.createGain(), t = this.t + at;
    n.buffer = buf || this.white; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); n.connect(fl).connect(g).connect(this.out); n.start(t); n.stop(t + dur + 0.05); }
  bell(base = 110, vol = 0.35) { [[1, 7, 1], [2.02, 5, 0.5], [2.76, 4, 0.35], [5.4, 2.5, 0.15], [8.9, 1.2, 0.07]].forEach(([m, d, v]) => this.tone(base * m, d, vol * v)); }
  mo() { this.tone(820, 0.18, 0.35, 'sine'); this.tone(410, 0.12, 0.2, 'triangle'); this.noise(0.03, 0.2, 'highpass', 2000); }
  drum(at = 0, v = 0.8) { if (!this.ac) return; const o = this.ac.createOscillator(), g = this.ac.createGain(), t = this.t + at; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.45);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7); o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.8); this.noise(0.08, v * 0.2, 'lowpass', 600, 1, at); }
  pluck(f, at = 0, vol = 0.12) { if (!this.ac) return; const o = this.tone(f, 1.8, vol, 'triangle', at, 0.005); if (o) { o.frequency.setValueAtTime(f * 1.02, this.t + at); o.frequency.exponentialRampToValueAtTime(f, this.t + at + 0.12); } this.tone(f * 2, 0.6, vol * 0.25, 'sine', at, 0.005); }
  flute(f, dur, at = 0, vol = 0.06) { if (!this.ac) return; const o = this.tone(f, dur, vol, 'sine', at, 0.15); if (!o) return; const l = this.ac.createOscillator(), lg = this.ac.createGain(); l.frequency.value = 5; lg.gain.value = f * 0.01; l.connect(lg).connect(o.frequency); l.start(this.t + at); l.stop(this.t + at + dur); this.noise(dur * 0.6, vol * 0.25, 'bandpass', f * 2, 3, at); }
  sweep() { this.noise(0.35, 0.12, 'bandpass', 2500, 0.7); }
  chime() { [0, 0.12, 0.24].forEach((a, i) => this.tone([1046, 1318, 1568][i], 1, 0.06, 'sine', a)); }
  ambient(kind, vol = 0.2) { if (!this.ac) return; const n = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain(); n.buffer = this.brown; n.loop = true;
    f.type = 'lowpass'; f.frequency.value = kind === 'water' ? 900 : kind === 'wind' ? 380 : 500; g.gain.value = vol; n.connect(f).connect(g).connect(this.out); n.start();
    const l = this.ac.createOscillator(), lg = this.ac.createGain(); l.frequency.value = 0.12; lg.gain.value = kind === 'water' ? 300 : 150; l.connect(lg).connect(f.frequency); l.start();
    if (kind === 'birds') setInterval(() => { if (Math.random() < 0.5) { const b = 2200 + Math.random() * 1500; for (let i = 0; i < 3; i++) { const o = this.tone(b, 0.12, 0.025, 'sine', i * 0.15); o && o.frequency.exponentialRampToValueAtTime(b * 1.4, this.t + i * 0.15 + 0.1); } } }, 3000);
    if (kind === 'cicada') { const o = this.ac.createOscillator(), bp = this.ac.createBiquadFilter(), cg = this.ac.createGain(), lf = this.ac.createOscillator(), lfg = this.ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 4100; bp.type = 'bandpass'; bp.frequency.value = 4400; bp.Q.value = 9; cg.gain.value = 0.004; lf.frequency.value = 0.15; lfg.gain.value = 0.004; lf.connect(lfg).connect(cg.gain); o.connect(bp).connect(cg).connect(this.out); o.start(); lf.start(); } }
  // generative pentatonic music (Vietnamese ngũ cung), synthesized - royalty free
  music({ scale = [0, 2, 5, 7, 9], root = 293.66, beat = 0.6, inst = 'pluck', gong = 16, vol = 1, rest = 0.35 } = {}) { if (!this.ac || this.musicOn) return; this.musicOn = true; let step = 0, idx = 2;
    const tick = () => { if (!this.musicOn) return; if (Math.random() > rest) { idx = clamp(idx + pick([-2, -1, -1, 0, 1, 1, 2]), 0, scale.length * 2 - 1);
        const f = root * Math.pow(2, (scale[idx % scale.length] + 12 * Math.floor(idx / scale.length)) / 12);
        if (inst === 'flute') this.flute(f, beat * 2.5, 0, 0.05 * vol); else if (inst === 'pad') { this.tone(f / 2, beat * 6, 0.03 * vol, 'sine', 0, beat * 2); } else this.pluck(f, 0, 0.09 * vol); }
      if (gong && step % gong === 0) this.tone(root / 4, 5, 0.06 * vol, 'sine'); step++; this.mt = setTimeout(tick, beat * 1000 * (Math.random() < 0.15 ? 2 : 1)); };
    tick(); }
  stopMusic() { this.musicOn = false; clearTimeout(this.mt); }
}

/* ---------------- UI ---------------- */
const CSS = `
.kg-ui{position:fixed;inset:0;pointer-events:none;font-family:"Be Vietnam Pro",system-ui,sans-serif;color:#2b2016;z-index:10;-webkit-user-select:none;user-select:none}
.kg-ui *{box-sizing:border-box}.kg-ui .pe{pointer-events:auto}
.kg-top{position:absolute;top:max(8px,env(safe-area-inset-top));left:8px;right:8px;display:flex;gap:6px;align-items:flex-start;justify-content:space-between}
.kg-title{background:var(--panel);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:14px;padding:6px 12px;box-shadow:0 4px 18px #0003}
.kg-title b{font-family:Georgia,serif;font-size:19px;color:var(--accent);display:block}.kg-title small{font-size:13px;opacity:.75}
.kg-icons{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:55%}
.kg-btn{border:0;border-radius:12px;padding:10px 14px;min-height:48px;min-width:48px;font:600 18px system-ui;background:var(--panel);color:var(--accent);box-shadow:0 3px 12px #0003;cursor:pointer;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:transform .12s}
.kg-btn:active{transform:scale(.93)}.kg-btn.main{background:var(--accent);color:var(--panelSolid)}
.kg-acts{position:absolute;right:8px;bottom:max(14px,env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:7px;align-items:flex-end}
.kg-acts .row{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;max-width:62vw}
#kg-ctx{font-size:19px;padding:14px 22px;min-height:56px;margin-bottom:6px;animation:kgp 1.2s infinite}@keyframes kgp{50%{box-shadow:0 0 0 6px var(--glow)}}
.kg-joy{position:absolute;width:120px;height:120px;border-radius:50%;background:#ffffff26;border:2px solid #ffffff66;display:none;transform:translate(-50%,-50%)}
.kg-joy i{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px;border-radius:50%;background:#ffffffcc;box-shadow:0 2px 8px #0004}
.kg-hint{position:absolute;left:10px;bottom:max(14px,env(safe-area-inset-bottom));font-size:14px;color:#fff;text-shadow:0 1px 3px #000;max-width:38vw;opacity:.85}
.kg-toast{position:absolute;bottom:calc(130px + env(safe-area-inset-bottom));left:50%;z-index:12;pointer-events:none;transform:translateX(-50%);background:var(--panel);padding:10px 16px;border-radius:14px;font-size:16px;box-shadow:0 4px 18px #0003;opacity:0;transition:opacity .4s;max-width:90vw;text-align:center}
.kg-live{position:fixed;right:6px;bottom:calc(6px + env(safe-area-inset-bottom));max-width:62vw;font-size:10.5px;line-height:1.3;color:#fff;background:#0008;padding:3px 7px;border-radius:8px;pointer-events:none;z-index:30;text-align:right}.kg-feed{position:absolute;left:8px;top:calc(134px + env(safe-area-inset-top));pointer-events:none;font-size:12px;color:#fff;text-shadow:0 1px 3px #000;max-width:58vw;display:flex;flex-direction:column;gap:3px}
.kg-feed div{animation:kgf 7s forwards}@keyframes kgf{0%{opacity:0;transform:translateX(-10px)}8%,80%{opacity:1;transform:none}100%{opacity:0}}
.kg-modal{position:absolute;inset:0;background:#0007;display:none;align-items:center;justify-content:center;pointer-events:auto;z-index:20}
.kg-card{width:min(92vw,420px);max-height:84vh;overflow:auto;background:var(--panelSolid);border-radius:18px;padding:18px;box-shadow:0 20px 60px #0008;animation:kgpop .35s}
.kg-card h2{font:600 20px Georgia,serif;color:var(--accent);margin:0 0 10px;text-align:center}
@keyframes kgpop{from{transform:scale(.85);opacity:0}}
.kg-creator{position:absolute;left:0;right:0;bottom:0;max-height:52vh;overflow:auto;background:var(--panelSolid);border-radius:20px 20px 0 0;padding:14px 16px 20px;pointer-events:auto;box-shadow:0 -10px 40px #0005;z-index:15}
.kg-creator h2{margin:0 0 6px;font:600 20px Georgia,serif;color:var(--accent);text-align:center}
.kg-row{margin:8px 0}.kg-row>span{font-size:12px;font-weight:700;opacity:.7;display:block;margin-bottom:4px}
.kg-chips{display:flex;gap:6px;flex-wrap:wrap}.kg-chip{border:2px solid transparent;border-radius:999px;padding:10px 14px;min-height:44px;font-size:15px;background:#0000000f;cursor:pointer}
.kg-chip.on{border-color:var(--accent);background:var(--glow)}.kg-sw{width:44px;height:44px;padding:0;border-radius:50%}
.kg-in{width:100%;padding:10px;border-radius:10px;border:1px solid #0003;font-size:16px;background:#fff8}
.kg-fade{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .5s;pointer-events:none;z-index:30}
.kg-foot{position:absolute;left:50%;transform:translateX(-50%);bottom:2px;font-size:10px}.kg-foot a{color:#fff;text-shadow:0 1px 2px #000}
.kg-map{display:grid;gap:8px}.kg-map button{text-align:left;padding:14px;min-height:56px;border-radius:12px;border:1px solid #0002;background:#ffffff80;font-size:17px;cursor:pointer}
.kg-map small{display:block;opacity:.7;font-size:12px;margin-top:2px}

.kg-icons .kg-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 8px;min-width:58px;line-height:1.1}
.kg-icons .kg-btn small{font-size:12px;font-weight:600;margin-top:2px;white-space:nowrap}
.kg-card{font-size:16px}.kg-card p{line-height:1.55}
.kg-close{position:sticky;top:0;float:right;width:44px;height:44px;border-radius:50%;border:0;background:#0000001a;font-size:22px;cursor:pointer;margin:-6px -6px 0 0}
.kg-outfit{position:absolute;left:50%;transform:translateX(-50%);top:calc(120px + env(safe-area-inset-top));display:flex;gap:6px;z-index:6}.kg-outfit .kg-btn{font-size:18px;min-height:48px}
.kg-bego{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;margin-top:12px;padding:12px 16px;border-radius:14px;background:#7a4a22;color:#fff8e8!important;font:700 17px system-ui;text-decoration:none;box-shadow:0 4px 14px #0003}
.kg-tut{position:absolute;inset:0;background:#000b;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;pointer-events:auto;z-index:25;text-align:center;padding:24px;font-size:19px;line-height:1.5}
.kg-tut .g{display:flex;gap:18px;flex-wrap:wrap;justify-content:center}.kg-tut .g div{background:#ffffff1a;border-radius:16px;padding:16px;width:min(42vw,220px)}.kg-tut .g i{display:block;font-style:normal;font-size:40px}
@media (min-width:900px){.kg-acts .row{max-width:520px}}
`;
export function makeUI(theme) {
  const st = document.createElement('style'); st.textContent = CSS + `:root{--accent:${theme.accent};--panel:${theme.panel};--panelSolid:${theme.panelSolid};--glow:${theme.glow}}`; document.head.appendChild(st);
  const ui = document.createElement('div'); ui.className = 'kg-ui';
  ui.innerHTML = `<div class="kg-top"><div class="kg-title pe"><a href="../" class="kg-brand" title="Dưới Gốc Thị · Bầu trời dưới gốc cây thị" style="display:block;font:600 11px system-ui;letter-spacing:.5px;color:var(--accent);opacity:.8;text-decoration:none;margin-bottom:1px">🌳 DƯỚI GỐC THỊ</a><b>${theme.title}</b><small id="kg-sub">${theme.sub || ''}</small></div><div class="kg-icons" id="kg-icons"></div></div>
  <div class="kg-feed" id="kg-feed"></div><div class="kg-toast" id="kg-toast"></div>
  <div class="kg-hint" id="kg-hint">${isMobile ? 'Kéo bên trái để đi · vuốt bên phải để xoay' : 'WASD / phím mũi tên để đi · kéo chuột để xoay · E để tương tác'}</div>
  <div class="kg-acts"><button class="kg-btn main pe" id="kg-ctx" style="display:none"></button><div class="row" id="kg-acts"></div></div>
  <div class="kg-joy" id="kg-joy"><i></i></div><div class="kg-modal" id="kg-modal"><div class="kg-card" id="kg-card"></div></div><div class="kg-fade" id="kg-fade"></div>
  ${theme.footer && !LIVE ? `<div class="kg-foot pe">${theme.footer}</div>` : ''}${LIVE ? `<div class="kg-live">${LIVE_LABEL}</div>` : ''}`;
  document.body.appendChild(ui);
  const $ = (id) => ui.querySelector('#' + id);
  const api = {
    root: ui, $,
    toast(s, ms = 2800) { const q = api._tq || (api._tq = []); if (q.length && q[q.length - 1][0] === s) return; q.push([s, ms]); if (q.length > 3) q.splice(1, q.length - 3); if (!api._tb) api._tnext(); },
    _tnext() { const e = $('kg-toast'), q = api._tq; if (!q.length) { api._tb = false; e.style.opacity = 0; return; } api._tb = true; const [s, ms] = q.shift(); e.textContent = s; api._tpos(); e.style.opacity = 1; clearTimeout(api._tt); api._tt = setTimeout(() => { e.style.opacity = 0; setTimeout(api._tnext, 380); }, q.length ? Math.min(ms, 2200) : ms); },
    _tpos() { const e = $('kg-toast'), a = ui.querySelector('.kg-acts'); if (!a) return; const r = a.getBoundingClientRect(), safe = 120; const w = Math.min(innerWidth * 0.9, 460); const leftFree = r.left - 16; if (leftFree >= Math.min(w, 300) + 16 && innerWidth >= 700) { e.style.left = (8 + leftFree / 2) + 'px'; e.style.maxWidth = (leftFree - 8) + 'px'; e.style.bottom = `calc(${safe}px + env(safe-area-inset-bottom))`; } else { e.style.left = '50%'; e.style.maxWidth = '90vw'; const b = Math.max(innerHeight - r.top + 12, safe); e.style.bottom = `calc(${b}px + env(safe-area-inset-bottom))`; } },
    feed(s) { if (LIVE) return; const f = $('kg-feed'), d = document.createElement('div'); d.textContent = s; f.appendChild(d); setTimeout(() => d.remove(), 7000); while (f.children.length > 4) f.firstChild.remove(); },
    modal(html, onMount) { $('kg-card').innerHTML = '<button class="kg-close" aria-label="Đóng" title="Đóng (Esc)">×</button>' + html; $('kg-card').querySelector('.kg-close').onclick = () => api.close(); $('kg-modal').style.display = 'flex'; onMount && onMount($('kg-card')); },
    close() { $('kg-modal').style.display = 'none'; },
    button(parent, text, fn, main) { const b = document.createElement('button'); b.className = 'kg-btn pe' + (main ? ' main' : ''); b.innerHTML = text; b.onclick = (e) => { e.stopPropagation(); fn(b); }; $(parent).appendChild(b); return b; },
    tutorial(id, steps) { if (localStorage.getItem('kg_tut_' + id)) return; const d = document.createElement('div'); d.className = 'kg-tut';
      d.innerHTML = `<b style="font-size:24px">Cách đi lại</b><div class="g">${steps.map(s => `<div><i>${s[0]}</i>${s[1]}</div>`).join('')}</div><button class="kg-btn main" style="font-size:20px;padding:14px 28px">Đã hiểu</button>`;
      const off = () => { d.remove(); localStorage.setItem('kg_tut_' + id, 1); }; d.querySelector('button').onclick = off; addEventListener('keydown', function k(e) { if (e.key === 'Escape') { off(); removeEventListener('keydown', k); } }); ui.appendChild(d); },
    async fade(fn) { const f = $('kg-fade'); f.style.opacity = 1; await new Promise(r => setTimeout(r, 500)); await fn(); f.style.opacity = 0; },
  };
  addEventListener('keydown', e => { if (e.key === 'Escape' && $('kg-modal').style.display === 'flex') { api.close(); api.onEsc?.(); } });
  $('kg-modal').addEventListener('click', (e) => { if (e.target.id === 'kg-modal') api.close(); });
  return api;
}

/* ---------------- world ---------------- */
export function createWorld(cfg) {
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2)); renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = cfg.exposure || 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  Object.assign(renderer.domElement.style, { position: 'fixed', inset: 0, touchAction: 'none' }); document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(cfg.fog[0], cfg.fog[1], cfg.fog[2]);
  scene.add(skyDome(...cfg.sky));
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 600);
  const hemi = new THREE.HemisphereLight(cfg.hemi?.[0] || '#ffffff', cfg.hemi?.[1] || '#556644', cfg.hemi?.[2] ?? 1.1); scene.add(hemi);
  const sun = new THREE.DirectionalLight(cfg.sun?.[0] || '#fff3dd', cfg.sun?.[1] ?? 2.2); sun.position.set(...(cfg.sunDir || [20, 30, 10]));
  sun.castShadow = true; const sm = isMobile ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm); Object.assign(sun.shadow.camera, { left: -18, right: 18, top: 18, bottom: -18, near: 1, far: 120 }); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

  const W = { THREE, scene, camera, renderer, sun, hemi, updates: [], colliders: [], interacts: [], npcs: [], heightAt: cfg.heightAt || (() => 0), walkable: cfg.walkable || (() => true), time: 0, frozen: false };
  // player
  const P = W.player = { pos: new THREE.Vector3(...(cfg.spawn || [0, 0, 0])), yaw: cfg.spawnYaw || 0, camYaw: (cfg.spawnYaw || 0) + Math.PI, camPitch: 0.34, camDist: isMobile ? 7.2 : 6.5, speed: 0, av: null, seatedAt: null, riding: null };
  W.setAvatar = (ap, name) => { if (P.av) scene.remove(P.av.root); P.av = makeAvatar(ap); setNameTag(P.av, name, cfg.meColor || '#ffe08a'); scene.add(P.av.root); P.name = name; };
  // input
  const keys = {}; addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyE') W.ui?.$('kg-ctx').click(); }); addEventListener('keyup', e => keys[e.code] = false);
  const joy = { id: null, x: 0, y: 0, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 }; const cv = renderer.domElement;
  cv.addEventListener('pointerdown', e => { W.sound?.init(); if (W.onFirstInput) { W.onFirstInput(); W.onFirstInput = null; }
    if (e.pointerType !== 'mouse' && e.clientX < innerWidth * 0.5 && joy.id === null) { joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0; const j = W.ui?.$('kg-joy'); if (j) { j.style.display = 'block'; j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.firstChild.style.transform = ''; } }
    else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; } cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (e.pointerId === joy.id) { let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const l = Math.hypot(dx, dy), m = 50; if (l > m) { dx *= m / l; dy *= m / l; } joy.x = dx / m; joy.y = dy / m; const k = W.ui?.$('kg-joy').firstChild; if (k) k.style.transform = `translate(${dx}px,${dy}px)`; }
    else if (e.pointerId === look.id) { P.camYaw -= (e.clientX - look.x) * 0.006; P.camPitch = clamp(P.camPitch + (e.clientY - look.y) * 0.004, 0.05, 1.2); look.x = e.clientX; look.y = e.clientY; } });
  const up = e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; const j = W.ui?.$('kg-joy'); if (j) j.style.display = 'none'; } if (e.pointerId === look.id) look.id = null; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { P.camDist = clamp(P.camDist + e.deltaY * 0.004, 2.5, 12); }, { passive: true });
  W.input = { keys, joy, auto: null }; // auto: scripted movement for previews {x,y}
  // colliders
  W.addCollider = (x, z, r) => W.colliders.push({ x, z, r });
  W.addBox = (x, z, hw, hd) => W.colliders.push({ x, z, hw, hd });
  function collide(p) {
    for (const c of W.colliders) {
      if (c.r) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.3; if (d < m && d > 1e-4) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } }
      else { const dx = p.x - c.x, dz = p.z - c.z, ox = c.hw + 0.3 - Math.abs(dx), oz = c.hd + 0.3 - Math.abs(dz); if (ox > 0 && oz > 0) { if (ox < oz) p.x += Math.sign(dx) * ox; else p.z += Math.sign(dz) * oz; } }
    }
  }
  W.addInteract = (o) => { W.interacts.push(o); return o; };
  W.onUpdate = (f) => W.updates.push(f);
  W.teleport = (x, z, yaw) => { tmp.set(x, 0, z); collide(tmp); collide(tmp); x = tmp.x; z = tmp.z; P.pos.set(x, W.heightAt(x, z), z); first = true; if (yaw !== undefined) { P.yaw = yaw; P.camYaw = yaw + Math.PI; } standUp(); };
  function standUp() { if (P.av) { P.av.seated = false; } P.seatedAt = null; }
  W.standUp = standUp;
  W.sit = (pos, yaw) => { P.pos.copy(pos); P.yaw = yaw; P.av.seated = true; P.seatedAt = pos.clone(); };
  // camera initial
  const camT = new THREE.Vector3(), camP = new THREE.Vector3(), rcDir = new THREE.Vector3(), ray = new THREE.Raycaster(); let first = true;
  W.occluders = []; W.addOccluder = (...o) => { W.occluders.push(...o); return o[0]; };
  const tmp = new THREE.Vector3(); let last = performance.now(), ctxCur = null;
  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; W.time += dt;
    // movement
    let ix = 0, iy = 0;
    if (keys.KeyW || keys.ArrowUp) iy -= 1; if (keys.KeyS || keys.ArrowDown) iy += 1; if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1;
    ix += joy.x; iy += joy.y; if (W.input.auto && !LIVE) { ix += W.input.auto.x; iy += W.input.auto.y; if (W.input.auto.turn) P.camYaw += W.input.auto.turn * dt; }
    const il = Math.min(1, Math.hypot(ix, iy));
    if (P.av && !W.frozen && !P.riding) {
      if (il > 0.1 && P.av.seated) standUp();
      if (il > 0.1) {
        const a = Math.atan2(-ix, -iy) + P.camYaw + Math.PI; // forward = away from camera
        const sp = (keys.ShiftLeft ? 5.2 : 3.4) * il; const nx = P.pos.x + Math.sin(a) * sp * dt, nz = P.pos.z + Math.cos(a) * sp * dt;
        tmp.set(nx, 0, nz); collide(tmp); if (W.walkable(tmp.x, tmp.z)) { P.pos.x = tmp.x; P.pos.z = tmp.z; } else if (W.walkable(tmp.x, P.pos.z)) P.pos.x = tmp.x; else if (W.walkable(P.pos.x, tmp.z)) P.pos.z = tmp.z;
        let d = a - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); P.yaw += d * Math.min(1, dt * 12); P.speed = sp;
      } else P.speed = 0;
      if (!P.av.seated) P.pos.y += (W.heightAt(P.pos.x, P.pos.z) - P.pos.y) * Math.min(1, dt * 15);
    }
    if (P.riding) P.riding(dt);
    if (cfg.saveKey && P.av && !W.frozen && !P.riding && !P.av.seated && (W._sv = (W._sv || 0) + dt) > 3) { W._sv = 0; try { localStorage.setItem('kg_pos_' + cfg.saveKey, JSON.stringify([+P.pos.x.toFixed(2), +P.pos.z.toFixed(2), +P.yaw.toFixed(2)])); } catch { } }
    if (P.av) { P.av.root.position.copy(P.pos); P.av.root.rotation.y = P.yaw; animateAvatar(P.av, dt, P.speed, W.time); }
    // npcs
    for (const n of W.npcs) n.update(dt);
    for (const f of W.updates) f(dt, W.time);
    // context interaction
    let best = null, bd = 1e9; for (const it of W.interacts) { if (it.enabled === false) continue; const d = Math.hypot(it.pos.x - P.pos.x, it.pos.z - P.pos.z); if (d < (it.r || 2) && d < bd) { bd = d; best = it; } }
    if (best !== ctxCur && W.ui) { ctxCur = best; const b = W.ui.$('kg-ctx'); if (best) { b.style.display = ''; b.innerHTML = best.label; b.onclick = (e) => { e?.stopPropagation?.(); W.sound?.init(); best.use(); }; } else b.style.display = 'none'; }
    W.ctx = best;
    // camera
    camT.set(P.pos.x, P.pos.y + (W.frozen ? -0.15 : 1.3), P.pos.z);
    const cd = P.camDist, cy = P.camYaw, cp = P.camPitch;
    camP.set(camT.x + Math.sin(cy) * Math.cos(cp) * cd, camT.y + Math.sin(cp) * cd, camT.z + Math.cos(cy) * Math.cos(cp) * cd);
    if (W.camLimit) W.camLimit(camP, camT);
    if (W.occluders.length) { rcDir.subVectors(camP, camT); const L = rcDir.length(); rcDir.normalize(); ray.set(camT, rcDir); ray.far = L;
      const hit = ray.intersectObjects(W.occluders, true).find(h => h.object.visible && h.object.material && !(h.object.material.transparent && h.object.material.opacity < 0.5) && !h.object.userData.noOcc);
      if (hit) camP.copy(camT).addScaledVector(rcDir, Math.max(0.6, hit.distance - 0.35)); }
    { const gy = W.heightAt(camP.x, camP.z) + 0.45; if (camP.y < gy) camP.y = gy; } // camera never below ground
    if (W.camFade) W.camFade(camera.position, camT);
    if (first) { camera.position.copy(camP); first = false; } else camera.position.lerp(camP, Math.min(1, dt * 8));
    camera.lookAt(camT);
    for (const n of W.npcs) { const r = n.root || n.av?.root; if (r) r.visible = r.position.distanceTo(camera.position) > 0.9 || (Math.abs(r.position.y + 1 - camera.position.y) > 1.6); }
    sun.position.set(P.pos.x + (cfg.sunDir || [20, 30, 10])[0], (cfg.sunDir || [20, 30, 10])[1], P.pos.z + (cfg.sunDir || [20, 30, 10])[2]); sun.target.position.copy(P.pos);
    renderer.render(scene, camera); requestAnimationFrame(step);
  }
  W.restorePos = () => { if (!cfg.saveKey) return false; try { const v = JSON.parse(localStorage.getItem('kg_pos_' + cfg.saveKey)); if (v && W.walkable(v[0], v[1])) { W.teleport(v[0], v[1], v[2]); return true; } } catch { } return false; };
  // PWA
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register(new URL('../sw.js?v=17', import.meta.url)).catch(() => { });
  W.start = () => requestAnimationFrame(step);
  W.camFocus = null;
  return W;
}

/* ---------------- NPCs (simulated co-visitors) ---------------- */
export function addNPC(W, { name, ap, area, spots = [], speed = 1.2, pet }) {
  const av = makeAvatar(ap); setNameTag(av, name, '#ffffff'); W.scene.add(av.root);
  const p = new THREE.Vector3(rnd(area[0], area[1]), 0, rnd(area[2], area[3])); let tgt = null, wait = rnd(0, 4), yaw = rnd(0, 6), mode = 'idle', petO = null;
  if (pet) { petO = makePet(pet); W.scene.add(petO.root); }
  const n = { av, name, pos: p, update(dt) {
    if (mode === 'idle') { wait -= dt; if (wait < 0) { if (spots.length && Math.random() < 0.35) { const s = pick(spots); tgt = new THREE.Vector3(s[0], 0, s[1]); n.spot = s; } else { n.spot = null; for (let k = 0; k < 10; k++) { const x = rnd(area[0], area[1]), z = rnd(area[2], area[3]); if (W.walkable(x, z)) { tgt = new THREE.Vector3(x, 0, z); break; } } } mode = 'walk'; av.seated = false; } }
    if (mode === 'walk' && tgt) { const dx = tgt.x - p.x, dz = tgt.z - p.z, d = Math.hypot(dx, dz); if (d < 0.2) { mode = 'idle'; wait = rnd(3, 10); if (n.spot) { yaw = n.spot[2] ?? yaw; if (n.spot[3] === 'sit') av.seated = true; else if (Math.random() < 0.6) bow(av); } }
      else { const a = Math.atan2(dx, dz); let dd = a - yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); yaw += dd * Math.min(1, dt * 6); p.x += Math.sin(yaw) * speed * dt; p.z += Math.cos(yaw) * speed * dt; } }
    p.y = av.seated ? p.y : W.heightAt(p.x, p.z);
    av.root.position.copy(p); av.root.rotation.y = yaw; animateAvatar(av, dt, mode === 'walk' ? speed : 0, W.time);
    if (petO) followPet(petO, p, yaw, dt, W);
  } };
  W.npcs.push(n); return n;
}
export function followPet(pet, target, yaw, dt, W) {
  const r = pet.root, ox = target.x - Math.sin(yaw) * 0.9 + Math.cos(yaw) * 0.6, oz = target.z - Math.cos(yaw) * 0.9 - Math.sin(yaw) * 0.6;
  const dx = ox - r.position.x, dz = oz - r.position.z, d = Math.hypot(dx, dz), t = W.time + pet.ph;
  if (d > 0.15) { const sp = Math.min(d * 2.5, 5); r.position.x += dx / d * sp * dt; r.position.z += dz / d * sp * dt; r.rotation.y = Math.atan2(dx, dz); pet.legs.forEach((l, i) => l.rotation.x = Math.sin(t * 14 + i * Math.PI) * 0.5 * Math.min(1, d)); }
  r.position.y = W.heightAt(r.position.x, r.position.z) + (pet.kind === 'chick' ? Math.abs(Math.sin(t * 8)) * 0.05 * Math.min(1, d * 3) : 0);
  pet.tail.rotation.z = Math.sin(t * 9) * 0.5;
}

/* ---------------- creator (try-on: avatar shown in the live world) ---------------- */
export function avatarCreator(W, ui, { key, title, outfits, hats = { none: 'Không' }, hairs = HAIRS, pets, defaults = {}, namePH = 'Tên hiển thị', extraNote = '', goLabel = 'Vào thôi', hint = '', strict = false }) {
  return new Promise((resolve) => {
    let saved = null; try { saved = JSON.parse(localStorage.getItem(key)); } catch { }
    let pc = null; try { pc = getProfile().character; } catch { }
    if (saved && typeof saved === 'object') { saved.name = cleanName(saved.name || '').slice(0, 16); if (!/^#[0-9a-f]{6}$/i.test(saved.skin)) delete saved.skin; for (const f of ['hair', 'outfit', 'hat', 'pet']) if (saved[f] != null && !/^[a-z0-9_-]{1,24}$/i.test(saved[f])) delete saved[f]; if (!hairs[saved.hair]) delete saved.hair; if (!outfits.some(o => o.id === saved.outfit)) delete saved.outfit; } else saved = null;
    // nhân vật đã tạo ở trang chủ: không hiện bảng tạo nhân vật, chỉ mời đổi trang phục cho cảnh này
    const quick = !!(pc && pc.name);
    const base = { name: pc?.name || '', skin: pc?.appearance?.skin || SKINS[0], hair: pc?.appearance?.hair && hairs[pc.appearance.hair] ? pc.appearance.hair : 'ngan', outfit: outfits[0].id, hat: 'none', pet: pets ? Object.keys(pets)[0] : null, ...defaults };
    const st = saved ? { ...base, ...saved } : { ...base };
    if (quick) { st.name = pc.name; if (!saved || !saved.custom) { st.skin = base.skin; st.hair = base.hair; } if (!strict && (!saved || !saved.outfitPicked)) st.top = pc.appearance.top; }
    if (strict) delete st.top; // cảnh trang nghiêm: chỉ dùng trang phục phù hợp của cảnh, không lấy màu áo tự do
    const apOf = () => { const o = outfits.find(x => x.id === st.outfit) || outfits[0]; return { skin: st.skin, hair: st.hair, hat: st.hat, ...o.ap, ...(st.top && /^#[0-9a-f]{6}$/i.test(st.top) ? { top: st.top } : {}) }; };
    const refresh = () => { W.setAvatar(apOf(), st.name || 'Bạn'); W.setPet?.(st.pet); };
    const chips = (field, obj) => Object.entries(obj).map(([k, v]) => `<button class="kg-chip ${st[field] === k ? 'on' : ''}" data-f="${field}" data-v="${k}">${v}</button>`).join('');
    function openPanel(done) {
      const box = document.createElement('div'); box.className = 'kg-creator';
      box.innerHTML = `<h2>${quick ? 'Trang phục cho cảnh này' : title}</h2>${hint ? `<p class="kg-ohint" style="margin:2px 0 8px;font-size:16px;opacity:.9">💡 ${hint}</p>` : ''}${quick ? '' : extraNote}${quick ? '' : `<div class="kg-row"><span>Tên</span><input class="kg-in" id="kgc-name" maxlength="16" placeholder="${namePH}" value="${cleanName(st.name || '')}"></div>`}
      <div class="kg-row"><span>Màu da</span><div class="kg-chips">${SKINS.map(s => `<button class="kg-chip kg-sw ${st.skin === s ? 'on' : ''}" style="background:${s}" data-f="skin" data-v="${s}"></button>`).join('')}</div></div>
      <div class="kg-row"><span>Kiểu tóc</span><div class="kg-chips">${chips('hair', hairs)}</div></div>
      <div class="kg-row"><span>Trang phục</span><div class="kg-chips">${chips('outfit', Object.fromEntries(outfits.map((o, i) => [o.id, o.label + (hint && i === 0 ? ' · gợi ý' : '')])))}</div></div>
      ${Object.keys(hats).length > 1 ? `<div class="kg-row"><span>Phụ kiện</span><div class="kg-chips">${chips('hat', hats)}</div></div>` : ''}
      ${pets ? `<div class="kg-row"><span>Bạn đồng hành</span><div class="kg-chips">${chips('pet', pets)}</div></div>` : ''}
      <button class="kg-btn main" id="kgc-go" style="width:100%;margin-top:10px;font-size:18px;min-height:52px">${quick ? 'Xong' : goLabel}</button>`;
      ui.root.appendChild(box);
      box.addEventListener('click', e => { const b = e.target.closest('.kg-chip'); if (!b) return; st[b.dataset.f] = b.dataset.v; if (b.dataset.f === 'outfit') { delete st.top; st.outfitPicked = true; } st.custom = true; box.querySelectorAll(`[data-f="${b.dataset.f}"]`).forEach(x => x.classList.toggle('on', x === b)); W.sound?.init(); W.sound?.tone(880, 0.2, 0.05); refresh(); });
      const ni = box.querySelector('#kgc-name'); if (ni) ni.oninput = (e) => { st.name = e.target.value; };
      const P = W.player, oldDist = P.camDist, oldPitch = P.camPitch; P.camDist = 5.6; P.camPitch = 0.08; W.frozen = true;
      const spin = (dt) => { if (W.frozen) P.camYaw += dt * 0.35; }; W.onUpdate(spin);
      refresh();
      box.querySelector('#kgc-go').onclick = () => { st.name = cleanName(st.name || '').slice(0, 16) || 'Bạn'; localStorage.setItem(key, JSON.stringify(st)); if (!quick) try { updProfile(p => { if (!p.character.name || p.character.name === 'Bạn') p.character.name = st.name; p.character.appearance.skin = st.skin; if (HAIRS_P.includes(st.hair)) p.character.appearance.hair = st.hair; }); } catch { } refresh(); box.remove(); W.frozen = false; P.camDist = oldDist; P.camPitch = oldPitch; P.camYaw = P.yaw + Math.PI; W.sound?.init(); done(); };
    }
    if (!quick) { openPanel(() => resolve(st)); return; }
    refresh(); resolve(st);
    const chip = document.createElement('div'); chip.className = 'kg-outfit pe'; chip.innerHTML = '<button class="kg-btn">👕 Đổi trang phục cho cảnh này?</button><button class="kg-btn" aria-label="Không, cảm ơn">×</button>';
    const [yes, no] = chip.querySelectorAll('button'); yes.onclick = (e) => { e.stopPropagation(); chip.remove(); openPanel(() => { }); }; no.onclick = (e) => { e.stopPropagation(); chip.remove(); };
    ui.root.appendChild(chip); setTimeout(() => chip.remove(), 15000);
  });
}
const HAIRS_P = ['ngan', 'dai', 'buoi', 'troc'];

/* ---------------- shared helpers: map, share, leaves (chore), beads, reader ---------------- */
export function mapView(W, ui, areas, title = 'Bản đồ') {
  ui.modal(`<h2>${title}</h2><div class="kg-map">${areas.map((a, i) => `<button data-i="${i}">${a.icon || '📍'} <b>${a.label}</b><small>${a.desc || ''}</small></button>`).join('')}</div>`, card => {
    card.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const a = areas[+b.dataset.i]; ui.close(); ui.fade(() => { W.player.riding = null; W.teleport(a.pos[0], a.pos[1], a.yaw); a.onArrive?.(); }); });
  });
}
export function shareInvite(ui, { name, text, place }) { if (LIVE) return;
  const u = new URL(location.href); u.search = ''; u.searchParams.set('ref', name || 'ban'); if (place) u.searchParams.set('o', place); const url = u.toString();
  text = `${text} · Dưới Gốc Thị – Bầu trời dưới gốc cây thị`; const msg = `${text} ${url}`;
  if (navigator.share) navigator.share({ title: document.title, text, url }).catch(() => { });
  else navigator.clipboard?.writeText(msg).then(() => { const n = ui.$('kg-card').querySelector('#kg-copied'); if (n) n.textContent = '✓ Đã chép link'; }).catch(() => { });
  ui.modal(`<h2>Mời bạn cùng đến</h2><p style="text-align:center;font-size:13px;opacity:.75;margin:0 0 6px">Dưới Gốc Thị · Bầu trời dưới gốc cây thị</p><p id="kg-invt" style="font-size:14px;line-height:1.5"></p><input id="kg-invu" class="kg-in" readonly onclick="this.select()"><p id="kg-copied" style="font-size:14px;color:var(--accent);margin:6px 0 0"></p><p style="font-size:12px;opacity:.7;margin-top:8px">Người bạn mời sẽ thấy lời chào từ bạn khi bấm vào link.</p>
  <div style="display:flex;gap:8px;margin-top:10px;justify-content:center"><a class="kg-btn" style="text-decoration:none" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}">Facebook</a><a class="kg-btn" style="text-decoration:none" target="_blank" rel="noopener" href="https://zalo.me/share?url=${encodeURIComponent(url)}">Zalo</a></div>`, card => { card.querySelector('#kg-invt').textContent = text; card.querySelector('#kg-invu').value = url; });
}
/* bỏ link, số điện thoại, ký tự lạ; tối đa 20 ký tự */
export function cleanName(t = '') { return String(t).replace(/https?:\/\/\S+|www\.\S+|\S+\.(com|vn|net|org|me|ly|io)\S*/gi, '').replace(/[+\d][\d .\-]{6,}\d/g, '').replace(/[<>"'`&\\{}=]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }
export function refGreeting(ui, fmt) { if (LIVE) return; const r = new URLSearchParams(location.search).get('ref'); if (r) setTimeout(() => { const c = cleanName(r); if (c) ui.toast(fmt(c), 5000); }, 1500); }
export function leafPatch(W, { center, radius, count = 50, colors = ['#b5803a', '#8f6a2c', '#c99a4a', '#7b5a28'], onDone, sound }) {
  const g = new THREE.PlaneGeometry(0.22, 0.12); const leaves = [];
  const im = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }), count); im.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
  for (let i = 0; i < count; i++) { const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * radius; const x = center[0] + Math.cos(a) * r, z = center[1] + Math.sin(a) * r;
    leaves.push({ x, z, alive: true }); e.set(-Math.PI / 2, 0, Math.random() * 6); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, W.heightAt(x, z) + 0.02 + i * 0.0003, z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); im.setColorAt(i, c.set(pick(colors))); }
  W.scene.add(im); let left = count;
  const patch = { im, leaves, get left() { return left; }, active: false,
    reset() { leaves.forEach((l, i) => { l.alive = true; const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * radius; l.x = center[0] + Math.cos(a) * r; l.z = center[1] + Math.sin(a) * r; e.set(-Math.PI / 2, 0, Math.random() * 6); q.setFromEuler(e); m4.compose(new THREE.Vector3(l.x, W.heightAt(l.x, l.z) + 0.02, l.z), q, new THREE.Vector3(1, 1, 1)); im.setMatrixAt(i, m4); }); left = count; im.instanceMatrix.needsUpdate = true; } };
  W.onUpdate(() => { if (!patch.active) return; const p = W.player.pos; let ch = false;
    leaves.forEach((l, i) => { if (l.alive && Math.hypot(l.x - p.x, l.z - p.z) < 0.9) { l.alive = false; left--; ch = true; m4.makeScale(0, 0, 0); im.setMatrixAt(i, m4); } });
    if (ch) { im.instanceMatrix.needsUpdate = true; if (Math.random() < 0.5) W.sound?.sweep(); if (left <= 0) { patch.active = false; onDone?.(); } } });
  return patch;
}
export function broom() { const g = new THREE.Group(); const h = mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), '#8a6a3a'); h.position.y = -0.2; g.add(h); const b = mesh(new THREE.ConeGeometry(0.16, 0.35, 8), '#d6b56a'); b.position.y = -0.85; g.add(b); g.rotation.x = 0.6; return g; }
export function beadsView(ui, { title = 'Tràng hạt', mantra = '', total = 108, sound, onRound }) {
  let n = +localStorage.getItem('kg_beads') || 0;
  ui.modal(`<h2>${title}</h2><div id="bd-ring" style="position:relative;width:240px;height:240px;margin:6px auto;touch-action:none"></div><p style="text-align:center;font-size:22px;margin:4px"><b id="bd-n">${n % total}</b> / ${total}</p><p style="text-align:center;font-style:italic;opacity:.8" id="bd-m">${mantra}</p><p style="text-align:center;font-size:12px;opacity:.6">Chạm vào vòng hạt (hoặc phím Space) để lần một hạt</p>`, card => {
    const ring = card.querySelector('#bd-ring'); const beads = [];
    for (let i = 0; i < 27; i++) { const a = i / 27 * 6.283; const d = document.createElement('div'); Object.assign(d.style, { position: 'absolute', width: '22px', height: '22px', borderRadius: '50%', left: 120 + Math.cos(a) * 100 - 11 + 'px', top: 120 + Math.sin(a) * 100 - 11 + 'px', background: 'radial-gradient(circle at 35% 30%,#e9b98a,#7b3f1d 70%)', boxShadow: '0 2px 4px #0005', transition: 'transform .2s' }); ring.appendChild(d); beads.push(d); }
    const tap = () => { n++; localStorage.setItem('kg_beads', n); card.querySelector('#bd-n').textContent = n % total; const b = beads[n % 27]; b.style.transform = 'scale(1.35)'; setTimeout(() => b.style.transform = '', 200); sound?.tone(660, 0.25, 0.05); if (n % total === 0) { sound?.bell(220, 0.2); onRound?.(); } };
    ring.onpointerdown = tap; const k = e => { if (e.code === 'Space') { e.preventDefault(); tap(); } }; addEventListener('keydown', k); card._off = () => removeEventListener('keydown', k);
  });
}
export function reader(ui, { title, sub, lines, beat = 2.2, onLine, onEnd, verb = 'Đang đọc' }) {
  ui.modal(`<h2>${title}</h2>${sub ? `<p style="text-align:center;font-size:12px;opacity:.7;margin:-4px 0 8px">${sub}</p>` : ''}<div id="rd" style="font-size:17px;line-height:1.8;text-align:center"></div><p id="rdp" style="text-align:center;font-size:14px;opacity:.75;margin:8px 0 0"></p>`, card => {
    const rdp = card.querySelector('#rdp'), T0 = Date.now(), TT = lines.length * beat; const tk = setInterval(() => { if (ui.$('kg-modal').style.display === 'none') return clearInterval(tk); const left = Math.max(0, Math.ceil(TT - (Date.now() - T0) / 1000)); rdp.textContent = left ? `${verb}… còn ${left} giây` : 'Xong'; if (!left) clearInterval(tk); }, 250);
    const rd = card.querySelector('#rd'); rd.innerHTML = lines.map((l, i) => `<div data-i="${i}" style="opacity:.35;transition:all .4s">${l}</div>`).join('');
    let i = 0; const go = () => { if (ui.$('kg-modal').style.display === 'none') return; rd.querySelectorAll('div').forEach((d, j) => { d.style.opacity = j === i ? 1 : j < i ? .55 : .35; d.style.fontWeight = j === i ? 700 : 400; d.style.color = j === i ? 'var(--accent)' : ''; });
      rd.children[i]?.scrollIntoView({ block: 'center', behavior: 'smooth' }); onLine?.(i, lines[i]); i++; if (i < lines.length) setTimeout(go, beat * 1000); else setTimeout(() => onEnd?.(), beat * 1000); }; go(); });
}
export function stats(ui, id) { const k = 'kg_stats_' + id; let s = {}; try { s = JSON.parse(localStorage.getItem(k)) || {}; } catch { } return { s, add(n, v = 1) { s[n] = (s[n] || 0) + v; localStorage.setItem(k, JSON.stringify(s)); return s[n]; } }; }

/* ---------------- Bè Gỗ link ---------------- */
export const BEGO_URL = 'https://facebook.com/begotrensong';
export function begoButton(text = 'Ghé Bè Gỗ Trên Sông') { if (LIVE) return ''; return `<a class="kg-bego" href="${BEGO_URL}" target="_blank" rel="noopener">🪵 ${text} ↗</a>`; }
export function doneCard(ui, { title = 'Hoàn thành', msg = '', icon = '🌸' }) { ui.modal(`<h2>${icon} ${title}</h2><p style="text-align:center">${msg}</p>${begoButton()}<button class="kg-btn" style="width:100%;margin-top:8px" onclick="this.closest('.kg-modal').style.display='none'">Tiếp tục</button>`); }
export const MOVE_TUT = isMobile ? [['👈', 'Đặt ngón tay bên <b>trái</b> màn hình và kéo để đi'], ['👉', 'Vuốt bên <b>phải</b> màn hình để xoay nhìn'], ['👆', 'Chạm nút lớn phía dưới để tương tác']] : [['⌨️', 'Phím <b>W A S D</b> hoặc mũi tên để đi'], ['🖱️', 'Kéo chuột để xoay nhìn, lăn chuột để xa/gần'], ['E', 'Phím <b>E</b> để tương tác · <b>Esc</b> để đóng hộp thoại']];
