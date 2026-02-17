/* ========================================================================
   FEMFLOW — 08_ORQUESTRADOR.gs
   ------------------------------------------------------------------------
   Extraído fielmente de: GAS PAINELPERSONAL.txt
   ⚠️ Não renomear funções.
   ⚠️ Não alterar lógica.
   ------------------------------------------------------------------------
   ✅ Adição cirúrgica: suporte MaleFlow (sem quebrar FemFlow)
   ======================================================================== */

/* ============================================================
   FEMFLOW — PIPELINE ORIGINAL (inalterado)
============================================================ */
function gerarFemFlow30Dias(pedidoTexto) {

  const p = parsePedido_(pedidoTexto);
  validarPedido_(p);

  const base = carregarBaseExercicios_();
  const padrao = resolverPadraoCiclo_(p.padraoCiclo);
  const linked = gerarBaseOvulatoria_(p, padrao, base);
  const distribuido = distribuirBaseOvulatoriaPara30Dias_(p, padrao);

  salvarNaAbaTabela_(Object.assign({}, p, { destino: 'BASE_OVULATORIA' }), linked);
  salvarNaAbaTabela_(p, distribuido);

  return gerarCSV_(distribuido);
}

function proximaFase_(fase) {
  const ordem = ['menstrual','folicular','ovulatoria','lutea'];
  const i = ordem.indexOf(fase);
  return ordem[(i + 1) % ordem.length];
}

function resolverPadraoCiclo_(padrao) {
  const txt = String(padrao || '').toLowerCase();
  if (txt === '2' || txt === 'ab') return ['A', 'B'];
  if (txt === '3' || txt === 'abc') return ['A', 'B', 'C'];
  if (txt === '4' || txt === 'abcd') return ['A', 'B', 'C', 'D'];
  return ['A', 'B', 'C', 'D', 'E'];
}

function resolverDiasBaseOvulatoria_(padrao) {
  const tamanho = Array.isArray(padrao) ? padrao.length : 5;
  if (tamanho === 2) return [14, 15];
  if (tamanho === 3) return [14, 15, 16];
  if (tamanho === 4) return [14, 15, 16, 17];
  return [14, 15, 16, 17, 18];
}

function resolverDiasDistribuicaoPorFase_(padrao) {
  const quantidade = Array.isArray(padrao) && padrao.length ? padrao.length : 5;
  const fases = [
    { nome: 'menstrual', inicio: 1 },
    { nome: 'folicular', inicio: 6 },
    { nome: 'ovulatoria', inicio: 14 },
    { nome: 'lutea', inicio: 19 }
  ];

  const dias = [];
  fases.forEach(fase => {
    for (let i = 0; i < quantidade; i++) {
      const diaCalculado = fase.inicio + i;
      const faseCalculada = diaCalculado === 18 ? 'lutea' : fase.nome;
      dias.push({
        dia: diaCalculado,
        fase: faseCalculada,
        indiceNaFase: i
      });
    }
  });

  return dias;
}

function fasePorDiaCiclo_(dia) {
  if (dia <= 5) return 'menstrual';
  if (dia <= 13) return 'folicular';
  if (dia <= 17) return 'ovulatoria';
  return 'lutea';
}

function normalizarRepsIntervalo_(valor) {
  const raw = String(valor || '').trim();
  if (!raw) return raw;
  const numeros = raw.match(/\d+/g);
  if (!numeros || !numeros.length) return raw;
  if (numeros.length === 1) return numeros[0];
  return numeros[numeros.length - 1];
}

function repsPorIntervaloDescanso_(intervalo) {
  const valor = Number(intervalo);
  if (!valor) return '';
  const mapa = {
    30: '18',
    45: '15',
    60: '12',
    75: '10',
    90: '8',
    120: '6',
    180: '4'
  };
  return mapa[valor] || '';
}

