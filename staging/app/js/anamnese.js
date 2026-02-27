// ============================================================
//  FEMFLOW • ANAMNESE DELUXE 2025
//  Arquivo JS total — substitui TODO JS inline do HTML
// ============================================================

// ------------------------------------------------------------
//  1) PRÉ-CARREGAR GIFS
// ------------------------------------------------------------
[
 "profile_form.webp", "routine_cycle.webp", "strength_training.webp",
 "mobility_flow.webp", "hormonal_balance.webp",
 "menstrual_flow.webp", "breath_cycle.webp", "success_flow.webp"
].forEach(g => {
  const img = new Image();
  img.src = "./assets/gifs/" + g;
});

// ------------------------------------------------------------
//  2) TEXTOS DA ETAPA 1 (Cadastro) — multilíngue
// ------------------------------------------------------------
const Tcad = {
  pt: {
    titulo: "Anamnese",
    hint: "🌸 Preencha seus dados para começar:",
    nome: "Nome completo",
    email: "E-mail",
    telefone: "Telefone (opcional)",
    dataNascimento: "Data de nascimento",
    senha: "Crie uma senha (mín. 6)",
    confirma: "Confirme a senha",
    iniciar: "Iniciar Anamnese",
    idioma: "🌐 Idioma"
  },
  en: {
    titulo: "Assessment",
    hint: "🌸 Fill your details to begin:",
    nome: "Full name",
    email: "Email",
    telefone: "Phone (optional)",
    dataNascimento: "Date of birth",
    senha: "Create password (min. 6)",
    confirma: "Confirm password",
    iniciar: "Start Assessment",
    idioma: "🌐 Language"
  },
  fr: {
    titulo: "Anamnèse",
    hint: "🌸 Remplis tes informations pour commencer :",
    nome: "Nom complet",
    email: "E-mail",
    telefone: "Téléphone (optionnel)",
    dataNascimento: "Date de naissance",
    senha: "Créer un mot de passe (min. 6)",
    confirma: "Confirmer le mot de passe",
    iniciar: "Commencer l’anamnèse",
    idioma: "🌐 Langue"
  }
};

// ------------------------------------------------------------
//  Aplicar idioma ao cadastro
// ------------------------------------------------------------
function aplicarIdiomaCadastro() {
  const lang = FEMFLOW.lang || "pt";
  const T = Tcad[lang];

  document.getElementById("tituloAnamnese").textContent = T.titulo;
  document.getElementById("btnLang").textContent = T.idioma;
  document.getElementById("cadHint").textContent = T.hint;

  document.getElementById("nome").placeholder = T.nome;
  document.getElementById("email").placeholder = T.email;
  document.getElementById("telefone").placeholder = T.telefone;
  document.getElementById("labelDataNascimento").textContent = T.dataNascimento;
  document.getElementById("senha").placeholder = T.senha;
  document.getElementById("confirma").placeholder = T.confirma;

  document.getElementById("btnIniciar").textContent = T.iniciar;
}

document.addEventListener("femflow:langReady", aplicarIdiomaCadastro);
document.addEventListener("femflow:langChange", aplicarIdiomaCadastro);

document.getElementById("btnLang").onclick = () => {
  document.getElementById("ff-lang-modal")?.classList.remove("hidden");
};

// ============================================================
//  3) PERGUNTAS (multilíngue)
// ============================================================
function getPerguntasTraduzidas() {
  const lang =
    FEMFLOW?.lang ||
    localStorage.getItem("femflow_lang") ||
    "pt";

  const base = FEMFLOW?.anamneseLang;
  const perguntas =
    base?.[lang]?.perguntas ||
    base?.pt?.perguntas ||
    [];

  // deep copy para não “sujar” o dicionário ao escrever p.escolha
  return JSON.parse(JSON.stringify(perguntas));
}


