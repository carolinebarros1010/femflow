/* Nome padrão da aba principal */
const SHEET_ALUNAS = "Alunas";
const SHEET_ALUNOS = "Alunos";

/* Token de upgrade seguro */
const SECURITY_TOKEN = "Bmc082849$";

/* HÍBRIDO → TRUE = exercícios vêm do Firebase */
const HYBRID_EXERCISES = true;

const SCRIPT_URL = ScriptApp.getService().getUrl();
const AUTH_VERSION = 2;
const DEVICE_SLOTS = 2;
const SESSION_DAYS = 30;
const LASTACTIVE_THROTTLE_SEC = 60;
const MIGRATION_ALLOW_NO_DEVICE = false;

const COL_FREE_ENABLED = 27; // AB
const COL_FREE_ENFASES = 28; // AC
const COL_FREE_UNTIL   = 29; // AD
const COL_ACESSO_PERSONAL   = 30; // AE
const COL_TREINOS_SEMANA    = 31; // AF
const COL_AUSENCIA_ATIVA    = 32; // AG
const COL_AUSENCIA_INICIO   = 33; // AH
const COL_DATA_NASCIMENTO   = 34; // AI
const COL_NOVO_TREINO_ENDURANCE = 35; // AJ

/**
 * ✅ HEADER OFICIAL (corrigido)
 * Inclui DiaPrograma ANTES do Device/Session para não conflitar.
 */
const HEADER_ALUNAS = [
  "ID","Nome","Email","Telefone","SenhaHash","Produto","DataCompra","LicencaAtiva",
  "Nivel","CicloDuracao","DataInicio","LinkPlanilha","Enfase","Fase","DiaCiclo",
  "Pontuacao","AnamneseJSON","TokenReset","TokenExpira","Perfil_Hormonal","ciclodate","DiaPrograma",
  "DeviceId","SessionToken","SessionExpira",
  "DataInicioPrograma","UltimaAtividade", "FreeEnabled" , "FreeEnfases", "FreeUntil", "acesso_personal",
  "TreinosSemana","AusenciaAtiva","AusenciaInicio","DataNascimento","novo_treino_endurance",
  "UltimoCaminho","UltimoCaminhoData","ScoreFinal","ScoreDetalhado","Objetivo",
  "Devices", "AuthVersion", "LastAuthMigrationAt", "StatusConta", "DeleteRequestedAt"
];

// índices (0-based) para leitura rápida
const COL_TOKEN_RESET   = 17; // col 18 (1-based)
const COL_TOKEN_EXPIRA  = 18; // col 19
const COL_PERFIL_HORMONAL = 19; // col 20
const COL_CICLODATE       = 20; // col 21
const COL_DIA_PROGRAMA   = 21; // col 22
const COL_DEVICE_ID      = HEADER_ALUNAS.indexOf("DeviceId");
const COL_SESSION_TOKEN  = HEADER_ALUNAS.indexOf("SessionToken");
const COL_SESSION_EXP    = HEADER_ALUNAS.indexOf("SessionExpira");
const COL_DATA_INICIO_PROGRAMA = HEADER_ALUNAS.indexOf("DataInicioPrograma");
const COL_ULTIMA_ATIVIDADE     = HEADER_ALUNAS.indexOf("UltimaAtividade");
const COL_ULTIMO_CAMINHO       = HEADER_ALUNAS.indexOf("UltimoCaminho");
const COL_ULTIMO_CAMINHO_DATA  = HEADER_ALUNAS.indexOf("UltimoCaminhoData");
const COL_SCORE_FINAL          = HEADER_ALUNAS.indexOf("ScoreFinal");
const COL_SCORE_DETALHADO      = HEADER_ALUNAS.indexOf("ScoreDetalhado");
const COL_OBJETIVO             = HEADER_ALUNAS.indexOf("Objetivo");
const COL_DEVICES              = HEADER_ALUNAS.indexOf("Devices");
const COL_AUTH_VERSION         = HEADER_ALUNAS.indexOf("AuthVersion");
const COL_AUTH_MIGRATION_AT    = HEADER_ALUNAS.indexOf("LastAuthMigrationAt");
const COL_STATUS_CONTA         = HEADER_ALUNAS.indexOf("StatusConta");
const COL_DELETE_REQUESTED_AT  = HEADER_ALUNAS.indexOf("DeleteRequestedAt");

function _assertAlunasSchemaIndices_() {
  const required = {
    DeviceId: COL_DEVICE_ID,
    SessionToken: COL_SESSION_TOKEN,
    SessionExpira: COL_SESSION_EXP,
    Devices: COL_DEVICES,
    AuthVersion: COL_AUTH_VERSION,
    LastAuthMigrationAt: COL_AUTH_MIGRATION_AT,
    StatusConta: COL_STATUS_CONTA,
    DeleteRequestedAt: COL_DELETE_REQUESTED_AT
  };

  for (const name in required) {
    if (required[name] < 0) {
      throw new Error('HEADER_ALUNAS inválido: coluna ausente -> ' + name);
    }
  }
}

function ensureAlunasHasColumns_() {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  _assertAlunasSchemaIndices_();
  return sh;
}
