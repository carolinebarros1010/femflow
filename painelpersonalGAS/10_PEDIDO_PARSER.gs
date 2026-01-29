/* ========================================================================
   FEMFLOW — 10_PEDIDO_PARSER.gs (VERSÃO FINAL)
   ------------------------------------------------------------------------
   Responsabilidade ÚNICA:
   - Parser e validação de pedido textual
   ------------------------------------------------------------------------
   ⚠️ Não renomear funções.
   ------------------------------------------------------------------------
   ✅ Adição cirúrgica: suporte MaleFlow (target/app, ciclo/diatreino)
   ======================================================================== */

function parsePedido_(pedidoTexto) {
  // ============================================================
  // Caso venha objeto (POST JSON)
  // ============================================================
  if (pedidoTexto && typeof pedidoTexto === 'object') {
    return {
      // FemFlow
      nivel: normalizar_(pedidoTexto.nivel),
      enfase: normalizar_(pedidoTexto.enfase),
      faseInicial: normalizarFase_(pedidoTexto.fase || pedidoTexto.faseInicial),

      // Shared
      destino: pedidoTexto.destino ? String(pedidoTexto.destino).trim() : null,
      idAluna: pedidoTexto.id_aluna ? String(pedidoTexto.id_aluna).trim() : null,
      formato: pedidoTexto.formato || null,
      observacao: pedidoTexto.observacao || null,

      // ciclo (aceita também ABCDE direto)
      padraoCiclo: normalizarPadraoCiclo_(pedidoTexto.padraoCiclo || pedidoTexto.ciclo),

      // MaleFlow
      target: normalizarTarget_(pedidoTexto.target || pedidoTexto.app),
      ciclo: normalizarCiclo_(pedidoTexto.ciclo),
      diatreino: normalizarDiaTreino_(pedidoTexto.diatreino),

      // Série especial
      serieEspecialAtiva: normalizarSerieEspecialAtiva_(pedidoTexto.serieEspecialAtiva),
      serieEspecialFase: normalizarFase_(pedidoTexto.serieEspecialFase),
      serieEspecialTipo: normalizarSerieEspecialTipo_(pedidoTexto.serieEspecialTipo),
      serieEspecialDiaTipo: normalizarSerieEspecialDiaTipo_(pedidoTexto.serieEspecialDiaTipo)
    };
  }

  // ============================================================
  // Caso venha texto (GET / pedidoTexto)
  // ============================================================
  const texto = String(pedidoTexto || '');
  const linhas = texto.split(/\r?\n/);

  const pedido = {
    // FemFlow
    nivel: null,
    enfase: null,
    faseInicial: null,

    // Shared
    destino: null,
    idAluna: null,
    formato: null,
    observacao: null,

    // ciclo (legado + novo)
    padraoCiclo: null,

    // MaleFlow
    target: null,
    ciclo: null,
    diatreino: null,

    // Série especial
    serieEspecialAtiva: null,
    serieEspecialFase: null,
    serieEspecialTipo: null,
    serieEspecialDiaTipo: null
  };

  linhas.forEach(linha => {
    const trimmed = String(linha || '').trim();
    if (!trimmed || trimmed.indexOf(':') === -1) return;

    const partes = trimmed.split(':');
    const chaveRaw = partes.shift();
    const valor = partes.join(':').trim();
    if (!chaveRaw) return;

    const chave = normalizaKey_(chaveRaw);

    if (chave === 'nivel') {
      pedido.nivel = normalizar_(valor);
      return;
    }

    if (chave === 'enfase') {
      pedido.enfase = normalizar_(valor);
      return;
    }

    if (chave === 'fase' || chave === 'fase_inicial' || chave === 'fase_inicial_selecionada') {
      pedido.faseInicial = normalizarFase_(valor) || normalizar_(valor);
      return;
    }

    if (chave === 'destino') {
      pedido.destino = valor || null;
      return;
    }

    if (chave === 'id_aluna' || chave === 'idaluna') {
      pedido.idAluna = valor || null;
      return;
    }

    if (chave === 'formato') {
      pedido.formato = valor || null;
      return;
    }

    if (chave === 'observacao') {
      pedido.observacao = valor || null;
      return;
    }

    // ciclo/padrão
    if (chave === 'padrao_ciclo' || chave === 'padrao' || chave === 'ciclo') {
      pedido.padraoCiclo = normalizarPadraoCiclo_(valor);
      pedido.ciclo = pedido.ciclo || normalizarCiclo_(valor);
      return;
    }

    // target/app
    if (chave === 'target' || chave === 'app') {
      pedido.target = normalizarTarget_(valor);
      return;
    }

    // MaleFlow diatreino
    if (chave === 'diatreino' || chave === 'dia_treino' || chave === 'dia_de_treino') {
      pedido.diatreino = normalizarDiaTreino_(valor);
      return;
    }

    // Série especial
    if (chave === 'serie_especial' || chave === 'serie_especial_ativa') {
      pedido.serieEspecialAtiva = normalizarSerieEspecialAtiva_(valor);
      return;
    }

    if (chave === 'serie_especial_fase') {
      pedido.serieEspecialFase = normalizarFase_(valor) || normalizar_(valor);
      return;
    }

    if (chave === 'serie_especial_tipo') {
      pedido.serieEspecialTipo = normalizarSerieEspecialTipo_(valor);
      return;
    }

    if (chave === 'serie_especial_dia_tipo' || chave === 'serie_especial_dias') {
      pedido.serieEspecialDiaTipo = normalizarSerieEspecialDiaTipo_(valor);
      return;
    }
  });

  return pedido;
}