function gerarBaseOvulatoria_(p, padrao, base) {
  const diasRows = [];
  let faseAnterior = null;
  let planoFaseAtual = null;
  let ctxAnterior = null;
  const diasParaGerar = resolverDiasBaseOvulatoria_(padrao);

  for (let i = 0; i < diasParaGerar.length; i++) {
    const dia = diasParaGerar[i];
    const estrutura = padrao[(i) % padrao.length];
    const faseAtual = fasePorDiaCiclo_(dia);

    // Planeja a fase somente quando muda
    if (!planoFaseAtual || faseAtual !== faseAnterior) {
      planoFaseAtual = planejarFaseComOpenAI_(
        faseAtual,
        p.nivel,
        p.enfase
      );
    }

    const ctx = {
      dia,
      fase: faseAtual,
      nivel: p.nivel,
      enfase: p.enfase,
      estrutura,
      destino: p.destino,
      idAluna: p.idAluna,
      serieEspecialAtiva: p.serieEspecialAtiva,
      serieEspecialFase: p.serieEspecialFase,
      serieEspecialTipo: p.serieEspecialTipo,
      serieEspecialDiaTipo: p.serieEspecialDiaTipo,
      padraoCiclo: padrao,
      distribuicao: Array.isArray(padrao) ? padrao.join('') : 'ABCDE',
      historico: [],
      _planoFase: planoFaseAtual,
      _ancoras: ctxAnterior?._ancoras || {}
    };
    ctx.serieEspecialTipoDia = resolverTipoSerieEspecialDia_(ctx);

    // ============================
    // INTENÇÕES DO DIA
    // ============================
    ctx._intencoesDia = [];

    if (estrutura === 'C') {
      ctx._intencoesDia.push({
        grupo_principal: normalizarEnfaseParaGrupo_(ctx.enfase),
        subpadrao_movimento: null,
        equipamento_preferencial: null
      });
    } else {
      const intencoesFase = extrairIntencoesDoPlano_(
        planoFaseAtual,
        estrutura,
        dia
      );
      ctx._intencoesDia.push(...intencoesFase);
    }

    // ============================
    // RESOLUÇÃO DE EXERCÍCIOS
    // ============================
    const qtdBase = qtdExerciciosTreino_(ctx.nivel, ctx.fase, estrutura);
    ctx.qtdExercicios = ajustarQtdExerciciosPorSerieEspecial_(ctx, qtdBase);

    let exerciciosResolvidos = [];

    if (usarOpenAIComoFontePrimaria_(ctx)) {

      const brutos =
        plannerExerciciosOpenAI_(ctx, ctx.qtdExercicios);

      salvarExerciciosParaEnfase_(ctx, brutos);

      exerciciosResolvidos = brutos
        .map(ex => resolverExercicioPorTitulo_(ex.titulo_pt, ctx))
        .filter(Boolean);

    } else {

      exerciciosResolvidos = ctx._intencoesDia
        .map(intent =>
          resolverExercicioPorIntencao_(
            intent,
            ctx,
            base,
            diasRows
          )
        )
        .filter(Boolean);
    }

    exerciciosResolvidos = prepararExerciciosParaBase_(exerciciosResolvidos, ctx, base);
    exerciciosResolvidos = completarExerciciosMinimo_(
      ctx,
      base,
      exerciciosResolvidos,
      diasRows
    );
    ctx.exerciciosResolvidos = exerciciosResolvidos;

    // ============================
    // GERAR LINHAS DO DIA
    // ============================
    const rowsDia = gerarDia_(ctx);
    diasRows.push(...rowsDia);

    ctxAnterior = ctx;
    faseAnterior = faseAtual;
  }

  return linkerAplicarBase_(diasRows);
}

function gerarBaseOvulatoriaSomente_(pedidoTexto) {
  const p = parsePedido_(pedidoTexto);
  validarPedido_(p);

  const base = carregarBaseExercicios_();
  const padrao = resolverPadraoCiclo_(p.padraoCiclo);
  const linked = gerarBaseOvulatoria_(p, padrao, base);

  salvarNaAbaTabela_(Object.assign({}, p, { destino: 'BASE_OVULATORIA' }), linked);

  return gerarCSV_(linked);
};

