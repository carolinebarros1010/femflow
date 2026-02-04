(function initFirebaseFemFlow() {
  const env = window.FEMFLOW_ENV || "staging";
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

    window.db = db; // 👈 opcional, mas útil
    console.info("[FemFlow] Firebase inicializado com sucesso.");
  } catch (err) {
    logError("[FemFlow] Erro ao inicializar Firebase:", err);
  }
})();
