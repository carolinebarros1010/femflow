
/* ======================================================
 * 🔹 SALVAR TREINO — FINAL (ARQUITETURA CORRETA)
 * ====================================================== */
function salvarTreino_(data) {
  const id          = String(data.id || "").trim();
  const pse         = Number(data.pse || 0);
  const treino      = String(data.treino || "");
  const diaPrograma = Number(data.diaPrograma || 1);

  const deviceId = String(data.deviceId || "").trim();
  const sessionToken = String(data.sessionToken || "").trim();

  const auth = _assertSession_(id, deviceId, sessionToken);
  if (!auth.ok) return { status: "denied", msg: auth.msg };

  if (!id) return { status: "error", msg: "ID inválido" };

  const ss = SpreadsheetApp.getActive();
  const agora = new Date();

  /* ===== ABA TREINOS ===== */
  let shT = ss.getSheetByName("Treinos");
  if (!shT) {
    shT = ss.insertSheet("Treinos");
    shT.appendRow([
      "ID","Data","Fase","DiaPrograma","PSE",
      "Apelido","Box","Exercício","Séries","Reps","Peso"
    ]);
  }

  /* ===== ABA ALUNAS ===== */
  const shA = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  const rows = shA.getDataRange().getValues();

  let faseAtual = "follicular";
  let diaCicloAtual = 1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== id) continue;

    // 🔒 FASE E DIA DO CICLO VÊM DA PLANILHA
    faseAtual = String(rows[i][13] || "follicular").toLowerCase();
    diaCicloAtual = Number(rows[i][14] || 1);

    // ✅ Avança APENAS o dia do programa
    avancarDiaPrograma_(shA, i, "treino");

    break;
  }

  
  shT.appendRow([
    id,
    agora,
    faseAtual,
    diaPrograma,
    pse,
    "",
    "",
    treino,
    "",
    "",
    ""
  ]);

  return {
    status: "ok",
    salvo: true,
    fase: faseAtual,
    diaCiclo: diaCicloAtual,
    diaPrograma: diaPrograma + 1
  };
}


/* ======================================================
 * 🔹 SALVAR DESCANSO — FINAL (ARQUITETURA CORRETA)
 * ====================================================== */
function salvarDescanso_(data) {
  const id = String(data.id || "").trim();
  const obs = String(data.obs || "");

  const deviceId = String(data.deviceId || "").trim();
  const sessionToken = String(data.sessionToken || "").trim();

  const auth = _assertSession_(id, deviceId, sessionToken);
  if (!auth.ok) return { status: "denied", msg: auth.msg };

  if (!id) return { status: "error", msg: "ID inválido" };

  const ss = SpreadsheetApp.getActive();
  const agora = new Date();

  /* ===== ABA DIARIO ===== */
  let shD = ss.getSheetByName("Diario");
  if (!shD) {
    shD = ss.insertSheet("Diario");
    shD.appendRow([
      "ID","Data","Fase","Semana","Treino","Tipo","Descanso","Observação"
    ]);
  }

  /* ===== ABA ALUNAS ===== */
  const shA = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  const rows = shA.getDataRange().getValues();

  let faseAtual = "follicular";
  let diaCicloAtual = 1;
  let diaProgramaAtual = 1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== id) continue;

    faseAtual = String(rows[i][13] || "follicular").toLowerCase();
    diaCicloAtual = Number(rows[i][14] || 1);
    diaProgramaAtual = Number(rows[i][COL_DIA_PROGRAMA] || 1);

    // ✅ descanso avança SOMENTE o programa
    avancarDiaPrograma_(shA, i, "descanso");

    break;
  }

  const semana = Math.ceil(diaCicloAtual / 7);

  // 📝 Registra descanso
  shD.appendRow([
    id,
    agora,
    faseAtual,
    semana,
    "",
    "descanso",
    true,
    obs
  ]);

  return {
    status: "ok",
    descanso: true,
    fase: faseAtual,
    diaCiclo: diaCicloAtual,
    diaPrograma: diaProgramaAtual + 1
  };
}


/* ======================================================
 * 🔹 SALVAR EVOLUÇÃO — FINAL (NÃO AVANÇA PROGRAMA)
 * ====================================================== */
