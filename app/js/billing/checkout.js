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

    const isNativeIOS = FEMFLOW.platform?.isNativeIOS?.() === true;

    if (isNativeIOS) {
      const iapProductId = FEMFLOW.iapIOS?.catalog?.[targetPlan] || "";
      if (typeof FEMFLOW.iap?.purchase === "function") {
        console.info("[FEMFLOW.checkout] iOS convergido para trilha server-authoritative.", {
          planId: targetPlan,
          provider: "apple_iap",
          productId: iapProductId
        });
        return FEMFLOW.iap.purchase(iapProductId || targetPlan, Object.assign({}, ctx, {
          source: "checkout_gateway",
          planId: targetPlan,
          provider: "apple_iap"
        }));
      }

      console.warn("[FEMFLOW.checkout] Camada iOS IAP indisponível.", {
        planId: targetPlan,
        productId: iapProductId,
        context: ctx
      });
      return { ok: false, code: "ios_iap_unavailable", planId: targetPlan, platform };
    }

    if (!isNativeIOS) {
      const openHotmartExternal = FEMFLOW.checkout._openHotmartExternal;
      if (typeof openHotmartExternal === "function") {
        return openHotmartExternal(targetPlan, Object.assign({}, ctx, { __fromOpenCheckout: true }));
      }

      if (typeof FEMFLOW.checkout.ensureHotmartModule === "function") {
        return FEMFLOW.checkout.ensureHotmartModule().then(() =>
          FEMFLOW.checkout._openHotmartExternal?.(targetPlan, Object.assign({}, ctx, { __fromOpenCheckout: true }))
          || { ok: false, code: "hotmart_checkout_unavailable", planId: targetPlan, platform }
        );
      }

      return { ok: false, code: "hotmart_checkout_unavailable", planId: targetPlan, platform };
    }

    console.warn("[FEMFLOW.checkout] Plataforma não reconhecida; usando fallback web.", { platform, planId: targetPlan, context: ctx });
    return FEMFLOW.checkout._openHotmartExternal?.(targetPlan, Object.assign({}, ctx, { __fromOpenCheckout: true }))
      || { ok: false, code: "hotmart_checkout_unavailable", planId: targetPlan, platform };
  }

  FEMFLOW.checkout.openCheckout = openCheckout;
})(window);
