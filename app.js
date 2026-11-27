{
const D = window.SOS_DATA;
const DAY = 864e5, HR = 36e5, MIN = 6e4;
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const dkey = d => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-' + pad(d.getDate()); };
const rupees = x => '₹' + Math.max(0, Math.floor(x)).toLocaleString('en-IN');
const dur = ms => { ms = Math.max(0, ms); const d = Math.floor(ms/DAY), h = Math.floor(ms%DAY/HR), m = Math.floor(ms%HR/MIN); return d ? d+'d '+h+'h' : h ? h+'h '+pad(m)+'m' : m+'m'; };
const pick = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { const b = a.slice(); for (let i = b.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const standalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const fmtHour = h => { const ap = h < 12 ? 'AM' : 'PM'; const x = h % 12 || 12; return x + ' ' + ap; };

/* ---------- state ---------- */
const KEY = 'sos.v2';
const S = (() => {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  return Object.assign({start:D.FALLBACK_START, best:0, installed:new Date().toISOString(), slips:[], urges:[], pinned:[], seen:{}, celebrated:-1, comebackDone:null, gateSkipped:false, poster:null}, s || {});
})();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save on this phone.'); } if (window.__ghDirty) window.__ghDirty(); };
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

const streakMs = () => Math.max(0, Date.now() - new Date(S.start).getTime());
const reachedCount = () => D.MILES.filter(m => streakMs() >= m.h*HR).length;
const wavesWon = () => S.urges.filter(u => u.outcome === 'won' || u.outcome === 'real').length;
const lastSlip = () => S.slips.length ? S.slips.reduce((a, b) => new Date(a.at) > new Date(b.at) ? a : b) : null;
const daysSinceInstall = () => Math.floor((new Date(dkey(new Date())) - new Date(dkey(S.installed))) / DAY);
if (S.celebrated < 0) { S.celebrated = reachedCount() - 1; save(); }
if (!S.weights) { S.weights = [{d:'2026-11-25', kg:93.25}]; save(); }
if (!S.food) { S.food = {}; save(); }
if (!S.prof) { S.prof = {h:184, age:null, act:1.375, def:500}; save(); }
if (!S.origin) { S.origin = S.slips.reduce((a, x) => new Date(x.at) < new Date(a) ? x.at : a, S.start); save(); }
const curWeight = () => S.weights.length ? S.weights[S.weights.length-1].kg : 93.25;
const bmiNow = () => (curWeight() / Math.pow(((S.prof && S.prof.h) || 184) / 100, 2)).toFixed(1);
const fill = s => String(s).replace('{liver}', (curWeight()*0.03).toFixed(1) + ' to ' + (curWeight()*0.05).toFixed(1) + ' kg').replace('{bmi}', bmiNow());

/* ---------- video storage (stays on this phone) ---------- */
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('sos', 1); r.onupgradeneeded = () => r.result.createObjectStore('files'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function idbPut(k, v) { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('files', 'readwrite'); t.objectStore('files').put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); }
async function idbGet(k) { const db = await idb(); return new Promise((res, rej) => { const r = db.transaction('files').objectStore('files').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
let videoURL = null;
async function loadVideo() {
  try { const v = await idbGet('video'); if (v && v.buf) { videoURL = URL.createObjectURL(new Blob([v.buf], {type: v.type || 'video/mp4'})); } } catch (e) {}
  renderAll();
}
function makePoster(url) {
  return new Promise(res => {
    const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    const done = x => { res(x); v.removeAttribute('src'); };
    v.addEventListener('loadeddata', () => { try { v.currentTime = Math.min(2, (v.duration || 3) / 3); } catch (e) { done(null); } });
    v.addEventListener('seeked', () => { try { const c = document.createElement('canvas'); c.width = c.height = 160; const s = Math.min(v.videoWidth, v.videoHeight); c.getContext('2d').drawImage(v, (v.videoWidth-s)/2, (v.videoHeight-s)/2, s, s, 0, 0, 160, 160); done(c.toDataURL('image/jpeg', .7)); } catch (e) { done(null); } });
    v.addEventListener('error', () => done(null));
    setTimeout(() => done(null), 8000);
    v.load();
  });
}
$('#vidFile').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  toast('Saving your video on this phone…');
  try {
    await idbPut('video', {type: f.type, buf: await f.arrayBuffer()});
    if (videoURL) URL.revokeObjectURL(videoURL);
    videoURL = URL.createObjectURL(f);
    S.poster = await makePoster(videoURL); save();
    toast('Video saved. It plays first in SOS.');
  } catch (err) { toast('Could not save the video. Try a shorter clip.'); }
  renderAll();
});

/* ---------- small UI helpers ---------- */
let toastT = 0;
function toast(t) { let el = $('#toastEl'); if (!el) { el = document.createElement('div'); el.id = 'toastEl'; el.className = 'toast'; document.body.appendChild(el); } el.textContent = t; el.classList.remove('hide'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.add('hide'), 3400); }
/* swipe down to close: sheets, stories, SOS, decoy app, celebrations.
   Starts only when the finger moves down and nothing under it is scrolled, so normal scrolling still works. */
function swipeDown(root, o) {
  let y0 = 0, x0 = 0, t0 = 0, dy = 0, armed = false, drag = false, el = null;
  const blocked = t => { for (let n = t; n && n !== document.body; n = n.parentElement) { if (n.scrollTop > 0) return true; if (n === root) break; } return false; };
  root.addEventListener('touchstart', e => {
    armed = false; if (e.touches.length !== 1 || (o.exclude && e.target.closest(o.exclude)) || blocked(e.target)) return;
    armed = true; drag = false; dy = 0; y0 = e.touches[0].clientY; x0 = e.touches[0].clientX; t0 = performance.now(); el = o.target ? o.target() : root;
  }, {passive:true});
  root.addEventListener('touchmove', e => {
    if (!armed) return;
    const y = e.touches[0].clientY, x = e.touches[0].clientX; dy = y - y0;
    if (!drag) {
      if (dy < -2 || Math.abs(x - x0) > Math.abs(dy) + 4) { armed = false; return; }
      if (e.cancelable) e.preventDefault();
      if (dy < 6) return;
      drag = true; el.style.transition = 'none'; o.start && o.start();
    }
    if (e.cancelable) e.preventDefault();
    const d = Math.max(0, dy - 6); el.style.transform = `translateY(${d}px)`; o.progress && o.progress(Math.min(1, d / (el.offsetHeight || 600)));
  }, {passive:false});
  const end = () => {
    if (!armed) return; armed = false; if (!drag) return; drag = false; root.dataset.swiped = Date.now();
    const v = dy / Math.max(1, performance.now() - t0), h = el.offsetHeight || 600;
    el.style.transition = 'transform .24s cubic-bezier(.2,.8,.3,1)';
    if (dy > Math.min(150, h * 0.22) || v > 0.55) {
      el.style.transform = `translateY(${h + 40}px)`; o.progress && o.progress(1);
      setTimeout(() => { el.style.transition = ''; el.style.transform = ''; o.close(); }, 230);
    } else { el.style.transform = ''; o.progress && o.progress(0); setTimeout(() => { el.style.transition = ''; }, 250); o.cancel && o.cancel(); }
  };
  root.addEventListener('touchend', end); root.addEventListener('touchcancel', end);
}
const justSwiped = el => Date.now() - (+el.dataset.swiped || 0) < 400;
function sheet(html, onMount) {
  closeSheet();
  const l = $('#layer');
  l.innerHTML = '<div class="scrim" id="scrim"></div><section class="sheet" role="dialog" aria-modal="true"><div class="grab"></div><div class="wrap">' + html + '</div></section>';
  $('#scrim').onclick = closeSheet;
  const sh = l.querySelector('.sheet'), sc = $('#scrim');
  swipeDown(sh, {exclude: 'input,textarea,select', progress: p => { sc.style.opacity = 1 - p * 0.9; }, close: closeSheet});
  if (onMount) onMount(l);
}
function closeSheet() { $('#layer').innerHTML = ''; }

/* ---------- art ---------- */
const ART = {
  burger: c => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect x="30" y="140" width="140" height="18" rx="8" fill="#c86a2c"/><rect x="36" y="118" width="128" height="22" rx="10" fill="#5a2a12"/><rect x="30" y="110" width="140" height="10" rx="5" fill="${c||'#f2c14e'}"/><rect x="34" y="100" width="132" height="12" rx="6" fill="#79b84a"/><path d="M30 100 Q100 20 170 100Z" fill="#e08a3a"/><g fill="#fbe3b8"><circle cx="80" cy="70" r="3"/><circle cx="100" cy="58" r="3"/><circle cx="122" cy="72" r="3"/><circle cx="92" cy="84" r="3"/><circle cx="114" cy="88" r="3"/></g></svg>`,
  chips: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M40 150 L80 60 L120 150Z" fill="#e9b949"/><path d="M90 160 L130 70 L170 160Z" fill="#d9a032"/><path d="M60 170 L100 90 L140 170Z" fill="#f2c95c"/><g fill="#c0392b"><circle cx="78" cy="120" r="4"/><circle cx="128" cy="128" r="4"/><circle cx="100" cy="146" r="4"/></g></svg>`,
  drum: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><ellipse cx="92" cy="92" rx="52" ry="44" fill="#c46a26" transform="rotate(-30 92 92)"/><rect x="122" y="118" width="16" height="46" rx="8" fill="#f3e3c3" transform="rotate(-38 130 140)"/><circle cx="152" cy="160" r="11" fill="#f3e3c3"/><circle cx="162" cy="150" r="11" fill="#f3e3c3"/></svg>`,
  cup: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M60 100 L100 180 L140 100Z" fill="#d9a066"/><circle cx="80" cy="92" r="26" fill="#5a2e1a"/><circle cx="120" cy="92" r="26" fill="#7a4a2a"/><circle cx="100" cy="68" r="26" fill="#4a2414"/></svg>`,
  glass: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M60 40 H140 L128 176 H72Z" fill="#ffffff22" stroke="#ffffff88" stroke-width="3"/><path d="M66 80 H134 L126 172 H74Z" fill="#7ef0b555"/><g fill="#ffffffaa"><circle cx="90" cy="140" r="4"/><circle cx="110" cy="120" r="3"/><circle cx="100" cy="100" r="3"/><circle cx="116" cy="150" r="4"/></g><rect x="112" y="20" width="8" height="80" rx="4" fill="#ff6b57" transform="rotate(12 116 60)"/></svg>`,
  bowl: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="#f3ead8"><circle cx="70" cy="96" r="16"/><circle cx="100" cy="88" r="16"/><circle cx="130" cy="96" r="16"/><circle cx="86" cy="112" r="16"/><circle cx="116" cy="112" r="16"/></g><path d="M30 110 H170 A70 60 0 0 1 30 110Z" fill="#6a5a2a"/></svg>`,
  jar: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect x="64" y="40" width="72" height="20" rx="6" fill="#ddd"/><rect x="52" y="60" width="96" height="116" rx="22" fill="#b22a1a"/><rect x="64" y="96" width="72" height="40" rx="8" fill="#f3ead8"/></svg>`,
  rupee: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="80" fill="#ffffff12" stroke="#ff6b57" stroke-width="6"/><text x="100" y="138" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="110" fill="#fff">₹</text></svg>`,
  bugs: () => { let g = ''; let s = 7; for (let i = 0; i < 40; i++) { s = s*16807 % 2147483647; const x = 20 + s % 160; s = s*16807 % 2147483647; const y = 20 + s % 160; const dead = i % 3 === 0; g += `<circle cx="${x}" cy="${y}" r="${dead?6:8}" fill="${dead?'#ffffff22':'#7ef0b5'}"/>`; } return `<svg viewBox="0 0 200 200" aria-hidden="true">${g}</svg>`; },
  bed: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect x="20" y="110" width="160" height="22" rx="6" fill="#dfe9f1"/><rect x="20" y="70" width="12" height="90" rx="4" fill="#9fb3c4"/><rect x="168" y="96" width="12" height="64" rx="4" fill="#9fb3c4"/><rect x="40" y="92" width="44" height="20" rx="10" fill="#fff"/><path d="M120 40 h20 v20 h20 v20 h-20 v20 h-20 v-20 h-20 v-20 h20z" fill="#ff6b57"/></svg>`,
  heart: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 170 C40 120 20 90 30 64 C42 34 82 30 100 60 C118 30 158 34 170 64 C180 90 160 120 100 170Z" fill="#ff6b57"/><path d="M40 100 H76 L88 76 L104 124 L116 100 H160" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round"/></svg>`,
  liver: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M24 86 C30 50 110 40 172 62 C186 70 180 96 160 110 C130 132 92 150 62 140 C36 130 20 110 24 86Z" fill="#b8865b"/><g fill="#f2d9a6aa"><circle cx="70" cy="90" r="9"/><circle cx="100" cy="80" r="7"/><circle cx="126" cy="98" r="10"/><circle cx="92" cy="114" r="6"/></g></svg>`,
  brain: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M60 150 C30 140 26 100 44 86 C34 60 60 36 86 44 C96 26 130 28 140 46 C166 44 182 72 168 94 C182 116 162 146 136 142 C124 160 84 162 60 150Z" fill="#d9a0b0"/><path d="M100 46 V150 M64 92 C80 86 92 100 100 96 M136 90 C120 84 110 100 100 104 M70 124 C84 118 92 130 100 126" fill="none" stroke="#8a4a5a" stroke-width="5" stroke-linecap="round"/></svg>`,
  moon: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M128 30a74 74 0 1 0 42 128A64 64 0 0 1 128 30z" fill="#f3e6c8"/><g fill="#fff"><circle cx="40" cy="44" r="3"/><circle cx="62" cy="20" r="2"/><circle cx="166" cy="30" r="2.5"/></g></svg>`,
  salt: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M66 70h68l10 110H56z" fill="#e8eef2"/><path d="M70 40h60v30H70z" fill="#9fb3c4"/><g fill="#5a6b78"><circle cx="86" cy="54" r="4"/><circle cx="100" cy="50" r="4"/><circle cx="114" cy="54" r="4"/></g><g fill="#fff"><circle cx="40" cy="120" r="3"/><circle cx="160" cy="100" r="3"/><circle cx="150" cy="150" r="2"/></g></svg>`,
  hourglass: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect x="50" y="20" width="100" height="14" rx="7" fill="#d9a066"/><rect x="50" y="166" width="100" height="14" rx="7" fill="#d9a066"/><path d="M62 34h76c0 40-30 50-30 66s30 26 30 66H62c0-40 30-50 30-66s-30-26-30-66z" fill="#ffffff22" stroke="#ffffffaa" stroke-width="3"/><path d="M76 150h48c-6-14-18-18-24-26-6 8-18 12-24 26z" fill="#ff6b57"/></svg>`,
  male: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="86" cy="116" r="50" fill="none" stroke="#7fb6ff" stroke-width="14"/><path d="M122 80l42-42M130 38h34v34" fill="none" stroke="#7fb6ff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  flask: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M80 24h40v54l44 82a14 14 0 0 1-12 20H48a14 14 0 0 1-12-20l44-82z" fill="#ffffff1f" stroke="#ffffffaa" stroke-width="4"/><path d="M58 130h84l18 32a8 8 0 0 1-7 12H47a8 8 0 0 1-7-12z" fill="#ffd166"/><g fill="#fff8"><circle cx="90" cy="146" r="6"/><circle cx="112" cy="156" r="4"/></g></svg>`,
  patty: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M30 150 L100 40 L170 150Z" fill="#e0a85a"/><path d="M42 140 L100 52 L158 140Z" fill="#f0c27a"/><g stroke="#c98a3a" stroke-width="3"><path d="M60 128h80M72 108h56M84 88h32"/></g></svg>`,
  pipe: () => `<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M10 70 H70 C100 70 110 90 130 90 H190 V110 H130 C110 110 100 130 70 130 H10Z" fill="#ff6b5733" stroke="#ff6b57" stroke-width="4"/><path d="M10 84 H70 C96 84 108 98 130 98 H190 V102 H130 C108 102 96 116 70 116 H10Z" fill="#ff6b57"/></svg>`
};

/* ---------- body map ---------- */
function organState(id) {
  const i = D.MILES.findIndex(m => m.organ === id), r = reachedCount();
  return i < r ? 'on' : i === r ? 'next' : 'off';
}
function bodySVG() {
  const c = id => 's-' + organState(id);
  return `<svg viewBox="0 0 390 420" aria-hidden="true">
  <defs><radialGradient id="glow" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#7ef0b5" stop-opacity=".2"/><stop offset="1" stop-color="#7ef0b5" stop-opacity="0"/></radialGradient>
  <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f3a2f"/><stop offset="1" stop-color="#13251e"/></linearGradient></defs>
  <ellipse cx="195" cy="215" rx="175" ry="215" fill="url(#glow)"/>
  <circle cx="195" cy="58" r="36" fill="url(#skin)" stroke-width="3" class="org line ${c('face')}"/>
  <path d="M150 104 Q195 92 240 104 L262 150 Q270 230 252 300 L242 330 L148 330 L138 300 Q120 230 128 150 Z" fill="url(#skin)" stroke="#3f6b58" stroke-width="1.5"/>
  <path d="M128 150 Q100 210 96 280 L110 284 Q122 220 142 176 Z" fill="url(#skin)" stroke="#3f6b58" stroke-width="1.5"/>
  <path d="M262 150 Q290 210 294 280 L280 284 Q268 220 248 176 Z" fill="url(#skin)" stroke="#3f6b58" stroke-width="1.5"/>
  <path d="M150 330 L146 455 L178 455 L192 344 L198 344 L212 455 L244 455 L240 330 Z" fill="url(#skin)" stroke="#3f6b58" stroke-width="1.5"/>
  <path d="M178 46 q17 -18 34 0 q8 16 -17 24 q-25 -8 -17 -24z" class="org ${c('brain')}"/>
  <path d="M184 80 q11 7 22 0" fill="none" stroke-width="4" stroke-linecap="round" class="org line ${c('tongue')}"/>
  <path d="M195 112 L195 322 M195 180 L150 230 M195 180 L240 230" fill="none" stroke-width="2.5" stroke-dasharray="4 6" class="org line ${c('arteries')}"/>
  <path d="M203 150 c-10 -14 -30 -4 -22 12 c4 8 22 20 22 20 c0 0 18 -12 22 -20 c8 -16 -12 -26 -22 -12z" class="org ${c('arteries')}"/>
  <path d="M146 196 q30 -14 52 -6 q6 16 -8 24 q-28 8 -44 -4 q-8 -8 0 -14z" class="org ${c('liver')}"/>
  <path d="M212 190 q26 -6 32 14 q2 18 -22 20 q-14 0 -14 -14z" class="org ${c('appetite')}"/>
  <path d="M168 242 q27 -9 54 0 q10 14 0 30 q-27 10 -54 0 q-10 -16 0 -30z M178 252 q17 -5 34 0 M178 262 q17 5 34 0" fill="none" stroke-width="4" stroke-linecap="round" class="org line ${c('gut')}"/>
  <circle cx="182" cy="306" r="7" class="org ${c('hormones')}"/><circle cx="208" cy="306" r="7" class="org ${c('hormones')}"/>
  <defs><linearGradient id="fadeb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a100d" stop-opacity="0"/><stop offset="1" stop-color="#0a100d"/></linearGradient></defs><rect x="0" y="350" width="390" height="70" fill="url(#fadeb)"/>
  </svg>`;
}
function renderBodyMap() {
  const ms = streakMs();
  let h = '<div class="figwrap">' + bodySVG() + '</div><div class="ogrid">';
  for (const o of D.ORGANS) {
    const i = D.MILES.findIndex(m => m.organ === o.id), m = D.MILES[i], st = organState(o.id);
    const sub = st === 'on' ? (o.id === 'arteries' ? 'Recovering now' : 'Repairing') : st === 'next' ? m.tag + ' · in <em style="font-style:normal" data-cd="' + m.h + '">' + dur(m.h*HR - ms) + '</em>' : 'Locked · ' + m.tag;
    h += `<button class="chip ${st}" data-mile="${i}"><i></i><span><b>${o.name}</b><span>${sub}</span></span></button>`;
  }
  $('#bodymap').innerHTML = h + '</div>';
}
$('#bodymap').addEventListener('click', e => { const b = e.target.closest('[data-mile]'); if (b) mileSheet(+b.dataset.mile); });

function mileSheet(i) {
  const m = D.MILES[i], r = reachedCount(), st = i < r ? 'on' : i === r ? 'next' : 'off';
  const status = st === 'on' ? 'Unlocked' : st === 'next' ? 'Unlocks in ' + dur(m.h*HR - streakMs()) : 'Locked until ' + m.tag;
  sheet(`<div class="mute" style="font-weight:700;color:${st==='on'?'var(--mint)':st==='next'?'var(--coral)':'var(--mute)'}">${m.tag} · ${status}</div>
    <div class="q" style="margin-top:4px">${m.title}</div>
    <p style="color:#dfeee6;font-size:16px;${st==='off'?'filter:blur(5px);user-select:none':''}">${fill(m.body)}</p>
    <p style="font-size:13px">${m.src}</p><button class="btn dim full" id="shClose">Close</button>`, () => { $('#shClose').onclick = closeSheet; });
}
function allMilesSheet() {
  const r = reachedCount(), ms = streakMs();
  sheet('<div class="q">Every milestone</div><div class="mlist">' + D.MILES.map((m, i) => {
    const st = i < r ? 'on' : i === r ? 'next' : 'off';
    const when = st === 'on' ? 'Unlocked' : st === 'next' ? 'in ' + dur(m.h*HR - ms) : 'Locked';
    return `<div class="mrow ${st}"><i></i><div><b>${m.tag} · ${m.title}</b><span>${when} · ${m.src}</span><p>${fill(m.body)}</p></div></div>`;
  }).join('') + '</div><button class="btn dim full" id="shClose">Close</button>', () => { $('#shClose').onclick = closeSheet; });
}
$('#openMiles').onclick = allMilesSheet;

/* ---------- stories ---------- */
function videoDeck() { return videoURL ? {id:'you', label:'You, 1:44 AM', video:true, color:'#000', frames:[{}]} : null; }
function availableDecks() {
  const n = daysSinceInstall(), v = videoDeck();
  return (v ? [v] : []).concat(D.DECKS.filter(d => n >= d.unlock));
}
function isSeen(d) { return d.video ? S.seen.you === dkey(new Date()) : !!S.seen[d.id]; }
function bubStyle(d) { const img = S.avatar || S.poster; return d.video ? (img ? `background-image:url(${img})` : 'background:#2b4d3f') : `background:${d.color}`; }
function renderStoryRow() {
  const decks = availableDecks().sort((a, b) => (isSeen(a) - isSeen(b)) || (a.video ? -1 : 0));
  const n = daysSinceInstall();
  const locked = D.DECKS.filter(d => n < d.unlock).sort((a, b) => a.unlock - b.unlock).slice(0, 1);
  $('#storyRow').innerHTML = decks.map(d => `<button class="st" data-deck="${d.id}"><span class="ring ${isSeen(d)?'seen':''}"><span class="bub" style="${bubStyle(d)}">${d.video?'':d.glyph}</span></span><small>${d.label}</small></button>`).join('') +
    locked.map(d => `<div class="st locked"><span class="ring lock"><span class="bub" style="background:#13251e;color:#8fb3a2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span></span><small>${d.unlock - n === 1 ? 'Tomorrow' : 'In ' + (d.unlock - n) + ' days'}</small></div>`).join('') +
    (videoURL ? '' : `<button class="st" id="addVid"><span class="ring seen"><span class="bub" style="background:#13251e;font-size:26px">+</span></span><small>Add video</small></button>`);
}
$('#storyRow').addEventListener('click', e => {
  if (e.target.closest('#addVid')) { switchTab('you'); return; }
  const b = e.target.closest('[data-deck]'); if (!b) return;
  const decks = availableDecks().sort((a, b) => (isSeen(a) - isSeen(b)) || (a.video ? -1 : 0));
  openStories(decks, decks.findIndex(d => d.id === b.dataset.deck));
});
function renderStoryList() {
  const n = daysSinceInstall();
  const v = videoDeck();
  const rows = (v ? [v] : []).concat(D.DECKS).map(d => {
    const open = d.video || n >= d.unlock;
    const left = d.unlock - n;
    return `<button class="card" ${open ? `data-deck="${d.id}"` : 'disabled'} style="margin-top:0"><span class="ring ${open ? (isSeen(d)?'seen':'') : 'lock'}" style="width:58px;height:58px;flex:none"><span class="bub" style="${bubStyle(d)};font-size:12px">${d.video?'':d.glyph}</span></span><span><b>${d.label}</b><span>${open ? (d.video ? 'Your own message' : d.frames.length + ' slides' + (isSeen(d) ? ' · watched' : ' · new')) : 'Unlocks ' + (left === 1 ? 'tomorrow' : 'in ' + left + ' days')}</span></span></button>`;
  }).join('');
  $('#storyList').innerHTML = rows;
}
$('#storyList').addEventListener('click', e => {
  const b = e.target.closest('[data-deck]'); if (!b) return;
  const decks = availableDecks();
  openStories(decks, decks.findIndex(d => d.id === b.dataset.deck));
});

const SV = {decks:[], di:0, fi:0, t0:0, el:0, paused:true, raf:0, dur:7500, hold:0, holding:false, quiz:false, ctrl:null};
const stv = $('#stvid');
const SPK_ON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/></svg>';
const SPK_OFF = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
if (S.sound === undefined) S.sound = true;
FX.setEnabled(S.sound);
function setSound(v) { S.sound = v; save(); FX.setEnabled(v); $$('.sndbtn').forEach(b => { b.innerHTML = (v ? SPK_ON : SPK_OFF) + (b.dataset.lab ? '<span>' + (v ? 'Sound' : 'Muted') + '</span>' : ''); b.setAttribute('aria-label', v ? 'Mute' : 'Turn sound on'); }); }
function openStories(decks, di) {
  if (di < 0) return;
  FX.ctx(); FX.unlock();
  SV.decks = decks; SV.di = di; SV.fi = 0;
  $('#story').classList.remove('hide');
  setSound(S.sound);
  renderFrame();
}
function closeStories() { cancelAnimationFrame(SV.raf); if (SV.ctrl) SV.ctrl.stop(); FX.stop(); FX.quiet(); stv.pause(); stv.classList.add('hide'); $('#story').classList.add('hide'); renderAll(); }
function renderFrame() {
  const d = SV.decks[SV.di];
  if (d.video) S.seen.you = dkey(new Date()); else S.seen[d.id] = true;
  save();
  if (SV.ctrl) { SV.ctrl.stop(); SV.ctrl = null; }
  $('#segs').innerHTML = d.frames.map((_, i) => `<div><i style="width:${i < SV.fi ? 100 : 0}%"></i></div>`).join('');
  $('#sBub').setAttribute('style', bubStyle(d)); $('#sBub').textContent = d.video ? '' : d.glyph;
  $('#sName').textContent = d.label;
  $('#sMeta').textContent = d.video ? 'Your message' : d.week ? 'Your week' : 'True story · ' + (SV.fi+1) + ' of ' + d.frames.length;
  SV.quiz = false;
  if (d.video) {
    FX.stop(); FX.quiet();
    $('#sScene').classList.add('hide'); stv.classList.remove('hide');
    stv.src = videoURL; stv.muted = false; stv.currentTime = 0;
    stv.play().catch(() => { $('#sMeta').textContent = 'Tap to play'; });
  } else {
    stv.pause(); stv.classList.add('hide'); $('#sScene').classList.remove('hide');
    const f = Object.assign({}, d.frames[SV.fi]); f.body = fill(f.body || ''); f.big = fill(f.big || ''); f.color = d.color; f.mood = d.mood; const ak = f.art || d.art; f.artSVG = ak && ART[ak] ? ART[ak]() : '';
    if (f.fx === 'quiz') SV.quiz = true;
    FX.play(d.mood || 'tense');
    SV.ctrl = FX.scene($('#sScene'), f, {onQuiz: () => { SV.quiz = false; SV.el = Math.max(0, SV.dur - 4500); SV.t0 = performance.now(); }});
  }
  SV.el = 0; SV.t0 = performance.now(); SV.paused = false;
  cancelAnimationFrame(SV.raf); SV.raf = requestAnimationFrame(loop);
}
function loop(now) {
  const d = SV.decks[SV.di]; if (!d) return;
  let p;
  if (d.video) p = stv.duration ? stv.currentTime / stv.duration : 0;
  else if (SV.quiz) { p = 0; SV.t0 = now; }
  else p = (SV.el + (SV.paused ? 0 : now - SV.t0)) / SV.dur;
  const seg = $('#segs').children[SV.fi]; if (seg) seg.firstChild.style.width = Math.min(100, p*100) + '%';
  if (p >= 1 || (d.video && stv.ended)) { nextFrame(); return; }
  SV.raf = requestAnimationFrame(loop);
}
function nextFrame() { const d = SV.decks[SV.di]; if (SV.fi < d.frames.length-1) SV.fi++; else if (SV.di < SV.decks.length-1) { SV.di++; SV.fi = 0; } else { closeStories(); return; } renderFrame(); }
function prevFrame() { if (SV.fi > 0) SV.fi--; else if (SV.di > 0) { SV.di--; SV.fi = 0; } renderFrame(); }
function pauseStory() { if (SV.paused) return; SV.paused = true; SV.el += performance.now() - SV.t0; stv.pause(); FX.suspend(true); }
function resumeStory() { if (!SV.paused) return; SV.t0 = performance.now(); SV.paused = false; FX.suspend(false); const d = SV.decks[SV.di]; if (d && d.video) stv.play().catch(() => {}); }
$('#story').addEventListener('pointerdown', e => { if (e.target.closest('#stClose,.sndbtn,.quiz')) return; SV.holding = false; SV.hold = setTimeout(() => { SV.holding = true; pauseStory(); }, 220); });
swipeDown($('#story'), {exclude: '.quiz', start: () => { clearTimeout(SV.hold); SV.holding = true; pauseStory(); }, cancel: () => { SV.holding = false; resumeStory(); }, close: () => { SV.holding = false; closeStories(); }});
$('#story').addEventListener('pointerup', e => {
  if (e.target.closest('#stClose,.sndbtn,.quiz') || justSwiped($('#story'))) return;
  clearTimeout(SV.hold);
  if (SV.holding) { resumeStory(); return; }
  if (e.clientX < window.innerWidth*0.3) prevFrame(); else nextFrame();
});
$('#stClose').onclick = closeStories;
$('#stSnd').onclick = () => { setSound(!S.sound); if (S.sound) { const d = SV.decks[SV.di]; if (d && !d.video) FX.play(d.mood || 'tense'); } };

/* ---------- reels ---------- */
const RBG = ['#3a0d0a','#10263a','#3b2410','#1a1a3a','#3a1020','#173a2b','#3a2a10','#2a1030'];
let reelMode = 'all';
const pinSVG = on => `<svg width="30" height="30" viewBox="0 0 24 24" fill="${on?'#ff6b57':'none'}" stroke="${on?'#ff6b57':'#fff'}" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>`;
function reelColor(r, i) { return r.me ? '#5a0f16' : RBG[i % RBG.length]; }
function reelHTML(r, i) {
  const pinned = S.pinned.includes(r.id);
  return `<article class="reel ${r.me?'me':''}" data-id="${r.id}" data-i="${i}"><div class="rscene"></div>
  <div class="ract"><button data-pin="${r.id}" aria-label="${pinned?'Unpin':'Pin'}">${pinSVG(pinned)}${pinned?'Pinned':'Pin'}</button><button class="sndbtn" data-lab="1" aria-label="Sound">${S.sound ? SPK_ON : SPK_OFF}<span>${S.sound ? 'Sound' : 'Muted'}</span></button></div>
  <div class="rprog"><i></i></div></article>`;
}
let reelIO = null, activeReel = null, reelCtrl = null, reelList = [];
function startReel(el, list, opts = {}) {
  if (activeReel === el) return;
  stopReel();
  activeReel = el;
  const r = list.find(x => x.id === el.dataset.id); if (!r) return;
  const sc = Object.assign({}, r, {big: fill(r.big || ''), body: fill(r.body || ''), color: reelColor(r, +el.dataset.i), artSVG: r.art && ART[r.art] ? ART[r.art]() : ''});
  reelCtrl = FX.scene(el.querySelector('.rscene'), sc, {reel:true, tag: r.me ? 'From your own orders' : (r.good || r.mood === 'drive') ? 'Good news' : 'Statutory warning', silent: !!opts.silent});
  if (!opts.silent) FX.play(r.mood || 'tense');
  const bar = el.querySelector('.rprog i'); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
}
function stopReel() { if (reelCtrl) reelCtrl.stop(); reelCtrl = null; activeReel = null; FX.quiet(); }
function observeReels(root, list, opts) {
  if (reelIO) reelIO.disconnect();
  reelList = list;
  reelIO = new IntersectionObserver(es => { es.forEach(en => { if (en.isIntersecting && en.intersectionRatio > 0.6) startReel(en.target, list, opts); }); }, {root, threshold:[0.6]});
  root.querySelectorAll('.reel').forEach(el => reelIO.observe(el));
}
function renderReels() {
  const list = reelMode === 'pin' ? D.REELS.filter(r => S.pinned.includes(r.id)) : reelOrder;
  stopReel();
  $('#feed').innerHTML = list.length ? list.map(reelHTML).join('') : '<div class="empty"><div><b style="color:#fff;font-size:18px">Nothing pinned yet</b><br>Double-tap a reel that hits hard. Pinned reels show first during an SOS.</div></div>';
  if (list.length) observeReels($('#feed'), list, {});
}
let reelOrder = shuffle(D.REELS);
function togglePin(id, reel) {
  const i = S.pinned.indexOf(id);
  if (i >= 0) S.pinned.splice(i, 1); else S.pinned.unshift(id);
  save();
  if (reel) { const b = reel.querySelector('[data-pin]'); const on = S.pinned.includes(id); b.innerHTML = pinSVG(on) + (on ? 'Pinned' : 'Pin'); b.setAttribute('aria-label', on ? 'Unpin' : 'Pin'); }
}
let lastTap = {t:0, id:null};
function reelClick(e, container) {
  const pb = e.target.closest('[data-pin]'); const reel = e.target.closest('.reel');
  if (e.target.closest('.sndbtn')) { FX.ctx(); FX.unlock(); setSound(!S.sound); if (S.sound && activeReel) { const r = reelList.find(x => x.id === activeReel.dataset.id); FX.play((r && r.mood) || 'tense'); } return; }
  if (pb) { togglePin(pb.dataset.pin, reel); return; }
  if (!reel || e.target.closest('.quiz')) return;
  FX.ctx(); FX.unlock();
  const now = Date.now();
  if (lastTap.id === reel.dataset.id && now - lastTap.t < 320) {
    if (!S.pinned.includes(reel.dataset.id)) togglePin(reel.dataset.id, reel);
    const p = document.createElement('div'); p.className = 'pop';
    p.innerHTML = '<svg width="110" height="110" viewBox="0 0 24 24" fill="#ff6b57" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
    reel.appendChild(p); setTimeout(() => p.remove(), 900);
    lastTap = {t:0, id:null};
  } else lastTap = {t:now, id:reel.dataset.id};
}
$('#feed').addEventListener('click', e => reelClick(e, $('#feed')));
$('#rAll').onclick = () => { reelMode = 'all'; $('#rAll').classList.add('on'); $('#rPin').classList.remove('on'); renderReels(); $('#feed').scrollTop = 0; };
$('#rPin').onclick = () => { reelMode = 'pin'; $('#rPin').classList.add('on'); $('#rAll').classList.remove('on'); renderReels(); $('#feed').scrollTop = 0; };

/* ---------- you ---------- */
function slipDays() { const s = new Set(D.HISTORY); S.slips.forEach(x => s.add(dkey(x.at))); return s; }
function renderCal() {
  const now = new Date(), today = dkey(now), bad = slipDays();
  const won = new Set(S.urges.filter(u => u.outcome === 'won' || u.outcome === 'real').map(u => dkey(u.at)));
  const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mon = (now.getDay() + 6) % 7; // days since Monday
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mon - 28);
  let h = ['M','T','W','T','F','S','S'].map(d => `<div class="wd">${d}</div>`).join('');
  for (let i = 0; i < 35; i++) {
    const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i), k = dkey(d);
    if (k > today) { h += '<div class="cell fut"></div>'; continue; }
    const cls = bad.has(k) ? 'bad' : (k >= D.TRACK0 && k < today) ? 'clean' : '';
    const lab = d.getDate() === 1 || i === 0 ? `<small>${MO[d.getMonth()]}</small>` : '';
    h += `<div class="cell ${cls} ${k === today ? 'today' : ''}" title="${k}">${lab}${d.getDate()}${won.has(k) ? '<em></em>' : ''}</div>`;
  }
  $('#cal').innerHTML = h;
}
function renderTriggers() {
  const c = {}; S.slips.forEach(s => { if (s.trigger) c[s.trigger] = (c[s.trigger] || 0) + 1; });
  const rows = Object.entries(c).sort((a, b) => b[1] - a[1]); const max = rows.length ? rows[0][1] : 1;
  $('#trigBars').innerHTML = rows.length ? rows.map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><div><i style="width:${v/max*100}%"></i></div><b>${v}</b></div>`).join('') : '<p class="mute" style="margin:0;font-size:14px">No slips logged since you started. When one happens, what set it off shows up here.</p>';
}
function renderHours() {
  if (S.urges.length < 3) { $('#hours').innerHTML = '<p class="mute" style="margin:0;font-size:14px">After a few SOS sessions, your danger hours show up here.</p>'; return; }
  const c = new Array(24).fill(0); S.urges.forEach(u => c[new Date(u.at).getHours()]++); const max = Math.max(...c);
  $('#hours').innerHTML = '<div class="hours">' + c.map((v, h) => `<i title="${fmtHour(h)}: ${v}" style="height:${v ? Math.max(6, v/max*100) : 2}%;opacity:${v?1:.25}"></i>`).join('') + '</div><div class="hlab"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div>';
}
function renderYou() {
  renderCal(); renderTriggers(); renderAfter(); renderHours();
  $('#avStatus').textContent = S.avatar ? 'Set. It shows on your story ring.' : 'Shown on your story ring. It stays on this phone.';
  $('#vidStatus').textContent = videoURL ? 'Added. It plays first in every SOS and sits first in your stories. It never leaves this phone.' : 'Not added yet. Save the video from our chat to Photos or Files, then pick it here. It stays on this phone.';
  $('#syncWidget').href = widgetURL(); renderSync();
}
function widgetURL() { return 'scriptable:///run/SOS%20Sync?start=' + encodeURIComponent(S.start) + '&best=' + S.best + '&rate=' + D.RATE + '&origin=' + encodeURIComponent(S.origin) + '&debit=' + fundDebit(); }
/* backup: plain JSON for Notes; compressed text for the weekly row in the SOS sheet */
const backupState = () => { const o = Object.assign({}, S, {poster:null, avatar:null, syncPending:[]}); delete o.sync; return o; };
const b64 = buf => { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
async function packBackup() {
  const json = JSON.stringify(backupState());
  if (!window.CompressionStream) return 'SOS backup json | ' + dkey(new Date()) + '\n' + json;
  const buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();
  return 'SOS backup | ' + dkey(new Date()) + '\n' + b64(buf);
}
async function unpackBackup(text) {
  text = text.trim();
  const m = text.match(/^SOS backup( json)? \| [\d-]+\s+([\s\S]+)$/);
  if (!m) return JSON.parse(text);
  if (m[1]) return JSON.parse(m[2]);
  const buf = await new Response(new Blob([unb64(m[2].replace(/\s+/g, ''))]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
  return JSON.parse(new TextDecoder().decode(buf));
}
$('#copyBackup').onclick = async () => { try { await navigator.clipboard.writeText(JSON.stringify(backupState())); toast('Backup copied. Paste it into Notes.'); } catch (e) { toast('Copy failed on this phone.'); } };
$('#showRestore').onclick = () => $('#restoreBox').classList.toggle('hide');
$('#doRestore').onclick = async () => {
  try { const o = await unpackBackup($('#restoreText').value); if (!o || !o.start) throw 0; Object.assign(S, o, {poster:S.poster, avatar:S.avatar || o.avatar || null, sync:S.sync}); if (!S.myFoods) S.myFoods = []; if (!S.lastG) S.lastG = {}; buildFood(); migrateFood(); save(); renderAll(); toast('Backup restored.'); $('#restoreBox').classList.add('hide'); }
  catch (e) { toast('That does not look like an SOS backup.'); }
};
function maybeBackup() { if (syncCfg() && (!S.lastBackup || Date.now() - new Date(S.lastBackup) > 7*DAY)) queueSync('backup'); }

/* ---------- week, wrapped ---------- */
function weekDeck() {
  const now = new Date(), from = Date.now() - 7*DAY, today = dkey(now), bad = slipDays();
  const urges = S.urges.filter(u => new Date(u.at) >= from), won = urges.filter(u => u.outcome === 'won' || u.outcome === 'real').length;
  const slips = S.slips.filter(s => new Date(s.at) >= from);
  let clean = 0; for (let i = 1; i <= 7; i++) { const k = dkey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)); if (k >= D.TRACK0 && !bad.has(k)) clean++; }
  const count = (arr, f) => { const c = {}; arr.forEach(x => { const k = f(x); if (k != null) c[k] = (c[k] || 0) + 1; }); const e = Object.entries(c).sort((a, b) => b[1] - a[1]); return e.length ? e[0][0] : null; };
  const hour = count(urges, u => new Date(u.at).getHours()), want = count(urges, u => u.want), trig = count(slips, s => s.trigger);
  const dish = want ? D.KITCHEN.find(k => k.id === want) : null;
  const frames = [{big:'Your week.', body:'The last seven days, from your own taps.'},
    {big: won + (won === 1 ? ' wave won.' : ' waves won.'), body: urges.length ? urges.length + (urges.length === 1 ? ' craving' : ' cravings') + ' hit. You rode out ' + won + '.' : 'No SOS sessions this week.'},
    {big: clean + (clean === 1 ? ' clean day.' : ' clean days.'), body: rupees(clean*D.RATE) + ' kept that would have gone to delivery.'}];
  if (hour !== null) frames.push({big: fmtHour(+hour) + ' is your danger hour.', body:'Most of your cravings hit around then. Have real food ready before it.'});
  if (dish) frames.push({big:'You crave ' + dish.craving.toLowerCase() + ' most.', body:'Mom’s kitchen answer: ' + dish.name + ', ' + dish.mins + ' minutes.'});
  frames.push(slips.length ? {big: slips.length + (slips.length === 1 ? ' slip.' : ' slips.'), body: trig ? 'Mostly set off by: ' + trig + '. Plan for that moment.' : 'Log what sets them off so we can find the pattern.'} : {big:'Zero slips.', body:'Not one order all week.'});
  frames.push({big:'Next week: beat it.', body:'Same rules. One slip is a mistake; two in a row is the habit.'});
  return {id:'week', week:true, label:'Your week', glyph:'7d', color:'#173a2b', art:null, frames};
}
$('#weekBtn').onclick = () => openStories([weekDeck()], 0);
function renderWeekCard() {
  const isSunday = new Date().getDay() === 0;
  $('#weekCard').innerHTML = isSunday ? `<button class="card" id="weekCardBtn"><span class="ic" style="background:#2a1411"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff6b57" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></span><span><b>Your week, wrapped</b><span>It’s Sunday. See how the week went.</span></span></button>` : '';
  const b = $('#weekCardBtn'); if (b) b.onclick = () => openStories([weekDeck()], 0);
}

/* ---------- kitchen ---------- */
function dishHTML(k, full) {
  return `<div class="dish"><small>Mom’s kitchen · ${k.mins} min</small><b>${k.name}</b>${full ? '<ol>' + k.steps.map(s => `<li>${s}</li>`).join('') + '</ol>' : `<div style="font-size:15px">${k.steps[k.steps.length-1]}</div>`}</div>`;
}
function kitchenSheet() {
  sheet('<div class="q">Mom’s kitchen</div><p>Every craving has a home version. Tap one for the recipe.</p><div class="grid2">' +
    D.KITCHEN.map(k => `<button class="crave" data-k="${k.id}"><span class="ic" style="background:${k.color}">${ART[k.art]().replace('<svg', '<svg width="30" height="30"')}</span><b>${k.name}</b><span class="mute" style="font-size:12px">For: ${k.craving} · ${k.mins} min</span></button>`).join('') +
    '</div><div id="kOut"></div><button class="btn dim full" id="shClose">Close</button>', l => {
      $('#shClose').onclick = closeSheet;
      l.querySelector('.grid2').addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (!b) return; $$('.sheet .crave').forEach(c => c.classList.toggle('sel', c === b)); $('#kOut').innerHTML = dishHTML(D.KITCHEN.find(k => k.id === b.dataset.k), true); $('#kOut').scrollIntoView({behavior:'smooth', block:'nearest'}); });
    });
}
$('#openKitchen').onclick = kitchenSheet;

