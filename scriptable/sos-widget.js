// SOS Widget for Scriptable. Name this script exactly: SOS Widget
// Home Screen (small or medium) and Lock Screen widget: your streak plus one hard truth a day.
const fm = FileManager.iCloud();
const dir = fm.documentsDirectory();
const path = fm.joinPath(dir, "sos.json");
let data = { start: "2026-11-24T20:40:26+05:30", rate: 420, best: 0 };
if (fm.fileExists(path)) {
  try { await fm.downloadFileFromiCloud(path); data = Object.assign(data, JSON.parse(fm.readString(path))); } catch (e) {}
}

const DAY = 864e5, HR = 36e5;
const MILES = [[0, "Hour 0"], [24, "Day 1"], [72, "Day 3"], [168, "Day 7"], [336, "Day 14"], [720, "Day 30"], [1440, "Day 60"], [2160, "Day 90"], [4320, "Day 180"], [8760, "Day 365"]];
// Same order as the SOS app's "Today's hard truth".
const HARD = [
  ["26 orders in 24 days. ₹10,000 gone.", "Your order history"],
  ["Payment failed. You ordered again in 2 minutes.", "Your order history"],
  ["₹1.5 lakh a year at November's pace.", "Your order history"],
  ["One fast-food meal stiffens your arteries for 4 hours.", "Vogel et al., 1997"],
  ["Sugar hit: testosterone down 25% in 2 hours.", "Caronia et al., 2013"],
  ["4 days of junk breakfasts. Memory got worse.", "Attuquayefio et al., 2017"],
  ["1 in 3 Indian adults has fatty liver.", "Shalimar et al., 2022"],
  ["South Asians get heart disease up to 10 years earlier.", "American Heart Association, 2018"],
  ["Junk-heavy diets: about 50% more heart deaths.", "Lane et al., BMJ, 2024"],
  ["Erection problems often come years before a heart attack.", "Montorsi et al."],
  ["On junk, people ate 500 kcal more a day without noticing.", "Hall et al., 2019"],
  ["10 days of McDonald's: about 1,300 gut species gone.", "Spector, 2015"],
  ["You eat about 8 g of salt a day. The limit is 5.", "ICMR-NCDIS, 2023"],
  ["Belly fat turns your testosterone into estrogen.", "Endocrinology of obesity"],
  ["Most ultra-processed food: 21% higher risk of early death.", "Lane et al., BMJ, 2024"]
];
const now = new Date();
const hard = HARD[Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY) % HARD.length];

const ms = Math.max(0, Date.now() - new Date(data.start).getTime());
const days = Math.floor(ms / DAY);
const hrs = Math.floor((ms % DAY) / HR), mins = Math.floor((ms % HR) / 6e4);
const kept = "₹" + Math.floor(ms / DAY * (data.rate || 420)).toLocaleString("en-IN");
const nextI = MILES.findIndex(m => ms < m[0] * HR);
const next = nextI >= 0 ? MILES[nextI] : null;
const prevH = nextI > 0 ? MILES[nextI - 1][0] : 0;
const pNext = next ? Math.min(1, (ms / HR - prevH) / (next[0] - prevH)) : 1;
const pGoal = Math.min(1, ms / (30 * DAY));
const left = next ? next[0] * HR - ms : 0;
const fmtLeft = t => { const d = Math.floor(t / DAY), h = Math.floor((t % DAY) / HR), m = Math.floor((t % HR) / 6e4); return d ? d + "d " + h + "h" : h ? h + "h " + m + "m" : m + "m"; };
const clean = days ? days + "d " + hrs + "h" : hrs + "h " + String(mins).padStart(2, "0") + "m";

const C = {
  mint: new Color("#7ef0b5"), mintT: new Color("#7ef0b5", 0.18), coral: new Color("#ff6b57"), coralT: new Color("#ff6b57", 0.2),
  white: new Color("#ffffff"), grey: new Color("#9aa5a0"), top: new Color("#16211d"), bottom: new Color("#0b0f0e")
};

