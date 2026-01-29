/**
 * ============================================================
 *   IMPORTADOR OFICIAL FIRESTORE → FEMFLOW 2025 (VERSÃO FINAL)
 * ============================================================
 * ✅ Sem credenciais hardcoded (usa Script Properties)
 * ✅ Suporta importação TOTAL ou dirigida por aba
 * ✅ Mantém paths atuais (normal + personal_)
 *
 * 🔐 Script Properties obrigatórias:
 * - FIREBASE_CLIENT_EMAIL   = firebase-adminsdk-xxxxx@<project>.iam.gserviceaccount.com
 * - FIREBASE_PRIVATE_KEY    = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
 *
 * Obs: FIREBASE_PRIVATE_KEY deve estar com \n (escape) no Script Properties.
 * ============================================================
 */

var FIREBASE_AUTH_PROJECT_ID = "femflow-ebec2";

/* ============================================================
   SERVICE ACCOUNT (Script Properties)
============================================================ */
function getFirebaseServiceAccount_() {
  const props = PropertiesService.getScriptProperties();

  const email = props.getProperty('FIREBASE_CLIENT_EMAIL');
  const key = props.getProperty('FIREBASE_PRIVATE_KEY');

  if (!email || !key) {
    throw new Error('Credenciais Firebase não configuradas em Script Properties (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY)');
  }

  return {
    client_email: email.trim(),
    private_key: key.replace(/\\n/g, '\n')
  };
}

/* ============================================================
   TOKEN FIREBASE (OAuth2 JWT Bearer)
============================================================ */
function getFirebaseAccessToken() {
  const sa = getFirebaseServiceAccount_();
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const encode = (o) => Utilities.base64EncodeWebSafe(JSON.stringify(o));
  const jwt = `${encode(header)}.${encode(claim)}`;
  const sig = Utilities.computeRsaSha256Signature(jwt, sa.private_key);
  const jwtSigned = `${jwt}.${Utilities.base64EncodeWebSafe(sig)}`;

  const resp = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtSigned
    },
    muteHttpExceptions: true
  });

  const code = resp.getResponseCode();
  const txt = resp.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error("Erro ao obter token Firebase [" + code + "]: " + txt);
  }

  const data = JSON.parse(txt);
  if (!data.access_token) throw new Error("Erro ao obter token Firebase: " + txt);
  return data.access_token;
}

