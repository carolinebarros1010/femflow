/* ============================================================
   FEMFLOW — treino.js v4.0 FINAL (2025)
============================================================ */
console.log("🔥 treino.js carregou");

if (!window.FEMFLOW_TOUR_KEY) {
  window.FEMFLOW_TOUR_KEY = "femflow_treino_tour_v1";
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("🧱 DOMContentLoaded no treino");

  /* ============================================================
     0. VARIÁVEIS DA TELA (NÃO dependem do perfil)
  ============================================================ */

  const hasPersonalStorage =
    localStorage.getItem("femflow_has_personal") === "true";
  const modePersonalStorage =
    localStorage.getItem("femflow_mode_personal") === "true";
  let isPersonal = hasPersonalStorage && modePersonalStorage;

  if (isPersonal) {
    document.body.classList.add("personal-mode");
    FEMFLOW.log("🎨 Layout PERSONAL aplicado");
  }

  const id = localStorage.getItem("femflow_id");
  if (!id) {
    FEMFLOW.toast("⚠️ Faça login novamente.", true);
    location.href = "index.html";
    return;
  }

  const track     = document.querySelector("#carouselTrack");
  const tituloDia = document.querySelector("#tituloDiaTreino");
  const tituloTopo = document.querySelector("#tituloTreinoTopo");
  const footer    = document.querySelector(".fix-footer");
  const carousel  = document.querySelector(".carousel-container");
  const indicator = document.getElementById("carouselIndicator");
  const indicatorDots = document.getElementById("carouselIndicatorDots");
  const indicatorThumb = document.getElementById("carouselIndicatorThumb");

  const btnSalvar       = document.getElementById("salvarTreinoBtn");
  const btnCancelar     = document.getElementById("cancelarTreinoBtn");
  const modalPSE        = document.getElementById("modalPSE");
  const pseInput        = document.getElementById("pseInput");
  const pseEmoji        = document.getElementById("pseEmoji");
  const pseValor        = document.getElementById("pseValor");
  const btnConfirmarPSE = document.getElementById("btnConfirmarPSE");
  const btnCancelarPSE  = document.getElementById("btnCancelarPSE");
  const tourOverlay     = document.getElementById("treinoTour");
  const tourTitle       = document.getElementById("treinoTourTitle");
  const tourText        = document.getElementById("treinoTourText");
  const tourStep        = document.getElementById("treinoTourStep");
  const tourNext        = document.getElementById("treinoTourNext");
  const tourSkip        = document.getElementById("treinoTourSkip");

  const extraParam = new URLSearchParams(window.location.search).get("extra");
  const extraParamNorm = String(extraParam || "")
    .toLowerCase()
    .trim()
    .split("?")[0]
    .replace(/\.html.*$/, "");
  const urlParams = new URLSearchParams(window.location.search);
  const caminhoParam = Number(urlParams.get("caminho") || 0);
  const enduranceParam = urlParams.get("endurance");
  const enduranceParamActive = enduranceParam === "1";
  const isCustomTreino =
    localStorage.getItem("femflow_custom_treino") === "true";
  if (extraParamNorm.startsWith("extra_")) {
    localStorage.setItem("femflow_treino_extra", "true");
    localStorage.setItem("femflow_enfase", extraParamNorm);
  }
  if (enduranceParamActive) {
    localStorage.setItem("femflow_treino_endurance", "true");
    localStorage.setItem("femflow_endurance_pending", "true");
  } else {
    localStorage.removeItem("femflow_treino_endurance");
  }

  const treinoSnapshotState = {
    timeout: null,
    lastBoxIndex: null
  };
  let treinoSnapshotToScroll = null;
  let enduranceAtivo = enduranceParamActive;
  let enduranceConfig = null;
  let endurancePublicAtivo = false;
  let personalFinal = isPersonal;
  const cardioZonaModalState = { open: false };
  let contextoCaminhoSelecionado = null;

  const normalizeEnduranceEnfase = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const normalizeEnduranceSemana = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return 1;
    const match = raw.match(/\d+/);
    if (match) return Number(match[0]) || 1;
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : 1;
  };

  const getEnduranceDiaLabel = (lang) => {
    const labels = {
      pt: ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"],
      en: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
      fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]
    };
    const list = labels[lang] || labels.pt;
    return list[new Date().getDay()] || list[1];
  };

  const getEnduranceConfig = () => {
    const semanaRaw = localStorage.getItem("femflow_endurance_semana") || "1";
    const semana = normalizeEnduranceSemana(semanaRaw);
    const configRaw = localStorage.getItem("femflow_endurance_config") || "{}";
    let config = {};
    try {
      config = JSON.parse(configRaw);
    } catch (err) {
      console.warn("Config Endurance inválida:", err);
    }

    const modalidade = String(
      config.modalidade ||
      localStorage.getItem("femflow_endurance_modalidade") ||
      ""
    ).trim();

    const dia = String(localStorage.getItem("femflow_endurance_dia") || "").trim();
    const estimulo = String(localStorage.getItem("femflow_endurance_estimulo") || "")
      .toLowerCase()
      .trim();

    if (modalidade) {
      localStorage.setItem("femflow_endurance_modalidade", modalidade);
    }
    localStorage.setItem("femflow_endurance_semana", String(semana));

    return {
      semana,
      dia,
      enfase: modalidade,
      modalidade,
      estimulo
    };
  };

  const getTreinoKey = ({ diaCiclo }) => {
    if (enduranceAtivo && enduranceConfig) {
      const enfaseKey = normalizeEnduranceEnfase(enduranceConfig.enfase || "") || "endurance";
      return `endurance_${enfaseKey}_semana_${enduranceConfig.semana}_${enduranceConfig.dia}`;
    }
    if (isCustomTreino) {
      return `custom_dia_${diaCiclo}`;
    }
    if (personalFinal) {
      return `personal_dia_${diaCiclo}`;
    }
    return `${FEMFLOW.enfaseAtual}_dia_${diaCiclo}`;
  };

  function getTreinoSnapshotContext() {
    if (!id) return null;
    const diaCiclo = Number(localStorage.getItem("femflow_diaCiclo") || 1);
    const diaPrograma = Number(
      localStorage.getItem("femflow_diaPrograma") || FEMFLOW.diaProgramaAtual || 1
    );
    const enfaseBase = FEMFLOW.enfaseAtual || (isPersonal ? "personal" : "");
    const enfase = String(enfaseBase || "").trim();
    if (!enfase && !enduranceAtivo && !isCustomTreino) return null;
    if (enduranceAtivo && !enduranceConfig) {
      enduranceConfig = getEnduranceConfig();
    }

    return {
      id,
      diaCiclo,
      diaPrograma,
      enfase: enduranceAtivo
        ? `endurance_${normalizeEnduranceEnfase(enduranceConfig?.enfase) || "endurance"}_${enduranceConfig?.semana}_${enduranceConfig?.dia}`
        : (isCustomTreino ? "custom" : enfase)
    };
  }

  function getTreinoSnapshotKey() {
    const context = getTreinoSnapshotContext();
    if (!context) return null;
    return `femflow_treino_progress_${context.id}_${context.enfase}_${context.diaCiclo}_${context.diaPrograma}`;
  }

  function getCurrentBoxIndex() {
    if (!carousel || !track) return 0;
    const items = Array.from(track.querySelectorAll(".carousel-item"));
    if (!items.length) return 0;
    const gap = parseFloat(getComputedStyle(track).gap || 0);
    const step = items[0].getBoundingClientRect().width + gap;
    if (!step) return 0;
    return Math.max(0, Math.min(items.length - 1, Math.round(carousel.scrollLeft / step)));
  }

  function buildTreinoSnapshot() {
    const context = getTreinoSnapshotContext();
    if (!context) return null;

    const doneExercises = [];
    const seriesProgress = {};
    const weights = {};
    let hasSeriesProgress = false;

    document.querySelectorAll(".ff-ex-item").forEach(item => {
      const input = item.querySelector(".ff-ex-peso");
      const exercicioId = input?.dataset.ex;
      if (!exercicioId) return;

      if (input?.value) {
        weights[exercicioId] = input.value;
      }

      const progressEl = item.querySelector("[data-role='serie-progress']");
      if (progressEl) {
        const serieAtual = Number(progressEl.dataset.serieAtual || 1);
        const serieTotal = Number(progressEl.dataset.serieTotal || 1);
        if (serieAtual > 1) {
          seriesProgress[exercicioId] = {
            serieAtual,
            serieTotal
          };
          hasSeriesProgress = true;
        }
      }

      if (item.classList.contains("ff-ex-done")) {
        doneExercises.push(exercicioId);
      }
    });

    const currentBoxIndex = getCurrentBoxIndex();
    const hasProgress =
      doneExercises.length > 0 ||
      Object.keys(weights).length > 0 ||
      hasSeriesProgress ||
      currentBoxIndex > 0;

    if (!hasProgress) return null;

    return {
      version: 1,
      id: context.id,
      enfase: context.enfase,
      diaCiclo: context.diaCiclo,
      diaPrograma: context.diaPrograma,
      timestamp: Date.now(),
      currentBoxIndex,
      doneExercises,
      seriesProgress,
      weights
    };
  }

  function saveTreinoSnapshot() {
    const key = getTreinoSnapshotKey();
    if (!key) return;
    const payload = buildTreinoSnapshot();
    if (!payload) return;
    localStorage.setItem(key, JSON.stringify(payload));
  }

  function scheduleTreinoSnapshot() {
    if (treinoSnapshotState.timeout) {
      clearTimeout(treinoSnapshotState.timeout);
    }
    treinoSnapshotState.timeout = setTimeout(saveTreinoSnapshot, 200);
  }

  function clearTreinoSnapshot() {
    const key = getTreinoSnapshotKey();
    if (!key) return;
    localStorage.removeItem(key);
  }

  function restoreTreinoSnapshot() {
    const key = getTreinoSnapshotKey();
    if (!key) return null;

    const raw = localStorage.getItem(key);
    if (!raw) return null;

    let snapshot;
    try {
      snapshot = JSON.parse(raw);
    } catch (err) {
      console.warn("Snapshot inválido:", err);
      localStorage.removeItem(key);
      return null;
    }

    const context = getTreinoSnapshotContext();
    if (!context) return null;
    const isCompatible =
      snapshot?.id === context.id &&
      snapshot?.enfase === context.enfase &&
      snapshot?.diaCiclo === context.diaCiclo &&
      snapshot?.diaPrograma === context.diaPrograma;

    if (!isCompatible) {
      return null;
    }

    const hasSnapshotProgress =
      (snapshot.doneExercises || []).length > 0 ||
      Object.keys(snapshot.weights || {}).length > 0 ||
      Object.keys(snapshot.seriesProgress || {}).length > 0 ||
      Number(snapshot.currentBoxIndex || 0) > 0;

    if (!hasSnapshotProgress) {
      localStorage.removeItem(key);
      return null;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent || "");
    const shouldRestore =
      isIOS ||
      window.confirm(
        "Continuar treino? Seu treino ficou aberto sem finalizar. Salve seu treino para finalizar."
      );
    if (!shouldRestore) {
      localStorage.removeItem(key);
      return null;
    }

    const doneSet = new Set(snapshot.doneExercises || []);
    const weights = snapshot.weights || {};
    const seriesProgress = snapshot.seriesProgress || {};

    document.querySelectorAll(".ff-ex-item").forEach(item => {
      const input = item.querySelector(".ff-ex-peso");
      const exercicioId = input?.dataset.ex;
      if (!exercicioId) return;

      if (weights[exercicioId] !== undefined) {
        input.value = weights[exercicioId];
      }

      const progress = seriesProgress[exercicioId];
      const progressEl = item.querySelector("[data-role='serie-progress']");
      const btnSerie = item.querySelector("[data-role='serie-next']");
      if (progressEl) {
        const total = Number(progressEl.dataset.serieTotal || progress?.serieTotal || 1);
        const atual = Math.max(1, Math.min(Number(progress?.serieAtual || 1), total));
        progressEl.dataset.serieAtual = String(atual);
        progressEl.dataset.serieTotal = String(total);
        progressEl.innerHTML = `Série <b>${atual}</b> / ${total}`;
        if (atual === total && btnSerie) {
          btnSerie.classList.add("done");
        }
      }

      if (doneSet.has(exercicioId)) {
        item.classList.add("ff-ex-done");
        if (btnSerie) {
          btnSerie.textContent = "✔️ Exercício concluído";
          btnSerie.classList.add("done");
          btnSerie.disabled = true;
        }
      }
    });

    return snapshot;
  }

  let revalidatingPerfil = false;
  async function revalidarPerfilTreino() {
    if (revalidatingPerfil) return;
    revalidatingPerfil = true;
    try {
      const diaProgramaAtual = Number(localStorage.getItem("femflow_diaPrograma") || 1);
      const diaCicloAtual = Number(localStorage.getItem("femflow_diaCiclo") || 1);
      const faseAtual = localStorage.getItem("femflow_fase") || "";
      const perfil = await FEMFLOW.carregarPerfil?.();
      if (!perfil || perfil.status !== "ok") return;
      FEMFLOW.perfilAtual = perfil;
      FEMFLOW.dispatch("femflow:ready", perfil);

      const diaProgramaNovo = Number(perfil.diaPrograma || localStorage.getItem("femflow_diaPrograma") || 1);
      const diaCicloNovo = Number(perfil.diaCiclo || localStorage.getItem("femflow_diaCiclo") || 1);
      const faseNova = String(perfil.fase || localStorage.getItem("femflow_fase") || "");
      const treinoAtualizado =
        diaProgramaNovo !== diaProgramaAtual ||
        diaCicloNovo !== diaCicloAtual ||
        (faseAtual && faseNova && faseAtual !== faseNova);

      if (treinoAtualizado) {
        clearTreinoSnapshot();
        FEMFLOW.toast("Seu treino foi atualizado. Voltando ao FlowCenter.");
        encerrarTreino();
        return;
      }
    } catch (err) {
      FEMFLOW.warn?.("Falha ao revalidar perfil:", err);
    } finally {
      revalidatingPerfil = false;
    }
  }

  function forceTreinoSnapshot() {
    saveTreinoSnapshot();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      forceTreinoSnapshot();
      return;
    }
    if (document.visibilityState === "visible") {
      revalidarPerfilTreino();
    }
  });

  window.addEventListener("pagehide", forceTreinoSnapshot);

  function getPseEmoji(valor) {
    if (valor <= 2) return "😌";
    if (valor <= 4) return "🙂";
    if (valor <= 6) return "😅";
    if (valor <= 8) return "😓";
    return "🥵";
  }

  function atualizarPseDisplay(valor) {
    if (!pseEmoji || !pseValor) return;
    const val = Number(valor || 0);
    pseEmoji.textContent = getPseEmoji(val);
    pseValor.textContent = String(val);
  }

  let treinoExtraAtivo = false;

  function encerrarTreino() {
    if (treinoExtraAtivo) {
      localStorage.removeItem("femflow_treino_extra");
    }
    if (enduranceAtivo) {
      localStorage.removeItem("femflow_treino_endurance");
    }
    localStorage.removeItem("femflow_custom_treino");
    localStorage.removeItem("femflow_custom_blocos");
    FEMFLOW.router("flowcenter.html");
  }

  const tourKey = window.FEMFLOW_TOUR_KEY;
  const tourReset = new URLSearchParams(window.location.search).get("tour");
  if (tourReset === "1") {
    localStorage.removeItem(tourKey);
  }
  const tourTargets = [btnSalvar, btnCancelar].filter(Boolean);
  const tourSteps = [
    {
      target: btnSalvar,
      title: t("treino.tour.salvarTitulo"),
      text: t("treino.tour.salvarTexto")
    },
    {
      target: btnCancelar,
      title: t("treino.tour.cancelarTitulo"),
      text: t("treino.tour.cancelarTexto")
    }
  ];
  let tourIndex = 0;

  function limparDestaquesTour() {
    tourTargets.forEach((element) => element?.classList.remove("tour-highlight"));
  }

  function atualizarTourUI() {
    const step = tourSteps[tourIndex];
    if (!step || !tourOverlay) return;

    limparDestaquesTour();
    if (step.target) {
      step.target.classList.add("tour-highlight");
      const setSpotlight = () => {
        const rect = step.target.getBoundingClientRect();
        const viewport = window.visualViewport;
        const offsetX = viewport?.offsetLeft || 0;
        const offsetY = viewport?.offsetTop || 0;
        const baseRadius = Math.max(rect.width, rect.height) / 2 + 20;
        const targetCenterX = rect.left + rect.width / 2 + offsetX;
        const targetCenterY = rect.top + rect.height / 2 + offsetY;
        const radius = baseRadius;
        const spotlightY = targetCenterY;

        tourOverlay.style.setProperty("--spot-x", `${targetCenterX}px`);
        tourOverlay.style.setProperty("--spot-y", `${spotlightY}px`);
        tourOverlay.style.setProperty("--spot-r", `${radius}px`);
      };

      if (!step.target.closest(".fix-footer")) {
        step.target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center"
        });
      }

      window.requestAnimationFrame(setSpotlight);
      window.setTimeout(setSpotlight, 300);
    }

    if (tourTitle) tourTitle.textContent = step.title;
    if (tourText) tourText.textContent = step.text;
    if (tourStep) {
      tourStep.textContent = t("treino.tour.step", {
        atual: tourIndex + 1,
        total: tourSteps.length
      });
    }
    if (tourSkip) {
      tourSkip.textContent = t("treino.tour.skip");
    }
    if (tourNext) {
      tourNext.textContent =
        tourIndex === tourSteps.length - 1
          ? t("treino.tour.finish")
          : t("treino.tour.next");
    }
  }

  function finalizarTour() {
    if (!tourOverlay) return;
    limparDestaquesTour();
    tourOverlay.classList.add("is-hidden");
    tourOverlay.setAttribute("aria-hidden", "true");
    localStorage.setItem(window.FEMFLOW_TOUR_KEY, "done");
  }

  function iniciarTourTreino() {
    if (!tourOverlay) return;
    if (localStorage.getItem(window.FEMFLOW_TOUR_KEY) === "done") return;
    if (!btnSalvar || !btnCancelar) return;
    tourIndex = 0;
    tourOverlay.classList.remove("is-hidden");
    tourOverlay.setAttribute("aria-hidden", "false");
    atualizarTourUI();
  }

  function resolveTipoTreino() {
    const enduranceFlag =
      enduranceAtivo ||
      localStorage.getItem("femflow_treino_endurance") === "true" ||
      localStorage.getItem("femflow_endurance_pending") === "true";
    const customFlag = localStorage.getItem("femflow_custom_treino") === "true";
    const enfaseAtual = FEMFLOW.enfaseAtual || localStorage.getItem("femflow_enfase") || "";
    const extraFlag =
      treinoExtraAtivo ||
      localStorage.getItem("femflow_treino_extra") === "true" ||
      FEMFLOW.engineTreino?.isExtraEnfase?.(enfaseAtual) ||
      String(enfaseAtual).toLowerCase().startsWith("extra_");

    if (enduranceFlag) return "endurance";
    if (customFlag) return "custom";
    if (extraFlag) return "extra";
    return "regular";
  }

  function registrarEvolucao({ pse, diaPrograma }) {
    const histRaw = localStorage.getItem("femflow_hist") || "[]";
    let hist;

    try {
      hist = JSON.parse(histRaw);
    } catch {
      hist = [];
    }

    const tipoTreino = resolveTipoTreino();
    const entry = {
      pse,
      data: new Date().toISOString(),
      diaPrograma,
      tipo: tipoTreino,
      enfase: localStorage.getItem("femflow_enfase") || "",
      ...(tipoTreino === "custom" ? { source: "monte_seu_treino" } : {})
    };

    hist.push(entry);
    hist = hist.slice(-40);
    localStorage.setItem("femflow_hist", JSON.stringify(hist));

    if (diaPrograma) {
      localStorage.setItem("femflow_dia_treino", String(diaPrograma));
    }
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", encerrarTreino);
  }

  if (tourNext) {
    tourNext.addEventListener("click", () => {
      if (tourIndex < tourSteps.length - 1) {
        tourIndex += 1;
        atualizarTourUI();
      } else {
        finalizarTour();
      }
    });
  }

  if (tourSkip) {
    tourSkip.addEventListener("click", finalizarTour);
  }

  if (pseInput) {
    atualizarPseDisplay(pseInput.value);
    pseInput.addEventListener("input", (event) => {
      atualizarPseDisplay(event.target.value);
    });
  }



  const SERIE_BEHAVIOR = {
    T:  { combinados: 3, descansoNoUltimo: true },
    B:  { combinados: 2, descansoNoUltimo: true },
    Q:  { combinados: 4, descansoNoUltimo: true },
    C:  { cluster: true, pausas: 10 },
    I:  { isometria: 3 },
    CC: { cadenciaExcentrica: true },
    D:  { dropset: 3 },
    RP: { restPause: true },
    AE: { ativacao: true }
  };

  if (!track) {
    FEMFLOW.error("❌ #carouselTrack não encontrado!");
    return;
  }

  let carouselScrollHandler = null;

  function updateCarouselIndicator({ index, total }) {
    if (!indicatorDots || !indicatorThumb) return;

    const dots = Array.from(indicatorDots.children);
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
    });

    const bar = indicatorThumb.parentElement;
    const barWidth = bar?.clientWidth || 0;
    if (!barWidth || total <= 0) return;

    const thumbWidth = Math.max(18, Math.round(barWidth / total));
    const maxLeft = barWidth - thumbWidth;
    const left = total > 1 ? Math.round((index / (total - 1)) * maxLeft) : 0;

    indicatorThumb.style.width = `${thumbWidth}px`;
    indicatorThumb.style.left = `${left}px`;
  }

  function initCarouselIndicator() {
    if (!carousel || !indicator || !indicatorDots || !indicatorThumb) return;

    const items = Array.from(track.querySelectorAll(".carousel-item"));
    const total = items.length;

    indicator.classList.toggle("is-hidden", total <= 1);
    indicatorDots.innerHTML = "";

    if (total <= 1) return;

    items.forEach((_, idx) => {
      const dot = document.createElement("span");
      dot.className = "carousel-dot";
      dot.setAttribute("aria-hidden", "true");
      dot.addEventListener("click", () => {
        const gap = parseFloat(getComputedStyle(track).gap || 0);
        const step = items[0].getBoundingClientRect().width + gap;
        carousel.scrollTo({ left: step * idx, behavior: "smooth" });
      });
      indicatorDots.appendChild(dot);
    });

    const gap = parseFloat(getComputedStyle(track).gap || 0);
    const step = items[0].getBoundingClientRect().width + gap;

    const update = () => {
      const idx = Math.max(
        0,
        Math.min(total - 1, Math.round(carousel.scrollLeft / step))
      );
      updateCarouselIndicator({ index: idx, total });
      if (treinoSnapshotState.lastBoxIndex !== idx) {
        treinoSnapshotState.lastBoxIndex = idx;
        scheduleTreinoSnapshot();
      }
    };

    if (carouselScrollHandler) {
      carousel.removeEventListener("scroll", carouselScrollHandler);
    }

    carouselScrollHandler = () => window.requestAnimationFrame(update);
    carousel.addEventListener("scroll", carouselScrollHandler, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  const pseEmojis = ["😴", "🙂", "🙂", "😌", "🙂", "😅", "😅", "😮‍💨", "😮‍💨", "🥵", "🥵"];

  function atualizarEmojiPse(valor) {
    if (!pseEmoji) return;
    const idx = Math.max(0, Math.min(10, Number(valor) || 0));
    pseEmoji.textContent = pseEmojis[idx];
    if (pseEmojiValue) pseEmojiValue.textContent = String(idx);
    pseEmoji.classList.remove("pse-emoji-bounce");
    window.requestAnimationFrame(() => pseEmoji.classList.add("pse-emoji-bounce"));
  }

  if (pseInput) {
    atualizarEmojiPse(pseInput.value);
    pseInput.addEventListener("input", (event) => {
      atualizarEmojiPse(event.target.value);
    });
  }

  /* ============================================================
     1️⃣ LISTENER ÚNICO — PERFIL PRONTO
  ============================================================ */
  window.addEventListener("femflow:ready", async (ev) => {

    const perfil = ev.detail;
    console.log("🔥 femflow:ready recebido", perfil);

    if (!perfil) {
      FEMFLOW.toast("Erro ao carregar perfil.", true);
      return;
    }

    /* ================= CICLO ================= */
    const cicloOK = localStorage.getItem("femflow_cycle_configured");
    if (!cicloOK) {
      FEMFLOW.toast("⚠️ Configure seu ciclo antes de treinar.");
      location.href = "ciclo.html";
      return;
    }

    FEMFLOW.log("🚀 treino.js v4.0 iniciado!");

    /* ================= PERSONAL FINAL ================= */
   // ❌ treino.js NÃO redefine direito
// localStorage.setItem("femflow_has_personal", ...);

// ✅ apenas lê
const hasPersonal =
  localStorage.getItem("femflow_has_personal") === "true";

    const modePersonal =
      localStorage.getItem("femflow_mode_personal") === "true";
    personalFinal = hasPersonal && modePersonal;

    if (personalFinal) {
      document.body.classList.add("personal-mode");
    } else {
      document.body.classList.remove("personal-mode");
    }

    if (isCustomTreino) {
      personalFinal = false;
      document.body.classList.remove("personal-mode");
    }

    /* ================= PERFIL ================= */
    const nivel = perfil.nivel || localStorage.getItem("femflow_nivel");
    let enfaseLocal = localStorage.getItem("femflow_enfase");
    let enfaseFinal = null;
    let extraSessaoAtiva = false;
    if (!isCustomTreino) {
      extraSessaoAtiva = localStorage.getItem("femflow_treino_extra") === "true";
      const enfaseBackendRaw = String(perfil.enfase || "").toLowerCase().trim();
      const enfaseLocalRaw = String(enfaseLocal || "").toLowerCase().trim();
      const isEnfaseValida = value =>
        Boolean(value) && value !== "nenhuma" && value !== "personal";
      enfaseFinal = isEnfaseValida(enfaseBackendRaw)
        ? enfaseBackendRaw
        : (isEnfaseValida(enfaseLocalRaw) ? enfaseLocalRaw : null);
      if (extraParamNorm.startsWith("extra_")) {
        enfaseFinal = extraParamNorm;
      }
      if (extraSessaoAtiva) {
        if (FEMFLOW.engineTreino?.isExtraEnfase?.(enfaseLocalRaw)) {
          enfaseFinal = enfaseLocalRaw;
        } else {
          localStorage.removeItem("femflow_treino_extra");
        }
      }
      if (!extraSessaoAtiva && enfaseLocalRaw && FEMFLOW.engineTreino?.isExtraEnfase?.(enfaseLocalRaw)) {
        localStorage.removeItem("femflow_treino_extra");
        enfaseFinal = isEnfaseValida(enfaseBackendRaw) ? enfaseBackendRaw : null;
      }

      // 🔥 Personal nunca é ênfase
      if (!isEnfaseValida(enfaseFinal)) {
        enfaseFinal = null;
      }
    } else {
      localStorage.removeItem("femflow_treino_extra");
    }

    const faseMetodoPerfil = String(perfil.fase || localStorage.getItem("femflow_fase") || "follicular");
    const fase = faseMetodoPerfil;
    const diaCiclo = Number(perfil.diaCiclo || localStorage.getItem("femflow_diaCiclo") || 1);
    const caminhosApi = FEMFLOW.treinoCaminhos;
    const caminhoValido = Number.isFinite(caminhoParam) && caminhoParam >= 1 && caminhoParam <= 5;
    contextoCaminhoSelecionado = null;

    // Opção A (padrão): personal ignora a fase do método para busca de conteúdo.
    // Opção B (futura): personal respeita a fase do método via flag explícita.
    const personalHormonalAtivo =
      localStorage.getItem("femflow_personal_hormonal") === "true";

    if (caminhoValido && caminhosApi) {
      const faseMetodo = caminhosApi.normalizarFaseMetodo(faseMetodoPerfil);
      const ctx = caminhosApi.resolverContextoDeBusca(faseMetodo, caminhoParam);
      if (ctx?.diaUsado && ctx?.faseFirestore) {
        contextoCaminhoSelecionado = {
          caminho: caminhoParam,
          faseMetodo,
          diaUsado: ctx.diaUsado,
          faseFirestore: ctx.faseFirestore
        };
        console.log("[treino.js] contexto do caminho aplicado", contextoCaminhoSelecionado);
      } else {
        console.warn("[treino.js] caminho inválido para contexto atual; fallback padrão", {
          caminhoParam,
          faseMetodo
        });
      }
    }

    const faseFirestoreFinal = contextoCaminhoSelecionado?.faseFirestore || fase;
    const diaUsadoFinal = contextoCaminhoSelecionado?.diaUsado || diaCiclo;

    if (personalFinal) {
      console.log("[treino.js] Personal ativo: mesmo fluxo de Caminhos habilitado.", {
        opcaoPadrao: "A",
        personalHormonalAtivo,
        faseMetodo: faseMetodoPerfil,
        faseFirestoreFinal,
        diaUsadoFinal,
        caminho: contextoCaminhoSelecionado?.caminho || null
      });
    }

    const isExtraTreino = !isCustomTreino && FEMFLOW.engineTreino?.isExtraEnfase?.(enfaseFinal);
    treinoExtraAtivo = Boolean(extraSessaoAtiva);
    if (!extraSessaoAtiva && isExtraTreino) {
      localStorage.removeItem("femflow_treino_extra");
    }
    const enduranceSetupDone =
      localStorage.getItem("femflow_endurance_setup_done") === "true";
    const enduranceConfigRaw = localStorage.getItem("femflow_endurance_config");
    const enduranceSetupExists =
      (enduranceConfigRaw !== null && enduranceConfigRaw !== "") ||
      enduranceSetupDone;
    const endurancePublicEnabled =
      localStorage.getItem("femflow_endurance_public_enabled") === "true";
    const endurancePublicIntent =
      localStorage.getItem("femflow_endurance_public_intent") === "true";
    const endurancePublicAtivoContexto =
      endurancePublicEnabled && (endurancePublicIntent || !hasPersonalStorage);
    const enduranceAllowed = hasPersonalStorage || enduranceSetupExists || endurancePublicAtivoContexto;

    if (!enduranceAllowed && enduranceAtivo) {
      enduranceAtivo = false;
      localStorage.removeItem("femflow_treino_endurance");
    }
    if (enduranceAtivo) {
      enduranceConfig = getEnduranceConfig();
      endurancePublicAtivo = endurancePublicAtivoContexto;
    }

    console.log("🧠 ÊNFASE RECEBIDA DO BACKEND:", perfil.enfase);
    FEMFLOW.enfaseAtual = isCustomTreino ? "custom" : enfaseFinal;

    if (!isCustomTreino && !personalFinal && !enfaseFinal && !enduranceAtivo) {
      FEMFLOW.toast("Escolha um treino na Home 🌸");
      FEMFLOW.router("home.html");
      return;
    }

    const extraLabels = {
      extra_superior: t("treino.extraOpcoes.superior"),
      extra_inferior: t("treino.extraOpcoes.inferior"),
      extra_abdomen: t("treino.extraOpcoes.abdomem"),
      extra_mobilidade: t("treino.extraOpcoes.mobilidade"),
      extra_biceps: t("treino.extraOpcoes.biceps"),
      extra_triceps: t("treino.extraOpcoes.triceps"),
      extra_ombro: t("treino.extraOpcoes.ombro"),
      extra_quadriceps: t("treino.extraOpcoes.quadriceps"),
      extra_posterior: t("treino.extraOpcoes.posterior"),
      extra_peito: t("treino.extraOpcoes.peito"),
      extra_costas: t("treino.extraOpcoes.costas"),
      extra_gluteo: t("treino.extraOpcoes.gluteo")
    };

    if (enduranceAtivo && enduranceConfig) {
      const enduranceLabel = (t("endurance") || "Endurance").toUpperCase();
      if (tituloTopo) {
        tituloTopo.textContent = enduranceLabel;
      }
      if (tituloDia) {
        tituloDia.textContent = `Semana ${enduranceConfig.semana} • ${enduranceConfig.dia}`;
      }
    } else if (isCustomTreino) {
      const diaPrograma = Number(localStorage.getItem("femflow_diaPrograma") || 1);
      FEMFLOW.diaProgramaAtual = diaPrograma;
      if (tituloDia) {
        tituloDia.textContent = t("treino.diaProgramaLabel", { dia: diaPrograma });
      }
    } else if (isExtraTreino) {
      FEMFLOW.diaProgramaAtual = Number(localStorage.getItem("femflow_diaPrograma") || 1);
      if (tituloTopo) {
        tituloTopo.textContent = t("treino.tituloExtra");
      }
      if (tituloDia) {
        const extraLabel = extraLabels[enfaseFinal] || t("treino.extraLabel");
        tituloDia.textContent = t("treino.extraTitulo", { tipo: extraLabel });
      }
    } else {
      const diaPrograma = await FEMFLOW.getDiaPrograma();
      FEMFLOW.diaProgramaAtual = diaPrograma;

      if (tituloDia) {
        if (contextoCaminhoSelecionado) {
          tituloDia.textContent = `Caminho ${contextoCaminhoSelecionado.caminho} • Dia ${contextoCaminhoSelecionado.diaUsado}`;
        } else {
          tituloDia.textContent = t("treino.diaProgramaLabel", { dia: diaPrograma });
        }
      }
    }

    /* ================= TREINO ================= */
    let lista = [];
    if (enduranceAtivo) {
      if (endurancePublicAtivo) {
        const modalidade = enduranceConfig?.modalidade || enduranceConfig?.enfase || "";
        const semana = String(enduranceConfig?.semana || "").trim();
        const estimulo = String(enduranceConfig?.estimulo || "").trim();

        if (!modalidade || !semana || !estimulo) {
          FEMFLOW.toast("Configuração Endurance incompleta. Revise semana e dia.");
          return;
        }

        lista = await FEMFLOW.engineTreino.montarTreinoEndurancePublicByEstimulo({
          modalidade,
          semana,
          estimulo
        });
      } else {
        lista = await FEMFLOW.engineTreino.montarTreinoEndurance({
          id,
          semana: enduranceConfig?.semana,
          dia: enduranceConfig?.dia,
          enfase: enduranceConfig?.enfase
        });
      }
    } else if (isCustomTreino) {
      lista = await FEMFLOW.engineTreino.montarTreinoCustomizado({
        id,
        diaCiclo,
        diaPrograma: FEMFLOW.diaProgramaAtual
      });
    } else {
      lista = await FEMFLOW.engineTreino.montarTreinoFinal({
        id,
        nivel,
        enfase: enfaseFinal,
        fase: faseFirestoreFinal,
        diaCiclo: diaUsadoFinal,
        personal: personalFinal && !isExtraTreino
      });
    }

    renderTreino(lista);

    window.requestAnimationFrame(() => {
      iniciarTourTreino();
    });

    localStorage.setItem("femflow_fase", fase);
    localStorage.setItem("femflow_diaCiclo", diaCiclo);

    if (contextoCaminhoSelecionado && caminhosApi) {
      caminhosApi.salvarUltimoCaminho({
        faseMetodo: contextoCaminhoSelecionado.faseMetodo,
        caminho: contextoCaminhoSelecionado.caminho
      });
    }
  });

  /* ============================================================
     2. FUNÇÃO DE RENDER
  ============================================================ */

  function fmtTime(seg) {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function formatCardioTempo(valor) {
    if (valor === null || valor === undefined || valor === "") return "";
    const num = Number(valor);
    if (Number.isFinite(num) && num > 0) {
      if (num % 60 === 0) return `${num / 60} min`;
      return fmtTime(num);
    }
    return String(valor);
  }

  function montarCardioInfo(c) {
    const serieValor = c.series;
    const distanciaValor = c.distancia;
    const distanciaMilhasValor =
      c.distancia_milhas ??
      c.distanciaMilhas ??
      c.milhas ??
      c.distance_miles ??
      "";
    const tempoValor = c.tempo || c.duracao;
    const intervaloValor = c.intervalo;
    const ritmoValor = c.ritmo;
    const zonaTreino = String(c.zona_treino || c.zonaTreino || "").trim().toUpperCase();

    const series = serieValor !== undefined && serieValor !== null ? String(serieValor) : "";
    const tempoOuDistancia = distanciaValor
      ? String(distanciaValor)
      : formatCardioTempo(tempoValor);
    const distanciaMilhas =
      distanciaMilhasValor !== undefined && distanciaMilhasValor !== null
        ? String(distanciaMilhasValor).trim()
        : "";
    const intervaloTexto = formatCardioTempo(intervaloValor);
    const ritmoTexto = ritmoValor !== undefined && ritmoValor !== null ? String(ritmoValor).trim() : "";

    const hasSeries = series && series !== "0";
    const hasTempo = tempoOuDistancia && tempoOuDistancia !== "0";
    const hasIntervalo = intervaloTexto && intervaloTexto !== "0";
    const hasRitmo = Boolean(ritmoTexto);
    const hasZona = Boolean(zonaTreino);
    const hasDistanciaMilhas = Boolean(distanciaMilhas && distanciaMilhas !== "0");
    const usarFallback = !(hasSeries && hasTempo && hasIntervalo);
    const fallbackTempo = t("treino.cardio.fallbackTempo");
    const fallbackTempoDinamico = hasTempo ? tempoOuDistancia : fallbackTempo;

    const descricao = hasZona
      ? t("treino.cardio.descricaoZona", { zona: zonaTreino })
      : usarFallback
      ? t("treino.cardio.fallback", { tempo: fallbackTempoDinamico })
      : hasRitmo
        ? t("treino.cardio.descricaoRitmo", {
            series: series || "-",
            tempo: tempoOuDistancia || "-",
            intervalo: intervaloTexto || "-",
            ritmo: ritmoTexto
          })
        : t("treino.cardio.descricao", {
            series: series || "-",
            tempo: tempoOuDistancia || "-",
            intervalo: intervaloTexto || "-"
          });

    const detalhes = [];
    if (hasSeries) {
      detalhes.push(t("treino.cardio.seriesLabel", { series }));
    }
    if (hasZona) {
      detalhes.push(t("treino.cardio.zonaLabel", { zona: zonaTreino }));
    }
    if (hasTempo) {
      detalhes.push(t("treino.cardio.tempoLabel", { tempo: tempoOuDistancia }));
    } else if (usarFallback) {
      detalhes.push(t("treino.cardio.tempoLabel", { tempo: fallbackTempoDinamico }));
    }
    if (hasIntervalo) {
      detalhes.push(t("treino.cardio.intervaloLabel", { intervalo: intervaloTexto }));
    }
    if (hasDistanciaMilhas) {
      detalhes.push(t("treino.cardio.milhasLabel", { milhas: distanciaMilhas }));
    }

    return { descricao, detalhes };
  }
   
function renderTreino(lista) {

   console.log("🎯 RENDER TREINO LISTA:", lista);
lista.forEach(item => {
  console.log("🎯 ITEM:", {
    tipo: item.tipo,
    box: item.box,
    boxKey: item.boxKey,
    serieEspecial: item.serieEspecial
  });
});


  if (!lista || !lista.length) {
    if (indicator) {
      indicator.classList.add("is-hidden");
    }
    track.innerHTML = `
      <div class="carousel-item">
        <p>Nenhum treino disponível para hoje.</p>
      </div>
    `;
    return;
  }
   
  /* ============================================================
     1) AGRUPAR ITEMS POR BOX
  ============================================================ */
  const grupos = {}; // { 1:[…], 2:[…], 999:[…]… }

  lista.forEach(item => {
    const box = item.boxKey ?? item.box ?? 0;
    if (!grupos[box]) grupos[box] = [];
    grupos[box].push(item);
  });
   
console.log("🧪 GRUPOS RAW:", grupos);
console.log("🧪 BOX KEYS RAW:", Object.keys(grupos));
   
   Object.entries(grupos).forEach(([key, arr]) => {
  console.log(`🧩 GRUPO ${key}:`, arr.map(i => ({
    tipo: i.tipo,
    box: i.box,
    serieEspecial: i.serieEspecial
  })));
});

  /* ordenar box: -100 → 0 → 1 → 2 → … → 500 → 900 → 999 */
  const boxKeys = Object.keys(grupos).sort((a, b) => {
  const na = parseFloat(a);
  const nb = parseFloat(b);

  // ambos numéricos → ordena normal
  if (!isNaN(na) && !isNaN(nb)) {
    if (na !== nb) return na - nb;
    return String(a).localeCompare(String(b));
  }

  // um numérico, outro não → numérico vem primeiro
  if (!isNaN(na)) return -1;
  if (!isNaN(nb)) return 1;

  // ambos strings → ordem alfabética
  return a.localeCompare(b);
});

console.log("🧪 BOX KEYS ORDENADAS:", boxKeys);
  track.innerHTML = "";

  /* ============================================================
     2) RENDERIZAR CADA BOX
  ============================================================ */
  boxKeys.forEach(boxNum => {
    const bloco = grupos[boxNum];
     if (!Array.isArray(bloco) || bloco.length === 0) {
  FEMFLOW.warn("⚠️ Box ignorado (vazio ou inválido):", boxNum);
  return;
}
    const html = renderBox(bloco);
    if (html) track.insertAdjacentHTML("beforeend", html);
  });

treinoSnapshotToScroll = restoreTreinoSnapshot();
initTimers();
  initCardioZonaInfo();
  initHIIT();
  initClusterTimers(); // 🔥 CLUSTER TIMER REAL
  initRestPause(); // ✅
  initSeriesProgress();
  initPeso();
  void initPesoPrefill();
  initCarouselIndicator();
  if (treinoSnapshotToScroll?.currentBoxIndex != null && carousel) {
    const items = Array.from(track.querySelectorAll(".carousel-item"));
    if (items.length) {
      const gap = parseFloat(getComputedStyle(track).gap || 0);
      const step = items[0].getBoundingClientRect().width + gap;
      carousel.scrollTo({
        left: step * Math.max(0, Math.min(items.length - 1, treinoSnapshotToScroll.currentBoxIndex)),
        behavior: "auto"
      });
    }
  }
}
 /* ============================================================
     3) RENDER BOX
  ============================================================ */
   
function renderBox(bloco) {

   console.log("🧱 RENDER BOX:", {
  tipoDominante: bloco[0].tipo,
  box: bloco[0].box,
  serieEspecial: bloco[0].serieEspecial,
  bloco
});


   
  if (!Array.isArray(bloco) || bloco.length === 0) {
    FEMFLOW.warn("⚠️ renderBox recebeu bloco inválido:", bloco);
    return "";
  }

  const tipoDominante = bloco[0].tipo;
  const boxNum = Number(bloco[0].box || 0);

  // 🔒 segurança: box técnico nunca vira treino
  if (boxNum >= 900 && tipoDominante === "treino") return "";

  /* ======================================================
     AQUECIMENTO PREMIUM
  ====================================================== */
 if (tipoDominante === "aquecimentoPremium") {
  const ui = getAquecimentoUI();

  return `
    <div class="carousel-item ff-box">
      <h2 class="ff-ex-titulo">${bloco[0].titulo}</h2>

      <ul class="ff-passos">
        ${(bloco[0].passos || []).map(p => `<li>${p.nome}</li>`).join("")}
      </ul>

      <p class="ff-sugestao-resp">
        ${ui.sugestao}
      </p>

      <button class="ff-btn-resp-sugerida"
              type="button"
              onclick="location.href='respiracao.html?ret=treino'">
        ${ui.btn}
      </button>
    </div>
  `;
}


  /* ======================================================
     RESFRIAMENTO PREMIUM
  ====================================================== */
 if (tipoDominante === "resfriamentoPremium") {
  const ui = getResfriamentoUI();

  return `
    <div class="carousel-item ff-box">
      <h2 class="ff-ex-titulo">${bloco[0].titulo}</h2>

      <ul class="ff-passos">
        ${(bloco[0].passos || []).map(p => `<li>${p.nome}</li>`).join("")}
      </ul>

      <p class="ff-sugestao-resp">
        ${ui.sugestao}
      </p>

      <button class="ff-btn-resp-sugerida"
              type="button"
              onclick="location.href='respiracao.html?ret=treino'">
        ${ui.btn}
      </button>
    </div>
  `;
}

  /* ======================================================
     CARDIO (FINAL + INTERMEDIARIO)
  ====================================================== */
  if (tipoDominante === "cardio_final" || tipoDominante === "cardio_intermediario") {
    const c = bloco[0];
    const { descricao, detalhes } = montarCardioInfo(c);
    const zonaTreino = String(c.zona_treino || "").trim().toUpperCase();
    const mostrarInfoZona = endurancePublicAtivo && Boolean(zonaTreino);
    const duracao = Number(c.duracao) || 0;
    const cardioClass =
      tipoDominante === "cardio_final"
        ? "ff-cardio-final"
        : "ff-cardio-intermediario";
    const link = c.link || "";
    const tituloHTML = link
      ? `<a href="${link}" target="_blank" rel="noopener">${c.titulo}</a>`
      : c.titulo;
    const detalhesHTML = detalhes.length
      ? `
        <ul class="ff-cardio-info">
          ${detalhes.map(item => `<li>${item}</li>`).join("")}
        </ul>
      `
      : "";
    const timerHTML = duracao > 0
      ? `
        <div class="ff-descanso-wrap">
          <button class="ff-descanso-btn btnStartTimer">${t("treino.cardio.iniciar")}</button>
          <span class="ff-timer-count">${fmtTime(duracao)}</span>

          <div class="ff-timer-bar" data-timer="${duracao}">
            <div class="ff-timer-fill"></div>
          </div>
        </div>
      `
      : "";
    const zonaBadgeHTML = mostrarInfoZona
      ? `<button class="ff-zona-info-btn" type="button" data-zona-info="true" aria-label="${t("treino.cardio.zonas.aria")}">i</button>`
      : "";
    const zonaTreinoHTML = mostrarInfoZona
      ? `<p class="ff-cardio-zona">${t("treino.cardio.zonas.label", { zona: zonaTreino })}</p>`
      : "";

    return `
      <div class="carousel-item ff-box ff-cardio-box ${cardioClass}">
        ${zonaBadgeHTML}
        <h2 class="ff-ex-titulo">${tituloHTML}</h2>

        ${zonaTreinoHTML}

        <p class="ff-cardio-descricao">${descricao}</p>
        ${detalhesHTML}
        ${timerHTML}
      </div>
    `;
  }

 /* ======================================================
   HIIT PREMIUM
====================================================== */
if (tipoDominante === "hiitPremium") {
  const h = bloco[0];

  const forte  = Number(h.forte) || 40;
  const leve   = Number(h.leve ?? h.fraco) || 20;
  const ciclos = Number(h.ciclos ?? h.ciclo) || 6;
  const link   = h.link || "";
  const linkHTML = link
    ? `<div class="ff-ex-nome"><a href="${link}" target="_blank">${h.titulo}</a></div>`
    : `<h2 class="ff-ex-titulo">${h.titulo}</h2>`;
  const lang = FEMFLOW.lang || "pt";
  const fallbackMap = {
    pt: `
      🔥 <b>Protocolo ${forte} / ${leve}</b><br>
      Execute ${forte}s em alta intensidade e depois ${leve}s de recuperação.<br>
      Repita por ${ciclos} ciclos seguindo o timer abaixo.<br><br>

      <span class="ff-hiit-exemplos">
        • <b>Academia: esteira, bike, escada, remo, air bike</b><br>
        • <b>Em casa: polichinelo, corrida parada, burpee, corda, salto no lugar</b>
      </span>
    `,
    en: `
      🔥 <b>Protocol ${forte} / ${leve}</b><br>
      Do ${forte}s at high intensity and then ${leve}s of recovery.<br>
      Repeat for ${ciclos} cycles following the timer below.<br><br>

      <span class="ff-hiit-exemplos">
        • <b>Gym: treadmill, bike, stair climber, rowing, air bike</b><br>
        • <b>At home: jumping jacks, running in place, burpee, jump rope, jumps in place</b>
      </span>
    `,
    fr: `
      🔥 <b>Protocole ${forte} / ${leve}</b><br>
      Faites ${forte}s en haute intensité puis ${leve}s de récupération.<br>
      Répétez pendant ${ciclos} cycles en suivant le minuteur ci-dessous.<br><br>

      <span class="ff-hiit-exemplos">
        • <b>Salle: tapis, vélo, escalier, rameur, air bike</b><br>
        • <b>À la maison: jumping jacks, course sur place, burpee, corde à sauter, sauts sur place</b>
      </span>
    `
  };
  const fallbackTexto = fallbackMap[lang] || fallbackMap.pt;
  const sugestaoHTML = link
    ? `
      🔥 <b>${t("treino.hiit.protocolo", { forte, leve })}</b><br>
      ${t("treino.hiit.descricao", { forte, leve })}<br>
      ${t("treino.hiit.ciclos", { ciclos })}<br><br>

      <span class="ff-hiit-exemplos">
        • <b>${t("treino.hiit.exemplosAcademia")}</b><br>
        • <b>${t("treino.hiit.exemplosCasa")}</b>
      </span>
    `
    : fallbackTexto;

  return `
    <div class="carousel-item ff-box">
      ${linkHTML}

      <p class="ff-sugestao-hiit">
        ${sugestaoHTML}
      </p>

      <div class="hiit-bubble">
        <div class="hiit-circle"
             data-estimulo="${forte}"
             data-descanso="${leve}"
             data-ciclos="${ciclos}">
          ▶
        </div>
        <div class="hiit-phase">${t("treino.hiit.iniciar")}</div>
      </div>
    </div>
  `;
}

  /* ======================================================
     TREINO (box com exercícios + série especial)
  ====================================================== */
  const codigoSerie = bloco[0].serieEspecial || null;
  const ordemSerie  = null;

const behavior = SERIE_BEHAVIOR[codigoSerie] || null;

  const serieInfo  = getSerieEspecialInfo(codigoSerie);

const serieClass = codigoSerie
  ? `carousel-item ff-box ff-serie-especial ff-serie-${codigoSerie}`
  : `carousel-item ff-box`;

const serieData = codigoSerie
  ? `data-serie="${codigoSerie}"`
  : "";

 let htmlBox = `
  <div class="${serieClass}"
       ${serieData}
       data-serie-ordem="${ordemSerie ?? ""}"
       data-serie-codigo="${codigoSerie ?? ""}">
`;

  if (serieInfo) {
    htmlBox += `
      <h2 class="ff-ex-titulo">${serieInfo.titulo}</h2>
      <div class="ff-serie-box ff-serie-${codigoSerie}">
        <p>${serieInfo.texto}</p>
      </div>
    `;
  } else {
    htmlBox += `<h2 class="ff-ex-titulo">Box ${boxNum}</h2>`;
  }

  const totalCombo = behavior?.combinados || bloco.length;

   
 bloco.forEach((ex, index) => {
    
    console.log("🧪 EX:", {
  titulo: ex.titulo,
  serieEspecial: ex._serieCodigo,
  isCluster: ex._isCluster,
  behavior
});

  // 🔥 PROPAGAÇÃO DA SÉRIE DO BOX PARA O EXERCÍCIO
  ex.serieEspecial = codigoSerie;

  ex._comboIndex = index + 1;
  ex._comboTotal = totalCombo;
  ex._isUltimoDoCombo = index === totalCombo - 1;

  ex._hideRest =
    behavior?.descansoNoUltimo === true &&
    !ex._isUltimoDoCombo;

  // 🔥 ATIVAÇÕES
  ex._isCluster   = behavior?.cluster === true;
  ex._isRestPause = behavior?.restPause === true;
    // RP
if (behavior?.restPause) {
  ex._rpPausa = behavior.pausas || 15; // fallback seguro
}
    // Cadência excêntrica
if (behavior?.cadenciaExcentrica) {
  ex._cadenciaExcentrica = true;
}

// Isometria
if (behavior?.isometria) {
  ex._isometriaTempo = behavior.isometria; // ex: 3s
}


   
  ex._serieOrdem  = ordemSerie;
  ex._serieCodigo = codigoSerie;

  htmlBox += renderExercicio(ex);
});


  htmlBox += `</div>`;
  return htmlBox;
}


/* ============================================================
   BLOCO EXERCÍCIO INDIVIDUAL
============================================================ */
function renderExercicio(ex) {

  const intervalo = Number(ex.intervalo) || 0;
const totalSeries = Number(ex.series) || 1;
  const distanciaValue = ex.distancia !== undefined && ex.distancia !== null
    ? String(ex.distancia).trim()
    : "";
  const distanciaText = distanciaValue ? `${distanciaValue} m` : "";
   const isRP = ex._isRestPause && ex._isUltimoDoCombo;
  const isIsometria = Boolean(ex._isometriaTempo || ex._serieCodigo === "I");
  const execTempoValue = ex.tempo || ex._isometriaTempo || "";
  const execTempoText = /^\d+(\.\d+)?$/.test(String(execTempoValue).trim())
    ? `${execTempoValue}s`
    : execTempoValue;
  const repsValue = ex.reps ? String(ex.reps).trim() : "";
  const seriesValue = ex.series ? String(ex.series).trim() : "";
  const repsInfoHTML = isIsometria
    ? `<span>⏱️ <b>${execTempoText}</b> execução</span>`
    : distanciaText
    ? `<span>📏 <b>${distanciaText}</b></span>`
    : repsValue
    ? `<span>🔁 <b>${repsValue}</b></span>`
    : execTempoValue
    ? `<span>⏱️ <b>${execTempoText}</b></span>`
    : `<span>🔁 <b>-</b></span>`;


const serieProgressHTML = `
  <div class="ff-serie-progress"
     data-role="serie-progress"
     data-serie-atual="1"
     data-serie-total="${totalSeries}">
    Série <b>1</b> / ${totalSeries}
  </div>
`;

const serieBtnHTML = `
  <button class="ff-serie-next-btn"
        data-role="serie-next">
    ✔️ Concluir série
  </button>
`;

  /* ===========================
     BLOCO DE DESCANSO (CONDICIONAL)
  ============================ */

  let descansoHTML = "";

  // 🔥 CLUSTER — timer próprio
  if (ex._isCluster) {
    descansoHTML = `
      <div class="ff-cluster-wrap" data-cluster="true">

        <button class="ff-cluster-btn" data-cluster-start>
          ▶️ Iniciar bloco
        </button>

        <div class="ff-cluster-timer hidden">
          <span class="ff-cluster-count">10</span>s
          <div class="ff-cluster-bar">
            <div class="ff-cluster-fill"></div>
          </div>
        </div>

      </div>
    `;
  }
   
if (ex._isRestPause && ex._isUltimoDoCombo) {
  descansoHTML = `
    <div class="ff-restpause-wrap hidden" data-rp="true">

      <p class="ff-restpause-label">
        ⚡ Rest-Pause — reduza a carga e execute novamente
      </p>

      <button class="ff-restpause-btn">
        ▶️ Iniciar pausa RP
      </button>

      <span class="ff-restpause-status">
        Pausa curta • execute novamente
      </span>

      <div class="ff-rp-bar">
        <div class="ff-rp-fill"></div>
      </div>
    </div>
  `;
}


 let observacoesHTML = "";

// 🐢 Cadência
if (ex._cadenciaExcentrica) {
  observacoesHTML += `
    <div class="ff-cadencia-note">
      🐢 Controle a descida do movimento
    </div>
  `;
}

// 🧊 Isometria
if (ex._isometriaTempo) {
  observacoesHTML += `
    <div class="ff-isometria-note">
      🧊 Permaneça com o músculo contraído por todo o tempo de execução.
    </div>
  `;
}


   

  // ⚠️ COMBO — descanso só no último
  else if (ex._hideRest) {
    descansoHTML = "";
  }

  // ✅ NORMAL
  else {
    descansoHTML = `
      <div class="ff-descanso-wrap">
        <button class="ff-descanso-btn btnStartTimer">
          ▶️ Iniciar descanso
        </button>

        <span class="ff-timer-count">${fmtTime(intervalo)}</span>

        <div class="ff-timer-bar" data-timer="${intervalo}">
          <div class="ff-timer-fill"></div>
        </div>
      </div>
    `;
  }

  /* ===========================
     RENDER FINAL
  ============================ */

return `
  <div class="ff-ex-item"
       data-combo-index="${ex._comboIndex || 1}"
       data-combo-total="${ex._comboTotal || 1}"
       ${isRP ? 'data-rp-required="true" data-rp-done="false"' : ''}>

    <div class="ff-ex-top">
      <div class="ff-ex-nome">
        <a href="${ex.link || "#"}" target="_blank">
          ${ex.titulo}
        </a>
      </div>

      <input class="ff-ex-peso"
             type="number"
             placeholder="kg"
             data-ex="${ex.titulo}">
    </div>

    <div class="ff-info-line">
      <span>🌀 <b>${seriesValue || "-"}</b>x</span>
      ${repsInfoHTML}
      <span>⏱️ <b>${intervalo}s</b></span>
    </div>

    <!-- 📊 PROGRESSO DE SÉRIES -->
    ${serieProgressHTML}

    <!-- ✅ CONCLUIR SÉRIE -->
    ${serieBtnHTML}

    <!-- 🧠 OBSERVAÇÕES TÉCNICAS (RP / ISOMETRIA / CADÊNCIA) -->
    ${observacoesHTML}

    <!-- ⏱️ DESCANSO OU REST-PAUSE -->
    ${descansoHTML}

  </div>
`;
}


  
  /* ============================================================
     3. TIMERS
  ============================================================ */
  function initTimers() {
    document.querySelectorAll(".ff-descanso-wrap").forEach(wrap => {
      const btn   = wrap.querySelector(".ff-descanso-btn");
      const bar   = wrap.querySelector(".ff-timer-bar");
      const fill  = bar?.querySelector(".ff-timer-fill");
      const label = wrap.querySelector(".ff-timer-count");

      if (!btn || !bar || !fill || !label) return;

      const total = Number(bar.dataset.timer) || 60;
      let restante = total;
      let rodando  = false;
      let intv;

      label.textContent = fmtTime(restante);
      fill.style.width  = "100%";

      btn.onclick = () => {
        if (rodando) {
          rodando = false;
          btn.textContent = "▶️ Retomar";
          clearInterval(intv);
          return;
        }

        rodando = true;
        btn.textContent = "⏸️ Pausar";

        if (restante <= 0) restante = total;

        clearInterval(intv);
        intv = setInterval(() => {

          if (!rodando) return;

          restante--;
          if (restante < 0) restante = 0;

          label.textContent = fmtTime(restante);
          fill.style.width  = `${(restante / total) * 100}%`;

          if (restante <= 0) {
            clearInterval(intv);
            rodando = false;
            btn.textContent = "✔️ Finalizado";
          }

        }, 1000);
      };
    });
  }
   
function initCardioZonaInfo() {
  const closeModal = () => {
    const modal = document.querySelector(".ff-zona-modal");
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.classList.remove("ff-zona-modal-open");
    cardioZonaModalState.open = false;
  };

  const openModal = () => {
    let modal = document.querySelector(".ff-zona-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "ff-zona-modal";
      modal.innerHTML = `
        <div class="ff-zona-modal-backdrop" data-zona-close="true"></div>
        <div class="ff-zona-modal-dialog" role="dialog" aria-modal="true" aria-label="${t("treino.cardio.zonas.titulo")}">
          <button class="ff-zona-modal-close" type="button" data-zona-close="true" aria-label="${t("treino.cardio.zonas.fechar")}">✕</button>
          <h3>${t("treino.cardio.zonas.titulo")}</h3>
          <p>${t("treino.cardio.zonas.sub")}</p>
          <ul>
            <li><b>${t("treino.cardio.zonas.z1Titulo")}</b><br>${t("treino.cardio.zonas.z1Texto")}</li>
            <li><b>${t("treino.cardio.zonas.z2Titulo")}</b><br>${t("treino.cardio.zonas.z2Texto")}</li>
            <li><b>${t("treino.cardio.zonas.z3Titulo")}</b><br>${t("treino.cardio.zonas.z3Texto")}</li>
            <li><b>${t("treino.cardio.zonas.z4Titulo")}</b><br>${t("treino.cardio.zonas.z4Texto")}</li>
            <li><b>${t("treino.cardio.zonas.z5Titulo")}</b><br>${t("treino.cardio.zonas.z5Texto")}</li>
          </ul>
        </div>
      `;
      modal.addEventListener("click", (ev) => {
        if (ev.target.closest("[data-zona-close='true']")) {
          closeModal();
        }
      });
      document.body.appendChild(modal);
    }

    modal.classList.add("is-open");
    document.body.classList.add("ff-zona-modal-open");
    cardioZonaModalState.open = true;
  };

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && cardioZonaModalState.open) {
      closeModal();
    }
  });

  document.querySelectorAll("[data-zona-info='true']").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", openModal);
  });
}


