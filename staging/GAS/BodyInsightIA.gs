/** =========================================================
 * 🤖 BODY INSIGHT IA (OpenAI Vision)
 * - Não persiste dados
 * - Não altera Firestore
 * - Apenas retorna score/visual
 * ========================================================= */
function analisarBodyInsightIA_(pedido) {
  const props = PropertiesService.getScriptProperties();
  const enabled = props.getProperty("SAC_IA_ENABLED") === "true";

  if (!enabled) {
    return { status: "disabled" };
  }

  const apiKey = props.getProperty("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada.");
  }

  const userId = pedido && pedido.userId;
  const photoFrontUrl = pedido && pedido.photoFrontUrl;
  const photoSideUrl = pedido && pedido.photoSideUrl;

  if (!userId) {
    throw new Error("userId obrigatório.");
  }

  if (!photoFrontUrl || !photoSideUrl) {
    throw new Error("Fotos obrigatórias.");
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Você é um sistema de análise corporal feminina para acompanhamento fitness."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise as duas imagens (frontal e lateral) e retorne APENAS JSON estruturado com os seguintes campos numéricos (0-100): definicao_abdomen, definicao_membros_inferiores, simetria_frontal, postura_lateral, projecao_abdominal_lateral, score_visual_geral. Inclua também tendencia_visual (reducao_gordura | aumento_massa | neutro). Não escreva texto fora do JSON."
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
    max_tokens: 500
  };

  const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const raw = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error("OpenAI error [" + statusCode + "]: " + raw);
  }

  const result = JSON.parse(raw);
  if (!result.choices || !result.choices.length) {
    throw new Error("Resposta inválida da OpenAI.");
  }

  const content = result.choices[0].message.content;
  const normalized = String(content || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(normalized);
  } catch (err) {
    throw new Error("IA não retornou JSON válido.");
  }

  return {
    status: "ok",
    visual: parsed
  };
}
