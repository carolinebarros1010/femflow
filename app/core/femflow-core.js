/* =======================================================================
   🌸 FEMFLOW CORE — VERSÃO FINAL 5.3 AJUSTADA — 2025
   Arquitetura Stargate — Estável • Seguro • Sem sobrescrever produto
======================================================================= */

window.FEMFLOW = window.FEMFLOW || {};
const FEMFLOW_ENV = window.FEMFLOW_ENV || "prod";
const FEMFLOW_ACTIVE = window.FEMFLOW_ACTIVE || {};
const FEMFLOW_CONFIG = window.FEMFLOW_CONFIG || {};

/* ===========================================================
   1. CONFIG GLOBAL
=========================================================== */

FEMFLOW.SCRIPT_URL =
  FEMFLOW_ACTIVE.scriptUrl ||
  FEMFLOW_CONFIG?.scriptUrls?.[FEMFLOW_ENV] ||
  "https://femflowapi.falling-wildflower-a8c0.workers.dev/";
FEMFLOW.API_URL = FEMFLOW.SCRIPT_URL;
FEMFLOW.ENV = FEMFLOW_ENV;
FEMFLOW.IAP_APP_ACCESS_PRODUCT_ID = "com.femflow.app.access.monthly";
FEMFLOW.IAP_PERSONAL_PRODUCT_ID = "com.femflow.app.personal.monthly";
FEMFLOW.IAP_PRODUCT_IDS = [
  FEMFLOW.IAP_APP_ACCESS_PRODUCT_ID,
  FEMFLOW.IAP_PERSONAL_PRODUCT_ID
];

FEMFLOW.lang = localStorage.getItem("femflow_lang") || "pt";
FEMFLOW.setLang = function (lang) {
  FEMFLOW.lang = lang;
  localStorage.setItem("femflow_lang", lang);
  document.dispatchEvent(new Event("femflow:langChange"));
};

FEMFLOW.t = function (key) {
  const lang = FEMFLOW.lang || "pt";
  const parts = key.split(".");
  let obj = window.FEMFLOW_LANG?.[lang] || window.FEMFLOW_LANG?.pt;

  for (const p of parts) {
    if (!obj || obj[p] === undefined) return key;
    obj = obj[p];
  }
  return obj;
};

FEMFLOW.dispatch = function(type, detail = {}) {
  document.dispatchEvent(
    new CustomEvent(`femflow:${type}`, { detail })
  );
};

