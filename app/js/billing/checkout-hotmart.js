(function initFemFlowCheckoutHotmart(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.checkout = FEMFLOW.checkout || {};

  const HOTMART_PLAN_URLS = {
    access: FEMFLOW.LINK_ACESSO_APP || "https://pay.hotmart.com/T103984580L?off=ifcs6h6n",
    personal: FEMFLOW.LINK_PERSONAL || "https://pay.hotmart.com/T103984580L?off=sybtfokt"
  };

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

  function openHotmartCheckout(planId, context) {
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

  FEMFLOW.checkout.openHotmartCheckout = openHotmartCheckout;
  FEMFLOW.checkout.openHotmart = openHotmartCheckout;
})(window);
