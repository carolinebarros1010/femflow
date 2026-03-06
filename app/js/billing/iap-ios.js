(function initFemFlowIAPIOS(global) {
  const FEMFLOW = global.FEMFLOW = global.FEMFLOW || {};
  FEMFLOW.iapIOS = FEMFLOW.iapIOS || {};

  // Catálogo mínimo da Fase 2. TODO fase 3+: expandir para catálogo unificado do backend.
  const IOS_PRODUCT_MAP = {
    access: "com.femflow.app.access.monthly",
    personal: "com.femflow.app.personal.monthly"
  };

  const PRODUCT_TO_PLAN = Object.keys(IOS_PRODUCT_MAP).reduce((acc, planId) => {
    acc[IOS_PRODUCT_MAP[planId]] = planId;
    return acc;
  }, {});

  let initialized = false;

  function getPlatform() {
    return String(FEMFLOW.platform?.getPlatform?.() || global.Capacitor?.getPlatform?.() || "web").toLowerCase();
  }

  function isIOSNative() {
    return getPlatform() === "ios";
  }

  function getPlugin() {
    return global.NativePurchases || global.Capacitor?.Plugins?.NativePurchases || null;
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
    if (initialized) return;

    if (typeof plugin.initialize === "function") {
      await plugin.initialize({ storekit: 2 });
      initialized = true;
      return;
    }

    if (typeof plugin.init === "function") {
      await plugin.init({ storekit: 2 });
      initialized = true;
      return;
    }

    // Alguns bridges já vêm inicializados sem método explícito.
    initialized = true;
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

    if (!isIOSNative()) {
      return baseError("not_ios", { requested });
    }

    const plugin = getPlugin();
    if (!plugin) {
      return baseError("plugin_not_installed", { requested });
    }

    try {
      await initPluginIfNeeded(plugin);

      const requestedProductIds = requested
        .map((item) => resolveProductId(item))
        .filter(Boolean);

      if (!requestedProductIds.length) {
        return baseError("product_not_found", { requested });
      }

      let rawProducts = [];
      if (typeof plugin.getProducts === "function") {
        rawProducts = await plugin.getProducts({ productIds: requestedProductIds });
      } else if (typeof plugin.products === "function") {
        rawProducts = await plugin.products({ productIds: requestedProductIds });
      } else {
        return baseError("ios_iap_unavailable", { requested: requestedProductIds });
      }

      return {
        ok: true,
        provider: "apple_iap",
        platform: "ios",
        requested: requestedProductIds,
        products: normalizeProducts(rawProducts, requestedProductIds)
      };
    } catch (err) {
      return baseError("ios_iap_unavailable", { requested, message: err?.message || "" });
    }
  }

  async function purchaseIOS(planId, context) {
    const targetPlan = normalizePlanId(planId);
    const productId = resolveProductId(targetPlan);

    if (!isIOSNative()) {
      return baseError("not_ios", { planId: targetPlan, context: context || {} });
    }

    if (!productId) {
      return baseError("product_not_found", { planId: targetPlan, context: context || {} });
    }

    const plugin = getPlugin();
    if (!plugin) {
      return baseError("plugin_not_installed", { planId: targetPlan, productId, context: context || {} });
    }

    try {
      await initPluginIfNeeded(plugin);

      let rawTx = null;
      if (typeof plugin.purchaseProduct === "function") {
        rawTx = await plugin.purchaseProduct({ productId });
      } else if (typeof plugin.purchase === "function") {
        rawTx = await plugin.purchase({ productId });
      } else {
        return baseError("ios_iap_unavailable", { planId: targetPlan, productId, context: context || {} });
      }

      const tx = normalizeTransaction(rawTx, targetPlan, productId);
      if (!tx.transactionId) {
        return baseError("purchase_failed", { planId: targetPlan, productId, context: context || {} });
      }

      return Object.assign({ ok: true, provider: "apple_iap" }, tx, { context: context || {} });
    } catch (err) {
      const code = normalizeErrorCode(err, "purchase_failed");
      return baseError(code, {
        planId: targetPlan,
        productId,
        context: context || {},
        message: err?.message || ""
      });
    }
  }

  async function restoreIOS(context) {
    if (!isIOSNative()) {
      return baseError("not_ios", { restored: [], restoredCount: 0, context: context || {} });
    }

    const plugin = getPlugin();
    if (!plugin) {
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
        return baseError("ios_iap_unavailable", { restored: [], restoredCount: 0, context: context || {} });
      }

      const entries = Array.isArray(restoredRaw)
        ? restoredRaw
        : Array.isArray(restoredRaw?.purchases)
          ? restoredRaw.purchases
          : [];

      const restored = entries.map((tx) => normalizeTransaction(tx));
      return {
        ok: true,
        provider: "apple_iap",
        platform: "ios",
        restored,
        restoredCount: restored.length,
        context: context || {}
      };
    } catch (err) {
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

      const productId = resolveProductId(planIdOrProductId);
      const planId = resolvePlanFromProductId(productId, planIdOrProductId);
      const result = await purchaseIOS(planId, context);

      if (result.ok) {
        return {
          status: "ok",
          transactionId: result.transactionId,
          productId: result.productId,
          provider: result.provider
        };
      }

      if (result.code === "purchase_cancelled") {
        return { status: "cancelled", message: "purchase_cancelled", code: result.code };
      }

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
