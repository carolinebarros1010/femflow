/* ======================================================
 * 🔹 DiaPrograma
 * ====================================================== */
function getDiaPrograma_(id) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", diaPrograma: 1 };

  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === String(id).trim()) {
      const diaP = Number(vals[i][COL_DIA_PROGRAMA] || 1);
      return { status: "ok", diaPrograma: diaP };
    }
  }
  return { status: "notfound", diaPrograma: 1 };
}

function setDiaPrograma_(id, dia) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(id).trim()) {
      sh.getRange(i + 1, COL_DIA_PROGRAMA + 1).setValue(Number(dia));
      return { status: "ok", diaPrograma: Number(dia) };
    }
  }
  return { status: "notfound" };
}

function setTreinosSemana_(data) {
  const id = String(data.id || "").trim();
  const treinosSemana = Number(data.treinosSemana);

  if (!id) return { status: "error", msg: "missing_id" };
  if (!Number.isFinite(treinosSemana) || treinosSemana < 1 || treinosSemana > 7) {
    return { status: "error", msg: "invalid_treinos_semana" };
  }

  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === id) {
      sh.getRange(i + 1, COL_TREINOS_SEMANA + 1).setValue(treinosSemana);
      return { status: "ok", treinosSemana };
    }
  }

  return { status: "notfound" };
}
function avancarDiaPrograma_(shA, rowIndex, motivo) {
  if (!["treino", "descanso"].includes(motivo)) return;

  const atual = Number(shA.getRange(rowIndex + 1, COL_DIA_PROGRAMA + 1).getValue() || 1);
  shA.getRange(rowIndex + 1, COL_DIA_PROGRAMA + 1).setValue(atual + 1);
  shA.getRange(rowIndex + 1, COL_ULTIMA_ATIVIDADE + 1).setValue(new Date());
  shA.getRange(rowIndex + 1, COL_AUSENCIA_ATIVA + 1).setValue(false);
  shA.getRange(rowIndex + 1, COL_AUSENCIA_INICIO + 1).clearContent();
}

function aplicarDescansoAutomatico_(shA, rowIndex, opts) {
  opts = opts || {};
  const agora = opts.agora || new Date();
  const ultima = shA.getRange(rowIndex + 1, COL_ULTIMA_ATIVIDADE + 1).getValue();
  const ausenciaAtual = shA.getRange(rowIndex + 1, COL_AUSENCIA_ATIVA + 1).getValue();
  const treinosSemanaRaw = shA.getRange(rowIndex + 1, COL_TREINOS_SEMANA + 1).getValue();
  const treinosSemana = Number(treinosSemanaRaw);

  if (!(ultima instanceof Date) || isNaN(ultima.getTime())) {
    return { status: "skip", reason: "sem_ultima_atividade", dias: 0 };
  }

  const diffMs = agora - ultima;
  const diaMs = 24 * 60 * 60 * 1000;
  const dias = Math.floor(diffMs / diaMs);
  const limiteAusenciaDias = Number.isFinite(treinosSemana) && treinosSemana >= 1 && treinosSemana <= 7
    ? Math.max(0, 7 - treinosSemana)
    : 3;

  if (dias <= 0) {
    if (ausenciaAtual === true) {
      shA.getRange(rowIndex + 1, COL_AUSENCIA_ATIVA + 1).setValue(false);
      shA.getRange(rowIndex + 1, COL_AUSENCIA_INICIO + 1).clearContent();
    }
    return { status: "none", dias: 0 };
  }

  if (ausenciaAtual === true) {
    return { status: "ausencia", dias, limite: limiteAusenciaDias };
  }

  if (dias > limiteAusenciaDias) {
    if (ausenciaAtual !== true) {
      shA.getRange(rowIndex + 1, COL_AUSENCIA_ATIVA + 1).setValue(true);
      const inicioAtual = shA.getRange(rowIndex + 1, COL_AUSENCIA_INICIO + 1).getValue();
      if (!(inicioAtual instanceof Date) || isNaN(inicioAtual.getTime())) {
        const inicioAusencia = new Date(ultima.getTime() + (limiteAusenciaDias * diaMs));
        shA.getRange(rowIndex + 1, COL_AUSENCIA_INICIO + 1).setValue(inicioAusencia);
      }
    }
    return { status: "ausencia", dias, limite: limiteAusenciaDias };
  }

  const atual = Number(shA.getRange(rowIndex + 1, COL_DIA_PROGRAMA + 1).getValue() || 1);
  shA.getRange(rowIndex + 1, COL_DIA_PROGRAMA + 1).setValue(atual + dias);
  shA.getRange(rowIndex + 1, COL_ULTIMA_ATIVIDADE + 1).setValue(agora);
  if (ausenciaAtual === true) {
    shA.getRange(rowIndex + 1, COL_AUSENCIA_ATIVA + 1).setValue(false);
    shA.getRange(rowIndex + 1, COL_AUSENCIA_INICIO + 1).clearContent();
  }

  return { status: "auto_descanso", dias };
}
