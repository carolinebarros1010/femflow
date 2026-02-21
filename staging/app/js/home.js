/* ============================================================
   FemFlow • HOME.JS — VERSÃO FINAL 2025 2(CORRIGIDA)
   Home usa VALIDAR — NUNCA usa SYNC
   ✅ separa ACESSO (has_personal) de MODO (mode_personal)
=========================================================== */

/* LINKS */
const LINK_ACESSO_APP = "https://pay.hotmart.com/T103984580L?off=ifcs6h6n";
const LINK_PERSONAL   = "https://pay.hotmart.com/T103984580L?off=sybtfokt";
const EBOOKS_DATA_URL = "ebooks/ebooks.json";

/* FOLLOWME */
const FOLLOWME_LINKS = {
  livia: "#",
  karoline: "#"
};

const TREINOS_SEMANA_KEY = "femflow_treinos_semana";
const TREINOS_SEMANA_PADRAO = 3;
let treinosSemanaResolve = null;
let treinosSemanaSelecionado = null;

function isStagingRuntime() {
  const env = String(window.FEMFLOW_ENV || "").toLowerCase();
  return env === "staging" || location.pathname.includes("/staging/");
}

function ffHeroInit() {
  const lang = FEMFLOW.lang || "pt";

  // nome
  const nome = (localStorage.getItem("femflow_nome") || "Aluna").trim();
  const primeiroNome = nome.split(/\s+/)[0] || "Aluna";

  const elHello = document.getElementById("ffHeroHello");
  const elName = document.getElementById("ffHeroName");
  if (elHello) elHello.textContent = (lang === "en") ? "Welcome," : (lang === "fr" ? "Bienvenue," : "Bem-vinda,");
  if (elName) elName.textContent = primeiroNome + "!";

  // vídeo por idioma (GitHub/jsDelivr)
  const base = "https://cdn.jsdelivr.net/gh/carolinebarros1010/femflow@main/app/assets/";
  const videos = { pt: "heropt.mp4", en: "heroen.mp4", fr: "herofr.mp4" };

  const video = document.getElementById("ffHeroVideo");
  const source = document.getElementById("ffHeroSource");

  if (video && source) {
    const next = base + (videos[lang] || videos.pt);
    if (video.dataset.heroSrc !== next) {
      source.src = next;
      video.dataset.heroSrc = next;
      video.load();
    }
    video.play().catch(() => {});
  }

  // CTA
  const btn = document.getElementById("ffHeroCTA");
  if (btn && !btn.dataset.bound) {
    btn.dataset.bound = "1";
    btn.onclick = () => FEMFLOW.router("flowcenter");
  }

  // pausa ao rolar (1x)
  const hero = document.querySelector(".ff-hero");
  if (hero && video && !hero.dataset.observed && "IntersectionObserver" in window) {
    hero.dataset.observed = "1";
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    }, { threshold: 0.2 });
    obs.observe(hero);
  }
}


function atualizarModalTreinosSemana() {
  const modal = document.getElementById("treinosSemanaModal");
  if (!modal) return;

  const lang = FEMFLOW.lang || "pt";
  const L = FEMFLOW.langs?.[lang]?.home?.treinosSemana;
  const titulo = document.getElementById("treinosSemanaTitulo");
  const subtitulo = document.getElementById("treinosSemanaSub");
  const options = document.getElementById("treinosSemanaOptions");
  const btnSalvar = document.getElementById("treinosSemanaSalvar");
  const btnCancelar = document.getElementById("treinosSemanaCancelar");

  if (titulo && L?.titulo) titulo.textContent = L.titulo;
  if (subtitulo && L?.subtitulo) subtitulo.textContent = L.subtitulo;
  if (btnSalvar && L?.salvar) btnSalvar.textContent = L.salvar;
  if (btnCancelar && L?.cancelar) btnCancelar.textContent = L.cancelar;

  if (!options) return;
  options.innerHTML = "";
  const current = treinosSemanaSelecionado ?? TREINOS_SEMANA_PADRAO;
  for (let i = 1; i <= 7; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ff-modal-option";
    if (i === current) btn.classList.add("is-active");
    const label = L?.opcao ? L.opcao.replace("{n}", i) : `${i}x/semana`;
    btn.textContent = label;
    btn.dataset.valor = String(i);
    btn.addEventListener("click", () => {
      treinosSemanaSelecionado = i;
      options.querySelectorAll(".ff-modal-option").forEach((el) =>
        el.classList.toggle("is-active", el.dataset.valor === String(i))
      );
    });
    options.appendChild(btn);
  }
}

function abrirModalTreinosSemana() {
  const modal = document.getElementById("treinosSemanaModal");
  if (!modal) return Promise.resolve(false);
  treinosSemanaSelecionado = treinosSemanaSelecionado ?? TREINOS_SEMANA_PADRAO;
  atualizarModalTreinosSemana();
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    treinosSemanaResolve = resolve;
  });
}

