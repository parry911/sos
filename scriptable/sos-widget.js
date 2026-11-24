// SOS Widget for Scriptable. Name this script exactly: SOS Widget
// Home Screen (small or medium) and Lock Screen widget for your junk-free streak.
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const path = fm.joinPath(dir, "sos.json");
let data = { start: "2026-11-24T20:40:26+05:30", rate: 420, best: 0 };
if (fm.fileExists(path)) {
  try { await fm.downloadFileFromiCloud(path); data = Object.assign(data, JSON.parse(fm.readString(path))); } catch (e) {}
}

const DAY = 864e5, HR = 36e5;
const MILES = [
  [0, "Hour 0", "Arteries get a break"], [24, "Day 1", "Salt bloat starts to drain"],
  [72, "Day 3", "Gut bacteria are changing"], [168, "Day 7", "The habit loses its grip"],
  [336, "Day 14", "Eating less without trying"], [720, "Day 30", "Liver fat within reach"],
  [1440, "Day 60", "Your taste resets"], [2160, "Day 90", "Mind and hormones"],
  [4320, "Day 180", "Half a year free"], [8760, "Day 365", "One year free"]
];
// Same daily line as the SOS app.
const MOTTOS = [
  "Man jeetai jag jeet.", "Every clean hour is repair.", "The craving passes. You stay.",
  "Stronger than the craving.", "Feed the body you're building.", "One more clean day.",
  "Real food. Real strength.", "Your future self is watching.", "Small wins, every night.",
  "Discipline is remembering what you want."
];
const now = new Date();
const motto = MOTTOS[Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY) % MOTTOS.length];

const ms = Math.max(0, Date.now() - new Date(data.start).getTime());
const days = Math.floor(ms / DAY);
const hrs = Math.floor((ms % DAY) / HR), mins = Math.floor((ms % HR) / 6e4);
const kept = "₹" + Math.floor(ms / DAY * (data.rate || 420)).toLocaleString("en-IN");
const nextI = MILES.findIndex(m => ms < m[0] * HR);
const next = nextI >= 0 ? MILES[nextI] : null;
const prevH = nextI > 0 ? MILES[nextI - 1][0] : 0;
const pct = next ? Math.min(1, (ms / HR - prevH) / (next[0] - prevH)) : 1;
const left = next ? next[0] * HR - ms : 0;
const fmtLeft = t => { const d = Math.floor(t / DAY), h = Math.floor((t % DAY) / HR), m = Math.floor((t % HR) / 6e4); return d ? d + "d " + h + "h" : h ? h + "h " + m + "m" : m + "m"; };
const clean = days ? days + "d " + hrs + "h clean" : hrs + "h " + mins + "m clean";

const C = {
  cream: new Color("#f7eedd"), soft: new Color("#efe3cc", 0.92), track: new Color("#ffffff", 0.22),
  amber: new Color("#ffcf99"), shade: new Color("#000000", 0.22), shadow: new Color("#000000", 0.6)
};
const serif = (n, s) => { try { return new Font(n, s); } catch (e) { return Font.systemFont(s); } };

async function painting(name) {
  const local = fm.joinPath(dir, "sos-" + name);
  if (fm.fileExists(local)) { try { await fm.downloadFileFromiCloud(local); return fm.readImage(local); } catch (e) {} }
  try { const img = await new Request("https://parry911.github.io/sos/scriptable/" + name).loadImage(); fm.writeImage(local, img); return img; } catch (e) { return null; }
}

