/* ======================================================
 * 🔹 PROCESSAR HOTMART • MAPA DE PRODUTOS
 * ====================================================== */
function mapearProduto(productName) {
  const fallback = { slug: "geral", nivel: "iniciante", fase: "follicular", enfase: "nenhuma" };
  if (!productName) return fallback;

  const prodNorm = _norm(productName);

  if (prodNorm === "treino_personal") {
  return {
    slug: "addon_personal",
    nivel: null,
    fase: null,
    enfase: null,
    acesso_personal: true
  };
}

  if (prodNorm === "femflow_premium") {
    return { slug: "premium", nivel: "iniciante", fase: "follicular", enfase: "geral" };
  }
  if (prodNorm === "acesso_app") {
    return { slug: "app", nivel: "iniciante", fase: "follicular", enfase: "nenhuma" };
  }

  const sh = _sheet("Produtos");
  if (!sh) return fallback;

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const pHot = rows[i][0];
    const slug = rows[i][1];
    const nivel = rows[i][2];
    const fase = rows[i][3];
    const enfase = rows[i][4];
    const ativo = rows[i][5];

    if (ativo !== "✅") continue;
    if (_norm(pHot) === prodNorm) {
      return {
        slug: slug || fallback.slug,
        nivel: _norm(nivel || fallback.nivel),
        fase: _norm(fase || fallback.fase),
        enfase: _norm(enfase || fallback.enfase)
      };
    }
  }

  return fallback;
}

/* ======================================================
 * 🔹 HOTMART • MAPA DE PLANOS (ASSINATURA)
 * ====================================================== */
const PLANOS = {
  ACESSO_APP: [
    // "PLAN_ID_ACESSO_APP_1",
    // "PLAN_ID_ACESSO_APP_2"
  ],
  PERSONAL: [
    // "PLAN_ID_PERSONAL_1"
  ]
};

function getPlanId(payload) {
  const subscriptionPlanId =
    payload &&
    payload.data &&
    payload.data.subscription &&
    payload.data.subscription.plan &&
    payload.data.subscription.plan.id;

  const planIdFromData =
    payload &&
    payload.data &&
    payload.data.plan &&
    payload.data.plan.id;

  return String(subscriptionPlanId || planIdFromData || "").trim();
}

function getPlanName(payload) {
  const subscriptionPlanName =
    payload &&
    payload.data &&
    payload.data.subscription &&
    payload.data.subscription.plan &&
    payload.data.subscription.plan.name;

  const planNameFromData =
    payload &&
    payload.data &&
    payload.data.plan &&
    payload.data.plan.name;

  return String(subscriptionPlanName || planNameFromData || "").trim();
}

function _resolverPlanoHotmart(planId, planName) {
  const idNorm = _norm(String(planId || "").trim());
  const nameNorm = _norm(String(planName || "").trim());

  if (idNorm && PLANOS.PERSONAL.some((id) => _norm(id) === idNorm)) {
    return { produto: "treino_personal", personal: true, origem: "plan_id" };
  }

  if (idNorm && PLANOS.ACESSO_APP.some((id) => _norm(id) === idNorm)) {
    return { produto: "acesso_app", personal: false, origem: "plan_id" };
  }

  if (nameNorm.includes("personal")) {
    return { produto: "treino_personal", personal: true, origem: "plan_name" };
  }

  if (nameNorm.includes("acesso") || nameNorm.includes("assinatura") || nameNorm.includes("app")) {
    return { produto: "acesso_app", personal: false, origem: "plan_name" };
  }

  return { produto: "acesso_app", personal: false, origem: "fallback" };
}