function initClusterTimers() {
  const nodes = document.querySelectorAll("[data-cluster='true']");
  console.log("🟣 initClusterTimers() nodes:", nodes.length);

  nodes.forEach((wrap, idx) => {
    const btn      = wrap.querySelector("[data-cluster-start]");
    const timerBox = wrap.querySelector(".ff-cluster-timer");
    const countEl  = wrap.querySelector(".ff-cluster-count");
    const fill     = wrap.querySelector(".ff-cluster-fill");

    if (!btn || !timerBox || !countEl || !fill) {
      console.warn("⚠️ Cluster wrap incompleto:", { idx });
      return;
    }

    // evita múltiplos binds
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";

    let tempo = 10;
    let rodando = false;
    let intv = null;

    btn.addEventListener("click", () => {

      if (rodando) return;

      rodando = true;
      btn.textContent = "⏸️ Rodando…";
      timerBox.classList.remove("hidden");

      tempo = 10;
      countEl.textContent = tempo;
      fill.style.width = "100%";

      clearInterval(intv);
      intv = setInterval(() => {
        tempo--;
        if (tempo < 0) tempo = 0;

        countEl.textContent = tempo;
        fill.style.width = `${(tempo / 10) * 100}%`;

        if (tempo <= 0) {
          clearInterval(intv);
          rodando = false;
          btn.textContent = "▶️ Próximo bloco";
          timerBox.classList.add("hidden");
        }
      }, 1000);
    });
  });
}