function fecharModalTreinosSemana() {
  const modal = document.getElementById("treinosSemanaModal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

async function salvarTreinosSemana(valor) {
  localStorage.setItem(TREINOS_SEMANA_KEY, String(valor));
  const id = localStorage.getItem("femflow_id");
  if (!id) return;

  await fetch(FEMFLOW.SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "settreinossemana",
      id,
      treinosSemana: valor
    })
  });
}

async function garantirTreinosSemana() {
  const valorRaw = localStorage.getItem(TREINOS_SEMANA_KEY);
  const valor = Number(valorRaw);
  if (Number.isFinite(valor) && valor >= 1 && valor <= 7) return true;
  if (valorRaw != null) {
    localStorage.removeItem(TREINOS_SEMANA_KEY);
  }
  treinosSemanaSelecionado = null;

  const aprovado = await abrirModalTreinosSemana();
  return aprovado === true;
}

/* ============================================================
   🔄 PERFIL: puxar do backend e persistir no localStorage
============================================================ */
async function carregarPerfilEAtualizarStorage() {
  const id = localStorage.getItem("femflow_id") || "";
  const email = localStorage.getItem("femflow_email") || "";

  // sem identificador -> volta pro login
  if (!id && !email) return { status: "no_auth" };

  // ✅ chama VALIDAR (fonte da verdade)
  const qs = new URLSearchParams({ action: "validar" });
  if (id) qs.set("id", id);
  else qs.set("email", email);

  const url = `${FEMFLOW.SCRIPT_URL}?${qs.toString()}`;
  const perfil = await fetch(url).then(r => r.json()).catch(() => ({ status: "error" }));

  return perfil;
}

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

function persistPerfil(perfil) {
  const idAtual = String(perfil.id || "");
  const idAnterior = localStorage.getItem("femflow_id") || "";
  if (idAnterior && idAtual && idAnterior !== idAtual) {
    localStorage.removeItem(TREINOS_SEMANA_KEY);
    treinosSemanaSelecionado = null;
  }
  // essenciais
  localStorage.setItem("femflow_id", idAtual);
  localStorage.setItem("femflow_nome", perfil.nome || "");
  localStorage.setItem("femflow_email", perfil.email || "");
  localStorage.setItem("femflow_nivel", String(perfil.nivel || "iniciante").toLowerCase());
  const produto = String(perfil.produto || "").toLowerCase();
  const isVip = produto === "vip";
  localStorage.setItem("femflow_produto", produto);
  localStorage.setItem("femflow_ativa", String(isVip || !!perfil.ativa));
  FEMFLOW.renderVipBadge?.();

  // ✅ acesso personal = direito (backend), separado do modo personal (front)
  const acessos = perfil.acessos || {};
  const personalRaw =
    acessos.personal ??
    perfil.personal ??
    perfil.Personal ??
    perfil.has_personal ??
    perfil.hasPersonal;
  const hasPersonal = parseBooleanish(personalRaw) || isVip;
  localStorage.setItem("femflow_has_personal", String(hasPersonal));
  localStorage.removeItem("femflow_personal"); // legado: nunca usar mais

  const freeAccess = normalizarFreeAccess(perfil);
  localStorage.setItem(
    "femflow_free_access",
    freeAccess ? JSON.stringify(freeAccess) : ""
  );

  // ciclo + programa (CRÍTICO)
  localStorage.setItem("femflow_perfilHormonal", String(perfil.perfilHormonal || "regular").toLowerCase());
  localStorage.setItem("femflow_cycleLength", String(perfil.ciclo_duracao || 28));
  localStorage.setItem("femflow_fase", String(perfil.fase || "follicular").toLowerCase());
  localStorage.setItem("femflow_diaCiclo", String(perfil.diaCiclo || 1));
  localStorage.setItem("femflow_diaPrograma", String(perfil.diaPrograma || 1));
  localStorage.setItem("femflow_dataInicioPrograma", perfil.dataInicioPrograma ? String(perfil.dataInicioPrograma) : "");

  localStorage.setItem(
    "femflow_enfase",
    String(perfil.enfase || "nenhuma").toLowerCase()
  );

  // ✅ segurança: se não tiver personal, não deixa modo personal ficar travado
    if (!hasPersonal) {
    localStorage.setItem("femflow_mode_personal", "false");
  } else {
    // se ainda não existe, inicializa como false (não ativa sozinho)
    if (localStorage.getItem("femflow_mode_personal") == null) {
      localStorage.setItem("femflow_mode_personal", "false");
    }
  }
}

/* ============================================================
   CATÁLOGO DINÂMICO (FIREBASE)
=========================================================== */
const MUSCULAR_ENFASES = new Set([
  "gluteo",
  "gluteos",
  "quadril",
  "posterior",
  "quadriceps",
  "costas",
  "ombro",
  "peito",
  "peitoral",
  "braco",
  "core",
  "forcaabc",
  "militar",
   "teen_14_ao_16",
   "fullbody_40min"
]);