function distribuirBaseOvulatoriaSomente_(pedidoTexto) {
  const p = parsePedido_(pedidoTexto);
  validarPedido_(p);

  const padrao = resolverPadraoCiclo_(p.padraoCiclo);
  const distribuido = distribuirBaseOvulatoriaPara30Dias_(p, padrao);

  salvarNaAbaTabela_(p, distribuido);
  return gerarCSV_(distribuido);
};

function distribuirBaseOvulatoriaPara30Dias_(p, padrao) {
  const baseRows = carregarBaseOvulatoria_();
  const diasBase = resolverDiasBaseOvulatoria_(padrao);
  const diasDistribuicao = resolverDiasDistribuicaoPorFase_(padrao);
  const porDiaBase = {};

  diasBase.forEach(dia => {
    const rowsDia = baseRows.filter(r => Number(r.dia) === Number(dia));
    const unique = new Map();
    rowsDia.forEach(row => {
      const key = [
        row.tipo,
        row.box,
        row.ordem,
        row.titulo_pt,
        row.titulo_en,
        row.titulo_fr,
        row.link,
        row.tempo,
        row.distancia,
        row.intervalo,
        row.especial
      ].map(v => String(v || '').trim()).join('|');
      if (!unique.has(key)) unique.set(key, row);
    });
    porDiaBase[dia] = Array.from(unique.values());
  });

  const rows = [];
  const normalizarBoxSemEspecial = (box) => {
    const raw = String(box || '').trim();
    const matchNumero = raw.match(/^(\d+)/);
    if (matchNumero) return matchNumero[1];
    const matchTexto = raw.match(/[a-z]+/i);
    return matchTexto ? matchTexto[0].toUpperCase() : raw;
  };
  const normalizarReps_ = (valor) => {
    return normalizarRepsIntervalo_(valor);
  };
  const contarTreinos_ = (lista) => {
    const dados = Array.isArray(lista) ? lista : [];
    return dados.filter(item => String(item.tipo || '').trim() === 'treino').length;
  };
  const maxPorBox_ = (nivelTreino) => {
    const nivelNormalizado = String(nivelTreino || '').toLowerCase();
    if (nivelNormalizado === 'avancada') return 5;
    if (nivelNormalizado === 'intermediaria') return 4;
    return 3;
  };
  const isolarBoxesEspeciais_ = (lista) => {
    const linhas = Array.isArray(lista) ? lista : [];
    const saida = [];
    let ultimoBoxRaw = null;
    let boxSequencial = 0;

    linhas.forEach(linha => {
      const copia = Object.assign({}, linha);
      if (String(copia.tipo || '').trim() !== 'treino') {
        saida.push(copia);
        return;
      }

      const boxRaw = String(copia.box || '').trim();
      if (boxRaw !== ultimoBoxRaw) {
        boxSequencial += 1;
        ultimoBoxRaw = boxRaw;
      }

      const matchSufixo = boxRaw.match(/[a-z]+$/i);
      const sufixo = matchSufixo ? String(matchSufixo[0]).toUpperCase() : '';
      copia.box = `${boxSequencial}${sufixo}`;
      saida.push(copia);
    });

    return saida;
  };
  const selecionarDiaBase_ = (diaBase, ctx, usoDiaBase, ultimoDiaBase) => {
    const minimoTreinos = qtdExerciciosTreino_(ctx.nivel, ctx.fase, ctx.estrutura);
    const totalDias = diasBase.length;
    const idxBase = diasBase.indexOf(diaBase);
    const candidatos = diasBase.map((dia, idx) => {
      const linhas = porDiaBase[dia] || [];
      const treinos = contarTreinos_(linhas);
      const distancia = Math.min(
        (idx - idxBase + totalDias) % totalDias,
        (idxBase - idx + totalDias) % totalDias
      );
      return { dia, treinos, distancia, uso: usoDiaBase[dia] || 0 };
    });
    const comMinimo = candidatos
      .filter(candidato => candidato.treinos >= minimoTreinos)
      .sort((a, b) => (a.distancia - b.distancia) || (b.treinos - a.treinos) || (a.uso - b.uso));
    if (comMinimo.length) {
      const preferidos = comMinimo.filter(candidato => candidato.dia !== ultimoDiaBase);
      return (preferidos[0] || comMinimo[0]).dia;
    }

    const melhor = candidatos.sort((a, b) => b.treinos - a.treinos)[0];
    return melhor?.dia || diaBase;
  };

  const usoDiaBase = {};
  let ultimoDiaBase = null;
  for (let i = 0; i < diasDistribuicao.length; i++) {
    const diaInfo = diasDistribuicao[i];
    const dia = diaInfo.dia;
    const idxBase = i % diasBase.length;
    let diaBase = diasBase[idxBase];
    const fase = diaInfo.fase;
    const estrutura = padrao[diaInfo.indiceNaFase % padrao.length];

    const ctx = {
      dia,
      fase,
      nivel: p.nivel,
      enfase: p.enfase,
      estrutura,
      distribuicao: Array.isArray(padrao) ? padrao.join('') : 'ABCDE'
    };

    const seriesBase = seriesPorFaseNivel_(ctx.nivel, ctx.fase, ctx.estrutura);
    const repsBase = normalizarRepsIntervalo_(
      repsPorSeries_(ctx.nivel, seriesBase, ctx.fase, ctx.estrutura)
    );
    const hiitRegra = hiitPermitidoOuObrigatorio_(ctx.fase);
    const maxPorBox = maxPorBox_(ctx.nivel);

    const treinosDiaBase = contarTreinos_(porDiaBase[diaBase] || []);
    if (!treinosDiaBase) {
      diaBase = selecionarDiaBase_(diaBase, ctx, usoDiaBase, ultimoDiaBase);
    }
    usoDiaBase[diaBase] = (usoDiaBase[diaBase] || 0) + 1;
    ultimoDiaBase = diaBase;
    const linhasDia = (porDiaBase[diaBase] || []).map(row => {
      const copia = Object.assign({}, row);
      copia.dia = dia;
      copia.fase = dia === 18 ? 'lutea' : ctx.fase;
      copia.enfase = ctx.enfase;
      copia.reps = normalizarReps_(copia.reps);
      const especialRaw = String(copia.especial || '').trim();
      const tempoRaw = String(copia.tempo || '').trim();
      const distanciaRawInicial = String(copia.distancia || '').trim();
      const especialCodes = ['I','RP','CC','SM','AE','D','Q','T','B','C'];

      if (!especialRaw && especialCodes.includes(tempoRaw.toUpperCase()) && distanciaRawInicial) {
        copia.especial = tempoRaw.toUpperCase();
        copia.tempo = distanciaRawInicial;
        copia.distancia = '';
      }

      const distanciaRaw = String(copia.distancia || '').trim();

      if (copia.tipo === 'treino') {
        copia.series = String(seriesBase);
        copia.intervalo = copia.intervalo || FEMFLOW.INTERVALO_TREINO;
        const repsPorIntervalo = repsPorIntervaloDescanso_(copia.intervalo);
        copia.reps = repsPorIntervalo || String(repsBase);
        if (distanciaRaw) {
          copia.reps = '';
        }
        // ✅ Nova regra:
        // - folicular: pode manter série especial em todos os dias
        // - ovulatória: pode manter série especial
        // - menstrual/lútea: não pode manter série especial
        const fasePermiteEspecial = ctx.fase === 'folicular' || ctx.fase === 'ovulatoria';
        if (!fasePermiteEspecial) {
          copia.box = normalizarBoxSemEspecial(copia.box);
          copia.especial = '';
        }
      }

      if (String(copia.tempo || '').trim()) {
        copia.reps = '';
      }
      if (distanciaRaw) {
        copia.reps = '';
      }

      return copia;
    });

    const boxCounts = {};
    const linhasDiaFiltradas = [];
    linhasDia.forEach(linha => {
      if (linha.tipo === 'hiit' && !hiitRegra.allow) return;
      if (linha.tipo === 'treino') {
        const boxKey = String(linha.box || '').trim();
        boxCounts[boxKey] = (boxCounts[boxKey] || 0) + 1;
        if (boxCounts[boxKey] > maxPorBox) return;
      }
      linhasDiaFiltradas.push(linha);
    });

    const linhasDiaComBoxesIsolados = isolarBoxesEspeciais_(linhasDiaFiltradas);

    const distribuicao = Array.isArray(padrao) ? padrao.join('') : 'ABCDE';
    const qtdTreinoDia = linhasDiaComBoxesIsolados
      .filter(linha => String(linha?.tipo || '').trim() === 'treino')
      .length;

    linhasDiaComBoxesIsolados.forEach(linha => {
      linha.distribuicao = distribuicao;
      linha.qttd_exercicio = qtdTreinoDia;
      rows.push(linha);
    });
  }

  return rows;
}

