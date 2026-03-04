const IAP_APPLE_PRODUCT_IDS = [
  "com.femflow.app.access.monthly",
  "com.femflow.app.personal.monthly"
];

function _getHeaderMap_(sh) {
  const lastCol = Math.max(1, sh.getLastColumn());
  const header = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (v) {
    return String(v || "").trim();
  });

  const map = {};
  header.forEach(function (name, idx) {
    if (name && map[name] == null) map[name] = idx;
  });

  return { header: header, map: map };
}

function _ensureIapColumns_(sh) {
  const required = [
    "IapExpiresAt",
    "IapSource",
    "IapPlan",
    "IapEnv",
    "IapProductId",
    "IapTransactionId",
    "IapPurchaseDate"
  ];

  const headerInfo = _getHeaderMap_(sh);
  const missing = required.filter(function (name) {
    return headerInfo.map[name] == null;
  });

  if (missing.length) {
    const lastCol = sh.getLastColumn();
    sh.insertColumnsAfter(lastCol, missing.length);
    sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }

  return _getHeaderMap_(sh).map;
}

function _findAlunaRowByIdOrEmail_(sh, payload) {
  const id = String(payload.userId || payload.id || "").trim();
  const email = String(payload.email || "").toLowerCase().trim();
  if (!id && !email) return null;

  const rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    const rowId = String(rows[i][0] || "").trim();
    const rowEmail = String(rows[i][2] || "").toLowerCase().trim();
    if ((id && rowId === id) || (email && rowEmail === email)) {
      return { row: rows[i], rowIndex: i + 1 };
    }
  }
  return null;
}

function _resolvePlanFromAppleProduct_(productId) {
  const id = String(productId || "").trim().toLowerCase();
  if (id === "com.femflow.app.personal.monthly") {
    return { plan: "personal", produto: "acesso_app", modoPersonal: true };
  }
  return { plan: "access", produto: "acesso_app", modoPersonal: false };
}

function _isExpiredIso_(iso) {
  const raw = String(iso || "").trim();
  if (!raw) return false;
  const ts = Date.parse(raw);
  if (!isFinite(ts)) return false;
  return ts < Date.now();
}

function computeEntitlementsFromRow_(row, headerMap) {
  const idxProduto = headerMap && headerMap.Produto;
  const idxLicencaAtiva = headerMap && headerMap.LicencaAtiva;
  const idxAcessoPersonal = headerMap && headerMap.acesso_personal;
  const idxIapSource = headerMap && headerMap.IapSource;
  const idxIapExpiresAt = headerMap && headerMap.IapExpiresAt;
  const idxIapPlan = headerMap && headerMap.IapPlan;

  if (idxProduto == null || idxLicencaAtiva == null || idxAcessoPersonal == null) {
    return { status: "error", msg: "missing_required_columns" };
  }

  const produto = String(row[idxProduto] || "").toLowerCase().trim();
  const licencaAtiva = row[idxLicencaAtiva] === true || String(row[idxLicencaAtiva] || "").toLowerCase() === "true";
  const acessoPersonal = row[idxAcessoPersonal] === true || String(row[idxAcessoPersonal] || "").toLowerCase() === "true";

  const source = String((idxIapSource == null ? "" : row[idxIapSource]) || "").trim() || "hotmart";
  const expiresAt = String((idxIapExpiresAt == null ? "" : row[idxIapExpiresAt]) || "").trim();

  let acessoApp = licencaAtiva && produto !== "trial_app";
  if (source === "apple_iap" && _isExpiredIso_(expiresAt)) {
    acessoApp = false;
  }

  const modoPersonal = acessoApp ? acessoPersonal : false;
  const plan = String((idxIapPlan == null ? "" : row[idxIapPlan]) || "").trim() || (modoPersonal ? "personal" : "access");

  return {
    status: "ok",
    acesso_app: acessoApp,
    modo_personal: modoPersonal,
    expiresAt: expiresAt,
    source: source,
    plan: plan
  };
}

function iapAppleActivate_(payload) {
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const found = _findAlunaRowByIdOrEmail_(sh, payload || {});
  if (!found) return { status: "notfound", msg: "aluna_not_found" };

  const productId = String(payload.productId || "").trim();
  const transactionId = String(payload.transactionId || "").trim();
  const purchaseDate = String(payload.purchaseDate || "").trim();
  const expiresDate = String(payload.expiresDate || "").trim();
  const env = String(payload.env || "").trim().toLowerCase();

  if (!productId || !transactionId) {
    return { status: "error", msg: "missing_product_or_transaction" };
  }

  const planData = _resolvePlanFromAppleProduct_(productId);
  const headerMap = _ensureIapColumns_(sh);

  const idxProduto = headerMap.Produto;
  const idxLicencaAtiva = headerMap.LicencaAtiva;
  const idxAcessoPersonal = headerMap.acesso_personal;

  if (idxProduto == null || idxLicencaAtiva == null || idxAcessoPersonal == null) {
    return { status: "error", msg: "missing_required_columns" };
  }

  sh.getRange(found.rowIndex, idxProduto + 1).setValue(planData.produto);
  sh.getRange(found.rowIndex, idxLicencaAtiva + 1).setValue(true);
  sh.getRange(found.rowIndex, idxAcessoPersonal + 1).setValue(planData.modoPersonal);

  sh.getRange(found.rowIndex, headerMap.IapExpiresAt + 1).setValue(expiresDate || "");
  sh.getRange(found.rowIndex, headerMap.IapSource + 1).setValue("apple_iap");
  sh.getRange(found.rowIndex, headerMap.IapPlan + 1).setValue(planData.plan);
  sh.getRange(found.rowIndex, headerMap.IapEnv + 1).setValue(env || "");
  sh.getRange(found.rowIndex, headerMap.IapProductId + 1).setValue(productId);
  sh.getRange(found.rowIndex, headerMap.IapTransactionId + 1).setValue(transactionId);
  sh.getRange(found.rowIndex, headerMap.IapPurchaseDate + 1).setValue(purchaseDate || "");

  return {
    status: "ok",
    source: "apple_iap",
    plan: planData.plan,
    acesso_app: true,
    modo_personal: planData.modoPersonal,
    expiresAt: expiresDate || ""
  };
}

function entitlementsStatus_(payload) {
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const found = _findAlunaRowByIdOrEmail_(sh, payload || {});
  if (!found) return { status: "notfound", msg: "aluna_not_found" };

  const headerMap = _ensureIapColumns_(sh);
  const values = sh.getRange(found.rowIndex, 1, 1, sh.getLastColumn()).getValues()[0];
  const entitlements = computeEntitlementsFromRow_(values, headerMap);
  if (entitlements.status === "error") return entitlements;

  const produto = String(values[headerMap.Produto] || "").toLowerCase().trim();

  const modoPersonalNormalizado = entitlements.acesso_app && entitlements.modo_personal;

  return {
    status: "ok",
    acesso_app: entitlements.acesso_app,
    modo_personal: modoPersonalNormalizado,
    expiresAt: entitlements.expiresAt,
    source: entitlements.source,
    plan: entitlements.plan,
    produto: produto
  };
}
