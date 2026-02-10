/* ============================================================
   FEMFLOW • TREINO ENGINE v4.2 — PREMIUM 2025
   🔥 FONTE DA VERDADE: DIA DO CICLO HORMONAL
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};
FEMFLOW.engineTreino = {};

/* ============================================================
   1) NORMALIZAÇÕES
============================================================ */
FEMFLOW.engineTreino.isExtraEnfase = enfase =>
  String(enfase || "").toLowerCase().trim().startsWith("extra_");

FEMFLOW.engineTreino.normalizarFase = raw => {
  const f = String(raw || "").toLowerCase().trim();
  if (!f) return "";
  return {
    ovulatória: "ovulatoria",
    ovulatoria: "ovulatoria",
    ovulação: "ovulatoria",
    ovulation: "ovulatoria",
    follicular: "follicular",
    folicular: "follicular",
    lútea: "lutea",
    lutea: "lutea",
    luteal: "lutea",
    menstrual: "menstrual",
    menstruação: "menstrual",
    menstruacao: "menstrual",
    menstruation: "menstrual"
  }[f] || f;
};

FEMFLOW.engineTreino.normalizarNivel = raw => {
  const n = String(raw || "").toLowerCase().trim();
  if (!n) return null;
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan")) return "avancada";
  return n; // 🔥 respeita backend
};

FEMFLOW.engineTreino.normalizarEnfaseEndurance = raw => {
  return String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
};

FEMFLOW.engineTreino.selecionarTitulo = bloco => {
  const lang = FEMFLOW.lang || "pt";
  const key = `titulo_${lang}`;
  return (
    bloco?.[key] ||
    bloco?.titulo_pt ||
    bloco?.titulo_en ||
    bloco?.titulo_fr ||
    bloco?.titulo ||
    ""
  );
};


/* ============================================================
   2) SÉRIE ESPECIAL
============================================================ */
FEMFLOW.engineTreino.detectarSerieEspecial = label => {
  if (!label) return null;

  const s = label.toLowerCase().replace(/\s+/g, "");

  const regras = [
    { sufixo: "sm",  codigo: "SM" }, // submáxima
    { sufixo: "cc",  codigo: "CC" }, // cadência controlada
    { sufixo: "rp",  codigo: "RP" }, // rest-pause
    { sufixo: "ae",  codigo: "AE" }, // all out
    { sufixo: "d",   codigo: "D"  }, // dropset
    { sufixo: "q",   codigo: "Q"  }, // quadriset
    { sufixo: "t",   codigo: "T"  }, // triset
    { sufixo: "b",   codigo: "B"  }, // biset
    { sufixo: "c",   codigo: "C"  }, // cluster
    { sufixo: "i",   codigo: "I"  }  // isometria
  ];

  for (const r of regras) {
    if (s.endsWith(r.sufixo)) return r.codigo;
  }

  return null;
};


