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
    "IapPurchaseDate",
    "IapOriginalTransactionId",
    "IapStatus",
    "IapLastValidatedAt",
    "IapValidationEvidence",
    "IapLastSource",
    "IapCorrelationId",
    "IapIdempotencyKey",
    "IapLastNotificationType",
    "IapLastNotificationSubtype"
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

function _coerceAppleDateToIso_(raw) {
  if (raw == null || raw === "") return "";

  if (typeof raw === "number" || /^\d+$/.test(String(raw).trim())) {
    const numeric = Number(raw);
    if (!isFinite(numeric) || numeric <= 0) return "";
    const millis = numeric > 1e12 ? numeric : numeric * 1000;
    return new Date(millis).toISOString();
  }

  return _coerceIsoOrEmpty_(raw);
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

function _coerceIsoOrEmpty_(raw) {
  if (!raw) return "";
  const text = String(raw).trim();
  if (!text) return "";
  const ts = Date.parse(text);
  return isFinite(ts) ? new Date(ts).toISOString() : "";
}

function _isLikelyAppleTransactionId_(value) {
  return /^\d{8,}$/.test(String(value || "").trim());
}

function _hashPayloadEvidence_(obj) {
  const raw = typeof obj === "string" ? obj : JSON.stringify(obj || {});
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    const n = b < 0 ? b + 256 : b;
    return ("0" + n.toString(16)).slice(-2);
  }).join("");
}

function _decodeBase64Url_(chunk) {
  let s = String(chunk || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Utilities.newBlob(Utilities.base64Decode(s)).getDataAsString();
}

function _parseSignedPayload_(signedPayload) {
  const raw = String(signedPayload || "").trim();
  if (!raw || raw.indexOf(".") < 0) return null;

  const parts = raw.split(".");
  if (parts.length < 2) return null;

  try {
    return JSON.parse(_decodeBase64Url_(parts[1]));
  } catch (err) {
    console.log("[IAP] signed payload parse error", String(err));
    return null;
  }
}

function _verifyReceiptWithApple_(receiptData, transactionId) {
  const receipt = String(receiptData || "").trim();
  if (!receipt) {
    return { ok: false, reason: "missing_receipt" };
  }

  const sharedSecret = String(PropertiesService.getScriptProperties().getProperty("APPLE_SHARED_SECRET") || "").trim();
  if (!sharedSecret) {
    return { ok: false, reason: "missing_shared_secret" };
  }

  const requestBody = {
    "receipt-data": receipt,
    "password": sharedSecret,
    "exclude-old-transactions": true
  };

  function callVerify(url) {
    const resp = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      muteHttpExceptions: true,
      payload: JSON.stringify(requestBody)
    });
    const text = resp.getContentText() || "{}";
    return JSON.parse(text);
  }

  try {
    let body = callVerify("https://buy.itunes.apple.com/verifyReceipt");
    if (Number(body.status) === 21007) {
      body = callVerify("https://sandbox.itunes.apple.com/verifyReceipt");
    }

    if (Number(body.status) !== 0) {
      return { ok: false, reason: "apple_receipt_invalid", statusCode: Number(body.status || -1) };
    }

    const infos = [];
    if (Array.isArray(body.latest_receipt_info)) infos.push.apply(infos, body.latest_receipt_info);
    if (body.receipt && Array.isArray(body.receipt.in_app)) infos.push.apply(infos, body.receipt.in_app);
    const wantedTx = String(transactionId || "").trim();
    const matched = infos.find(function (item) {
      return String(item.transaction_id || "").trim() === wantedTx;
    }) || infos[0] || null;

    if (!matched) {
      return { ok: false, reason: "transaction_not_found_in_receipt" };
    }

    const env = String(body.environment || "").trim();
    return {
      ok: true,
      source: "receipt",
      productId: String(matched.product_id || "").trim(),
      transactionId: String(matched.transaction_id || "").trim(),
      originalTransactionId: String(matched.original_transaction_id || "").trim(),
      purchaseDate: _coerceIsoOrEmpty_(matched.purchase_date_ms ? new Date(Number(matched.purchase_date_ms)).toISOString() : matched.purchase_date),
      expiresDate: _coerceIsoOrEmpty_(matched.expires_date_ms ? new Date(Number(matched.expires_date_ms)).toISOString() : matched.expires_date),
      environment: env,
      evidenceHash: _hashPayloadEvidence_(matched)
    };
  } catch (err) {
    return { ok: false, reason: "receipt_validation_error", detail: String(err) };
  }
}

