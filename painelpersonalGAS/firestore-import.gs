/**
 * ============================================================
 *   IMPORTADOR OFICIAL FIRESTORE → FEMFLOW/MALEFLOW (VERSÃO FINAL)
 * ============================================================
 * ✅ Sem credenciais hardcoded (usa Script Properties)
 * ✅ Suporta importação TOTAL ou dirigida por aba
 * ✅ Auto-detecta schema:
 *    - FemFlow: fase + dia
 *    - MaleFlow: ciclo + diatreino
 * ✅ Suporta target/app:
 *    - femflow  (default)
 *    - maleflow
 * ✅ Limite: máx 10 linhas tipo "treino" por dia (por fase+dia ou ciclo+diatreino)
 * ✅ Ordem 1..N dentro de cada box (vem da planilha; importador só respeita)
 *
 * 🔐 Script Properties recomendadas:
 * (1) Project IDs
 * - FIREBASE_PROJECT_ID_FEMFLOW = femflow-ebec2
 * - FIREBASE_PROJECT_ID_MALEFLOW = male-flow
 *
 * (2) Service Account (opção A: por target — recomendado)
 * - FEMFLOW_FIREBASE_CLIENT_EMAIL
 * - FEMFLOW_FIREBASE_PRIVATE_KEY
 * - MALEFLOW_FIREBASE_CLIENT_EMAIL
 * - MALEFLOW_FIREBASE_PRIVATE_KEY
 *
 * (3) Service Account (opção B: fallback legado — opcional)
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 *
 * Obs: *_PRIVATE_KEY deve estar com \n (escape) no Script Properties.
 * ============================================================
 */

/* ============================================================
   TARGET / PROJECT ID
============================================================ */
function getFirebaseProjectId_(target) {
  const t = String(target || "femflow").toLowerCase().trim();
  const props = PropertiesService.getScriptProperties();

  const fem = props.getProperty("FIREBASE_PROJECT_ID_FEMFLOW") || "femflow-ebec2";
  const male = props.getProperty("FIREBASE_PROJECT_ID_MALEFLOW") || "male-flow";

  if (t === "maleflow" || t === "male-flow" || t === "male") return male;
  return fem;
}

/* ============================================================
   SERVICE ACCOUNT (Script Properties)
   - tenta por target primeiro (recomendado)
   - fallback: FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
============================================================ */
function getFirebaseServiceAccount_(target) {
  const t = String(target || "femflow").toLowerCase().trim();
  const props = PropertiesService.getScriptProperties();

  // recomendado: por target
  const emailProp =
    (t === "maleflow" || t === "male-flow" || t === "male")
      ? "MALEFLOW_FIREBASE_CLIENT_EMAIL"
      : "FEMFLOW_FIREBASE_CLIENT_EMAIL";

  const keyProp =
    (t === "maleflow" || t === "male-flow" || t === "male")
      ? "MALEFLOW_FIREBASE_PRIVATE_KEY"
      : "FEMFLOW_FIREBASE_PRIVATE_KEY";

  let email = props.getProperty(emailProp);
  let key = props.getProperty(keyProp);

  // fallback legado
  if (!email || !key) {
    email = email || props.getProperty("FIREBASE_CLIENT_EMAIL");
    key = key || props.getProperty("FIREBASE_PRIVATE_KEY");
  }

  if (!email || !key) {
    throw new Error(
      "Credenciais Firebase não configuradas em Script Properties. " +
        "Use (recomendado): FEMFLOW_FIREBASE_* e MALEFLOW_FIREBASE_* " +
        "ou (fallback): FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY."
    );
  }

  return {
    client_email: String(email).trim(),
    private_key: String(key).replace(/\\n/g, "\n"),
  };
}

