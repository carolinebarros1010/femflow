/* ============================================================
   FLOWCENTER.JS — FemFlow 2025 • VERSÃO FINAL CANÔNICA
   ✔ Perfil vem de VALIDAR
   ✔ Suporte total a idioma
   ✔ Círculo hormonal completo
   ✔ Separação ACESSO x MODO PERSONAL
=========================================================== */

const LINK_ACESSO_APP = "https://pay.hotmart.com/T103984580L?off=ifcs6h6n";
const ENDURANCE_PUBLIC_IDS = [
  "bike_20000m",
  "bike_40000m",
  "corrida_5k",
  "corrida_10k",
  "corrida_15k",
  "corrida_21k",
  "corrida_42k",
  "natacao_750m",
  "natacao_1500m",
  "natacao_2000m"
];

const ENDURANCE_PUBLIC_LABELS = {
  bike_20000m: "Bike 20 km",
  bike_40000m: "Bike 40 km",
  corrida_5k: "Corrida 5 km",
  corrida_10k: "Corrida 10 km",
  corrida_15k: "Corrida 15 km",
  corrida_21k: "Corrida 21 km",
  corrida_42k: "Corrida 42 km",
  natacao_750m: "Natação 750 m",
  natacao_1500m: "Natação 1500 m",
  natacao_2000m: "Natação 2000 m"
};

function parseBooleanish(value) {
  if (typeof value === "boolean") return value;
  if (value == null) return false;
  const normalized = String(value).trim().toLowerCase();
  return ["true", "1", "yes", "sim", "y"].includes(normalized);
}

