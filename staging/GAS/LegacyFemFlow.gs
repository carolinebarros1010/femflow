/* ======================================================
 * 🔹 LEGACY FEMFLOW — compatibilidade sem conflito
 * ------------------------------------------------------
 * Mantém endpoints antigos sem sobrescrever doGet/doPost.
 * ====================================================== */

const LEGACY_SECURITY_TOKEN = "Bmc082849$$";

function _isLegacyUpgradeToken_(token) {
  const normalized = String(token || "").trim();
  if (!normalized) return false;
  return normalized === SECURITY_TOKEN || normalized === LEGACY_SECURITY_TOKEN;
}

function legacyValidarId_(id) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };
  const lastRow = sh.getLastRow();
  if (lastRow < 1) return { valido: false };
  const ids = sh.getRange(1, 1, lastRow, 1).getValues().flat();
  return { valido: ids.includes(String(id || "").trim()) };
}

function legacyUpgrade_(id, nivel, origem, token) {
  if (!_isLegacyUpgradeToken_(token)) {
    _logUpgrade({ id, nivel, origem, status: "unauthorized" });
    return { error: "unauthorized" };
  }

  const idNorm = String(id || "").trim();
  const nivelNorm = String(nivel || "").trim();
  if (!idNorm || !nivelNorm) return { error: "missing id or nivel" };

  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === idNorm) {
      const row = i + 1;
      sh.getRange(row, 7).setValue(new Date()); // DataCompra
      sh.getRange(row, 8).setValue(true); // LicencaAtiva
      sh.getRange(row, 9).setValue(nivelNorm); // Nivel
      _logUpgrade({ id: idNorm, nivel: nivelNorm, origem, status: "ok" });
      return { status: "upgraded", id: idNorm, nivel: nivelNorm };
    }
  }

  _logUpgrade({ id: idNorm, nivel: nivelNorm, origem, status: "notfound" });
  return { status: "notfound" };
}

function legacyRecuperarId_(data) {
  const email = String(data.email || "").toLowerCase().trim();
  const nomeBusca = String(data.nome || "").toLowerCase().trim();
  if (!email || !nomeBusca) return { status: "error", msg: "missing_email_or_nome" };

  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    const id = values[i][0];
    const nome = String(values[i][1] || "").toLowerCase().trim();
    const emailLower = String(values[i][2] || "").toLowerCase().trim();
    if (nome.includes(nomeBusca) && emailLower === email) {
      MailApp.sendEmail(
        email,
        "Recuperação de ID FemFlow",
        "Olá " + (data.nome || "") + ",\n\nSeu ID FemFlow é: " + id +
          "\n\nAcesse: https://carolinebarros1010.github.io/femflow/app\n🌸 Bons treinos!"
      );
      return { status: "ok", id };
    }
  }

  return { status: "notfound" };
}

function legacyRegistrarPSE_(data) {
  const ss = SpreadsheetApp.getActive();
  let treinoSheet = ss.getSheetByName("Treinos");
  if (!treinoSheet) {
    treinoSheet = ss.insertSheet("Treinos");
  }
  if (treinoSheet.getLastRow() === 0) {
    treinoSheet.appendRow([
      "ID","Data","Fase","DiaPrograma","PSE",
      "Apelido","Box","Exercício","Séries","Reps","Peso"
    ]);
  }

  treinoSheet.appendRow([
    data.id || "",
    new Date(),
    data.fase || "",
    data.diaPrograma || "",
    data.pse,
    "",
    "",
    data.treino || "",
    "",
    "",
    ""
  ]);

  return { status: "ok" };
}

function legacyRegistrarDescanso_(data) {
  const ss = SpreadsheetApp.getActive();
  let diario = ss.getSheetByName("Diario");
  if (!diario) {
    diario = ss.insertSheet("Diario");
  }
  if (diario.getLastRow() === 0) {
    diario.appendRow([
      "ID","Data","Fase","Semana","Treino","Tipo","Descanso","Observação"
    ]);
  }

  diario.appendRow([
    data.id || "",
    new Date(),
    data.fase || "",
    data.semana || "",
    data.treino || "",
    "descanso",
    true,
    data.obs || ""
  ]);

  return { status: "descanso_registrado" };
}

function legacyEnduranceSetup_(data) {
  const ss = SpreadsheetApp.getActive();
  let enduranceSheet = ss.getSheetByName("EnduranceSetup");
  if (!enduranceSheet) {
    enduranceSheet = ss.insertSheet("EnduranceSetup");
  }
  if (enduranceSheet.getLastRow() === 0) {
    enduranceSheet.appendRow([
      "Data",
      "ID",
      "Nome",
      "Nivel",
      "Modalidade",
      "TreinosSemana",
      "DiasSemana",
      "RitmoMedio",
      "DataTreino",
      "Semana",
      "Dia",
      "StatusTreino"
    ]);
  }

  enduranceSheet.appendRow([
    new Date(),
    data.id || "",
    data.nome || "",
    data.nivel || "",
    data.modalidade || "",
    data.treinosSemana || "",
    data.diasSemana || "",
    data.ritmo || "",
    "",
    "",
    "",
    ""
  ]);

  return { status: "endurance_setup_registrado" };
}

function legacyEnduranceTreino_(data) {
  const ss = SpreadsheetApp.getActive();
  let enduranceSheet = ss.getSheetByName("EnduranceSetup");
  if (!enduranceSheet) {
    enduranceSheet = ss.insertSheet("EnduranceSetup");
  }
  if (enduranceSheet.getLastRow() === 0) {
    enduranceSheet.appendRow([
      "Data",
      "ID",
      "Nome",
      "Nivel",
      "Modalidade",
      "TreinosSemana",
      "DiasSemana",
      "RitmoMedio",
      "DataTreino",
      "Semana",
      "Dia",
      "StatusTreino"
    ]);
  }

  enduranceSheet.appendRow([
    new Date(),
    data.id || "",
    data.nome || "",
    data.nivel || "",
    data.modalidade || "",
    data.treinosSemana || "",
    data.diasSemana || "",
    data.ritmo || "",
    data.dataTreino || new Date(),
    data.semana || "",
    data.dia || "",
    "realizado"
  ]);

  return { status: "endurance_treino_registrado" };
}

function legacyEnduranceCheck_(data) {
  const enduranceSheet = SpreadsheetApp.getActive().getSheetByName("EnduranceSetup");
  if (!enduranceSheet || enduranceSheet.getLastRow() < 2) {
    return { status: "ok", realizado: false };
  }

  const values = enduranceSheet.getDataRange().getValues();
  const id = String(data.id || "").trim();
  const semana = String(data.semana || "").trim();
  const dia = String(data.dia || "").trim();

  let encontrado = null;
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowId = String(row[1] || "").trim();
    const rowSemana = String(row[9] || "").trim();
    const rowDia = String(row[10] || "").trim();
    const status = String(row[11] || "").trim();
    if (rowId === id && rowSemana === semana && rowDia === dia && status === "realizado") {
      encontrado = row;
    }
  }

  if (!encontrado) {
    return { status: "ok", realizado: false };
  }

  return {
    status: "ok",
    realizado: true,
    dataTreino: encontrado[8] || ""
  };
}