function salvarEvolucao_(data) {
  const id = String(data.id || "").trim();
  const exercicio = String(data.exercicio || "").trim();
  const peso = data.peso;
  const reps = data.reps;
  const series = data.series;
  const pse = Number(data.pse || 0);

  const deviceId = String(data.deviceId || "").trim();
  const sessionToken = String(data.sessionToken || "").trim();

  const auth = _assertSession_(id, deviceId, sessionToken);
  if (!auth.ok) return { status: "denied", msg: auth.msg };

  if (!id || !exercicio) {
    return { status: "error", msg: "Dados insuficientes." };
  }

  const ss = SpreadsheetApp.getActive();
  const agora = new Date();

  /* ===== ABA ALUNAS (fonte da verdade) ===== */
  const shA = _sheet(SHEET_ALUNAS);
  const rows = shA.getDataRange().getValues();

  let faseAtual = "follicular";
  let diaProgramaAtual = 1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== id) continue;

    const dataInicio = rows[i][10];
    const cicloDuracao = Number(rows[i][9]) || 28;
    const nivel = String(rows[i][8] || "iniciante").toLowerCase();
    const startBase = new Date(dataInicio);

    const ciclo = calcularCicloReal({
      startDate: startBase,
      cicloDuracao,
      nivel,
      faseSalva: rows[i][13],
      diaCicloSalvo: rows[i][14]
    });

    faseAtual = ciclo.fase;
    diaProgramaAtual = Number(rows[i][COL_DIA_PROGRAMA] || 1);
    break;
  }

  /* ===== ABA TREINOS ===== */
  let shT = ss.getSheetByName("Treinos");
  if (!shT) {
    shT = ss.insertSheet("Treinos");
    shT.appendRow([
      "ID","Data","Fase","DiaPrograma","PSE",
      "Apelido","Box","Exercício","Séries","Reps","Peso"
    ]);
  }

  shT.appendRow([
    id,
    agora,
    faseAtual,
    diaProgramaAtual,
    pse,
    "",
    "",
    exercicio,
    series || "",
    reps || "",
    peso || ""
  ]);

  /* ===== ABA ULTIMOSPESOS ===== */
  let shU = ss.getSheetByName("UltimosPesos");
  if (!shU) {
    shU = ss.insertSheet("UltimosPesos");
    shU.appendRow(["ID","Exercicio","UltimoPeso"]);
  }

  const chave = exercicio.toLowerCase().trim();
  const rowsU = shU.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < rowsU.length; i++) {
    if (rowsU[i][0] === id && rowsU[i][1] === chave) {
      shU.getRange(i + 1, 3).setValue(peso);
      found = true;
      break;
    }
  }

  if (!found) {
    shU.appendRow([id, chave, peso]);
  }

  return {
    status: "ok",
    evolucao: true,
    exercicio,
    peso,
    reps,
    series,
    fase: faseAtual,
    diaPrograma: diaProgramaAtual
  };
}

/* ============================================================
 * 🌸 setmanualstart — coluna removida
 * ============================================================ */
function setmanualstart(id, startDate) {
  if (!id) return { status: "error", msg: "missing_id" };
  if (!startDate) return { status: "error", msg: "missing_start_date" };
  return { status: "ignored", msg: "manual_start_removido" };
}

/* ============================================================
 * atualizarCicloStart — compatível com versões antigas do app
 * (coluna removida)
 * ============================================================ */
function atualizarCicloStart(id, startDate) {
  if (!id) return { status: "error", msg: "missing_id" };
  if (!startDate) return { status: "error", msg: "missing_start_date" };
  return { status: "ignored", msg: "manual_start_removido" };
}





/**
 * ======================================================
 * 🧹 LIMPEZA DE CICLO MANUAL — PERFIL ENERGÉTICO
 * ------------------------------------------------------
 * - Coluna removida; mantido apenas por compatibilidade
 * ======================================================
 */
function limpezaCicloManualEnergetico() {
  Logger.log("ℹ️ Coluna de ciclo manual removida; nenhuma ação executada.");
}
