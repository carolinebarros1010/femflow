(function initFirebaseFemFlow() {
  const env = window.FEMFLOW_ENV || "prod";

  const activeConfig =
    window.FEMFLOW_ACTIVE?.firebaseConfig ||
    window.FEMFLOW_CONFIG?.firebaseConfigs?.[env];

  const logError = env === "staging" ? console.warn : console.error;

  if (typeof firebase === "undefined") {
    logError("[FemFlow] Firebase SDK não carregado.");
    return;
  }

  if (!activeConfig || !activeConfig.apiKey) {
    logError("[FemFlow] Firebase config ausente para o ambiente atual.");
    return;
  }

  if (firebase.apps && firebase.apps.length > 0) {
    console.info("[FemFlow] Firebase já inicializado.");
    return;
  }

  try {
    firebase.initializeApp(activeConfig);

    const db = firebase.firestore();

    const isIOSWebView =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      typeof window.webkit !== "undefined";

    if (isIOSWebView && db?.settings) {
      db.settings({
        experimentalForceLongPolling: true,
        useFetchStreams: false
      });
    }

    window.db = db;

    console.info("[FemFlow] Firebase inicializado com sucesso.");

    /* =========================================================
       AUTH READY PROMISE — SEM LOGIN ANÔNIMO
    ========================================================= */

    const criarAuthReadyPromise = () => {
      if (!firebase.auth) return Promise.resolve();

      return new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged(() => {
          unsubscribe();
          resolve();
        });

        // fallback de segurança (caso nunca dispare)
        setTimeout(() => resolve(), 4000);
      });
    };

    window.FEMFLOW = window.FEMFLOW || {};
    window.FEMFLOW.firebaseAuthReady = criarAuthReadyPromise();

  } catch (err) {
    logError("[FemFlow] Erro ao inicializar Firebase:", err);
  }
})();