const CARDS_HOME_PRESETS = [
  "avancada_20minemcasa",
  "avancada_corrida_longa",
  "avancada_costas",
  "avancada_forcaabc",
  "avancada_gluteos",
  "avancada_ombro",
  "avancada_peitoral",
  "avancada_casa_core_gluteo",
  "avancada_casa_melhor_idade",
  "avancada_militar",
  "avancada_quadriceps",
  "avancada_remo_oceanico",
  "avancada_beach_tennis",
  "avancada_jiu_jitsu",
  "avancada_natacao",
  "avancada_surf",
  "avancada_muay_thai",
  "avancada_fullbody_40min",
  "avancada_teen_14_ao_16",
  "avancada_voleibol_quadra",
  "avancada_corrida_curta",
  "avancada_hyrox",
  "avancada_casa_queima_gordura",
  "avancada_casa_fullbody_praia",
  "iniciante_20minemcasa",
  "iniciante_corrida_longa",
  "iniciante_casa_core_gluteo",
  "iniciante_casa_melhor_idade",
  "iniciante_costas",
  "iniciante_forcaabc",
  "iniciante_gluteos",
  "iniciante_militar",
  "iniciante_ombro",
  "iniciante_peitoral",
  "iniciante_quadriceps",
  "iniciante_remo_oceanico",
  "iniciante_beach_tennis",
  "iniciante_jiu_jitsu",
  "iniciante_natacao",
  "iniciante_surf",
  "iniciante_muay_thai",
  "iniciante_fullbody_40min",
  "iniciante_teen_14_ao_16",
  "iniciante_voleibol_quadra",
  "iniciante_corrida_curta",
  "iniciante_hyrox",
  "iniciante_casa_queima_gordura",
  "iniciante_casa_fullbody_praia",
  "intermediaria_20minemcasa",
  "intermediaria_corrida_longa",
  "intermediaria_costas",
  "intermediaria_casa_core_gluteo",
  "intermediaria_casa_melhor_idade",
  "intermediaria_forcaabc",
  "intermediaria_gluteos",
  "intermediaria_militar",
  "intermediaria_ombro",
  "intermediaria_peitoral",
  "intermediaria_quadriceps",
  "intermediaria_remo_oceanico",
  "intermediaria_beach_tennis",
  "intermediaria_jiu_jitsu",
  "intermediaria_natacao",
  "intermediaria_surf",
  "intermediaria_muay_thai",
  "intermediaria_fullbody_40min",
  "intermediaria_teen_14_ao_16",
  "intermediaria_voleibol_quadra",
  "intermediaria_corrida_curta",
  "intermediaria_hyrox",
  "intermediaria_casa_queima_gordura",
  "intermediaria_casa_fullbody_praia"
];

function extrairNivelEnfase(docId) {
  if (!docId) return null;
  const partes = String(docId)
    .split("_")
    .map(parte => parte.toLowerCase().trim())
    .filter(Boolean);
  if (partes.length < 2) return null;
  const nivelIndex = partes.findIndex(
    parte =>
      parte.startsWith("inic") ||
      parte.startsWith("inter") ||
      parte.startsWith("avan")
  );
  if (nivelIndex < 0) return null;
  const nivel = normalizarNivel(partes[nivelIndex]);
  const enfase = normalizarEnfase(partes
    .filter((_, index) => index !== nivelIndex)
    .join("_"));
  if (!nivel || !enfase) return null;
  return { nivel, enfase };
}

function normalizarNivel(raw) {
  const n = (raw || "").toLowerCase().trim();
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediaria";
  if (n.startsWith("avan")) return "avancada";
  return "iniciante";
}

function normalizarEnfase(raw) {
  const normalizada = String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (/^20_min_em_casa$/.test(normalizada)) return "20minemcasa";
  if (/^full_body_40(_min)?$/.test(normalizada)) return "fullbody_40min";
  if (/^fullbody_40(_min)?$/.test(normalizada)) return "fullbody_40min";
  if (/^teen_14_a_16$/.test(normalizada)) return "teen_14_ao_16";

  return normalizada;
}

function inferirCategoria(enfase) {
  if (!enfase) return "esportes";
  if (enfase.startsWith("followme_")) return "followme";
 if (enfase === "personal") return "personal";
  if (enfase.startsWith("casa") || enfase === "20minemcasa") return "casa";
  if (MUSCULAR_ENFASES.has(enfase)) return "muscular";
  return "esportes";
}

function podeAcessar(enfase, perfil) {
  if (!enfase) return false;

  const categoria = inferirCategoria(enfase);
  const produto = (perfil.produto || "").toLowerCase();
  const isTrial = produto === "trial_app";
  const isVip = produto === "vip";
  const ativa = !!perfil.ativa;
 const personal = localStorage.getItem("femflow_has_personal") === "true";


  if (!ativa && !isVip) return false;

  if (isVip) return true;

  // 🔥 PERSONAL (direito) = acesso_app + personal
  if (personal) {
    if (categoria === "followme") return false;
    return true; // muscular, esportes, casa e personal
  }

  // 🔹 ACESSO APP
  if (produto === "acesso_app" || isTrial) {
    return ["muscular", "esportes", "casa"].includes(categoria);
  }

  // 🔹 FOLLOWME
  if (produto.startsWith("followme_")) {
    return enfase === produto;
  }

  return false;
}

