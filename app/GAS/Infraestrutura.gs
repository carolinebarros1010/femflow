/* ======================================================
 *  SALVAR EVOLUÇÃO — FEMFLOW (VERSÃO FINAL ESTÁVEL)
 * ------------------------------------------------------
 * Finalidade:
 * - Registrar evolução de carga (peso, reps, séries, PSE)
 * - Atualizar último peso por exercício
 *
 * Regras estruturais:
 * ✅ NÃO avança DiaPrograma
 * ✅ NÃO altera Fase ou Dia do Ciclo na planilha
 * ✅ Fase é calculada dinamicamente a partir do startDate
 *    (manual ou fisiológico), usando o motor oficial
 *
 * Fonte da verdade:
 * - Tempo (startDate / manualStart) define fase e dia
 * - Programa só avança em treino ou descanso
 * - Evolução é evento neutro no ciclo
 *
 * Segurança:
 * - Sessão validada (_assertSession_)
 * - Device lock ativo
 *
 * Compatível com:
 * - Perfil regular
 * - Perfil irregular
 * - Perfil energético / DIU / menopausa
 *
 * FemFlow Cycle Engine • 2025
 * ====================================================== */

/* ============================================================
 * 🌸 BLOCO 1 — INFRAESTRUTURA BASE
 * ============================================================ */


/* ============================================================
 * 🔹 1) PADRÃO DE RESPOSTA — JSON
 * ============================================================ */
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOK_(obj) {
  return _json(obj);
}

/**
 * Script Properties salva valores como string plana.
 * A chave RSA vem com "\n" literal e precisa ser convertida para quebra real.
 */
function getFirebasePrivateKey_() {
  const rawKey = PropertiesService
    .getScriptProperties()
    .getProperty("FIREBASE_PRIVATE_KEY");

  if (!rawKey) return "";

  // Converte os \n literais em quebras reais para uso seguro em JWT/assinatura.
  return String(rawKey).replace(/\\n/g, "\n");
}


/* ============================================================
 * 🔹 2) UTILITÁRIOS DE PLANILHA
 * ============================================================ */
let APP_CONTEXT = "femflow";

function normalizeAppContext_(raw) {
  const value = String(raw || "").toLowerCase().trim();
  if (value === "maleflow" || value === "male") return "maleflow";
  return "femflow";
}

function setAppContext_(raw) {
  APP_CONTEXT = normalizeAppContext_(raw);
}

function resolveSheetName_(name) {
  if (name === SHEET_ALUNAS) {
    return APP_CONTEXT === "maleflow" ? SHEET_ALUNOS : SHEET_ALUNAS;
  }
  return name;
}

function _sheet(name) {
  return SpreadsheetApp.getActive().getSheetByName(resolveSheetName_(name));
}

function _norm(value) {
  return String(value == null ? "" : value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Garante que a aba existe e tem o cabeçalho correto
 * ✅ Atualiza a linha 1 (não insere nova linha)
 * ✅ Expande colunas se precisar
 */
function ensureSheet(name, header) {
  const ss = SpreadsheetApp.getActive();
  const resolvedName = resolveSheetName_(name);
  let sh = ss.getSheetByName(resolvedName);

  if (!sh) {
    sh = ss.insertSheet(resolvedName);
    sh.getRange(1, 1, 1, header.length).setValues([header]);
    return sh;
  }

  // Se existir mas estiver vazia
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, header.length).setValues([header]);
    return sh;
  }

  const lastCol = Math.max(sh.getLastColumn(), 1);
  const firstRow = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  const existing = firstRow.map((v) => String(v || "").trim());

  // Expande apenas com colunas faltantes, preservando ordem existente para não quebrar índices legados.
  const missing = header.filter((h) => existing.indexOf(h) === -1);
  if (missing.length) {
    const maxCols = sh.getMaxColumns();
    sh.insertColumnsAfter(maxCols, missing.length);
    sh.getRange(1, maxCols + 1, 1, missing.length).setValues([missing]);
  }

  // Se houver células vazias no prefixo do header oficial, preenche por posição.
  const colsToCheck = Math.max(header.length, sh.getLastColumn());
  const currentPrefix = sh.getRange(1, 1, 1, colsToCheck).getValues()[0];
  const patched = currentPrefix.slice();
  let changed = false;
  for (let i = 0; i < header.length; i++) {
    const cur = String(currentPrefix[i] || "").trim();
    if (!cur) {
      patched[i] = header[i];
      changed = true;
    }
  }
  if (changed) {
    sh.getRange(1, 1, 1, colsToCheck).setValues([patched]);
  }

  return sh;
}

/* ============================================================
 * 🔹 3) GERADOR DE IDs (unificado)
 * ============================================================ */
function gerarID() {
  const ts = Utilities.formatDate(new Date(), "GMT-3", "yyMMdd");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return "FF-" + ts + "-" + rand;
}