function parseFreeEnfases(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(item => String(item || "").toLowerCase().trim()).filter(Boolean);
  }

  const text = String(raw).trim();
  if (!text) return [];

  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed.map(item => String(item || "").toLowerCase().trim()).filter(Boolean);
      }
    } catch (err) {
      // fall back to splitting
    }
  }

  return text
    .split(/[,\n;|]+/)
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseFreeUntil(raw) {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().split("T")[0];
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

function normalizarFreeAccess(perfil) {
  if (!perfil) return null;

  if (perfil.free_access) {
    if (typeof perfil.free_access === "string") {
      try {
        const parsed = JSON.parse(perfil.free_access);
        if (parsed && typeof parsed === "object") return parsed;
      } catch (err) {
        // ignore
      }
    } else if (typeof perfil.free_access === "object") {
      return perfil.free_access;
    }
  }

  const enabledRaw =
    perfil.freeEnabled ??
    perfil.FreeEnabled ??
    perfil.free_enabled ??
    perfil.freeenabled;
  const enfasesRaw =
    perfil.freeEnfases ??
    perfil.FreeEnfases ??
    perfil.free_enfases ??
    perfil.freeenfases;
  const untilRaw =
    perfil.freeUntil ??
    perfil.FreeUntil ??
    perfil.free_until ??
    perfil.freeuntil;

  if (enabledRaw == null && enfasesRaw == null && untilRaw == null) {
    return null;
  }

  return {
    enabled: parseBooleanish(enabledRaw),
    enfases: parseFreeEnfases(enfasesRaw),
    until: parseFreeUntil(untilRaw)
  };
}

function buildPerfilFromStorage() {
  const id = localStorage.getItem("femflow_id") || "";
  const email = localStorage.getItem("femflow_email") || "";
  if (!id && !email) return null;

  return {
    id,
    email,
    nome: localStorage.getItem("femflow_nome") || "Aluna",
    fase: localStorage.getItem("femflow_fase") || "follicular",
    diaCiclo: Number(localStorage.getItem("femflow_diaCiclo") || 1),
    diaPrograma: Number(localStorage.getItem("femflow_diaPrograma") || 1),
    ciclo_duracao: Number(localStorage.getItem("femflow_cycleLength") || 28),
    enfase: localStorage.getItem("femflow_enfase") || "",
    produto: localStorage.getItem("femflow_produto") || "",
    ativa: localStorage.getItem("femflow_ativa") === "true",
    acessos: {
      personal: localStorage.getItem("femflow_has_personal") === "true"
    },
    free_access: localStorage.getItem("femflow_free_access") || ""
  };
}

/* ============================================================
   🔄 PERFIL — VALIDAR (fonte da verdade)
=========================================================== */
function flowcenterSyncPerfil() {
  const id = localStorage.getItem("femflow_id") || "";
  const email = localStorage.getItem("femflow_email") || "";
  if (!id && !email) return { status: "no_auth" };

  const qs = new URLSearchParams({ action: "validar" });
  if (id) qs.set("id", id);
  else qs.set("email", email);

  const url = `${FEMFLOW.SCRIPT_URL}?${qs.toString()}`;
  return fetch(url).then(r => r.json()).catch(() => ({ status: "error" }));
}

function flowcenterPersistPerfil(perfil) {
  const freeAccess = normalizarFreeAccess(perfil);
  localStorage.setItem("femflow_fase", String(perfil.fase || "follicular").toLowerCase());
  localStorage.setItem("femflow_diaCiclo", String(perfil.diaCiclo || 1));
  localStorage.setItem("femflow_diaPrograma", String(perfil.diaPrograma || 1));
  if (perfil.ciclo_duracao) {
    localStorage.setItem("femflow_cycleLength", String(perfil.ciclo_duracao));
  }
  localStorage.setItem(
    "femflow_free_access",
    freeAccess ? JSON.stringify(freeAccess) : ""
  );

  /* ============================================================
     🧭 ÊNFASE — SÓ sobrescreve se vier VÁLIDA do backend
     (protege seleção feita na Home)
  ============================================================ */
  const enfaseBackend = String(perfil.enfase || "").toLowerCase();

  if (enfaseBackend && enfaseBackend !== "nenhuma") {
    localStorage.setItem("femflow_enfase", enfaseBackend);
  }
  // ❗ caso contrário, mantém a enfase atual do front

  /* ============================================================
     🔒 DIREITO PERSONAL (backend)
  ============================================================ */
  const acessos = perfil.acessos || {};
  const produto = String(perfil.produto || "").toLowerCase();
  const isVip = produto === "vip";
  localStorage.setItem(
    "femflow_has_personal",
    acessos.personal === true || isVip ? "true" : "false"
  );
}


/* ============================================================
   🚀 INIT
=========================================================== */
document.addEventListener("DOMContentLoaded", initFlowCenter);

function initFlowCenter() {

  FEMFLOW.loading.show("Preparando seu painel…");

  FEMFLOW.inserirHeaderApp?.();
  FEMFLOW.inserirMenuLateral?.();
  FEMFLOW.inserirModalIdioma?.();

  /* ============================================================
     1) PERFIL BASE (auth)
  ============================================================ */
  FEMFLOW.carregarPerfil()
    .then((perfilBase) => {
      if (!perfilBase) {
        const perfilLocal = buildPerfilFromStorage();
        if (!perfilLocal) {
          FEMFLOW.toast("Sessão inválida.");
          FEMFLOW.clearSession();
          FEMFLOW.dispatch("stateChanged", { type: "auth", impact: "estrutural" });
          return null;
        }
        FEMFLOW.toast("Sem conexão agora. Usando dados salvos.");
        return perfilLocal;
      }

      if (perfilBase.status === "blocked" || perfilBase.status === "denied") {
        FEMFLOW.toast("Sessão inválida.");
        FEMFLOW.clearSession();
        FEMFLOW.dispatch("stateChanged", { type: "auth", impact: "estrutural" });
        return null;
      }

      return flowcenterSyncPerfil().then((perfilFresh) => {
        if (!perfilFresh || perfilFresh.status !== "ok") {
          if (perfilFresh?.status === "blocked" || perfilFresh?.status === "denied") {
            FEMFLOW.toast("Sessão inválida.");
            FEMFLOW.clearSession();
            FEMFLOW.dispatch("stateChanged", { type: "auth", impact: "estrutural" });
            return null;
          }

          FEMFLOW.toast("Sem conexão agora. Usando dados salvos.");
          return perfilBase;
        }

        flowcenterPersistPerfil(perfilFresh);
        return { ...perfilBase, ...perfilFresh };
      });
    })
    .then(async (perfil) => {
      if (!perfil) return;

  /* ============================================================
     3) CICLO
  ============================================================ */
  if (perfil.fase && perfil.diaCiclo) {
    localStorage.setItem("femflow_cycle_configured", "yes");
  }

  if (!localStorage.getItem("femflow_cycle_configured")) {
    FEMFLOW.toast("Configure seu ciclo antes 🌸");
    FEMFLOW.dispatch("stateChanged", {
      type: "ciclo",
      impact: "estrutural",
      source: "ciclo.html"
    });
    return;
  }

  /* ============================================================
     4) PRODUTO / ACESSOS (CORRETO)
  ============================================================ */
  const resetEnduranceConfig = ({ preservePublicIntent = false } = {}) => {
    const publicIntentAtual = localStorage.getItem("femflow_endurance_public_intent");

    [
      "femflow_endurance_dia",
      "femflow_endurance_semana",
      "femflow_endurance_modalidade",
      "femflow_endurance_config",
      "femflow_endurance_pending",
      "femflow_endurance_setup_done",
      "femflow_treino_endurance",
      "femflow_endurance_public_enabled",
      "femflow_endurance_estimulo",
      "femflow_endurance_public_intent",
      "femflow_endurance_mode",
      "femflow_endurance_personal_cache"
    ].forEach((key) => localStorage.removeItem(key));

    if (preservePublicIntent && publicIntentAtual === "true") {
      localStorage.setItem("femflow_endurance_public_intent", "true");
    }
  };

  const fetchEndurancePlanToken = async () => {
    const id = localStorage.getItem("femflow_id") || perfil.id || "";
    if (!id || !FEMFLOW.post) return "";
    try {
      const resp = await FEMFLOW.post({
        action: "endurance_plan_token",
        id
      });
      return String(resp?.token || resp?.endurance_plan_token || "").trim();
    } catch (err) {
      console.warn("Falha ao buscar token de Endurance:", err);
      return "";
    }
  };

  const applyEnduranceResetIfNeeded = async () => {
    let token = String(
      perfil.novo_treino_endurance ??
      perfil.novo_treino ??
      perfil.endurance_updated_at ??
      perfil.endurance_plan_version ??
      ""
    ).trim();
    if (!token) {
      token = await fetchEndurancePlanToken();
    }
    if (!token) return;
    const lastToken = localStorage.getItem("femflow_endurance_plan_token") || "";
    if (token !== lastToken) {
      resetEnduranceConfig({
        preservePublicIntent:
          localStorage.getItem("femflow_endurance_public_intent") === "true"
      });
      localStorage.setItem("femflow_endurance_plan_token", token);
    }
  };

  await applyEnduranceResetIfNeeded();

  const produtoRaw   = String(perfil.produto || "").toLowerCase();
  const isVip = produtoRaw === "vip";
  const isTrial = produtoRaw === "trial_app";
  const ativa = parseBooleanish(perfil.ativa);
  const hasPersonal  = localStorage.getItem("femflow_has_personal") === "true";
  const modePersonal = localStorage.getItem("femflow_mode_personal") === "true";
  const enduranceConfigRaw = localStorage.getItem("femflow_endurance_config");
  const enduranceSetupExists =
    (enduranceConfigRaw !== null && enduranceConfigRaw !== "") ||
    localStorage.getItem("femflow_endurance_setup_done") === "true";
  const endurancePlanToken = String(perfil.novo_treino_endurance || "").trim();
  const endurancePlanAvailable = Boolean(endurancePlanToken);

  // 🔥 regra canônica
  const endurancePublicIntent = localStorage.getItem("femflow_endurance_public_intent") === "true";

  // Personal e Endurance Público são estados independentes: durante o
  // fluxo público, apenas priorizamos o público para Endurance sem sobrescrever
  // flags de personal salvas em localStorage.
  const personal = hasPersonal && modePersonal;
  const endurancePublicEnabled = localStorage.getItem("femflow_endurance_public_enabled") === "true";
  const enduranceEnabled = personal || endurancePlanAvailable || endurancePublicEnabled || endurancePublicIntent;

  const isApp    = produtoRaw === "acesso_app" || isTrial;
  const isFollow = produtoRaw.startsWith("followme_");
  const enfaseAtualUI = localStorage.getItem("femflow_enfase");
  const acessoAtivo = isVip || ativa;

  /* ============================================================
     🔒 BLOQUEIO ENDURANCE — APP sem personal e sem seleção
  ============================================================ */
  const isAppProduto = produtoRaw === "acesso_app";
  const isPersonalPerfil = parseBooleanish(perfil.personal) || produtoRaw.startsWith("personal");
  const enfaseAtualPerfil = String(perfil.enfase || "").toLowerCase();
  const enduranceSelecionado = enfaseAtualPerfil.startsWith("endurance_");
  const bloquearEnduranceApp =
    isAppProduto && !personal && !isPersonalPerfil && !enduranceSelecionado && !endurancePublicIntent;

  const freeAccess = normalizarFreeAccess(perfil);
  const freeEnabled = freeAccess?.enabled === true;
  const freeUntil   = freeAccess?.until ? new Date(freeAccess.until) : null;
  const freeValido  = freeEnabled && freeUntil && freeUntil >= new Date();
  const freeEnfases = (freeAccess?.enfases || []).map(e => e.toLowerCase());
  const freeOkUI = Boolean(enfaseAtualUI) && freeValido && freeEnfases.includes(enfaseAtualUI);
  const treinoAcessoOk = personal || acessoAtivo || freeOkUI;
  const isCustomTreino = localStorage.getItem("femflow_custom_treino") === "true";

  /* ============================================================
     5) CICLO (UI)
  ============================================================ */
  const normalizarFase = (raw) => {
    const f = String(raw || "").toLowerCase().trim();
    if (!f) return "follicular";
    return {
      ovulatória: "ovulatory",
      ovulatoria: "ovulatory",
      ovulação: "ovulatory",
      ovulation: "ovulatory",
      folicular: "follicular",
      follicular: "follicular",
      lútea: "luteal",
      lutea: "luteal",
      luteal: "luteal",
      menstrual: "menstrual",
      menstruação: "menstrual",
      menstruacao: "menstrual",
      menstruation: "menstrual"
    }[f] || f;
  };

  const ciclo = {
    fase: normalizarFase(perfil.fase),
    diaCiclo: Number(perfil.diaCiclo || 1),
    diaPrograma: Number(perfil.diaPrograma || 1)
  };

  /* ============================================================
     6) NÍVEL
  ============================================================ */
  function aplicarNivel() {
    const nivel = (perfil.nivel || "iniciante").toLowerCase();
    const map = {
      iniciante:{pt:"Iniciante",en:"Beginner",fr:"Débutante"},
      intermediaria:{pt:"Intermediária",en:"Intermediate",fr:"Intermédiaire"},
      avancada:{pt:"Avançada",en:"Advanced",fr:"Avancée"}
    };
    const lang = FEMFLOW.lang || "pt";
    document.getElementById("nivelTag").textContent =
      `— ${map[nivel]?.[lang] || map[nivel].pt}`;
  }
  aplicarNivel();
  document.addEventListener("femflow:langChange", aplicarNivel);

  const t = (path, vars = {}) => {
    const lang = FEMFLOW.lang || "pt";
    const parts = path.split(".");
    let text = FEMFLOW.langs?.[lang];
    for (const p of parts) {
      text = text?.[p];
    }
    if (typeof text !== "string") return path;
    return text
      .replace(/\{(\w+)\}/g, (_, key) =>
        vars[key] !== undefined ? vars[key] : `{${key}}`
      )
      .replace(/\{\{(\w+)\}\}/g, (_, key) =>
        vars[key] !== undefined ? vars[key] : `{{${key}}}`
      );
  };

  /* ============================================================
     7) IDIOMA
  ============================================================ */
  function aplicarIdioma() {
    const lang = FEMFLOW.lang || "pt";
    const L = FEMFLOW.langs?.[lang]?.flowcenter;
    if (!L) return;

    const nome = perfil.nome?.split(" ")[0] || "";
    document.getElementById("tituloFlow").textContent = `${nome}, ${L.titulo}`;
    document.getElementById("subFlow").textContent = L.sub;

    const faseLabel = L[normalizarFase(ciclo.fase)] || ciclo.fase;
    document.getElementById("centerPhase").textContent = faseLabel;
    document.getElementById("t_current").textContent =
      `${L.faseAtual}: ${faseLabel}`;

    ["menstrual","follicular","ovulatory","luteal"].forEach(f => {
      document.getElementById("lbl-"+f).textContent = L[f];
    });

    document.getElementById("toBreath").textContent    = `💨 ${L.respiracao}`;
    const customLabel = isCustomTreino ? "🔓" : "🔒";
    const treinoDisponivel = !isCustomTreino && treinoAcessoOk;
    const treinoLabel = treinoDisponivel ? "🏋️‍♂️" : "🔒";
    const extraLabel = !isCustomTreino && treinoAcessoOk ? "✨" : "🔒";
    const treinoBtn = document.getElementById("toTrain");
    treinoBtn.textContent = `${treinoLabel} ${L.treino}`;
    treinoBtn.classList.toggle("tool-cta", treinoDisponivel);
    treinoBtn.classList.toggle("tool-locked", !treinoDisponivel);
    document.getElementById("toExtraTrain").textContent = `${extraLabel} ${L.treinoExtra}`;
  const customBtn = document.getElementById("toCustomTrain");
    if (customBtn) {
      customBtn.textContent = `${customLabel} ${L.treinoCustom}`;
    }
    document.getElementById("toEvolution").textContent = `📈 ${L.evolucao}`;
    const enduranceLabel = enduranceEnabled ? "🏃‍♂️" : "🔒";
    document.getElementById("toEndurance").textContent =
      `${enduranceLabel} ${L.endurance}`;
    const extraTitle = document.getElementById("extraTitle");
    const extraSub = document.getElementById("extraSub");
    if (extraTitle) extraTitle.textContent = L.treinoExtraTitulo;
    if (extraSub) extraSub.textContent = L.treinoExtraSub;

    const extraLabels = {
      extra_superior: L.treinoExtraSuperior,
      extra_inferior: L.treinoExtraInferior,
      extra_abdomen: L.treinoExtraAbdomem,
      extra_mobilidade: L.treinoExtraMobilidade,
      extra_biceps: L.treinoExtraBiceps,
      extra_triceps: L.treinoExtraTriceps,
      extra_ombro: L.treinoExtraOmbro,
      extra_quadriceps: L.treinoExtraQuadriceps,
      extra_posterior: L.treinoExtraPosterior,
      extra_peito: L.treinoExtraPeito,
      extra_costas: L.treinoExtraCostas,
      extra_gluteo: L.treinoExtraGluteo
    };
    document.querySelectorAll("[data-extra-enfase]").forEach(btn => {
      const key = btn.dataset.extraEnfase;
      if (extraLabels[key]) btn.textContent = extraLabels[key];
    });

    const extraClose = document.getElementById("fecharExtra");
    if (extraClose) extraClose.textContent = L.treinoExtraFechar;

    const enduranceModalTitulo = document.getElementById("enduranceModalTitulo");
    const enduranceModalSub = document.getElementById("enduranceModalSub");
    const enduranceModalidadeLabel = document.getElementById("enduranceModalidadeLabel");
    const enduranceModalidadePlaceholder = document.getElementById("enduranceModalidadePlaceholder");
    const enduranceTreinosLabel = document.getElementById("enduranceTreinosLabel");
    const enduranceDiasLabel = document.getElementById("enduranceDiasLabel");
    const enduranceRitmoLabel = document.getElementById("enduranceRitmoLabel");
    const enduranceRitmoInfo = document.getElementById("enduranceRitmoInfo");
    const enduranceRitmoInput = document.getElementById("enduranceRitmo");
    const enduranceCancelar = document.getElementById("enduranceCancelar");
    const enduranceSalvar = document.getElementById("enduranceSalvar");
    const enduranceSelecaoTitulo = document.getElementById("enduranceSelecaoTitulo");
    const enduranceSelecaoSub = document.getElementById("enduranceSelecaoSub");
    const enduranceSelecaoSemanaLabel = document.getElementById("enduranceSelecaoSemanaLabel");
    const enduranceSelecaoDiaLabel = document.getElementById("enduranceSelecaoDiaLabel");
    const enduranceSelecaoCancelar = document.getElementById("enduranceSelecaoCancelar");
    const enduranceSelecaoContinuar = document.getElementById("enduranceSelecaoContinuar");

    if (enduranceModalTitulo) enduranceModalTitulo.textContent = L.enduranceModalTitulo;
    if (enduranceModalSub) enduranceModalSub.textContent = L.enduranceModalSub;
    if (enduranceModalidadeLabel) enduranceModalidadeLabel.textContent = L.enduranceModalidadeLabel;
    if (enduranceModalidadePlaceholder) enduranceModalidadePlaceholder.textContent = L.enduranceModalidadePlaceholder;
    if (enduranceTreinosLabel) enduranceTreinosLabel.textContent = L.enduranceTreinosLabel;
    if (enduranceDiasLabel) enduranceDiasLabel.textContent = L.enduranceDiasLabel;
    if (enduranceRitmoLabel) enduranceRitmoLabel.textContent = L.enduranceRitmoLabel;
    if (enduranceRitmoInfo) {
      enduranceRitmoInfo.title = L.enduranceRitmoInfo;
      enduranceRitmoInfo.setAttribute("aria-label", L.enduranceRitmoInfo);
      enduranceRitmoInfo.dataset.tooltip = L.enduranceRitmoInfo;
    }
    if (enduranceRitmoInput) enduranceRitmoInput.placeholder = L.enduranceRitmoPlaceholder;
    if (enduranceCancelar) enduranceCancelar.textContent = L.enduranceCancelar;
    if (enduranceSalvar) enduranceSalvar.textContent = L.enduranceSalvar;
    if (enduranceSelecaoTitulo) enduranceSelecaoTitulo.textContent = L.enduranceSelecaoTitulo;
    if (enduranceSelecaoSub) enduranceSelecaoSub.textContent = L.enduranceSelecaoSub;
    if (enduranceSelecaoSemanaLabel) enduranceSelecaoSemanaLabel.textContent = L.enduranceSelecaoSemanaLabel;
    if (enduranceSelecaoDiaLabel) enduranceSelecaoDiaLabel.textContent = L.enduranceSelecaoDiaLabel;
    if (enduranceSelecaoCancelar) enduranceSelecaoCancelar.textContent = L.enduranceSelecaoCancelar;
    if (enduranceSelecaoContinuar) enduranceSelecaoContinuar.textContent = L.enduranceSelecaoContinuar;

    const modalCaminhosEscolhaTitulo = document.getElementById("modalCaminhosEscolhaTitulo");
    const modalCaminhosFechar = document.getElementById("modalCaminhosFechar");
    const modalCaminhosMudar = document.getElementById("modalCaminhosMudar");
    const modalCaminhosIniciar = document.getElementById("modalCaminhosIniciar");

    if (modalCaminhosEscolhaTitulo) {
      modalCaminhosEscolhaTitulo.textContent = t("flowcenter.caminhosEscolhaTitulo");
    }
    if (modalCaminhosFechar) {
      modalCaminhosFechar.textContent = t("flowcenter.caminhosFechar");
    }
    if (modalCaminhosMudar) {
      modalCaminhosMudar.textContent = t("flowcenter.caminhosMudar");
    }
    if (modalCaminhosIniciar) {
      modalCaminhosIniciar.textContent = t("flowcenter.caminhosIniciar");
    }
  }
  aplicarIdioma();
  document.addEventListener("femflow:langChange", aplicarIdioma);

  /* ============================================================
     8) CÍRCULO HORMONAL
  ============================================================ */
  ["menstrual","follicular","ovulatory","luteal"].forEach(f => {
    document.getElementById("seg-"+f)
      ?.classList.toggle("path-active", f === ciclo.fase);
    document.getElementById("lbl-"+f)
      ?.classList.toggle("label-active", f === ciclo.fase);
  });

  /* ============================================================
     9) BOTÕES
  ============================================================ */
  document.getElementById("toBreath").onclick =
    () => FEMFLOW.router("respiracao.html");

  document.getElementById("toEvolution").onclick =
    () => FEMFLOW.router("evolucao.html");

  const modalExtra = document.getElementById("modal-extra");
  const modalEndurance = document.getElementById("modal-endurance");
  const modalEnduranceSelecao = document.getElementById("modal-endurance-selecao");
  const modalEndurancePersonal = document.getElementById("modal-endurance-personal");
  const modalEnduranceModalidade = document.getElementById("enduranceModalidade");
  const modalEnduranceTreinos = document.getElementById("enduranceTreinosSemana");
  const modalEnduranceDias = document.getElementById("enduranceDiasSemana");
  const modalEnduranceRitmo = document.getElementById("enduranceRitmo");
  const modalEnduranceCancelar = document.getElementById("enduranceCancelar");
  const modalEnduranceSalvar = document.getElementById("enduranceSalvar");
  const modalEnduranceSemana = document.getElementById("enduranceSemana");
  const modalEnduranceDia = document.getElementById("enduranceDia");
  const modalEnduranceRitmoInfo = document.getElementById("enduranceRitmoInfo");
  const modalEnduranceSelecaoCancelar = document.getElementById("enduranceSelecaoCancelar");
  const modalEnduranceSelecaoContinuar = document.getElementById("enduranceSelecaoContinuar");
  const modalEndurancePersonalSemanas = document.getElementById("endurancePersonalSemanas");
  const modalEndurancePersonalDias = document.getElementById("endurancePersonalDias");
  const modalEndurancePersonalCancelar = document.getElementById("endurancePersonalCancelar");
  const modalEndurancePersonalConfirmar = document.getElementById("endurancePersonalConfirmar");
  const modalEndurancePersonalModalidadeBadge = document.getElementById("endurancePersonalModalidadeBadge");
  const modalEndurancePersonalLoading = document.getElementById("endurancePersonalLoading");
  const modalEndurancePersonalContent = document.getElementById("endurancePersonalContent");
  const modalEndurancePersonalEmpty = document.getElementById("endurancePersonalEmpty");
  const modalEndurancePersonalFalar = document.getElementById("endurancePersonalFalar");
  const modalEndurancePersonalHint = document.getElementById("endurancePersonalHint");
  const modalEndurancePersonalActions = document.getElementById("endurancePersonalActions");
  const modalCaminhosEscolha = document.getElementById("modalCaminhosEscolha");
  const modalCaminhosPreview = document.getElementById("modalCaminhosPreview");
  const modalCaminhosUltimo = document.getElementById("modalCaminhosUltimo");
  const modalCaminhosSugerido = document.getElementById("modalCaminhosSugerido");
  const modalCaminhosFase = document.getElementById("modalCaminhosFase");
  const modalCaminhosBotoes = document.getElementById("modalCaminhosBotoes");
  const modalCaminhosPreviewTitulo = document.getElementById("modalCaminhosPreviewTitulo");
  const modalCaminhosPreviewLista = document.getElementById("modalCaminhosPreviewLista");
  const modalCaminhosFechar = document.getElementById("modalCaminhosFechar");
  const modalCaminhosMudar = document.getElementById("modalCaminhosMudar");
  const modalCaminhosIniciar = document.getElementById("modalCaminhosIniciar");
  const extraBtn = document.getElementById("toExtraTrain");
  const extraClose = document.getElementById("fecharExtra");

  const caminhosApi = FEMFLOW.treinoCaminhos;
  const faseMetodoAtual = caminhosApi?.normalizarFaseMetodo?.(ciclo.fase || localStorage.getItem("femflow_fase") || "follicular") || (ciclo.fase || localStorage.getItem("femflow_fase") || "follicular");
  const caminhoSelecionadoState = { caminho: null };
  const distribuicaoState = {
    valor: caminhosApi?.DISTRIBUICAO_FALLBACK || "ABCDE",
    totalCaminhos: 5
  };

  const closeEnduranceInfoTooltip = () => {
    modalEnduranceRitmoInfo?.setAttribute("data-open", "false");
  };

  if (modalEnduranceRitmoInfo) {
    modalEnduranceRitmoInfo.addEventListener("click", (event) => {
      event.preventDefault();
      const isOpen = modalEnduranceRitmoInfo.getAttribute("data-open") === "true";
      modalEnduranceRitmoInfo.setAttribute("data-open", isOpen ? "false" : "true");
    });

    modalEnduranceRitmoInfo.addEventListener("blur", closeEnduranceInfoTooltip);
    modalEnduranceRitmoInfo.addEventListener("mouseleave", closeEnduranceInfoTooltip);

    document.addEventListener("click", (event) => {
      if (!modalEnduranceRitmoInfo.contains(event.target)) {
        closeEnduranceInfoTooltip();
      }
    });
  }

  const abrirModalComLock = (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.remove("oculto");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const fecharModalComUnlock = (modalEl) => {
    if (!modalEl) return;
    const activeEl = document.activeElement;
    if (activeEl && modalEl.contains(activeEl) && typeof activeEl.blur === "function") {
      activeEl.blur();
    }
    modalEl.classList.add("oculto");
    modalEl.setAttribute("aria-hidden", "true");
    if (
      modalExtra?.classList.contains("oculto") !== false &&
      modalEndurance?.classList.contains("oculto") !== false &&
      modalEnduranceSelecao?.classList.contains("oculto") !== false &&
      modalEndurancePersonal?.classList.contains("oculto") !== false &&
      modalCaminhosEscolha?.classList.contains("oculto") !== false &&
      modalCaminhosPreview?.classList.contains("oculto") !== false
    ) {
      document.body.style.overflow = "";
    }
  };

  const fecharModalExtra = () => {
    fecharModalComUnlock(modalExtra);
  };

  const getFaseLabelAtual = () => {
    const lang = FEMFLOW.lang || "pt";
    const L = FEMFLOW.langs?.[lang]?.flowcenter;
    return L?.[faseMetodoAtual] || faseMetodoAtual;
  };

  const carregarDistribuicaoTreino = async () => {
    if (!caminhosApi?.getDistribuicaoDoTreino) {
      return distribuicaoState;
    }
    const nivel = perfil.nivel || localStorage.getItem("femflow_nivel") || "";
    const enfase = localStorage.getItem("femflow_enfase") || "";
    const distribuicao = await caminhosApi.getDistribuicaoDoTreino(nivel, enfase, {
      fase: faseMetodoAtual,
      diaCiclo: ciclo.diaCiclo
    });
    distribuicaoState.valor = caminhosApi.normalizarDistribuicao(distribuicao);
    distribuicaoState.totalCaminhos = distribuicaoState.valor.length;
    return distribuicaoState;
  };

  const obterSugestaoCaminho = () => {
    const ultimo = caminhosApi?.lerUltimoCaminho?.();
    const ultimoMesmoMetodo = ultimo && ultimo.faseMetodo === faseMetodoAtual ? ultimo : null;
    const ultimoCaminho = ultimoMesmoMetodo?.caminho || 1;
    const sugerido = ultimoMesmoMetodo
      ? (caminhosApi?.proximoCaminho?.(ultimoCaminho, distribuicaoState.totalCaminhos) || 1)
      : 1;
    return { ultimo: ultimoMesmoMetodo, ultimoCaminho, sugerido };
  };

  const abrirModalEscolhaCaminho = async () => {
    if (!caminhosApi || !modalCaminhosEscolha || !modalCaminhosBotoes) {
      return FEMFLOW.router("treino.html");
    }

    await carregarDistribuicaoTreino();

    const { ultimo, ultimoCaminho, sugerido } = obterSugestaoCaminho();
    if (modalCaminhosUltimo) {
      modalCaminhosUltimo.textContent = t("flowcenter.caminhosUltimoTreino", {
        caminho: ultimo ? ultimo.caminho : 1
      });
    }
    if (modalCaminhosSugerido) {
      modalCaminhosSugerido.textContent = `Comparativo → ${t("flowcenter.caminhosSugerido", { caminho: sugerido })}`;
    }
    if (modalCaminhosFase) {
      modalCaminhosFase.textContent = personal
        ? `Plano Personal ativo • Fase ${getFaseLabelAtual()}`
        : `Fase ${getFaseLabelAtual()}`;
    }

    modalCaminhosBotoes.innerHTML = "";
    for (let caminho = 1; caminho <= distribuicaoState.totalCaminhos; caminho += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `caminho-btn${caminho === sugerido ? " is-sugerido" : ""}`;
      btn.textContent = `Treino ${caminho}`;
      btn.addEventListener("click", () => {
        void abrirModalPreviewCaminho(caminho);
      });
      modalCaminhosBotoes.appendChild(btn);
    }

    abrirModalComLock(modalCaminhosEscolha);
  };

  const abrirModalPreviewCaminho = async (caminho) => {
    if (!caminhosApi || !modalCaminhosPreview || !modalCaminhosPreviewLista) {
      return;
    }

    caminhoSelecionadoState.caminho = Number(caminho);
    const contexto = caminhosApi.resolverContextoDeBusca(
      faseMetodoAtual,
      caminhoSelecionadoState.caminho,
      distribuicaoState.valor
    );

    if (!contexto?.diaUsado || !contexto?.faseFirestore) {
      FEMFLOW.toast("Não foi possível carregar esse treino agora.");
      return;
    }

    if (modalCaminhosPreviewTitulo) {
      modalCaminhosPreviewTitulo.textContent = `Treino ${caminhoSelecionadoState.caminho} — Fase ${getFaseLabelAtual()}`;
    }

    modalCaminhosPreviewLista.innerHTML = "";

    const nivel = perfil.nivel || localStorage.getItem("femflow_nivel");
    const enfase = localStorage.getItem("femflow_enfase") || "";

    const previewFn = FEMFLOW.engineTreino?.listarExerciciosDia;
    if (typeof previewFn !== "function") {
      console.warn("[flowcenter] engineTreino.listarExerciciosDia indisponível; prévia ficará vazia.");
      const li = document.createElement("li");
      li.textContent = "Prévia indisponível agora.";
      modalCaminhosPreviewLista.appendChild(li);
      fecharModalComUnlock(modalCaminhosEscolha);
      abrirModalComLock(modalCaminhosPreview);
      return;
    }

    const nomes = await previewFn({
      id: localStorage.getItem("femflow_id") || "",
      nivel,
      enfase,
      fase: contexto.faseFirestore,
      diaCiclo: contexto.diaUsado,
      personal
    });

    if (!nomes.length) {
      const li = document.createElement("li");
      li.textContent = "Nenhum exercício encontrado para este treino.";
      modalCaminhosPreviewLista.appendChild(li);
    } else {
      nomes.forEach((nome) => {
        const li = document.createElement("li");
        li.textContent = nome;
        modalCaminhosPreviewLista.appendChild(li);
      });
    }

    fecharModalComUnlock(modalCaminhosEscolha);
    abrirModalComLock(modalCaminhosPreview);
  };

  if (extraBtn) {
    extraBtn.onclick = () => {
      if (isCustomTreino) {
        FEMFLOW.toast("Monte seu treino está ativo.");
        return;
      }
      if (!treinoAcessoOk) {
        FEMFLOW.toast("Seu acesso expirou. Assine para continuar.");
        return FEMFLOW.openExternal(LINK_ACESSO_APP);
      }
      abrirModalComLock(modalExtra);
    };
  }

  if (extraClose) {
    extraClose.onclick = fecharModalExtra;
  }

  if (modalExtra) {
    modalExtra.addEventListener("click", (event) => {
      if (event.target === modalExtra) fecharModalExtra();
    });
  }

  const getModalidadesRenderEndurancePublic = (idsDisponiveis = ENDURANCE_PUBLIC_IDS) => {
    const ids = Array.isArray(idsDisponiveis) ? idsDisponiveis : ENDURANCE_PUBLIC_IDS;
    const modalidadeCard = String(localStorage.getItem("femflow_endurance_modalidade") || "").trim();
    const modoSimplificado = endurancePublicIntent && !!modalidadeCard;

    if (modoSimplificado) {
      if (ids.includes(modalidadeCard)) return [modalidadeCard];
      if (ENDURANCE_PUBLIC_IDS.includes(modalidadeCard)) return [modalidadeCard];
    }

    return ids;
  };

  const renderEndurancePublicModalidades = (idsDisponiveis = ENDURANCE_PUBLIC_IDS) => {
    if (!modalEnduranceModalidade) return;

    const lang = FEMFLOW.lang || "pt";
    const L = FEMFLOW.langs?.[lang]?.flowcenter || {};
    const labels = {
      bike_20000m: L.enduranceBike20k || ENDURANCE_PUBLIC_LABELS.bike_20000m,
      bike_40000m: L.enduranceBike40k || ENDURANCE_PUBLIC_LABELS.bike_40000m,
      corrida_5k: L.enduranceOptCorrida5k || ENDURANCE_PUBLIC_LABELS.corrida_5k,
      corrida_10k: L.enduranceOptCorrida10k || ENDURANCE_PUBLIC_LABELS.corrida_10k,
      corrida_15k: L.enduranceOptCorrida15k || ENDURANCE_PUBLIC_LABELS.corrida_15k,
      corrida_21k: L.enduranceOptCorrida21k || ENDURANCE_PUBLIC_LABELS.corrida_21k,
      corrida_42k: L.enduranceOptCorrida42k || ENDURANCE_PUBLIC_LABELS.corrida_42k,
      natacao_750m: L.enduranceNatacao750m || ENDURANCE_PUBLIC_LABELS.natacao_750m,
      natacao_1500m: L.enduranceNatacao1500m || ENDURANCE_PUBLIC_LABELS.natacao_1500m,
      natacao_2000m: L.enduranceNatacao2000m || ENDURANCE_PUBLIC_LABELS.natacao_2000m
    };

    const idsParaRender = getModalidadesRenderEndurancePublic(idsDisponiveis);
    const placeholder = document.getElementById("enduranceModalidadePlaceholder");
    if (placeholder) {
      placeholder.textContent = idsParaRender.length === 1
        ? "Modalidade selecionada"
        : (L.enduranceModalidadePlaceholder || "Selecione a modalidade");
    }

    modalEnduranceModalidade.innerHTML = "";
    const grupos = [
      { label: L.enduranceModalidadeGrupoCorrida || "Corrida", ids: idsParaRender.filter((id) => String(id).startsWith("corrida_")) },
      { label: L.enduranceModalidadeGrupoOutras || "Outras modalidades", ids: idsParaRender.filter((id) => !String(id).startsWith("corrida_")) }
    ];

    const mostrarTituloGrupo = idsParaRender.length > 1;
    grupos.forEach((grupo) => {
      if (!grupo.ids.length) return;
      if (mostrarTituloGrupo) {
        const title = document.createElement("div");
        title.className = "endurance-modalidade-group-title";
        title.textContent = grupo.label;
        modalEnduranceModalidade.appendChild(title);
      }

      grupo.ids.forEach((id) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "endurance-chip endurance-modalidade-chip";
        btn.dataset.value = id;
        btn.dataset.id = id;
        btn.textContent = labels[id] || id;
        modalEnduranceModalidade.appendChild(btn);
      });
    });
  };

  const listarIdsEndurancePublicDisponiveis = async () => {
    if (!firebase?.firestore) return ENDURANCE_PUBLIC_IDS;

    const checks = await Promise.all(
      ENDURANCE_PUBLIC_IDS.map(async (id) => {
        try {
          const snap = await firebase.firestore().collection("endurance_public").doc(id).get();
          return snap.exists ? id : null;
        } catch (err) {
          console.warn("[ENDURANCE_PUBLIC] Falha ao validar modalidade:", id, err);
          return null;
        }
      })
    );

    const disponiveis = checks.filter(Boolean);
    return disponiveis.length ? disponiveis : ENDURANCE_PUBLIC_IDS;
  };

  const prepararModalidadeEndurance = () => {
    if (!modalEnduranceModalidade) return;
    const modalidadeCard = String(localStorage.getItem("femflow_endurance_modalidade") || "").trim();
    let modalidadeSalva = "";
    try {
      modalidadeSalva = String(
        JSON.parse(localStorage.getItem("femflow_endurance_config") || "{}")?.modalidade || ""
      ).trim();
    } catch (err) {
      console.warn("Falha ao ler configuração endurance salva:", err);
    }
    const modalidadePadrao = modalidadeCard || modalidadeSalva;

    if (modalidadePadrao) {
      toggleChipSingle(modalEnduranceModalidade, modalidadePadrao);
    }

    const travarModalidadePorCard = endurancePublicIntent && !!modalidadeCard;
    const chips = modalEnduranceModalidade.querySelectorAll(".endurance-modalidade-chip");
    chips.forEach((chip) => {
      const travado = travarModalidadePorCard && !chip.classList.contains("is-active");
      chip.classList.toggle("is-disabled", travado);
      chip.setAttribute("aria-disabled", travado ? "true" : "false");
    });
    modalEnduranceModalidade.setAttribute("aria-disabled", travarModalidadePorCard ? "true" : "false");
  };

  renderEndurancePublicModalidades(getModalidadesRenderEndurancePublic());
  void (async () => {
    const idsDisponiveis = await listarIdsEndurancePublicDisponiveis();
    renderEndurancePublicModalidades(getModalidadesRenderEndurancePublic(idsDisponiveis));
    prepararModalidadeEndurance();
  })();

  const abrirModalEndurance = () => {
    prepararModalidadeEndurance();
    abrirModalComLock(modalEndurance);
  };

  const fecharModalEndurance = () => {
    fecharModalComUnlock(modalEndurance);
  };

  const abrirModalEnduranceSelecao = () => {
    if (!modalEnduranceSelecao) return;
    const { semana, dia } = getEnduranceSelecaoAtual();
    const diasDisponiveis = getDiasEnduranceDisponiveis();
    atualizarDiasEnduranceDisponiveis(diasDisponiveis);
    const diaSelecionado = diasDisponiveis.length && !diasDisponiveis.includes(dia)
      ? diasDisponiveis[0]
      : dia;
    toggleChipSingle(modalEnduranceSemana, semana);
    toggleChipSingle(modalEnduranceDia, diaSelecionado);
    abrirModalComLock(modalEnduranceSelecao);
  };


  const ENDURANCE_PERSONAL_LAST_SEMANA_KEY = "femflow_endurance_last_personal_semana";
  const ENDURANCE_PERSONAL_LAST_DIA_KEY = "femflow_endurance_last_personal_dia";
  const ENDURANCE_PERSONAL_CACHE_KEY = "femflow_endurance_personal_cache";
  const ENDURANCE_PERSONAL_CACHE_TTL_MS = 5 * 60 * 1000;
  const DIAS_ORDEM_SEMANAL = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"];
  const DIAS_ALIAS_MAP = {
    seg: "segunda",
    segunda: "segunda",
    ter: "terca",
    terca: "terca",
    qua: "quarta",
    quarta: "quarta",
    qui: "quinta",
    quinta: "quinta",
    sex: "sexta",
    sexta: "sexta",
    sab: "sabado",
    sabado: "sabado",
    dom: "domingo",
    domingo: "domingo"
  };
  const endurancePersonalState = {
    modalidade: "",
    semanasDisponiveis: [],
    diasPorSemana: {},
    semanaSelecionada: "",
    diaSelecionado: "",
    carregando: false
  };

  const formatarModalidadeEndurance = (modalidade) => {
    const labels = {
      corrida: "Corrida",
      bike: "Bike",
      natacao: "Natação",
      remo: "Remo"
    };
    return labels[String(modalidade || "").toLowerCase()] || String(modalidade || "").trim();
  };

  const normalizarDiaTextoBase = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase();

  const normalizarDiaEndurance = (value) => {
    const diaNormalizado = normalizarDiaTextoBase(value);
    return DIAS_ALIAS_MAP[diaNormalizado] || diaNormalizado;
  };

  const ordenarDiasSemana = (dias = []) => {
    const normalizados = dias
      .map((dia) => normalizarDiaEndurance(dia))
      .filter(Boolean);
    const unicos = Array.from(new Set(normalizados));
    return unicos.sort((a, b) => DIAS_ORDEM_SEMANAL.indexOf(a) - DIAS_ORDEM_SEMANAL.indexOf(b));
  };

  const salvarUltimaSelecaoEndurancePersonal = ({ semana, dia }) => {
    try {
      localStorage.setItem(ENDURANCE_PERSONAL_LAST_SEMANA_KEY, String(semana || ""));
      localStorage.setItem(ENDURANCE_PERSONAL_LAST_DIA_KEY, String(dia || ""));
    } catch (err) {
      console.warn("Falha ao salvar última seleção endurance personal:", err);
    }
  };

  const lerUltimaSelecaoEndurancePersonal = () => {
    try {
      const semana = String(localStorage.getItem(ENDURANCE_PERSONAL_LAST_SEMANA_KEY) || "").trim();
      const dia = String(localStorage.getItem(ENDURANCE_PERSONAL_LAST_DIA_KEY) || "").trim().toLowerCase();
      if (!semana || !dia) return null;
      return { semana, dia };
    } catch (err) {
      console.warn("Falha ao ler última seleção endurance personal:", err);
      return null;
    }
  };

  const lerCacheEndurancePersonal = (id) => {
    try {
      const raw = localStorage.getItem(ENDURANCE_PERSONAL_CACHE_KEY);
      if (!raw) return null;
      const cache = JSON.parse(raw);
      if (!cache || typeof cache !== "object") return null;

      const cacheId = String(cache.id || "").trim();
      const cacheTime = Number(cache.updatedAt || 0);
      const expirado = !cacheTime || (Date.now() - cacheTime) > ENDURANCE_PERSONAL_CACHE_TTL_MS;
      if (!cacheId || cacheId !== String(id || "").trim() || expirado) return null;

      const modalidade = String(cache.modalidade || "").trim();
      const semanasDisponiveis = Array.isArray(cache.semanasDisponiveis)
        ? cache.semanasDisponiveis.map((semana) => String(semana || "").trim()).filter(Boolean)
        : [];
      const diasPorSemana = cache.diasPorSemana && typeof cache.diasPorSemana === "object"
        ? Object.fromEntries(
          Object.entries(cache.diasPorSemana).map(([semana, dias]) => [
            String(semana || "").trim(),
            ordenarDiasSemana(Array.isArray(dias) ? dias : [])
          ])
        )
        : {};

      if (!modalidade || !semanasDisponiveis.length) return null;
      return { modalidade, semanasDisponiveis, diasPorSemana };
    } catch (err) {
      console.warn("Falha ao ler cache do endurance personal:", err);
      return null;
    }
  };

  const salvarCacheEndurancePersonal = ({ id, modalidade, semanasDisponiveis, diasPorSemana }) => {
    try {
      localStorage.setItem(ENDURANCE_PERSONAL_CACHE_KEY, JSON.stringify({
        id: String(id || "").trim(),
        modalidade: String(modalidade || "").trim(),
        semanasDisponiveis: Array.isArray(semanasDisponiveis)
          ? semanasDisponiveis.map((semana) => String(semana || "").trim()).filter(Boolean)
          : [],
        diasPorSemana: diasPorSemana && typeof diasPorSemana === "object"
          ? Object.fromEntries(
            Object.entries(diasPorSemana).map(([semana, dias]) => [
              String(semana || "").trim(),
              ordenarDiasSemana(Array.isArray(dias) ? dias : [])
            ])
          )
          : {},
        updatedAt: Date.now()
      }));
    } catch (err) {
      console.warn("Falha ao salvar cache do endurance personal:", err);
    }
  };

  const atualizarConfirmarEndurancePersonal = () => {
    if (!modalEndurancePersonalConfirmar) return;
    const habilitado = Boolean(
      endurancePersonalState.semanaSelecionada &&
      endurancePersonalState.diaSelecionado &&
      endurancePersonalState.modalidade &&
      !endurancePersonalState.carregando
    );
    modalEndurancePersonalConfirmar.disabled = !habilitado;
  };

  const setHintEndurancePersonal = (mensagem) => {
    if (!modalEndurancePersonalHint) return;
    modalEndurancePersonalHint.textContent = mensagem;
  };

  const setLoadingEndurancePersonal = (ativo) => {
    endurancePersonalState.carregando = Boolean(ativo);
    modalEndurancePersonalLoading?.classList.toggle("oculto", !ativo);
    modalEndurancePersonal?.classList.toggle("is-loading", Boolean(ativo));
    atualizarConfirmarEndurancePersonal();
  };

  const animarChipPersonal = (chip) => {
    if (!chip) return;
    chip.classList.remove("is-feedback");
    void chip.offsetWidth;
    chip.classList.add("is-feedback");
  };

  function abrirModalEndurancePersonalVazio() {
    if (!modalEndurancePersonal) return;

    const whatsappNumber = "551151942268";
    const mensagem = encodeURIComponent(
      "Olá! Meu Endurance Personal ainda não está configurado no app. Pode verificar para mim? 🌸"
    );

    if (modalEndurancePersonalSemanas) {
      modalEndurancePersonalSemanas.innerHTML = `
        <div class="endurance-empty-state">
          <div class="endurance-empty-icon">✨</div>
          <p class="endurance-empty-title">
            Seu treino ainda não foi configurado
          </p>
          <p class="endurance-empty-sub">
            Fale diretamente com seu personal para liberar seu Endurance.
          </p>
          <a
            href="https://wa.me/${whatsappNumber}?text=${mensagem}"
            target="_blank"
            class="endurance-btn"
            id="enduranceWhatsappBtn"
          >
            Falar no WhatsApp
          </a>
        </div>
      `;
    }

    modalEndurancePersonalDias.innerHTML = "";
    modalEndurancePersonal.dataset.mode = "personal";
    modalEndurancePersonalEmpty?.classList.add("oculto");
    modalEndurancePersonalContent?.classList.remove("oculto");
    modalEndurancePersonalActions?.classList.remove("oculto");
    modalEndurancePersonalLoading?.classList.add("oculto");
    modalEndurancePersonalModalidadeBadge.textContent = "Endurance Personal";
    endurancePersonalState.semanaSelecionada = "";
    endurancePersonalState.diaSelecionado = "";
    modalEndurancePersonalConfirmar.disabled = true;
    atualizarConfirmarEndurancePersonal();

    abrirModalComLock(modalEndurancePersonal);

    const btn = document.getElementById("enduranceWhatsappBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        console.log("Usuária acionou suporte WhatsApp - Endurance Personal");
      });
    }
  }

  const renderDiasEndurancePersonal = (semana, diaPreSelecionado = "") => {
    if (!modalEndurancePersonalDias) return;

    const diasSemana = ordenarDiasSemana(endurancePersonalState.diasPorSemana[String(semana)] || []);
    modalEndurancePersonalDias.innerHTML = "";
    endurancePersonalState.diaSelecionado = "";

    diasSemana.forEach((dia) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "endurance-chip";
      btn.dataset.value = dia;
      btn.textContent = String(dia).slice(0, 3).replace(/^./, (c) => c.toUpperCase());
      btn.addEventListener("click", () => {
        endurancePersonalState.diaSelecionado = dia;
        const chips = modalEndurancePersonalDias.querySelectorAll(".endurance-chip");
        chips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.value === dia));
        setHintEndurancePersonal("Perfeito! Agora confirme seu treino.");
        animarChipPersonal(btn);
        atualizarConfirmarEndurancePersonal();
      });
      modalEndurancePersonalDias.appendChild(btn);

      if (diaPreSelecionado && diaPreSelecionado === dia) {
        btn.classList.add("is-active");
        endurancePersonalState.diaSelecionado = dia;
      }
    });

    if (!diasSemana.length) {
      setHintEndurancePersonal("Essa semana não possui dias liberados.");
    } else if (!endurancePersonalState.diaSelecionado) {
      setHintEndurancePersonal("Semana alterada. Selecione um dia para continuar.");
    }

    atualizarConfirmarEndurancePersonal();
  };

  function abrirModalEndurancePersonal({ modalidade, semanasDisponiveis, diasDisponiveis }) {
    if (!modalEndurancePersonal || !modalEndurancePersonalSemanas || !modalEndurancePersonalDias) return;

    endurancePersonalState.modalidade = String(modalidade || "").trim();
    endurancePersonalState.semanasDisponiveis = Array.isArray(semanasDisponiveis)
      ? semanasDisponiveis.map(String)
      : [];
    endurancePersonalState.diasPorSemana = diasDisponiveis && typeof diasDisponiveis === "object"
      ? Object.fromEntries(
        Object.entries(diasDisponiveis).map(([semana, dias]) => [
          String(semana || "").trim(),
          ordenarDiasSemana(Array.isArray(dias) ? dias : [])
        ])
      )
      : {};
    endurancePersonalState.semanaSelecionada = "";
    endurancePersonalState.diaSelecionado = "";

    modalEndurancePersonal.dataset.mode = "personal";

    if (modalEndurancePersonalModalidadeBadge) {
      modalEndurancePersonalModalidadeBadge.textContent = formatarModalidadeEndurance(endurancePersonalState.modalidade);
    }

    modalEndurancePersonalEmpty?.classList.add("oculto");
    modalEndurancePersonalContent?.classList.remove("oculto");
    modalEndurancePersonalActions?.classList.remove("oculto");
    setLoadingEndurancePersonal(false);

    modalEndurancePersonalSemanas.innerHTML = "";
    modalEndurancePersonalDias.innerHTML = "";

    const ultimaSelecao = lerUltimaSelecaoEndurancePersonal();
    const podePreSelecionar =
      ultimaSelecao &&
      endurancePersonalState.semanasDisponiveis.includes(String(ultimaSelecao.semana || ""));

    const semanaPreSelecionada = podePreSelecionar ? String(ultimaSelecao.semana) : "";
    const diaPreSelecionado = podePreSelecionar ? String(ultimaSelecao.dia || "") : "";

    endurancePersonalState.semanasDisponiveis.forEach((semana) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "endurance-chip";
      btn.dataset.value = semana;
      btn.textContent = semana;
      btn.addEventListener("click", () => {
        endurancePersonalState.semanaSelecionada = String(semana);
        endurancePersonalState.diaSelecionado = "";
        const chips = modalEndurancePersonalSemanas.querySelectorAll(".endurance-chip");
        chips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.value === String(semana)));
        animarChipPersonal(btn);
        renderDiasEndurancePersonal(semana);
          });
      modalEndurancePersonalSemanas.appendChild(btn);

      if (semanaPreSelecionada && semanaPreSelecionada === String(semana)) {
        btn.classList.add("is-active");
        endurancePersonalState.semanaSelecionada = String(semana);
      }
    });

    if (endurancePersonalState.semanaSelecionada) {
      renderDiasEndurancePersonal(endurancePersonalState.semanaSelecionada, diaPreSelecionado);
      setHintEndurancePersonal("Recuperamos sua última seleção. Você pode editar se quiser.");
    } else {
      setHintEndurancePersonal("Selecione uma semana para ver os dias.");
      atualizarConfirmarEndurancePersonal();
    }


    abrirModalComLock(modalEndurancePersonal);
  }

  const confirmarEndurancePersonal = () => {
    const semana = String(endurancePersonalState.semanaSelecionada || "").trim();
    const dia = String(endurancePersonalState.diaSelecionado || "").trim();
    const modalidade = String(endurancePersonalState.modalidade || "").trim();

    if (!semana || !dia || !modalidade) {
      FEMFLOW.toast("Selecione semana e dia para continuar.");
      return;
    }

    localStorage.setItem("femflow_endurance_semana", semana);
    localStorage.setItem("femflow_endurance_dia", dia);
    localStorage.setItem("femflow_endurance_modalidade", modalidade);
    localStorage.setItem("femflow_endurance_mode", "personal");
    localStorage.setItem("femflow_endurance_public_enabled", "false");
    salvarUltimaSelecaoEndurancePersonal({ semana, dia });

    fecharModalComUnlock(modalEndurancePersonal);
    FEMFLOW.router("treino.html?endurance=1");
  };

  const fecharModalEnduranceSelecao = () => {
    fecharModalComUnlock(modalEnduranceSelecao);
  };

  const toggleChipSingle = (container, value) => {
    if (!container) return;
    const chips = Array.from(container.querySelectorAll(".endurance-chip"));
    chips.forEach(chip => {
      chip.classList.toggle("is-active", chip.dataset.value === value);
    });
    container.dataset.value = value;
  };

  const toggleChipMulti = (chip) => {
    if (!chip) return;
    chip.classList.toggle("is-active");
  };

  const getDiasEnduranceDisponiveis = () => {
    try {
      const config = JSON.parse(localStorage.getItem("femflow_endurance_config") || "{}");
      if (Array.isArray(config.diasSemana) && config.diasSemana.length) {
        return config.diasSemana.map(String);
      }
      if (typeof config.diasSemana === "string" && config.diasSemana.trim()) {
        return config.diasSemana
          .split(/[,\n;|]+/)
          .map(item => item.trim())
          .filter(Boolean);
      }
    } catch (err) {
      console.warn("Config Endurance inválida:", err);
    }
    return [];
  };

  const atualizarDiasEnduranceDisponiveis = (diasDisponiveis) => {
    if (!modalEnduranceDia) return;
    const chips = Array.from(modalEnduranceDia.querySelectorAll(".endurance-chip"));
    chips.forEach(chip => {
      const ativo = !diasDisponiveis.length || diasDisponiveis.includes(chip.dataset.value);
      chip.classList.toggle("is-disabled", !ativo);
      chip.setAttribute("aria-disabled", ativo ? "false" : "true");
    });
  };

  if (modalEnduranceModalidade) {
    modalEnduranceModalidade.addEventListener("click", (event) => {
      const target = event.target.closest(".endurance-modalidade-chip");
      if (!target || target.classList.contains("is-disabled")) return;
      toggleChipSingle(modalEnduranceModalidade, target.dataset.value);
    });
  }

  if (modalEnduranceTreinos) {
    modalEnduranceTreinos.addEventListener("click", (event) => {
      const target = event.target.closest(".endurance-chip");
      if (!target) return;
      toggleChipSingle(modalEnduranceTreinos, target.dataset.value);
    });
  }

  if (modalEnduranceDias) {
    modalEnduranceDias.addEventListener("click", (event) => {
      const target = event.target.closest(".endurance-chip");
      if (!target) return;
      toggleChipMulti(target);
    });
  }

  if (modalEnduranceSemana) {
    modalEnduranceSemana.addEventListener("click", (event) => {
      const target = event.target.closest(".endurance-chip");
      if (!target) return;
      toggleChipSingle(modalEnduranceSemana, target.dataset.value);
    });
  }

  if (modalEnduranceDia) {
    modalEnduranceDia.addEventListener("click", (event) => {
      const target = event.target.closest(".endurance-chip");
      if (!target) return;
      toggleChipSingle(modalEnduranceDia, target.dataset.value);
    });
  }

  if (modalEnduranceCancelar) {
    modalEnduranceCancelar.addEventListener("click", fecharModalEndurance);
  }

  if (modalEndurance) {
    modalEndurance.addEventListener("click", (event) => {
      if (event.target === modalEndurance) fecharModalEndurance();
    });
  }

  if (modalEnduranceSelecaoCancelar) {
    modalEnduranceSelecaoCancelar.addEventListener("click", fecharModalEnduranceSelecao);
  }

  if (modalEnduranceSelecao) {
    modalEnduranceSelecao.addEventListener("click", (event) => {
      if (event.target === modalEnduranceSelecao) fecharModalEnduranceSelecao();
    });
  }

  if (modalEndurancePersonalCancelar) {
    modalEndurancePersonalCancelar.addEventListener("click", () => fecharModalComUnlock(modalEndurancePersonal));
  }

  if (modalEndurancePersonalConfirmar) {
    modalEndurancePersonalConfirmar.addEventListener("click", confirmarEndurancePersonal);
  }

  if (modalEndurancePersonalFalar) {
    modalEndurancePersonalFalar.addEventListener("click", () => {
      abrirModalEndurancePersonalVazio();
    });
  }

  if (modalEndurancePersonal) {
    modalEndurancePersonal.addEventListener("click", (event) => {
      if (event.target === modalEndurancePersonal) fecharModalComUnlock(modalEndurancePersonal);
    });
  }

  const ESTIMULOS_FULL = ["volume", "ritmo", "vel_pura", "res_vel", "limiar"];

  const clamp = (value, min, max) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return min;
    return Math.min(max, Math.max(min, num));
  };

  const getEstimulosAtivos = (treinosSemanaRaw) => {
    const n = clamp(Number(treinosSemanaRaw || 2), 2, 5);
    return ESTIMULOS_FULL.slice(0, n);
  };

  const salvarConfigEndurance = async () => {
    const modalidade = String(modalEnduranceModalidade?.dataset?.value || "").trim();
    const ritmo = modalEnduranceRitmo?.value?.trim() || "";
    const diasSemanaRaw = Array.from(modalEnduranceDias?.querySelectorAll(".endurance-chip.is-active") || [])
      .map(chip => normalizarDiaEndurance(chip.dataset.value))
      .filter(Boolean);

    const diasSemana = Array.from(new Set(diasSemanaRaw));
    if (!modalidade || !diasSemana.length || !ritmo) {
      FEMFLOW.toast("Preencha todas as informações do Endurance.");
      return null;
    }

    diasSemana.sort((a, b) => DIAS_ORDEM_SEMANAL.indexOf(a) - DIAS_ORDEM_SEMANAL.indexOf(b));

    const treinosSelecionado = Number(modalEnduranceTreinos?.dataset.value || 2);
    let treinosSemana = clamp(treinosSelecionado, 2, 5);

    if (treinosSemana > diasSemana.length) {
      treinosSemana = diasSemana.length;
      FEMFLOW.toast(`Ajustamos os treinos por semana para ${treinosSemana} (dias disponíveis).`);
    }

    treinosSemana = clamp(treinosSemana, 2, 5);

    const config = {
      modalidade,
      treinosSemana,
      diasSemana,
      ritmo
    };

    localStorage.setItem("femflow_endurance_config", JSON.stringify(config));
    localStorage.setItem("femflow_endurance_setup_done", "true");
    const usarModoPublico = endurancePublicIntent || !hasPersonal;
    localStorage.setItem("femflow_endurance_public_enabled", usarModoPublico ? "true" : "false");
    localStorage.setItem("femflow_endurance_modalidade", modalidade);
    localStorage.setItem("femflow_endurance_dia", diasSemana[0]);
    localStorage.setItem("femflow_endurance_estimulo", getEstimulosAtivos(treinosSemana)[0] || "volume");
    if (!localStorage.getItem("femflow_endurance_semana")) {
      localStorage.setItem("femflow_endurance_semana", "1");
    }

    try {
      await FEMFLOW.post({
        action: "endurance_setup",
        id: localStorage.getItem("femflow_id") || "",
        nome: localStorage.getItem("femflow_nome") || "",
        nivel: localStorage.getItem("femflow_nivel") || "",
        modalidade,
        treinosSemana,
        diasSemana: diasSemana.join(", "),
        ritmo
      });
    } catch (err) {
      console.error("Erro ao salvar Endurance no GAS:", err);
    }
    return config;
  };

  document.querySelectorAll("[data-extra-enfase]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!treinoAcessoOk) {
        FEMFLOW.toast("Seu acesso expirou. Assine para continuar.");
        FEMFLOW.openExternal(LINK_ACESSO_APP);
        return;
      }
      const enfase = btn.dataset.extraEnfase;
      if (!enfase) return;
      const enfaseAtual = localStorage.getItem("femflow_enfase");
      if (enfaseAtual && !FEMFLOW.engineTreino?.isExtraEnfase?.(enfaseAtual)) {
        localStorage.setItem("femflow_enfase_base", enfaseAtual);
      }
      localStorage.setItem("femflow_treino_extra", "true");
      localStorage.setItem("femflow_enfase", enfase);
      fecharModalExtra();
      FEMFLOW.router(`treino.html?extra=${encodeURIComponent(enfase)}`);
    });
  });

  document.getElementById("toTrain").onclick = () => {
    if (isCustomTreino) {
      FEMFLOW.toast("Monte seu treino está ativo.");
      return;
    }
    localStorage.removeItem("femflow_treino_endurance");
    const enfase = localStorage.getItem("femflow_enfase");

    /* 🧭 MODO PERSONAL segue o mesmo fluxo de Caminhos */
    if (personal) {
      console.log("[flowcenter] Personal ativo: abrindo fluxo de Caminhos padrão.");
      return abrirModalEscolhaCaminho();
    }

    if (!enfase) {
      FEMFLOW.toast("Escolha um treino na Home 🌸");
      return FEMFLOW.router("home.html");
    }

    const freeOk = freeValido && freeEnfases.includes(enfase);

    if (!acessoAtivo && !freeOk) {
      if (isTrial) {
        FEMFLOW.toast("Seu teste grátis terminou. Assine para continuar.");
      } else {
        FEMFLOW.toast("Seu acesso expirou. Assine para continuar.");
      }
      return FEMFLOW.openExternal(LINK_ACESSO_APP);
    }

    /* ✨ FOLLOWME */
    if (isVip) {
      if (enfase.startsWith("followme_")) {
        return FEMFLOW.router(`followme/${enfase}.html`);
      }
      return abrirModalEscolhaCaminho();
    }

    if (isFollow) {
      if (produtoRaw !== enfase && !freeOk) {
        FEMFLOW.toast("Seu plano libera apenas este FollowMe.");
        return FEMFLOW.router("home.html");
      }
      return FEMFLOW.router(`followme/${enfase}.html`);
    }

    /* 🔥 ACESSO APP */
    if (isApp) {
      if (enfase.startsWith("followme_") && !freeOk) {
        FEMFLOW.toast("Programa especial com coach.");
        return FEMFLOW.router("home.html");
      }
      return abrirModalEscolhaCaminho();
    }

    FEMFLOW.toast("Escolha um plano 🌱");
    FEMFLOW.router("home.html");
  };

  if (modalCaminhosFechar) {
    modalCaminhosFechar.addEventListener("click", () => {
      fecharModalComUnlock(modalCaminhosEscolha);
    });
  }

  if (modalCaminhosMudar) {
    modalCaminhosMudar.addEventListener("click", () => {
      fecharModalComUnlock(modalCaminhosPreview);
      abrirModalComLock(modalCaminhosEscolha);
    });
  }

  if (modalCaminhosIniciar) {
    modalCaminhosIniciar.addEventListener("click", () => {
      const caminho = Number(caminhoSelecionadoState.caminho || 0);
      if (!caminho) {
        FEMFLOW.toast("Escolha um caminho para iniciar.");
        return;
      }
      caminhosApi?.salvarUltimoCaminho?.({
        faseMetodo: faseMetodoAtual,
        caminho
      });
      FEMFLOW.router(`treino.html?caminho=${encodeURIComponent(caminho)}`);
    });
  }

  if (modalCaminhosEscolha) {
    modalCaminhosEscolha.addEventListener("click", (event) => {
      if (event.target === modalCaminhosEscolha) {
        fecharModalComUnlock(modalCaminhosEscolha);
      }
    });
  }

  if (modalCaminhosPreview) {
    modalCaminhosPreview.addEventListener("click", (event) => {
      if (event.target === modalCaminhosPreview) {
        fecharModalComUnlock(modalCaminhosPreview);
      }
    });
  }

  const customBtn = document.getElementById("toCustomTrain");
  if (customBtn) {
    customBtn.onclick = () => {
      if (!isCustomTreino) {
        FEMFLOW.toast("Monte seu treino está bloqueado.");
        return;
      }
      localStorage.removeItem("femflow_treino_endurance");
      return FEMFLOW.router("treino.html");
    };
  }

  const enduranceBtn = document.getElementById("toEndurance");
  if (enduranceBtn) {
    enduranceBtn.disabled = false;
    enduranceBtn.classList.toggle("btn-locked", bloquearEnduranceApp);
  }

  const getEnduranceDiaLabel = () => {
    const map = {
      0: "domingo",
      1: "segunda",
      2: "terca",
      3: "quarta",
      4: "quinta",
      5: "sexta",
      6: "sabado"
    };
    return map[new Date().getDay()] || "segunda";
  };

  const iniciarEndurance = () => {
    localStorage.setItem("femflow_treino_endurance", "true");
    localStorage.setItem("femflow_endurance_mode", "normal");
    if (!localStorage.getItem("femflow_endurance_semana")) {
      localStorage.setItem("femflow_endurance_semana", "1");
    }
    if (!localStorage.getItem("femflow_endurance_dia")) {
      localStorage.setItem("femflow_endurance_dia", getEnduranceDiaLabel());
    }
    FEMFLOW.router("treino.html?endurance=1");
  };

  const getEnduranceSelecaoAtual = () => {
    const semana = localStorage.getItem("femflow_endurance_semana") || "1";
    const dia = localStorage.getItem("femflow_endurance_dia") || getEnduranceDiaLabel();
    return { semana, dia };
  };

  const verificarEnduranceRealizado = async () => {
    const id = localStorage.getItem("femflow_id");
    if (!id) return { realizado: false };
    const { semana, dia } = getEnduranceSelecaoAtual();
    try {
      const resp = await FEMFLOW.post({
        action: "endurance_check",
        id,
        semana,
        dia
      });
      return resp || { realizado: false };
    } catch (err) {
      console.error("Erro ao checar Endurance:", err);
      return { realizado: false };
    }
  };

  const iniciarEnduranceComChecagem = async () => {
    const checagem = await verificarEnduranceRealizado();
    if (checagem?.realizado) {
      const dataTexto = checagem.dataTreino
        ? ` em ${new Date(checagem.dataTreino).toLocaleDateString("pt-BR")}`
        : "";
      const continuar = window.confirm(
        `Você já realizou esse treino${dataTexto}. Deseja realizar novamente?`
      );
      if (!continuar) return;
    }
    iniciarEndurance();
  };

  if (modalEnduranceSalvar) {
    modalEnduranceSalvar.addEventListener("click", async () => {
      const config = await salvarConfigEndurance();
      if (!config) return;
      fecharModalEndurance();
      localStorage.setItem("femflow_endurance_mode", "normal");
      abrirModalEnduranceSelecao();
    });
  }

  if (modalEnduranceSelecaoContinuar) {
    modalEnduranceSelecaoContinuar.addEventListener("click", async () => {
      const semana = modalEnduranceSemana?.dataset.value || "";
      const dia = normalizarDiaEndurance(modalEnduranceDia?.dataset.value || "");
      const diasDisponiveis = getDiasEnduranceDisponiveis().map(normalizarDiaEndurance);
      if (diasDisponiveis.length && !diasDisponiveis.includes(dia)) {
        FEMFLOW.toast("Selecione um dia disponível para continuar.");
        return;
      }
      if (!semana || !dia) {
        FEMFLOW.toast("Selecione semana e dia para continuar.");
        return;
      }

      let config = {};
      try {
        config = JSON.parse(localStorage.getItem("femflow_endurance_config") || "{}");
      } catch (err) {
        console.warn("Config Endurance inválida na seleção:", err);
      }

      const diasSemana = Array.isArray(config?.diasSemana)
        ? config.diasSemana.map(normalizarDiaEndurance).filter(Boolean)
        : [];
      const treinosSemana = clamp(Number(config?.treinosSemana || 2), 2, 5);
      const estimulosAtivos = getEstimulosAtivos(treinosSemana);
      const idx = diasSemana.indexOf(dia);

      if (idx < 0) {
        FEMFLOW.toast("Dia selecionado não está nos dias configurados.");
        return;
      }

      let estimuloSelecionado = estimulosAtivos[idx] || "";

      const hasSab = diasSemana.includes("sabado");
      const hasDom = diasSemana.includes("domingo");
      const diaVolumePadrao = diasSemana[0] || "";
      if (hasSab && hasDom && dia === "sabado" && diaVolumePadrao === "sabado") {
        estimuloSelecionado = "volume";
        console.log("[Endurance Público] Override SAB+DOM aplicado sem duplicar volume", {
          semana,
          dia,
          estimuloSelecionado
        });
      }

      if (!estimuloSelecionado) {
        FEMFLOW.toast("Não foi possível definir o estímulo deste dia.");
        return;
      }

      localStorage.setItem("femflow_endurance_semana", String(semana));
      localStorage.setItem("femflow_endurance_dia", String(dia));
      localStorage.setItem("femflow_endurance_estimulo", String(estimuloSelecionado));
      localStorage.setItem("femflow_endurance_mode", "normal");
      const usarModoPublico = endurancePublicIntent || !hasPersonal;
      localStorage.setItem("femflow_endurance_public_enabled", usarModoPublico ? "true" : "false");
      fecharModalEnduranceSelecao();
      FEMFLOW.router("treino.html?endurance=1");
    });
  }


  async function iniciarFluxoEndurancePersonal() {

    const id = localStorage.getItem("femflow_id");
    if (!id) {
      FEMFLOW.toast("Sessão inválida.");
      return;
    }

    if (endurancePersonalState.carregando) return;

    const cacheValido = lerCacheEndurancePersonal(id);
    if (cacheValido) {
      abrirModalEndurancePersonal({
        modalidade: cacheValido.modalidade,
        semanasDisponiveis: cacheValido.semanasDisponiveis,
        diasDisponiveis: cacheValido.diasPorSemana
      });
      return;
    }

    modalEndurancePersonalEmpty?.classList.add("oculto");
    modalEndurancePersonalContent?.classList.add("oculto");
    modalEndurancePersonalActions?.classList.add("oculto");
    setLoadingEndurancePersonal(true);
    abrirModalComLock(modalEndurancePersonal);

    try {
      const enduranceRoot = firebase.firestore()
        .collection("personal_trainings")
        .doc(id)
        .collection("endurance");

      const candidatos = ["corrida", "bike", "natacao", "remo"];
      const modalidadeSnaps = await Promise.all(
        candidatos.map(async (modalidade) => {
          const semanaSnap = await enduranceRoot
            .doc(modalidade)
            .collection("treinos")
            .doc("base")
            .collection("semana")
            .limit(1)
            .get();
          return { modalidade, disponivel: !semanaSnap.empty };
        })
      );

      const modalidadeEncontrada = modalidadeSnaps.find((item) => item.disponivel)?.modalidade || null;
      if (!modalidadeEncontrada) {
        abrirModalEndurancePersonalVazio();
        return;
      }

      const modalidade = modalidadeEncontrada;
      const semanaSnap = await enduranceRoot
        .doc(modalidade)
        .collection("treinos")
        .doc("base")
        .collection("semana")
        .get();

      if (semanaSnap.empty) {
        abrirModalEndurancePersonalVazio();
        return;
      }

      const semanasDisponiveis = semanaSnap.docs
        .map((d) => String(d.id).trim())
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b));

      const diasPorSemana = {};

      await Promise.all(
        semanasDisponiveis.map(async (semana) => {
          const diasSnap = await enduranceRoot
            .doc(modalidade)
            .collection("treinos")
            .doc("base")
            .collection("semana")
            .doc(semana)
            .collection("dias")
            .get();

          const diasValidos = [];

          await Promise.all(
            diasSnap.docs.map(async (diaDoc) => {
              const diaRaw = normalizarDiaEndurance(diaDoc.id);
              if (!diaRaw) return;

              const blocosSnap = await enduranceRoot
                .doc(modalidade)
                .collection("treinos")
                .doc("base")
                .collection("semana")
                .doc(semana)
                .collection("dias")
                .doc(diaDoc.id)
                .collection("blocos")
                .limit(1)
                .get();

              if (!blocosSnap.empty) {
                diasValidos.push(diaRaw);
              }
            })
          );

          if (diasValidos.length) {
            diasPorSemana[semana] = ordenarDiasSemana(diasValidos);
          }
        })
      );

      const semanasComDias = semanasDisponiveis.filter((semana) => (diasPorSemana[semana] || []).length > 0);
      if (!semanasComDias.length) {
        abrirModalEndurancePersonalVazio();
        return;
      }

      abrirModalEndurancePersonal({
        modalidade,
        semanasDisponiveis: semanasComDias,
        diasDisponiveis: diasPorSemana
      });

      salvarCacheEndurancePersonal({
        id,
        modalidade,
        semanasDisponiveis: semanasComDias,
        diasPorSemana
      });

    } catch (err) {
      console.error("Erro ao carregar endurance personal:", err);
      fecharModalComUnlock(modalEndurancePersonal);
      FEMFLOW.toast("Erro ao carregar seu endurance personal.");
    } finally {
      setLoadingEndurancePersonal(false);
    }
  }


  enduranceBtn.onclick = async () => {
    if (bloquearEnduranceApp) {
      FEMFLOW.toast(t("flowcenter.enduranceBloqueado"));
      return;
    }

    const hasPersonal = localStorage.getItem("femflow_has_personal") === "true";
    const endurancePublicIntentAtivo =
      localStorage.getItem("femflow_endurance_public_intent") === "true";
    const modePersonal =
      localStorage.getItem("femflow_mode_personal") === "true" &&
      !endurancePublicIntentAtivo;
    const personal = hasPersonal && modePersonal;

    console.log("[Endurance] personal ativo:", personal, "modo personal:", modePersonal, "public intent:", endurancePublicIntentAtivo);

    if (personal) {
      await iniciarFluxoEndurancePersonal();
      return;
    }

    if (!enduranceEnabled) {
      FEMFLOW.toast(t("flowcenter.enduranceBloqueado"));
      return;
    }

    const setupDone = localStorage.getItem("femflow_endurance_setup_done") === "true";
    const configRaw = localStorage.getItem("femflow_endurance_config");
    const hasConfig = configRaw !== null && configRaw !== "";
    const endurancePendente =
      localStorage.getItem("femflow_endurance_pending") === "true";
    const usarModoPublico = endurancePublicIntent || !hasPersonal;
    const id = localStorage.getItem("femflow_id");
    const podeSeguirSemId = usarModoPublico || setupDone || hasConfig;

    if (!id && !podeSeguirSemId) {
      FEMFLOW.openInternal("../#ofertas");
      return;
    }

    localStorage.setItem("femflow_endurance_public_enabled", usarModoPublico ? "true" : "false");

    if (!setupDone && !hasConfig) {
      abrirModalEndurance();
      return;
    }

    // No fluxo de planilhas públicas (5k/10k/15k), a usuária precisa
    // sempre confirmar semana e dia antes de iniciar o treino.
    if (usarModoPublico) {
      localStorage.setItem("femflow_endurance_mode", "normal");
      abrirModalEnduranceSelecao();
      return;
    }

    if (endurancePendente) {
      await iniciarEnduranceComChecagem();
      return;
    }

    localStorage.setItem("femflow_endurance_mode", "normal");
    abrirModalEnduranceSelecao();
  };

    })
    .catch((err) => {
      console.error("Erro ao inicializar FlowCenter:", err);
      FEMFLOW.toast("Erro ao carregar seu painel. Tente novamente.");
    })
    .finally(() => {
      FEMFLOW.loading.hide();
    });
}
