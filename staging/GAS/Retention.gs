const RETENTION_DAYS_DEFAULT = 90;

function enforceDataRetentionPolicy_() {
  purgeDeleteRequests_(RETENTION_DAYS_DEFAULT);
  purgeSheetByDate_("SAC_LOG", 1, RETENTION_DAYS_DEFAULT);
  purgeBodyInsightUsage_(RETENTION_DAYS_DEFAULT);
}

function purgeDeleteRequests_(days) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss && ss.getSheetByName(SHEET_DELETE_REQUESTS);
  if (!sheet) return 0;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  const now = new Date();
  const thresholdMs = Number(days || RETENTION_DAYS_DEFAULT) * 24 * 60 * 60 * 1000;
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  let removed = 0;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i] || [];
    const status = String(row[4] || "").trim().toLowerCase();
    if (status !== "processed") continue;

    const processedAt = toValidDate_(row[5]);
    const createdAt = toValidDate_(row[3]);
    const referenceDate = processedAt || createdAt;
    if (!referenceDate) continue;

    if ((now.getTime() - referenceDate.getTime()) > thresholdMs) {
      sheet.deleteRow(i + 2);
      removed += 1;
    }
  }

  return removed;
}

function purgeBodyInsightUsage_(days) {
  try {
    const ss = abrirPlanilhaBodyInsight_();
    const sheet = ss && ss.getSheetByName("body_insight_usage");
    if (!sheet) return 0;

    const now = new Date();
    const thresholdMs = Number(days || RETENTION_DAYS_DEFAULT) * 24 * 60 * 60 * 1000;
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return 0;

    const values = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    let removed = 0;

    for (let i = values.length - 1; i >= 0; i--) {
      const date = toValidDate_(values[i][0]);
      if (!date) continue;

      if ((now.getTime() - date.getTime()) > thresholdMs) {
        sheet.deleteRow(i + 2);
        removed += 1;
      }
    }

    return removed;
  } catch (err) {
    Logger.log("⚠️ Retention body_insight_usage ignorado: " + err);
    return 0;
  }
}

function purgeSheetByDate_(sheetName, dateColumnIndex, days) {
  const ss = SpreadsheetApp.getActive();
  if (!ss) return 0;

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  const now = new Date();
  const thresholdMs = Number(days || RETENTION_DAYS_DEFAULT) * 24 * 60 * 60 * 1000;
  const values = sheet.getRange(2, dateColumnIndex, lastRow - 1, 1).getValues();

  let removed = 0;
  for (let i = values.length - 1; i >= 0; i--) {
    const date = toValidDate_(values[i][0]);
    if (!date) continue;

    if ((now.getTime() - date.getTime()) > thresholdMs) {
      sheet.deleteRow(i + 2);
      removed += 1;
    }
  }

  return removed;
}

function toValidDate_(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  return date;
}

function setupRetentionTrigger_() {
  const handler = "enforceDataRetentionPolicy_";
  const triggers = ScriptApp.getProjectTriggers();

  for (let i = 0; i < triggers.length; i++) {
    const trigger = triggers[i];
    if (trigger.getHandlerFunction && trigger.getHandlerFunction() === handler) {
      return { status: "ok", created: false, msg: "trigger_exists" };
    }
  }

  ScriptApp.newTrigger(handler)
    .timeBased()
    .everyDays(1)
    .create();

  return { status: "ok", created: true, msg: "trigger_created" };
}
