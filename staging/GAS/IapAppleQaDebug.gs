function _qaGetAppleHeaderMap_(sh) {
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (v) {
    return String(v || "").trim();
  });
  const map = {};
  header.forEach(function (name, idx) {
    if (name && map[name] == null) map[name] = idx;
  });
  return map;
}

function _qaBuildAppleSnapshotFromRow_(row, headerMap, rowIndex) {
  function pick(name) {
    const idx = headerMap[name];
    return idx == null ? "" : row[idx];
  }

  return {
    rowIndex: rowIndex,
    userId: String(row[0] || "").trim(),
    email: String(row[2] || "").trim(),
    produto: String(pick("Produto") || "").trim(),
    licencaAtiva: pick("LicencaAtiva"),
    acessoPersonal: pick("acesso_personal"),
    iapSource: String(pick("IapSource") || "").trim(),
    iapPlan: String(pick("IapPlan") || "").trim(),
    iapEnv: String(pick("IapEnv") || "").trim(),
    iapProductId: String(pick("IapProductId") || "").trim(),
    iapTransactionId: String(pick("IapTransactionId") || "").trim(),
    iapOriginalTransactionId: String(pick("IapOriginalTransactionId") || "").trim(),
    iapStatus: String(pick("IapStatus") || "").trim(),
    iapExpiresAt: String(pick("IapExpiresAt") || "").trim(),
    iapLastValidatedAt: String(pick("IapLastValidatedAt") || "").trim(),
    iapValidationLevel: String(pick("IapValidationLevel") || "").trim(),
    iapValidationMethod: String(pick("IapValidationMethod") || "").trim(),
    iapLastSource: String(pick("IapLastSource") || "").trim(),
    iapLastReconcileMode: String(pick("IapLastReconcileMode") || "").trim(),
    iapCorrelationId: String(pick("IapCorrelationId") || "").trim(),
    iapIdempotencyKey: String(pick("IapIdempotencyKey") || "").trim(),
    iapLastNotificationType: String(pick("IapLastNotificationType") || "").trim(),
    iapLastNotificationSubtype: String(pick("IapLastNotificationSubtype") || "").trim()
  };
}

function qaAppleBillingSnapshot_(payload) {
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  _ensureIapColumns_(sh);
  const found = _findAlunaRowByIdOrEmail_(sh, payload || {});
  if (!found) return { status: "notfound", msg: "aluna_not_found" };

  const headerMap = _qaGetAppleHeaderMap_(sh);
  const snapshot = _qaBuildAppleSnapshotFromRow_(found.row, headerMap, found.rowIndex);

  return {
    status: "ok",
    provider: "apple_iap",
    snapshot: snapshot
  };
}

function qaAppleEntitlementSnapshot_(payload) {
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  _ensureIapColumns_(sh);
  const found = _findAlunaRowByIdOrEmail_(sh, payload || {});
  if (!found) return { status: "notfound", msg: "aluna_not_found" };

  const headerMap = _qaGetAppleHeaderMap_(sh);
  const snapshot = _qaBuildAppleSnapshotFromRow_(found.row, headerMap, found.rowIndex);

  const entitlementHeaderMap = {
    Produto: headerMap.Produto,
    LicencaAtiva: headerMap.LicencaAtiva,
    acesso_personal: headerMap.acesso_personal,
    IapSource: headerMap.IapSource,
    IapExpiresAt: headerMap.IapExpiresAt,
    IapPlan: headerMap.IapPlan,
    IapProductId: headerMap.IapProductId,
    IapOriginalTransactionId: headerMap.IapOriginalTransactionId,
    IapStatus: headerMap.IapStatus,
    IapLastValidatedAt: headerMap.IapLastValidatedAt
  };

  const entitlement = computeEntitlementsFromRow_(found.row, entitlementHeaderMap);

  return {
    status: "ok",
    provider: "apple_iap",
    snapshot: snapshot,
    entitlement: entitlement || null
  };
}

function qaAppleInspectByOriginalTransaction_(payload) {
  const originalTransactionId = String(payload && payload.originalTransactionId || "").trim();
  if (!originalTransactionId) return { status: "error", msg: "missing_original_transaction_id" };

  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const headerMap = _ensureIapColumns_(sh);
  const found = _findRowByOriginalTransactionId_(sh, headerMap, originalTransactionId);
  if (!found) return { status: "notfound", msg: "original_transaction_not_found" };

  const qaHeaderMap = _qaGetAppleHeaderMap_(sh);
  return {
    status: "ok",
    provider: "apple_iap",
    snapshot: _qaBuildAppleSnapshotFromRow_(found.row, qaHeaderMap, found.rowIndex)
  };
}

function qaRunAppleReconcileNow_(payload) {
  const inputToken = String(payload && payload.token || "").trim();
  const expectedToken = String(PropertiesService.getScriptProperties().getProperty("QA_DEBUG_TOKEN") || "").trim();

  if (!expectedToken) {
    return { status: "error", msg: "qa_debug_token_not_configured" };
  }

  if (!inputToken || inputToken !== expectedToken) {
    return { status: "denied", msg: "invalid_qa_debug_token" };
  }

  const result = reconcileAppleSubscriptions_();
  return Object.assign({ status: "ok", action: "reconcile_apple_subscriptions" }, result || {});
}