FEMFLOW.assetUrl = function (relPath) {
  const raw = String(relPath || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;

  const clean = raw.replace(/^\/+/, "");
  return new URL(clean, document.baseURI).href;
};

window.FEMFLOW_assetUrl = function (relPath) {
  return FEMFLOW.assetUrl(relPath);
};

/* ============================================================
   🔐 FEMFLOW — Device + Session helpers
============================================================ */

FEMFLOW.getDeviceId = function () {
  // 1️⃣ tenta localStorage
  let d = localStorage.getItem("femflow_device_id");
  if (d) return d;

  // 2️⃣ tenta cookie persistente
  const m = document.cookie.match(/(?:^|;)\s*ff_device=([^;]+)/);
  if (m && m[1]) {
    d = decodeURIComponent(m[1]);
    localStorage.setItem("femflow_device_id", d);
    return d;
  }

  // 3️⃣ gera novo (primeiro acesso real)
  d =
    crypto?.randomUUID?.() ||
    ("dev-" + Date.now() + "-" + Math.random().toString(36).slice(2));

  // salva nos dois
  localStorage.setItem("femflow_device_id", d);
  document.cookie =
    "ff_device=" +
    encodeURIComponent(d) +
    "; path=/; max-age=31536000; SameSite=Lax";

  return d;
};


FEMFLOW.setDeviceId = function (deviceId) {
  const d = String(deviceId || "").trim();
  if (!d) return;
  localStorage.setItem("femflow_device_id", d);
  document.cookie =
    "ff_device=" +
    encodeURIComponent(d) +
    "; path=/; max-age=31536000; SameSite=Lax";
};

FEMFLOW.getSessionToken = function () {
  return localStorage.getItem("femflow_session_token") || "";
};

FEMFLOW.setSessionToken = function (token) {
  if (token) {
    localStorage.setItem("femflow_session_token", token);
  }
};

FEMFLOW.getSessionExpira = function () {
  return localStorage.getItem("femflow_session_expira") || "";
};

FEMFLOW.temTreinoOuContextoAtivo = function () {
  const enfase = String(localStorage.getItem("femflow_enfase") || "").trim().toLowerCase();
  const hasPersonal = localStorage.getItem("femflow_has_personal") === "true";
  const enduranceReady =
    localStorage.getItem("femflow_endurance_setup_done") === "true" ||
    Boolean(localStorage.getItem("femflow_endurance_config"));
  const treinoExtra = localStorage.getItem("femflow_treino_extra") === "true";
  const treinoEndurance = localStorage.getItem("femflow_treino_endurance") === "true";
  const customTreino = Boolean(localStorage.getItem("femflow_custom_treino"));

  return (
    (enfase && enfase !== "nenhuma") ||
    hasPersonal ||
    enduranceReady ||
    treinoExtra ||
    treinoEndurance ||
    customTreino
  );
};

FEMFLOW.decidirRotaInicial = function ({ preferBodyInsight = false } = {}) {
  if (preferBodyInsight) return "body_insight.html";

  const cicloConfigurado = localStorage.getItem("femflow_cycle_configured") === "yes";
  if (!cicloConfigurado) return "ciclo.html";

  if (FEMFLOW.temTreinoOuContextoAtivo()) {
    return "flowcenter.html";
  }

  return "home.html";
};

FEMFLOW.setSessionExpira = function (iso) {
  const value = String(iso || "").trim();
  if (!value) return;
  localStorage.setItem("femflow_session_expira", value);
};

FEMFLOW.clearSession = function () {
  localStorage.removeItem("femflow_session_token");
  localStorage.removeItem("femflow_session_expira");
  // compat legado (chaves camelCase)
  localStorage.removeItem("femflow_sessionToken");
  localStorage.removeItem("femflow_sessionExpira");
};

FEMFLOW.handleBlockedAccount = function (perfil) {
  const produto = String(perfil?.produto || "").toLowerCase();
  const accountStatus = String(perfil?.accountStatus || perfil?.statusConta || "").toLowerCase();
  const deleteRequestedAt = String(perfil?.deleteRequestedAt || "").trim();
  const isDeleteRequested =
    accountStatus === "delete_requested" ||
    accountStatus === "pendente_exclusao" ||
    Boolean(deleteRequestedAt) ||
    produto === "exclusao_solicitada";

  if (isDeleteRequested) {
    FEMFLOW.clearSession?.();
    localStorage.removeItem("femflow_auth");
    localStorage.removeItem("femflow_id");
    localStorage.removeItem("femflow_email");

    const lang = FEMFLOW.lang || "pt";

    const messages = {
      pt: "Você solicitou a exclusão da sua conta. Para reverter, entre em contato: femflow.consultoria@gmail.com",
      en: "You requested account deletion. To revert, contact: femflow.consultoria@gmail.com",
      fr: "Vous avez demandé la suppression du compte. Pour annuler, contactez : femflow.consultoria@gmail.com"
    };

    alert(String(perfil?.messageLocalized || "").trim() || (messages[lang] || messages.pt));

    window.location.href = "index.html";
    return true;
  }

  return false;
};

FEMFLOW._autoLoginRunning = false;

FEMFLOW.autoLoginSilencioso = async function () {
  if (FEMFLOW._autoLoginRunning) return true;
  FEMFLOW._autoLoginRunning = true;

  try {
    const email =
      localStorage.getItem("femflow_email") ||
      localStorage.getItem("femflowEmail") ||
      "";
    const deviceId =
      localStorage.getItem("femflow_device_id") ||
      localStorage.getItem("femflow_deviceId") ||
      "";

    const expiraRaw =
      localStorage.getItem("femflow_session_expira") ||
      localStorage.getItem("femflow_sessionExpira") ||
      "";

    if (!email || !deviceId) return false;

    const expiraMs = Date.parse(String(expiraRaw || ""));
    const agora = Date.now();
    const UM_DIA = 24 * 60 * 60 * 1000;

    if (Number.isFinite(expiraMs)) {
      if (expiraMs - agora > UM_DIA) {
        return true; // ainda longe de expirar
      }
      // Se estiver perto de expirar, força refresh
    }

    try {
      const resp = await FEMFLOW.post({
        action: "login",
        email,
        deviceId
      });

      if (resp?.status === "ok") {
        if (resp.sessionToken) {
          FEMFLOW.setSessionToken(resp.sessionToken);
          localStorage.setItem("femflow_sessionToken", String(resp.sessionToken));
        }
        if (resp.sessionExpira) {
          FEMFLOW.setSessionExpira(resp.sessionExpira);
          localStorage.setItem("femflow_sessionExpira", String(resp.sessionExpira));
        }
        if (resp.deviceId) {
          FEMFLOW.setDeviceId(resp.deviceId);
        }
        return true;
      }

      if (resp?.status === "blocked") {
        FEMFLOW.clearSession();
        return false;
      }

      return true;
    } catch (e) {
      console.warn("Erro login silencioso — mantendo sessão.");
      return true;
    }
  } finally {
    FEMFLOW._autoLoginRunning = false;
  }
};

FEMFLOW.validarComRetry = async function (fnValidar, tentativas = 2) {
  for (let i = 0; i <= tentativas; i++) {
    try {
      const resp = await fnValidar();

      if (!resp || resp.status === "error") throw new Error("Erro backend");

      if (resp.status === "blocked") {
        FEMFLOW.clearSession();
        return resp;
      }

      if (resp.status === "ok") {
        return resp;
      }

      return resp;
    } catch (e) {
      if (i === tentativas) {
        console.warn("Validar falhou após retries.");
        return null;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return null;
};

FEMFLOW.sessionTransport = {
  type: "localStorage",
  postMessageFallback: null,
  setPostMessageBridge(fn) {
    this.postMessageFallback = typeof fn === "function" ? fn : null;
  }
};

FEMFLOW.openExternal = function (url) {
  if (!url) return;

  const targetUrl = String(url || "");
  const isIosNative = FEMFLOW.isCapacitorIOS?.();
  const blockedCommercialHosts = [
    /(^|\.)hotmart\.com$/i
  ];

  let shouldBlockExternal = false;
  try {
    const parsed = new URL(targetUrl, document.baseURI);
    const host = String(parsed.hostname || "").toLowerCase();
    const isBlockedHost = blockedCommercialHosts.some(function (pattern) {
      return pattern.test(host);
    });

    shouldBlockExternal = isBlockedHost;
  } catch (err) {
    shouldBlockExternal = /hotmart\.com/i.test(targetUrl);
  }

  if (isIosNative && shouldBlockExternal) {
    const lang = String(FEMFLOW.lang || "pt").slice(0, 2).toLowerCase();
    const mensagens = {
      pt: "Assine no app para continuar",
      en: "Subscribe in the app to continue",
      fr: "Abonnez-vous dans l'app pour continuer"
    };
    FEMFLOW.toast?.(mensagens[lang] || mensagens.pt);
    console.warn("[iOS hardening] Link externo comercial bloqueado no iOS nativo.", { url: targetUrl });
    return;
  }

  window.location.href = targetUrl;
};

FEMFLOW.hardenIosExternalCommercialSurfaces = function () {
  if (!FEMFLOW.isCapacitorIOS?.()) return;

  const selectors = [
    'a[href*="hotmart.com"]',
    '.js-newsletter-external'
  ].join(',');

  document.querySelectorAll(selectors).forEach(function (link) {
    link.setAttribute("aria-disabled", "true");
    link.setAttribute("data-ios-hidden-commercial", "true");
    link.style.display = "none";
    link.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      FEMFLOW.toast?.("Assine no app para continuar");
    });
  });
};

document.addEventListener("DOMContentLoaded", function () {
  FEMFLOW.hardenIosExternalCommercialSurfaces?.();
});

FEMFLOW.openInternal = function (path) {
  if (!path) return;
  FEMFLOW.router?.(path);
};

// DEPRECATED compat layer temporária: manter até remover consumidores legados fora de billing.
// Compliance iOS: não injetar defaults Hotmart hardcoded no bundle principal.
FEMFLOW.LINK_ACESSO_APP = FEMFLOW.LINK_ACESSO_APP || "";
FEMFLOW.LINK_PERSONAL = FEMFLOW.LINK_PERSONAL || "";

FEMFLOW.isNativeIOS = function () {
  return String(Capacitor?.getPlatform?.() || "").toLowerCase() === "ios";
};

FEMFLOW.isCapacitorIOS = function () {
  try {
    return FEMFLOW.isNativeIOS();
  } catch (err) {
    return false;
  }
};

FEMFLOW.isLegacyEbooksPath = function (path = "") {
  const normalized = String(path || "").toLowerCase().replace(/^\/+/, "");
  return /^ebooks\/.+\.html$/.test(normalized);
};

FEMFLOW.iap = FEMFLOW.iap || {
  _purchaseInFlight: false,
  _restoreInFlight: false,
  async listProducts(productIds = []) {
    if (FEMFLOW.checkout?.isIOS?.()) {
      FEMFLOW.toast("IAP em configuração");
    }
    return {
      status: "stub",
      products: Array.isArray(productIds) ? productIds : []
    };
  },
  async purchase(productId) {
    if (FEMFLOW.checkout?.isIOS?.()) {
      FEMFLOW.toast("IAP em configuração");
    }
    return { status: "error", message: "IAP em configuração", productId: String(productId || "") };
  },
  async restore() {
    if (FEMFLOW.checkout?.isIOS?.()) {
      FEMFLOW.toast("IAP em configuração");
    }
    return { status: "error", restoredCount: 0, message: "IAP em configuração" };
  }
};

FEMFLOW.checkout = FEMFLOW.checkout || {
  productIds: {
    access: "com.femflow.app.access.monthly",
    personal: "com.femflow.app.personal.monthly"
  },

  isIOS() {
    return FEMFLOW.isCapacitorIOS?.() === true;
  },

  async openCheckout({ reason = "", preferredPlan = "access" } = {}) {
    // DEPRECATED: compat layer do core. Gateway oficial: FEMFLOW.checkout.openCheckout(planId, context) em js/billing/checkout.js.
    const currentGatewayOpenCheckout = FEMFLOW.checkout?.openCheckout;
    if (
      typeof currentGatewayOpenCheckout === "function"
      && currentGatewayOpenCheckout !== this.openCheckout
      && !arguments[0]?.__fromCoreCompat
    ) {
      console.warn("[DEPRECATED] FEMFLOW.core.checkout.openCheckout legado delegando para gateway de billing.", { reason, preferredPlan });
      return currentGatewayOpenCheckout(preferredPlan, {
        source: "core_legacy_checkout",
        reason,
        preferredPlan,
        __fromCoreCompat: true
      });
    }

    if (FEMFLOW.iap?._purchaseInFlight || FEMFLOW.iap?._restoreInFlight) {
      FEMFLOW.toast?.("Processando...");
      return { status: "ignored", message: "purchase_in_flight" };
    }

    const targetPlan = preferredPlan === "personal" ? "personal" : "access";

    if (!this.isIOS()) {
      return this.openHotmart(targetPlan);
    }

    const productId = this.productIds[targetPlan] || this.productIds.access;
    try {
      const result = await FEMFLOW.iap.purchase(productId);
      const status = String(result?.status || "").toLowerCase();
      const purchaseSucceeded = status === "ok" || Boolean(result?.transactionId || result?.transaction?.transactionId);
      const shouldFallbackPaywall = status === "error" || status === "ignored";

      if (purchaseSucceeded) return result;
      if (!shouldFallbackPaywall) return result;
    } catch (err) {
      console.warn("IAP purchase falhou, abrindo paywall", err);
    }

    return this.openPaywall({ reason, preferredPlan: targetPlan });
  },

  openHotmart(plan = "access") {
    // DEPRECATED compat layer temporária. TODO remover após migração total do billing.
    console.warn("[DEPRECATED] FEMFLOW.core.checkout.openHotmart legado delegando para gateway de billing.", { plan });

    const currentGatewayOpenCheckout = FEMFLOW.checkout?.openCheckout;
    if (typeof currentGatewayOpenCheckout === "function" && currentGatewayOpenCheckout !== this.openCheckout) {
      return currentGatewayOpenCheckout(plan, {
        source: "core_legacy_openHotmart",
        deprecated: true,
        __fromCoreCompat: true
      });
    }

    if (FEMFLOW.isCapacitorIOS?.()) {
      const lang = String(FEMFLOW.lang || "pt").slice(0, 2).toLowerCase();
      const mensagens = {
        pt: "Assine no app para continuar",
        en: "Subscribe in the app to continue",
        fr: "Abonnez-vous dans l'app pour continuer"
      };
      FEMFLOW.toast?.(mensagens[lang] || mensagens.pt);
      console.warn("[iOS hardening] openHotmart bloqueado no iOS nativo.", { plan });
      return { status: "blocked", reason: "ios_native_hardening" };
    }

    const targetPlan = plan === "personal" ? "personal" : "access";
    const url = targetPlan === "personal" ? FEMFLOW.LINK_PERSONAL : FEMFLOW.LINK_ACESSO_APP;
    if (!url) return;
    FEMFLOW.openExternal(url);
    return { status: "ok", plan: targetPlan };
  },

  _paywallCopy() {
    const lang = String(FEMFLOW.lang || "pt").slice(0, 2).toLowerCase();
    const copy = {
      pt: {
        aria: "Planos FemFlow",
        title: "Escolha seu plano",
        subtitle: "Assine para acessar os recursos premium do FemFlow.",
        accessTitle: "Acesso App (mensal)",
        accessDesc: "R$ 69,90 por mês",
        personalTitle: "Personal (mensal)",
        personalDesc: "R$ 249,90 por mês",
        legal: "A assinatura renova automaticamente a cada período, salvo cancelamento com pelo menos 24 horas de antecedência. O pagamento será cobrado na sua conta Apple. Você pode cancelar a qualquer momento nas configurações do seu Apple ID.",
        terms: "Termos de uso",
        privacy: "Política de privacidade",
        buy: "Assinar",
        restore: "Restaurar compras",
        close: "Agora não"
      },
      en: {
        aria: "FemFlow plans",
        title: "Choose your plan",
        subtitle: "Subscribe to access FemFlow premium features.",
        accessTitle: "App Access (monthly)",
        accessDesc: "R$ 69,90 per month",
        personalTitle: "Personal (monthly)",
        personalDesc: "R$ 249,90 per month",
        legal: "Subscriptions renew automatically each billing period unless canceled at least 24 hours before renewal. Payment is charged to your Apple account. You can cancel at any time in Apple ID settings.",
        terms: "Terms of Use",
        privacy: "Privacy Policy",
        buy: "Subscribe",
        restore: "Restore purchases",
        close: "Not now"
      },
      fr: {
        aria: "Offres FemFlow",
        title: "Choisissez votre offre",
        subtitle: "Abonnez-vous pour accéder aux fonctionnalités premium de FemFlow.",
        accessTitle: "Accès App (mensuel)",
        accessDesc: "69,90 R$ par mois",
        personalTitle: "Personal (mensuel)",
        personalDesc: "249,90 R$ par mois",
        legal: "L’abonnement se renouvelle automatiquement à chaque période, sauf annulation au moins 24 heures avant. Le paiement est débité de votre compte Apple. Vous pouvez annuler à tout moment dans les réglages de votre identifiant Apple.",
        terms: "Conditions d’utilisation",
        privacy: "Politique de confidentialité",
        buy: "S’abonner",
        restore: "Restaurer les achats",
        close: "Plus tard"
      }
    };
    return copy[lang] || copy.pt;
  },

  _applyPaywallI18n(modal) {
    if (!modal) return;
    const copy = this._paywallCopy();
    const dialog = modal.querySelector(".ff-ios-paywall");
    if (dialog) dialog.setAttribute("aria-label", copy.aria);
    const title = modal.querySelector("[data-paywall-title]");
    const subtitle = modal.querySelector("[data-paywall-subtitle]");
    const accessTitle = modal.querySelector("[data-paywall-access-title]");
    const accessDesc = modal.querySelector("[data-paywall-access-desc]");
    const personalTitle = modal.querySelector("[data-paywall-personal-title]");
    const personalDesc = modal.querySelector("[data-paywall-personal-desc]");
    const legal = modal.querySelector("[data-paywall-legal]");
    const terms = modal.querySelector("[data-paywall-terms]");
    const privacy = modal.querySelector("[data-paywall-privacy]");
    const buy = modal.querySelector(".ff-ios-buy");
    const restore = modal.querySelector(".ff-ios-restore");
    const close = modal.querySelector(".ff-ios-close");

    if (title) title.textContent = copy.title;
    if (subtitle) subtitle.textContent = copy.subtitle;
    if (accessTitle) accessTitle.textContent = copy.accessTitle;
    if (accessDesc) accessDesc.textContent = copy.accessDesc;
    if (personalTitle) personalTitle.textContent = copy.personalTitle;
    if (personalDesc) personalDesc.textContent = copy.personalDesc;
    if (legal) legal.textContent = copy.legal;
    if (terms) {
      terms.textContent = copy.terms;
      terms.setAttribute("href", FEMFLOW.assetUrl("docs/terms.html"));
    }
    if (privacy) {
      privacy.textContent = copy.privacy;
      privacy.setAttribute("href", FEMFLOW.assetUrl("docs/privacy.html"));
    }
    if (buy) buy.textContent = copy.buy;
    if (restore) restore.textContent = copy.restore;
    if (close) close.textContent = copy.close;
  },

  _ensurePaywallModal() {
    let modal = document.getElementById("ff-ios-paywall");
    if (modal) return modal;

    const styleId = "ff-ios-paywall-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .ff-ios-paywall-overlay{position:fixed;inset:0;background:rgba(18,16,25,.62);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px}
        .ff-ios-paywall-overlay.hidden{display:none}
        .ff-ios-paywall{width:min(460px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 18px 40px rgba(0,0,0,.22);font-family:inherit}
        .ff-ios-paywall h3{margin:0 0 6px;font-size:1.3rem}
        .ff-ios-paywall p{margin:0 0 14px;color:#4b4457}
        .ff-ios-paywall-plan{width:100%;border:1px solid #f0d7dd;background:#fff7f7;border-radius:12px;padding:12px 14px;margin:0 0 10px;text-align:left;font-weight:600}
        .ff-ios-paywall-plan small{display:block;font-weight:400;color:#6b6272;margin-top:4px}
        .ff-ios-paywall-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
        .ff-ios-paywall-actions button{flex:1 1 140px;border:0;border-radius:10px;padding:11px 12px;font-weight:700;cursor:pointer}
        .ff-ios-buy{background:#8b3d68;color:#fff}
        .ff-ios-restore{background:#f1eff4;color:#352f3f}
        .ff-ios-paywall-legal{margin-top:8px;font-size:.78rem;line-height:1.35;color:#6b6272}
        .ff-ios-paywall-links{display:flex;gap:10px;flex-wrap:wrap;margin-top:8px}
        .ff-ios-paywall-links a{font-size:.8rem;color:#8b3d68;text-decoration:underline}
        .ff-ios-close{margin-top:12px;width:100%;background:transparent;border:0;color:#6f6781;padding:8px;cursor:pointer}
      `;
      document.head.appendChild(style);
    }

    modal = document.createElement("div");
    modal.id = "ff-ios-paywall";
    modal.className = "ff-ios-paywall-overlay hidden";
    modal.innerHTML = `
      <div class="ff-ios-paywall" role="dialog" aria-modal="true" aria-label="Planos FemFlow">
        <h3 data-paywall-title>Escolha seu plano</h3>
        <p data-paywall-subtitle>Assinaturas disponíveis no app.</p>
        <button type="button" class="ff-ios-paywall-plan" data-plan="access">
          <span data-paywall-access-title>Acesso App (mensal)</span>
          <small data-paywall-access-desc>Treinos e ebooks inclusos na assinatura.</small>
        </button>
        <button type="button" class="ff-ios-paywall-plan" data-plan="personal">
          <span data-paywall-personal-title>Personal (mensal)</span>
          <small data-paywall-personal-desc>Acesso App + modo personal.</small>
        </button>
        <div class="ff-ios-paywall-actions">
        <button type="button" class="ff-ios-buy">Comprar</button>
          <button type="button" class="ff-ios-restore">Restaurar compras</button>
        </div>
        <p class="ff-ios-paywall-legal" data-paywall-legal>A assinatura renova automaticamente a cada período, salvo cancelamento com pelo menos 24 horas de antecedência. O pagamento será cobrado na sua conta Apple. Você pode cancelar a qualquer momento nas configurações do seu Apple ID.</p>
        <div class="ff-ios-paywall-links">
          <a href="docs/terms.html" target="_blank" rel="noopener" data-paywall-terms>Termos de uso</a>
          <a href="docs/privacy.html" target="_blank" rel="noopener" data-paywall-privacy>Política de privacidade</a>
        </div>
        <button type="button" class="ff-ios-close">Agora não</button>
      </div>
    `;

    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.classList.add("hidden");
    });

    let selectedPlan = "access";
    const setBusy = (busy) => {
      modal.querySelectorAll("button").forEach((button) => {
        if (button.classList.contains("ff-ios-close")) {
          button.disabled = false;
          return;
        }
        button.disabled = Boolean(busy);
      });
    };

    const toastIapResult = (result = {}) => {
      const status = String(result?.status || "").toLowerCase();
      const message = String(result?.message || "").trim();

      if (status === "ok") {
        FEMFLOW.toast?.(message || "Assinatura ativa. Acesso liberado.");
        modal.classList.add("hidden");
        return;
      }

      if (status === "cancelled") {
        FEMFLOW.toast?.(message || "Compra cancelada.");
        return;
      }

      FEMFLOW.toast?.(message || "Não foi possível concluir. Tente novamente.");
    };

    const selectPlan = (plan) => {
      selectedPlan = plan === "personal" ? "personal" : "access";
      modal.querySelectorAll(".ff-ios-paywall-plan").forEach((btn) => {
        btn.style.outline = btn.dataset.plan === selectedPlan ? "2px solid #8b3d68" : "none";
      });
    };

    modal.querySelectorAll(".ff-ios-paywall-plan").forEach((btn) => {
      btn.addEventListener("click", () => selectPlan(btn.dataset.plan));
    });

    modal.querySelector(".ff-ios-buy")?.addEventListener("click", async () => {
      if (FEMFLOW.iap?._purchaseInFlight || FEMFLOW.iap?._restoreInFlight) {
        FEMFLOW.toast?.("Processando...");
        return;
      }

      const productId = this.productIds[selectedPlan] || this.productIds.access;
      setBusy(true);
      try {
        const result = await FEMFLOW.iap.purchase(productId);
        toastIapResult(result);
      } finally {
        setBusy(false);
      }
    });

    modal.querySelector(".ff-ios-restore")?.addEventListener("click", async () => {
      if (FEMFLOW.iap?._purchaseInFlight || FEMFLOW.iap?._restoreInFlight) {
        FEMFLOW.toast?.("Processando...");
        return;
      }

      setBusy(true);
      try {
        const result = await FEMFLOW.iap.restore();
        toastIapResult(result);
      } finally {
        setBusy(false);
      }
    });

    modal.querySelector(".ff-ios-close")?.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    document.body.appendChild(modal);
    this._applyPaywallI18n(modal);
    selectPlan("access");
    return modal;
  },

  openPaywall({ preferredPlan = "access" } = {}) {
    const modal = this._ensurePaywallModal();
    if (!modal) return;
    this._applyPaywallI18n(modal);
    modal.classList.remove("hidden");
    const target = preferredPlan === "personal" ? "personal" : "access";
    const btn = modal.querySelector(`.ff-ios-paywall-plan[data-plan="${target}"]`);
    btn?.click();
    void FEMFLOW.iap.listProducts(Object.values(this.productIds));
  }
};


FEMFLOW.canAccessEbooks = function () {
  const produto = String(localStorage.getItem("femflow_produto") || "").toLowerCase().trim();
  const ativa = localStorage.getItem("femflow_ativa") === "true";
  const vip = produto === "vip";

  if (produto === "trial_app") return false;
  return ativa || vip;
};

FEMFLOW._setSplashHandoff = function () {
  try {
    sessionStorage.setItem("ff_splash_handoff", "1");
  } catch (e) {}
};

FEMFLOW._hasSplashHandoff = function () {
  try {
    return sessionStorage.getItem("ff_splash_handoff") === "1";
  } catch (e) {
    return false;
  }
};

FEMFLOW._clearSplashHandoff = function () {
  try {
    sessionStorage.removeItem("ff_splash_handoff");
  } catch (e) {}
};

FEMFLOW.navegarUltra = async function (url) {
  try {
    FEMFLOW.loading.show();
  } catch (e) {}

  FEMFLOW._setSplashHandoff();

  try {
    document.documentElement.classList.add("ff-page-leave");
  } catch (e) {}

  await new Promise((resolve) => setTimeout(resolve, 150));
  window.location.href = url;
};

FEMFLOW.finalizarHandoffSplash = function () {
  FEMFLOW._clearSplashHandoff();
  try {
    FEMFLOW.loading.hide();
  } catch (e) {}
};

FEMFLOW.fetchWithRetry = async function (input, init = {}, options = {}) {
  const {
    retries = 2,
    baseDelay = 550,
    timeoutMs = 12000,
    critical = false,
    fallbackMessage = "Falha de conexão. Tente novamente em instantes."
  } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok && response.status >= 500 && attempt < retries) {
        throw new Error(`http_${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (attempt >= retries) {
        if (critical) FEMFLOW.toast?.(fallbackMessage, true);
        throw error;
      }
      const waitMs = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
};

FEMFLOW.requireFirebaseAuthIfNeeded = function () {
  const currentPath = (location.pathname.split("/").pop() || "").toLowerCase();
  if (!currentPath || currentPath === "index.html") return;
  if (!window.firebase || !firebase.auth) return;

  firebase.auth().onAuthStateChanged((user) => {
    if (user && !user.isAnonymous) return;

    const isBodyInsight = currentPath.includes("body_insight");
    if (!isBodyInsight) return;

    const syncFailed = localStorage.getItem("firebase_sync_failed") === "true";
    if (syncFailed) {
      console.info("[FemFlow] Firebase sync pendente. Redirecionando para login antes do Body Insight.");
    }

    localStorage.setItem("post_login_redirect", "body_insight.html");
    location.href = "index.html?redirect=body_insight";
  });
};

FEMFLOW.ensureFirebaseAuthForBodyInsight = async function () {
  const lang = FEMFLOW.lang || "pt";
  const fallbackMessage =
    FEMFLOW.langs?.[lang]?.home?.bodyInsightReloginRequired ||
    FEMFLOW.langs?.pt?.home?.bodyInsightReloginRequired ||
    "Desculpe, precisamos que você faça login novamente para utilizar essa função.";

  if (!window.firebase || !firebase.auth) {
    FEMFLOW.toast(fallbackMessage, true);
    return false;
  }

  try {
    await (window.FEMFLOW?.firebaseAuthReady || Promise.resolve());
  } catch (error) {
    console.warn("[FemFlow] firebaseAuthReady falhou:", error);
  }

  const user = firebase.auth().currentUser;
  if (user && !user.isAnonymous) return true;

  FEMFLOW.toast(fallbackMessage, true);
  return false;
};


FEMFLOW.dev = () => localStorage.getItem("femflow_dev") === "on";
FEMFLOW.log   = (...a) => FEMFLOW.dev() && console.log("%c[FEMFLOW]", "color:#cc6a5a", ...a);
FEMFLOW.warn  = (...a) => FEMFLOW.dev() && console.warn("%c[FEMFLOW ⚠]", "color:#e07f67", ...a);
FEMFLOW.error = (...a) => FEMFLOW.dev() && console.error("%c[FEMFLOW ❌]", "color:#b74333", ...a);

FEMFLOW.toast = (msg, error = false, options = {}) => {
  const variant = options.variant || (error ? "error" : "success");
  const duration = Number(options.duration || 2600);
  let box = document.querySelector(".toast-box");
  if (!box) {
    box = document.createElement("div");
    box.className = "toast-box";
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }

  clearTimeout(box._ffTimer);
  box.textContent = msg;
  box.classList.remove("success", "error");
  box.classList.add(variant);
  box.classList.add("visible");
  box._ffTimer = setTimeout(() => box.classList.remove("visible"), duration);
};

FEMFLOW.haptics = {
  async impact(style = "LIGHT") {
    try {
      const plugin = window.Capacitor?.Plugins?.Haptics;
      if (!plugin?.impact) return;
      await plugin.impact({ style });
    } catch (_) {}
  },
  light() {
    return this.impact("LIGHT");
  }
};

FEMFLOW.pageTransition = {
  active: false,
  start() {
    if (this.active || document.documentElement.classList.contains("ff-reduce-motion")) return;
    this.active = true;
    document.body.classList.add("ff-page-leave");
  },
  finish() {
    document.body.classList.add("ff-page-enter");
    requestAnimationFrame(() => {
      document.body.classList.remove("ff-page-leave");
      setTimeout(() => document.body.classList.remove("ff-page-enter"), 220);
      this.active = false;
    });
  }
};

FEMFLOW.modalManager = {
  getOpenModal() {
    const selectors = [
      ".ff-modal-overlay:not(.hidden)",
      ".ff-menu-modal.active",
      ".ff-notifications-modal.active",
      ".ff-lang-modal:not(.hidden)",
      ".ff-sac-modal:not(.hidden)",
      ".modal-nivel:not(.oculto)",
      ".modal-extra:not(.oculto)",
      ".modal-endurance:not(.oculto)",
      ".modal-caminhos:not(.oculto)",
      ".ff-zona-modal.is-open"
    ];
    for (const selector of selectors) {
      const modal = document.querySelector(selector);
      if (modal) return modal;
    }
    return null;
  },
  closeTopMost() {
    const modal = this.getOpenModal();
    if (!modal) return false;
    if (modal.id === "ff-notifications-modal") return !!FEMFLOW.closeNotifications?.();
    modal.classList.add("hidden");
    modal.classList.add("oculto");
    modal.classList.remove("active", "is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("ff-zona-modal-open");
    document.body.classList.remove("ff-modal-open");
    return true;
  }
};

FEMFLOW.installBackHandler = function () {
  if (this._backHandlerInstalled) return;
  this._backHandlerInstalled = true;

  const onBack = (ev) => {
    const tutorialOpen = document.querySelector("#treinoTour:not(.hidden)");
    if (tutorialOpen) {
      tutorialOpen.classList.add("hidden");
      ev?.preventDefault?.();
      return;
    }

    if (FEMFLOW.modalManager.closeTopMost()) {
      ev?.preventDefault?.();
      return;
    }
  };

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") onBack(ev);
  });

  if (window.Capacitor?.Plugins?.App?.addListener) {
    window.Capacitor.Plugins.App.addListener("backButton", onBack);
  }
};



FEMFLOW.trapModalFocus = function (event) {
  if (event.key !== "Tab") return;
  const modal = FEMFLOW.modalManager.getOpenModal();
  if (!modal) return;
  const focusables = Array.from(modal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'))
    .filter((el) => !el.hasAttribute('disabled'));
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

FEMFLOW.setupOfflineBanner = function () {
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  if (page === "anamnese_deluxe.html") return;
  if (document.getElementById("ff-offline-banner")) return;
  const banner = document.createElement("div");
  banner.id = "ff-offline-banner";
  banner.className = "ff-offline-banner";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.textContent = "Sem internet. Algumas ações podem atrasar.";
  document.body.appendChild(banner);

  const sync = () => banner.classList.toggle("is-visible", navigator.onLine === false);
  window.addEventListener("offline", sync);
  window.addEventListener("online", sync);
  sync();
};

FEMFLOW.listenForUpdates = function () {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "FEMFLOW_UPDATE_AVAILABLE") return;

    if (localStorage.getItem("femflow_update_ready") !== "true") {
      localStorage.setItem("femflow_update_ready", "true");
      FEMFLOW.toast("✨ Atualizamos o FemFlow com melhorias.");
    }
  });
};

FEMFLOW.listenForUpdates();

/* ============================================================
   🔔 PUSH NOTIFICATIONS (FCM)
============================================================ */
FEMFLOW.registerServiceWorker = async function () {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("service-worker.js");
    return registration;
  } catch (err) {
    console.warn("[FemFlow] Falha ao registrar Service Worker:", err);
    return null;
  }
};

FEMFLOW.push = {
  promptKey: "femflow_push_prompted",
  tokenKey: "femflow_push_token",
  sentKey: "femflow_push_token_sent",
  pendingKey: "femflow_push_token_pending",
  _initialized: false,
  _messaging: null,
  _registration: null,

  getPromptCopy() {
    const lang = FEMFLOW.lang || "pt";
    const copies = {
      pt: "Quer receber lembretes suaves sobre seu treino e seu ciclo? Você pode desativar quando quiser.",
      en: "Would you like gentle reminders about your training and cycle? You can turn them off anytime.",
      es: "¿Quieres recordatorios suaves sobre tu entrenamiento y tu ciclo? Puedes desactivarlos cuando quieras."
    };

    return copies[lang] || copies.pt;
  },

  async init() {
    if (this._initialized) return;
    if (typeof firebase === "undefined" || !firebase.messaging) return;

    this._registration = await FEMFLOW.registerServiceWorker();
    if (!this._registration) return;

    this._messaging = firebase.messaging();
    this._initialized = true;

    try {
      this._messaging.onMessage((payload) => {
        if (document.visibilityState === "visible") {
          console.info("[FemFlow] Push recebido em primeiro plano:", payload);
          FEMFLOW.dispatch?.("push", { payload });
          return;
        }
      });
    } catch (err) {
      console.warn("[FemFlow] Falha ao registrar listener de push:", err);
    }
  },

  async requestPermissionAfterLogin() {
    if (!("Notification" in window)) return;

    if (localStorage.getItem(this.promptKey) === "yes") {
      await this.tryRegisterToken();
      return;
    }

    const accepted = window.confirm(this.getPromptCopy());
    localStorage.setItem(this.promptKey, "yes");

    if (!accepted) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    await this.tryRegisterToken();
  },

  async tryRegisterToken() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    await this.init();
    if (!this._messaging || !this._registration) return;

    try {
      const options = { serviceWorkerRegistration: this._registration };
      const vapidKey =
        window.FEMFLOW_VAPID_KEY ||
        FEMFLOW_ACTIVE?.pushVapidKey ||
        FEMFLOW_CONFIG?.pushVapidKeys?.[FEMFLOW_ENV];
      if (!vapidKey) {
        console.warn("[FemFlow] VAPID key ausente. Defina em FEMFLOW_ACTIVE.pushVapidKey ou FEMFLOW_CONFIG.pushVapidKeys.");
        return;
      }
      options.vapidKey = vapidKey;

      const token = await this._messaging.getToken(options);
      if (!token) return;

      const storedToken = localStorage.getItem(this.tokenKey);
      const alreadySent = localStorage.getItem(this.sentKey) === "yes";
      if (storedToken === token && alreadySent) return;

      localStorage.setItem(this.tokenKey, token);

      const userId = localStorage.getItem("femflow_id") || "";
      const deviceId = FEMFLOW.getDeviceId();
      const lang = FEMFLOW.lang || "pt";

      if (!userId) {
        localStorage.setItem(this.pendingKey, token);
        return;
      }

      await this.sendTokenToBackend(token, userId, deviceId, lang);
    } catch (err) {
      console.warn("[FemFlow] Não foi possível registrar push token:", err);
    }
  },

  async sendTokenToBackend(token, userId, deviceId, lang) {
    await FEMFLOW.post({
      action: "register_push_token",
      userId,
      deviceId,
      platform: "web",
      lang,
      pushToken: token
    });

    localStorage.setItem(this.sentKey, "yes");
    localStorage.removeItem(this.pendingKey);
  },

  async flushPendingToken() {
    const userId = localStorage.getItem("femflow_id") || "";
    if (!userId) return;

    const token =
      localStorage.getItem(this.pendingKey) ||
      localStorage.getItem(this.tokenKey) ||
      "";
    if (!token) return;

    const deviceId = FEMFLOW.getDeviceId();
    const lang = FEMFLOW.lang || "pt";

    try {
      await this.sendTokenToBackend(token, userId, deviceId, lang);
    } catch (err) {
      console.warn("[FemFlow] Falha ao enviar token pendente:", err);
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  FEMFLOW.registerServiceWorker();
  FEMFLOW.push?.flushPendingToken?.();
  FEMFLOW.notifications?.recountUnread?.();
});

/* ============================================================
   🔔 NOTIFICAÇÕES INTERNAS — BASE FUNCIONAL
============================================================ */
FEMFLOW.notifications = {
  dbName: "femflow-notifications",
  storeName: "notifications",
  unreadKey: "femflow_notifications_unread",
  _dbPromise: null,

  _openDb() {
    if (!("indexedDB" in window)) {
      return Promise.resolve(null);
    }

    if (this._dbPromise) return this._dbPromise;

    this._dbPromise = new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("data", "data");
          store.createIndex("lida", "lida");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });

    return this._dbPromise;
  },

  _normalizePayload(payload = {}, origin = "sistema") {
    const data = payload?.data || {};
    const titulo =
      payload?.notification?.title ||
      data.title ||
      data.titulo ||
      "FemFlow";
    const mensagem =
      payload?.notification?.body ||
      data.body ||
      data.mensagem ||
      "";
    const tipo = data.tipo || data.type || "sistema";
    const id =
      data.id ||
      payload?.messageId ||
      `ff-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return {
      id: String(id),
      titulo,
      mensagem,
      tipo,
      origem: origin,
      data: data.data || new Date().toISOString(),
      lida: false
    };
  },

  _setUnreadCount(value) {
    localStorage.setItem(this.unreadKey, String(Math.max(0, value)));
    FEMFLOW.dispatch?.("notifications", { unread: value });
  },

  _incrementUnread() {
    const current = Number(localStorage.getItem(this.unreadKey) || 0);
    this._setUnreadCount(current + 1);
  },

  getUnreadCount() {
    return Number(localStorage.getItem(this.unreadKey) || 0);
  },

  async _saveToDb(notification) {
    const db = await this._openDb();
    if (!db) return;

    await new Promise((resolve) => {
      const tx = db.transaction(this.storeName, "readwrite");
      tx.objectStore(this.storeName).put(notification);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  },

  async save(notification) {
    const normalized = notification?.id
      ? notification
      : this._normalizePayload(notification, "sistema");

    await this._saveToDb(normalized);

    if (!normalized.lida) {
      this._incrementUnread();
    }

    const userId = localStorage.getItem("femflow_id") || "";
    if (userId && typeof firebase !== "undefined" && firebase.firestore) {
      try {
        await firebase
          .firestore()
          .collection("usuarios")
          .doc(userId)
          .collection("notificacoes")
          .doc(normalized.id)
          .set(normalized, { merge: true });
      } catch (err) {
        FEMFLOW.warn?.("[FemFlow] Falha ao salvar notificação no Firestore:", err);
      }
    }

    return normalized;
  },

  async saveFromPush(payload, origin = "push") {
    const normalized = this._normalizePayload(payload, origin);
    return this.save(normalized);
  },

  async listAll() {
    const db = await this._openDb();
    if (!db) return [];

    const items = await new Promise((resolve) => {
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });

    return (items || []).sort((a, b) => {
      const dateA = new Date(a?.data || 0).getTime();
      const dateB = new Date(b?.data || 0).getTime();
      return dateB - dateA;
    });
  },

  async markAsRead(id) {
    if (!id) return;
    const db = await this._openDb();
    if (!db) return;

    await new Promise((resolve) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);
      request.onsuccess = () => {
        const item = request.result;
        if (!item) {
          resolve();
          return;
        }
        item.lida = true;
        store.put(item);
      };
      request.onerror = () => resolve();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    await this.recountUnread();
  },

  async markAllRead() {
    const db = await this._openDb();
    if (!db) return;

    await new Promise((resolve) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result || [];
        items.forEach((item) => {
          item.lida = true;
          store.put(item);
        });
      };
      request.onerror = () => resolve();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    await this.recountUnread();
  },

  async recountUnread() {
    const db = await this._openDb();
    if (!db) return;

    const unread = await new Promise((resolve) => {
      const tx = db.transaction(this.storeName, "readonly");
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result || [];
        resolve(items.filter((item) => !item.lida).length);
      };
      request.onerror = () => resolve(0);
    });

    this._setUnreadCount(unread);
  }
};

document.addEventListener("femflow:push", (event) => {
  const payload = event.detail?.payload || {};
  FEMFLOW.notifications?.saveFromPush?.(payload, "push");
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "FEMFLOW_PUSH_STORED") {
      FEMFLOW.notifications?.recountUnread?.();
    }
  });
}

/* ============================================================
   🔔 PUSH INTELIGENTE — FEMFLOW
============================================================ */
FEMFLOW.smartPush = {
  storageKey: "femflow_smart_push_state",
  dailyLimit: 1,
  weeklyLimits: {
    treino: 5,
    fase: 2,
    respiracao: 2,
    followme: 3
  },
  hoursByType: {
    treino: { start: 7, end: 11 },
    fase: { start: 8, end: 20 },
    respiracao: { start: 10, end: 20 },
    followme: { start: 8, end: 20 }
  },
  _state: null,

  _loadState() {
    if (this._state) return this._state;
    try {
      this._state = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
    } catch (err) {
      this._state = {};
    }
    return this._state;
  },

  _saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this._state || {}));
  },

  _getWeekKey(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  },

  _withinHours(type) {
    const range = this.hoursByType[type];
    if (!range) return true;
    const hour = new Date().getHours();
    return hour >= range.start && hour <= range.end;
  },

  _getPhaseLabel(phase) {
    const map = {
      menstrual: "menstrual",
      follicular: "folicular",
      ovulatory: "ovulatória",
      luteal: "lútea"
    };
    return map[String(phase || "").toLowerCase()] || String(phase || "");
  },

  _daysBetween(dateKeyA, dateKeyB) {
    if (!dateKeyA || !dateKeyB) return null;
    const a = new Date(`${dateKeyA}T00:00:00`);
    const b = new Date(`${dateKeyB}T00:00:00`);
    const diff = Math.abs(b - a);
    return Math.floor(diff / 86400000);
  },

  _getContext() {
    const todayKey = FEMFLOW.getLocalDateKey();
    const lastTreinoIso = localStorage.getItem("femflow_last_treino") || "";
    const lastTreinoKey = lastTreinoIso ? FEMFLOW.getLocalDateKey(lastTreinoIso) : "";
    const fase = localStorage.getItem("femflow_fase") || "";
    const produto = localStorage.getItem("femflow_produto") || "";
    const enfase = localStorage.getItem("femflow_enfase") || "";
    const hasPersonal = localStorage.getItem("femflow_has_personal") === "true";
    const enduranceReady =
      localStorage.getItem("femflow_endurance_setup_done") === "true" ||
      Boolean(localStorage.getItem("femflow_endurance_config"));
    const treinoDisponivel =
      Boolean(enfase && enfase !== "nenhuma") || hasPersonal || enduranceReady;
    const isFollowMe =
      String(produto || "").startsWith("followme_") || String(enfase || "").startsWith("followme_");
    const lastProgramDay = Number(localStorage.getItem("femflow_last_program_day") || 0);
    const diaPrograma = Number(localStorage.getItem("femflow_diaPrograma") || 1);
    const treinoHoje = lastTreinoKey === todayKey;
    const diasSemTreino =
      lastTreinoKey && todayKey ? this._daysBetween(lastTreinoKey, todayKey) : null;

    return {
      todayKey,
      fase,
      faseLabel: this._getPhaseLabel(fase),
      treinoDisponivel,
      treinoHoje,
      diasSemTreino,
      isFollowMe,
      diaPrograma,
      lastProgramDay,
      enfase
    };
  },

  _canSend(type) {
    if (!("Notification" in window)) return false;
    if (Notification.permission !== "granted") return false;

    const state = this._loadState();
    const todayKey = FEMFLOW.getLocalDateKey();
    const weekKey = this._getWeekKey();

    if (state.lastDailyKey === todayKey) return false;
    if (state.lastSentByType?.[type] === todayKey) return false;

    const weeklyLimit = this.weeklyLimits[type];
    if (weeklyLimit) {
      const weeklyCount = state.weeklyCounts?.[weekKey]?.[type] || 0;
      if (weeklyCount >= weeklyLimit) return false;
    }

    if (!this._withinHours(type)) return false;

    return true;
  },

  _recordSend(type, context = {}) {
    const state = this._loadState();
    const todayKey = FEMFLOW.getLocalDateKey();
    const weekKey = this._getWeekKey();

    state.lastDailyKey = todayKey;
    state.lastSentByType = state.lastSentByType || {};
    state.lastSentByType[type] = todayKey;

    state.weeklyCounts = state.weeklyCounts || {};
    state.weeklyCounts[weekKey] = state.weeklyCounts[weekKey] || {};
    state.weeklyCounts[weekKey][type] = (state.weeklyCounts[weekKey][type] || 0) + 1;

    if (type === "followme" && context.diaPrograma) {
      state.followmeLastDayNotified = context.diaPrograma;
    }

    this._state = state;
    this._saveState();
  },

  _buildNotification(type, context) {
    const base = {
      url: "flowcenter.html",
      tipo: type
    };

    if (type === "treino") {
      return {
        title: "🏃 Seu treino de hoje já está disponível",
        body: "Quando você estiver pronta, seu corpo agradece.",
        data: { ...base, contexto: { treino: "dia" } }
      };
    }

    if (type === "fase") {
      return {
        title: `🌸 Seu corpo entrou na fase ${context.faseLabel} hoje`,
        body: "Que tal ouvir o que seu ritmo está pedindo?",
        data: { ...base, contexto: { fase: context.fase } }
      };
    }

    if (type === "respiracao") {
      return {
        title: "💨 Uma respiração curta pode te ajudar hoje",
        body: "Dois minutinhos já trazem presença.",
        data: { ...base, contexto: { sugestao: "respiracao" }, url: "respiracao.html" }
      };
    }

    if (type === "followme") {
      return {
        title: "✨ Novo dia do FollowMe liberado",
        body: "Vamos juntas no seu ritmo.",
        data: { ...base, contexto: { dia: context.diaPrograma }, url: "followme.html" }
      };
    }

    return null;
  },

  async _showSystemNotification({ title, body, data }) {
    if (!("Notification" in window)) return false;
    if (Notification.permission !== "granted") return false;

    try {
      const registration =
        (await navigator.serviceWorker?.ready?.catch(() => null)) ||
        (await FEMFLOW.registerServiceWorker?.());
      if (!registration?.showNotification) return false;

      await registration.showNotification(title, {
        body,
        data,
        icon: "./favicon.ico",
        badge: "./favicon.ico",
        tag: data?.tipo || "femflow"
      });
      return true;
    } catch (err) {
      FEMFLOW.warn?.("[FemFlow] Falha ao exibir notificação:", err);
      return false;
    }
  },

  async _storeInternalNotification({ title, body, data }) {
    const notification = {
      id: `ff-local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      titulo: title,
      mensagem: body,
      tipo: data?.tipo || "sistema",
      origem: "smart",
      data: new Date().toISOString(),
      lida: false,
      contexto: data?.contexto || null
    };

    await FEMFLOW.notifications?.save?.(notification);
  },

  _evaluatePhaseChange(context) {
    if (!context.fase) return false;
    const state = this._loadState();
    const lastPhase = state.lastPhase || "";
    const lastPhaseSeenKey = state.lastPhaseSeenKey || "";
    const todayKey = context.todayKey;

    const changed = lastPhase && lastPhase !== context.fase;
    const daysSinceSeen = lastPhaseSeenKey
      ? this._daysBetween(lastPhaseSeenKey, todayKey)
      : null;
    const changeIsFresh = daysSinceSeen != null ? daysSinceSeen <= 1 : true;

    state.lastPhase = context.fase;
    state.lastPhaseSeenKey = todayKey;
    this._state = state;
    this._saveState();

    return changed && changeIsFresh;
  },

  _evaluateFollowMe(context) {
    if (!context.isFollowMe) return null;
    if (!context.diaPrograma) return null;

    const state = this._loadState();
    const lastNotifiedDay = Number(state.followmeLastDayNotified || 0);

    if (context.diaPrograma > lastNotifiedDay) {
      return "novo_dia";
    }

    const diasSemTreino = context.diasSemTreino ?? 0;
    const atrasada = diasSemTreino >= 2 && context.lastProgramDay < context.diaPrograma;
    if (atrasada) {
      return "atraso";
    }

    return null;
  },

  _evaluateRespiracao(context) {
    const fase = String(context.fase || "").toLowerCase();
    const faseDesacelera = ["menstrual", "luteal"].includes(fase);
    const faseFoco = ["follicular", "ovulatory"].includes(fase);
    const diasSemTreino = context.diasSemTreino ?? 0;

    return faseDesacelera || faseFoco || diasSemTreino >= 3;
  },

  async _send(type, context) {
    if (!this._canSend(type)) return false;
    const payload = this._buildNotification(type, context);
    if (!payload) return false;

    const shown = await this._showSystemNotification(payload);
    if (!shown) return false;

    await this._storeInternalNotification(payload);
    this._recordSend(type, context);
    return true;
  },

  async evaluate() {
    const context = this._getContext();
    if (!context.fase && !context.treinoDisponivel) return;

    if (this._evaluatePhaseChange(context)) {
      if (await this._send("fase", context)) return;
    }

    const followmeStatus = this._evaluateFollowMe(context);
    if (followmeStatus) {
      if (await this._send("followme", context)) return;
    }

    if (context.treinoDisponivel && !context.treinoHoje) {
      if (await this._send("treino", context)) return;
    }

    if (this._evaluateRespiracao(context)) {
      await this._send("respiracao", context);
    }
  }
};

window.addEventListener("femflow:ready", () => {
  setTimeout(() => {
    FEMFLOW.smartPush?.evaluate?.();
  }, 1200);
});

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    FEMFLOW.smartPush?.evaluate?.();
  }, 1800);
});

FEMFLOW.toggleBodyScroll = function (locked) {
  document.body.classList.toggle("ff-modal-open", locked);
};
/* ==========================================================
   FEMFLOW OFFICIAL GLOBAL SPLASH (PREMIUM)
   - Fade in/out
   - Scroll lock
   - Click block
   - Concurrency lock count
========================================================== */

(function () {
  let lockCount = 0;
  let lastScrollY = 0;

  function lockScroll() {
    // Guarda posição e trava o body sem “pular”
    lastScrollY = window.scrollY || window.pageYOffset || 0;
    document.documentElement.classList.add("ff-scroll-lock");
    document.body.classList.add("ff-scroll-lock");
    document.body.style.top = `-${lastScrollY}px`;
  }

  function unlockScroll() {
    document.documentElement.classList.remove("ff-scroll-lock");
    document.body.classList.remove("ff-scroll-lock");
    const top = document.body.style.top;
    document.body.style.top = "";
    // restaura posição
    const y = top ? Math.abs(parseInt(top, 10) || 0) : lastScrollY;
    window.scrollTo(0, y);
  }

  function ensureBox() {
    let box = document.getElementById("ff-loading");
    if (box) return box;

    box = document.createElement("div");
    box.id = "ff-loading";
    box.className = "ff-loading ff-hidden"; // começa invisível
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");

    box.innerHTML = `
      <div class="ff-loading-content ff-pulse">
        <img class="ff-loading-logo"
             src="assets/logofemflowterracotasf.png"
             alt="FemFlow"/>
        <div class="ff-loading-tagline">Train with Flow</div>
      </div>
    `;

    document.body.appendChild(box);
    return box;
  }

  function setBusy(isBusy) {
    // Marca estado global para leitores de tela / automações
    document.body.setAttribute("aria-busy", isBusy ? "true" : "false");
  }

  FEMFLOW.loading = {
    show() {
      const box = ensureBox();

      lockCount += 1;
      if (lockCount > 1) {
        // Já está visível, só mantém lock
        return;
      }

      setBusy(true);

      // trava scroll + bloqueia interação
      lockScroll();

      // Exibe com fade-in
      box.classList.remove("ff-hidden", "ff-hiding");
      box.classList.add("ff-show");

      // garantir pointer events sempre
      box.style.pointerEvents = "auto";
    },

    hide() {
      const box = document.getElementById("ff-loading");
      if (!box) return;

      lockCount = Math.max(0, lockCount - 1);
      if (lockCount > 0) return; // ainda há operações pendentes

      // Fade-out suave
      box.classList.remove("ff-show");
      box.classList.add("ff-hiding");

      // Após transição, esconder e liberar scroll
      const onEnd = () => {
        box.removeEventListener("transitionend", onEnd);

        box.classList.add("ff-hidden");
        box.classList.remove("ff-hiding");

        // libera
        unlockScroll();
        setBusy(false);
      };

      // fallback: se não disparar transitionend (ou reduced motion)
      box.addEventListener("transitionend", onEnd);
      setTimeout(() => {
        if (!box.classList.contains("ff-hidden")) {
          try {
            box.removeEventListener("transitionend", onEnd);
          } catch (e) {}
          box.classList.add("ff-hidden");
          box.classList.remove("ff-hiding");
          unlockScroll();
          setBusy(false);
        }
      }, 450);
    },

    reset() {
      // utilitário para emergências (ex.: crash)
      lockCount = 0;
      const box = document.getElementById("ff-loading");
      if (box) {
        box.classList.add("ff-hidden");
        box.classList.remove("ff-show", "ff-hiding");
      }
      unlockScroll();
      setBusy(false);
    },

    getLockCount() {
      return lockCount;
    }
  };
})();

FEMFLOW.log = function (...args) {
  if (localStorage.getItem("femflow_dev") === "true") {
    console.log("[FemFlow]", ...args);
  }
};

FEMFLOW.getLocalDateKey = function (date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};



FEMFLOW.getSession = function () {
  return {
    deviceId: FEMFLOW.getDeviceId(),
    sessionToken: FEMFLOW.getSessionToken(),
    sessionExpira: FEMFLOW.getSessionExpira()
  };
};
/* ============================================================
   🌐 POST SEGURO — inclui sessão automaticamente
============================================================ */

FEMFLOW.post = async function (payload) {
  if (!payload || !payload.action) {
    console.warn("⚠️ FEMFLOW.post sem action:", payload);
    return { status: "ignored", msg: "missing_action" };
  }

  const session = FEMFLOW.getSession();
  const expiraMs = Date.parse(session.sessionExpira || "");
  if (session.sessionExpira && Number.isFinite(expiraMs) && Date.now() > expiraMs) {
    FEMFLOW.clearSession();
    FEMFLOW.toast?.("Sessão expirada. Faça login novamente.", true);
    return { status: "denied", msg: "session_expired_local" };
  }

  const body = {
    ...payload,
    ...session
  };

  let resp;
  try {
    const response = await fetch(FEMFLOW.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    resp = await response.json();
  } catch (err) {
    FEMFLOW.toast?.("Reconectando…");
    throw err;
  }

  // Sessão inválida ou bloqueada
  if (resp?.status === "blocked" || resp?.status === "denied") {
    FEMFLOW.toast?.("Sessão inválida. Faça login novamente.", true);
    FEMFLOW.clearSession();

localStorage.removeItem("femflow_auth");
localStorage.removeItem("femflow_id");
localStorage.removeItem("femflow_email");
// ❗ NÃO remover femflow_device_id
    location.href = "index.html";
    throw new Error("Sessão inválida");
  }

  return resp;
};

FEMFLOW.isNativeIOS = function () {
  return Boolean(FEMFLOW.checkout?.isIOS?.());
};

FEMFLOW.getNativePurchasesPlugin = function () {
  return window.NativePurchases || window.Capacitor?.Plugins?.NativePurchases || null;
};

FEMFLOW.updateEntitlementsFromPayload = function (payload = {}) {
  const acessoApp = payload.acesso_app === true || payload.acesso_app === "true";
  const modoPersonalPayload = payload.modo_personal === true || payload.modo_personal === "true";
  const modoPersonal = acessoApp && modoPersonalPayload;
  const produtoAtual = String(localStorage.getItem("femflow_produto") || "").toLowerCase().trim();
  const produtoPerfil = String(payload.produto || payload.produto_perfil || "").toLowerCase().trim();

  localStorage.setItem("femflow_ativa", acessoApp ? "true" : "false");

  if (acessoApp) {
    localStorage.setItem("femflow_produto", "acesso_app");
  } else if (produtoPerfil === "trial_app") {
    localStorage.setItem("femflow_produto", "trial_app");
  } else if (!produtoAtual) {
    localStorage.setItem("femflow_produto", "trial_app");
  }

  localStorage.setItem("femflow_mode_personal", modoPersonal ? "true" : "false");
  localStorage.setItem("femflow_has_personal", modoPersonal ? "true" : "false");
};

FEMFLOW.refreshEntitlements = async function () {
  const id = localStorage.getItem("femflow_id") || "";
  const email = localStorage.getItem("femflow_email") || "";
  if (!id && !email) return { status: "ignored", msg: "missing_user" };

  const resp = await FEMFLOW.post({
    action: "entitlements_status",
    id,
    email
  });

  if (resp?.status === "ok") {
    FEMFLOW.updateEntitlementsFromPayload(resp);
    document.dispatchEvent(new CustomEvent("femflow:entitlementsUpdated", { detail: resp }));
  }

  return resp;
};

FEMFLOW.checkout = FEMFLOW.checkout || {};

FEMFLOW.iap = Object.assign(FEMFLOW.iap || {}, {
  pluginReady: false,
  products: [],
  initialized: false,
  _purchaseInFlight: false,
  _restoreInFlight: false,

  _statusCopy() {
    const lang = String(FEMFLOW.lang || "pt").slice(0, 2).toLowerCase();
    const copy = {
      success: { pt: "Assinatura ativa. Acesso liberado.", en: "Subscription active. Access unlocked.", fr: "Abonnement actif. Accès débloqué." },
      cancelled: { pt: "Compra cancelada.", en: "Purchase cancelled.", fr: "Achat annulé." },
      genericError: { pt: "Não foi possível concluir. Tente novamente.", en: "Could not complete it. Please try again.", fr: "Impossible de finaliser. Réessayez." },
      processing: { pt: "Processando...", en: "Processing...", fr: "Traitement..." }
    };
    const pick = (bucket) => copy[bucket]?.[lang] || copy[bucket]?.pt || "";
    return {
      success: pick("success"),
      cancelled: pick("cancelled"),
      genericError: pick("genericError"),
      processing: pick("processing")
    };
  },

  async init() {
    if (!FEMFLOW.isNativeIOS()) return { status: "error", message: "Somente disponível no iOS nativo." };
    if (this.initialized) return { status: "ok", message: "IAP inicializado." };

    const plugin = FEMFLOW.getNativePurchasesPlugin();
    if (!plugin) {
      FEMFLOW.toast?.("IAP em configuração");
      return { status: "error", message: "IAP em configuração" };
    }

    if (typeof plugin.initialize === "function") {
      await plugin.initialize({ storekit: 2 });
    } else if (typeof plugin.init === "function") {
      await plugin.init({ storekit: 2 });
    }

    this.pluginReady = true;
    this.initialized = true;
    return { status: "ok", message: "IAP pronto." };
  },

  async listProducts(productIds = FEMFLOW.IAP_PRODUCT_IDS) {
    if (!FEMFLOW.isNativeIOS()) return { status: "error", message: "Somente disponível no iOS nativo.", products: [] };
    const initResult = await this.init();
    const plugin = FEMFLOW.getNativePurchasesPlugin();
    if (!plugin) return { status: "error", message: initResult.message || "IAP em configuração", products: [] };

    let result = [];
    if (typeof plugin.getProducts === "function") {
      result = await plugin.getProducts({ productIds });
    } else if (typeof plugin.listProducts === "function") {
      result = await plugin.listProducts({ productIds });
    } else {
      FEMFLOW.toast?.("IAP em configuração");
      return { status: "error", message: "IAP em configuração", products: [] };
    }

    const products = Array.isArray(result)
      ? result
      : Array.isArray(result?.products)
        ? result.products
        : [];
    this.products = products;
    return { status: "ok", message: "Produtos carregados.", products };
  },

  async activatePurchaseOnBackend({ productId, transactionId, originalTransactionId, purchaseDate, expiresDate, env, signedPayload, receipt, source }) {
    const id = localStorage.getItem("femflow_id") || "";
    const email = localStorage.getItem("femflow_email") || "";

    const correlationId = crypto?.randomUUID?.() || ("ff-iap-" + Date.now() + "-" + Math.random().toString(36).slice(2));
    const idempotencyKey = transactionId ? ("ios:" + transactionId) : correlationId;

    return FEMFLOW.post({
      action: "iap_apple_activate",
      id,
      email,
      userId: id,
      productId,
      transactionId,
      originalTransactionId,
      purchaseDate,
      expiresDate,
      env: env || FEMFLOW.ENV || "prod",
      signedPayload: signedPayload || "",
      receipt: receipt || "",
      source: source || "purchase",
      correlationId,
      idempotencyKey
    });
  },

  normalizeTransaction(tx = {}, productIdFallback = "") {
    return {
      productId: tx.productId || tx.productIdentifier || tx.product || productIdFallback,
      transactionId: String(tx.transactionId || tx.id || tx.transaction?.id || tx.originalTransactionId || ""),
      originalTransactionId: String(tx.originalTransactionId || tx.originalId || tx.originalTransaction?.id || ""),
      purchaseDate: tx.purchaseDate || tx.transactionDate || tx.purchasedAt || "",
      expiresDate: tx.expirationDate || tx.expiresDate || tx.expiryDate || "",
      env: tx.environment || tx.env || "",
      signedPayload: tx.signedPayload || tx.jwsRepresentation || "",
      receipt: tx.receipt || tx.transactionReceipt || "",
      isActive: tx.isActive !== false && tx.revoked !== true
    };
  },

  async purchase(productId) {
    if (!FEMFLOW.isNativeIOS()) {
      return { status: "error", message: "Somente disponível no iOS nativo." };
    }
    if (this._purchaseInFlight || this._restoreInFlight) {
      return { status: "error", message: this._statusCopy().processing };
    }

    this._purchaseInFlight = true;

    try {
      await this.init();
      const plugin = FEMFLOW.getNativePurchasesPlugin();
      if (!plugin) {
        FEMFLOW.toast?.("IAP em configuração");
        return { status: "error", message: "IAP em configuração" };
      }

      let rawTx = null;
      if (typeof plugin.purchaseProduct === "function") {
        rawTx = await plugin.purchaseProduct({ productId });
      } else if (typeof plugin.purchase === "function") {
        rawTx = await plugin.purchase({ productId });
      } else {
        FEMFLOW.toast?.("IAP em configuração");
        return { status: "error", message: "IAP em configuração" };
      }

      const tx = this.normalizeTransaction(rawTx, productId);
      if (!tx.productId || !tx.transactionId) {
        const cancelCode = String(rawTx?.code || rawTx?.errorCode || rawTx?.status || "").toLowerCase();
        const cancelMsg = String(rawTx?.message || rawTx?.errorMessage || "").toLowerCase();
        const wasCancelled = cancelCode.includes("cancel") || cancelMsg.includes("cancel");
        if (wasCancelled) return { status: "cancelled", message: this._statusCopy().cancelled };
        return { status: "error", message: "Transação inválida." };
      }

      const backendActivation = await this.activatePurchaseOnBackend(Object.assign({}, tx, { source: "purchase" }));
      const backendOk = backendActivation && String(backendActivation.status || "").toLowerCase() === "ok";

      if (!backendOk) {
        return {
          status: "error",
          transactionId: tx.transactionId,
          message: String(backendActivation?.msg || backendActivation?.message || "Ativação não confirmada no servidor."),
          code: String(backendActivation?.code || backendActivation?.msg || "iap_backend_activation_failed"),
          reason: backendActivation?.reason || "",
          entitlementStatus: backendActivation?.entitlementStatus || "",
          sourceOfTruth: backendActivation?.sourceOfTruth || "server"
        };
      }

      await FEMFLOW.refreshEntitlements();
      document.dispatchEvent(new CustomEvent("femflow:entitlementsUpdated", { detail: { source: "iap_purchase", transactionId: tx.transactionId, backend: backendActivation } }));
      return {
        status: "ok",
        transactionId: tx.transactionId,
        message: this._statusCopy().success,
        provider: backendActivation?.provider || "apple_iap",
        entitlementStatus: backendActivation?.entitlementStatus || "active",
        sourceOfTruth: backendActivation?.sourceOfTruth || "server"
      };
    } catch (err) {
      const code = String(err?.code || err?.errorCode || "").toLowerCase();
      const msg = String(err?.message || "").toLowerCase();
      const wasCancelled = code.includes("cancel") || msg.includes("cancel");
      if (wasCancelled) return { status: "cancelled", message: this._statusCopy().cancelled };
      return { status: "error", message: this._statusCopy().genericError };
    } finally {
      this._purchaseInFlight = false;
    }
  },

  async restore() {
    if (!FEMFLOW.isNativeIOS()) {
      return { status: "error", restoredCount: 0, message: "Somente disponível no iOS nativo." };
    }
    if (this._purchaseInFlight || this._restoreInFlight) {
      return { status: "error", restoredCount: 0, message: this._statusCopy().processing };
    }

    this._restoreInFlight = true;

    try {
      await this.init();
      const plugin = FEMFLOW.getNativePurchasesPlugin();
      if (!plugin) {
        FEMFLOW.toast?.("IAP em configuração");
        return { status: "error", restoredCount: 0, message: "IAP em configuração" };
      }

      let restoredRaw = [];
      if (typeof plugin.restorePurchases === "function") {
        restoredRaw = await plugin.restorePurchases();
      } else if (typeof plugin.restore === "function") {
        restoredRaw = await plugin.restore();
      } else {
        FEMFLOW.toast?.("IAP em configuração");
        return { status: "error", restoredCount: 0, message: "IAP em configuração" };
      }

      const entries = Array.isArray(restoredRaw)
        ? restoredRaw
        : Array.isArray(restoredRaw?.purchases)
          ? restoredRaw.purchases
          : [];

      const activeTransactions = entries
        .map(tx => this.normalizeTransaction(tx))
        .filter(tx => tx.isActive && tx.productId && tx.transactionId);

      const id = localStorage.getItem("femflow_id") || "";
      const email = localStorage.getItem("femflow_email") || "";
      const correlationId = crypto?.randomUUID?.() || ("ff-restore-" + Date.now() + "-" + Math.random().toString(36).slice(2));

      const restoreResp = await FEMFLOW.post({
        action: "iap_apple_restore",
        id,
        email,
        userId: id,
        source: "restore",
        correlationId,
        transactions: activeTransactions.map((tx) => Object.assign({}, tx, {
          idempotencyKey: tx.transactionId ? ("ios:" + tx.transactionId) : ""
        }))
      });

      if (!restoreResp || (restoreResp.status !== "ok" && restoreResp.status !== "partial")) {
        return { status: "error", restoredCount: 0, message: this._statusCopy().genericError };
      }

      await FEMFLOW.refreshEntitlements();
      document.dispatchEvent(new CustomEvent("femflow:entitlementsUpdated", { detail: { source: "iap_restore", restoredCount: activeTransactions.length } }));
      return {
        status: "ok",
        restoredCount: activeTransactions.length,
        message: this._statusCopy().success
      };
    } catch (err) {
      return { status: "error", restoredCount: 0, message: this._statusCopy().genericError };
    } finally {
      this._restoreInFlight = false;
    }
  }
});

FEMFLOW.iap.bindPaywallButtons = function () {
  const appBtn = document.querySelector('[data-iap-product="app_access"], #btnAcessoApp, #btnIapAcessoApp');
  const personalBtn = document.querySelector('[data-iap-product="personal"], #btnPersonal, #btnIapPersonal');
  const restoreBtn = document.querySelector('[data-iap-action="restore"], #btnRestorePurchases, #btnRestaurarCompras');

  if (appBtn) {
    appBtn.addEventListener("click", async (event) => {
      if (!FEMFLOW.isNativeIOS()) return;
      event.preventDefault();
      await FEMFLOW.iap.purchase(FEMFLOW.IAP_APP_ACCESS_PRODUCT_ID);
    });
  }

  if (personalBtn) {
    personalBtn.addEventListener("click", async (event) => {
      if (!FEMFLOW.isNativeIOS()) return;
      event.preventDefault();
      await FEMFLOW.iap.purchase(FEMFLOW.IAP_PERSONAL_PRODUCT_ID);
    });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener("click", async (event) => {
      if (!FEMFLOW.isNativeIOS()) return;
      event.preventDefault();
      await FEMFLOW.iap.restore();
    });
  }
};


/* ===========================================================
   DIA PROGRAMA — CONTADOR CONTÍNUO (GLOBAL)
=========================================================== */
FEMFLOW.getDiaPrograma = async function () {

  // 1) tentar ler do localStorage
  let d = Number(localStorage.getItem("femflow_diaPrograma"));

  if (d && !isNaN(d) && d > 0) {
    return d; // retorno imediato
  }

  // 2) fallback → buscar no backend
  const id = localStorage.getItem("femflow_id");
  if (!id) return 1;

  try {
   const resp = await FEMFLOW.post({
  action: "getdiaprograma",
  id
});


    if (resp?.diaPrograma > 0) {
      localStorage.setItem("femflow_diaPrograma", resp.diaPrograma);
      return resp.diaPrograma;
    }
  } catch (e) {
    console.warn("⚠️ Erro ao buscar DiaPrograma do backend:", e);
  }

  // fallback final
  localStorage.setItem("femflow_diaPrograma", "1");
  return 1;
};


FEMFLOW.setDiaPrograma = async function (novoValor) {
  novoValor = Number(novoValor) || 1;

  // Local
  localStorage.setItem("femflow_diaPrograma", String(novoValor));

  // Backend
  const id = localStorage.getItem("femflow_id");
  if (!id) return;

  try {
    await FEMFLOW.post({
  action: "setDiaPrograma",
  id,
  diaPrograma: novoValor
});

 } catch (e) {
    console.warn("⚠️ Falhou envio DiaPrograma para backend:", e);
  }
};


FEMFLOW.incrementarDiaPrograma = async function () {
  let d = Number(localStorage.getItem("femflow_diaPrograma")) || 1;
  d++;

  await FEMFLOW.setDiaPrograma(d);

  return d;
};


FEMFLOW.reiniciarDiaPrograma = async function () {
  await FEMFLOW.setDiaPrograma(1);
  return 1;
};


/* ===========================================================
   2. ROUTER
=========================================================== */

FEMFLOW.router = pag => {
  const [beforeHash, hashPart] = String(pag || "").split("#");
  const [pathPart, queryPart] = beforeHash.split("?");
  const destinoBase = pathPart.endsWith(".html")
    ? pathPart
    : `${pathPart}.html`;
  const params = new URLSearchParams(queryPart || "");

  if (localStorage.getItem("femflow_mode_personal") === "true") {
    params.set("personal", "1");
  }

  const queryString = params.toString();
  const destino = queryString ? `${destinoBase}?${queryString}` : destinoBase;
  const current = (location.pathname.split("/").pop() || "").toLowerCase();

  if (FEMFLOW.isCapacitorIOS?.() && FEMFLOW.isLegacyEbooksPath?.(destinoBase)) {
    console.warn("[iOS hardening] Navegação bloqueada para ebooks legados:", destinoBase);
    FEMFLOW.toast?.("Conteúdo indisponível no iOS nativo.");
    const fallback = current === "home.html" ? null : "home.html";
    if (!fallback) return;
    FEMFLOW.pageTransition?.start();
    location.href = fallback;
    return;
  }

  if (current === "index.html" && destinoBase === "index.html") return;
  FEMFLOW.pageTransition?.start();
  location.href = hashPart ? `${destino}#${hashPart}` : destino;
};

document.addEventListener("DOMContentLoaded", () => {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    document.documentElement.classList.add("ff-reduce-motion");
  }
  FEMFLOW.pageTransition?.finish();
  FEMFLOW.installBackHandler?.();
  FEMFLOW.setupOfflineBanner?.();

  if (FEMFLOW.isCapacitorIOS?.()) {
    const currentPath = String(location.pathname || "").toLowerCase();
    const relativePath = currentPath.includes("/app/")
      ? currentPath.split("/app/").pop()
      : currentPath.replace(/^\/+/, "");

    if (FEMFLOW.isLegacyEbooksPath?.(relativePath)) {
      console.warn("[iOS hardening] Acesso direto bloqueado para rota legada:", relativePath);
      const fallback = relativePath.startsWith("ebooks/") ? "../home.html" : "home.html";
      location.replace(fallback);
      return;
    }

    document.querySelectorAll('a[href*="hotmart.com"], [data-hotmart-link], .btn-hotmart').forEach((el) => {
      const container = el.closest("li, .menu-item, .header-actions") || el;
      container.classList.add("hidden");
      if (container.style) container.style.display = "none";
    });
  }

  document.addEventListener("keydown", (event) => FEMFLOW.trapModalFocus?.(event));

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, .card, .home-card, .tool");
    if (!target) return;
    target.classList.add("pressed");
    setTimeout(() => target.classList.remove("pressed"), 150);

    const tag = String(target.id || target.className || "").toLowerCase();
    const shouldHaptic = ["salvar", "confirm", "concluir"].some((token) => tag.includes(token));
    if (shouldHaptic) FEMFLOW.haptics.light();
  });
});


/* ===========================================================
   3. HEADER
=========================================================== */

FEMFLOW.renderVipBadge = function () {
  const id = localStorage.getItem("femflow_id");
  const produto = localStorage.getItem("femflow_produto");
  const isVip = Boolean(id) && String(produto || "").toLowerCase() === "vip";
  const existing = document.getElementById("ffVipBadge");

  if (!isVip) {
    existing?.remove();
    return;
  }

  if (!document.getElementById("ffVipBadgeStyle")) {
    const style = document.createElement("style");
    style.id = "ffVipBadgeStyle";
    style.textContent = `
      #ffVipBadge {
        position: fixed;
        top: 10px;
        right: 12px;
        z-index: 120000;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(51, 89, 83, 0.15);
        color: #335953;
        border: 1px solid rgba(51, 89, 83, 0.35);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        backdrop-filter: blur(6px);
        pointer-events: none;
      }

      body.dark #ffVipBadge {
        background: rgba(209, 166, 151, 0.2);
        color: #f4e7e1;
        border-color: rgba(209, 166, 151, 0.5);
      }

      @media (max-width: 600px) {
        #ffVipBadge {
          top: 8px;
          right: 8px;
          font-size: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  if (!existing) {
    const badge = document.createElement("div");
    badge.id = "ffVipBadge";
    badge.textContent = "VIP";
    document.body.appendChild(badge);
  }
};

FEMFLOW.inserirHeaderApp = function () {
  if (document.querySelector("#femflowHeader")) return;

  const h = document.createElement("header");
  h.id = "femflowHeader";
  h.innerHTML = `
    <img src="./assets/logofemflowterracotasf.png" class="ff-logo">
    <button id="ffNotificationsBtn" class="ff-notifications-btn" aria-label="${FEMFLOW.t("notifications.openAria")}" aria-haspopup="dialog">
      <span class="ff-icon ff-icon-bell" aria-hidden="true"></span>
      <span id="ffNotificationsBadge" class="ff-notifications-badge" aria-hidden="true"></span>
    </button>
    <button id="ffMenuBtn" class="ff-menu-btn" aria-label="${FEMFLOW.t("menu.title")}">
      <span class="ff-icon ff-icon-menu" aria-hidden="true"></span>
    </button>
  `;

  document.body.prepend(h);
  document.body.classList.add("ff-has-header");
  FEMFLOW.renderVipBadge?.();

  h.querySelector("#ffMenuBtn").onclick = () =>
    document.querySelector(".ff-menu-modal")?.classList.add("active");
};

/* ===========================================================
   🌸 COMMIT DE MUDANÇAS ESTRUTURAIS (NÍVEL / CICLO)
   Fonte da verdade: BACKEND
=========================================================== */
FEMFLOW.normalizePerfilHormonal = function (perfil, fallback = "regular") {
  const p = String(perfil || "").trim().toLowerCase();
  if (!p || p === "undefined" || p === "null") return fallback;
  if (p === "contraceptivo") return "diu";
  if (p === "diuhormonal") return "diu_hormonal";
  if (p.endsWith("_quiz")) return p.replace(/_quiz$/, "");
  return p;
};

FEMFLOW.commitMudanca = async function ({ tipo, payload = {} }) {
  const id = localStorage.getItem("femflow_id");
  if (!id) return;

  FEMFLOW.log?.("Commit mudança:", tipo, payload);

  try {
    // ----------------------------
    // 🔁 MUDANÇA DE NÍVEL
    // ----------------------------
    if (tipo === "nivel" && payload.nivel) {
      const nivelNorm = String(payload.nivel || "").toLowerCase().trim();
      if (!nivelNorm) {
        return;
      }
      await FEMFLOW.post({
        action: "setnivel",
        id,
        nivel: nivelNorm
      });

      // reset de programa é OBRIGATÓRIO
      await FEMFLOW.post({
        action: "resetprograma",
        id
      });

      localStorage.setItem("femflow_nivel", nivelNorm);
      localStorage.removeItem("femflow_diaPrograma");
    }

    // ----------------------------
    // 🌙 MUDANÇA DE CICLO
    // ----------------------------
    if (tipo === "ciclo") {
      if (payload.perfilHormonal) {
        await FEMFLOW.post({
          action: "setperfilhormonal",
          id,
          perfil: payload.perfilHormonal
        });
      }

      if (payload.startDate) {
        await FEMFLOW.post({
          action: "setciclostart",
          id,
          startDate: payload.startDate
        });
      }

      // sempre resetar programa
      await FEMFLOW.post({
        action: "resetprograma",
        id
      });

      if (payload.perfilHormonal) {
        localStorage.setItem("femflow_perfilHormonal", FEMFLOW.normalizePerfilHormonal(payload.perfilHormonal));
      }

      if (payload.startDate) {
        localStorage.setItem("femflow_startDate", payload.startDate);
      }

      localStorage.removeItem("femflow_diaPrograma");
    }

  } catch (err) {
    console.error("Erro commitMudanca:", err);
    FEMFLOW.toast?.("Erro ao aplicar mudança. Tente novamente.");
  }
};



/* ===========================================================
   4. SYNC (NÃO altera produto)
=========================================================== */

FEMFLOW.carregarCicloBackend = async function () {
  FEMFLOW.log("🔄 SYNC ciclo…");

  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const resp = await fetch(`${FEMFLOW.SCRIPT_URL}?action=sync&id=${id}`).then(r => r.json());
    FEMFLOW.log("📌 SYNC:", resp);

    if (!resp || !resp.fase) return null;

    // Dados hormonais — sem alterar produto/ativa/personal
    localStorage.setItem("femflow_fase", resp.fase);
    localStorage.setItem("femflow_diaCiclo", resp.diaCiclo);
    localStorage.setItem("femflow_perfilHormonal", FEMFLOW.normalizePerfilHormonal(resp.perfilHormonal));
    if (resp.nivel) {
      localStorage.setItem("femflow_nivel", resp.nivel);
    }
    const enfaseAtual = localStorage.getItem("femflow_enfase");
    const extraAtivo = localStorage.getItem("femflow_treino_extra") === "true";
    const enfaseAtualExtra = String(enfaseAtual || "").toLowerCase().startsWith("extra_");
    const enfaseBackend = String(resp.enfase || "").toLowerCase().trim();
    const enfaseValida = Boolean(enfaseBackend && enfaseBackend !== "nenhuma");
    if (extraAtivo && enfaseAtualExtra) {
      if (enfaseValida && !localStorage.getItem("femflow_enfase_base")) {
        localStorage.setItem("femflow_enfase_base", enfaseBackend);
      }
    } else if (enfaseValida) {
      localStorage.setItem("femflow_enfase", enfaseBackend);
    }
    localStorage.setItem("femflow_cycleLength", resp.ciclo_duracao);
    localStorage.setItem("femflow_startDate", resp.data_inicio);

    return resp;

  } catch (err) {
    FEMFLOW.error("❌ SYNC falhou:", err);
    return null;
  }
};

/* ===========================================================
   5. MENU LATERAL
=========================================================== */

FEMFLOW.renderMenuLateral = function () {
  const modal = document.querySelector(".ff-menu-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="ff-menu-box">
      <h2 class="ff-menu-title">${FEMFLOW.t("menu.title")}</h2>

      <button class="ff-menu-op ff-close" data-go="fechar" aria-label="${FEMFLOW.t("menu.fechar")}">×</button>
      <button class="ff-menu-op" data-go="idioma">${FEMFLOW.t("menu.idioma")}</button>
      <button class="ff-menu-op" data-go="sac">${FEMFLOW.t("menu.sac")}</button>
      <button class="ff-menu-op" data-go="ciclo">${FEMFLOW.t("menu.ciclo")}</button>
      <button class="ff-menu-op" data-go="respiracao">${FEMFLOW.t("menu.respiracao")}</button>
      <button class="ff-menu-op" data-go="treinos">${FEMFLOW.t("menu.treinos")}</button>
      <button class="ff-menu-op" data-go="tema">${FEMFLOW.t("menu.tema")}</button>
      <button class="ff-menu-op" data-go="privacy">${FEMFLOW.t("menu.privacy")}</button>
      <button class="ff-menu-op" data-go="terms">${FEMFLOW.t("menu.terms")}</button>
      <button class="ff-menu-op" data-go="deleteAccount">${FEMFLOW.t("menu.deleteAccount")}</button>
      <button class="ff-menu-op" data-go="voltar">${FEMFLOW.t("menu.voltar")}</button>

      <button class="ff-logout" data-go="logout">${FEMFLOW.t("menu.sair")}</button>
    </div>
  `;

  modal.querySelectorAll(".ff-menu-op, .ff-logout").forEach(btn =>
    btn.onclick = () => FEMFLOW._acaoMenu(btn.dataset.go)
  );
};

FEMFLOW.inserirMenuLateral = function () {
  if (document.querySelector(".ff-menu-modal")) return;

  const modal = document.createElement("div");
  modal.className = "ff-menu-modal";

  document.body.appendChild(modal);

  FEMFLOW.renderMenuLateral();

  modal.onclick = e => {
    if (e.target.classList.contains("ff-menu-modal"))
      modal.classList.remove("active");
  };
};

/* ===========================================================
   5.1 NOTIFICAÇÕES — UI SIMPLES
=========================================================== */

FEMFLOW.inserirModalNotificacoes = function () {
  if (document.querySelector("#ff-notifications-modal")) return;

  const modal = document.createElement("div");
  modal.id = "ff-notifications-modal";
  modal.className = "ff-notifications-modal";
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="ff-notifications-box" role="dialog" aria-modal="true" aria-labelledby="ff-notifications-title">
      <div class="ff-notifications-header">
        <h2 id="ff-notifications-title">${FEMFLOW.t("notifications.title")}</h2>
        <button class="ff-notifications-close" type="button" aria-label="${FEMFLOW.t("notifications.closeAria")}">&times;</button>
      </div>
      <div id="ff-notifications-list" class="ff-notifications-list"></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) FEMFLOW.closeNotifications?.();
  });

  modal.querySelector(".ff-notifications-close")?.addEventListener("click", () => {
    FEMFLOW.closeNotifications?.();
  });
};

