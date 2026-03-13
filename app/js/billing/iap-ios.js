(function initFemFlowIAPIOS(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.iapIOS = FEMFLOW.iapIOS || {};

  // Catálogo mínimo da Fase 2. TODO fase 3+: expandir para catálogo unificado do backend.
  const IOS_PRODUCT_MAP = {
    access: "com.femflow.app.premium.monthly",
    personal: "com.femflow.app.personal.pro.monthly"
  };

  const PRODUCT_TO_PLAN = Object.keys(IOS_PRODUCT_MAP).reduce((acc, planId) => {
    acc[IOS_PRODUCT_MAP[planId]] = planId;
    return acc;
  }, {});

  let initialized = false;
  const billingDebugLog = (event, data = {}) => {
    FEMFLOW.billingDebugLog?.(event, data);
  };

  function getPlatform() {
    return String(FEMFLOW.platform?.getPlatform?.() || global.Capacitor?.getPlatform?.() || "web").toLowerCase();
  }

  function isIOSNative() {
    return getPlatform() === "ios";
  }

  function getPlugin() {
    const windowPlugin = global.NativePurchases || null;
    const capacitorPlugin = global.Capacitor?.Plugins?.NativePurchases || null;
    const plugin = windowPlugin || capacitorPlugin || null;
    billingDebugLog("iap_getPlugin_checked", {
      plugin_found: Boolean(plugin),
      source: windowPlugin ? "window.NativePurchases" : capacitorPlugin ? "Capacitor.Plugins.NativePurchases" : "none"
    });
    return plugin;
  }

  function baseError(code, extra) {
    return Object.assign({
      ok: false,
      provider: "apple_iap",
      code,
      platform: getPlatform()
    }, extra || {});
  }

  function normalizePlanId(planId) {
    const normalized = String(planId || "access").toLowerCase().trim();
    return normalized === "personal" ? "personal" : "access";
  }

  function resolveProductId(planIdOrProductId) {
    const raw = String(planIdOrProductId || "").trim();
    if (!raw) return null;

    const lowered = raw.toLowerCase();
    if (lowered === "access") return IOS_PRODUCT_MAP.access;
    if (lowered === "personal") return IOS_PRODUCT_MAP.personal;

    if (PRODUCT_TO_PLAN[raw]) return raw;

    return null;
  }

  function resolvePlanFromProductId(productId, fallbackPlanId) {
    return PRODUCT_TO_PLAN[String(productId || "")] || normalizePlanId(fallbackPlanId || "access");
  }

  function normalizeErrorCode(err, fallbackCode) {
    const rawCode = String(err?.code || err?.errorCode || err?.status || "").toLowerCase();
    const rawMessage = String(err?.message || err?.errorMessage || "").toLowerCase();
    const isCancelled = rawCode.includes("cancel") || rawMessage.includes("cancel");
    if (isCancelled) return "purchase_cancelled";
    return fallbackCode;
  }

  async function initPluginIfNeeded(plugin) {
    billingDebugLog("iap_init_called", {
      alreadyInitialized: initialized,
      hasInitialize: typeof plugin?.initialize === "function",
      hasInit: typeof plugin?.init === "function"
    });
    if (initialized) return;

    if (typeof plugin.initialize === "function") {
      await plugin.initialize({ storekit: 2 });
      initialized = true;
      billingDebugLog("iap_init_result", { ok: true, method: "initialize", storekit: 2 });
      return;
    }

    if (typeof plugin.init === "function") {
      await plugin.init({ storekit: 2 });
      initialized = true;
      billingDebugLog("iap_init_result", { ok: true, method: "init", storekit: 2 });
      return;
    }

    // Alguns bridges já vêm inicializados sem método explícito.
    initialized = true;
    billingDebugLog("iap_init_result", { ok: true, method: "implicit", storekit: 2 });
  }

  function normalizeProducts(rawProducts, requestedProductIds) {
    const entries = Array.isArray(rawProducts)
      ? rawProducts
      : Array.isArray(rawProducts?.products)
        ? rawProducts.products
        : [];

    return requestedProductIds.map((productId) => {
      const raw = entries.find((item) => String(item?.productId || item?.id || "") === productId) || null;
      return {
        planId: resolvePlanFromProductId(productId),
        productId,
        title: raw?.title || raw?.localizedTitle || "",
        description: raw?.description || raw?.localizedDescription || "",
        price: raw?.priceString || raw?.localizedPrice || raw?.price || "",
        currencyCode: raw?.currencyCode || raw?.currency || "",
        raw
      };
    });
  }

  function normalizeTransaction(rawTx, fallbackPlanId, fallbackProductId) {
    const productId = String(rawTx?.productId || rawTx?.product || fallbackProductId || "");
    const transactionId = String(rawTx?.transactionId || rawTx?.id || rawTx?.transaction?.id || "");
    const originalTransactionId = String(rawTx?.originalTransactionId || rawTx?.originalId || "");

    return {
      planId: resolvePlanFromProductId(productId, fallbackPlanId),
      productId,
      transactionId,
      originalTransactionId,
      signedPayload: rawTx?.signedPayload || rawTx?.jwsRepresentation || "",
      receipt: rawTx?.receipt || rawTx?.transactionReceipt || "",
      token: rawTx?.token || rawTx?.purchaseToken || "",
      environment: rawTx?.environment || rawTx?.env || "",
      raw: rawTx || null
    };
  }

  async function listProducts(planIdsOrProductIds) {
    const requested = Array.isArray(planIdsOrProductIds) && planIdsOrProductIds.length
      ? planIdsOrProductIds
      : Object.keys(IOS_PRODUCT_MAP);

    billingDebugLog("iap_listProducts_called", {
      productIds: requested
    });

    if (!isIOSNative()) {
      billingDebugLog("iap_listProducts_result", {
        ok: false,
        code: "not_ios",
        returnedCount: 0,
        returnedIds: []
      });
      return baseError("not_ios", { requested });
    }

    const plugin = getPlugin();
    if (!plugin) {
      billingDebugLog("iap_listProducts_result", {
        ok: false,
        code: "plugin_not_installed",
        returnedCount: 0,
        returnedIds: []
      });
      return baseError("plugin_not_installed", { requested });
    }

    try {
      await initPluginIfNeeded(plugin);

      const requestedProductIds = requested
        .map((item) => resolveProductId(item))
        .filter(Boolean);

      if (!requestedProductIds.length) {
        billingDebugLog("iap_listProducts_result", {
          ok: false,
          code: "product_not_found",
          returnedCount: 0,
          returnedIds: []
        });
        return baseError("product_not_found", { requested });
      }

      let rawProducts = [];
      if (typeof plugin.getProducts === "function") {
        rawProducts = await plugin.getProducts({ productIds: requestedProductIds });
      } else if (typeof plugin.products === "function") {
        rawProducts = await plugin.products({ productIds: requestedProductIds });
      } else {
        billingDebugLog("iap_listProducts_result", {
          ok: false,
          code: "ios_iap_unavailable",
          returnedCount: 0,
          returnedIds: []
        });
        return baseError("ios_iap_unavailable", { requested: requestedProductIds });
      }

      const normalized = normalizeProducts(rawProducts, requestedProductIds);
      billingDebugLog("iap_listProducts_result", {
        ok: true,
        returnedCount: normalized.length,
        returnedIds: normalized.filter((item) => item?.raw).map((item) => item.productId),
        requestedIds: requestedProductIds
      });

      return {
        ok: true,
        provider: "apple_iap",
        platform: "ios",
        requested: requestedProductIds,
        products: normalized
      };
    } catch (err) {
      billingDebugLog("iap_listProducts_result", {
        ok: false,
        code: "ios_iap_unavailable",
        returnedCount: 0,
        returnedIds: [],
        message: err?.message || ""
      });
      return baseError("ios_iap_unavailable", { requested, message: err?.message || "" });
    }
  }

  async function purchaseIOS(planId, context) {
    const targetPlan = normalizePlanId(planId);
    const productId = resolveProductId(targetPlan);
    billingDebugLog("iap_purchase_called", {
      planId: targetPlan,
      productId,
      context: context || {}
    });

    billingDebugLog("iap_preflight_products_called", {
      productIds: Object.values(IOS_PRODUCT_MAP)
    });
    const preflight = await listProducts(Object.values(IOS_PRODUCT_MAP));
    billingDebugLog("iap_preflight_products_result", {
      ok: preflight?.ok === true,
      code: preflight?.code || "",
      returnedCount: Array.isArray(preflight?.products) ? preflight.products.length : 0,
      returnedIds: Array.isArray(preflight?.products)
        ? preflight.products.filter((item) => item?.raw).map((item) => item.productId)
        : []
    });

    if (!isIOSNative()) {
      billingDebugLog("iap_purchase_error", {
        code: "not_ios",
        message: "not_ios"
      });
      return baseError("not_ios", { planId: targetPlan, context: context || {} });
    }

    if (!productId) {
      billingDebugLog("iap_purchase_error", {
        code: "product_not_found",
        message: "product_not_found"
      });
      return baseError("product_not_found", { planId: targetPlan, context: context || {} });
    }

    const plugin = getPlugin();
    if (!plugin) {
      billingDebugLog("iap_purchase_error", {
        code: "plugin_not_installed",
        message: "plugin_not_installed"
      });
      return baseError("plugin_not_installed", { planId: targetPlan, productId, context: context || {} });
    }

    try {
      await initPluginIfNeeded(plugin);

      let rawTx = null;
      if (typeof plugin.purchaseProduct === "function") {
        billingDebugLog("iap_purchase_method_selected", { method: "purchaseProduct", productId });
        rawTx = await plugin.purchaseProduct({ productId });
      } else if (typeof plugin.purchase === "function") {
        billingDebugLog("iap_purchase_method_selected", { method: "purchase", productId });
        rawTx = await plugin.purchase({ productId });
      } else {
        billingDebugLog("iap_purchase_error", {
          code: "ios_iap_unavailable",
          message: "ios_iap_unavailable"
        });
        return baseError("ios_iap_unavailable", { planId: targetPlan, productId, context: context || {} });
      }

      const tx = normalizeTransaction(rawTx, targetPlan, productId);
      if (!tx.transactionId) {
        billingDebugLog("iap_purchase_result", {
          ok: false,
          code: "purchase_failed",
          productId
        });
        return baseError("purchase_failed", { planId: targetPlan, productId, context: context || {} });
      }

      billingDebugLog("iap_purchase_result", {
        ok: true,
        code: "ok",
        productId: tx.productId,
        transactionId: tx.transactionId
      });
      return Object.assign({ ok: true, provider: "apple_iap" }, tx, { context: context || {} });
    } catch (err) {
      const code = normalizeErrorCode(err, "purchase_failed");
      billingDebugLog("iap_purchase_error", {
        code,
        message: err?.message || "",
        stack: err?.stack ? String(err.stack).split("\n").slice(0, 3).join(" | ") : ""
      });
      return baseError(code, {
        planId: targetPlan,
        productId,
        context: context || {},
        message: err?.message || ""
      });
    }
  }

  async function restoreIOS(context) {
    billingDebugLog("iap_restore_called", {
      context: context || {}
    });

    if (!isIOSNative()) {
      billingDebugLog("iap_restore_error", {
        code: "not_ios",
        message: "not_ios"
      });
      return baseError("not_ios", { restored: [], restoredCount: 0, context: context || {} });
    }

    const plugin = getPlugin();
    if (!plugin) {
      billingDebugLog("iap_restore_error", {
        code: "plugin_not_installed",
        message: "plugin_not_installed"
      });
      return baseError("plugin_not_installed", { restored: [], restoredCount: 0, context: context || {} });
    }

    try {
      await initPluginIfNeeded(plugin);

      let restoredRaw = [];
      if (typeof plugin.restorePurchases === "function") {
        restoredRaw = await plugin.restorePurchases();
      } else if (typeof plugin.restore === "function") {
        restoredRaw = await plugin.restore();
      } else {
        billingDebugLog("iap_restore_error", {
          code: "ios_iap_unavailable",
          message: "ios_iap_unavailable"
        });
        return baseError("ios_iap_unavailable", { restored: [], restoredCount: 0, context: context || {} });
      }

      const entries = Array.isArray(restoredRaw)
        ? restoredRaw
        : Array.isArray(restoredRaw?.purchases)
          ? restoredRaw.purchases
          : [];

      const restored = entries.map((tx) => normalizeTransaction(tx));
      billingDebugLog("iap_restore_result", {
        ok: true,
        restoredCount: restored.length,
        restoredIds: restored.map((item) => item.productId).filter(Boolean)
      });
      return {
        ok: true,
        provider: "apple_iap",
        platform: "ios",
        restored,
        restoredCount: restored.length,
        context: context || {}
      };
    } catch (err) {
      billingDebugLog("iap_restore_error", {
        code: "restore_failed",
        message: err?.message || "",
        stack: err?.stack ? String(err.stack).split("\n").slice(0, 3).join(" | ") : ""
      });
      return baseError("restore_failed", {
        restored: [],
        restoredCount: 0,
        context: context || {},
        message: err?.message || ""
      });
    }
  }

  FEMFLOW.iapIOS.catalog = IOS_PRODUCT_MAP;
  FEMFLOW.iapIOS.listProducts = listProducts;
  FEMFLOW.iapIOS.purchaseIOS = purchaseIOS;
  FEMFLOW.iapIOS.restoreIOS = restoreIOS;

  // Compat legado: mantém API FEMFLOW.iap.* sem quebrar callers antigos.
  const legacyIap = FEMFLOW.iap || {};
  const legacyListProducts = legacyIap.listProducts;
  const legacyPurchase = legacyIap.purchase;
  const legacyRestore = legacyIap.restore;

  FEMFLOW.iap = Object.assign({}, legacyIap, {
    async listProducts(productIds) {
      if (!isIOSNative()) {
        return typeof legacyListProducts === "function"
          ? legacyListProducts.call(this, productIds)
          : { status: "stub", products: Array.isArray(productIds) ? productIds : [] };
      }

      const result = await listProducts(productIds);
      if (result.ok) {
        return { status: "ok", products: result.products, provider: result.provider };
      }

      return { status: "error", message: result.code, code: result.code, products: [] };
    },

    async purchase(planIdOrProductId, context) {
      if (!isIOSNative()) {
        return typeof legacyPurchase === "function"
          ? legacyPurchase.call(this, planIdOrProductId, context)
          : { status: "error", message: "not_ios" };
      }

      billingDebugLog("iap_purchase_called", {
        planIdOrProductId,
        context: context || {}
      });

      billingDebugLog("iap_preflight_products_called", {
        productIds: Object.values(IOS_PRODUCT_MAP)
      });
      const preflight = await listProducts(Object.values(IOS_PRODUCT_MAP));
      billingDebugLog("iap_preflight_products_result", {
        ok: preflight?.ok === true,
        code: preflight?.code || "",
        returnedCount: Array.isArray(preflight?.products) ? preflight.products.length : 0,
        returnedIds: Array.isArray(preflight?.products)
          ? preflight.products.filter((item) => item?.raw).map((item) => item.productId)
          : []
      });

      if (typeof legacyPurchase === "function") {
        const productIdFromInput = resolveProductId(planIdOrProductId) || planIdOrProductId;
        billingDebugLog("iap_purchase_method_selected", { method: "legacy", productId: productIdFromInput });
        const legacyResult = await legacyPurchase.call(this, productIdFromInput, context);
        billingDebugLog("iap_purchase_result", {
          ok: String(legacyResult?.status || "").toLowerCase() === "ok",
          code: legacyResult?.code || legacyResult?.status || "",
          productId: legacyResult?.productId || productIdFromInput
        });
        return legacyResult;
      }

      const productId = resolveProductId(planIdOrProductId);
      const planId = resolvePlanFromProductId(productId, planIdOrProductId);
      const result = await purchaseIOS(planId, context);

      if (result.ok) {
        billingDebugLog("iap_purchase_result", {
          ok: true,
          code: "ok",
          productId: result.productId,
          transactionId: result.transactionId
        });
        return {
          status: "ok",
          transactionId: result.transactionId,
          productId: result.productId,
          provider: result.provider
        };
      }

      if (result.code === "purchase_cancelled") {
        billingDebugLog("iap_purchase_error", {
          code: result.code,
          message: "purchase_cancelled"
        });
        return { status: "cancelled", message: "purchase_cancelled", code: result.code };
      }

      billingDebugLog("iap_purchase_error", {
        code: result.code || "purchase_failed",
        message: result.message || "purchase_failed"
      });
      return { status: "error", message: result.code, code: result.code };
    },

    async restore(context) {
      if (!isIOSNative()) {
        return typeof legacyRestore === "function"
          ? legacyRestore.call(this, context)
          : { status: "error", message: "not_ios", restoredCount: 0 };
      }

      const result = await restoreIOS(context);
      if (result.ok) {
        return { status: "ok", restoredCount: result.restoredCount, restored: result.restored, provider: result.provider };
      }

      return { status: "error", message: result.code, code: result.code, restoredCount: 0, restored: [] };
    }
  });
})(window);
