console.log("🚀 app.js carregado com sucesso!");

/* ===== V24 – Gerador de Corrida (microciclo) =====
   - progressão sequencial por fase
   - volumes por nível (1.5× / 2× / 2–3×)
   - esforço (1–10) ajusta variação de ritmo (±5–10%)
*/

const byId = (id) => document.getElementById(id);
const $ = (sel) => document.querySelector(sel);
const t = (key) => (window.EnduranceI18n?.t ? window.EnduranceI18n.t(key) : key);

function getActiveLanguage() {
  if (window.EnduranceI18n?.getLanguage) return window.EnduranceI18n.getLanguage();
  const htmlLang = document.documentElement.lang || "pt";
  if (htmlLang.startsWith("en")) return "en";
  if (htmlLang.startsWith("fr")) return "fr";
  return "pt";
}

function translateTreinoCampo(treino, campo) {
  const lang = getActiveLanguage();
  if (lang === "pt") return treino?.[campo] || "";
  const key = `${campo}_${lang}`;
  return treino?.[key] || treino?.[campo] || "";
}

/* ======= Som (WebAudio) ======= */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq = 880, dur = 120, type = "sine", vol = 0.08) {
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); setTimeout(()=>o.stop(), dur);
  } catch(e) {
    console.warn("Som não disponível:", e);
  }
}

function playFeedback(type = "click") {
  if (type === "success") beep(1100, 120, "triangle", 0.08);
  else if (type === "error") beep(300, 200, "square", 0.1);
  else beep(800, 80, "sine", 0.07);
}

/* ======= Helpers ======= */
function toSecPace(p) {
  if (!p) return 330; // padrão 5:30
  const [m, s] = p.split(":").map(x => parseInt(x, 10));
  return (m * 60 + (isNaN(s) ? 0 : s));
}

