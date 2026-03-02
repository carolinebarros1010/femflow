/* ============================================================
   🌐 FEMFLOW — Sistema de Idiomas (PT + EN + FR)
   Arquivo oficial: lang.js — versão corrigida 2025
============================================================ */

window.FEMFLOW = window.FEMFLOW || {};

/* idioma inicial */
FEMFLOW.lang = localStorage.getItem("femflow_lang") || "pt";

/* ============================================================
   🔤 DICIONÁRIO CORE (MENU + SAC)
============================================================ */
window.FEMFLOW_LANG = {
  pt: {
    menu: {
      title: "Menu",
      fechar: "Fechar",
      idioma: "Idioma",
      ciclo: "Ajustar ciclo",
      respiracao: "Respiração",
      treinos: "Minha evolução",
      nivel: "Alterar nível",
      tema: "Tema",
      voltar: "Voltar",
      sair: "Sair",
      sac: "Preciso de ajuda"
    },
    nivelModal: {
      title: "Selecione seu nível",
      iniciante: "Iniciante",
      intermediaria: "Intermediária",
      avancada: "Avançada",
      confirmar: "Confirmar nível",
      fechar: "Fechar",
      selecione: "Selecione um nível"
    },

    sac: {
      title: "Preciso de ajuda",
      subtitle: "O que está acontecendo?",
      options: {
        treino: "Meu treino não está certo",
        ciclo: "Meu ciclo ou fase parece errado",
        registro: "Não consegui registrar treino",
        acesso: "Problema de acesso",
        outro: "Outro problema"
      },
      placeholder: "Explique com suas palavras (opcional)",
      enviar: "Enviar",
      cancelar: "Cancelar",
      sucesso: "Mensagem enviada com sucesso 💖",
      erro: "Erro ao enviar. Tente novamente.",
      selecione: "Selecione uma opção",
      enviando: "Enviando…"
    },

    respiracao: {
      titulo1: "Respirações",
      titulo2: "FemFlow",
      sub: "Escolha o protocolo conforme seu momento 🌿",
      preparar: "Preparar...",
      footer: "Inspire equilíbrio. Expire leveza.",
      tituloModal: "Respiração",
      grupos: {
        ciclo: "Respirações do Ciclo",
        treino: "Respirações para Treinar",
        universal: "Respirações Universais"
      },
      botoes: {
        iniciar: "Iniciar Respiração",
        voltarRespiracoes: "← voltar às respirações",
        voltarTreino: "← voltar ao treino"
      },
      fases: {
        inspire: "Inspire",
        segure: "Segure",
        expire: "Expire"
      },
      protocolos: {
        raiz: "Respiração Raiz",
        clareza: "Respiração Clareza",
        brilho: "Respiração Brilho",
        sereno: "Respiração Sereno",
        wake: "Wake Flow",
        charge: "Charge Flow",
        release: "Release Flow",
        restore: "Restore Flow",
        equilibrio: "Respiração Equilíbrio",
        transparencia: "Respiração Transparência"
      },
      descricoes: {
        raiz: "Acalma o corpo, reduz tensões e ajuda você a retornar ao eixo interno.",
        clareza: "Traz foco, leveza mental e sensação de reorganização.",
        brilho: "Eleva sua energia e presença durante fases mais fortes do ciclo.",
        sereno: "Suaviza irritabilidade, oscilações emocionais e TPM.",
        wake: "Ativa o corpo sem acelerar demais.",
        charge: "Energia imediata para treinos fortes.",
        release: "Dissolve tensões e acalma pós-treino.",
        restore: "Recupera o sistema nervoso profundamente.",
        equilibrio: "Centraliza sua mente e emoções.",
        transparencia: "Traz clareza emocional instantânea."
      }
    }
  },

  en: {
    menu: {
      title: "Menu",
      fechar: "Close",
      idioma: "Language",
      ciclo: "Adjust cycle",
      respiracao: "Breathing",
      treinos: "My Progress",
      nivel: "Change level",
      tema: "Theme",
      voltar: "Back",
      sair: "Logout",
      sac: "I need help"
    },
    nivelModal: {
      title: "Select your level",
      iniciante: "Beginner",
      intermediaria: "Intermediate",
      avancada: "Advanced",
      confirmar: "Confirm level",
      fechar: "Close",
      selecione: "Select a level"
    },

    sac: {
      title: "I need help",
      subtitle: "What is happening?",
      options: {
        treino: "My workout seems wrong",
        ciclo: "My cycle or phase seems incorrect",
        registro: "I couldn't log my workout",
        acesso: "Access or login problem",
        outro: "Other issue"
      },
      placeholder: "Explain in your own words (optional)",
      enviar: "Send",
      cancelar: "Cancel",
      sucesso: "Message sent successfully 💖",
      erro: "Error sending message. Please try again.",
      selecione: "Select an option",
      enviando: "Sending…"
    },

    respiracao: {
      titulo1: "Breathing",
      titulo2: "FemFlow",
      sub: "Choose the protocol for your moment 🌿",
      preparar: "Get ready...",
      footer: "Inhale balance. Exhale lightness.",
      tituloModal: "Breathing",
      grupos: {
        ciclo: "Cycle Breathing",
        treino: "Training Breathing",
        universal: "Universal Breathing"
      },
      botoes: {
        iniciar: "Start Breathing",
        voltarRespiracoes: "← back to breathing",
        voltarTreino: "← back to training"
      },
      fases: {
        inspire: "Inhale",
        segure: "Hold",
        expire: "Exhale"
      },
      protocolos: {
        raiz: "Root Breathing",
        clareza: "Clarity Breathing",
        brilho: "Glow Breathing",
        sereno: "Serene Breathing",
        wake: "Wake Flow",
        charge: "Charge Flow",
        release: "Release Flow",
        restore: "Restore Flow",
        equilibrio: "Balance Breathing",
        transparencia: "Transparency Breathing"
      },
      descricoes: {
        raiz: "Calms the body, reduces tension, and helps you return to your inner center.",
        clareza: "Brings focus, mental lightness, and a sense of reorganization.",
        brilho: "Boosts your energy and presence during stronger phases of the cycle.",
        sereno: "Softens irritability, emotional swings, and PMS.",
        wake: "Energizes the body without over-accelerating.",
        charge: "Immediate energy for intense training sessions.",
        release: "Dissolves tension and calms the body after training.",
        restore: "Deeply restores the nervous system.",
        equilibrio: "Centers your mind and emotions.",
        transparencia: "Brings instant emotional clarity."
      }
    }
  },

  fr: {
    menu: {
      title: "Menu",
      fechar: "Fermer",
      idioma: "Langue",
      ciclo: "Ajuster le cycle",
      respiracao: "Respiration",
      treinos: "Mon évolution",
      nivel: "Changer de niveau",
      tema: "Thème",
      voltar: "Retour",
      sair: "Déconnexion",
      sac: "J’ai besoin d’aide"
    },
    nivelModal: {
      title: "Sélectionnez votre niveau",
      iniciante: "Débutante",
      intermediaria: "Intermédiaire",
      avancada: "Avancée",
      confirmar: "Confirmer le niveau",
      fechar: "Fermer",
      selecione: "Sélectionnez un niveau"
    },

    sac: {
      title: "J’ai besoin d’aide",
      subtitle: "Que se passe-t-il ?",
      options: {
        treino: "Mon entraînement ne semble pas correct",
        ciclo: "Mon cycle ou ma phase semble incorrecte",
        registro: "Je n’ai pas pu enregistrer l’entraînement",
        acesso: "Problème d’accès",
        outro: "Autre problème"
      },
      placeholder: "Expliquez avec vos mots (facultatif)",
      enviar: "Envoyer",
      cancelar: "Annuler",
      sucesso: "Message envoyé avec succès 💖",
      erro: "Erreur lors de l’envoi. Réessayez.",
      selecione: "Sélectionnez une option",
      enviando: "Envoi…"
    },

    respiracao: {
      titulo1: "Respirations",
      titulo2: "FemFlow",
      sub: "Choisissez le protocole selon votre moment 🌿",
      preparar: "Préparez-vous...",
      footer: "Inspirez l'équilibre. Expirez la légèreté.",
      tituloModal: "Respiration",
      grupos: {
        ciclo: "Respirations du cycle",
        treino: "Respirations pour s'entraîner",
        universal: "Respirations universelles"
      },
      botoes: {
        iniciar: "Démarrer la respiration",
        voltarRespiracoes: "← revenir aux respirations",
        voltarTreino: "← revenir à l'entraînement"
      },
      fases: {
        inspire: "Inspirez",
        segure: "Retenez",
        expire: "Expirez"
      },
      protocolos: {
        raiz: "Respiration Racine",
        clareza: "Respiration Clarté",
        brilho: "Respiration Éclat",
        sereno: "Respiration Serein",
        wake: "Wake Flow",
        charge: "Charge Flow",
        release: "Release Flow",
        restore: "Restore Flow",
        equilibrio: "Respiration Équilibre",
        transparencia: "Respiration Transparence"
      },
      descricoes: {
        raiz: "Apaise le corps, réduit les tensions et vous aide à revenir à votre axe intérieur.",
        clareza: "Apporte concentration, légèreté mentale et sensation de réorganisation.",
        brilho: "Renforce votre énergie et votre présence pendant les phases plus fortes du cycle.",
        sereno: "Adoucit l'irritabilité, les variations émotionnelles et le SPM.",
        wake: "Active le corps sans l'accélérer excessivement.",
        charge: "Énergie immédiate pour les entraînements intenses.",
        release: "Dissout les tensions et calme le corps après l'entraînement.",
        restore: "Restaure profondément le système nerveux.",
        equilibrio: "Recentre votre esprit et vos émotions.",
        transparencia: "Apporte une clarté émotionnelle instantanée."
      }
    }
  }
};

