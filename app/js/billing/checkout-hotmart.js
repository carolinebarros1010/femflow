(function initFemFlowCheckoutHotmart(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.checkout = FEMFLOW.checkout || {};
  FEMFLOW.billing = FEMFLOW.billing || {};

  // DEPRECATED compat layer: manter aliases legados (LINK_*) até migração total do billing.
  // Canonical map obrigatório: garante checkout comercial mesmo sem configuração externa.
  const HOTMART_CANONICAL_URLS = {
    access: "https://pay.hotmart.com/T103984580L?off=ifcs6h6n&checkoutMode=6",
    personal: "https://pay.hotmart.com/T103984580L?off=sybtfokt&checkoutMode=6"
  };

  function resolveHotmartPlanUrls() {
    const configuredHotmartUrls = FEMFLOW.checkout.hotmartPlanUrls
      || FEMFLOW.billing.hotmartPlanUrls
      || global.FEMFLOW_CONFIG?.billing?.hotmartPlanUrls
      || {};

    return {
      access: String(configuredHotmartUrls.access || FEMFLOW.LINK_ACESSO_APP || HOTMART_CANONICAL_URLS.access).trim(),
      personal: String(configuredHotmartUrls.personal || FEMFLOW.LINK_PERSONAL || HOTMART_CANONICAL_URLS.personal).trim()
    };
  }

  const HOTMART_PLAN_URLS = resolveHotmartPlanUrls();

  // Fonte principal para uso prático no comercial durante fase 1.5.
  FEMFLOW.billing.hotmartPlanUrls = HOTMART_PLAN_URLS;
  FEMFLOW.checkout.hotmartPlanUrls = HOTMART_PLAN_URLS;
  FEMFLOW.checkout.resolveHotmartPlanUrls = resolveHotmartPlanUrls;

  function normalizePlanId(planId) {
    const text = String(planId || "").toLowerCase().trim();
    if (text === "personal") return "personal";
    if (text === "access" || !text) return "access";

    console.error("[FEMFLOW.checkout] planId inválido recebido.", { planId });
    return null;
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
    const isNativeIOS = FEMFLOW.platform?.isNativeIOS?.() === true;

    if (isNativeIOS) {
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
    if (!targetPlan) {
      return { ok: false, code: "invalid_planId", planId: String(planId || "") };
    }

    const hotmartUrls = resolveHotmartPlanUrls();
    FEMFLOW.billing.hotmartPlanUrls = hotmartUrls;
    FEMFLOW.checkout.hotmartPlanUrls = hotmartUrls;
    const targetUrl = hotmartUrls[targetPlan];

    if (!targetUrl) {
      console.error("[FEMFLOW.checkout] URL Hotmart ausente para plano.", {
        planId,
        targetPlan,
        context,
        hotmartUrls,
        canonical: HOTMART_CANONICAL_URLS
      });
      FEMFLOW.toast?.(`Checkout indisponível (${targetPlan}).`);
      return { ok: false, code: "hotmart_url_not_found", planId: targetPlan, hotmartUrls };
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
  FEMFLOW.checkout.hotmartReady = true;
})(window);
