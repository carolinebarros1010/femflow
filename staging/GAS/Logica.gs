/* ============================================================
 * 🌙 STARGATE — CÁLCULO REAL DO CICLO FEMFLOW 2025
 * ============================================================ */
function calcularCicloReal(params) {
  params = params || {};
  const {
    startDate,
    cicloDuracao,
    perfilHormonal,
    nivel,
    faseSalva,
    diaCicloSalvo
  } = params;
  const hoje = new Date();

  // 🛑 1. Corrigir datas ruins
  let inicio = new Date(startDate);
  if (isNaN(inicio.getTime()) || inicio.getFullYear() < 1990) {
    inicio = new Date();
  }

  const diff = Math.floor((hoje - inicio) / 86400000);

  const length = Number(cicloDuracao) > 0 ? Number(cicloDuracao) : 28;

  const pos = ((diff % length) + length) % length;
  const dia = pos + 1;

  const perfil = perfilHormonal
  ? String(perfilHormonal).toLowerCase()
  : null;

  if (!perfil) {
  // Não inventar perfil
  return {
    fase: faseSalva || "menstrual",
    dia: diaCicloSalvo || 1
  };
}


  const nivelNorm = (nivel || "iniciante").toLowerCase();

 // ✅ PERFIS REGULAR / DIU / ENERGÉTICO / MENOPAUSA
// Agora seguem o MESMO ciclo fisiológico de 28 dias (treinos no Firebase = 1..28).
if (perfil === "regular" || perfil === "diu") {
  if (dia <= 5)  return { fase: "menstrual", dia };
  if (dia <= 13) return { fase: "follicular", dia };
  if (dia <= 17) return { fase: "ovulatoria", dia };
  return { fase: "lutea", dia: Math.max(18, dia) };
}

if (perfil === "energetico" || perfil === "menopausa" || perfil === "diu_hormonal") {
  const d = ((diff % cicloDuracao) + cicloDuracao) % cicloDuracao + 1;

  if (d <= 5)  return { fase: "menstrual", dia: d };
  if (d <= 13) return { fase: "follicular", dia: d };
  if (d <= 17) return { fase: "ovulatoria", dia: d };
  return { fase: "lutea", dia: Math.max(18, d) };
}


/**
 * PERFIL IRREGULAR — REGRA FEMFLOW
 * --------------------------------
 * DiaCiclo NÃO é cronológico.
 * É ancorado no início fisiológico da fase:
 * - Menstrual   → dia 1
 * - follicular   → dia 6
 * - Ovulatória  → dia 14
 * - Lútea       → dia 18
 *
 * O tempo (diff) serve apenas para identificar a fase.
 */

if (perfil === "irregular") {

  const d = ((diff % 28) + 28) % 28 + 1;

  if (d <= 5) {
    return { fase: "menstrual", dia: d };
  }

  if (d <= 13) {
    return { fase: "follicular", dia: d };
  }

  if (d <= 17) {
    return { fase: "ovulatoria", dia: d };
  }

  // 🔒 GARANTIA: lútea nunca abaixo de 18
  return {
    fase: "lutea",
    dia: Math.max(18, d)
  };
}



return { fase: faseSalva || "follicular", dia: diaCicloSalvo || 1 };

}

/* ======================================================
 * 🌸 SET CICLO — OPÇÃO A (STARTDATE RETROATIVO)
 * ------------------------------------------------------
 * Objetivo:
 * - Recebe diaCicloInicial (1..28)
 * - Calcula DataInicio real de forma retroativa
 * - Atualiza IMEDIATAMENTE:
 *   • DataInicio
 *   • Fase (N)
 *   • DiaCiclo (O)
 *
 * Decisões:
 * ✅ VALIDAR passa a ser corretivo, não primário
 * ====================================================== */
function setCiclo_(data) {
  
    const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const id = String(data.id || "").trim();
  if (!id) return { status: "error", msg: "missing_id" };

  const values = sh.getDataRange().getValues();

  /* ===============================
     Helpers locais
  =============================== */
  const _today0 = () => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  };

  const _toDateSafe = (d) => {
    const dt = new Date(d);
    if (!(dt instanceof Date) || isNaN(dt.getTime()) || dt.getFullYear() < 1990) return null;
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const _clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const fasePorDia = (dia) => {
    if (dia <= 5)  return "menstrual";
    if (dia <= 13) return "follicular";
    if (dia <= 17) return "ovulatoria";
    return "lutea";
  };

  /* ===============================
     Loop de busca
  =============================== */
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (String(r[0]).trim() !== id) continue;

    const linha = i + 1;

    /* ===============================
       1) CicloDuracao (J)
    =============================== */
    const cicloDuracao = _clamp(
      Number(data.cicloDuracao) || Number(r[9]) || 28,
      21,
      35
    );
    sh.getRange(linha, 10).setValue(cicloDuracao);

    /* ===============================
       2) Dia do ciclo (intenção explícita)
    =============================== */
    const diaRaw = data.diaCicloInicial ?? data.diaCiclo ?? null;
    const diaCicloFinal = _clamp(Number(diaRaw) || 1, 1, cicloDuracao);

    /* ===============================
       3) DataInicio retroativa (K)
    =============================== */
    let dataInicioFinal = null;

    if (diaRaw !== null && diaRaw !== undefined && String(diaRaw).trim() !== "") {
      const base = _today0();
      base.setDate(base.getDate() - (diaCicloFinal - 1));
      dataInicioFinal = base;
    } else if (data.dataInicio) {
      dataInicioFinal = _toDateSafe(data.dataInicio);
    }

    if (dataInicioFinal) {
      sh.getRange(linha, 11).setValue(dataInicioFinal);
    }

    /* ===============================
       4) Fase fisiológica (N)
    =============================== */
    const faseFinal = fasePorDia(diaCicloFinal);
    sh.getRange(linha, 14).setValue(faseFinal);

    /* ===============================
       5) DiaCiclo (O)
    =============================== */
    sh.getRange(linha, 15).setValue(diaCicloFinal);

    /* ===============================
       7) DiaPrograma
    =============================== */
    sh.getRange(linha, COL_DIA_PROGRAMA + 1).setValue(Number(data.diaPrograma) || 1);

    /* ===============================
       8) DataInicioPrograma
    =============================== */
    if (!r[COL_DATA_INICIO_PROGRAMA]) {
      sh.getRange(linha, COL_DATA_INICIO_PROGRAMA + 1).setValue(new Date());
    }

    /* ===============================
       Retorno
    =============================== */
    return {
      status: "ok",
      id,
      cicloDuracao,
      dataInicio: dataInicioFinal ? dataInicioFinal.toISOString() : null,
      fase: faseFinal,
      diaCiclo: diaCicloFinal
    };
  }

  return { status: "notfound" };
}


