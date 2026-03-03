/* ======================================================
/* ======================================================
 * 🌸 FEMFLOW — API CENTRAL (v2.8 Unificada, corrigida 2025)
 * ====================================================== */
function doPost(e) {

  // 📦 Parse do body (robusto: JSON, form, fallback)
  const data = parseBody_(e || {});

  // 🧪 DEBUG CONFIÁVEL (WebApp)
  console.log("📥 RAW DATA:", JSON.stringify(data));
  console.log("📥 ACTION (raw):", JSON.stringify(data.action));

  setAppContext_(data.app || data.modelo || data.produto);

  const pedido = data;
  const requestIp = extractRequestIp_(e || {}, data);

  const action = String(data.action || "")
    .trim()
    .toLowerCase();

  console.log("🧪 ACTION FINAL:", JSON.stringify(action));

  let resposta = { status: "ignored" };

  // Legacy específico (mantido)
  if (!action && data.id && data.pse !== undefined) {
    return _json(legacyRegistrarPSE_(data));
  }

  try {
    switch (action) {

      /* ===========================
         🔐 LOGIN
      ============================ */
      case "login":
        resposta = _fazerLogin(data);
        break;

      /* ===========================
         📝 CADASTRO COMPLETO
      ============================ */
      case "register":
      case "loginoucadastro":
      case "enviarcadastro":
        resposta = _loginOuCadastro(data);
        break;

      /* ===========================
         🟦 LEAD PARCIAL
      ============================ */
      case "leadparcial":
        resposta = _registrarLead(data);
        break;

      /* ===========================
         SAC
      ============================ */
      case "sac_abrir":
        resposta = sacAbrir_(data);
        break;

      case "body_insight_ia":
        return jsonOK_(analisarBodyInsightIA_(pedido));

      /* ===========================
         🔔 NOTIFICATIONS
      ============================ */
      case "create_notification":
        resposta = createNotification_(data);
        break;

      case "publish_notification":
        resposta = publishNotification_(data);
        break;

      case "send_notification":
        resposta = sendNotification_(data);
        break;

      /* ===========================
         🔄 RECUPERAR SENHA
      ============================ */
      case "solicitarreset":
        resposta = _solicitarResetSenha(data);
        break;

      case "resetsenha":
        resposta = _resetSenha(data);
        break;

      case "resetdevice":
        resposta = resetDevice_(data);
        break;

      case "logoutdevice":
        resposta = logoutDevice_(data);
        break;

      case "migrarauth2batch":
        resposta = migrarAuth2Batch_();
        break;

      /* ===========================
         🌸 SALVAR ÊNFASE
      ============================ */
      case "setenfase":
        resposta = atualizarEnfase(data.id, data.enfase);
        break;

      /* ===========================
         🌙 SALVAR FASE @deprecated
      ============================ */
      case "setfase":
        resposta = atualizarFase(data.id, data.fase);
        break;

      /* ===========================
         🧬 PERFIL HORMONAL
      ============================ */
      case "setperfilhormonal":
        resposta = { status: "ignored", msg: "perfil_hormonal_removido" };
        break;

      /* ===========================
         🔢 DIA DO CICLO @deprecated
      ============================ */
      case "setdiaciclo":
        resposta = atualizarDiaCiclo(data.id, data.dia);
        break;

      /* ===========================
         🔁 REINICIAR PROGRAMA
      ============================ */
      case "resetprograma":
        resposta = resetPrograma_(data.id);
        break;

      /* ===========================
         💾 SALVAR TREINO
      ============================ */
      case "salvartreino":
        resposta = salvarTreino_(data);
        break;

      /* ===========================
         📈 SALVAR EVOLUÇÃO
      ============================ */
      case "salvarevolucao":
        resposta = salvarEvolucao_(data);
        break;

      /* ===========================
         📈 ÚLTIMO PESO
      ============================ */
      case "getultimopeso":
        resposta = getUltimoPeso_(data);
        break;

      /* ===========================
         📆 START MANUAL DO CICLO
      ============================ */
      case "setmanualstart":
        resposta = { status: "ignored", msg: "manual_start_removido" };
        break;

      /* ===========================
         📆 CICLO START (antigo)
      ============================ */
      case "setciclostart":
        resposta = { status: "ignored", msg: "manual_start_removido" };
        break;

      /* ===========================
         🎚️ ALTERAR NÍVEL
      ============================ */
      case "setnivel":
        resposta = setnivel(data.id, data.nivel);
        break;

      /* ===========================
         🔐 UPGRADE MANUAL (LEGACY)
      ============================ */
      case "upgrade":
        resposta = legacyUpgrade_(data.id, data.nivel, "POST", data.token);
        break;

      /* ===========================
         🧾 RECUPERAR ID (LEGACY)
      ============================ */
      case "recuperarid":
        resposta = legacyRecuperarId_(data);
        break;

      /* ===========================
         🔄 SYNC CICLO
      ============================ */
      case "sync":
        resposta = sync(data.id || (e.parameter && e.parameter.id));
        break;

      /* ===========================
         🌸 SET CICLO (onboarding)
      ============================ */
      case "setciclo":
        resposta = setCiclo_(data);
        break;

      /* ===========================
         😴 SALVAR DESCANSO
      ============================ */
      case "salvardescanso":
        resposta = salvarDescanso_(data);
        break;

      /* ===========================
         😴 SALVAR DESCANSO (LEGACY)
      ============================ */
      case "descanso":
        resposta = legacyRegistrarDescanso_(data);
        break;

      /* ===========================
         📌 DIA DO PROGRAMA
      ============================ */
      case "setdiaprograma":
      case "setDiaPrograma":
        resposta = setDiaPrograma_(data.id, data.diaPrograma);
        break;

      case "getdiaprograma":
        resposta = getDiaPrograma_(data.id);
        break;

      /* ===========================
         📆 TREINOS POR SEMANA
      ============================ */
      case "settreinossemana":
        resposta = setTreinosSemana_(data);
        break;

      /* ===========================
         🏃 ENDURANCE (LEGACY)
      ============================ */
      case "endurance_setup":
        resposta = legacyEnduranceSetup_(data);
        break;

      case "endurance_treino":
        resposta = legacyEnduranceTreino_(data);
        break;

      case "endurance_check":
        resposta = legacyEnduranceCheck_(data);
        break;

      case "endurance_plan_token":
        resposta = getEndurancePlanToken_(data);
        break;

      /* ===========================
         🔔 PUSH — REGISTRO TOKEN
      ============================ */
      case "deleteaccountrequest":
        resposta = deleteAccountRequest_(data, requestIp);
        break;

      case "register_push_token":
        resposta = registerPushToken_(data);
        break;

      /* ===========================
         🔔 PUSH — ENVIO
      ============================ */
      case "send_push":
        resposta = sendPush_(data);
        break;

      /* ===========================
         🧭 ADMIN — PAINEL
      ============================ */
      case "admin_update_aluna":
        resposta = adminUpdateAluna_(data);
        break;

      case "admin_create_aluna":
        resposta = adminCreateAluna_(data);
        break;

      case "iap_apple_activate":
        resposta = iapAppleActivate_(data);
        break;

      case "entitlements_status":
        resposta = entitlementsStatus_(data);
        break;

      /* ===========================
         🛒 HOTMART / DEFAULT
      ============================ */
      default:
        resposta = _pareceHotmart_(data)
          ? _processarHotmart(data)
          : { status: "ignored", msg: "unknown_action", action };
        break;
    }

  } catch (err) {
    console.log("❌ ERRO doPost:", err);
    resposta = { status: "error", msg: err.toString() };
  }

  return _json(resposta);
}


function extractRequestIp_(e, data) {
  const headers = (e && e.headers) || {};
  const xff = headers["X-Forwarded-For"] || headers["x-forwarded-for"] || "";
  const ipFromHeader = String(Array.isArray(xff) ? (xff[0] || "") : xff || "").split(",")[0].trim();
  if (ipFromHeader) return ipFromHeader;

  const paramIp = (e && e.parameter && e.parameter.ip) || "";
  if (Array.isArray(paramIp)) return String(paramIp[0] || "").trim();
  return String(paramIp || "").split(",")[0].trim();
}