function initRestPause() {

  document.querySelectorAll("[data-rp='true']").forEach(rpWrap => {

    const btn  = rpWrap.querySelector(".ff-restpause-btn");
    const fill = rpWrap.querySelector(".ff-rp-fill");

    if (!btn || !fill) return;

    let rodando = false;
    let intv = null;
    const pausa = 20;

    btn.addEventListener("click", () => {
      if (rodando) return;

      rodando = true;
      btn.textContent = "⏸️ Pausando…";
      fill.style.width = "100%";

      let restante = pausa;

      clearInterval(intv);
      intv = setInterval(() => {
        restante--;
        fill.style.width = `${(restante / pausa) * 100}%`;

        if (restante <= 0) {
          clearInterval(intv);
          rodando = false;

          btn.textContent = "✔️ RP concluído";

          const exItem = rpWrap.closest(".ff-ex-item");
          if (exItem) {
            exItem.dataset.rpDone = "true";
          }

          // 🔥 DISPARA EVENTO PARA O CONTADOR DE SÉRIES
         rpWrap.dispatchEvent(
  new CustomEvent("rp:concluido", { bubbles: true })
);

        }
      }, 1000);
    });
  });
}



function initSeriesProgress() {

  document.querySelectorAll(".ff-ex-item").forEach(exItem => {

    const progressEl = exItem.querySelector("[data-role='serie-progress']");
    const btnSerie   = exItem.querySelector("[data-role='serie-next']");
    const rpWrap     = exItem.querySelector("[data-rp='true']");

    if (!progressEl || !btnSerie) return;

    let atual = Number(progressEl.dataset.serieAtual || 1);
    const total = Number(progressEl.dataset.serieTotal || 1);

    const exigeRP = !!rpWrap;
    let rpConcluido = false;

    /* ===============================
       EVENTO → RP CONCLUÍDO
    =============================== */
    if (rpWrap) {
      rpWrap.addEventListener("rp:concluido", () => {
        rpConcluido = true;
        exItem.dataset.rpDone = "true";

        btnSerie.disabled = false;
        btnSerie.textContent = "✔️ Finalizar exercício";
      }, { once: true });
    }

    const updateSerieProgress = (serieAtual) => {
      progressEl.dataset.serieAtual = serieAtual;
      progressEl.innerHTML = `Série <b>${serieAtual}</b> / ${total}`;

      if (serieAtual === total) {
        btnSerie.classList.add("done");
      }
    };

    /* ===============================
       CLICK → CONCLUIR SÉRIE
    =============================== */
    btnSerie.addEventListener("click", () => {

      /* 🔹 AVANÇA A CONTAGEM ATÉ A ÚLTIMA SÉRIE */
      if (atual < total) {
        atual++;
        updateSerieProgress(atual);

        /* 🔥 ENTROU NA ÚLTIMA SÉRIE → MOSTRA RP */
        if (atual === total && exigeRP && !rpConcluido) {
          rpWrap.classList.remove("hidden");

          btnSerie.textContent = "⚡ Executar Rest-Pause";
          btnSerie.disabled = true;
        }

        scheduleTreinoSnapshot();
        return;
      }

      /* ✅ FINALIZA EXERCÍCIO */
      if (atual === total && (!exigeRP || rpConcluido)) {
        btnSerie.textContent = "✔️ Exercício concluído";
        btnSerie.classList.add("done");
        btnSerie.disabled = true;

        exItem.classList.add("ff-ex-done");
        scheduleTreinoSnapshot();
      }

    });

  });
}

  /* ============================================================
     4. HIIT — versão compatível com engine v4.0
  ============================================================ */
  function initHIIT() {
    if (window.FEMFLOW.desativarHIIT) return;

    document.querySelectorAll(".hiit-circle").forEach(circle => {
      const est = Number(circle.dataset.estimulo) || 40;
      const rec = Number(circle.dataset.descanso) || 20;
      const ciclosMax = Number(circle.dataset.ciclos) || 6;

      let tempo = est;
      let modo = "forte";
      let ciclo = 1;
      let rodando = false;
      let intv = null;

      const card = circle.closest(".carousel-item");
      const phase = card?.querySelector(".hiit-phase");

      circle.textContent = "▶";
      if (!phase) return;
         phase.textContent = "Toque para iniciar";


     function atualizar() {
  if (!phase) return;
  if (modo === "forte") phase.textContent = `Força (${ciclo}/${ciclosMax})`;
  else phase.textContent = `Recuperar (${ciclo}/${ciclosMax})`;
}


      function iniciar() {
        rodando = true;
        circle.classList.remove("paused");

        atualizar();
        circle.textContent = tempo;

        clearInterval(intv);
        intv = setInterval(() => {
          tempo--;
          circle.textContent = tempo;

          if (tempo <= 0) {
            if (modo === "forte") {
              modo = "leve";
              tempo = rec;
              atualizar();
              return;
            }

            ciclo++;

            if (ciclo > ciclosMax) {
              clearInterval(intv);
              circle.textContent = "✔";
              phase.textContent = "HIIT concluído";
              rodando = false;
              return;
            }

            modo = "forte";
            tempo = est;
            atualizar();
          }
        }, 1000);
      }

      circle.onclick = () => {
        if (!rodando) iniciar();
        else {
          rodando = false;
          clearInterval(intv);
          circle.classList.add("paused");
          phase.textContent = "Pausado — toque para retomar";
        }
      };
    });
  }

  

  /* ============================================================
     6. SALVAR PESO AUTOMATICAMENTE
============================================================ */
function initPeso() {
  document.querySelectorAll(".ff-ex-peso").forEach(inp => {

    inp.addEventListener("change", async () => {

      const exercicio = inp.dataset.ex;  // Nome oficial do exercício
      const peso      = inp.value.trim();
      scheduleTreinoSnapshot();

      const card = inp.closest(".ff-ex-item");

      // Capturar séries e reps reais do card (correto)
      const reps   = card.querySelector(".ff-info-line span:nth-child(2) b")?.textContent || "";
      const series = card.querySelector(".ff-info-line span:nth-child(1) b")?.textContent || "";

      // DiaPrograma já carregado no início do treino.js
      const diaPrograma = FEMFLOW.diaProgramaAtual || 1;

      if (!id) {
        console.warn("⚠️ Sem ID no localStorage para salvar evolução");
        return;
      }
      const diaCiclo = Number(localStorage.getItem("femflow_diaCiclo") || 1);
const treino = getTreinoKey({ diaCiclo });




 
      try {
        const resp = await FEMFLOW.post({
  action: "salvarevolucao",
  id,
  treino,
  exercicio,
  peso,
  reps,
  series,
  pse: 0,
  diaPrograma
});


       console.log("📈 EVOLUÇÃO AUTOMÁTICA:", resp);


        FEMFLOW.toast("Peso registrado!");

      } catch (err) {
        console.error("❌ Erro ao salvar evolução automática:", err);
        FEMFLOW.toast("Erro ao salvar evolução", "error");
      }

    }); // fim do change listener

  }); // fim do forEach
}