/* ============================================================
   3) FIREBASE — BLOCO NORMAL
   🔥 PRIORIDADE ABSOLUTA: diaCiclo
============================================================ */
FEMFLOW.engineTreino.carregarBlocosNormais = async ({
  nivel, enfase, fase, diaCiclo
}) => {

 const faseNorm  = FEMFLOW.engineTreino.normalizarFase(fase);
const nivelNorm = FEMFLOW.engineTreino.normalizarNivel(nivel);
const authUid = firebase?.auth?.()?.currentUser?.uid || null;
console.log("🔍 [NORMAL] Firebase auth status:", authUid ? "logado" : "sem login", {
  uid: authUid
});

if (!faseNorm || !nivelNorm) {
  console.error("❌ Dados inválidos para consulta Firebase (fase ou nível):", {
    nivel,
    fase,
    faseNorm,
    nivelNorm
  });
  return [];
}

if (!enfase) {
  FEMFLOW.warn("⚠️ Ênfase ausente — consulta Firebase abortada:", {
    nivel: nivelNorm,
    fase: faseNorm,
    diaCiclo
  });
  return [];
}


  console.log("🧠 DIA FISIOLÓGICO RECEBIDO:", diaCiclo);
  const diaNum = Number(diaCiclo);
  if (!Number.isFinite(diaNum) || diaNum < 1) {
    console.error("❌ diaCiclo inválido. Abortando consulta Firebase:", diaCiclo);
    return [];
  }
  const diaKey    = `dia_${diaNum}`;
  const path = `/exercicios/${nivelNorm}_${enfase}/fases/${faseNorm}/dias/${diaKey}/blocos`;

  console.log("🔥 FIREBASE PATH (ÊNFASE):", {
    nivel: nivelNorm,
    enfase,
    fase: faseNorm,
    diaKey
  });
  console.log("🔎 [NORMAL] Coleção/Doc:", {
    collection: "exercicios",
    doc: `${nivelNorm}_${enfase}`,
    fase: faseNorm,
    diaKey
  });
  FEMFLOW.log("🔥 [NORMAL] Firebase por diaCiclo:", diaKey);

  let snap;
  try {
    snap = await firebase.firestore()
      .collection("exercicios")
      .doc(`${nivelNorm}_${enfase}`)
      .collection("fases")
      .doc(faseNorm)
      .collection("dias")
      .doc(diaKey)
      .collection("blocos")
      .get();
  } catch (err) {
    console.error("❌ [NORMAL] Erro ao buscar no Firebase:", err);
    return [];
  }

  if (snap.empty) {
    FEMFLOW.error("❌ Nenhum treino encontrado no Firebase:", {
      path,
      nivel: nivelNorm,
      enfase,
      fase: faseNorm,
      diaKey
    });
    console.log("🧪 [NORMAL] Documentos retornados:", snap.size);
    return [];
  }

  const blocos = [];
  snap.forEach(d => {
    const data = d.data();
    if (!data.titulo && !data.titulo_pt && !data.titulo_en && !data.titulo_fr) {
      data.titulo = d.id;
    }
    console.log("🔥 FIREBASE RAW:", data.box, data.tipo, data);
    blocos.push(data);
  });

  return blocos;
};

/* ============================================================
   4) FIREBASE — BLOCO EXTRA (fixo)
============================================================ */
FEMFLOW.engineTreino.carregarBlocosExtras = async ({
  nivel, enfase
}) => {
  const enfaseNorm = String(enfase || "").toLowerCase().trim();
  const nivelNorm = FEMFLOW.engineTreino.normalizarNivel(nivel);
  const authUid = firebase?.auth?.()?.currentUser?.uid || null;
  console.log("🔍 [EXTRA] Firebase auth status:", authUid ? "logado" : "sem login", {
    uid: authUid
  });

  if (!enfaseNorm) {
    FEMFLOW.warn("⚠️ Ênfase extra ausente — consulta Firebase abortada.");
    return [];
  }

  const docIds = [enfaseNorm];

  for (const docId of docIds) {
    let snap;
    try {
      snap = await firebase.firestore()
        .collection("exercicios_extra")
        .doc(docId)
        .collection("blocos")
        .get();
    } catch (err) {
      console.error("❌ [EXTRA] Erro ao buscar no Firebase:", err, {
        docId
      });
      return [];
    }

    if (!snap.empty) {
      const blocos = [];
      snap.forEach(d => {
        const data = d.data();
        if (!data.titulo && !data.titulo_pt && !data.titulo_en && !data.titulo_fr) {
          data.titulo = d.id;
        }
        blocos.push(data);
      });
      return blocos;
    }
  }

  const flatSnap = await firebase.firestore()
    .collection("exercicios_extra")
    .where("enfase", "==", enfaseNorm)
    .get();

  if (!flatSnap.empty) {
    const blocos = [];
    flatSnap.forEach(d => {
      const data = d.data();
      if (!data.titulo && !data.titulo_pt && !data.titulo_en && !data.titulo_fr) {
        data.titulo = d.id;
      }
      blocos.push(data);
    });
    return blocos.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }

  FEMFLOW.error("❌ Nenhum treino EXTRA encontrado no Firebase:", {
    enfase: enfaseNorm
  });
  console.log("🧪 [EXTRA] Documentos retornados:", flatSnap.size);
  return [];
};

