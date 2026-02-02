/* ======================================================
 * 🧭 FEMFLOW — PAINEL ADMIN (WRITE)
 * ------------------------------------------------------
 * Funções de gestão administrativa
 * Escreve na planilha Alunas
 * ====================================================== */

function _requireAdminToken_(token) {
  const normalized = String(token || "").trim();
  if (!normalized || normalized !== SECURITY_TOKEN) {
    return { status: "error", msg: "unauthorized" };
  }
  return null;
}

function _parseBoolean_(value) {
  if (typeof value === "boolean") return value;
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "sim", "y"].includes(normalized);
}

function _parseDateInput_(value) {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const text = String(value).trim();
  if (!text) return null;

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  const alt = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (alt) {
    const [, dd, mm, yyyy] = alt;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  }

  const fallback = new Date(text);
  if (!isNaN(fallback.getTime())) return fallback;
  return null;
}

function _mapAlunaRow_(row) {
  return {
    id: row[0] || "",
    nome: row[1] || "",
    email: row[2] || "",
    telefone: row[3] || "",
    produto: row[5] || "",
    dataCompra: row[6] || "",
    licencaAtiva: row[7] === true || String(row[7] || "").toLowerCase() === "true",
    nivel: row[8] || "",
    fase: row[13] || "",
    diaCiclo: row[14] || "",
    acessoPersonal: row[COL_ACESSO_PERSONAL] === true || String(row[COL_ACESSO_PERSONAL] || "").toLowerCase() === "true"
  };
}

function adminListAlunas_(params) {
  const guard = _requireAdminToken_(params.token);
  if (guard) return guard;

  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const sinceDays = Number(params.sinceDays || 0);
  const includeSemData = params.includeSemData !== undefined
    ? _parseBoolean_(params.includeSemData)
    : true;
  const values = sh.getDataRange().getValues();
  const rows = values.slice(1);

  let sinceDate = null;
  if (sinceDays > 0) {
    sinceDate = new Date();
    sinceDate.setHours(0, 0, 0, 0);
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
  }

  const items = [];

  rows.forEach((row) => {
    const mapped = _mapAlunaRow_(row);
    if (sinceDate) {
      const rawDate = row[6];
      const parsed = _parseDateInput_(rawDate);
      if (!parsed) {
        if (!includeSemData) return;
      } else if (parsed < sinceDate) {
        return;
      }
    }
    items.push(mapped);
  });

  items.sort((a, b) => {
    const da = _parseDateInput_(a.dataCompra) || new Date(0);
    const db = _parseDateInput_(b.dataCompra) || new Date(0);
    return db - da;
  });

  return {
    status: "ok",
    total: items.length,
    items
  };
}

function adminGetAluna_(params) {
  const guard = _requireAdminToken_(params.token);
  if (guard) return guard;

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
      return { status: "ok", aluna: _mapAlunaRow_(row) };
    }
  }

  return { status: "notfound" };
}

function adminUpdateAluna_(data) {
  const guard = _requireAdminToken_(data.token);
  if (guard) return guard;

  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const id = String(data.id || "").trim();
  const email = String(data.email || "").toLowerCase().trim();
  if (!id && !email) return { status: "error", msg: "missing_id" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowId = String(row[0] || "").trim();
    const rowEmail = String(row[2] || "").toLowerCase().trim();

    if ((id && rowId === id) || (email && rowEmail === email)) {
      const linha = i + 1;

      if (data.nome !== undefined) sh.getRange(linha, 2).setValue(String(data.nome || ""));
      if (data.telefone !== undefined) sh.getRange(linha, 4).setValue(String(data.telefone || ""));
      if (data.produto !== undefined) sh.getRange(linha, 6).setValue(String(data.produto || ""));
      if (data.nivel !== undefined) sh.getRange(linha, 9).setValue(String(data.nivel || ""));

      if (data.licencaAtiva !== undefined) {
        sh.getRange(linha, 8).setValue(_parseBoolean_(data.licencaAtiva));
      }

      if (data.acessoPersonal !== undefined) {
        sh.getRange(linha, COL_ACESSO_PERSONAL + 1).setValue(_parseBoolean_(data.acessoPersonal));
      }

      if (data.dataCompra !== undefined) {
        const parsed = _parseDateInput_(data.dataCompra);
        if (parsed) {
          sh.getRange(linha, 7).setValue(parsed);
        } else {
          sh.getRange(linha, 7).setValue(String(data.dataCompra || ""));
        }
      }

      return { status: "ok", id: rowId };
    }
  }

  return { status: "notfound" };
}

function adminCreateAluna_(data) {
  const guard = _requireAdminToken_(data.token);
  if (guard) return guard;

  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const nome = String(data.nome || "").trim();
  const email = String(data.email || "").toLowerCase().trim();
  if (!nome || !email) return { status: "error", msg: "missing_fields" };

  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][2] || "").toLowerCase().trim() === email) {
      return { status: "error", msg: "email_already_exists" };
    }
  }

  const id = gerarID();
  const row = Array(HEADER_ALUNAS.length).fill("");

  row[0] = id;
  row[1] = nome;
  row[2] = email;
  row[3] = String(data.telefone || "");
  row[5] = String(data.produto || "");
  row[6] = _parseDateInput_(data.dataCompra) || new Date();
  row[7] = _parseBoolean_(data.licencaAtiva);
  row[8] = String(data.nivel || "iniciante").toLowerCase();
  row[9] = Number(data.cicloDuracao || 28);
  row[10] = new Date();
  row[12] = String(data.enfase || "nenhuma").toLowerCase();
  row[13] = "follicular";
  row[14] = 1;
  row[COL_ACESSO_PERSONAL] = _parseBoolean_(data.acessoPersonal);

  sh.appendRow(row);

  return { status: "ok", id };
}