async function initPesoPrefill() {
  if (!id) return;

  const inputs = Array.from(document.querySelectorAll(".ff-ex-peso"));

  await Promise.all(inputs.map(async inp => {
    if (inp.value) return;

    const exercicio = inp.dataset.ex;
    if (!exercicio) return;

    const peso = await getUltimoPeso(id, exercicio);
    if (peso === "" || peso === null || peso === undefined) return;

    inp.value = peso;
  }));
}

/* ============================================================
   7. SALVAR TREINO — VERSÃO FINAL CORRETA
============================================================ */
if (btnSalvar) {
  btnSalvar.onclick = () => modalPSE.classList.remove("hidden");
}

if (btnCancelarPSE) {
  btnCancelarPSE.onclick = () => modalPSE.classList.add("hidden");
}

if (btnConfirmarPSE) {
  btnConfirmarPSE.onclick = async () => {

    const fase        = localStorage.getItem("femflow_fase");
    const diaCiclo    = Number(localStorage.getItem("femflow_diaCiclo") || 1);
    const diaPrograma = Number(localStorage.getItem("femflow_diaPrograma") || 1);
    const pse         = Number(pseInput.value || 0);
    const tipoTreino  = resolveTipoTreino();

    if (!id) {
      FEMFLOW.toast("Erro: sessão inválida.", true);
      return;
    }

    try {
	const treino = getTreinoKey({ diaCiclo });

        const resp = await FEMFLOW.post({
      action: "salvartreino",
id,
diaPrograma,
diaCiclo,
pse,
treino,
tipoTreino,

        deviceId: FEMFLOW.getDeviceId(),
        sessionToken: FEMFLOW.getSessionToken()
      });

      FEMFLOW.log("📌 salvarTreino:", resp);

      if (resp?.status === "ok") {

        if (enduranceAtivo) {
          localStorage.setItem("femflow_endurance_pending", "false");
          const semana = localStorage.getItem("femflow_endurance_semana") || "";
          const dia = localStorage.getItem("femflow_endurance_dia") || "";
          let modalidade = "";
          let treinosSemana = "";
          let diasSemana = "";
          let ritmo = "";
          try {
            const config = JSON.parse(localStorage.getItem("femflow_endurance_config") || "{}");
            modalidade = config.modalidade || "";
            treinosSemana = config.treinosSemana || "";
            diasSemana = Array.isArray(config.diasSemana) ? config.diasSemana.join(", ") : "";
            ritmo = config.ritmo || "";
          } catch (err) {
            console.warn("Config Endurance inválida:", err);
          }

          await FEMFLOW.post({
            action: "endurance_treino",
            id,
            nome: localStorage.getItem("femflow_nome") || "",
            nivel: localStorage.getItem("femflow_nivel") || "",
            modalidade,
            treinosSemana,
            diasSemana,
            ritmo,
            semana,
            dia,
            dataTreino: new Date().toISOString()
          });
        }

        // 🔥 BACKEND É A FONTE DA VERDADE
        if (resp.diaPrograma) {
          localStorage.setItem("femflow_diaPrograma", String(resp.diaPrograma));
        }

        if (resp.novaFase) {
          localStorage.setItem("femflow_fase", resp.novaFase);
        }

        if (resp.novoDiaCiclo) {
          localStorage.setItem("femflow_diaCiclo", String(resp.novoDiaCiclo));
        }

        const treinoDate = new Date().toISOString();
        localStorage.setItem("femflow_last_treino", treinoDate);
        if (FEMFLOW.getLocalDateKey) {
          localStorage.setItem("femflow_last_treino_day", FEMFLOW.getLocalDateKey(treinoDate));
        }
        if (resp.diaPrograma || diaPrograma) {
          localStorage.setItem("femflow_last_program_day", String(resp.diaPrograma || diaPrograma));
        }

        clearTreinoSnapshot();
        FEMFLOW.toast("Treino salvo com sucesso! 💪");
        registrarEvolucao({ pse, diaPrograma: resp.diaPrograma || diaPrograma });
        encerrarTreino();

      } else {
        FEMFLOW.toast("Erro ao salvar treino.", true);
      }

    } catch (err) {
      FEMFLOW.error("Erro salvar treino:", err);
      FEMFLOW.toast("Erro de conexão.", true);
    }

    modalPSE.classList.add("hidden");
  };
}


