function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || "").toLowerCase().trim();

    if (!action) {
    if (params.id) {
      // NOVO PADRÃO: carregar backend completo do app
      // (mantém compatibilidade pois sync já calcula fase/dia/treino)
      return _json(sync(params.id));
    }

    // GETs vazios (preload, health check, cache, etc)
     const ENV = (PropertiesService.getScriptProperties().getProperty("ENV") || "staging").toLowerCase();
  return _json({ status: "ok", noop: true, env: ENV });
}

  if (action === "upgrade") {
    return _json(legacyUpgrade_(params.id, params.nivel, "GET", params.token));
  }


  if (action === "validar") {
    return _json(_validarPerfil_(params));
  }

  if (action === "sync") {
    return _json(sync(params.id));
  }

  if (action === "admin_list_alunas") {
    return _json(adminListAlunas_(params));
  }

  if (action === "admin_get_aluna") {
    return _json(adminGetAluna_(params));
  }

  return _json({ status: "ignored", msg: "unknown_action", action });
}

function _parseBooleanish_(value) {
  if (typeof value === "boolean") return value;
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "sim", "y"].includes(normalized);
}

function _parseFreeEnfases_(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(item => String(item || "").toLowerCase().trim()).filter(Boolean);
  }

  return String(raw)
    .split(/[,\n;|]+/)
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

function _parseFreeUntil_(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return Utilities.formatDate(raw, "GMT", "yyyy-MM-dd");
  }

  const text = String(raw).trim();
  if (!text) return null;

  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  return text;
}

function _buildFreeAccess_(row) {
  const enabledRaw = row[COL_FREE_ENABLED];
  const enfasesRaw = row[COL_FREE_ENFASES];
  const untilRaw = row[COL_FREE_UNTIL];

  if (enabledRaw == null && enfasesRaw == null && untilRaw == null) {
    return null;
  }

  return {
    enabled: _parseBooleanish_(enabledRaw),
    enfases: _parseFreeEnfases_(enfasesRaw),
    until: _parseFreeUntil_(untilRaw)
  };
}

function _validarPerfil_(params) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const id = String(params.id || "").trim();
  const email = String(params.email || "").toLowerCase().trim();
  if (!id && !email) return { status: "error", msg: "missing_id" };

  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowId = String(row[0] || "").trim();
    const rowEmail = String(row[2] || "").toLowerCase().trim();

    if ((id && rowId === id) || (email && rowEmail === email)) {
      const syncResult = id ? sync(rowId) : null;
      const faseSync = syncResult && syncResult.status === "ok" ? syncResult.fase : row[13];
      const diaCicloSync = syncResult && syncResult.status === "ok" ? syncResult.diaCiclo : row[14];

      const produtoRaw = String(row[5] || "").toLowerCase().trim();
      const isVip = produtoRaw === "vip";
      const ativa = isVip || row[7] === true || String(row[7] || "").toLowerCase() === "true";

      const freeAccess = _buildFreeAccess_(row);

      return {
        status: "ok",
        id: rowId,
        nome: row[1] || "",
        email: rowEmail,
        produto: row[5] || "",
        ativa,
        nivel: String(row[8] || "iniciante").toLowerCase(),
        enfase: String(row[12] || "nenhuma").toLowerCase(),
        fase: String(faseSync || "follicular").toLowerCase(),
        diaCiclo: Number(diaCicloSync || 1),
        ciclo_duracao: Number(row[9] || 28),
        data_inicio: row[10] || "",
        diaPrograma: Number(row[COL_DIA_PROGRAMA] || 1),
        dataInicioPrograma: row[COL_DATA_INICIO_PROGRAMA] || "",
        novo_treino_endurance: row[COL_NOVO_TREINO_ENDURANCE] || "",
        acessos: {
          personal: row[COL_ACESSO_PERSONAL] === true || isVip
        },
        free_access: freeAccess,
        FreeEnabled: row[COL_FREE_ENABLED],
        FreeEnfases: row[COL_FREE_ENFASES],
        FreeUntil: row[COL_FREE_UNTIL]
      };
    }
  }

  return { status: "notfound" };
}

function getEndurancePlanToken_(params) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const id = String(params?.id || "").trim();
  const email = String(params?.email || "").toLowerCase().trim();
  if (!id && !email) return { status: "error", msg: "missing_id" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowId = String(row[0] || "").trim();
    const rowEmail = String(row[2] || "").toLowerCase().trim();
    if ((id && rowId === id) || (email && rowEmail === email)) {
      return { status: "ok", token: row[COL_NOVO_TREINO_ENDURANCE] || "" };
    }
  }

  return { status: "notfound", token: "" };
}