/* ============================================================
   5) FIREBASE — BLOCO PERSONAL
   🔥 PRIORIDADE ABSOLUTA: diaCiclo
============================================================ */
FEMFLOW.engineTreino.carregarBlocosPersonal = async ({
  id, fase, diaCiclo
}) => {

  const faseNorm = FEMFLOW.engineTreino.normalizarFase(fase);
  const authUid = firebase?.auth?.()?.currentUser?.uid || null;
  console.log("🔍 [PERSONAL] Firebase auth status:", authUid ? "logado" : "sem login", {
    uid: authUid
  });
   if (!faseNorm || !id) {
  console.error("❌ Dados inválidos para consulta Firebase:", {
    id,
    fase,
    faseNorm
  });
  return [];
}
  console.log("🧠 DIA FISIOLÓGICO RECEBIDO:", diaCiclo);
  const diaNum = Number(diaCiclo);
  if (!Number.isFinite(diaNum) || diaNum < 1) {
    console.error("❌ diaCiclo inválido. Abortando consulta Firebase:", diaCiclo);
    return [];
  }
  const diaKey   = `dia_${diaNum}`;
  const path = `/personal_trainings/${id}/personal/${faseNorm}/dias/${diaKey}/blocos`;

  console.log("🔥 FIREBASE PATH (PERSONAL):", {
  id,
  fase: faseNorm,
  diaKey
});

  FEMFLOW.log("🔥 [PERSONAL] Firebase por diaCiclo:", diaKey);

  let snap;
  try {
    snap = await firebase.firestore()
      .collection("personal_trainings")
      .doc(id)
      .collection("personal")
      .doc(faseNorm)
      .collection("dias")
      .doc(diaKey)
      .collection("blocos")
      .get();
  } catch (err) {
    console.error("❌ [PERSONAL] Erro ao buscar no Firebase:", err);
    return [];
  }

  if (snap.empty) {
    FEMFLOW.error("❌ Nenhum treino PERSONAL encontrado no Firebase:", {
      path,
      id,
      fase: faseNorm,
      diaKey
    });
    console.log("🧪 [PERSONAL] Documentos retornados:", snap.size);
    return [];
  }

  const blocos = [];
  snap.forEach(d => {
    const data = d.data();
    if (!data.titulo && !data.titulo_pt && !data.titulo_en && !data.titulo_fr) {
      data.titulo = d.id;
    }
    blocos.push(data);
  });
  return blocos;
};

/* ============================================================
   5B) FIREBASE — BLOCO ENDURANCE (PERSONAL)
============================================================ */
FEMFLOW.engineTreino.carregarBlocosEndurance = async ({
  id, semana, dia, enfase
}) => {
  const authUid = firebase?.auth?.()?.currentUser?.uid || null;
  console.log("🔍 [ENDURANCE] Firebase auth status:", authUid ? "logado" : "sem login", {
    uid: authUid
  });

  const enfaseNorm = FEMFLOW.engineTreino.normalizarEnfaseEndurance(enfase);

  if (!id || !enfaseNorm) {
    console.error("❌ Dados inválidos para consulta Endurance:", { id, enfase });
    return [];
  }

  const semanaNum = Number(semana);
  if (!Number.isFinite(semanaNum) || semanaNum < 1) {
    console.error("❌ semana inválida. Abortando consulta Endurance:", semana);
    return [];
  }

  const diaNorm = String(dia || "")
    .toLowerCase()
    .trim()
    .replace("terça", "terca")
    .replace("sábado", "sabado");

  if (!diaNorm) {
    console.error("❌ dia inválido. Abortando consulta Endurance:", dia);
    return [];
  }

  const semanaKey = String(semanaNum);
  const path = `/personal_trainings/${id}/endurance/${enfaseNorm}/treinos/base/semana/${semanaKey}/dias/${diaNorm}/blocos`;

  console.log("🔥 FIREBASE PATH (ENDURANCE):", {
    id,
    enfase: enfaseNorm,
    semana: semanaKey,
    dia: diaNorm
  });

  FEMFLOW.log("🔥 [ENDURANCE] Firebase:", { enfase: enfaseNorm, semanaKey, dia: diaNorm });

  let snap;
  try {
    snap = await firebase.firestore()
      .collection("personal_trainings")
      .doc(id)
      .collection("endurance")
      .doc(enfaseNorm)
      .collection("treinos")
      .doc("base")
      .collection("semana")
      .doc(semanaKey)
      .collection("dias")
      .doc(diaNorm)
      .collection("blocos")
      .get();
  } catch (err) {
    console.error("❌ [ENDURANCE] Erro ao buscar no Firebase:", err);
    return [];
  }

  if (snap.empty) {
    FEMFLOW.error("❌ Nenhum treino ENDURANCE encontrado no Firebase:", {
      path,
      id,
      enfase: enfaseNorm,
      semana: semanaKey,
      dia: diaNorm
    });
    console.log("🧪 [ENDURANCE] Documentos retornados:", snap.size);
    return [];
  }

  const blocos = [];
  snap.forEach(d => {
    const data = d.data();
    if (!data.titulo && !data.titulo_pt && !data.titulo_en && !data.titulo_fr) {
      data.titulo = d.id;
    }
    blocos.push(data);
  });
  return blocos;
};