function validarPedido_(p) {
  const pedido = p || {};

  // ============================================================
  // Normalizações
  // ============================================================
  if (pedido.idAluna && !pedido.destino) {
    pedido.destino = `personal_${pedido.idAluna}`;
  }

  if (pedido.nivel) pedido.nivel = normalizar_(pedido.nivel);
  if (pedido.enfase) pedido.enfase = normalizar_(pedido.enfase);

  // target/app
  pedido.target = normalizarTarget_(pedido.target);

  // ciclo/padrão
  if (pedido.padraoCiclo) pedido.padraoCiclo = normalizarPadraoCiclo_(pedido.padraoCiclo);
  pedido.ciclo = normalizarCiclo_(pedido.ciclo) || (pedido.padraoCiclo ? normalizarCiclo_(pedido.padraoCiclo) : null);
  pedido.diatreino = normalizarDiaTreino_(pedido.diatreino);

  // FemFlow fase inicial
  if (pedido.faseInicial) {
    pedido.faseInicial = normalizarFase_(pedido.faseInicial) || pedido.faseInicial;
  }

  // série especial
  if (pedido.serieEspecialAtiva === undefined || pedido.serieEspecialAtiva === null) {
    pedido.serieEspecialAtiva = false;
  }
  if (pedido.serieEspecialFase) {
    pedido.serieEspecialFase = normalizarFase_(pedido.serieEspecialFase) || pedido.serieEspecialFase;
  }
  if (pedido.serieEspecialTipo) {
    pedido.serieEspecialTipo = normalizarSerieEspecialTipo_(pedido.serieEspecialTipo);
  }
  if (pedido.serieEspecialDiaTipo) {
    pedido.serieEspecialDiaTipo = normalizarSerieEspecialDiaTipo_(pedido.serieEspecialDiaTipo);
  }

  // ============================================================
  // Detectar modo MaleFlow
  // - pelo target/app
  // - ou presença de ciclo/diatreino
  // ============================================================
  const isMale = (pedido.target === 'maleflow') || Boolean(pedido.ciclo || pedido.diatreino);

  // Defaults úteis (sem quebrar FemFlow)
  if (isMale) {
    // destino padrão da base MaleFlow
    if (!pedido.destino && !pedido.idAluna) pedido.destino = 'BASE_ABCDE';

    // se não houver fase inicial, forçamos ovulatoria para reaproveitar regras internas (HIIT/series)
    // (não atrapalha MaleFlow; apenas garante funções que esperam fase)
    if (!pedido.faseInicial) pedido.faseInicial = 'ovulatoria';

    // se não veio padraoCiclo, mas veio ciclo, tenta setar
    if (!pedido.padraoCiclo && pedido.ciclo) {
      pedido.padraoCiclo = normalizarPadraoCiclo_(pedido.ciclo) || pedido.padraoCiclo;
    }
  }

  // ============================================================
  // Validações
  // ============================================================
  const erros = [];

  if (!pedido.nivel) erros.push('nivel obrigatório');
  if (!pedido.enfase) erros.push('enfase obrigatória');

  // FemFlow: exige fase inicial
  // MaleFlow: fase inicial defaultada acima se necessário
  if (!pedido.faseInicial) erros.push('fase inicial obrigatória');

  if (!pedido.destino) erros.push('destino obrigatório');

  const niveisValidos = ['iniciante', 'intermediaria', 'avancada'];
  if (pedido.nivel && !niveisValidos.includes(pedido.nivel)) {
    erros.push('nivel inválido');
  }

  const fasesValidas = ['menstrual', 'folicular', 'ovulatoria', 'lutea'];
  if (pedido.faseInicial && !fasesValidas.includes(pedido.faseInicial)) {
    erros.push('fase inicial inválida');
  }

  // padrao ciclo (agora aceita ABCDE direto também)
  const padroesValidos = ['3', '4', '5', 'abc', 'abcd', 'abcde'];
  if (pedido.padraoCiclo && !padroesValidos.includes(pedido.padraoCiclo)) {
    erros.push('padrão de ciclo inválido');
  }

  // MaleFlow: se ciclo vier, deve ser ABC/ABCD/ABCDE
  if (isMale && pedido.ciclo) {
    const c = normalizarCiclo_(pedido.ciclo);
    if (!c) erros.push('ciclo inválido (use ABC, ABCD ou ABCDE)');
  }

  if (isMale && pedido.diatreino) {
    const d = normalizarDiaTreino_(pedido.diatreino);
    if (!d) erros.push('diatreino inválido (use A, B, C, D ou E)');
  }

  // Série especial
  if (pedido.serieEspecialAtiva) {
    if (pedido.serieEspecialDiaTipo && Object.keys(pedido.serieEspecialDiaTipo).length) {
      return pedido;
    }
    if (!pedido.serieEspecialFase || !fasesValidas.includes(pedido.serieEspecialFase)) {
      erros.push('fase de série especial inválida');
    }
    if (!pedido.serieEspecialTipo) {
      erros.push('tipo de série especial obrigatório');
    }
  }

  if (erros.length) {
    throw new Error('Pedido inválido: ' + erros.join('; '));
  }

  return pedido;
}