function _validateAppleTransactionServerSide_(payload, source) {
  const productId = String(payload.productId || "").trim();
  const transactionId = String(payload.transactionId || "").trim();
  const originalTransactionId = String(payload.originalTransactionId || "").trim();
  const signedPayload = String(payload.signedPayload || "").trim();
  const receipt = String(payload.receipt || payload.transactionReceipt || "").trim();
  const envHint = String(payload.environment || payload.env || payload.environmentHint || "").trim();

  if (!productId || !transactionId) {
    return { ok: false, status: "pending_validation", reason: "missing_product_or_transaction" };
  }

  if (IAP_APPLE_PRODUCT_IDS.indexOf(productId) < 0) {
    return { ok: false, status: "pending_validation", reason: "product_not_allowed" };
  }

  if (!_isLikelyAppleTransactionId_(transactionId)) {
    return { ok: false, status: "pending_validation", reason: "invalid_transaction_id" };
  }

  const bundleExpected = String(PropertiesService.getScriptProperties().getProperty("APPLE_BUNDLE_ID") || "com.femflow.app").trim();

  let validation = null;

  if (signedPayload) {
    const decoded = _parseSignedPayload_(signedPayload);
    if (decoded && typeof decoded === "object") {
      const decodedTx = String(decoded.transactionId || decoded.transaction_id || "").trim();
      const decodedOriginal = String(decoded.originalTransactionId || decoded.original_transaction_id || "").trim();
      const decodedProduct = String(decoded.productId || decoded.product_id || "").trim();
      const decodedBundle = String(decoded.bundleId || decoded.bundle_id || "").trim();
      const decodedEnv = String(decoded.environment || "").trim();

      if (decodedTx && decodedTx !== transactionId) {
        return { ok: false, status: "pending_validation", reason: "transaction_mismatch_signed_payload" };
      }

      if (decodedProduct && decodedProduct !== productId) {
        return { ok: false, status: "pending_validation", reason: "product_mismatch_signed_payload" };
      }

      if (decodedOriginal && originalTransactionId && decodedOriginal !== originalTransactionId) {
        return { ok: false, status: "pending_validation", reason: "original_transaction_mismatch_signed_payload" };
      }

      if (decodedBundle && bundleExpected && decodedBundle !== bundleExpected) {
        return { ok: false, status: "pending_validation", reason: "bundle_mismatch" };
      }

      validation = {
        ok: true,
        source: "signed_payload",
        productId: decodedProduct || productId,
        transactionId: decodedTx || transactionId,
        originalTransactionId: decodedOriginal || originalTransactionId || transactionId,
        purchaseDate: _coerceIsoOrEmpty_(decoded.purchaseDate || decoded.purchaseDateMs),
        expiresDate: _coerceIsoOrEmpty_(decoded.expiresDate || decoded.expiresDateMs || payload.expiresDate),
        environment: decodedEnv || envHint,
        evidenceHash: _hashPayloadEvidence_(decoded)
      };
    }
  }

  if (!validation && receipt) {
    const receiptValidation = _verifyReceiptWithApple_(receipt, transactionId);
    if (receiptValidation.ok) {
      if (receiptValidation.productId && receiptValidation.productId !== productId) {
        return { ok: false, status: "pending_validation", reason: "product_mismatch_receipt" };
      }
      if (originalTransactionId && receiptValidation.originalTransactionId && receiptValidation.originalTransactionId !== originalTransactionId) {
        return { ok: false, status: "pending_validation", reason: "original_transaction_mismatch_receipt" };
      }
      validation = receiptValidation;
    } else {
      return { ok: false, status: "pending_validation", reason: receiptValidation.reason || "receipt_validation_failed" };
    }
  }

  if (!validation) {
    return { ok: false, status: "pending_validation", reason: "missing_apple_evidence" };
  }

  const normalizedExpires = validation.expiresDate || _coerceIsoOrEmpty_(payload.expiresDate || payload.expiryDate);
  const status = normalizedExpires && _isExpiredIso_(normalizedExpires) ? "expired" : "active";

  return {
    ok: true,
    status: status,
    reason: "validated",
    source: source,
    productId: validation.productId || productId,
    transactionId: validation.transactionId || transactionId,
    originalTransactionId: validation.originalTransactionId || originalTransactionId || transactionId,
    purchaseDate: validation.purchaseDate || _coerceIsoOrEmpty_(payload.purchaseDate),
    expiresDate: normalizedExpires,
    environment: validation.environment || envHint,
    evidenceHash: validation.evidenceHash || _hashPayloadEvidence_({ productId: productId, transactionId: transactionId, source: source })
  };
}

function _findRowsByTransactionId_(sh, headerMap, transactionId) {
  const idxTx = headerMap.IapTransactionId;
  if (idxTx == null || !transactionId) return [];

  const rows = sh.getDataRange().getValues();
  const list = [];

  for (var i = 1; i < rows.length; i++) {
    const currentTx = String(rows[i][idxTx] || "").trim();
    if (currentTx && currentTx === transactionId) {
      list.push({ rowIndex: i + 1, row: rows[i] });
    }
  }

  return list;
}