/* ============================================================
   6) ORGANIZAÇÃO + HIIT
============================================================ */
FEMFLOW.engineTreino.organizarBlocosSimples = brutos => {

  const boxesComTreino = new Set(
    brutos
      .filter(b => b.tipo === "treino")
      .map(b => parseInt(String(b.box || "").replace(/\D/g, "")))
      .filter(n => !isNaN(n))
  );
   
  return brutos
    .map(b => {

      const rawLabel = String(b.box || "");

      // 🔢 número do box (1, 2, 3, 4…)
      let boxNum = parseInt(rawLabel.replace(/\D/g, ""));

      // 🧬 série especial (T, D, AE, C…)
      const serieCodigo = FEMFLOW.engineTreino.detectarSerieEspecial(rawLabel);

      // Aquecimento
      if (b.tipo === "aquecimento") boxNum = -100;

      // Treino sem box explícito
      else if (b.tipo === "treino" && isNaN(boxNum)) boxNum = 1;

      // 🔥 HIIT
      else if (b.tipo === "hiit") {
        if (!boxesComTreino.has(boxNum)) {
          boxNum = 500;
        }
      }

      else if (b.tipo === "cardio_intermediario" || b.tipo === "cardio") {
        if (!isNaN(boxNum)) {
          boxNum = boxNum >= 100 ? boxNum - 99.5 : boxNum + 0.5;
        } else {
          boxNum = 0.5;
        }
      } else if (b.tipo === "cardio_final") boxNum = 900;
      else if (b.tipo === "resfriamento") boxNum = 999;

     return {
  ...b,

  // 🔢 Box numérico para ordenação
  boxNum,

  // 🔑 Preserva chave visual (ex: "1_hiit")
  boxKey: b.boxKey || null,

  ordemNum: Number(b.ordem) || 0,

  // ✅ SÉRIE LIMPA PARA O FRONT
  serieEspecial: serieCodigo
};
    })
    .sort((a, b) => a.boxNum - b.boxNum);
};



FEMFLOW.engineTreino.intercalarHIIT = blocos => {
  const out = [];
  let buffer = [];
  let currentBox = null;

  const flush = () => {
    if (buffer.length) {
      out.push(...buffer.sort((a,b)=>a.ordemNum-b.ordemNum));
      buffer = [];
    }
  };

  for (const b of blocos) {
    // treino OU hiit pertencem ao mesmo box
    if (b.tipo === "treino" || b.tipo === "hiit") {
      if (currentBox !== null && b.boxNum !== currentBox) {
        flush();
      }
      buffer.push(b);
      currentBox = b.boxNum;
    } else {
      flush();
      out.push(b);
      currentBox = null;
    }
  }

  flush();
  return out;
};

