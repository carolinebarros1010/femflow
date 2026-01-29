/* ========================================================================
   TESTE DE AUDITORIA FINAL — FEMFLOW
   ------------------------------------------------------------------------
   Conferência estrutural TOTAL:
   - Funções
   - Constantes
   - Matrizes fisiológicas
   - Progressões
   - Caches reais
   ------------------------------------------------------------------------
   Fonte: GAS painelpersonal.txt
   ======================================================================== */


/* ================================
 *  TESTE DE FUNÇÕES ESSENCIAIS
 * ================================ */
function TEST_existenciaFuncoes() {
  const fns = [
    'normalizar_',
    'carregarBaseExercicios_',
    'resolverExercicioPorIntencao_',
    'gerarDia_',
    'gerarFemFlow30Dias',
    'doGet',
    'doPost'
  ];

  fns.forEach(fn => {
    if (typeof this[fn] !== 'function') {
      throw new Error('❌ FUNÇÃO AUSENTE: ' + fn);
    }
  });

  Logger.log('✅ Todas as FUNÇÕES essenciais existem.');
}


/* ================================
 *  TESTE DE CONSTANTES REAIS
 * ================================ */
function TEST_existenciaConstantes() {

  // FLAGS
  if (typeof OPENAI_ENABLED === 'undefined') throw new Error('❌ OPENAI_ENABLED AUSENTE');
  if (typeof SEMANTIC_PLANNER_ENABLED === 'undefined') throw new Error('❌ SEMANTIC_PLANNER_ENABLED AUSENTE');
  if (typeof USAR_PLANNER_POR_ID === 'undefined') throw new Error('❌ USAR_PLANNER_POR_ID AUSENTE');

  // CONFIG CENTRAL
  if (typeof FEMFLOW === 'undefined') throw new Error('❌ FEMFLOW AUSENTE');

  // ESTRUTURA / MICROCICLO
  if (typeof FEMFLOW_ESTRUTURA_MAP === 'undefined') throw new Error('❌ FEMFLOW_ESTRUTURA_MAP AUSENTE');
  if (typeof FEMFLOW_MICROCICLO_CRIATIVO === 'undefined') throw new Error('❌ FEMFLOW_MICROCICLO_CRIATIVO AUSENTE');

  // MODULADOR HORMONAL
  if (typeof FEMFLOW_FASE_MODULADOR === 'undefined') throw new Error('❌ FEMFLOW_FASE_MODULADOR AUSENTE');

  // PROGRESSÕES
  if (typeof FEMFLOW_PROGRESSAO_FASE === 'undefined') throw new Error('❌ FEMFLOW_PROGRESSAO_FASE AUSENTE');

  Logger.log('✅ Todas as CONSTANTES globais existem.');
}



/* ================================
 *  TESTE DE MATRIZES FISIOLÓGICAS
 * ================================ */
function TEST_existenciaMatrizes() {
  const matrizes = [
    'qtdExerciciosTreino_',
    'seriesPorFaseNivel_',
    'repsPorSeries_',
    'hiitPermitidoOuObrigatorio_',
    'cardioRegra_'
  ];

  matrizes.forEach(fn => {
    if (typeof this[fn] !== 'function') {
      throw new Error('❌ MATRIZ / FUNÇÃO AUSENTE: ' + fn);
    }
  });

  Logger.log('✅ Todas as MATRIZES fisiológicas existem.');
}


/* ================================
 *  TESTE DE PROGRESSÕES
 * ================================ */
function TEST_existenciaProgressoes() {

  if (typeof FEMFLOW_PROGRESSAO_FASE === 'undefined') {
    throw new Error('❌ PROGRESSÃO DE FASE AUSENTE');
  }

  const funcoes = [
    'matrizProgressaoSemanal_',
    'calcularTempoExecucao_'
  ];

  funcoes.forEach(fn => {
    if (typeof this[fn] !== 'function') {
      throw new Error('❌ FUNÇÃO DE PROGRESSÃO AUSENTE: ' + fn);
    }
  });

  Logger.log('✅ Progressões (fase / semana / tempo) OK.');
}


/* ================================
 *  TESTE DE CACHES REAIS
 * ================================ */
function TEST_existenciaCaches() {

  if (typeof EXERCISE_ALIASES === 'undefined') {
    throw new Error('❌ CACHE AUSENTE: EXERCISE_ALIASES');
  }

  if (typeof __CACHE_BASE_PRO__ === 'undefined') {
    throw new Error('❌ CACHE AUSENTE: __CACHE_BASE_PRO__');
  }

  Logger.log('✅ CACHES globais existem.');
}


/* ================================
 *  TESTE COMPLETO
 * ================================ */
function TEST_TUDO_EXISTE() {
  TEST_existenciaFuncoes();
  TEST_existenciaConstantes();
  TEST_existenciaMatrizes();
  TEST_existenciaProgressoes();
  TEST_existenciaCaches();

  Logger.log('🟢 SISTEMA 100% ÍNTEGRO — NADA PERDIDO.');
}