FEMFLOW.updateNotificationsBadge = function () {
  const badge = document.getElementById("ffNotificationsBadge");
  const btn = document.getElementById("ffNotificationsBtn");
  if (!badge || !btn) return;

  const unread = FEMFLOW.notifications?.getUnreadCount?.() || 0;
  if (unread > 0) {
    badge.textContent = unread > 99 ? "99+" : String(unread);
    badge.classList.add("is-visible");
    const label = FEMFLOW.t("notifications.openAriaUnread");
    btn.setAttribute("aria-label", label.replace("{count}", unread));
  } else {
    badge.textContent = "";
    badge.classList.remove("is-visible");
    btn.setAttribute("aria-label", FEMFLOW.t("notifications.openAria"));
  }
};

FEMFLOW.updateNotificationsCopy = function () {
  const title = document.getElementById("ff-notifications-title");
  if (title) title.textContent = FEMFLOW.t("notifications.title");

  const closeBtn = document.querySelector(".ff-notifications-close");
  if (closeBtn) closeBtn.setAttribute("aria-label", FEMFLOW.t("notifications.closeAria"));

  const list = document.getElementById("ff-notifications-list");
  if (list && list.children.length === 1 && list.firstElementChild?.classList.contains("ff-notifications-empty")) {
    list.firstElementChild.textContent = FEMFLOW.t("notifications.empty");
  }

  FEMFLOW.updateNotificationsBadge?.();
};

