/* ========================================================================
   FEMFLOW — 09_HTTP_ENDPOINT.gs (VERSÃO FINAL)
   ------------------------------------------------------------------------
   Responsabilidade ÚNICA:
   - Interface HTTP (GET / POST)
   - Montagem de pedido externo
   - Retorno JSON
   ------------------------------------------------------------------------
   ⚠️ NÃO contém lógica de treino
   ⚠️ NÃO contém planner
   ⚠️ NÃO contém resolver
   ------------------------------------------------------------------------
   ✅ Suporta target/app: femflow | maleflow
   ✅ Adiciona actions MaleFlow: gerarbase_male, full_male
   ======================================================================== */

/* ================================
 *  GET ENDPOINT
 * ================================ */
function doGet(e) {
  try {
    const p = (e && e.parameter) ? e.parameter : {};
    const action = String(p.action || '').toLowerCase().trim();

    // target/app (default femflow)
    const target = String(p.app || p.target || 'femflow').toLowerCase().trim();

    // Ping / status
    if (!action) {
      return respostaGet_({
        status: 'online',
        acoes: [
          'gerarbase', 'distribuir30', 'serieespecial', 'gerar30', 'linkar', 'importar', 'full',
          'gerarbase_male', 'full_male'
        ],
        target_default: 'femflow',
        target_received: target
      });
    }

    const pedidoTexto = montarPedidoFromGet_(p);
    let result;

    switch (action) {

      // =========================
      // FemFlow
      // =========================
      case 'gerar30':
        result = gerarFemFlow30Dias(pedidoTexto);
        return respostaGet_({ action, target, result });

      case 'gerarbase':
        result = gerarBaseOvulatoriaSomente_(pedidoTexto);
        return respostaGet_({ action, target, result });

      case 'distribuir30':
        result = distribuirBaseOvulatoriaSomente_(pedidoTexto);
        return respostaGet_({ action, target, result });

      case 'serieespecial':
        result = aplicarSerieEspecialBaseOvulatoria_(p);
        return respostaGet_({ action, target, result });

      case 'linkar':
        if (!p.destino) throw new Error('destino obrigatório');
        result = relinkarAba_(p.destino, p.nivel);
        return respostaGet_({ action, target, result });

      case 'importar':
        if (!p.destino) throw new Error('destino obrigatório');
        result = importarTreinosFEMFLOW_aba(p.destino, { target });
        return respostaGet_({ action, target, result });

      case 'full':
        if (!p.destino) throw new Error('destino obrigatório para pipeline full');
        gerarFemFlow30Dias(pedidoTexto);
        relinkarAba_(p.destino, p.nivel);
        importarTreinosFEMFLOW_aba(p.destino, { target });
        return respostaGet_({ action, target, result: 'Pipeline completo executado: ' + p.destino });

      // =========================
      // MaleFlow
      // =========================
      case 'gerarbase_male':
        // Usa o mesmo pedidoTexto (parse/validar já entende target/ciclo/diatreino)
        result = gerarBaseMaleFlowSomente_(pedidoTexto);
        return respostaGet_({ action, target, result });

      case 'full_male':
        // pipeline male: gera base + importar (destino default BASE_ABCDE se não vier)
        result = gerarBaseMaleFlowSomente_(pedidoTexto);
        // importar usa destino (se não veio, parser/validar define BASE_ABCDE para maleflow)
        const p2 = parsePedido_(pedidoTexto);
        validarPedido_(p2);
        importarTreinosFEMFLOW_aba(p2.destino, { target });
        return respostaGet_({ action, target, result: 'MaleFlow: base gerada e importada: ' + p2.destino });

      case 'list_personal_submissions':
        result = listarPersonalSubmissions_();
        return respostaGet_({ submissions: result });

      case 'get_personal_submission':
        result = obterPersonalSubmission_(p);
        return respostaGet_({ submission: result });

      default:
        throw new Error('action inválida: ' + action);
    }

  } catch (err) {
    return respostaErroGet_(err);
  }
}


/* ================================
 *  POST ENDPOINT
 * ================================ */