function _getCurrentIsoNow_() {
  return new Date().toISOString();
}

function _isTruthy_(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").toLowerCase().trim();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "sim";
}

function _persistAppleValidationToRow_(sh, rowIndex, headerMap, payload, validationResult) {
  const planData = _resolvePlanFromAppleProduct_(validationResult.productId || payload.productId);
  const finalStatus = validationResult.status || "pending_validation";
  const expired = finalStatus === "expired";
  const active = finalStatus === "active";

  const idxProduto = headerMap.Produto;
  const idxLicencaAtiva = headerMap.LicencaAtiva;
  const idxAcessoPersonal = headerMap.acesso_personal;

  if (idxProduto == null || idxLicencaAtiva == null || idxAcessoPersonal == null) {
    return { status: "error", msg: "missing_required_columns" };
  }

  if (active) {
    sh.getRange(rowIndex, idxProduto + 1).setValue(planData.produto);
  }
  sh.getRange(rowIndex, idxLicencaAtiva + 1).setValue(active);
  sh.getRange(rowIndex, idxAcessoPersonal + 1).setValue(active && planData.modoPersonal);

  sh.getRange(rowIndex, headerMap.IapExpiresAt + 1).setValue(validationResult.expiresDate || "");
  sh.getRange(rowIndex, headerMap.IapSource + 1).setValue("apple_iap");
  sh.getRange(rowIndex, headerMap.IapPlan + 1).setValue(planData.plan);
  sh.getRange(rowIndex, headerMap.IapEnv + 1).setValue(validationResult.environment || "");
  sh.getRange(rowIndex, headerMap.IapProductId + 1).setValue(validationResult.productId || "");
  sh.getRange(rowIndex, headerMap.IapTransactionId + 1).setValue(validationResult.transactionId || "");
  sh.getRange(rowIndex, headerMap.IapPurchaseDate + 1).setValue(validationResult.purchaseDate || "");
  sh.getRange(rowIndex, headerMap.IapOriginalTransactionId + 1).setValue(validationResult.originalTransactionId || "");
  sh.getRange(rowIndex, headerMap.IapStatus + 1).setValue(finalStatus);
  sh.getRange(rowIndex, headerMap.IapLastValidatedAt + 1).setValue(_getCurrentIsoNow_());
  sh.getRange(rowIndex, headerMap.IapValidationEvidence + 1).setValue(validationResult.evidenceHash || "");
  sh.getRange(rowIndex, headerMap.IapLastSource + 1).setValue(String(payload.source || "activate"));
  sh.getRange(rowIndex, headerMap.IapCorrelationId + 1).setValue(String(payload.correlationId || ""));
  sh.getRange(rowIndex, headerMap.IapIdempotencyKey + 1).setValue(String(payload.idempotencyKey || ""));

  return {
    status: "ok",
    source: "apple_iap",
    plan: planData.plan,
    acesso_app: active,
    modo_personal: active && planData.modoPersonal,
    expiresAt: validationResult.expiresDate || "",
    provider: "apple_iap",
    platform: "ios",
    productId: validationResult.productId || "",
    transactionId: validationResult.transactionId || "",
    originalTransactionId: validationResult.originalTransactionId || "",
    entitlementStatus: finalStatus,
    lastValidatedAt: _getCurrentIsoNow_(),
    sourceOfTruth: "server"
  };
}

function _processIapAppleActivationCore_(payload, source) {
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const found = _findAlunaRowByIdOrEmail_(sh, payload || {});
  if (!found) return { status: "notfound", msg: "aluna_not_found" };

  const headerMap = _ensureIapColumns_(sh);
  const transactionId = String(payload.transactionId || "").trim();

  const duplicates = _findRowsByTransactionId_(sh, headerMap, transactionId);
  if (duplicates.length > 0 && duplicates[0].rowIndex !== found.rowIndex) {
    console.log("[IAP] duplicate transaction across users", JSON.stringify({
      source: source,
      transactionId: transactionId,
      currentRow: found.rowIndex,
      existingRow: duplicates[0].rowIndex
    }));
    return { status: "error", msg: "duplicate_transaction_conflict" };
  }

  if (duplicates.length > 0 && duplicates[0].rowIndex === found.rowIndex) {
    const row = duplicates[0].row;
    const statusValue = String(row[headerMap.IapStatus] || "").toLowerCase().trim() || "pending_validation";
    return {
      status: "ok",
      msg: "idempotent_replay",
      provider: "apple_iap",
      platform: "ios",
      productId: String(row[headerMap.IapProductId] || payload.productId || ""),
      transactionId: transactionId,
      originalTransactionId: String(row[headerMap.IapOriginalTransactionId] || payload.originalTransactionId || ""),
      entitlementStatus: statusValue,
      isActive: statusValue === "active",
      sourceOfTruth: "server",
      lastValidatedAt: String(row[headerMap.IapLastValidatedAt] || "")
    };
  }

  const validation = _validateAppleTransactionServerSide_(payload || {}, source || "activate");

  console.log("[IAP] validation", JSON.stringify({
    source: source,
    userId: String(payload.userId || payload.id || ""),
    transactionId: String(payload.transactionId || ""),
    originalTransactionId: String(payload.originalTransactionId || ""),
    result: validation.ok ? "ok" : "reject",
    reason: validation.reason || ""
  }));

  if (!validation.ok) {
    return {
      status: "error",
      msg: "apple_validation_failed",
      reason: validation.reason || "validation_failed",
      entitlementStatus: validation.status || "pending_validation",
      isActive: false,
      sourceOfTruth: "server"
    };
  }

  return _persistAppleValidationToRow_(sh, found.rowIndex, headerMap, payload, validation);
}

