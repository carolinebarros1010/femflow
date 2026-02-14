// ============================================================
// Body Insight (módulo isolado)
// - Preview de foto frontal e lateral
// - Animação de scan
// - Cálculo de IMC, RCQ e Índice FemFlow
// - Upload das fotos no Firebase Storage
// - Registro dos dados no Firestore
// ============================================================

// ------------------------
// Elementos da interface
// ------------------------
const biForm = document.getElementById('bi-form');
const biScanContainer = document.getElementById('biScanContainer');
const biScanText = document.getElementById('bi-scan-text');
const biPhotoFront = document.getElementById('biPhotoFront');
const biPhotoSide = document.getElementById('biPhotoSide');
const biPhotoFrontInput = document.getElementById('biPhotoFrontInput');
const biPhotoSideInput = document.getElementById('biPhotoSideInput');
const biResults = document.getElementById('bi-results');
const biCalcButton = document.getElementById('bi-calc-btn');
const GAS_URL = window.GAS_URL || window.FEMFLOW_GAS_URL || window.BODY_INSIGHT_GAS_URL || '';

// ------------------------
// Estado do módulo
// ------------------------
let selectedFrontFile = null;
let selectedSideFile = null;

/**
 * Renderiza mensagens na área de resultados.
 */
function setResultMessage(message) {
  biResults.innerHTML = `<p>${message}</p>`;
}

/**
 * Habilita o botão somente quando as duas fotos obrigatórias foram selecionadas.
 */
function updateCalculateButtonState() {
  biCalcButton.disabled = !(selectedFrontFile && selectedSideFile);
}

/**
 * Ajusta o estado de carregamento visual da análise.
 */
function setLoadingState(isLoading) {
  if (isLoading) {
    biScanContainer.classList.add('scanning');
    biScanText.textContent = 'Analisando composição corporal...';
    setResultMessage('Processando análise com IA...');
    biCalcButton.disabled = true;
    return;
  }

  biScanContainer.classList.remove('scanning');
  updateCalculateButtonState();
}

/**
 * Regra matemática do Índice FemFlow (FASE A).
 */
function calcularIndiceFemFlow({ altura, peso, cintura, quadril }) {
  const imc = peso / ((altura / 100) ** 2);
  const rcq = cintura / quadril;

  let scoreIMC = 60;
  if (imc >= 18.5 && imc <= 24.9) {
    scoreIMC = 90;
  } else if (imc >= 25 && imc <= 29.9) {
    scoreIMC = 75;
  } else if (imc >= 30 && imc <= 34.9) {
    scoreIMC = 60;
  } else if (imc > 35) {
    scoreIMC = 40;
  }

  let scoreRCQ = 60;
  if (rcq <= 0.8) {
    scoreRCQ = 90;
  } else if (rcq > 0.8 && rcq <= 0.85) {
    scoreRCQ = 75;
  }

  const indiceFinal = Math.round((0.6 * scoreIMC) + (0.4 * scoreRCQ));

  return {
    imc: Number(imc.toFixed(2)),
    rcq: Number(rcq.toFixed(2)),
    scoreIMC,
    scoreRCQ,
    indiceFinal
  };
}

/**
 * Combina scores biométricos + visuais para gerar o índice final.
 */
function calcularIndiceFinal(scoreIMC, scoreRCQ, scoreVisual) {
  return Math.round((0.4 * scoreIMC) + (0.3 * scoreRCQ) + (0.3 * scoreVisual));
}

/**
 * Mapeia tendência técnica para texto amigável na interface.
 */
function getTendenciaVisualLabel(tendenciaVisual) {
  const map = {
    reducao_gordura: 'Redução de gordura',
    aumento_massa: 'Aumento de massa',
    neutro: 'Manutenção corporal'
  };

  return map[tendenciaVisual] || 'Análise corporal em equilíbrio';
}

/**
 * Chama a action body_insight_ia no endpoint do Google Apps Script.
 */
async function chamarBodyInsightIA(userId, photoFrontUrl, photoSideUrl) {
  if (!GAS_URL) {
    throw new Error('Endpoint de análise visual não configurado.');
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'body_insight_ia',
      userId,
      photoFrontUrl,
      photoSideUrl
    })
  });

  if (!response.ok) {
    throw new Error('Falha de comunicação com o serviço de análise visual.');
  }

  return response.json();
}

/**
 * Normaliza o retorno do endpoint (com ou sem envelope data/result).
 */
function normalizeBodyInsightIAResponse(responseJson) {
  if (!responseJson || typeof responseJson !== 'object') {
    return { status: 'error' };
  }

  if (responseJson.data && typeof responseJson.data === 'object') {
    return responseJson.data;
  }

  if (responseJson.result && typeof responseJson.result === 'object') {
    return responseJson.result;
  }

  return responseJson;
}

/**
 * Renderiza o quadro final completo da análise Body Insight.
 */
function renderResultadoFinal({ indiceFemFlowFinal, imc, rcq, tendenciaVisual }) {
  biResults.innerHTML = `
    <div class="resultado-final bi-fade-in">
      <h2>Índice FemFlow</h2>
      <div class="score-grande">${indiceFemFlowFinal}</div>
      <div class="detalhes">
        <p>IMC: ${imc.toFixed(2)}</p>
        <p>RCQ: ${rcq.toFixed(2)}</p>
        <p>Análise IA: ${getTendenciaVisualLabel(tendenciaVisual)}</p>
      </div>
    </div>
  `;
}

