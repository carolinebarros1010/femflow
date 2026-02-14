/** =========================================================
 * 🤖 BODY INSIGHT IA (OpenAI Vision)
 * - Não persiste dados
 * - Não altera Firestore
 * - Apenas retorna score/visual
 * ========================================================= */
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

    return {
      status: "ok",
      visual: visual
    };
  } catch (err) {
    console.log("❌ body_insight_ia falha inesperada:", err);
    return {
      status: "error",
      message: "Falha ao processar a análise visual no momento."
    };
  }
}