/* ============================================================
   🔥 PATCH EVOLUÇÃO – BUSCAR ÚLTIMO PESO
============================================================ */
async function getUltimoPeso(id, exercicio) {
  try {
   const resp = await FEMFLOW.post({
  action: "getultimopeso",
  id,
  exercicio
});
return resp?.peso || "";
  } catch (e) {
    console.warn("Erro ao buscar último peso:", e);
    return "";
  }
}

/* ============================================================
   Preencher automaticamente (modo futuro se abrir modal)
============================================================ */
async function preencherUltimoPeso(exercicioSlug) {
  const peso = await getUltimoPeso(id, exercicioSlug);
  const input = document.querySelector("#input-peso");
  if (input && peso) input.value = peso;
}

/* ============================================================
   salvarEvolucaoFront (mantido para modais custom)
============================================================ */
async function salvarEvolucaoFront(exercicioSlug) {

  const peso    = document.querySelector("#input-peso")?.value || "";
  const reps    = document.querySelector("#input-reps")?.value || "";
  const series  = document.querySelector("#input-series")?.value || "";
  const pse     = FEMFLOW.estadoPSE || 0;
  const diaProg = FEMFLOW.diaProgramaAtual || 1;

  try {
  const resp = await FEMFLOW.post({
  action: "salvarEvolucao",
  id,
  exercicio: exercicioSlug,
  peso,
  reps,
  series,
  pse,
  diaPrograma: diaProg
});


    const json = await resp.json();
    console.log("📈 Evolução salva:", json);

    FEMFLOW.toast("Evolução registrada!");

  } catch (err) {
    console.error("Erro ao salvar evolução:", err);
    FEMFLOW.toast("Erro ao salvar evolução", "error");
  }
}
 
}); // ← fecha o DOMContentLoaded

