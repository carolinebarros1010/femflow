/* ========================================================================
   FEMFLOW — FALLBACK LOCAL
   ------------------------------------------------------------------------
   ⚠️ Este arquivo garante ROBUSTEZ ABSOLUTA.
   ⚠️ Nenhuma dependência de OpenAI.
   ⚠️ Nunca pode quebrar a geração de treino.
   ======================================================================== */


/**
 * Plano de intenções por fase (fallback determinístico)
 * Usado quando OpenAI está desligado ou falha.
 */
function planoFaseFallback_(fase, nivel, enfaseRaw) {

  const enfaseGrupo = normalizarEnfaseParaGrupo_(enfaseRaw);
  const enfaseEsporte = resolverEnfasePorEsporte_(enfaseRaw);

  // resolve foco principal do dia C
  const focoExclusivo = enfaseEsporte?.principal?.[0] || enfaseGrupo;

  return {

    A: [
      { grupo_principal: 'peito', subpadrao_movimento: 'empurrar_horizontal' },
      { grupo_principal: 'ombros', subpadrao_movimento: 'empurrar_vertical' },
      { grupo_principal: 'triceps', subpadrao_movimento: 'extensao_cotovelo' }
    ],

    B: [
      { grupo_principal: 'quadriceps', subpadrao_movimento: 'agachar' },
      { grupo_principal: 'quadriceps', subpadrao_movimento: 'extensao_joelho' },
      { grupo_principal: 'core', subpadrao_movimento: 'anti_extensao' }
    ],

    C: [
      { grupo_principal: focoExclusivo, subpadrao_movimento: null },
      { grupo_principal: focoExclusivo, subpadrao_movimento: null }
    ],

    D: [
      { grupo_principal: 'costas', subpadrao_movimento: 'puxar_vertical' },
      { grupo_principal: 'costas', subpadrao_movimento: 'puxar_horizontal' },
      { grupo_principal: 'core', subpadrao_movimento: 'anti_rotacao' }
    ],

    E: [
      { grupo_principal: 'posteriores', subpadrao_movimento: 'dobrar_quadril' },
      { grupo_principal: 'gluteos', subpadrao_movimento: 'elevar_quadril' },
      { grupo_principal: 'panturrilha', subpadrao_movimento: 'flexao_plantar' }
    ]

  };
}
/**
 * Resolve quais grupos musculares são PERMITIDOS
 * de acordo com a estrutura do microciclo (A–E)
 */
function resolverGruposPorEstrutura_(estrutura, enfaseGrupo, padraoCiclo) {

  estrutura = String(estrutura || '').toUpperCase();
  enfaseGrupo = String(enfaseGrupo || '').toLowerCase();

  if (typeof regrasEstruturaPorPadrao_ === 'function') {
    return regrasEstruturaPorPadrao_(estrutura, padraoCiclo, enfaseGrupo);
  }

  return {
    permitidos: [enfaseGrupo || 'outros'],
    exclusivos: false
  };
}



/**
 * Constrói candidatos semânticos locais
 * (usado quando não há planner por intenção)
 */
function buildCandidatesSemanticoFallback_(ctx, base) {

  base = Array.isArray(base) ? base : [];

  const nivel = ctx.nivel;
  const historico = ctx.historico || [];

  const regraDia = resolverGruposPorEstrutura_(ctx.estrutura, ctx.enfase, ctx.padraoCiclo);
  const gruposPermitidos = regraDia.permitidos || [];
  const exclusivo = regraDia.exclusivos;

  const enfaseMuscular = normalizarEnfaseParaGrupo_(ctx.enfase);
  const permitirEnfase = (String(ctx.estrutura || '').toUpperCase() === 'C')
    || String(ctx.serieEspecialTipoDia || '').toLowerCase() === 'sm';
  const esporte = resolverEnfasePorEsporte_(ctx.enfase);

  const gruposRecentes = new Map();

  historico.forEach(h => {
    const rec = encontrarHitBase_(h.titulo_pt, base);
    if (!rec?.grupo_principal) return;

    gruposRecentes.set(
      rec.grupo_principal,
      (gruposRecentes.get(rec.grupo_principal) || 0) + 1
    );
  });

  return base
    .filter(ex => {

      if (nivel === 'iniciante' && ex.proibido_iniciante) return false;

      if (exclusivo) {
        return gruposPermitidos.includes(ex.grupo_principal);
      }

      return gruposPermitidos.includes(ex.grupo_principal);
    })
    .map(ex => {

      let score = 1;

      if (permitirEnfase && ex.grupo_principal === enfaseMuscular) score += 5;
      if (esporte?.principal?.includes(ex.grupo_principal)) score += 4;
      if (esporte?.secundario?.includes(ex.grupo_principal)) score += 2;

      const repeticao = gruposRecentes.get(ex.grupo_principal) || 0;
      score -= repeticao * 2;

      return { ex, score };
    })
    .filter(x => x.score > -5)
    .sort((a, b) => b.score - a.score)
    .map(x => x.ex);
}



/**
 * Resolver simples por intenção (fallback absoluto)
 */
function resolverExercicioPorIntencaoFallback_(intencao, base, nivel) {

  const candidatos = base.list.filter(ex => {
    if (intencao.grupo_principal && ex.grupo_principal !== intencao.grupo_principal) return false;
    if (intencao.subpadrao_movimento && ex.subpadrao_movimento !== intencao.subpadrao_movimento) return false;
    return true;
  });

  if (!candidatos.length) return null;

  return aplicarSubstituicaoPorNivel_(candidatos[0], nivel, base);
}


/**
 * Título genérico seguro por ênfase e nível
 */
function tituloFallbackPorEnfaseFallback_(enfase, nivel, i) {

  const isIni = (String(nivel || '').toLowerCase() === 'iniciante');

  const GENERICOS_INICIANTE = {
    costas: ['Puxada Frente na Polia', 'Remada Baixa na Polia', 'Pulldown na Polia'],
    peito: ['Supino Máquina', 'Crucifixo na Máquina', 'Supino com Halteres'],
    gluteo: ['Agachamento no Smith', 'Elevação Pélvica', 'Cadeira Abdutora'],
    quadriceps: ['Leg Press', 'Cadeira Extensora', 'Agachamento no Smith'],
    posteriores: ['Mesa Flexora', 'Cadeira Flexora', 'Stiff com Halteres'],
    superiores: ['Supino Máquina', 'Remada Baixa na Polia', 'Desenvolvimento Máquina']
  };

  const GENERICOS_GERAL = {
    costas: ['Remada Curvada', 'Puxada Frontal', 'Pulldown'],
    peito: ['Supino Reto', 'Crucifixo Reto', 'Supino Inclinado'],
    gluteo: ['Agachamento', 'Elevação Pélvica', 'Avanço'],
    quadriceps: ['Agachamento', 'Leg Press', 'Cadeira Extensora'],
    posteriores: ['Stiff', 'Mesa Flexora', 'Levantamento Terra Romeno'],
    superiores: ['Supino Reto', 'Remada Curvada', 'Desenvolvimento']
  };

  const key = String(enfase || '').toLowerCase();
  const base = isIni ? GENERICOS_INICIANTE : GENERICOS_GERAL;

  const lista = base[key] || ['Exercício'];
  return lista[i % lista.length];
}
