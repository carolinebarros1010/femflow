/* ========================================================================
   FEMFLOW — PLANNER OPENAI (VERSÃO FINAL)
   ------------------------------------------------------------------------
   ⚠️ Este arquivo concentra TODA a lógica de OpenAI.
   ⚠️ OpenAI NÃO gera treinos, séries, reps ou HIIT.
   ⚠️ OpenAI APENAS seleciona exercícios (nomes crus).
   ⚠️ A lógica semântica e canônica finaliza o treino.
   ======================================================================== */


/** ================================
 *  OPENAI CONFIG
 *  ================================ */
function getOpenAIKey_() {
  const key = PropertiesService
    .getScriptProperties()
    .getProperty('OPENAI_API_KEY');

  if (!key) {
    throw new Error('OPENAI_API_KEY não configurada em Script Properties.');
  }
  return key;
}

function getOpenAIModel_() {
  return (
    PropertiesService
      .getScriptProperties()
      .getProperty('OPENAI_MODEL')
    || 'gpt-4.1-mini'
  );
}


/** ================================
 *  OPENAI CORE
 *  ================================ */
function openaiChat_(messages, temperature) {

  const payload = {
    model: getOpenAIModel_(),
    temperature: (temperature === undefined ? 0.2 : temperature),
    messages
  };

  const resp = UrlFetchApp.fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + getOpenAIKey_()
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  const code = resp.getResponseCode();
  const text = resp.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error('OpenAI error [' + code + ']: ' + text);
  }

  return (
    JSON.parse(text)
      ?.choices?.[0]?.message?.content || ''
  ).trim();
}


/** ================================
 *  PLANNER DE INTENÇÕES (MANTIDO)
 *  ================================ */
function plannerIntencoesOpenAI_(ctx, quantidade) {

  if (!OPENAI_ENABLED) return [];

  const estrutura = String(ctx.estrutura || '').toUpperCase();
  const fase = String(ctx.fase || '').toLowerCase();
  const nivel = String(ctx.nivel || '').toLowerCase();
  const enfase = normalizarEnfaseParaGrupo_(ctx.enfase) || 'outros';

  const regraDia = (
    estrutura === 'A' || estrutura === 'D'
      ? 'SUPERIORES + 1 CORE'
      : estrutura === 'B' || estrutura === 'E'
        ? 'INFERIORES + 1 CORE'
        : 'ÊNFASE SOMENTE'
  );

  const system = {
    role: 'system',
    content: `
Você é um planejador técnico FemFlow.

OBJETIVO:
Gerar APENAS intenções biomecânicas.

FORMATO JSON:
{"intencoes":[{"grupo_principal":"...","subpadrao_movimento":"...","equipamento_preferencial":"..."}]}

REGRAS:
- Gerar exatamente ${quantidade}
- NÃO citar exercícios
- NÃO inventar padrões raros

CONTEXTO:
Estrutura: ${estrutura}
Regra do dia: ${regraDia}
Fase: ${fase}
Nível: ${nivel}
Ênfase: ${enfase}
`
  };

  const user = { role: 'user', content: 'Gerar intenções.' };

  try {
    const data = JSON.parse(openaiChat_([system, user], 0));
    return (data.intencoes || []).slice(0, quantidade);
  } catch {
    return [];
  }
}


/** =====================================================
 *  OPENAI — GERADOR DE EXERCÍCIOS PARA ÊNFASE (OFICIAL)
 *  ===================================================== */
