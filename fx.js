// FX: original soundtrack (Web Audio), voice-over (speech synthesis) and animated scenes for stories and reels.
window.FX = (() => {
  const MOODS = {
    tense:  {bpm:76,  root:55,    chord:[1, 1.189, 1.498], hat:true,  kick:true,  heart:false},
    pulse:  {bpm:62,  root:49,    chord:[1, 1.189, 1.414], hat:false, kick:false, heart:true},
    uplift: {bpm:100, root:73.42, chord:[1, 1.26, 1.498],  hat:true,  kick:true,  heart:false}
  };
  let ac = null, master = null, drone = [], timer = 0, nextT = 0, beatN = 0, mood = null, enabled = true, onBeat = null;
  function ctx() {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); master = ac.createGain(); master.gain.value = 0.32; master.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  let noiseBuf = null;
  function noise() { if (noiseBuf) return noiseBuf; noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.2, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; return noiseBuf; }
  function kick(t, f0 = 120, f1 = 42, g = 0.9) { const o = ac.createOscillator(), v = ac.createGain(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.16); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.001, t + 0.32); o.connect(v); v.connect(master); o.start(t); o.stop(t + 0.35); }
  function hat(t, g = 0.12) { const s = ac.createBufferSource(); s.buffer = noise(); const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const v = ac.createGain(); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(f); f.connect(v); v.connect(master); s.start(t); s.stop(t + 0.06); }
  function startDrone(m) {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.7;
    const dg = ac.createGain(); dg.gain.value = 0; dg.gain.linearRampToValueAtTime(0.16, ac.currentTime + 1.2);
    lp.connect(dg); dg.connect(master);
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.12; lg.gain.value = 220; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const os = m.chord.flatMap(r => [-4, 4].map(det => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = m.root * 2 * r; o.detune.value = det; o.connect(lp); o.start(); return o; }));
    drone = os.concat([lfo]); drone.gain = dg;
  }
  function stopDrone() { if (!drone.length) return; const g = drone.gain, t = ac.currentTime; try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.4); } catch (e) {} const d = drone; setTimeout(() => d.forEach(o => { try { o.stop(); } catch (e) {} }), 500); drone = []; }
  function schedule() {
    const m = MOODS[mood], spb = 60 / m.bpm;
    while (nextT < ac.currentTime + 0.25) {
      const t = nextT, b = beatN;
      if (m.heart) { kick(t, 90, 38, 0.8); kick(t + 0.18, 80, 36, 0.55); }
      else { if (m.kick && (b % 2 === 0 || mood === 'uplift')) kick(t); if (m.hat) { hat(t + spb/2); if (mood === 'uplift') hat(t + spb*0.75, 0.07); } if (mood === 'uplift' && b % 2 === 1) hat(t, 0.22); }
      const delay = Math.max(0, (t - ac.currentTime) * 1000);
      setTimeout(() => { if (onBeat) onBeat(b); }, delay);
      nextT += spb; beatN++;
    }
  }
  function play(md) {
    if (!enabled) return; if (!ctx()) return;
    if (mood === md && timer) return;
    stop(); mood = md in MOODS ? md : 'tense'; startDrone(MOODS[mood]); nextT = ac.currentTime + 0.08; beatN = 0;
    timer = setInterval(schedule, 60); schedule();
  }
  function stop() { clearInterval(timer); timer = 0; if (ac) stopDrone(); mood = null; }
  function hush(on) { if (!master) return; const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.linearRampToValueAtTime(on ? 0.12 : 0.32, t + 0.25); }
  let voice = null;
  function pickVoice() { const vs = speechSynthesis.getVoices(); voice = vs.find(v => /en[-_]IN/i.test(v.lang)) || vs.find(v => /en[-_]GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null; }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function say(text) {
    if (!enabled || !('speechSynthesis' in window) || !text) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); if (voice) u.voice = voice; u.rate = 1.02; u.pitch = 0.95;
    u.onstart = () => hush(true); u.onend = () => hush(false); u.onerror = () => hush(false);
    speechSynthesis.speak(u);
  }
  function quiet() { if ('speechSynthesis' in window) speechSynthesis.cancel(); hush(false); }
  function setEnabled(v) { enabled = v; if (!v) { stop(); quiet(); } }
  function suspend(v) { if (!ac) return; v ? ac.suspend() : ac.resume(); if ('speechSynthesis' in window) v ? speechSynthesis.pause() : speechSynthesis.resume(); }

  /* ---------- scenes ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const words = (s, d0) => String(s).split(' ').map((w, i) => `<span class="w" style="--d:${(d0 + i*0.09).toFixed(2)}s">${esc(w)}</span>`).join(' ');
  const fmtN = n => Math.round(n).toLocaleString('en-IN');
  function speakText(sc) {
    if (sc.fx === 'quiz') return sc.q;
    if (sc.fx === 'count') return (sc.pre === '₹' ? 'rupees ' : '') + fmtN(sc.n) + (sc.suf || '').replace('%', ' percent').replace(' kg', ' kilos').replace(' g', ' grams') + ' ' + sc.big + '. ' + (sc.body || '');
    return sc.big + '. ' + (sc.body || '');
  }
  function scene(el, sc, opts = {}) {
    const color = sc.color || '#3a0d0a';
    let h = `<div class="scene ${opts.reel ? 'reelsc' : ''}" style="--c:${color}"><div class="blobs"><i></i><i></i><i></i></div><canvas class="sfx"></canvas><div class="sc-in">`;
    if (opts.tag) h += `<span class="sc-tag ${sc.me ? 'me' : ''}">${esc(opts.tag)}</span>`;
    if (sc.fx === 'count') h += `<div class="sc-num">${esc(sc.pre || '')}<b>0</b>${esc(sc.suf || '')}</div><h3 class="sc-big small">${words(sc.big, 0.9)}</h3>`;
    else if (sc.fx === 'quiz') h += `<h3 class="sc-big">${words(sc.q, 0.1)}</h3><div class="quiz">${sc.options.map((o, i) => `<button data-o="${i}">${esc(o)}</button>`).join('')}</div>`;
    else h += `<h3 class="sc-big">${words(sc.big, 0.15)}</h3>`;
    if (sc.fx === 'bars') { const mx = Math.max(Math.abs(sc.a[1]), Math.abs(sc.b[1])); h += `<div class="sbars">${[sc.a, sc.b].map((r, i) => `<div><span>${esc(r[0])}</span><div class="sb"><i style="--w:${(Math.abs(r[1])/mx*100).toFixed(0)}%;--dl:${1 + i*0.35}s" class="${i ? 'hot' : ''}"></i></div><b>${esc(r[1] + (sc.unit || ''))}</b></div>`).join('')}</div>`; }
    h += `<p class="sc-body ${sc.fx === 'quiz' ? 'hide' : ''}">${esc(sc.body || '')}</p>${sc.src ? `<small class="sc-src ${sc.fx === 'quiz' ? 'hide' : ''}">${esc(sc.src)}</small>` : ''}</div></div>`;
    el.innerHTML = h;
    const root = el.firstChild, cv = root.querySelector('.sfx');
    let raf = 0, alive = true;
    // count-up
    if (sc.fx === 'count') { const b = root.querySelector('.sc-num b'), from = sc.from || 0, t0 = performance.now() + 250; const f = t => { if (!alive) return; const p = Math.min(1, Math.max(0, (t - t0) / 1400)), e = 1 - Math.pow(1 - p, 3); b.textContent = fmtN(from + (sc.n - from) * e); if (p < 1) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); }
    // canvas effects
    if (sc.fx === 'particles' || sc.fx === 'ecg') {
      const r = root.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = r.width * dpr; cv.height = r.height * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
      const W = r.width, H = r.height, t0 = performance.now();
      if (sc.fx === 'particles') {
        let s = 9; const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
        const ps = Array.from({length: 90}, () => ({x: rnd()*W, y: rnd()*H*0.55 + H*0.04, r: 3 + rnd()*5, die: rnd() < (sc.kill || 0.37), vx: (rnd()-.5)*0.3, vy: (rnd()-.5)*0.3}));
        const f = t => { if (!alive) return; const el2 = (t - t0) / 1000; g.clearRect(0, 0, W, H); ps.forEach(p => { p.x += p.vx; p.y += p.vy; const fade = p.die ? Math.max(0, 1 - Math.max(0, el2 - 1.2) / 1.5) : 1; g.globalAlpha = 0.85 * fade; g.fillStyle = p.die && el2 > 1.2 ? '#8a8a8a' : '#7ef0b5'; g.beginPath(); g.arc(p.x, p.y, p.r * (p.die ? Math.max(.3, fade) : 1), 0, 7); g.fill(); }); g.globalAlpha = 1; raf = requestAnimationFrame(f); };
        raf = requestAnimationFrame(f);
      } else {
        const pts = []; const f = t => { if (!alive) return; const x = ((t - t0) / 12) % (W + 40); const ph = ((t - t0) / 1000 * 1.1) % 1; let y = 0; if (ph > .1 && ph < .14) y = -8; else if (ph > .16 && ph < .19) y = 46; else if (ph > .19 && ph < .23) y = -70; else if (ph > .23 && ph < .27) y = 22; pts.push([x, H*0.26 + y]); if (pts.length > 260) pts.shift(); g.clearRect(0, 0, W, H); g.strokeStyle = '#ff6b57'; g.lineWidth = 3; g.lineJoin = 'round'; g.shadowColor = '#ff6b57'; g.shadowBlur = 10; g.beginPath(); pts.forEach((p, i) => { if (i && p[0] < pts[i-1][0]) g.moveTo(p[0], p[1]); else i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.stroke(); g.shadowBlur = 0; raf = requestAnimationFrame(f); };
        raf = requestAnimationFrame(f);
      }
    }
    // bars
    if (sc.fx === 'bars') requestAnimationFrame(() => root.classList.add('go'));
    // quiz
    if (sc.fx === 'quiz') {
      root.querySelector('.quiz').addEventListener('click', e => {
        const b = e.target.closest('[data-o]'); if (!b || root.classList.contains('answered')) return;
        e.stopPropagation(); root.classList.add('answered');
        const ok = +b.dataset.o === sc.answer;
        root.querySelectorAll('.quiz button').forEach((x, i) => x.classList.add(i === sc.answer ? 'right' : (x === b ? 'wrong' : 'dim')));
        root.querySelector('.sc-body').classList.remove('hide'); const s2 = root.querySelector('.sc-src'); if (s2) s2.classList.remove('hide');
        if (opts.voice !== false) say((ok ? 'Right. ' : 'No. ') + (sc.body || ''));
        if (opts.onQuiz) opts.onQuiz(ok);
      });
    }
    onBeat = () => { if (!alive) return; root.classList.remove('beat'); void root.offsetWidth; root.classList.add('beat'); };
    if (opts.voice !== false) setTimeout(() => { if (alive) say(speakText(sc)); }, 350);
    return { stop() { alive = false; cancelAnimationFrame(raf); } };
  }
  return {play, stop, say, quiet, scene, setEnabled, suspend, ctx, get enabled() { return enabled; }};
})();
