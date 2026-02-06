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

  try {
    const sheet = getNotificationsSheet_();
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
  } catch (err) {
    return { status: "error", msg: "sheet_error" };
  }

  return {
    status: "draft",
    id,
    createdAt: now
  };
}

function listNotifications_() {
  let values = [];
  try {
    const sheet = getNotificationsSheet_();
    values = sheet.getDataRange().getValues();
  } catch (err) {
    return { status: "error", msg: "sheet_error" };
  }
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

  const rows = values.slice(1);

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

function publishNotification_(data) {
  const notificationId = String(data.notificationId || "").trim();
  if (!notificationId) {
    return { status: "error", msg: "missing_notification_id" };
  }

  const sheet = getNotificationsSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return { status: "error", msg: "not_found" };
  }

  const header = values[0];
  const idIndex = header.indexOf("Id");
  const statusIndex = header.indexOf("Status");

  if (idIndex === -1 || statusIndex === -1) {
    return { status: "error", msg: "invalid_header" };
  }

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (String(row[idIndex]).trim() !== notificationId) continue;

    const currentStatus = String(row[statusIndex] || "").toLowerCase();
    if (currentStatus !== "draft") {
      return { status: "error", msg: "invalid_status", currentStatus };
    }

    // Atualiza para published sem enviar push.
    sheet.getRange(i + 1, statusIndex + 1).setValue("published");
    return { status: "published", id: notificationId };
  }

  return { status: "error", msg: "not_found" };
}

function sendNotification_(data) {
  const notificationId = String(data.notificationId || "").trim();
  if (!notificationId) {
    return { status: "error", msg: "missing_notification_id" };
  }

  const sheet = getNotificationsSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return { status: "error", msg: "not_found" };
  }

  const header = values[0];
  const idx = {
    id: header.indexOf("Id"),
    title: header.indexOf("Title"),
    message: header.indexOf("Message"),
    type: header.indexOf("Type"),
    push: header.indexOf("Push"),
    target: header.indexOf("Target"),
    sendAt: header.indexOf("SendAt"),
    status: header.indexOf("Status"),
    deeplink: header.indexOf("Deeplink")
  };

  if (Object.keys(idx).some((key) => idx[key] === -1)) {
    return { status: "error", msg: "invalid_header" };
  }

  let rowIndex = -1;
  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][idx.id]).trim() === notificationId) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    return { status: "error", msg: "not_found" };
  }

  const row = values[rowIndex];
  const currentStatus = String(row[idx.status] || "").toLowerCase();
  if (currentStatus === "sent") {
    return { status: "error", msg: "already_sent" };
  }
  if (currentStatus !== "published") {
    return { status: "error", msg: "invalid_status", currentStatus };
  }

  const pushEnabled = row[idx.push] === true || String(row[idx.push] || "").toLowerCase() === "true";
  if (!pushEnabled) {
    return { status: "error", msg: "push_disabled" };
  }

  const env = String(PropertiesService.getScriptProperties().getProperty("ENV") || "").trim().toLowerCase();
  if (!env) {
    return { status: "error", msg: "missing_env" };
  }

  const config = getFcmConfig_(env);
  if (config.status === "error") {
    return config;
  }

  const accessToken = getFcmAccessToken_(config);
  if (accessToken.status === "error") {
    return accessToken;
  }

  const pushTokensSheetName = typeof SHEET_PUSH_TOKENS !== "undefined" ? SHEET_PUSH_TOKENS : "PushTokens";
  const pushTokensHeader = typeof HEADER_PUSH_TOKENS !== "undefined"
    ? HEADER_PUSH_TOKENS
    : ["UserId", "DeviceId", "Platform", "Lang", "PushToken", "UpdatedAt", "LastSentAt"];
  const pushSheet = ensureSheet(pushTokensSheetName, pushTokensHeader);
  const pushValues = pushSheet.getDataRange().getValues();
  if (pushValues.length <= 1) {
    return { status: "error", msg: "no_tokens" };
  }

  const pushHeader = pushValues[0];
  const pushIdx = {
    userId: pushHeader.indexOf("UserId"),
    pushToken: pushHeader.indexOf("PushToken"),
    lastSentAt: pushHeader.indexOf("LastSentAt")
  };
  if (Object.keys(pushIdx).some((key) => pushIdx[key] === -1)) {
    return { status: "error", msg: "invalid_push_header" };
  }

  const targetFilter = String(row[idx.target] || "").trim();
  const targets = [];
  const unique = new Set();

  for (let i = 1; i < pushValues.length; i += 1) {
    const rowToken = String(pushValues[i][pushIdx.pushToken] || "").trim();
    if (!rowToken || unique.has(rowToken)) continue;

    const rowUserId = String(pushValues[i][pushIdx.userId] || "").trim();
    if (targetFilter && rowUserId !== targetFilter) continue;

    unique.add(rowToken);
    targets.push({ token: rowToken, rowIndex: i });
  }

  if (!targets.length) {
    return { status: "error", msg: "no_tokens" };
  }

  const notificationPayload = {
    title: String(row[idx.title] || ""),
    body: String(row[idx.message] || ""),
    type: String(row[idx.type] || ""),
    deeplink: String(row[idx.deeplink] || "")
  };

  const successTokens = [];
  const results = [];

  targets.forEach((target) => {
    const payload = {
      message: {
        token: target.token,
        notification: {
          title: notificationPayload.title,
          body: notificationPayload.body
        },
        data: {
          type: notificationPayload.type,
          deeplink: notificationPayload.deeplink || ""
        }
      }
    };

    try {
      const response = UrlFetchApp.fetch(config.sendUrl, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: "Bearer " + accessToken.token },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      const statusCode = response.getResponseCode();
      const raw = response.getContentText();
      let parsed = null;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        parsed = { raw };
      }

      if (statusCode >= 200 && statusCode < 300) {
        successTokens.push(target.token);
        results.push({ status: "ok", token: target.token });
      } else {
        results.push({ status: "error", token: target.token, code: statusCode, response: parsed });
      }
    } catch (err) {
      results.push({ status: "error", token: target.token, msg: "fetch_failed", error: String(err) });
    }
  });

  if (!successTokens.length) {
    return { status: "error", msg: "no_success", results };
  }

  const now = new Date();
  const successSet = new Set(successTokens);

  for (let i = 1; i < pushValues.length; i += 1) {
    const rowToken = String(pushValues[i][pushIdx.pushToken] || "").trim();
    if (!rowToken || !successSet.has(rowToken)) continue;
    pushSheet.getRange(i + 1, pushIdx.lastSentAt + 1).setValue(now);
  }

  sheet.getRange(rowIndex + 1, idx.status + 1).setValue("sent");
  sheet.getRange(rowIndex + 1, idx.sendAt + 1).setValue(now);

  return {
    status: "sent",
    id: notificationId,
    sent: successTokens.length,
    failed: results.length - successTokens.length,
    results
  };
}

