/* ======================================================
 * 🔔 FEMFLOW — PUSH NOTIFICATIONS (FCM)
 * ====================================================== */

const SHEET_PUSH_TOKENS = "PushTokens";
const HEADER_PUSH_TOKENS = [
  "UserId",
  "DeviceId",
  "Platform",
  "Lang",
  "PushToken",
  "UpdatedAt",
  "LastSentAt"
];

function registerPushToken_(data) {
  const userId = String(data.userId || "").trim();
  const deviceId = String(data.deviceId || "").trim();
  const platform = String(data.platform || "web").trim();
  const lang = String(data.lang || "pt").trim().toLowerCase();
  const pushToken = String(data.pushToken || "").trim();

  if (!userId || !deviceId || !pushToken) {
    return { status: "error", msg: "missing_fields" };
  }

  const sheet = ensureSheet(SHEET_PUSH_TOKENS, HEADER_PUSH_TOKENS);
  const values = sheet.getDataRange().getValues();

  let rowIndex = -1;
  for (let i = 1; i < values.length; i += 1) {
    const existingToken = String(values[i][4] || "").trim();
    if (existingToken && existingToken === pushToken) {
      rowIndex = i + 1;
      break;
    }
  }

  const payload = [
    userId,
    deviceId,
    platform,
    lang,
    pushToken,
    new Date(),
    rowIndex > 0 ? values[rowIndex - 1][6] : ""
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, payload.length).setValues([payload]);
  } else {
    sheet.appendRow(payload);
  }

  return { status: "ok" };
}

function sendPush_(data) {
  const guard = String(data.token || "").trim();
  if (guard !== SECURITY_TOKEN) {
    return { status: "denied", msg: "invalid_token" };
  }

  const serverKey = getFcmServerKey_();
  if (!serverKey) {
    return { status: "error", msg: "missing_fcm_key" };
  }

  const tokens = resolvePushTokens_(data);
  if (!tokens.length) {
    return { status: "error", msg: "no_tokens" };
  }

  const allowedTokens = filterTokensByDailyLimit_(tokens);
  if (!allowedTokens.length) {
    return { status: "skipped_daily_limit" };
  }

  const event = String(data.event || "").trim().toLowerCase();
  const action = String(data.action || "").trim();
  const url = String(data.url || "").trim();
  const lang = String(data.lang || "pt").trim().toLowerCase();

  const copy = resolvePushCopy_(event, lang);
  const title = String(data.title || copy.title || "").trim();
  const body = String(data.body || copy.body || "").trim();

  if (!title || !body) {
    return { status: "error", msg: "missing_title_body" };
  }

  const resolvedAction = action || copy.action || "open_home";
  const payload = buildFcmPayload_(title, body, resolvedAction, url);

  const results = [];
  const maxTokens = 500;
  const chunks = chunkArray_(allowedTokens, maxTokens);

  chunks.forEach((chunk) => {
    const response = sendFcmRequest_(serverKey, {
      ...payload,
      registration_ids: chunk
    });
    results.push(response);
  });

  markPushSent_(allowedTokens, data);

  return { status: "ok", results };
}

function resolvePushTokens_(data) {
  const explicitToken = String(data.pushToken || "").trim();
  if (explicitToken) return [explicitToken];

  const userId = String(data.userId || "").trim();
  const deviceId = String(data.deviceId || "").trim();
  if (!userId && !deviceId) return [];

  const sheet = ensureSheet(SHEET_PUSH_TOKENS, HEADER_PUSH_TOKENS);
  const values = sheet.getDataRange().getValues();
  const tokens = [];

  for (let i = 1; i < values.length; i += 1) {
    const rowUserId = String(values[i][0] || "").trim();
    const rowDeviceId = String(values[i][1] || "").trim();
    const rowToken = String(values[i][4] || "").trim();

    if (!rowToken) continue;
    if (userId && rowUserId !== userId) continue;
    if (deviceId && rowDeviceId !== deviceId) continue;

    tokens.push(rowToken);
  }

  return Array.from(new Set(tokens));
}