/* ---------- SOS flow ---------- */
const sv = $('#svid');
let sos = {}, waveT = 0;
function step(n) { $$('#sos .step').forEach(s => s.classList.toggle('on', s.id === 's-' + n)); if (n !== 'video') sv.pause(); $('#coachTop').classList.toggle('hide', ['how', 'advice', 'end', 'reward'].includes(n)); refreshCoach(); }
function openSOS() {
  sos = {want:null, hungry:null, ratings:[], t0:0, last:0};
  $('#sos').classList.remove('hide'); $('#sProg').style.width = '0';
  $('#craves').innerHTML = D.KITCHEN.map(k => `<button class="crave" data-w="${k.id}"><span class="ic" style="background:${k.color}">${ART[k.art]().replace('<svg', '<svg width="30" height="30"')}</span><b>${k.craving}</b></button>`).join('');
  $('#dish1').innerHTML = ''; $('#ask').classList.add('hide'); $('#recall').innerHTML = recallHTML();
  if (videoURL) {
    step('video');
    sv.src = videoURL; sv.muted = false; sv.currentTime = 0;
    $('#vSkip').disabled = true; $('#vSkip').textContent = 'Skip in 30s'; $('#vHint').textContent = 'Watch yourself first.';
    sv.play().catch(() => { $('#vHint').textContent = 'Tap the video to play.'; });
  } else step('want');
}
function closeSOS() { sv.pause(); clearInterval(waveT); stopReel(); if (reelIO) reelIO.disconnect(); if ($('#reels').classList.contains('on')) setTimeout(renderReels, 50); $('#sos').classList.add('hide'); renderAll(); }
sv.addEventListener('timeupdate', () => {
  if (sv.duration) $('#sProg').style.width = (sv.currentTime / sv.duration * 100) + '%';
  const left = Math.ceil(30 - sv.currentTime);
  if (left > 0) $('#vSkip').textContent = 'Skip in ' + left + 's';
  else if ($('#vSkip').disabled) { $('#vSkip').disabled = false; $('#vSkip').textContent = 'Skip'; }
});
sv.addEventListener('click', () => { sv.paused ? sv.play().catch(() => {}) : sv.pause(); });
sv.addEventListener('ended', () => { S.seen.you = dkey(new Date()); save(); step('want'); $('#sProg').style.width = '0'; });
$('#vSkip').onclick = () => { S.seen.you = dkey(new Date()); save(); step('want'); $('#sProg').style.width = '0'; };
$('#craves').addEventListener('click', e => {
  const b = e.target.closest('[data-w]'); if (!b) return;
  sos.want = b.dataset.w; refreshCoach();
  $$('#craves .crave').forEach(c => c.classList.toggle('sel', c === b));
  $('#dish1').innerHTML = dishHTML(D.KITCHEN.find(k => k.id === sos.want), false);
  $('#ask').classList.remove('hide');
  $('#ask').scrollIntoView({behavior:'smooth', block:'nearest'});
});
$('#hYes').onclick = () => { sos.hungry = true; $('#dish2').innerHTML = dishHTML(D.KITCHEN.find(k => k.id === sos.want), true); step('hungry'); };
$('#hNo').onclick = () => { sos.hungry = false; step('how'); };
$('#waveGo').onclick = startWave;
/* Craving coach: lives on the Mains Run page in Claude. Every coach link carries what he wants, whether he passed the
   egg test (nh = not hungry), whether he already rode the wave (after), his streak hours, best, fund and waves won, as one
   plain #name (the only kind of hash an artifact page receives). This app keeps the score: when he comes back, it asks how it went. */