/* ============================================================
   🔤 DICIONÁRIO MULTILINGUE
============================================================ */
FEMFLOW.langs = {

/* ============================================================
   🇧🇷 PORTUGUÊS
============================================================ */
pt: {
  nome: "Português",

  geral: {
    loading: "Carregando…",
    preparing: "Preparando…",
    preparingPanel: "Preparando seu painel…",
    preparingProgram: "Preparando novo programa…",
    salvar: "Salvar",
    cancelar: "Cancelar",
    voltar: "Voltar",
    faseAtual: "sua fase hormonal",
  },

  menu: {
    title: "Menu",
    fechar: "Fechar",
    idioma: "Idioma",
    sac: "Preciso de ajuda",
    ciclo: "Ajustar ciclo",
    respiracao: "Respiração",
    treinos: "Minha evolução",
    nivel: "Alterar nível",
    tema: "Tema",
    voltar: "Voltar",
    sair: "Sair"
  },
home: {
      bemvinda: "Bem-vinda",
      videoTitulo: "Como funciona o FemFlow",
      videoSub:   "Assista ao vídeo rápido antes de começar.",
      videoUrl:   "https://www.youtube.com/embed/pAifTtNF9sQ",

      botaoFlowcenter: "Continue seu treino",
      tituloPersonal:  "Personal",
      tituloFollowMe:  "Treine junto por 30 dias",
      followmeEmBreve: "Em breve...",
      tituloMuscular:  "Treinos por ênfase",
      tituloEsportes:  "Fortalecimento Por Esportes",
      tituloCasa:      "Treinar em casa",
      cards: {
        forcaabc: "Força",
        quadriceps: "Quadríceps",
        gluteos: "Glúteos",
        corrida_longa: "Corrida longa",
        casa_core_gluteo: "Glúteo e Core",
        casa_melhor_idade: "Melhor idade em casa",
        casa_queima_gordura: "Queima de Gordura",
        casa_mobilidade: "Mobilidade",
        casa_fullbody_praia: "Fullbody Praia",
        "20minemcasa": "20 min em casa",
        costas: "Costas",
        ombro: "Ombro",
        peito: "Peito",
        peitoral: "Peitoral",
        militar: "Militar",
        remo_oceanico: "Remo oceânico",
        beach_tennis: "Beach Tennis",
        jiu_jitsu: "Jiu-jítsu",
        natacao: "Natação",
        surf: "Surf",
        voleibol_quadra: "Voleibol de quadra",
        corrida_curta: "Corrida curta"
      }
    },
  flowcenter: {
  // TÍTULOS
  titulo: "Sua fase hormonal",
  faseAtual: "Sua fase hormonal",
  sub: "Seu corpo tem um ritmo único. Vamos acompanhar juntas.",

  // FASES
  menstrual: "Menstrual",
  follicular: "Folicular",
  ovulatory: "Ovulatória",
  luteal: "Lútea",

  // BOTÕES
  treino: "Treino",
  treinoExtra: "Treino extra",
  evolucao: "Evolução",
  respiracao: "Respiração",
  endurance: "Endurance",
  proximoTreino: "Programa-se",

  treinoExtraTitulo: "Treino Extra",
  treinoExtraSub: "Escolha a área que deseja focar hoje.",
  treinoExtraSuperior: "Superior",
  treinoExtraInferior: "Inferior",
  treinoExtraAbdomem: "Abdômen",
  treinoExtraMobilidade: "Mobilidade",
  treinoExtraFechar: "Fechar"
}
,

  ciclo: {
    titulo: "Identifique seu momento",
    sub: "Vamos ajustar seus treinos ao seu ciclo atual 🌸",

    regular: "Regular",
    irregular: "Irregular",
    contraceptivoHormonal: "Contraceptivo hormonal",
    contraceptivoHormonalSub: "Implante ou intramuscular trimestral",
    diu: "Uso DIU",
    menopausa: "Menopausa",

    qualDiu: "Qual tipo de DIU?",
    diuCobre: "DIU de Cobre",
    diuHormonal: "DIU Hormonal",

    ultimaMenstruacao: "Data da última menstruação",
    duracaoMedia: "Duração média (dias)",
    confirmar: "Confirmar",

    quizInicio: "Pronta?",
    sim: "Sim",
    nao: "Não",

    footer: "Essas informações servem apenas para adaptar seus treinos. 💫",

    /* 🔥 QUIZ DO CICLO */
    quizCiclo: {
      irregular: [
        "Você sentiu mudanças de energia ao longo da semana?",
        "Percebeu sensibilidade nos seios, inchaço ou retenção?",
        "Você teve oscilações emocionais sem motivo claro?",
        "Sentiu cólicas, peso abdominal ou desconforto pélvico?",
        "Você se sentiu sem vontade de treinar nos últimos dias?"
      ],
      menopausa: [
        "Nos últimos dias, você sentiu sua energia mais instável do que o normal?",
        "Você teve ondas de calor ou suor noturno?",
        "Seu humor variou muito?",
        "Seu sono ficou mais leve ou interrompido?",
        "Você tem sentido baixa disposição?"
      ],
      diuHormonal: [
        "Sua motivação para treinar caiu?",
        "Você sentiu cansaço constante?",
        "Irritabilidade ou sensibilidade emocional aumentou?",
        "Inchaço ou peso no ventre?",
        "Seu corpo parece lento ou travado?"
      ]
    }, // ← vírgula importante!
  },

  treino: {
    tituloTopo: "Treino Diário",
    tituloExtra: "Treino Extra",
    diaPrograma: "Dia do Programa",
     diaProgramaLabel: "Dia {dia}",
    extraTitulo: "Treino extra — {tipo}",
    extraLabel: "Geral",
    extraOpcoes: {
      superior: "Superior",
      inferior: "Inferior",
      abdomem: "Abdômen",
      mobilidade: "Mobilidade",
      biceps: "Bíceps",
      triceps: "Tríceps",
      ombro: "Ombro",
      quadriceps: "Quadríceps",
      posterior: "Posteriores",
      peito: "Peito",
      costas: "Costas",
      gluteo: "Glúteo"
    },
    btnSalvar: "💾 Salvar treino",
    btnCancelar: "Cancelar",
    pseTitulo: "Como foi o treino?",
    pseLabel: "PSE (0 a 10)",
    pseSalvar: "Salvar",
    pseCancelar: "Cancelar",
    proximoModal: {
      titulo: "Hoje: {diaAtual}º dia da fase {fase}",
      subtitulo: "Amanhã: {proximoDia}º dia da fase {fase}. (Dia do ciclo, não do programa.)",
      listaTitulo: "Treino de amanhã",
      vazio: "Estamos preparando o próximo treino."
    },
    tour: {
      step: "{atual}/{total}",
      salvarTitulo: "Salve seu treino",
      salvarTexto: "Ao finalizar, salve para registrar seu PSE e evolução.",
      cancelarTitulo: "Voltar ao painel",
      cancelarTexto: "Use cancelar para sair do treino e voltar ao FlowCenter.",
      next: "Próximo",
      finish: "Concluir",
      skip: "Pular"
    },
     hiit: {
    protocolo: "Protocolo {forte} / {leve}",
    descricao:
      "Execute {forte}s em alta intensidade e depois {leve}s de recuperação.",
    ciclos:
      "Repita por {ciclos} ciclos seguindo o timer abaixo.",
    exemplosAcademia:
      "Academia: esteira, bike, escada, remo, air bike",
    exemplosCasa:
      "Em casa: polichinelo, corrida parada, burpee, corda, salto no lugar",
    iniciar: "Toque para iniciar"
  },
    cardio: {
    descricao:
      "Complete {series} série(s) de {tempo} com {intervalo} de intervalo. Mantenha um ritmo confortável.",
    descricaoRitmo:
      "Complete {series} série(s) de {tempo} com {intervalo} de intervalo. Mantenha um ritmo de {ritmo} confortável.",
    fallbackTempo: "30 min",
    fallback:
      "Use este cardio como uma orientação geral e ajuste o ritmo conforme seu objetivo e condicionamento.",
    seriesLabel: "Séries: {series}",
    tempoOnlyLabel: "Tempo: {tempo}",
    distanciaLabel: "Distância: {distancia}",
    ritmoLabel: "Ritmo: {ritmo}",
    intervaloLabel: "Intervalo: {intervalo}",
    iniciar: "▶️ Iniciar cardio"
  },
     aquecimento: {
    sugestao: "💨 Sugestão: prepare seu corpo com uma respiração consciente antes de começar.",
    btn: "🌬️ Abrir protocolos de respiração"
  },

  resfriamento: {
    sugestao: "🌬️ Sugestão: finalize seu treino desacelerando com respiração suave.",
    btn: "💗 Fazer respiração de fechamento"
  }
  },
resp: {
  /* Títulos */
  titulo1: "Respiração",
  titulo2: "Protocolos para foco, relaxamento e energia",
  sub: "Respire com intenção. Modifique seu estado interno.",

  /* Grupos */
  grupoCiclo: "Do Ciclo",
  grupoTreino: "Durante o Treino",
  grupoUniversal: "Protocolos Universais",

  /* Protocolos — Grupo Ciclo */
  raiz: "Respiração Raiz",
  clareza: "Clareza Mental",
  brilho: "Brilho Interno",
  sereno: "Serenidade",

  /* Protocolos — Grupo Treino */
  wake: "Acordar",
  charge: "Carregar Energia",
  release: "Descarregar",
  restore: "Restaurar",

  /* Protocolos — Universais */
  equilibrio: "Equilíbrio",
  transparencia: "Transparência",

  /* Controles */
  preparar: "Prepare-se",
  iniciar: "Iniciar",
  parar: "Parar",
  voltarTreino: "Voltar ao treino",

  /* Footer */
  footer: "FemFlow • Respiração Consciente"
},

 evolucao: {
  titulo: "Evolução",
  sub: "Veja sua jornada de progresso",
  treino: "Treinos",
  descanso: "Dias de descanso",
  pseMedia: "PSE média",
  pseRegular: "Treino base",
  pseExtra: "Treino extra (Flow Center)",
  pseEndurance: "Treino endurance",
  faseAtual: "Fase atual",
  nenhumDado: "Nenhum dado registrado ainda."
},
   sistema: {
    cicloConfigurado: "✨ Ciclo configurado!",
    erroCiclo: "Erro ao carregar o ciclo.",
    sincronizando: "Sincronizando…",
    treinoSalvo: "Treino salvo!",
    descansoSalvo: "Descanso registrado!"
},
series: {
  T: {
    titulo: "🔗 Triset",
    texto: "Três exercícios combinados. Execute todos em sequência e descanse apenas ao final."
  },
  B: {
    titulo: "🔗 Biset",
    texto: "Dois exercícios combinados. Execute ambos em sequência e descanse apenas ao final."
  },
  Q: {
    titulo: "🔗 Quadriset",
    texto: "Quatro exercícios combinados. Execute todos em sequência e descanse apenas ao final."
  },
  C: {
    titulo: "⏱️ Cluster",
    texto: "Cada série é dividida em 4 mini-séries com pausas de 10 segundos entre elas."
  },
  I: {
    titulo: "🧊 Isometria",
    texto: "Permaneça com o músculo contraído por todo o tempo de execução."
  },
  CC: {
    titulo: "🐢 Cadência Controlada",
    texto: "Controle a fase excêntrica do movimento de forma lenta e consciente."
  },
  D: {
    titulo: "🔥 Dropset",
    texto: "Ao atingir a falha, reduza a carga 3 vezes consecutivas sem descanso."
  },
  RP: {
    titulo: "⚡ Rest-Pause",
    texto: "Na última série, após a falha, reduza 50% da carga e execute 20 repetições."
  },
  AE: {
    titulo: "👑 Advanced Elite",
    texto: "Execução livre, técnica avançada e estímulo máximo."
  },
  SM: {
    titulo: "🟢 Submáxima",
    texto: "Descanso curto para estimular o músculo em ênfase."
  }
}
},

/* ============================================================
   🇺🇸 ENGLISH
============================================================ */
en: {
  nome: "English",

  geral: {
    loading: "Loading…",
    preparing: "Preparing…",
    preparingPanel: "Preparing your dashboard…",
    preparingProgram: "Preparing new program…",
    salvar: "Save",
    cancelar: "Cancel",
    voltar: "Back",
    faseAtual: "your hormonal phase",
  },

  menu: {
    title: "Menu",
    fechar: "Close",
    idioma: "Language",
    sac: "I need help",
    ciclo: "Adjust cycle",
    respiracao: "Breathing",
    treinos: "My Progress",
    nivel: "Change level",
    tema: "Theme",
    voltar: "Back",
    sair: "Logout"
  },
home: {
      bemvinda: "Welcome",
      videoTitulo: "How FemFlow works",
      videoSub:   "Watch this quick video before you start.",
      videoUrl:   "https://www.youtube.com/embed/tOm9I6eKOj4",

      botaoFlowcenter: "Continue your workout",
      tituloPersonal:  "Personal Training",
      tituloFollowMe:  "Train together for 30 days",
      followmeEmBreve: "Coming soon...",
      tituloMuscular:  "Muscle focus training",
      tituloEsportes:  "Strengthening Through Sports",
      tituloCasa:      "Home training",
      cards: {
        forcaabc: "Strength",
        quadriceps: "Quadriceps",
        gluteos: "Glutes",
        corrida_longa: "Long run",
        casa_core_gluteo: "Glutes & Core",
        casa_melhor_idade: "Seniors at home",
        casa_queima_gordura: "Fat Burn",
        casa_mobilidade: "Mobility",
        casa_fullbody_praia: "Beach full body",
        "20minemcasa": "20 min at home",
        costas: "Back",
        ombro: "Shoulders",
        peito: "Chest",
        peitoral: "Pectorals",
        militar: "Military",
        remo_oceanico: "Ocean rowing",
        beach_tennis: "Beach Tennis",
        jiu_jitsu: "Jiu-jitsu",
        natacao: "Swimming",
        surf: "Surf",
        voleibol_quadra: "Indoor volleyball",
        corrida_curta: "Short run"
      }
    },
 flowcenter: {
  titulo: "Your hormonal phase",
  faseAtual: "Your hormonal phase",
  sub: "Your body has its own rhythm. Let's follow it together.",

  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",

  treino: "Training",
  treinoExtra: "Extra training",
  evolucao: "Progress",
  respiracao: "Breathing",
  endurance: "Endurance",
  proximoTreino: "See next workout",

  treinoExtraTitulo: "Extra Training",
  treinoExtraSub: "Choose the area you want to focus on today.",
  treinoExtraSuperior: "Upper body",
  treinoExtraInferior: "Lower body",
  treinoExtraAbdomem: "Abs",
  treinoExtraMobilidade: "Mobility",
  treinoExtraFechar: "Close"
},

  ciclo: {
    titulo: "Identify your moment",
    sub: "Let’s align your training with your current cycle 🌸",

    regular: "Regular",
    irregular: "Irregular",
    contraceptivoHormonal: "Hormonal contraceptive",
    contraceptivoHormonalSub: "Implant or quarterly intramuscular",
    diu: "IUD",
    menopausa: "Menopause",

    qualDiu: "Which IUD type?",
    diuCobre: "Copper IUD",
    diuHormonal: "Hormonal IUD",

    ultimaMenstruacao: "Last menstruation date",
    duracaoMedia: "Average length (days)",
    confirmar: "Confirm",

    quizInicio: "Ready?",
    sim: "Yes",
    nao: "No",

    footer: "These inputs are used only to adapt your workouts. 💫",

    quizCiclo: {
      irregular: [
        "Did you feel energy changes throughout the week?",
        "Did you notice breast sensitivity, bloating, or water retention?",
        "Did your emotions fluctuate without a clear reason?",
        "Did you feel cramps or pelvic discomfort?",
        "Did you feel unmotivated to train recently?"
      ],
      menopausa: [
        "Has your energy been unstable recently?",
        "Any hot flashes or night sweats?",
        "Was your mood unstable?",
        "Has your sleep been lighter or interrupted?",
        "Have you felt low disposition?"
      ],
      diuHormonal: [
        "Has your motivation to train dropped?",
        "Have you felt persistent fatigue?",
        "Has irritability increased?",
        "Have you felt bloating or abdominal heaviness?",
        "Does your body feel slow?"
      ]
    }, // ← vírgula CORRIGIDA
  },

  treino: {
    tituloTopo: "Daily Workout",
    tituloExtra: "Extra Workout",
    diaPrograma: "Program Day",
   diaProgramaLabel: "Day {dia}",
    extraTitulo: "Extra workout — {tipo}",
    extraLabel: "General",
    extraOpcoes: {
      superior: "Upper body",
      inferior: "Lower body",
      abdomem: "Abs",
      mobilidade: "Mobility",
      biceps: "Biceps",
      triceps: "Triceps",
      ombro: "Shoulders",
      quadriceps: "Quadriceps",
      posterior: "Hamstrings",
      peito: "Chest",
      costas: "Back",
      gluteo: "Glutes"
    },
    btnSalvar: "💾 Save workout",
    btnCancelar: "Cancel",
    pseTitulo: "How was the workout?",
    pseLabel: "RPE (0 to 10)",
    pseSalvar: "Save",
    pseCancelar: "Cancel",
    proximoModal: {
      titulo: "Today: Day {diaAtual} of the {fase} phase",
      subtitulo: "Tomorrow: Day {proximoDia} of the {fase} phase. (Cycle day, not program day.)",
      listaTitulo: "Tomorrow's workout",
      vazio: "We are preparing the next workout."
    },
    tour: {
      step: "{atual}/{total}",
      salvarTitulo: "Save your workout",
      salvarTexto: "When you finish, save it to record your RPE and progress.",
      cancelarTitulo: "Back to the panel",
      cancelarTexto: "Use cancel to leave the workout and return to FlowCenter.",
      next: "Next",
      finish: "Done",
      skip: "Skip"
    },
     hiit: {
  protocolo: "{forte} / {leve} Protocol",
  descricao:
    "Perform {forte}s at high intensity followed by {leve}s of recovery.",
  ciclos:
    "Repeat for {ciclos} cycles using the timer below.",
  exemplosAcademia:
    "Gym: treadmill, bike, stairs, rower, air bike",
  exemplosCasa:
    "At home: jumping jacks, running in place, burpees, rope, jumps",
  iniciar: "Tap to start"
},
    cardio: {
  descricao:
    "Complete {series} set(s) of {tempo} with {intervalo} of rest. Keep a comfortable pace.",
  descricaoRitmo:
    "Complete {series} set(s) of {tempo} with {intervalo} of rest. Keep a comfortable pace of {ritmo}.",
  fallbackTempo: "30 min",
  fallback:
    "Do 30 minutes of steady cardio at a light/moderate pace. Use the equipment you like most. At the gym: treadmill, bike, rower, stairs. At home: running, walking, jump rope, dance.",
  seriesLabel: "Sets: {series}",
  tempoOnlyLabel: "Time: {tempo}",
  distanciaLabel: "Distance: {distancia}",
  ritmoLabel: "Pace: {ritmo}",
  intervaloLabel: "Rest: {intervalo}",
  iniciar: "▶️ Start cardio"
},
  aquecimento: {
    sugestao: "💨 Tip: prepare your body with conscious breathing before you start.",
    btn: "🌬️ Open breathing protocols"
  },

  resfriamento: {
    sugestao: "🌬️ Tip: finish your workout by slowing down with gentle breathing.",
    btn: "💗 Do a closing breathing"
  }   
  },
resp: {
  /* Titles */
  titulo1: "Breathing",
  titulo2: "Choose your protocol",
  sub: "Regulate your internal state through intentional breathing.",

  /* Groups */
  grupoCiclo: "Cycle-Based",
  grupoTreino: "Training-Based",
  grupoUniversal: "Universal Protocols",

  /* Cycle Protocols */
  raiz: "Root Breath",
  clareza: "Mental Clarity",
  brilho: "Inner Shine",
  sereno: "Serenity",

  /* Training Protocols */
  wake: "Wake Up",
  charge: "Charge",
  release: "Release",
  restore: "Restore",

  /* Universal */
  equilibrio: "Balance",
  transparencia: "Transparency",

  /* Controls */
  preparar: "Get Ready",
  iniciar: "Start",
  parar: "Stop",
  voltarTreino: "Back to Workout",

  /* Footer */
  footer: "FemFlow • Conscious Breathing"
},

 evolucao: {
  titulo: "Evolution",
  sub: "Track your progress journey",
  treino: "Workouts",
  descanso: "Rest days",
  pseMedia: "Average RPE",
  pseRegular: "Base workout",
  pseExtra: "Extra workout (Flow Center)",
  pseEndurance: "Endurance workout",
  faseAtual: "Current phase",
  nenhumDado: "No data recorded yet."
},

  sistema: {
    cicloConfigurado: "✨ Cycle configured!",
    erroCiclo: "Error loading cycle.",
    sincronizando: "Synchronizing…",
    treinoSalvo: "Workout saved!",
    descansoSalvo: "Rest day registered!"
  },
series: {
  T: {
    titulo: "🔗 Triset",
    texto: "Three exercises performed in sequence. Rest only after completing all."
  },
  B: {
    titulo: "🔗 Biset",
    texto: "Two exercises performed in sequence. Rest only at the end."
  },
  Q: {
    titulo: "🔗 Quadriset",
    texto: "Four exercises performed in sequence. Rest only after completing all."
  },
  C: {
    titulo: "⏱️ Cluster",
    texto: "Each set is divided into 4 mini-sets with 10-second pauses."
  },
  I: {
    titulo: "🧊 Isometric",
    texto: "Keep the muscle contracted for the entire execution time."
  },
  CC: {
    titulo: "🐢 Controlled Tempo",
    texto: "Slow and controlled eccentric phase."
  },
  D: {
    titulo: "🔥 Dropset",
    texto: "After failure, reduce load 3 consecutive times without rest."
  },
  RP: {
    titulo: "⚡ Rest-Pause",
    texto: "On the last set, after failure, reduce load by 50% and perform 20 reps."
  },
  AE: {
    titulo: "👑 Advanced Elite",
    texto: "Free execution, advanced technique and maximum stimulus."
  },
  SM: {
    titulo: "🟢 Submaximal",
    texto: "Short rest intervals to emphasize the target muscle."
  }
}
   
},

/* ============================================================
   🇫🇷 FRANÇAIS
============================================================ */
fr: {
  nome: "Français",

  geral: {
    loading: "Chargement…",
    preparing: "Préparation…",
    preparingPanel: "Préparation de votre tableau de bord…",
    preparingProgram: "Préparation d’un nouveau programme…",
    salvar: "Enregistrer",
    cancelar: "Annuler",
    voltar: "Retour",
    faseAtual: "votre phase hormonale",
  },

  menu: {
    title: "Menu",
    fechar: "Fermer",
    idioma: "Langue",
    sac: "J’ai besoin d’aide",
    ciclo: "Ajuster le cycle",
    respiracao: "Respiration",
    treinos: "Mon évolution",
    nivel: "Changer de niveau",
    tema: "Thème",
    voltar: "Retour",
    sair: "Déconnexion"
  },
 home: {
      bemvinda: "Bienvenue",
      videoTitulo: "Comment fonctionne FemFlow",
      videoSub:   "Regardez cette vidéo avant de commencer.",
      videoUrl:   "https://www.youtube.com/embed/2N9Lf3dSGpo",

      botaoFlowcenter: "Continuez votre entraînement",
      tituloPersonal:  "Personal",
      tituloFollowMe:  "Entraînez-vous pendant 30 jours",
      followmeEmBreve: "Bientôt...",
      tituloMuscular:  "Entraînements par groupe musculaire",
      tituloEsportes:  "Renforcement par le sport",
      tituloCasa:      "S'entraîner à la maison",
      cards: {
        forcaabc: "Force",
        quadriceps: "Quadriceps",
        gluteos: "Fessiers",
        corrida_longa: "Course longue",
        casa_core_gluteo: "Fessiers et core",
        casa_melhor_idade: "Seniors à la maison",
        casa_queima_gordura: "Brûle-graisse",
        casa_mobilidade: "Mobilité",
        casa_fullbody_praia: "Full body plage",
        "20minemcasa": "20 min à la maison",
        costas: "Dos",
        ombro: "Épaules",
        peito: "Poitrine",
        peitoral: "Pectoraux",
        militar: "Militaire",
        remo_oceanico: "Aviron océanique",
        beach_tennis: "Beach Tennis",
        jiu_jitsu: "Jiu-jitsu",
        natacao: "Natation",
        surf: "Surf",
        voleibol_quadra: "Volley-ball en salle",
        corrida_curta: "Course courte"
      }
    },
  flowcenter: {
  titulo: "Votre phase hormonale",
  faseAtual: "Votre phase hormonale",
  sub: "Votre corps a son propre rythme. Suivons-le ensemble.",

  menstrual: "Menstruelle",
  follicular: "Folliculaire",
  ovulatory: "Ovulatoire",
  luteal: "Lutéale",

  treino: "Entraînement",
  treinoExtra: "Entraînement extra",
  evolucao: "Évolution",
  respiracao: "Respiration",
  endurance: "Endurance",
  proximoTreino: "Voir le prochain entraînement",

  treinoExtraTitulo: "Entraînement extra",
  treinoExtraSub: "Choisissez la zone que vous souhaitez travailler aujourd’hui.",
  treinoExtraSuperior: "Haut du corps",
  treinoExtraInferior: "Bas du corps",
  treinoExtraAbdomem: "Abdos",
  treinoExtraMobilidade: "Mobilité",
  treinoExtraFechar: "Fermer"
},

  ciclo: {
    titulo: "Identifiez votre moment",
    sub: "Ajustons vos entraînements à votre cycle 🌸",

    regular: "Régulier",
    irregular: "Irrégulier",
    contraceptivoHormonal: "Contraceptif hormonal",
    contraceptivoHormonalSub: "Implant ou intramusculaire trimestrielle",
    diu: "DIU",
    menopausa: "Ménopause",

    qualDiu: "Quel type de DIU ?",
    diuCobre: "DIU au cuivre",
    diuHormonal: "DIU hormonal",

    ultimaMenstruacao: "Date des dernières règles",
    duracaoMedia: "Durée moyenne (jours)",
    confirmar: "Confirmer",

    quizInicio: "Prête ?",
    sim: "Oui",
    nao: "Non",

    footer: "Ces informations servent uniquement à adapter vos entraînements. 💫",

    quizCiclo: {
      irregular: [
        "Avez-vous ressenti des variations d'énergie cette semaine ?",
        "Avez-vous remarqué une sensibilité des seins ou une rétention d'eau ?",
        "Vos émotions ont-elles fluctué sans raison ?",
        "Avez-vous ressenti des crampes ou un inconfort pelvien ?",
        "Vous êtes-vous sentie démotivée à vous entraîner ?"
      ],
      menopausa: [
        "Votre énergie a-t-elle été instable ?",
        "Avez-vous eu des bouffées de chaleur ?",
        "Votre humeur était-elle instable ?",
        "Votre sommeil a-t-il été perturbé ?",
        "Avez-vous ressenti une faible disposition ?"
      ],
      diuHormonal: [
        "Votre motivation a-t-elle diminué ?",
        "Avez-vous ressenti une fatigue constante ?",
        "Votre sensibilité émotionnelle a-t-elle augmenté ?",
        "Avez-vous ressenti un gonflement abdominal ?",
        "Votre corps semble-t-il lent ?"
      ]
    }, // ← vírgula corrigida!
  },

  treino: {
    tituloTopo: "Entraînement du jour",
    tituloExtra: "Entraînement extra",
    diaPrograma: "Jour du programme",
     diaProgramaLabel: "Jour {dia}",
    extraTitulo: "Entraînement extra — {tipo}",
    extraLabel: "Général",
    extraOpcoes: {
      superior: "Haut du corps",
      inferior: "Bas du corps",
      abdomem: "Abdos",
      mobilidade: "Mobilité",
      biceps: "Biceps",
      triceps: "Triceps",
      ombro: "Épaules",
      quadriceps: "Quadriceps",
      posterior: "Ischio-jambiers",
      peito: "Poitrine",
      costas: "Dos",
      gluteo: "Fessiers"
    },
    btnSalvar: "💾 Enregistrer l’entraînement",
    btnCancelar: "Annuler",
    pseTitulo: "Comment était l'entraînement ?",
    pseLabel: "PSE (0 à 10)",
    pseSalvar: "Enregistrer",
    pseCancelar: "Annuler",
    proximoModal: {
      titulo: "Aujourd’hui : {diaAtual}e jour de la phase {fase}",
      subtitulo: "Demain : {proximoDia}e jour de la phase {fase}. (Jour du cycle, pas du programme.)",
      listaTitulo: "Entraînement de demain",
      vazio: "Nous préparons le prochain entraînement."
    },
    tour: {
      step: "{atual}/{total}",
      salvarTitulo: "Enregistrez votre entraînement",
      salvarTexto: "À la fin, enregistrez pour noter votre PSE et votre progression.",
      cancelarTitulo: "Retour au tableau",
      cancelarTexto: "Utilisez annuler pour quitter l’entraînement et revenir au FlowCenter.",
      next: "Suivant",
      finish: "Terminer",
      skip: "Ignorer"
    },
    hiit: {
  protocolo: "Protocole {forte} / {leve}",
  descricao:
    "Effectuez {forte}s à haute intensité puis {leve}s de récupération.",
  ciclos:
    "Répétez pendant {ciclos} cycles en suivant le minuteur ci-dessous.",
  exemplosAcademia:
    "Salle: tapis, vélo, escaliers, rameur, air bike",
  exemplosCasa:
    "À la maison: jumping jacks, course sur place, burpees, corde, sauts",
  iniciar: "Touchez pour commencer"
},
    cardio: {
  descricao:
    "Complétez {series} série(s) de {tempo} avec {intervalo} de repos. Gardez un rythme confortable.",
  descricaoRitmo:
    "Complétez {series} série(s) de {tempo} avec {intervalo} de repos. Gardez un rythme confortable de {ritmo}.",
  fallbackTempo: "30 min",
  fallback:
    "Réalise 30 min de cardio continu à un rythme léger/modéré. Utilise l’appareil que tu préfères. En salle : tapis, vélo, rameur, escaliers. À la maison : course, marche, corde à sauter, danse.",
  seriesLabel: "Séries : {series}",
  tempoOnlyLabel: "Temps : {tempo}",
  distanciaLabel: "Distance : {distancia}",
  ritmoLabel: "Rythme : {ritmo}",
  intervaloLabel: "Repos : {intervalo}",
  iniciar: "▶️ Démarrer le cardio"
},
   aquecimento: {
    sugestao: "💨 Astuce : prépare ton corps avec une respiration consciente avant de commencer.",
    btn: "🌬️ Ouvrir les protocoles de respiration"
  },

  resfriamento: {
    sugestao: "🌬️ Astuce : termine ton entraînement en ralentissant avec une respiration douce.",
    btn: "💗 Faire une respiration de fin"
  }   
 
  },
resp: {
  /* Titres */
  titulo1: "Respiration",
  titulo2: "Choisissez votre protocole",
  sub: "Régulez votre état interne grâce à la respiration consciente.",

  /* Groupes */
  grupoCiclo: "Selon le cycle",
  grupoTreino: "Pour l'entraînement",
  grupoUniversal: "Protocoles universels",

  /* Protocoles – Cycle */
  raiz: "Respiration Racine",
  clareza: "Clarté Mentale",
  brilho: "Éclat Intérieur",
  sereno: "Sérénité",

  /* Protocoles – Entraînement */
  wake: "Réveil",
  charge: "Charger l'énergie",
  release: "Relâcher",
  restore: "Restaurer",

  /* Protocoles universels */
  equilibrio: "Équilibre",
  transparencia: "Transparence",

  /* Contrôles */
  preparar: "Préparez-vous",
  iniciar: "Démarrer",
  parar: "Arrêter",
  voltarTreino: "Retour à l'entraînement",

  /* Footer */
  footer: "FemFlow • Respiration Consciente"
},

 evolucao: {
  titulo: "Évolution",
  sub: "Suivez votre parcours de progression",
  treino: "Entraînements",
  descanso: "Jours de repos",
  pseMedia: "PSE moyen",
  pseRegular: "Entraînement de base",
  pseExtra: "Entraînement extra (Flow Center)",
  pseEndurance: "Entraînement endurance",
  faseAtual: "Phase actuelle",
  nenhumDado: "Aucune donnée enregistrée."
},
  sistema: {
    cicloConfigurado: "✨ Cycle configuré !",
    erroCiclo: "Erreur lors du chargement du cycle.",
    sincronizando: "Synchronisation…",
    treinoSalvo: "Entraînement enregistré !",
    descansoSalvo: "Repos enregistré !"
  },
  series: {
  T: {
    titulo: "🔗 Triset",
    texto: "Trois exercices enchaînés. Repos uniquement à la fin."
  },
  B: {
    titulo: "🔗 Biset",
    texto: "Deux exercices enchaînés. Repos uniquement à la fin."
  },
  Q: {
    titulo: "🔗 Quadriset",
    texto: "Quatre exercices enchaînés. Repos uniquement à la fin."
  },
  C: {
    titulo: "⏱️ Cluster",
    texto: "Chaque série est divisée en 4 mini-séries avec 10 secondes de pause."
  },
  I: {
    titulo: "🧊 Isométrie",
    texto: "Gardez le muscle contracté pendant toute la durée d'exécution."
  },
  CC: {
    titulo: "🐢 Cadence contrôlée",
    texto: "Phase excentrique lente et contrôlée."
  },
  D: {
    titulo: "🔥 Dropset",
    texto: "Après l’échec, réduisez la charge 3 fois sans repos."
  },
  RP: {
    titulo: "⚡ Rest-Pause",
    texto: "À la dernière série, après l’échec, réduisez la charge de 50 % et effectuez 20 répétitions."
  },
  AE: {
    titulo: "👑 Advanced Elite",
    texto: "Exécution libre, technique avancée et stimulus maximal."
  },
  SM: {
    titulo: "🟢 Submaximale",
    texto: "Repos courts pour stimuler le muscle ciblé."
  }
}
 }


};

/* ============================================================
   🔔 SINALIZAR QUE OS IDIOMAS ESTÃO PRONTOS
============================================================ */
// Disparar após garantir carregamento completo
window.addEventListener("DOMContentLoaded", () => {
    document.dispatchEvent(new CustomEvent("femflow:langReady"));
});
