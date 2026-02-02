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

  // 🔥 regra canônica
  const personal = hasPersonal && modePersonal;
  const enduranceEnabled = hasPersonal;

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
  const treinoAcessoOk = acessoAtivo || freeOkUI;

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
    const nextTreinoBtn = document.getElementById("toNextTreino");
    if (nextTreinoBtn) {
      const nextLabel = treinoAcessoOk ? "🗓️" : "🔒";
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

  enduranceBtn.onclick = () => {
    if (!enduranceEnabled) {
      FEMFLOW.toast("Endurance disponível apenas no Personal 🌸");
      return;
    }
    const id = localStorage.getItem("femflow_id");
    if (id) FEMFLOW.router("geradordecorrida/index.html");
    else FEMFLOW.openInternal("../#ofertas");
  };

      FEMFLOW.loading.hide();
    });
}