/* ============================================================
   IMPORTAÇÃO DIRIGIDA POR ABA
============================================================ */
function importarTreinosFEMFLOW_aba(nomeAba) {
  if (!nomeAba) {
    throw new Error('Nome da aba é obrigatório para importação dirigida');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(nomeAba);

  if (!aba) {
    throw new Error('Aba não encontrada para importação: ' + nomeAba);
  }

  return importarTreinosFEMFLOW({ abasPermitidas: [nomeAba] });
}

/* =======================================================================
   IMPORTAÇÃO TOTAL — NORMAL + PERSONAL
   opts:
     - abasPermitidas: ["Iniciante", "personal_FF-1234", ...] (opcional)
======================================================================= */
function importarTreinosFEMFLOW(opts = {}) {
  const abasPermitidas = Array.isArray(opts.abasPermitidas) ? opts.abasPermitidas : null;

  const token = getFirebaseAccessToken();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abas = ss.getSheets();

  const project = FIREBASE_AUTH_PROJECT_ID;
  const baseURL = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

  Logger.log("🚀 Iniciando importação FEMFLOW 2025...");
  if (abasPermitidas) Logger.log("🎯 Importação dirigida (abasPermitidas): " + JSON.stringify(abasPermitidas));

  let totalOk = 0;
  let totalErr = 0;
  let totalPatches = 0;

  abas.forEach(sh => {
    const nomeAba = sh.getName().trim();

    // ✅ filtro real
    if (abasPermitidas && !abasPermitidas.includes(nomeAba)) {
      return;
    }

    // ------------------------------------------------------------
    // 1) DETECTAR ABA PERSONAL
    // ------------------------------------------------------------
    let isPersonal = false;
    let personalId = "";
    let isExtra = false;

    if (nomeAba.toLowerCase().startsWith("personal_")) {
      isPersonal = true;
      personalId = nomeAba.replace(/personal_/i, "").trim();
      Logger.log("🎨 Aba PERSONAL detectada → ID = " + personalId);
    }
    // ------------------------------------------------------------
    // 2) DETECTAR ABA NORMAL
    // ------------------------------------------------------------
    else if (
      nomeAba !== "Iniciante" &&
      nomeAba !== "Intermediaria" &&
      nomeAba !== "Avancada" &&
      nomeAba !== "Extra"
    ) {
      Logger.log("⏭ Ignorando aba não reconhecida: " + nomeAba);
      return;
    } else if (nomeAba === "Extra") {
      isExtra = true;
    }

    Logger.log("📄 Processando aba: " + nomeAba);

    const stats = importarAbaParaFirestore_(
      sh,
      token,
      baseURL,
      nomeAba,
      isPersonal,
      personalId,
      isExtra
    );
    totalOk += stats.ok;
    totalErr += stats.err;
    totalPatches += stats.patches;
  });

  const resumo = {
    ok: true,
    message: "🎉 Importação FEMFLOW 2025 concluída!",
    total_patches: totalPatches,
    total_ok: totalOk,
    total_err: totalErr
  };

  Logger.log(JSON.stringify(resumo));
  return resumo;
}

/* ============================================================
   IMPORTA UMA ABA (core)
============================================================ */
function importarAbaParaFirestore_(sh, token, baseURL, nomeAba, isPersonal, personalId, isExtra) {
  const valsAll = sh.getDataRange().getValues();
  if (!valsAll || valsAll.length < 2) {
    Logger.log("⚠️ Aba vazia/sem dados: " + nomeAba);
    return { ok: 0, err: 0, patches: 0 };
  }

  const header = valsAll[0].map(h => String(h || '').trim());
  const vals = valsAll.slice(1);

  const col = (name) => header.indexOf(name);

  const idx = {
    id: col("id"), // opcional
    tipo: col("tipo"),
    box: col("box"),
    ordem: col("ordem"),
    enfase: col("enfase"),
    fase: col("fase"),
    dia: col("dia"),

    titulo_pt: col("titulo_pt"),
    titulo_en: col("titulo_en"),
    titulo_fr: col("titulo_fr"),

    link: col("link"),

    series: col("series"),
    reps: col("reps"),
    tempo: col("tempo"),
    distancia: col("distancia"),
    intervalo: col("intervalo"),

    forte: col("forte"),
    leve: col("leve"),
    ciclos: col("ciclos")
  };

  // validações mínimas
  const obrigatorias = isExtra
    ? ["tipo", "enfase", "titulo_pt", "box", "ordem"]
    : ["tipo", "dia", "fase", "enfase", "titulo_pt", "link", "box", "ordem"];
  const faltando = obrigatorias.filter(k => idx[k] === -1);
  if (faltando.length) {
    throw new Error(`Aba "${nomeAba}" sem colunas obrigatórias: ${faltando.join(", ")}`);
  }

  let okCount = 0;
  let errCount = 0;
  let patches = 0;

  vals.forEach((r, i) => {
    if (!r[idx.tipo]) return;

    const tipo = String(r[idx.tipo]).toLowerCase().trim();
    const enfase = removerAcentos(String(r[idx.enfase] || "geral")).toLowerCase();
    const fase = r[idx.fase] ? normalizarFase(r[idx.fase]) : "";
    const diaKey = r[idx.dia] ? `dia_${r[idx.dia]}` : "";

    // ------------------------------------------------------------
    // DEFINIR URL FINAL (NORMAL x PERSONAL)
    // ------------------------------------------------------------
    let url = "";
    if (isPersonal) {
      url = `${baseURL}/personal_trainings/${personalId}/${enfase}/${fase}/dias/${diaKey}/blocos/bloco_${i}`;
    } else if (isExtra) {
      url = `${baseURL}/exercicios_extra/${enfase}/blocos/bloco_${i}`;
    } else {
      const nivel = nomeAba.toLowerCase(); // iniciante/intermediaria/avancada
      url = `${baseURL}/exercicios/${nivel}_${enfase}/fases/${fase}/dias/${diaKey}/blocos/bloco_${i}`;
    }

    // ------------------------------------------------------------
    // CONSTRUIR PAYLOAD
    // ------------------------------------------------------------
    const payload = {
      fields: {
        tipo: { stringValue: tipo },
        box: { stringValue: String(r[idx.box] || "") },
        ordem: { integerValue: Number(r[idx.ordem] || 0) },

        enfase: { stringValue: enfase },
        fase: { stringValue: fase },
        dia: { integerValue: Number(r[idx.dia] || 0) },

        titulo_pt: { stringValue: String(r[idx.titulo_pt] || "") },
        titulo_en: { stringValue: String(r[idx.titulo_en] || "") },
        titulo_fr: { stringValue: String(r[idx.titulo_fr] || "") },

        link: { stringValue: String(r[idx.link] || "") },

        series: { stringValue: String(r[idx.series] || "") },
        reps: { stringValue: String(r[idx.reps] || "") },

        tempo: { stringValue: String(r[idx.tempo] || "") },
        distancia: { stringValue: String(r[idx.distancia] || "") },
        intervalo: { stringValue: String(r[idx.intervalo] || "") },

        forte: { stringValue: String(r[idx.forte] || "") },
        leve: { stringValue: String(r[idx.leve] || "") },
        ciclos: { stringValue: String(r[idx.ciclos] || "") }
      }
    };

    // ------------------------------------------------------------
    // ENVIAR PARA FIRESTORE
    // ------------------------------------------------------------
    const resp = UrlFetchApp.fetch(url, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    patches++;

    const code = resp.getResponseCode();
    if (code === 200) {
      okCount++;
      Logger.log(`✅ OK → ${nomeAba} | ${fase} | ${diaKey} | linha ${i}`);
    } else {
      errCount++;
      Logger.log(`❌ ERRO [${code}] → ${nomeAba} | ${fase} | ${diaKey} | linha ${i} | ${resp.getContentText()}`);
    }
  });

  return { ok: okCount, err: errCount, patches };
}

/* ============================================================
   FUNÇÕES AUXILIARES
============================================================ */
function removerAcentos(t) {
  return String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizarFase(f) {
  if (!f) return "follicular";

  f = String(f).toLowerCase().trim();
  const mapa = {
    ovulatory: "ovulatoria",
    ovulatoria: "ovulatoria",
    "ovulatório": "ovulatoria",

    follicular: "follicular",
    folicular: "follicular",

    luteal: "lutea",
    lutea: "lutea",

    menstrual: "menstrual",
    menstruacao: "menstrual"
  };

  return mapa[f] || "follicular";
}



/* ============================================================
   TESTES RÁPIDOS (rodar manualmente)
============================================================ */
function TEST_importar_tudo_femflow() {
  const r = importarTreinosFEMFLOW({ target: "femflow" });
  Logger.log(JSON.stringify(r, null, 2));
}
function TEST_importar_iniciante_femflow() {
  const r = importarTreinosFEMFLOW_aba("Iniciante", { target: "femflow" });
  Logger.log(JSON.stringify(r, null, 2));
}
function TEST_importar_intermediaria_femflow() {
  const r = importarTreinosFEMFLOW_aba("Intermediaria", { target: "femflow" });
  Logger.log(JSON.stringify(r, null, 2));
}
function TEST_importar_avancada_femflow() {
  const r = importarTreinosFEMFLOW_aba("Avancada", { target: "femflow" });
  Logger.log(JSON.stringify(r, null, 2));
}
function TEST_importar_tudo_maleflow() {
  const r = importarTreinosFEMFLOW({ target: "maleflow" });
  Logger.log(JSON.stringify(r, null, 2));

}


function TEST_importar_iniciante_maleflow() {
  const r = importarTreinosFEMFLOW_aba("Iniciante", { target: "maleflow" });
  Logger.log(JSON.stringify(r, null, 2));
}

function TEST_token_maleflow() {
  const token = getFirebaseAccessToken("maleflow");
  Logger.log(token);
}
