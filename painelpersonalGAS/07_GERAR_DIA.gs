/* ========================================================================
   FEMFLOW — 07_GERAR_DIA.gs (VERSÃO FINAL)
   ------------------------------------------------------------------------
   Responsável APENAS por montar o DIA de treino:
   - linhas CSV
   - boxes
   - tempos
   - HIIT
   ------------------------------------------------------------------------
   ✅ ordem: 1..N dentro de cada box
   ✅ limite: máx 10 exercícios tipo "treino" por dia (não conta aquecimento/hiit/resfriamento)
   ✅ compatível com FemFlow (fase/dia) e MaleFlow (ciclo/diatreino) via ctx (campos extra ignorados)
   ======================================================================== */

const MAX_TREINO_EXERCICIOS_POR_DIA = 10; // MaleFlow regra: teto para 1h20

function enriquecerResumoDia_(linhas, ctx) {
  const lista = Array.isArray(linhas) ? linhas : [];
  const distribuicao = String(ctx?.distribuicao || '').trim().toUpperCase() || 'ABCDE';
  const qtdTreino = lista.filter(item => String(item?.tipo || '').trim() === 'treino').length;

  return lista.map(item => Object.assign({}, item, {
    distribuicao,
    qttd_exercicio: qtdTreino
  }));
}


/**
 * Gera todas as linhas de UM dia de treino
 */
function gerarDia_(ctx) {
  const linhas = [];

  // ================================
  // AQUECIMENTO (box 0, ordem 1)
  // ================================
  linhas.push(linhaTempo_('aquecimento', 0, 1, ctx, FEMFLOW.TEMPO_AQUECIMENTO));

  // ================================
  // EXERCÍCIOS (JÁ RESOLVIDOS)
  // ================================
  const exerciciosAll = Array.isArray(ctx.exerciciosResolvidos) ? ctx.exerciciosResolvidos : [];

  // ✅ Limite para tipo treino: máx 10 por dia
  // Observação: exerciciosResolvidos aqui já são "treino" (força). Mesmo assim, clamp.
  const exercicios = exerciciosAll.slice(0, Number(ctx?.maxTreinoExercicios || MAX_TREINO_EXERCICIOS_POR_DIA));

  const caixas = montarBoxesComSeriesEspeciais_(exercicios, ctx);

  // Para garantir ordem 1..N dentro de cada box:
  // boxIdx -> contador (reinicia em cada box)
  caixas.forEach((boxExs, boxIdx) => {
    const boxAtual = boxIdx + 1; // treino começa em box 1
    let ordemBox = 0;

    boxExs.forEach((ex) => {
      const tempo = ex.tempo || '';
      linhas.push({
        tipo: 'treino',
        box: boxAtual,
        ordem: ++ordemBox, // ✅ 1..N dentro do box
        enfase: ctx.enfase,

        // FemFlow:
        fase: ctx.fase,
        dia: ctx.dia,

        // MaleFlow (se existir no ctx, não atrapalha):
        ciclo: ctx.ciclo,
        diatreino: ctx.diatreino,

        titulo_pt: ex.titulo_pt || '',
        titulo_en: ex.titulo_en || '',
        titulo_fr: ex.titulo_fr || '',
        link: ex.link || '',
        series: ex.series || '',
        reps: tempo ? '' : (ex.reps || ''),
        especial: ex.especial || '',
        tempo,
        intervalo: ex.intervalo || FEMFLOW.INTERVALO_TREINO,
        forte: '',
        leve: '',
        ciclos: '',
        distribuicao: String(ctx?.distribuicao || '').trim().toUpperCase() || '',
        qttd_exercicio: Number(ctx?.qtdExercicios || 0)
      });
    });
  });

  // ================================
  // HIIT (box 0) — ordem dentro do box
  // ================================
  if (ctx.hiit && ctx.hiit.permitido) {
    // ✅ ordem dentro do box 0: aquecimento já ocupou ordem 1
    // Se quiser HIIT após treino mas mantendo box 0, usamos ordem 2.
    linhas.push(linhaHiit0_(ctx, ctx.hiit.forte, ctx.hiit.leve, ctx.hiit.ciclos, 2));
  }

  // ================================
  // RESFRIAMENTO (box 0) — ordem dentro do box
  // ================================
  // Se HIIT existe, resfriamento vira ordem 3; senão ordem 2
  const ordemResfriamento = (ctx.hiit && ctx.hiit.permitido) ? 3 : 2;
  linhas.push(linhaTempo_('resfriamento', 0, ordemResfriamento, ctx, FEMFLOW.TEMPO_RESFRIAMENTO));

  return enriquecerResumoDia_(linhas, ctx);
}



/**
 * Linha genérica de tempo (aquecimento / resfriamento)
 */
function linhaTempo_(tipo, box, ordem, ctx, tempoSeg) {
  return {
    tipo,
    box,
    ordem,
    enfase: ctx.enfase,

    // FemFlow:
    fase: ctx.fase,
    dia: ctx.dia,

    // MaleFlow (se existir no ctx):
    ciclo: ctx.ciclo,
    diatreino: ctx.diatreino,

    titulo_pt: '',
    titulo_en: '',
    titulo_fr: '',
    link: '',
    series: '',
    reps: '',
    especial: '',
    tempo: String(tempoSeg),
    intervalo: '',
    forte: '',
    leve: '',
    ciclos: '',
    distribuicao: String(ctx?.distribuicao || '').trim().toUpperCase() || '',
    qttd_exercicio: Number(ctx?.qtdExercicios || 0)
  };
}