FEMFLOW.renderNotificationsList = async function () {
  const list = document.getElementById("ff-notifications-list");
  if (!list) return;

  const items = await FEMFLOW.notifications?.listAll?.();
  list.innerHTML = "";

  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "ff-notifications-empty";
    empty.textContent = FEMFLOW.t("notifications.empty");
    list.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `ff-notification-item${item.lida ? "" : " is-unread"}`;
    button.dataset.id = item.id;

    const date = item.data ? new Date(item.data) : null;
    const localeMap = {
      pt: "pt-BR",
      en: "en-US",
      fr: "fr-FR"
    };
    const locale = localeMap[FEMFLOW.lang || "pt"] || "pt-BR";
    const dateLabel = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(locale)
      : "";

    button.innerHTML = `
      <div class="ff-notification-title">${item.titulo || "FemFlow"}</div>
      <div class="ff-notification-message">${item.mensagem || ""}</div>
      <div class="ff-notification-date">${dateLabel}</div>
    `;

    button.addEventListener("click", async () => {
      if (!item.lida) {
        await FEMFLOW.notifications?.markAsRead?.(item.id);
        button.classList.remove("is-unread");
      }
      FEMFLOW.updateNotificationsBadge?.();
    });

    list.appendChild(button);
  });
};

FEMFLOW.openNotifications = async function () {
  const modal = document.getElementById("ff-notifications-modal");
  if (!modal) return;

  if (!FEMFLOW._notificationsEscHandler) {
    FEMFLOW._notificationsEscHandler = (event) => {
      if (event.key === "Escape") {
        FEMFLOW.closeNotifications?.();
      }
    };
  }

  await FEMFLOW.renderNotificationsList?.();
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.addEventListener("keydown", FEMFLOW._notificationsEscHandler);
};