/* ============================================================
 * 🔹 4) LOG INTERNO — Upgrade / Eventos
 * ============================================================ */
function _logUpgrade(entry) {
  const ss = SpreadsheetApp.getActive();
  let log = ss.getSheetByName("Logs");
  if (!log) log = ss.insertSheet("Logs");

  log.appendRow([
    new Date(),
    entry.id || "",
    entry.nivel || "",
    entry.origem || "",
    entry.status || "",
    entry.obs || ""
  ]);
}



/* ============================================================
 * 🔧 parseBody_ — aceita JSON, e.parameter, querystring
 * ============================================================ */
function parseBody_(e) {
  const raw  = (e && e.postData && e.postData.contents) ? e.postData.contents : "";
  const type = (e && e.postData && e.postData.type) ? String(e.postData.type).toLowerCase() : "";

  // 1) tenta JSON
  try {
    if (raw && (type.includes("application/json") || raw.trim().startsWith("{"))) {
      return JSON.parse(raw);
    }
  } catch (_) {}

  // 1.1) payload=<json> (alguns serviços mandam assim)
  try {
    if (raw && raw.startsWith("payload=")) {
      const p = decodeURIComponent(raw.substring("payload=".length));
      if (p.trim().startsWith("{")) return JSON.parse(p);
    }
  } catch (_) {}

  // 2) fallback: parâmetros já parseados
  if (e && e.parameter && Object.keys(e.parameter).length) {
    return Object.assign({}, e.parameter);
  }

  // 3) fallback: querystring manual
  if (raw && raw.includes("=")) {
    const obj = {};
    raw.split("&").forEach(kv => {
      const parts = kv.split("=");
      const k = decodeURIComponent(parts[0] || "");
      const v = decodeURIComponent(parts.slice(1).join("=") || "");
      obj[k] = v;
    });
    return obj;
  }

  return {};
}






/* ======================================================
 * 🟦 CADASTRO FEMFLOW 2025 — com pontuação de anamnese
 * ====================================================== */
function _calcularPontuacaoAnamnese(anamneseJSON) {
  if (!anamneseJSON) return 0;
  try {
    const obj = JSON.parse(anamneseJSON);
    if (obj && typeof obj === "object" && obj.respostas) {
      const premium = calcularNivelPremium(obj.respostas, obj.objetivo);
      return Number(premium.scoreFinal || 0);
    }
    let score = 0;
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const n = Number(obj[keys[i]]);
      if (!isNaN(n)) score += n;
    }
    return score;
  } catch (e) {
    return 0;
  }
}


function _parseCaminhoNumero_(data) {
  const payload = data && typeof data === "object" ? data : {};
  const candidates = [
    payload.caminhoNumero,
    payload.caminho,
    payload.ultimoCaminho,
    payload.ultimo_caminho,
    payload.path,
    payload.pathNumber
  ];

  for (let i = 0; i < candidates.length; i++) {
    const raw = candidates[i];
    if (raw === undefined || raw === null) continue;

    const asString = String(raw).trim();
    if (!asString) continue;

    const direct = Number(asString);
    if (Number.isInteger(direct) && direct >= 1 && direct <= 5) {
      return direct;
    }

    const match = asString.match(/([1-5])/);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

function _normalizarRespostasPremium_(respostas) {
  const raw = respostas && typeof respostas === "object" ? respostas : {};
  const out = [];
  for (let i = 1; i <= 12; i++) {
    const valor = Number(raw["q" + i]);
    out.push(Math.max(0, Math.min(3, isNaN(valor) ? 0 : valor)));
  }
  return out;
}

function calcularNivelPremium(respostas, objetivo) {
  const answers = _normalizarRespostasPremium_(respostas);
  const tecnicoRaw = answers[0] + answers[1] + answers[2];
  const consistenciaRaw = answers[3] + answers[4] + answers[5];
  const intensidadeRaw = answers[6] + answers[7] + answers[8];
  const recuperacaoRaw = answers[9] + answers[10] + answers[11];

  const tecnico = (tecnicoRaw / 9) * 100;
  const consistencia = (consistenciaRaw / 9) * 100;
  const intensidade = (intensidadeRaw / 9) * 100;
  const recuperacao = (recuperacaoRaw / 9) * 100;

  const pesosPorObjetivo = {
    iniciar: { tecnico: 0.35, consistencia: 0.30, intensidade: 0.15, recuperacao: 0.20 },
    emagrecimento: { tecnico: 0.30, consistencia: 0.30, intensidade: 0.20, recuperacao: 0.20 },
    definicao: { tecnico: 0.30, consistencia: 0.25, intensidade: 0.30, recuperacao: 0.15 },
    performance: { tecnico: 0.35, consistencia: 0.20, intensidade: 0.30, recuperacao: 0.15 }
  };

  const pesosBase = { tecnico: 0.30, consistencia: 0.25, intensidade: 0.25, recuperacao: 0.20 };
  const objetivoNorm = String(objetivo || "").toLowerCase().trim();
  const pesos = pesosPorObjetivo[objetivoNorm] || pesosBase;

  const scoreFinal =
    tecnico * pesos.tecnico +
    consistencia * pesos.consistencia +
    intensidade * pesos.intensidade +
    recuperacao * pesos.recuperacao;

  let nivel = "iniciante";
  if (scoreFinal >= 70) nivel = "avancada";
  else if (scoreFinal >= 45) nivel = "intermediaria";

  if (nivel === "avancada" && (tecnico < 40 || recuperacao < 35)) {
    nivel = "intermediaria";
  }

  return {
    nivel,
    scoreFinal: Math.round(scoreFinal * 100) / 100,
    detalhado: {
      tecnico: Math.round(tecnico * 100) / 100,
      consistencia: Math.round(consistencia * 100) / 100,
      intensidade: Math.round(intensidade * 100) / 100,
      recuperacao: Math.round(recuperacao * 100) / 100
    }
  };
}


/* ======================================================
 * 🟦 LEAD PARCIAL
 * ====================================================== */
function _registrarLead(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Leads") || ss.insertSheet("Leads");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Data", "Nome", "Email", "Telefone", "Origem"]);
  }

  sheet.appendRow([
    new Date().toISOString(),
    data.nome || "",
    data.email || "",
    data.telefone || "",
    data.origem || "Anamnese FemFlow"
  ]);

  return { status: "ok", msg: "Lead parcial salvo", email: data.email };
}


