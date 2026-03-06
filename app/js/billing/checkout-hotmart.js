(function initFemFlowCheckoutHotmart(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.checkout = FEMFLOW.checkout || {};
  FEMFLOW.billing = FEMFLOW.billing || {};

  // DEPRECATED compat layer: manter aliases legados (LINK_*) até migração total do billing.
  const HOTMART_PLAN_URLS = {
    access: FEMFLOW.LINK_ACESSO_APP || "https://pay.hotmart.com/T103984580L?off=ifcs6h6n",
    personal: FEMFLOW.LINK_PERSONAL || "https://pay.hotmart.com/T103984580L?off=sybtfokt"
  };

  // Fonte principal para uso prático no comercial durante fase 1.5.
  FEMFLOW.billing.hotmartPlanUrls = HOTMART_PLAN_URLS;
  FEMFLOW.checkout.hotmartPlanUrls = HOTMART_PLAN_URLS;

  function normalizePlanId(planId) {
    const text = String(planId || "").toLowerCase().trim();
    if (text === "personal") return "personal";
    return "access";
  }

  function openExternalSafely(url) {
    if (typeof FEMFLOW.openExternal === "function") {
      FEMFLOW.openExternal(url);
      return "femflow_openExternal";
    }

    if (typeof global.open === "function") {
      global.open(url, "_blank", "noopener");
      return "window_open";
    }

    global.location.href = url;
    return "location_href";
  }

  function openHotmartExternal(planId, context) {
    const isIOS = FEMFLOW.platform?.isIOS?.() === true
      || String(global.Capacitor?.getPlatform?.() || "").toLowerCase() === "ios";

    if (isIOS) {
      const lang = String(FEMFLOW.lang || "pt").slice(0, 2).toLowerCase();
      const mensagens = {
        pt: "Assine no app para continuar",
        en: "Subscribe in the app to continue",
        fr: "Abonnez-vous dans l'app pour continuer"
      };
      FEMFLOW.toast?.(mensagens[lang] || mensagens.pt);
      console.warn("[iOS hardening] Checkout externo Hotmart bloqueado no iOS nativo.", { planId, context });
      return { ok: false, code: "ios_external_checkout_blocked", planId: normalizePlanId(planId), platform: "ios" };
    }

    const targetPlan = normalizePlanId(planId);
    const targetUrl = HOTMART_PLAN_URLS[targetPlan];

    if (!targetUrl) {
      console.error("[FEMFLOW.checkout] URL Hotmart não configurada para plano.", { planId, targetPlan, context });
      FEMFLOW.toast?.("Não foi possível abrir o checkout agora. Tente novamente.");
      return { ok: false, code: "hotmart_url_not_found", planId: targetPlan };
    }

    try {
      const strategy = openExternalSafely(targetUrl);
      console.info("[FEMFLOW.checkout] Abrindo checkout Hotmart.", { planId: targetPlan, context, strategy });
      return { ok: true, code: "ok", planId: targetPlan, provider: "hotmart", strategy };
    } catch (err) {
      console.error("[FEMFLOW.checkout] Erro ao abrir checkout Hotmart.", { err, planId: targetPlan, context });
      FEMFLOW.toast?.("Não foi possível abrir o checkout agora. Tente novamente.");
      return { ok: false, code: "hotmart_open_failed", planId: targetPlan };
    }
  }

  function openHotmartCheckout(planId, context) {
    const ctx = Object.assign({ source: "legacy_openHotmartCheckout" }, context || {});
    console.warn("[DEPRECATED] FEMFLOW.checkout.openHotmartCheckout() agora delega para FEMFLOW.checkout.openCheckout().", { planId, context: ctx });

    if (ctx.__fromOpenCheckout) {
      return openHotmartExternal(planId, ctx);
    }

    if (typeof FEMFLOW.checkout.openCheckout === "function") {
      return FEMFLOW.checkout.openCheckout(planId, ctx);
    }

    // Compat fallback temporário caso checkout.js ainda não tenha carregado.
    return openHotmartExternal(planId, ctx);
  }

  FEMFLOW.checkout._openHotmartExternal = openHotmartExternal;
  FEMFLOW.checkout.openHotmartCheckout = openHotmartCheckout;
  FEMFLOW.checkout.openHotmart = openHotmartCheckout;
})(window);