FEMFLOW.closeNotifications = function () {
  const modal = document.getElementById("ff-notifications-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  if (FEMFLOW._notificationsEscHandler) {
    document.removeEventListener("keydown", FEMFLOW._notificationsEscHandler);
  }
};

FEMFLOW.initNotificationsUI = function () {
  const btn = document.getElementById("ffNotificationsBtn");
  if (!btn) return;

  btn.addEventListener("click", () => FEMFLOW.openNotifications?.());
  FEMFLOW.updateNotificationsBadge?.();

  document.addEventListener("femflow:notifications", () => {
    FEMFLOW.updateNotificationsBadge?.();
    const modal = document.getElementById("ff-notifications-modal");
    if (modal?.classList.contains("active")) {
      FEMFLOW.renderNotificationsList?.();
    }
  });
};

document.addEventListener("femflow:langChange", () => {
  FEMFLOW.renderMenuLateral?.();
  FEMFLOW.renderSAC?.();
  FEMFLOW.renderNivelModal?.();
  FEMFLOW.updateNotificationsCopy?.();
});

/* ===========================================================
   6. MODAL DE IDIOMA
=========================================================== */

FEMFLOW.inserirModalIdioma = function () {

  if (document.querySelector("#ff-lang-modal")) return;

  const modal = document.createElement("div");
  modal.id = "ff-lang-modal";
  modal.className = "ff-lang-modal hidden";

  modal.innerHTML = `
    <div class="ff-lang-box">
      <h2>Idioma / Language / Langue</h2>

      <button class="ff-lang-btn" data-lang="pt">Português</button>
      <button class="ff-lang-btn" data-lang="en">English</button>
      <button class="ff-lang-btn" data-lang="fr">Français</button>

      <button class="ff-lang-close">Fechar</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", e => {
    if (e.target.id === "ff-lang-modal") modal.classList.add("hidden");
  });

  modal.querySelectorAll(".ff-lang-btn").forEach(btn => {
    btn.onclick = () => {
      const lang = btn.dataset.lang;
      localStorage.setItem("femflow_lang", lang);
      FEMFLOW.toast("Idioma atualizado!");
      setTimeout(() => location.reload(), 500);
    };
  });

  modal.querySelector(".ff-lang-close").onclick =
    () => modal.classList.add("hidden");
};

/* ===========================================================
   6.5 MODAL SAC
=========================================================== */

FEMFLOW.renderSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="ff-sac-box">
      <h2>🛟 ${FEMFLOW.t("sac.title")}</h2>

      <p>${FEMFLOW.t("sac.subtitle")}</p>

      <div class="ff-sac-options">
        <label><input type="radio" name="sac_cat" value="treino"> ${FEMFLOW.t("sac.options.treino")}</label>
        <label><input type="radio" name="sac_cat" value="ciclo"> ${FEMFLOW.t("sac.options.ciclo")}</label>
        <label><input type="radio" name="sac_cat" value="registro"> ${FEMFLOW.t("sac.options.registro")}</label>
        <label><input type="radio" name="sac_cat" value="acesso"> ${FEMFLOW.t("sac.options.acesso")}</label>
        <label><input type="radio" name="sac_cat" value="outro"> ${FEMFLOW.t("sac.options.outro")}</label>
      </div>

      <textarea id="ff-sac-msg" placeholder="${FEMFLOW.t("sac.placeholder")}"></textarea>

      <div class="ff-sac-actions">
        <button id="ff-sac-enviar">${FEMFLOW.t("sac.enviar")}</button>
        <button id="ff-sac-cancelar">${FEMFLOW.t("sac.cancelar")}</button>
      </div>
    </div>
  `;

  const closeModal = () => {
    modal.classList.add("hidden");
    FEMFLOW.toggleBodyScroll(false);
  };

  modal.onclick = e => {
    if (e.target.id === "ff-sac-modal") closeModal();
  };

  modal.querySelector("#ff-sac-cancelar").onclick = closeModal;
  modal.querySelector("#ff-sac-enviar").onclick = FEMFLOW.enviarSAC;
};