window.getSerieEspecialInfo = function (codigo) {
  if (!codigo) return null;

  const lang = FEMFLOW.lang || "pt";
  const series = FEMFLOW.langs?.[lang]?.series;

  return series?.[codigo] || null;
};
window.getHiitInfo = function ({ forte, leve, ciclos }) {
  const lang = FEMFLOW.lang || "pt";
  const hiit = FEMFLOW.langs?.[lang]?.treino?.hiit;
  if (!hiit) return null;

  return {
    protocolo: hiit.protocolo
      .replace("{forte}", forte)
      .replace("{leve}", leve),

    descricao: hiit.descricao
      .replace("{forte}", forte)
      .replace("{leve}", leve),

    ciclos: hiit.ciclos.replace("{ciclos}", ciclos),

    exemplosAcademia: hiit.exemplosAcademia,
    exemplosCasa: hiit.exemplosCasa,
    iniciar: hiit.iniciar
  };
};
window.getTreinoText = function (path, fallback = "") {
  const lang = FEMFLOW.lang || "pt";
  const parts = String(path || "").split(".");
  let cur = FEMFLOW.langs?.[lang];

  for (const p of parts) {
    cur = cur?.[p];
    if (cur == null) return fallback;
  }
  return cur ?? fallback;
};

window.getAquecimentoUI = function () {
  return {
    sugestao: getTreinoText("treino.aquecimento.sugestao",
      "💨 Sugestão: prepare seu corpo com uma respiração consciente antes de começar."
    ),
    btn: getTreinoText("treino.aquecimento.btn",
      "🌬️ Abrir protocolos de respiração"
    )
  };
};