function getFcmConfig_(env) {
  const normalized = String(env || "").toLowerCase();
  if (normalized !== "staging" && normalized !== "app") {
    return { status: "error", msg: "invalid_env", env: normalized };
  }

  const prefix = normalized === "app" ? "APP" : "STAGING";
  const props = PropertiesService.getScriptProperties();
  const config = {
    projectId: props.getProperty(prefix + "_FCM_PROJECT_ID") || "",
    clientEmail: props.getProperty(prefix + "_FCM_CLIENT_EMAIL") || "",
    privateKey: props.getProperty(prefix + "_FCM_PRIVATE_KEY") || "",
    tokenUrl: props.getProperty(prefix + "_FCM_TOKEN_URL") || "",
    sendUrl: props.getProperty(prefix + "_FCM_SEND_URL") || ""
  };

  const missing = [];
  if (!config.projectId) missing.push("FCM_PROJECT_ID");
  if (!config.clientEmail) missing.push("FCM_CLIENT_EMAIL");
  if (!config.privateKey) missing.push("FCM_PRIVATE_KEY");
  if (!config.tokenUrl) missing.push("FCM_TOKEN_URL");
  if (!config.sendUrl) missing.push("FCM_SEND_URL");

  if (missing.length) {
    return {
      status: "error",
      msg: "missing_fcm_config",
      missing: missing.map((key) => prefix + "_" + key)
    };
  }

  return config;
}

function getFcmAccessToken_(config) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const claimSet = {
    iss: config.clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: config.tokenUrl,
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header));
  const encodedClaim = Utilities.base64EncodeWebSafe(JSON.stringify(claimSet));
  const unsignedJwt = encodedHeader + "." + encodedClaim;
  const normalizedKey = String(config.privateKey || "").replace(/\\n/g, "\n");
  const signature = Utilities.computeRsaSha256Signature(unsignedJwt, normalizedKey);
  const signedJwt = unsignedJwt + "." + Utilities.base64EncodeWebSafe(signature);

  const response = UrlFetchApp.fetch(config.tokenUrl, {
    method: "post",
    contentType: "application/x-www-form-urlencoded",
    payload: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + signedJwt,
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const raw = response.getContentText();

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    parsed = { raw };
  }

  if (statusCode >= 200 && statusCode < 300 && parsed && parsed.access_token) {
    return { token: parsed.access_token };
  }

  return { status: "error", msg: "token_request_failed", code: statusCode, response: parsed };
}