const COACH = 'https://claude.ai/artifact/SoUNgwpovKoWycJGTuXkBB';
function coachURL() {
  const h = Math.floor(streakMs() / HR), b = Math.max(S.best || 0, Math.floor(streakMs() / DAY));
  return COACH + '#' + ['craving', sos.want || '', sos.hungry === false ? 'nh' : '', sos.after ? 'after' : '', 'h' + h, 'b' + b, 'r' + Math.round(fundKept()), 'w' + wavesWon()].filter(Boolean).join('-');
}
function refreshCoach() { const u = coachURL(); $$('.coachlink').forEach(a => { a.href = u; }); }
function toCoach() {
  setTimeout(closeSheet, 0);
  if ($('#sos').classList.contains('hide')) {
    sos = {want:null, hungry:null, ratings:[], t0:0, last:0};
    $('#recall').innerHTML = recallHTML(); $('#sos').classList.remove('hide'); $('#sProg').style.width = '0';
  }
  sos.coach = true; clearInterval(waveT); sv.pause();
  setTimeout(() => { $('#endQ').textContent = 'Back from your coach. Did it pass?'; step('end'); }, 600);
}
document.addEventListener('click', e => { if (e.target.closest('.coachlink')) toCoach(); });
$('#ateReal').onclick = () => finish('real');
$('#rate').innerHTML = Array.from({length:10}, (_, i) => `<button data-v="${i+1}">${i+1}</button>`).join('');
$('#rate').addEventListener('click', e => {
  const b = e.target.closest('[data-v]'); if (!b) return;
  sos.ratings.push({m: +((Date.now() - sos.t0) / MIN).toFixed(2), v: +b.dataset.v}); sos.last = Date.now();
  $('#rHint').textContent = 'Logged. Rate it again in a few minutes.'; drawWave();
});
function startWave() {
  sos.t0 = Date.now(); sos.last = Date.now();
  const pinned = D.REELS.filter(r => S.pinned.includes(r.id)), rest = shuffle(D.REELS.filter(r => !S.pinned.includes(r.id)));
  const ml = pinned.concat(rest); $('#miniFeed').innerHTML = ml.map(reelHTML).join(''); $('#miniFeed').scrollTop = 0; FX.stop(); requestAnimationFrame(() => observeReels($('#miniFeed'), ml, {silent:true}));
  $('#rHint').textContent = 'How strong is it right now?';
  step('wave'); drawWave();
  const total = 15*MIN, C = 326.7; clearInterval(waveT);
  const upd = () => {
    const el = Date.now() - sos.t0, left = Math.max(0, total - el);
    $('#mmss').textContent = pad(Math.floor(left / MIN)) + ':' + pad(Math.floor(left % MIN / 1e3));
    $('#arc').setAttribute('stroke-dashoffset', (C * el / total).toFixed(1));
    $('#sProg').style.width = Math.min(100, el / total * 100) + '%';
    if (Date.now() - sos.last > 3*MIN) $('#rHint').textContent = 'Rate it again. Is it lower now?';
    if (left <= 0) { clearInterval(waveT); $('#endQ').textContent = '15 minutes. Did it pass?'; step('end'); }
  };
  upd(); waveT = setInterval(upd, 1000);
}
const waveSvg = $('#wave');
function drawWave() {
  const W = waveSvg.clientWidth, H = waveSvg.clientHeight; if (!W) return;
  const L = 26, R = 10, T = 12, B = 22, x = m => L + Math.min(15, m) / 15 * (W - L - R), y = v => T + (10 - v) / 9 * (H - T - B);
  let g = `<text x="4" y="${T+4}" fill="#8fb3a2" font-size="12">10</text><text x="10" y="${H-B+4}" fill="#8fb3a2" font-size="12">1</text><text x="${L}" y="${H-5}" fill="#8fb3a2" font-size="12">0 min</text><text x="${W-R}" y="${H-5}" fill="#8fb3a2" font-size="12" text-anchor="end">15 min</text>`;
  const r = sos.ratings || [];
  if (!r.length) g += `<text x="${W/2}" y="${H/2}" fill="#8fb3a2" font-size="14" text-anchor="middle">Tap a number to start your wave</text>`;
  else {
    const p = r.map(o => [x(o.m), y(o.v)]), line = p.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
    g += `<path d="${line} L${p[p.length-1][0].toFixed(1)} ${H-B} L${p[0][0].toFixed(1)} ${H-B} Z" fill="#ff6b5733"/><path d="${line}" fill="none" stroke="#ff6b57" stroke-width="3" stroke-linejoin="round"/>` + p.map(q => `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="4.5" fill="#ff6b57"/>`).join('');
  }
  waveSvg.innerHTML = g;
}
const waveRO = new ResizeObserver(drawWave); waveRO.observe(waveSvg);
$('#gone').onclick = () => { clearInterval(waveT); $('#endQ').textContent = 'Gone already? Then say it.'; step('end'); };
$('#nextReel').onclick = () => $('#miniFeed').scrollBy({top: $('#miniFeed').clientHeight, behavior:'smooth'});
$('#miniFeed').addEventListener('click', e => { const pb = e.target.closest('[data-pin]'); if (pb) togglePin(pb.dataset.pin, e.target.closest('.reel')); });
$('#won').onclick = () => finish('won');
$('#still').onclick = () => { clearInterval(waveT); const k = D.KITCHEN.find(x => x.id === sos.want); $('#dish3').innerHTML = k ? dishHTML(k, true) : ''; sos.after = true; step('advice'); };
$('#realFirst').onclick = () => finish('real');
$('#ordered').onclick = () => { logUrge('ate'); closeSOS(); slipSheet(); };
$('#sClose').onclick = closeSOS;
swipeDown($('#sos'), {exclude: '.minifeed,.rate,.scratch,input', close: closeSOS});
$('#sosTab').onclick = openSOS;
function logUrge(outcome) { S.urges.unshift(Object.assign({at:new Date().toISOString(), want:sos.want, hungry:sos.hungry, ratings:sos.ratings || [], outcome}, sos.coach ? {coach:true} : {})); S.urges = S.urges.slice(0, 1000); save(); queueSync(dkey(new Date())); }
function finish(outcome) {
  clearInterval(waveT); logUrge(outcome);
  const [tag, head, body] = rewardCard();
  $('#rwTag').textContent = tag; $('#rwHead').textContent = head; $('#rwBody').textContent = body;
  $('#rwWhen').textContent = 'Wave ' + wavesWon() + ' won · ' + new Date().toLocaleTimeString('en-IN', {hour:'numeric', minute:'2-digit'});
  $('#rwTitle').textContent = outcome === 'won' ? 'You didn’t order.' : 'Real food. You won.';
  const r = sos.ratings || []; if (r.length > 1) $('#rwWhen').textContent += ' · urge ' + Math.max(...r.map(o => o.v)) + ' → ' + r[r.length-1].v;
  step('reward'); setupScratch();
}
function rewardCard() {
  const ms = streakMs(), n = wavesWon(), nx = D.MILES.find(m => ms < m.h*HR);
  const pool = [
    () => ['Wave count', 'Wave ' + n + ' won', n + (n === 1 ? ' time' : ' times') + ' the craving came and you did not order. Each one weakens the cue for the next.'],
    () => ['Money kept', rupees(fundKept()) + ' kept', 'Money that stayed with you instead of going to delivery. At this pace, ₹1.5 lakh a year.'],
    () => { const f = pick(D.FLIPS); return ['Good news', f.big, f.body]; }
  ];
  if (nx) pool.push(() => ['Next unlock', nx.tag + ' is close', 'Unlocks in ' + dur(nx.h*HR - ms) + ': ' + nx.title.toLowerCase() + '.']);
  return pick(pool)();
}
$('#rwHome').onclick = () => { closeSOS(); switchTab('body'); };

/* scratch card */
function setupScratch() {
  const cv = $('#scv'), box = $('#scratch');
  const r = box.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = r.width * dpr; cv.height = r.height * dpr; cv.style.opacity = 1; cv.style.pointerEvents = 'auto';
  const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const gr = g.createLinearGradient(0, 0, r.width, r.height); gr.addColorStop(0, '#bdbdbd'); gr.addColorStop(.5, '#f3f3f3'); gr.addColorStop(1, '#9a9a9a');
  g.globalCompositeOperation = 'source-over'; g.fillStyle = gr; g.fillRect(0, 0, r.width, r.height);
  g.fillStyle = '#00000020'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(Math.random()*r.width, Math.random()*r.height, 2 + Math.random()*5, 0, 7); g.fill(); }
  g.fillStyle = '#444'; g.font = '700 20px Inter, sans-serif'; g.textAlign = 'center'; g.fillText('Scratch here', r.width/2, r.height/2 + 7);
  let down = false, moves = 0;
  const at = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  const scr = e => { const [x, y] = at(e); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(x, y, 24, 0, 7); g.fill(); if (++moves % 12 === 0) check(); };
  const check = () => { const d = g.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, n = 0; for (let i = 3; i < d.length; i += 64) { n++; if (d[i] === 0) clear++; } if (clear / n > .45) { cv.style.opacity = 0; cv.style.pointerEvents = 'none'; } };
  cv.onpointerdown = e => { down = true; cv.setPointerCapture(e.pointerId); scr(e); };
  cv.onpointermove = e => { if (down) scr(e); };
  cv.onpointerup = () => { down = false; check(); };
}

/* ---------- slips & comeback ---------- */
function slipSheet() {
  let trig = null;
  sheet(`<div class="q">What set it off?</div><p>Logging it is how we find your real triggers. Your streak restarts from now, and comeback mode starts: 24 hours to make it one, not two.</p>
    <div class="chips" id="trig">${D.TRIGGERS.map(t => `<button data-t="${t}">${t}</button>`).join('')}</div>
    <div class="frm" style="margin-top:14px"><label>What you ordered<input id="slWhat" maxlength="60" placeholder="e.g. Taco Bell, 2 chalupas"></label><label>₹ spent<input id="slSpent" type="number" inputmode="numeric" min="0" placeholder="e.g. 257"></label></div>
    <p class="mute tiny" style="margin:6px 2px 0">Both optional. The ₹ comes out of your freedom fund instead of a flat ${rupees(D.RATE)}, and goes to Mains Run.</p>
    <div class="two" style="margin-top:16px"><button class="btn dim" id="slCancel">Cancel</button><button class="btn coral" id="slSave" disabled>Log the slip</button></div>`, l => {
      $('#slCancel').onclick = closeSheet;
      $('#trig').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; trig = b.dataset.t; $$('#trig button').forEach(x => x.classList.toggle('sel', x === b)); $('#slSave').disabled = false; };
      $('#slSave').onclick = () => { const sp = parseInt($('#slSpent').value, 10); const second = logSlip(trig, $('#slWhat').value.trim(), sp > 0 ? sp : 0); afterSlipSheet(second); };
    });
}
function logSlip(trigger, what, spent) {
  const now = new Date(), prev = lastSlip();
  const second = prev && now - new Date(prev.at) < DAY;
  const cur = Math.floor(streakMs() / DAY); if (cur > S.best) S.best = cur;
  const sl = {at: now.toISOString(), trigger}; if (what) sl.what = what; if (spent) sl.spent = spent;
  S.slips.push(sl); S.start = now.toISOString(); S.celebrated = 0; save(); queueSync(dkey(now)); renderAll();
  return second;
}
function afterSlipSheet(second) {
  sheet(`<div class="q">${second ? 'Two in a row. Stop it here.' : 'Logged. Never twice.'}</div>
    <p>${second ? 'This is the moment the habit wins or loses. Your next meal is real food, at the table, and no skipping meals to make up for it.' : 'One slip is a mistake. Your next meal is real food, and no skipping meals to make up for it. Comeback mode is on for 24 hours.'} In 20 minutes, notice how your body feels. The Body screen will ask.</p>
    <a class="btn dim full" href="${widgetURL()}" style="display:grid;place-items:center;text-decoration:none">Update lock-screen widget</a>
    <button class="btn mint full" id="shClose">Back to your body</button>`, () => { $('#shClose').onclick = () => { closeSheet(); switchTab('body'); }; });
}
$('#slipBtn').onclick = slipSheet;
function renderComeback() {
  const p = lastSlip(); const el = $('#comeback');
  if (!p) { el.innerHTML = ''; return; }
  const left = DAY - (Date.now() - new Date(p.at));
  if (left > 0) { el.innerHTML = `<div class="banner"><div><b>Comeback mode</b><span>Make it one slip, not two.</span></div><span class="num" id="cbLeft">${dur(left)}</span></div>` + (needsFeel(p) ? feelHTML() : ''); wireFeel(); }
  else {
    el.innerHTML = '';
    if (S.comebackDone !== p.at) { S.comebackDone = p.at; save(); celebrate('Comeback complete', 'Never twice.', 'A full day since the slip and no second order. That is how the habit loses.'); }
  }
}

