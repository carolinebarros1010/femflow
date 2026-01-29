/* ========================================================================
   FEMFLOW — CONTRATO SEMÂNTICO v1 (DOCUMENTAÇÃO VIVA)
   ------------------------------------------------------------------------
   ⚠️ ESTE BLOCO DEFINE AS REGRAS IMUTÁVEIS DO SISTEMA FEMFLOW.
   ⚠️ QUALQUER ALTERAÇÃO AQUI IMPACTA TODA A ARQUITETURA.
   ⚠️ NÃO MODIFICAR SEM ENTENDER TODA A CADEIA.
   ======================================================================== */

const SEMANTIC_PLANNER_ENABLED = true;
const USAR_PLANO_FASE = true;
const USAR_PLANNER_POR_ID = true;

// ================================
// CACHE CANÔNICO LOCAL (runtime)
// ================================
const CANON_CACHE = {};
const CANON_CACHE_LIMIT = 500;

// ================================
// CACHE DE INTENÇÕES POR FASE
// ================================
const INTENCOES_POR_FASE_CACHE = {};

// ================================
// FLAGS DE CONTROLE
// ================================
const DISABLE_DAILY_NAME_PLANNER = true;

// ================================
// OPENAI GLOBAL SWITCH
// ================================
const OPENAI_ENABLED = true;
// ================================
// JANELA DE PICO PARA OPENAI
// ================================
const OPENAI_DIAS_PICO = {
  inicio: 14,
  fim: 18
};
const FEMFLOW_REGRAS_ESTRUTURA = {
  A: { min: { peito: 3, triceps: 1 }, max: { core: 0 } },
  B: { min: { quadriceps: 3 }, max: { core: 1 } },
  C: { min: { ENFASE: 3 }, max: { core: 1 } },
  D: { min: { costas: 3, biceps: 1 }, max: { core: 0 } },
  E: { min: { posteriores: 2, gluteos: 2 }, max: { core: 0 } }
};

function regrasEstruturaPorPadrao_(estrutura, padraoCiclo, enfaseGrupo) {
  const estruturaKey = String(estrutura || '').toUpperCase();
  const padrao = Array.isArray(padraoCiclo) ? padraoCiclo : String(padraoCiclo || '');
  const tamanho = Array.isArray(padraoCiclo) ? padraoCiclo.length : Number(padraoCiclo) || (padrao.length || 5);
  const enfase = String(enfaseGrupo || '').toLowerCase();

  let permitidos = [];
  let exclusivos = false;

  if (tamanho === 3) {
    if (estruturaKey === 'A') permitidos = ['peito', 'costas'];
    if (estruturaKey === 'B') permitidos = ['quadriceps', 'posteriores', 'gluteos', 'panturrilha', 'adutores', 'lombar', 'core'];
    if (estruturaKey === 'C') {
      permitidos = [enfase || 'outros'];
      exclusivos = true;
    }
  } else if (tamanho === 4) {
    if (estruturaKey === 'A') permitidos = ['peito', 'costas', 'ombros', 'triceps', 'biceps', 'trapezio'];
    if (estruturaKey === 'B') permitidos = ['quadriceps', 'posteriores', 'gluteos', 'panturrilha', 'adutores', 'lombar', 'core'];
    if (estruturaKey === 'C') {
      permitidos = [enfase || 'outros'];
      exclusivos = true;
    }
    if (estruturaKey === 'D') permitidos = ['ombros', 'trapezio', 'biceps', 'triceps', 'antebraco'];
  } else {
    if (estruturaKey === 'A') permitidos = ['peito', 'triceps', 'ombros'];
    if (estruturaKey === 'B') permitidos = ['posteriores', 'gluteos', 'panturrilha', 'lombar'];
    if (estruturaKey === 'C') {
      permitidos = [enfase || 'outros'];
      exclusivos = true;
    }
    if (estruturaKey === 'D') permitidos = ['costas', 'biceps', 'ombros', 'trapezio'];
    if (estruturaKey === 'E') permitidos = ['quadriceps', 'adutores'];
  }

  const regraBase = FEMFLOW_REGRAS_ESTRUTURA[estruturaKey] || {};
  return {
    permitidos,
    exclusivos,
    min: regraBase.min || null,
    max: regraBase.max || null
  };
}

// ================================
// FLAGS DE EVOLUÇÃO
// ================================
const INTENT_PLANNER_ENABLED = true;
const INTENT_ANTIREPEAT_ENABLED = true;
const INTENT_RANDOM_PICK_TOPK = 3;

