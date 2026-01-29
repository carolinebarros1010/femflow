/**
 * TESTE — Gera APENAS um dia específico (dia X)
 * Não depende de calcularFasePorDia_ / calcularEstruturaPorDia_ etc.
 * Você define a fase/estrutura explicitamente para auditar o resultado.
 */
function TEST_gerarDiaX() {

  const DIA_TESTE = 14;          // 👈 dia que você quer testar
  const FASE = 'ovulatoria';     // 👈 defina a fase do teste
  const ESTRUTURA = 'C';         // 👈 A/B/C/D/E
  const ENFASE = 'gluteos';      // 👈 enfase
  const NIVEL = 'intermediaria'; // 👈 iniciante/intermediaria/avancada

  // ================================
  // 1) BASE CANÔNICA
  // ================================
  // ✅ Use sua função real do sistema:
  // - se no seu projeto for carregarBaseExercicios_(), use ela.
  // - se o retorno vier em outro formato, mantenha como está no seu pipeline real.
  const base = carregarBaseExercicios_(); // ✅ FUNÇÃO EXISTE no seu teste de auditoria

  // ================================
  // 2) HISTÓRICO (vazio para teste controlado)
  // ================================
  const rowsHistorico = [];

  // ================================
  // 3) QUANTIDADE DO DIA (matriz fisiológica real)
  // ================================
  // ✅ Usa sua matriz que você criou: qtdExerciciosTreino_(nivel,fase,estrutura)
  const qtd = qtdExerciciosTreino_(NIVEL, FASE, ESTRUTURA);

  // ================================
  // 4) CONTEXTO DO DIA
  // ================================
  const ctx = {
    dia: DIA_TESTE,
    fase: FASE,
    estrutura: ESTRUTURA,
    enfase: ENFASE,
    nivel: NIVEL,
    qtdExercicios: qtd,

    // Flags opcionais que seu pipeline pode checar:
    hiit: null,
    historico: rowsHistorico
  };

  Logger.log('CTX TESTE: ' + JSON.stringify(ctx, null, 2));

  // ================================
  // 5) GERAR O DIA PELO PIPELINE REAL
  // ================================
  // ⚠️ Aqui depende do seu gerarDia_ atual.
  // Alguns projetos usam gerarDia_(ctx, base)
  // Outros usam gerarDia_(ctx, base, rowsHistorico)
  // Então fazemos tentativa segura:
  let linhas;
  try {
    linhas = gerarDia_(ctx, base, rowsHistorico);
  } catch (e1) {
    Logger.log('[TEST] gerarDia_(ctx,base,rowsHistorico) falhou: ' + e1.message);
    linhas = gerarDia_(ctx, base);
  }

  // ================================
  // 6) ESCREVER RESULTADO EM ABA DE TESTE
  // ================================
  escreverLinhasEmAbaTeste_(linhas, '__TEST_DIA');

  Logger.log('✅ DIA ' + DIA_TESTE + ' gerado e gravado em __TEST_DIA');
}


/**
 * Escreve linhas em aba isolada (não suja aba oficial)
 */
function escreverLinhasEmAbaTeste_(linhas, nomeAba) {
  const ss = SpreadsheetApp.getActive();
  nomeAba = nomeAba || '__TEST_DIA';

  let sh = ss.getSheetByName(nomeAba);
  if (!sh) sh = ss.insertSheet(nomeAba);

  sh.clearContents();

  if (!linhas || !linhas.length) {
    sh.getRange(1, 1).setValue('Sem linhas geradas.');
    return;
  }

  const header = Object.keys(linhas[0]);
  sh.getRange(1, 1, 1, header.length).setValues([header]);

  const values = linhas.map(l => header.map(h => (l[h] !== undefined ? l[h] : '')));
  sh.getRange(2, 1, values.length, header.length).setValues(values);
}
function buildIntencoesDoDiaTeste_(ctx) {
  const estrutura = String(ctx.estrutura || '').toUpperCase();
  const enfase = normalizarEnfaseParaGrupo_(ctx.enfase) || 'outros';
  const n = Number(ctx.qtdExercicios || 5);

  // Templates de intenção (biomecânica simples)
  const superiores = [
    { grupo_principal: 'peito',   subpadrao_movimento: 'empurrar_horizontal', equipamento_preferencial: 'maquina' },
    { grupo_principal: 'costas',  subpadrao_movimento: 'puxar_vertical',      equipamento_preferencial: 'polia'   },
    { grupo_principal: 'ombros',  subpadrao_movimento: 'empurrar_vertical',   equipamento_preferencial: 'halteres'},
    { grupo_principal: 'triceps', subpadrao_movimento: 'extensao_cotovelo',   equipamento_preferencial: 'polia'   },
    { grupo_principal: 'biceps',  subpadrao_movimento: 'flexao_cotovelo',     equipamento_preferencial: 'halteres'}
  ];

  const inferiores = [
    { grupo_principal: 'quadriceps',   subpadrao_movimento: 'agachar',            equipamento_preferencial: 'smith'   },
    { grupo_principal: 'posteriores',  subpadrao_movimento: 'dobrar_quadril',     equipamento_preferencial: 'halteres'},
    { grupo_principal: 'gluteos',      subpadrao_movimento: 'elevar_quadril',     equipamento_preferencial: 'maquina' },
    { grupo_principal: 'gluteos',      subpadrao_movimento: 'abducao_quadril',    equipamento_preferencial: 'elastico'},
    { grupo_principal: 'panturrilha',  subpadrao_movimento: 'extensao_joelho',    equipamento_preferencial: 'maquina' }
  ];

  const core = [
    { grupo_principal: 'core', subpadrao_movimento: 'anti_extensao', equipamento_preferencial: 'peso_corporal' },
    { grupo_principal: 'core', subpadrao_movimento: 'anti_rotacao',  equipamento_preferencial: 'elastico'      }
  ];

  // Dia C = ÊNFASE ABSOLUTA
  if (estrutura === 'C') {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        grupo_principal: enfase,
        subpadrao_movimento: (i % 2 === 0) ? 'elevar_quadril' : 'abducao_quadril',
        equipamento_preferencial: (i % 2 === 0) ? 'maquina' : 'elastico'
      });
    }
    return arr;
  }

  const pool =
    (estrutura === 'A' || estrutura === 'D')
      ? superiores.concat(core)     // superiores + core
      : inferiores.concat(core);    // inferiores + core

  // completa até n (repete padrões de forma controlada)
  const out = [];
  let k = 0;
  while (out.length < n) {
    out.push(pool[k % pool.length]);
    k++;
  }
  return out;
}

