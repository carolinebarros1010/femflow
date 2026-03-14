(function initFemFlowAccessBilling(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};

  FEMFLOW.platform = FEMFLOW.platform || {};
  if (typeof FEMFLOW.platform.getPlatform !== "function") {
    FEMFLOW.platform.getPlatform = function getPlatformFallback() {
      const cap = String(global.Capacitor?.getPlatform?.() || "").toLowerCase();
      if (cap === "ios" || cap === "android") return cap;
      return "web";
    };
  }
  FEMFLOW.platform.isIOS = FEMFLOW.platform.isIOS || function isIOS() {
    return FEMFLOW.platform.getPlatform() === "ios";
  };
  FEMFLOW.platform.isNativeIOS = FEMFLOW.platform.isNativeIOS || function isNativeIOS() {
    const nativePlatform = String(FEMFLOW.platform.getNativePlatform?.() || global.Capacitor?.getPlatform?.() || "").toLowerCase();
    return nativePlatform === "ios";
  };

  function normalizeBoolean(value) {
    if (typeof value === "boolean") return value;
    const text = String(value || "").trim().toLowerCase();
    return text === "true" || text === "1" || text === "yes" || text === "sim";
  }

  function getCachedState() {
    const produto = String(localStorage.getItem("femflow_produto") || "").toLowerCase();
    const isActive = normalizeBoolean(localStorage.getItem("femflow_ativa"));
    const hasPersonal = normalizeBoolean(localStorage.getItem("femflow_has_personal"));
    const freeAccessRaw = localStorage.getItem("femflow_free_access");
    let freeAccess = null;
    try {
      freeAccess = freeAccessRaw ? JSON.parse(freeAccessRaw) : null;
    } catch (err) {
      freeAccess = null;
    }

    return {
      produto,
      isActive,
      hasPersonal,
      freeAccess,
      status: isActive ? "active" : (produto === "trial_app" ? "trial" : "inactive")
    };
  }

  FEMFLOW.access = FEMFLOW.access || {};
  FEMFLOW.access.getState = function getState() {
    return getCachedState();
  };
  FEMFLOW.access.hasAccess = function hasAccess(feature = "app") {
    const state = getCachedState();
    const target = String(feature || "app").toLowerCase();

    if (target === "app") return state.isActive || state.status === "trial";
    if (target === "personal" || target === "followme") {
      return state.isActive && state.hasPersonal;
    }
    if (target === "premium") {
      return state.isActive;
    }

    return state.isActive;
  };

  FEMFLOW.access.refresh = async function refresh() {
    try {
      const resp = await FEMFLOW.refreshEntitlements?.();
      if (resp?.status === "ok") {
        return { ok: true, state: getCachedState(), backend: resp };
      }
      return { ok: false, state: getCachedState(), backend: resp || null };
    } catch (err) {
      return { ok: false, state: getCachedState(), error: err?.message || "refresh_failed" };
    }
  };

  function postToNative(payload) {
    const handler = global.webkit?.messageHandlers?.iap;
    if (!handler || typeof handler.postMessage !== "function") {
      return { ok: false, code: "native_bridge_unavailable" };
    }

    handler.postMessage(payload);
    return { ok: true };
  }

  FEMFLOW.billing = FEMFLOW.billing || {};
  const billingDebugLog = (event, data = {}) => {
    FEMFLOW.billingDebugLog?.(event, data);
  };

  FEMFLOW.billing.getProducts = async function getProducts() {
    if (!FEMFLOW.platform.isNativeIOS()) {
      return { ok: false, code: "not_ios", products: [] };
    }

    if (typeof FEMFLOW.iap?.listProducts === "function") {
      return FEMFLOW.iap.listProducts(FEMFLOW.IAP_PRODUCT_IDS || []);
    }

    return postToNative({ event: "getProducts", productIds: FEMFLOW.IAP_PRODUCT_IDS || [] });
  };

  FEMFLOW.billing.openPaywall = async function openPaywall(planId = "access", context = {}) {
    const targetPlan = String(planId || "access").toLowerCase() === "personal" ? "personal" : "access";
    const nativeIOS = FEMFLOW.platform.isNativeIOS();

    billingDebugLog("billing_openPaywall_called", {
      planId: targetPlan,
      context,
      isNativeIOS: nativeIOS
    });

    if (nativeIOS) {
      billingDebugLog("billing_openPaywall_native_bridge_attempt", {
        planId: targetPlan
      });
      const nativeResp = postToNative({ event: "openPaywall", planId: targetPlan, context });
      billingDebugLog("billing_openPaywall_native_bridge_result", {
        ok: nativeResp?.ok === true,
        code: nativeResp?.code || ""
      });
      if (nativeResp.ok) {
        const finalResult = { ok: true, source: "native_bridge", planId: targetPlan };
        billingDebugLog("billing_openPaywall_result_final", {
          source: finalResult.source,
          planId: finalResult.planId,
          ok: finalResult.ok
        });
        return finalResult;
      }

      billingDebugLog("billing_openPaywall_fallback_checkout", {
        planId: targetPlan,
        reason: nativeResp?.code || "native_bridge_unavailable"
      });
      const fallbackResult = await FEMFLOW.checkout?.openCheckout?.(targetPlan, Object.assign({}, context, { source: "billing_openPaywall" }));
      billingDebugLog("billing_openPaywall_result_final", {
        source: "checkout_fallback",
        planId: targetPlan,
        resultStatus: fallbackResult?.status || fallbackResult?.code || ""
      });
      return fallbackResult;
    }

    const webResult = await FEMFLOW.checkout?.openCheckout?.(targetPlan, Object.assign({}, context, { source: "billing_openPaywall" }));
    billingDebugLog("billing_openPaywall_result_final", {
      source: "direct_checkout",
      planId: targetPlan,
      resultStatus: webResult?.status || webResult?.code || ""
    });
    return webResult;
  };

  FEMFLOW.billing.purchase = async function purchase(productId, context = {}) {
    if (!FEMFLOW.platform.isNativeIOS()) {
      return { ok: false, code: "not_ios" };
    }

    if (typeof FEMFLOW.iap?.purchase === "function") {
      return FEMFLOW.iap.purchase(productId, context);
    }

    return postToNative({ event: "purchase", productId, context });
  };

  FEMFLOW.billing.restorePurchases = async function restorePurchases(context = {}) {
    if (!FEMFLOW.platform.isNativeIOS()) {
      return { ok: false, code: "not_ios" };
    }

    if (typeof FEMFLOW.iap?.restore === "function") {
      return FEMFLOW.iap.restore(context);
    }

    return postToNative({ event: "restore", context });
  };

  FEMFLOW.billing.syncEntitlements = async function syncEntitlements(payload = {}) {
    const refreshed = await FEMFLOW.access.refresh();
    document.dispatchEvent(new CustomEvent("femflow:entitlementsUpdated", {
      detail: Object.assign({ source: "billing_sync" }, payload || {}, { state: refreshed.state || null })
    }));
    return refreshed;
  };

  global.FEMFLOW_IAP_BRIDGE = global.FEMFLOW_IAP_BRIDGE || {
    purchaseSuccess(payload = {}) {
      FEMFLOW.billing.syncEntitlements(Object.assign({ event: "purchaseSuccess" }, payload));
    },
    purchaseFailed(payload = {}) {
      document.dispatchEvent(new CustomEvent("femflow:iapPurchaseFailed", { detail: payload }));
    },
    entitlementsUpdated(payload = {}) {
      FEMFLOW.updateEntitlementsFromPayload?.(payload);
      FEMFLOW.billing.syncEntitlements(Object.assign({ event: "entitlementsUpdated" }, payload));
    },
    restore(payload = {}) {
      FEMFLOW.billing.syncEntitlements(Object.assign({ event: "restore" }, payload));
    }
  };
})(window);
