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
  const anamneseRaw     = data.anamnese || "";
  const objetivoInput   = data.objetivo !== undefined ? data.objetivo : (data.Objetivo !== undefined ? data.Objetivo : data.objetivoFinal);
  const objetivo        = String(objetivoInput || "").toLowerCase().trim();
  const respostasRaw    = data.respostas || data.Respostas || "";
  const lang            = typeof _resolverLangHotmart_ === "function"
    ? _resolverLangHotmart_(data)
    : "pt";
  const enviarBoasVindasTrial = String(data.enviarBoasVindasTrial || "")
    .trim()
    .toLowerCase() === "true";

  if (!nome || !email || !senha) {
    return { status: "error", msg: "Nome, e-mail e senha são obrigatórios." };
  }

  let respostas = {};
  try {
    if (typeof respostasRaw === "string" && respostasRaw.trim()) {
      respostas = JSON.parse(respostasRaw);
    } else if (respostasRaw && typeof respostasRaw === "object") {
      respostas = respostasRaw;
    }
  } catch (_) {}

  let anamneseObj = {};
  try {
    if (typeof anamneseRaw === "string" && anamneseRaw.trim()) {
      anamneseObj = JSON.parse(anamneseRaw);
    } else if (anamneseRaw && typeof anamneseRaw === "object") {
      anamneseObj = anamneseRaw;
    }
  } catch (_) {}

  if (!Object.keys(respostas).length && anamneseObj && typeof anamneseObj === "object") {
    respostas = anamneseObj.respostas || anamneseObj;
  }

  const calcPremium = calcularNivelPremium(respostas, objetivo || anamneseObj.objetivo || "");
  const nivelDetectado = calcPremium.nivel;

  const scoreFinalPayload = data.scoreFinal !== undefined ? data.scoreFinal : data.ScoreFinal;
  const scoreFinalNumero = Number(scoreFinalPayload);
  const scoreFinal = Number.isFinite(scoreFinalNumero)
    ? scoreFinalNumero
    : Number(calcPremium.scoreFinal || 0);

  const scoreDetalhadoPayload = data.scoreDetalhado !== undefined
    ? data.scoreDetalhado
    : data.ScoreDetalhado;
  let scoreDetalhado = JSON.stringify(calcPremium.detalhado || {});
  if (scoreDetalhadoPayload !== undefined && scoreDetalhadoPayload !== null && String(scoreDetalhadoPayload).trim() !== "") {
    if (typeof scoreDetalhadoPayload === "string") {
      scoreDetalhado = scoreDetalhadoPayload;
    } else if (typeof scoreDetalhadoPayload === "object") {
      scoreDetalhado = JSON.stringify(scoreDetalhadoPayload);
    }
  }

  const objetivoFinal = objetivo || String(anamneseObj.objetivo || "").toLowerCase().trim();
  const anamnese = JSON.stringify({ respostas, objetivo: objetivoFinal });

  const senhaHash = _hashSenha(senha);
  const rows = sh.getDataRange().getValues();

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
      sh.getRange(linha, 16).setValue(scoreFinal);
      sh.getRange(linha, 17).setValue(anamnese);
      sh.getRange(linha, COL_SCORE_FINAL + 1).setValue(scoreFinal);
      sh.getRange(linha, COL_SCORE_DETALHADO + 1).setValue(scoreDetalhado);
      sh.getRange(linha, COL_OBJETIVO + 1).setValue(objetivoFinal);

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
        pontuacao: scoreFinal,
        scoreFinal,
        scoreDetalhado: calcPremium.detalhado,
        objetivo: objetivoFinal
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
    scoreFinal,            // Pontuacao
    anamnese,               // AnamneseJSON
    "",                     // TokenReset
    "",                     // TokenExpira
    "",                     // Perfil_Hormonal
    "",                     // ciclodate
    1,                      // DiaPrograma
    "",                     // DeviceId
    "",                     // SessionToken
    "",                     // SessionExpira
    "",                     // DataInicioPrograma
    "",                     // UltimaAtividade
    "",                     // FreeEnabled (AB)
    "",                     // FreeEnfases (AC)
    "",                     // FreeUntil (AD)
    "",                     // acesso_personal (AE)
    "",                     // TreinosSemana (AF)
    "",                     // AusenciaAtiva (AG)
    "",                     // AusenciaInicio (AH)
    dataNascimento,         // DataNascimento (AI)
    "",                     // novo_treino_endurance (AJ)
    "",                     // UltimoCaminho
    "",                     // UltimoCaminhoData
    scoreFinal,             // ScoreFinal
    scoreDetalhado,         // ScoreDetalhado
    objetivoFinal,          // Objetivo
    "",                     // Devices (AP)
    "",                     // AuthVersion (AQ)
    ""                      // LastAuthMigrationAt (AR)
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
    pontuacao: scoreFinal,
    scoreFinal,
    scoreDetalhado: calcPremium.detalhado,
    objetivo: objetivoFinal,
    email_boas_vindas: emailEnviado,
    email_tipo: emailEnviado ? "newsletter" : ""
  };
}