/**
 * Recupera o ID do usuário autenticado no Firebase existente.
 */
function getCurrentUserId() {
  if (!window.firebase || !firebase.auth) {
    throw new Error('Firebase Auth não está disponível nesta página.');
  }

  const user = firebase.auth().currentUser;
  if (!user || !user.uid) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }

  return user.uid;
}

/**
 * Faz upload de uma imagem para o Storage e retorna URL pública.
 */
async function uploadPhotoToStorage(userId, file, timestamp, type) {
  if (!window.firebase || !firebase.storage) {
    throw new Error('Firebase Storage não está disponível nesta página.');
  }

  const storagePath = `body_insight/${userId}/${timestamp}_${type}.jpg`;
  const storageRef = firebase.storage().ref().child(storagePath);
  await storageRef.put(file);
  return storageRef.getDownloadURL();
}

/**
 * Persiste os dados na coleção body_insight do Firestore.
 */
async function saveBodyInsightToFirestore(payload, docId) {
  if (!window.firebase || !firebase.firestore) {
    throw new Error('Firestore não está disponível nesta página.');
  }

  await firebase.firestore().collection('body_insight').doc(docId).set({
    ...payload,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Atualiza preview e estado do arquivo por tipo (front/side).
 */
function handlePhotoInputChange(fileInput, previewImage, photoType) {
  const file = fileInput.files && fileInput.files[0];

  if (!file) {
    if (photoType === 'front') {
      selectedFrontFile = null;
    } else {
      selectedSideFile = null;
    }
    previewImage.removeAttribute('src');
    previewImage.classList.add('hidden');
    updateCalculateButtonState();
    return;
  }

  const localPreviewUrl = URL.createObjectURL(file);
  previewImage.src = localPreviewUrl;
  previewImage.classList.remove('hidden');

  if (photoType === 'front') {
    selectedFrontFile = file;
  } else {
    selectedSideFile = file;
  }

  updateCalculateButtonState();
}

biPhotoFrontInput.addEventListener('change', () => {
  handlePhotoInputChange(biPhotoFrontInput, biPhotoFront, 'front');
});

biPhotoSideInput.addEventListener('change', () => {
  handlePhotoInputChange(biPhotoSideInput, biPhotoSide, 'side');
});

/**
 * Fluxo principal: valida, anima scan, calcula índice e salva no Firebase.
 */
biForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const altura = Number(document.getElementById('altura').value);
    const peso = Number(document.getElementById('peso').value);
    const cintura = Number(document.getElementById('cintura').value);
    const quadril = Number(document.getElementById('quadril').value);
    const idade = Number(document.getElementById('idade').value);

    if (![altura, peso, cintura, quadril, idade].every((value) => Number.isFinite(value) && value > 0)) {
      setResultMessage('Preencha todos os campos com valores válidos.');
      return;
    }

    if (!selectedFrontFile || !selectedSideFile) {
      setResultMessage('As fotos frontal e lateral são obrigatórias para a análise.');
      return;
    }

    setLoadingState(true);

    const { imc, rcq, scoreIMC, scoreRCQ } = calcularIndiceFemFlow({
      altura,
      peso,
      cintura,
      quadril
    });

    const userId = getCurrentUserId();
    const timestamp = Date.now();
    const docId = `${userId}_${timestamp}`;

    const [photoFrontUrl, photoSideUrl] = await Promise.all([
      uploadPhotoToStorage(userId, selectedFrontFile, timestamp, 'front'),
      uploadPhotoToStorage(userId, selectedSideFile, timestamp, 'side')
    ]);

    const iaRawResponse = await chamarBodyInsightIA(userId, photoFrontUrl, photoSideUrl);
    const iaResponse = normalizeBodyInsightIAResponse(iaRawResponse);

    if (iaResponse.status !== 'ok') {
      throw new Error('IA_BODY_INSIGHT_ERROR');
    }

    const scoreVisual = Number(
      iaResponse.visual
      && Number.isFinite(Number(iaResponse.visual.score_visual_geral))
        ? iaResponse.visual.score_visual_geral
        : 0
    );

    const tendenciaVisual =
      (iaResponse.visual && iaResponse.visual.tendencia_visual) ||
      (iaResponse.visual && iaResponse.visual.tendenciaVisual) ||
      'neutro';

    const indiceFemFlowFinal = calcularIndiceFinal(scoreIMC, scoreRCQ, scoreVisual);

    const payload = {
      userId,
      altura,
      peso,
      cintura,
      quadril,
      idade,
      imc,
      rcq,
      scoreIMC,
      scoreRCQ,
      scoreVisual,
      indiceFemFlowFinal,
      tendenciaVisual,
      photoFrontUrl,
      photoSideUrl
    };

    await saveBodyInsightToFirestore(payload, docId);

    biScanText.textContent = `Índice FemFlow: ${indiceFemFlowFinal}`;
    renderResultadoFinal({
      indiceFemFlowFinal,
      imc,
      rcq,
      tendenciaVisual
    });
  } catch (error) {
    if (error.message === 'IA_BODY_INSIGHT_ERROR') {
      setResultMessage('Não foi possível concluir a análise visual. Tente novamente.');
    } else {
      setResultMessage(`Erro ao processar Body Insight: ${error.message}`);
    }

    biScanText.textContent = 'Analisando seus parâmetros...';
  } finally {
    setLoadingState(false);
  }
});

updateCalculateButtonState();
setResultMessage('Preencha os dados, selecione as fotos frontal e lateral e clique em Calcular Parâmetros.');