// ============================================================
//  4) LÓGICA DA ANAMNESE COMPLETA
// ============================================================
(function () {

  const $ = (s) => document.querySelector(s);

  const nome = $("#nome"), email = $("#email"), tel = $("#telefone"),
        dataNascimento = $("#dataNascimento"),
        senha = $("#senha"), conf = $("#confirma"), btn = $("#btnIniciar");

  const eNome = $("#eNome"), eEmail = $("#eEmail"), eDataNascimento = $("#eDataNascimento"),
        eSenha = $("#eSenha"), eConf = $("#eConf");

  const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const SCRIPT_URL =
    FEMFLOW?.SCRIPT_URL ||
    window.FEMFLOW_ACTIVE?.scriptUrl ||
    "";

  async function syncFirebaseAuthAccount(emailRaw, senhaRaw) {
    if (!window.firebase || !firebase.auth) {
      console.warn("[Anamnese] Firebase Auth indisponível. Fluxo seguirá com sessão backend.");
      return;
    }

    const auth = firebase.auth();
    const email = String(emailRaw || "").trim().toLowerCase();
    const senha = String(senhaRaw || "").trim();
    const currentUser = auth.currentUser;

    if (
      currentUser &&
      !currentUser.isAnonymous &&
      String(currentUser.email || "").toLowerCase() === email
    ) {
      return;
    }

    if (currentUser && currentUser.isAnonymous) {
      try {
        await currentUser.delete();
      } catch (_) {
        await auth.signOut();
      }
    }

    try {
      await auth.createUserWithEmailAndPassword(email, senha);
      return;
    } catch (createErr) {
      if (createErr && createErr.code !== "auth/email-already-in-use") {
        throw createErr;
      }
    }

    await auth.signInWithEmailAndPassword(email, senha);
  }

  window.syncFirebaseAuthAccount = syncFirebaseAuthAccount;

  // ------------------------------------------------------------
  //  VALIDAÇÃO
  // ------------------------------------------------------------
  function mark(input, elErr, ok, msg="") {
    input.setAttribute("aria-invalid", ok ? "false" : "true");
    elErr.textContent = ok ? "" : msg;
  }

  function validate() {
    const vNome = (nome.value || "").trim().length >= 2;
    const vEmail = reEmail.test((email.value||"").trim());
    const vDataNascimento = Boolean((dataNascimento?.value || "").trim());
    const vSenha = (senha.value||"").trim().length >= 6;
    const vConf  = conf.value.trim() === senha.value.trim();

    mark(nome,  eNome,  vNome,  "Informe seu nome.");
    mark(email, eEmail, vEmail, "Digite um e-mail válido.");
    mark(dataNascimento, eDataNascimento, vDataNascimento, "Informe sua data de nascimento.");
    mark(senha, eSenha, vSenha, "Mínimo 6 caracteres.");
    mark(conf,  eConf,  vConf,  "As senhas não coincidem.");

    btn.disabled = !(vNome && vEmail && vDataNascimento && vSenha && vConf);
    return !btn.disabled;
  }

  ["input","blur"].forEach(evt => {
    [nome,email,tel,dataNascimento,senha,conf].forEach(el => el.addEventListener(evt, validate));
  });

  // ------------------------------------------------------------
  // Registrar lead parcial
  // ------------------------------------------------------------
  async function leadParcial(nome,email,telefone){
    try{
      const qs = new URLSearchParams({
        action:"leadparcial", nome,email,telefone,
        origem:"Anamnese Deluxe FemFlow"
      }).toString();
      await fetch(SCRIPT_URL+"?"+qs);
    }catch(_){}
  }

  // ------------------------------------------------------------
  // INÍCIO DA ANAMNESE (show quiz)
  // ------------------------------------------------------------
  btn.addEventListener("click", async () => {

    if (!validate()) return;

    const nomeV  = nome.value.trim();
    const emailV = email.value.trim();
    const telV   = tel.value.trim();
    const dataNascimentoV = dataNascimento.value;
    const senhaV = senha.value;

    localStorage.setItem("lead_nome", nomeV);
    localStorage.setItem("lead_email", emailV);
    if (telV) localStorage.setItem("lead_telefone", telV);
    localStorage.setItem("lead_data_nascimento", dataNascimentoV);

    leadParcial(nomeV, emailV, telV);


    $("#cadastro").classList.add("hidden");
    $("#quiz").classList.remove("hidden");

    FEMFLOW._leadCadastro = {
      nome: nomeV,
      email: emailV,
      telefone: telV,
      dataNascimento: dataNascimentoV,
      senha: senhaV
    };

    // iniciar quiz
    setTimeout(() => { window.iniciarQuizFemFlow?.(); }, 400);
  });

})();