/* ============================================================
   6) CONVERSÃO PARA FRONT — VERSÃO FINAL FEMFLOW
============================================================ */
FEMFLOW.engineTreino.converterParaFront = function (blocos) {
  const out = [];

  for (const b of blocos) {

     // 🔒 Segurança: nunca converter box técnico como treino
if (b.tipo === "treino" && Number(b.boxNum) >= 900) {
  continue;
}

    /* =========================
       AQUECIMENTO
    ========================= */
    if (b.tipo === "aquecimento") {
      out.push({
        tipo: "aquecimentoPremium",
        box: 0,
        titulo: "🌿 Aquecimento",
        passos: b.passos || []
      });
      continue;
    }

    /* =========================
       TREINO (EXERCÍCIO)
    ========================= */
    if (b.tipo === "treino") {
      const titulo = FEMFLOW.engineTreino.selecionarTitulo(b) || "Exercício";
      out.push({
        tipo: "treino",
        box: Number(b.boxNum || b.box || 1),
        serieEspecial: b.serieEspecial || null,
        titulo,
        link: b.link || "",
        series: b.series || "",
        reps: b.reps || "",
        tempo: b.tempo || "",
        distancia: b.distancia || "",
        intervalo: Number(b.intervalo) || 60
      });
      continue;
    }

   /* =========================
   HIIT
========================= */
if (b.tipo === "hiit") {
  const boxBase = Number(b.boxNum || 500);
  const titulo = FEMFLOW.engineTreino.selecionarTitulo(b) || "🔥 HIIT";

  const leve = Number(b.leve ?? b.fraco) || 20;
  const ciclos = Number(b.ciclos ?? b.ciclo) || 6;

  out.push({
    tipo: "hiitPremium",

    // 🔥 CHAVE VISUAL (nova)
    boxKey: `${boxBase}_hiit`,

    // mantém box numérico para ordenação
    box: boxBase,

    titulo,
    link: b.link || "",
    forte: Number(b.forte) || 40,
    leve,
    ciclos
  });
  continue;
}


    /* =========================
       CARDIO FINAL
    ========================= */
    if (b.tipo === "cardio_final") {
      out.push({
        tipo: "cardio_final",
        box: Number(b.boxNum || 900),
        titulo: FEMFLOW.engineTreino.selecionarTitulo(b) || "💗 Cardio Final",
        link: b.link || "",
        series: b.series ?? b.serie ?? "",
        tempo: b.tempo ?? "",
        distancia: b.distancia ?? b.reps ?? "",
        ritmo: b.ritmo ?? "",
        intervalo: Number(b.intervalo) || 0,
        duracao: Number(b.tempo) || 0
      });
      continue;
    }

    /* =========================
       CARDIO INTERMEDIARIO
    ========================= */
    if (b.tipo === "cardio_intermediario" || b.tipo === "cardio") {
      out.push({
        tipo: "cardio_intermediario",
        box: Number(b.boxNum || 0.5),
        titulo: FEMFLOW.engineTreino.selecionarTitulo(b) || "💗 Cardio",
        link: b.link || "",
        series: b.series ?? b.serie ?? "",
        tempo: b.tempo ?? "",
        distancia: b.distancia ?? b.reps ?? "",
        ritmo: b.ritmo ?? "",
        intervalo: Number(b.intervalo) || 0,
        duracao: Number(b.tempo) || 0
      });
      continue;
    }

    /* =========================
       RESFRIAMENTO
    ========================= */
    if (b.tipo === "resfriamento") {
      out.push({
        tipo: "resfriamentoPremium",
        box: Number(b.boxNum || 999),
        titulo: "🧘 Resfriamento",
        passos: b.passos || []
      });
      continue;
    }
  }
out.forEach(o => {
  console.log("📦 FRONT ITEM:", {
    tipo: o.tipo,
    box: o.box,
    boxKey: o.boxKey,
    serieEspecial: o.serieEspecial
  });
});

  return out;
};