function paceStr(sec) {
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function clamp(n, a, b){ return Math.min(b, Math.max(a, n)); }
function rng(min, max){ return Math.random() * (max - min) + min; }
function round2(n){ return Math.round(n*100)/100; }

function formatRange(min, max, unit = "min") {
  const minRound = Math.round(min);
  const maxRound = Math.round(max);
  if (minRound === maxRound) return `${minRound} ${unit}`;
  return `${minRound}–${maxRound} ${unit}`;
}

function formatTempoValue(minutos) {
  const rounded = Math.round(minutos * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return `${Math.round(rounded)} min`;
  }
  return `${rounded.toFixed(1)} min`;
}

function normalizarNivel(raw) {
  const n = String(raw || "").toLowerCase().trim();
  if (!n) return "iniciante";
  if (n.startsWith("inic")) return "iniciante";
  if (n.startsWith("inter")) return "intermediario";
  if (n.startsWith("avan")) return "avancado";
  return n;
}

function normalizarFase(raw) {
  const f = String(raw || "").toLowerCase().trim();
  if (!f) return "follicular";
  return {
    ovulatória: "ovulatoria",
    ovulatoria: "ovulatoria",
    ovulação: "ovulatoria",
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
}

function calcularFasesPorCiclo(cicloDuracao) {
  const duracao = Math.max(21, Math.min(35, Number(cicloDuracao) || 28));
  const base = {
    menstrual: 5,
    follicular: 8,
    ovulatoria: 4,
    lutea: 11
  };
  const totalBase = 28;
  const fases = ["menstrual", "follicular", "ovulatoria", "lutea"];
  const valores = fases.map(f => ({
    fase: f,
    valor: (base[f] / totalBase) * duracao
  }));

  const arredondados = valores.map(({ fase, valor }) => ({
    fase,
    dias: Math.max(1, Math.floor(valor))
  }));

  let total = arredondados.reduce((acc, f) => acc + f.dias, 0);
  let restante = duracao - total;

  while (restante > 0) {
    const alvo = arredondados.reduce((a, b) => (a.dias < b.dias ? a : b));
    alvo.dias += 1;
    restante -= 1;
  }

  while (restante < 0) {
    const alvo = arredondados.reduce((a, b) => (a.dias > b.dias ? a : b));
    if (alvo.dias > 1) {
      alvo.dias -= 1;
      restante += 1;
    } else {
      break;
    }
  }

  return arredondados.reduce((acc, item) => {
    acc[item.fase] = item.dias;
    return acc;
  }, {});
}

function calcularFasePorDia(diaCiclo, cicloDuracao) {
  const duracao = Math.max(21, Math.min(35, Number(cicloDuracao) || 28));
  const diaNormalizado = ((Number(diaCiclo) - 1) % duracao) + 1;
  const tamanhos = calcularFasesPorCiclo(duracao);
  const limites = {
    menstrual: tamanhos.menstrual,
    follicular: tamanhos.menstrual + tamanhos.follicular,
    ovulatoria: tamanhos.menstrual + tamanhos.follicular + tamanhos.ovulatoria
  };

  if (diaNormalizado <= limites.menstrual) return { fase: "menstrual", dia: diaNormalizado };
  if (diaNormalizado <= limites.follicular) return { fase: "follicular", dia: diaNormalizado };
  if (diaNormalizado <= limites.ovulatoria) return { fase: "ovulatoria", dia: diaNormalizado };
  return { fase: "lutea", dia: diaNormalizado };
}

function buildEstrutura(min, max) {
  const aquecimentoMin = min * 0.2;
  const aquecimentoMax = max * 0.2;
  const principalMin = min * 0.6;
  const principalMax = max * 0.6;
  const desaquecMin = min * 0.2;
  const desaquecMax = max * 0.2;
  return {
    aquecimento: `${t("label_warmup")}: ${formatRange(aquecimentoMin, aquecimentoMax)}`,
    principal: `${t("label_main")}: ${formatRange(principalMin, principalMax)}`,
    desaquecimento: `${t("label_cooldown")}: ${formatRange(desaquecMin, desaquecMax)}`,
  };
}

function parseTempoTokens(texto) {
  let total = 0;
  let restante = texto;
  const rangeRegex = /(\d+(?:[–-]\d+)+)\s*([\'\"])/g;
  restante = restante.replace(rangeRegex, (_match, nums, unit) => {
    const soma = nums.split(/[–-]/).reduce((acc, item) => acc + parseFloat(item.replace(",", ".")), 0);
    const fator = unit === "\"" ? 1 / 60 : 1;
    total += soma * fator;
    return " ";
  });

  const tokenRegex = /(\d+(?:[.,]\d+)?)\s*([\'\"])/g;
  let match;
  while ((match = tokenRegex.exec(restante)) !== null) {
    const valor = parseFloat(match[1].replace(",", "."));
    if (Number.isNaN(valor)) continue;
    total += match[2] === "\"" ? valor / 60 : valor;
  }
  return total;
}

function parseTempoSegmento(texto) {
  let total = 0;
  let restante = texto;
  const repParentesesRegex = /(\d+)\s*[×x]\s*\(([^)]+)\)/g;
  restante = restante.replace(repParentesesRegex, (_match, rep, conteudo) => {
    total += parseInt(rep, 10) * parseTempoTokens(conteudo);
    return " ";
  });

  const repMatch = restante.match(/(\d+)\s*[×x]\s*(.+)/);
  if (repMatch) {
    total += parseInt(repMatch[1], 10) * parseTempoTokens(repMatch[2]);
    return total;
  }

  total += parseTempoTokens(restante);
  return total;
}

function calcularTempoPorDescricao(desc) {
  if (!desc) return null;
  const descLower = desc.toLowerCase();

  const partes = desc.split("+").map(item => item.trim()).filter(Boolean);
  if (!partes.length) return null;

  const partesInfo = partes.map((texto) => ({
    texto: texto.toLowerCase(),
    tempo: parseTempoSegmento(texto)
  }));

  const total = partesInfo.reduce((acc, item) => acc + item.tempo, 0);
  if (total <= 0) return null;

  let aquecimento = 0;
  let principal = 0;
  let desaquecimento = 0;
  partesInfo.forEach((item, index) => {
    if (!item.tempo) return;
    if (item.texto.includes("aquec")) {
      aquecimento += item.tempo;
    } else if (item.texto.includes("desaquec")) {
      desaquecimento += item.tempo;
    } else if (item.texto.includes("leve") && index === 0) {
      aquecimento += item.tempo;
    } else if (item.texto.includes("leve") && index === partesInfo.length - 1) {
      desaquecimento += item.tempo;
    } else {
      principal += item.tempo;
    }
  });

  if (!principal) {
    principal = Math.max(0, total - aquecimento - desaquecimento);
  }

  return {
    total,
    aquecimento,
    principal,
    desaquecimento
  };
}

function buildEstruturaFromParts(tempos) {
  return {
    aquecimento: `${t("label_warmup")}: ${formatTempoValue(tempos.aquecimento)}`,
    principal: `${t("label_main")}: ${formatTempoValue(tempos.principal)}`,
    desaquecimento: `${t("label_cooldown")}: ${formatTempoValue(tempos.desaquecimento)}`
  };
}

function normalizeDiaAbrev(dia) {
  const key = String(dia || "").trim().toLowerCase().slice(0, 3);
  const map = {
    dom: "dom",
    seg: "seg",
    ter: "ter",
    qua: "qua",
    qui: "qui",
    sex: "sex",
    sab: "sab",
    sun: "dom",
    mon: "seg",
    tue: "ter",
    wed: "qua",
    thu: "qui",
    fri: "sex",
    sat: "sab",
    dim: "dom",
    lun: "seg",
    mar: "ter",
    mer: "qua",
    jeu: "qui",
    ven: "sex",
    sam: "sab"
  };
  return map[key] || key;
}

function getModalidadeConfig(modalidade) {
  if (modalidade === "bike") return { min: 1.3, max: 1.5 };
  if (modalidade === "remo") return { min: 1.1, max: 1.25 };
  if (modalidade === "natacao") return { min: 1.4, max: 1.6 };
  if (modalidade === "natacao_aberta") return { min: 1.5, max: 1.7 };
  if (modalidade === "eliptico") return { min: 1.2, max: 1.35 };
  if (modalidade === "caminhada") return { min: 1.6, max: 2.0 };
  if (modalidade === "trilha") return { min: 1.4, max: 1.7 };
  if (modalidade === "aqua_run") return { min: 1.2, max: 1.4 };
  if (modalidade === "esqui") return { min: 1.3, max: 1.5 };
  return { min: 1.0, max: 1.0 };
}

function formatDistanciaEstimativa(modalidade, distKm) {
  const estimatedSuffix = ` ${t("label_estimated_suffix")}`;
  if (modalidade === "bike") {
    return `${round2(distKm * 3.5)} km${estimatedSuffix}`;
  }
  if (modalidade === "remo") {
    return `${Math.round(distKm * 0.9 * 1000)} m${estimatedSuffix}`;
  }
  if (modalidade === "natacao") {
    return `${Math.round(distKm * 0.9 * 1000)} m${estimatedSuffix}`;
  }
  if (modalidade === "natacao_aberta") {
    return `${round2(distKm * 0.8)} km${estimatedSuffix}`;
  }
  if (modalidade === "eliptico") {
    return `${round2(distKm * 1.6)} km${estimatedSuffix}`;
  }
  if (modalidade === "caminhada") {
    return `${round2(distKm * 0.85)} km${estimatedSuffix}`;
  }
  if (modalidade === "trilha") {
    return `${round2(distKm * 0.9)} km${estimatedSuffix}`;
  }
  if (modalidade === "aqua_run") {
    return `${formatRange(distKm * 0.8, distKm)} km${estimatedSuffix}`;
  }
  if (modalidade === "esqui") {
    return `${round2(distKm * 2.8)} km${estimatedSuffix}`;
  }
  return `${round2(distKm)} km`;
}

function formatRitmoLabel(modalidade, ritmoSessao) {
  const labelMap = {
    corrida: "label_base_pace_running",
    bike: "label_base_pace_bike",
    remo: "label_base_pace_row",
    natacao: "label_base_pace_swim",
    natacao_aberta: "label_base_pace_open_swim",
    eliptico: "label_base_pace_elliptical",
    caminhada: "label_base_pace_walk",
    trilha: "label_base_pace_trail",
    aqua_run: "label_base_pace_aqua",
    esqui: "label_base_pace_ski"
  };
  const unitMap = {
    corrida: "min/km",
    bike: "km/h",
    remo: "min/500 m",
    natacao: "min/100 m",
    natacao_aberta: "min/100 m",
    eliptico: "unit_base_pace_elliptical",
    caminhada: "min/km",
    trilha: "unit_base_pace_trail",
    aqua_run: "unit_base_pace_aqua",
    esqui: "min/500 m"
  };
  const labelKey = labelMap[modalidade] || "label_base_pace_running";
  const unit = unitMap[modalidade] || "min/km";
  const unitLabel = unit.includes("unit_") ? t(unit) : unit;
  const label = t(labelKey);
  if (unitLabel.includes("tempo") || unitLabel.includes("time") || unitLabel.includes("temps")) {
    return `${label} ${unitLabel}`;
  }
  return `${label} ${ritmoSessao} ${unitLabel}`;
}

function formatModalidadeLabel(modalidade) {
  const labelMap = {
    corrida: "modality_corrida",
    bike: "modality_bike",
    remo: "modality_remo",
    natacao: "modality_natacao",
    natacao_aberta: "modality_natacao_aberta",
    eliptico: "modality_eliptico",
    caminhada: "modality_caminhada",
    trilha: "modality_trilha",
    aqua_run: "modality_aqua_run",
    esqui: "modality_esqui"
  };
  const labelKey = labelMap[modalidade] || "modality_corrida";
  return t(labelKey);
}

const seq = {};

const ajusteFaseCiclo = {
  follicular: { volume: 1.0, intensidade: 1.0 },
  ovulatoria: { volume: 0.95, intensidade: 1.05 },
  lutea: { volume: 0.85, intensidade: 0.9 },
  menstrual: { volume: 0.7, intensidade: 0.8 },
};

const treinoLabels = {
  resistencia: "label_resistance",
  velocidade: "label_speed",
  velocidade_pura: "label_speed_pure"
};

const tipoPorCategoria = {
  resistencia: "res_vel",
  velocidade: "potencia",
  velocidade_pura: "intensidade"
};

function getTreinosModalidade(modalidade, categoria) {
  const catalogo = window.TREINOS_POR_MODALIDADE || {};
  const base = catalogo[modalidade] || catalogo.corrida || {};
  return base[categoria] || [];
}

function pickSequencial(modalidade, categoria) {
  const lista = getTreinosModalidade(modalidade, categoria);
  if (!lista.length) return null;
  const key = `${modalidade}:${categoria}`;
  if (!seq[key]) seq[key] = 0;
  const idx = seq[key] % lista.length;
  seq[key] += 1;
  const treino = { ...lista[idx] };
  treino.tipo = treino.tipo || tipoPorCategoria[categoria] || "res_vel";
  return treino;
}

function montarDistribuicaoSemanal(nTreinos, nivel) {
  const base = ["resistencia", "velocidade", "velocidade_pura"];
  const extras = [];
  const regrasExtras = {
    iniciante: { 4: "resistencia", 5: "velocidade" },
    intermediario: { 4: "resistencia", 5: "velocidade_pura" },
    avancado: { 4: "velocidade", 5: "velocidade_pura" }
  };
  if (nTreinos >= 4) extras.push(regrasExtras[nivel]?.[4] || "resistencia");
  if (nTreinos >= 5) extras.push(regrasExtras[nivel]?.[5] || "velocidade");
  return base.concat(extras).slice(0, nTreinos);
}

function pickTreinoUnico(modalidade, categoria, usados) {
  const lista = getTreinosModalidade(modalidade, categoria);
  if (!lista.length) return null;
  const maxTentativas = lista.length;
  for (let i = 0; i < maxTentativas; i++) {
    const treino = pickSequencial(modalidade, categoria);
    if (treino && !usados.has(treino.nome)) {
      usados.add(treino.nome);
      return treino;
    }
  }
  const treino = pickSequencial(modalidade, categoria);
  if (treino) usados.add(treino.nome);
  return treino;
}

/* ======= GERAÇÃO DE MESOCICLO (30 dias) ======= */
let mesocicloPlan = [];
let semanaAtiva = 0;

async function syncPerfilBackend() {
  if (!window.FEMFLOW?.carregarPerfil) return null;
  try {
    return await FEMFLOW.carregarPerfil();
  } catch (error) {
    console.warn("⚠️ Falha ao sincronizar perfil:", error);
    return null;
  }
}

function hidratarCamposDoPerfil(perfil = null) {
  const nivelEl = byId('perfilNivelInput');
  const nomeEl = byId('perfilNome');
  const nivelTagEl = byId('perfilNivel');
  const inicioEl = byId('inicio');

  const nivelStorage = normalizarNivel(perfil?.nivel || localStorage.getItem("femflow_nivel"));
  const diaCicloStorage = parseInt(perfil?.diaCiclo || localStorage.getItem("femflow_diaCiclo") || "1", 10);
  const cicloDuracaoStorage = parseInt(perfil?.ciclo_duracao || localStorage.getItem("femflow_cycleLength") || "28", 10);
  const faseStorage = normalizarFase(perfil?.fase || localStorage.getItem("femflow_fase"));
  const inicioStorage = localStorage.getItem("femflow_training_start") || "";
  const nomeStorage = perfil?.nome || localStorage.getItem("femflow_nome") || t("default_student_name");

  if (nivelEl && nivelStorage) {
    const map = {
      iniciante: t("level_beginner"),
      intermediario: t("level_intermediate"),
      avancado: t("level_advanced")
    };
    nivelEl.value = map[nivelStorage] || nivelStorage;
  }

  if (nomeEl) nomeEl.textContent = nomeStorage;
  if (nivelTagEl) {
    const faseCalc = Number.isFinite(diaCicloStorage)
      ? calcularFasePorDia(diaCicloStorage, cicloDuracaoStorage).fase
      : faseStorage;
    const faseLabel = {
      follicular: t("phase_follicular"),
      ovulatoria: t("phase_ovulatory"),
      lutea: t("phase_luteal"),
      menstrual: t("phase_menstrual")
    }[faseCalc] || faseCalc;
    const nivelLabel = {
      iniciante: t("level_beginner"),
      intermediario: t("level_intermediate"),
      avancado: t("level_advanced")
    }[nivelStorage] || nivelStorage;
    nivelTagEl.textContent = `${nivelLabel} • ${faseLabel} • ${t("label_day")} ${diaCicloStorage}`;
  }

  if (inicioEl && inicioStorage) {
    inicioEl.value = inicioStorage.slice(0, 10);
  }
}

function atualizarTabsSemana() {
  const tabs = document.querySelectorAll(".week-tab");
  tabs.forEach(tab => {
    const weekIndex = Number(tab.dataset.week || 0);
    tab.setAttribute("aria-pressed", weekIndex === semanaAtiva ? "true" : "false");
  });
}

function renderSemanaAtiva() {
  if (!mesocicloPlan.length) return;
  const planoSemana = mesocicloPlan.filter(item => item.semana === semanaAtiva);
  renderSemana(planoSemana);
  plotSemana(planoSemana);
  atualizarTabsSemana();
}

function persistMesociclo() {
  if (!mesocicloPlan.length) return;
  localStorage.setItem("femflow_mesociclo_plan", JSON.stringify(mesocicloPlan));
  localStorage.setItem("femflow_mesociclo_week", String(semanaAtiva));
}

function carregarMesocicloSalvo() {
  const raw = localStorage.getItem("femflow_mesociclo_plan");
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return false;
    mesocicloPlan = parsed;
    const weekRaw = parseInt(localStorage.getItem("femflow_mesociclo_week") || "0", 10);
    semanaAtiva = Number.isFinite(weekRaw) ? weekRaw : 0;
    renderSemanaAtiva();
    return true;
  } catch (error) {
    console.warn("⚠️ Falha ao carregar mesociclo salvo:", error);
    return false;
  }
}

function gerarMesociclo() {
  console.log("⚙️ Iniciando geração do mesociclo (30 dias)...");

  // === 1. Captura de campos ===
  const provaKmEl = byId('distProva');
  const nivelEl = byId('perfilNivelInput');
  const nTreinosEl = byId('semanal');
  const cooperDistEl = byId('cooperDist');
  const diasEl = byId('dias');
  const cooperPseEl = byId('cooperPse');
  const modalidadeEl = byId('modalidade');
  const zonaEl = byId('zona');
  const inicioEl = byId('inicio');

  if (!provaKmEl || !nivelEl || !nTreinosEl || !cooperDistEl || !cooperPseEl || !diasEl || !modalidadeEl || !zonaEl || !inicioEl) {
    console.error("❌ Um ou mais campos de entrada não foram encontrados no HTML!");
    toast(t("toast_field_missing"));
    playFeedback("error");
    return;
  }

  const provaKm = parseFloat(provaKmEl.value || 10);
  const nivel = normalizarNivel(localStorage.getItem("femflow_nivel") || nivelEl.value);
  const nTreinos = parseInt(nTreinosEl.value || 4, 10);
  const cooperDist = parseFloat(cooperDistEl.value || 3000);
  const cooperPse = parseInt(cooperPseEl.value || 8, 10);
  const dias = diasEl.value
    .split(",")
    .map((d) => normalizeDiaAbrev(d))
    .filter(Boolean);
  const faseCiclo = normalizarFase(localStorage.getItem("femflow_fase"));
  const diaCiclo = parseInt(localStorage.getItem("femflow_diaCiclo") || "1", 10);
  const cicloDuracao = parseInt(localStorage.getItem("femflow_cycleLength") || "28", 10);
  const modalidade = modalidadeEl.value;
  const zona = zonaEl.value || "Z2 / PSE 5-6";
  const inicioRaw = inicioEl.value;
  if (inicioRaw) {
    localStorage.setItem("femflow_training_start", inicioRaw);
  }

  if (nTreinos > 5) {
    toast(t("toast_max_sessions"));
    playFeedback("error");
    return;
  }

  if (!cooperDist || cooperDist <= 0) {
    toast(t("toast_invalid_cooper"));
    playFeedback("error");
    return;
  }

  const cooperKm = cooperDist / 1000;
  const ritmoBaseSec = (12 * 60) / cooperKm;

  console.log(`📊 Dados recebidos → prova=${provaKm}km | nível=${nivel} | treinos=${nTreinos} | Cooper=${cooperDist}m | PSE=${cooperPse} | diaCiclo=${diaCiclo} | ciclo=${cicloDuracao}`);

  // === 2. Ajuste do volume conforme nível ===
  let fator = 2.0;
  if (nivel === "iniciante") fator = 1.5;
  else if (nivel === "intermediario") fator = 2.0;
  else if (nivel === "avancado") fator = 2.5;

  const volMaxKm = provaKm * fator;

  // === 3. Cálculo do ritmo e variação pelo esforço ===
  const varMin = 0.05, varMax = 0.10;
  const escala = 1 - clamp(cooperPse, 0, 10) / 10;
  const varPct = varMin + (varMax - varMin) * escala;
  const ritmoForteBase = ritmoBaseSec * (1 - varPct);
  const ritmoLeveBase = ritmoBaseSec * (1 + varPct * 0.6);

  // === 4. Montagem do mesociclo ===
  const plano = [];
  let distAcum = 0;
  const usados = new Set();
  const inicio = inicioRaw ? new Date(`${inicioRaw}T00:00:00`) : new Date();
  const diaSemanaMap = {
    dom: 0,
    seg: 1,
    ter: 2,
    qua: 3,
    qui: 4,
    sex: 5,
    sab: 6
  };
  const diasTreino = new Set(
    dias.map(d => d.toLowerCase()).map(d => d.slice(0, 3))
  );
  const semanas = [];
  for (let i = 0; i < 30; i++) {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    const weekIndex = Math.floor(i / 7);
    if (!semanas[weekIndex]) {
      semanas[weekIndex] = {
        distribuicao: montarDistribuicaoSemanal(nTreinos, nivel),
        indice: 0
      };
    }
    const semanaAtual = semanas[weekIndex];
    const diaAbrev = Object.keys(diaSemanaMap).find(
      key => diaSemanaMap[key] === data.getDay()
    );
    const isTreino = diaAbrev && diasTreino.has(diaAbrev);
    if (!isTreino) continue;
    if (semanaAtual.indice >= semanaAtual.distribuicao.length) continue;

    const categoria = semanaAtual.distribuicao[semanaAtual.indice];
    semanaAtual.indice += 1;
    const treino = pickTreinoUnico(modalidade, categoria, usados);
    if (!treino) continue;

    const faseInfo = Number.isFinite(diaCiclo)
      ? calcularFasePorDia(diaCiclo + i, cicloDuracao)
      : { fase: faseCiclo, dia: 1 };
    const ajusteDia = ajusteFaseCiclo[faseInfo.fase] || ajusteFaseCiclo.follicular;

    let alvo = treino.distKm * ajusteDia.volume;
    if (distAcum + alvo > volMaxKm) alvo = Math.max(2, volMaxKm - distAcum);

    const ritmoBaseSessao = ["intensidade", "res_vel", "potencia"].includes(treino.tipo)
      ? ritmoForteBase
      : ritmoLeveBase;
    const fatorIntensidade = 1 / ajusteDia.intensidade;
    const ritmoSessao = paceStr(ritmoBaseSessao * fatorIntensidade);
    const tempoCorridaMin = alvo * (toSecPace(ritmoSessao) / 60);
    const fatorModalidade = getModalidadeConfig(modalidade);
    const tempoMin = tempoCorridaMin * fatorModalidade.min;
    const tempoMax = tempoCorridaMin * fatorModalidade.max;
    const temposPorDesc = calcularTempoPorDescricao(treino.desc);
    const estrutura = temposPorDesc ? buildEstruturaFromParts(temposPorDesc) : buildEstrutura(tempoMin, tempoMax);
    const distanciaEstimada = formatDistanciaEstimativa(modalidade, alvo);
    const dataLabel = data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });

    const tipoKey = treinoLabels[categoria] || treino.tipo;
    plano.push({
      dia: `${diaAbrev.toUpperCase()} • ${dataLabel}`,
      semana: weekIndex,
      dataISO: data.toISOString().slice(0, 10),
      nome: treino.nome,
      tipo: tipoKey,
      tipoKey,
      fase: faseInfo.fase,
      distKm: round2(alvo),
      ritmo: ritmoSessao,
      ritmoLabel: formatRitmoLabel(modalidade, ritmoSessao),
      modalidade,
      zona,
      tempo: temposPorDesc ? formatTempoValue(temposPorDesc.total) : formatRange(tempoMin, tempoMax),
      distanciaEstimada,
      estrutura,
      desc: treino.desc
    });

    distAcum += alvo;
  }

  // === 5. Renderização ===
  mesocicloPlan = plano;
  semanaAtiva = 0;
  renderSemanaAtiva();
  persistMesociclo();
  toast(t("toast_plan_generated"));
  playFeedback("success");

  console.log("✅ Mesociclo gerado:");
  console.table(plano);
}


/* ======= Render ======= */
function renderSemana(semana){
  const grid = byId('card-grid');
  if (!grid) {
    console.warn("Elemento 'card-grid' não encontrado");
    return;
  }
  grid.innerHTML = "";
  semana.forEach((treino, idx)=>{
    const el = document.createElement('article');
    el.className = "card";
    const modalidadeLabel = formatModalidadeLabel(treino.modalidade);
    const tipoLabel = treino.tipoKey ? t(treino.tipoKey) : treino.tipo;
    const distanciaEstimada = formatDistanciaEstimativa(treino.modalidade, treino.distKm);
    const treinoNome = translateTreinoCampo(treino, "nome");
    const treinoDesc = translateTreinoCampo(treino, "desc");
    const temposPorDesc = calcularTempoPorDescricao(treino.desc);
    const estruturaLabel = temposPorDesc ? buildEstruturaFromParts(temposPorDesc) : treino.estrutura;
    const tempoLabel = temposPorDesc ? formatTempoValue(temposPorDesc.total) : treino.tempo;
    const ritmoLabel = treino.ritmo ? formatRitmoLabel(treino.modalidade, treino.ritmo) : treino.ritmoLabel;
    el.innerHTML = `
      <div class="thumb"></div>
      <div class="body">
        <span class="badge">${treino.dia}</span>
        <div class="title">${idx+1}. ${treinoNome || treino.nome}</div>
        <div class="kv">${t("label_type")}: ${tipoLabel} • ${t("label_modality")}: <b>${modalidadeLabel}</b></div>
        <div class="kv">${t("label_total_time")}: <b>${tempoLabel}</b> • ${t("label_zone")}: <b>${treino.zona}</b></div>
        <div class="kv">${t("label_estimated_distance")}: <b>${distanciaEstimada}</b></div>
        <div class="kv">${estruturaLabel.aquecimento}</div>
        <div class="kv">${estruturaLabel.principal}</div>
        <div class="kv">${estruturaLabel.desaquecimento}</div>
        <div class="kv">${ritmoLabel || `${t("label_base_pace_running")} ${treino.ritmo} min/km`}</div>
        <p class="kv">${treinoDesc || treino.desc || ""}</p>
      </div>`;
    grid.appendChild(el);
  });
}

/* ======= Gráfico ======= */
let chart;
function plotSemana(semana){
  const ctx = byId('chart');
  if (!ctx) {
    console.warn("Elemento 'chart' não encontrado");
    return;
  }
  const labels = semana.map(s=>s.dia);
  const data = semana.map(s=>s.distKm);
  if (chart) chart.destroy();
  if (typeof Chart !== 'undefined') {
    chart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label:'km', data, borderWidth:1 }] },
      options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
    });
  }
}