/* ======================================================
 * 🔹 Motor de Treino HÍBRIDO (resumo — usado pelo front)
 * ====================================================== */
function _resolverPerfil(id) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return null;

  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    const r = vals[i];
    if (String(r[0]).trim() === String(id).trim()) {
      return {
        id: r[0],
        nome: r[1],
        email: r[2],
        produto: r[5] || "",
        ativo: !!r[7],
        nivel: String(r[8] || "iniciante").toLowerCase(),
        cicloDuracao: Number(r[9] || 28),
        dataInicio: r[10] || new Date(),
        link_planilha: r[11] || "",
        enfase: _norm(r[12] || "nenhuma"),
        fase: _norm(r[13] || "follicular"),
        diaCiclo: Number(r[14] || 1)
      };
    }
  }
  return null;
}
function resolverDiaTreino(params) {
  params = params || {};
  const { perfilHormonal, nivel, diaCiclo, diaPrograma } = params;

  // PERFIL ENERGÉTICO
  if (perfilHormonal === "energetico") {

    const faseAlta = {
      iniciante: "lutea",
      intermediaria: "follicular",
      avancada: "ovulatoria"
    };

    return {
      fase: faseAlta[nivel] || "follicular",
      diaTreino: ((diaPrograma - 1) % 7) + 1,
      fonte: "programa"
    };
  }

  // PERFIS BIOLÓGICOS
  return {
    fase: fasePorDiaCiclo_(diaCiclo),
    diaTreino: diaCiclo,
    fonte: "ciclo"
  };
}

/* ======================================================
 * 🧬 Perfil Hormonal — removido da planilha
 * ====================================================== */
function setPerfilHormonal(id, perfil) {
  if (!id) return { status: "error", msg: "missing_id" };
  if (!perfil) return { status: "error", msg: "missing_perfil" };
  return { status: "ignored", msg: "perfil_hormonal_removido" };
}


function fasePorDiaCiclo_(dia) {
  const d = Number(dia) || 1;
   if (dia <= 5)  return "menstrual";
  if (dia <= 13) return "follicular";
  if (dia <= 17) return "ovulatoria";
  return "lutea";
}

/* ======================================================
 * 🔄 FASE ATUAL — FONTE ÚNICA
 * Coluna N (Fase) = índice 13
 * ====================================================== */
function calcularEFixarFase_(id) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return null;

  const idNorm = String(id || "").trim();
  if (!idNorm) return null;

  const vals = sh.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() !== idNorm) continue;

    const diaCiclo       = Number(vals[i][14] || 1); // O
    const cicloDuracao   = Number(vals[i][9]  || 28); // J

    const d = Math.max(1, Math.min(diaCiclo, cicloDuracao));

    let fase = "menstrual";
    if (d <= 5) fase = "menstrual";
    else if (d <= 13) fase = "follicular";
    else if (d <= 17) fase = "ovulatoria";
    else fase = "lutea";

    /* ============================
       ✍️ ESCREVER FASE
    ============================ */
    sh.getRange(i + 1, 14).setValue(fase); // coluna N

    return fase;
  }

  return null;
}

/**
 * 🔄 SYNC — Atualiza DiaCiclo/Fase com base em DataInicio
 * - Usa cálculo oficial de fase
 * - Retorna estado atualizado para o front
 */
function sync(id) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const idNorm = String(id || "").trim();
  if (!idNorm) return { status: "error", msg: "missing_id" };

  const vals = sh.getDataRange().getValues();

  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() !== idNorm) continue;

    const linha = i + 1;

    const dataInicio = vals[i][10]; // col 11
    const cicloDuracao = Number(vals[i][9] || 28); // col 10
    const dataInicioDate =
      dataInicio instanceof Date ? dataInicio : new Date(dataInicio);
    const hasDataInicio =
      dataInicio instanceof Date && !isNaN(dataInicio.getTime());

    const startBase = dataInicioDate;

    if (!(startBase instanceof Date) || isNaN(startBase.getTime())) {
      return { status: "error", msg: "invalid_data_inicio" };
    }

    const ciclo = calcularCicloReal({
      startDate: startBase,
      cicloDuracao,
      faseSalva: vals[i][13],
      diaCicloSalvo: vals[i][14]
    });

    sh.getRange(linha, 15).setValue(ciclo.dia);

    const faseAtual = fasePorDiaCiclo_(ciclo.dia);
    sh.getRange(linha, 14).setValue(faseAtual);

    return {
      status: "ok",
      modo: "auto",
      diaCiclo: ciclo.dia,
      fase: faseAtual,
      dataInicio: hasDataInicio ? dataInicio : startBase
    };
  }

  return { status: "notfound", id: idNorm };
}
