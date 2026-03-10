(function initBlockedActionPolicy(global) {
  const root = global.FEMFLOW = global.FEMFLOW || {};

  function getLang() {
    return root.lang || "pt";
  }

  function getComingSoonLabel(lang) {
    const labels = {
      pt: "Em breve",
      en: "Coming soon",
      fr: "Bientôt",
      es: "Próximamente",
      it: "Prossimamente",
      de: "Demnächst"
    };
    return labels[lang] || labels.pt;
  }

  function resolveBlockedCardAction(context = {}) {
    const {
      enfase = "",
      categoria = "",
      isAccessAppIncludedContext = false
    } = context;

    const enfaseNorm = String(enfase || "").toLowerCase();
    const categoriaNorm = String(categoria || "").toLowerCase();

    if (categoriaNorm === "followme") {
      return {
        toastKey: "followme_em_breve",
        checkoutPlanId: null,
        skipCheckout: true,
        reasonCode: "followme_blocked_toast_only"
      };
    }

    if (enfaseNorm === "personal" || enfaseNorm === "bodyinsight") {
      return {
        toastKey: "personal_required",
        checkoutPlanId: "personal",
        skipCheckout: false,
        reasonCode: "personal_required"
      };
    }

    if (isAccessAppIncludedContext) {
      return {
        toastKey: "access_app_included_hint",
        checkoutPlanId: null,
        skipCheckout: true,
        reasonCode: "access_app_included_context"
      };
    }

    return {
      toastKey: "access_required",
      checkoutPlanId: "access",
      skipCheckout: false,
      reasonCode: "access_required"
    };
  }

  function getBlockedActionToast(toastKey) {
    const lang = getLang();
    const followmeLang = root.langs?.[lang]?.home?.followmeEmBreve;

    const messages = {
      followme_em_breve: followmeLang || `${getComingSoonLabel(lang)}...`,
      personal_required: {
        pt: "Este recurso faz parte do Personal. Para liberar, assine o Personal.",
        en: "This feature is part of Personal. Subscribe to Personal to unlock it.",
        fr: "Cette fonctionnalité fait partie du Personal. Abonnez-vous au Personal pour la débloquer."
      },
      access_required: {
        pt: "Seu acesso está bloqueado. Para liberar, adquira o Acesso ao App.",
        en: "Your access is locked. Purchase App Access to unlock it.",
        fr: "Votre accès est bloqué. Achetez l’Accès à l’app pour le débloquer."
      },
      access_app_included_hint: {
        pt: "Selecione o novo treino em Home em Monte seu treino",
        en: "Select your new workout in Home under Build your workout",
        fr: "Sélectionnez votre nouvel entraînement dans Accueil → Créer votre entraînement"
      }
    };

    const msg = messages[toastKey];
    if (!msg) return messages.access_required[lang] || messages.access_required.pt;
    if (typeof msg === "string") return msg;
    return msg[lang] || msg.pt || "";
  }

  root.blockedActionPolicy = {
    resolveBlockedCardAction,
    getBlockedActionToast
  };
})(window);