function ring(size, p, lw, fg, bg, big, small, bigColor, smallColor, shade) {
  const dc = new DrawContext();
  dc.size = new Size(size, size); dc.opaque = false; dc.respectScreenScale = true;
  const r = (size - lw) / 2, c = size / 2;
  if (shade) { dc.setFillColor(shade); dc.fillEllipse(new Rect(lw, lw, size - 2 * lw, size - 2 * lw)); }
  dc.setStrokeColor(bg); dc.setLineWidth(lw);
  dc.strokeEllipse(new Rect(lw / 2, lw / 2, size - lw, size - lw));
  const q = Math.max(0.001, p), steps = Math.max(2, Math.ceil(180 * q));
  const pt = i => { const a = -Math.PI / 2 + 2 * Math.PI * q * i / steps; return new Point(c + r * Math.cos(a), c + r * Math.sin(a)); };
  const pth = new Path(); pth.move(pt(0));
  for (let i = 1; i <= steps; i++) pth.addLine(pt(i));
  dc.addPath(pth); dc.setStrokeColor(fg); dc.setLineWidth(lw); dc.strokePath();
  dc.setFillColor(fg);
  [pt(0), pt(steps)].forEach(e => dc.fillEllipse(new Rect(e.x - lw / 2, e.y - lw / 2, lw, lw)));
  dc.setTextAlignedCenter();
  dc.setFont(serif("Georgia-Bold", size * 0.34)); dc.setTextColor(bigColor);
  dc.drawTextInRect(big, new Rect(0, size * 0.24, size, size * 0.42));
  dc.setFont(serif("Georgia-Italic", size * 0.12)); dc.setTextColor(smallColor);
  dc.drawTextInRect(small, new Rect(0, size * 0.62, size, size * 0.17));
  return dc.getImage();
}
function text(stack, s, font, color, lines, shadow) {
  const t = stack.addText(s); t.font = font; t.textColor = color; t.minimumScaleFactor = 0.7;
  if (lines) t.lineLimit = lines;
  if (shadow) { t.shadowColor = C.shadow; t.shadowRadius = 3; t.shadowOffset = new Point(0, 1); }
  return t;
}

const fam = config.widgetFamily || "medium";
const w = new ListWidget();
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
const dayWord = days === 1 ? "day" : "days";

if (fam === "accessoryCircular") {
  w.addAccessoryWidgetBackground = true;
  const img = w.addImage(ring(60, pct, 5, Color.white(), new Color("#ffffff", 0.25), String(days), dayWord, Color.white(), Color.white()));
  img.centerAlignImage();
} else if (fam === "accessoryInline") {
  w.addText("Day " + days + " · " + clean + " · " + kept);
} else if (fam === "accessoryRectangular") {
  text(w, "Day " + days + " · " + clean, Font.boldSystemFont(15), Color.white(), 1);
  text(w, kept + " kept" + (next ? " · " + next[1] + " in " + fmtLeft(left) : ""), Font.systemFont(12), Color.white(), 1);
  text(w, motto, Font.italicSystemFont(12), Color.white(), 1);
} else {
  const bg = await painting(fam === "small" ? "bg-small.jpg" : "bg-medium.jpg");
  if (bg) w.backgroundImage = bg; else w.backgroundColor = new Color("#4a4236");
  if (fam === "small") {
    w.setPadding(12, 12, 10, 12);
    const top = w.addStack(); top.addSpacer();
    top.addImage(ring(92, pct, 8, C.cream, C.track, String(days), dayWord, C.cream, C.soft, C.shade)).imageSize = new Size(92, 92);
    top.addSpacer();
    w.addSpacer(4);
    const b = w.addStack(); b.addSpacer(); text(b, kept + " kept", serif("Georgia-Bold", 13), C.amber, 1, true); b.addSpacer();
    const m = w.addStack(); m.addSpacer(); text(m, motto, serif("Georgia-Italic", 10), C.soft, 1, true); m.addSpacer();
  } else {
    w.setPadding(14, 16, 14, 16);
    const row = w.addStack(); row.layoutHorizontally(); row.centerAlignContent();
    row.addImage(ring(120, pct, 10, C.cream, C.track, String(days), dayWord, C.cream, C.soft, C.shade)).imageSize = new Size(120, 120);
    row.addSpacer(16);
    const col = row.addStack(); col.layoutVertically();
    text(col, motto, serif("Georgia-Italic", 13), C.soft, 1, true);
    col.addSpacer(6);
    text(col, next ? "Next: " + next[1] + " · in " + fmtLeft(left) : "Every milestone unlocked", serif("Georgia", 12), C.soft, 1, true);
    text(col, next ? next[2] : "One year free", serif("Georgia-Bold", 18), C.cream, 2, true);
    col.addSpacer();
    text(col, kept + " kept · " + clean, serif("Georgia-Bold", 13), C.amber, 1, true);
    row.addSpacer();
  }
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
