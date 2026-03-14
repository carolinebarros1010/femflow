

function isSACIAEnabled_() {
  const props = PropertiesService.getScriptProperties();
  return props.getProperty("SAC_IA_ENABLED") === "true";
}


function decidirSAC(ctx) {

  // NÍVEL 1 — SEM IA
  if (
    ctx.categoria_ui === "treino" &&
    ctx.nivel === "iniciante" &&
    ctx.fase === "lutea"
  ) {
    return { acao: "auto", motivo: "adaptacao_lutea" };
  }

  if (!ctx.mensagem || ctx.mensagem.length < 5) {
    return { acao: "auto", motivo: "mensagem_vazia" };
  }

  // NÍVEL 2 — IA LOW COST
  if (ctx.categoria_ui === "outro_problema") {
    return { acao: "ia", modelo: "gpt-4o-mini" };
  }

  // NÍVEL 3 — HUMANO
  if (/pagamento|cobrança|jurídico/i.test(ctx.mensagem)) {
    return { acao: "humano", prioridade: "alta" };
  }

  return { acao: "ia", modelo: "gpt-4o-mini" };
}
/**
 * =========================================================
 * 🧠 SAC DECISION MATRIX — FEMFLOW (v1 FINAL)
 * ---------------------------------------------------------
 * Responsabilidade:
 * - Classificar o chamado
 * - Definir gravidade
 * - Definir rota de atendimento
 *
 * Rotas possíveis:
 * - "auto"     → resposta automática (zero custo)
 * - "ia_low"   → IA barata (gpt-4o-mini)
 * - "humano"   → atendimento manual
 *
 * ⚠️ NÃO chama IA
 * ⚠️ NÃO grava em planilha
 * =========================================================
 */
function sacDecisionMatrix_(ctx) {

  // ---------------------------
  // 🔹 Normalização defensiva
  // ---------------------------
  const texto = String(ctx.mensagem || "").trim();
  const textoNorm = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const origem = String(ctx.origem || "app");
  const pagina = String(ctx.pagina || "");
  const nivel  = String(ctx.nivel || "iniciante");
  const fase   = String(ctx.fase || "");
  const idioma = String(ctx.lang || "pt");

  const tamanho = texto.length;

  // ---------------------------
  // 🔹 Heurísticas base
  // ---------------------------
  const contains = (arr) => arr.some(k => textoNorm.includes(k));

  const KEYWORDS = {
    bug: [
      "erro", "bug", "nao abre", "não abre", "travou", "quebrado",
      "nao funciona", "não funciona", "carregando", "tela branca"
    ],
    ciclo: [
      "ciclo", "fase", "menstru", "ovula", "lutea", "lútea",
      "data errada", "dia errado"
    ],
    treino: [
      "treino", "exercicio", "exercício", "peso", "repeticao",
      "series", "pse", "nao entendi", "não entendi"
    ],
    conta: [
      "login", "senha", "acesso", "assinatura", "pagamento",
      "cobrança", "cobranca", "plano", "bloqueado"
    ],
    humano: [
      "reclama", "reclamação", "cancelar", "reembolso",
      "processo", "juridico", "jurídico", "advogado"
    ]
  };

  // ---------------------------
  // 🔹 Classificação primária
  // ---------------------------
  let categoria = "outro";

  if (contains(KEYWORDS.humano)) {
    categoria = "sensivel";
  } else if (contains(KEYWORDS.bug)) {
    categoria = "bug";
  } else if (contains(KEYWORDS.conta)) {
    categoria = "conta";
  } else if (contains(KEYWORDS.ciclo)) {
    categoria = "ciclo";
  } else if (contains(KEYWORDS.treino)) {
    categoria = "treino";
  }

  // ---------------------------
  // 🔹 Gravidade
  // ---------------------------
  let severidade = "baixa";

  if (categoria === "sensivel") severidade = "alta";
  if (categoria === "bug" && tamanho > 120) severidade = "media";
  if (categoria === "conta") severidade = "media";

  // ---------------------------
  // 🔹 Decisão de rota
  // ---------------------------
  let rota = "auto";
  let motivo = "resposta_padrao";

  // ⚠️ humano direto
  if (categoria === "sensivel") {
    rota = "humano";
    motivo = "conteudo_sensivel";
  }

  // 🧠 IA barata
  else if (
    (categoria === "treino" || categoria === "ciclo") &&
    tamanho >= 40
  ) {
    rota = "ia_low";
    motivo = "explicacao_personalizada";
  }

  // 🧠 Bug complexo
  else if (categoria === "bug" && tamanho >= 80) {
    rota = "ia_low";
    motivo = "bug_contextual";
  }

  // ---------------------------
  // 🔹 Resultado FINAL
  // ---------------------------
  return {
    categoria,          // bug | treino | ciclo | conta | sensivel | outro
    severidade,         // baixa | media | alta
    rota,               // auto | ia_low | humano
    motivo,             // string técnica
    idioma,             // pt | en | fr
    contexto: {
      origem,
      pagina,
      nivel,
      fase,
      tamanhoMensagem: tamanho
    }
  };
}