function carregarBaseOvulatoria_() {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName('BASE_OVULATORIA');
  if (!sh) throw new Error('Aba BASE_OVULATORIA não encontrada.');

  const vals = sh.getDataRange().getValues();
  if (!vals.length) return [];

  const header = vals.shift().map(h => String(h || '').trim());
  const rows = vals.map(r => {
    const obj = {};
    header.forEach((col, idx) => {
      obj[col] = r[idx];
    });
    return obj;
  });

  return rows.filter(r => r.tipo);
}

function ajustarQtdExerciciosPorSerieEspecial_(ctx, qtdBase) {
  const nivel = String(ctx?.nivel || '').toLowerCase();
  const minPorNivel = { iniciante: 4, intermediaria: 6, avancada: 8 };
  const maxPorNivel = { intermediaria: 8, avancada: 10 };

  let qtd = Math.max(Number(qtdBase) || 0, minPorNivel[nivel] || 0);

  const tipoEspecial = resolverTipoSerieEspecialDia_(ctx);
  if (tipoEspecial === 'b' || tipoEspecial === 't') {
    const max = maxPorNivel[nivel];
    if (max) qtd = Math.max(qtd, max);
  }

  return qtd;
}

function resolverTipoSerieEspecialDia_(ctx) {
  const mapaDiaTipo = ctx?.serieEspecialDiaTipo || null;
  const tipoDia = mapaDiaTipo ? String(mapaDiaTipo[ctx?.dia] || '').toLowerCase() : '';
  if (tipoDia) return tipoDia;

  const ativa = Boolean(ctx?.serieEspecialAtiva);
  const faseSelecionada = String(ctx?.serieEspecialFase || '').toLowerCase();
  const faseDia = String(ctx?.fase || '').toLowerCase();
  const tipoSelecionado = String(ctx?.serieEspecialTipo || '').toLowerCase();
  if (ativa && faseSelecionada && faseSelecionada === faseDia && tipoSelecionado) {
    return tipoSelecionado;
  }

  return '';
}

