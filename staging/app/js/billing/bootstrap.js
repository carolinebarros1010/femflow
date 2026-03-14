(function initFemFlowBillingBootstrap(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.billing = FEMFLOW.billing || {};

  let bootstrapPromise = null;

  function isNativeIOS() {
    return FEMFLOW.platform?.isNativeIOS?.() === true;
  }

  function resolveLoaderSrc() {
    return new URL("js/billing/checkout-hotmart-loader.js", global.document?.baseURI || global.location?.href || "/").toString();
  }

  function hasHotmartLoaderScript() {
    return !!global.document?.querySelector('script[src*="checkout-hotmart-loader.js"]');
  }

  function loadScript(src) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.async = false;
      script.onload = () => resolve({ ok: true, code: "script_loaded", src });
      script.onerror = () => {
        console.error("[FEMFLOW.billing] Falha ao carregar script:", src);
        resolve({ ok: false, code: "script_load_failed", src });
      };
      document.head.appendChild(script);
    });
  }

  function init(options = {}) {
    if (bootstrapPromise) return bootstrapPromise;

    bootstrapPromise = Promise.resolve().then(async () => {
      if (isNativeIOS()) {
        console.info("[billing bootstrap] hotmart skipped on native iOS");
        return { ok: true, code: "ios_native_hotmart_skipped" };
      }

      const shouldLoadHotmart = options.loadHotmart !== false;
      if (!shouldLoadHotmart) {
        return { ok: true, code: "hotmart_disabled_by_options" };
      }

      if (hasHotmartLoaderScript()) {
        return { ok: true, code: "already_loaded" };
      }

      return loadScript(resolveLoaderSrc());
    }).finally(() => {
      bootstrapPromise = null;
    });

    return bootstrapPromise;
  }

  FEMFLOW.billing.bootstrap = {
    init
  };
})(window);
