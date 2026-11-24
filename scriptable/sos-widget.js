// SOS Widget for Scriptable. Name this script exactly: SOS Widget
// Shows your junk-free streak on the Lock Screen or Home Screen.
const fm = FileManager.iCloud();
const path = fm.joinPath(fm.documentsDirectory(), "sos.json");
let data = { start: "2026-11-24T20:40:26+05:30", rate: 420, best: 0 };
if (fm.fileExists(path)) {
  try { await fm.downloadFileFromiCloud(path); data = Object.assign(data, JSON.parse(fm.readString(path))); } catch (e) {}
}
const ms = Math.max(0, Date.now() - new Date(data.start).getTime());
const days = Math.floor(ms / 864e5);
const hours = Math.floor((ms % 864e5) / 36e5);
const kept = "₹" + Math.floor(ms / 864e5 * (data.rate || 420)).toLocaleString("en-IN");
const mint = new Color("#7ef0b5"), coral = new Color("#ff6b57"), ink = new Color("#eef7f1"), mute = new Color("#8fb3a2");
const fam = config.widgetFamily || "small";
const w = new ListWidget();
w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

if (fam === "accessoryCircular") {
  w.addAccessoryWidgetBackground = true;
  w.addSpacer();
  const n = w.addText(String(days)); n.font = Font.boldRoundedSystemFont(22); n.centerAlignText();
  const l = w.addText(days === 1 ? "day" : "days"); l.font = Font.systemFont(10); l.centerAlignText();
  w.addSpacer();
} else if (fam === "accessoryInline") {
  w.addText("SOS · Day " + days + " · " + kept + " kept");
} else if (fam === "accessoryRectangular") {
  const t = w.addText("Day " + days + " · Hun nahi"); t.font = Font.boldSystemFont(15);
  const s = w.addText(hours + "h into today · " + kept + " kept"); s.font = Font.systemFont(12);
  const b = w.addText(data.best ? "Best: " + data.best + " days" : "Never twice."); b.font = Font.systemFont(12);
} else {
  w.backgroundColor = new Color("#0a100d");
  w.setPadding(14, 14, 14, 14);
  const lab = w.addText("Junk-free"); lab.font = Font.mediumSystemFont(12); lab.textColor = mute;
  const n = w.addText(String(days)); n.font = Font.boldRoundedSystemFont(fam === "small" ? 52 : 60); n.textColor = mint;
  const d = w.addText(days === 1 ? "day · hun nahi" : "days · hun nahi"); d.font = Font.semiboldSystemFont(13); d.textColor = ink;
  w.addSpacer();
  const k = w.addText(kept + " kept"); k.font = Font.boldSystemFont(14); k.textColor = coral;
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentSmall();
Script.complete();
