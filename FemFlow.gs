const SHEET_ALUNAS = 'Alunas';
const SECURITY_TOKEN = 'Bmc082849$$';
const ciclo_duracao = 28;
const data_inicio = new Date();
const ENABLE_SAC_AI = false;
const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const SAC_SHEET = 'SAC';

function gerarID() {
  const ts = Utilities.formatDate(new Date(), "GMT-3", "yyMMdd");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `FF-${ts}-${rand}`;
}

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = (params.action || '').trim();

  // Validate ID only
  if (!action && params.id) {
    const id = params.id;
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ALUNAS);
    const ids = sheet.getRange(1, 1, sheet.getLastRow(), 1).getValues().flat();
    return _json({ valido: ids.includes(id) });
  }

  // Upgrade via GET
  if (action === 'upgrade') {
    const token = (params.token || '').trim();
    if (token !== SECURITY_TOKEN) {
      _logUpgrade({ id: params.id, nivel: params.nivel, origem: 'GET', status: 'unauthorized' });
      return _json({ error: 'unauthorized' });
    }
    const id = (params.id || '').trim();
    const nivel = (params.nivel || '').trim();
    if (!id || !nivel) {
      return _json({ error: 'missing id or nivel' });
    }
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ALUNAS);
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === id) {
        const row = i + 1;
        sheet.getRange(row, 7).setValue(nivel);
        sheet.getRange(row, 6).setValue(true);
        sheet.getRange(row, 5).setValue(new Date());
        _logUpgrade({ id, nivel, origem: 'GET', status: 'ok' });
        return _json({ status: 'upgraded', id, nivel });
      }
    }
    return _json({ status: 'notfound' });
  }

  return _json({ status: 'ignored' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_ALUNAS);

  if (data.action === 'sac_abrir') {
    const sacSheet = SpreadsheetApp.getActive().getSheetByName(SAC_SHEET) || SpreadsheetApp.getActive().insertSheet(SAC_SHEET);
    if (sacSheet.getLastRow() === 0) {
      sacSheet.appendRow(['Data', 'ID', 'Lang', 'CategoriaUI', 'Mensagem', 'Contexto', 'IA_Ativa', 'IA_Resultado', 'IA_Erro']);
    }

    const payload = {
      lang: data.lang || 'pt',
      categoria_ui: data.categoria_ui || 'outro',
      mensagem: data.mensagem || '',
      contexto: data.contexto || {}
    };

    let aiResult = '';
    let aiError = '';

    if (!shouldUseSACAI(payload)) {
      const contexto = payload.contexto || {};
      if (payload.categoria_ui === 'treino' && contexto.nivel === 'iniciante' && contexto.fase === 'lutea') {
        aiResult = JSON.stringify({
          categoria_final: 'uso_incorreto',
          subcategoria: 'confusao_treino_do_dia',
          gravidade: 1,
          eh_bug: false,
          resposta: {
            pt: 'Seu treino está correto 😊 Em alguns dias do ciclo a intensidade muda.',
            en: 'Your workout is correct 😊 On some cycle days the intensity changes.',
            fr: 'Votre entraînement est correct 😊 Certains jours du cycle, l’intensité change.'
          },
          acao: 'auto'
        });
      }
    } else {
      try {
        const resposta = analisarSACComIA(payload);
        aiResult = resposta ? JSON.stringify(resposta) : '';
      } catch (err) {
        aiError = String(err);
      }
    }

    sacSheet.appendRow([
      new Date(),
      data.id || '',
      payload.lang,
      payload.categoria_ui,
      payload.mensagem,
      JSON.stringify(payload.contexto),
      isSACAIEnabled(),
      aiResult,
      aiError
    ]);

    return _json({ status: 'sac_registrado' });
  }

  if (data.event === 'PURCHASE_APPROVED') {
    const newId = gerarID();
    const email = data.data?.buyer?.email || '';
    const nome = data.data?.buyer?.name || '';
    const product = data.data?.product?.name || '';
    const produtoLower = product.toLowerCase();

    let nivelAcesso = 'transicao_15';
    let slug = '';
    if (produtoLower.includes('gluteo')) {
      slug = 'gluteoi_abc';
    } else if (produtoLower.includes('quadriceps')) {
      slug = 'quadricepsn_abc';
    } else if (produtoLower.includes('ombro')) {
      slug = 'ombroa_abc';
    } else {
      slug = 'geral';
    }

    const link_planilha = `https://carolinebarros1010.github.io/myflowlife/femflow/app/modulos/${nivelAcesso}/${slug}/index.html`;

    sheet.appendRow([newId, nome, email, product, new Date(), true, nivelAcesso, ciclo_duracao, data_inicio, link_planilha]);

    MailApp.sendEmail(
      email,
      'Seu acesso FemFlow',
      `Olá ${nome}!\n\nSeu ID FemFlow: ${newId}\nPrograma: ${product}\n\nAcesse:\n${link_planilha}\n\n\uD83C\uDF38 Bem-vinda ao seu ciclo!`
    );

    _logUpgrade({ id: newId, nivel: nivelAcesso, origem: 'PURCHASE_APPROVED', status: 'ok' });
    return _json({ status: 'ok', id: newId, nivel: nivelAcesso, link_planilha });
  }

  // Register PSE
  if (data.id && data.pse !== undefined) {
    let treinoSheet = SpreadsheetApp.getActive().getSheetByName('Treinos') || SpreadsheetApp.getActive().insertSheet('Treinos');
    if (treinoSheet.getLastRow() === 0) {
      treinoSheet.appendRow(['ID', 'Data', 'Fase', 'DiaPrograma', 'PSE']);
    }
    treinoSheet.appendRow([
      data.id,
      new Date(),
      data.fase || '',
      data.diaPrograma || '',
      data.pse
    ]);
    return _json({ status: 'ok' });
  }

  // Register descanso
  if (data.action === 'descanso' && data.id) {
    const diario = SpreadsheetApp.getActive().getSheetByName('Diario') || SpreadsheetApp.getActive().insertSheet('Diario');
    if (diario.getLastRow() === 0) {
      diario.appendRow(['ID', 'Data', 'Fase', 'Treino', 'Descanso']);
    }
    diario.appendRow([
      data.id,
      new Date(),
      data.fase,
      data.treino,
      true
    ]);
    return _json({ status: 'descanso_registrado' });
  }

  // Recover ID
  if (data.action === 'recuperarID' && data.email && data.nome) {
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const id = values[i][0];
      const nome = (values[i][1] || '').toLowerCase().trim();
      const emailLower = (values[i][2] || '').toLowerCase().trim();
      if (nome.includes(data.nome.toLowerCase().trim()) && emailLower === data.email.toLowerCase().trim()) {
        MailApp.sendEmail(
          data.email,
          'Recuperação de ID FemFlow',
          `Olá ${data.nome},\n\nSeu ID FemFlow é: ${id}\n\nAcesse: https://carolinebarros1010.github.io/myflowlife/femflow/app\n\uD83C\uDF38 Bons treinos!`
        );
        return _json({ status: 'ok', id });
      }
    }
    return _json({ status: 'notfound' });
  }

  // Upgrade manual via POST
  if (data.action === 'upgrade' && data.id && data.nivel) {
    if (data.token !== SECURITY_TOKEN) {
      _logUpgrade({ id: data.id, nivel: data.nivel, origem: 'POST', status: 'unauthorized' });
      return _json({ error: 'unauthorized' });
    }
    const id = data.id.trim();
    const nivel = data.nivel.trim();
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim() === id) {
        const row = i + 1;
        sheet.getRange(row, 7).setValue(nivel);
        sheet.getRange(row, 6).setValue(true);
        sheet.getRange(row, 5).setValue(new Date());
        _logUpgrade({ id, nivel, origem: 'POST', status: 'ok' });
        return _json({ status: 'upgraded', id, nivel });
      }
    }
    _logUpgrade({ id, nivel, origem: 'POST', status: 'notfound' });
    return _json({ status: 'notfound' });
  }

  return _json({ status: 'ignored' });
}

