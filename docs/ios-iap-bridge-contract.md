# Contrato JS ↔ iOS (WKWebView) para IAP

## Bridge de saída (JS -> iOS)
Canal esperado: `window.webkit?.messageHandlers?.iap?.postMessage(payload)`.

### `openPaywall`
```json
{
  "event": "openPaywall",
  "planId": "access|personal",
  "context": { "source": "home_blocked_flow", "reason": "locked_card" }
}
```

### `purchase`
```json
{
  "event": "purchase",
  "productId": "com.femflow.app.access.monthly",
  "context": { "source": "paywall" }
}
```

### `restore`
```json
{
  "event": "restore",
  "context": { "source": "settings" }
}
```

## Bridge de entrada (iOS -> JS)
Callbacks expostos em `window.FEMFLOW_IAP_BRIDGE`.

### `purchaseSuccess(payload)`
```json
{
  "event": "purchaseSuccess",
  "transactionId": "100000123456",
  "productId": "com.femflow.app.access.monthly",
  "originalTransactionId": "100000123000",
  "entitlementStatus": "active"
}
```

### `purchaseFailed(payload)`
```json
{
  "event": "purchaseFailed",
  "code": "purchase_cancelled|purchase_failed",
  "message": "human-readable"
}
```

### `entitlementsUpdated(payload)`
```json
{
  "event": "entitlementsUpdated",
  "acesso_app": true,
  "modo_personal": false,
  "entitlementStatus": "active|expired|trial|free_access",
  "expiresAt": "2026-01-10T00:00:00.000Z",
  "source": "apple_iap"
}
```

### `restore(payload)`
```json
{
  "event": "restore",
  "restoredCount": 1,
  "entitlementStatus": "active"
}
```

## Backend (fonte de verdade)
Após qualquer callback, o JS chama `FEMFLOW.access.refresh()` e sincroniza com `entitlements_status`.
A persistência final de entitlement permanece no backend (`iap_apple_activate`, `iap_apple_restore`, `entitlements_status`).
