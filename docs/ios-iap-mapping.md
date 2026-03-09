# Diagnóstico e mapeamento atual — Billing/Acesso iOS

## 1) Pontos com compra externa
- `app/js/home.js`: fluxo de bloqueio chama `abrirCheckout()` -> `FEMFLOW.billing.openPaywall()` (antes gateway com Hotmart fallback web).
- `app/js/flowcenter.js`: fluxo de bloqueio chama `abrirCheckout()` -> `FEMFLOW.billing.openPaywall()`.
- `app/js/billing/checkout-hotmart.js`: implementação de checkout externo; iOS já bloqueado por hardening e mantém apenas web/android.
- `app/index.html`: parser de retorno/utm Hotmart para fluxo legado web.

## 2) Pontos de decisão de bloqueio premium
- `app/js/home.js`: `handleCardClick(enfase, locked)`, `openBlockedFlow()` e renderização de cards premium.
- `app/js/flowcenter.js`: regras de bloqueio de modos/caminhos baseadas em produto, personal, trial e `free_access`.
- `app/treino.html`: middleware de acesso por sessão/produto para bloquear navegação direta.

## 3) Pontos de entrada do paywall iOS
- Home e FlowCenter: CTA de recurso bloqueado agora usa `FEMFLOW.billing.openPaywall(planId, context)`.
- Billing central (`app/js/billing/access.js`):
  - iOS: tenta bridge nativa WKWebView (`window.webkit.messageHandlers.iap.postMessage`).
  - fallback iOS/web/android: delega para `FEMFLOW.checkout.openCheckout`.

## 4) Fonte de verdade e sync
- JS local armazena cache (`femflow_ativa`, `femflow_has_personal`, `femflow_produto`).
- Sync oficial: `FEMFLOW.access.refresh()` -> backend `entitlements_status`.
- Eventos locais: `femflow:entitlementsUpdated`.
