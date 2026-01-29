/* ========================================================================
   FEMFLOW — 11_ORQUESTRADOR_HELPERS.gs (VERSÃO FINAL)
   ------------------------------------------------------------------------
   Responsabilidade ÚNICA:
   - Helpers faltantes do orquestrador
   ------------------------------------------------------------------------
   ⚠️ Não renomear funções.
   ------------------------------------------------------------------------
   ✅ Ajuste cirúrgico: suporte header/CSV FemFlow + MaleFlow
   ✅ Proteção: aplicarSerieEspecialBaseOvulatoria_ apenas FemFlow
   ======================================================================== */

function planejarFaseComOpenAI_(fase, nivel, enfaseRaw) {
  const fallback = planoFaseFallback_(fase, nivel, enfaseRaw);

  if (!OPENAI_ENABLED || !SEMANTIC_PLANNER_ENABLED) {
    return fallback;
  }

  const plano = {};
  const estruturas = Object.keys(FEMFLOW_MICROCICLO_CRIATIVO || fallback);

  estruturas.forEach(estrutura => {
    const cfg = FEMFLOW_MICROCICLO_CRIATIVO && FEMFLOW_MICROCICLO_CRIATIVO[estrutura];
    const quantidade = Array.isArray(cfg?.intencoes) ? cfg.intencoes.length : 3;
    const ctx = {
      fase,
      nivel,
      enfase: enfaseRaw,
      estrutura
    };

    const intencoes = INTENT_PLANNER_ENABLED
      ? plannerIntencoesOpenAI_(ctx, quantidade)
      : [];

    plano[estrutura] = (intencoes && intencoes.length)
      ? intencoes
      : (fallback[estrutura] || []);
  });

  return plano;
}

function extrairIntencoesDoPlano_(planoFase, estrutura) {
  if (!planoFase) return [];

  const key = String(estrutura || '').toUpperCase();
  const intencoes = planoFase[key];

  return Array.isArray(intencoes) ? intencoes : [];
}

function plannerExerciciosOpenAI_(ctx, quantidade) {
  if (!OPENAI_ENABLED) return [];

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
    return [];
  }

  const vistos = new Set();
  return lista
    .map(nome => String(nome || '').trim())
    .filter(nome => nome && !vistos.has(nome) && vistos.add(nome))
    .map(nome => ({ titulo_pt: nome }));
}

function salvarExerciciosParaEnfase_(ctx, brutos) {
  const lista = Array.isArray(brutos) ? brutos : [];
  if (!lista.length) return;

  const sh = SpreadsheetApp
    .getActive()
    .getSheetByName('EXERCICIOS_PARA_ENFASE');

  if (!sh) {
    Logger.log('[OPENAI] Aba EXERCICIOS_PARA_ENFASE não encontrada.');
    return;
  }

  const estrutura = String(ctx.estrutura || '').toUpperCase();
  const enfase = String(ctx.enfase || '').toLowerCase();
  const dia = Number(ctx.dia || 0);

  const rows = lista.map(ex => ([
    'openai',
    dia,
    estrutura,
    enfase,
    String(ex.titulo_pt || ex.titulo || '').trim(),
    'novo'
  ]));

  if (!rows.length) return;

  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length)
    .setValues(rows);
}

function resolverExercicioPorTitulo_(tituloPt, ctx) {
  const titulo = String(tituloPt || '').trim();
  if (!titulo) return null;

  const base = carregarBaseExercicios_();
  const hit = encontrarHitBase_(titulo, base, ctx?.nivel);

  if (hit) return hit;

  return {
    titulo_pt: titulo,
    titulo_en: '',
    titulo_fr: '',
    link: ''
  };
}

function linkerAplicarBase_(rows) {
  return Array.isArray(rows) ? rows : [];
}

