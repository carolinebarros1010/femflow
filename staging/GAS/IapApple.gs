const IAP_APPLE_PRODUCT_IDS = [
  "com.femflow.app.premium.monthly",
  "com.femflow.app.personal.pro.monthly"
];

function _normalizePlatform_(value) {
  const raw = String(value || "").toLowerCase().trim();
  if (!raw) return "";
  if (raw === "ios" || raw === "iphone" || raw === "ipad" || raw === "apple") return "ios";
  if (raw === "android") return "android";
  if (raw === "pwa" || raw === "web") return "web";
  return raw;
}

function _resolvePlatformFromPayload_(payload, defaultPlatform) {
  const p = payload || {};
  const candidates = [
    p.platform,
    p.clientPlatform,
    p.sourcePlatform,
    p.devicePlatform,
    p.os,
    p.appPlatform
  ];
  for (var i = 0; i < candidates.length; i++) {
    const normalized = _normalizePlatform_(candidates[i]);
    if (normalized) return normalized;
  }
  return _normalizePlatform_(defaultPlatform || "");
}

function _isIosLikeSource_(payload) {
  const p = payload || {};
  const platform = _resolvePlatformFromPayload_(p, "");
  if (platform === "ios") return true;

  const provider = String(p.provider || p.source || "").toLowerCase().trim();
  if (provider === "apple_iap" || provider === "app_store") return true;

  return false;
}

function _isStrongAppleValidation_(validationResult) {
  const result = validationResult || {};
  const method = String(result.validationMethod || "").trim();
  const level = String(result.validationLevel || "").trim();
  return method === "verifyReceipt" && level === "pragmatic_remote";
}

function _maskTxForLog_(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= 8) return raw;
  return raw.slice(0, 4) + "..." + raw.slice(-4);
}

function _buildEntitlementContract_(base) {
  const b = base || {};
  const isActive = !!b.isActive;
  return {
    status: String(b.status || "ok"),
    isActive: isActive,
    acesso_app: isActive,
    modo_personal: !!b.modo_personal,
    entitlementStatus: String(b.entitlementStatus || (isActive ? "active" : "expired")),
    source: String(b.source || "unknown"),
    provider: String(b.provider || "internal"),
    platform: String(b.platform || "cross_platform"),
    plan: String(b.plan || "access"),
    expiresAt: String(b.expiresAt || ""),
    sourceOfTruth: String(b.sourceOfTruth || "server")
  };
}

function _buildBlockedEntitlementContract_(reason, extras) {
  const blocked = _buildEntitlementContract_({
    status: "blocked",
    isActive: false,
    modo_personal: false,
    entitlementStatus: "blocked",
    source: "unknown",
    provider: "internal",
    platform: "cross_platform",
    plan: "access",
    expiresAt: "",
    sourceOfTruth: "server"
  });

  return Object.assign(blocked, extras || {}, {
    status: "blocked",
    reason: String(reason || "blocked"),
    msg: String(reason || "blocked")
  });
}

function _getEntitlementBlockReasonFromRow_(row, headerMap) {
  const idxStatusConta = typeof COL_STATUS_CONTA === "number" ? COL_STATUS_CONTA : -1;
  const idxDeleteRequestedAt = typeof COL_DELETE_REQUESTED_AT === "number" ? COL_DELETE_REQUESTED_AT : -1;
  const statusContaRaw = idxStatusConta >= 0 ? row[idxStatusConta] : "";
  const statusConta = typeof _normalizarStatusConta_ === "function"
    ? _normalizarStatusConta_(statusContaRaw)
    : String(statusContaRaw || "").toLowerCase().trim();

  if (statusConta === "delete_requested") {
    return {
      reason: "delete_requested",
      extras: {
        accountStatus: "delete_requested",
        deleteRequestedAt: idxDeleteRequestedAt >= 0 ? row[idxDeleteRequestedAt] || "" : ""
      }
    };
  }
  if (statusConta && statusConta !== "ativa") {
    return {
      reason: "account_blocked",
      extras: { accountStatus: statusConta }
    };
  }

  const produto = String(row[headerMap.Produto] || "").toLowerCase().trim();
  if (produto === "exclusao_solicitada") {
    return {
      reason: "delete_requested",
      extras: { produto: "exclusao_solicitada" }
    };
  }

  return null;
}

function _logManualGrant_(payload) {
  const p = payload || {};
  console.log("[ACCESS][MANUAL_GRANT]" + JSON.stringify({
    userId: String(p.userId || p.id || "").trim(),
    email: String(p.email || "").toLowerCase().trim(),
    source: String(p.source || "manual").trim(),
    flow: String(p.flow || "manual_update").trim(),
    product: String(p.product || "").trim(),
    plan: String(p.plan || "access").trim(),
    personal: !!p.personal,
    actor: String(p.actor || "system").trim(),
    result: String(p.result || "updated").trim()
  }));
}

function _applyManualAccessMetadata_(sh, rowIndex, headerMap, metadata) {
  if (!sh || !headerMap || !rowIndex) return;
  const meta = metadata || {};
  const source = String(meta.source || "manual_admin").trim();
  const plan = String(meta.plan || (meta.personal ? "personal" : "access")).trim();
  const flow = String(meta.flow || "manual_update").trim();
  const nowIso = new Date().toISOString();

  if (headerMap.IapSource != null) sh.getRange(rowIndex, headerMap.IapSource + 1).setValue(source);
  if (headerMap.IapStatus != null) sh.getRange(rowIndex, headerMap.IapStatus + 1).setValue("active");
  if (headerMap.IapPlan != null) sh.getRange(rowIndex, headerMap.IapPlan + 1).setValue(plan);
  if (headerMap.IapLastSource != null) sh.getRange(rowIndex, headerMap.IapLastSource + 1).setValue(flow);
  if (headerMap.IapLastValidatedAt != null) sh.getRange(rowIndex, headerMap.IapLastValidatedAt + 1).setValue(nowIso);
}