function nowIso_() {
  return new Date().toISOString();
}

function toTime_(isoOrDateOrNumber) {
  if (isoOrDateOrNumber instanceof Date) return isoOrDateOrNumber.getTime();
  if (typeof isoOrDateOrNumber === "number") return Number.isFinite(isoOrDateOrNumber) ? isoOrDateOrNumber : NaN;
  const str = String(isoOrDateOrNumber || "").trim();
  if (!str) return NaN;
  const ms = Date.parse(str);
  return Number.isFinite(ms) ? ms : NaN;
}

function parseDevices_(raw) {
  if (Array.isArray(raw)) return raw.filter(Boolean);
  const txt = String(raw || "").trim();
  if (!txt) return [];
  try {
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (err) {
    Logger.log('[Auth2] parseDevices_ JSON inválido: ' + err);
    return [];
  }
}

function serializeDevices_(arr) {
  const normalized = (Array.isArray(arr) ? arr : []).map((d) => {
    const deviceId = String(d && d.deviceId || "").trim();
    const sessionToken = String(d && d.sessionToken || "").trim();
    const expMs = toTime_(d && d.expira);
    if (!deviceId || !sessionToken || !Number.isFinite(expMs)) return null;
    const lastActiveMs = toTime_(d && d.lastActive);
    return {
      deviceId,
      sessionToken,
      lastActive: Number.isFinite(lastActiveMs) ? new Date(lastActiveMs).toISOString() : nowIso_(),
      expira: new Date(expMs).toISOString()
    };
  }).filter(Boolean);
  return JSON.stringify(normalized);
}

function limparDevicesExpirados_(devices, nowMs) {
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const src = Array.isArray(devices) ? devices : [];
  const clean = [];
  let removedCount = 0;
  for (let i = 0; i < src.length; i++) {
    const d = src[i] || {};
    const expMs = toTime_(d.expira);
    if (!Number.isFinite(expMs) || expMs <= now) {
      removedCount++;
      continue;
    }
    clean.push(d);
  }
  return { devicesLimpos: clean, removedCount };
}

function findDeviceIndex_(devices, deviceId) {
  const id = String(deviceId || '').trim();
  if (!id) return -1;
  const src = Array.isArray(devices) ? devices : [];
  for (let i = 0; i < src.length; i++) {
    if (String(src[i] && src[i].deviceId || '').trim() === id) return i;
  }
  return -1;
}

function findSessionIndex_(devices, token, deviceIdOpt) {
  const tk = String(token || '').trim();
  if (!tk) return -1;
  const devOpt = String(deviceIdOpt || '').trim();
  const src = Array.isArray(devices) ? devices : [];
  for (let i = 0; i < src.length; i++) {
    const d = src[i] || {};
    if (String(d.sessionToken || '').trim() !== tk) continue;
    if (devOpt && String(d.deviceId || '').trim() !== devOpt) continue;
    return i;
  }
  return -1;
}

function removerDeviceAntigoLRU_(devices) {
  const src = Array.isArray(devices) ? devices.slice() : [];
  if (!src.length) return { devicesAtualizados: [], removidoDeviceId: '' };
  src.sort((a, b) => {
    const ta = Number.isFinite(toTime_(a && a.lastActive)) ? toTime_(a.lastActive) : 0;
    const tb = Number.isFinite(toTime_(b && b.lastActive)) ? toTime_(b.lastActive) : 0;
    return ta - tb;
  });
  const removed = src.shift() || {};
  return { devicesAtualizados: src, removidoDeviceId: String(removed.deviceId || '') };
}

function upsertDeviceSession_(devices, deviceId, token, expiraIso, nowIso, slots) {
  const src = Array.isArray(devices) ? devices.slice() : [];
  const id = String(deviceId || '').trim();
  let evictedDeviceId = null;
  let idx = findDeviceIndex_(src, id);

  const next = {
    deviceId: id,
    sessionToken: String(token || '').trim(),
    expira: String(expiraIso || '').trim(),
    lastActive: String(nowIso || nowIso_()).trim()
  };

  if (idx >= 0) {
    src[idx] = next;
  } else {
    const maxSlots = Number(slots) > 0 ? Number(slots) : DEVICE_SLOTS;
    if (src.length >= maxSlots) {
      const lru = removerDeviceAntigoLRU_(src);
      evictedDeviceId = lru.removidoDeviceId || null;
      src.length = 0;
      Array.prototype.push.apply(src, lru.devicesAtualizados || []);
    }
    src.push(next);
  }

  return { devicesAtualizados: src, evictedDeviceId, used: src.length };
}

function shouldUpdateLastActive_(deviceEntry, nowMs, throttleSec) {
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const throttle = Number(throttleSec) > 0 ? Number(throttleSec) : LASTACTIVE_THROTTLE_SEC;
  const prevMs = toTime_(deviceEntry && deviceEntry.lastActive);
  if (!Number.isFinite(prevMs)) return true;
  return (now - prevMs) >= throttle * 1000;
}

function migrarLegadoParaDevicesSeNecessario_(row, nowIso) {
  const current = parseDevices_(row[COL_DEVICES]);
  if (current.length) return { migrated: false, devices: current, devicesString: serializeDevices_(current) };

  const deviceId = String(row[COL_DEVICE_ID] || '').trim();
  const sessionToken = String(row[COL_SESSION_TOKEN] || '').trim();
  const expMs = toTime_(row[COL_SESSION_EXP]);
  if (!deviceId || !sessionToken || !Number.isFinite(expMs)) {
    return { migrated: false, devices: [], devicesString: '[]' };
  }

  const migratedDevices = [{
    deviceId,
    sessionToken,
    lastActive: nowIso || nowIso_(),
    expira: new Date(expMs).toISOString()
  }];
  Logger.log('[Auth2] Migração lazy legado->devices para deviceId=' + deviceId);
  return { migrated: true, devices: migratedDevices, devicesString: serializeDevices_(migratedDevices) };
}

function atualizarLastActive(deviceId) {
  const id = String(deviceId || '').trim();
  if (!id) return { status: 'ignored' };
  return { status: 'ok', deviceId: id };
}

function limparDevicesExpirados() {
  return { status: 'ok', msg: 'Use limparDevicesExpirados_ no fluxo autenticado.' };
}

function removerDeviceAntigo() {
  return { status: 'ok', msg: 'Use removerDeviceAntigoLRU_ no fluxo autenticado.' };
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
  if (!deviceId) {
    Logger.log('[Auth2] Login sem deviceId para email=' + email);
    return { status: "error", msg: "deviceId obrigatório" };
  }

  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const emailDB = String(row[2] || "").trim().toLowerCase();
    if (emailDB !== email) continue;

    const linha = i + 1;
    const conf = _senhaConfereSegura_(senha, row[4]);
    if (!conf.ok) return { status: "senha_incorreta" };
    if (conf.needsUpgrade) {
      sh.getRange(linha, 5).setValue(_hashSenha(senha));
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const migrated = migrarLegadoParaDevicesSeNecessario_(row, nowIso);
    let devices = migrated.devices;

    const cleaned = limparDevicesExpirados_(devices, nowMs);
    devices = cleaned.devicesLimpos;
    if (cleaned.removedCount > 0) {
      Logger.log('[Auth2] Login removeu expirados=' + cleaned.removedCount + ' id=' + row[0]);
    }

    const sessionToken = Utilities.getUuid();
    const sessionExpiraIso = new Date(nowMs + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const upsert = upsertDeviceSession_(
      devices,
      deviceId,
      sessionToken,
      sessionExpiraIso,
      nowIso,
      DEVICE_SLOTS
    );

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      sh.getRange(linha, COL_DEVICES + 1).setValue(serializeDevices_(upsert.devicesAtualizados));
      sh.getRange(linha, COL_AUTH_VERSION + 1).setValue(AUTH_VERSION);
      if (migrated.migrated) {
        sh.getRange(linha, COL_AUTH_MIGRATION_AT + 1).setValue(nowIso);
      }

      // Dual-write para retrocompatibilidade durante rollout.
      sh.getRange(linha, COL_DEVICE_ID + 1).setValue(deviceId);
      sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue(sessionToken);
      sh.getRange(linha, COL_SESSION_EXP + 1).setValue(new Date(sessionExpiraIso));
    } finally {
      lock.releaseLock();
    }

    if (upsert.evictedDeviceId) {
      Logger.log('[Auth2] LRU evict no login id=' + row[0] + ' evicted=' + upsert.evictedDeviceId);
    }

    return {
      status: "ok",
      id: row[0],
      email,
      deviceId,
      sessionToken,
      sessionExpira: sessionExpiraIso,
      slots: { limit: DEVICE_SLOTS, used: upsert.used },
      evictedDeviceId: upsert.evictedDeviceId || ""
    };
  }

  return { status: "not_registered" };
}


function resetDevice_(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunas não encontrada." };

  const email = String(data.email || "").trim().toLowerCase();
  const senha = String(data.senha || "").trim();

  if (!email || !senha) {
    return { status: "error", msg: "email_and_password_required" };
  }

  const rows = sh.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const emailDB = String(row[2] || "").trim().toLowerCase();
    if (emailDB !== email) continue;

    const conf = _senhaConfereSegura_(senha, row[4]);
    if (!conf.ok) return { status: "senha_incorreta" };

    const linha = i + 1;
    if (conf.needsUpgrade) {
      sh.getRange(linha, 5).setValue(_hashSenha(senha));
    }

    sh.getRange(linha, COL_DEVICE_ID + 1).setValue("");
    sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue("");
    sh.getRange(linha, COL_SESSION_EXP + 1).setValue("");

    return { status: "ok", msg: "device_reset" };
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
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[0] || "").trim() !== idNorm) continue;

    const linha = i + 1;
    const migrated = migrarLegadoParaDevicesSeNecessario_(row, nowIso);
    let devices = migrated.devices;

    const cleaned = limparDevicesExpirados_(devices, nowMs);
    devices = cleaned.devicesLimpos;

    let changed = migrated.migrated || cleaned.removedCount > 0;
    if (cleaned.removedCount > 0) {
      Logger.log('[Auth2] Assert removeu expirados=' + cleaned.removedCount + ' id=' + idNorm);
    }

    let idx = findSessionIndex_(devices, token, device || null);
    if (idx < 0 && !device) {
      idx = findSessionIndex_(devices, token, null);
    }

    if (idx >= 0) {
      if (!device && !MIGRATION_ALLOW_NO_DEVICE) {
        Logger.log('[Auth2] Assert negado sem deviceId id=' + idNorm);
        return { ok: false, msg: "Sessão inválida" };
      }

      const target = devices[idx];
      if (device && String(target.deviceId || '').trim() !== device) {
        Logger.log('[Auth2] Assert bloqueado por mismatch id=' + idNorm);
        return { ok: false, msg: "Sessão bloqueada" };
      }

      if (shouldUpdateLastActive_(target, nowMs, LASTACTIVE_THROTTLE_SEC)) {
        devices[idx] = Object.assign({}, target, { lastActive: nowIso });
        changed = true;
      }

      if (changed) {
        const lock = LockService.getScriptLock();
        lock.waitLock(5000);
        try {
          sh.getRange(linha, COL_DEVICES + 1).setValue(serializeDevices_(devices));
          sh.getRange(linha, COL_AUTH_VERSION + 1).setValue(AUTH_VERSION);
          if (migrated.migrated) {
            sh.getRange(linha, COL_AUTH_MIGRATION_AT + 1).setValue(nowIso);
          }
        } finally {
          lock.releaseLock();
        }
      }

      return { ok: true };
    }

    // Fallback legado (dual-read durante rollout)
    const tokenDB = String(row[COL_SESSION_TOKEN] || "").trim();
    const expMs = toTime_(row[COL_SESSION_EXP]);
    const deviceDB = String(row[COL_DEVICE_ID] || "").trim();

    if (!tokenDB || tokenDB !== token) {
      Logger.log('[Auth2] Assert token inválido id=' + idNorm);
      return { ok: false, msg: "Sessão inválida" };
    }
    if (!Number.isFinite(expMs) || expMs <= nowMs) {
      Logger.log('[Auth2] Assert token expirado id=' + idNorm);
      return { ok: false, msg: "Sessão expirada" };
    }
    if (!device) {
      Logger.log('[Auth2] Assert legado sem deviceId id=' + idNorm);
      return { ok: false, msg: "Sessão inválida" };
    }
    if (deviceDB && deviceDB !== device) {
      Logger.log('[Auth2] Assert legado bloqueado id=' + idNorm);
      return { ok: false, msg: "Sessão bloqueada" };
    }

    const legacyDevices = [{
      deviceId: device,
      sessionToken: token,
      lastActive: nowIso,
      expira: new Date(expMs).toISOString()
    }];

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      sh.getRange(linha, COL_DEVICES + 1).setValue(serializeDevices_(legacyDevices));
      sh.getRange(linha, COL_AUTH_VERSION + 1).setValue(AUTH_VERSION);
      sh.getRange(linha, COL_AUTH_MIGRATION_AT + 1).setValue(nowIso);
    } finally {
      lock.releaseLock();
    }

    Logger.log('[Auth2] Assert fez migração fallback legado id=' + idNorm);
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


