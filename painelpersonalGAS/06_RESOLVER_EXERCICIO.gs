/* ========================================================================
   FEMFLOW — 06_RESOLVER_EXERCICIO.gs (VERSÃO FINAL — COMPATÍVEL)
   ------------------------------------------------------------------------
   Coração do sistema:
   - Seleção de exercício por intenção (semântica + canônica)
   - Antirrepetição por histórico recente
   - Ajustes por nível / fase / estrutura
   ------------------------------------------------------------------------
   ✅ Compatível com 02_BASE_EXERCICIOS.gs (aplicarSubstituicaoPorNivel_)
   ✅ Usa equipamento_categoria (base PRO)
   ✅ Fallback interno p/ buildCandidatesSemanticoLocal_ e tituloFallbackPorEnfaseLocal_
   ======================================================================== */

/** Rank simples por nível (quanto maior, mais avançado) */
function nivelRank_(nivel) {
  nivel = String(nivel || '').toLowerCase();
  return ({ iniciante: 1, intermediaria: 2, avancada: 3 }[nivel] || 1);
}

/**
 * Extrai IDs de exercícios usados nos últimos 3 dias (anti-repetição).
 * @param {Array} rows Histórico de linhas (ex: rowsSemana) com campos {tipo,dia,titulo_pt}
 * @param {Object|Array} base Base canônica (array ou objeto {list:[]})
 * @param {String} nivel Nível (iniciante/intermediaria/avancada)
 */
function extrairHistoricoIds3Dias_(rows, base, nivel) {
  return extrairHistoricoIdsNDias_(rows, base, nivel, 3);
}

function extrairHistoricoIdsNDias_(rows, base, nivel, maxDias) {
  if (!Array.isArray(rows) || !rows.length) return [];

  var historicoIds = [];
  var ultimosDias = {};
  var countDias = 0;
  var limite = Number(maxDias || 3);

  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    if (!r || r.tipo !== 'treino') continue;

    var d = r.dia;
    if (d === undefined || d === null || d === '') continue;

    if (!ultimosDias[d]) {
      ultimosDias[d] = true;
      countDias++;
    }

    // tenta resolver o ID do título antigo
    var hit = encontrarHitBase_(r.titulo_pt, base, nivel);
    if (hit && hit.id) historicoIds.push(hit.id);

    if (countDias >= limite) break;
  }

  return historicoIds;
}

/** Só para debug: retorna lista de dias presentes no histórico (últimos N dias com treino). */
function resumirHistorico_(rows, maxDias) {
  if (!Array.isArray(rows) || !rows.length) return [];

  var dias = [];
  var setDias = {};
  var limite = Number(maxDias || 3);

  for (var i = rows.length - 1; i >= 0; i--) {
    var r = rows[i];
    if (!r || r.tipo !== 'treino') continue;

    if (!setDias[r.dia]) {
      setDias[r.dia] = true;
      dias.push(r.dia);
      if (dias.length >= limite) break;
    }
  }

  dias.sort(function (a, b) { return a - b; });
  return dias;
}

/**
 * Score semântico (quanto maior, melhor)
 * Compatível com base PRO:
 * - grupo_principal / grupo
 * - subpadrao_movimento / subpadrao
 * - equipamento_categoria (preferencial) / equipamento (fallback)
 */
function calcularScoreSemantico_(hit, intent, ctx) {
  if (!hit || !intent) return -999;
  ctx = ctx || {};

  var nivel = String(ctx.nivel || '').toLowerCase();
  var fase  = String(ctx.fase  || '').toLowerCase();

  var grupo = String(hit.grupo_principal || hit.grupo || '').toLowerCase();
  var sub   = String(hit.subpadrao_movimento || hit.subpadrao || '').toLowerCase();
  var equip = String(hit.equipamento_categoria || hit.equipamento || '').toLowerCase();

  var g = String(intent.grupo_principal || '').toLowerCase();
  var s = String(intent.subpadrao_movimento || '').toLowerCase();
  var e = String(intent.equipamento_preferencial || '').toLowerCase();

  var score = 0;

  if (g && grupo) {
    if (grupo === g) score += 6;
    else score -= 1;
  }

  if (s && sub) {
    if (sub === s) score += 4;
    else score -= 0.5;
  }

  if (e && equip) {
    if (equip === e) score += 2.5;
    else score -= 0.2;
  }

  // modulador hormonal (bonus/penalidade por equipamento)
  if (typeof FEMFLOW_FASE_MODULADOR !== 'undefined' && FEMFLOW_FASE_MODULADOR) {
    var mod = FEMFLOW_FASE_MODULADOR[fase];
    if (mod) {
      if (mod.bonus && typeof mod.bonus[equip] === 'number') score += mod.bonus[equip];
      if (mod.penalidade && typeof mod.penalidade[equip] === 'number') score += mod.penalidade[equip];
    }
  }

  // segurança para iniciante
  if (nivel === 'iniciante') {
    if (equip === 'barra') score -= 0.8;
    if (equip === 'halteres') score -= 0.2;
    if (equip === 'maquina' || equip === 'polia' || equip === 'smith') score += 0.5;
  }

  if (grupo === 'mobilidade') score -= 3;

  return score;
}

