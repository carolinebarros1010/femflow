// ==================================================
// Body Insight - Lógica visual de protótipo (sem IA real)
// ==================================================

const form = document.getElementById('bi-form');
const scanContainer = document.querySelector('.bi-scan-container');
const results = document.getElementById('bi-results');
const button = document.getElementById('bi-calc-btn');

const formatNumber = (value, decimals = 1) => Number(value).toFixed(decimals);

const getMetabolicEstimate = ({ peso, idade, cintura, quadril }) => {
  // Estimativa simples e fictícia para protótipo visual.
  const base = 24 * peso;
  const ageFactor = idade > 40 ? 0.93 : 1.02;
  const ratio = quadril > 0 ? cintura / quadril : 0;
  const bodyFactor = 1 + Math.min(Math.max((ratio - 0.75) * 0.18, -0.08), 0.1);
  return base * ageFactor * bodyFactor;
};

const showMessage = (message) => {
  results.innerHTML = `<p class="bi-muted">${message}</p>`;
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const altura = Number(document.getElementById('altura').value);
  const peso = Number(document.getElementById('peso').value);
  const cintura = Number(document.getElementById('cintura').value);
  const quadril = Number(document.getElementById('quadril').value);
  const idade = Number(document.getElementById('idade').value);

  if (![altura, peso, cintura, quadril, idade].every((item) => Number.isFinite(item) && item > 0)) {
    showMessage('Preencha todos os campos com valores válidos para continuar.');
    return;
  }

  button.disabled = true;
  showMessage('Executando scan inteligente…');
  scanContainer.classList.remove('is-paused');

  window.setTimeout(() => {
    const imc = peso / ((altura / 100) ** 2);
    const metabolic = getMetabolicEstimate({ peso, idade, cintura, quadril });

    results.innerHTML = `
      <p><strong>IMC:</strong> ${formatNumber(imc, 1)}</p>
      <p><strong>Estimativa metabólica:</strong> ${formatNumber(metabolic, 0)} kcal/dia</p>
    `;

    scanContainer.classList.add('is-paused');
    button.disabled = false;
  }, 2000);
});

// Estado inicial com orientação leve.
showMessage('Insira seus dados para iniciar a análise visual.');
scanContainer.classList.add('is-paused');