function _processarHotmart(data) {

  /* ======================================================
     1) EVENTO
  ====================================================== */
  let eventoRaw = String(data.event || data.event_name || data.type || "");
  if (!eventoRaw && data.data && data.data.event_name) {
    eventoRaw = String(data.data.event_name || "");
  }
  if (!eventoRaw && data.Event) {
    eventoRaw = String(data.Event || "");
  }

  const evento = String(eventoRaw || "").trim();
  const eventoNorm = _norm(evento);
  const eventoCanon = _canonicalizarEventoHotmart(eventoNorm);

  Logger.log("📬 Hotmart evento: " + evento);
  Logger.log("📦 Payload keys: " + Object.keys(data || {}).join(","));

  /* ======================================================
     2) BUYER / SUBSCRIBER
  ====================================================== */
  let buyer = {};
  if (data.data && data.data.buyer) buyer = data.data.buyer;
  else if (data.buyer) buyer = data.buyer;

  let subscriber = {};
  if (data.data && data.data.subscriber) subscriber = data.data.subscriber;
  else if (data.subscriber) subscriber = data.subscriber;

  const email = String(
    buyer.email ||
    subscriber.email ||
    data.email ||
    data["buyer.email"] ||
    data["buyer[email]"] ||
    data["subscriber.email"] ||
    data["subscriber[email]"] ||
    ""
  ).toLowerCase().trim();

  if (!email) {
    return { status: "error", msg: "hotmart_missing_email", evento };
  }

  const nome = String(
    buyer.name ||
    data.name ||
    data["buyer.name"] ||
    data["buyer[name]"] ||
    ""
  ).trim();

  const telefone = String(
    buyer.phone_number ||
    buyer.phone ||
    data.phone ||
    data["buyer.phone_number"] ||
    data["buyer[phone_number]"] ||
    ""
  ).trim();

  /* ======================================================
     3) PLANO (ASSINATURA)
  ====================================================== */
  const planId = getPlanId(data);
  const planName = getPlanName(data);
  const plano = _resolverPlanoHotmart(planId, planName);
  const lang = _resolverLangHotmart_(data);

  /* ======================================================
     4) PLANILHA
  ====================================================== */
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  const values = sh.getDataRange().getValues();

  function findRowByEmail(em) {
    for (let i = 1; i < values.length; i++) {
      if (_norm(values[i][2]) === _norm(em)) return i + 1;
    }
    return -1;
  }

  /* ======================================================
     5) COMPRA APROVADA
  ====================================================== */
  if (eventoCanon === "compra_aprovada") {

    const row = findRowByEmail(email);
    let idAluno = "";

    if (row > 0) {
      idAluno = values[row - 1][0];
      if (!idAluno) {
        idAluno = gerarID();
        sh.getRange(row, 1).setValue(idAluno);
      }

      sh.getRange(row, 6).setValue(plano.produto);
      sh.getRange(row, 7).setValue(new Date());
      sh.getRange(row, 8).setValue(true);
      if (typeof COL_ACESSO_PERSONAL === "number") {
        sh.getRange(row, COL_ACESSO_PERSONAL + 1).setValue(plano.personal);
      }

      if (telefone) sh.getRange(row, 4).setValue(telefone);

    } else {
      idAluno = gerarID();

      const rowData = new Array(HEADER_ALUNAS.length).fill("");
      rowData[0] = idAluno;
      rowData[1] = nome;
      rowData[2] = email;
      rowData[3] = telefone;
      rowData[5] = plano.produto;
      rowData[6] = new Date();
      rowData[7] = true;
      sh.appendRow(rowData);

      if (typeof COL_ACESSO_PERSONAL === "number") {
        const newRow = sh.getLastRow();
        sh.getRange(newRow, COL_ACESSO_PERSONAL + 1).setValue(plano.personal);
      }
    }

    const produtoEmail = _resolverProdutoEmailHotmart_(data, plano);
    let emailEnviado = false;
    let emailTipo = "";
    if (produtoEmail === "treino_personal") {
      emailEnviado = _enviarBoasVindasPersonal_(email, nome, lang);
      emailTipo = "personal";
    }

    return {
      status: "ok",
      produto: plano.produto,
      acesso_personal: plano.personal,
      email_boas_vindas: emailEnviado,
      email_tipo: emailTipo,
      evento
    };
  }

  /* ======================================================
     7) EVENTOS SEM ALTERAR ACESSO
  ====================================================== */
  if (
    eventoCanon === "atualizacao_cobranca_assinatura" ||
    eventoCanon === "boleto_impresso" ||
    eventoCanon === "compra_atrasada"
  ) {
    const row = findRowByEmail(email);
    if (row <= 0) {
      return { status: "notfound", email, evento };
    }

    if (telefone) sh.getRange(row, 4).setValue(telefone);

    return { status: "ok", msg: "evento_sem_alterar_acesso", evento };
  }

  /* ======================================================
     8) CANCELAMENTO / REEMBOLSO / EXPIRAÇÃO
  ====================================================== */
  if (
    eventoCanon === "cancelamento_assinatura" ||
    eventoCanon === "compra_reembolsada" ||
    eventoCanon === "compra_expirada"
  ) {

    const row = findRowByEmail(email);
    if (row <= 0) {
      return { status: "notfound", email, evento };
    }

    sh.getRange(row, 8).setValue(false); // LicencaAtiva

    if (typeof COL_ACESSO_PERSONAL === "number") {
      sh.getRange(row, COL_ACESSO_PERSONAL + 1).setValue(false);
    }

    const COL_ACESSO_FOLLOWME = 31; // ajuste para a coluna real
    if (typeof COL_ACESSO_FOLLOWME === "number") {
      sh.getRange(row, COL_ACESSO_FOLLOWME + 1).setValue("");
    }

    return { status: "assinatura_inativa", email, evento };
  }

  /* ======================================================
     9) FALLBACK
  ====================================================== */
  return { status: "ignored", evento };
}