/** Escolhe o melhor dentro do TopK (com opcional randomização controlada) */
function escolherEntreTopK_(cands, topK) {
  var arr = Array.isArray(cands) ? cands.slice() : [];
  if (!arr.length) return null;

  arr.sort(function (a, b) { return (b._score || 0) - (a._score || 0); });

  var k = Math.max(1, Math.min((Number(topK || 1) || 1), arr.length));
  var slice = arr.slice(0, k);

  if (k > 1 && typeof INTENT_RANDOM_PICK_TOPK === 'number' && INTENT_RANDOM_PICK_TOPK > 1) {
    var kk = Math.max(1, Math.min(INTENT_RANDOM_PICK_TOPK, slice.length));
    var idx = Math.floor(Math.random() * kk);
    return slice[idx] || slice[0];
  }

  return slice[0];
}

/* ========================================================================
   ✅ FUNÇÃO COMPATÍVEL (assinatura aceita 2 formatos)
   - aplicarSubstituicaoPorNivel_(hit, ctx)  [novo]
   - aplicarSubstituicaoPorNivel_(hit, nivel, base) [legado usado no 02]
   ======================================================================== */
function aplicarSubstituicaoPorNivel_(hit, a, b) {
  if (!hit) return hit;

  var ctx = {};
  var base = null;

  // formato antigo: (hit, nivel, base)
  if (typeof a === 'string') {
    ctx.nivel = a;
    base = b;
  } else {
    // formato novo: (hit, ctx)
    ctx = a || {};
    base = ctx.base || null;
  }

  var nivel = String(ctx.nivel || '').toLowerCase();
  var fase  = String(ctx.fase  || '').toLowerCase();

  var baseList = (base && base.list && Array.isArray(base.list)) ? base.list : base;
  baseList = Array.isArray(baseList) ? baseList : [];

  var equip = String(hit.equipamento_categoria || hit.equipamento || '').toLowerCase();
  var grupo = String(hit.grupo_principal || hit.grupo || '').toLowerCase();
  var sub   = String(hit.subpadrao_movimento || hit.subpadrao || '').toLowerCase();

  // iniciante: evitar barra quando possível
  if (nivel === 'iniciante' && equip === 'barra' && baseList.length) {
    var preferidos1 = ['smith', 'maquina', 'polia', 'peso_corporal'];
    for (var i = 0; i < preferidos1.length; i++) {
      var eq = preferidos1[i];
      var alt = baseList.find(function (x) {
        return String(x.grupo_principal || x.grupo || '').toLowerCase() === grupo &&
               String(x.subpadrao_movimento || x.subpadrao || '').toLowerCase() === sub &&
               String(x.equipamento_categoria || x.equipamento || '').toLowerCase() === eq;
      });
      if (alt) return alt;
    }
  }

  // menstrual: favorecer máquina/polia/smith
  if (fase === 'menstrual' && equip === 'barra' && baseList.length) {
    var preferidos2 = ['maquina', 'polia', 'smith'];
    for (var j = 0; j < preferidos2.length; j++) {
      var eq2 = preferidos2[j];
      var alt2 = baseList.find(function (x) {
        return String(x.grupo_principal || x.grupo || '').toLowerCase() === grupo &&
               String(x.subpadrao_movimento || x.subpadrao || '').toLowerCase() === sub &&
               String(x.equipamento_categoria || x.equipamento || '').toLowerCase() === eq2;
      });
      if (alt2) return alt2;
    }
  }

  return hit;
}

/** Âncora = quando semântica não resolve, tenta achar um título fallback no banco */
function resolverExercicioAncora_(ctx, base) {
  ctx = ctx || {};
  var titulo = tituloFallbackPorEnfaseLocal_(ctx);
  if (!titulo) return null;

  var hit = encontrarHitBase_(titulo, base, ctx.nivel);
  return hit || null;
}

/**
 * Força a escolha de um exercício de um grupo específico
 * quando a estrutura exige um mínimo obrigatório.
 */
