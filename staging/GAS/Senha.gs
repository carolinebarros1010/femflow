/* ============================================================
   FEMFLOW • SENHA.GS — SEGURANÇA
   - Hash de senha
   - Login/cadastro
   - Sessão/device lock
============================================================ */

function _hashSenha(raw) {
  const senha = String(raw || "").trim();
  if (!senha) return "";
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    senha,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64Encode(digest);
}

function _senhaConfereSegura_(senhaDigitada, senhaSalva) {
  const senha = String(senhaDigitada || "").trim();
  const salva = String(senhaSalva || "").trim();

  if (!senha) return { ok: false, needsUpgrade: false };

  if (!salva) return { ok: true, needsUpgrade: true };

  const hash = _hashSenha(senha);

  if (salva === hash) return { ok: true, needsUpgrade: false };
  if (salva === senha) return { ok: true, needsUpgrade: true };

  return { ok: false, needsUpgrade: false };
}

function _loginOuCadastro(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunas não encontrada." };

  const nome            = String(data.nome || "").trim();
  const email           = String(data.email || "").toLowerCase().trim();
  const telefone        = String(data.telefone || "").trim();
  const dataNascimento  = String(data.dataNascimento || "").trim();
  const senha           = String(data.senha || "").trim();
  const anamnese        = data.anamnese || "";
  const lang            = typeof _resolverLangHotmart_ === "function"
    ? _resolverLangHotmart_(data)
    : "pt";
  const enviarBoasVindasTrial = String(data.enviarBoasVindasTrial || "")
    .trim()
    .toLowerCase() === "true";

  if (!nome || !email || !senha) {
    return { status: "error", msg: "Nome, e-mail e senha são obrigatórios." };
  }

  const senhaHash = _hashSenha(senha);
  const rows = sh.getDataRange().getValues();

  let pont = _calcularPontuacaoAnamnese(anamnese);
  let nivelDetectado = "iniciante";
  if (pont >= 13 && pont < 23) nivelDetectado = "intermediaria";
  if (pont >= 23) nivelDetectado = "avancada";

  /* ======================================================
   * 🔁 ATUALIZAR ALUNA EXISTENTE
   * ====================================================== */
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const emailDB = String(row[2] || "").toLowerCase().trim();

    if (emailDB === email) {
      const linha = i + 1;

      let id = row[0];
      if (!id) {
        id = gerarID();
        sh.getRange(linha, 1).setValue(id);
      }

      sh.getRange(linha, 2).setValue(nome);
      sh.getRange(linha, 3).setValue(email);
      sh.getRange(linha, 4).setValue(telefone);
      sh.getRange(linha, 5).setValue(senhaHash);

      if (dataNascimento) {
        sh.getRange(linha, COL_DATA_NASCIMENTO + 1).setValue(dataNascimento);
      }

      sh.getRange(linha, 9).setValue(nivelDetectado);
      sh.getRange(linha, 16).setValue(pont);
      sh.getRange(linha, 17).setValue(anamnese);

      // Corrigir DataInicio inválida
      const dataIni = row[10];
      if (!dataIni || !(dataIni instanceof Date) || dataIni.getFullYear() < 1990) {
        sh.getRange(linha, 11).setValue(new Date());
      }

      // Garantir DiaPrograma
      if (!row[COL_DIA_PROGRAMA]) {
        sh.getRange(linha, COL_DIA_PROGRAMA + 1).setValue(1);
      }

      return {
        status: "ok",
        id,
        email,
        nivel: nivelDetectado,
        pontuacao: pont
      };
    }
  }

  /* ======================================================
   * 🆕 NOVO CADASTRO
   * ====================================================== */
  const novoID = gerarID();
  const hoje = new Date();

  sh.appendRow([
    novoID,                 // ID
    nome,                   // Nome
    email,                  // Email
    telefone,               // Telefone
    senhaHash,              // SenhaHash
    "trial_app",            // Produto
    hoje,                   // DataCompra
    false,                  // LicencaAtiva
    nivelDetectado,         // Nivel
    Number(data.cicloDuracao) || 28, // CicloDuracao
    hoje,                   // DataInicio
    "",                     // LinkPlanilha
    "nenhuma",              // Enfase
    "",                     // Fase
    "",                     // DiaCiclo
    pont,                   // Pontuacao
    anamnese,               // AnamneseJSON
    "",                     // TokenReset
    "",                     // TokenExpira
    "",                     // Perfil_Hormonal
    "",                     // ciclodate
    1,                      // DiaPrograma
    "",                     // DeviceId
    "",                     // SessionToken
    "",                     // SessionExpira
    "",                     // data
    "",                     // ultima
    "",                     // FreeEnabled (AB)
    "",                     // FreeEnfases (AC)
    "",                     // FreeUntil (AD)
    "",                     // acesso_personal (AE)
    "",                     // TreinosSemana (AF)
    "",                     // AusenciaAtiva (AG)
    "",                     // AusenciaInicio (AH)
    dataNascimento          // DataNascimento (AI)
  ]);

  let emailEnviado = false;
  if (enviarBoasVindasTrial && typeof _enviarBoasVindasNewsletter_ === "function") {
    emailEnviado = _enviarBoasVindasNewsletter_(email, nome, lang);
  }

  return {
    status: "created",
    id: novoID,
    email,
    nivel: nivelDetectado,
    pontuacao: pont,
    email_boas_vindas: emailEnviado,
    email_tipo: emailEnviado ? "newsletter" : ""
  };
}