function gerarExerciciosParaEnfaseOpenAI_(ctx, quantidade) {

  if (!OPENAI_ENABLED) {
    Logger.log('[OPENAI][OFF]');
    return;
  }

  const estrutura = String(ctx.estrutura || '').toUpperCase();
  const fase = String(ctx.fase || '').toLowerCase();
  const nivel = String(ctx.nivel || '').toLowerCase();
  const enfase = String(ctx.enfase || '').toLowerCase();
  const dia = Number(ctx.dia);

  const system = {
    role: 'system',
    content: `
Você é um curador técnico de exercícios FemFlow.

OBJETIVO:
Escolher APENAS NOMES DE EXERCÍCIOS.

REGRAS FIXAS:
- NÃO definir séries, reps, tempo, HIIT ou cardio
- NÃO repetir exercícios
- NÃO usar mobilidade como treino
- NÃO exagerar abdômen
- Respeitar biomecânica real (ex: crucifixo inverso = costas)

FORMATO JSON PURO:
{"exercicios":["Exercício 1","Exercício 2"]}

CONTEXTO:
Estrutura: ${estrutura}
Fase: ${fase}
Nível: ${nivel}
Ênfase: ${enfase}
Dia: ${dia}
`
  };

  const user = {
    role: 'user',
    content: `Gerar ${quantidade} exercícios.`
  };

  let lista = [];

  try {
    const resp = JSON.parse(openaiChat_([system, user], 0.2));
    lista = Array.isArray(resp.exercicios) ? resp.exercicios : [];
  } catch (e) {
    Logger.log('[OPENAI][ERRO] ' + e.message);
    return;
  }

  if (!lista.length) return;

  const sh = SpreadsheetApp
    .getActive()
    .getSheetByName('EXERCICIOS_PARA_ENFASE');

  if (!sh) throw new Error('Aba EXERCICIOS_PARA_ENFASE não encontrada.');

  const rows = lista.map(nome => ([
    'openai',        // origem
    dia,             // dia
    estrutura,       // estrutura
    enfase,          // enfase
    String(nome).trim(), // titulo_raw
    'novo'           // status
  ]));

  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length)
    .setValues(rows);
}


/** =====================================================
 *  LEGADO — NÃO UTILIZAR EM PRODUÇÃO
 *  ===================================================== */
// ⚠️ Mantido apenas para compatibilidade histórica
function plannerExerciciosOpenAI_legacy_() {
  Logger.log('plannerExerciciosOpenAI_legacy_ — NÃO UTILIZAR');
}

/** ================================
 *  BODY INSIGHT IA (VISION)
 *  ================================ */
function analisarBodyInsightIA_(pedido) {
  const props = PropertiesService.getScriptProperties();
  const enabled = props.getProperty('SAC_IA_ENABLED') === 'true';

  if (!enabled) {
    return { status: 'disabled' };
  }

  const apiKey = props.getProperty('OPENAI_API_KEY');

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada.');
  }

  const { userId, photoFrontUrl, photoSideUrl } = (pedido || {});

  if (!userId) {
    throw new Error('userId obrigatório.');
  }

  if (!photoFrontUrl || !photoSideUrl) {
    throw new Error('Fotos obrigatórias.');
  }

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Você é um sistema de análise corporal feminina para acompanhamento fitness.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analise as duas imagens (frontal e lateral) e retorne APENAS JSON estruturado com os seguintes campos numéricos (0-100): definicao_abdomen, definicao_membros_inferiores, simetria_frontal, postura_lateral, projecao_abdominal_lateral, score_visual_geral. Inclua também tendencia_visual (reducao_gordura | aumento_massa | neutro). Não escreva texto fora do JSON.'
          },
          {
            type: 'image_url',
            image_url: { url: photoFrontUrl }
          },
          {
            type: 'image_url',
            image_url: { url: photoSideUrl }
          }
        ]
      }
    ],
    max_tokens: 500
  };

  const response = UrlFetchApp.fetch(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Bearer ' + apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    }
  );

  const statusCode = response.getResponseCode();
  const raw = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('OpenAI error [' + statusCode + ']: ' + raw);
  }

  const result = JSON.parse(raw);

  if (!result.choices || !result.choices.length) {
    throw new Error('Resposta inválida da OpenAI.');
  }

  const content = result.choices[0].message.content;

  let parsed;
  const normalized = String(content || '').trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try {
    parsed = JSON.parse(normalized);
  } catch (err) {
    throw new Error('IA não retornou JSON válido.');
  }

  return {
    status: 'ok',
    visual: parsed
  };
}