/* ======= Testes ======= */
function runTests(){
  console.log("🧪 Executando testes...");
  const tests = [
    ["toSecPace 5:30 = 330", () => toSecPace("5:30") === 330],
    ["paceStr 330 = 5:30", () => paceStr(330) === "5:30"],
    ["Seq vel avança", () => { const key = "corrida:velocidade_pura"; const n=seq[key] || 0; pickSequencial('corrida', 'velocidade_pura'); return seq[key] === n + 1; }],
    ["Sem var pace NaN", () => !isNaN(toSecPace("4:05"))],
    ["Treinos por modalidade carregados", () => !!window.TREINOS_POR_MODALIDADE?.corrida?.resistencia?.length],
    ["Elementos existem", () => !!byId('distProva') && !!byId('perfilNivelInput') && !!byId('semanal') && !!byId('cooperDist') && !!byId('cooperPse') && !!byId('dias') && !!byId('modalidade') && !!byId('zona')]
  ];
  const fails = tests.filter(t => {
    try {
      return !t[1]();
    } catch(e) {
      console.error("Erro no teste:", t[0], e);
      return true;
    }
  });
  
  if (fails.length) {
    toast(t("toast_tests_failed") + fails.map(f => f[0]).join(", "));
    playFeedback("error");
  } else {
    toast(`${t("toast_tests_ok")} (${tests.length})`);
    playFeedback("success");
  }
  console.log("🧪 Testes executados. Falhas:", fails.length);
}