function iapAppleActivate_(payload) {
  const resp = _processIapAppleActivationCore_(payload || {}, "purchase");
  console.log("[IAP][activate]", JSON.stringify(_buildAppleIapLogContext_(payload, {
    status: resp && resp.status,
    result: resp && resp.status,
    entitlementStatus: resp && resp.entitlementStatus
  })));
  return resp;
}

function _buildAppleIapLogContext_(payload, extra) {
  const merged = Object.assign({}, payload || {}, extra || {});
  return {
    userId: String(merged.userId || merged.id || "").trim(),
    notificationType: String(merged.notificationType || "").trim(),
    subtype: String(merged.subtype || "").trim(),
    transactionId: String(merged.transactionId || "").trim(),
    originalTransactionId: String(merged.originalTransactionId || "").trim(),
    correlationId: String(merged.correlationId || merged.notificationId || "").trim(),
    result: String(merged.result || merged.status || "").trim(),
    entitlementStatus: String(merged.entitlementStatus || "").trim()
  };
}


function _findRowsByIdempotencyKey_(sh, headerMap, idempotencyKey) {
  const idxKey = headerMap.IapIdempotencyKey;
  const wanted = String(idempotencyKey || "").trim();
  if (idxKey == null || !wanted) return [];

  const rows = sh.getDataRange().getValues();
  const list = [];
  for (var i = 1; i < rows.length; i++) {
    const current = String(rows[i][idxKey] || "").trim();
    if (current && current === wanted) {
      list.push({ rowIndex: i + 1, row: rows[i] });
    }
  }

  return list;
}

function _findRowByOriginalTransactionId_(sh, headerMap, originalTransactionId) {
  const idxOriginal = headerMap.IapOriginalTransactionId;
  const wanted = String(originalTransactionId || "").trim();
  if (idxOriginal == null || !wanted) return null;

  const rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    const current = String(rows[i][idxOriginal] || "").trim();
    if (current && current === wanted) {
      return { rowIndex: i + 1, row: rows[i] };
    }
  }

  return null;
}

function _parseAppleNotificationPayload_(payload) {
  const root = payload && typeof payload === "object" ? payload : {};
  const signedPayload = String(root.signedPayload || root.signed_payload || "").trim();
  const decodedRoot = signedPayload ? (_parseSignedPayload_(signedPayload) || {}) : {};

  const data = decodedRoot.data || root.data || {};
  const signedTx = String(data.signedTransactionInfo || root.signedTransactionInfo || "").trim();
  const signedRenewal = String(data.signedRenewalInfo || root.signedRenewalInfo || "").trim();
  const decodedTx = signedTx ? (_parseSignedPayload_(signedTx) || {}) : {};
  const decodedRenewal = signedRenewal ? (_parseSignedPayload_(signedRenewal) || {}) : {};

  const notificationType = String(decodedRoot.notificationType || root.notificationType || root.notification_type || "").trim();
  const subtype = String(decodedRoot.subtype || root.subtype || "").trim();
  const transactionId = String(decodedTx.transactionId || decodedTx.transaction_id || root.transactionId || root.transaction_id || "").trim();
  const originalTransactionId = String(decodedTx.originalTransactionId || decodedTx.original_transaction_id || root.originalTransactionId || root.original_transaction_id || transactionId || "").trim();
  const productId = String(decodedTx.productId || decodedTx.product_id || root.productId || root.product_id || "").trim();
  const expiresDate = _coerceAppleDateToIso_(
    decodedTx.expiresDate || decodedTx.expiresDateMs || decodedTx.expiresDateMillis ||
    root.expiresDate || root.expiresDateMs || root.expiryDate
  );
  const autoRenewStatusRaw = decodedRenewal.autoRenewStatus || decodedRenewal.auto_renew_status || root.autoRenewStatus;
  const autoRenewStatus = autoRenewStatusRaw == null || autoRenewStatusRaw === ""
    ? ""
    : (String(autoRenewStatusRaw) === "1" || String(autoRenewStatusRaw).toLowerCase() === "true" ? "on" : "off");
  const environment = String(decodedRoot.environment || decodedTx.environment || decodedRenewal.environment || root.environment || "").trim();
  const bundleId = String(
    decodedRoot.bundleId || decodedRoot.bundle_id || decodedTx.bundleId || decodedTx.bundle_id ||
    decodedRenewal.bundleId || decodedRenewal.bundle_id || root.bundleId || root.bundle_id || ""
  ).trim();
  const notificationUUID = String(decodedRoot.notificationUUID || root.notificationUUID || root.notificationId || "").trim();
  const idempotencyKey = notificationUUID || _hashPayloadEvidence_(signedPayload || root);

  return {
    notificationType: notificationType,
    subtype: subtype,
    transactionId: transactionId,
    originalTransactionId: originalTransactionId,
    productId: productId,
    expiresDate: expiresDate,
    autoRenewStatus: autoRenewStatus,
    environment: environment,
    bundleId: bundleId,
    notificationUUID: notificationUUID,
    notificationId: idempotencyKey,
    rawPayloadHash: _hashPayloadEvidence_(root),
    decodeState: {
      rootDecoded: !!(signedPayload && Object.keys(decodedRoot).length),
      transactionDecoded: !!(signedTx && Object.keys(decodedTx).length),
      renewalDecoded: !!(signedRenewal && Object.keys(decodedRenewal).length)
    }
  };
}