function _computeUnifiedAccessState_(row, headerMap) {
  const entitlements = computeEntitlementsFromRow_(row, headerMap) || {
    acesso_app: false,
    modo_personal: false,
    expiresAt: "",
    source: "unknown",
    plan: "access",
    status: "expired",
    productId: "",
    originalTransactionId: "",
    lastValidatedAt: ""
  };

  const produto = String(row[headerMap.Produto] || "").toLowerCase().trim();
  const isVip = produto === "vip";

  if (isVip) {
    return {
      ativa: true,
      entitlements: {
        acesso_app: true,
        modo_personal: true,
        expiresAt: "",
        source: "vip",
        provider: "internal",
        platform: "cross_platform",
        plan: "vip",
        status: "active",
        productId: "",
        originalTransactionId: "",
        lastValidatedAt: ""
      }
    };
  }

  const sourceNorm = String(entitlements.source || "").trim().toLowerCase();
  let provider = sourceNorm === "apple_iap" ? "apple_iap" : (sourceNorm === "hotmart" ? "hotmart" : "internal");
  let platform = sourceNorm === "apple_iap" ? "ios" : (sourceNorm === "hotmart" ? "cross_platform" : "cross_platform");
  let source = sourceNorm || "unknown";
  if (!sourceNorm && _isTruthy_(row[headerMap.LicencaAtiva]) && produto && produto !== "trial_app") {
    source = "manual";
    provider = "internal";
    platform = "cross_platform";
  }

  return {
    ativa: !!entitlements.acesso_app,
    entitlements: Object.assign({}, entitlements, {
      source: source,
      provider: provider,
      platform: platform
    })
  };
}

function _hasSufficientAppleEvidenceForRestore_(tx) {
  const item = tx || {};
  const productId = String(item.productId || "").trim();
  const transactionId = String(item.transactionId || "").trim();
  if (!productId || !transactionId) {
    return { ok: false, reason: "missing_product_or_transaction" };
  }
  if (IAP_APPLE_PRODUCT_IDS.indexOf(productId) < 0) {
    return { ok: false, reason: "product_not_allowed" };
  }
  if (!_isLikelyAppleTransactionId_(transactionId)) {
    return { ok: false, reason: "invalid_transaction_id" };
  }

  const receipt = String(item.receipt || item.transactionReceipt || "").trim();
  if (receipt) return { ok: true, mode: "receipt" };

  const signedPayload = String(item.signedPayload || "").trim();
  if (!signedPayload) return { ok: false, reason: "missing_apple_evidence" };

  const parsedJws = _parseJwsWithHeader_(signedPayload);
  const envelope = _evaluateAppleJwsEnvelope_(parsedJws, "JWT");
  if (!envelope.ok) return { ok: false, reason: "insufficient_signed_payload_evidence" };

  return { ok: true, mode: "signed_payload_pragmatic" };
}

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
    "IapLastReconcileMode",
    "IapCorrelationId",
    "IapIdempotencyKey",
    "IapLastNotificationType",
    "IapLastNotificationSubtype",
    "IapValidationLevel",
    "IapValidationMethod"
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
  if (id === "com.femflow.app.personal.pro.monthly") {
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
  const parsed = _parseJwsWithHeader_(signedPayload);
  return parsed.payload;
}

function _parseJwsWithHeader_(signedPayload) {
  const raw = String(signedPayload || "").trim();
  if (!raw || raw.indexOf(".") < 0) {
    return { raw: raw, validFormat: false, header: null, payload: null, signature: "", partCount: 0 };
  }

  const parts = raw.split(".");
  if (parts.length < 3) {
    return { raw: raw, validFormat: false, header: null, payload: null, signature: "", partCount: parts.length };
  }

  let header = null;
  let payload = null;

  try {
    header = JSON.parse(_decodeBase64Url_(parts[0]));
  } catch (err) {
    console.log("[IAP] signed payload header parse error", String(err));
  }

  try {
    payload = JSON.parse(_decodeBase64Url_(parts[1]));
  } catch (err) {
    console.log("[IAP] signed payload parse error", String(err));
  }

  return {
    raw: raw,
    validFormat: true,
    header: header,
    payload: payload,
    signature: String(parts[2] || ""),
    partCount: parts.length
  };
}

function _evaluateAppleJwsEnvelope_(jwsParsed, expectedTyp) {
  const header = jwsParsed && jwsParsed.header || {};
  const expectedType = String(expectedTyp || "JWT").trim();
  const alg = String(header.alg || "").trim();
  const typ = String(header.typ || "").trim();
  const kid = String(header.kid || "").trim();
  const x5c = Array.isArray(header.x5c) ? header.x5c : [];

  const checks = {
    formatValid: !!(jwsParsed && jwsParsed.validFormat),
    payloadDecoded: !!(jwsParsed && jwsParsed.payload && typeof jwsParsed.payload === "object"),
    algValid: alg === "ES256",
    typValid: !expectedType || !typ || typ === expectedType,
    hasKid: !!kid,
    hasX5cChain: x5c.length > 0,
    hasSignatureChunk: !!String(jwsParsed && jwsParsed.signature || "").trim()
  };

  const ok = checks.formatValid
    && checks.payloadDecoded
    && checks.algValid
    && checks.typValid
    && checks.hasSignatureChunk
    && checks.hasKid
    && checks.hasX5cChain;

  return {
    ok: ok,
    checks: checks,
    header: {
      alg: alg,
      typ: typ,
      kid: kid,
      x5cCount: x5c.length
    },
    limitation: "gas_no_jws_signature_verification"
  };
}