/* ============================================================
   Helpers (novos, sem renomear os existentes)
============================================================ */
function normalizarTarget_(valor) {
  const txt = String(valor || '').trim().toLowerCase();
  if (!txt) return null;
  if (txt === 'male' || txt === 'male-flow' || txt === 'maleflow') return 'maleflow';
  if (txt === 'femflow' || txt === 'fem' || txt === 'ff') return 'femflow';
  // se vier algo desconhecido, não falha aqui; validação decide
  return txt;
}

/* ============================================================
   Série especial — (mantido)
============================================================ */
function normalizarSerieEspecialAtiva_(valor) {
  if (valor === true) return true;
  const txt = String(valor || '').trim().toLowerCase();
  return ['1', 'sim', 'true', 'on', 'yes'].includes(txt);
}

function normalizarSerieEspecialTipo_(valor) {
  const txt = String(valor || '').trim();
  if (!txt) return null;
  return txt.toLowerCase();
}

function normalizarSerieEspecialDiaTipo_(valor) {
  if (!valor) return null;
  const texto = String(valor || '');
  const partes = texto.split(',');
  const mapa = {};

  partes.forEach(item => {
    const raw = String(item || '').trim();
    if (!raw) return;
    const match = raw.match(/^(\d{1,2})\s*[:\-]?\s*([a-z]{1,2})$/i);
    if (!match) return;
    const dia = Number(match[1]);
    if (!dia || dia < 1 || dia > 30) return;
    const tipo = String(match[2] || '').toLowerCase();
    if (!tipo) return;
    mapa[dia] = tipo;
  });

  return Object.keys(mapa).length ? mapa : null;
}

function normalizarPadraoCiclo_(valor) {
  const txt = String(valor || '').trim().toLowerCase();
  if (!txt) return null;

  // legado
  if (txt === '3' || txt === '4' || txt === '5') return txt;
  if (txt === 'abc' || txt === 'abcd' || txt === 'abcde') return txt;

  // novo: permite "ABCDE" direto e converte para abcde
  const up = txt.toUpperCase();
  if (up === 'ABC') return 'abc';
  if (up === 'ABCD') return 'abcd';
  if (up === 'ABCDE') return 'abcde';

  return null;
}