function _mapAppleNotificationEventToLocalStatus_(notificationType) {
  const eventType = String(notificationType || "").trim().toUpperCase();
  const table = {
    "DID_RENEW": "active",
    "SUBSCRIBED": "active",
    "EXPIRED": "expired",
    "REFUND": "revoked",
    "REVOKE": "revoked",
    "DID_FAIL_TO_RENEW": "retry",
    "GRACE_PERIOD_EXPIRED": "expired"
  };
  return table[eventType] || "pending_validation";
}

function _isAllowedAppleEnvironment_(value) {
  const env = String(value || "").trim();
  return !env || env === "Sandbox" || env === "Production";
}

function _validateParsedAppleNotification_(parsed, targetRow, headerMap) {
  if (!parsed.decodeState.rootDecoded) {
    return { ok: false, msg: "invalid_signed_payload_root" };
  }

  const eventType = String(parsed.notificationType || "").trim().toUpperCase();
  const requiresTransactionInfo = {
    "DID_RENEW": true,
    "SUBSCRIBED": true,
    "EXPIRED": true,
    "REFUND": true,
    "REVOKE": true
  };

  if (requiresTransactionInfo[eventType] && !parsed.decodeState.transactionDecoded) {
    return { ok: false, msg: "invalid_signed_transaction_info" };
  }

  if (!parsed.decodeState.transactionDecoded) {
    const hasFallbackIdentity = !!(parsed.originalTransactionId || parsed.productId);
    if (!hasFallbackIdentity) {
      return { ok: false, msg: "insufficient_notification_identity" };
    }
  }

  if (parsed.productId && IAP_APPLE_PRODUCT_IDS.indexOf(parsed.productId) < 0) {
    return { ok: false, msg: "product_not_allowed" };
  }

  if (parsed.transactionId && !_isLikelyAppleTransactionId_(parsed.transactionId)) {
    return { ok: false, msg: "invalid_transaction_id" };
  }

  const bundleExpected = String(PropertiesService.getScriptProperties().getProperty("APPLE_BUNDLE_ID") || "com.femflow.app").trim();
  if (parsed.bundleId && bundleExpected && parsed.bundleId !== bundleExpected) {
    return { ok: false, msg: "bundle_mismatch" };
  }

  if (!_isAllowedAppleEnvironment_(parsed.environment)) {
    return { ok: false, msg: "invalid_environment" };
  }

  const rowOriginalTx = String(targetRow.row[headerMap.IapOriginalTransactionId] || "").trim();
  if (rowOriginalTx && parsed.originalTransactionId && rowOriginalTx !== parsed.originalTransactionId) {
    return { ok: false, msg: "original_transaction_mismatch" };
  }

  return { ok: true };
}

