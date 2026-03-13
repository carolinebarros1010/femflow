(function initFemFlowCheckout(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.checkout = FEMFLOW.checkout || {};
  const billingDebugLog = (event, data = {}) => {
    FEMFLOW.billingDebugLog?.(event, data);
  };

  function getTechnicalPurchaseErrorCopy() {
    const lang = String(FEMFLOW.lang || "pt").slice(0, 2).toLowerCase();
    const map = {
      pt: "Falha ao iniciar compra Apple.",
      en: "Failed to start Apple purchase.",
      fr: "Échec du démarrage de l'achat Apple."
    };
    return map[lang] || map.pt;
  }

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
    const nativeIOS = FEMFLOW.platform?.isNativeIOS?.() === true;
    billingDebugLog("checkout_openCheckout_called", {
      planId: targetPlan,
      platform,
      isNativeIOS: nativeIOS,
      context: ctx
    });
    console.info("[FEMFLOW.checkout] openCheckout", { planId: targetPlan, platform, context: ctx });

    function hotmartUnavailableResult() {
      console.error("[billing] hotmart checkout unavailable", {
        planId: targetPlan,
        platform
      });
      return { ok: false, code: "hotmart_checkout_unavailable", planId: targetPlan, platform };
    }

    if (nativeIOS) {
      const iapProductId = FEMFLOW.iapIOS?.catalog?.[targetPlan] || "";
      billingDebugLog("checkout_provider_selected", {
        provider: "apple_iap",
        productId: iapProductId,
        planId: targetPlan
      });
      if (typeof FEMFLOW.iap?.purchase === "function") {
        billingDebugLog("checkout_iap_purchase_attempt", {
          planId: targetPlan,
          productId: iapProductId || targetPlan
        });
        console.info("[FEMFLOW.checkout] iOS convergido para trilha server-authoritative.", {
          planId: targetPlan,
          provider: "apple_iap",
          productId: iapProductId
        });
        return Promise.resolve(FEMFLOW.iap.purchase(iapProductId || targetPlan, Object.assign({}, ctx, {
          source: "checkout_gateway",
          planId: targetPlan,
          provider: "apple_iap"
        }))).then((result) => {
          billingDebugLog("checkout_iap_purchase_result", {
            planId: targetPlan,
            status: result?.status || result?.code || "",
            productId: result?.productId || iapProductId || targetPlan
          });
          if (String(result?.status || "").toLowerCase() === "error") {
            FEMFLOW.toast?.(getTechnicalPurchaseErrorCopy());
          }
          return result;
        }).catch((err) => {
          billingDebugLog("checkout_iap_purchase_result", {
            planId: targetPlan,
            status: "exception",
            message: err?.message || ""
          });
          FEMFLOW.toast?.(getTechnicalPurchaseErrorCopy());
          throw err;
        });
      }

      console.warn("[FEMFLOW.checkout] Camada iOS IAP indisponível.", {
        planId: targetPlan,
        productId: iapProductId,
        context: ctx
      });
      billingDebugLog("checkout_iap_purchase_result", {
        planId: targetPlan,
        status: "ios_iap_unavailable",
        productId: iapProductId || ""
      });
      FEMFLOW.toast?.(getTechnicalPurchaseErrorCopy());
      return { ok: false, code: "ios_iap_unavailable", planId: targetPlan, platform };
    }

    if (!nativeIOS) {
      billingDebugLog("checkout_provider_selected", {
        provider: "hotmart",
        planId: targetPlan
      });
      const openHotmartExternal = FEMFLOW.checkout._openHotmartExternal;
      if (typeof openHotmartExternal === "function") {
        billingDebugLog("checkout_hotmart_attempt", { planId: targetPlan, strategy: "direct" });
        return openHotmartExternal(targetPlan, Object.assign({}, ctx, { __fromOpenCheckout: true }));
      }

      const ensureBootstrap = FEMFLOW.billing?.bootstrap?.init;
      const ensureHotmartModule = FEMFLOW.checkout.ensureHotmartModule;

      if (typeof ensureBootstrap === "function" || typeof ensureHotmartModule === "function") {
        return Promise.resolve()
          .then(() => {
            if (typeof FEMFLOW.checkout._openHotmartExternal === "function") return null;
            if (typeof ensureBootstrap === "function") {
              return ensureBootstrap();
            }
            return null;
          })
          .then(() => {
            if (typeof FEMFLOW.checkout._openHotmartExternal === "function") return null;
            if (typeof ensureHotmartModule === "function") {
              return ensureHotmartModule();
            }
            return null;
          })
          .then(() =>
            (billingDebugLog("checkout_hotmart_attempt", { planId: targetPlan, strategy: "loader_fallback" }),
            FEMFLOW.checkout._openHotmartExternal?.(targetPlan, Object.assign({}, ctx, { __fromOpenCheckout: true }))
            || hotmartUnavailableResult())
          );
      }

      return hotmartUnavailableResult();
    }

    console.warn("[FEMFLOW.checkout] Plataforma não reconhecida; usando fallback web.", { platform, planId: targetPlan, context: ctx });
    return FEMFLOW.checkout._openHotmartExternal?.(targetPlan, Object.assign({}, ctx, { __fromOpenCheckout: true }))
      || hotmartUnavailableResult();
  }

  FEMFLOW.checkout.openCheckout = openCheckout;
})(window);