function markPushSent_(tokens, data) {
  const sheet = ensureSheet(SHEET_PUSH_TOKENS, HEADER_PUSH_TOKENS);
  const values = sheet.getDataRange().getValues();
  const now = new Date();
  const tokenSet = new Set(tokens);

  for (let i = 1; i < values.length; i += 1) {
    const rowToken = String(values[i][4] || "").trim();
    if (!rowToken || !tokenSet.has(rowToken)) continue;
    sheet.getRange(i + 1, 7).setValue(now);
  }
}

function filterTokensByDailyLimit_(tokens) {
  const sheet = ensureSheet(SHEET_PUSH_TOKENS, HEADER_PUSH_TOKENS);
  const values = sheet.getDataRange().getValues();
  const tokenSet = new Set(tokens);
  const allowed = [];
  const today = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd");

  for (let i = 1; i < values.length; i += 1) {
    const rowToken = String(values[i][4] || "").trim();
    if (!rowToken || !tokenSet.has(rowToken)) continue;

    const lastSent = values[i][6];
    if (lastSent instanceof Date && !isNaN(lastSent.getTime())) {
      const lastDay = Utilities.formatDate(lastSent, "GMT", "yyyy-MM-dd");
      if (lastDay === today) continue;
    }

    allowed.push(rowToken);
  }

  return allowed;
}

function resolvePushCopy_(event, lang) {
  const copyMap = {
    treino_disponivel: {
      pt: {
        title: "💪 Seu treino de hoje já está disponível",
        body: "Abra o FemFlow para acompanhar seu treino.",
        action: "open_treino"
      },
      en: {
        title: "💪 Your workout is ready",
        body: "Open FemFlow to see today’s training.",
        action: "open_treino"
      },
      es: {
        title: "💪 Tu entrenamiento ya está disponible",
        body: "Abre FemFlow para ver tu entrenamiento de hoy.",
        action: "open_treino"
      }
    },
    mudanca_fase: {
      pt: {
        title: "🌙 Hoje seu corpo pede mais suavidade",
        body: "Veja seu FlowCenter para ajustar o treino.",
        action: "open_flowcenter"
      },
      en: {
        title: "🌙 Your body may want more softness today",
        body: "Check FlowCenter to adjust your training.",
        action: "open_flowcenter"
      },
      es: {
        title: "🌙 Hoy tu cuerpo pide más suavidad",
        body: "Mira el FlowCenter para ajustar tu entrenamiento.",
        action: "open_flowcenter"
      }
    },
    atualizacao_app: {
      pt: {
        title: "✨ Atualizamos o FemFlow com melhorias",
        body: "Abra o app para ver as novidades.",
        action: "open_home"
      },
      en: {
        title: "✨ FemFlow has new improvements",
        body: "Open the app to see what’s new.",
        action: "open_home"
      },
      es: {
        title: "✨ FemFlow tiene mejoras nuevas",
        body: "Abre la app para ver las novedades.",
        action: "open_home"
      }
    }
  };

  const group = copyMap[event];
  if (!group) return {};
  return group[lang] || group.pt || {};
}

function buildFcmPayload_(title, body, action, url) {
  return {
    notification: { title, body },
    data: {
      action: action || "open_home",
      url: url || ""
    }
  };
}

function sendFcmRequest_(serverKey, payload) {
  const response = UrlFetchApp.fetch("https://fcm.googleapis.com/fcm/send", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "key=" + serverKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  try {
    return JSON.parse(response.getContentText());
  } catch (err) {
    return { status: "error", msg: "invalid_fcm_response", raw: response.getContentText() };
  }
}

function getFcmServerKey_() {
  return PropertiesService.getScriptProperties().getProperty("FCM_SERVER_KEY") || "";
}

function chunkArray_(list, size) {
  const out = [];
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size));
  }
  return out;
}
