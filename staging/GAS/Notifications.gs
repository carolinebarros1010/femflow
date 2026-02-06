/* ======================================================
 * 🔔 NOTIFICATIONS — FEMFLOW
 * ====================================================== */
const NOTIFICATIONS_SHEET = "Notifications";
const NOTIFICATIONS_HEADERS = [
  "Id",
  "Title",
  "Message",
  "Type",
  "Origin",
  "Push",
  "Target",
  "CreatedAt",
  "SendAt",
  "Status",
  "Deeplink"
];

function getNotificationsSheet_() {
  return ensureSheet(NOTIFICATIONS_SHEET, NOTIFICATIONS_HEADERS);
}

function createNotification_(data) {
  const sheet = getNotificationsSheet_();
  const now = new Date();
  const id = Utilities.getUuid();

  const payload = {
    title: data.title || "",
    message: data.message || "",
    type: data.type || "",
    push: data.push === true || String(data.push || "").toLowerCase() === "true",
    target: data.target || "",
    deeplink: data.deeplink || ""
  };

  // Salva como draft e não envia push agora.
  sheet.appendRow([
    id,
    payload.title,
    payload.message,
    payload.type,
    "admin",
    payload.push,
    payload.target,
    now,
    "",
    "draft",
    payload.deeplink
  ]);

  return {
    status: "draft",
    id,
    createdAt: now
  };
}

function listNotifications_() {
  const sheet = getNotificationsSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const header = values[0];
  const idx = {
    id: header.indexOf("Id"),
    title: header.indexOf("Title"),
    message: header.indexOf("Message"),
    type: header.indexOf("Type"),
    origin: header.indexOf("Origin"),
    push: header.indexOf("Push"),
    target: header.indexOf("Target"),
    createdAt: header.indexOf("CreatedAt"),
    sendAt: header.indexOf("SendAt"),
    status: header.indexOf("Status"),
    deeplink: header.indexOf("Deeplink")
  };

  const rows = values
    .slice(1)
    .filter(row => String(row[idx.status] || "").toLowerCase() === "sent");

  rows.sort((a, b) => new Date(b[idx.createdAt]) - new Date(a[idx.createdAt]));

  return rows.slice(0, 50).map(row => ({
    id: row[idx.id],
    title: row[idx.title],
    message: row[idx.message],
    type: row[idx.type],
    origin: row[idx.origin],
    push: row[idx.push],
    target: row[idx.target],
    createdAt: row[idx.createdAt],
    sendAt: row[idx.sendAt],
    status: row[idx.status],
    deeplink: row[idx.deeplink]
  }));
}
