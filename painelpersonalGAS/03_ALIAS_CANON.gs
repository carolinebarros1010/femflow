/** ================================
 *  ALIAS + CANONIZAÇÃO SEMÂNTICA (VERSÃO FINAL)
 *  ================================ */

// ================================
// LOG DE CANONIZAÇÃO
// ================================
function logCanonResolver_(tituloOriginal, tituloCanonico, origem) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName('CANON_RESOLVER_LOG');
    if (!sh) {
      sh = ss.insertSheet('CANON_RESOLVER_LOG');
      sh.appendRow(['data', 'titulo_original', 'titulo_canonico', 'origem']);
    }

    sh.appendRow([
      new Date(),
      tituloOriginal,
      tituloCanonico || 'NAO_ENCONTRADO',
      origem
    ]);
  } catch (e) {
    Logger.log('[CANON_LOG][ERRO] ' + e.message);
  }
}

// ================================
// SALVAR ALIAS APRENDIDO (sheet local simples)
// ================================
function salvarAliasAprendido_(original, canonico) {
  if (!original || !canonico) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('EXERCISE_ALIASES');
  if (!sh) {
    sh = ss.insertSheet('EXERCISE_ALIASES');
    sh.appendRow(['alias', 'canonico']);
  }

  const aliasKey = normalizaKey_(original);
  const vals = sh.getDataRange().getValues().slice(1);
  const existe = vals.some(r => normalizaKey_(r[0]) === aliasKey);

  if (!existe) {
    sh.appendRow([original, canonico]);
  }
}

// ================================
// ALIASES HARDCODE (fallback)
// ================================
const EXERCISE_ALIASES = {
  'agachamento': [
    'agachamento livre',
    'agachamento barra',
    'agachamento tradicional'
  ],
  'levantamento terra': [
    'terra',
    'deadlift',
    'levantamento terra convencional'
  ],
  'stiff': [
    'stiff romeno',
    'romeno',
    'deadlift romeno'
  ],
  'puxada': [
    'puxada frente',
    'pulldown',
    'lat pulldown'
  ]
};

let ALIAS_LOOKUP = null;                 // hardcode alias -> canonTitle
let ALIASES_EXERCICIOS_LOOKUP = null;    // sheet alias -> id
let EXERCISE_ALIASES_SHEET_LOOKUP = null;// sheet alias -> canonTitle

// ================================
// BUILD LOOKUP (hardcode)
// ================================
function buildAliasLookup_() {
  if (ALIAS_LOOKUP) return ALIAS_LOOKUP;

  ALIAS_LOOKUP = {};
  for (const canonTitle in EXERCISE_ALIASES) {
    const baseKey = normalizaKey_(canonTitle);
    ALIAS_LOOKUP[baseKey] = canonTitle;

    (EXERCISE_ALIASES[canonTitle] || []).forEach(alt => {
      const altKey = normalizaKey_(alt);
      ALIAS_LOOKUP[altKey] = canonTitle;
    });
  }

  return ALIAS_LOOKUP;
}