function prepararExerciciosParaBase_(exercicios, ctx, base) {
  const lista = Array.isArray(exercicios) ? exercicios : [];
  const seriesBase = seriesPorFaseNivel_(ctx.nivel, ctx.fase, ctx.estrutura);
  const repsBase = repsPorSeries_(ctx.nivel, seriesBase, ctx.fase, ctx.estrutura);

  return lista.map(ex => {
    const tituloPt = ex.titulo_pt || ex.pt || ex.titulo || '';
    let tituloEn = ex.titulo_en || ex.en || '';
    let tituloFr = ex.titulo_fr || ex.fr || '';
    let link = ex.link || '';

    if (base && tituloPt && (!tituloEn || !tituloFr || !link)) {
      const hit = encontrarHitBase_(tituloPt, base, ctx.nivel);
      if (hit) {
        tituloEn = tituloEn || hit.en || hit.titulo_en || '';
        tituloFr = tituloFr || hit.fr || hit.titulo_fr || '';
        link = link || hit.link || '';
      }
    }

    return Object.assign({}, ex, {
      titulo_pt: tituloPt,
      titulo_en: tituloEn,
      titulo_fr: tituloFr,
      link,
      series: ex.series || String(seriesBase),
      reps: normalizarRepsIntervalo_(ex.reps) || String(repsBase)
    });
  });
}