/* ============================================================
   7) MONTAR TREINO FINAL
============================================================ */
FEMFLOW.engineTreino.montarTreinoFinal = async ({
  id, nivel, enfase, fase, diaCiclo, personal=false
}) => {

  const isExtra = FEMFLOW.engineTreino.isExtraEnfase(enfase);

  // 🔒 Personal ignora completamente ênfase
  if (personal === true && !isExtra) {
    enfase = null;
  }

  // 🔒 Treino normal exige ênfase válida
  if (!personal && !isExtra && (!enfase || enfase === "nenhuma" || enfase === "personal")) {
    FEMFLOW.warn("⚠️ Treino normal sem ênfase válida.");
    return [];
  }


  let blocosRaw = [];
  // Regra canônica: o fluxo de fase/dia já vem resolvido antes.
  // Aqui, o único ponto de decisão é o namespace de origem do treino.
  if (isExtra) {
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosExtras({ nivel, enfase });
  } else if (personal) {
    console.log("[engineTreino] Origem selecionada: personal_trainings", { id, fase, diaCiclo });
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosPersonal({ id, fase, diaCiclo });
   } else {
    console.log("[engineTreino] Origem selecionada: exercicios", { nivel, enfase, fase, diaCiclo });
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosNormais({
      nivel,
      enfase,
      fase,
      diaCiclo
    });
  }

  if (!blocosRaw.length) return [];

 const ordenados = FEMFLOW.engineTreino.organizarBlocosSimples(blocosRaw);
const comHIIT   = FEMFLOW.engineTreino.intercalarHIIT(ordenados);

/* 🔒 GARANTIR AQUECIMENTO E RESFRIAMENTO ÚNICOS */
let aquecimentoInserido = false;
let resfriamentoInserido = false;

const filtrados = comHIIT.filter(b => {
  if (b.tipo === "aquecimento") {
    if (aquecimentoInserido) return false;
    aquecimentoInserido = true;
    return true;
  }

  if (b.tipo === "resfriamento") {
    if (resfriamentoInserido) return false;
    resfriamentoInserido = true;
    return true;
  }

  return true;
});

return FEMFLOW.engineTreino.converterParaFront(filtrados);

};

/* ============================================================
   7A) MONTAR TREINO CUSTOMIZADO
============================================================ */
FEMFLOW.engineTreino.montarTreinoCustomizado = async ({
  id, diaCiclo, diaPrograma
}) => {
  const blocosSelecionados =
    JSON.parse(localStorage.getItem("femflow_custom_blocos") || "[]");

  if (!Array.isArray(blocosSelecionados) || blocosSelecionados.length === 0) {
    FEMFLOW.warn("⚠️ Nenhum bloco customizado selecionado.");
    return [];
  }

  const blocosRaw = [];

  for (const [index, docIdRaw] of blocosSelecionados.entries()) {
    const docId = String(docIdRaw || "").trim();
    if (!docId) continue;

    let snap;
    try {
      snap = await firebase.firestore()
        .collection("exercicios_extra")
        .doc(docId)
        .collection("blocos")
        .get();
    } catch (err) {
      console.error("❌ [CUSTOM] Erro ao buscar no Firebase:", err, { docId });
      continue;
    }

    if (snap.empty) {
      FEMFLOW.warn("⚠️ Nenhum bloco customizado encontrado:", { docId });
      continue;
    }

    snap.forEach(d => {
      const data = d.data();
      if (!data.titulo && !data.titulo_pt && !data.titulo_en && !data.titulo_fr) {
        data.titulo = d.id;
      }
      blocosRaw.push({
        ...data,
        customIndex: index
      });
    });
  }

  if (!blocosRaw.length) return [];

  const MAX_EXERCICIOS_POR_BOX = 2;
  const gruposPorIndex = new Map();
  const blocosFixos = [];

  for (const bloco of blocosRaw) {
    if (bloco.tipo === "aquecimento" || bloco.tipo === "resfriamento") {
      blocosFixos.push(bloco);
      continue;
    }

    const index = Number(bloco.customIndex) || 0;
    if (!gruposPorIndex.has(index)) {
      gruposPorIndex.set(index, []);
    }
    gruposPorIndex.get(index).push(bloco);
  }

  let nextBox = 1;
  const blocosOrdenados = [];

  const gruposOrdenados = Array.from(gruposPorIndex.entries()).sort(
    ([a], [b]) => a - b
  );

  for (const [, blocosGrupo] of gruposOrdenados) {
    const ordenados = blocosGrupo
      .slice()
      .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0));

    for (let i = 0; i < ordenados.length; i += MAX_EXERCICIOS_POR_BOX) {
      const boxNum = nextBox;
      const fatia = ordenados.slice(i, i + MAX_EXERCICIOS_POR_BOX);

      for (const b of fatia) {
        const rawLabel = String(b.box || "");
        const serieCodigo = FEMFLOW.engineTreino.detectarSerieEspecial(rawLabel);
        blocosOrdenados.push({
          ...b,
          boxNum,
          boxKey: b.boxKey || null,
          ordemNum: Number(b.ordem) || 0,
          serieEspecial: serieCodigo
        });
      }

      nextBox += 1;
    }
  }

  for (const b of blocosFixos) {
    const rawLabel = String(b.box || "");
    const serieCodigo = FEMFLOW.engineTreino.detectarSerieEspecial(rawLabel);
    const boxNum = b.tipo === "aquecimento" ? -100 : 999;
    blocosOrdenados.push({
      ...b,
      boxNum,
      boxKey: b.boxKey || null,
      ordemNum: Number(b.ordem) || 0,
      serieEspecial: serieCodigo
    });
  }

  blocosOrdenados.sort((a, b) => a.boxNum - b.boxNum);

  const comHIIT = FEMFLOW.engineTreino.intercalarHIIT(blocosOrdenados);
  let aquecimentoInserido = false;
  let resfriamentoInserido = false;

  const filtrados = comHIIT.filter(b => {
    if (b.tipo === "aquecimento") {
      if (aquecimentoInserido) return false;
      aquecimentoInserido = true;
      return true;
    }

    if (b.tipo === "resfriamento") {
      if (resfriamentoInserido) return false;
      resfriamentoInserido = true;
      return true;
    }

    return true;
  });

  return FEMFLOW.engineTreino.converterParaFront(filtrados);
};