/* ============================================================
   ✅ NOVO: detectar header FemFlow vs MaleFlow
   - Se a aba tiver "ciclo" ou "diatreino", usa header MaleFlow
   - Caso contrário, usa FEMFLOW.CSV_COLS
============================================================ */
function getCSVHeaderForSheet_(sheetOrName) {
  const ss = SpreadsheetApp.getActive();
  const sh = (typeof sheetOrName === 'string')
    ? ss.getSheetByName(String(sheetOrName || '').trim())
    : sheetOrName;

  // default FemFlow
  const fem = (typeof FEMFLOW !== 'undefined' && Array.isArray(FEMFLOW.CSV_COLS)) ? FEMFLOW.CSV_COLS : [];

  if (!sh) return fem;

  // se existir header na planilha, detecta colunas
  const vals = sh.getDataRange().getValues();
  const header = (vals && vals.length) ? vals[0].map(h => String(h || '').trim()) : [];
  const headerLower = header.map(h => h.toLowerCase());

  const hasMale = headerLower.includes('ciclo') || headerLower.includes('diatreino');

  // tenta MALEFLOW.CSV_COLS se existir
  const male = (typeof MALEFLOW !== 'undefined' && Array.isArray(MALEFLOW.CSV_COLS)) ? MALEFLOW.CSV_COLS : null;

  if (hasMale) {
    if (male && male.length) return male;

    // fallback: se não existe MALEFLOW.CSV_COLS, cria baseado no FEMFLOW.CSV_COLS
    // e acrescenta ciclo/diatreino quando necessário
    const base = fem.slice();
    if (!base.includes('ciclo')) base.splice(base.indexOf('enfase') + 1, 0, 'ciclo');
    if (!base.includes('diatreino')) base.splice(base.indexOf('ciclo') + 1, 0, 'diatreino');
    // remove fase/dia se estiver operando male puro? (não removo para não quebrar compat)
    return base;
  }

  return fem;
}

function salvarNaAbaTabela_(p, rows) {
  const destino = p?.destino ? String(p.destino).trim() : '';
  if (!destino) throw new Error('destino obrigatório');
  const isPersonalDestino = /^personal_/i.test(destino);

  const dados = Array.isArray(rows) ? rows : [];

  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(destino);
  if (!sh) sh = ss.insertSheet(destino);

  sh.clearContents();

  // ✅ header dinâmico (FemFlow vs MaleFlow)
  const header = getCSVHeaderForSheet_(sh);
  if (!header || !header.length) return;

  sh.getRange(1, 1, 1, header.length).setValues([header]);

  if (!dados.length) return;

  const values = dados.map(row => header.map(col => {
    const value = row[col];

    // FemFlow: personal enfase vira "personal"
    if (col === 'enfase' && isPersonalDestino) return 'personal';

    return value === undefined || value === null ? '' : value;
  }));

  sh.getRange(2, 1, values.length, header.length).setValues(values);
}

