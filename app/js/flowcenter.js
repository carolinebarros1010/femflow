/* ============================================================
   FLOWCENTER.JS — FemFlow 2025 • VERSÃO FINAL CANÔNICA
   ✔ Perfil vem de VALIDAR
   ✔ Suporte total a idioma
   ✔ Círculo hormonal completo
   ✔ Separação ACESSO x MODO PERSONAL
=========================================================== */

const LINK_ACESSO_APP = "https://pay.hotmart.com/T103984580L?off=ifcs6h6n";

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
  const resetEnduranceConfig = () => {
    [
      "femflow_endurance_dia",
      "femflow_endurance_semana",
      "femflow_endurance_modalidade",
      "femflow_endurance_config",
      "femflow_endurance_pending",
      "femflow_endurance_setup_done",
      "femflow_treino_endurance"
    ].forEach((key) => localStorage.removeItem(key));
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
      resetEnduranceConfig();
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
  const personal = hasPersonal && modePersonal;
  const enduranceEnabled = hasPersonal || endurancePlanAvailable;

  const isApp    = produtoRaw === "acesso_app" || isTrial;
  const isFollow = produtoRaw.startsWith("followme_");
  const enfaseAtualUI = localStorage.getItem("femflow_enfase");
  const acessoAtivo = isVip || ativa;

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
    const treinoLabel = !isCustomTreino && treinoAcessoOk ? "🏃" : "🔒";
    const extraLabel = !isCustomTreino && treinoAcessoOk ? "✨" : "🔒";
    document.getElementById("toTrain").textContent     = `${treinoLabel} ${L.treino}`;
    document.getElementById("toExtraTrain").textContent = `${extraLabel} ${L.treinoExtra}`;
  const customBtn = document.getElementById("toCustomTrain");
    if (customBtn) {
      customBtn.textContent = `${customLabel} ${L.treinoCustom}`;
    }
    document.getElementById("toEvolution").textContent = `📈 ${L.evolucao}`;
    const enduranceLabel = enduranceEnabled ? "🏃‍♂️" : "🔒";
    document.getElementById("toEndurance").textContent =
      `${enduranceLabel} ${L.endurance}`;
    const nextTreinoBtn = document.getElementById("toNextTreino");
    if (nextTreinoBtn) {
      const nextLabel = !isCustomTreino && treinoAcessoOk ? "🗓️" : "🔒";
      nextTreinoBtn.textContent = `${nextLabel} ${L.proximoTreino}`;
    }

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
  const modalEnduranceModalidade = document.getElementById("enduranceModalidade");
  const modalEnduranceTreinos = document.getElementById("enduranceTreinosSemana");
  const modalEnduranceDias = document.getElementById("enduranceDiasSemana");
  const modalEnduranceRitmo = document.getElementById("enduranceRitmo");
  const modalEnduranceCancelar = document.getElementById("enduranceCancelar");
  const modalEnduranceSalvar = document.getElementById("enduranceSalvar");
  const modalEnduranceSemana = document.getElementById("enduranceSemana");
  const modalEnduranceDia = document.getElementById("enduranceDia");
  const modalEnduranceSelecaoCancelar = document.getElementById("enduranceSelecaoCancelar");
  const modalEnduranceSelecaoContinuar = document.getElementById("enduranceSelecaoContinuar");
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

  const abrirModalComLock = (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.remove("oculto");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const fecharModalComUnlock = (modalEl) => {
    if (!modalEl) return;
    modalEl.classList.add("oculto");
    modalEl.setAttribute("aria-hidden", "true");
    if (
      modalExtra?.classList.contains("oculto") !== false &&
      modalEndurance?.classList.contains("oculto") !== false &&
      modalEnduranceSelecao?.classList.contains("oculto") !== false &&
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

  const obterSugestaoCaminho = () => {
    const ultimo = caminhosApi?.lerUltimoCaminho?.();
    const ultimoMesmoMetodo = ultimo && ultimo.faseMetodo === faseMetodoAtual ? ultimo : null;
    const ultimoCaminho = ultimoMesmoMetodo?.caminho || 1;
    const sugerido = caminhosApi?.proximoCaminho?.(ultimoCaminho, 5) || 1;
    return { ultimo: ultimoMesmoMetodo, ultimoCaminho, sugerido };
  };

  const abrirModalEscolhaCaminho = () => {
    if (!caminhosApi || !modalCaminhosEscolha || !modalCaminhosBotoes) {
      return FEMFLOW.router("treino.html");
    }

    const { ultimo, ultimoCaminho, sugerido } = obterSugestaoCaminho();
    if (modalCaminhosUltimo) {
      modalCaminhosUltimo.textContent = ultimo
        ? `Seu último treino foi Caminho ${ultimo.caminho}`
        : "Seu último treino foi Caminho 1";
    }
    if (modalCaminhosSugerido) {
      modalCaminhosSugerido.textContent = `Sugerimos Caminho ${sugerido}`;
    }
    if (modalCaminhosFase) {
      modalCaminhosFase.textContent = `Fase ${getFaseLabelAtual()}`;
    }

    modalCaminhosBotoes.innerHTML = "";
    for (let caminho = 1; caminho <= 5; caminho += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `caminho-btn${caminho === sugerido ? " is-sugerido" : ""}`;
      btn.textContent = `Caminho ${caminho}`;
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
    const contexto = caminhosApi.resolverContextoDeBusca(faseMetodoAtual, caminhoSelecionadoState.caminho);

    if (!contexto?.diaUsado || !contexto?.faseFirestore) {
      FEMFLOW.toast("Não foi possível carregar esse caminho agora.");
      return;
    }

    if (modalCaminhosPreviewTitulo) {
      modalCaminhosPreviewTitulo.textContent = `Caminho ${caminhoSelecionadoState.caminho} — Fase ${getFaseLabelAtual()}`;
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
      personal: false
    });

    if (!nomes.length) {
      const li = document.createElement("li");
      li.textContent = "Nenhum exercício encontrado para este caminho.";
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

  const abrirModalEndurance = () => {
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

  const salvarConfigEndurance = async () => {
    const modalidade = modalEnduranceModalidade?.value?.trim() || "";
    const treinosSemana = modalEnduranceTreinos?.dataset.value || "";
    const ritmo = modalEnduranceRitmo?.value?.trim() || "";
    const diasSemana = Array.from(modalEnduranceDias?.querySelectorAll(".endurance-chip.is-active") || [])
      .map(chip => chip.dataset.value)
      .filter(Boolean);

    if (!modalidade || !treinosSemana || !diasSemana.length || !ritmo) {
      FEMFLOW.toast("Preencha todas as informações do Endurance.");
      return null;
    }

    const config = {
      modalidade,
      treinosSemana: Number(treinosSemana),
      diasSemana,
      ritmo
    };

    localStorage.setItem("femflow_endurance_config", JSON.stringify(config));
    localStorage.setItem("femflow_endurance_setup_done", "true");
    localStorage.setItem("femflow_endurance_dia", diasSemana[0]);
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
        treinosSemana: Number(treinosSemana),
        diasSemana: diasSemana.join(", "),
        ritmo
      });
    } catch (err) {
      console.error("Erro ao salvar Endurance no GAS:", err);
    }
    return config;
  };

  const modalProximoTreino = document.getElementById("modalProximoTreino");
  const modalProximoTitulo = document.getElementById("modalProximoTitulo");
  const modalProximoSub = document.getElementById("modalProximoSub");
  const modalProximoListaTitulo = document.getElementById("modalProximoListaTitulo");
  const modalProximoLista = document.getElementById("modalProximoLista");
  let modalProximoTimeout = null;

  const abrirModalProximoTreino = () => {
    if (!modalProximoTreino) return;
    if (modalProximoTimeout) window.clearTimeout(modalProximoTimeout);
    modalProximoTreino.classList.remove("hidden");
    modalProximoTreino.setAttribute("aria-hidden", "false");
    modalProximoTimeout = window.setTimeout(() => {
      modalProximoTreino.classList.add("hidden");
      modalProximoTreino.setAttribute("aria-hidden", "true");
    }, 9000);
  };

  const definirModalProximoTextos = ({ diaAtual, proximoDia }) => {
    const faseLabel =
      FEMFLOW.langs?.[FEMFLOW.lang || "pt"]?.flowcenter?.[normalizarFase(ciclo.fase)] ||
      ciclo.fase;
    if (modalProximoTitulo) {
      modalProximoTitulo.textContent = t("treino.proximoModal.titulo", {
        diaAtual,
        fase: faseLabel
      });
    }
    if (modalProximoSub) {
      modalProximoSub.textContent = t("treino.proximoModal.subtitulo", {
        proximoDia,
        fase: faseLabel
      });
    }
    if (modalProximoListaTitulo) {
      modalProximoListaTitulo.textContent = t("treino.proximoModal.listaTitulo");
    }
  };

  const carregarProximoTreino = async () => {
    if (!modalProximoLista || !FEMFLOW.engineTreino?.listarExerciciosDia) return;

    const enfaseAtual = localStorage.getItem("femflow_enfase");
    if (!personal && !enfaseAtual) {
      FEMFLOW.toast("Escolha um treino na Home 🌸");
      return;
    }

    const diaAtual = Number(ciclo.diaCiclo || 1);
    if (!Number.isFinite(diaAtual) || diaAtual < 1) return;

    const cicloLength = Number(localStorage.getItem("femflow_cycleLength"));
    const cicloPerfil = Number(perfil.ciclo_duracao || 0);
    const cicloValido =
      Number.isFinite(cicloLength) && cicloLength > 0
        ? cicloLength
        : Number.isFinite(cicloPerfil) && cicloPerfil > 0
        ? cicloPerfil
        : 28;
    const proximoDia = diaAtual + 1 > cicloValido ? 1 : diaAtual + 1;

    const exercicios = await FEMFLOW.engineTreino.listarExerciciosDia({
      id: localStorage.getItem("femflow_id"),
      nivel: perfil.nivel,
      enfase: enfaseAtual,
      fase: perfil.fase,
      diaCiclo: proximoDia,
      personal
    });

    modalProximoLista.innerHTML = "";
    definirModalProximoTextos({ diaAtual, proximoDia });

    if (!exercicios.length) {
      const li = document.createElement("li");
      li.textContent = t("treino.proximoModal.vazio");
      modalProximoLista.appendChild(li);
      abrirModalProximoTreino();
      return;
    }

    exercicios.forEach((nome) => {
      const li = document.createElement("li");
      li.textContent = nome;
      modalProximoLista.appendChild(li);
    });

    abrirModalProximoTreino();
  };

  const nextTreinoBtn = document.getElementById("toNextTreino");
  if (nextTreinoBtn) {
    nextTreinoBtn.onclick = () => {
      if (!treinoAcessoOk) {
        FEMFLOW.toast("Seu acesso expirou. Assine para continuar.");
        return FEMFLOW.openExternal(LINK_ACESSO_APP);
      }
      void carregarProximoTreino();
    };
  }

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

    /* 🧭 PRIORIDADE ABSOLUTA — MODO PERSONAL */
    if (personal) {
      return FEMFLOW.router("treino.html");
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
  if (enduranceBtn) enduranceBtn.disabled = !enduranceEnabled;

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
      abrirModalEnduranceSelecao();
    });
  }

  if (modalEnduranceSelecaoContinuar) {
    modalEnduranceSelecaoContinuar.addEventListener("click", async () => {
      const semana = modalEnduranceSemana?.dataset.value || "";
      const dia = modalEnduranceDia?.dataset.value || "";
      const diasDisponiveis = getDiasEnduranceDisponiveis();
      if (diasDisponiveis.length && !diasDisponiveis.includes(dia)) {
        FEMFLOW.toast("Selecione um dia disponível para continuar.");
        return;
      }
      if (!semana || !dia) {
        FEMFLOW.toast("Selecione semana e dia para continuar.");
        return;
      }
      localStorage.setItem("femflow_endurance_semana", String(semana));
      localStorage.setItem("femflow_endurance_dia", String(dia));
      fecharModalEnduranceSelecao();
      await iniciarEnduranceComChecagem();
    });
  }

  enduranceBtn.onclick = async () => {
    if (!enduranceEnabled) {
      FEMFLOW.toast("Endurance disponível apenas no Personal 🌸");
      return;
    }
    const id = localStorage.getItem("femflow_id");
    if (id) {
      const setupDone = localStorage.getItem("femflow_endurance_setup_done") === "true";
      const configRaw = localStorage.getItem("femflow_endurance_config");
      const hasConfig = configRaw !== null && configRaw !== "";
      const endurancePendente =
        localStorage.getItem("femflow_endurance_pending") === "true";
      if (!setupDone && !hasConfig) {
        abrirModalEndurance();
        return;
      }
      if (endurancePendente) {
        await iniciarEnduranceComChecagem();
        return;
      }
      abrirModalEnduranceSelecao();
    } else {
      FEMFLOW.openInternal("../#ofertas");
    }
  };

      FEMFLOW.loading.hide();
    });
}