function doPost(e) {
  try {
    const merged = mergePostParams_(e);

    // action (body vence query)
    const action = String(
      merged.action ||
      merged.acao ||
      (e && e.parameter && e.parameter.action) ||
      ''
    ).toLowerCase().trim();

    // target/app (default femflow)
    const target = String(
      merged.app ||
      merged.target ||
      (e && e.parameter && (e.parameter.app || e.parameter.target)) ||
      'femflow'
    ).toLowerCase().trim();

    // Debug controlado
    if (!action) {
      return ContentService
        .createTextOutput(JSON.stringify({
          ok: false,
          error: 'action ausente no POST (body/query).',
          target_received: target,
          debug: {
            parameter: e && e.parameter ? e.parameter : null,
            raw: e && e.postData ? e.postData.contents : null,
            mergedKeys: Object.keys(merged || {})
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const pedido = merged.pedidoTexto || merged;
    let result;

    switch (action) {

      // =========================
      // FemFlow
      // =========================
      case 'gerar30':
        result = gerarFemFlow30Dias(pedido);
        return jsonOK_({ step: 'gerar30', target, result });

      case 'gerarbase':
        result = gerarBaseOvulatoriaSomente_(pedido);
        return jsonOK_({ step: 'gerarbase', target, result });

      case 'distribuir30':
        result = distribuirBaseOvulatoriaSomente_(pedido);
        return jsonOK_({ step: 'distribuir30', target, result });

      case 'serieespecial':
        result = aplicarSerieEspecialBaseOvulatoria_(merged);
        return jsonOK_({ step: 'serieespecial', target, result });

      case 'linkar':
        if (!merged.destino) throw new Error('destino obrigatório');
        result = relinkarAba_(merged.destino, merged.nivel);
        return jsonOK_({ step: 'linkar', target, result });

      case 'importar':
        if (!merged.destino) throw new Error('destino obrigatório');
        result = importarTreinosFEMFLOW_aba(merged.destino, { target });
        return jsonOK_({ step: 'importar', target, result });

      // =========================
      // Auth
      // =========================
      case 'login':
        result = autenticarPersonal_(merged);
        return jsonOK_({ step: 'login', target, user: result });

      case 'signup':
        result = cadastrarPersonal_(merged);
        return jsonOK_({ step: 'signup', target, user: result });

      case 'full':
        if (!merged.destino) throw new Error('destino obrigatório para pipeline full');
        gerarFemFlow30Dias(pedido);
        relinkarAba_(merged.destino, merged.nivel);
        importarTreinosFEMFLOW_aba(merged.destino, { target });
        return jsonOK_({ step: 'full', target, result: 'Pipeline completo executado' });

      // =========================
      // MaleFlow
      // =========================
      case 'gerarbase_male':
        result = gerarBaseMaleFlowSomente_(pedido);
        return jsonOK_({ step: 'gerarbase_male', target, result });

      case 'full_male':
        result = gerarBaseMaleFlowSomente_(pedido);
        // valida destino final e importa
        const p2 = parsePedido_(pedido);
        validarPedido_(p2);
        importarTreinosFEMFLOW_aba(p2.destino, { target });
        return jsonOK_({ step: 'full_male', target, result: 'MaleFlow: base gerada e importada: ' + p2.destino });

      // =========================
      // Personal submissions
      // =========================
      case 'submit_personal_treino':
        const submission = parsePostJsonStrict_(e);
        const validated = validarPersonalSubmission_(submission);
        const submissionId = salvarPersonalSubmission_(validated);
        return jsonOK_({ ok: true, submission_id: submissionId });

      case 'review_personal_submission':
        const reviewPayload = parsePostJsonStrict_(e);
        result = revisarPersonalSubmission_(reviewPayload);
        return jsonOK_({
          submission_id: result.submission_id,
          status: result.status
        });

      default:
        throw new Error('action inválida: ' + action);
    }

  } catch (err) {
    return jsonERR_(err);
  }
}


/* ================================
 *  PARSE / MERGE POST
 * ================================ */
function mergePostParams_(e) {
  const query = (e && e.parameter) ? { ...e.parameter } : {};
  const body = parsePostBodyOnly_(e);
  return { ...query, ...body };
}

function parsePostBodyOnly_(e) {
  const raw = (e && e.postData && e.postData.contents != null)
    ? String(e.postData.contents).trim()
    : '';

  if (!raw) return {};

  // JSON
  try {
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object') ? obj : {};
  } catch (err) {}

  // Querystring fallback
  if (raw.includes('=') && raw.includes('&')) {
    return parseQueryString_(raw);
  }

  return {};
}

function parseQueryString_(raw) {
  const output = {};
  String(raw || '')
    .split('&')
    .map(part => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const idx = part.indexOf('=');
      const key = idx >= 0 ? part.slice(0, idx) : part;
      const value = idx >= 0 ? part.slice(idx + 1) : '';
      if (!key) return;
      const decodedKey = decodeURIComponent(key);
      const decodedValue = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
      output[decodedKey] = decodedValue;
    });
  return output;
}

function parsePostJsonStrict_(e) {
  const raw = (e && e.postData && e.postData.contents != null)
    ? String(e.postData.contents).trim()
    : '';

  if (!raw) {
    throw new Error('body JSON ausente');
  }

  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') {
      throw new Error('body JSON inválido');
    }
    return obj;
  } catch (err) {
    throw new Error('body JSON inválido');
  }
}

function validarPersonalSubmission_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('body JSON inválido');
  }

  const autor = payload.autor;
  const nivel = payload.nivel;
  const enfase = payload.enfase;
  const linhas = payload.linhas;

  if (!autor || typeof autor !== 'string') {
    throw new Error('autor obrigatório');
  }

  const niveisValidos = ['iniciante', 'intermediaria', 'avancada'];
  if (!nivel || typeof nivel !== 'string' || !niveisValidos.includes(nivel)) {
    throw new Error('nivel inválido');
  }

  if (!enfase || typeof enfase !== 'string') {
    throw new Error('enfase obrigatória');
  }

  if (!Array.isArray(linhas) || linhas.length === 0) {
    throw new Error('linhas obrigatórias');
  }

  const tiposValidos = ['aquecimento', 'treino', 'hiit', 'cardio_final', 'cardio_intermediario', 'resfriamento'];
  const fasesValidas = ['menstrual', 'folicular', 'ovulatoria', 'lutea'];

  linhas.forEach((linha, index) => {
    if (!linha || typeof linha !== 'object') {
      throw new Error('linha inválida na posição ' + (index + 1));
    }

    const tipo = linha.tipo;
    const box = linha.box;
    const ordem = linha.ordem;
    const fase = linha.fase;
    const dia = linha.dia;
    const tituloPt = linha.titulo_pt;
    const enfaseLinha = linha.enfase;

    if (!tipo || typeof tipo !== 'string' || !tiposValidos.includes(tipo)) {
      throw new Error('tipo inválido na posição ' + (index + 1));
    }

    if (box == null || (typeof box !== 'string' && typeof box !== 'number')) {
      throw new Error('box obrigatório na posição ' + (index + 1));
    }

    if (!Number.isInteger(ordem) || ordem < 1) {
      throw new Error('ordem inválida na posição ' + (index + 1));
    }

    if (!fase || typeof fase !== 'string' || !fasesValidas.includes(fase)) {
      throw new Error('fase inválida na posição ' + (index + 1));
    }

    if (!enfaseLinha || typeof enfaseLinha !== 'string') {
      throw new Error('enfase obrigatória na posição ' + (index + 1));
    }

    if (!Number.isInteger(dia) || dia < 1 || dia > 30) {
      throw new Error('dia inválido na posição ' + (index + 1));
    }

    if (!tituloPt || typeof tituloPt !== 'string' || !tituloPt.trim()) {
      throw new Error('titulo_pt obrigatório na posição ' + (index + 1));
    }
  });

  return payload;
}