// ================================
// BUILD LOOKUP (sheet ALIASES_EXERCICIOS) alias -> id
// ================================
function buildAliasesExerciciosLookup_() {
  if (ALIASES_EXERCICIOS_LOOKUP) return ALIASES_EXERCICIOS_LOOKUP;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('ALIASES_EXERCICIOS');

  ALIASES_EXERCICIOS_LOOKUP = {};
  if (!sh) return ALIASES_EXERCICIOS_LOOKUP;

  const values = sh.getDataRange().getValues();
  if (!values.length) return ALIASES_EXERCICIOS_LOOKUP;

  const header = values[0].map(h => String(h || '').trim().toLowerCase());

  const colAny_ = (cands) => {
    const arr = Array.isArray(cands) ? cands : [cands];
    for (let i = 0; i < arr.length; i++) {
      const idx = header.indexOf(String(arr[i]).trim().toLowerCase());
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idxId = colAny_(['id', 'exercise_id', 'exercicio_id']);
  const idxAlias = colAny_(['alias', 'apelido', 'titulo', 'título']);

  if (idxId < 0 || idxAlias < 0) return ALIASES_EXERCICIOS_LOOKUP;

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = String(row[idxId] || '').trim();
    const alias = String(row[idxAlias] || '').trim();
    if (!id || !alias) continue;

    const key = normalizaKey_(alias);
    if (!key) continue;

    if (!ALIASES_EXERCICIOS_LOOKUP[key]) {
      ALIASES_EXERCICIOS_LOOKUP[key] = id;
    }
  }

  return ALIASES_EXERCICIOS_LOOKUP;
}

// ================================
// BUILD LOOKUP (sheet EXERCISE_ALIASES) alias -> canonTitle
// ================================
function buildExerciseAliasesSheetLookup_() {
  if (EXERCISE_ALIASES_SHEET_LOOKUP) return EXERCISE_ALIASES_SHEET_LOOKUP;

  EXERCISE_ALIASES_SHEET_LOOKUP = {};

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('EXERCISE_ALIASES');
  if (!sh) return EXERCISE_ALIASES_SHEET_LOOKUP;

  const values = sh.getDataRange().getValues();
  if (!values.length) return EXERCISE_ALIASES_SHEET_LOOKUP;

  // header esperado: alias | canonico
  for (let i = 1; i < values.length; i++) {
    const alias = String(values[i][0] || '').trim();
    const canon = String(values[i][1] || '').trim();
    if (!alias || !canon) continue;

    const key = normalizaKey_(alias);
    if (!key) continue;

    if (!EXERCISE_ALIASES_SHEET_LOOKUP[key]) {
      EXERCISE_ALIASES_SHEET_LOOKUP[key] = canon;
    }
  }

  return EXERCISE_ALIASES_SHEET_LOOKUP;
}

// ✅ helper: resetar cache manualmente (útil em dev)
function resetAliasesCache_() {
  ALIAS_LOOKUP = null;
  ALIASES_EXERCICIOS_LOOKUP = null;
  EXERCISE_ALIASES_SHEET_LOOKUP = null;
}

// ================================
// RESOLUÇÃO DE ALIAS (hardcode) => canonTitle
// ================================
function resolverAlias_(titulo) {
  if (!titulo) return null;
  const key = normalizaKey_(titulo);
  const lookup = buildAliasLookup_();
  return lookup[key] || null;
}

// ================================
// RESOLUÇÃO DE ALIAS (sheet EXERCISE_ALIASES) => canonTitle
// ================================
function resolverAliasSheetCanonico_(titulo) {
  if (!titulo) return null;
  const key = normalizaKey_(titulo);
  if (!key) return null;

  const lookup = buildExerciseAliasesSheetLookup_();
  return lookup[key] || null;
}

// ================================
// RESOLUÇÃO DE ALIAS (sheet ALIASES_EXERCICIOS) => id
// ================================
function resolverAliasExerciciosId_(titulo) {
  if (!titulo) return null;
  const key = normalizaKey_(titulo);
  if (!key) return null;
  const lookup = buildAliasesExerciciosLookup_();
  return lookup[key] || null;
}

// ================================
// RESOLUÇÃO CANÔNICA DE TÍTULO (canonTitle)
// ================================
function resolverTituloCanonico_(tituloGerado) {
  if (!tituloGerado) return null;

  // 1) tenta sheet EXERCISE_ALIASES (aprendidos) — prioridade sobre hardcode
  const sheetCanon = resolverAliasSheetCanonico_(tituloGerado);
  if (sheetCanon) return sheetCanon;

  // 2) tenta hardcode (canon por título)
  const alias = resolverAlias_(tituloGerado);
  if (alias) return alias;

  // 3) fallback: normalização leve
  return String(tituloGerado).trim();
}

/* ============================================================
   ✅ IMPLEMENTAÇÃO: resolverCanonicoIdOpenAI_
   - Compatível com chamadas antigas:
     - resolverCanonicoIdOpenAI_(titulo)
     - resolverCanonicoIdOpenAI_(titulo, base)
   - NÃO usa OpenAI. Usa ALIASES_EXERCICIOS e título canônico.
============================================================ */
function resolverCanonicoIdOpenAI_(tituloGerado, base) {
  const titulo = String(tituloGerado || '').trim();
  if (!titulo) return null;

  // 1) ALIASES_EXERCICIOS (sheet) => id direto (mais forte)
  const idFromSheet = resolverAliasExerciciosId_(titulo);
  if (idFromSheet) {
    // se a base foi passada e conhece o id, ótimo; se não, ainda retorna id.
    logCanonResolver_(titulo, idFromSheet, 'ALIAS_SHEET_ID');
    return idFromSheet;
  }

  // 2) resolver título canônico (sheet EXERCISE_ALIASES + hardcode)
  const canonTitle = resolverTituloCanonico_(titulo);

  // 3) se temos base canônica, tenta mapear canonTitle -> id
  if (base && base.byFuzzy && base.byStrict) {
    const kStrict = normalizaKeyStrict_(canonTitle);
    if (kStrict && base.byStrict[kStrict] && base.byStrict[kStrict].id) {
      logCanonResolver_(titulo, base.byStrict[kStrict].id, 'CANON_STRICT_TO_ID');
      return base.byStrict[kStrict].id;
    }

    const kFuzzy = normalizaKey_(canonTitle);
    if (kFuzzy && base.byFuzzy[kFuzzy] && base.byFuzzy[kFuzzy].id) {
      logCanonResolver_(titulo, base.byFuzzy[kFuzzy].id, 'CANON_FUZZY_TO_ID');
      return base.byFuzzy[kFuzzy].id;
    }
  }

  // 4) fallback: se não temos base, não inventa id
  logCanonResolver_(titulo, null, 'CANON_ID_NAO_RESOLVIDO');
  return null;
}

// ================================
// IMPORTAÇÃO DE ALIASES DO LOG
// ================================
function importarAliasesDoCanonLog_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const log = ss.getSheetByName('CANON_RESOLVER_LOG');
  if (!log) return;

  let aliasesSh = ss.getSheetByName('EXERCISE_ALIASES');
  if (!aliasesSh) {
    aliasesSh = ss.insertSheet('EXERCISE_ALIASES');
    aliasesSh.appendRow(['alias', 'canonico']);
  }

  const logVals = log.getDataRange().getValues().slice(1);
  const aliasVals = aliasesSh.getDataRange().getValues().slice(1);

  const aliasSet = new Set(aliasVals.map(r => normalizaKey_(r[0])));

  let novos = 0;

  logVals.forEach(r => {
    const original = r[1];
    const canonico = r[2];
    const origem = r[3];

    if (
      original &&
      canonico &&
      canonico !== 'NAO_ENCONTRADO' &&
      origem === 'OPENAI_ID'
    ) {
      const key = normalizaKey_(original);
      if (!aliasSet.has(key)) {
        aliasesSh.appendRow([original, canonico]);
        aliasSet.add(key);
        novos++;
      }
    }
  });

  Logger.log(`[ALIAS_IMPORT] ${novos} novos aliases importados`);

  resetAliasesCache_();
  return { ok: true, novos };
}