// ================================
// MAPA ESTRUTURAL FEMFLOW (A–E)
// ================================
const FEMFLOW_ESTRUTURA_MAP = {

  A: {
    nome: 'Superiores Empurrar',
    grupos_principais: ['peito', 'triceps', 'ombros'],
    subgrupos_ombro: ['anterior', 'lateral'],
    core: { permitido: false },
    exclusivo: false
  },

  B: {
    nome: 'Inferiores Anterior + Core',
    grupos_principais: ['quadriceps', 'adutores'],
    core: {
      permitido: true,
      tipos: ['flexao_tronco', 'anti_extensao']
    },
    exclusivo: false
  },

  C: {
    nome: 'Ênfase Exclusiva',
    grupos_principais: [],
    core: { permitido: false },
    exclusivo: true
  },

  D: {
    nome: 'Superiores Puxar + Core',
    grupos_principais: ['costas', 'biceps', 'ombros', 'trapezio'],
    subgrupos_ombro: ['posterior'],
    core: {
      permitido: true,
      tipos: ['anti_rotacao', 'estabilizacao_lateral']
    },
    exclusivo: false
  },

  E: {
    nome: 'Inferiores Posterior',
    grupos_principais: ['posteriores', 'gluteos', 'panturrilha'],
    core: { permitido: false },
    exclusivo: false
  }
};

// ================================
// MICROCICLO CRIATIVO FEMFLOW
// ================================
const FEMFLOW_MICROCICLO_CRIATIVO = {

  A: {
    nome: 'Superiores Empurrar',
    intencoes: [
      { foco: 'peito', sensacao: 'forca_controlada' },
      { foco: 'ombros', sensacao: 'estabilidade' },
      { foco: 'triceps', sensacao: 'tensao_constante' }
    ]
  },

  B: {
    nome: 'Inferiores Anterior + Core',
    intencoes: [
      { foco: 'quadriceps', sensacao: 'base' },
      { foco: 'quadriceps', sensacao: 'unilateral' },
      { foco: 'quadriceps', sensacao: 'controle' }
    ],
    core: true
  },

  C: {
    nome: 'Ênfase Exclusiva',
    intencoes: [
      { foco: 'ENFASE', sensacao: 'saturacao' },
      { foco: 'ENFASE', sensacao: 'controle' },
      { foco: 'ENFASE', sensacao: 'amplitude' }
    ],
    override_total: true
  },

  D: {
    nome: 'Superiores Puxar + Core',
    intencoes: [
      { foco: 'costas', sensacao: 'amplitude' },
      { foco: 'costas', sensacao: 'controle_escapular' },
      { foco: 'costas', sensacao: 'forca' }
    ],
    core: true
  },

  E: {
    nome: 'Inferiores Posterior',
    intencoes: [
      { foco: 'posteriores', sensacao: 'cadeia_posterior' },
      { foco: 'gluteos', sensacao: 'extensao_quadril' },
      { foco: 'panturrilha', sensacao: 'densidade' }
    ]
  }
};

// ================================
// MODULADOR HORMONAL FEMFLOW
// ================================
const FEMFLOW_FASE_MODULADOR = {

  menstrual: {
    nome: 'Controle e segurança',
    bonus: { maquina: 1.0, polia: 0.8 },
    penalidade: { barra: -0.5, halteres: -0.3 },
    intensidade: 'baixa'
  },

  folicular: {
    nome: 'Construção e progresso',
    bonus: { halteres: 0.6, barra: 0.4 },
    penalidade: {},
    intensidade: 'moderada'
  },

  ovulatoria: {
    nome: 'Potência e expressão',
    bonus: { barra: 1.0, halteres: 0.8, peso_corporal: 0.6 },
    penalidade: { maquina: -0.2 },
    intensidade: 'alta'
  },

  lutea: {
    nome: 'Densidade e eficiência',
    bonus: { maquina: 0.6, polia: 0.5 },
    penalidade: { barra: -0.3 },
    intensidade: 'moderada'
  }
};

// ================================
// PROGRESSÃO IMPLÍCITA FEMFLOW
// ================================
const FEMFLOW_PROGRESSAO_FASE = {

  menstrual: {
    ajuste_series: 0,
    ajuste_reps: 0,
    ajuste_intervalo: +15,
    foco: 'controle'
  },

  folicular: {
    ajuste_series: +1,
    ajuste_reps: 0,
    ajuste_intervalo: 0,
    foco: 'volume'
  },

  ovulatoria: {
    ajuste_series: +1,
    ajuste_reps: -2,
    ajuste_intervalo: -15,
    foco: 'intensidade'
  },

  lutea: {
    ajuste_series: 0,
    ajuste_reps: +2,
    ajuste_intervalo: 0,
    foco: 'densidade'
  }
};