/* ============================================================
   7B) MONTAR TREINO ENDURANCE (PERSONAL)
============================================================ */
FEMFLOW.engineTreino.montarTreinoEndurance = async ({
  id, semana, dia, enfase
}) => {
  const blocosRaw = await FEMFLOW.engineTreino.carregarBlocosEndurance({
    id,
    semana,
    dia,
    enfase
  });

  if (!blocosRaw.length) return [];

  const ordenados = FEMFLOW.engineTreino.organizarBlocosSimples(blocosRaw);
  const comHIIT = FEMFLOW.engineTreino.intercalarHIIT(ordenados);

  let aquecimentoInserido = false;
  let resfriamentoInserido = false;

  const filtrados = comHIIT.filter(b => {
    if (b.tipo === "aquecimento") {
      if (aquecimentoInserido) return false;
      aquecimentoInserido = true;
      return true;
    }

    if (b.tipo === "resfriamento") {
      if (resfriamentoInserido) return false;
      resfriamentoInserido = true;
      return true;
    }

    return true;
  });

  return FEMFLOW.engineTreino.converterParaFront(filtrados);
};

/* ============================================================
   8) LISTAR EXERCÍCIOS POR DIA (USO EM MODAL)
============================================================ */
FEMFLOW.engineTreino.listarExerciciosDia = async ({
  id, nivel, enfase, fase, diaCiclo, personal = false
}) => {
  const isExtra = FEMFLOW.engineTreino.isExtraEnfase(enfase);

  if (isExtra) {
    return [];
  }

  if (personal === true && !isExtra) {
    enfase = null;
  }

  if (!personal && !isExtra && (!enfase || enfase === "nenhuma" || enfase === "personal")) {
    FEMFLOW.warn("⚠️ Lista do próximo treino sem ênfase válida.");
    return [];
  }

  let blocosRaw = [];
  // Mesmo fluxo para preview/lista: muda apenas a origem (personal_trainings vs exercicios).
  if (personal) {
    console.log("[engineTreino] Lista por dia usando origem personal_trainings", { id, fase, diaCiclo });
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosPersonal({ id, fase, diaCiclo });
  } else {
    console.log("[engineTreino] Lista por dia usando origem exercicios", { nivel, enfase, fase, diaCiclo });
    blocosRaw = await FEMFLOW.engineTreino.carregarBlocosNormais({
      nivel,
      enfase,
      fase,
      diaCiclo
    });
  }

  if (!blocosRaw.length) return [];

  const ordenados = FEMFLOW.engineTreino.organizarBlocosSimples(blocosRaw);
  const comHIIT = FEMFLOW.engineTreino.intercalarHIIT(ordenados);
  const nomes = [];
  const vistos = new Set();

  for (const bloco of comHIIT) {
    if (bloco.tipo !== "treino") continue;
    const titulo = FEMFLOW.engineTreino.selecionarTitulo(bloco);
    if (!titulo || vistos.has(titulo)) continue;
    nomes.push(titulo);
    vistos.add(titulo);
  }

  return nomes;
};
