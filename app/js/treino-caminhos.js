/* ============================================================
   FEMFLOW • treino-caminhos.js
   README RÁPIDO
   ------------------------------------------------------------
   Este arquivo é o tradutor oficial entre:
   - faseMetodo: fase mostrada na UI e usada no método hormonal
   - faseFirestore: fase usada SOMENTE para montar o path do Firebase

   Regra crítica (sem migrar Firestore agora):
   1) Escolhemos um Caminho (1..5) da fase do método.
   2) O Caminho resolve um dia real do ciclo.
   3) A fase de leitura no Firestore é derivada do dia real.

   Exemplo crítico de transição (dia 18):
   - faseMetodo: ovulatory
   - caminho: 5
   - diaUsado: 18
   - faseFirestore: luteal

   Assim, a UI continua exibindo "Fase Ovulatória", mas a leitura correta
   no banco ocorre em /fases/luteal/dias/dia_18.
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};

(() => {
  const STORAGE_KEY = "femflow_last_caminho";

  const mapaSequenciaPorFase = {
    menstrual: [1, 2, 3, 4, 5],
    follicular: [6, 7, 8, 9, 10],
    ovulatory: [14, 15, 16, 17, 18],
    luteal: [19, 20, 21, 22, 23]
  };

  function normalizarFaseMetodo(raw) {
    const fase = String(raw || "").toLowerCase().trim();
    return {
      ovulatória: "ovulatory",
      ovulatoria: "ovulatory",
      ovulação: "ovulatory",
      ovulation: "ovulatory",
      folicular: "follicular",
      follicular: "follicular",
      lútea: "luteal",
      lutea: "luteal",
      luteal: "luteal",
      menstrual: "menstrual",
      menstruação: "menstrual",
      menstruacao: "menstrual",
      menstruation: "menstrual"
    }[fase] || fase;
  }

  function diaParaPasso(faseMetodo, diaCiclo) {
    const faseNorm = normalizarFaseMetodo(faseMetodo);
    const lista = mapaSequenciaPorFase[faseNorm];
    if (!Array.isArray(lista)) return 0;
    const idx = lista.indexOf(Number(diaCiclo));
    if (idx === -1) return 0;
    return idx + 1;
  }

  function resolverDiaPorCaminho(faseMetodo, caminho) {
    const faseNorm = normalizarFaseMetodo(faseMetodo);
    const dias = mapaSequenciaPorFase[faseNorm];
    if (!Array.isArray(dias)) {
      console.warn("[treino-caminhos] faseMetodo inválida em resolverDiaPorCaminho", {
        faseMetodo,
        faseNorm,
        caminho
      });
      return null;
    }
    const caminhoNum = Number(caminho);
    if (!Number.isFinite(caminhoNum) || caminhoNum < 1) {
      console.warn("[treino-caminhos] caminho inválido em resolverDiaPorCaminho", {
        faseMetodo,
        caminho
      });
      return null;
    }
    return dias[caminhoNum - 1] ?? null;
  }

  function resolverFaseFirestorePorDia(diaCiclo) {
    const dia = Number(diaCiclo);
    if (!Number.isFinite(dia) || dia < 1) return null;
    if (dia >= 1 && dia <= 5) return "menstrual";
    if (dia >= 6 && dia <= 13) return "follicular";
    if (dia >= 14 && dia <= 17) return "ovulatory";
    if (dia >= 18) return "luteal";
    return null;
  }

  function resolverContextoDeBusca(faseMetodo, caminho) {
    const faseMetodoNorm = normalizarFaseMetodo(faseMetodo);
    const diaUsado = resolverDiaPorCaminho(faseMetodoNorm, caminho);
    const faseFirestore = resolverFaseFirestorePorDia(diaUsado);

    if (!diaUsado || !faseFirestore) {
      console.warn("[treino-caminhos] inconsistência ao resolver contexto de busca", {
        faseMetodo,
        faseMetodoNorm,
        caminho,
        diaUsado,
        faseFirestore
      });
    }

    // debug explícito para o caso crítico dia 18
    if (faseMetodoNorm === "ovulatory" && Number(caminho) === 5) {
      console.log("[treino-caminhos] transição esperada: ovulatory caminho 5 -> dia 18 -> faseFirestore luteal", {
        faseMetodo: faseMetodoNorm,
        caminho: Number(caminho),
        diaUsado,
        faseFirestore
      });
    }

    return { diaUsado, faseFirestore };
  }

  function proximoCaminho(caminhoAtual, total = 5) {
    const atual = Number(caminhoAtual);
    const limite = Number(total) || 5;
    if (!Number.isFinite(atual) || atual < 1 || atual > limite) return 1;
    return atual >= limite ? 1 : atual + 1;
  }

  function lerUltimoCaminho() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      const faseMetodo = normalizarFaseMetodo(parsed.faseMetodo);
      const caminho = Number(parsed.caminho);
      if (!faseMetodo || !Number.isFinite(caminho) || caminho < 1 || caminho > 5) {
        return null;
      }
      return {
        faseMetodo,
        caminho,
        updatedAt: Number(parsed.updatedAt) || Date.now()
      };
    } catch (err) {
      console.warn("[treino-caminhos] erro ao ler último caminho", err);
      return null;
    }
  }

  function salvarUltimoCaminho({ faseMetodo, caminho }) {
    const faseMetodoNorm = normalizarFaseMetodo(faseMetodo);
    const caminhoNum = Number(caminho);
    if (!faseMetodoNorm || !Number.isFinite(caminhoNum) || caminhoNum < 1 || caminhoNum > 5) {
      console.warn("[treino-caminhos] não foi possível salvar último caminho (dados inválidos)", {
        faseMetodo,
        caminho
      });
      return false;
    }

    const payload = {
      faseMetodo: faseMetodoNorm,
      caminho: caminhoNum,
      updatedAt: Date.now()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return true;
  }

  FEMFLOW.treinoCaminhos = {
    mapaSequenciaPorFase,
    normalizarFaseMetodo,
    diaParaPasso,
    resolverDiaPorCaminho,
    resolverFaseFirestorePorDia,
    resolverContextoDeBusca,
    proximoCaminho,
    lerUltimoCaminho,
    salvarUltimoCaminho
  };
})();
