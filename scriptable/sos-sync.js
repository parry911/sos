// SOS Sync for Scriptable. Name this script exactly: SOS Sync
// The SOS app opens this with your streak start; it saves it for the widget.
const q = args.queryParameters || {};
const fm = FileManager.iCloud();
const path = fm.joinPath(fm.documentsDirectory(), "sos.json");
let data = {};
if (fm.fileExists(path)) {
  try { await fm.downloadFileFromiCloud(path); data = JSON.parse(fm.readString(path)); } catch (e) {}
}
if (q.start) data.start = q.start;
if (q.best) data.best = Number(q.best);
if (q.rate) data.rate = Number(q.rate);
data.synced = new Date().toISOString();
fm.writeString(path, JSON.stringify(data));
const n = new Notification();
n.title = "SOS widget updated";
n.body = "Streak counted from " + new Date(data.start).toLocaleString("en-IN") + ". Head back to SOS.";
await n.schedule();
Script.complete();
