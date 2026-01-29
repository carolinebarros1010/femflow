/** ================================
 *  BASE DE EXERCÍCIOS — BANCO_PRO_V2 (VERSÃO FINAL)
 *  ================================ */

function mapearTituloParaId_(base) {
  const map = {};
  (base?.list || []).forEach(ex => {
    if (ex && ex.pt && ex.id) {
      map[normalizaKey_(ex.pt)] = ex.id;
    }
  });
  return map;
}

let __CACHE_BASE_PRO__ = null;

function carregarBaseExercicios_() {
  if (__CACHE_BASE_PRO__) return __CACHE_BASE_PRO__;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(FEMFLOW.BASE_SHEET_NAME);
  if (!sh) throw new Error('Base PRO não encontrada: ' + FEMFLOW.BASE_SHEET_NAME);

  const vals = sh.getDataRange().getValues();
  if (!vals.length) throw new Error('Base PRO vazia');

  const headerRaw = vals.shift();
  const header = headerRaw.map(h => String(h || '').trim().toLowerCase());

  const col = (name) => header.indexOf(String(name).trim().toLowerCase());

  // ✅ novo: achar coluna com variações
  const colAny_ = (candidates) => {
    const arr = Array.isArray(candidates) ? candidates : [candidates];
    for (let i = 0; i < arr.length; i++) {
      const idx = col(arr[i]);
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idx = {
    id: col('id'),
    titulo_pt: colAny_(['titulo_pt', 'título_pt', 'titulo', 'título']),
    titulo_en: colAny_(['titulo_en', 'título_en']),
    titulo_fr: colAny_(['titulo_fr', 'título_fr']),
    link: col('link'),

    nivel_minimo: colAny_(['nivel_minimo', 'nível_mínimo']),
    proibido_iniciante: colAny_(['proibido_iniciante', 'proibido iniciante']),

    sub_iniciante_id: colAny_(['sub_iniciante_id', 'sub_iniciante id']),
    sub_iniciante_titulo_pt: colAny_(['sub_iniciante_titulo_pt', 'sub_iniciante título_pt', 'sub_iniciante_titulo']),
    sub_iniciante_link: colAny_(['sub_iniciante_link', 'sub_iniciante link']),

    grupo_muscular_principal: colAny_([
      'grupo muscular principal',
      'grupo_muscular_principal',
      'grupo muscular_principal',
      'grupomuscularprincipal'
    ]),
    grupo_muscular_secundario: colAny_([
      'grupo muscular secundário',
      'grupo muscular secundario',
      'grupo_muscular_secundario',
      'grupo muscular_secundario',
      'grupomuscularsecundario'
    ]),

    equipamento_categoria: colAny_(['equipamento_categoria', 'equipamento categoria']),
    subpadrao_movimento: colAny_(['subpadrao_movimento', 'subpadrao movimento'])
  };

  if (idx.titulo_pt < 0 || idx.link < 0) {
    throw new Error('Base PRO sem colunas mínimas: titulo_pt/link');
  }

  const byStrict = {};
  const byFuzzy  = {};
  const byId     = {};
  const list     = [];

  vals.forEach(r => {
    const pt = String(r[idx.titulo_pt] || '').trim();
    if (!pt) return;

    const rec = {
      id: (idx.id >= 0) ? String(r[idx.id] || '').trim() : '',
      pt,
      en: (idx.titulo_en >= 0) ? String(r[idx.titulo_en] || '').trim() : '',
      fr: (idx.titulo_fr >= 0) ? String(r[idx.titulo_fr] || '').trim() : '',
      link: String(r[idx.link] || '').trim(),

      nivel_minimo: (idx.nivel_minimo >= 0) ? String(r[idx.nivel_minimo] || '').trim().toLowerCase() : '',
      proibido_iniciante: (idx.proibido_iniciante >= 0) ? !!r[idx.proibido_iniciante] : false,

      sub_iniciante_id: (idx.sub_iniciante_id >= 0) ? String(r[idx.sub_iniciante_id] || '').trim() : '',
      sub_iniciante_titulo_pt: (idx.sub_iniciante_titulo_pt >= 0) ? String(r[idx.sub_iniciante_titulo_pt] || '').trim() : '',
      sub_iniciante_link: (idx.sub_iniciante_link >= 0) ? String(r[idx.sub_iniciante_link] || '').trim() : '',

      grupo_principal_raw: (idx.grupo_muscular_principal >= 0)
        ? String(r[idx.grupo_muscular_principal] || '').trim()
        : '',
      grupo_secundario_raw: (idx.grupo_muscular_secundario >= 0)
        ? String(r[idx.grupo_muscular_secundario] || '').trim()
        : '',

      equipamento_categoria: (idx.equipamento_categoria >= 0)
        ? String(r[idx.equipamento_categoria] || '').trim().toLowerCase()
        : '',
      subpadrao_movimento: (idx.subpadrao_movimento >= 0)
        ? String(r[idx.subpadrao_movimento] || '').trim().toLowerCase()
        : ''
    };

    // ✅ vocabulário padronizado
    rec.grupo_principal = normalizarGrupoMuscular_(rec.grupo_principal_raw);
    rec.grupo_secundario = normalizarGrupoMuscular_(rec.grupo_secundario_raw);

    // ✅ aliases de campos para compatibilidade com o motor (06)
    rec.grupo = rec.grupo_principal;
    rec.subpadrao = rec.subpadrao_movimento;
    rec.equipamento = rec.equipamento_categoria;

    const kStrict = normalizaKeyStrict_(pt);
    const kFuzzy  = normalizaKey_(pt);

    if (kStrict && !byStrict[kStrict]) byStrict[kStrict] = rec;
    if (kFuzzy  && !byFuzzy[kFuzzy])   byFuzzy[kFuzzy] = rec;
    if (rec.id) byId[rec.id] = rec;

    list.push(rec);
  });

  __CACHE_BASE_PRO__ = { byStrict, byFuzzy, byId, list };
  return __CACHE_BASE_PRO__;
}

/**
 * Normaliza grupo muscular da base para o "vocabulário do motor".
 * ✅ alinhado com normalizarEnfaseParaGrupo_ (01_NORMALIZACAO)
 */
function normalizarGrupoMuscular_(txt) {
  if (!txt) return null;

  const t = String(txt || '').toLowerCase();

  if (t.includes('reto abdominal') || t.includes('obliqu') || t.includes('core')) return 'core';
  if (t.includes('gluteo') || t.includes('glúteo')) return 'gluteos';
  if (t.includes('quadr') && t.includes('ceps')) return 'quadriceps';
  if (t.includes('isquiotib') || t.includes('posterior de coxa') || t.includes('posteriores')) return 'isquiotibiais';
  if (t.includes('costas') || t.includes('romboide') || t.includes('dorsal') || t.includes('latissimo')) return 'costas';
  if (t.includes('peito') || t.includes('peitoral')) return 'peito';
  if (t.includes('delt') || t.includes('ombro')) return 'deltoides';
  if (t.includes('bic') || t.includes('bíceps')) return 'biceps';
  if (t.includes('tric') || t.includes('tríceps')) return 'triceps';
  if (t.includes('antebr') || t.includes('antebraço')) return 'antebraco';
  if (t.includes('trapez')) return 'trapezio';
  if (t.includes('gastrocn') || t.includes('soleo') || t.includes('sóleo') || t.includes('panturr')) return 'panturrilha';
  if (t.includes('coluna') || t.includes('lombar')) return 'lombar';
  if (t.includes('adutor')) return 'adutores';
  if (t.includes('mobilidade')) return 'mobilidade';

  return 'outros';
}

/* ============================================================
   ✅ Tokenização real (normalizaKey_ usa "_")
============================================================ */
function tokensFrom_(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_ ]+/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

function tokenScore_(a, b) {
  const A = new Set(tokensFrom_(a));
  const B = new Set(tokensFrom_(b));
  if (!A.size || !B.size) return 0;

  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });

  const uni = A.size + B.size - inter;
  return uni ? (inter / uni) : 0;
}