function _pareceHotmart_(data) {
  if (!data) return false;
  return !!(
    data.event || data.Event || data.event_name || data.type ||
    (data.data && (data.data.event_name || data.data.buyer || data.data.subscriber)) ||
    data.buyer || data.subscriber ||
    data["data.event_name"] ||
    data["buyer[email]"] ||
    data["buyer.email"] ||
    data["subscriber[email]"] ||
    data["subscriber.email"]
  );
}

function _canonicalizarEventoHotmart(eventoNorm) {
  const map = {
    "purchase_approved": "compra_aprovada",
    "purchase approved": "compra_aprovada",
    "purchase_billet_printed": "boleto_impresso",
    "purchase billet printed": "boleto_impresso",
    "purchase_delayed": "compra_atrasada",
    "purchase delayed": "compra_atrasada",
    "purchase_expired": "compra_expirada",
    "purchase expired": "compra_expirada",
    "purchase_refunded": "compra_reembolsada",
    "purchase refunded": "compra_reembolsada",
    "subscription_cancellation": "cancelamento_assinatura",
    "subscription cancellation": "cancelamento_assinatura",
    "update_subscription_charge_date": "atualizacao_cobranca_assinatura",
    "update subscription charge date": "atualizacao_cobranca_assinatura"
  };

  if (!eventoNorm) return "";
  return map[eventoNorm] || "";
}

function _enviarBoasVindasPersonal_(email, nome, lang) {
  const nomeFinal = String(nome || "").trim() || "aluna";
  const whatsappLink = "https://wa.me/551151942268";
  const copy = {
    pt: {
      subject: "Boas-vindas ao Plano Personal FemFlow",
      intro: `Olá, ${nomeFinal}!`,
      body1: "Sua compra do Plano Personal foi confirmada. 🎉",
      body2: "Para receber mais informações sobre o treinamento personalizado, fale com a nossa equipe no WhatsApp:",
      team: "Equipe FemFlow 💫"
    },
    en: {
      subject: "Welcome to the FemFlow Personal Plan",
      intro: `Hi, ${nomeFinal}!`,
      body1: "Your Personal Plan purchase has been confirmed. 🎉",
      body2: "For more information about your personalized training, talk to our team on WhatsApp:",
      team: "FemFlow Team 💫"
    },
    fr: {
      subject: "Bienvenue au Plan Personnel FemFlow",
      intro: `Bonjour, ${nomeFinal} !`,
      body1: "Votre achat du Plan Personnel a été confirmé. 🎉",
      body2: "Pour recevoir plus d'informations sur l'entraînement personnalisé, contactez notre équipe sur WhatsApp :",
      team: "Équipe FemFlow 💫"
    }
  };
  const t = copy[lang] || copy.pt;
  const subject = t.subject;
  const htmlBody = [
    `<p>${t.intro}</p>`,
    `<p>${t.body1}</p>`,
    `<p>${t.body2}</p>`,
    `<p><a href="${whatsappLink}">${whatsappLink}</a></p>`,
    `<p>${t.team}</p>`
  ].join("");
  const body = [
    t.intro,
    t.body1,
    t.body2,
    whatsappLink,
    t.team
  ].join("\n");

  try {
    MailApp.sendEmail({ to: email, subject, htmlBody, body });
    return true;
  } catch (err) {
    console.log("Erro ao enviar e-mail de boas-vindas:", err);
    return false;
  }
}