function gerarCSV_(rows) {
  // ✅ tenta detectar header a partir de objeto linha:
  // - se existir ciclo/diatreino usa header male
  // - senão usa fem
  const dados = Array.isArray(rows) ? rows : [];
  const first = dados[0] || {};

  let header = (typeof FEMFLOW !== 'undefined' && Array.isArray(FEMFLOW.CSV_COLS)) ? FEMFLOW.CSV_COLS : [];

  const isMaleRow = (first && (first.ciclo !== undefined || first.diatreino !== undefined));
  if (isMaleRow) {
    const male = (typeof MALEFLOW !== 'undefined' && Array.isArray(MALEFLOW.CSV_COLS)) ? MALEFLOW.CSV_COLS : null;
    if (male && male.length) {
      header = male;
    } else {
      header = header.slice();
      if (!header.includes('ciclo')) header.splice(header.indexOf('enfase') + 1, 0, 'ciclo');
      if (!header.includes('diatreino')) header.splice(header.indexOf('ciclo') + 1, 0, 'diatreino');
    }
  }

  const linhas = [];
  linhas.push(header.join(','));

  dados.forEach(row => {
    const valores = header.map(col => {
      const value = row[col];
      const safe = value === undefined || value === null ? '' : String(value);
      return '"' + safe.replace(/"/g, '""') + '"';
    });
    linhas.push(valores.join(','));
  });

  return linhas.join('\n');
}

function prepararLookupBaseMultilingue_(base) {
  if (!base || !base.list) return { strict: {}, fuzzy: {} };
  if (base._lookupMulti) return base._lookupMulti;

  const strict = {};
  const fuzzy = {};

  base.list.forEach(ex => {
    ['pt', 'en', 'fr'].forEach((campo) => {
      const titulo = String(ex[campo] || '').trim();
      if (!titulo) return;

      const kStrict = normalizaKeyStrict_(titulo);
      const kFuzzy = normalizaKey_(titulo);

      if (kStrict && !strict[kStrict]) strict[kStrict] = ex;
      if (kFuzzy && !fuzzy[kFuzzy]) fuzzy[kFuzzy] = ex;
    });
  });

  base._lookupMulti = { strict, fuzzy };
  return base._lookupMulti;
}

function sugerirMatchOpenAI_(tituloOriginal, candidatos) {
  if (!tituloOriginal) return null;
  if (typeof OPENAI_ENABLED === 'undefined' || OPENAI_ENABLED !== true) return null;

  const lista = Array.isArray(candidatos) ? candidatos : [];
  if (!lista.length) return null;

  const system = {
    role: 'system',
    content: [
      'Você é um assistente que escolhe o melhor match de exercício.',
      'Responda somente com JSON válido no formato:',
      '{"index": 0} ou {"index": null}.',
      'Escolha o índice que mais se aproxima semanticamente do título fornecido.',
      'Considere abreviações e variações locais.'
    ].join(' ')
  };

  const linhas = lista.map((item, idx) => {
    return `${idx}. ${item.pt || ''} | ${item.en || ''} | ${item.fr || ''}`;
  }).join('\n');

  const user = {
    role: 'user',
    content: [
      'Título de origem:',
      tituloOriginal,
      '',
      'Candidatos:',
      linhas
    ].join('\n')
  };

  try {
    const resp = JSON.parse(openaiChat_([system, user], 0));
    const idx = resp && typeof resp.index === 'number' ? resp.index : null;
    if (idx === null || idx < 0 || idx >= lista.length) return null;
    return lista[idx] || null;
  } catch (err) {
    Logger.log('[RELINK_OPENAI][ERRO] ' + err.message);
    return null;
  }
}

function selecionarCandidatosSemanticos_(titulo, base, maximo) {
  if (!titulo || !base || !Array.isArray(base.list)) return [];

  const limpo = limparComplementosSemanticos_(titulo);
  const scored = base.list.map(ex => {
    const pt = String(ex.pt || '').trim();
    const en = String(ex.en || '').trim();
    const fr = String(ex.fr || '').trim();
    const scorePt = pt ? tokenScore_(limpo, pt) : 0;
    const scoreEn = en ? tokenScore_(limpo, en) : 0;
    const scoreFr = fr ? tokenScore_(limpo, fr) : 0;
    return { ex, score: Math.max(scorePt, scoreEn, scoreFr) };
  });

  scored.sort((a, b) => b.score - a.score);

  const limite = Math.max(5, Math.min(Number(maximo) || 20, scored.length));
  return scored.slice(0, limite).map(item => item.ex);
}

function encontrarHitBaseMultilingue_(titulos, base, nivel) {
  const lookup = prepararLookupBaseMultilingue_(base);
  const candidatos = [titulos?.pt, titulos?.en, titulos?.fr]
    .map(t => String(t || '').trim())
    .filter(Boolean)
    .map(titulo => resolverTituloCanonico_(titulo) || titulo);

  for (let i = 0; i < candidatos.length; i++) {
    const titulo = candidatos[i];
    const aliasId = resolverAliasExerciciosId_(titulo);
    if (aliasId && base?.byId && base.byId[aliasId]) {
      return aplicarSubstituicaoPorNivel_(base.byId[aliasId], { nivel, base });
    }
    const kStrict = normalizaKeyStrict_(titulo);
    if (kStrict && lookup.strict[kStrict]) {
      return aplicarSubstituicaoPorNivel_(lookup.strict[kStrict], { nivel, base });
    }

    const kFuzzy = normalizaKey_(titulo);
    if (kFuzzy && lookup.fuzzy[kFuzzy]) {
      return aplicarSubstituicaoPorNivel_(lookup.fuzzy[kFuzzy], { nivel, base });
    }
  }

  if (titulos?.pt) {
    return encontrarHitBase_(titulos.pt, base, nivel);
  }

  const tituloFallback = candidatos[0] || '';
  if (tituloFallback) {
    const lista = selecionarCandidatosSemanticos_(tituloFallback, base, 25);
    const sugestao = sugerirMatchOpenAI_(tituloFallback, lista);
    if (sugestao) {
      return aplicarSubstituicaoPorNivel_(sugestao, { nivel, base });
    }
  }

  return null;
}

function relinkarAba_(nomeAba, nivel) {
  const destino = String(nomeAba || '').trim();
  if (!destino) throw new Error('destino obrigatório');

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(destino);
  if (!sh) throw new Error('Aba não encontrada: ' + destino);

  const range = sh.getDataRange();
  const values = range.getValues();
  if (!values.length || values.length < 2) {
    return { ok: true, message: 'Aba sem dados para relinkar.' };
  }

  const header = values[0].map(h => String(h || '').trim().toLowerCase());
  const col = (name) => header.indexOf(String(name).trim().toLowerCase());

  const idx = {
    titulo_pt: col('titulo_pt'),
    titulo_en: col('titulo_en'),
    titulo_fr: col('titulo_fr'),
    link: col('link')
  };

  const obrigatorias = ['titulo_pt', 'titulo_en', 'titulo_fr', 'link'];
  const faltando = obrigatorias.filter(k => idx[k] === -1);
  if (faltando.length) {
    throw new Error('Aba sem colunas obrigatórias para relinkar: ' + faltando.join(', '));
  }

  const base = carregarBaseExercicios_();
  let atualizados = 0;
  let naoEncontrados = 0;
  const amostraNaoEncontrados = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const titulos = {
      pt: row[idx.titulo_pt],
      en: row[idx.titulo_en],
      fr: row[idx.titulo_fr]
    };

    const hit = encontrarHitBaseMultilingue_(titulos, base, nivel);
    if (!hit) {
      naoEncontrados++;
      logCanonResolver_(
        String(titulos.pt || '').trim() || String(titulos.en || '').trim() || String(titulos.fr || '').trim(),
        null,
        'RELINK_NAO_ENCONTRADO'
      );
      if (amostraNaoEncontrados.length < 20) {
        amostraNaoEncontrados.push({
          linha: i + 1,
          titulo_pt: String(titulos.pt || '').trim(),
          titulo_en: String(titulos.en || '').trim(),
          titulo_fr: String(titulos.fr || '').trim()
        });
      }
      continue;
    }

    row[idx.titulo_pt] = hit.pt || row[idx.titulo_pt];
    row[idx.titulo_en] = hit.en || row[idx.titulo_en];
    row[idx.titulo_fr] = hit.fr || row[idx.titulo_fr];
    row[idx.link] = hit.link || row[idx.link];
    logCanonResolver_(
      String(titulos.pt || '').trim() || String(titulos.en || '').trim() || String(titulos.fr || '').trim(),
      hit.pt || hit.en || hit.fr || hit.id || null,
      'RELINK_MATCH'
    );
    atualizados++;
  }

  range.setValues(values);

  return {
    ok: true,
    destino,
    atualizados,
    nao_encontrados: naoEncontrados,
    amostra_nao_encontrados: amostraNaoEncontrados
  };
}