/* ============================================================
   LOGIN (corrigido + upgrade automático)
============================================================ */
function _fazerLogin(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunas não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  const senha = String(data.senha || "").trim();
  const deviceId = String(data.deviceId || "").trim();

  if (!email) return { status: "error", msg: "email_required" };

  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const emailDB = String(row[2] || "").trim().toLowerCase();
    if (emailDB !== email) continue;

    const linha = i + 1;

    // ✅ senha segura
    const conf = _senhaConfereSegura_(senha, row[4]);
    if (!conf.ok) return { status: "senha_incorreta" };

    // ✅ upgrade se estava em texto puro / vazio
    if (conf.needsUpgrade) {
      sh.getRange(linha, 5).setValue(_hashSenha(senha)); // col 5 (1-based) = row[4]
    }

    // device lock + tolerância de migração
    const deviceDB = String(row[COL_DEVICE_ID] || "").trim();
    const sessionTokenDB = String(row[COL_SESSION_TOKEN] || "").trim();
    const expDB = row[COL_SESSION_EXP];
    const now = new Date();
    const hasActiveSession =
      sessionTokenDB &&
      expDB instanceof Date &&
      expDB.getTime() > now.getTime();

    let deviceUpdated = false;

    if (deviceDB && deviceId && deviceDB !== deviceId) {
      if (hasActiveSession) return { status: "blocked" };
      sh.getRange(linha, COL_DEVICE_ID + 1).setValue(deviceId);
      deviceUpdated = true;
    }

    if (deviceId && !deviceDB) {
      sh.getRange(linha, COL_DEVICE_ID + 1).setValue(deviceId);
      deviceUpdated = true;
    }

    // session
    const sessionToken = Utilities.getUuid();
    const sessionExpira = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue(sessionToken);
    sh.getRange(linha, COL_SESSION_EXP + 1).setValue(sessionExpira);

    return {
      status: "ok",
      id: row[0],
      email,
      deviceId: deviceId || deviceDB,
      sessionToken,
      sessionExpira,
      deviceUpdated
    };
  }

  return { status: "not_registered" };
}

function _assertSession_(id, deviceId, sessionToken) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { ok: false, msg: "Aba Alunas não encontrada." };

  const idNorm = String(id || "").trim();
  const token = String(sessionToken || "").trim();
  const device = String(deviceId || "").trim();

  if (!idNorm || !token) return { ok: false, msg: "Sessão inválida" };

  const rows = sh.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[0] || "").trim() !== idNorm) continue;

    const tokenDB = String(row[COL_SESSION_TOKEN] || "").trim();
    const expDB = row[COL_SESSION_EXP];
    const deviceDB = String(row[COL_DEVICE_ID] || "").trim();

    if (!tokenDB || tokenDB !== token) return { ok: false, msg: "Sessão inválida" };
    if (!(expDB instanceof Date) || expDB.getTime() < now.getTime()) {
      return { ok: false, msg: "Sessão expirada" };
    }

    if (deviceDB && device && deviceDB !== device) {
      return { ok: false, msg: "Sessão bloqueada" };
    }

    return { ok: true };
  }

  return { ok: false, msg: "Sessão inválida" };
}

/* ============================================================
   RESET SENHA (token gravado na planilha)
============================================================ */
function _getResetBaseUrl_(data) {
  const props = PropertiesService.getScriptProperties();
  const fromData = String(
    data.resetUrl ||
    data.resetBaseUrl ||
    data.baseUrl ||
    data.appBaseUrl ||
    ""
  ).trim();
  const fromProps = String(
    props.getProperty("RESET_URL") ||
    props.getProperty("RESET_BASE_URL") ||
    props.getProperty("APP_BASE_URL") ||
    ""
  ).trim();
  let base = fromData || fromProps || "https://www.femflow.com.br/app/reset.html";
  base = base.replace(/^https?:\/\/(www\.)?femflow\.com\.br/i, "https://www.femflow.com.br");
  if (/reset\.html/i.test(base)) return base;
  return base.replace(/\/+$/, "") + "/reset.html";
}

