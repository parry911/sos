// Builds widget.json (content the Scriptable widget reads) and scriptable/index.html (the copy page).
// Run: node tools/build-widget.js
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
global.window = {}; require(path.join(root, 'data.js')); const D = window.SOS_DATA;
const short = s => { const m = s.match(/^(.+?et al\.), .+?, (\d{4}.*)$/); return m ? m[1] + ', ' + m[2] : s; };
const json = {v: Date.now(), hard: D.HARD.map(h => [h.t.replace('{bmi}', '').trim(), short(h.s)]), miles: D.MILES.map(m => [m.h, m.tag])};
fs.writeFileSync(path.join(root, 'widget.json'), JSON.stringify(json));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const a = fs.readFileSync(path.join(root, 'scriptable/sos-widget.js'), 'utf8'), b = fs.readFileSync(path.join(root, 'scriptable/sos-sync.js'), 'utf8');
const page = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SOS Scriptable scripts</title>
<style>body{margin:0;background:#0a100d;color:#eef7f1;font:16px/1.5 -apple-system,Inter,sans-serif;padding:24px 16px}
.w{max-width:640px;margin:0 auto}h1{font-size:26px;margin:0 0 6px}p{color:#8fb3a2}
.box{background:#0f1f19;border:1px solid #2b4d3f;border-radius:16px;padding:14px;margin-top:16px}
pre{overflow:auto;max-height:220px;font-size:12px;background:#000;padding:10px;border-radius:10px;white-space:pre}
button{min-height:48px;padding:0 18px;border:0;border-radius:12px;background:#7ef0b5;color:#062015;font-weight:700;font-size:16px}</style></head>
<body><div class="w"><h1>Scriptable scripts for SOS</h1>
<p>Tap Copy, open Scriptable, open the script with the same name (or tap + for a new one), select all, paste over it, and keep the exact name shown. From this version on, new hard truths reach the widget by themselves.</p>
<div class="box"><b>1. SOS Widget</b><p>Name it exactly: SOS Widget</p><button data-c="a">Copy SOS Widget</button><pre id="a">${esc(a)}</pre></div>
<div class="box"><b>2. SOS Sync</b><p>Name it exactly: SOS Sync</p><button data-c="b">Copy SOS Sync</button><pre id="b">${esc(b)}</pre></div>
</div><script>document.querySelectorAll('[data-c]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(document.getElementById(b.dataset.c).textContent);b.textContent='Copied';setTimeout(()=>b.textContent=b.dataset.c==='a'?'Copy SOS Widget':'Copy SOS Sync',1800)}catch(e){b.textContent='Copy failed: select the text and copy'}});</script></body></html>
`;
fs.writeFileSync(path.join(root, 'scriptable/index.html'), page);
console.log('widget.json:', json.hard.length, 'hard truths;', 'copy page rebuilt');