function completarExerciciosMinimo_(ctx, base, exercicios, historico) {
  const lista = Array.isArray(exercicios) ? exercicios.slice() : [];
  const alvo = Number(ctx.qtdExercicios || 0);
  if (!alvo || lista.length >= alvo) return lista;

  const intents = Array.isArray(ctx._intencoesDia) ? ctx._intencoesDia : [];
  const vistos = new Set(lista.map(ex => String(ex.titulo_pt || ex.pt || ex.titulo || '').toLowerCase()));
  let tentativas = 0;
  const limite = Math.max(20, alvo * 4);

  while (lista.length < alvo && tentativas < limite) {
    const intent = intents[tentativas % Math.max(1, intents.length)] || {};
    const candidato = resolverExercicioPorIntencao_(
      intent,
      ctx,
      base,
      historico
    );
    tentativas += 1;
    if (!candidato) continue;

    const titulo = String(candidato.titulo_pt || candidato.pt || candidato.titulo || '').toLowerCase();
    if (!titulo || vistos.has(titulo)) continue;
    vistos.add(titulo);

    const preparado = prepararExerciciosParaBase_([candidato], ctx, base)[0];
    lista.push(preparado);
  }

  return lista;
}

/* ========================================================================
   ✅ ADIÇÃO: MALEFLOW — GERAR BASE ABCDE (5 dias)
   ------------------------------------------------------------------------
   - Não altera FemFlow
   - Reusa resolver/normalização/banco/gerarDia_
   - Escreve na aba BASE_ABCDE
   - ctx carrega: ciclo + diatreino
   - usa fase fixa "ovulatoria" para reaproveitar regras (HIIT/Especial)
   ======================================================================== */

/**
 * Gera SOMENTE a base MaleFlow (ABCDE) e salva em BASE_ABCDE
 * pedidoTexto pode vir com:
 * - nivel
 * - enfase
 * - padraoCiclo (opcional, default ABCDE)
 * - destino (ignoramos, forçamos BASE_ABCDE)
 */
function gerarBaseMaleFlowSomente_(pedidoTexto) {
  const p = parsePedido_(pedidoTexto);
  validarPedido_(p);

  const base = carregarBaseExercicios_();
  const padrao = resolverPadraoCiclo_(p.padraoCiclo); // ABC/ABCD/ABCDE
  const linked = gerarBaseABCDE_MaleFlow_(p, padrao, base);

  salvarNaAbaTabela_(Object.assign({}, p, { destino: 'BASE_ABCDE' }), linked);
  return gerarCSV_(linked);
}

/**
 * Gera a base ABCDE (5 dias) para MaleFlow.
 * - ciclo = string do padrao (ex: "ABCDE")
 * - diatreino = A..E
 * - fase fixa "ovulatoria" (para reaproveitar infra existente sem hormonal)
 */