/* ======================================================
 * 🔹 HISTÓRICO COMPARTILHADO
 * ====================================================== */
function _historico(id, n) {
  n = Math.max(1, Math.min(Number(n) || 30, 120));
  const out = { diario: [], treinos: [] };
  const ss = SpreadsheetApp.getActive();
  const diario = ss.getSheetByName("Diario");

  if (diario) {
    const vals = diario.getDataRange().getValues();
    for (let i = vals.length - 1; i >= 1 && out.diario.length < n; i--) {
      if (String(vals[i][0]).trim() === String(id).trim()) {
        out.diario.push({
          data: vals[i][1],
          fase: vals[i][2],
          semana: vals[i][3],
          treino: vals[i][4],
          tipo: vals[i][5],
          descanso: !!vals[i][6],
          obs: vals[i][7] || ""
        });
      }
    }
  }

  const treinos = ss.getSheetByName("Treinos");
  if (treinos) {
    const valsT = treinos.getDataRange().getValues();
    for (let j = valsT.length - 1; j >= 1 && out.treinos.length < n; j--) {
      if (String(valsT[j][0]).trim() === String(id).trim()) {
        out.treinos.push({
          data: valsT[j][1],
          fase: valsT[j][2],
          diaPrograma: valsT[j][3],
          pse: Number(valsT[j][4]) || null
        });
      }
    }
  }

  out.diario.reverse();
  out.treinos.reverse();
  return out;
}

function _normFase(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim();
}

/* ======================================================
 * 🔹 Atualizações simples
 * ====================================================== */
function atualizarEnfase(id, enfase) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === String(id).trim()) {
      sh.getRange(i + 1, 13).setValue(String(enfase || "").toLowerCase());
      return { status: "ok", id: id, enfase: enfase };
    }
  }
  return { status: "notfound", id: id };
}

/* ======================================================
 * 🔹 ÚLTIMO PESO
 * ====================================================== */
function getUltimoPeso_(data) {
  const id = String(data.id || "").trim();
  const exercicio = String(data.exercicio || "").trim();
  const chave = exercicio.toLowerCase().trim();

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName("UltimosPesos");
  if (!sh) return { status: "ok", peso: "" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id && rows[i][1] === chave) {
      return { status: "ok", peso: rows[i][2] || "" };
    }
  }

  return { status: "ok", peso: "" };
}

/* ======================================================
 * 🔹 SET NÍVEL
 * ====================================================== */
function setnivel(id, nivel) {
  const sh = _sheet(SHEET_ALUNAS);
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === String(id).trim()) {
      sh.getRange(i + 1, 9).setValue(String(nivel || "iniciante").toLowerCase());
      Logger.log("📈 NÍVEL atualizado → " + id + " → " + nivel);
      return { status: "ok", id: id, nivel: nivel };
    }
  }

  return { status: "notfound", id: id };
}
/* ======================================================
 * 🧾 LOG DO CICLO — FEMFLOW
 * ====================================================== */
function logCiclo_(id, evento, origem, antes, depois, obs) {
  const sh = _sheet("LogsCiclo");
  if (!sh) return;

  sh.appendRow([
    new Date(),               // Data
    String(id || ""),         // ID
    String(evento || ""),     // Evento
    String(origem || ""),     // Origem (setciclo / sync / validar / manual)
    antes !== undefined ? JSON.stringify(antes) : "",
    depois !== undefined ? JSON.stringify(depois) : "",
    String(obs || "")
  ]);
}