/* ============================================================
   ✅ AUDITORIA: aliases x base
   - Verifica:
     - aliases com ID inexistente na base
     - aliases duplicados (mesmo alias apontando IDs diferentes)
     - amostra de problemas
============================================================ */
function auditarAliases_(limiteAmostra) {
  const base = carregarBaseExercicios_(); // vem do 02
  const lookupId = buildAliasesExerciciosLookup_();
  const lookupCanonSheet = buildExerciseAliasesSheetLookup_();

  const amostra = Math.max(10, Math.min(Number(limiteAmostra) || 30, 200));

  let totalAliasId = 0;
  let missingInBase = 0;

  const amostraMissing = [];
  Object.keys(lookupId).forEach(k => {
    totalAliasId++;
    const id = lookupId[k];
    if (!id || !base.byId || !base.byId[id]) {
      missingInBase++;
      if (amostraMissing.length < amostra) {
        amostraMissing.push({ alias_key: k, id });
      }
    }
  });

  // Auditoria: EXERCISE_ALIASES (alias -> canonTitle) que não bate em base
  let totalAliasCanon = 0;
  let canonNaoResolveuId = 0;
  const amostraCanonFail = [];

  Object.keys(lookupCanonSheet).forEach(k => {
    totalAliasCanon++;
    const canonTitle = lookupCanonSheet[k];
    const id = resolverCanonicoIdOpenAI_(canonTitle, base);
    if (!id) {
      canonNaoResolveuId++;
      if (amostraCanonFail.length < amostra) {
        amostraCanonFail.push({ alias_key: k, canonico: canonTitle });
      }
    }
  });

  const out = {
    ok: true,
    total_aliases_id_sheet: totalAliasId,
    aliases_id_missing_in_base: missingInBase,
    amostra_missing_in_base: amostraMissing,

    total_aliases_canon_sheet: totalAliasCanon,
    canon_titles_sem_id_na_base: canonNaoResolveuId,
    amostra_canon_sem_id: amostraCanonFail
  };

  Logger.log(JSON.stringify(out, null, 2));
  return out;
}