/* ============================================================
   ✅ Proteção: Série especial é FemFlow (BASE_OVULATORIA)
============================================================ */
function aplicarSerieEspecialBaseOvulatoria_(params) {
  const payload = params || {};
  const serieEspecialAtiva = normalizarSerieEspecialAtiva_(payload.serieEspecialAtiva);
  if (!serieEspecialAtiva) {
    throw new Error('Série especial não ativada.');
  }

  const serieEspecialDiaTipo = normalizarSerieEspecialDiaTipo_(payload.serieEspecialDiaTipo);
  if (!serieEspecialDiaTipo) {
    throw new Error('Informe os dias específicos para série especial.');
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const destino = String(payload.destino || '').trim() || 'BASE_OVULATORIA';
  const sh = ss.getSheetByName(destino);
  if (!sh) throw new Error('Aba não encontrada: ' + destino);

  const range = sh.getDataRange();
  const values = range.getValues();
  if (!values.length || values.length < 2) {
    return { ok: true, message: 'Aba vazia.' };
  }

  const header = values[0].map(h => String(h || '').trim().toLowerCase());
  const col = (name) => header.indexOf(String(name).trim().toLowerCase());

  const idx = {
    tipo: col('tipo'),
    box: col('box'),
    ordem: col('ordem'),
    fase: col('fase'),
    dia: col('dia'),
    titulo_pt: col('titulo_pt'),
    titulo_en: col('titulo_en'),
    titulo_fr: col('titulo_fr'),
    link: col('link'),
    especial: col('especial')
  };

  // ✅ Se não tem fase/dia, essa aba não é FemFlow base
  if (idx.fase === -1 || idx.dia === -1) {
    throw new Error('Série especial disponível apenas para BASE_OVULATORIA (FemFlow).');
  }

  const obrigatorias = ['tipo', 'box', 'ordem', 'fase', 'dia', 'titulo_pt', 'link'];
  const faltando = obrigatorias.filter(k => idx[k] === -1);
  if (faltando.length) {
    throw new Error('Aba sem colunas obrigatórias: ' + faltando.join(', '));
  }

  const regras = Array.isArray(FEMFLOW_SERIES_ESPECIAIS)
    ? FEMFLOW_SERIES_ESPECIAIS
    : [];

  const resultRows = [values[0]];
  let boxesAtualizados = 0;
  let linhasCriadas = 0;

  const diasInfo = {};
  const insercoesPorDia = {};
  Object.keys(serieEspecialDiaTipo).forEach(dia => {
    insercoesPorDia[dia] = [];
  });

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const dia = Number(row[idx.dia]);
    if (!dia) continue;
    if (!diasInfo[dia]) {
      diasInfo[dia] = { lastIndex: i, maxBox: 0, lastTreino: null };
    }
    diasInfo[dia].lastIndex = i;

    if (String(row[idx.tipo] || '').toLowerCase() === 'treino') {
      const boxRaw = String(row[idx.box] || '').trim();
      const boxNum = Number((boxRaw.match(/^(\d+)/) || [])[1]);
      if (boxNum && boxNum > diasInfo[dia].maxBox) {
        diasInfo[dia].maxBox = boxNum;
      }
      diasInfo[dia].lastTreino = row;
    }
  }

  Object.keys(serieEspecialDiaTipo).forEach(diaStr => {
    const dia = Number(diaStr);
    if (!dia || !diasInfo[dia] || !diasInfo[dia].lastTreino) return;

    const tipoDia = String(serieEspecialDiaTipo[dia] || '').toLowerCase();
    const codigoEspecial = resolverSerieEspecialCodigo_(tipoDia, regras);
    if (!codigoEspecial) return;

    const slots = quantidadeSerieEspecial_(codigoEspecial);
    const label = String(codigoEspecial || '').toUpperCase();
    const nextBox = (diasInfo[dia].maxBox || 0) + 1;
    const novoBox = `${nextBox}${label}`;

    const template = diasInfo[dia].lastTreino.slice();
    for (let i = 0; i < slots; i++) {
      const novo = template.slice();
      novo[idx.tipo] = 'treino';
      novo[idx.box] = novoBox;
      novo[idx.ordem] = i + 1;
      novo[idx.titulo_pt] = '-';
      if (idx.titulo_en >= 0) novo[idx.titulo_en] = '-';
      if (idx.titulo_fr >= 0) novo[idx.titulo_fr] = '-';
      if (idx.link >= 0) novo[idx.link] = '-';
      if (idx.especial >= 0) novo[idx.especial] = label;
      insercoesPorDia[dia].push(novo);
      linhasCriadas += 1;
    }
    boxesAtualizados += 1;
  });

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    resultRows.push(row);

    const dia = Number(row[idx.dia]);
    if (!dia || !insercoesPorDia[dia]) continue;

    if (diasInfo[dia] && diasInfo[dia].lastIndex === i) {
      insercoesPorDia[dia].forEach(novo => resultRows.push(novo));
    }
  }

  sh.clearContents();
  sh.getRange(1, 1, resultRows.length, resultRows[0].length).setValues(resultRows);

  return {
    ok: true,
    destino,
    boxes_atualizados: boxesAtualizados,
    linhas_criadas: linhasCriadas
  };
}
