function auditarAliasesExercicios_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shAlias = ss.getSheetByName('ALIASES_EXERCICIOS');
  if (!shAlias) throw new Error('Aba ALIASES_EXERCICIOS não encontrada.');

  var base = carregarBaseExercicios_();
  if (!base || !base.byId) throw new Error('Base inválida (carregarBaseExercicios_).');

  var values = shAlias.getDataRange().getValues();
  if (values.length < 2) return { ok: true, message: 'ALIASES_EXERCICIOS vazio.' };

  var header = values[0].map(function(h){ return String(h||'').trim().toLowerCase(); });

  function colAny_(arr) {
    arr = Array.isArray(arr) ? arr : [arr];
    for (var i=0;i<arr.length;i++){
      var idx = header.indexOf(String(arr[i]).trim().toLowerCase());
      if (idx >= 0) return idx;
    }
    return -1;
  }

  var idxId = colAny_(['id','exercise_id','exercicio_id']);
  var idxAlias = colAny_(['alias','apelido','titulo','título']);

  if (idxId < 0 || idxAlias < 0) {
    throw new Error('ALIASES_EXERCICIOS precisa de colunas id e alias.');
  }

  var problemasIdInexistente = [];
  var conflitosAlias = [];
  var sugestoes = [];

  var aliasToId = {}; // normalizado -> id
  var aliasToRow = {}; // normalizado -> row index

  for (var r=1; r<values.length; r++){
    var id = String(values[r][idxId] || '').trim();
    var alias = String(values[r][idxAlias] || '').trim();
    if (!id || !alias) continue;

    var k = normalizaKey_(alias);

    // 1) id existe na base?
    if (!base.byId[id]) {
      problemasIdInexistente.push({ linha: r+1, alias: alias, id: id });
    }

    // 2) alias duplicado com IDs diferentes?
    if (aliasToId[k] && aliasToId[k] !== id) {
      conflitosAlias.push({
        alias: alias,
        linha_a: aliasToRow[k],
        id_a: aliasToId[k],
        linha_b: r+1,
        id_b: id
      });
    } else {
      aliasToId[k] = id;
      aliasToRow[k] = r+1;
    }

    // 3) sugestão: se alias bate com título da base (strict/fuzzy), mas id não bate
    var hit = null;
    var limpo = limparComplementosSemanticos_(alias);
    var ks = normalizaKeyStrict_(limpo);
    if (ks && base.byStrict[ks]) hit = base.byStrict[ks];
    if (!hit) {
      var kf = normalizaKey_(limpo);
      if (kf && base.byFuzzy[kf]) hit = base.byFuzzy[kf];
    }

    if (hit && hit.id && hit.id !== id) {
      sugestoes.push({
        linha: r+1,
        alias: alias,
        id_atual: id,
        id_sugerido: hit.id,
        titulo_base: hit.pt
      });
    }
  }

  return {
    ok: true,
    total: values.length - 1,
    ids_inexistentes: problemasIdInexistente.length,
    conflitos_alias: conflitosAlias.length,
    sugestoes_correcao: sugestoes.length,
    amostra_ids_inexistentes: problemasIdInexistente.slice(0, 25),
    amostra_conflitos: conflitosAlias.slice(0, 25),
    amostra_sugestoes: sugestoes.slice(0, 25)
  };
}
