/** =========================================================
 * 🤖 BODY INSIGHT IA (OpenAI Vision)
 * - Não persiste dados
 * - Não altera Firestore
 * - Apenas retorna score/visual
 * ========================================================= */

/**
 * Lê a planilha de controle de uso do Body Insight.
 * Usa Script Property "SPREADSHEET_ID".
 */
function abrirPlanilhaBodyInsight_() {
  const props = PropertiesService.getScriptProperties();
  const spreadsheetId = String(props.getProperty("SPREADSHEET_ID") || "").trim();

  if (!spreadsheetId) {
    throw new Error("SPREADSHEET_ID não configurado nas Script Properties.");
  }

  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * Resolve ambiente priorizando variável global ENV quando existir.
 */
function resolverAmbienteBodyInsight_() {
  if (typeof ENV !== "undefined" && ENV) {
    return String(ENV).trim().toLowerCase();
  }

  const envProperty = PropertiesService
    .getScriptProperties()
    .getProperty("ENV");

  return String(envProperty || "staging").trim().toLowerCase();
}

/**
 * Resolve limite mensal por tipo de plano.
 */
function obterLimiteBodyInsightPorPlano_(tipoPlano) {
  const plano = String(tipoPlano || "free").trim().toLowerCase();
  return plano === "premium" ? 10 : 1;
}

/**
 * Verifica quantos usos de Body Insight a usuária já fez no mês atual.
 *
 * @param {string} userId
 * @param {string} tipoPlano "free" | "premium"
 * @return {{permitido: boolean, countMes: number, limite: number}}
 */
function verificarLimiteBodyInsight_(userId, tipoPlano) {
  try {
    const ss = abrirPlanilhaBodyInsight_();
    const sheet = ss.getSheetByName("body_insight_usage");
    const limite = obterLimiteBodyInsightPorPlano_(tipoPlano);

    if (!sheet) {
      return { permitido: true, countMes: 0, limite: limite };
    }

    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) {
      return { permitido: true, countMes: 0, limite: limite };
    }

    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    const alvoUserId = String(userId || "").trim();
    let countMes = 0;

    for (let i = 1; i < values.length; i += 1) {
      const linha = values[i] || [];
      const linhaUserId = String(linha[0] || "").trim();
      const dataHora = linha[1] instanceof Date ? linha[1] : new Date(linha[1]);
      const status = String(linha[4] || "").trim().toLowerCase();

      if (!linhaUserId || linhaUserId !== alvoUserId) {
        continue;
      }

      if (!(dataHora instanceof Date) || isNaN(dataHora.getTime())) {
        continue;
      }

      if (status !== "permitido") {
        continue;
      }

      if (dataHora.getFullYear() === anoAtual && dataHora.getMonth() === mesAtual) {
        countMes += 1;
      }
    }

    return {
      permitido: countMes < limite,
      countMes: countMes,
      limite: limite
    };
  } catch (err) {
    console.log("❌ verificarLimiteBodyInsight_ falhou:", err);
    return {
      permitido: false,
      countMes: 0,
      limite: obterLimiteBodyInsightPorPlano_(tipoPlano)
    };
  }
}

/**
 * Registra uma tentativa/uso de Body Insight na aba body_insight_usage.
 *
 * Colunas: userId | dataHora | ambiente | tipoPlano | status
 */
function registrarUsoBodyInsight_(userId, tipoPlano, status) {
  try {
    const ss = abrirPlanilhaBodyInsight_();
    let sheet = ss.getSheetByName("body_insight_usage");

    if (!sheet) {
      sheet = ss.insertSheet("body_insight_usage");
      sheet.appendRow(["userId", "dataHora", "ambiente", "tipoPlano", "status"]);
    }

    sheet.appendRow([
      String(userId || "").trim(),
      new Date(),
      resolverAmbienteBodyInsight_(),
      String(tipoPlano || "free").trim().toLowerCase(),
      String(status || "").trim().toLowerCase()
    ]);
  } catch (err) {
    console.log("❌ registrarUsoBodyInsight_ falhou:", err);
  }
}