function formatarTitulo(enfase) {
  if (!enfase) return "Treino";
  const lang = FEMFLOW.lang || "pt";
  const tituloLang = FEMFLOW.langs?.[lang]?.home?.cards?.[enfase];
  if (tituloLang) return tituloLang;

  const limpo = enfase
    .replace(/^followme_/, "")
    .replace(/^personal_?/, "personal ")
    .replace(/_/g, " ")
    .trim();

  return limpo
    .split(" ")
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function normalizarCardFirebase(enfase, data) {
  const titulo = data?.titulo || data?.title || formatarTitulo(enfase);
  const desc = data?.desc || data?.descricao || "";
  const color = data?.color || data?.cor || "#d1a697";

  return {
    titulo,
    desc,
    enfase,
    color
  };
}

function avaliarAcessoCard(enfase, perfil) {
  const podeAcessarProduto = podeAcessar(enfase, perfil);

  const freeAccessEnfases = (perfil.free_access?.enfases || []).map(item =>
    String(item || "").toLowerCase()
  );

  const podeAcessarFree =
    perfil.free_access?.enabled === true &&
    freeAccessEnfases.includes(enfase);

  return {
    locked: !(podeAcessarProduto || podeAcessarFree),
    isFree: !podeAcessarProduto && podeAcessarFree
  };
}

function injetarCardsPresets(catalogo, perfil, nivelAluno) {
  CARDS_HOME_PRESETS.forEach(docId => {
    const parsed = extrairNivelEnfase(docId);
    if (!parsed) return;

    const { nivel, enfase } = parsed;
    if (nivel !== nivelAluno) return;

    const categoria = inferirCategoria(enfase);
    if (!catalogo[categoria]) return;

    const jaExiste = catalogo[categoria].some(card => card.enfase === enfase);
    if (jaExiste) return;

    const card = normalizarCardFirebase(enfase, { titulo: formatarTitulo(enfase) });
    const acesso = avaliarAcessoCard(enfase, perfil);
    card.locked = acesso.locked;
    if (acesso.isFree) card.isFree = true;
    catalogo[categoria].push(card);
  });
}

async function carregarCatalogoFirebase() {
  const nivelAluno = normalizarNivel(localStorage.getItem("femflow_nivel"));

  let freeAccess = null;
  const freeAccessRaw = localStorage.getItem("femflow_free_access");
  if (freeAccessRaw) {
    try { freeAccess = JSON.parse(freeAccessRaw); }
    catch (err) { freeAccess = null; }
  }

  const perfil = {
    produto: localStorage.getItem("femflow_produto"),
    ativa: localStorage.getItem("femflow_ativa") === "true",
    personal: localStorage.getItem("femflow_has_personal") === "true",
    free_access: freeAccess
  };

  const catalogo = {
    followme: [],
    personal: [],
    muscular: [],
    esportes: [],
    casa: []
  };

  const hasFirebaseFirestore =
    typeof firebase !== "undefined" &&
    typeof firebase.firestore === "function" &&
    Array.isArray(firebase.apps) &&
    firebase.apps.length > 0;

  if (!hasFirebaseFirestore) {
    console.warn("[HOME] Firebase indisponível, carregando home sem catálogo remoto.");
    return catalogo;
  }

  const snap = await firebase.firestore().collection("exercicios").get();
  snap.forEach(doc => {
    const data = doc.data();
    let parsed = extrairNivelEnfase(doc.id);
    if (
      parsed &&
      !["iniciante", "intermediaria", "avancada"].includes(parsed.nivel)
    ) {
      parsed = { nivel: nivelAluno, enfase: doc.id.toLowerCase().trim() };
    }
    if (!parsed && doc.id === "20minemcasa") {
      parsed = { nivel: nivelAluno, enfase: "20minemcasa" };
    }
    if (!parsed && data?.enfase) {
      parsed = {
        nivel: nivelAluno,
        enfase: normalizarEnfase(data.enfase)
      };
    }
    if (!parsed) return;

    const { nivel, enfase } = parsed;
    const categoria = inferirCategoria(enfase);

    const nivelOk = nivel === nivelAluno;

    // followme e personal entram independente do nível do docId
    const incluir =
      categoria === "followme" ||
      categoria === "personal" ||
      nivelOk;

    if (!incluir) return;

    const card = normalizarCardFirebase(enfase, data);

    const acesso = avaliarAcessoCard(enfase, perfil);
    card.locked = acesso.locked;
    if (acesso.isFree) card.isFree = true;

    catalogo[categoria].push(card);
  });

  injetarCardsPresets(catalogo, perfil, nivelAluno);

  return catalogo;
}

/* ============================================================
   🧩 CARDS SIMBÓLICOS (VITRINE COMERCIAL)
=========================================================== */

const CARDS_PERSONAL_SIMBOLICOS = [
  {
    enfase: "personal",
    titulo: "Treino Personalizado",
    desc: "Treino feito exclusivamente para você",
    color: "#335953",
    locked: true,
    simbolico: true
  }
];

const CARDS_FOLLOWME_SIMBOLICOS = [
  {
    enfase: "followme_livia_rapaci",
    titulo: "Treine com Lívia Rapaci",
    desc: "Programa completo de 30 dias com a coach",
    color: "#f3c1c1",
    locked: true,
    simbolico: true
  },
  {
    enfase: "followme_karoline",
    titulo: "Treine com Karoline Bombeira",
    desc: "Rotina intensa e funcional",
    color: "#ff9f7f",
    locked: true,
    simbolico: true
  }
];

const CARD_THUMBS = {
  gluteo: "gluteos.jpg",
  gluteos: "gluteos.jpg",
  casa_core_gluteo: "casa_core_gluteo.jpg",
  casa_melhor_idade: "casa_melhor_idade.jpg",
  casa_mobilidade: "casa_mobilidade.jpg",
  casa_queima_gordura: "casa_queima_gordura.jpg",
  casa_fullbody_praia: "casa_fullbody_praia.jpg",
  "20minemcasa": "20minemcasa.jpg",
  corrida_longa: "corrida_Longa.jpg",
  quadriceps: "quadriceps.jpg",
  costas: "costas.jpg",
  forcaabc: "forcaabc.jpg",
  ombro: "ombro.jpg",
  peito: "peitoral.jpg",
  peitoral: "peitoral.jpg",
  militar: "militar.jpg",
  remo_oceanico: "remo_oceanico.jpg",
  beach_tennis: "beach_tennis_hybrid.jpg",
  jiu_jitsu: "jiu_jitsu.jpg",
  natacao: "natacao.jpg",
  surf: "surf.jpg",
  muay_thai: "muay_thai.jpg",
  fullbody_40min: "fullbody_40min.jpg",
  teen_14_ao_16: "teen_14_ao_16.jpg",
  voleibol_quadra: "voleibol_quadra.jpg",
  hyrox: "hyrox.jpg",
  personal: "personal_ricardojr.jpg",
  personal_ricardojr: "personal_ricardojr.jpg",
  corrida_curta: "corrida_curta.jpg",
  planilha_corrida_5k: "corrida_5k.jpg",
  planilha_corrida_10k: "corrida_10k.jpg",
  planilha_corrida_15k: "corrida_15k.jpg",
  corrida_5k: "corrida_5k.jpg",
  corrida_10k: "corrida_10k.jpg",
  corrida_15k: "corrida_15k.jpg"
};

function getThumbUrl(enfase) {
  const file = CARD_THUMBS[enfase];
  if (!file) return "";
  return new URL(`/app/css/cards/${file}`, window.location.origin).toString();
}

/* ============================================================
   EBOOKS — CARDS NETFLIX
=========================================================== */
const EBOOKS_FALLBACK_COLOR = "#fceae3";

function resolveEbookUrl(path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  if (!cleanPath) return "";
  return new URL(`/app/ebooks/${cleanPath}`, window.location.origin).toString();
}

function resolveEbookLink(link) {
  if (!link) return "";
  if (String(link).startsWith("http")) return link;
  return resolveEbookUrl(link);
}

function formatarPrecoEbook(preco, tipo) {
  if (tipo === "download" || preco === "0,00") return "Gratuito";
  if (!preco) return "";
  return `R$ ${preco}`;
}

function ebookCardHTML(ebook) {
  const titulo = ebook.nome || "eBook";
  const preco = formatarPrecoEbook(ebook.preco, ebook.tipo);
  const acao = ebook.tipo === "download" ? "Baixar" : "Comprar";
  const gratuito = ebook.tipo === "download" || ebook.preco === "0,00";
  const badgeGratuito = gratuito ? '<span class="badge-free">Gratuito</span>' : "";
  const desc = [preco, acao].filter(Boolean).join(" • ");
  const capa = ebook.capa ? resolveEbookUrl(ebook.capa) : "";
  const thumbStyle = `${capa ? `--thumb-url:url('${capa}');` : ""}background-color:${EBOOKS_FALLBACK_COLOR};`;
  const destino = resolveEbookLink(ebook.link);

  return `
    <article class="card" data-destino="${destino}">
      <div class="thumb${capa ? " has-image" : ""}" style="${thumbStyle}">
        ${badgeGratuito}
      </div>
      <div class="info">
        <h3 class="ttl">${titulo}</h3>
        <p class="desc">${desc}</p>
      </div>
    </article>`;
}

function renderEbookRail(el, lista) {
  if (!el) return;
  el.innerHTML = lista.map(ebookCardHTML).join("");
  el.querySelectorAll(".card").forEach(card => {
    card.onclick = () => {
      if (card.dataset.destino) {
        window.location.href = card.dataset.destino;
      }
    };
  });
}

async function carregarEbooks() {
  try {
    const resp = await fetch(EBOOKS_DATA_URL, { cache: "no-store" });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("Falha ao carregar ebooks:", err);
    return [];
  }
}

/* ============================================================
   RENDERIZAÇÃO DOS CARDS
=========================================================== */
function cardHTML(p) {
  const lang = FEMFLOW.lang || "pt";
  const titulo = typeof p.titulo === "object" ? p.titulo[lang] : p.titulo;
  const desc = typeof p.desc === "object" ? p.desc[lang] : p.desc;
  const lockedClass = p.locked ? " locked" : "";
  const lockOverlay = p.locked ? '<span class="lock-overlay">🔒</span>' : "";
  const freeBadge = p.isFree ? '<span class="badge-free">Gratuito</span>' : "";
  const thumbUrl = getThumbUrl(p.enfase);
  const thumbClass = `thumb thumb-${p.enfase}${thumbUrl ? " has-image" : ""}`;
  const thumbStyle = `${thumbUrl ? `--thumb-url:url('${thumbUrl}');` : ""}background-color:${p.color};`;

  return `
    <article class="card${lockedClass}" data-enfase="${p.enfase}" data-locked="${p.locked}">
      <div class="${thumbClass}" style="${thumbStyle}">
        ${lockOverlay}
        ${freeBadge}
      </div>
      <div class="info">
        <h3 class="ttl">${titulo}</h3>
        <p class="desc">${desc || ""}</p>
      </div>
    </article>`;
}

function ordenarCardsPorGratuito(lista) {
  return [...lista].sort((a, b) => (b.isFree ? 1 : 0) - (a.isFree ? 1 : 0));
}

function renderRail(el, lista) {
  if (!el) return;
  const ordenada = ordenarCardsPorGratuito(lista);
  el.innerHTML = ordenada.map(cardHTML).join("");
  el.querySelectorAll(".card").forEach(c =>
    c.onclick = () => {
      void handleCardClick(c.dataset.enfase, c.dataset.locked === "true");
    }
  );
}

function getFollowmeEmBreveMessage() {
  const lang = FEMFLOW.lang || "pt";
  const mensagem = FEMFLOW.langs?.[lang]?.home?.followmeEmBreve;
  if (mensagem) return mensagem;
  if (lang === "en") return "Coming soon...";
  if (lang === "fr") return "Bientôt...";
  return "Em breve...";
}

/* ============================================================
   MODAL — CONFIRMAÇÃO DE NOVO PROGRAMA
=========================================================== */
let novoProgramaEnfase = null;
let novoProgramaModal;
let novoProgramaConfirmar;
let novoProgramaCancelar;

function abrirModalNovoPrograma(enfase) {
  if (!novoProgramaModal) return;
  novoProgramaEnfase = enfase;
  novoProgramaModal.classList.remove("hidden");
  novoProgramaModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("ff-modal-open");
}

function fecharModalNovoPrograma() {
  if (!novoProgramaModal) return;
  novoProgramaEnfase = null;
  novoProgramaModal.classList.add("hidden");
  novoProgramaModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("ff-modal-open");
}

function confirmarNovoPrograma() {
  const enfase = novoProgramaEnfase;
  fecharModalNovoPrograma();
  if (!enfase) return;
  if (inferirCategoria(enfase) === "followme") {
    void selecionarCoach(enfase);
    return;
  }
  void selecionarEnfase(enfase);
}

/* ============================================================
   LÓGICA DE ACESSO POR PRODUTO
=========================================================== */
async function handleCardClick(enfase, locked) {

  /* =========================================
     🔒 CARD BLOQUEADO (VITRINE COMERCIAL)
  ========================================= */
  if (locked) {
    const produto = String(localStorage.getItem("femflow_produto") || "").toLowerCase();
    const isTrial = produto === "trial_app";
    const categoria = inferirCategoria(enfase);
    if (isTrial && ["muscular", "esportes", "casa"].includes(categoria)) {
      FEMFLOW.openExternal(LINK_ACESSO_APP);
      return;
    }

    // 🧠 PERSONAL — CTA dedicado (propaganda)
    if (enfase === "personal" || enfase.startsWith("personal_")) {
      FEMFLOW.toast("🔒 Treino Personal é um plano exclusivo.");
      FEMFLOW.openExternal(LINK_PERSONAL);
      return;
    }

    // ✨ FOLLOWME — programa especial
    if (enfase.startsWith("followme_")) {
      FEMFLOW.toast(getFollowmeEmBreveMessage());
      return;
    }

    // 🔹 BLOQUEIO PADRÃO
    FEMFLOW.toast("Plano necessário para acessar este treino.");
    return;
  }

  const treinosOk = await garantirTreinosSemana();
  if (!treinosOk) return;

  /* =========================================
     🧭 PERSONAL DESBLOQUEADO = ativa modo e vai pro FLOWCENTER
     (NUNCA vai direto para treino)
  ========================================= */
  if (enfase === "personal") {
    FEMFLOW.toast("🌟 Modo Personal ativado!");
    localStorage.setItem("femflow_mode_personal", "true");
    return FEMFLOW.router("flowcenter.html");
  }

  // qualquer card normal desativa o modo personal
  localStorage.setItem("femflow_mode_personal", "false");

  /* =========================================
     🌸 CICLO NÃO CONFIGURADO
  ========================================= */
  if (localStorage.getItem("femflow_cycle_configured") !== "yes") {

    FEMFLOW.loading.show("Configurando seu ciclo…");

    localStorage.setItem("femflow_enfase", enfase);

    FEMFLOW.dispatch("stateChanged", {
      type: "ciclo",
      impact: "fisiologico",
      source: "home"
    });

    return;
  }

  /* =========================================
     ✅ GARANTIA DE ESTADO MÍNIMO
  ========================================= */
  const diaProgramaRaw = localStorage.getItem("femflow_diaPrograma");
  const diaPrograma = Number(diaProgramaRaw);
  if (!diaProgramaRaw || Number.isNaN(diaPrograma) || diaPrograma < 1) {
    localStorage.setItem("femflow_diaPrograma", "1");
  }

  /* =========================================
     ✨ FOLLOWME ATIVO
  ========================================= */
  if (inferirCategoria(enfase) === "followme") {
    abrirModalNovoPrograma(enfase);
    return;
  }

  /* =========================================
     🔥 TREINO NORMAL
  ========================================= */
  abrirModalNovoPrograma(enfase);
}

/* ============================================================
   SALVAR ENFASE NORMAL
=========================================================== */
async function selecionarEnfase(enfase) {
  const id = localStorage.getItem("femflow_id");

  if (!enfase || enfase === "nenhuma" || enfase === "personal") {
    console.warn("Ênfase inválida bloqueada:", enfase);
    return;
  }

  FEMFLOW.loading.show("Preparando novo programa…");

  // 1) salvar nova ênfase
  localStorage.setItem("femflow_enfase", enfase);

  // 2) reset explícito do programa (REGRA FEMFLOW)
  localStorage.setItem("femflow_diaPrograma", "1");
  localStorage.setItem("femflow_dia_treino", "1");

  if (id) {
    // 3) backend: salvar ênfase + resetar DiaPrograma em paralelo
    const [syncEnfase, syncDiaPrograma] = await Promise.allSettled([
      FEMFLOW.post({ action: "setenfase", id, enfase }),
      FEMFLOW.reiniciarDiaPrograma()
    ]);

    if (syncEnfase.status === "rejected") {
      console.warn("⚠️ Falhou ao salvar nova ênfase:", syncEnfase.reason);
    }

    if (syncDiaPrograma.status === "rejected") {
      console.warn("⚠️ Falhou ao reiniciar DiaPrograma:", syncDiaPrograma.reason);
    }
  }

  // 5) seguir fluxo normal
  FEMFLOW.router("flowcenter");
}

/* ============================================================
   FOLLOWME
=========================================================== */
async function selecionarCoach(coach) {
  const id = localStorage.getItem("femflow_id");

  localStorage.setItem("femflow_mode_personal", "false");
  localStorage.setItem("femflow_enfase", coach);
  localStorage.setItem("femflow_dia_treino", "1");
  localStorage.setItem("femflow_diaPrograma", "1");

  if (id) {
    const [syncCoach, syncDiaPrograma] = await Promise.allSettled([
      FEMFLOW.post({ action: "setenfase", id, enfase: coach }),
      FEMFLOW.reiniciarDiaPrograma()
    ]);

    if (syncCoach.status === "rejected") {
      console.warn("⚠️ Falhou ao salvar coach:", syncCoach.reason);
    }

    if (syncDiaPrograma.status === "rejected") {
      console.warn("⚠️ Falhou ao reiniciar DiaPrograma:", syncDiaPrograma.reason);
    }
  }

  FEMFLOW.router("flowcenter");
}

/* ============================================================
   APLICAR IDIOMA NA HOME (inclui VÍDEO)
=========================================================== */
function aplicarIdiomaHome() {
  const lang = FEMFLOW.lang || "pt";
  const L = FEMFLOW.langs?.[lang]?.home;
  if (!L) return;

  // Títulos das seções
  const tPersonal = document.getElementById("tituloPersonalTopo");
  const tFollowMe = document.getElementById("tituloFollowMe");
  const tMuscular = document.getElementById("tituloMuscular");
  const tEsportes = document.getElementById("tituloEsportes");
  const tCasa = document.getElementById("tituloCasa");
  const tEbooks = document.getElementById("tituloEbooks");

  if (tPersonal) tPersonal.textContent = L.tituloPersonal;
  if (tFollowMe) tFollowMe.textContent = L.tituloFollowMe;
  if (tMuscular) tMuscular.textContent = L.tituloMuscular;
  if (tEsportes) tEsportes.textContent = L.tituloEsportes;
  if (tCasa) tCasa.textContent = L.tituloCasa;
  if (tEbooks) tEbooks.textContent = L.tituloEbooks;
  atualizarModalTreinosSemana();
}

/* ============================================================
   HOME — AGORA USANDO SOMENTE VALIDAR (SEM SYNC)
=========================================================== */
document.addEventListener("DOMContentLoaded", async () => {
  FEMFLOW.loading.show("Carregando…");

  try {
    const treinosStorage = Number(localStorage.getItem(TREINOS_SEMANA_KEY));
    if (Number.isFinite(treinosStorage)) {
      treinosSemanaSelecionado = treinosStorage;
    }

    const modalSalvar = document.getElementById("treinosSemanaSalvar");
    const modalCancelar = document.getElementById("treinosSemanaCancelar");
    const modalOverlay = document.getElementById("treinosSemanaModal");

    if (modalSalvar) {
      modalSalvar.addEventListener("click", async () => {
        const valor = treinosSemanaSelecionado ?? TREINOS_SEMANA_PADRAO;
        await salvarTreinosSemana(valor);
        fecharModalTreinosSemana();
        if (treinosSemanaResolve) treinosSemanaResolve(true);
        treinosSemanaResolve = null;
      });
    }

    if (modalCancelar) {
      modalCancelar.addEventListener("click", () => {
        fecharModalTreinosSemana();
        if (treinosSemanaResolve) treinosSemanaResolve(false);
        treinosSemanaResolve = null;
      });
    }

    if (modalOverlay) {
      modalOverlay.addEventListener("click", (event) => {
        if (event.target !== modalOverlay) return;
        fecharModalTreinosSemana();
        if (treinosSemanaResolve) treinosSemanaResolve(false);
        treinosSemanaResolve = null;
      });
    }

    novoProgramaModal = document.getElementById("novoProgramaModal");
    novoProgramaConfirmar = document.getElementById("novoProgramaConfirmar");
    novoProgramaCancelar = document.getElementById("novoProgramaCancelar");

    if (novoProgramaConfirmar) {
      novoProgramaConfirmar.addEventListener("click", confirmarNovoPrograma);
    }

    if (novoProgramaCancelar) {
      novoProgramaCancelar.addEventListener("click", fecharModalNovoPrograma);
    }

    if (novoProgramaModal) {
      novoProgramaModal.addEventListener("click", (event) => {
        if (event.target !== novoProgramaModal) return;
        fecharModalNovoPrograma();
      });
    }

    const perfil = await carregarPerfilEAtualizarStorage();

    const acessoLivreStaging = perfil.status === "no_auth" && isStagingRuntime();

    if (perfil.status !== "ok" && !acessoLivreStaging) {
      FEMFLOW.toast("Erro ao atualizar dados. Tente novamente.");
      FEMFLOW.loading.hide();
      return;
    }

    if (perfil.status === "blocked" || perfil.status === "denied") {
      FEMFLOW.toast("Sessão inválida. Faça login novamente.");
      FEMFLOW.clearSession?.();
      FEMFLOW.loading.hide();
      return FEMFLOW.router("index.html");
    }

    if (!acessoLivreStaging) {
      persistPerfil(perfil);
    }

    if (localStorage.getItem("femflow_auth") === "yes") {
      setTimeout(() => FEMFLOW.push?.requestPermissionAfterLogin?.(), 800);
    }

    // ✅ ciclo configurado vem do VALIDAR
    if (perfil.fase && perfil.diaCiclo) {
      localStorage.setItem("femflow_cycle_configured", "yes");
    }

    if (!localStorage.getItem("femflow_cycle_configured") && !acessoLivreStaging) {
      FEMFLOW.loading.hide?.();
      FEMFLOW.toast("Configure seu ciclo antes de escolher o treino 🌸");
      FEMFLOW.router("ciclo");
      return;
    }

    const catalogo = await carregarCatalogoFirebase();

    /* ============================================================
       🧩 INJETAR VITRINE COMERCIAL (LOCAL CORRETO)
    ============================================================ */
    const perfilTemPersonal =
      localStorage.getItem("femflow_has_personal") === "true";

    const produto =
      String(localStorage.getItem("femflow_produto") || "").toLowerCase();
    const isVip = produto === "vip";

    // PERSONAL — sempre aparece:
    // - se tem personal → desbloqueado (ativa modo personal)
    // - se não tem → locked e vira propaganda CTA
    if (catalogo.personal.length === 0) {
      const cards = CARDS_PERSONAL_SIMBOLICOS.map(c => ({
        ...c,
        locked: !perfilTemPersonal
      }));
      catalogo.personal.push(...cards);
    }

    // FOLLOWME — sempre aparece como vitrine
    if (catalogo.followme.length === 0) {
      const cards = CARDS_FOLLOWME_SIMBOLICOS.map(c => ({
        ...c,
        locked: !isVip && produto !== c.enfase
      }));
      catalogo.followme.push(...cards);
    }

    renderRail(document.getElementById("railFollowMe"), catalogo.followme);
    renderRail(document.getElementById("railMuscular"), catalogo.muscular);
    renderRail(document.getElementById("railEsportes"), catalogo.esportes);
    renderRail(document.getElementById("railCasa"), catalogo.casa);
    renderRail(document.getElementById("railPersonal"), catalogo.personal);
    renderEbookRail(document.getElementById("railEbooks"), await carregarEbooks());

    aplicarIdiomaHome();
  } catch (err) {
    console.error("HOME init erro:", err);
    FEMFLOW.toast("Falha ao carregar. Verifique internet.");
  } finally {
    FEMFLOW.loading.hide();
  }
});

/* ============================================================
   🔥 Quando o idioma mudar → traduz de novo a home
=========================================================== */
document.addEventListener("femflow:langChange", aplicarIdiomaHome);
document.addEventListener("DOMContentLoaded", ffHeroInit);
document.addEventListener("femflow:langChange", ffHeroInit);