function _buildResetLink_(data, id, token, email) {
  const lang = _getResetLang_(data);
  const base = _getResetBaseUrl_(data);
  const params = [
    "id=" + encodeURIComponent(id || ""),
    "token=" + encodeURIComponent(token || ""),
    "email=" + encodeURIComponent(email || ""),
    "lang=" + encodeURIComponent(lang)
  ].join("&");
  return base + (base.includes("?") ? "&" : "?") + params;
}

function _getResetLang_(data) {
  const raw = String(data.lang || data.idioma || data.language || "").trim().toLowerCase();
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("fr")) return "fr";
  return "pt";
}

function _solicitarResetSenha(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunas não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  if (!email) return { status: "error", msg: "email_required" };
  const lang = _getResetLang_(data);

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[2] || "").trim().toLowerCase() !== email) continue;

    const linha = i + 1;
    const token = Utilities.getUuid().replace(/-/g, "");
    const expira = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    const id = String(row[0] || "").trim();

    sh.getRange(linha, COL_TOKEN_RESET + 1).setValue(token);
    sh.getRange(linha, COL_TOKEN_EXPIRA + 1).setValue(expira);

    const resetLink = _buildResetLink_(data, id, token, email);
    const copy = {
      pt: {
        subject: "Redefinir senha • FemFlow",
        intro: "Olá! Recebemos seu pedido para redefinir a senha.",
        cta: "Clique aqui para criar uma nova senha",
        outro: "Se você não solicitou, ignore este e-mail.",
        team: "Equipe FemFlow 💫",
        plainIntro: "Olá!",
        plainOutro: "Equipe FemFlow"
      },
      en: {
        subject: "Reset your password • FemFlow",
        intro: "Hi! We received your request to reset your password.",
        cta: "Click here to create a new password",
        outro: "If you did not request this, please ignore this email.",
        team: "FemFlow Team 💫",
        plainIntro: "Hi!",
        plainOutro: "FemFlow Team"
      },
      fr: {
        subject: "Réinitialiser votre mot de passe • FemFlow",
        intro: "Bonjour ! Nous avons reçu votre demande de réinitialisation du mot de passe.",
        cta: "Cliquez ici pour créer un nouveau mot de passe",
        outro: "Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.",
        team: "Équipe FemFlow 💫",
        plainIntro: "Bonjour !",
        plainOutro: "Équipe FemFlow"
      }
    };
    const t = copy[lang] || copy.pt;
    const subject = t.subject;
    const htmlBody = [
      `<p>${t.intro}</p>`,
      `<p><a href="${resetLink}">${t.cta}</a></p>`,
      `<p>${t.outro}</p>`,
      `<p>${t.team}</p>`
    ].join("");
    const body = [
      t.plainIntro,
      t.intro,
      t.cta + ":",
      resetLink,
      t.outro,
      t.plainOutro
    ].join("\n");

    try {
      MailApp.sendEmail({ to: email, subject, htmlBody, body });
    } catch (err) {
      console.log("Erro ao enviar e-mail de reset:", err);
      return { status: "error", msg: "email_failed" };
    }

    return { status: "ok", email };
  }

  return { status: "notfound" };
}

function _resetSenha(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunas não encontrada." };

  const id = String(data.id || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const token = String(data.token || "").trim();
  const novaSenha = String(data.novaSenha || "").trim();

  if ((!id && !email) || !token || !novaSenha) {
    return { status: "error", msg: "missing_fields" };
  }

  if (novaSenha.length < 6) {
    return { status: "error", msg: "A senha deve ter ao menos 6 caracteres." };
  }

  const rows = sh.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowId = String(row[0] || "").trim();
    const rowEmail = String(row[2] || "").trim().toLowerCase();

    if (id && rowId !== id) continue;
    if (!id && email && rowEmail !== email) continue;

    const tokenDB = String(row[COL_TOKEN_RESET] || "").trim();
    const expDB = row[COL_TOKEN_EXPIRA];

    if (!tokenDB || tokenDB !== token) {
      return { status: "invalid_token", msg: "Link inválido ou expirado." };
    }
    if (!(expDB instanceof Date) || expDB.getTime() < now.getTime()) {
      return { status: "expired_token", msg: "Link inválido ou expirado." };
    }

    const linha = i + 1;
    sh.getRange(linha, 5).setValue(_hashSenha(novaSenha));

    sh.getRange(linha, COL_TOKEN_RESET + 1).setValue("");
    sh.getRange(linha, COL_TOKEN_EXPIRA + 1).setValue("");

    sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue("");
    sh.getRange(linha, COL_SESSION_EXP + 1).setValue("");

    return { status: "ok" };
  }

  return { status: "notfound" };
}