// ================================
// CONFIG GERAL FEMFLOW
// ================================
const FEMFLOW = {
  DIAS_TOTAL: 30,
  MICROCICLO: ['A','B','C','D','E'],
  BASE_SHEET_NAME: 'BANCO_PRO_V2',
  TEMPO_AQUECIMENTO: 300,
  TEMPO_RESFRIAMENTO: 300,
  TEMPO_CARDIO: 420,
  INTERVALO_TREINO: 60,
  CSV_COLS: [
    'tipo','box','ordem','enfase','fase','dia',
    'titulo_pt','titulo_en','titulo_fr','link',
    'series','reps','especial','tempo','intervalo','forte','leve','ciclos'
  ]
};

// ================================
// MAPA DE ESPORTES → GRUPOS
// ================================
const MAPA_ESPORTE_GRUPOS = {
  corrida: {
    dominante: ['quadriceps','gluteos','panturrilha'],
    suporte: ['posteriores','core']
  },
  natacao: {
    dominante: ['costas','ombros','core'],
    suporte: ['triceps','peito']
  },
  ciclismo: {
    dominante: ['quadriceps','gluteos'],
    suporte: ['posteriores','panturrilha','core']
  },
  crossfit: {
    dominante: ['gluteos','quadriceps','costas','ombros'],
    suporte: ['core','posteriores']
  },
  musculacao: {
    dominante: [],
    suporte: []
  }
};

function qtdExerciciosTreino_(nivel, fase, estrutura) {
  const M = {
    iniciante:    { menstrual: 4, folicular: 5, ovulatoria: 6, lutea: 5 },
    intermediaria:{ menstrual: 5, folicular: 6, ovulatoria: 8, lutea: 6 },
    avancada:     { menstrual: 6, folicular: 8, ovulatoria: 8, lutea: 8 }
  };
  let n = M[nivel][fase];

  // Regra estrutural do seu microciclo:
  // Dia C (ênfase) = 1 dia “somente ênfase”, e você aceitou que pode repetir em relação aos outros dias.
  // Mantemos a quantidade padrão por fase.
  // (Se quiser reduzir ou aumentar só no C, você me fala e eu altero aqui.)
  return n;
}

function seriesPorFaseNivel_(nivel, fase, estrutura) {
  // regra especial: avançada + ovulatória + dia C (ênfase) → 5 séries
  if (nivel === 'avancada' && fase === 'ovulatoria' && estrutura === 'C') return 5;

  // restante conforme fase (e seu “quando 2/3/4 séries…”)
  if (fase === 'menstrual') return 2;
  if (fase === 'ovulatoria') return (nivel === 'intermediaria' || nivel === 'avancada') ? 4 : 3;
  // folicular / lutea → 3 séries (padrão)
  return 3;
}

const FEMFLOW_SERIES_ESPECIAIS = [
  { sufixo: 'cc', codigo: 'CC' }, // cadência controlada
  { sufixo: 'sm', codigo: 'SM' }, // submáxima
  { sufixo: 'rp', codigo: 'RP' }, // rest-pause
  { sufixo: 'ae', codigo: 'AE' }, // all out
  { sufixo: 'd', codigo: 'D' },   // dropset
  { sufixo: 'q', codigo: 'Q' },   // quadriset
  { sufixo: 't', codigo: 'T' },   // triset
  { sufixo: 'b', codigo: 'B' },   // biset
  { sufixo: 'c', codigo: 'C' },   // cluster
  { sufixo: 'i', codigo: 'I' }    // isometria
];
function repsPorSeries_(nivel, series, fase, estrutura) {
  if (series === 2) return '20';
  if (series === 3) {
    // você disse “10–12 (depende do nível)”, mantendo padrão seguro:
    return (nivel === 'iniciante') ? '15' : '12';
  }
  if (series === 4) {
    // “08–12 (depende do nível)”
    return (nivel === 'avancada') ? '10' : '12';
  }
  if (series === 5) {
    // apenas avançado + ovulatória + dia C
    return '8';
  }
  return '12';
}
function hiitPermitidoOuObrigatorio_(fase) {
  if (fase === 'menstrual') return { allow: false, required: false };
  if (fase === 'ovulatoria') return { allow: true, required: true };
  if (fase === 'folicular' || fase === 'lutea') return { allow: true, required: false }; // alternado
  return { allow: false, required: false };
}
function cardioRegra_(fase) {
  if (fase === 'folicular' || fase === 'ovulatoria') return 'diario';
  return 'alternado';
}