function iapAppleRestore_(payload) {
  const list = Array.isArray(payload && payload.transactions) ? payload.transactions : [];

  if (!list.length) {
    const single = _processIapAppleActivationCore_(Object.assign({}, payload || {}, {
      source: "restore"
    }), "restore");

    console.log("[IAP][restore]", JSON.stringify(_buildAppleIapLogContext_(payload, {
      status: single && single.status,
      result: single && single.status,
      entitlementStatus: single && single.entitlementStatus
    })));

    return single;
  }

  const results = [];
  let activeCount = 0;
  let successCount = 0;

  for (var i = 0; i < list.length; i++) {
    const tx = list[i] || {};
    const merged = Object.assign({}, payload || {}, tx, { source: "restore" });
    const resp = _processIapAppleActivationCore_(merged, "restore");
    results.push(resp);

    const txStatus = String(resp && resp.status || "").toLowerCase();
    if (txStatus === "ok") {
      successCount += 1;
      if (resp && resp.entitlementStatus === "active") {
        activeCount += 1;
      }
    }

    console.log("[IAP][restore]", JSON.stringify(_buildAppleIapLogContext_(merged, {
      status: txStatus || "error",
      result: txStatus || "error",
      entitlementStatus: resp && resp.entitlementStatus
    })));
  }

  const failedCount = results.length - successCount;
  const overallStatus = successCount === 0
    ? "error"
    : (failedCount > 0 ? "partial" : "ok");

  return {
    status: overallStatus,
    provider: "apple_iap",
    platform: "ios",
    restored: results,
    results: results,
    totalCount: results.length,
    processedCount: results.length,
    restoredCount: successCount,
    restoredActiveCount: activeCount,
    failedCount: failedCount,
    sourceOfTruth: "server"
  };
}

function iapAppleNotification_(payload) {
  const signedPayload = String(payload && (payload.signedPayload || payload.signed_payload) || "").trim();
  if (!signedPayload) {
    return { status: "error", msg: "missing_signed_payload" };
  }

  // TODO: verificar assinatura JWS Apple Notifications V2 antes de promover para produção robusta.
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const headerMap = _ensureIapColumns_(sh);
  const parsed = _parseAppleNotificationPayload_(payload || {});

  console.log("[IAP][notification]", JSON.stringify(_buildAppleIapLogContext_(payload, {
    notificationType: parsed.notificationType,
    subtype: parsed.subtype,
    notificationUUID: parsed.notificationUUID,
    transactionId: parsed.transactionId,
    originalTransactionId: parsed.originalTransactionId,
    correlationId: parsed.notificationId,
    status: "received",
    result: "received",
    entitlementStatus: "pending_validation"
  })));

  const duplicate = _findRowsByIdempotencyKey_(sh, headerMap, parsed.notificationId);
  if (duplicate.length > 0) {
    const dupeRow = duplicate[0].row;
    const dupeStatus = String(dupeRow[headerMap.IapStatus] || "").trim() || "pending_validation";
    return {
      status: "ok",
      msg: "idempotent_notification_replay",
      provider: "apple_iap",
      platform: "ios",
      notificationType: parsed.notificationType,
      subtype: parsed.subtype,
      notificationUUID: parsed.notificationUUID,
      transactionId: parsed.transactionId,
      originalTransactionId: parsed.originalTransactionId,
      productId: parsed.productId,
      entitlementStatus: dupeStatus,
      isActive: dupeStatus === "active",
      correlationId: parsed.notificationId,
      sourceOfTruth: "server"
    };
  }

  const targetRow = _findRowByOriginalTransactionId_(sh, headerMap, parsed.originalTransactionId);
  if (!targetRow) {
    return {
      status: "ok",
      msg: "notification_user_not_found",
      provider: "apple_iap",
      platform: "ios",
      notificationType: parsed.notificationType,
      subtype: parsed.subtype,
      notificationUUID: parsed.notificationUUID,
      transactionId: parsed.transactionId,
      originalTransactionId: parsed.originalTransactionId,
      productId: parsed.productId,
      correlationId: parsed.notificationId,
      sourceOfTruth: "server"
    };
  }

  const validation = _validateParsedAppleNotification_(parsed, targetRow, headerMap);
  if (!validation.ok) {
    return {
      status: "error",
      msg: validation.msg,
      provider: "apple_iap",
      platform: "ios",
      notificationType: parsed.notificationType,
      subtype: parsed.subtype,
      notificationUUID: parsed.notificationUUID,
      transactionId: parsed.transactionId,
      originalTransactionId: parsed.originalTransactionId,
      productId: parsed.productId,
      entitlementStatus: "pending_validation",
      isActive: false,
      correlationId: parsed.notificationId,
      sourceOfTruth: "server"
    };
  }

  const newStatus = _mapAppleNotificationEventToLocalStatus_(parsed.notificationType);
  const isActive = newStatus === "active";

  sh.getRange(targetRow.rowIndex, headerMap.IapStatus + 1).setValue(newStatus);
  sh.getRange(targetRow.rowIndex, headerMap.LicencaAtiva + 1).setValue(isActive);
  if (headerMap.acesso_personal != null && !isActive) {
    sh.getRange(targetRow.rowIndex, headerMap.acesso_personal + 1).setValue(false);
  }
  sh.getRange(targetRow.rowIndex, headerMap.IapLastValidatedAt + 1).setValue(_getCurrentIsoNow_());
  sh.getRange(targetRow.rowIndex, headerMap.IapCorrelationId + 1).setValue(parsed.notificationId);
  sh.getRange(targetRow.rowIndex, headerMap.IapLastSource + 1).setValue("notification");
  sh.getRange(targetRow.rowIndex, headerMap.IapIdempotencyKey + 1).setValue(parsed.notificationId);
  sh.getRange(targetRow.rowIndex, headerMap.IapValidationEvidence + 1).setValue(JSON.stringify({
    hash: parsed.rawPayloadHash,
    notificationType: parsed.notificationType,
    subtype: parsed.subtype,
    environment: parsed.environment,
    decodeState: parsed.decodeState,
    verification: "unsigned_payload_consistency_only"
  }));
  if (headerMap.IapLastNotificationType != null) {
    sh.getRange(targetRow.rowIndex, headerMap.IapLastNotificationType + 1).setValue(parsed.notificationType || "");
  }
  if (headerMap.IapLastNotificationSubtype != null) {
    sh.getRange(targetRow.rowIndex, headerMap.IapLastNotificationSubtype + 1).setValue(parsed.subtype || "");
  }

  if (newStatus === "revoked") {
    sh.getRange(targetRow.rowIndex, headerMap.IapExpiresAt + 1).setValue("");
  } else if (parsed.expiresDate) {
    sh.getRange(targetRow.rowIndex, headerMap.IapExpiresAt + 1).setValue(parsed.expiresDate);
  }
  if (parsed.transactionId) {
    sh.getRange(targetRow.rowIndex, headerMap.IapTransactionId + 1).setValue(parsed.transactionId);
  }
  if (parsed.originalTransactionId) {
    sh.getRange(targetRow.rowIndex, headerMap.IapOriginalTransactionId + 1).setValue(parsed.originalTransactionId);
  }
  if (parsed.productId) {
    sh.getRange(targetRow.rowIndex, headerMap.IapProductId + 1).setValue(parsed.productId);
  }
  if (parsed.environment && headerMap.IapEnv != null) {
    sh.getRange(targetRow.rowIndex, headerMap.IapEnv + 1).setValue(parsed.environment);
  }

  console.log("[IAP][notification]", JSON.stringify(_buildAppleIapLogContext_(payload, {
    notificationType: parsed.notificationType,
    subtype: parsed.subtype,
    notificationUUID: parsed.notificationUUID,
    transactionId: parsed.transactionId,
    originalTransactionId: parsed.originalTransactionId,
    correlationId: parsed.notificationId,
    status: "processed",
    result: "ok",
    entitlementStatus: newStatus
  })));

  return {
    status: "ok",
    provider: "apple_iap",
    platform: "ios",
    notificationType: parsed.notificationType,
    subtype: parsed.subtype,
    notificationUUID: parsed.notificationUUID,
    transactionId: parsed.transactionId,
    originalTransactionId: parsed.originalTransactionId,
    productId: parsed.productId,
    entitlementStatus: newStatus,
    isActive: isActive,
    correlationId: parsed.notificationId,
    autoRenewStatus: parsed.autoRenewStatus,
    environment: parsed.environment,
    sourceOfTruth: "server"
  };
}

