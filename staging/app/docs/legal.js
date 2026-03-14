(function () {
  const SUPPORT_EMAIL = "femflow.consultoria@gmail.com";
  const LAST_UPDATED = "2026-02-24";

  const copy = {
    pt: {
      femflow: "FemFlow",
      lastUpdated: "Última atualização",
      links: { privacy: "Política de Privacidade", terms: "Termos de Uso", del: "Excluir conta" },
      back: "← Voltar",
      contactTitle: "Contato",
      contactBody: "Contato de Privacidade:"
    },
    en: {
      femflow: "FemFlow",
      lastUpdated: "Last update",
      links: { privacy: "Privacy Policy", terms: "Terms of Use", del: "Delete account" },
      back: "← Back",
      contactTitle: "Contact",
      contactBody: "Privacy Contact:"
    },
    fr: {
      femflow: "FemFlow",
      lastUpdated: "Dernière mise à jour",
      links: { privacy: "Politique de confidentialité", terms: "Conditions d'utilisation", del: "Supprimer le compte" },
      back: "← Retour",
      contactTitle: "Contact",
      contactBody: "Contact confidentialité :"
    }
  };

  window.FEMFLOW_LEGAL = { SUPPORT_EMAIL, LAST_UPDATED, copy };

  window.resolveLegalLang = function () {
    const fromQuery = new URLSearchParams(location.search).get("lang");
    const saved = localStorage.getItem("femflow_lang") || "pt";
    const lang = (fromQuery || saved || "pt").slice(0, 2).toLowerCase();
    return ["pt", "en", "fr"].includes(lang) ? lang : "pt";
  };

  window.backFromLegal = function (lang) {
    const safeLang = ["pt", "en", "fr"].includes(lang) ? lang : "pt";
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    const q = safeLang ? `?lang=${safeLang}` : "";
    window.location.href = `../index.html${q}`;
  };
})();