function resolverExercicioForcadoPorGrupo_(grupo, ctx, base) {
  grupo = String(grupo || '').toLowerCase();
  ctx = ctx || {};

  var baseList = (base && base.list && Array.isArray(base.list)) ? base.list : base;
  baseList = Array.isArray(baseList) ? baseList : [];

  var nivel = String(ctx.nivel || '').toLowerCase();
  var fase  = String(ctx.fase  || '').toLowerCase();

  var candidatos = baseList.filter(function (ex) {
    if (!ex) return false;

    var g = String(ex.grupo_principal || ex.grupo || '').toLowerCase();
    if (g !== grupo) return false;

    if (nivel === 'iniciante' && ex.proibido_iniciante) return false;
    if (g === 'mobilidade') return false;

    return true;
  });

  if (!candidatos.length) return null;

  var scored = candidatos.map(function (ex) {
    var score = 1;

    if (fase === 'ovulatoria') score += 1;
    if (fase === 'menstrual') score -= 0.5;

    var eq = String(ex.equipamento_categoria || ex.equipamento || '').toLowerCase();
    if (nivel === 'iniciante' && eq === 'maquina') score += 1;

    return { ex: ex, score: score };
  });

  scored.sort(function (a, b) { return b.score - a.score; });

  var escolhido = scored[0] && scored[0].ex;
  if (!escolhido) return null;

  var ajustado = aplicarSubstituicaoPorNivel_(escolhido, Object.assign({}, ctx, { base: baseList }));
  return ajustado || escolhido;
}

/**
 * RESOLVER PRINCIPAL — por intenção
 */
function resolverExercicioPorIntencao_(intent, ctx, base, historicoTreinos, opts) {
  ctx = ctx || {};
  opts = opts || {};
  historicoTreinos = Array.isArray(historicoTreinos) ? historicoTreinos : [];

  var nivel     = String(ctx.nivel || '').toLowerCase();
  var estrutura = String(ctx.estrutura || '').toUpperCase();

  var baseList = (base && base.list && Array.isArray(base.list)) ? base.list : base;
  baseList = Array.isArray(baseList) ? baseList : [];

  if (!ctx._contagemGrupoDia) ctx._contagemGrupoDia = {};
  if (!ctx._padroesUsadosHoje) ctx._padroesUsadosHoje = {};

  var contagemGrupoDia = ctx._contagemGrupoDia;
  var padroesUsadosHoje = ctx._padroesUsadosHoje;

  // anti-repeat por janela = tamanho do ciclo (3/4/5)
  var antirepeatOn = (typeof INTENT_ANTIREPEAT_ENABLED !== 'undefined' && INTENT_ANTIREPEAT_ENABLED);
  var lenPadrao = Array.isArray(ctx.padraoCiclo) ? ctx.padraoCiclo.length : (Number(ctx.padraoCiclo) || 3);
  var historicoIds = antirepeatOn ? extrairHistoricoIdsNDias_(historicoTreinos, base, nivel, lenPadrao) : [];

  // regra estrutural
  var regraEstrutura = null;
  if (typeof regrasEstruturaPorPadrao_ === 'function' && estrutura) {
    var enfaseGrupo = normalizarEnfaseParaGrupo_(ctx.enfase);
    regraEstrutura = regrasEstruturaPorPadrao_(estrutura, ctx.padraoCiclo, enfaseGrupo);
  }

  // candidatos semânticos
  var cands = buildCandidatesSemanticoLocal_(intent, ctx, base) || [];
  if (!Array.isArray(cands)) cands = [];

  // score
  var scored = cands.map(function (hit) {
    var s = calcularScoreSemantico_(hit, intent, ctx);
    return Object.assign({}, hit, { _score: s });
  });

  // filtro repetição
  var filtrado = scored;
  if (antirepeatOn && historicoIds.length) {
    filtrado = scored.filter(function (x) { return historicoIds.indexOf(x.id) === -1; });
    if (!filtrado.length) filtrado = scored;
  }

  // filtros estruturais
  filtrado = filtrado.filter(function (ex) {
    if (!ex) return false;

    var grupo  = String(ex.grupo_principal || ex.grupo || '').toLowerCase();
    var padrao = String(ex.subpadrao_movimento || ex.subpadrao || '').toLowerCase();

    if (grupo === 'mobilidade') return false;
    if (grupo === 'core' && (contagemGrupoDia.core || 0) >= 1) return false;
    if (padrao && padroesUsadosHoje[padrao]) return false;

    if (regraEstrutura && regraEstrutura.permitidos && Array.isArray(regraEstrutura.permitidos)) {
      if (regraEstrutura.permitidos.indexOf(grupo) === -1) return false;
    }

    return true;
  });

  // escolha final
  var escolhido = escolherEntreTopK_(filtrado, (typeof opts.topK === 'number' ? opts.topK : 1));

  if (escolhido) {
    var grupoEscolhido  = String(escolhido.grupo_principal || escolhido.grupo || '').toLowerCase();
    var padraoEscolhido = String(escolhido.subpadrao_movimento || escolhido.subpadrao || '').toLowerCase();

    contagemGrupoDia[grupoEscolhido] = (contagemGrupoDia[grupoEscolhido] || 0) + 1;
    if (padraoEscolhido) padroesUsadosHoje[padraoEscolhido] = true;

    var ajustado = aplicarSubstituicaoPorNivel_(escolhido, Object.assign({}, ctx, { base: baseList }));
    return ajustado || escolhido;
  }

  // garantia mínimos
  if (regraEstrutura && regraEstrutura.min) {
    for (var g in regraEstrutura.min) {
      if (!regraEstrutura.min.hasOwnProperty(g)) continue;

      var atual = contagemGrupoDia[g] || 0;
      var faltam = regraEstrutura.min[g] - atual;

      if (faltam > 0) {
        var forcado = resolverExercicioForcadoPorGrupo_(g, ctx, base);
        if (forcado) return forcado;
      }
    }
  }

  // fallbacks
  var anc = resolverExercicioAncora_(ctx, base);
  if (anc) return anc;

  if (cands.length) return cands[0];
  return baseList.length ? baseList[0] : null;
}