function tokenMatch_(a, b) {
  const A = new Set(tokensFrom_(a));
  const B = new Set(tokensFrom_(b));
  if (!A.size || !B.size) return 0;

  let inter = 0;
  A.forEach(t => { if (B.has(t)) inter++; });

  return inter / Math.max(A.size, B.size);
}

/* ============================================================
   ✅ Wrapper: compatível com 06_RESOLVER_EXERCICIO
   06 espera aplicarSubstituicaoPorNivel_(hit, ctx)
============================================================ */
function aplicarSubstituicaoPorNivelCompat_(hit, nivel, base, ctxExtra) {
  const ctx = Object.assign({}, ctxExtra || {}, {
    nivel: nivel,
    base: base
  });

  // se o 06 existir, usa ele
  if (typeof aplicarSubstituicaoPorNivel_ === 'function') {
    return aplicarSubstituicaoPorNivel_(hit, ctx) || hit;
  }

  // fallback: sem substituição
  return hit;
}

/* ============================================================
   ENCONTRAR HIT (canônico)
============================================================ */
function encontrarHitBase_(tituloPt, base, nivel) {
  const original = String(tituloPt || '').trim();
  if (!original) return null;

  const limpo = limparComplementosSemanticos_(original);

  // 1) STRICT
  const kStrict = normalizaKeyStrict_(limpo);
  if (kStrict && base.byStrict[kStrict]) {
    const ex = base.byStrict[kStrict];
    logCanonResolver_(original, ex.id, 'STRICT_ID');
    return aplicarSubstituicaoPorNivelCompat_(ex, nivel, base);
  }

  // 2) FUZZY
  const kFuzzy = normalizaKey_(limpo);
  if (kFuzzy && base.byFuzzy[kFuzzy]) {
    const ex = base.byFuzzy[kFuzzy];
    logCanonResolver_(original, ex.id, 'FUZZY_ID');
    return aplicarSubstituicaoPorNivelCompat_(ex, nivel, base);
  }

  // 3) TOKEN MATCH
  for (let i = 0; i < base.list.length; i++) {
    const ex = base.list[i];
    const s = tokenMatch_(limpo, ex.pt);
    if (s >= 0.6) {
      logCanonResolver_(original, ex.id, 'TOKEN_ID');
      return aplicarSubstituicaoPorNivelCompat_(ex, nivel, base);
    }
  }

  // 4) TOKEN SCORE
  let best = null, bestScore = 0;
  for (let i = 0; i < base.list.length; i++) {
    const ex = base.list[i];
    const s = tokenScore_(limpo, ex.pt);
    if (s > bestScore) {
      bestScore = s;
      best = ex;
    }
  }
  if (best && bestScore >= 0.6) {
    logCanonResolver_(original, best.id, 'TOKEN_SCORE_ID');
    return aplicarSubstituicaoPorNivelCompat_(best, nivel, base);
  }

  // 5) OPENAI → ID (compat: 1 parâmetro)
  if (typeof resolverCanonicoIdOpenAI_ === 'function') {
    const idCanonico = resolverCanonicoIdOpenAI_(limpo, base);
    if (idCanonico && base.byId && base.byId[idCanonico]) {
      const ex = base.byId[idCanonico];
      logCanonResolver_(original, idCanonico, 'OPENAI_ID');
      return aplicarSubstituicaoPorNivelCompat_(ex, nivel, base);
    }
  }

  logCanonResolver_(original, null, 'NAO_ENCONTRADO');
  return null;
}