/* ---------- 20 minutes after a slip ---------- */
const FEELS = ['Heavy', 'Bloated', 'Sleepy', 'Guilty', 'Thirsty', 'Foggy', 'Fine'];
const needsFeel = p => p && !p.after && Date.now() - new Date(p.at) >= 20*MIN && Date.now() - new Date(p.at) < 12*HR;
function feelHTML() {
  return `<div class="set aft"><b>20 minutes on. How do you feel?</b><p>Pick all that are true. Next time a craving hits, SOS shows you this.</p><div class="chips" id="feel">${FEELS.map(f => `<button data-f="${f}">${f}</button>`).join('')}</div><button class="btn mint full" id="feelSave" disabled style="margin-top:12px">Save</button></div>`;
}
function wireFeel() {
  const box = $('#feel'); if (!box) return; const sel = new Set();
  box.onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; const f = b.dataset.f; sel.has(f) ? sel.delete(f) : sel.add(f); b.classList.toggle('sel', sel.has(f)); $('#feelSave').disabled = !sel.size; };
  $('#feelSave').onclick = () => { const p = lastSlip(); if (!p) return; p.after = [...sel]; save(); queueSync(dkey(p.at)); renderComeback(); toast('Saved. SOS will show you this next time.'); };
}
function afterCounts() { const c = {}; let n = 0; S.slips.forEach(s => { if (s.after && s.after.length) { n++; s.after.forEach(f => c[f] = (c[f] || 0) + 1); } }); return {n, rows: Object.entries(c).sort((a, b) => b[1] - a[1])}; }
function recallHTML() {
  const {n, rows} = afterCounts(); if (!n) return '';
  return `<div class="recall"><small>${n === 1 ? 'Last time you ate it' : 'The last ' + n + ' times you ate it'}, 20 minutes later you felt</small><b>${rows.slice(0, 3).map(([f, v]) => f.toLowerCase() + (n > 1 ? ' (' + v + ')' : '')).join(', ')}.</b></div>`;
}
function renderAfter() {
  const {rows} = afterCounts(); const max = rows.length ? rows[0][1] : 1;
  $('#afterBars').innerHTML = rows.length ? rows.map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><div><i style="width:${v/max*100}%"></i></div><b>${v}</b></div>`).join('') : '<p class="mute" style="margin:0;font-size:14px">20 minutes after a slip, the Body screen asks how you feel. The answers collect here, and SOS shows them to you the next time a craving hits.</p>';
}

/* ---------- freedom fund ---------- */
const GO = '<svg class="go" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8fb3a2" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
const fundDebit = () => { const o = new Date(S.origin); return S.slips.filter(x => new Date(x.at) >= o).reduce((a, x) => a + (x.spent || D.RATE), 0); };
function fundKept() { return Math.max(0, (Date.now() - new Date(S.origin)) / DAY * D.RATE - fundDebit()); }
function renderFund() {
  const g = S.fund, k = fundKept(), el = $('#fundCard'); if (!el) return;
  const ic = `<span class="ic" style="background:#3a2a10">${ART.rupee().replace('<svg', '<svg width="28" height="28"')}</span>`;
  if (!g) el.innerHTML = `<button class="card" id="fundBtn">${ic}<span><b>Freedom fund · <span class="num" id="fundAmt" style="display:inline;color:inherit;font-size:inherit">${rupees(k)}</span></b><span>Pick what the money you don’t spend will buy</span></span>${GO}</button>`;
  else {
    const done = k >= g.price, left = Math.max(1, Math.ceil((g.price - k) / D.RATE));
    el.innerHTML = `<button class="card" id="fundBtn">${ic}<span style="flex:1;min-width:0"><b>${done ? 'Earned: ' : ''}${esc(g.name)}</b><span>${done ? 'Paid for by orders you didn’t place. Buy it.' : `<span class="num" id="fundAmt" style="display:inline;color:inherit;font-size:inherit">${rupees(k)}</span> of ${rupees(g.price)} · ${left} clean ${left === 1 ? 'day' : 'days'} to go`}</span><i class="fbar"><i style="width:${Math.min(100, k / g.price * 100)}%"></i></i></span></button>`;
    if (done && S.fundDone !== g.name + g.price) { S.fundDone = g.name + g.price; save(); celebrate('Freedom fund', 'You earned it.', g.name + ', paid for by every order you didn’t place.'); }
  }
  $('#fundBtn').onclick = fundSheet;
}
function fundSheet() {
  const g = S.fund || {name:'', price:''};
  sheet(`<div class="q">Freedom fund</div>
    <p>Every clean day adds ${rupees(D.RATE)}, what you spent a day on delivery in November. Every slip takes out what it cost (or a day’s worth if you didn’t log the ₹). So far: <b>${rupees(fundKept())}</b>.</p>
    <p>Pick something you actually want. Each Sunday, move that week’s amount into a separate account so the money is real.</p>
    <div class="frm" style="grid-template-columns:1fr"><label>What it buys<input id="fName" maxlength="40" placeholder="e.g. new running shoes" value="${esc(g.name)}"></label><label>Price (₹)<input id="fPrice" type="number" inputmode="numeric" min="100" placeholder="e.g. 12000" value="${g.price || ''}"></label></div>
    <div class="two" style="margin-top:16px"><button class="btn dim" id="fOff">${S.fund ? 'Remove goal' : 'Cancel'}</button><button class="btn mint" id="fSave">Save</button></div>`, () => {
      $('#fOff').onclick = () => { if (S.fund) { S.fund = null; save(); renderFund(); } closeSheet(); };
      $('#fSave').onclick = () => {
        const name = $('#fName').value.trim(), price = parseInt($('#fPrice').value, 10);
        if (!name || !(price >= 100)) { toast('Add what it buys and a price of at least ₹100.'); return; }
        S.fund = {name, price}; save(); closeSheet(); renderFund();
      };
    });
}

/* ---------- witness ---------- */
function weekText() {
  const now = new Date(), from = Date.now() - 7*DAY, bad = slipDays();
  let clean = 0, tracked = 0;
  for (let i = 1; i <= 7; i++) { const k = dkey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)); if (k >= D.TRACK0) { tracked++; if (!bad.has(k)) clean++; } }
  const urges = S.urges.filter(u => new Date(u.at) >= from), won = urges.filter(u => u.outcome === 'won' || u.outcome === 'real').length;
  const slips = S.slips.filter(s => new Date(s.at) >= from).length, d = Math.floor(streakMs() / DAY);
  const lines = ['My junk-food week:'];
  if (tracked) lines.push(`• ${clean} of the last ${tracked} ${tracked === 1 ? 'day' : 'days'} with no junk`);
  lines.push(`• ${slips} ${slips === 1 ? 'slip' : 'slips'}`);
  if (urges.length) lines.push(`• ${won} of ${urges.length} ${urges.length === 1 ? 'craving' : 'cravings'} ridden out`);
  lines.push(`• ${rupees(fundKept())} not spent on delivery so far`);
  lines.push(`Current streak: ${d} ${d === 1 ? 'day' : 'days'}. Ask me about it.`);
  return lines.join('\n');
}
$('#shareWeek').onclick = async () => {
  const t = weekText();
  try { if (navigator.share) { await navigator.share({text: t}); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(t); toast('Copied. Paste it to your person.'); } catch (e) { toast('Sharing isn’t available here.'); }
};

/* ---------- send to Mains Run (Google Form → nightly coach) ---------- */
const syncCfg = () => S.sync && S.sync.form && S.sync.entry ? S.sync : null;
let syncT = 0;
function queueSync(day) {
  if (!syncCfg()) return;
  S.syncPending = S.syncPending || []; if (!S.syncPending.includes(day)) S.syncPending.push(day); save();
  clearTimeout(syncT); syncT = setTimeout(flushSync, 4000);
}
function snapshot(day) {
  if (!dayItems(day).length && !S.weights.some(x => x.d === day) && !S.urges.some(u => dkey(u.at) === day) && !S.slips.some(x => dkey(x.at) === day) && !(S.decoys || []).some(x => dkey(x.at) === day)) return null;
  const lines = ['SOS | ' + day];
  F.MEALS.forEach(([id, name]) => {
    const its = dayItems(day).filter(x => x.meal === id); if (!its.length) return;
    lines.push(name + ': ' + its.map(it => { const f = FOOD[it.id]; return f ? f.name + ' (' + amountLabel(f, it.g) + ')' : ''; }).filter(Boolean).join(', '));
  });
  const t = totals(day);
  if (dayItems(day).length) lines.push(`Total: ${Math.round(t.kcal)} kcal · ${Math.round(t.p)} g protein · ${Math.round(t.c)} g carbs · ${Math.round(t.f)} g fat · ${Math.round(t.fib)} g fibre · ${Math.round(t.na)} mg sodium · ${fmt1(t.zn)} mg zinc · ${Math.round(t.asug)} g added sugar (${Math.round(t.sug)} g all sugar)`);
  else lines.push('No food logged in SOS.');
  const w = S.weights.find(x => x.d === day); if (w) lines.push('Weight: ' + w.kg + ' kg');
  const urges = S.urges.filter(u => dkey(u.at) === day), won = urges.filter(u => u.outcome === 'won' || u.outcome === 'real').length;
  if (urges.length) { const ch = urges.filter(u => u.coach).length; lines.push(`Cravings: ${urges.length}, rode out ${won}` + (ch ? `, ${ch} with the craving coach` : '')); }
  const dec = (S.decoys || []).filter(x => dkey(x.at) === day); if (dec.length) lines.push(`Decoy orders: ${dec.length} (${dec.map(x => x.shop).join(', ')}): ${rupees(dec.reduce((a, x) => a + x.total, 0))} not spent, about ${dec.reduce((a, x) => a + x.kcal, 0)} kcal not eaten`);
  S.slips.filter(x => dkey(x.at) === day).forEach(x => lines.push(`Slip at ${new Date(x.at).toLocaleTimeString('en-IN', {hour:'numeric', minute:'2-digit'})}${x.trigger ? ' (' + x.trigger + ')' : ''}${x.what ? ': ' + x.what : ''}${x.spent ? ', ' + rupees(x.spent) : ''}${x.after && x.after.length ? ', 20 min later felt ' + x.after.join(', ').toLowerCase() : ''}`));
  if (day === dkey(new Date())) lines.push('Junk-free streak so far: ' + dur(streakMs()));
  return lines.join('\n');
}
let syncing = false;
async function flushSync() {
  const c = syncCfg(); if (!c || syncing || !(S.syncPending || []).length) return;
  syncing = true;
  try {
    for (const day of [...S.syncPending]) {
      const text = day === 'ping' ? 'SOS connected ' + new Date().toISOString() : day === 'backup' ? await packBackup() : snapshot(day);
      if (text) { const body = new URLSearchParams(); body.append(c.entry, text);
      await fetch('https://docs.google.com/forms/d/e/' + c.form + '/formResponse', {method:'POST', mode:'no-cors', body}); }
      S.syncPending = S.syncPending.filter(d => d !== day); S.syncLast = new Date().toISOString(); if (day === 'backup') S.lastBackup = S.syncLast; save();
    }
  } catch (e) { /* offline: stays pending, retried on next open */ }
  syncing = false; renderSync();
}
function renderSync() {
  const el = $('#syncStatus'); if (!el) return;
  el.textContent = syncCfg() ? 'Connected. Everything you log here goes to your Mains Run page every night.' + (S.syncLast ? ' Last sent ' + new Date(S.syncLast).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'numeric', minute:'2-digit'}) + '.' : '') + ((S.syncPending || []).length ? ' Waiting for a connection.' : '')
    : 'Not connected. Once it is, everything you log here (food, weight, cravings, slips) goes to your Mains Run page every night, with no taps.';
  const bk = $('#bkStatus'); if (bk) bk.textContent = syncCfg() ? (S.lastBackup ? 'Backed up to your SOS sheet on ' + new Date(S.lastBackup).toLocaleDateString('en-IN', {day:'numeric', month:'short'}) + '. A fresh one goes every week.' : 'A backup goes to your SOS sheet this week, then every week.') + ' You can also copy one to Notes.' : 'Your streak and history live on this phone. Connect Mains Run above and a backup goes to your SOS sheet every week.';
  const ss = $('#setSum'); if (ss) ss.textContent = [syncCfg() ? 'Mains Run on' : 'Mains Run off', videoURL ? 'video added' : 'no video', S.lastBackup ? 'backed up' : 'not backed up yet'].join(' · ');
  $('#syncSave').textContent = syncCfg() ? 'Replace' : 'Save';
}
$('#syncSave').onclick = () => {
  const v = $('#syncIn').value.trim(), m = v.match(/\/forms\/d\/e\/([\w-]+)\//), e = v.match(/(entry\.\d+)=/);
  if (!m || !e) { toast('That isn’t a pre-filled link. Use ⋮ → Get pre-filled link in the form.'); return; }
  S.sync = {form: m[1], entry: e[1]}; $('#syncIn').value = '';
  const today = dkey(new Date()), y = new Date(); y.setDate(y.getDate() - 1);
  S.syncPending = ['ping', dkey(y), today]; save(); flushSync(); renderSync(); toast('Connected. A test row is on its way to your sheet.');
};
window.addEventListener('online', flushSync);

/* ---------- Never / Eat bar on Home ---------- */
let ebI = 0;
function ebSet(id, list, i) { const el = $(id); el.classList.add('fade'); setTimeout(() => { el.textContent = list[i % list.length]; el.classList.remove('fade'); }, 350); }
setInterval(() => {
  if (document.hidden || !$('#body').classList.contains('on') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  ebI++; ebSet('#ebNever', D.TICK_NEVER, ebI); setTimeout(() => ebSet('#ebEat', D.TICK_EAT, ebI), 600);
}, 3400);
const KMAP = [['tacos', /taco|nacho|chalupa|twists|doritos|cornitos/i], ['burger', /burger|whopper|mcchicken|mcaloo|sandwich|wrap|pizza|vada pav/i], ['chicken', /nugget|popcorn|wings|strips|zinger|fish|chicken/i], ['sweet', /ice cream|cake|brownie|cookie|minibon|churros|milano|go zero/i], ['latte', /latte|shake/i], ['soda', /soda|nimbooz|limca|pepsi/i], ['chips', /chips|lay's|puffs|namkeen/i], ['sauce', /sauce|ketchup|dip/i]];
function focusFor(names) { const out = []; names.forEach(n => { const m = KMAP.find(([, r]) => r.test(n)); if (m && !out.includes(m[0])) out.push(m[0]); }); return out; }
function eatHTML(focus) {
  focus = focus || [];
  const ks = [...D.KITCHEN].sort((a, b) => (focus.includes(a.id) ? focus.indexOf(a.id) : 99) - (focus.includes(b.id) ? focus.indexOf(b.id) : 99));
  return `<div class="el">
    <h5 style="margin-top:4px">Make one right now</h5>${ks.map(k => { const w = D.KWHY[k.id] || ['', '']; return `<button class="el-m${focus.includes(k.id) ? ' top' : ''}" data-rk="${k.id}"><span class="el-ic" style="background:${k.color}">${ART[k.art]().replace('<svg', '<svg width="30" height="30"')}</span><span class="t"><b>${esc(k.name)}</b><small>For ${esc(k.craving.toLowerCase())} · ${k.mins} min · tap for the recipe</small><span class="g">${esc(w[0])}</span><span class="c">${esc(w[1])}</span></span></button>`; }).join('')}
    <h5>From your orders, these were fine</h5>${D.EAT.map(x => `<div class="el-r"><b>${esc(x.t)}</b><span>${esc(x.d)}</span><span class="g">${esc(D.EATWHY[x.t] || '')}</span></div>`).join('')}
    <h5>Your everyday foods</h5>${D.EVERYDAY.map(([t, d]) => `<div class="el-r"><b>${esc(t)}${/Protein|Dal|Sabzi|Nuts/.test(t) ? '<i class="tplus">T+</i>' : ''}</b><span>${esc(d)}</span><span class="g">${esc(D.EVERYWHY[t] || '')}</span></div>`).join('')}
    <div class="el-t" style="margin-top:18px"><h6>Eat for testosterone and muscle</h6><p>Food can’t push testosterone above normal. Junk, belly fat and short sleep can drag it down, and that’s the part you control.</p>
      <ul class="tup">${D.T_UP.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}</ul>
      <div class="tdn"><b>What drags it down</b><ul>${D.T_DOWN.map(([a, b, c]) => `<li><b>${esc(a)}</b><span>${esc(b)} · ${esc(c)}</span></li>`).join('')}</ul></div>
      <div class="thab"><b>To get jacked:</b> about ${Math.round(1.6 * curWeight() / 5) * 5} g protein a day (1.6 g per kg) · lift heavy 3–4 days a week · sleep 7–9 hours · get your vitamin D tested, low levels are common in India</div></div>
    <div class="el-vs" style="margin-top:18px"><div class="el-good"><h6>What this list gives you</h6><ul>${D.GOOD.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="el-bad"><h6>What the other list does</h6><ul>${D.BAD.map(([t, src]) => `<li>${esc(t)}<small>${esc(src)}</small></li>`).join('')}</ul></div></div></div>`;
}
function recipeHTML(id) { const k = D.KITCHEN.find(x => x.id === id), w = D.KWHY[id] || ['', '']; return dishHTML(k, true) + `<div class="el-wb"><span class="g">${esc(w[0])}</span><span class="c">${esc(w[1])}</span></div>`; }
function cravingSheet() {
  if (S.decoy) { foOpen(); return; }
  if ($('#sos').classList.contains('hide')) sos = {want:null, hungry:null, ratings:[], t0:0, last:0};
  sheet(`<div class="q" style="font-size:30px">Craving something?</div><p>Pick one. Each of these gets you through it, and every craving you ride out protects your testosterone.</p>
    <a class="ch-o hot coach coachlink" id="chCoach" href="${coachURL()}" target="_blank" rel="noopener"><span class="el-ic" style="background:#3a1a12"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ff8a75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg></span><span><b>Talk to your craving coach</b><small>A live chat in Claude that talks you through it, shows you what the food really does, and sends you back to work.</small></span></a>
    <button class="ch-o" id="chOrder"><span class="el-ic" style="background:#3a1a12">${ART.burger().replace('<svg', '<svg width="30" height="30"')}</span><span><b>Order it</b><small>Browse your restaurants, order, pay. Nothing arrives, and the craving passes while you wait.</small></span></button>
    <button class="ch-o" id="chEat"><span class="el-ic" style="background:#173a2b">${ART.bowl().replace('<svg', '<svg width="30" height="30"')}</span><span><b>Eat from your list</b><small>Food that builds you, and what each one gives your body.</small></span></button>
    <button class="ch-o" id="chMake"><span class="el-ic" style="background:#4a2a1a">${ART.cup().replace('<svg', '<svg width="30" height="30"')}</span><span><b>Make one right now</b><small>The home version of exactly what you want, in 3 to 30 minutes.</small></span></button>
    <button class="btn dim full" id="chSOS">Watch my video and ride the wave</button>`, () => {
      $('#chOrder').onclick = () => { closeSheet(); foOpen(); };
      $('#chEat').onclick = () => eatSheet();
      $('#chMake').onclick = makeSheet;
      $('#chSOS').onclick = () => { closeSheet(); openSOS(); };
    });
}
function makeSheet() {
  sheet(`<div class="q" style="font-size:30px">What do you want?</div><p>Pick the craving. You get the home version and the recipe.</p><div class="grid2">${D.KITCHEN.map(k => `<button class="crave" data-mk="${k.id}"><span class="ic" style="background:${k.color}">${ART[k.art]().replace('<svg', '<svg width="30" height="30"')}</span><b>${esc(k.craving)}</b></button>`).join('')}</div><div id="kOut"></div><button class="btn dim full" id="shClose">Close</button>`, l => {
    $('#shClose').onclick = closeSheet;
    l.querySelectorAll('[data-mk]').forEach(b => b.onclick = () => { $$('.sheet .crave').forEach(c => c.classList.toggle('sel', c === b)); $('#kOut').innerHTML = recipeHTML(b.dataset.mk); $('#kOut').scrollIntoView({behavior:'smooth', block:'start'}); });
  });
}
function neverSheet() {
  sheet(`<div class="q" style="font-size:28px">Don’t order these again</div><p>Straight from your Swiggy, Zomato, Blinkit and Instamart orders, Sep–Nov 2026. Almost all of it drags your testosterone down.</p><div class="nl">${D.NEVER.map(x => `<div class="nv"><b>${esc(x.t)}${x.n ? `<i>${esc(x.n)}</i>` : ''}</b><span>${esc(x.d)}</span>${x.tm ? `<em class="tminus">${esc(x.tm)}</em>` : ''}</div>`).join('')}</div><button class="btn mint full" id="toEat">What can I eat instead?</button><button class="btn dim full" id="shClose">Close</button>`, () => { $('#shClose').onclick = closeSheet; $('#toEat').onclick = () => eatSheet(); });
}
function eatSheet(recipe, focus) {
  sheet(`<div class="q" style="font-size:28px">Eat these instead</div><p>Everything on this page builds you. Everything on the other list costs you.</p><div id="kOut"></div>${eatHTML(focus)}<button class="btn dim full" id="shClose">Close</button>`, l => {
    $('#shClose').onclick = closeSheet;
    const show = id => { $('#kOut').innerHTML = recipeHTML(id); $('#kOut').scrollIntoView({behavior:'smooth', block:'start'}); };
    l.querySelectorAll('[data-rk]').forEach(b => b.onclick = () => show(b.dataset.rk));
    if (recipe) show(recipe);
  });
}
$('#ebN').onclick = neverSheet;
$('#ebE').onclick = () => eatSheet();
$('#eatOrder').onclick = () => cravingSheet();
function renderEatbar() {
  const live = !!S.decoy;
  $('#eatOrder').classList.toggle('live', live);
  $('#ebOrdB').textContent = live ? 'Track' : 'Craving?'; $('#ebOrdS').textContent = 'your order'; $('#ebOrdS').classList.toggle('hide', !live);
}

/* ---------- decoy ordering app ---------- */
const SHOP = Object.fromEntries(D.SHOPS.map(s => [s.id, s]));
const DECOY_MS = (new URLSearchParams(location.search).get('decoyFast') ? 0.4 : 15) * MIN;
const FO_CATS = [['Tacos', /taco|nacho|chalupa/i, 'chips'], ['Burgers', /burger|whopper|mcchicken|mcaloo|sandwich/i, 'burger'], ['Fried chicken', /nugget|popcorn|wings|strips|zinger|chicken burger/i, 'drum'], ['Shakes', /shake/i, 'glass'], ['Ice cream', /ice cream|scoop/i, 'cup'], ['Chips', /chips|lay's|doritos|puffs|namkeen|cornitos/i, 'chips'], ['Chinese', /noodles|chilli|chopsuey|honey|spring roll/i, 'bowl'], ['Coffee', /latte|coffee/i, 'glass'], ['Cakes', /cake|brownie|cookie|minibon|churros|milano/i, 'cup']];
const NV = /chicken|nugget|fish|zinger|whopper|mcchicken|salami|seekh|wings|popcorn|chalupa|chipotle/i;
const SUGR = /shake|ice cream|cake|brownie|cookie|minibon|churros|milano|nimbooz|limca|pepsi|latte|go zero/i, FRYR = /nugget|popcorn|wings|strips|zinger|chalupa|crispy|fried|fish n chips|twists|chips|nachos|doritos|namkeen|vada|tikki|spring roll|honey chilli potato|chilly paneer|chilli chicken|mcaloo|mcchicken|mayo burst|bold chicken|hot garlic|puffs/i;
const tTag = n => SUGR.test(n) ? '<span class="tg">Sugar load · <span class="nw">testosterone ↓</span></span>' : FRYR.test(n) ? '<span class="tg">Deep-fried · trans fats · <span class="nw">testosterone ↓</span></span>' : '';
const PAST_NAMES = new Set(D.PAST.flatMap(o => o.items));
let fo = {cart: null, cat: null, q: '', timer: 0, factI: 0};
const itemArt = (n, k) => /shake|latte|soda|nimbooz|limca|pepsi/i.test(n) ? 'glass' : /ice cream|cake|brownie|cookie|minibon|churros|milano|go zero/i.test(n) ? 'cup' : /nacho|chips|lay's|doritos|puffs|namkeen|taco|chalupa|twists/i.test(n) ? 'chips' : /nugget|popcorn|wings|strips|zinger|fish/i.test(n) ? 'drum' : /burger|whopper|mcchicken|mcaloo|sandwich|vada pav|pizza|wrap/i.test(n) ? 'burger' : /sauce|dip$|ketchup/i.test(n) ? 'jar' : /noodles|chilli|chopsuey|roll|potato/i.test(n) ? 'bowl' : k;
const art = (k, size) => (ART[k] || ART.burger)().replace('<svg', `<svg width="${size}" height="${size}"`);
const icon = {
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1b1e1c" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1b1e1c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  pin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#0b7a50"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0b7a50" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  bike: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="3"/><circle cx="18.5" cy="17" r="3"/><path d="M8.5 17h6l-3-7h4l3 7M11.5 10l-2-3H7"/></svg>',
  shop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 10h16v10H4zM3 4h18l-1 6H4z"/></svg>',
  home: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 11l9-7 9 7v9H3z"/></svg>',
  check: '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
};
const itemOf = (shop, name) => SHOP[shop].items.find(i => i[0] === name);
function cartLines() { return fo.cart ? Object.entries(fo.cart.lines).filter(([, q]) => q > 0) : []; }
function cartCount() { return cartLines().reduce((a, [, q]) => a + q, 0); }
function bill() {
  const lines = cartLines(), sh = fo.cart && SHOP[fo.cart.shop];
  const items = lines.reduce((a, [n, q]) => a + itemOf(sh.id, n)[1] * q, 0), kcal = lines.reduce((a, [n, q]) => a + itemOf(sh.id, n)[2] * q, 0);
  const h = new Date().getHours(), late = h >= 23 || h < 5 ? 35 : 0, plat = 10, del = sh && sh.id === 'snack' ? 0 : 30, gst = Math.round(items * 0.05);
  return {items, kcal, late, plat, del, gst, total: items + late + plat + del + gst};
}
function setQty(shop, name, d) {
  if (!fo.cart || fo.cart.shop !== shop) { if (fo.cart && cartCount() && d > 0) toast('Cart cleared: one restaurant at a time.'); fo.cart = {shop, lines: {}}; }
  fo.cart.lines[name] = Math.max(0, (fo.cart.lines[name] || 0) + d);
}
function foShell(top, body, bar, grey) {
  $('#foTop').innerHTML = top; $('#foBody').innerHTML = body; $('#foBar').innerHTML = bar || '';
  $('#foBody').classList.toggle('grey', !!grey); $('#foBody').scrollTop = 0;
  $$('#fo [data-fx]').forEach(b => b.onclick = foClose);
}
function foOpen() {
  FX.stop(); $('#fo').classList.remove('hide');
  if (S.decoy) { Date.now() - new Date(S.decoy.at) >= DECOY_MS ? foEnd() : foTrack(); } else foHome();
}
function foClose() { clearInterval(fo.timer); $('#fo').classList.add('hide'); renderEatbar(); }
swipeDown($('#fo'), {exclude: '.fo-sl,.fo-rate,input', close: foClose});
function foCartBar() {
  const n = cartCount(); if (!n) return '';
  return `<button class="fo-cb" id="foCartBtn"><span>${n} item${n > 1 ? 's' : ''} added<small>${esc(SHOP[fo.cart.shop].name)}</small></span><span>${rupees(bill().items)} · View cart ›</span></button>`;
}
function foWireBar() { const b = $('#foCartBtn'); if (b) b.onclick = foCart; }
function shopCard(s) {
  const tag = s.failed ? `<div class="w">${s.failed} failed payment${s.failed > 1 ? 's' : ''}, you retried every time</div>` : '';
  return `<button class="fo-shop" data-shop="${s.id}"><span class="fo-img">${art(s.art, 84)}<em>${s.times}× ordered</em></span><span class="fo-sb"><b>${esc(s.name)}</b><span class="m">⏱ ${esc(s.eta)} · ${esc(s.area)}</span><span class="c">${esc(s.cuisine)}</span>${tag}</span></button>`;
}
function foHome() {
  const cats = FO_CATS.map(([n, , a], i) => `<button class="fo-cat${fo.cat === i ? ' sel' : ''}" data-cat="${i}"><i>${art(a, 44)}</i>${n}</button>`).join('');
  const again = D.PAST.map((o, i) => `<button class="fo-ag" data-again="${i}"><b>${esc(SHOP[o.shop].name)}</b><span class="it">${esc(o.items.join(', '))}</span><span class="meta">${rupees(o.total)} · ${esc(o.when)}</span>${o.note ? `<span class="warn">${esc(o.note)}</span>` : ''}<span class="re"><i>Reorder</i></span></button>`).join('');
  let shops = [...D.SHOPS].sort((a, b) => b.times - a.times);
  if (fo.cat !== null) shops = shops.filter(s => s.items.some(i => FO_CATS[fo.cat][1].test(i[0])));
  foShell(`<span>${icon.pin}</span><span class="fo-loc"><b>Home ⌄</b><span>Mohali · deliver in minutes</span></span><span class="fo-pill">DECOY</span><button class="fo-x" data-fx aria-label="Close">${icon.x}</button>`,
    `<label class="fo-search">${icon.search}<input id="foQ" placeholder="Search for ‘chalupa’" value="${esc(fo.q)}" autocomplete="off"></label><div id="foRes"></div>
     <div id="foMain"><div class="fo-h">Order again<small>Your real orders, exactly as you placed them</small></div><div class="fo-again">${again}</div>
     <div class="fo-h">What’s on your mind?</div><div class="fo-cats">${cats}</div>
     <div class="fo-h">${fo.cat !== null ? esc(FO_CATS[fo.cat][0]) + ' you order' : 'Restaurants you order from'}<small>Sorted by how often you ordered, Sep–Nov</small></div>${shops.map(shopCard).join('')}</div>`, foCartBar());
  foWireBar();
  $$('#fo [data-shop]').forEach(b => b.onclick = () => foShop(b.dataset.shop));
  $$('#fo [data-cat]').forEach(b => b.onclick = () => { const i = +b.dataset.cat; fo.cat = fo.cat === i ? null : i; foHome(); });
  $$('#fo [data-again]').forEach(b => b.onclick = () => { const o = D.PAST[+b.dataset.again]; fo.cart = {shop: o.shop, lines: {}}; o.items.forEach(n => setQty(o.shop, n, 1)); foCart(); });
  const q = $('#foQ');
  q.oninput = () => {
    fo.q = q.value; const t = q.value.trim().toLowerCase();
    $('#foMain').classList.toggle('hide', !!t);
    $('#foRes').innerHTML = t ? D.SHOPS.flatMap(s => s.items.filter(i => i[0].toLowerCase().includes(t) || s.name.toLowerCase().includes(t)).map(i => `<button class="fo-res" data-shop="${s.id}"><b>${esc(i[0])}</b><span>${esc(s.name)} · ${rupees(i[1])}</span></button>`)).join('') || '<p style="padding:16px;color:#6b726e">Nothing like that in your order history.</p>' : '';
    $$('#foRes [data-shop]').forEach(b => b.onclick = () => foShop(b.dataset.shop));
  };
  if (fo.q) q.oninput();
}
function foShop(id) {
  const s = SHOP[id];
  const rows = s.items.map(([n, p]) => {
    const q = fo.cart && fo.cart.shop === id ? (fo.cart.lines[n] || 0) : 0;
    return `<div class="fo-item"><div class="fo-it"><span class="fo-vg${NV.test(n) ? ' nv2' : ''}"></span><b>${esc(n)}</b><div class="p">${rupees(p)}</div>${PAST_NAMES.has(n) ? '<span class="bs">You’ve ordered this</span>' : ''}${tTag(n)}</div><div class="fo-pic">${art(itemArt(n, s.art), 78)}${q ? `<div class="fo-stp"><button data-d="-1" data-n="${esc(n)}" aria-label="Remove one">−</button>${q}<button data-d="1" data-n="${esc(n)}" aria-label="Add one">+</button></div>` : `<button class="fo-add" data-d="1" data-n="${esc(n)}">ADD</button>`}</div></div>`;
  }).join('');
  const top = $('#foBody').scrollTop;
  foShell(`<button class="fo-back" id="foBack" aria-label="Back">${icon.back}</button><span style="flex:1"></span><span class="fo-pill">DECOY</span><button class="fo-x" data-fx aria-label="Close">${icon.x}</button>`,
    `<div class="fo-mh"><b>${esc(s.name)}</b><span>${esc(s.cuisine)}</span><span>⏱ ${esc(s.eta)} · ${esc(s.area)}</span><span class="ord">You ordered here ${s.times} time${s.times > 1 ? 's' : ''}${s.failed ? ` · retried after ${s.failed} failed payment${s.failed > 1 ? 's' : ''}` : ''}</span></div><div class="fo-h" style="margin-top:14px">Your usual</div>${rows}`, foCartBar());
  $('#foBody').scrollTop = fo.lastShop === id ? top : 0; fo.lastShop = id;
  $('#foBack').onclick = () => { fo.lastShop = null; foHome(); };
  foWireBar();
  $$('#fo [data-d]').forEach(b => b.onclick = () => { setQty(id, b.dataset.n, +b.dataset.d); foShop(id); });
}
function foCart() {
  const lines = cartLines(); if (!lines.length) { foHome(); return; }
  const s = SHOP[fo.cart.shop], B = bill();
  const rows = lines.map(([n, q]) => `<div class="fo-cl"><span class="fo-vg${NV.test(n) ? ' nv2' : ''}"></span><span class="n">${esc(n)}</span><span class="fo-s2"><button data-d="-1" data-n="${esc(n)}" aria-label="Remove one">−</button>${q}<button data-d="1" data-n="${esc(n)}" aria-label="Add one">+</button></span><span class="pr">${rupees(itemOf(s.id, n)[1] * q)}</span></div>`).join('');
  foShell(`<button class="fo-back" id="foBack" aria-label="Back">${icon.back}</button><span class="fo-loc"><b style="font-size:16px">${esc(s.name)}</b><span>${esc(s.eta)} to Home</span></span><button class="fo-x" data-fx aria-label="Close">${icon.x}</button>`,
    `<div class="fo-sec">${rows}<button id="foMore" style="margin-top:6px;font-weight:700;color:#0b7a50">+ Add more items</button></div>
     <div class="fo-sec"><h4>Bill details</h4><div class="fo-bl"><div><span>Item total</span><span>${rupees(B.items)}</span></div><div><span>Delivery fee</span><span>${B.del ? rupees(B.del) : '<s>₹30</s><span class="free">FREE</span>'}</span></div>${B.late ? `<div><span>Late night fee</span><span>${rupees(B.late)}</span></div>` : ''}<div><span>Platform fee</span><span>${rupees(B.plat)}</span></div><div><span>GST and restaurant charges</span><span>${rupees(B.gst)}</span></div><div class="tot"><span>To pay</span><span>${rupees(B.total)}</span></div></div></div>
     <div class="fo-sec"><h4>Delivering to Home</h4><div style="font-size:14px;color:#4a514d">Mohali · pay by UPI</div></div>`,
    `<div class="fo-sl" id="foSl"><div class="fo-fl" id="foFl"></div><span>Slide to pay ${rupees(B.total)}</span><div class="fo-kn" id="foKn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#062015" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div></div>`, true);
  $('#foBack').onclick = () => foShop(s.id); $('#foMore').onclick = () => foShop(s.id);
  $$('#fo [data-d]').forEach(b => b.onclick = () => { setQty(s.id, b.dataset.n, +b.dataset.d); foCart(); });
  const sl = $('#foSl'), kn = $('#foKn'), fl = $('#foFl'); let x0 = null, dx = 0;
  const max = () => sl.clientWidth - kn.clientWidth - 10;
  kn.onpointerdown = e => { x0 = e.clientX; dx = 0; kn.setPointerCapture(e.pointerId); kn.style.transition = fl.style.transition = 'none'; };
  kn.onpointermove = e => { if (x0 === null) return; dx = Math.max(0, Math.min(max(), e.clientX - x0)); kn.style.transform = `translateX(${dx}px)`; fl.style.width = (dx + 30) + 'px'; };
  kn.onpointerup = kn.onpointercancel = () => { if (x0 === null) return; x0 = null; if (dx > max() * 0.82) { kn.style.transform = `translateX(${max()}px)`; foPay(); } else { kn.style.transition = fl.style.transition = 'transform .25s, width .25s'; kn.style.transform = ''; fl.style.width = '0'; } };
}
function foPay() {
  const s = SHOP[fo.cart.shop], B = bill();
  S.decoy = {shop: s.id, name: s.name, items: cartLines(), total: B.total, kcal: B.kcal, at: new Date().toISOString(), ratings: []};
  save(); fo.cart = null; renderEatbar();
  foShell('', `<div class="fo-done"><div class="fo-spin"></div><h2>Placing your order…</h2><p>${esc(s.name)} · ${rupees(B.total)}</p></div>`, '');
  setTimeout(() => {
    if ($('#fo').classList.contains('hide')) return;
    foShell('', `<div class="fo-done"><div class="fo-ck">${icon.check}</div><h2>Order placed</h2><p>${esc(s.name)} is getting it ready</p></div>`, '');
    setTimeout(() => { if (!$('#fo').classList.contains('hide') && S.decoy) foTrack(); }, 1700);
  }, 1500);
}
function foFacts() {
  const d = S.decoy, T = targets(), f = [];
  f.push({t: `This order is about ${d.kcal.toLocaleString('en-IN')} kcal${T ? `: ${Math.round(d.kcal / T.kcal * 100)}% of your whole day` : ''}.`, s: 'Your food targets'});
  const cnt = d.items.reduce((a, [, q]) => a + q, 0);
  f.push({t: `${rupees(d.total)} for ${cnt} item${cnt > 1 ? 's' : ''} that would be gone in 10 minutes.`, s: 'Your order history: about ₹10,000 in 24 days of November'});
  D.T_DOWN.forEach(([a, b, c]) => f.push({t: `${a}: ${b.charAt(0).toLowerCase() + b.slice(1)}.`, s: c}));
  D.HARD.slice(3).forEach(h => f.push({t: fill(h.t), s: h.s}));
  return f;
}
function foTrack() {
  const d = S.decoy; if (!d) { foHome(); return; }
  const facts = foFacts();
  const rate = Array.from({length: 10}, (_, i) => `<button data-r="${i + 1}">${i + 1}</button>`).join('');
  foShell(`<span class="fo-loc"><b style="font-size:16px">${esc(d.name)}</b><span>${d.items.map(([n, q]) => (q > 1 ? q + ' × ' : '') + n).join(', ')}</span></span><button class="fo-x" data-fx aria-label="Close">${icon.x}</button>`,
    `<div class="fo-trk"><small>Order placed · ${rupees(d.total)}</small><b id="foEta">Arriving in 15 mins</b><div class="fo-rt"><span class="fo-end1">${icon.shop}</span><span class="fo-rp" id="foRp"></span><span class="fo-rd" id="foRd">${icon.bike}</span><span class="fo-end2">${icon.home}</span></div></div>
     <div class="fo-sec"><div class="fo-stg" id="foStg"></div></div>
     <div class="fo-sec"><h4>How strong is the craving right now?</h4><div class="fo-rate" id="foRate">${rate}</div><div id="foRt" style="font-size:13px;color:#6b726e;margin-top:8px"></div></div>
     <div class="fo-sec" style="padding:0;border:0;background:none"><div class="fo-fact" id="foFact"></div></div>
     <button class="fo-cancel" id="foCancel">Cancel order</button>`, '', true);
  const showFact = () => { const x = facts[fo.factI++ % facts.length], el = $('#foFact'); if (!el) return; el.style.opacity = 0; setTimeout(() => { el.innerHTML = `<b>${esc(x.t)}</b><small>${esc(x.s)}</small>`; el.style.opacity = 1; }, 300); };
  showFact();
  const paintR = () => { const r = S.decoy && S.decoy.ratings; if (!r) return; $('#foRt').textContent = r.length ? 'So far: ' + r.map(x => x.v).join(' → ') : 'Rate it now, and again every few minutes. Watch it fall.'; };
  paintR();
  $$('#foRate [data-r]').forEach(b => b.onclick = () => { $$('#foRate button').forEach(x => x.classList.toggle('sel', x === b)); S.decoy.ratings.push({at: Date.now(), v: +b.dataset.r}); save(); paintR(); });
  $('#foCancel').onclick = () => foFinish('cancelled');
  const stages = [[0, 'Order confirmed'], [1, 'Food is being prepared'], [5, 'Rider assigned'], [8, 'Order picked up'], [10, 'On the way to you'], [14, 'Arriving now']];
  const tickT = () => {
    if (!S.decoy) return; const el = Date.now() - new Date(S.decoy.at), p = Math.min(1, el / DECOY_MS);
    if (el >= DECOY_MS) { clearInterval(fo.timer); foEnd(); return; }
    const left = Math.max(1, Math.ceil((DECOY_MS - el) / MIN)), m = el / DECOY_MS * 15;
    $('#foEta').textContent = left <= 1 ? 'Arriving in under a minute' : `Arriving in ${left} mins`;
    const w = $('.fo-rt').clientWidth - 40; $('#foRp').style.width = (w * p) + 'px'; $('#foRd').style.left = (20 + w * p) + 'px';
    $('#foStg').innerHTML = stages.map(([t, n]) => `<div class="${m >= t ? 'on' : ''}">${n}</div>`).join('');
    if (Math.floor(el / 9000) !== fo.lastFact) { fo.lastFact = Math.floor(el / 9000); if (el > 1000) showFact(); }
  };
  clearInterval(fo.timer); tickT(); fo.timer = setInterval(tickT, 1000);
}
function foFinish(outcome) {
  const d = S.decoy; if (!d) return; clearInterval(fo.timer);
  S.decoys = S.decoys || [];
  S.decoys.unshift({at: d.at, shop: d.name, items: d.items, total: d.total, kcal: d.kcal, ratings: d.ratings.map(r => r.v), outcome});
  S.urges.unshift({at: d.at, want: 'decoy order: ' + d.name, hungry: null, ratings: d.ratings.map(r => r.v), outcome: 'won'});
  S.decoy = null; save(); queueSync(dkey(d.at)); renderEatbar();
  foEnd(S.decoys[0]);
}
function foEnd(rec) {
  if (!rec) { if (S.decoy) { foFinish('waited'); return; } foHome(); return; }
  const r = rec.ratings, cancelled = rec.outcome === 'cancelled';
  foShell(`<span style="flex:1"></span><button class="fo-x" data-fx aria-label="Close">${icon.x}</button>`,
    `<div class="fo-end"><span class="fo-pill">DECOY</span><h2>${cancelled ? 'Cancelled. Nothing was ever coming.' : 'Your order isn’t coming. It never was.'}</h2>
     <p>${cancelled ? 'You chose, you browsed, you paid in your head, and then you walked away. That’s the whole craving, handled.' : 'The wanting rose, peaked and passed while you watched a rider who doesn’t exist. That was the wave, ridden out.'}</p>
     <div class="fo-sts"><div class="fo-st"><b>${rupees(rec.total)}</b><span>stays with you</span></div><div class="fo-st"><b>${rec.kcal.toLocaleString('en-IN')}</b><span>kcal you didn’t eat</span></div>${r.length > 1 ? `<div class="fo-st" style="grid-column:1/-1"><b>${r[0]} → ${r[r.length - 1]}</b><span>your craving, start to finish</span></div>` : ''}</div>
     <h3>Eat this instead</h3><p style="font-size:14px;margin:0 0 6px">The home version of what you just ordered is first.</p>${eatHTML(focusFor(rec.items.map(x => x[0])))}
     <button class="fo-btn dark" data-fx style="margin-top:18px">Done</button></div>`, '');
  $$('#fo [data-rk]').forEach(b => b.onclick = () => { foClose(); eatSheet(b.dataset.rk, focusFor(rec.items.map(x => x[0]))); });
  renderAll();
}
if (new URLSearchParams(location.search).get('go') === 'order') setTimeout(foOpen, 300);

/* ---------- celebrations ---------- */
let confT = 0;
function celebrate(tag, title, body) {
  $('#cTag').textContent = tag; $('#cTitle').textContent = title; $('#cBody').textContent = body;
  $('#cele').classList.remove('hide');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#conf'), g = cv.getContext('2d'), W = cv.width = innerWidth, H = cv.height = innerHeight;
  const cols = ['#7ef0b5', '#ff6b57', '#ffd166', '#ffffff'];
  const ps = Array.from({length:140}, () => ({x: W/2, y: H*0.42, vx: (Math.random()-.5)*14, vy: -Math.random()*14 - 4, r: 3 + Math.random()*4, c: pick(cols), a: Math.random()*6}));
  const t0 = performance.now(); cancelAnimationFrame(confT);
  const f = t => { g.clearRect(0, 0, W, H); ps.forEach(p => { p.vy += .35; p.x += p.vx; p.y += p.vy; p.a += .2; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r, -p.r/2, p.r*2, p.r); g.restore(); }); if (t - t0 < 3200) confT = requestAnimationFrame(f); else g.clearRect(0, 0, W, H); };
  confT = requestAnimationFrame(f);
}
$('#cOk').onclick = () => { $('#cele').classList.add('hide'); renderAll(); };
swipeDown($('#cele'), {close: () => { $('#cele').classList.add('hide'); renderAll(); }});
function checkMilestones() {
  const r = reachedCount();
  if (r - 1 > S.celebrated) {
    const m = D.MILES[r - 1]; S.celebrated = r - 1; save();
    if ($('#sos').classList.contains('hide') && $('#story').classList.contains('hide')) celebrate(m.tag + ' unlocked', m.title, fill(m.body));
    renderBodyMap();
  }
}

/* ---------- food logger (everything in grams) ---------- */
const F = window.SOS_FOODS;
let FOOD = {};
function buildFood() { const ed = S.foodEdits || {}; FOOD = Object.fromEntries(F.FOODS.map(f => [f.id, ed[f.id] ? Object.assign({}, f, ed[f.id], {edited: true}) : f]).concat((S.myFoods || []).map(f => [f.id, f]))); }
if (!S.myFoods) S.myFoods = [];
buildFood();
// One-time move from "servings" to grams, so nothing logged before is lost.
function migrateFood() {
  if (S.foodV === 2) return;
  Object.values(S.food || {}).forEach(list => list.forEach(it => { if (it.g == null) { const f = FOOD[it.id]; it.g = Math.round((it.q || 1) * (F.LEGACY_G[it.id] || (f ? f.units[0][1] : 100))); delete it.q; } }));
  S.foodV = 2; save();
}
migrateFood();
if (!S.lastG) S.lastG = {};
let fDay = 0; // days back from today
const fKey = () => { const n = new Date(); return dkey(new Date(n.getFullYear(), n.getMonth(), n.getDate() - fDay)); };
const dayItems = k => (S.food[k] || []);
const fmt1 = x => (Math.round(x*10)/10).toString();
const NUTS = ['kcal','p','c','f','fib','na','k','ca','fe','vc','zn','sug','asug','mg','b12','vd','fol','va'];
const nut = (f, g, k) => (f[k] || 0) * g / 100;
const PLURAL = {egg:'eggs', white:'whites', slice:'slices', bowl:'bowls', plate:'plates', glass:'glasses', cup:'cups', scoop:'scoops', 'level scoop':'level scoops', omelette:'omelettes', half:'halves', handful:'handfuls', bottle:'bottles', bar:'bars', wafer:'wafers', pack:'packs', piece:'pieces', serving:'servings', 'regular bowl':'regular bowls'};
function unitName(label, n) {
  if (Math.abs(n - 1) < 0.01) return label;
  const m = label.match(/^([a-z][a-z ]*?)(\s*\(.*\))?$/i); if (!m) return label;
  return (PLURAL[m[1].trim()] || m[1].trim()) + (m[2] || '');
}
const fmtCount = n => { const q = Math.round(n * 4) / 4; return Math.abs(n - q) < 0.04 ? String(+q.toFixed(2)) : n.toFixed(1); };
function countLabel(f, g) {
  const u = f.units[0], n = g / u[1];
  if (Math.abs(n * 4 - Math.round(n * 4)) > 0.04) return '';
  return /^\d/.test(u[0]) ? fmtCount(n) + ' × ' + u[0] : fmtCount(n) + ' ' + unitName(u[0], n);
}
function amountLabel(f, g) { const c = countLabel(f, g); return (c ? c + ' · ' : '') + Math.round(g) + ' g'; }
function totals(k) {
  const t = Object.fromEntries(NUTS.map(x => [x, 0]));
  dayItems(k).forEach(it => { const f = FOOD[it.id]; if (f) NUTS.forEach(x => t[x] += nut(f, it.g, x)); });
  return t;
}
function targets() {
  const w = curWeight(), P = S.prof;
  if (!P.age) return null;
  const bmr = 10*w + 6.25*P.h - 5*P.age + 5;
  const tdee = bmr * P.act;
  const kcal = Math.max(Math.round(bmr/10)*10, Math.round((tdee - P.def)/10)*10);
  const p = Math.round(1.6*w/5)*5;
  const f = Math.round(kcal*0.25/9);
  const c = Math.max(0, Math.round((kcal - p*4 - f*9)/4));
  return {bmr:Math.round(bmr), tdee:Math.round(tdee), kcal, p, f, c};
}
const microRef = (m, T) => m.per2000 ? Math.round(m.ref * (T ? T.kcal : 2000) / 2000) : m.ref;
function bar(pct, col) { return `<div class="track"><i style="width:${Math.min(100, Math.max(0, pct*100)).toFixed(1)}%;background:${col}"></i></div>`; }
function renderTCard(k, t, T) {
  const names = dayItems(k).map(it => (FOOD[it.id] || {}).name || '').join(' | ');
  const checks = [
    ['Whole eggs', /whole egg|omelette/i.test(names)],
    [`Zinc ${fmt1(t.zn)} / 17 mg`, t.zn >= 17],
    ['Healthy fat: nuts or avocado', /almond|walnut|avocado/i.test(names)],
    ['Greens', /saag|palak/i.test(names)],
    ['Fish', /fish/i.test(names)],
    [T ? `Protein ${Math.round(t.p)} / ${T.p} g` : `Protein ${Math.round(t.p)} g`, T ? t.p >= T.p : false]
  ];
  const lowFat = t.kcal > 800 && t.f * 9 / t.kcal < 0.2, sugHi = t.asug > microRef(F.SUGAR, T);
  $('#tCard').innerHTML = `<div class="tcard"><div class="tc-h"><b>Testosterone foods today</b><span>${checks.filter(c => c[1]).length} of ${checks.length}</span></div><div class="tc-chips">${checks.map(([n, ok]) => `<span class="${ok ? 'ok' : ''}">${ok ? '✓ ' : ''}${esc(n)}</span>`).join('')}</div>${lowFat ? '<p class="tc-w">Fat is under 20% of today’s calories. Low-fat eating cuts testosterone 10–15%: add eggs, nuts or a little ghee.</p>' : ''}${sugHi ? '<p class="tc-w">Added sugar is over today’s limit. In a 2013 study, a 75 g sugar drink cut men’s testosterone by about a quarter within 2 hours (Caronia, Clinical Endocrinology).</p>' : ''}</div>`;
}
const isPlateMeal = id => id === 'lunch' || id === 'dinner';
function renderFood() {
  const k = fKey(), t = totals(k), T = targets();
  $('#dLabel').textContent = fDay === 0 ? 'Today' : fDay === 1 ? 'Yesterday' : new Date(k).toLocaleDateString('en-IN', {weekday:'short', day:'numeric', month:'short'});
  $('#dNext').disabled = fDay === 0;
  const C = 2*Math.PI*52, pct = T ? t.kcal / T.kcal : 0, over = T && t.kcal > T.kcal;
  $('#kRing').innerHTML = `<circle cx="60" cy="60" r="52" fill="none" stroke="#1f362c" stroke-width="10"/><circle cx="60" cy="60" r="52" fill="none" stroke="${over ? '#ff6b57' : '#7ef0b5'}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-Math.min(1, pct))).toFixed(1)}"/>`;
  if (T) { $('#kBig').textContent = Math.abs(Math.round(T.kcal - t.kcal)).toLocaleString('en-IN'); $('#kLab').textContent = over ? 'kcal over' : 'kcal left of ' + T.kcal.toLocaleString('en-IN'); }
  else { $('#kBig').textContent = Math.round(t.kcal).toLocaleString('en-IN'); $('#kLab').textContent = 'kcal eaten'; }
  const fibRef = microRef(F.MICROS[0], T);
  const M = [['Protein', t.p, T && T.p, '#7ef0b5'], ['Carbs', t.c, T && T.c, '#ffd166'], ['Fat', t.f, T && T.f, '#ff9b85'], ['Fibre', t.fib, fibRef, '#9fd8bd']];
  const sRef = microRef(F.SUGAR, T), sOver = t.asug > sRef;
  $('#macros').innerHTML = M.map(([n, v, tg, col]) => `<div class="mb"><div><span>${n}</span><b>${Math.round(v)}${tg ? ' / ' + tg : ''} g</b></div>${bar(tg ? v/tg : 0, col)}</div>`).join('')
    + `<div class="mb sugar"><div><span>Added sugar</span><b style="color:${sOver ? 'var(--coral)' : 'inherit'}">${fmt1(t.asug)} / ${sRef} g</b></div>${bar(t.asug / sRef, sOver ? '#ff6b57' : '#ffd166')}<small>All sugar ${Math.round(t.sug)} g, incl. fruit and milk</small></div>`;
  renderTCard(k, t, T);
  $('#fNote').innerHTML = T ? '' : `<div class="note">Add your age in <b>Targets</b> below and I’ll work out your calories, protein, carbs and fat from your weight (${curWeight()} kg) and height (${S.prof.h} cm).</div>`;
  $('#meals').innerHTML = F.MEALS.map(([id, name]) => {
    const items = dayItems(k).map((it, i) => ({it, i})).filter(x => x.it.meal === id && FOOD[x.it.id]);
    const kc = items.reduce((s, x) => s + nut(FOOD[x.it.id], x.it.g, 'kcal'), 0);
    const tpl = F.TEMPLATES.filter(tp => tp.meal === id);
    let empty = '';
    if (!items.length) {
      if (isPlateMeal(id)) empty = `<div class="tpl"><button class="tpl-main" data-plate="${id}">Build my plate</button><button data-copy="${id}">Same as yesterday</button></div>`;
      else if (tpl.length) empty = '<div class="tpl">' + tpl.map(tp => `<button data-tpl="${tp.id}">+ ${tp.name}</button>`).join('') + `<button data-copy="${id}">Same as yesterday</button></div>`;
      else empty = `<div class="tpl"><button data-copy="${id}">Same as yesterday</button></div>`;
    }
    return `<div class="meal"><div class="mh"><div><b>${name}</b> <span>${items.length ? Math.round(kc) + ' kcal' : ''}</span></div><button class="addb" data-add="${id}">+ Add</button></div>
      ${items.map(({it, i}) => { const f = FOOD[it.id]; return `<div class="fi"><button class="nm" data-edit="${i}"><b>${esc(f.name)}${f.pk ? '<span class="pk">Packaged</span>' : ''}${noSugar(f) ? '<span class="nosug">sugar not set</span>' : ''}</b><span>${esc(amountLabel(f, it.g))}</span></button><div class="kc">${Math.round(nut(f, it.g, 'kcal'))} kcal<small>${fmt1(nut(f, it.g, 'p'))} g protein</small></div><button class="rm" data-rm="${i}" aria-label="Remove ${esc(f.name)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`; }).join('')}
      ${empty}${items.length ? `<div class="tpl"><button data-sugar="${id}">+ Sugar</button></div>` : ''}</div>`;
  }).join('');
  $('#micros').innerHTML = F.MICROS.map(m => { const ref = microRef(m, T), v = t[m.k] || 0, p = v / ref, bad = m.limit && v > ref; return `<div class="mi"><span>${m.name}${m.t ? '<i class="tplus">T</i>' : ''}${m.note ? `<small>${esc(m.note)}</small>` : ''}</span>${bar(p, m.limit ? (bad ? '#ff6b57' : '#ffd166') : '#7ef0b5')}<b style="color:${bad ? 'var(--coral)' : 'inherit'}">${(v < 10 && m.unit !== 'g' ? fmt1(v) : Math.round(v).toLocaleString('en-IN'))} / ${ref.toLocaleString('en-IN')} ${m.unit}</b></div>`; }).join('');
  renderWeight(); renderTargets();
}
function addItems(meal, list) {
  const k = fKey();
  S.food[k] = dayItems(k).concat(list.map(([id, g]) => ({meal, id, g: Math.round(g)})));
  list.forEach(([id, g]) => S.lastG[id] = Math.round(g));
  save(); queueSync(k); renderFood(); renderFoodCard();
}
$('#meals').addEventListener('click', e => {
  const k = fKey(), b = e.target.closest('button'); if (!b) return;
  if (b.dataset.add) addSheet(b.dataset.add);
  else if (b.dataset.plate) plateSheet(b.dataset.plate);
  else if (b.dataset.tpl) { const tp = F.TEMPLATES.find(x => x.id === b.dataset.tpl); addItems(tp.meal, tp.items); toast(tp.name + ' logged. Tap any item to change the amount.'); }
  else if (b.dataset.copy) { const n = new Date(); const y = dkey(new Date(n.getFullYear(), n.getMonth(), n.getDate() - fDay - 1)); const src = (S.food[y] || []).filter(x => x.meal === b.dataset.copy && FOOD[x.id]); if (!src.length) { toast('Nothing logged for that meal the day before.'); return; } addItems(b.dataset.copy, src.map(x => [x.id, x.g])); }
  else if (b.dataset.rm) { S.food[k].splice(+b.dataset.rm, 1); save(); queueSync(k); renderFood(); renderFoodCard(); }
  else if (b.dataset.edit) editSheet(+b.dataset.edit);
  else if (b.dataset.sugar) sugarSheet(b.dataset.sugar);
});
$('#dPrev').onclick = () => { fDay++; renderFood(); };
$('#dNext').onclick = () => { if (fDay > 0) fDay--; renderFood(); };

/* amount control: units and grams, kept in step */
const unitStep = f => f.units[0][1] < 60 ? 1 : 0.5;
const defaultG = f => S.lastG[f.id] || f.units[0][1] * (/roti/i.test(f.name) ? 2 : 1);
function amtRow(f, g) {
  return `<div class="amt" data-amt="${f.id}"><button class="stp" data-d="-1" aria-label="Less">−</button><span class="qv"><b>${fmtCount(g / f.units[0][1])}</b><small>${esc(unitName(f.units[0][0], g / f.units[0][1]))}</small></span><button class="stp" data-d="1" aria-label="More">+</button><label class="gin"><input type="number" inputmode="decimal" min="1" max="3000" value="${Math.round(g)}" aria-label="${esc(f.name)} in grams"><span>g</span></label></div>`;
}
// Wires every amount row inside root. get(id) returns grams, set(id, g) stores them, after() runs on each change.
function wireAmt(root, get, set, after) {
  root.addEventListener('click', e => {
    const b = e.target.closest('.stp'); if (!b) return; const row = b.closest('[data-amt]'), f = FOOD[row.dataset.amt]; if (!f) return;
    const u = f.units[0][1], st = unitStep(f), n = get(f.id) / u;
    const next = Math.max(st, (+b.dataset.d > 0 ? Math.floor(n / st + 1e-6) + 1 : Math.ceil(n / st - 1e-6) - 1) * st);
    set(f.id, next * u); paintAmt(row, f, next * u, true); after && after();
  });
  root.addEventListener('input', e => {
    const inp = e.target.closest('.gin input'); if (!inp) return; const row = inp.closest('[data-amt]'), f = FOOD[row.dataset.amt]; if (!f) return;
    const v = parseFloat(inp.value); if (!(v > 0)) return; set(f.id, v); paintAmt(row, f, v, false); after && after();
  });
}
function paintAmt(row, f, g, setInput) {
  const n = g / f.units[0][1];
  row.querySelector('.qv b').textContent = fmtCount(n); row.querySelector('.qv small').textContent = unitName(f.units[0][0], n);
  if (setInput) row.querySelector('.gin input').value = Math.round(g);
}
const sumLine = (f, g) => `${Math.round(nut(f, g, 'kcal'))} kcal · ${fmt1(nut(f, g, 'p'))} g protein · ${fmt1(nut(f, g, 'c'))} g carbs · ${fmt1(nut(f, g, 'f'))} g fat`;
function amtPanel(f, g, label, extra) {
  const u = f.units[0];
  return `<div class="qty"><b>${esc(f.name)}${f.pk ? '<span class="pk">Packaged</span>' : ''}</b><span class="mute" style="font-size:13px">1 ${esc(u[0])} = ${u[1]} g · ${Math.round(f.kcal*u[1]/100)} kcal · ${fmt1(f.p*u[1]/100)} g protein${f.note ? ' · ' + esc(f.note) : ''}</span>
    ${amtRow(f, g)}<div class="sum" id="qsum">${sumLine(f, g)}</div><button class="btn mint full" id="qOk">${label}</button>${extra || ''}</div>`;
}
function bindAmtPanel(root, f, g0, onOk) {
  let g = g0;
  wireAmt(root.querySelector('.qty'), () => g, (id, v) => { g = v; }, () => { $('#qsum').textContent = sumLine(f, g); });
  $('#qOk').onclick = () => onOk(g);
}
function foodUsage() { const c = {}; Object.values(S.food).forEach(l => l.forEach(it => c[it.id] = (c[it.id] || 0) + 1)); return c; }
function recentIds() {
  const out = []; Object.keys(S.food).sort().reverse().forEach(k => S.food[k].slice().reverse().forEach(it => { if (FOOD[it.id] && !FOOD[it.id].hidden && !out.includes(it.id)) out.push(it.id); }));
  return out.slice(0, 10);
}
function addSheet(meal, openId) {
  const mealName = F.MEALS.find(m => m[0] === meal)[1];
  const recent = recentIds();
  const cats = (recent.length ? ['Recent'] : []).concat(['All'], [...new Set(F.FOODS.map(f => f.cat))], S.myFoods.some(f => !f.hidden) ? ['My foods'] : []);
  let cat = cats[0], q = '';
  sheet(`<div class="q" style="font-size:26px;margin-bottom:10px">Add to ${mealName}</div>
    ${isPlateMeal(meal) ? `<button class="btn mint full" id="toPlate" style="margin-bottom:12px">Build my plate</button>` : ''}
    <input class="srch" id="fSearch" type="search" placeholder="Search your foods" aria-label="Search foods">
    <div class="cats" id="fCats">${cats.map((c, i) => `<button data-c="${c}" class="${i ? '' : 'sel'}">${c}</button>`).join('')}</div>
    <div id="fQty"></div><div class="flist" id="fList"></div>
    <button class="btn dim full" id="toCustom" style="margin-top:12px">Not on the list? Add your own food</button>
    <button class="btn dim full" id="shClose">Done</button>`, () => {
      const pool = () => Object.values(FOOD).filter(f => !f.hidden);
      const list = () => {
        const s = q.trim().toLowerCase();
        let fs = s ? pool().filter(f => f.name.toLowerCase().includes(s)) : cat === 'Recent' ? recent.map(id => FOOD[id]) : cat === 'All' ? pool() : cat === 'My foods' ? S.myFoods.filter(f => !f.hidden) : pool().filter(f => f.cat === cat);
        $('#fList').innerHTML = fs.map(f => `<div class="fi"><button class="nm" data-f="${f.id}"><b>${esc(f.name)}${f.pk ? '<span class="pk">Packaged</span>' : ''}</b><span>1 ${esc(f.units[0][0])} · ${f.units[0][1]} g</span></button><div class="kc">${Math.round(f.kcal * f.units[0][1] / 100)} kcal<small>${fmt1(f.p * f.units[0][1] / 100)} g protein</small></div></div>`).join('') || '<p class="mute">No match. Add it as your own food below.</p>';
      };
      list();
      $('#fSearch').oninput = e => { q = e.target.value; list(); };
      $('#fCats').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; cat = b.dataset.c; $$('#fCats button').forEach(x => x.classList.toggle('sel', x === b)); list(); };
      $('#fList').onclick = e => {
        const b = e.target.closest('[data-f]'); if (!b) return; const f = FOOD[b.dataset.f];
        $('#fQty').innerHTML = amtPanel(f, defaultG(f), 'Add to ' + mealName.toLowerCase(), f.mine ? `<button class="btn dim full" id="qDel" style="margin-top:8px">Delete this food from my list</button>` : '');
        bindAmtPanel($('#fQty'), f, defaultG(f), g => { addItems(meal, [[f.id, g]]); $('#fQty').innerHTML = ''; toast(f.name + ' added to ' + mealName.toLowerCase() + '.'); });
        const del = $('#qDel'); if (del) del.onclick = () => { f.hidden = true; save(); buildFood(); $('#fQty').innerHTML = ''; list(); toast('Removed from your list.'); };
        $('#fQty').scrollIntoView({behavior:'smooth', block:'nearest'});
      };
      const tp = $('#toPlate'); if (tp) tp.onclick = () => plateSheet(meal);
      $('#toCustom').onclick = () => customSheet(meal);
      $('#shClose').onclick = closeSheet;
      if (openId) { const c = [...$$('#fCats button')].find(x => x.dataset.c === 'My foods'); if (c) c.click(); const it = $(`[data-f="${openId}"]`); if (it) it.click(); }
    });
}
function plateSheet(meal) {
  const mealName = F.MEALS.find(m => m[0] === meal)[1], use = foodUsage();
  const byUse = (a, b) => (use[b.id] || 0) - (use[a.id] || 0);
  const mains = F.FOODS.filter(f => f.kind === 'main').concat(S.myFoods.filter(f => !f.hidden)).sort(byUse);
  const sides = F.FOODS.filter(f => f.kind === 'side').sort(byUse);
  const sel = new Map();
  const chip = f => `<button data-pick="${f.id}">${esc(f.name)}</button>`;
  sheet(`<div class="q" style="font-size:26px">Your ${mealName.toLowerCase()}</div><p class="mute" style="margin-top:-4px">Pick what was made at home and what you had with it. Amounts start at what you usually have; change them by portion or in grams.</p>
    <h4 class="plh">Made at home</h4><div class="chips pl" id="plMain">${mains.map(chip).join('')}</div>
    <h4 class="plh">With it</h4><div class="chips pl" id="plSide">${sides.map(chip).join('')}</div>
    <div id="plRows"></div><div style="height:84px"></div>
    <div class="plbar"><div id="plTot">Pick what you ate</div><button class="btn mint" id="plOk" disabled>Log</button></div>`, l => {
      const rows = $('#plRows');
      const paintTot = () => {
        let t = {kcal:0, p:0, c:0, f:0}; sel.forEach((g, id) => ['kcal','p','c','f'].forEach(k => t[k] += nut(FOOD[id], g, k)));
        $('#plTot').innerHTML = sel.size ? `<b>${Math.round(t.kcal)} kcal</b><span>${Math.round(t.p)} g protein · ${Math.round(t.c)} g carbs · ${Math.round(t.f)} g fat</span>` : 'Pick what you ate';
        $('#plOk').disabled = !sel.size;
        rows.querySelectorAll('[data-row]').forEach(r => { const id = r.dataset.row; r.querySelector('.plk').textContent = Math.round(nut(FOOD[id], sel.get(id), 'kcal')) + ' kcal · ' + fmt1(nut(FOOD[id], sel.get(id), 'p')) + ' g protein'; });
      };
      const paintRows = () => { rows.innerHTML = [...sel.keys()].map(id => { const f = FOOD[id]; return `<div class="plr" data-row="${id}"><div class="plt"><b>${esc(f.name)}</b><span class="plk"></span></div>${amtRow(f, sel.get(id))}</div>`; }).join(''); paintTot(); };
      l.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { const id = b.dataset.pick; if (sel.has(id)) sel.delete(id); else sel.set(id, defaultG(FOOD[id])); b.classList.toggle('sel', sel.has(id)); paintRows(); });
      wireAmt(rows, id => sel.get(id), (id, g) => sel.set(id, g), paintTot);
      $('#plOk').textContent = 'Log to ' + mealName.toLowerCase();
      $('#plOk').onclick = () => { addItems(meal, [...sel.entries()]); closeSheet(); toast(mealName + ' logged.'); };
    });
}
function customSheet(meal) {
  sheet(`<div class="q" style="font-size:26px">Add your own food</div><p class="mute" style="margin-top:-4px">Copy the numbers from the pack’s label, or a trusted source. It stays in your list for next time.</p>
    <div class="frm" style="grid-template-columns:1fr">
      <label>Name<input id="cName" maxlength="40" placeholder="e.g. Besan chilla"></label>
      <label>The numbers below are for<select id="cBasis"><option value="100">100 g (as on most labels)</option><option value="serv">One serving</option></select></label>
      <div id="cServ" class="hide" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label>Serving name<input id="cSName" maxlength="20" placeholder="chilla"></label><label>Serving weight, g<input id="cSG" type="number" inputmode="decimal" min="1" placeholder="80"></label></div>
    </div>
    <div class="frm"><label>Calories, kcal<input id="cK" type="number" inputmode="decimal" min="0"></label><label>Protein, g<input id="cP" type="number" inputmode="decimal" min="0"></label><label>Carbs, g<input id="cC" type="number" inputmode="decimal" min="0"></label><label>Fat, g<input id="cF" type="number" inputmode="decimal" min="0"></label><label>Fibre, g (optional)<input id="cFi" type="number" inputmode="decimal" min="0"></label><label>Sodium, mg (optional)<input id="cNa" type="number" inputmode="decimal" min="0"></label><label>Total sugars, g (optional)<input id="cSu" type="number" inputmode="decimal" min="0"></label><label>Added sugars, g (optional)<input id="cAs" type="number" inputmode="decimal" min="0"></label></div>
    <div class="two" style="margin-top:16px"><button class="btn dim" id="cBack">Back</button><button class="btn mint" id="cSave">Save and add</button></div>`, () => {
      $('#cBasis').onchange = () => $('#cServ').classList.toggle('hide', $('#cBasis').value !== 'serv');
      $('#cBack').onclick = () => addSheet(meal);
      $('#cSave').onclick = () => {
        const name = $('#cName').value.trim(), serv = $('#cBasis').value === 'serv', sg = parseFloat($('#cSG').value), num = id => { const v = parseFloat($(id).value); return v >= 0 ? v : 0; };
        const kcal = num('#cK'), p = num('#cP'), c = num('#cC'), fat = num('#cF');
        if (!name) { toast('Give it a name.'); return; }
        if (serv && !(sg > 0)) { toast('Add how many grams one serving weighs.'); return; }
        if (!(kcal > 0) && !(p > 0)) { toast('Add at least the calories.'); return; }
        const base = serv ? sg : 100, k = 100 / base;
        const f = {id: 'my-' + Date.now().toString(36), name, cat: 'My foods', mine: true, kind: '', note: 'your own entry', pk: false,
          units: [[serv ? ($('#cSName').value.trim() || 'serving') : '100 g', serv ? sg : 100]],
          kcal: kcal*k, p: p*k, c: c*k, f: fat*k, fib: num('#cFi')*k, na: num('#cNa')*k, k: 0, ca: 0, fe: 0, vc: 0, zn: 0, sug: Math.max(num('#cSu'), num('#cAs'))*k, asug: num('#cAs')*k, mg: 0, b12: 0, vd: 0, fol: 0, va: 0};
        if (!serv) f.units = [['serving (100 g)', 100]];
        S.myFoods.push(f); save(); buildFood();
        addSheet(meal, f.id);
      };
    });
}
function editSheet(i) {
  const k = fKey(), it = S.food[k][i], f = FOOD[it.id];
  sheet(`<div class="q" style="font-size:26px">Change amount</div>${amtPanel(f, it.g, 'Save', `<button class="btn dim full" id="eNut" style="margin-top:8px">Edit nutrition${noSugar(f) ? ' · sugar not set' : ''}</button><button class="btn dim full" id="eDel" style="margin-top:8px">Remove from ${F.MEALS.find(m => m[0] === it.meal)[1].toLowerCase()}</button>`)}<button class="btn dim full" id="shClose">Cancel</button>`, l => {
    $('#eNut').onclick = () => nutriSheet(f.id, () => editSheet(i));
    bindAmtPanel(l, f, it.g, g => { it.g = Math.round(g); S.lastG[f.id] = it.g; save(); queueSync(k); closeSheet(); renderFood(); renderFoodCard(); });
    $('#eDel').onclick = () => { S.food[k].splice(i, 1); save(); queueSync(k); closeSheet(); renderFood(); renderFoodCard(); };
    $('#shClose').onclick = closeSheet;
  });
}

// Foods you added before the sugar counter have no sugar numbers yet.
const noSugar = f => !!f.mine && f.sug === undefined;
// Edit the numbers for any food: your own foods change in place; the app's foods get your override.
function nutriSheet(id, back) {
  const f = FOOD[id], u = f.units[0], base = F.FOODS.find(x => x.id === id);
  const FLD = [['kcal', 'Calories, kcal'], ['p', 'Protein, g'], ['c', 'Carbs, g'], ['f', 'Fat, g'], ['fib', 'Fibre, g'], ['na', 'Sodium, mg'], ['sug', 'Total sugars, g'], ['asug', 'Added sugars, g']];
  let per = u[1] === 100 ? 100 : u[1];
  const val = (k, g) => f[k] === undefined ? '' : String(Math.round(f[k] * g / 100 * 10) / 10);
  sheet(`<div class="q" style="font-size:26px">Edit nutrition</div><p class="mute" style="margin-top:-4px">${esc(f.name)}. Changes apply to every day you’ve logged it, past and future.${f.mine ? '' : ' Reset brings back the app’s numbers.'}</p>
    <div class="frm" style="grid-template-columns:1fr"><label>The numbers are for<select id="nBasis"><option value="${u[1]}">1 ${esc(u[0])} (${u[1]} g)</option>${u[1] === 100 ? '' : '<option value="100">100 g</option>'}</select></label></div>
    <div class="frm">${FLD.map(([k, lab]) => `<label>${lab}<input data-k="${k}" type="number" inputmode="decimal" min="0" value="${val(k, per)}"></label>`).join('')}</div>
    <p class="mute tiny">Added sugar means sugar, gur, honey or syrup put into the food. Sugar that’s naturally in fruit or milk goes only in total sugars.</p>
    <div class="two" style="margin-top:16px"><button class="btn dim" id="nBack">Back</button><button class="btn mint" id="nSave">Save</button></div>
    ${f.edited ? '<button class="btn dim full" id="nReset" style="margin-top:8px">Reset to the app’s numbers</button>' : ''}`, l => {
    $('#nBasis').onchange = () => { const g = +$('#nBasis').value; l.querySelectorAll('[data-k]').forEach(inp => { const v = parseFloat(inp.value); if (v >= 0) inp.value = String(Math.round(v * g / per * 10) / 10); }); per = g; };
    $('#nBack').onclick = back;
    $('#nSave').onclick = () => {
      const o = {};
      l.querySelectorAll('[data-k]').forEach(inp => { const v = parseFloat(inp.value); if (v >= 0) o[inp.dataset.k] = v * 100 / per; });
      if (!(o.kcal > 0)) { toast('Add the calories.'); return; }
      if (o.asug > (o.sug || 0)) o.sug = o.asug;
      if (o.sug !== undefined && o.asug === undefined) o.asug = 0;
      if (f.mine) { const m = S.myFoods.find(x => x.id === id); Object.assign(m, o); }
      else { S.foodEdits = S.foodEdits || {}; const d = {}; Object.keys(o).forEach(k => { if (Math.abs(o[k] - (base[k] || 0)) > 0.01) d[k] = o[k]; }); if (Object.keys(d).length) S.foodEdits[id] = d; else delete S.foodEdits[id]; }
      save(); buildFood(); Object.keys(S.food).forEach(d => { if (S.food[d].some(x => x.id === id)) queueSync(d); });
      renderFood(); renderFoodCard(); toast('Saved. Every day with ' + f.name + ' is updated.'); back();
    };
    const r = $('#nReset'); if (r) r.onclick = () => { delete S.foodEdits[id]; save(); buildFood(); renderFood(); renderFoodCard(); toast('Back to the app’s numbers.'); back(); };
  });
}
// Quick sugar for a meal: tea, coffee, dahi, anything sweetened at home.
function sugarSheet(meal) {
  const mealName = F.MEALS.find(m => m[0] === meal)[1].toLowerCase();
  const TYPES = [['sugar', 'Sugar', 4], ['gur', 'Gur', 5], ['honey', 'Honey', 7]];
  let ty = 0;
  sheet(`<div class="q" style="font-size:26px">Sugar in ${mealName}</div><p class="mute" style="margin-top:-4px">In tea, coffee, dahi, a shake, anything sweetened at home.</p>
    <div class="cats" id="sTy">${TYPES.map((t, i) => `<button data-t="${i}" class="${i ? '' : 'sel'}">${t[1]}</button>`).join('')}</div>
    <div class="tpl" id="sAmt" style="margin-top:14px">${[0.5, 1, 2, 3].map(n => `<button data-n="${n}" style="min-width:64px">${n === 0.5 ? '½' : n} tsp</button>`).join('')}</div>
    <button class="btn dim full" id="shClose" style="margin-top:16px">Cancel</button>`, () => {
    $('#sTy').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; ty = +b.dataset.t; $$('#sTy button').forEach(x => x.classList.toggle('sel', x === b)); };
    $('#sAmt').onclick = e => { const b = e.target.closest('[data-n]'); if (!b) return; const [id, name, g] = TYPES[ty], n = +b.dataset.n; addItems(meal, [[id, n * g]]); closeSheet(); toast(`${b.textContent} ${name.toLowerCase()} added to ${mealName}.`); };
    $('#shClose').onclick = closeSheet;
  });
}
function renderWeight() {
  const ws = S.weights, w = curWeight(), first = ws[0];
  const diff = w - first.kg;
  let spark = '';
  if (ws.length > 1) {
    const last = ws.slice(-20), min = Math.min(...last.map(x => x.kg)), max = Math.max(...last.map(x => x.kg)), r = (max - min) || 1;
    const pts = last.map((x, i) => [(i/(last.length-1))*300, 52 - (x.kg - min)/r*44]);
    spark = `<svg class="spark" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><path d="${pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')}" fill="none" stroke="#7ef0b5" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
  }
  $('#weightCard').innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><div><b class="num" style="font-size:30px">${w} kg</b><span class="mute" style="font-size:13px"> · ${new Date(ws[ws.length-1].d).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</span></div><span class="mute" style="font-size:13px">${ws.length > 1 ? (diff <= 0 ? '−' : '+') + Math.abs(diff).toFixed(1) + ' kg since ' + new Date(first.d).toLocaleDateString('en-IN', {day:'numeric', month:'short'}) : 'Starting point'}</span></div>
    ${spark}<p>Liver fat starts to fall after losing 3–5% of body weight: for you, ${(w*0.03).toFixed(1)}–${(w*0.05).toFixed(1)} kg.</p>
    <div class="row"><input id="wIn" type="number" inputmode="decimal" step="0.05" min="40" max="200" placeholder="Today’s weight, kg" aria-label="Today's weight in kg" style="flex:1;min-height:44px;border-radius:12px;border:1px solid var(--line2);background:#0a100d;color:var(--ink);padding:0 12px;font:16px Inter,sans-serif"><button class="btn mint" id="wLog">Log</button></div>`;
  $('#wLog').onclick = () => {
    const v = parseFloat($('#wIn').value); if (!(v > 40 && v < 200)) { toast('Enter your weight in kg, like 93.2'); return; }
    const k = dkey(new Date()); const ex = S.weights.find(x => x.d === k);
    if (ex) ex.kg = v; else S.weights.push({d:k, kg:v});
    save(); queueSync(k); renderFood(); toast('Weight logged.');
  };
}
function renderTargets() {
  const P = S.prof, T = targets();
  $('#targetsCard').innerHTML = `<div class="frm">
    <label>Age<input id="tAge" type="number" inputmode="numeric" min="15" max="80" value="${P.age || ''}" placeholder="Your age"></label>
    <label>Height, cm<input id="tH" type="number" inputmode="numeric" min="120" max="230" value="${P.h}"></label>
    <label>Activity<select id="tAct"><option value="1.2">Mostly sitting</option><option value="1.375">Gym 3–4 days</option><option value="1.55">Gym 5–6 days</option></select></label>
    <label>Pace<select id="tDef"><option value="250">Gentle (0.25 kg/wk)</option><option value="500">Steady (0.5 kg/wk)</option></select></label></div>
    ${T ? `<div class="tg"><div><span>Maintenance</span><b>${T.tdee.toLocaleString('en-IN')}</b></div><div><span>Your target</span><b>${T.kcal.toLocaleString('en-IN')} kcal</b></div><div><span>Protein</span><b>${T.p} g</b></div><div><span>Carbs</span><b>${T.c} g</b></div><div><span>Fat</span><b>${T.f} g</b></div></div>
    <p style="margin-top:10px">Worked out with the Mifflin-St Jeor equation from ${curWeight()} kg and ${P.h} cm. Protein is 1.6 g per kg. The target never drops below your resting burn (${T.bmr.toLocaleString('en-IN')} kcal), because a deeper cut is what drives the night-time binges.</p>` : '<p style="margin-top:10px">Add your age to see your numbers.</p>'}`;
  $('#tAct').value = String(P.act); $('#tDef').value = String(P.def);
  const upd = () => { const a = parseInt($('#tAge').value, 10), h = parseInt($('#tH').value, 10); P.age = a >= 15 && a <= 80 ? a : null; if (h >= 120 && h <= 230) P.h = h; P.act = parseFloat($('#tAct').value); P.def = parseInt($('#tDef').value, 10); save(); renderFood(); renderFoodCard(); };
  $('#tAge').onchange = upd; $('#tH').onchange = upd; $('#tAct').onchange = upd; $('#tDef').onchange = upd;
}
function renderFoodCard() {
  const t = totals(dkey(new Date())), T = targets();
  $('#foodCard').innerHTML = `<span class="ic" style="background:#3a2a10"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffd166" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/></svg></span>
    <span><b>${Math.round(t.kcal).toLocaleString('en-IN')}${T ? ' / ' + T.kcal.toLocaleString('en-IN') : ''} kcal today</b><span>${Math.round(t.p)}${T ? ' / ' + T.p : ''} g protein · tap to log food</span></span>
    <svg class="go" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8fb3a2" stroke-width="2" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
}
$('#foodCard').onclick = () => switchTab('food');

/* ---------- iOS standalone viewport gap ---------- */
function fixGap() {
  const p = document.createElement('div'); p.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-top);visibility:hidden';
  const q = document.createElement('div'); q.style.cssText = 'position:fixed;bottom:0;left:0;width:1px;height:env(safe-area-inset-bottom);visibility:hidden';
  document.body.append(p, q);
  const sat = p.getBoundingClientRect().height, sab = q.getBoundingClientRect().height; p.remove(); q.remove();
  const gap = Math.round(screen.height - window.innerHeight);
  const g = 0;
  document.documentElement.style.setProperty('--gap', g + 'px');
}
window.addEventListener('resize', fixGap);