// ============================================================
//  5) SISTEMA DE QUIZ + FINALIZAÇÃO (CADASTRO + CICLO + NÍVEL)
// ============================================================
(function () {

  const $ = s => document.querySelector(s);

  const cardQuiz = $("#quiz");
  const cardFinal = $("#final");
  const gifEl = $("#gif");
  const questionEl = $("#question");
  const optionsEl = $("#options");
  const finalMsgEl = $("#final-msg");

  let perguntas = getPerguntasTraduzidas();
  let idx = 0;
  let objetivoSelecionado = "iniciar";

  // ------------------------------------------------------------
  //  Pegar dados da etapa 1
  // ------------------------------------------------------------
  function pegarDadosLead() {
    const lead = FEMFLOW?._leadCadastro || {};
    return {
      nome:     lead.nome     || localStorage.getItem("lead_nome") || "",
      email:    lead.email    || localStorage.getItem("lead_email") || "",
      telefone: lead.telefone || localStorage.getItem("lead_telefone") || "",
      dataNascimento: lead.dataNascimento || localStorage.getItem("lead_data_nascimento") || "",
      senha:    lead.senha || $("#senha")?.value || ""
    };
  }

  // ------------------------------------------------------------
  // Mostrar Pergunta
  // ------------------------------------------------------------
  function mostrarPergunta() {
    if (idx >= perguntas.length) return finalizarAnamnese();

    const p = perguntas[idx];

    gifEl.src = "./assets/gifs/" + p.gif;
    questionEl.textContent = p.texto;
    optionsEl.innerHTML = "";

    p.opcoes.forEach(opt => {
      const b = document.createElement("button");
      b.textContent = opt.texto;

      b.onclick = () => {
        p.escolha = opt.v;
        if (p.tipo === "objetivo") objetivoSelecionado = String(opt.v || "iniciar").toLowerCase();
        idx++;
        mostrarPergunta();
      };

      optionsEl.appendChild(b);
    });
  }

// ------------------------------------------------------------
// FINALIZAÇÃO DA ANAMNESE — VERSÃO FINAL (ALINHADA AO GAS)
// ------------------------------------------------------------
async function finalizarAnamnese() {

  cardQuiz.classList.add("hidden");
  cardFinal.classList.remove("hidden");

  const lang = FEMFLOW?.lang || "pt";

  finalMsgEl.textContent = {
    pt: "Analisando seu perfil…",
    en: "Analyzing your profile…",
    fr: "Analyse du profil…"
  }[lang];

  // --------------------------------------------------------
  // 1) COLETAR RESPOSTAS (12 perguntas + objetivo)
  // --------------------------------------------------------
  const respostas = {};
  let q = 1;
  perguntas.forEach((p) => {
    if (p.tipo === "objetivo") {
      objetivoSelecionado = String(p.escolha || objetivoSelecionado || "iniciar").toLowerCase();
      return;
    }
    respostas["q" + q] = Number(p.escolha ?? 0);
    q++;
  });
  const payloadAnamnese = JSON.stringify({ respostas, objetivo: objetivoSelecionado });

  const { nome, email, telefone, dataNascimento, senha } = pegarDadosLead();

  if (!nome || !email || !senha) {
    FEMFLOW.toast?.("Erro ao finalizar", true);
    return;
  }


  // --------------------------------------------------------
  // 3) LOGIN OU CADASTRO (HOTMART + NOVA ALUNA)
  // --------------------------------------------------------
  let r;
  try {
    r = await FEMFLOW.post({
      action: "loginOuCadastro",
      nome,
      email,
      telefone,
      dataNascimento,
      senha,
      objetivo: objetivoSelecionado,
      respostas: JSON.stringify(respostas),
      anamnese: payloadAnamnese,
      enviarBoasVindasTrial: true,
      lang
    });
  } catch (e) {
    console.error(e);
    FEMFLOW.toast?.("Erro de comunicação", true);
    finalMsgEl.textContent = "Erro ao concluir.";
    return;
  }

  if (!r || !(r.status === "ok" || r.status === "created") || !r.id) {
    const msg = r?.msg || "Erro ao concluir.";
    FEMFLOW.toast?.(msg, true);
    finalMsgEl.textContent = msg;
    return;
  }
 
const deviceId = FEMFLOW.getDeviceId(); // precisa ser estável (não aleatório por request)

const loginResp = await FEMFLOW.post({
  action: "login",
  email,
  senha,
  deviceId
});

if (loginResp?.status === "ok") {
  if (loginResp.deviceId && loginResp.deviceId !== deviceId) {
    localStorage.setItem("femflow_device_id", loginResp.deviceId);
  }
  FEMFLOW.setSessionToken?.(loginResp.sessionToken);
  if (loginResp.sessionExpira) {
    localStorage.setItem("femflow_session_expira", String(loginResp.sessionExpira));
  }

  try {
    const syncAuth =
      (typeof syncFirebaseAuthAccount === "function" && syncFirebaseAuthAccount) ||
      window.syncFirebaseAuthAccount;

    if (typeof syncAuth !== "function") {
      throw new ReferenceError("syncFirebaseAuthAccount is not defined");
    }

    await syncAuth(email, senha);
  } catch (firebaseErr) {
    console.error("[Anamnese] Falha ao sincronizar conta no Firebase Auth:", firebaseErr);
    FEMFLOW.toast?.("Conta criada, mas sessão Firebase falhou.", true);
    finalMsgEl.textContent = "Erro ao concluir.";
    return;
  }
} else {
  const msg = loginResp?.msg || "Erro ao concluir.";
  FEMFLOW.toast?.(msg, true);
  finalMsgEl.textContent = msg;
  return;
}


  // --------------------------------------------------------
  // 4) SALVAR IDENTIDADE LOCAL
  // --------------------------------------------------------
  localStorage.setItem("femflow_id", r.id);
  localStorage.setItem("femflow_email", email);
  const nivelBackend = String(r.nivel || loginResp?.nivel || "").toLowerCase();
  if (nivelBackend) {
    localStorage.setItem("femflow_nivel", nivelBackend);
  }
  const diaCicloBackend = r.diaCiclo ?? loginResp?.diaCiclo;
  if (diaCicloBackend !== undefined && diaCicloBackend !== null) {
    localStorage.setItem("femflow_diaCiclo", String(diaCicloBackend));
  }

  // --------------------------------------------------------
  // 5) MENSAGEM FINAL
  // --------------------------------------------------------
  const nivelFinal = (nivelBackend || "").toLowerCase();
  finalMsgEl.textContent =
    (lang === "pt" ? "Seu nível é: " :
     lang === "en" ? "Your level is: " :
     "Ton niveau est : ") + (nivelFinal || "INICIANTE").toUpperCase();

  // --------------------------------------------------------
  // 6) REDIRECIONAR PARA CICLO
  // --------------------------------------------------------
  setTimeout(() => {
    location.href = "ciclo.html";
  }, 2500);
}


  // ------------------------------------------------------------
  // Inicializar Quiz
  // ------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    perguntas = getPerguntasTraduzidas();

    window.iniciarQuizFemFlow = function(){
      idx=0;
      objetivoSelecionado = "iniciar";
      perguntas = getPerguntasTraduzidas();

if (!perguntas.length) {
  FEMFLOW.toast?.("Carregando perguntas…");
  setTimeout(() => window.iniciarQuizFemFlow?.(), 250);
  return;
}

mostrarPergunta();

    };

    if (!cardQuiz.classList.contains("hidden")) mostrarPergunta();

    document.addEventListener("femflow:langChange", () => {
      perguntas = getPerguntasTraduzidas();
      if (!cardQuiz.classList.contains("hidden")) mostrarPergunta();
    });
  });

})();
