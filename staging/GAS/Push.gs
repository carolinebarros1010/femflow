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
  const lang = normalizePushLang_(data.lang);
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

  const targets = resolvePushTargets_(data);
  if (!targets.length) {
    return { status: "error", msg: "no_tokens" };
  }

  const allowedTargets = filterTargetsByDailyLimit_(targets);
  if (!allowedTargets.length) {
    return { status: "skipped_daily_limit" };
  }

  const event = String(data.event || "").trim().toLowerCase();
  const action = String(data.action || "").trim();
  const url = String(data.url || "").trim();
  const overrideTitle = String(data.title || "").trim();
  const overrideBody = String(data.body || "").trim();
  const overrideCopyByLang = {
    pt: {
      title: String(data.titlePt || data.title_pt || overrideTitle || "").trim(),
      body: String(data.bodyPt || data.body_pt || overrideBody || "").trim()
    },
    en: {
      title: String(data.titleEn || data.title_en || "").trim(),
      body: String(data.bodyEn || data.body_en || "").trim()
    },
    fr: {
      title: String(data.titleFr || data.title_fr || "").trim(),
      body: String(data.bodyFr || data.body_fr || "").trim()
    }
  };

  const results = [];
  const maxTokens = 500;
  const targetsByLang = groupTargetsByLang_(allowedTargets);

  Object.keys(targetsByLang).forEach((langKeyRaw) => {
    const langKey = normalizePushLang_(langKeyRaw);
    const copy = resolvePushCopy_(event, langKey);
    const fallbackOverride = overrideCopyByLang.pt || { title: "", body: "" };
    const langOverride = overrideCopyByLang[langKey] || {};
    const title = langOverride.title || fallbackOverride.title || copy.title || "";
    const body = langOverride.body || fallbackOverride.body || copy.body || "";

    if (!title || !body) {
      results.push({ status: "error", msg: "missing_title_body", lang: langKey });
      return;
    }

    const resolvedAction = action || copy.action || "open_home";
    const payload = buildFcmPayload_(title, body, resolvedAction, url);
    const chunks = chunkArray_(targetsByLang[langKey], maxTokens);

    chunks.forEach((chunk) => {
      const response = sendFcmRequest_(serverKey, {
        ...payload,
        registration_ids: chunk
      });
      results.push(response);
    });
  });

  markPushSent_(allowedTargets.map((target) => target.token), data);

  return { status: "ok", results };
}

function resolvePushTargets_(data) {
  const explicitToken = String(data.pushToken || "").trim();
  const filterLangRaw = String(data.lang || "").trim();
  const filterLang = filterLangRaw ? normalizePushLang_(filterLangRaw) : "";
  if (explicitToken) {
    const explicitLang = normalizePushLang_(filterLang || lookupLangByToken_(explicitToken) || "pt");
    return [{ token: explicitToken, lang: explicitLang }];
  }

  const userId = String(data.userId || "").trim();
  const deviceId = String(data.deviceId || "").trim();
  if (!userId && !deviceId) return [];

  const sheet = ensureSheet(SHEET_PUSH_TOKENS, HEADER_PUSH_TOKENS);
  const values = sheet.getDataRange().getValues();
  const targets = [];

  for (let i = 1; i < values.length; i += 1) {
    const rowUserId = String(values[i][0] || "").trim();
    const rowDeviceId = String(values[i][1] || "").trim();
    const rowLang = normalizePushLang_(values[i][3]);
    const rowToken = String(values[i][4] || "").trim();

    if (!rowToken) continue;
    if (userId && rowUserId !== userId) continue;
    if (deviceId && rowDeviceId !== deviceId) continue;
    if (filterLang && rowLang !== filterLang) continue;

    targets.push({ token: rowToken, lang: rowLang });
  }

  const unique = new Map();
  targets.forEach((target) => {
    if (!unique.has(target.token)) {
      unique.set(target.token, target);
    }
  });
  return Array.from(unique.values());
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

function filterTargetsByDailyLimit_(targets) {
  const sheet = ensureSheet(SHEET_PUSH_TOKENS, HEADER_PUSH_TOKENS);
  const values = sheet.getDataRange().getValues();
  const tokenSet = new Set(targets.map((target) => target.token));
  const allowed = [];
  const timezone = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd");

  for (let i = 1; i < values.length; i += 1) {
    const rowToken = String(values[i][4] || "").trim();
    if (!rowToken || !tokenSet.has(rowToken)) continue;

    const lastSent = values[i][6];
    if (lastSent instanceof Date && !isNaN(lastSent.getTime())) {
      const lastDay = Utilities.formatDate(lastSent, timezone, "yyyy-MM-dd");
      if (lastDay === today) continue;
    }

    const target = targets.find((item) => item.token === rowToken);
    if (target) {
      allowed.push(target);
    }
  }

  return allowed;
}

function resolvePushCopy_(event, lang) {
  const normalizedEvent = normalizePushEvent_(event);
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
      fr: {
        title: "💪 Votre entraînement du jour est prêt",
        body: "Ouvrez FemFlow pour voir votre séance d’aujourd’hui.",
        action: "open_treino"
      }
    },
    lembrete_respiracao: {
      pt: {
        title: "🫁 Faça uma respiração hoje",
        body: "Reserve alguns minutos para respirar com o FemFlow.",
        action: "open_respiracao"
      },
      en: {
        title: "🫁 Do a breathing session today",
        body: "Take a few minutes to breathe with FemFlow.",
        action: "open_respiracao"
      },
      fr: {
        title: "🫁 Faites une séance de respiration aujourd’hui",
        body: "Prenez quelques minutes pour respirer avec FemFlow.",
        action: "open_respiracao"
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
      fr: {
        title: "🌙 Aujourd’hui votre corps demande plus de douceur",
        body: "Consultez votre FlowCenter pour ajuster votre entraînement.",
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
      fr: {
        title: "✨ FemFlow a de nouvelles améliorations",
        body: "Ouvrez l’app pour découvrir les nouveautés.",
        action: "open_home"
      }
    }
  };

  const group = copyMap[normalizedEvent];
  if (!group) return {};
  const normalizedLang = normalizePushLang_(lang);
  return group[normalizedLang] || group.pt || {};
}

function normalizePushEvent_(eventRaw) {
  const normalized = String(eventRaw || "").trim().toLowerCase();
  const aliases = {
    respiracao_hoje: "lembrete_respiracao",
    respirar_hoje: "lembrete_respiracao",
    respiracao: "lembrete_respiracao",
    breathing_reminder: "lembrete_respiracao"
  };
  return aliases[normalized] || normalized;
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

function groupTargetsByLang_(targets) {
  const grouped = {};
  targets.forEach((target) => {
    const lang = normalizePushLang_(target.lang);
    if (!grouped[lang]) grouped[lang] = [];
    grouped[lang].push(target.token);
  });
  return grouped;
}

function normalizePushLang_(langRaw) {
  const lang = String(langRaw || "pt").trim().toLowerCase();
  if (lang === "en" || lang === "fr") return lang;
  return "pt";
}

function lookupLangByToken_(token) {
  const sheet = ensureSheet(SHEET_PUSH_TOKENS, HEADER_PUSH_TOKENS);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i += 1) {
    const rowToken = String(values[i][4] || "").trim();
    if (rowToken === token) {
      return normalizePushLang_(values[i][3]);
    }
  }

  return "";
}