/* ========================================================================
   TESTE — GERAR SEMANA FEMFLOW
   ------------------------------------------------------------------------
   Gera um intervalo de dias (ex: 11–15) usando gerarDia_
   Salva tudo na aba __TEST_SEMANA
   ======================================================================== */

function TEST_gerarSemana(diaInicio, diaFim) {

  diaInicio = Number(diaInicio || 11);
  diaFim    = Number(diaFim || 15);

  const base = carregarBaseExercicios_();
  const rowsSemana = [];

  let faseAtual = 'ovulatoria'; // 🔧 ajuste manual para testes
  let ctxAnterior = null;

  for (let dia = diaInicio; dia <= diaFim; dia++) {

    const estrutura = FEMFLOW.MICROCICLO[(dia - 1) % 5];

   const ctx = {
  dia,
  fase: faseAtual,
  estrutura,
  enfase: 'gluteos',
  nivel: 'intermediaria',

  qtdExercicios: qtdExerciciosTreino_(
    'intermediaria',
    faseAtual,
    estrutura
  ),

  hiit: hiitPermitidoOuObrigatorio_(
    'intermediaria',
    faseAtual,
    estrutura
  ),

  historico: [],
  _rowsGlobal: rowsSemana,
  _ancoras: (ctxAnterior && ctxAnterior._ancoras) ? ctxAnterior._ancoras : {}
};


    Logger.log('CTX DIA ' + dia + ': ' + JSON.stringify(ctx, null, 2));

    // ======================================================
    // 1️⃣ GERAR INTENÇÕES DO DIA
    // ======================================================
    ctx._intencoesDia = [];

    if (estrutura === 'C') {
      ctx._intencoesDia.push({
        grupo_principal: normalizarEnfaseParaGrupo_(ctx.enfase),
        subpadrao_movimento: null,
        equipamento_preferencial: null
      });
    } else {
      const regra = resolverGruposPorEstrutura_(estrutura, ctx.enfase);
      const grupos = regra.permitidos || [];

      grupos.forEach(grupo => {
        ctx._intencoesDia.push({
          grupo_principal: grupo,
          subpadrao_movimento: null,
          equipamento_preferencial: null
        });
      });
    }

    // ======================================================
    // 2️⃣ RESOLVER INTENÇÕES
    // ======================================================
    ctx.exerciciosResolvidos = ctx._intencoesDia
      .map(intent =>
        resolverExercicioPorIntencao_(
          intent,
          ctx,
          base,
          rowsSemana
        )
      )
      .filter(Boolean);

    // ======================================================
    // 3️⃣ FALLBACK CANÔNICO (ÚNICO)
    // ======================================================
    if (!ctx.exerciciosResolvidos || ctx.exerciciosResolvidos.length === 0) {

      Logger.log('⚠️ DIA ' + dia + ': nenhum exercício resolvido — fallback CANÔNICO');


      const gruposFallback =
        resolverGruposPorEstrutura_(estrutura, ctx.enfase).permitidos;

      ctx.exerciciosResolvidos = base.list
        .filter(ex => gruposFallback.includes(ex.grupo_principal))
        .slice(0, ctx.qtdExercicios)
        .map(ex => ({
          titulo_pt: ex.titulo_pt || ex.nome || ex.id || 'Exercício',
          titulo_en: ex.titulo_en || '',
          titulo_fr: ex.titulo_fr || '',
          link: ex.link || '',
          series: '',
          reps: '',
          tempo: '',
          intervalo: FEMFLOW.INTERVALO_TREINO
        }));
    }

    // ======================================================
    // 4️⃣ GERAR LINHAS DO DIA
    // ======================================================
    const rowsDia = gerarDia_(ctx, base);

    rowsSemana.push(...rowsDia);
    ctxAnterior = ctx;
  }

  salvarTesteSemana_(rowsSemana);

  Logger.log(
  '✅ SEMANA ' + diaInicio + '–' + diaFim + ' gerada e gravada em __TEST_SEMANA'
);

}




/* ========================================================================
   SALVA RESULTADO DO TESTE
   ======================================================================== */
function salvarTesteSemana_(rows) {

  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('__TEST_SEMANA')
    || ss.insertSheet('__TEST_SEMANA');

  sh.clearContents();

  // Cabeçalho padrão CSV FemFlow
  sh.appendRow([
    'tipo','box','ordem','enfase','fase','dia',
    'titulo_pt','titulo_en','titulo_fr','link',
    'series','reps','tempo','intervalo','forte','leve','ciclos'
  ]);

  rows.forEach(r => {
    sh.appendRow([
      r.tipo, r.box, r.ordem, r.enfase, r.fase, r.dia,
      r.titulo_pt, r.titulo_en, r.titulo_fr, r.link,
      r.series, r.reps, r.tempo, r.intervalo,
      r.forte, r.leve, r.ciclos
    ]);
  });
}

