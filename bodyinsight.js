// ============================================================
// Body Insight (módulo isolado)
// - Preview da foto frontal
// - Animação de scan
// - Cálculo de IMC e BMR
// - Upload da foto no Firebase Storage
// - Registro dos dados no Firestore
// ============================================================

const biForm = document.getElementById('bi-form');
const biScanContainer = document.getElementById('biScanContainer');
const biPhoto = document.getElementById('biPhoto');
const biPhotoInput = document.getElementById('biPhotoInput');
const biResults = document.getElementById('bi-results');

let selectedFile = null;

/**
 * Utilitário para renderizar mensagens na área de resultados.
 */
function setResultMessage(message) {
  biResults.innerHTML = `<p>${message}</p>`;
}

/**
 * Recupera o ID do usuário atual usando a instância Firebase já existente.
 * Não cria nova configuração Firebase; apenas reutiliza o app disponível.
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
 * Faz upload da imagem para o Storage e retorna a URL pública.
 */
async function uploadPhotoToStorage(userId, file, timestamp) {
  if (!window.firebase || !firebase.storage) {
    throw new Error('Firebase Storage não está disponível nesta página.');
  }

  const storagePath = `body_insight/${userId}/${timestamp}.jpg`;
  const storageRef = firebase.storage().ref().child(storagePath);
  await storageRef.put(file);
  return storageRef.getDownloadURL();
}

/**
 * Persiste os dados no Firestore na coleção body_insight.
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
 * Preview da foto frontal dentro do quadro de scan.
 */
biPhotoInput.addEventListener('change', (event) => {
  const file = event.target.files && event.target.files[0];

  if (!file) {
    selectedFile = null;
    biPhoto.removeAttribute('src');
    biPhoto.classList.add('hidden');
    return;
  }

  selectedFile = file;
  const localPreviewUrl = URL.createObjectURL(file);
  biPhoto.src = localPreviewUrl;
  biPhoto.classList.remove('hidden');
});

/**
 * Fluxo principal: calcula parâmetros, executa scan e salva no Firebase.
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

    if (!selectedFile) {
      setResultMessage('Selecione uma foto frontal antes de calcular.');
      return;
    }

    // Ativa visual de scan por 2 segundos.
    biScanContainer.classList.add('scanning');
    setResultMessage('Processando imagem e calculando parâmetros...');

    const imc = peso / ((altura / 100) ** 2);
    const bmr = (10 * peso) + (6.25 * altura) - (5 * idade) - 161;

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const userId = getCurrentUserId();
    const timestamp = Date.now();
    const docId = `${userId}_${timestamp}`;

    // 1) Upload da foto no Storage
    const photoUrl = await uploadPhotoToStorage(userId, selectedFile, timestamp);

    // 2) Registro dos dados no Firestore
    const payload = {
      userId,
      altura,
      peso,
      cintura,
      quadril,
      idade,
      imc: Number(imc.toFixed(2)),
      bmr: Number(bmr.toFixed(2)),
      photoUrl
    };

    await saveBodyInsightToFirestore(payload, docId);

    biResults.innerHTML = `
      <p><strong>IMC:</strong> ${imc.toFixed(2)}</p>
      <p><strong>Estimativa metabólica:</strong> ${bmr.toFixed(2)} kcal/dia</p>
    `;
  } catch (error) {
    setResultMessage(`Erro ao processar Body Insight: ${error.message}`);
  } finally {
    biScanContainer.classList.remove('scanning');
  }
});

setResultMessage('Preencha os dados, selecione a foto frontal e clique em Calcular Parâmetros.');