function _buildValidationMeta_(level, method, mode, reason) {
  return {
    validationLevel: String(level || "unverified").trim(),
    validationMethod: String(method || "none").trim(),
    verificationMode: String(mode || "server").trim(),
    verificationReason: String(reason || "").trim()
  };
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

  function reject(reason) {
    return Object.assign({ ok: false, status: "pending_validation", reason: reason },
      _buildValidationMeta_("unverified", "none", "server", reason));
  }

  if (!productId || !transactionId) return reject("missing_product_or_transaction");
  if (IAP_APPLE_PRODUCT_IDS.indexOf(productId) < 0) return reject("product_not_allowed");
  if (!_isLikelyAppleTransactionId_(transactionId)) return reject("invalid_transaction_id");

  const bundleExpected = String(PropertiesService.getScriptProperties().getProperty("APPLE_BUNDLE_ID") || "com.femflow.app").trim();

  let validation = null;

  if (receipt) {
    const receiptValidation = _verifyReceiptWithApple_(receipt, transactionId);
    if (receiptValidation.ok) {
      if (receiptValidation.productId && receiptValidation.productId !== productId) return reject("product_mismatch_receipt");
      if (originalTransactionId && receiptValidation.originalTransactionId && receiptValidation.originalTransactionId !== originalTransactionId) {
        return reject("original_transaction_mismatch_receipt");
      }
      validation = Object.assign({}, receiptValidation, _buildValidationMeta_(
        "pragmatic_remote",
        "verifyReceipt",
        "server",
        "verify_receipt_ok"
      ));
    }
  }

  if (!validation && signedPayload) {
    const decoded = _parseSignedPayload_(signedPayload);
    if (decoded && typeof decoded === "object") {
      const decodedTx = String(decoded.transactionId || decoded.transaction_id || "").trim();
      const decodedOriginal = String(decoded.originalTransactionId || decoded.original_transaction_id || "").trim();
      const decodedProduct = String(decoded.productId || decoded.product_id || "").trim();
      const decodedBundle = String(decoded.bundleId || decoded.bundle_id || "").trim();
      const decodedEnv = String(decoded.environment || "").trim();

      if (decodedTx && decodedTx !== transactionId) return reject("transaction_mismatch_signed_payload");
      if (decodedProduct && decodedProduct !== productId) return reject("product_mismatch_signed_payload");
      if (decodedOriginal && originalTransactionId && decodedOriginal !== originalTransactionId) {
        return reject("original_transaction_mismatch_signed_payload");
      }
      if (decodedBundle && bundleExpected && decodedBundle !== bundleExpected) return reject("bundle_mismatch");

      validation = Object.assign({
        ok: true,
        source: "signed_payload",
        productId: decodedProduct || productId,
        transactionId: decodedTx || transactionId,
        originalTransactionId: decodedOriginal || originalTransactionId || transactionId,
        purchaseDate: _coerceIsoOrEmpty_(decoded.purchaseDate || decoded.purchaseDateMs),
        expiresDate: _coerceIsoOrEmpty_(decoded.expiresDate || decoded.expiresDateMs || payload.expiresDate),
        environment: decodedEnv || envHint,
        evidenceHash: _hashPayloadEvidence_(decoded)
      }, _buildValidationMeta_(
        "pragmatic",
        "signed_payload_consistency",
        "server",
        "decoded_without_cryptographic_verification"
      ));
    }
  }

  if (!validation) {
    if (receipt) return reject("receipt_provided_but_not_verified");
    if (signedPayload) return reject("signed_payload_unreadable");
    return reject("missing_apple_evidence");
  }

  const normalizedExpires = validation.expiresDate || _coerceIsoOrEmpty_(payload.expiresDate || payload.expiryDate);
  const status = normalizedExpires && _isExpiredIso_(normalizedExpires) ? "expired" : "active";

  return Object.assign({
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
  }, _buildValidationMeta_(
    validation.validationLevel,
    validation.validationMethod,
    validation.verificationMode,
    validation.verificationReason
  ));
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

function _safeParseJsonObject_(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (err) {
    return null;
  }
}

function _isAppleStatusActiveLike_(status) {
  const normalized = String(status || "").toLowerCase().trim();
  return normalized === "active" || normalized === "retry" || normalized === "pending_validation";
}

function _buildAppleReconcileContext_(row, headerMap, updates) {
  const patch = updates || {};
  const previousStatus = String(row[headerMap.IapStatus] || "").trim();
  return {
    userId: String(row[0] || "").trim(),
    transactionId: String(row[headerMap.IapTransactionId] || "").trim(),
    originalTransactionId: String(row[headerMap.IapOriginalTransactionId] || "").trim(),
    previousStatus: previousStatus,
    newStatus: String(patch.newStatus || previousStatus || "").trim(),
    reconcileMode: String(patch.reconcileMode || "skipped").trim(),
    reason: String(patch.reason || "").trim(),
    correlationId: String(patch.correlationId || "").trim()
  };
}

function _extractAppleEvidenceForReconcile_(row, headerMap) {
  const evidenceRaw = String(row[headerMap.IapValidationEvidence] || "").trim();
  const evidenceObj = _safeParseJsonObject_(evidenceRaw) || {};

  const receipt = String(
    evidenceObj.receipt || evidenceObj.transactionReceipt || evidenceObj.latestReceipt || evidenceObj.latest_receipt || ""
  ).trim();

  const signedPayload = String(
    evidenceObj.signedPayload || evidenceObj.signed_payload || evidenceObj.signedTransactionInfo || ""
  ).trim();

  return {
    evidenceRaw: evidenceRaw,
    evidenceObj: evidenceObj,
    receipt: receipt,
    signedPayload: signedPayload
  };
}

function _shouldReconcileAppleRow_(row, headerMap, nowMs) {
  const currentStatus = String(row[headerMap.IapStatus] || "").toLowerCase().trim();
  const expiresAt = String(row[headerMap.IapExpiresAt] || "").trim();
  const lastValidatedAt = String(row[headerMap.IapLastValidatedAt] || "").trim();
  const licenseActive = _isTruthy_(row[headerMap.LicencaAtiva]);
  const tx = String(row[headerMap.IapTransactionId] || "").trim();
  const originalTx = String(row[headerMap.IapOriginalTransactionId] || "").trim();

  if (!tx && !originalTx) {
    return { eligible: false, reason: "missing_transaction_identity" };
  }

  if (currentStatus === "pending_validation") {
    return { eligible: true, reason: "status_pending_validation" };
  }

  if (currentStatus === "retry") {
    return { eligible: true, reason: "status_retry" };
  }

  const expiresMs = expiresAt ? Date.parse(expiresAt) : NaN;
  if (isFinite(expiresMs)) {
    const hoursToExpire = (expiresMs - nowMs) / (1000 * 60 * 60);
    if (hoursToExpire <= 48 && hoursToExpire >= -12) {
      return { eligible: true, reason: "near_expiry_window" };
    }
    if (hoursToExpire < 0 && (licenseActive || _isAppleStatusActiveLike_(currentStatus))) {
      return { eligible: true, reason: "expired_but_active_locally" };
    }
  }

  const lastValidatedMs = lastValidatedAt ? Date.parse(lastValidatedAt) : NaN;
  if (!isFinite(lastValidatedMs)) {
    return { eligible: true, reason: "missing_last_validated_at" };
  }
  const hoursSinceValidated = (nowMs - lastValidatedMs) / (1000 * 60 * 60);
  if (hoursSinceValidated > 168) {
    return { eligible: true, reason: "stale_validation" };
  }

  const statusLooksActive = _isAppleStatusActiveLike_(currentStatus);
  if ((licenseActive && !statusLooksActive) || (!licenseActive && statusLooksActive)) {
    return { eligible: true, reason: "status_license_divergence" };
  }

  if (originalTx && !currentStatus) {
    return { eligible: true, reason: "original_transaction_inconsistent_state" };
  }

  return { eligible: false, reason: "not_eligible" };
}

function _resolveAppleReconcileOutcome_(row, headerMap, selection, nowIso, correlationId) {
  const tx = String(row[headerMap.IapTransactionId] || "").trim();
  const originalTx = String(row[headerMap.IapOriginalTransactionId] || "").trim();
  const productId = String(row[headerMap.IapProductId] || "").trim();
  const expiresAt = _coerceIsoOrEmpty_(row[headerMap.IapExpiresAt]);
  const env = String(row[headerMap.IapEnv] || "").trim();
  const evidence = _extractAppleEvidenceForReconcile_(row, headerMap);
  const canRemote = !!(evidence.receipt || evidence.signedPayload);

  if (canRemote) {
    const payload = {
      productId: productId,
      transactionId: tx,
      originalTransactionId: originalTx,
      expiresDate: expiresAt,
      environment: env,
      signedPayload: evidence.signedPayload,
      receipt: evidence.receipt
    };
    const remote = _validateAppleTransactionServerSide_(payload, "reconcile");
    if (remote.ok) {
      return {
        reconcileMode: "remote",
        resultType: "remote_validated",
        newStatus: remote.status || "pending_validation",
        expiresAt: remote.expiresDate || expiresAt,
        environment: remote.environment || env,
        productId: remote.productId || productId,
        transactionId: remote.transactionId || tx,
        originalTransactionId: remote.originalTransactionId || originalTx,
        reason: selection.reason,
        validatedAt: nowIso,
        evidence: JSON.stringify({
          mode: "remote",
          validator: remote.source || "receipt_or_signed_payload",
          result: "ok",
          reason: selection.reason,
          hash: remote.evidenceHash || "",
          transactionId: remote.transactionId || tx,
          originalTransactionId: remote.originalTransactionId || originalTx,
          remoteEvidenceAvailable: true,
          validationLevel: remote.validationLevel || "pragmatic",
          validationMethod: remote.validationMethod || "signed_payload_consistency",
          verificationMode: remote.verificationMode || "server",
          verificationReason: remote.verificationReason || ""
        }),
        correlationId: correlationId,
        validationLevel: remote.validationLevel || "pragmatic",
        validationMethod: remote.validationMethod || "signed_payload_consistency",
        verificationMode: remote.verificationMode || "server",
        verificationReason: remote.verificationReason || ""
      };
    }

    return {
      reconcileMode: "remote",
      resultType: "retry",
      newStatus: remote.status || "retry",
      expiresAt: expiresAt,
      environment: env,
      productId: productId,
      transactionId: tx,
      originalTransactionId: originalTx,
      reason: "remote_validation_failed_" + String(remote.reason || "unknown"),
      validatedAt: nowIso,
      evidence: JSON.stringify({
        mode: "remote",
        result: "error",
        reason: remote.reason || "remote_validation_failed",
        selectionReason: selection.reason,
        remoteEvidenceAvailable: true,
        validationLevel: "unverified",
        validationMethod: "none",
        verificationMode: "server",
        verificationReason: remote.reason || "remote_validation_failed"
      }),
      correlationId: correlationId,
      validationLevel: "unverified",
      validationMethod: "none",
      verificationMode: "server",
      verificationReason: remote.reason || "remote_validation_failed"
    };
  }

  const expired = _isExpiredIso_(expiresAt);
  const localStatus = expired ? "expired" : "active";
  return {
    reconcileMode: "local",
    resultType: "local_only_reconciled",
    newStatus: localStatus,
    expiresAt: expiresAt,
    environment: env,
    productId: productId,
    transactionId: tx,
    originalTransactionId: originalTx,
    reason: selection.reason + "_without_reusable_remote_evidence",
    validatedAt: nowIso,
    evidence: JSON.stringify({
      mode: "local",
      result: "ok",
      reason: selection.reason,
      limitation: "missing_receipt_or_signed_payload",
      remoteEvidenceAvailable: false,
      validationLevel: "local_only",
      validationMethod: "local_expiry_inference",
      verificationMode: "local",
      verificationReason: "missing_receipt_or_signed_payload"
    }),
    correlationId: correlationId,
    validationLevel: "local_only",
    validationMethod: "local_expiry_inference",
    verificationMode: "local",
    verificationReason: "missing_receipt_or_signed_payload"
  };
}

function _applyAppleReconcileOutcome_(sh, rowIndex, headerMap, row, outcome) {
  const planData = _resolvePlanFromAppleProduct_(outcome.productId);
  const active = outcome.newStatus === "active";

  sh.getRange(rowIndex, headerMap.IapStatus + 1).setValue(outcome.newStatus || "pending_validation");
  if (headerMap.IapPlan != null) {
    sh.getRange(rowIndex, headerMap.IapPlan + 1).setValue(planData.plan);
  }
  sh.getRange(rowIndex, headerMap.IapExpiresAt + 1).setValue(outcome.expiresAt || "");
  sh.getRange(rowIndex, headerMap.LicencaAtiva + 1).setValue(active);
  if (active && headerMap.Produto != null) {
    sh.getRange(rowIndex, headerMap.Produto + 1).setValue(planData.produto);
  }
  if (headerMap.acesso_personal != null) {
    sh.getRange(rowIndex, headerMap.acesso_personal + 1).setValue(active && planData.modoPersonal);
  }
  sh.getRange(rowIndex, headerMap.IapLastValidatedAt + 1).setValue(outcome.validatedAt || _getCurrentIsoNow_());
  sh.getRange(rowIndex, headerMap.IapLastSource + 1).setValue("reconcile");
  if (headerMap.IapLastReconcileMode != null) {
    sh.getRange(rowIndex, headerMap.IapLastReconcileMode + 1).setValue(outcome.reconcileMode || "skipped");
  }
  sh.getRange(rowIndex, headerMap.IapCorrelationId + 1).setValue(outcome.correlationId || "");
  sh.getRange(rowIndex, headerMap.IapValidationEvidence + 1).setValue(outcome.evidence || "");
  if (headerMap.IapValidationLevel != null) {
    sh.getRange(rowIndex, headerMap.IapValidationLevel + 1).setValue(outcome.validationLevel || "unverified");
  }
  if (headerMap.IapValidationMethod != null) {
    sh.getRange(rowIndex, headerMap.IapValidationMethod + 1).setValue(outcome.validationMethod || "none");
  }

  if (outcome.environment && headerMap.IapEnv != null) {
    sh.getRange(rowIndex, headerMap.IapEnv + 1).setValue(outcome.environment);
  }
  if (outcome.productId && headerMap.IapProductId != null) {
    sh.getRange(rowIndex, headerMap.IapProductId + 1).setValue(outcome.productId);
  }
  if (outcome.transactionId && headerMap.IapTransactionId != null) {
    sh.getRange(rowIndex, headerMap.IapTransactionId + 1).setValue(outcome.transactionId);
  }
  if (outcome.originalTransactionId && headerMap.IapOriginalTransactionId != null) {
    sh.getRange(rowIndex, headerMap.IapOriginalTransactionId + 1).setValue(outcome.originalTransactionId);
  }

  return {
    changed: String(row[headerMap.IapStatus] || "").trim() !== outcome.newStatus ||
      _isTruthy_(row[headerMap.LicencaAtiva]) !== active ||
      String(row[headerMap.IapExpiresAt] || "").trim() !== String(outcome.expiresAt || "").trim(),
    active: active
  };
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
  const validationEvidence = {
    hash: validationResult.evidenceHash || "",
    validator: validationResult.validationMethod || "unknown",
    validationLevel: validationResult.validationLevel || "unverified",
    validationMethod: validationResult.validationMethod || "none",
    verificationMode: validationResult.verificationMode || "server",
    verificationReason: validationResult.verificationReason || validationResult.reason || "",
    source: String(payload.source || "activate"),
    transactionId: validationResult.transactionId || "",
    originalTransactionId: validationResult.originalTransactionId || "",
    productId: validationResult.productId || "",
    hasReceipt: !!String(payload.receipt || payload.transactionReceipt || "").trim(),
    hasSignedPayload: !!String(payload.signedPayload || "").trim(),
    receipt: String(payload.receipt || payload.transactionReceipt || "").trim(),
    signedPayload: String(payload.signedPayload || "").trim()
  };
  sh.getRange(rowIndex, headerMap.IapValidationEvidence + 1).setValue(JSON.stringify(validationEvidence));
  if (headerMap.IapValidationLevel != null) {
    sh.getRange(rowIndex, headerMap.IapValidationLevel + 1).setValue(validationResult.validationLevel || "unverified");
  }
  if (headerMap.IapValidationMethod != null) {
    sh.getRange(rowIndex, headerMap.IapValidationMethod + 1).setValue(validationResult.validationMethod || "none");
  }
  sh.getRange(rowIndex, headerMap.IapLastSource + 1).setValue(String(payload.source || "activate"));
  sh.getRange(rowIndex, headerMap.IapCorrelationId + 1).setValue(String(payload.correlationId || ""));
  sh.getRange(rowIndex, headerMap.IapIdempotencyKey + 1).setValue(String(payload.idempotencyKey || ""));

  const base = _buildEntitlementContract_({
    status: "ok",
    isActive: active,
    modo_personal: active && planData.modoPersonal,
    entitlementStatus: finalStatus,
    source: "apple_iap",
    provider: "apple_iap",
    platform: "ios",
    plan: planData.plan,
    expiresAt: validationResult.expiresDate || "",
    sourceOfTruth: "server"
  });

  return Object.assign(base, {
    status: "ok",
    productId: validationResult.productId || "",
    transactionId: validationResult.transactionId || "",
    originalTransactionId: validationResult.originalTransactionId || "",
    lastValidatedAt: _getCurrentIsoNow_(),
    validationLevel: validationResult.validationLevel || "unverified",
    validationMethod: validationResult.validationMethod || "none",
    verificationMode: validationResult.verificationMode || "server"
  });
}

function _processIapAppleActivationCore_(payload, source) {
  const platform = _resolvePlatformFromPayload_(payload || {}, "ios");
  if (platform && platform !== "ios") {
    return { status: "error", msg: "invalid_platform_for_apple_iap", platform: platform };
  }

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
      lastValidatedAt: String(row[headerMap.IapLastValidatedAt] || ""),
      validationLevel: String((headerMap.IapValidationLevel == null ? "" : row[headerMap.IapValidationLevel]) || "").trim() || "unverified",
      validationMethod: String((headerMap.IapValidationMethod == null ? "" : row[headerMap.IapValidationMethod]) || "").trim() || "none",
      verificationMode: "server"
    };
  }

  const validation = _validateAppleTransactionServerSide_(payload || {}, source || "activate");

  console.log("[IAP] validation", JSON.stringify({
    source: source,
    userId: String(payload.userId || payload.id || ""),
    transactionId: String(payload.transactionId || ""),
    originalTransactionId: String(payload.originalTransactionId || ""),
    result: validation.ok ? "ok" : "reject",
    reason: validation.reason || "",
    validationLevel: validation.validationLevel || "unverified",
    validationMethod: validation.validationMethod || "none",
    verificationMode: validation.verificationMode || "server"
  }));

  if (!validation.ok) {
    return Object.assign(_buildEntitlementContract_({
      status: "error",
      isActive: false,
      modo_personal: false,
      entitlementStatus: validation.status || "pending_validation",
      source: "apple_iap",
      provider: "apple_iap",
      platform: "ios",
      plan: "access",
      expiresAt: "",
      sourceOfTruth: "server"
    }), {
      status: "error",
      msg: "apple_validation_failed",
      reason: validation.reason || "validation_failed",
      validationLevel: validation.validationLevel || "unverified",
      validationMethod: validation.validationMethod || "none",
      verificationMode: validation.verificationMode || "server"
    });
  }

  if (!_isStrongAppleValidation_(validation)) {
    const downgraded = Object.assign({}, validation, {
      status: "pending_validation",
      reason: "validation_not_strong_enough_for_active"
    });
    return _persistAppleValidationToRow_(sh, found.rowIndex, headerMap, payload, downgraded);
  }

  return _persistAppleValidationToRow_(sh, found.rowIndex, headerMap, payload, validation);
}