window.getResfriamentoUI = function () {
  return {
    sugestao: getTreinoText("treino.resfriamento.sugestao",
      "🌬️ Sugestão: finalize seu treino desacelerando com respiração suave."
    ),
    btn: getTreinoText("treino.resfriamento.btn",
      "💗 Fazer respiração de fechamento"
    )
  };
};
window.t = function (path, vars = {}) {
  const lang = FEMFLOW.lang || "pt";
  const parts = path.split(".");
  
  let text = FEMFLOW.langs?.[lang];
  for (const p of parts) {
    text = text?.[p];
  }

  if (typeof text !== "string") return path;

  return text
    // 🔁 suporta {variavel}
    .replace(/\{(\w+)\}/g, (_, key) => {
      return vars[key] !== undefined ? vars[key] : `{${key}}`;
    })
    // 🔁 suporta {{variavel}} (legado)
    .replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return vars[key] !== undefined ? vars[key] : `{{${key}}}`;
    });
};


/* =========================================================
    2️⃣ BOOTSTRAP — GARANTE CONTEXTO (NOVO)
 ========================================================= */
  function buildPerfilFromStorage() {
    const id = localStorage.getItem("femflow_id") || "";
    const email = localStorage.getItem("femflow_email") || "";
    if (!id && !email) return null;

    return {
      status: "ok",
      id,
      email,
      nome: localStorage.getItem("femflow_nome") || "Aluna",
      fase: localStorage.getItem("femflow_fase") || "follicular",
      diaCiclo: Number(localStorage.getItem("femflow_diaCiclo") || 1),
      diaPrograma: Number(localStorage.getItem("femflow_diaPrograma") || 1),
      nivel: localStorage.getItem("femflow_nivel") || "iniciante",
      produto: localStorage.getItem("femflow_produto") || "",
      ativa: localStorage.getItem("femflow_ativa") === "true",
      perfilHormonal: localStorage.getItem("femflow_perfilHormonal") || "regular",
      ciclo_duracao: Number(localStorage.getItem("femflow_cycleLength") || 28),
      data_inicio: localStorage.getItem("femflow_startDate") || "",
      enfase: localStorage.getItem("femflow_enfase") || "",
      acessos: {
        personal: localStorage.getItem("femflow_has_personal") === "true"
      }
    };
  }

  (async function bootstrapPerfilTreino() {

    // evita duplicar evento
    if (window.FEMFLOW?.perfilAtual) {
      console.log("♻️ Perfil já em memória, redispatch");
      FEMFLOW.dispatch("femflow:ready", FEMFLOW.perfilAtual);
      return;
    }

    console.log("🚀 carregando perfil para treino…");

    let perfil = await FEMFLOW.carregarPerfil();
    if (!perfil) {
      const perfilLocal = buildPerfilFromStorage();
      if (!perfilLocal) {
        FEMFLOW.toast("Sessão inválida");
        location.href = "index.html";
        return;
      }
      FEMFLOW.toast("Sem conexão agora. Usando dados salvos.");
      perfil = perfilLocal;
    }

    if (perfil.status === "blocked" || perfil.status === "denied") {
      FEMFLOW.toast("Sessão inválida");
      location.href = "index.html";
      return;
    }

    if (perfil.status && perfil.status !== "ok") {
      const perfilLocal = buildPerfilFromStorage();
      if (!perfilLocal) {
        FEMFLOW.toast("Sessão inválida");
        location.href = "index.html";
        return;
      }
      FEMFLOW.toast("Sem conexão agora. Usando dados salvos.");
      perfil = perfilLocal;
    }

    FEMFLOW.perfilAtual = perfil;

    console.log("🚀 disparando femflow:ready", perfil);
    FEMFLOW.dispatch("femflow:ready", perfil);

  })();