/* ---------- profile photo and your own music (both stay on this phone) ---------- */
$('#seeAll').onclick = () => switchTab('stories');
$('#avFile').addEventListener('change', e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => { const c = document.createElement('canvas'), s = Math.min(img.width, img.height); c.width = c.height = 320; c.getContext('2d').drawImage(img, (img.width - s)/2, (img.height - s)/2, s, s, 0, 0, 320, 320); S.avatar = c.toDataURL('image/jpeg', .82); save(); URL.revokeObjectURL(url); toast('Profile photo saved.'); renderAll(); };
  img.onerror = () => toast('Could not read that photo.');
  img.src = url;
});
let music = [];
async function loadMusic() {
  try { const m = await idbGet('music'); music = (m || []).map(t => Object.assign({}, t, {url: URL.createObjectURL(new Blob([t.buf], {type: t.type || 'audio/mpeg'}))})); } catch (e) { music = []; }
  FX.setTracks(music, S.music !== false); renderMusic();
}
async function saveMusic() { try { await idbPut('music', music.map(t => ({id:t.id, name:t.name, type:t.type, buf:t.buf}))); } catch (e) { toast('Could not save songs. Try fewer or shorter files.'); } FX.setTracks(music, S.music !== false); renderMusic(); }
function renderMusic() {
  const el = $('#musicList'); if (!el) return;
  el.innerHTML = music.length ? music.map(t => `<div class="fi"><span class="nm"><b>${esc(t.name)}</b></span><button class="rm" data-mrm="${t.id}" aria-label="Remove ${esc(t.name)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>`).join('') : '<p class="mute" style="margin:0">No songs yet. The built-in beats play until you add some.</p>';
  $('#musUse').checked = S.music !== false;
}
$('#musFile').addEventListener('change', async e => {
  const fs = Array.from(e.target.files || []); if (!fs.length) return;
  toast('Adding ' + fs.length + (fs.length === 1 ? ' song…' : ' songs…'));
  for (const f of fs) { const buf = await f.arrayBuffer(); music.push({id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), name: f.name.replace(/\.[^.]+$/, ''), type: f.type, buf, url: URL.createObjectURL(f)}); }
  await saveMusic(); toast('Songs added.');
});
$('#musicList').addEventListener('click', e => { const b = e.target.closest('[data-mrm]'); if (!b) return; music = music.filter(t => t.id !== b.dataset.mrm); saveMusic(); });
$('#musUse').addEventListener('change', e => { S.music = e.target.checked; save(); FX.setTracks(music, S.music !== false); });
/* ---------- header, ticking ---------- */
function tick() {
  const ms = streakMs(), d = Math.floor(ms / DAY), h = Math.floor(ms % DAY / HR), m = Math.floor(ms % HR / MIN);
  $('#hTime').textContent = d ? d + 'd ' + h + 'h' : h + 'h ' + pad(m) + 'm';
  $('#hSub').textContent = rupees(fundKept()) + ' kept · ' + wavesWon() + (wavesWon() === 1 ? ' wave won' : ' waves won');
  const nx = D.MILES.find(x => ms < x.h*HR);
  $('#hNext').textContent = nx ? nx.tag : 'All unlocked'; $('#hNextIn').textContent = nx ? 'in ' + dur(nx.h*HR - ms) : '';
  $('#tDays').textContent = d ? d + (d === 1 ? ' day' : ' days') : h + 'h ' + pad(m) + 'm'; $('#tWaves').textContent = wavesWon(); const bst = Math.max(S.best || 0, d); $('#tKept').textContent = bst + (bst === 1 ? ' day' : ' days');
  $$('[data-cd]').forEach(el => el.textContent = dur(+el.dataset.cd * HR - ms));
  const cb = $('#cbLeft'); if (cb) { const p = lastSlip(); const left = DAY - (Date.now() - new Date(p.at)); if (left <= 0) renderComeback(); else cb.textContent = dur(left); }
  { const p = lastSlip(); if (needsFeel(p) && !$('#feel')) renderComeback(); }
  const fa = $('#fundAmt'); if (fa) fa.textContent = rupees(fundKept());
  checkMilestones();
}