function gerarBaseABCDE_MaleFlow_(p, padrao, base) {
  const diasRows = [];

  // ciclo textual (ABC/ABCD/ABCDE)
  const cicloTxt = Array.isArray(padrao) ? padrao.join('') : String(padrao || 'ABCDE');

  // gera 1..N dias correspondentes ao padrao (A,B,C,D,E)
  for (let i = 0; i < padrao.length; i++) {
    const diatreino = padrao[i]; // A..E
    const estrutura = diatreino; // reaproveita estrutura A–E

    // ctx MaleFlow
    const ctx = {
      // FemFlow fields (mantemos preenchidos para compatibilidade de helpers)
      dia: i + 1,                 // só para ordenação local (não é ciclo de 30)
      fase: 'ovulatoria',         // fixo
      nivel: p.nivel,
      enfase: p.enfase,
      estrutura,

      // MaleFlow fields (novos)
      ciclo: cicloTxt,
      diatreino: diatreino,

      destino: 'BASE_ABCDE',
      idAluna: p.idAluna,

      // mantém série especial se vier no pedido
      serieEspecialAtiva: p.serieEspecialAtiva,
      serieEspecialFase: p.serieEspecialFase,
      serieEspecialTipo: p.serieEspecialTipo,
      serieEspecialDiaTipo: p.serieEspecialDiaTipo,

      padraoCiclo: padrao,
      distribuicao: cicloTxt,
      historico: []
    };
    ctx.serieEspecialTipoDia = resolverTipoSerieEspecialDia_(ctx);

    // Intenções: reaproveita a mesma regra estrutural do FemFlow
    ctx._intencoesDia = [];
    if (estrutura === 'C') {
      ctx._intencoesDia.push({
        grupo_principal: normalizarEnfaseParaGrupo_(ctx.enfase),
        subpadrao_movimento: null,
        equipamento_preferencial: null
      });
    } else {
      // no MaleFlow sem plano de fase: usamos intenção "padrão do microciclo" por estrutura
      // Se não existir helper, cai em vazio e o resolver usa fallback de base.
      const intencoes = (typeof extrairIntencoesDoPlano_ === 'function')
        ? extrairIntencoesDoPlano_(null, estrutura, ctx.dia)
        : [];
      if (Array.isArray(intencoes) && intencoes.length) ctx._intencoesDia.push(...intencoes);
    }

    // Quantidade alvo (MaleFlow: mínimo 4/6/8, teto 10 é aplicado no gerarDia_)
    const qtdBase = qtdExerciciosTreino_(ctx.nivel, ctx.fase, estrutura);
    ctx.qtdExercicios = ajustarQtdExerciciosPorSerieEspecial_(ctx, qtdBase);

    // Resolver exercícios (sem OpenAI como primária aqui — mas se você quiser manter, respeita flags)
    let exerciciosResolvidos = [];

    if (usarOpenAIComoFontePrimaria_(ctx)) {
      const brutos = plannerExerciciosOpenAI_(ctx, ctx.qtdExercicios);
      salvarExerciciosParaEnfase_(ctx, brutos);
      exerciciosResolvidos = brutos
        .map(ex => resolverExercicioPorTitulo_(ex.titulo_pt, ctx))
        .filter(Boolean);
    } else {
      exerciciosResolvidos = ctx._intencoesDia
        .map(intent =>
          resolverExercicioPorIntencao_(
            intent,
            ctx,
            base,
            diasRows
          )
        )
        .filter(Boolean);
    }

    exerciciosResolvidos = prepararExerciciosParaBase_(exerciciosResolvidos, ctx, base);
    exerciciosResolvidos = completarExerciciosMinimo_(ctx, base, exerciciosResolvidos, diasRows);
    ctx.exerciciosResolvidos = exerciciosResolvidos;

    // Gera linhas do dia (07 já inclui ciclo/diatreino no output)
    const rowsDia = gerarDia_(ctx);

    // Ajuste final: garantir que o "dia" seja o diatreino no output se necessário
    // (sem quebrar FemFlow; apenas sobrescreve campos quando existirem)
    rowsDia.forEach(r => {
      r.ciclo = cicloTxt;
      r.diatreino = diatreino;
    });

    diasRows.push(...rowsDia);
  }

  return linkerAplicarBase_(diasRows);
}
