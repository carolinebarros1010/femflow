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

    biScanContainer.classList.add('scanning');
    biScanText.textContent = 'Analisando seus parâmetros...';
    setResultMessage('Analisando...');

    const { imc, rcq, scoreIMC, scoreRCQ, indiceFinal } = calcularIndiceFemFlow({
      altura,
      peso,
      cintura,
      quadril
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const userId = getCurrentUserId();
    const timestamp = Date.now();
    const docId = `${userId}_${timestamp}`;

    const [photoFrontUrl, photoSideUrl] = await Promise.all([
      uploadPhotoToStorage(userId, selectedFrontFile, timestamp, 'front'),
      uploadPhotoToStorage(userId, selectedSideFile, timestamp, 'side')
    ]);

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
      indiceFemFlow: indiceFinal,
      photoFrontUrl,
      photoSideUrl
    };

    await saveBodyInsightToFirestore(payload, docId);

    biScanText.textContent = `Índice FemFlow: ${indiceFinal}`;
    biResults.innerHTML = `
      <div class="bi-fade-in">
        <h2 class="bi-indice-grande">${indiceFinal}</h2>
        <p class="bi-indice-label">Índice FemFlow</p>
        <p><strong>IMC:</strong> ${imc.toFixed(2)}</p>
        <p><strong>RCQ:</strong> ${rcq.toFixed(2)}</p>
      </div>
    `;
  } catch (error) {
    biScanText.textContent = 'Analisando seus parâmetros...';
    setResultMessage(`Erro ao processar Body Insight: ${error.message}`);
  } finally {
    biScanContainer.classList.remove('scanning');
  }
});

updateCalculateButtonState();
setResultMessage('Preencha os dados, selecione as fotos frontal e lateral e clique em Calcular Parâmetros.');