function reconcileAppleSubscriptions_() {
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const headerMap = _ensureIapColumns_(sh);
  const rows = sh.getDataRange().getValues();
  const nowIso = _getCurrentIsoNow_();

  let scannedCount = 0;
  let updatedCount = 0;

  for (var i = 1; i < rows.length; i++) {
    const row = rows[i];
    const source = String(row[headerMap.IapSource] || "").trim();
    if (source !== "apple_iap") continue;

    scannedCount += 1;

    const expiresAt = String(row[headerMap.IapExpiresAt] || "").trim();
    const isExpired = _isExpiredIso_(expiresAt);
    if (!isExpired) continue;

    const currentStatus = String(row[headerMap.IapStatus] || "").toLowerCase().trim();
    const currentLicense = _isTruthy_(row[headerMap.LicencaAtiva]);

    if (currentStatus !== "expired" || currentLicense) {
      sh.getRange(i + 1, headerMap.IapStatus + 1).setValue("expired");
      sh.getRange(i + 1, headerMap.LicencaAtiva + 1).setValue(false);
      if (headerMap.acesso_personal != null) {
        sh.getRange(i + 1, headerMap.acesso_personal + 1).setValue(false);
      }
      sh.getRange(i + 1, headerMap.IapLastValidatedAt + 1).setValue(nowIso);
      updatedCount += 1;
    }
  }

  return {
    status: "ok",
    provider: "apple_iap",
    scannedCount: scannedCount,
    updatedCount: updatedCount,
    sourceOfTruth: "local_reconciliation",
    lastValidatedAt: nowIso
  };
}

