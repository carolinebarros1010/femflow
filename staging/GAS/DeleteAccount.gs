const SHEET_DELETE_REQUESTS = "DeleteRequests";
const HEADER_DELETE_REQUESTS = [
  "requestId",
  "userId",
  "email",
  "createdAt",
  "status",
  "processedAt",
  "notes",
  "locale",
  "source",
  "reason",
  "app",
  "ip",
  "userAgent"
];

function deleteAccountRequest_(data, ip) {
  const userId = String(data.userId || data.id || "").trim();
  const deviceId = String(data.deviceId || "").trim();
  const sessionToken = String(data.sessionToken || "").trim();
  const locale = normalizeDeleteLocale_(data.locale);

  const auth = _assertSession_(userId, deviceId, sessionToken);
  if (!auth.ok) {
    return {
      ok: false,
      status: "denied",
      messageLocalized: localizedDeleteMessage_(locale, "denied")
    };
  }

  const requestedAt = String(data.requestedAt || new Date().toISOString());
  const now = new Date();

  const user = findUserById_(userId);
  const email = user ? String(user.email || "") : "";

  const sheet = ensureSheet(SHEET_DELETE_REQUESTS, HEADER_DELETE_REQUESTS);
  const values = sheet.getDataRange().getValues();
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i];
    const rowUser = String(row[1] || "").trim();
    if (rowUser !== userId) continue;
    const rowCreated = new Date(row[3]);
    if (Number.isFinite(rowCreated.getTime()) && (now.getTime() - rowCreated.getTime()) < oneDayMs) {
      return {
        ok: false,
        status: "rate_limited",
        messageLocalized: localizedDeleteMessage_(locale, "rate_limited")
      };
    }
    break;
  }

  const requestId = Utilities.getUuid();
  sheet.appendRow([
    requestId,
    userId,
    email,
    requestedAt,
    "requested",
    "",
    "",
    locale,
    String(data.source || "app"),
    String(data.reason || ""),
    String(data.app || "femflow"),
    ip || "",
    String(data.userAgent || "")
  ]);

  const shAlunas = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (shAlunas) {
    const rowsAlunas = shAlunas.getDataRange().getValues();
    for (let i = 1; i < rowsAlunas.length; i++) {
      if (String(rowsAlunas[i][0] || "").trim() !== userId) continue;
      shAlunas.getRange(i + 1, COL_STATUS_CONTA + 1).setValue("pendente_exclusao");
      break;
    }
  }

  return {
    ok: true,
    status: "ok",
    requestId: requestId,
    statusRequest: "requested",
    messageLocalized: localizedDeleteMessage_(locale, "ok")
  };
}

function normalizeDeleteLocale_(value) {
  const locale = String(value || "pt").slice(0, 2).toLowerCase();
  return ["pt", "en", "fr"].indexOf(locale) >= 0 ? locale : "pt";
}

function localizedDeleteMessage_(locale, key) {
  const map = {
    pt: {
      ok: "Solicitação enviada. Você receberá confirmação em até 30 dias.",
      denied: "Sessão inválida. Faça login novamente.",
      rate_limited: "Você já tem um pedido recente. Aguarde 24 horas para um novo envio."
    },
    en: {
      ok: "Request sent. You will receive confirmation within up to 30 days.",
      denied: "Invalid session. Please sign in again.",
      rate_limited: "You already have a recent request. Please wait 24 hours before sending another."
    },
    fr: {
      ok: "Demande envoyée. Vous recevrez une confirmation sous 30 jours maximum.",
      denied: "Session invalide. Veuillez vous reconnecter.",
      rate_limited: "Une demande récente existe déjà. Veuillez attendre 24 heures avant d'en envoyer une autre."
    }
  };

  const dict = map[locale] || map.pt;
  return dict[key] || dict.ok;
}

function findUserById_(id) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return null;

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[0] || "").trim() === String(id || "").trim()) {
      return { email: row[2] || "" };
    }
  }
  return null;
}