function logoutDevice_(data) {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: "error", msg: "Aba Alunas não encontrada." };

  const id = String(data.id || "").trim();
  const deviceId = String(data.deviceId || "").trim();
  const sessionToken = String(data.sessionToken || "").trim();

  const auth = _assertSession_(id, deviceId, sessionToken);
  if (!auth.ok) return { status: "denied", msg: auth.msg || "Sessão inválida" };

  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[0] || '').trim() !== id) continue;

    const linha = i + 1;
    const devices = parseDevices_(row[COL_DEVICES]);
    const next = devices.filter((d) => String(d && d.sessionToken || '').trim() !== sessionToken);

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      sh.getRange(linha, COL_DEVICES + 1).setValue(serializeDevices_(next));
      if (
        String(row[COL_SESSION_TOKEN] || '').trim() === sessionToken &&
        (!String(row[COL_DEVICE_ID] || '').trim() || String(row[COL_DEVICE_ID] || '').trim() === deviceId)
      ) {
        sh.getRange(linha, COL_DEVICE_ID + 1).setValue('');
        sh.getRange(linha, COL_SESSION_TOKEN + 1).setValue('');
        sh.getRange(linha, COL_SESSION_EXP + 1).setValue('');
      }
    } finally {
      lock.releaseLock();
    }

    return { status: "ok" };
  }

  return { status: "not_registered" };
}

function migrarAuth2Batch_() {
  const sh = ensureSheet(SHEET_ALUNAS, HEADER_ALUNAS);
  if (!sh) return { status: 'error', msg: 'Aba Alunas não encontrada.' };

  const values = sh.getDataRange().getValues();
  let migratedCount = 0;
  const nowIso = nowIso_();

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (parseDevices_(row[COL_DEVICES]).length) continue;
      const mig = migrarLegadoParaDevicesSeNecessario_(row, nowIso);
      if (!mig.migrated) continue;

      const linha = i + 1;
      sh.getRange(linha, COL_DEVICES + 1).setValue(mig.devicesString);
      sh.getRange(linha, COL_AUTH_VERSION + 1).setValue(AUTH_VERSION);
      sh.getRange(linha, COL_AUTH_MIGRATION_AT + 1).setValue(nowIso);
      migratedCount++;
    }
  } finally {
    lock.releaseLock();
  }

  Logger.log('[Auth2] migrarAuth2Batch_ migradas=' + migratedCount);
  return { status: 'ok', migratedCount };
}
