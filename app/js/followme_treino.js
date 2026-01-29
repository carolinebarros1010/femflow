/* ============================================================
   FOLLOWME TREINO — VERSÃO FINAL 2025
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {

  const id = localStorage.getItem("femflow_id");
const coachRaw = localStorage.getItem("femflow_followme_coach");
const coach = coachRaw?.replace("followme_", "");
const sync = await FEMFLOW.post({
  action: "validar",
  id
});

const fase = sync.fase;
const diaPrograma = sync.diaPrograma;


if (!id || !coach) {
  FEMFLOW.toast("Erro: dados do FollowMe ausentes.");
  return FEMFLOW.router("flowcenter.html");
}


  // ELEMENTOS
  const tituloCoach = document.getElementById("fmCoachNome");
  const progressTxt = document.getElementById("fmProgress");
  const videoEl = document.getElementById("fmVideo");
  const modalPSE = document.getElementById("fmModalPSE");

  tituloCoach.textContent = `Treinando com ${coach}`;

 /* ============================================================
   1) PROGRESSO FOLLOWME (30 DIAS)
============================================================ */
function atualizarProgresso() {
  const dia = Math.min(diaPrograma, 30);
  document.getElementById("fmProgress").textContent =
    `Dia ${dia} de 30 — Fase: ${fase}`;
}

atualizarProgresso();

if (diaPrograma > 30) {
  FEMFLOW.toast("🎉 FollowMe concluído!");
  FEMFLOW.router("flowcenter.html");
}


  /* ============================================================
     2) DEFINIR VIDEO DO DIA (coach + fase)
  ============================================================ */
  function obterURLVideo() {
    const map = {
      "livia": {
        menstrual: ["videos/livia/menstrual1.mp4","videos/livia/menstrual2.mp4","videos/livia/menstrual3.mp4","videos/livia/menstrual4.mp4","videos/livia/menstrual5.mp4"],
        follicular: ["videos/livia/follicular1.mp4","videos/livia/follicular2.mp4","videos/livia/follicular3.mp4","videos/livia/follicular4.mp4","videos/livia/follicular5.mp4","videos/livia/follicular6.mp4","videos/livia/follicular7.mp4"],
        ovulatoria: ["videos/livia/ov1.mp4","videos/livia/ov2.mp4","videos/livia/ov3.mp4","videos/livia/ov4.mp4"],
        luteal: ["videos/livia/lut1.mp4","videos/livia/lut2.mp4","videos/livia/lut3.mp4","videos/livia/lut4.mp4","videos/livia/lut5.mp4","videos/livia/lut6.mp4","videos/livia/lut7.mp4","videos/livia/lut8.mp4","videos/livia/lut9.mp4","videos/livia/lut10.mp4","videos/livia/lut11.mp4","videos/livia/lut12.mp4","videos/livia/lut13.mp4","videos/livia/lut14.mp4"]
      }
      // adicionar Karoline / Thalita aqui
    };

    const diasFase = map[coach][fase];
    const idx = (diaPrograma - 1) % diasFase.length;
    return diasFase[idx];
  }

  const urlVideo = obterURLVideo();
  videoEl.src = urlVideo;


  /* ============================================================
     3) QUANDO O VIDEO TERMINA → ABRE MODAL PSE
  ============================================================ */
  videoEl.onended = () => {
    modalPSE.classList.remove("hidden");
  };


 /* ============================================================
   4) SALVAR PSE + AVANÇAR DIA (FOLLOWME)
============================================================ */
async function salvarTreinoFollowMe(pse) {
  try {
    const resp = await FEMFLOW.post({
      action: "salvartreino",

      id,
      fase,

      // 🔥 CONTADOR ÚNICO
      diaPrograma,
      diaFirebase: null,

      // 🔥 IDENTIFICAÇÃO
      treino: `followme_${coach}_dia_${diaPrograma}`,
      tipoTreino: "followme",
      coach,

      pse,

      // 🔐 SEGURANÇA
      deviceId: FEMFLOW.getDeviceId(),
      sessionToken: FEMFLOW.getSessionToken()
    });

    if (resp.status !== "ok") {
      FEMFLOW.toast("Erro ao salvar treino.", true);
      return;
    }

    // atualiza diaPrograma
    if (resp.diaPrograma) {
      localStorage.setItem("femflow_diaPrograma", String(resp.diaPrograma));
    }

    FEMFLOW.toast("Treino salvo! 🙌");
    FEMFLOW.router("flowcenter.html");

  } catch (e) {
    FEMFLOW.error("Erro FollowMe:", e);
    FEMFLOW.toast("Erro de conexão.", true);
  }
}

   document.querySelectorAll(".pse-val").forEach(btn => {
  btn.onclick = () => {
    const pse = Number(btn.textContent);
    salvarTreinoFollowMe(pse);
  };
});


  /* ============================================================
     5) REPLAY PERMITIDO
  ============================================================ */
  document.getElementById("fmReplayBtn").onclick = () => {
    videoEl.currentTime = 0;
    videoEl.play();
  };

  /* ============================================================
     6) VOLTAR SEM SALVAR
  ============================================================ */
  document.getElementById("fmVoltarBtn").onclick = () => {
    location.href = "followme.html";
  };

});
