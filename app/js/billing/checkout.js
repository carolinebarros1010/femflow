(function initFemFlowCheckout(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.checkout = FEMFLOW.checkout || {};

  // TODO fase 2/3: expandir planId canônico para catálogo real de billing.
  function normalizePlanId(planId, context) {
    if (typeof planId === "object" && planId) {
      const legacyPlan = planId.preferredPlan || planId.planId;
      return {
        planId: String(legacyPlan || "access").toLowerCase() === "personal" ? "personal" : "access",
        context: Object.assign({}, planId, context || {})
      };
    }

    return {
      planId: String(planId || "access").toLowerCase() === "personal" ? "personal" : "access",
      context: context || {}
    };
  }

  function openCheckout(planId, context) {
    const normalized = normalizePlanId(planId, context);
    const targetPlan = normalized.planId;
    const ctx = normalized.context;

    const platform = FEMFLOW.platform?.getPlatform?.() || "web";
    console.info("[FEMFLOW.checkout] openCheckout", { planId: targetPlan, platform, context: ctx });

    if (platform === "ios") {
      FEMFLOW.toast?.("Assinatura via Apple em configuração.");
      console.info("[FEMFLOW.checkout] Checkout externo bloqueado no iOS (fase 1).", { planId: targetPlan, context: ctx });
      return { ok: false, code: "ios_iap_not_ready", planId: targetPlan, platform };
    }

    if (platform === "android" || platform === "web") {
      return FEMFLOW.checkout._openHotmartExternal?.(targetPlan, Object.assign({}, ctx, { __fromOpenCheckout: true }))
        || { ok: false, code: "hotmart_checkout_unavailable", planId: targetPlan, platform };
    }

    console.warn("[FEMFLOW.checkout] Plataforma não reconhecida; usando fallback web.", { platform, planId: targetPlan, context: ctx });
    return FEMFLOW.checkout._openHotmartExternal?.(targetPlan, Object.assign({}, ctx, { __fromOpenCheckout: true }))
      || { ok: false, code: "hotmart_checkout_unavailable", planId: targetPlan, platform };
  }

  FEMFLOW.checkout.openCheckout = openCheckout;
})(window);