function arc(dc, c, r, p, lw, col) {
  const q = Math.max(0.002, p), steps = Math.max(2, Math.ceil(200 * q));
  const pt = i => { const a = -Math.PI / 2 + 2 * Math.PI * q * i / steps; return new Point(c + r * Math.cos(a), c + r * Math.sin(a)); };
  const path = new Path(); path.move(pt(0)); for (let i = 1; i <= steps; i++) path.addLine(pt(i));
  dc.addPath(path); dc.setStrokeColor(col); dc.setLineWidth(lw); dc.strokePath();
  dc.setFillColor(col); [pt(0), pt(steps)].forEach(e => dc.fillEllipse(new Rect(e.x - lw / 2, e.y - lw / 2, lw, lw)));
}
function rings(size, mono) {
  const dc = new DrawContext(); dc.size = new Size(size, size); dc.opaque = false; dc.respectScreenScale = true;
  const c = size / 2, lw = size * 0.1, r1 = c - lw / 2, r2 = r1 - lw * 1.35;
  const outer = mono ? Color.white() : C.coral, outerT = mono ? new Color("#ffffff", 0.25) : C.coralT;
  const inner = mono ? Color.white() : C.mint, innerT = mono ? new Color("#ffffff", 0.25) : C.mintT;
  dc.setLineWidth(lw);
  dc.setStrokeColor(outerT); dc.strokeEllipse(new Rect(c - r1, c - r1, 2 * r1, 2 * r1));
  dc.setStrokeColor(innerT); dc.strokeEllipse(new Rect(c - r2, c - r2, 2 * r2, 2 * r2));
  arc(dc, c, r1, pNext, lw, outer); arc(dc, c, r2, pGoal, lw, inner);
  dc.setTextAlignedCenter(); dc.setTextColor(mono ? Color.white() : C.white);
  dc.setFont(Font.boldRoundedSystemFont(size * 0.26)); dc.drawTextInRect(String(days), new Rect(0, c - size * 0.2, size, size * 0.3));
  dc.setFont(Font.semiboldSystemFont(size * 0.085)); dc.setTextColor(mono ? Color.white() : C.grey);
  dc.drawTextInRect(days === 1 ? "DAY" : "DAYS", new Rect(0, c + size * 0.08, size, size * 0.12));
  return dc.getImage();
}
function text(stack, s, font, color, lines) { const t = stack.addText(s); t.font = font; t.textColor = color; t.minimumScaleFactor = 0.75; if (lines) t.lineLimit = lines; return t; }

const fam = config.widgetFamily || "medium";
const w = new ListWidget();
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

if (fam === "accessoryCircular") {
  w.addAccessoryWidgetBackground = true;
  w.addImage(rings(64, true)).centerAlignImage();
} else if (fam === "accessoryInline") {
  w.addText("Day " + days + " · " + clean + " clean · " + kept);
} else if (fam === "accessoryRectangular") {
  text(w, "Day " + days + " · " + clean + " clean", Font.boldSystemFont(14), Color.white(), 1);
  text(w, hard[0], Font.semiboldSystemFont(12), Color.white(), 2);
} else {
  const g = new LinearGradient(); g.colors = [C.top, C.bottom]; g.locations = [0, 1];
  g.startPoint = new Point(0, 0); g.endPoint = new Point(1, 1); w.backgroundGradient = g;
  if (fam === "small") {
    w.setPadding(12, 12, 12, 12);
    const top = w.addStack(); top.addSpacer(); top.addImage(rings(84)).imageSize = new Size(84, 84); top.addSpacer();
    w.addSpacer(6);
    text(w, clean + " clean", Font.boldRoundedSystemFont(15), C.white, 1).centerAlignText();
    text(w, kept + " kept", Font.semiboldSystemFont(12), C.mint, 1).centerAlignText();
  } else {
    w.setPadding(14, 14, 14, 16);
    const row = w.addStack(); row.layoutHorizontally(); row.centerAlignContent();
    row.addImage(rings(118)).imageSize = new Size(118, 118);
    row.addSpacer(14);
    const col = row.addStack(); col.layoutVertically();
    const top = col.addStack(); top.layoutHorizontally(); top.centerAlignContent();
    text(top, "JUNK-FREE", Font.boldSystemFont(11), C.coral, 1); top.addSpacer(6);
    text(top, clean + " · " + kept + " kept", Font.semiboldSystemFont(11), C.grey, 1);
    col.addSpacer(6);
    text(col, hard[0], Font.boldSystemFont(16), C.white, 3);
    col.addSpacer(4);
    text(col, hard[1], Font.mediumSystemFont(10), C.grey, 1);
    col.addSpacer();
    text(col, next ? next[1].toUpperCase() + " IN " + fmtLeft(left).toUpperCase() : "EVERY MILESTONE UNLOCKED", Font.boldSystemFont(11), C.mint, 1);
    row.addSpacer();
  }
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
