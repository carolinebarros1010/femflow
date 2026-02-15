(function bodyInsightModule() {
  const biForm = document.getElementById('bi-form');
  const biMain = document.getElementById('biMain');
  const biAuthWarning = document.getElementById('biAuthWarning');
  const biScanContainer = document.getElementById('biScanContainer');
  const biScanText = document.getElementById('bi-scan-text');
  const biPhotoFront = document.getElementById('biPhotoFront');
  const biPhotoSide = document.getElementById('biPhotoSide');
  const biPhotoFrontInput = document.getElementById('biPhotoFrontInput');
  const biPhotoSideInput = document.getElementById('biPhotoSideInput');
  const biResults = document.getElementById('bi-results');
  const biCalcButton = document.getElementById('bi-calc-btn');
  const biBackBtn = document.getElementById('biBackBtn');
  const biHelpModal = document.getElementById('biHelpModal');
  const biHelpModalClose = document.getElementById('biHelpModalClose');
  const biHelpModalDialog = biHelpModal ? biHelpModal.querySelector('.bi-help-modal__dialog') : null;
  const biHelpModalDescription = document.getElementById('biHelpModalDescription');
  const biHelpModalFigure = document.getElementById('biHelpModalFigure');
  const biHelpTriggers = Array.from(document.querySelectorAll('.bi-help-trigger'));

  // Guard clause: evita execução do módulo fora da página Body Insight.
  const requiredElements = [
    biForm,
    biMain,
    biAuthWarning,
    biScanContainer,
    biScanText,
    biPhotoFront,
    biPhotoSide,
    biPhotoFrontInput,
    biPhotoSideInput,
    biResults,
    biCalcButton,
    biBackBtn,
    biHelpModal,
    biHelpModalClose,
    biHelpModalDialog,
    biHelpModalDescription,
    biHelpModalFigure
  ];

  if (requiredElements.some((element) => !element)) {
    console.warn('[BodyInsight] Elementos obrigatórios não encontrados. Inicialização ignorada.');
    return;
  }

  applyBodyInsightLanguage();
  document.addEventListener('femflow:langReady', applyBodyInsightLanguage);
  document.addEventListener('femflow:langChange', applyBodyInsightLanguage);

  const GAS_URL =
    window.BODY_INSIGHT_GAS_URL ||
    window.GAS_URL ||
    window.FEMFLOW_GAS_URL ||
    window.FEMFLOW?.API_URL ||
    '';

  let authUserFromObserver = null;
  let biLastHelpTrigger = null;
  let biModalFetchId = 0;
  const biHelpSvgCache = new Map();

  const state = {
    userReady: false,
    isLoading: false,
    selectedFrontFile: null,
    selectedSideFile: null,
    previewFrontUrl: '',
    previewSideUrl: ''
  };


  function getBodyInsightLangCopy() {
    const lang = window.FEMFLOW?.lang || localStorage.getItem('femflow_lang') || 'pt';
    return window.FEMFLOW?.langs?.[lang]?.bodyInsight || window.FEMFLOW?.langs?.pt?.bodyInsight || {};
  }

  function applyBodyInsightLanguage() {
    const copy = getBodyInsightLangCopy();

    document.querySelectorAll('[data-bi-i18n="helpTrigger"]').forEach((btn) => {
      btn.textContent = copy.helpTrigger || 'i';
    });

    const waistText = document.querySelector('#bi-help-cintura [data-bi-i18n="waistHelpText"]');
    if (waistText) waistText.textContent = copy.waistHelpText || waistText.textContent;

    const hipText = document.querySelector('#bi-help-quadril [data-bi-i18n="hipHelpText"]');
    if (hipText) hipText.textContent = copy.hipHelpText || hipText.textContent;

    const waistTrigger = document.querySelector('button[aria-describedby="bi-help-cintura"]');
    if (waistTrigger && copy.waistHelpAria) waistTrigger.setAttribute('aria-label', copy.waistHelpAria);

    const hipTrigger = document.querySelector('button[aria-describedby="bi-help-quadril"]');
    if (hipTrigger && copy.hipHelpAria) hipTrigger.setAttribute('aria-label', copy.hipHelpAria);
  }

  function getHelpDescription(trigger) {
    const describedBy = trigger.getAttribute('aria-describedby');
    if (!describedBy) return '';

    const tooltip = document.getElementById(describedBy);
    if (!tooltip) return '';

    const paragraph = tooltip.querySelector('p');
    return paragraph ? paragraph.textContent.trim() : '';
  }

  async function getHelpSvgMarkup(assetPath) {
    if (!assetPath) throw new Error('Ilustração indisponível.');

    if (biHelpSvgCache.has(assetPath)) {
      return biHelpSvgCache.get(assetPath);
    }

    const response = await fetch(assetPath, { cache: 'force-cache' });
    if (!response.ok) throw new Error('Não foi possível carregar a ilustração.');

    const svgMarkup = await response.text();
    biHelpSvgCache.set(assetPath, svgMarkup);
    return svgMarkup;
  }

  function closeHelpModal() {
    if (biHelpModal.classList.contains('hidden')) return;

    biHelpModal.classList.add('hidden');
    biHelpModal.setAttribute('aria-hidden', 'true');

    if (biLastHelpTrigger) {
      biLastHelpTrigger.focus();
    }
  }

  async function openHelpModal(trigger) {
    biLastHelpTrigger = trigger;
    biModalFetchId += 1;
    const currentFetchId = biModalFetchId;

    biHelpModal.classList.remove('hidden');
    biHelpModal.setAttribute('aria-hidden', 'false');

    const helpDescription = getHelpDescription(trigger);
    biHelpModalDescription.textContent = helpDescription || 'Sem descrição disponível.';
    biHelpModalFigure.innerHTML = '<p>Carregando ilustração...</p>';

    window.requestAnimationFrame(() => {
      biHelpModalDialog.focus();
    });

    try {
      const svgMarkup = await getHelpSvgMarkup(trigger.dataset.biHelpAsset || '');
      if (currentFetchId !== biModalFetchId) return;

      biHelpModalFigure.innerHTML = svgMarkup;
      const renderedSvg = biHelpModalFigure.querySelector('svg');
      if (renderedSvg && !renderedSvg.getAttribute('role')) {
        renderedSvg.setAttribute('role', 'img');
      }
    } catch (error) {
      if (currentFetchId !== biModalFetchId) return;
      biHelpModalFigure.innerHTML = '<p>Não foi possível carregar a ilustração agora.</p>';
    }
  }

  function handleHelpModalKeydown(event) {
    if (event.key === 'Escape') {
      closeHelpModal();
      return;
    }

    if (event.key !== 'Tab' || biHelpModal.classList.contains('hidden')) return;

    const focusable = biHelpModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function setResultMessage(message) {
    biResults.innerHTML = `<p>${message}</p>`;
  }

  function getCurrentAuthenticatedUser() {
    if (!window.firebase || !firebase.auth) {
      return null;
    }

    const user = firebase.auth().currentUser || authUserFromObserver;
    // Segurança: este módulo exige usuário autenticado não-anônimo.
    if (!user || !user.uid || user.isAnonymous) {
      return null;
    }

    return user;
  }

  function hasRequiredInputs() {
    const ids = ['altura', 'peso', 'cintura', 'quadril', 'idade'];
    return ids.every((id) => {
      const el = document.getElementById(id);
      return el && Number.isFinite(Number(el.value)) && Number(el.value) > 0;
    });
  }

  function updateCalculateButtonState() {
    const ready =
      state.userReady &&
      !state.isLoading &&
      !!state.selectedFrontFile &&
      !!state.selectedSideFile &&
      hasRequiredInputs();

    biCalcButton.disabled = !ready;
  }

  function setLoadingState(isLoading) {
    state.isLoading = isLoading;
    biScanContainer.classList.toggle('scanning', isLoading);
    biScanText.textContent = isLoading
      ? 'Analisando composição corporal...'
      : 'Analisando seus parâmetros...';
    updateCalculateButtonState();
  }

  function calcularIndiceFemFlow(payload) {
    const imc = payload.peso / ((payload.altura / 100) ** 2);
    const rcq = payload.cintura / payload.quadril;

    let scoreIMC = 60;
    if (imc >= 18.5 && imc <= 24.9) scoreIMC = 90;
    else if (imc >= 25 && imc <= 29.9) scoreIMC = 75;
    else if (imc >= 30 && imc <= 34.9) scoreIMC = 60;
    else if (imc > 35) scoreIMC = 40;

    let scoreRCQ = 60;
    if (rcq <= 0.8) scoreRCQ = 90;
    else if (rcq <= 0.85) scoreRCQ = 75;

    return {
      imc: Number(imc.toFixed(2)),
      rcq: Number(rcq.toFixed(2)),
      scoreIMC,
      scoreRCQ
    };
  }

  function calcularIndiceFinal(scoreIMC, scoreRCQ, scoreVisual) {
    return Math.round((0.4 * scoreIMC) + (0.3 * scoreRCQ) + (0.3 * scoreVisual));
  }

  function normalizeBodyInsightIAResponse(responseJson) {
    if (!responseJson || typeof responseJson !== 'object') return { status: 'error' };
    if (responseJson.data && typeof responseJson.data === 'object') return responseJson.data;
    if (responseJson.result && typeof responseJson.result === 'object') return responseJson.result;
    return responseJson;
  }

  function getTendenciaVisualLabel(tendenciaVisual) {
    const map = {
      reducao_gordura: 'Redução de gordura',
      aumento_massa: 'Aumento de massa',
      neutro: 'Manutenção corporal'
    };
    return map[tendenciaVisual] || 'Análise corporal em equilíbrio';
  }

  function renderResultadoFinal(resultado) {
    const narrativa = gerarNarrativaBodyInsight(resultado);

    biResults.innerHTML = `
      <div class="bi-fade-in">
        <h2>🌿 Seu Relatório Corporal</h2>
        <p class="bi-indice-grande">${resultado.indiceFemFlowFinal}</p>
        ${narrativa}
        <p><strong>🤖 Tendência visual da IA:</strong> ${getTendenciaVisualLabel(resultado.tendenciaVisual)}</p>
      </div>
    `;
  }

  function formatDecimal(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return '-';
    return num.toFixed(2).replace('.', ',');
  }

  function interpretarIMC(imc) {
    if (imc < 18.5) {
      return 'Esse valor sugere que seu corpo pode ganhar mais reserva de força e energia com pequenos ajustes na alimentação e no treino.';
    }

    if (imc <= 24.9) {
      return 'Isso indica que você está em uma faixa saudável, com bom equilíbrio entre peso e altura para sustentar energia e vitalidade.';
    }

    if (imc <= 29.9) {
      return 'Esse número mostra uma zona de atenção leve, e com ajustes simples de rotina você pode melhorar sua composição corporal de forma consistente.';
    }

    return 'Esse resultado indica espaço para evolução gradual, e com constância em hábitos saudáveis você pode melhorar disposição, mobilidade e bem-estar.';
  }

  function interpretarRCQ(rcq) {
    if (rcq <= 0.8) {
      return 'Essa proporção está em uma faixa positiva para mulheres e costuma se associar a boa distribuição corporal e menor risco metabólico.';
    }

    if (rcq <= 0.85) {
      return 'Esse valor indica um ponto intermediário, com potencial de melhora usando fortalecimento de core e hábitos consistentes no dia a dia.';
    }

    return 'Esse número sugere uma oportunidade de cuidar ainda mais da cintura e da estabilidade corporal com pequenos ajustes progressivos.';
  }

  function interpretarScore(score, labelPositivo, labelMelhoria) {
    if (score >= 85) return labelPositivo;
    if (score >= 70) return `${labelMelhoria} Você já tem uma boa base para evoluir.`;
    return `${labelMelhoria} Com pequenos ajustes, seu corpo pode responder muito bem.`;
  }

  function gerarNarrativaBodyInsight(resultado) {
    const imcTexto = interpretarIMC(resultado.imc);
    const rcqTexto = interpretarRCQ(resultado.rcq);
    const scoreImcTexto = interpretarScore(
      resultado.scoreIMC,
      'Seu resultado está alto, o que reforça um estado corporal funcional para continuar evoluindo com segurança.',
      'Seu score mostra que há espaço para fortalecer ainda mais seu equilíbrio entre peso e altura.'
    );
    const scoreRcqTexto = interpretarScore(
      resultado.scoreRCQ,
      'Esse score confirma um bom equilíbrio de proporções corporais para mobilidade e desempenho no treino.',
      'Seu score aponta chance de melhora na distribuição corporal com foco em força e consistência.'
    );

    return `
      <p><strong>📊 Seu Índice de Massa Corporal (IMC):</strong> ${formatDecimal(resultado.imc)}</p>
      <p>👉 ${imcTexto}</p>

      <p><strong>📏 Proporção Cintura–Quadril (RCQ):</strong> ${formatDecimal(resultado.rcq)}</p>
      <p>👉 ${rcqTexto}</p>

      <p><strong>💪 Score de IMC:</strong> ${resultado.scoreIMC}</p>
      <p>👉 ${scoreImcTexto}</p>

      <p><strong>🧘 Score de RCQ:</strong> ${resultado.scoreRCQ}</p>
      <p>👉 ${scoreRcqTexto}</p>

      <p><strong>📍 Faixa etária analisada:</strong> ${getFaixaEtaria(resultado.idade)}</p>
      <p>👉 Essa comparação ajuda a entender seus resultados dentro do contexto da sua fase de vida.</p>

      <p><strong>✨ Sugestão prática:</strong> mantenha treinos de força 2 a 4 vezes por semana, inclua caminhadas e priorize sono regular — com pequenos ajustes, seu corpo tende a evoluir de forma consistente.</p>
    `;
  }

  function getFaixaEtaria(idade) {
    if (idade < 30) return '18-29 anos';
    if (idade < 40) return '30-39 anos';
    if (idade < 50) return '40-49 anos';
    return '50+ anos';
  }

  function renderResultadoFallback(payload) {
    const narrativa = gerarNarrativaBodyInsight(payload);

    biResults.innerHTML = `
      <div class="bi-fade-in">
        <h2>Análise parcial disponível</h2>
        <p>Seu limite da análise IA foi atingido. Faça upgrade para continuar.</p>
        <p>Enquanto isso, aqui está sua leitura técnica explicada de forma simples:</p>
        ${narrativa}
      </div>
    `;
  }

  async function chamarBodyInsightIA(userId, photoFrontUrl, photoSideUrl) {
    if (!GAS_URL) {
      throw new Error('Serviço de IA indisponível no momento.');
    }

    // Segurança/rede: timeout para evitar requisições penduradas ao GAS.
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    let response;
    try {
      response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'body_insight_ia',
          userId,
          photoFrontUrl,
          photoSideUrl
        }),
        signal: controller.signal
      });
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new Error('Tempo de resposta excedido na análise. Tente novamente.');
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error('Falha de comunicação com o serviço de análise.');
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error('Resposta inválida do serviço de análise.');
    }
  }

  async function uploadPhotoToStorage(userId, file, timestamp, type) {
    const currentUser = getCurrentAuthenticatedUser();
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Faça login para continuar.');
    }

    const safeType = type === 'front' ? 'front' : 'side';
    // Ajuste: extensão derivada do MIME real do arquivo.
    const ext = ((file.type || 'image/jpeg').split('/')[1] || 'jpg').toLowerCase().replace('jpeg', 'jpg');
    const storagePath = `body_insight/${userId}/${timestamp}_${safeType}.${ext}`;
    const metadata = { contentType: file.type || 'image/jpeg' };
    const storageRef = firebase.storage().ref(storagePath);
    await storageRef.put(file, metadata);
    return storageRef.getDownloadURL();
  }

  async function saveBodyInsightToFirestore(payload) {
    const currentUser = getCurrentAuthenticatedUser();
    // Segurança: garante que o payload pertence ao usuário autenticado.
    if (!currentUser || !payload || payload.userId !== currentUser.uid) {
      throw new Error('Sessão inválida para salvar a análise. Faça login novamente.');
    }

    // Conflito Firestore: evita add() na raiz sem vínculo de UID.
    const docRef = firebase
      .firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('body_insight')
      .doc(String(payload.createdAtMs || Date.now()));

    await docRef.set({
      ...payload,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  function setAuthUI(isAuthenticated) {
    state.userReady = !!isAuthenticated;
    biMain.classList.toggle('bi-locked', !isAuthenticated);

    if (isAuthenticated) {
      biAuthWarning.classList.add('hidden');
      setResultMessage('Preencha os dados e envie as fotos frontal e lateral para calcular seus parâmetros.');
    } else {
      biAuthWarning.classList.remove('hidden');
      biAuthWarning.textContent = 'Sessão expirada. Redirecionando para login...';
      setResultMessage('Faça login para usar o Body Insight.');
    }

    updateCalculateButtonState();
  }

  function resetPreview(previewImage, previewStateKey) {
    if (state[previewStateKey]) {
      URL.revokeObjectURL(state[previewStateKey]);
      state[previewStateKey] = '';
    }

    previewImage.removeAttribute('src');
    previewImage.classList.add('hidden');
  }

  function handlePhotoInputChange(fileInput, previewImage, photoType) {
    const file = fileInput.files && fileInput.files[0];

    if (!file) {
      if (photoType === 'front') {
        state.selectedFrontFile = null;
        resetPreview(previewImage, 'previewFrontUrl');
      } else {
        state.selectedSideFile = null;
        resetPreview(previewImage, 'previewSideUrl');
      }
      updateCalculateButtonState();
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);

    if (photoType === 'front') {
      if (state.previewFrontUrl) URL.revokeObjectURL(state.previewFrontUrl);
      state.previewFrontUrl = localPreviewUrl;
      state.selectedFrontFile = file;
    } else {
      if (state.previewSideUrl) URL.revokeObjectURL(state.previewSideUrl);
      state.previewSideUrl = localPreviewUrl;
      state.selectedSideFile = file;
    }

    previewImage.src = localPreviewUrl;
    previewImage.classList.remove('hidden');
    updateCalculateButtonState();
  }

  biBackBtn.addEventListener('click', () => {
    window.location.href = 'home.html';
  });

  biHelpTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      openHelpModal(trigger);
    });
  });

  biHelpModal.addEventListener('click', (event) => {
    if (event.target && event.target.dataset.biHelpClose === 'backdrop') {
      closeHelpModal();
    }
  });

  biHelpModalClose.addEventListener('click', closeHelpModal);
  biHelpModal.addEventListener('keydown', handleHelpModalKeydown);

  biPhotoFrontInput.addEventListener('change', () => {
    handlePhotoInputChange(biPhotoFrontInput, biPhotoFront, 'front');
  });

  biPhotoSideInput.addEventListener('change', () => {
    handlePhotoInputChange(biPhotoSideInput, biPhotoSide, 'side');
  });

  biForm.addEventListener('input', updateCalculateButtonState);

  biForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const currentUser = getCurrentAuthenticatedUser();
    // Segurança: não confiar em window.BI_USER_ID antes de upload/salvamento.
    if (!state.userReady || !currentUser) {
      setResultMessage('Faça login para continuar.');
      return;
    }

    const altura = Number(document.getElementById('altura').value);
    const peso = Number(document.getElementById('peso').value);
    const cintura = Number(document.getElementById('cintura').value);
    const quadril = Number(document.getElementById('quadril').value);
    const idade = Number(document.getElementById('idade').value);

    if (![altura, peso, cintura, quadril, idade].every((value) => Number.isFinite(value) && value > 0)) {
      setResultMessage('Preencha todos os campos com valores válidos.');
      return;
    }

    if (!state.selectedFrontFile || !state.selectedSideFile) {
      setResultMessage('As fotos frontal e lateral são obrigatórias para a análise.');
      return;
    }

    try {
      setLoadingState(true);
      setResultMessage('Processando análise com IA...');

      const userAtSubmit = getCurrentAuthenticatedUser();
      if (!userAtSubmit) {
        throw new Error('Faça login para continuar.');
      }

      const userId = userAtSubmit.uid;
      const timestamp = Date.now();

      const biometria = calcularIndiceFemFlow({ altura, peso, cintura, quadril });

      const [photoFrontUrl, photoSideUrl] = await Promise.all([
        uploadPhotoToStorage(userId, state.selectedFrontFile, timestamp, 'front'),
        uploadPhotoToStorage(userId, state.selectedSideFile, timestamp, 'side')
      ]);

      const iaRawResponse = await chamarBodyInsightIA(userId, photoFrontUrl, photoSideUrl);
      const iaResponse = normalizeBodyInsightIAResponse(iaRawResponse);

      if (iaResponse.status === 'limit_exceeded') {
        biScanText.textContent = 'Cálculo parcial concluído';
        renderResultadoFallback({
          ...biometria,
          idade
        });
        return;
      }

      if (iaResponse.status === 'disabled') {
        setResultMessage('IA indisponível no momento. Tente novamente mais tarde.');
        return;
      }

      if (iaResponse.status === 'error' || iaResponse.status !== 'ok') {
        setResultMessage('Não foi possível concluir a análise visual agora. Tente novamente.');
        return;
      }

      const visual = iaResponse.visual || {};
      const scoreVisual = Number(visual.score_visual_geral) || 0;
      const tendenciaVisual = visual.tendencia_visual || 'neutro';
      const indiceFemFlowFinal = calcularIndiceFinal(biometria.scoreIMC, biometria.scoreRCQ, scoreVisual);

      await saveBodyInsightToFirestore({
        userId,
        createdAtMs: timestamp,
        altura,
        peso,
        cintura,
        quadril,
        idade,
        imc: biometria.imc,
        rcq: biometria.rcq,
        scoreIMC: biometria.scoreIMC,
        scoreRCQ: biometria.scoreRCQ,
        scoreVisual,
        tendenciaVisual,
        indiceFemFlowFinal,
        photoFrontUrl,
        photoSideUrl
      });

      biScanText.textContent = `Índice FemFlow: ${indiceFemFlowFinal}`;
      renderResultadoFinal({
        indiceFemFlowFinal,
        imc: biometria.imc,
        rcq: biometria.rcq,
        scoreIMC: biometria.scoreIMC,
        scoreRCQ: biometria.scoreRCQ,
        idade,
        tendenciaVisual
      });
    } catch (error) {
      console.error('[BodyInsight] erro:', error);
      setResultMessage(error.message || 'Erro ao processar Body Insight.');
    } finally {
      setLoadingState(false);
    }
  });

  function initAuthGuard() {
    if (!window.firebase || !firebase.auth) {
      setResultMessage('Serviço de autenticação indisponível.');
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      authUserFromObserver = user || null;

      if (!user || !user.uid || user.isAnonymous) {
        window.BI_USER_ID = null;
        setAuthUI(false);
        window.setTimeout(() => {
          window.location.href = 'index.html';
        }, 900);
        return;
      }

      window.BI_USER_ID = user.uid;
      setAuthUI(true);
    });
  }

  setResultMessage('Verificando autenticação...');
  updateCalculateButtonState();

  if (window.FEMFLOW && window.FEMFLOW.firebaseAuthReady && typeof window.FEMFLOW.firebaseAuthReady.then === 'function') {
    window.FEMFLOW.firebaseAuthReady.finally(initAuthGuard);
  } else {
    initAuthGuard();
  }
})();