FEMFLOW.inserirModalSAC = function () {
  if (document.getElementById("ff-sac-modal")) return;

  const modal = document.createElement("div");
  modal.id = "ff-sac-modal";
  modal.className = "ff-sac-modal hidden";

  document.body.appendChild(modal);
  FEMFLOW.renderSAC();
};

FEMFLOW.abrirModalSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  FEMFLOW.toggleBodyScroll(true);
};

FEMFLOW.fecharModalSAC = function () {
  const modal = document.getElementById("ff-sac-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  FEMFLOW.toggleBodyScroll(false);
};

FEMFLOW.enviarSAC = async function () {
  const cat = document.querySelector("input[name='sac_cat']:checked")?.value;
  if (!cat) return FEMFLOW.toast(FEMFLOW.t("sac.selecione"));

  const mensagem = document.getElementById("ff-sac-msg").value || "";

  const payload = {
    action: "sac_abrir",
    id: localStorage.getItem("femflow_id"),
    categoria_ui: cat,
    mensagem,
    lang: FEMFLOW.lang,
    contexto: {
      pagina: location.pathname.split("/").pop(),
      fase: localStorage.getItem("femflow_fase"),
      diaCiclo: Number(localStorage.getItem("femflow_diaCiclo") || 0),
      diaPrograma: Number(localStorage.getItem("femflow_diaPrograma") || 0),
      perfilHormonal: localStorage.getItem("femflow_perfilHormonal"),
      nivel: localStorage.getItem("femflow_nivel"),
      enfase: localStorage.getItem("femflow_enfase")
    }
  };

  try {
    FEMFLOW.loading.show(FEMFLOW.t("sac.enviando"));
    await FEMFLOW.post(payload);
    FEMFLOW.toast(FEMFLOW.t("sac.sucesso"));
    FEMFLOW.fecharModalSAC();
  } catch (e) {
    FEMFLOW.toast(FEMFLOW.t("sac.erro"), true);
  } finally {
    FEMFLOW.loading.hide();
  }
};


FEMFLOW.renderModalExcluirConta = function () {
  const modal = document.getElementById("ff-delete-account-modal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="ff-delete-box" role="dialog" aria-modal="true" aria-labelledby="ffDeleteTitle" aria-describedby="ffDeleteDesc">
      <h2 id="ffDeleteTitle">🗑️ ${FEMFLOW.t("deleteModal.title")}</h2>
      <p id="ffDeleteDesc">${FEMFLOW.t("deleteModal.description")}</p>
      <label class="ff-delete-check"><input type="checkbox" id="ffDeleteConfirmCheck"> ${FEMFLOW.t("deleteModal.checkbox")}</label>
      <textarea id="ffDeleteReason" placeholder="${FEMFLOW.t("deleteModal.reasonPlaceholder")}"></textarea>
      <div class="ff-delete-actions">
        <button id="ffDeleteCancel" class="ghost">${FEMFLOW.t("deleteModal.cancel")}</button>
        <button id="ffDeleteSend">${FEMFLOW.t("deleteModal.confirm")}</button>
      </div>
    </div>
  `;

  const close = () => {
    modal.classList.add("hidden");
    FEMFLOW.toggleBodyScroll(false);
  };

  const keydownHandler = (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      e.preventDefault();
      close();
    }
  };

  if (!modal.dataset.escBound) {
    document.addEventListener("keydown", keydownHandler);
    modal.dataset.escBound = "1";
  }

  modal.onclick = (e) => {
    if (e.target.id === "ff-delete-account-modal") close();
  };

  modal.querySelector("#ffDeleteCancel")?.addEventListener("click", close);
  modal.querySelector("#ffDeleteSend")?.addEventListener("click", async () => {
    const checked = modal.querySelector("#ffDeleteConfirmCheck")?.checked;
    if (!checked) {
      FEMFLOW.toast(FEMFLOW.t("deleteModal.checkboxRequired"), true);
      return;
    }

    try {
      FEMFLOW.loading.show(FEMFLOW.t("deleteModal.sending"));
      const response = await FEMFLOW.post({
        action: "deleteaccountrequest",
        userId: localStorage.getItem("femflow_id") || "",
        deviceId: FEMFLOW.getDeviceId?.() || localStorage.getItem("femflow_device_id") || "",
        sessionToken: FEMFLOW.getSessionToken?.() || localStorage.getItem("femflow_session_token") || "",
        reason: modal.querySelector("#ffDeleteReason")?.value || "",
        requestedAt: new Date().toISOString(),
        locale: FEMFLOW.lang || "pt",
        app: "femflow",
        source: "app",
        userAgent: navigator.userAgent || ""
      });

      if (response?.ok || response?.status === "ok") {
        FEMFLOW.toast(response.messageLocalized || FEMFLOW.t("deleteModal.success"));
        close();
      } else {
        FEMFLOW.toast(response?.messageLocalized || FEMFLOW.t("deleteModal.error"), true);
      }
    } catch (err) {
      FEMFLOW.toast(FEMFLOW.t("deleteModal.error"), true);
    } finally {
      FEMFLOW.loading.hide();
    }
  });
};

FEMFLOW.inserirModalExcluirConta = function () {
  if (document.getElementById("ff-delete-account-modal")) return;
  const modal = document.createElement("div");
  modal.id = "ff-delete-account-modal";
  modal.className = "ff-delete-modal hidden";
  document.body.appendChild(modal);
  FEMFLOW.renderModalExcluirConta();
};

FEMFLOW.abrirModalExcluirConta = function () {
  const modal = document.getElementById("ff-delete-account-modal");
  if (!modal) return;
  modal.classList.remove("hidden");
  FEMFLOW.toggleBodyScroll(true);
  modal.querySelector("#ffDeleteConfirmCheck")?.focus();
};

/* ===========================================================
   7. AÇÕES DO MENU
=========================================================== */

FEMFLOW._acaoMenu = async function (op) {
  document.querySelector(".ff-menu-modal")?.classList.remove("active");

  switch (op) {

    case "idioma":
      document.getElementById("ff-lang-modal")?.classList.remove("hidden");
      break;

    case "sac":
      FEMFLOW.abrirModalSAC();
      break;

    case "ciclo":
  
 // dispatch
FEMFLOW.dispatch("stateChanged", {
  type: "ciclo",
  impact: "fisiologico",
  source: location.pathname.includes("home") ? "home.html" : "flowcenter.html"
});
;

 
      FEMFLOW.router(`ciclo.html?ret=${location.pathname.split("/").pop()}`);
      break;

    case "respiracao":
      FEMFLOW.router("respiracao.html");
      break;

    case "treinos":
      FEMFLOW.router("evolucao.html");
      break;

    case "trocarTreino":
      FEMFLOW.router("home.html");
      break;

    case "nivel":
      // ⚠️ apenas abre modal
      // o dispatch estrutural acontece SOMENTE na confirmação do nível
      document.querySelector("#modal-nivel")?.classList.remove("oculto");
      break;

    case "tema":
      document.body.classList.toggle("dark");
      localStorage.setItem(
        "femflow_theme",
        document.body.classList.contains("dark") ? "dark" : "light"
      );
      break;

    case "privacy":
      window.location.href = FEMFLOW.assetUrl(`docs/privacy.html?lang=${FEMFLOW.lang || "pt"}`);
      break;

    case "terms":
      window.location.href = FEMFLOW.assetUrl(`docs/terms.html?lang=${FEMFLOW.lang || "pt"}`);
      break;

    case "deleteAccount":
      FEMFLOW.abrirModalExcluirConta?.();
      break;

    case "logout":
      try {
        await FEMFLOW.post({
          action: "logoutDevice",
          id: localStorage.getItem("femflow_id") || ""
        });
      } catch (_) {}
      FEMFLOW.clearSession();
      localStorage.removeItem("femflow_id");
      localStorage.removeItem("femflow_auth");
      localStorage.removeItem("femflow_email");
      location.href = "index.html";
      break;

    case "voltar": {
      const p = location.pathname.split("/").pop();
      const rota = {
        "treino.html": "flowcenter.html",
        "flowcenter.html": "home.html",
        "respiracao.html": "flowcenter.html",
        "evolucao.html": "flowcenter.html",
        "ciclo.html": "home.html"
      };
      FEMFLOW.router(rota[p] || "home.html");
      break;
    }
  }
};


FEMFLOW.resetProgramaAtual = function () {
  localStorage.removeItem("femflow_diaPrograma");
  localStorage.removeItem("femflow_enfase");
  localStorage.removeItem("femflow_treinoAtual");
};

FEMFLOW.renderNivelModal = function () {
  const modal = document.getElementById("modal-nivel");
  if (!modal) return;

  const title = modal.querySelector("h2");
  if (title) title.textContent = FEMFLOW.t("nivelModal.title");

  const labels = {
    iniciante: FEMFLOW.t("nivelModal.iniciante"),
    intermediaria: FEMFLOW.t("nivelModal.intermediaria"),
    avancada: FEMFLOW.t("nivelModal.avancada")
  };

  modal.querySelectorAll(".nivel-btn").forEach(btn => {
    const key = btn.dataset.nivel;
    if (labels[key]) btn.textContent = labels[key];
  });

  const btnConfirmar = modal.querySelector("#btnConfirmarNivel");
  if (btnConfirmar) btnConfirmar.textContent = FEMFLOW.t("nivelModal.confirmar");

  const btnFechar = modal.querySelector("#fecharNivel");
  if (btnFechar) btnFechar.textContent = FEMFLOW.t("nivelModal.fechar");
};

FEMFLOW.initNivelHandler = function () {
  const modal = document.getElementById("modal-nivel");
  const btnConfirmar = document.getElementById("btnConfirmarNivel");
  const btnFechar = document.getElementById("fecharNivel");

  if (!modal || !btnConfirmar || !btnFechar) return; // 🔧 proteção

  FEMFLOW.renderNivelModal?.();

  btnConfirmar.dataset.bound = "true";

  modal.querySelectorAll(".nivel-btn").forEach(btn => {
    btn.onclick = () => {
      modal.querySelectorAll(".nivel-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
  });

  btnConfirmar.onclick = async () => {
    const nivel = modal.querySelector(".nivel-btn.active")?.dataset.nivel;
    const nivelNorm = String(nivel || "").toLowerCase().trim();
    if (!nivelNorm) return FEMFLOW.toast(FEMFLOW.t("nivelModal.selecione"));

    localStorage.setItem("femflow_nivel", nivelNorm);

    await FEMFLOW.post({
      action: "setnivel",
      id: localStorage.getItem("femflow_id"),
      nivel: nivelNorm
    });

    FEMFLOW.dispatch("stateChanged", {
      type: "nivel",
      impact: "estrutural",
      source: location.pathname.includes("home") ? "home.html" : "flowcenter.html"
    });

    modal.classList.add("oculto");
  };

  btnFechar.onclick = () => modal.classList.add("oculto");
};

/* ===========================================================
   8. CARREGAR PERFIL (VALIDAR)
=========================================================== */

FEMFLOW.carregarPerfil = async function () {
  const id = localStorage.getItem("femflow_id");
  if (!id) return null;

  try {
    const r = await fetch(`${FEMFLOW.SCRIPT_URL}?action=validar&id=${id}`).then(r => r.json());
    if (r.status !== "ok") return null;

    localStorage.setItem("femflow_nome", r.nome || "Aluna");
    localStorage.setItem("femflow_fase", r.fase);
    const enfaseAtual = localStorage.getItem("femflow_enfase");
    const extraAtivo = localStorage.getItem("femflow_treino_extra") === "true";
    const enfaseAtualExtra = String(enfaseAtual || "").toLowerCase().startsWith("extra_");
    const enfaseBackend = String(r.enfase || "").toLowerCase().trim();
    const enfaseValida = Boolean(enfaseBackend && enfaseBackend !== "nenhuma");
    if (extraAtivo && enfaseAtualExtra) {
      if (enfaseValida && !localStorage.getItem("femflow_enfase_base")) {
        localStorage.setItem("femflow_enfase_base", enfaseBackend);
      }
    } else if (enfaseValida) {
      localStorage.setItem("femflow_enfase", enfaseBackend);
    }
    localStorage.setItem("femflow_diaCiclo", r.diaCiclo);
    if (r.nivel) {
      localStorage.setItem("femflow_nivel", r.nivel);
    }
    localStorage.setItem("femflow_startDate", r.data_inicio);
    localStorage.setItem("femflow_cycleLength", r.ciclo_duracao);
    localStorage.setItem("femflow_perfilHormonal", FEMFLOW.normalizePerfilHormonal(r.perfilHormonal));

    const produtoRaw = (r.produto || "").toLowerCase().trim();
    const isVip = produtoRaw === "vip";
    const ativaRaw   = isVip || r.ativa === true || r.ativa === "true";

    localStorage.setItem("femflow_produto", produtoRaw);
    localStorage.setItem("femflow_ativa", ativaRaw ? "true" : "false");

    const acessos = r.acessos || {};
    const personalRaw =
      acessos.personal ??
      r.personal ??
      r.Personal ??
      r.has_personal ??
      r.hasPersonal;
    const hasPersonal =
      personalRaw === true ||
      personalRaw === "true" ||
      personalRaw === 1 ||
      personalRaw === "1" ||
      isVip;
    localStorage.setItem("femflow_has_personal", hasPersonal ? "true" : "false");
    localStorage.removeItem("femflow_personal");
    FEMFLOW.renderVipBadge?.();

    return r;

  } catch (e) {
    FEMFLOW.error("Erro carregarPerfil:", e);
    return null;
  }
};

/* ===========================================================
   9. SYNC + EVENTO READY
=========================================================== */

FEMFLOW.sincronizarECdisparar = async function () {
  const perfil = await FEMFLOW.carregarCicloBackend();

  window.dispatchEvent(new CustomEvent("femflow:ready", {
    detail: perfil
  }));
};
/* ===========================================================
   7.5 STATE CHANGED → SEMPRE CAI NO FLOWCENTER
   (FlowCenter valida/sincroniza no começo)
=========================================================== */
document.addEventListener("femflow:stateChanged", e => {
  const {
    impact = "none",
    source = "flowcenter.html"
  } = e.detail || {};

  if (impact === "none") return;

  if (impact === "fisiologico") {
    FEMFLOW.toast("Ajustes aplicados 🌸");
    FEMFLOW.router(source);
    return;
  }

  if (impact === "estrutural") {
    FEMFLOW.resetProgramaAtual?.();
    FEMFLOW.toast("Estrutura atualizada 🌱");
    FEMFLOW.router(source);
  }
});



/* ===========================================================
   10. INIT — FLUXO PRINCIPAL
=========================================================== */

FEMFLOW.init = async function () {
  const p = (location.pathname.split("/").pop() || "").toLowerCase();
  FEMFLOW.requireFirebaseAuthIfNeeded?.();
  FEMFLOW.renderVipBadge?.();

  if (FEMFLOW.isNativeIOS()) {
    try {
      await FEMFLOW.iap.init();
      await FEMFLOW.iap.listProducts();
      FEMFLOW.iap.bindPaywallButtons();
    } catch (error) {
      FEMFLOW.warn?.("[FemFlow] IAP Apple indisponível:", error);
    }
  }

  // HOME → sem SYNC
  if (p === "home.html") {
    this.inserirHeaderApp();
    this.inserirMenuLateral();
    this.inserirModalIdioma();
    this.inserirModalSAC();
    this.inserirModalExcluirConta();
    this.inserirModalNotificacoes();
    this.initNotificationsUI();
     
     // ⏱️ aguarda o DOM completar
    requestAnimationFrame(() => {
      FEMFLOW.initNivelHandler();
    });   
    return;
  }

  // Demais páginas
  if ([
    "flowcenter.html",
    "treino.html",
    "respiracao.html",
    "evolucao.html",
    "body_insight.html",
    "followme.html",
    "followme_treino.html"
  ].includes(p)) {

     this.inserirHeaderApp();
    this.inserirMenuLateral();
    this.inserirModalIdioma();
    this.inserirModalSAC();
    this.inserirModalExcluirConta();
    this.inserirModalNotificacoes();
    this.initNotificationsUI();

    requestAnimationFrame(() => {
      FEMFLOW.initNivelHandler();
    });

    if (!localStorage.getItem("femflow_cycle_configured")) {
      location.href = "ciclo.html";
      return;
    }

    await FEMFLOW.sincronizarECdisparar();
  }
};

/* ===========================================================
   11. AUTO START
=========================================================== */

document.addEventListener("DOMContentLoaded", () => FEMFLOW.init());