/** Regra de uso (gate de OpenAI) */
function usarOpenAIComoFontePrimaria_(ctx) {
  ctx = ctx || {};
  return (
    OPENAI_ENABLED === true &&
    Number(ctx.dia) >= Number(OPENAI_DIAS_PICO && OPENAI_DIAS_PICO.inicio) &&
    Number(ctx.dia) <= Number(OPENAI_DIAS_PICO && OPENAI_DIAS_PICO.fim)
  );
}

/* ========================================================================
   FALLBACKS INTERNOS (não invadem outros arquivos)
   ======================================================================== */

/**
 * Se outro arquivo já define, respeitamos.
 * Aqui é um fallback mínimo para não quebrar.
 */
function buildCandidatesSemanticoLocal_(intent, ctx, base) {
  if (typeof globalThis !== 'undefined' && globalThis.__BUILD_CANDS_DEFINED__) {
    // nunca executa (só proteção)
  }

  var baseList = (base && base.list && Array.isArray(base.list)) ? base.list : base;
  baseList = Array.isArray(baseList) ? baseList : [];

  var g = String(intent && intent.grupo_principal || '').toLowerCase();
  var s = String(intent && intent.subpadrao_movimento || '').toLowerCase();

  // se veio grupo, filtra por grupo; se não, retorna base inteira (com clamp)
  var candidatos = g
    ? baseList.filter(function (ex) {
        return String(ex.grupo_principal || ex.grupo || '').toLowerCase() === g;
      })
    : baseList.slice();

  // se veio subpadrão, dá um refinamento leve
  if (s) {
    var refinado = candidatos.filter(function (ex) {
      return String(ex.subpadrao_movimento || ex.subpadrao || '').toLowerCase() === s;
    });
    if (refinado.length) candidatos = refinado;
  }

  // evita explodir custo
  return candidatos.slice(0, 200);
}

/**
 * Título âncora por ênfase — fallback mínimo.
 * (Se você já tem outro mais completo, ele continua valendo no runtime)
 */
function tituloFallbackPorEnfaseLocal_(ctx) {
  ctx = ctx || {};
  var e = String(ctx.enfase || '').toLowerCase();

  var mapa = {
    gluteos: 'hip thrust',
    quadriceps: 'leg press',
    posteriores: 'stiff',
    costas: 'puxada frente',
    peito: 'supino',
    ombros: 'desenvolvimento',
    core: 'prancha'
  };

  return mapa[e] || '';
}

/**
// Mantido apenas para referência histórica (evita colisão com 03_ALIAS_CANON)
function resolverCanonicoIdOpenAI_legacy_(titulo, base) {
  if (!titulo) return null;

  if (typeof resolverAliasExerciciosId_ === 'function') {
    var aliasId = resolverAliasExerciciosId_(titulo);
    if (aliasId) return aliasId;
  }

  var b = base || null;
  if (b && (b.byStrict || b.byFuzzy || b.list)) {
    var limpo = (typeof limparComplementosSemanticos_ === 'function')
      ? limparComplementosSemanticos_(titulo)
      : String(titulo);

    var kStrict = (typeof normalizaKeyStrict_ === 'function') ? normalizaKeyStrict_(limpo) : '';
    if (kStrict && b.byStrict && b.byStrict[kStrict] && b.byStrict[kStrict].id) {
      return b.byStrict[kStrict].id;
    }

    var kFuzzy = (typeof normalizaKey_ === 'function') ? normalizaKey_(limpo) : '';
    if (kFuzzy && b.byFuzzy && b.byFuzzy[kFuzzy] && b.byFuzzy[kFuzzy].id) {
      return b.byFuzzy[kFuzzy].id;
    }
  }

  return null;
}