function salvarPersonalSubmission_(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'PERSONAL_SUBMISSIONS';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
      'submission_id',
      'created_at',
      'autor',
      'nivel',
      'enfase',
      'status',
      'payload_json'
    ]);
  }

  const submissionId = Utilities.getUuid();
  const createdAt = new Date().toISOString();
  const row = [
    submissionId,
    createdAt,
    payload.autor,
    payload.nivel,
    payload.enfase,
    'pending_review',
    JSON.stringify(payload)
  ];
  sheet.appendRow(row);
  return submissionId;
}

function listarPersonalSubmissions_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PERSONAL_SUBMISSIONS');
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0] || [];
  const headerIndex = headers.reduce((acc, header, idx) => {
    if (header != null && header !== '') {
      acc[String(header).trim()] = idx;
    }
    return acc;
  }, {});

  const campos = ['submission_id', 'created_at', 'autor', 'nivel', 'enfase', 'status'];
  const hasAll = campos.every((campo) => headerIndex[campo] != null);
  if (!hasAll) return [];

  const submissions = values.slice(1)
    .filter((row) => row && row.some(cell => cell !== '' && cell != null))
    .map((row) => ({
      submission_id: String(row[headerIndex.submission_id] || ''),
      created_at: String(row[headerIndex.created_at] || ''),
      autor: String(row[headerIndex.autor] || ''),
      nivel: String(row[headerIndex.nivel] || ''),
      enfase: String(row[headerIndex.enfase] || ''),
      status: String(row[headerIndex.status] || '')
    }));

  submissions.sort((a, b) => {
    const timeA = Date.parse(a.created_at) || 0;
    const timeB = Date.parse(b.created_at) || 0;
    return timeB - timeA;
  });

  return submissions;
}