function sacAbrir_(data) {

  const contexto = data.contexto || {};
  const categoria = data.categoria || data.categoria_ui || "outro";
  const ticketId = gerarTicketSAC_();

  const decisao = sacDecisionMatrix_({
    categoria,
    mensagem: data.mensagem,
    lang: data.lang,
    nivel: data.nivel || contexto.nivel,
    fase: data.fase || contexto.fase,
    diaPrograma: data.diaPrograma || contexto.diaPrograma,
    perfilHormonal: data.perfilHormonal || contexto.perfilHormonal,
    origem: data.origem || "app",
    pagina: data.pagina || contexto.pagina
  });

  registrarSACLog_({
    ticketId,
    id: data.id,
    categoria,
    mensagem: data.mensagem,
    severidade: decisao.severidade,
    rota: decisao.rota,
    origem: data.origem || "app",
    pagina: data.pagina || contexto.pagina,
    timestamp: new Date()
  });

  return {
    status: "ok",
    ticketId,
    decisao
  };
}

/**
 * =========================================================
 * 🧠 SAC ORQUESTRADOR — FemFlow 2025
 * ---------------------------------------------------------
 * Função central de orquestração do SAC.
 *
 * Responsabilidades:
 * - Classificar solicitações via Decision Matrix
 * - Gerar ticket único
 * - Definir rota (auto | ia_low | humano)
 * - Executar ações conforme rota (IA low-cost ou fallback humano)
 * - Registrar logs técnicos e dados para dashboard
 *
 * Observações:
 * - IA pode ser ligada/desligada via Script Properties
 * - Suporte multilíngue (ctx.lang)
 * - Nenhuma lógica de UI ou apresentação
 *
 * Esta função é a fonte de verdade do fluxo SAC.
 * =========================================================
 */

function sacOrquestrador_(ctx) {
  if (!ctx || !ctx.categoria) {
    return {
      status: "error",
      rota: "invalid",
      mensagem: "Dados insuficientes para processar o SAC."
    };
  }

  // 1️⃣ Gera ticket único
  const ticketId = gerarTicketSAC_();

  // 2️⃣ Aplica decision matrix (ZERO IA)
  const decisao = sacDecisionMatrix_(ctx);

  // 3️⃣ Persistência mínima (log)
  registrarSACLog_({
    ticketId,
    id: ctx.id,
    categoria: ctx.categoria,
    mensagem: ctx.mensagem,
    severidade: decisao.severidade,
    rota: decisao.rota,
    origem: ctx.origem,
    pagina: ctx.pagina,
    timestamp: new Date()
  });

  // 4️⃣ Roteamento e execução conforme a rota definida

  switch (decisao.rota) {

    case "auto":

    sacRegistrarMetricas_({
  ticketId,
  categoria: ctx.categoria,
  rota: "auto",
  ia_usada: false,
  status: "ok",
  custo: 0,
  tokens: 0,
  lang: ctx.lang
});



      return {
        status: "ok",
        rota: "auto",
        ticketId,
        mensagem: mensagemAutoPadrao_(ctx.categoria),
        proximo_passo: "resolvido_automaticamente"
      };

    case "ia_low": {
        if (!podeUsarSACIA_()) {
  sacRegistrarMetricas_({
    ticketId,
    categoria: ctx.categoria,
    rota: "humano",
    ia_usada: false,
    status: "limite_ia_atingido",
    custo: 0,
    tokens: 0,
    lang: ctx.lang
  });

  return {
    status: "ok",
    rota: "humano",
    ticketId,
    mensagem: "Sua solicitação foi encaminhada para atendimento humano.",
    proximo_passo: "fila_humana"
  };
}


        const ia = sacIAResponderLowCost_(ctx);

        const custoIA = IA_COSTO_POR_CHAMADA_USD;

sacRegistrarMetricas_({
  ticketId,
  categoria: ctx.categoria,
  rota: "ia_low",
  ia_usada: true,
  status: ia.status,
  custo: custoIA,
  tokens: 500,
  lang: ctx.lang
});


        return {
          status: ia.status,
          rota: ia.status === "ok" ? "ia_low" : "humano",
          ticketId,
          mensagem: ia.resposta || "Sua solicitação foi encaminhada para atendimento humano.",
          proximo_passo:
            ia.status === "ok"
              ? "respondido_por_ia"
              : "fila_humana"
        };
      }





    case "humano":

    sacRegistrarMetricas_({
  ticketId,
  categoria: ctx.categoria,
  rota: "humano",
  ia_usada: false,
  status: "fila_humana",
  custo: 0,
  tokens: 0,
  lang: ctx.lang
});




      return {
        status: "ok",
        rota: "humano",
        ticketId,
        mensagem: "Sua solicitação foi encaminhada para atendimento humano.",
        proximo_passo: "fila_humana"
      };

    default:
      return {
        status: "error",
        rota: "desconhecida",
        ticketId,
        mensagem: "Não foi possível classificar sua solicitação."
      };
  }
}