/* ======= Exportações ======= */
async function exportPDF(){
  toast(t("toast_pdf_exported"));
  playFeedback("success");
}

async function screenshotCard(){
  toast(t("toast_card_generated"));
  playFeedback("success");
}

/* ======= Toast ======= */
function toast(msg){
  const t = byId('toast');
  if (!t) {
    console.log(msg);
    return alert(msg);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 3000);
}

/* ======= Eventos ======= */
window.addEventListener('DOMContentLoaded', ()=>{
  console.log("⚡️ Gerador de Corrida V24 conectado");

  window.refreshEnduranceUI = () => {
    if (typeof renderSemanaAtiva === "function") {
      renderSemanaAtiva();
    }
  };

  (async () => {
    const id = localStorage.getItem("femflow_id");
    const hasPersonal = localStorage.getItem("femflow_has_personal") === "true";
    if (!id || !hasPersonal) {
      window.location.href = "../index.html";
      return;
    }

    const perfil = await syncPerfilBackend();
    hidratarCamposDoPerfil(perfil);
    carregarMesocicloSalvo();
  })();

  // Conectar event listeners aos botões com IDs corretos
  const btnGerarPlano = byId('btnGerarPlano');
  const btnExportarPDF = byId('btnExportarPDF');
  const btnGerarCards = byId('btnGerarCards');
  const btnResetar = byId('btnResetar');
  const btnInfoTeste = byId('btnInfoTeste');
  const modalTeste = byId('modalTeste');
  const btnFecharModal = byId('btnFecharModal');
  const modalEnduranceInfo = byId('modalEnduranceInfo');
  const btnFecharEnduranceInfo = byId('btnFecharEnduranceInfo');
  const weekTabs = document.querySelectorAll(".week-tab");

  if (btnGerarPlano) {
    btnGerarPlano.addEventListener('click', gerarMesociclo);
    console.log("✅ Evento conectado: btnGerarPlano");
  } else {
    console.warn("⚠️ Botão 'btnGerarPlano' não encontrado");
  }

  weekTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const weekIndex = Number(tab.dataset.week || 0);
      semanaAtiva = weekIndex;
      renderSemanaAtiva();
      localStorage.setItem("femflow_mesociclo_week", String(semanaAtiva));
    });
  });

  if (btnInfoTeste && modalTeste) {
    btnInfoTeste.addEventListener('click', () => {
      modalTeste.classList.add('is-open');
      modalTeste.setAttribute('aria-hidden', 'false');
    });
  }

  if (btnFecharModal && modalTeste) {
    btnFecharModal.addEventListener('click', () => {
      modalTeste.classList.remove('is-open');
      modalTeste.setAttribute('aria-hidden', 'true');
    });
  }

  if (modalTeste) {
    modalTeste.addEventListener('click', (event) => {
      if (event.target === modalTeste) {
        modalTeste.classList.remove('is-open');
        modalTeste.setAttribute('aria-hidden', 'true');
      }
    });
  }

  if (btnFecharEnduranceInfo && modalEnduranceInfo) {
    btnFecharEnduranceInfo.addEventListener('click', () => {
      modalEnduranceInfo.classList.remove('is-open');
      modalEnduranceInfo.setAttribute('aria-hidden', 'true');
    });
  }

  if (modalEnduranceInfo) {
    modalEnduranceInfo.addEventListener('click', (event) => {
      if (event.target === modalEnduranceInfo) {
        modalEnduranceInfo.classList.remove('is-open');
        modalEnduranceInfo.setAttribute('aria-hidden', 'true');
      }
    });
  }

  if (modalEnduranceInfo) {
    window.setTimeout(() => {
      modalEnduranceInfo.classList.add('is-open');
      modalEnduranceInfo.setAttribute('aria-hidden', 'false');
    }, 400);
  }

  if (btnExportarPDF) {
    btnExportarPDF.addEventListener('click', exportPDF);
    console.log("✅ Evento conectado: btnExportarPDF");
  }

  if (btnGerarCards) {
    btnGerarCards.addEventListener('click', screenshotCard);
    console.log("✅ Evento conectado: btnGerarCards");
  }

  if (btnResetar) {
    btnResetar.addEventListener('click', ()=> {
      const grid = byId('card-grid');
      if (grid) grid.innerHTML=""; 
      if (chart) {
        chart.destroy();
        chart = null;
      }
      mesocicloPlan = [];
      semanaAtiva = 0;
      localStorage.removeItem("femflow_mesociclo_plan");
      localStorage.removeItem("femflow_mesociclo_week");
      toast(t("toast_reset_done")); 
    });
    console.log("✅ Evento conectado: btnResetar");
  }

  // Splash desaparece automaticamente
  setTimeout(()=> {
    const splash = byId('splash');
    if (splash) splash.classList.add('hidden');
  }, 1000);
});

/* ======= PWA ======= */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=> {
    navigator.serviceWorker.register('./sw.js')
      .then(()=>console.log("✅ Service Worker ativo"))
      .catch(err => console.warn("⚠️ SW falhou:", err));
  });
}