function calcularCiclo(data_inicio, ciclo_duracao = 28) {
  const hoje = new Date();
  const inicio = new Date(data_inicio);
  const diffDias = Math.floor((hoje - inicio) / (1000 * 60 * 60 * 24));
  const diaCiclo = (diffDias % ciclo_duracao) + 1;
  let fase = '';
  if (diaCiclo <= 5) fase = 'menstrual';
  else if (diaCiclo <= 13) fase = 'folicular';
  else if (diaCiclo <= 17) fase = 'ovulatoria';
  else fase = 'lutea';
  return { diaCiclo, fase };
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function isSACAIEnabled() {
  const prop = PropertiesService.getScriptProperties().getProperty('ENABLE_SAC_AI');
  if (prop === null) return ENABLE_SAC_AI;
  return prop === 'true';
}

function shouldUseSACAI(payload) {
  if (!isSACAIEnabled()) return false;
  if (!payload || !payload.mensagem || !String(payload.mensagem).trim()) return false;
  const contexto = payload.contexto || {};
  if (payload.categoria_ui === 'treino' && contexto.nivel === 'iniciante' && contexto.fase === 'lutea') {
    return false;
  }
  return true;
}

function analisarSACComIA(payload) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY ausente em Script Properties');
  }

  const systemPrompt = [
    'Você é um classificador técnico de SAC do aplicativo FemFlow.',
    '',
    'Sua função é:',
    '- Classificar relatos de suporte',
    '- Identificar se é bug real ou uso incorreto',
    '- Definir gravidade (1 a 5)',
    '- Sugerir resposta curta',
    '',
    'Formato obrigatório:',
    '{"categoria_final":"uso_incorreto|bug|duvida|acesso","subcategoria":"string_curta","gravidade":1,"eh_bug":false,"resposta":{"pt":"Mensagem curta","en":"Short message","fr":"Message courte"},"acao":"auto|humano"}',
    '',
    'Responda SOMENTE em JSON válido.',
    'Não escreva texto fora do JSON.',
    'Seja objetivo.'
  ].join('\n');

  const userPrompt = {
    lang: payload.lang,
    categoria_ui: payload.categoria_ui,
    mensagem: payload.mensagem,
    contexto: payload.contexto
  };

  const body = {
    model: OPENAI_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userPrompt) }
    ]
  };

  const response = UrlFetchApp.fetch(OPENAI_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });

  const responseText = response.getContentText();
  const data = JSON.parse(responseText);
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`Resposta IA inválida: ${responseText}`);
  }

  try {
    return JSON.parse(content);
  } catch (err) {
    return {
      erro_parse: true,
      resposta_bruta: content
    };
  }
}
