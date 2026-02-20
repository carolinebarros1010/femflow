(function initFirebaseFemFlow() {
  const env = window.FEMFLOW_ENV || "prod";
  const currentHost = window.location.hostname;

  const activeConfig =
    window.FEMFLOW_ACTIVE?.firebaseConfig ||
    window.FEMFLOW_CONFIG?.firebaseConfigs?.[env];

  const configuredOAuthDomains =
    window.FEMFLOW_ACTIVE?.oauthAuthorizedDomains ||
    window.FEMFLOW_CONFIG?.oauthAuthorizedDomains?.[env] ||
    [];

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

    const defaultOAuthDomains = [
      "localhost",
      "127.0.0.1",
      activeConfig.authDomain,
      activeConfig.projectId ? `${activeConfig.projectId}.firebaseapp.com` : "",
      activeConfig.projectId ? `${activeConfig.projectId}.web.app` : ""
    ].filter(Boolean);

    const knownOAuthDomains = Array.from(
      new Set([
        ...defaultOAuthDomains,
        ...configuredOAuthDomains
      ])
    );

    const isKnownOAuthHost = knownOAuthDomains.includes(currentHost);

    if (!isKnownOAuthHost) {
      console.warn(
        `[FemFlow] Domínio atual (${currentHost}) pode não estar autorizado no Firebase Auth para OAuth popup/redirect. ` +
          `Adicione-o em Firebase Console -> Authentication -> Settings -> Authorized domains.`
      );
    }

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