/* ---------- tabs ---------- */
function switchTab(t) {
  if (t !== 'reels') { stopReel(); FX.stop(); }
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === t));
  $('#eatbar').classList.toggle('hide', t !== 'body');
  $$('.tab[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  if (t === 'reels') { reelOrder = shuffle(D.REELS); renderReels(); }
  if (t === 'stories') renderStoryList();
  if (t === 'you') renderYou();
  if (t === 'food') renderFood();
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) switchTab(b.dataset.tab); });

let hardI = null;
function renderMotto() {
  const n = new Date(), base = Math.floor(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) / DAY) % D.HARD.length;
  if (hardI === null) hardI = base;
  const h = D.HARD[hardI % D.HARD.length];
  $('#mT').textContent = fill(h.t); $('#mS').textContent = fill(h.d); $('#mSrc').textContent = h.s;
}
$('#hard').onclick = () => { hardI = (hardI === null ? 0 : hardI) + 1; renderMotto(); };
function renderAll() { renderMotto(); renderFoodCard(); if ($('#food').classList.contains('on')) renderFood(); renderStoryRow(); renderComeback(); renderFund(); renderEatbar(); renderBodyMap(); renderWeekCard(); tick(); if ($('#you').classList.contains('on')) renderYou(); if ($('#stories').classList.contains('on')) renderStoryList(); }


