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
  const personalRaw =
    acessos.personal ??
    perfil.personal ??
    perfil.Personal ??
    perfil.has_personal ??
    perfil.hasPersonal;
  const hasPersonal = parseBooleanish(personalRaw) || isVip;
  localStorage.setItem(
    "femflow_has_personal",
    hasPersonal ? "true" : "false"
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
      if (!perfilBase || perfilBase.status === "blocked") {
        FEMFLOW.toast("Sessão inválida.");
        FEMFLOW.clearSession();
        FEMFLOW.dispatch("stateChanged", { type: "auth", impact: "estrutural" });
        return null;
      }

      return flowcenterSyncPerfil().then((perfilFresh) => {
        if (!perfilFresh || perfilFresh.status !== "ok") {
          FEMFLOW.toast("Erro ao atualizar dados.");
          FEMFLOW.clearSession();
          FEMFLOW.dispatch("stateChanged", { type: "auth", impact: "estrutural" });
          return null;
        }

        flowcenterPersistPerfil(perfilFresh);
        return { ...perfilBase, ...perfilFresh };
      });
    })
    .then((perfil) => {
      if (!perfil) return;

  /* ============================================================
     3) CICLO
  ============================================================ */
  if (perfil.fase && perfil.diaCiclo) {
    localStorage.setItem("femflow_cycle_configured", "yes");
  }

  if (!localStorage.getItem("femflow_cycle_configured")) {
    FEMFLOW.toast("Configure seu ciclo antes 🌸");
    FEMFLOW.dispatch("stateChanged", { type: "ciclo", impact: "estrutural" });
    return;
  }

  /* ============================================================
     4) PRODUTO / ACESSOS (CORRETO)
  ============================================================ */
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
    const treinoLabel = treinoAcessoOk ? "🏃" : "🔒";
    const extraLabel = treinoAcessoOk ? "✨" : "🔒";
    document.getElementById("toTrain").textContent     = `${treinoLabel} ${L.treino}`;
    document.getElementById("toExtraTrain").textContent = `${extraLabel} ${L.treinoExtra}`;
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
      extra_mobilidade: L.treinoExtraMobilidade
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
  const extraBtn = document.getElementById("toExtraTrain");
  const extraClose = document.getElementById("fecharExtra");

  const fecharModalExtra = () => {
    if (modalExtra) modalExtra.classList.add("oculto");
  };

  if (extraBtn) {
    extraBtn.onclick = () => {
      if (!treinoAcessoOk) {
        FEMFLOW.toast("Seu acesso expirou. Assine para continuar.");
        return FEMFLOW.openExternal(LINK_ACESSO_APP);
      }
      modalExtra?.classList.remove("oculto");
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
    if (!modalEndurance) return;
    modalEndurance.classList.remove("oculto");
    modalEndurance.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const fecharModalEndurance = () => {
    if (!modalEndurance) return;
    modalEndurance.classList.add("oculto");
    modalEndurance.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
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
    modalEnduranceSelecao.classList.remove("oculto");
    modalEnduranceSelecao.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const fecharModalEnduranceSelecao = () => {
    if (!modalEnduranceSelecao) return;
    modalEnduranceSelecao.classList.add("oculto");
    modalEnduranceSelecao.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
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
      return FEMFLOW.router("treino.html");
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
      return FEMFLOW.router("treino.html");
    }

    FEMFLOW.toast("Escolha um plano 🌱");
    FEMFLOW.router("home.html");
  };

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