function obterPersonalSubmission_(params) {
  const submissionId = params && params.submission_id ? String(params.submission_id).trim() : '';
  if (!submissionId) {
    throw new Error('submission_id ausente');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PERSONAL_SUBMISSIONS');
  if (!sheet) {
    throw new Error('planilha inexistente');
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) {
    throw new Error('submission não encontrada');
  }

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0] || [];
  const headerIndex = headers.reduce((acc, header, idx) => {
    if (header != null && header !== '') {
      acc[String(header).trim()] = idx;
    }
    return acc;
  }, {});

  const requiredHeaders = [
    'submission_id',
    'created_at',
    'autor',
    'nivel',
    'enfase',
    'status',
    'payload_json'
  ];
  const hasAllHeaders = requiredHeaders.every((campo) => headerIndex[campo] != null);
  if (!hasAllHeaders) {
    throw new Error('submission não encontrada');
  }

  const matchRow = values.slice(1).find((row) => {
    const value = row[headerIndex.submission_id];
    return String(value || '').trim() === submissionId;
  });

  if (!matchRow) {
    throw new Error('submission não encontrada');
  }

  const payloadRaw = matchRow[headerIndex.payload_json];
  let payloadObj;
  try {
    payloadObj = JSON.parse(String(payloadRaw || '').trim());
  } catch (err) {
    throw new Error('payload_json inválido');
  }

  if (!payloadObj || typeof payloadObj !== 'object') {
    throw new Error('payload_json inválido');
  }

  return {
    submission_id: String(matchRow[headerIndex.submission_id] || ''),
    created_at: String(matchRow[headerIndex.created_at] || ''),
    autor: String(matchRow[headerIndex.autor] || ''),
    nivel: String(matchRow[headerIndex.nivel] || ''),
    enfase: String(matchRow[headerIndex.enfase] || ''),
    status: String(matchRow[headerIndex.status] || ''),
    payload: payloadObj
  };
}