function iapAppleActivate_(payload) {
  const resp = _processIapAppleActivationCore_(payload || {}, "purchase");
  console.log("[IAP][activate]", JSON.stringify(_buildAppleIapLogContext_(payload, {
    status: resp && resp.status,
    result: resp && resp.status,
    entitlementStatus: resp && resp.entitlementStatus,
    validationLevel: resp && resp.validationLevel,
    validationMethod: resp && resp.validationMethod,
    verificationMode: resp && resp.verificationMode
  })));
  return resp;
}

function _buildAppleIapLogContext_(payload, extra) {
  const merged = Object.assign({}, payload || {}, extra || {});
  return {
    userId: String(merged.userId || merged.id || "").trim(),
    source: String(merged.source || merged.provider || "apple_iap").trim(),
    notificationType: String(merged.notificationType || "").trim(),
    subtype: String(merged.subtype || "").trim(),
    productId: String(merged.productId || "").trim(),
    transactionId: _maskTxForLog_(merged.transactionId),
    originalTransactionId: _maskTxForLog_(merged.originalTransactionId),
    correlationId: String(merged.correlationId || merged.notificationId || "").trim(),
    status: String(merged.status || merged.result || "").trim(),
    result: String(merged.result || merged.status || "").trim(),
    entitlementStatus: String(merged.entitlementStatus || "").trim(),
    validationLevel: String(merged.validationLevel || "").trim(),
    validationMethod: String(merged.validationMethod || "").trim(),
    verificationMode: String(merged.verificationMode || "").trim(),
    reason: String(merged.reason || merged.verificationReason || "").trim()
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

  const rootJws = _parseJwsWithHeader_(signedPayload);
  const decodedRoot = rootJws.payload || {};

  const data = decodedRoot.data || root.data || {};
  const signedTx = String(data.signedTransactionInfo || root.signedTransactionInfo || "").trim();
  const signedRenewal = String(data.signedRenewalInfo || root.signedRenewalInfo || "").trim();

  const txJws = _parseJwsWithHeader_(signedTx);
  const renewalJws = _parseJwsWithHeader_(signedRenewal);
  const decodedTx = txJws.payload || {};
  const decodedRenewal = renewalJws.payload || {};

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

  const rootEnvelope = _evaluateAppleJwsEnvelope_(rootJws, "JWT");
  const txEnvelope = signedTx ? _evaluateAppleJwsEnvelope_(txJws, "JWT") : null;
  const renewalEnvelope = signedRenewal ? _evaluateAppleJwsEnvelope_(renewalJws, "JWT") : null;

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
      rootDecoded: !!rootEnvelope.checks.payloadDecoded,
      transactionDecoded: !!(txEnvelope && txEnvelope.checks.payloadDecoded),
      renewalDecoded: !!(renewalEnvelope && renewalEnvelope.checks.payloadDecoded)
    },
    envelope: {
      root: rootEnvelope,
      transaction: txEnvelope,
      renewal: renewalEnvelope,
      limitation: "gas_no_jws_signature_verification"
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

  if (!parsed.envelope || !parsed.envelope.root || !parsed.envelope.root.ok) {
    return { ok: false, msg: "invalid_jws_envelope_root" };
  }

  const eventType = String(parsed.notificationType || "").trim().toUpperCase();
  const requiresTransactionInfo = {
    "DID_RENEW": true,
    "SUBSCRIBED": true,
    "EXPIRED": true,
    "REFUND": true,
    "REVOKE": true
  };

  if (requiresTransactionInfo[eventType]) {
    if (!parsed.decodeState.transactionDecoded) {
      return { ok: false, msg: "invalid_signed_transaction_info" };
    }
    if (!parsed.envelope || !parsed.envelope.transaction || !parsed.envelope.transaction.ok) {
      return { ok: false, msg: "invalid_jws_envelope_transaction" };
    }
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

  return {
    ok: true,
    validationLevel: "pragmatic_header_chain",
    validationMethod: "jws_header_and_payload_consistency",
    verificationMode: "server"
  };
}


function iapAppleRestore_(payload) {
  const platform = _resolvePlatformFromPayload_(payload || {}, "ios");
  if (platform && platform !== "ios") {
    return { status: "error", msg: "invalid_platform_for_apple_restore", platform: platform };
  }

  const list = Array.isArray(payload && payload.transactions) ? payload.transactions : [];

  if (!list.length) {
    const singleEvidence = _hasSufficientAppleEvidenceForRestore_(payload || {});
    if (!singleEvidence.ok) {
      return {
        status: "error",
        msg: "restore_item_rejected",
        reason: singleEvidence.reason,
        sourceOfTruth: "server",
        validationMode: "precheck"
      };
    }

    const single = _processIapAppleActivationCore_(Object.assign({}, payload || {}, {
      source: "restore"
    }), "restore");

    console.log("[IAP][restore]", JSON.stringify(_buildAppleIapLogContext_(payload, {
      status: single && single.status,
      result: single && single.status,
      entitlementStatus: single && single.entitlementStatus,
      validationLevel: single && single.validationLevel,
      validationMethod: single && single.validationMethod,
      verificationMode: single && single.verificationMode
    })));

    return single;
  }

  const results = [];
  let activeCount = 0;
  let successCount = 0;

  for (var i = 0; i < list.length; i++) {
    const tx = list[i] || {};
    const evidenceCheck = _hasSufficientAppleEvidenceForRestore_(tx);
    if (!evidenceCheck.ok) {
      const rejected = {
        status: "error",
        msg: "restore_item_rejected",
        reason: evidenceCheck.reason,
        productId: String(tx.productId || ""),
        transactionId: String(tx.transactionId || ""),
        originalTransactionId: String(tx.originalTransactionId || ""),
        sourceOfTruth: "server",
        validationMode: "precheck"
      };
      results.push(rejected);
      console.log("[IAP][restore]", JSON.stringify(_buildAppleIapLogContext_(tx, {
        status: "error",
        result: "error",
        reason: evidenceCheck.reason,
        validationLevel: "unverified",
        validationMethod: "none",
        verificationMode: "server"
      })));
      continue;
    }

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
      entitlementStatus: resp && resp.entitlementStatus,
      validationLevel: resp && resp.validationLevel,
      validationMethod: resp && resp.validationMethod,
      verificationMode: resp && resp.verificationMode
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
    sourceOfTruth: "server",
    validationMode: "per_transaction"
  };
}

function iapAppleNotification_(payload) {
  const signedPayload = String(payload && (payload.signedPayload || payload.signed_payload) || "").trim();
  if (!signedPayload) {
    return { status: "error", msg: "missing_signed_payload" };
  }

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
    entitlementStatus: "pending_validation",
    validationLevel: "pragmatic_header_chain",
    validationMethod: "jws_header_and_payload_consistency",
    verificationMode: "server"
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
      sourceOfTruth: "server",
      validationLevel: String((headerMap.IapValidationLevel == null ? "" : dupeRow[headerMap.IapValidationLevel]) || "").trim() || "unverified",
      validationMethod: String((headerMap.IapValidationMethod == null ? "" : dupeRow[headerMap.IapValidationMethod]) || "").trim() || "none",
      verificationMode: "server"
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
      sourceOfTruth: "server",
      validationLevel: "unverified",
      validationMethod: "none",
      verificationMode: "server"
    };
  }

  const validation = _validateParsedAppleNotification_(parsed, targetRow, headerMap);
  if (!validation.ok) {
    console.log("[IAP][notification]", JSON.stringify(_buildAppleIapLogContext_(payload, {
      notificationType: parsed.notificationType,
      subtype: parsed.subtype,
      transactionId: parsed.transactionId,
      originalTransactionId: parsed.originalTransactionId,
      correlationId: parsed.notificationId,
      status: "rejected",
      result: "error",
      entitlementStatus: "pending_validation",
      validationLevel: "unverified",
      validationMethod: "none",
      verificationMode: "server",
      reason: validation.msg || "invalid_notification_payload"
    })));
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
      sourceOfTruth: "server",
      validationLevel: "unverified",
      validationMethod: "none",
      verificationMode: "server"
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
    validationLevel: "pragmatic_header_chain",
    validationMethod: "jws_header_and_payload_consistency",
    verificationMode: "server",
    verificationReason: "header_chain_checked_without_signature_verification",
    envelope: parsed.envelope
  }));
  if (headerMap.IapValidationLevel != null) {
    sh.getRange(targetRow.rowIndex, headerMap.IapValidationLevel + 1).setValue("pragmatic_header_chain");
  }
  if (headerMap.IapValidationMethod != null) {
    sh.getRange(targetRow.rowIndex, headerMap.IapValidationMethod + 1).setValue("jws_header_and_payload_consistency");
  }
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
    entitlementStatus: newStatus,
    validationLevel: "pragmatic_header_chain",
    validationMethod: "jws_header_and_payload_consistency",
    verificationMode: "server"
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
    sourceOfTruth: "server",
    validationLevel: "pragmatic_header_chain",
    validationMethod: "jws_header_and_payload_consistency",
    verificationMode: "server"
  };
}

