// FX: original generative soundtrack (Web Audio), sound effects and animated scenes for stories and reels.
window.FX = (() => {
  /* ---------- music ---------- */
  // Five moods, each a small band: drums, bass, chords and a lead, following a chord progression in a minor key.
  // prog = chord roots in semitones from the key; bars = bars per chord.
  const MOODS = {
    tense:  {bpm:84,  prog:[0, -4, -2, -5], bars:2, parts:['sub','pad','taiko','tick','riser','bell'], cut:900},
    pulse:  {bpm:62,  prog:[0, -4, 0, -5],  bars:2, parts:['sub','pad','heart','bell'], cut:700},
    dark:   {bpm:72,  prog:[0, -4, -5, -2], bars:1, parts:['p808','trap','pad','bell'], cut:800},
    uplift: {bpm:118, prog:[0, -4, 3, -2],  bars:1, parts:['house','bassoff','stab','arp'], cut:1800},
    drive:  {bpm:100, prog:[0, -4, 3, -2],  bars:1, parts:['epic','strings','arp8','bass8'], cut:2400}
  };
  const QUAL = {0:'min', 3:'maj', 5:'min', 7:'min', 8:'maj', 10:'maj', 1:'maj'};
  const KEYS = [57, 55, 52, 50, 53]; // A, G, E, D, F (MIDI)
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  let ac = null, master = null, comp = null, verb = null, delay = null, enabled = true, onBeat = null;
  let song = null, timer = 0, mood = null;
  // The person's own songs, stored on the phone. When present they replace the generated soundtrack.
  let tracks = [], useTracks = true, lastTrack = -1, beatTimer = 0;
  const player = new Audio(); player.loop = true; player.preload = 'auto'; player.playsInline = true;
  function setTracks(list, use) { tracks = list || []; useTracks = use !== false; }
  function unlock() { try { if (!player.src && tracks.length) player.src = tracks[0].url; const p = player.play(); if (p) p.then(() => { if (!mood) player.pause(); }).catch(() => {}); } catch (e) {} }
  function playTrack(md) {
    let i = Math.floor(Math.random() * tracks.length); if (tracks.length > 1 && i === lastTrack) i = (i + 1) % tracks.length; lastTrack = i;
    const t = tracks[i]; player.src = t.url; player.volume = 0;
    const go = () => { try { player.currentTime = (player.duration || 0) * 0.3; } catch (e) {} player.play().catch(() => {}); let v = 0; const fade = setInterval(() => { v = Math.min(0.85, v + 0.08); player.volume = v; if (v >= 0.85) clearInterval(fade); }, 80); };
    if (player.readyState >= 1) go(); else player.addEventListener('loadedmetadata', go, {once:true});
    const bpm = MOODS[md].bpm; clearInterval(beatTimer); let b = 0; beatTimer = setInterval(() => { if (onBeat) onBeat(b++); }, 60000 / bpm);
  }
  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ac = new AC();
      comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      master = ac.createGain(); master.gain.value = 0.5; master.connect(comp); comp.connect(ac.destination);
      // reverb: a generated hall
      verb = ac.createConvolver(); const len = ac.sampleRate * 2.6, ir = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = 0.9; verb.connect(vg); vg.connect(master);
      // echo
      delay = ac.createDelay(1.5); const fb = ac.createGain(), dl = ac.createBiquadFilter(); fb.gain.value = 0.32; dl.type = 'lowpass'; dl.frequency.value = 2600;
      delay.connect(dl); dl.connect(fb); fb.connect(delay); dl.connect(master);
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  let noiseBuf = null;
  function noise() { if (noiseBuf) return noiseBuf; noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2 - 1; return noiseBuf; }
  const env = (g, t, a, peak, dec, end = 0.0001) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + dec); };
  function osc(type, f, t, dur, peak, out, a = 0.005, opts = {}) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (opts.glide) o.frequency.exponentialRampToValueAtTime(opts.glide, t + (opts.gt || dur * 0.6));
    if (opts.det) o.detune.value = opts.det;
    env(g, t, a, peak, dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + a + dur + 0.05); return g;
  }
  function nz(t, dur, peak, out, type, freq, q = 1, sweep) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q; if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    env(g, t, 0.002, peak, dur); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  // song bus: everything for one play goes through here, so stopping fades it all
  function newSong(md) {
    const m = MOODS[md], bus = ac.createGain(), duck = ac.createGain(), send = ac.createGain(), echo = ac.createGain();
    bus.gain.value = 0; bus.gain.linearRampToValueAtTime(1, ac.currentTime + 0.6);
    duck.connect(bus); bus.connect(master); send.gain.value = md === 'uplift' ? 0.18 : 0.35; send.connect(verb); echo.gain.value = 0.28; echo.connect(delay);
    delay.delayTime.value = 60 / m.bpm * 0.75;
    const key = KEYS[Math.floor(Math.random() * KEYS.length)];
    return {md, m, bus, duck, send, echo, key, step: 0, nextT: ac.currentTime + 0.12, spb: 60 / m.bpm};
  }
  const chordOf = (sg, bar) => { const off = sg.m.prog[Math.floor(bar / sg.m.bars) % sg.m.prog.length], r = sg.key + off; const q = QUAL[((off % 12) + 12) % 12] || 'min'; return [r, r + (q === 'maj' ? 4 : 3), r + 7]; };
  const PENTA = [0, 3, 5, 7, 10];
  /* instruments */
  function kick(sg, t, g = 0.9, f0 = 140, f1 = 42) { osc('sine', f0, t, 0.32, g, sg.bus, 0.002, {glide: f1, gt: 0.12}); if (sg.md === 'uplift' || sg.md === 'drive') { sg.duck.gain.cancelScheduledValues(t); sg.duck.gain.setValueAtTime(0.35, t); sg.duck.gain.linearRampToValueAtTime(1, t + 0.22); } }
  const hat = (sg, t, g = 0.08, open) => nz(t, open ? 0.18 : 0.04, g, sg.bus, 'highpass', 7500);
  function clap(sg, t, g = 0.35) { [0, 0.012, 0.026].forEach(d => nz(t + d, 0.09, g, sg.bus, 'bandpass', 1500, 1.2)); nz(t, 0.3, g * 0.6, sg.send, 'bandpass', 1500, 1); }
  function snare(sg, t, g = 0.4) { nz(t, 0.18, g, sg.bus, 'highpass', 1200); osc('triangle', 190, t, 0.1, g * 0.7, sg.bus, 0.002, {glide: 140}); nz(t, 0.4, g * 0.5, sg.send, 'bandpass', 2000, 0.8); }
  function taiko(sg, t, g = 0.8) { osc('sine', 110, t, 0.7, g, sg.bus, 0.003, {glide: 48, gt: 0.35}); nz(t, 0.12, g * 0.4, sg.bus, 'lowpass', 600); osc('sine', 110, t, 1.2, g * 0.3, sg.send, 0.003, {glide: 48, gt: 0.35}); }
  function tom(sg, t, f, g = 0.5) { osc('sine', f, t, 0.35, g, sg.bus, 0.003, {glide: f * 0.6}); }
  function bell(sg, t, f, g = 0.12) { osc('sine', f, t, 1.6, g, sg.send, 0.004); osc('sine', f * 2.76, t, 0.6, g * 0.35, sg.send, 0.004); osc('sine', f, t, 1.2, g * 0.5, sg.echo, 0.004); osc('sine', f, t, 0.5, g * 0.6, sg.bus, 0.004); }
  function pluck(sg, t, f, g = 0.12) { const o = ac.createOscillator(), o2 = ac.createOscillator(), fl = ac.createBiquadFilter(), gg = ac.createGain(); o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2; fl.type = 'lowpass'; fl.Q.value = 6; fl.frequency.setValueAtTime(5200, t); fl.frequency.exponentialRampToValueAtTime(500, t + 0.25); env(gg, t, 0.003, g, 0.3); o.connect(fl); o2.connect(fl); fl.connect(gg); gg.connect(sg.duck); gg.connect(sg.echo); o.start(t); o2.start(t); o.stop(t + 0.4); o2.stop(t + 0.4); }
  function pad(sg, t, notes, dur, bright) {
    const fl = ac.createBiquadFilter(), g = ac.createGain(); fl.type = 'lowpass'; fl.Q.value = 0.8;
    fl.frequency.setValueAtTime(sg.m.cut * 0.6, t); fl.frequency.linearRampToValueAtTime(sg.m.cut * (bright ? 1.8 : 1.1), t + dur * 0.8);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(bright ? 0.07 : 0.06, t + Math.min(0.9, dur * 0.3)); g.gain.setValueAtTime(bright ? 0.07 : 0.06, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.4);
    fl.connect(g); g.connect(sg.duck); g.connect(sg.send);
    notes.forEach(n => [-8, 8].forEach(d => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mf(n); o.detune.value = d; o.connect(fl); o.start(t); o.stop(t + dur + 0.5); }));
  }
  function sub(sg, t, n, dur) { osc('sine', mf(n - 24), t, dur, 0.22, sg.bus, 0.3); }
  function b808(sg, t, n, dur, slide) { const o = ac.createOscillator(), ws = ac.createWaveShaper(), g = ac.createGain(); const cv = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; cv[i] = Math.tanh(x * 2.2); } ws.curve = cv; o.type = 'sine'; o.frequency.setValueAtTime(mf(n - 24) * (slide ? 1.5 : 1), t); o.frequency.exponentialRampToValueAtTime(mf(n - 24), t + (slide ? 0.12 : 0.02)); env(g, t, 0.005, 0.5, dur); o.connect(ws); ws.connect(g); g.connect(sg.bus); o.start(t); o.stop(t + dur + 0.05); }
  function bassNote(sg, t, n, dur, g = 0.2) { const o = ac.createOscillator(), fl = ac.createBiquadFilter(), gg = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = mf(n - 12); fl.type = 'lowpass'; fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(260, t + dur); env(gg, t, 0.004, g, dur); o.connect(fl); fl.connect(gg); gg.connect(sg.duck); o.start(t); o.stop(t + dur + 0.05); }
  function stab(sg, t, notes) { notes.forEach(n => { const o = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'square'; o.frequency.value = mf(n + 12); fl.type = 'lowpass'; fl.frequency.setValueAtTime(3000, t); fl.frequency.exponentialRampToValueAtTime(400, t + 0.18); env(g, t, 0.003, 0.035, 0.2); o.connect(fl); fl.connect(g); g.connect(sg.duck); g.connect(sg.send); o.start(t); o.stop(t + 0.3); }); }
  function riser(sg, t, dur) { nz(t, dur, 0.12, sg.bus, 'bandpass', 300, 2, 6000); }
  /* one 16th-note step */
  function playStep(sg, t) {
    const s = sg.step % 16, bar = Math.floor(sg.step / 16), ch = chordOf(sg, bar), st = sg.spb / 4, p = sg.m.parts;
    const chordStart = s === 0 && bar % sg.m.bars === 0, chordDur = sg.spb * 4 * sg.m.bars;
    const rnd = (seed => () => (seed = seed * 16807 % 2147483647) / 2147483647)(sg.step * 9301 + 49297);
    if (p.includes('sub') && chordStart) sub(sg, t, ch[0], chordDur);
    if (p.includes('pad') && chordStart) pad(sg, t, ch, chordDur, false);
    if (p.includes('strings') && chordStart) pad(sg, t, [ch[0], ch[1] + 12, ch[2]], chordDur, true);
    if (p.includes('taiko')) { if (s === 0) taiko(sg, t, 0.85); if (s === 10) taiko(sg, t, 0.5); if (s === 14 && bar % 2) taiko(sg, t, 0.35); }
    if (p.includes('tick') && s % 2 === 0) nz(t, 0.02, s % 4 ? 0.04 : 0.07, sg.bus, 'bandpass', 3200, 6);
    if (p.includes('riser') && bar % 4 === 3 && s === 0) riser(sg, t, sg.spb * 4);
    if (p.includes('heart') && s % 8 === 0) { kick(sg, t, 0.75, 95, 40); kick(sg, t + 0.17, 0.5, 85, 38); }
    if (p.includes('bell') && (s === 6 || s === 14) && rnd() < 0.55) bell(sg, t, mf(sg.key + 12 + PENTA[Math.floor(rnd() * 5)]), sg.md === 'dark' ? 0.09 : 0.11);
    if (p.includes('p808')) { if (s === 0 || s === 7 || (s === 10 && bar % 2)) b808(sg, t, ch[0], s === 0 ? sg.spb * 1.6 : sg.spb * 0.9, s === 7); }
    if (p.includes('trap')) {
      if (s === 0 || (s === 11 && bar % 2 === 0)) kick(sg, t, 0.7);
      if (s === 8) clap(sg, t, 0.4);
      if (s % 2 === 0) hat(sg, t, s % 4 ? 0.05 : 0.08);
      if (bar % 2 === 1 && s >= 12) { hat(sg, t + st / 3, 0.04); hat(sg, t + 2 * st / 3, 0.045); }
    }
    if (p.includes('house')) { if (s % 4 === 0) kick(sg, t, 0.85); if (s === 4 || s === 12) clap(sg, t, 0.28); if (s % 4 === 2) hat(sg, t, 0.07, true); else hat(sg, t, 0.025); }
    if (p.includes('bassoff') && s % 4 === 2) bassNote(sg, t, ch[0], st * 1.5, 0.22);
    if (p.includes('stab') && (s === 6 || s === 14) && bar % 2 === 0) stab(sg, t, ch);
    if (p.includes('arp')) { const seq = [0, 1, 2, 1, 2, 0, 2, 1]; pluck(sg, t, mf(ch[seq[s % 8]] + 12 + (s >= 8 ? 12 : 0)), 0.07); }
    if (p.includes('arp8') && s % 2 === 0) { const seq = [0, 1, 2, 0, 1, 2, 1, 2]; pluck(sg, t, mf(ch[seq[(s / 2) % 8]] + 12 + (s >= 8 ? 12 : 0)), 0.08); }
    if (p.includes('epic')) { if (s === 0 || s === 8) kick(sg, t, 0.85, 120, 40); if (s === 4 || s === 12) snare(sg, t, 0.35); if (s % 2 === 0) hat(sg, t, 0.035); if (bar % 4 === 3 && s >= 8 && s % 2 === 0) tom(sg, t, 160 - (s - 8) * 12, 0.45); }
    if (p.includes('bass8') && s % 2 === 0) bassNote(sg, t, ch[0], st * 1.6, 0.17);
    if (s % 4 === 0) { const delayMs = Math.max(0, (t - ac.currentTime) * 1000), b = sg.step / 4; setTimeout(() => { if (onBeat && song === sg) onBeat(b); }, delayMs); }
  }
  function schedule() { const sg = song; if (!sg) return; const st = sg.spb / 4; while (sg.nextT < ac.currentTime + 0.2) { playStep(sg, sg.nextT); sg.nextT += st; sg.step++; } }
  function play(md) {
    if (!enabled) return;
    md = md in MOODS ? md : 'tense';
    if (tracks.length && useTracks) { if (mood === md && !player.paused) return; stop(); mood = md; playTrack(md); return; }
    if (!ctx()) return;
    if (mood === md && song) return;
    stop(); mood = md; song = newSong(md);
    timer = setInterval(schedule, 50); schedule();
  }
  function stop() {
    clearInterval(timer); timer = 0; clearInterval(beatTimer); beatTimer = 0;
    if (song && ac) { const sg = song, t = ac.currentTime; [sg.bus, sg.send, sg.echo].forEach(g => { try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.35); } catch (e) {} }); setTimeout(() => { try { sg.bus.disconnect(); sg.send.disconnect(); sg.echo.disconnect(); } catch (e) {} }, 3000); }
    song = null; try { player.pause(); } catch (e) {} mood = null;
  }
  function hush(on) { if (!master) return; const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.linearRampToValueAtTime(on ? 0.18 : 0.5, t + 0.25); }
  // short cinematic effects for scene changes and big numbers
  function sfx(kind) {
    if (!enabled || !ac || ac.state !== 'running') return;
    const t = ac.currentTime + 0.01, out = master;
    if (kind === 'whoosh') { const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise(); f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.32); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.22); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42); s.connect(f); f.connect(g); g.connect(out); g.connect(verb); s.start(t); s.stop(t + 0.5); }
    if (kind === 'hit') { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.5); env(g, t, 0.004, 0.55, 0.7); o.connect(g); g.connect(out); g.connect(verb); o.start(t); o.stop(t + 0.8); const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g2 = ac.createGain(); s.buffer = noise(); f.type = 'lowpass'; f.frequency.value = 1200; env(g2, t, 0.002, 0.2, 0.25); s.connect(f); f.connect(g2); g2.connect(out); s.start(t); s.stop(t + 0.3); }
    if (kind === 'tick') { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = 1800; env(g, t, 0.001, 0.025, 0.03); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.05); }
  }
  function quiet() { if ('speechSynthesis' in window) speechSynthesis.cancel(); hush(false); }
  function setEnabled(v) { enabled = v; if (!v) { stop(); quiet(); } }
  function suspend(v) { if (ac) { v ? ac.suspend() : ac.resume(); } if (mood && tracks.length && useTracks) { v ? player.pause() : player.play().catch(() => {}); } }

  /* ---------- scenes ---------- */
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const words = (s, d0) => String(s).split(' ').map((w, i) => `<span class="w" style="--d:${(d0 + i*0.08).toFixed(2)}s">${esc(w)}</span>`).join(' ');
  const fmtN = (n, dec) => dec ? (Math.round(n * Math.pow(10, dec)) / Math.pow(10, dec)).toLocaleString('en-IN', {minimumFractionDigits: dec, maximumFractionDigits: dec}) : Math.round(n).toLocaleString('en-IN');
  const EMB = {uplift:'126,240,181', drive:'255,209,102', pulse:'255,107,87', dark:'150,120,255', tense:'255,170,110'};
  function countUp(el, from, to, dec, ms, delay, done) {
    const t0 = performance.now() + delay; let raf = 0, landed = false;
    const f = t => { const p = Math.min(1, Math.max(0, (t - t0) / ms)), e = 1 - Math.pow(1 - p, 3); el.textContent = fmtN(from + (to - from) * e, dec); if (p < 1) raf = requestAnimationFrame(f); else if (!landed) { landed = true; done && done(); } };
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf);
  }
  function scene(el, sc, opts = {}) {
    const color = sc.color || '#3a0d0a', md = sc.mood || 'tense';
    const kwSrc = sc.fx === 'count' ? (sc.pre || '') + fmtN(sc.n, sc.dec) + (sc.suf || '') : sc.fx === 'dots' ? sc.n + '%' : String(sc.fx === 'quiz' ? sc.q : sc.big).split(' ').slice(0, 3).join(' ');
    const kw = (sc.mq || kwSrc).toUpperCase();
    const mq = Array(8).fill(esc(kw)).join('<em>·</em>');
    let hero = (sc.fx === 'particles' || sc.fx === 'ecg') ? '' : (sc.artSVG ? `<div class="hart">${sc.artSVG}</div>` : '');
    if (sc.fx === 'dots') hero = `<div class="dotg ${sc.good ? 'good' : ''}">${Array.from({length: 100}, (_, i) => `<i class="${i < sc.n ? 'on' : ''}" style="--d:${(0.4 + (i < sc.n ? i : sc.n) * 0.03).toFixed(2)}s"></i>`).join('')}</div>`;
    let h = `<div class="scene ${opts.reel ? 'reelsc' : ''} m-${md} fx-${sc.fx || 'text'}" style="--c:${color}"><div class="blobs"><i></i><i></i><i></i></div><canvas class="emb"></canvas>
      <div class="mq"><div>${mq}<em>·</em>${mq}</div></div>
      <div class="hero"><div class="halo"></div><div class="rings"><i></i><i></i><i></i></div>${hero}</div>
      <canvas class="sfx"></canvas><div class="flash"></div><div class="sc-in">`;
    if (opts.tag) h += `<span class="sc-tag ${sc.me ? 'me' : ''}">${esc(opts.tag)}</span>`;
    if (sc.fx === 'count') h += `<div class="sc-num">${esc(sc.pre || '')}<b>0</b>${esc(sc.suf || '')}</div><h3 class="sc-big small">${words(sc.big, 0.9)}</h3>`;
    else if (sc.fx === 'dots') h += `<div class="sc-num"><b>0</b>%</div><h3 class="sc-big small">${words(sc.big, 0.9)}</h3>`;
    else if (sc.fx === 'meter') { const mx = Math.max(sc.from, sc.to); h += `<div class="meter ${sc.up ? 'up' : ''}" style="--a:${(sc.from / mx * 100).toFixed(1)}%;--b:${(sc.to / mx * 100).toFixed(1)}%"><div class="mnum"><b>${fmtN(sc.from, sc.dec)}</b><span>${esc(sc.unit || '')}</span></div><div class="mtrack"><i></i><em></em></div></div><h3 class="sc-big small">${words(sc.big, 0.6)}</h3>`; }
    else if (sc.fx === 'versus') { const mx = Math.max(sc.a[1], sc.b[1]) || 1; h += `<div class="vs ${sc.good ? 'good' : ''}">${[sc.a, sc.b].map((r, i) => `<div class="vcol ${i ? 'hot' : ''}" style="--h:${Math.max(6, r[1] / mx * 100).toFixed(1)}%;--dl:${(0.3 + i * 0.5).toFixed(1)}s"><b><span>0</span>${esc(r[2] || '')}</b><div class="vbar"><i></i></div><small>${esc(r[0])}</small></div>`).join('')}</div><h3 class="sc-big small">${words(sc.big, 1.4)}</h3>`; }
    else if (sc.fx === 'timeline') h += `<h3 class="sc-big small">${words(sc.big, 0.15)}</h3><ol class="tl">${sc.steps.map((s, i) => `<li style="--d:${(0.7 + i * 0.45).toFixed(2)}s"><span>${esc(s[0])}</span><b class="${/up|more/.test(s[1]) ? 'up' : 'dn'}">${esc(s[1])}</b></li>`).join('')}</ol>`;
    else if (sc.fx === 'quiz') h += `<h3 class="sc-big">${words(sc.q, 0.1)}</h3><div class="quiz">${sc.options.map((o, i) => `<button data-o="${i}">${esc(o)}</button>`).join('')}</div>`;
    else h += `<h3 class="sc-big">${words(sc.big, 0.15)}</h3>`;
    if (sc.fx === 'bars') { const mx = Math.max(Math.abs(sc.a[1]), Math.abs(sc.b[1])); h += `<div class="sbars">${[sc.a, sc.b].map((r, i) => `<div><span>${esc(r[0])}</span><div class="sb"><i style="--w:${(Math.abs(r[1])/mx*100).toFixed(0)}%;--dl:${1 + i*0.35}s" class="${i ? 'hot' : ''}"></i></div><b>${esc(r[1] + (sc.unit || ''))}</b></div>`).join('')}</div>`; }
    const late = sc.fx === 'timeline' ? 0.7 + sc.steps.length * 0.45 : sc.fx === 'versus' ? 1.9 : 1.3;
    h += `<p class="sc-body ${sc.fx === 'quiz' ? 'hide' : ''}" style="animation-delay:${late.toFixed(2)}s">${esc(sc.body || '')}</p>${sc.src ? `<small class="sc-src ${sc.fx === 'quiz' ? 'hide' : ''}" style="animation-delay:${(late + 0.3).toFixed(2)}s">${esc(sc.src)}</small>` : ''}</div></div>`;
    el.innerHTML = h;
    const root = el.firstElementChild, cv = root.querySelector('.sfx'), stops = [];
    let raf = 0, raf2 = 0, alive = true;
    if (!opts.silent) sfx('whoosh');
    // embers: slow sparks rising behind everything
    { const ec = root.querySelector('.emb'), r0 = root.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      if (r0.width) { ec.width = r0.width * dpr; ec.height = r0.height * dpr; const g = ec.getContext('2d'); g.scale(dpr, dpr);
        const W = r0.width, H = r0.height, col = EMB[md] || EMB.tense;
        const es = Array.from({length: 54}, () => ({x: Math.random()*W, y: Math.random()*H, r: 0.6 + Math.random()*2.2, v: 0.15 + Math.random()*0.6, w: Math.random()*6.28}));
        const step = () => { if (!alive) return; g.clearRect(0, 0, W, H); es.forEach(e => { e.y -= e.v; e.w += 0.02; e.x += Math.sin(e.w) * 0.3; if (e.y < -10) { e.y = H + 10; e.x = Math.random()*W; } const a = 0.25 + 0.5 * Math.min(1, e.y / H); g.beginPath(); g.fillStyle = `rgba(${col},${a.toFixed(2)})`; g.shadowColor = `rgba(${col},0.9)`; g.shadowBlur = 8; g.arc(e.x, e.y, e.r, 0, 7); g.fill(); }); raf2 = requestAnimationFrame(step); };
        raf2 = requestAnimationFrame(step); } }
    // keep big numbers on one line inside the screen
    { const nb = root.querySelector('.sc-num'); if (nb) { const fit = () => { let fs = parseFloat(getComputedStyle(nb).fontSize), i = 0; while (nb.scrollWidth > nb.clientWidth + 1 && i++ < 14) { fs *= 0.92; nb.style.fontSize = fs + 'px'; } }; requestAnimationFrame(() => { fit(); setTimeout(fit, 900); setTimeout(fit, 1800); }); } }
    const land = () => { if (alive && !opts.silent) sfx('hit'); root.classList.add('landed'); };
    if (sc.fx === 'count') stops.push(countUp(root.querySelector('.sc-num b'), sc.from || 0, sc.n, sc.dec, 1400, 250, land));
    if (sc.fx === 'dots') stops.push(countUp(root.querySelector('.sc-num b'), 0, sc.n, 0, 400 + sc.n * 30, 400, land));
    if (sc.fx === 'meter') { requestAnimationFrame(() => root.classList.add('go')); stops.push(countUp(root.querySelector('.mnum b'), sc.from, sc.to, sc.dec, 1800, 500, land)); }
    if (sc.fx === 'versus') { requestAnimationFrame(() => root.classList.add('go')); root.querySelectorAll('.vcol b span').forEach((b, i) => { const r = i ? sc.b : sc.a; stops.push(countUp(b, 0, r[1], Number.isInteger(r[1]) ? 0 : (sc.dec || 1), 1100, 300 + i * 500, i ? land : null)); }); }
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
    if (sc.fx === 'bars') requestAnimationFrame(() => root.classList.add('go'));
    if (sc.fx === 'quiz') {
      root.querySelector('.quiz').addEventListener('click', e => {
        const b = e.target.closest('[data-o]'); if (!b || root.classList.contains('answered')) return;
        e.stopPropagation(); root.classList.add('answered');
        const ok = +b.dataset.o === sc.answer;
        root.querySelectorAll('.quiz button').forEach((x, i) => x.classList.add(i === sc.answer ? 'right' : (x === b ? 'wrong' : 'dim')));
        root.querySelector('.sc-body').classList.remove('hide'); const s2 = root.querySelector('.sc-src'); if (s2) s2.classList.remove('hide');
        sfx(ok ? 'hit' : 'tick');
        if (opts.onQuiz) opts.onQuiz(ok);
      });
    }
    onBeat = () => { if (!alive) return; root.classList.remove('beat'); void root.offsetWidth; root.classList.add('beat'); };
    return { stop() { alive = false; cancelAnimationFrame(raf); cancelAnimationFrame(raf2); stops.forEach(f => f && f()); } };
  }
  return {play, stop, quiet, scene, setEnabled, suspend, ctx, setTracks, unlock, sfx, get enabled() { return enabled; }};
})();