function _enviarBoasVindasNewsletter_(email, nome, lang) {
  const nomeFinal = String(nome || "").trim() || "aluna";
  const whatsappLink = "https://chat.whatsapp.com/FPNeAa1OvaZEThWBKdYOQZ?mode=gi_t";
  const copy = {
    pt: {
      subject: "Boas-vindas à FemFlow",
      intro: `Olá, ${nomeFinal}!`,
      body1: "Seu cadastro/compra foi confirmado. 🎉",
      body2: "Entre no nosso grupo de newsletter no WhatsApp para receber novidades:",
      team: "Equipe FemFlow 💫"
    },
    en: {
      subject: "Welcome to FemFlow",
      intro: `Hi, ${nomeFinal}!`,
      body1: "Your registration/purchase has been confirmed. 🎉",
      body2: "Join our WhatsApp newsletter group to receive updates:",
      team: "FemFlow Team 💫"
    },
    fr: {
      subject: "Bienvenue chez FemFlow",
      intro: `Bonjour, ${nomeFinal} !`,
      body1: "Votre inscription/achat a été confirmé. 🎉",
      body2: "Rejoignez notre groupe WhatsApp newsletter pour recevoir les nouveautés :",
      team: "Équipe FemFlow 💫"
    }
  };
  const t = copy[lang] || copy.pt;
  const subject = t.subject;
  const htmlBody = [
    `<p>${t.intro}</p>`,
    `<p>${t.body1}</p>`,
    `<p>${t.body2}</p>`,
    `<p><a href="${whatsappLink}">${whatsappLink}</a></p>`,
    `<p>${t.team}</p>`
  ].join("");
  const body = [
    t.intro,
    t.body1,
    t.body2,
    whatsappLink,
    t.team
  ].join("\n");

  try {
    MailApp.sendEmail({ to: email, subject, htmlBody, body });
    return true;
  } catch (err) {
    console.log("Erro ao enviar e-mail de boas-vindas newsletter:", err);
    return false;
  }
}

function _resolverProdutoEmailHotmart_(data, plano) {
  const nomeProduto = _getHotmartProductName_(data);
  const nomeNorm = _norm(nomeProduto);

  if (nomeNorm.includes("personal")) return "treino_personal";
  if (nomeNorm.includes("trial")) return "trial_app";
  if (nomeNorm.includes("follow")) return "follow_me";
  if (nomeNorm.includes("acesso") || nomeNorm.includes("app")) return "acesso_app";

  if (plano && plano.personal) return "treino_personal";
  return (plano && plano.produto) || "acesso_app";
}

function _getHotmartProductName_(data) {
  return String(
    (data && data.data && data.data.product && data.data.product.name) ||
    (data && data.product && data.product.name) ||
    (data && data.data && data.data.product_name) ||
    (data && data.product_name) ||
    (data && data["product.name"]) ||
    (data && data["product[name]"]) ||
    ""
  ).trim();
}

function _resolverLangHotmart_(data) {
  const raw = String(
    (data && data.lang) ||
    (data && data.language) ||
    (data && data.locale) ||
    (data && data.data && data.data.buyer && (data.data.buyer.language || data.data.buyer.locale)) ||
    (data && data.data && data.data.subscriber && (data.data.subscriber.language || data.data.subscriber.locale)) ||
    (data && data.buyer && (data.buyer.language || data.buyer.locale)) ||
    (data && data.subscriber && (data.subscriber.language || data.subscriber.locale)) ||
    ""
  )
    .trim()
    .toLowerCase();

  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("fr")) return "fr";
  if (raw.startsWith("pt")) return "pt";
  return "pt";
}