/* ============================================================
   TOKEN FIREBASE (OAuth2 JWT Bearer)
============================================================ */
function getFirebaseAccessToken(target) {
  const sa = getFirebaseServiceAccount_(target);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (o) => Utilities.base64EncodeWebSafe(JSON.stringify(o));
  const jwt = `${encode(header)}.${encode(claim)}`;
  const sig = Utilities.computeRsaSha256Signature(jwt, sa.private_key);
  const jwtSigned = `${jwt}.${Utilities.base64EncodeWebSafe(sig)}`;

  const resp = UrlFetchApp.fetch("https://oauth2.googleapis.com/token", {
    method: "post",
    payload: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwtSigned,
    },
    muteHttpExceptions: true,
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
function importarTreinosFEMFLOW_aba(nomeAba, opts = {}) {
  if (!nomeAba) throw new Error("Nome da aba é obrigatório para importação dirigida");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const aba = ss.getSheetByName(nomeAba);
  if (!aba) throw new Error("Aba não encontrada para importação: " + nomeAba);

  return importarTreinosFEMFLOW({
    abasPermitidas: [nomeAba],
    target: opts.target || opts.app || "femflow",
  });
}

/* =======================================================================
   IMPORTAÇÃO TOTAL — NORMAL + PERSONAL
   opts:
     - abasPermitidas: ["Iniciante", "personal_FF-1234", ...] (opcional)
     - target: "femflow" | "maleflow" (default femflow)
======================================================================= */
function importarTreinosFEMFLOW(opts = {}) {
  const abasPermitidas = Array.isArray(opts.abasPermitidas) ? opts.abasPermitidas : null;
  const target = normalizarTargetLocal_(opts.target || opts.app || "femflow");

  const token = getFirebaseAccessToken(target);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abas = ss.getSheets();

  const project = getFirebaseProjectId_(target);
  const baseURL = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
  const importId = Utilities.formatDate(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'");

  Logger.log("🚀 Iniciando importação " + target.toUpperCase() + "...");
  Logger.log("🔥 projectId: " + project);
  Logger.log("🧾 importId: " + importId);
  if (abasPermitidas) Logger.log("🎯 Importação dirigida (abasPermitidas): " + JSON.stringify(abasPermitidas));

  let totalOk = 0;
  let totalErr = 0;
  let totalPatches = 0;
  const maleDias = [];

  abas.forEach((sh) => {
    const nomeAba = sh.getName().trim();

    // ✅ filtro real
    if (abasPermitidas && !abasPermitidas.includes(nomeAba)) return;

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
    } else if (nomeAba.toLowerCase().startsWith("endurance_")) {
      isPersonal = true;
      personalId = nomeAba.replace(/endurance_/i, "").trim();
      Logger.log("🏃‍♀️ Aba ENDURANCE detectada → ID = " + personalId);
    }
    // ------------------------------------------------------------
    // 2) DETECTAR ABA NORMAL
    // ------------------------------------------------------------
    else {
      const nomeAbaLower = nomeAba.toLowerCase();
      const isAbaNivelPadrao = ["iniciante", "intermediaria", "avancada"].includes(nomeAbaLower);
      const isAbaExtra = nomeAbaLower === "extra";
      const isAbaEndurancePublic = nomeAbaLower === "endurancepublic";

      if (!isAbaNivelPadrao && !isAbaExtra && !isAbaEndurancePublic) {
        Logger.log("⏭ Ignorando aba não reconhecida: " + nomeAba);
        return;
      }

      if (isAbaExtra) {
        isExtra = true;
      }
    }

    Logger.log("📄 Processando aba: " + nomeAba);

    const stats = importarAbaParaFirestore_(
      sh,
      token,
      baseURL,
      nomeAba,
      isPersonal,
      personalId,
      isExtra,
      importId,
      target
    );

    totalOk += stats.ok;
    totalErr += stats.err;
    totalPatches += stats.patches;
    if (stats.dias && stats.dias.length) {
      stats.dias.forEach((dia) => maleDias.push(dia));
    }
  });

  const resumo = {
    ok: true,
    message: "🎉 Importação concluída!",
    target,
    projectId: project,
    total_patches: totalPatches,
    total_ok: totalOk,
    total_err: totalErr,
  };
  if (target === "maleflow") {
    resumo.dias = maleDias;
  }

  Logger.log(JSON.stringify(resumo));
  return resumo;
}

/* ============================================================
   IMPORTA UMA ABA (core)
============================================================ */
function importarAbaParaFirestore_(sh, token, baseURL, nomeAba, isPersonal, personalId, isExtra, importId, target) {
  const targetNorm = normalizarTargetLocal_(target);
  const isMaleFlowTarget = targetNorm === "maleflow";
    // ✅ MaleFlow: SEMPRE usar doc único bloco_100 quando houver colunas ciclo+diatreino
  // (inclui NORMAL, PERSONAL e EXTRA)
  if (isMaleFlowTarget) {
    // se a aba tiver colunas ciclo/diatreino, usamos importador MaleFlow (doc único)
    const header = sh.getDataRange().getValues()?.[0]?.map(h => String(h || "").trim()) || [];
    const hasCiclo = header.indexOf("ciclo") !== -1;
    const hasDiaTreino = header.indexOf("diatreino") !== -1;

    if (hasCiclo && hasDiaTreino) {
      return importarAbaMaleFlow_(
        sh,
        token,
        baseURL,
        nomeAba,
        importId,
        targetNorm,
        { isPersonal, personalId, isExtra } // ✅ novo
      );
    }
  }

  const valsAll = sh.getDataRange().getValues();
  if (!valsAll || valsAll.length < 2) {
    Logger.log("⚠️ Aba vazia/sem dados: " + nomeAba);
    return { ok: 0, err: 0, patches: 0 };
  }

  const header = valsAll[0].map((h) => String(h || "").trim());
  const vals = valsAll.slice(1);

  const col = (name) => header.indexOf(name);
  const colAlias = (...aliases) => getColIndexByAliases_(header, aliases);

  const idx = {
    id: col("id"), // opcional
    tipo: col("tipo"),
    box: col("box"),
    ordem: col("ordem"),
    enfase: col("enfase"),

    // FemFlow
    fase: col("fase"),
    dia: col("dia"),

    // MaleFlow
    ciclo: col("ciclo"),
    diatreino: col("diatreino"),

    titulo_pt: col("titulo_pt"),
    titulo_en: col("titulo_en"),
    titulo_fr: col("titulo_fr"),

    link: col("link"),

    series: col("series"),
    reps: col("reps"),
    especial: col("especial"),
    tempo: col("tempo"),
    distancia: colAlias("distancia", "distancia_milhas"),
    distancia_milhas: colAlias("distancia_milhas", "distancia"),
    intervalo: col("intervalo"),
    ritmo: col("ritmo"),
    zona_treino: colAlias("zona_treino", "zona de treino", "zona treino"),
    semana: col("semana"),
    dias: col("dias"),

    forte: col("forte"),
    leve: col("leve"),
    ciclos: col("ciclos"),
    estimulo: col("estimulo"),
    modalidade: colAlias("modalidade", "modalidade_slug", "modalidade norm"),
  };

  const usaCicloDiaTreino = idx.ciclo !== -1 && idx.diatreino !== -1;

  // validações mínimas
  const obrigatoriasBase = ["tipo", "enfase", "titulo_pt", "box", "ordem"];
  const obrigatoriasEndurance = [
    "tipo",
    "box",
    "ordem",
    "enfase",
    "semana",
    "dias",
    "titulo_pt",
    "titulo_en",
    "titulo_fr",
    "link",
    "series",
    "reps",
    "tempo",
    "ritmo",
    "distancia",
    "intervalo"
  ];
  const isEndurancePersonal = isPersonal && idx.semana !== -1 && idx.dias !== -1;
  const isEndurancePublicSheet = String(nomeAba || "").toLowerCase() === "endurancepublic";
  const isEndurancePublicByColumns = idx.semana !== -1 && (idx.estimulo !== -1 || idx.enfase !== -1);
  const isEndurancePublic = !isPersonal && !isExtra && (isEndurancePublicSheet || isEndurancePublicByColumns);
  const obrigatorias = isExtra
    ? obrigatoriasBase
    : isEndurancePersonal
    ? obrigatoriasEndurance
    : isEndurancePublic
    ? ["tipo", "box", "ordem", "semana", "titulo_pt"]
    : usaCicloDiaTreino
    ? obrigatoriasBase.concat(["ciclo", "diatreino", "link"])
    : obrigatoriasBase.concat(["dia", "fase", "link"]);

  const faltando = obrigatorias.filter((k) => idx[k] === -1);
  if (faltando.length) {
    throw new Error(`Aba "${nomeAba}" sem colunas obrigatórias: ${faltando.join(", ")}`);
  }

  // limite por dia (somente tipo "treino")
  const MAX_TREINO_POR_DIA = 10;
  const treinoCountPorDia = {}; // key -> count

  let okCount = 0;
  let errCount = 0;
  let patches = 0;

  vals.forEach((r, i) => {
    if (!r[idx.tipo]) return;

    const tipo = String(r[idx.tipo] || "").toLowerCase().trim();
    const enfase = removerAcentos(String(r[idx.enfase] || "geral")).toLowerCase();

    // box/ordem: respeita 1..N dentro de cada box (vem da planilha)
    const box = String(r[idx.box] || "").trim() || `bloco_${i}`;
    const ordem = Number(r[idx.ordem] || 0);

    let fase = "";
    let diaKey = "";
    let ciclo = "";
    let diatreino = "";
    let dayCounterKey = "";

    let semanaPublic = "";
    let estimuloPublic = "";
    let modalidadePublic = "";

    if (usaCicloDiaTreino) {
      ciclo = String(r[idx.ciclo] || "").trim().toUpperCase(); // ABC/ABCD/ABCDE
      diatreino = String(r[idx.diatreino] || "").trim().toUpperCase(); // A/B/C/D/E
      if (!ciclo || !diatreino) return;

      dayCounterKey = `ciclo:${ciclo}|dia:${diatreino}`;
    } else if (isEndurancePersonal) {
      const semanaValor = String(r[idx.semana] || "").trim();
      const diasValor = String(r[idx.dias] || "").trim();
      if (!semanaValor || !diasValor) return;

      fase = `semana_${semanaValor}`;
      diaKey = diasValor;
      dayCounterKey = `semana:${fase}|dia:${removerAcentos(diaKey).toLowerCase()}`;
    } else if (isEndurancePublic) {
      semanaPublic = String(r[idx.semana] || "").trim();
      if (!semanaPublic) return;

      estimuloPublic = idx.estimulo !== -1 ? normalizeEstimuloEndurance_(r[idx.estimulo]) : "";
      const enfaseLinha = removerAcentos(String(r[idx.enfase] || "")).toLowerCase().trim();
      const ehCorrida = enfaseLinha === "corrida";
      if (!estimuloPublic && tipo === "cardio_intermediario" && Number(r[idx.box] || 0) === 100) {
        estimuloPublic = "volume";
      }
      if (!estimuloPublic && !ehCorrida) return;
      if (!estimuloPublic) estimuloPublic = "volume";

      const modalidadeRaw = idx.modalidade !== -1 ? r[idx.modalidade] : enfaseLinha;
      modalidadePublic = normalizeEndurancePublicModalidade_(modalidadeRaw) || "corrida_5k";

      dayCounterKey = `semana:${semanaPublic}|estimulo:${estimuloPublic}|modalidade:${modalidadePublic}`;
    } else {
      fase = r[idx.fase] ? normalizarFase(r[idx.fase]) : "";
      diaKey = r[idx.dia] ? `dia_${r[idx.dia]}` : "";
      if (!fase || !diaKey) return;

      dayCounterKey = `fase:${fase}|dia:${diaKey}`;
    }

    // ⛔ limite de treino por dia
    if (tipo === "treino") {
      const c = treinoCountPorDia[dayCounterKey] || 0;
      if (c >= MAX_TREINO_POR_DIA) return;
      treinoCountPorDia[dayCounterKey] = c + 1;
    }

    // ------------------------------------------------------------
    // DEFINIR URL FINAL (NORMAL x PERSONAL x EXTRA) + (FemFlow x MaleFlow)
    // Observação: usamos docId único por linha:
    //   - FemFlow: mantém padrão legado blocos/bloco_{i}
    //   - MaleFlow: blocos/bloco_{box*100}_{ordem} (ex: bloco_100_01) para não colidir
    // ------------------------------------------------------------
    const nivel = nomeAba.toLowerCase(); // iniciante/intermediaria/avancada

    const docIdFem = `bloco_${i}`;
    const boxMatch = String(box).match(/\d+/);
    const boxNumero = boxMatch ? Number(boxMatch[0]) : 0;
    const boxBase = boxNumero ? String(boxNumero * 100) : String(box || "0").trim();
    const docIdMale = `bloco_${boxBase}_${String(ordem).padStart(2, "0")}`;
    const docIdEndurancePublic = isEndurancePublic
      ? `bloco_${hashDeterministicoEndurancePublic_([semanaPublic, estimuloPublic, box, ordem, String(r[idx.titulo_pt] || "")])}`
      : "";
    const docId = usaCicloDiaTreino ? docIdMale : (isEndurancePublic ? docIdEndurancePublic : docIdFem);

    let url = "";

    const diaKeySafe = isEndurancePersonal
      ? removerAcentos(diaKey).toLowerCase()
      : diaKey;
    const diaKeyEncoded = encodeURIComponent(diaKeySafe);
    const enfaseEncoded = encodeURIComponent(enfase);

    if (isPersonal) {
      if (usaCicloDiaTreino) {
        url =
          `${baseURL}/personal_trainings/${personalId}/${enfase}` +
          `/ciclo/${ciclo}` +
          `/diatreino/diatreino_${diatreino}` +
          `/blocos/${docId}`;
      } else if (isEndurancePersonal) {
        url =
         `${baseURL}/personal_trainings/${personalId}` +
`/endurance/${enfaseEncoded}` +
`/treinos/base` +
`/semana/${String(r[idx.semana] || "").trim()}` +
`/dias/${diaKeyEncoded}/blocos/${docId}`;
      } else {
        url = `${baseURL}/personal_trainings/${personalId}/${enfaseEncoded}/${fase}/dias/${diaKeyEncoded}/blocos/${docId}`;
      }
    } else if (isExtra) {
      url = `${baseURL}/exercicios_extra/${enfaseEncoded}/blocos/${docId}`;
    } else if (isEndurancePublic) {
      const modalidadeEncoded = encodeURIComponent(modalidadePublic);
      const semanaEncoded = encodeURIComponent(String(semanaPublic));
      const estimuloEncoded = encodeURIComponent(String(estimuloPublic));
      url = `${baseURL}/endurance_public/${modalidadeEncoded}/treinos/base/semana/${semanaEncoded}/estimulos/${estimuloEncoded}/blocos/${docId}`;
      Logger.log(`🏃 Endurance Público import: modalidade=${modalidadePublic} semana=${semanaPublic} estimulo=${estimuloPublic} docId=${docId}`);
    } else {
      if (usaCicloDiaTreino) {
        url =
          `${baseURL}/exercicios/${nivel}_${enfaseEncoded}` +
          `/ciclo/${ciclo}` +
          `/diatreino/diatreino_${diatreino}` +
          `/blocos/${docId}`;
      } else {
        url = `${baseURL}/exercicios/${nivel}_${enfaseEncoded}/fases/${fase}/dias/${diaKeyEncoded}/blocos/${docId}`;
      }
    }

    // ------------------------------------------------------------
    // CONSTRUIR PAYLOAD
    // ------------------------------------------------------------
    const payload = {
      fields: {
        tipo: { stringValue: tipo },
        box: { stringValue: box },
        ordem: { integerValue: ordem },

        enfase: { stringValue: enfase },

        titulo_pt: { stringValue: String(r[idx.titulo_pt] || "") },
        titulo_en: { stringValue: String(r[idx.titulo_en] || "") },
        titulo_fr: { stringValue: String(r[idx.titulo_fr] || "") },

        link: { stringValue: String(r[idx.link] || "") },

        series: { stringValue: String(r[idx.series] || "") },
        reps: { stringValue: String(r[idx.reps] || "") },
        especial: { stringValue: String(idx.especial !== -1 ? (r[idx.especial] || "") : "") },

        tempo: { stringValue: String(r[idx.tempo] || "") },
        distancia: { stringValue: String(r[idx.distancia] || "") },
        intervalo: { stringValue: String(r[idx.intervalo] || "") },
        ritmo: { stringValue: String(idx.ritmo !== -1 ? (r[idx.ritmo] || "") : "") },
        zona_treino: { stringValue: String(idx.zona_treino !== -1 ? (r[idx.zona_treino] || "") : "") },
        distancia_milhas: { stringValue: String(idx.distancia_milhas !== -1 ? (r[idx.distancia_milhas] || "") : "") },

        forte: { stringValue: String(r[idx.forte] || "") },
        leve: { stringValue: String(r[idx.leve] || "") },
        ciclos: { stringValue: String(r[idx.ciclos] || "") },
        estimulo: { stringValue: String(isEndurancePublic ? estimuloPublic : (idx.estimulo !== -1 ? (r[idx.estimulo] || "") : "")) },

        // metadados úteis
        updatedAt: { timestampValue: new Date().toISOString() },
        importTarget: { stringValue: String(target || "femflow") },
      },
    };

    // FemFlow fields
    if (!usaCicloDiaTreino) {
      if (isEndurancePersonal) {
        payload.fields.semana = { integerValue: Number(r[idx.semana] || 0) };
        payload.fields.dias = { stringValue: String(r[idx.dias] || "") };
      } else if (isEndurancePublic) {
        payload.fields.semana = { integerValue: Number(semanaPublic || 0) };
        payload.fields.modalidade = { stringValue: String(modalidadePublic || "") };
      } else {
        payload.fields.fase = { stringValue: fase };
        payload.fields.dia = { integerValue: Number(r[idx.dia] || 0) };
      }
    } else {
      // MaleFlow fields
      payload.fields.ciclo = { stringValue: ciclo };
      payload.fields.diatreino = { stringValue: diatreino };
    }

    // === HISTÓRICO DE BLOCOS PERSONAL (mantém, adaptando ao schema)
    if (isPersonal) {
      const getResp = firestoreGET_(url, token);
      const getCode = getResp.getResponseCode();
      if (getCode === 200) {
        const doc = JSON.parse(getResp.getContentText());

        let historyUrl = "";
        if (usaCicloDiaTreino) {
          historyUrl =
            `${baseURL}/personal_trainings/${personalId}/${enfase}` +
            `/ciclo/${ciclo}` +
            `/diatreino/diatreino_${diatreino}` +
            `/history/${importId}/blocos/${docId}`;
        } else if (isEndurancePersonal) {
  historyUrl =
   `${baseURL}/personal_trainings/${personalId}` +
`/endurance/${enfaseEncoded}` +
`/treinos/base` +                      // 🧠 MESMO doc fixo
`/semana/${String(r[idx.semana] || "").trim()}` +
`/dias/${diaKeyEncoded}/history/${importId}/blocos/${docId}`;
        } else {
          historyUrl =
            `${baseURL}/personal_trainings/${personalId}/${enfaseEncoded}/${fase}` +
            `/dias/${diaKeyEncoded}/history/${importId}/blocos/${docId}`;
        }

        const historyPayload = {
          fields: Object.assign({}, doc.fields || {}, {
            archivedAt: { timestampValue: new Date().toISOString() },
            archivedBy: { stringValue: "importador_apps_script" },
            importId: { stringValue: importId },
          }),
        };
        firestorePATCH_(historyUrl, token, historyPayload);
      } else if (getCode !== 404) {
        Logger.log(
          `⚠️ GET histórico falhou [${getCode}] → ${nomeAba} | linha ${i} | ${getResp.getContentText()}`
        );
      }
    }

    // ------------------------------------------------------------
    // ENVIAR PARA FIRESTORE
    // ------------------------------------------------------------
    const resp = firestorePATCH_(url, token, payload);
    patches++;

    const code = resp.getResponseCode();
    if (code === 200) {
      okCount++;
      Logger.log(`✅ OK → ${nomeAba} | linha ${i}`);
    } else {
      errCount++;
      Logger.log(`❌ ERRO [${code}] → ${nomeAba} | linha ${i} | ${resp.getContentText()}`);
    }
  });

  return { ok: okCount, err: errCount, patches: patches };
}

/* ============================================================
   IMPORTA UMA ABA (MaleFlow)
   - 1 doc por diatreino (docId fixo: bloco_100)
   - Itens ordenados por box numérico e ordem
============================================================ */
function importarAbaMaleFlow_(sh, token, baseURL, nomeAba, importId, target, scope) {
  scope = scope || {};
  const isPersonal = !!scope.isPersonal;
  const personalId = String(scope.personalId || "").trim();
  const isExtra = !!scope.isExtra;

  const valsAll = sh.getDataRange().getValues();
  if (!valsAll || valsAll.length < 2) {
    Logger.log("⚠️ Aba vazia/sem dados: " + nomeAba);
    return { ok: 0, err: 0, patches: 0, dias: [] };
  }

  const header = valsAll[0].map((h) => String(h || "").trim());
  const vals = valsAll.slice(1);

  const col = (name) => header.indexOf(name);
  const colAlias = (...aliases) => getColIndexByAliases_(header, aliases);

  const idx = {
    tipo: col("tipo"),
    box: col("box"),
    ordem: col("ordem"),
    enfase: col("enfase"),
    ciclo: col("ciclo"),
    diatreino: col("diatreino"),
    titulo_pt: col("titulo_pt"),
    titulo_en: col("titulo_en"),
    titulo_fr: col("titulo_fr"),
    link: col("link"),
    series: col("series"),
    reps: col("reps"),
    especial: col("especial"),
    tempo: col("tempo"),
    distancia: colAlias("distancia", "distancia_milhas"),
    distancia_milhas: colAlias("distancia_milhas", "distancia"),
    intervalo: col("intervalo"),
    ritmo: col("ritmo"),
    zona_treino: colAlias("zona_treino", "zona de treino", "zona treino"),
    forte: col("forte"),
    leve: col("leve"),
    ciclos: col("ciclos"),
    estimulo: col("estimulo"),
    modalidade: colAlias("modalidade", "modalidade_slug", "modalidade norm"),
  };

  const obrigatorias = ["tipo", "enfase", "titulo_pt", "box", "ordem", "ciclo", "diatreino"];
  const faltando = obrigatorias.filter((k) => idx[k] === -1);
  if (faltando.length) {
    throw new Error(`Aba "${nomeAba}" sem colunas obrigatórias: ${faltando.join(", ")}`);
  }

  const nivel = String(nomeAba || "").trim().toLowerCase();

  // ✅ agrupamento composto evita misturar ciclos/enfases por acidente
  const grouped = {};     // key -> items[]
  const metaByKey = {};   // key -> ctx
  const treinoCountPorDia = {}; // dayKey -> count
  const droppedByLimit = {};    // dayKey -> droppedCount

  vals.forEach((r, rowIndex) => {
    if (!r[idx.tipo]) return;

    const tipo = String(r[idx.tipo] || "").toLowerCase().trim();
    const enfase = removerAcentos(String(r[idx.enfase] || "geral")).toLowerCase();
    const ciclo = normalizarCicloLocal_(r[idx.ciclo]);
    const diatreino = normalizarDiaTreinoLocal_(r[idx.diatreino]);
    if (!ciclo || !diatreino) return;

    // ⛔ limite de 10 itens "treino" por (ciclo+diatreino)
    const dayKey = `ciclo:${ciclo}|dia:${diatreino}`;
    if (tipo === "treino") {
      const c = treinoCountPorDia[dayKey] || 0;
      if (c >= 10) {
        droppedByLimit[dayKey] = (droppedByLimit[dayKey] || 0) + 1;
        return;
      }
      treinoCountPorDia[dayKey] = c + 1;
    }

    const item = buildMaleFlowItemFromRow_(r, idx);

    const key = `${nivel}|${enfase}|${ciclo}|${diatreino}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);

    if (!metaByKey[key]) {
      metaByKey[key] = {
        nivel,
        enfase,
        ciclo,
        diatreino,
        target,
        isPersonal,
        personalId,
        isExtra
      };
    }
  });

  // warnings de descarte por limite
  Object.keys(droppedByLimit).forEach((k) => {
    Logger.log(`⚠️ [MALEFLOW] limite 10 treinos excedido (${k}) → descartados=${droppedByLimit[k]}`);
  });

  let okCount = 0;
  let errCount = 0;
  let patches = 0;
  const diasResumo = [];

  Object.keys(grouped).forEach((key) => {
    const items = grouped[key] || [];
    const ctx = metaByKey[key];

    // ✅ ordenação estável: boxNumber -> ordem -> box string (fallback)
    items.sort((a, b) => {
      const aBox = boxNumber_(a.box);
      const bBox = boxNumber_(b.box);
      if (aBox !== bBox) return aBox - bBox;

      const ao = Number(a.ordem || 0);
      const bo = Number(b.ordem || 0);
      if (ao !== bo) return ao - bo;

      return String(a.box || "").localeCompare(String(b.box || ""), "pt-BR");
    });

    const path = buildFirestorePathMaleFlow_(baseURL, ctx);
    const payload = buildDocPayloadMaleFlow_(ctx, items);

    // ✅ histórico para PERSONAL (doc único)
    if (ctx.isPersonal && ctx.personalId) {
      const getResp = firestoreGET_(path, token);
      const getCode = getResp.getResponseCode();
      if (getCode === 200) {
        const doc = JSON.parse(getResp.getContentText());
        const historyPath = buildFirestoreHistoryPathMaleFlow_(baseURL, ctx, importId);

        const historyPayload = {
          fields: Object.assign({}, doc.fields || {}, {
            archivedAt: { timestampValue: new Date().toISOString() },
            archivedBy: { stringValue: "importador_apps_script" },
            importId: { stringValue: importId },
          }),
        };
        firestorePATCH_(historyPath, token, historyPayload);
      } else if (getCode !== 404) {
        Logger.log(`⚠️ [MALEFLOW][PERSONAL] GET histórico falhou [${getCode}] → ${getResp.getContentText()}`);
      }
    }

    auditarMaleFlowPaths_(ctx, { path, itens: items });

    const resp = firestorePATCH_(path, token, payload);
    patches++;

    const code = resp.getResponseCode();
    if (code === 200) {
      okCount++;
    } else {
      errCount++;
      Logger.log(`❌ ERRO [${code}] → ${nomeAba} | key ${key} | ${resp.getContentText()}`);
    }

    diasResumo.push({ key, diatreino: ctx.diatreino, path, itens: items.length });
  });

  return { ok: okCount, err: errCount, patches, dias: diasResumo };
}


function normalizeEndurancePublicModalidade_(value) {
  return removerAcentos(String(value || "")).toLowerCase().trim().replace(/\s+/g, "_");
}

function normalizeEstimuloEndurance_(value) {
  return removerAcentos(String(value || "")).toLowerCase().trim();
}

function hashDeterministicoEndurancePublic_(parts) {
  const raw = parts.join("|");
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, raw, Utilities.Charset.UTF_8);
  return digest.map((b) => {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.padStart(2, "0");
  }).join("");
}

/* ============================================================
   FUNÇÕES AUXILIARES
============================================================ */
function normalizarTargetLocal_(valor) {
  if (typeof normalizarTarget_ === "function") {
    return normalizarTarget_(valor);
  }
  const txt = String(valor || "").trim().toLowerCase();
  if (!txt) return "femflow";
  if (txt === "male" || txt === "male-flow" || txt === "maleflow") return "maleflow";
  if (txt === "femflow" || txt === "fem" || txt === "ff") return "femflow";
  return txt;
}

function normalizarCicloLocal_(valor) {
  if (typeof normalizarCiclo_ === "function") {
    return normalizarCiclo_(valor);
  }
  const txt = String(valor || "").trim().toUpperCase();
  if (!txt) return null;
  if (txt === "ABC" || txt === "ABCD" || txt === "ABCDE") return txt;
  if (txt === "3") return "ABC";
  if (txt === "4") return "ABCD";
  if (txt === "5") return "ABCDE";
  return null;
}

function normalizarDiaTreinoLocal_(valor) {
  if (typeof normalizarDiaTreino_ === "function") {
    return normalizarDiaTreino_(valor);
  }
  const txt = String(valor || "").trim().toUpperCase();
  if (!txt) return null;
  if (["A", "B", "C", "D", "E"].includes(txt)) return txt;
  return null;
}

function buildFirestorePathMaleFlow_(baseURL, ctx) {
  const nivel = String(ctx.nivel || "").trim().toLowerCase();
  const enfase = String(ctx.enfase || "").trim().toLowerCase();
  const ciclo = String(ctx.ciclo || "").trim().toUpperCase();
  const diatreino = String(ctx.diatreino || "").trim().toUpperCase();

  const isPersonal = !!ctx.isPersonal;
  const personalId = String(ctx.personalId || "").trim();
  const isExtra = !!ctx.isExtra;

  // ✅ PERSONAL (MaleFlow) — doc único bloco_100
  if (isPersonal) {
    if (!personalId) throw new Error("[MALEFLOW] Aba personal_ sem personalId válido.");
    return (
      `${baseURL}/personal_trainings/${personalId}/${enfase}` +
      `/ciclo/${ciclo}` +
      `/diatreino/diatreino_${diatreino}` +
      `/blocos/bloco_100`
    );
  }

  // ✅ EXTRA (MaleFlow) — doc único bloco_100 (se você for consumir no app)
  if (isExtra) {
    return `${baseURL}/exercicios_extra/${enfase}/blocos/bloco_100`;
  }

  // ✅ NORMAL (MaleFlow) — doc único bloco_100
  return (
    `${baseURL}/exercicios/${nivel}_${enfase}` +
    `/ciclo/${ciclo}` +
    `/diatreino/diatreino_${diatreino}` +
    `/blocos/bloco_100`
  );
}
function buildFirestoreHistoryPathMaleFlow_(baseURL, ctx, importId) {
  const enfase = String(ctx.enfase || "").trim().toLowerCase();
  const ciclo = String(ctx.ciclo || "").trim().toUpperCase();
  const diatreino = String(ctx.diatreino || "").trim().toUpperCase();

  const personalId = String(ctx.personalId || "").trim();
  if (!personalId) throw new Error("[MALEFLOW] history requer personalId.");

  return (
    `${baseURL}/personal_trainings/${personalId}/${enfase}` +
    `/ciclo/${ciclo}` +
    `/diatreino/diatreino_${diatreino}` +
    `/history/${importId}/blocos/bloco_100`
  );
}


function buildDocPayloadMaleFlow_(ctx, items) {
  const values = (items || []).map((item) => {
    return { mapValue: { fields: buildMaleFlowItemFields_(item) } };
  });

  return {
    fields: {
      updatedAt: { timestampValue: new Date().toISOString() }, // ✅ padronizado
      importTarget: { stringValue: "maleflow" },

      nivel: { stringValue: String(ctx.nivel || "").toLowerCase() },
      enfase: { stringValue: String(ctx.enfase || "").toLowerCase() },
      ciclo: { stringValue: String(ctx.ciclo || "").toUpperCase() },
      diatreino: { stringValue: String(ctx.diatreino || "").toUpperCase() },

      itens: { arrayValue: { values } }
    }
  };
}


function buildMaleFlowItemFromRow_(row, idx) {
  const item = {
    tipo: String(row[idx.tipo] || "").toLowerCase().trim(),
    box: String(row[idx.box] || "").trim() || "0",
    ordem: Number(row[idx.ordem] || 0)
  };

  if (idx.titulo_pt !== -1) item.titulo_pt = String(row[idx.titulo_pt] || "");
  if (idx.titulo_en !== -1) item.titulo_en = String(row[idx.titulo_en] || "");
  if (idx.titulo_fr !== -1) item.titulo_fr = String(row[idx.titulo_fr] || "");
  if (idx.link !== -1) item.link = String(row[idx.link] || "");
  if (idx.series !== -1) item.series = String(row[idx.series] || "");
  if (idx.reps !== -1) item.reps = String(row[idx.reps] || "");
  if (idx.especial !== -1) item.especial = String(row[idx.especial] || "");
  if (idx.tempo !== -1) item.tempo = String(row[idx.tempo] || "");
  if (idx.distancia !== -1) item.distancia = String(row[idx.distancia] || "");
  if (idx.intervalo !== -1) item.intervalo = String(row[idx.intervalo] || "");
  if (idx.ritmo !== -1) item.ritmo = String(row[idx.ritmo] || "");
  if (idx.zona_treino !== -1) item.zona_treino = String(row[idx.zona_treino] || "");
  if (idx.distancia_milhas !== -1) item.distancia_milhas = String(row[idx.distancia_milhas] || "");
  if (idx.forte !== -1) item.forte = String(row[idx.forte] || "");
  if (idx.leve !== -1) item.leve = String(row[idx.leve] || "");
  if (idx.ciclos !== -1) item.ciclos = String(row[idx.ciclos] || "");

  return item;
}

function buildMaleFlowItemFields_(item) {
  const fields = {
    tipo: { stringValue: String(item.tipo || "") },
    box: { stringValue: String(item.box || "") },
    ordem: { integerValue: Number(item.ordem || 0) }
  };

  if (item.titulo_pt !== undefined) fields.titulo_pt = { stringValue: String(item.titulo_pt || "") };
  if (item.titulo_en !== undefined) fields.titulo_en = { stringValue: String(item.titulo_en || "") };
  if (item.titulo_fr !== undefined) fields.titulo_fr = { stringValue: String(item.titulo_fr || "") };
  if (item.link !== undefined) fields.link = { stringValue: String(item.link || "") };
  if (item.series !== undefined) fields.series = { stringValue: String(item.series || "") };
  if (item.reps !== undefined) fields.reps = { stringValue: String(item.reps || "") };
  if (item.especial !== undefined) fields.especial = { stringValue: String(item.especial || "") };
  if (item.tempo !== undefined) fields.tempo = { stringValue: String(item.tempo || "") };
  if (item.distancia !== undefined) fields.distancia = { stringValue: String(item.distancia || "") };
  if (item.intervalo !== undefined) fields.intervalo = { stringValue: String(item.intervalo || "") };
  if (item.ritmo !== undefined) fields.ritmo = { stringValue: String(item.ritmo || "") };
  if (item.zona_treino !== undefined) fields.zona_treino = { stringValue: String(item.zona_treino || "") };
  if (item.distancia_milhas !== undefined) fields.distancia_milhas = { stringValue: String(item.distancia_milhas || "") };
  if (item.forte !== undefined) fields.forte = { stringValue: String(item.forte || "") };
  if (item.leve !== undefined) fields.leve = { stringValue: String(item.leve || "") };
  if (item.ciclos !== undefined) fields.ciclos = { stringValue: String(item.ciclos || "") };

  return fields;
}


function getColIndexByAliases_(header, aliases) {
  const normalizedHeader = (header || []).map((h) => normalizeHeaderKey_(h));
  for (let i = 0; i < aliases.length; i++) {
    const key = normalizeHeaderKey_(aliases[i]);
    const idx = normalizedHeader.indexOf(key);
    if (idx !== -1) return idx;
  }
  return -1;
}

function normalizeHeaderKey_(value) {
  return removerAcentos(String(value || "")).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function boxNumber_(box) {
  const match = String(box || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function auditarMaleFlowPaths_(ctx, grouped) {
  const itens = grouped && grouped.itens ? grouped.itens : [];
  const amostra = itens.slice(0, 3).map((item) => {
    return {
      box: item.box,
      ordem: item.ordem,
      titulo_pt: item.titulo_pt
    };
  });

  Logger.log(
    "[MALEFLOW] path=" +
      String(grouped.path || "") +
      " itens=" +
      String(itens.length) +
      " amostra=" +
      JSON.stringify(amostra)
  );
}

function firestoreGET_(url, token) {
  return UrlFetchApp.fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    muteHttpExceptions: true,
  });
}

function firestorePATCH_(url, token, payloadObj) {
  return UrlFetchApp.fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    contentType: "application/json",
    payload: JSON.stringify(payloadObj),
    muteHttpExceptions: true,
  });
}

function removerAcentos(t) {
  return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
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
    menstruacao: "menstrual",
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

function TEST_importar_endurance_femflow() {
  const r = importarTreinosFEMFLOW_aba("Endurance_FF-251204-G5U8", { target: "femflow" });
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
