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

  const GAS_URL =
    window.BODY_INSIGHT_GAS_URL ||
    window.GAS_URL ||
    window.FEMFLOW_GAS_URL ||
    window.FEMFLOW?.API_URL ||
    '';

  const state = {
    userReady: false,
    isLoading: false,
    selectedFrontFile: null,
    selectedSideFile: null,
    previewFrontUrl: '',
    previewSideUrl: ''
  };

  function setResultMessage(message) {
    biResults.innerHTML = `<p>${message}</p>`;
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
    biResults.innerHTML = `
      <div class="bi-fade-in">
        <h2>Índice FemFlow</h2>
        <p class="bi-indice-grande">${resultado.indiceFemFlowFinal}</p>
        <p>IMC: ${resultado.imc.toFixed(2)}</p>
        <p>RCQ: ${resultado.rcq.toFixed(2)}</p>
        <p>Análise IA: ${getTendenciaVisualLabel(resultado.tendenciaVisual)}</p>
      </div>
    `;
  }

  async function chamarBodyInsightIA(userId, photoFrontUrl, photoSideUrl) {
    if (!GAS_URL) {
      throw new Error('Serviço de IA indisponível no momento.');
    }

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'body_insight_ia',
        userId,
        photoFrontUrl,
        photoSideUrl
      })
    });

    if (!response.ok) {
      throw new Error('Falha de comunicação com o serviço de análise.');
    }

    return response.json();
  }

  async function uploadPhotoToStorage(userId, file, timestamp, type) {
    const safeType = type === 'front' ? 'front' : 'side';
    const storagePath = `body_insight/${userId}/${timestamp}_${safeType}.jpg`;
    const metadata = { contentType: file.type || 'image/jpeg' };
    const storageRef = firebase.storage().ref(storagePath);
    await storageRef.put(file, metadata);
    return storageRef.getDownloadURL();
  }

  async function saveBodyInsightToFirestore(payload) {
    await firebase.firestore().collection('body_insight').add({
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

  biPhotoFrontInput.addEventListener('change', () => {
    handlePhotoInputChange(biPhotoFrontInput, biPhotoFront, 'front');
  });

  biPhotoSideInput.addEventListener('change', () => {
    handlePhotoInputChange(biPhotoSideInput, biPhotoSide, 'side');
  });

  biForm.addEventListener('input', updateCalculateButtonState);

  biForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!state.userReady || !window.BI_USER_ID) {
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

      const userId = window.BI_USER_ID;
      const timestamp = Date.now();

      const biometria = calcularIndiceFemFlow({ altura, peso, cintura, quadril });

      const [photoFrontUrl, photoSideUrl] = await Promise.all([
        uploadPhotoToStorage(userId, state.selectedFrontFile, timestamp, 'front'),
        uploadPhotoToStorage(userId, state.selectedSideFile, timestamp, 'side')
      ]);

      const iaRawResponse = await chamarBodyInsightIA(userId, photoFrontUrl, photoSideUrl);
      const iaResponse = normalizeBodyInsightIAResponse(iaRawResponse);

      if (iaResponse.status === 'limit_exceeded') {
        setResultMessage('Seu limite da análise IA foi atingido. Faça upgrade para continuar.');
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
      if (!user) {
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