function reconcileAppleSubscriptions_() {
  const sh = ensureAlunasHasColumns_();
  if (!sh) return { status: "error", msg: "sheet_not_found" };

  const headerMap = _ensureIapColumns_(sh);
  const rows = sh.getDataRange().getValues();
  const nowIso = _getCurrentIsoNow_();
  const nowMs = Date.parse(nowIso);

  let scannedCount = 0;
  let eligibleCount = 0;
  let updatedCount = 0;
  let remoteValidatedCount = 0;
  let localOnlyCount = 0;
  let skippedCount = 0;
  let retryCount = 0;
  let errorCount = 0;

  for (var i = 1; i < rows.length; i++) {
    const row = rows[i];
    const source = String(row[headerMap.IapSource] || "").trim();
    if (source !== "apple_iap") continue;

    scannedCount += 1;
    const selection = _shouldReconcileAppleRow_(row, headerMap, nowMs);
    if (!selection.eligible) {
      skippedCount += 1;
      if (headerMap.IapLastReconcileMode != null) {
        sh.getRange(i + 1, headerMap.IapLastReconcileMode + 1).setValue("skipped");
      }
      console.log("[IAP][reconcile]", JSON.stringify(_buildAppleReconcileContext_(row, headerMap, {
        reconcileMode: "skipped",
        reason: selection.reason,
        correlationId: ""
      })));
      continue;
    }

    eligibleCount += 1;
    const correlationId = "reconcile_" + Utilities.getUuid();

    try {
      const outcome = _resolveAppleReconcileOutcome_(row, headerMap, selection, nowIso, correlationId);
      const applyResult = _applyAppleReconcileOutcome_(sh, i + 1, headerMap, row, outcome);
      if (applyResult.changed) updatedCount += 1;

      if (outcome.resultType === "remote_validated") {
        remoteValidatedCount += 1;
      } else if (outcome.resultType === "local_only_reconciled") {
        localOnlyCount += 1;
      } else if (outcome.resultType === "retry") {
        retryCount += 1;
      }

      console.log("[IAP][reconcile]", JSON.stringify(_buildAppleReconcileContext_(row, headerMap, {
        newStatus: outcome.newStatus,
        reconcileMode: outcome.reconcileMode,
        reason: outcome.reason,
        correlationId: outcome.correlationId,
        validationLevel: outcome.validationLevel,
        validationMethod: outcome.validationMethod
      })));
    } catch (err) {
      errorCount += 1;
      console.log("[IAP][reconcile][error]", JSON.stringify(_buildAppleReconcileContext_(row, headerMap, {
        reconcileMode: "error",
        reason: String(err),
        correlationId: correlationId
      })));
    }
  }

  return {
    status: "ok",
    provider: "apple_iap",
    scannedCount: scannedCount,
    eligibleCount: eligibleCount,
    updatedCount: updatedCount,
    remoteValidatedCount: remoteValidatedCount,
    localOnlyCount: localOnlyCount,
    skippedCount: skippedCount,
    retryCount: retryCount,
    errorCount: errorCount,
    sourceOfTruth: "reconcile_job",
    lastValidatedAt: nowIso,
    validationMode: "mixed_remote_and_local"
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
  if (!sh) {
    return Object.assign(_buildEntitlementContract_({
      status: "error",
      isActive: false,
      modo_personal: false,
      entitlementStatus: "error",
      source: "unknown",
      provider: "internal",
      platform: "cross_platform",
      plan: "access",
      expiresAt: "",
      sourceOfTruth: "server"
    }), { status: "error", msg: "sheet_not_found" });
  }

  const found = _findAlunaRowByIdOrEmail_(sh, payload || {});
  if (!found) {
    return Object.assign(_buildEntitlementContract_({
      status: "notfound",
      isActive: false,
      modo_personal: false,
      entitlementStatus: "notfound",
      source: "unknown",
      provider: "internal",
      platform: "cross_platform",
      plan: "access",
      expiresAt: "",
      sourceOfTruth: "server"
    }), { status: "notfound", msg: "aluna_not_found" });
  }

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
    return Object.assign(_buildEntitlementContract_({
      status: "error",
      isActive: false,
      modo_personal: false,
      entitlementStatus: "error",
      source: "unknown",
      provider: "internal",
      platform: "cross_platform",
      plan: "access",
      expiresAt: "",
      sourceOfTruth: "server"
    }), { status: "error", msg: "missing_required_columns" });
  }

  const values = sh.getRange(found.rowIndex, 1, 1, sh.getLastColumn()).getValues()[0];
  const blockedReason = _getEntitlementBlockReasonFromRow_(values, headerMap);
  if (blockedReason) {
    return _buildBlockedEntitlementContract_(blockedReason.reason, Object.assign({
      userId: String(payload.userId || payload.id || values[0] || "").trim()
    }, blockedReason.extras || {}));
  }

  const unified = _computeUnifiedAccessState_(values, headerMap);
  const entitlements = unified.entitlements;
  const produto = String(values[headerMap.Produto] || "").toLowerCase().trim();
  const userId = String(payload.userId || payload.id || values[0] || "").trim();

  const contract = _buildEntitlementContract_({
    status: "ok",
    isActive: unified.ativa,
    modo_personal: entitlements.modo_personal,
    entitlementStatus: entitlements.status,
    source: entitlements.source,
    provider: entitlements.provider,
    platform: entitlements.platform,
    plan: entitlements.plan,
    expiresAt: entitlements.expiresAt,
    sourceOfTruth: "server"
  });

  return Object.assign(contract, {
    status: "ok",
    userId: userId,
    periodEnd: entitlements.expiresAt,
    productId: entitlements.productId,
    originalTransactionId: entitlements.originalTransactionId,
    lastValidatedAt: entitlements.lastValidatedAt,
    produto: produto
  });
}
