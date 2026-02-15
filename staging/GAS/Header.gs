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
  "Devices", "AuthVersion", "LastAuthMigrationAt"
];

// índices (0-based) para leitura rápida
const COL_TOKEN_RESET   = 17; // col 18 (1-based)
const COL_TOKEN_EXPIRA  = 18; // col 19
const COL_PERFIL_HORMONAL = 19; // col 20
const COL_CICLODATE       = 20; // col 21
const COL_DIA_PROGRAMA   = 21; // col 22
const COL_DEVICE_ID      = 22; // col 23
const COL_SESSION_TOKEN  = 23; // col 24
const COL_SESSION_EXP    = 24; // col 25
const COL_DATA_INICIO_PROGRAMA = 25; // col 26
const COL_ULTIMA_ATIVIDADE     = 26; // col 27
const COL_ULTIMO_CAMINHO       = 36; // col 37
const COL_ULTIMO_CAMINHO_DATA  = 37; // col 38
const COL_SCORE_FINAL          = 38; // col 39
const COL_SCORE_DETALHADO      = 39; // col 40
const COL_OBJETIVO             = 40; // col 41
const COL_DEVICES              = 41; // col 42
const COL_AUTH_VERSION         = 42; // col 43
const COL_AUTH_MIGRATION_AT    = 43; // col 44