function gerarTicketSAC_() {
  const ts = Utilities.formatDate(new Date(), "GMT-3", "yyyyMMdd-HHmmss");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SAC-${ts}-${rand}`;
}

function registrarSACLog_(entry) {
  try {
    const ss = SpreadsheetApp.getActive();
    let sh = ss.getSheetByName("SAC_LOG");

    if (!sh) {
      sh = ss.insertSheet("SAC_LOG");
      sh.appendRow([
        "Timestamp",
        "TicketId",
        "AlunoId",
        "Categoria",
        "Mensagem",
        "Severidade",
        "Rota",
        "Origem",
        "Pagina"
      ]);
    }

    sh.appendRow([
      entry.timestamp,
      entry.ticketId,
      entry.id,
      entry.categoria,
      entry.mensagem,
      entry.severidade,
      entry.rota,
      entry.origem,
      entry.pagina
    ]);
  } catch (e) {
    Logger.log("⚠️ Falha ao registrar SAC_LOG: " + e);
  }
}

function mensagemAutoPadrao_(categoria) {
  const map = {
    login: "Verifique seu e-mail e senha e tente novamente.",
    treino: "Seu treino é atualizado automaticamente ao acessar o app.",
    pagamento: "Pagamentos podem levar alguns minutos para sincronizar.",
    outro: "Obrigado por nos avisar. Estamos atentos."
  };

  return map[categoria] || "Recebemos sua solicitação.";
}
function getOpenAIKey_() {
  const key = PropertiesService
    .getScriptProperties()
    .getProperty("OPENAI_API_KEY");

  if (!key) {
    throw new Error("OPENAI_API_KEY não configurada");
  }
  return key;
}

function buildPromptLowCost_(ctx) {
  return `
Você é o suporte do app FemFlow.
Responda de forma curta, clara e prática.

Categoria: ${ctx.categoria}
Problema: ${ctx.descricao}

Regras:
- Responda em até 3 frases
- Não peça dados pessoais
- Não invente funções
- Se não souber, diga que será encaminhado

Resposta:
`;

}
function sacIAResponderLowCost_(ctx) {
  const apiKey = getOpenAIKey_();
  const prompt = buildPromptLowCost_(ctx);

  const cache = CacheService.getScriptCache();
const cacheKey = "sac_ia_" + sacHashCtx_(ctx);

const cached = cache.get(cacheKey);
if (cached) {
  return JSON.parse(cached);
}


  const payload = {
    model: "gpt-4o-mini", // 🔑 mais barato hoje
    messages: [
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 120
  };

  try {
    const response = UrlFetchApp.fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "post",
        contentType: "application/json",
        headers: {
          Authorization: "Bearer " + apiKey
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      }
    );

    const json = JSON.parse(response.getContentText());

    const texto =
      json?.choices?.[0]?.message?.content?.trim();

    if (!texto) {
      throw new Error("Resposta vazia da IA");
    }
   cache.put(
  cacheKey,
  JSON.stringify({
    status: "ok",
    resposta: msg.trim()
  }),
  60 * 60 * 24 // 24 horas
);


    return {
      status: "ok",
      rota: "ia_low",
      resposta: texto
    };

  } catch (e) {
    Logger.log("❌ Erro IA LowCost: " + e);

    return {
      status: "fallback",
      rota: "humano",
      resposta: "Não consegui analisar agora. Vamos encaminhar para suporte humano."
    };
  }
}
/**
 * =========================================================
 * 🤖 SAC — IA LOW COST (1 chamada, resposta curta)
 * =========================================================
 */
function sacIA_LowCost_(ctx) {
  const apiKey = getOpenAIKey_();

  const lang = ctx.lang || "pt";

const idiomaMap = {
  pt: "Responda em português claro.",
  en: "Respond in clear English.",
  fr: "Répondez en français clair."
};

const prompt = `
You are the technical support assistant for the FemFlow app.

Context:
- Category: ${ctx.categoria}
- Page: ${ctx.pagina || "unknown"}
- User message: ${ctx.descricao}

${idiomaMap[lang] || idiomaMap.pt}

Rules:
- Maximum 3 sentences
- Be objective
- If unsure, advise waiting for human support
`;


  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Você é um atendente técnico objetivo." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: 120
  };

  const response = UrlFetchApp.fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  const raw = response.getContentText();
  const json = JSON.parse(raw);

  if (!json.choices || !json.choices.length) {
    return {
      status: "error",
      mensagem: "Não foi possível analisar sua solicitação no momento."
    };
  }

  return {
    status: "ok",
    resposta: json.choices[0].message.content.trim()
  };
}

function testeSAC_IA_LowCost() {
  const ctx = {
    id: "teste123",
    categoria: "treino",
    descricao: "Meu treino não apareceu hoje",
    pagina: "treino.html",
    origem: "app",
    deviceId: "dev-test",
    sessionToken: "sess-test"
  };

  const resp = sacOrquestrador_(ctx);
  Logger.log(resp);
}

function sacHashCtx_(ctx) {
  const base = [
    ctx.categoria || "",
    ctx.lang || "pt",
    (ctx.descricao || "").toLowerCase().trim()
  ].join("|");

  return Utilities.base64Encode(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      base
    )
  );
}
function isSACIAEnabled_() {
  const v = PropertiesService
    .getScriptProperties()
    .getProperty("SAC_IA_ENABLED");

  return String(v).toLowerCase() === "true";
}

function sacRegistrarDashboard_(data) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName("SAC_DASHBOARD");

  if (!sh) {
    sh = ss.insertSheet("SAC_DASHBOARD");
    sh.appendRow([
      "timestamp",
      "ticketId",
      "alunaId",
      "categoria",
      "severidade",
      "rota",
      "status",
      "mensagem",
      "origem",
      "pagina",
      "lang"
    ]);
  }

  sh.appendRow([
    new Date(),
    data.ticketId,
    data.id || "",
    data.categoria || "",
    data.severidade || "",
    data.rota || "",
    data.status || "",
    data.mensagem || "",
    data.origem || "",
    data.pagina || "",
    data.lang || "pt"
  ]);
}
function sacRegistrarMetricas_(data) {
  const sh = ensureSheet_("SAC_Metrics", [
    "Data",
    "TicketId",
    "Categoria",
    "Rota",
    "IA_Usada",
    "Status",
    "Tokens",
    "CustoUSD",
    "Lang"
  ]);

  sh.appendRow([
    new Date(),
    data.ticketId || "",
    data.categoria || "",
    data.rota || "",
    data.ia_usada ? "sim" : "nao",
    data.status || "",
    data.tokens || 0,
    data.custo || 0,
    data.lang || "pt"
  ]);
}
function sacCalcularCustoIA_(periodo) {
  const sh = SpreadsheetApp.getActive().getSheetByName("SAC_Metrics");
  if (!sh) return 0;

  const hoje = new Date();
  const rows = sh.getDataRange().getValues().slice(1);

  let total = 0;

  rows.forEach(r => {
    const data = new Date(r[0]);
    const custo = Number(r[7]) || 0;

    if (periodo === "diario") {
      if (data.toDateString() === hoje.toDateString()) {
        total += custo;
      }
    }

    if (periodo === "mensal") {
      if (
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      ) {
        total += custo;
      }
    }
  });

  return total;
}


function podeUsarSACIA_() {
  const props = PropertiesService.getScriptProperties();

  if (props.getProperty("SAC_IA_ENABLED") !== "true") return false;

  const limiteDiario = Number(props.getProperty("SAC_IA_CUSTO_DIARIO_MAX_USD")) || 0;
  const limiteMensal = Number(props.getProperty("SAC_IA_CUSTO_MENSAL_MAX_USD")) || 0;

  const custoHoje = sacCalcularCustoIA_("diario");
  const custoMes  = sacCalcularCustoIA_("mensal");

  if (limiteDiario && custoHoje >= limiteDiario) return false;
  if (limiteMensal && custoMes >= limiteMensal) return false;

  return true;
}
function sacLogGovernanca_(info) {
  const sh = ensureSheet_("SAC_Governanca", [
    "Data",
    "TicketId",
    "Motivo",
    "CustoHoje",
    "CustoMes"
  ]);

  sh.appendRow([
    new Date(),
    info.ticketId,
    info.motivo,
    info.custoHoje,
    info.custoMes
  ]);
}
