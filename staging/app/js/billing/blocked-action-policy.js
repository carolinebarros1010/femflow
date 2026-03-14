(function (global) {
  const root = global.FEMFLOW = global.FEMFLOW || {};
  if (root.blockedActionPolicy) return;

  function getLang() {
    return String(root.lang || "pt").slice(0, 2).toLowerCase();
  }

  function getBlockedActionToast(toastKey = "locked_app") {
    const lang = getLang();
    const mensagens = {
      locked_personal: {
        pt: "Este recurso faz parte do Personal. Para liberar, assine o Personal.",
        en: "This feature is part of Personal. Subscribe to Personal to unlock it.",
        fr: "Cette fonctionnalité fait partie du Personal. Abonnez-vous au Personal pour la débloquer."
      },
      locked_app: {
        pt: "Seu acesso está bloqueado. Para liberar, adquira o Acesso ao App.",
        en: "Your access is locked. Purchase App Access to unlock it.",
        fr: "Votre accès est bloqué. Achetez l’Accès à l’app pour le débloquer."
      },
      blocked_followme_coming_soon: {
        pt: "Em breve...",
        en: "Coming soon...",
        fr: "Bientôt..."
      },
      blocked_app_pick_home: {
        pt: "Selecione o novo treino em Home em Monte seu treino",
        en: "Select your new workout in Home under Build your workout",
        fr: "Sélectionnez votre nouvel entraînement dans Accueil → Créer votre entraînement"
      },
      unavailable: {
        pt: "Recurso indisponível.",
        en: "Feature unavailable.",
        fr: "Fonction indisponible."
      }
    };

    return mensagens[toastKey]?.[lang] || mensagens[toastKey]?.pt || mensagens.unavailable[lang] || mensagens.unavailable.pt;
  }

  function resolveBlockedCardAction(context = {}) {
    const enfase = String(context.enfase || "").toLowerCase();
    const categoria = String(context.categoria || "").toLowerCase();
    const checkoutTipo = String(context.checkoutTipo || (categoria === "personal" ? "personal" : "app")).toLowerCase();
    const isAccessAppIncludedContext =
      context.isAccessAppIncludedContext === true ||
      context.isAccessAppIncludedContext === "true";

    if (enfase.startsWith("followme_") || categoria === "followme") {
      return {
        toastKey: "blocked_followme_coming_soon",
        skipCheckout: true,
        checkoutPlanId: null,
        reasonCode: "blocked_followme_coming_soon"
      };
    }

    if (isAccessAppIncludedContext) {
      return {
        toastKey: "blocked_app_pick_home",
        skipCheckout: true,
        checkoutPlanId: null,
        reasonCode: "blocked_pick_from_home"
      };
    }

    if (checkoutTipo === "personal" || categoria === "personal" || enfase === "personal" || enfase === "bodyinsight") {
      return {
        toastKey: "locked_personal",
        skipCheckout: false,
        checkoutPlanId: "personal",
        reasonCode: "locked_personal"
      };
    }

    return {
      toastKey: "locked_app",
      skipCheckout: false,
      checkoutPlanId: "access",
      reasonCode: "locked_card"
    };
  }

  root.blockedActionPolicy = {
    resolveBlockedCardAction,
    getBlockedActionToast
  };
})(window);