function revisarPersonalSubmission_(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('body JSON inválido');
  }

  const submissionId = payload.submission_id != null
    ? String(payload.submission_id).trim()
    : '';
  if (!submissionId) {
    throw new Error('submission_id ausente');
  }

  const decision = payload.decision != null
    ? String(payload.decision).trim().toLowerCase()
    : '';
  if (!decision || (decision !== 'approved' && decision !== 'rejected')) {
    throw new Error('decisão inválida');
  }

  const admin = payload.admin != null
    ? String(payload.admin).trim()
    : '';
  if (!admin) {
    throw new Error('admin ausente');
  }

  const commentProvided = Object.prototype.hasOwnProperty.call(payload, 'comment');
  const comment = commentProvided ? String(payload.comment || '') : '';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PERSONAL_SUBMISSIONS');
  if (!sheet) {
    throw new Error('submissão não encontrada');
  }

  const lastRow = sheet.getLastRow();
  let lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) {
    throw new Error('submissão não encontrada');
  }

  const headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0] || [];
  const headerIndex = headerRow.reduce((acc, header, idx) => {
    if (header != null && header !== '') {
      acc[String(header).trim()] = idx;
    }
    return acc;
  }, {});

  if (headerIndex.submission_id == null) {
    throw new Error('submissão não encontrada');
  }

  const reviewHeaders = ['reviewed_at', 'reviewed_by', 'review_comment'];
  let headerUpdated = false;
  reviewHeaders.forEach((header) => {
    if (headerIndex[header] == null) {
      headerRow.push(header);
      headerIndex[header] = headerRow.length - 1;
      headerUpdated = true;
    }
  });

  if (headerUpdated) {
    sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    lastCol = headerRow.length;
  }

  const dataValues = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  let matchRowIndex = -1;
  for (let i = 0; i < dataValues.length; i += 1) {
    const value = dataValues[i][headerIndex.submission_id];
    if (String(value || '').trim() === submissionId) {
      matchRowIndex = i + 2;
      break;
    }
  }

  if (matchRowIndex < 0) {
    throw new Error('submissão não encontrada');
  }

  const reviewedAt = new Date().toISOString();
  const statusValue = decision === 'approved' ? 'approved' : 'rejected';

  sheet.getRange(matchRowIndex, headerIndex.status + 1).setValue(statusValue);
  sheet.getRange(matchRowIndex, headerIndex.reviewed_at + 1).setValue(reviewedAt);
  sheet.getRange(matchRowIndex, headerIndex.reviewed_by + 1).setValue(admin);

  if (commentProvided) {
    sheet.getRange(matchRowIndex, headerIndex.review_comment + 1).setValue(comment);
  }

  return {
    submission_id: submissionId,
    status: statusValue
  };
}


/* ================================
 *  HELPERS HTTP
 * ================================ */
function montarPedidoFromGet_(p) {
  const linhas = [];

  // título (não importa pro parser, mas mantém padrão)
  linhas.push('Gerar 30 dias FemFlow');

  if (p.nivel) linhas.push('nivel: ' + p.nivel);
  if (p.enfase) linhas.push('enfase: ' + p.enfase);

  // FemFlow
  if (p.fase) linhas.push('fase inicial: ' + p.fase);

  // ciclo/padrão (serve pros dois)
  if (p.padraoCiclo) linhas.push('padrao_ciclo: ' + p.padraoCiclo);
  if (p.ciclo) linhas.push('ciclo: ' + p.ciclo);
  if (p.diatreino) linhas.push('diatreino: ' + p.diatreino);

  if (p.destino) linhas.push('destino: ' + p.destino);
  if (p.id_aluna) linhas.push('id_aluna: ' + p.id_aluna);

  if (p.app || p.target) linhas.push('target: ' + String(p.app || p.target));

  linhas.push('formato: CSV');
  return linhas.join('\n');
}

function errToObj_(err) {
  const isObj = err && typeof err === 'object';
  return {
    message: isObj ? (err.message || String(err)) : String(err),
    name: isObj ? (err.name || 'Error') : 'Error',
    stack: isObj ? (err.stack || '') : ''
  };
}

function respostaGet_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...obj }, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function respostaErroGet_(err) {
  const e = errToObj_(err);
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      erro: e.message,
      error: e.message,
      message: e.message,
      name: e.name,
      stack: e.stack
    }, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonOK_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, ...obj }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonERR_(err) {
  const msg = (err && err.message) ? err.message : String(err);
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      error: msg,
      erro: msg,
      message: msg,
      name: err && err.name ? err.name : 'Error',
      stack: err && err.stack ? err.stack : ''
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