function encontrarHitBaseSemLog_(tituloPt, base) {
  const original = String(tituloPt || '').trim();
  if (!original) return { hit: null, matchType: 'SEM_TITULO', score: 0 };

  const limpo = limparComplementosSemanticos_(original);

  const kStrict = normalizaKeyStrict_(limpo);
  if (kStrict && base.byStrict[kStrict]) {
    return { hit: base.byStrict[kStrict], matchType: 'STRICT_ID', score: 1 };
  }

  const kFuzzy = normalizaKey_(limpo);
  if (kFuzzy && base.byFuzzy[kFuzzy]) {
    return { hit: base.byFuzzy[kFuzzy], matchType: 'FUZZY_ID', score: 1 };
  }

  for (let i = 0; i < base.list.length; i++) {
    const ex = base.list[i];
    const s = tokenMatch_(limpo, ex.pt);
    if (s >= 0.6) {
      return { hit: ex, matchType: 'TOKEN_ID', score: s };
    }
  }

  let best = null, bestScore = 0;
  for (let i = 0; i < base.list.length; i++) {
    const ex = base.list[i];
    const s = tokenScore_(limpo, ex.pt);
    if (s > bestScore) {
      bestScore = s;
      best = ex;
    }
  }
  if (bestScore >= 0.6) {
    return { hit: best, matchType: 'TOKEN_SCORE_ID', score: bestScore };
  }

  return { hit: null, matchType: 'NAO_ENCONTRADO', score: 0 };
}
