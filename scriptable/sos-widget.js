// SOS Widget for Scriptable. Name this script exactly: SOS Widget
// Home Screen (small or medium) and Lock Screen widget for your junk-free streak.
const fm = FileManager.iCloud();
const path = fm.joinPath(fm.documentsDirectory(), "sos.json");
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
  mint: new Color("#7ef0b5"), track: new Color("#7ef0b5", 0.18), coral: new Color("#ff8a75"),
  ink: new Color("#eef7f1"), mute: new Color("#8fb3a2"), top: new Color("#173a2b"), bottom: new Color("#081009")
};

function ring(size, p, lw, fg, bg, big, small, bigColor, smallColor) {
  const dc = new DrawContext();
  dc.size = new Size(size, size); dc.opaque = false; dc.respectScreenScale = true;
  const r = (size - lw) / 2, c = size / 2;
  dc.setStrokeColor(bg); dc.setLineWidth(lw);
  dc.strokeEllipse(new Rect(lw / 2, lw / 2, size - lw, size - lw));
  const q = Math.max(0.001, p), steps = Math.max(2, Math.ceil(180 * q));
  const pt = i => { const a = -Math.PI / 2 + 2 * Math.PI * q * i / steps; return new Point(c + r * Math.cos(a), c + r * Math.sin(a)); };
  const path = new Path(); path.move(pt(0));
  for (let i = 1; i <= steps; i++) path.addLine(pt(i));
  dc.addPath(path); dc.setStrokeColor(fg); dc.setLineWidth(lw); dc.strokePath();
  dc.setFillColor(fg);
  [pt(0), pt(steps)].forEach(e => dc.fillEllipse(new Rect(e.x - lw / 2, e.y - lw / 2, lw, lw)));
  dc.setTextAlignedCenter();
  dc.setFont(Font.boldRoundedSystemFont(size * 0.34)); dc.setTextColor(bigColor);
  dc.drawTextInRect(big, new Rect(0, size * 0.26, size, size * 0.42));
  dc.setFont(Font.mediumSystemFont(size * 0.11)); dc.setTextColor(smallColor);
  dc.drawTextInRect(small, new Rect(0, size * 0.62, size, size * 0.16));
  return dc.getImage();
}
function text(stack, s, font, color, lines) { const t = stack.addText(s); t.font = font; t.textColor = color; if (lines) t.lineLimit = lines; t.minimumScaleFactor = 0.7; return t; }

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
  text(w, "Day " + days + " · Hun nahi", Font.boldSystemFont(15), Color.white(), 1);
  text(w, clean + " · " + kept + " kept", Font.systemFont(12), Color.white(), 1);
  text(w, next ? next[1] + " in " + fmtLeft(left) : "Every milestone unlocked", Font.systemFont(12), Color.white(), 1);
} else {
  const g = new LinearGradient();
  g.colors = [C.top, C.bottom]; g.locations = [0, 1];
  g.startPoint = new Point(0, 0); g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
  if (fam === "small") {
    w.setPadding(12, 12, 12, 12);
    const top = w.addStack(); top.addSpacer();
    top.addImage(ring(96, pct, 9, C.mint, C.track, String(days), dayWord, C.ink, C.mute)).imageSize = new Size(96, 96);
    top.addSpacer();
    w.addSpacer(6);
    const b = w.addStack(); b.addSpacer(); text(b, kept + " kept", Font.boldSystemFont(13), C.coral, 1); b.addSpacer();
  } else {
    w.setPadding(14, 16, 14, 16);
    const row = w.addStack(); row.layoutHorizontally(); row.centerAlignContent();
    row.addImage(ring(122, pct, 11, C.mint, C.track, String(days), dayWord, C.ink, C.mute)).imageSize = new Size(122, 122);
    row.addSpacer(16);
    const col = row.addStack(); col.layoutVertically();
    text(col, "Junk-free · hun nahi", Font.semiboldSystemFont(13), C.mute, 1);
    col.addSpacer(6);
    text(col, next ? "Next: " + next[1] : "All unlocked", Font.semiboldSystemFont(13), C.mint, 1);
    text(col, next ? next[2] : "One year free", Font.boldSystemFont(17), C.ink, 2);
    text(col, next ? "in " + fmtLeft(left) : "", Font.mediumSystemFont(13), C.mute, 1);
    col.addSpacer();
    text(col, kept + " kept · " + clean, Font.boldSystemFont(13), C.coral, 1);
    row.addSpacer();
  }
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