/**
 * Linha de HIIT (sempre box 0)
 */
function linhaHiit0_(ctx, forte, leve, ciclos, ordem) {
  return {
    tipo: 'hiit',
    box: 0,
    ordem: ordem || 1,
    enfase: ctx.enfase,

    // FemFlow:
    fase: ctx.fase,
    dia: ctx.dia,

    // MaleFlow (se existir no ctx):
    ciclo: ctx.ciclo,
    diatreino: ctx.diatreino,

    titulo_pt: '',
    titulo_en: '',
    titulo_fr: '',
    link: '',
    series: '',
    reps: '',
    especial: '',
    tempo: '',
    intervalo: '',
    forte: String(forte),
    leve: String(leve),
    ciclos: String(ciclos),
    distribuicao: String(ctx?.distribuicao || '').trim().toUpperCase() || '',
    qttd_exercicio: Number(ctx?.qtdExercicios || 0)
  };
}


/**
 * Distribui exercícios em boxes
 * - mantém regra antiga de "boxes de 2-4" focada em ~3 por box
 */
function distribuirBoxes_(arr, maxPorBox) {
  const n = arr.length;
  if (n <= maxPorBox) return [arr];

  const boxes = [];
  let i = 0;
  let rest = n;

  while (rest > 0) {
    let take = 3;

    if (rest === 4) take = 2;
    else if (rest === 5) take = 3;
    else if (rest === 6) take = 3;
    else if (rest === 7) take = 3;
    else if (rest === 8) take = 3;
    else if (rest === 9) take = 3;
    else if (rest === 10) take = 4;
    else if (rest <= maxPorBox) take = rest;

    boxes.push(arr.slice(i, i + take));
    i += take;
    rest -= take;
  }

  return boxes;
}

function montarBoxesComSeriesEspeciais_(exercicios, ctx) {
  const lista = Array.isArray(exercicios)
    ? exercicios.map(ex => Object.assign({}, ex))
    : [];

  const regras = Array.isArray(FEMFLOW_SERIES_ESPECIAIS)
    ? FEMFLOW_SERIES_ESPECIAIS
    : [];

  const ativa = Boolean(ctx?.serieEspecialAtiva);
  const faseSelecionada = String(ctx?.serieEspecialFase || '').toLowerCase();
  const faseDia = String(ctx?.fase || '').toLowerCase();
  const tipoSelecionado = String(ctx?.serieEspecialTipo || '').toLowerCase();
  const mapaDiaTipo = ctx?.serieEspecialDiaTipo || null;
  const tipoDia = mapaDiaTipo ? String(mapaDiaTipo[ctx?.dia] || '').toLowerCase() : '';

  if (ativa && tipoDia) {
    const codigoSelecionado = resolverSerieEspecialCodigo_(tipoDia, regras);
    const quantidade = quantidadeSerieEspecial_(codigoSelecionado);
    if (codigoSelecionado && quantidade > 0) {
      const especiais = lista.slice(0, quantidade);
      especiais.forEach(ex => { ex.especial = codigoSelecionado; });
      const restantes = lista.slice(quantidade);
      const caixasRestantes = distribuirBoxes_(restantes, 3);
      return [especiais, ...caixasRestantes].filter(box => box.length);
    }
  }

  if (ativa && faseSelecionada && faseSelecionada === faseDia && tipoSelecionado) {
    const codigoSelecionado = resolverSerieEspecialCodigo_(tipoSelecionado, regras);
    const quantidade = quantidadeSerieEspecial_(codigoSelecionado);
    if (codigoSelecionado && quantidade > 0) {
      const especiais = lista.slice(0, quantidade);
      especiais.forEach(ex => { ex.especial = codigoSelecionado; });
      const restantes = lista.slice(quantidade);
      const caixasRestantes = distribuirBoxes_(restantes, 3);
      return [especiais, ...caixasRestantes].filter(box => box.length);
    }
  }

  lista.forEach(ex => {
    const titulo = String(ex?.titulo_pt || '');
    const especial = resolverSerieEspecialSelecionada_(titulo, regras);
    if (especial) ex.especial = especial;
  });

  return distribuirBoxes_(lista, 3);
}

function resolverSerieEspecialSelecionada_(titulo, regras) {
  const base = String(titulo || '').trim();
  if (!base) return '';

  const match = base.match(/(?:\s+|\s*[-–—]\s*)([a-z]{1,2})$/i);
  if (!match) return '';

  const sufixo = String(match[1] || '').toLowerCase();
  return resolverSerieEspecialCodigo_(sufixo, regras);
}

function resolverSerieEspecialCodigo_(valor, regras) {
  const chave = String(valor || '').toLowerCase();
  if (!chave) return '';
  const regra = regras.find(item => {
    const sufixo = String(item?.sufixo || '').toLowerCase();
    const codigo = String(item?.codigo || '').toLowerCase();
    return chave === sufixo || chave === codigo;
  });
  return regra ? String(regra.codigo || '') : '';
}

function quantidadeSerieEspecial_(codigo) {
  const tipo = String(codigo || '').toUpperCase();
  const mapa = { Q: 4, T: 3, B: 2 };
  return mapa[tipo] || 1;
}
