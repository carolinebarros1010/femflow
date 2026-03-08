(function initFemFlowCheckoutHotmartLoader(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.checkout = FEMFLOW.checkout || {};

  let hotmartLoaderPromise = null;

  function isNativeIOS() {
    const cap = String(global.Capacitor?.getPlatform?.() || "").toLowerCase();
    return cap === "ios";
  }

  function ensureHotmartModule() {
    if (isNativeIOS()) {
      return Promise.resolve({ ok: false, code: "ios_hotmart_loader_skipped" });
    }

    if (typeof FEMFLOW.checkout._openHotmartExternal === "function") {
      return Promise.resolve({ ok: true, code: "hotmart_loader_already_ready" });
    }

    if (hotmartLoaderPromise) return hotmartLoaderPromise;

    hotmartLoaderPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "js/billing/checkout-hotmart.js";
      script.defer = true;
      script.async = false;
      script.onload = function () {
        resolve({ ok: true, code: "hotmart_loader_loaded" });
      };
      script.onerror = function () {
        console.error("[FEMFLOW.checkout] Falha ao carregar checkout-hotmart.js");
        resolve({ ok: false, code: "hotmart_loader_failed" });
      };
      document.head.appendChild(script);
    });

    return hotmartLoaderPromise;
  }

  FEMFLOW.checkout.ensureHotmartModule = ensureHotmartModule;
  ensureHotmartModule();
})(window);