function analisarBodyInsightIA_(pedido) {
  const props = PropertiesService.getScriptProperties();
  const iaEnabled = String(props.getProperty("SAC_IA_ENABLED") || "").toLowerCase() === "true";

  if (!iaEnabled) {
    return { status: "disabled" };
  }

  const apiKey = String(props.getProperty("OPENAI_API_KEY") || "").trim();
  if (!apiKey) {
    return {
      status: "error",
      message: "Serviço de análise indisponível no momento."
    };
  }

  const userId = String((pedido && pedido.userId) || "").trim();
  const tipoPlano = String((pedido && pedido.tipoPlano) || "free").trim().toLowerCase();
  const photoFrontUrl = String((pedido && pedido.photoFrontUrl) || "").trim();
  const photoSideUrl = String((pedido && pedido.photoSideUrl) || "").trim();

  if (!userId) {
    return {
      status: "error",
      message: "userId é obrigatório."
    };
  }

  if (!photoFrontUrl || !photoSideUrl) {
    return {
      status: "error",
      message: "Envie as fotos frontal e lateral para análise."
    };
  }

  const limiteInfo = verificarLimiteBodyInsight_(userId, tipoPlano);
  if (!limiteInfo.permitido) {
    registrarUsoBodyInsight_(userId, tipoPlano, "limitado");
    return {
      status: "limit_exceeded",
      message: "Você já utilizou sua análise mensal gratuita."
    };
  }

  function sanitizeScore_(value) {
    const num = Number(value);
    if (!isFinite(num)) return 0;
    const clamped = Math.max(0, Math.min(100, Math.round(num)));
    return clamped;
  }

  function sanitizeTrend_(value) {
    const allowed = {
      reducao_gordura: true,
      aumento_massa: true,
      neutro: true
    };
    const normalized = String(value || "")
      .trim()
      .toLowerCase();

    return allowed[normalized] ? normalized : "neutro";
  }

  const requestPayload = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Você é um sistema avançado de análise corporal feminina para acompanhamento fitness."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise as duas imagens (frontal e lateral) e retorne APENAS JSON com definicao_abdomen, definicao_membros_inferiores, simetria_frontal, postura_lateral, projecao_abdominal_lateral, score_visual_geral e tendencia_visual (reducao_gordura | aumento_massa | neutro). Sem explicações, apenas JSON válido."
          },
          {
            type: "image_url",
            image_url: { url: photoFrontUrl }
          },
          {
            type: "image_url",
            image_url: { url: photoSideUrl }
          }
        ]
      }
    ],
    max_tokens: 400
  };

  try {
    const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
      method: "post",
      contentType: "application/json",
      headers: {
        Authorization: "Bearer " + apiKey
      },
      payload: JSON.stringify(requestPayload),
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    const raw = String(response.getContentText() || "");

    if (statusCode < 200 || statusCode >= 300) {
      console.log("❌ body_insight_ia OpenAI error:", statusCode, raw);
      registrarUsoBodyInsight_(userId, tipoPlano, "erro");
      return {
        status: "error",
        message: "Não foi possível concluir a análise visual agora. Tente novamente em instantes."
      };
    }

    let apiJson;
    try {
      apiJson = JSON.parse(raw);
    } catch (parseErr) {
      console.log("❌ body_insight_ia resposta OpenAI não-JSON:", parseErr, raw);
      registrarUsoBodyInsight_(userId, tipoPlano, "erro");
      return {
        status: "error",
        message: "Não foi possível interpretar a resposta da análise visual."
      };
    }

    const content = apiJson
      && apiJson.choices
      && apiJson.choices[0]
      && apiJson.choices[0].message
      && apiJson.choices[0].message.content;

    if (!content) {
      registrarUsoBodyInsight_(userId, tipoPlano, "erro");
      return {
        status: "error",
        message: "Resposta de análise incompleta. Tente novamente."
      };
    }

    let contentText = "";
    if (typeof content === "string") {
      contentText = content;
    } else if (Object.prototype.toString.call(content) === "[object Array]") {
      contentText = content
        .map(function (part) {
          return part && part.text ? String(part.text) : "";
        })
        .join("\n");
    } else {
      contentText = String(content || "");
    }

    const normalized = contentText
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let aiVisual;
    try {
      aiVisual = JSON.parse(normalized);
    } catch (invalidJsonErr) {
      console.log("❌ body_insight_ia JSON inválido da IA:", invalidJsonErr, normalized);
      registrarUsoBodyInsight_(userId, tipoPlano, "erro");
      return {
        status: "error",
        message: "A IA retornou um formato inválido. Tente novamente com fotos mais nítidas."
      };
    }

    const visual = {
      definicao_abdomen: sanitizeScore_(aiVisual.definicao_abdomen),
      definicao_membros_inferiores: sanitizeScore_(aiVisual.definicao_membros_inferiores),
      simetria_frontal: sanitizeScore_(aiVisual.simetria_frontal),
      postura_lateral: sanitizeScore_(aiVisual.postura_lateral),
      projecao_abdominal_lateral: sanitizeScore_(aiVisual.projecao_abdominal_lateral),
      score_visual_geral: sanitizeScore_(aiVisual.score_visual_geral),
      tendencia_visual: sanitizeTrend_(aiVisual.tendencia_visual)
    };

    registrarUsoBodyInsight_(userId, tipoPlano, "permitido");

    return {
      status: "ok",
      visual: visual
    };
  } catch (err) {
    console.log("❌ body_insight_ia falha inesperada:", err);
    registrarUsoBodyInsight_(userId, tipoPlano, "erro");
    return {
      status: "error",
      message: "Falha ao processar a análise visual no momento."
    };
  }
}