function computeEntitlementsFromRow_(row, headerMap) {
  const idxProduto = headerMap && headerMap.Produto;
  const idxLicencaAtiva = headerMap && headerMap.LicencaAtiva;
  const idxAcessoPersonal = headerMap && headerMap.acesso_personal;
  const idxIapSource = headerMap && headerMap.IapSource;
  const idxIapExpiresAt = headerMap && headerMap.IapExpiresAt;
  const idxIapPlan = headerMap && headerMap.IapPlan;
  const idxIapStatus = headerMap && headerMap.IapStatus;
  const idxIapProductId = headerMap && headerMap.IapProductId;
  const idxIapOriginalTx = headerMap && headerMap.IapOriginalTransactionId;
  const idxIapLastValidatedAt = headerMap && headerMap.IapLastValidatedAt;

  if (idxProduto == null || idxLicencaAtiva == null || idxAcessoPersonal == null) {
    return null;
  }

  const produto = String(row[idxProduto] || "").toLowerCase().trim();
  const licencaAtiva = _isTruthy_(row[idxLicencaAtiva]);
  const acessoPersonal = _isTruthy_(row[idxAcessoPersonal]);

  const source = String((idxIapSource == null ? "" : row[idxIapSource]) || "").trim() || "hotmart";
  const expiresAt = String((idxIapExpiresAt == null ? "" : row[idxIapExpiresAt]) || "").trim();
  const iapStatus = String((idxIapStatus == null ? "" : row[idxIapStatus]) || "").toLowerCase().trim();
  const expiredByDate = source === "apple_iap" && _isExpiredIso_(expiresAt);

  const status = source === "apple_iap"
    ? (iapStatus || (expiredByDate ? "expired" : (licencaAtiva ? "active" : "pending_validation")))
    : (licencaAtiva ? "active" : "expired");

  const activeByStatus = status === "active" && !expiredByDate;
  const acessoApp = source === "apple_iap"
    ? (licencaAtiva && produto !== "trial_app" && activeByStatus)
    : (licencaAtiva && produto !== "trial_app");

  const modoPersonal = acessoApp ? acessoPersonal : false;
  const plan = String((idxIapPlan == null ? "" : row[idxIapPlan]) || "").trim() || (modoPersonal ? "personal" : "access");

  return {
    acesso_app: acessoApp,
    modo_personal: modoPersonal,
    expiresAt: expiresAt,
    source: source,
    plan: plan,
    status: status,
    productId: String((idxIapProductId == null ? "" : row[idxIapProductId]) || "").trim(),
    originalTransactionId: String((idxIapOriginalTx == null ? "" : row[idxIapOriginalTx]) || "").trim(),
    lastValidatedAt: String((idxIapLastValidatedAt == null ? "" : row[idxIapLastValidatedAt]) || "").trim()
  };
}

function entitlementsStatus_(payload) {
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const found = _findAlunaRowByIdOrEmail_(sh, payload || {});
  if (!found) return { status: "notfound", msg: "aluna_not_found" };

  _ensureIapColumns_(sh);
  const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const headerMap = {
    Produto: header.indexOf("Produto"),
    LicencaAtiva: header.indexOf("LicencaAtiva"),
    acesso_personal: header.indexOf("acesso_personal"),
    IapSource: header.indexOf("IapSource"),
    IapExpiresAt: header.indexOf("IapExpiresAt"),
    IapPlan: header.indexOf("IapPlan"),
    IapProductId: header.indexOf("IapProductId"),
    IapOriginalTransactionId: header.indexOf("IapOriginalTransactionId"),
    IapStatus: header.indexOf("IapStatus"),
    IapLastValidatedAt: header.indexOf("IapLastValidatedAt")
  };

  if (headerMap.Produto < 0 || headerMap.LicencaAtiva < 0 || headerMap.acesso_personal < 0) {
    return { status: "error", msg: "missing_required_columns" };
  }

  const values = sh.getRange(found.rowIndex, 1, 1, sh.getLastColumn()).getValues()[0];
  const entitlements = computeEntitlementsFromRow_(values, headerMap);
  const produto = String(values[headerMap.Produto] || "").toLowerCase().trim();
  const userId = String(payload.userId || payload.id || values[0] || "").trim();

  return {
    status: "ok",
    userId: userId,
    provider: entitlements.source === "apple_iap" ? "apple_iap" : "hotmart",
    platform: entitlements.source === "apple_iap" ? "ios" : "cross_platform",
    isActive: entitlements.acesso_app,
    entitlementStatus: entitlements.status,
    acesso_app: entitlements.acesso_app,
    modo_personal: entitlements.modo_personal,
    expiresAt: entitlements.expiresAt,
    periodEnd: entitlements.expiresAt,
    source: entitlements.source,
    sourceOfTruth: "server",
    plan: entitlements.plan,
    productId: entitlements.productId,
    originalTransactionId: entitlements.originalTransactionId,
    lastValidatedAt: entitlements.lastValidatedAt,
    produto: produto
  };
}