/* ---------- sync across devices (a secret GitHub gist) ---------- */
// The token and gist id live only in this device's storage, never in the app's code or backups.
const GHK = 'sos.gh', GHB = 'sos.ghbase', GH_FILE = 'sos-sync.json', GH_DESC = 'SOS app sync (private)';
const GH_LOCAL = new Set(['poster', 'avatar', 'sync', 'syncPending', 'syncLast', 'lastBackup', 'gateSkipped', 'sound', 'music']);
let gh = null; try { gh = JSON.parse(localStorage.getItem(GHK) || 'null'); } catch (e) {}
const ghSaveCfg = () => { try { gh ? localStorage.setItem(GHK, JSON.stringify(gh)) : localStorage.removeItem(GHK); } catch (e) {} };
const jsame = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const syncedState = () => { const o = {}; Object.keys(S).forEach(k => { if (!GH_LOCAL.has(k)) o[k] = S[k]; }); return JSON.parse(JSON.stringify(o)); };
async function ghApi(path, opt) {
  const r = await fetch('https://api.github.com' + path, Object.assign({cache: 'no-store'}, opt, {headers: Object.assign({'Authorization': 'Bearer ' + gh.token, 'Accept': 'application/vnd.github+json'}, opt && opt.body ? {'Content-Type': 'application/json'} : {})}));
  if (r.status === 401) throw new Error('auth');
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}
async function ghFind() {
  for (let page = 1; page <= 5; page++) {
    const list = await ghApi('/gists?per_page=100&page=' + page);
    const g = list.find(x => x.files && x.files[GH_FILE] && x.description === GH_DESC);
    if (g) return g.id;
    if (list.length < 100) break;
  }
  return null;
}
async function ghRead() {
  const g = await ghApi('/gists/' + gh.gist), f = g.files && g.files[GH_FILE];
  if (!f) return null;
  let text = f.content;
  if (f.truncated) text = await (await fetch(f.raw_url, {cache: 'no-store'})).text();
  try { return JSON.parse(text); } catch (e) { return null; }
}
const ghBody = s => JSON.stringify({files: {[GH_FILE]: {content: JSON.stringify({v: 1, at: new Date().toISOString(), s})}}});
// Three-way merge: base = what this device last synced. Whichever side changed a value wins;
// if both changed it, lists are combined and other values keep this device's version.
function ghMerge(k, b, l, r) {
  if (jsame(l, r)) return l;
  if (b !== undefined && jsame(l, b)) return r;
  if (b !== undefined && jsame(r, b)) return l;
  if (l === undefined) return r;
  if (r === undefined) return l;
  if (Array.isArray(l) && Array.isArray(r)) {
    const cnt = new Map(), out = [];
    const add = (arr, side) => { const c = new Map(); arr.forEach(x => { const j = JSON.stringify(x); c.set(j, (c.get(j) || 0) + 1); if ((c.get(j)) > (cnt.get(j) || 0)) { cnt.set(j, c.get(j)); out.push(x); } }); };
    add(l, 'l'); add(r, 'r');
    if (k === 'weights') { const by = new Map(); l.concat(r).forEach(w => { if (!by.has(w.d)) by.set(w.d, w); }); return [...by.values()].sort((a, c) => a.d < c.d ? -1 : 1); }
    if (out.every(x => x && x.at)) out.sort((a, c) => new Date(a.at) - new Date(c.at));
    return out;
  }
  if (l && r && typeof l === 'object' && typeof r === 'object') {
    const o = {}; new Set(Object.keys(r).concat(Object.keys(l))).forEach(kk => { const v = ghMerge(kk, b && typeof b === 'object' ? b[kk] : undefined, l[kk], r[kk]); if (v !== undefined) o[kk] = v; }); return o;
  }
  if (k === 'best') return Math.max(l, r);
  if (k === 'start') return new Date(l) > new Date(r) ? l : r;
  if (k === 'installed' || k === 'origin') return new Date(l) < new Date(r) ? l : r;
  return b === undefined ? r : l;
}
const ghFresh = () => !Object.values(S.food || {}).some(a => a.length) && !S.urges.length && !S.slips.length && (S.weights || []).length <= 1;
let ghBusy = false, ghApplying = false, ghT = 0, ghAgain = false;
window.__ghDirty = () => { if (!gh || ghApplying) return; clearTimeout(ghT); ghT = setTimeout(ghSync, 3000); };
async function ghSync() {
  if (!gh || !gh.gist) return;
  if (ghBusy) { ghAgain = true; return; }
  ghBusy = true; ghAgain = false;
  try {
    const remote = await ghRead(), local = syncedState();
    let base; try { base = JSON.parse(localStorage.getItem(GHB) || 'null') || undefined; } catch (e) {}
    let merged;
    if (!remote || !remote.s) merged = local;
    else if (!base && ghFresh()) merged = remote.s;
    else merged = ghMerge('', base, local, remote.s);
    if (!jsame(merged, local)) {
      const before = S.food || {};
      ghApplying = true;
      Object.keys(merged).forEach(k => { S[k] = merged[k]; });
      if (!S.myFoods) S.myFoods = []; if (!S.lastG) S.lastG = {}; if (!S.food) S.food = {};
      buildFood(); save(); ghApplying = false;
      Object.keys(S.food).forEach(d => { if (!jsame(before[d], S.food[d])) queueSync(d); });
      renderAll();
    }
    if (!remote || !jsame(merged, remote.s)) await ghApi('/gists/' + gh.gist, {method: 'PATCH', body: ghBody(merged)});
    try { localStorage.setItem(GHB, JSON.stringify(merged)); } catch (e) {}
    gh.last = new Date().toISOString(); gh.err = ''; ghSaveCfg();
  } catch (e) {
    ghApplying = false;
    if (gh) { gh.err = e.message === 'auth' ? 'GitHub refused the token. Paste a new one.' : navigator.onLine ? 'Couldn’t reach GitHub. Trying again soon.' : 'Offline. It syncs when you’re back online.'; ghSaveCfg(); }
  }
  ghBusy = false; renderGh();
  if (ghAgain) setTimeout(ghSync, 500);
}
function renderGh() {
  const el = $('#ghStatus'); if (!el) return;
  el.textContent = gh && gh.gist ? 'On. Your log, streak and settings sync between your iPhone, iPad and Mac.' + (gh.last ? ' Last synced ' + new Date(gh.last).toLocaleString('en-IN', {day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'}) + '.' : '') + (gh.err ? ' ' + gh.err : '')
    : 'Off. Everything you log stays on this device until you connect.';
  $('#ghRow').classList.toggle('hide', !!(gh && gh.gist && !(gh.err || '').startsWith('GitHub refused')));
  $('#ghOff').classList.toggle('hide', !(gh && gh.gist));
}
$('#ghSave').onclick = async () => {
  const token = $('#ghIn').value.trim();
  if (!/^(ghp_|github_pat_|gho_)\w+/.test(token)) { toast('That doesn’t look like a GitHub token. It starts with ghp_.'); return; }
  const old = gh; gh = {token}; $('#ghSave').disabled = true;
  try {
    let id = await ghFind();
    if (!id) { const g = await ghApi('/gists', {method: 'POST', body: JSON.stringify({description: GH_DESC, public: false, files: {[GH_FILE]: {content: JSON.stringify({v: 1, at: new Date().toISOString(), s: syncedState()})}}})}); id = g.id; try { localStorage.setItem(GHB, JSON.stringify(syncedState())); } catch (e) {} }
    else if (old && old.gist !== id) { try { localStorage.removeItem(GHB); } catch (e) {} }
    gh.gist = id; ghSaveCfg(); $('#ghIn').value = '';
    toast('Connected. Syncing now.'); await ghSync();
  } catch (e) {
    gh = old; ghSaveCfg();
    toast(e.message === 'auth' ? 'GitHub refused that token. Check it has the gist box ticked.' : e.message === 'http 404' ? 'The token needs the gist permission ticked.' : 'Couldn’t reach GitHub. Try again online.');
  }
  $('#ghSave').disabled = false; renderGh();
};
$('#ghOff').onclick = () => { gh = null; ghSaveCfg(); try { localStorage.removeItem(GHB); } catch (e) {} renderGh(); toast('This device stopped syncing. Your data stays here.'); };
window.addEventListener('online', () => ghSync());
setInterval(() => { if (!document.hidden) ghSync(); }, 60000);
renderGh();

/* ---------- start ---------- */
if (!standalone() && !S.gateSkipped) $('#gate').classList.remove('hide');
$('#gateSkip').onclick = () => { S.gateSkipped = true; save(); $('#gate').classList.add('hide'); };
fixGap();
renderAll();
loadVideo();
loadMusic();
setInterval(tick, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { renderAll(); maybeBackup(); flushSync(); ghSync(); } else if ((S.syncPending || []).length) { clearTimeout(syncT); flushSync(); } });
setTimeout(() => { maybeBackup(); flushSync(); }, 2500);
ghSync();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
