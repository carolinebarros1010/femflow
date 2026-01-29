/** ================================
 *  NORMALIZAÇÃO / PARSER SEMÂNTICO
 *  ================================ */

function normalizar_(v) {
  if (v === undefined || v === null) return null;

  return String(v)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

/**
 * FemFlow: normaliza fase
 */
function normalizarFase_(fase) {
  if (!fase) return null;

  const f = normalizar_(fase);

  const MAP = {
    menstrual: 'menstrual',
    menstruacao: 'menstrual',

    folicular: 'folicular',
    follicular: 'folicular',

    ovulatoria: 'ovulatoria',
    ovulacao: 'ovulatoria',

    lutea: 'lutea',
    luteal: 'lutea'
  };

  return MAP[f] || null;
}

/**
 * Mapeia "enfase" para grupo muscular padrão do motor.
 * (Mantém compatibilidade FemFlow e amplia sinônimos para MaleFlow)
 */
function normalizarEnfaseParaGrupo_(enfaseRaw) {
  if (!enfaseRaw) return null;

  const e = normalizar_(enfaseRaw);

  const MAP = {
    // glúteos
    gluteo: 'gluteos',
    gluteos: 'gluteos',

    // quadríceps
    quadriceps: 'quadriceps',
    quadricipites: 'quadriceps',
    quadriceps_femoral: 'quadriceps',

    // posteriores
    posteriores: 'isquiotibiais',
    isquiotibiais: 'isquiotibiais',
    posterior_de_coxa: 'isquiotibiais',
    posteriores_de_coxa: 'isquiotibiais',

    // costas
    costas: 'costas',
    dorsal: 'costas',
    dorsais: 'costas',

    // peito
    peito: 'peito',
    peitoral: 'peito',
    peitorais: 'peito',

    // superiores
    superiores: 'superiores',

    // ombros
    ombro: 'deltoides',
    ombros: 'deltoides',
    deltoide: 'deltoides',
    deltoides: 'deltoides',

    // core
    core: 'core',
    abdominal: 'core',
    abdominais: 'core',

    // === adicionais "seguros" (não quebram FemFlow) ===
    biceps: 'biceps',
    triceps: 'triceps',
    antebraco: 'antebraco',
    antebracos: 'antebraco',
    trapezio: 'trapezio',
    panturrilha: 'panturrilha',
    panturrilhas: 'panturrilha',
    lombar: 'lombar',
    adutor: 'adutores',
    adutores: 'adutores',
    posterior: 'isquiotibiais'
  };

  return MAP[e] || e;
}

/**
 * Resolve "ênfase por esporte" (mantido)
 */
function resolverEnfasePorEsporte_(enfaseRaw) {
  if (!enfaseRaw) return null;

  const e = normalizar_(enfaseRaw);

  const MAPA = {
    corrida_longa: {
      principal: ['gluteos', 'posteriores'],
      secundario: ['core', 'panturrilhas']
    },
    corrida_curta: {
      principal: ['quadriceps', 'gluteos'],
      secundario: ['posteriores', 'panturrilhas']
    },
    remo: {
      principal: ['costas', 'gluteos'],
      secundario: ['biceps', 'core']
    },
    natacao: {
      principal: ['costas', 'ombros'],
      secundario: ['core', 'triceps']
    },
    beach_tennis: {
      principal: ['ombros', 'core'],
      secundario: ['gluteos', 'quadriceps']
    },
    tenis: {
      principal: ['ombros', 'core'],
      secundario: ['gluteos', 'quadriceps']
    },
    ciclismo: {
      principal: ['quadriceps', 'gluteos'],
      secundario: ['posteriores', 'core']
    },
    jiu_jitsu: {
      principal: ['costas', 'core'],
      secundario: ['biceps', 'gluteos']
    },
    muay_thai: {
      principal: ['core', 'quadriceps'],
      secundario: ['gluteos', 'ombros']
    },
    danca: {
      principal: ['gluteos', 'core'],
      secundario: ['quadriceps', 'panturrilhas']
    },
    surf: {
      principal: ['core', 'ombros'],
      secundario: ['gluteos', 'costas']
    }
  };

  return MAPA[e] || null;
}

function normalizaKey_(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function normalizaKeyStrict_(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function limparComplementosSemanticos_(txt) {
  return String(txt || '')
    .replace(/\b(na|no|com|para|de|do|da)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ============================================================
   ✅ NOVO: helpers MaleFlow (ciclo / diatreino)
   - não interfere em FemFlow
============================================================ */

/**
 * Normaliza ciclo: aceita "3/4/5", "abc/abcd/abcde", "ABCDE", etc.
 * Retorna "abc", "abcd" ou "abcde" (string).
 */
function normalizarCiclo_(valor) {
  if (!valor) return null;
  const v = normalizar_(valor).replace(/[^a-z0-9]/g, '');

  if (v === '3' || v === 'abc') return 'abc';
  if (v === '4' || v === 'abcd') return 'abcd';
  if (v === '5' || v === 'abcde') return 'abcde';

  // se vier "ABCDE" (ou "A,B,C,D,E")
  if (v.includes('a') && v.includes('b') && v.includes('c') && v.includes('d') && v.includes('e')) return 'abcde';
  if (v.includes('a') && v.includes('b') && v.includes('c') && v.includes('d')) return 'abcd';
  if (v.includes('a') && v.includes('b') && v.includes('c')) return 'abc';

  return null;
}

/**
 * Normaliza diatreino: A/B/C/D/E (aceita "dia A", "diatreino_A", etc.)
 * Retorna "A".."E"
 */
function normalizarDiaTreino_(valor) {
  if (!valor) return null;
  const raw = String(valor || '').trim().toUpperCase();

  // pega primeira letra A-E
  const m = raw.match(/[A-E]/);
  if (!m) return null;

  return m[0];
}
