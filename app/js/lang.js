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
      trocarTreino: "Trocar de treino",
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
    notifications: {
      title: "Notificações",
      openAria: "Abrir notificações",
      openAriaUnread: "Abrir notificações. {count} não lidas",
      closeAria: "Fechar notificações",
      empty: "Nenhuma notificação por aqui."
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
      trocarTreino: "Switch workout",
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
    notifications: {
      title: "Notifications",
      openAria: "Open notifications",
      openAriaUnread: "Open notifications. {count} unread",
      closeAria: "Close notifications",
      empty: "No notifications here yet."
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
      trocarTreino: "Changer d’entraînement",
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
    notifications: {
      title: "Notifications",
      openAria: "Ouvrir les notifications",
      openAriaUnread: "Ouvrir les notifications. {count} non lues",
      closeAria: "Fermer les notifications",
      empty: "Aucune notification pour le moment."
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
    trocarTreino: "Trocar de treino",
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
      bodyInsightReloginRequired: "Desculpe, precisamos que você faça login novamente para utilizar essa função.",
      bodyInsightAuth: {
        titulo: "Confirme seu login",
        subtitulo: "Para acessar o Body Insight com segurança, confirme seu e-mail e senha.",
        email: "E-mail",
        senha: "Senha",
        entrar: "Entrar",
        cancelar: "Cancelar",
        camposObrigatorios: "Informe e-mail e senha.",
        emailDivergente: "Use o mesmo e-mail da sua conta FemFlow.",
        loginInvalido: "E-mail ou senha inválidos. Tente novamente.",
        indisponivel: "Não foi possível validar o login agora.",
        avisoSeguranca: "Desculpe, precisamos confirmar seu login pois temos dados e informações pessoais"
      },
      treinosSemana: {
        titulo: "Quantos dias por semana você pretende treinar?",
        subtitulo: "Isso ajuda a identificar descanso e ausência corretamente.",
        opcao: "{n}x/semana",
        cancelar: "Agora não",
        salvar: "Salvar"
      },
      tituloMuscular:  "Treinos por ênfase",
      tituloEsportes:  "Fortalecimento Por Esportes",
      tituloCasa:      "Treinar em casa",
      tituloPlanilhas30Dias: "Planilhas 30 dias",
      tituloEbooks:    "Ebooks",
      novoProgramaModal: {
        titulo: "Quer realmente iniciar um novo programa?",
        subtitulo: "Ao confirmar, o programa atual será reiniciado.",
        notaPrefixo: "Para retomar seu treino clique em \"",
        notaDestaque: "Continue seu treino",
        notaSufixo: "\".",
        cancelar: "Não",
        confirmar: "Sim, iniciar"
      },
      customTreino: {
        titulo: "Monte seu treino",
        subtitulo: "Crie um treino sob medida hoje",
        confirmarTexto: "Deseja montar um novo treino? Isso irá zerar o dia do programa.",
        confirmar: "Confirmar",
        cancelar: "Cancelar",
        labels: {
          aquecimento: "Aquecimento",
          musculo1: "Músculo 1",
          musculo2: "Músculo 2",
          musculo3: "Músculo 3",
          resfriamento: "Resfriamento"
        },
        none: "Nenhum",
        options: {
          aquecimento_superiores: "Aquecimento superiores",
          aquecimento_inferiores: "Aquecimento inferiores",
          resfriamento_superiores: "Resfriamento superiores",
          resfriamento_inferiores: "Resfriamento inferiores",
          mobilidade: "Mobilidade",
          biceps: "Bíceps",
          triceps: "Tríceps",
          ombro: "Ombro",
          quadriceps: "Quadríceps",
          posterior: "Posteriores",
          peito: "Peito",
          costas: "Costas",
          gluteo: "Glúteo"
        }
      },
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
  treinoCustom: "Monte seu treino",
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
  treinoExtraBiceps: "Bíceps",
  treinoExtraTriceps: "Tríceps",
  treinoExtraOmbro: "Ombro",
  treinoExtraQuadriceps: "Quadríceps",
  treinoExtraPosterior: "Posteriores",
  treinoExtraPeito: "Peito",
  treinoExtraCostas: "Costas",
  treinoExtraGluteo: "Glúteo",
  treinoExtraFechar: "Fechar",

  enduranceModalTitulo: "🏃‍♂️ Defina seu Endurance",
  enduranceModalSub: "Responda para personalizarmos o seu treino de cardio.",
  enduranceModalidadeLabel: "Qual modalidade?",
  enduranceModalidadePlaceholder: "Selecione a modalidade",
  enduranceModalidadeGrupoCorrida: "Corrida",
  enduranceModalidadeGrupoOutras: "Outras modalidades",
  enduranceOptCorrida: "Corrida (geral)",
  enduranceOptCorrida5k: "Corrida 5 km",
  enduranceOptCorrida10k: "Corrida 10 km",
  enduranceOptCorrida15k: "Corrida 15 km",
  enduranceOptCorrida21k: "Corrida 21 km",
  enduranceOptCorrida42k: "Corrida 42 km",
  enduranceOptNatacao: "Natação",
  enduranceOptBike: "Bike / Ciclismo",
  enduranceOptRemo: "Remo",
  enduranceTreinosLabel: "Quantos treinos por semana?",
  enduranceDiasLabel: "Quais dias da semana?",
  enduranceRitmoLabel: "Qual ritmo médio?",
  enduranceRitmoInfo: "Minutos para cada 100m em natação, velocidade média em bike, pace em corrida.",
  enduranceRitmoPlaceholder: "Ex: 2:10/100m, 25 km/h, 5:20 min/km",
  enduranceCancelar: "Cancelar",
  enduranceSalvar: "Salvar e continuar",
  enduranceSelecaoTitulo: "🏃‍♂️ Escolha sua sessão",
  enduranceSelecaoSub: "Selecione a semana e o dia do treino que você vai realizar.",
  enduranceSelecaoSemanaLabel: "Semana",
  enduranceSelecaoDiaLabel: "Dia",
  enduranceSelecaoCancelar: "Cancelar",
  enduranceSelecaoContinuar: "Continuar",
  enduranceBloqueado: "Selecione a planilha de treinamento Endurance na Home.",

  caminhosEscolhaTitulo: "Escolha seu treino",
  caminhosUltimoTreino: "Seu último treino foi Treino {caminho}",
  caminhosSugerido: "Sugerimos Treino {caminho}",
  caminhosComparativo: "Comparativo → Sugerimos Treino {caminho}",
  caminhosFase: "Fase {fase}",
  caminhosFasePersonalAtiva: "Plano Personal ativo • Fase {fase}",
  caminhosLabel: "Treino {caminho}",
  caminhosErroCarregar: "Não foi possível carregar esse treino agora.",
  caminhosPreviewIndisponivel: "Prévia indisponível agora.",
  caminhosEscolhaObrigatoria: "Escolha um caminho para iniciar.",
  caminhosPreviewTitulo: "Treino {caminho} — Fase {fase}",
  caminhosNenhumExercicio: "Nenhum exercício encontrado para este treino.",
  caminhosFechar: "Fechar",
  caminhosMudar: "Mudar",
  caminhosIniciar: "Iniciar treino"
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
    pseHint: "PSE é sua percepção de esforço no treino (0 = muito leve, 10 = máximo).",
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
      "Complete {series} série(s) de {tempo} com {intervalo} de intervalo. Mantenha um ritmo constante.",
    descricaoRitmo:
      "Complete {series} série(s) de {tempo} com {intervalo} de intervalo. Mantenha um ritmo de {ritmo}.",
    fallbackTempo: "30 min",
    fallback:
      "Realize um cardio de {tempo} seguidos em um ritmo leve/moderado. Utilize o aparelho que mais gostas. Se academia: esteira, bicicleta, remo, escada. Se em casa: corrida, caminhada, corda, dança.",
    descricaoZona:
      "Realize o treino dentro da zona pretendida {zona}. Ajuste ritmo, inclinação e cadência para se manter na intensidade proposta.",
    seriesLabel: "Séries: {series}",
    zonaLabel: "Zona: {zona}",
    zonaTreinoLabel: "Zona de treino: {zona}",
    tempoOnlyLabel: "Tempo: {tempo}",
    distanciaLabel: "Distância: {distancia}",
    ritmoLabel: "Ritmo: {ritmo}",
    intervaloLabel: "Intervalo: {intervalo}",
    milhasLabel: "Distância (milhas): {milhas}",
    iniciar: "▶️ Iniciar cardio",
    zonas: {
      aria: "Informações sobre zonas de treino",
      fechar: "Fechar",
      label: "🫀 Zona de treino: {zona}",
      titulo: "🫀 Zonas de Treinamento",
      sub: "As zonas indicam a intensidade do seu treino e ajudam a evoluir com segurança.",
      z1Titulo: "🟢 Zona 1 — Muito leve",
      z1Texto: "Ritmo confortável. Ideal para aquecimento, recuperação e base aeróbica.",
      z2Titulo: "🟢 Zona 2 — Leve",
      z2Texto: "Respiração controlada, ainda dá para conversar. Melhora resistência e queima de gordura.",
      z3Titulo: "🟡 Zona 3 — Moderada",
      z3Texto: "Respiração mais intensa, conversa difícil. Desenvolve capacidade aeróbica.",
      z4Titulo: "🟠 Zona 4 — Forte",
      z4Texto: "Ritmo desafiador, poucas palavras por vez. Aumenta velocidade e limiar de lactato.",
      z5Titulo: "🔴 Zona 5 — Muito forte",
      z5Texto: "Esforço máximo ou quase máximo. Trabalha potência e explosão."
    }
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
    trocarTreino: "Switch workout",
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
      bodyInsightReloginRequired: "Sorry, we need you to log in again to use this feature.",
      bodyInsightAuth: {
        titulo: "Confirm your login",
        subtitulo: "To securely access Body Insight, confirm your email and password.",
        email: "Email",
        senha: "Password",
        entrar: "Login",
        cancelar: "Cancel",
        camposObrigatorios: "Enter your email and password.",
        emailDivergente: "Use the same email as your FemFlow account.",
        loginInvalido: "Invalid email or password. Please try again.",
        indisponivel: "We couldn't validate your login right now.",
        avisoSeguranca: "Sorry, we need to confirm your login because we handle personal data and information."
      },
      treinosSemana: {
        titulo: "How many days per week do you plan to train?",
        subtitulo: "This helps us correctly identify rest days and absences.",
        opcao: "{n}x/week",
        cancelar: "Not now",
        salvar: "Save"
      },
      tituloMuscular:  "Muscle focus training",
      tituloEsportes:  "Strengthening Through Sports",
      tituloCasa:      "Home training",
      tituloPlanilhas30Dias: "30-day plans",
      tituloEbooks:    "Ebooks",
      novoProgramaModal: {
        titulo: "Do you really want to start a new program?",
        subtitulo: "When you confirm, your current program will be restarted.",
        notaPrefixo: "To resume your workout, tap \"",
        notaDestaque: "Continue your workout",
        notaSufixo: "\".",
        cancelar: "No",
        confirmar: "Yes, start"
      },
      customTreino: {
        titulo: "Build your workout",
        subtitulo: "Create a workout tailored for today",
        confirmarTexto: "Do you want to build a new workout? This will reset the program day.",
        confirmar: "Confirm",
        cancelar: "Cancel",
        labels: {
          aquecimento: "Warm-up",
          musculo1: "Muscle 1",
          musculo2: "Muscle 2",
          musculo3: "Muscle 3",
          resfriamento: "Cooldown"
        },
        none: "None",
        options: {
          aquecimento_superiores: "Upper-body warm-up",
          aquecimento_inferiores: "Lower-body warm-up",
          resfriamento_superiores: "Upper-body cooldown",
          resfriamento_inferiores: "Lower-body cooldown",
          mobilidade: "Mobility",
          biceps: "Biceps",
          triceps: "Triceps",
          ombro: "Shoulders",
          quadriceps: "Quadriceps",
          posterior: "Hamstrings",
          peito: "Chest",
          costas: "Back",
          gluteo: "Glutes"
        }
      },
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
  treinoCustom: "Build your workout",
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
  treinoExtraBiceps: "Biceps",
  treinoExtraTriceps: "Triceps",
  treinoExtraOmbro: "Shoulders",
  treinoExtraQuadriceps: "Quadriceps",
  treinoExtraPosterior: "Hamstrings",
  treinoExtraPeito: "Chest",
  treinoExtraCostas: "Back",
  treinoExtraGluteo: "Glutes",
  treinoExtraFechar: "Close",

  enduranceModalTitulo: "🏃‍♂️ Set your Endurance",
  enduranceModalSub: "Answer these questions so we can personalize your cardio training.",
  enduranceModalidadeLabel: "Which modality?",
  enduranceModalidadePlaceholder: "Select a modality",
  enduranceModalidadeGrupoCorrida: "Running",
  enduranceModalidadeGrupoOutras: "Other modalities",
  enduranceOptCorrida: "Running (general)",
  enduranceOptCorrida5k: "5K Running",
  enduranceOptCorrida10k: "10K Running",
  enduranceOptCorrida15k: "15K Running",
  enduranceOptCorrida21k: "21K Running",
  enduranceOptCorrida42k: "42K Running",
  enduranceOptNatacao: "Swimming",
  enduranceOptBike: "Bike / Cycling",
  enduranceOptRemo: "Rowing",
  enduranceTreinosLabel: "How many sessions per week?",
  enduranceDiasLabel: "Which days of the week?",
  enduranceRitmoLabel: "What is your average pace?",
  enduranceRitmoInfo: "Minutes per 100m for swimming, average speed for cycling, pace for running.",
  enduranceRitmoPlaceholder: "Ex: 2:10/100m, 25 km/h, 5:20 min/km",
  enduranceCancelar: "Cancel",
  enduranceSalvar: "Save and continue",
  enduranceSelecaoTitulo: "🏃‍♂️ Choose your session",
  enduranceSelecaoSub: "Select the week and day of the workout you will do.",
  enduranceSelecaoSemanaLabel: "Week",
  enduranceSelecaoDiaLabel: "Day",
  enduranceSelecaoCancelar: "Cancel",
  enduranceSelecaoContinuar: "Continue",
  enduranceBloqueado: "Select your Endurance training plan on Home.",

  caminhosEscolhaTitulo: "Choose your workout",
  caminhosUltimoTreino: "Your last workout was Workout {caminho}",
  caminhosSugerido: "We suggest Workout {caminho}",
  caminhosComparativo: "Comparison → We suggest Workout {caminho}",
  caminhosFase: "Phase {fase}",
  caminhosFasePersonalAtiva: "Personal Plan active • Phase {fase}",
  caminhosLabel: "Workout {caminho}",
  caminhosErroCarregar: "Could not load this workout right now.",
  caminhosPreviewIndisponivel: "Preview unavailable right now.",
  caminhosEscolhaObrigatoria: "Choose a path to start.",
  caminhosPreviewTitulo: "Workout {caminho} — Phase {fase}",
  caminhosNenhumExercicio: "No exercises found for this workout.",
  caminhosFechar: "Close",
  caminhosMudar: "Change",
  caminhosIniciar: "Start workout"
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
    pseHint: "RPE is your perceived effort in the workout (0 = very easy, 10 = maximum).",
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
    "Complete {series} set(s) of {tempo} with {intervalo} of rest. Keep a steady pace.",
  descricaoRitmo:
    "Complete {series} set(s) of {tempo} with {intervalo} of rest. Keep a pace of {ritmo}.",
  fallbackTempo: "30 min",
  fallback:
    "Do {tempo} of steady cardio at a light/moderate pace. Use the equipment you like most. At the gym: treadmill, bike, rower, stairs. At home: running, walking, jump rope, dance.",
  descricaoZona:
    "Complete the workout inside target zone {zona}. Adjust pace, incline and cadence to stay within the prescribed intensity.",
  seriesLabel: "Sets: {series}",
  zonaLabel: "Zone: {zona}",
  zonaTreinoLabel: "Training zone: {zona}",
  tempoOnlyLabel: "Time: {tempo}",
  distanciaLabel: "Distance: {distancia}",
  ritmoLabel: "Pace: {ritmo}",
  intervaloLabel: "Rest: {intervalo}",
  milhasLabel: "Distance (miles): {milhas}",
  iniciar: "▶️ Start cardio",
  zonas: {
    aria: "Training zones information",
    fechar: "Close",
    label: "🫀 Training zone: {zona}",
    titulo: "🫀 Training Zones",
    sub: "Zones show your workout intensity and help you progress safely.",
    z1Titulo: "🟢 Zone 1 — Very light",
    z1Texto: "Comfortable pace. Ideal for warm-up, recovery and aerobic base.",
    z2Titulo: "🟢 Zone 2 — Light",
    z2Texto: "Controlled breathing, you can still talk. Improves endurance and fat burn.",
    z3Titulo: "🟡 Zone 3 — Moderate",
    z3Texto: "Heavier breathing, talking is hard. Develops aerobic capacity.",
    z4Titulo: "🟠 Zone 4 — Hard",
    z4Texto: "Challenging pace, only a few words at a time. Increases speed and lactate threshold.",
    z5Titulo: "🔴 Zone 5 — Very hard",
    z5Texto: "Maximum or near-maximum effort. Trains power and explosiveness."
  }
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
    trocarTreino: "Changer d’entraînement",
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
      bodyInsightReloginRequired: "Désolée, nous avons besoin que vous vous reconnectiez pour utiliser cette fonctionnalité.",
      bodyInsightAuth: {
        titulo: "Confirmez votre connexion",
        subtitulo: "Pour accéder à Body Insight en toute sécurité, confirmez votre e-mail et mot de passe.",
        email: "E-mail",
        senha: "Mot de passe",
        entrar: "Se connecter",
        cancelar: "Annuler",
        camposObrigatorios: "Renseignez l’e-mail et le mot de passe.",
        emailDivergente: "Utilisez le même e-mail que votre compte FemFlow.",
        loginInvalido: "E-mail ou mot de passe invalide. Réessayez.",
        indisponivel: "Impossible de valider la connexion pour le moment.",
        avisoSeguranca: "Désolée, nous devons confirmer votre connexion car nous traitons des données personnelles."
      },
      treinosSemana: {
        titulo: "Combien de jours par semaine prévoyez-vous de vous entraîner ?",
        subtitulo: "Cela nous aide à identifier correctement les jours de repos et les absences.",
        opcao: "{n}x/semaine",
        cancelar: "Pas maintenant",
        salvar: "Enregistrer"
      },
      tituloMuscular:  "Entraînements par groupe musculaire",
      tituloEsportes:  "Renforcement par le sport",
      tituloCasa:      "S'entraîner à la maison",
      tituloPlanilhas30Dias: "Plans 30 jours",
      tituloEbooks:    "Ebooks",
      novoProgramaModal: {
        titulo: "Voulez-vous vraiment démarrer un nouveau programme ?",
        subtitulo: "En confirmant, votre programme actuel sera réinitialisé.",
        notaPrefixo: "Pour reprendre votre entraînement, cliquez sur \"",
        notaDestaque: "Continuez votre entraînement",
        notaSufixo: "\".",
        cancelar: "Non",
        confirmar: "Oui, démarrer"
      },
      customTreino: {
        titulo: "Créez votre entraînement",
        subtitulo: "Créez un entraînement sur mesure aujourd’hui",
        confirmarTexto: "Souhaitez-vous créer un nouvel entraînement ? Cela réinitialisera le jour du programme.",
        confirmar: "Confirmer",
        cancelar: "Annuler",
        labels: {
          aquecimento: "Échauffement",
          musculo1: "Muscle 1",
          musculo2: "Muscle 2",
          musculo3: "Muscle 3",
          resfriamento: "Retour au calme"
        },
        none: "Aucun",
        options: {
          aquecimento_superiores: "Échauffement haut du corps",
          aquecimento_inferiores: "Échauffement bas du corps",
          resfriamento_superiores: "Retour au calme haut du corps",
          resfriamento_inferiores: "Retour au calme bas du corps",
          mobilidade: "Mobilité",
          biceps: "Biceps",
          triceps: "Triceps",
          ombro: "Épaules",
          quadriceps: "Quadriceps",
          posterior: "Ischio-jambiers",
          peito: "Poitrine",
          costas: "Dos",
          gluteo: "Fessiers"
        }
      },
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
  treinoCustom: "Créez votre entraînement",
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
  treinoExtraBiceps: "Biceps",
  treinoExtraTriceps: "Triceps",
  treinoExtraOmbro: "Épaules",
  treinoExtraQuadriceps: "Quadriceps",
  treinoExtraPosterior: "Ischio-jambiers",
  treinoExtraPeito: "Poitrine",
  treinoExtraCostas: "Dos",
  treinoExtraGluteo: "Fessiers",
  treinoExtraFechar: "Fermer",

  enduranceModalTitulo: "🏃‍♂️ Définissez votre Endurance",
  enduranceModalSub: "Répondez pour que nous puissions personnaliser votre entraînement cardio.",
  enduranceModalidadeLabel: "Quelle modalité ?",
  enduranceModalidadePlaceholder: "Sélectionnez une modalité",
  enduranceModalidadeGrupoCorrida: "Course",
  enduranceModalidadeGrupoOutras: "Autres modalités",
  enduranceOptCorrida: "Course (générale)",
  enduranceOptCorrida5k: "Course 5 km",
  enduranceOptCorrida10k: "Course 10 km",
  enduranceOptCorrida15k: "Course 15 km",
  enduranceOptCorrida21k: "Course 21 km",
  enduranceOptCorrida42k: "Course 42 km",
  enduranceOptNatacao: "Natation",
  enduranceOptBike: "Vélo / Cyclisme",
  enduranceOptRemo: "Rameur",
  enduranceTreinosLabel: "Combien d'entraînements par semaine ?",
  enduranceDiasLabel: "Quels jours de la semaine ?",
  enduranceRitmoLabel: "Quel est votre rythme moyen ?",
  enduranceRitmoInfo: "Minutes pour 100 m en natation, vitesse moyenne en vélo, allure en course.",
  enduranceRitmoPlaceholder: "Ex : 2:10/100m, 25 km/h, 5:20 min/km",
  enduranceCancelar: "Annuler",
  enduranceSalvar: "Enregistrer et continuer",
  enduranceSelecaoTitulo: "🏃‍♂️ Choisissez votre session",
  enduranceSelecaoSub: "Sélectionnez la semaine et le jour de l'entraînement que vous allez faire.",
  enduranceSelecaoSemanaLabel: "Semaine",
  enduranceSelecaoDiaLabel: "Jour",
  enduranceSelecaoCancelar: "Annuler",
  enduranceSelecaoContinuar: "Continuer",
  enduranceBloqueado: "Sélectionnez votre plan d'entraînement Endurance sur l'accueil.",

  caminhosEscolhaTitulo: "Choisissez votre entraînement",
  caminhosUltimoTreino: "Votre dernier entraînement était Entraînement {caminho}",
  caminhosSugerido: "Nous suggérons Entraînement {caminho}",
  caminhosComparativo: "Comparatif → Nous suggérons Entraînement {caminho}",
  caminhosFase: "Phase {fase}",
  caminhosFasePersonalAtiva: "Plan Personal actif • Phase {fase}",
  caminhosLabel: "Entraînement {caminho}",
  caminhosErroCarregar: "Impossible de charger cet entraînement pour le moment.",
  caminhosPreviewIndisponivel: "Aperçu indisponible pour le moment.",
  caminhosEscolhaObrigatoria: "Choisissez un parcours pour commencer.",
  caminhosPreviewTitulo: "Entraînement {caminho} — Phase {fase}",
  caminhosNenhumExercicio: "Aucun exercice trouvé pour cet entraînement.",
  caminhosFechar: "Fermer",
  caminhosMudar: "Changer",
  caminhosIniciar: "Commencer l’entraînement"
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
    pseHint: "Le PSE est votre perception de l'effort pendant l'entraînement (0 = très facile, 10 = maximal).",
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
    "Complétez {series} série(s) de {tempo} avec {intervalo} de repos. Gardez un rythme régulier.",
  descricaoRitmo:
    "Complétez {series} série(s) de {tempo} avec {intervalo} de repos. Gardez un rythme de {ritmo}.",
  fallbackTempo: "30 min",
  fallback:
    "Réalise {tempo} de cardio continu à un rythme léger/modéré. Utilise l’appareil que tu préfères. En salle : tapis, vélo, rameur, escaliers. À la maison : course, marche, corde à sauter, danse.",
  descricaoZona:
    "Réalisez l'entraînement dans la zone cible {zona}. Ajustez l'allure, l'inclinaison et la cadence pour rester dans l'intensité prévue.",
  seriesLabel: "Séries : {series}",
  zonaLabel: "Zone : {zona}",
  zonaTreinoLabel: "Training zone: {zona}",
  tempoOnlyLabel: "Temps : {tempo}",
  distanciaLabel: "Distance : {distancia}",
  ritmoLabel: "Rythme : {ritmo}",
  intervaloLabel: "Repos : {intervalo}",
  milhasLabel: "Distance (miles) : {milhas}",
  iniciar: "▶️ Démarrer le cardio",
  zonas: {
    aria: "Informations sur les zones d'entraînement",
    fechar: "Fermer",
    label: "🫀 Zone d'entraînement : {zona}",
    titulo: "🫀 Zones d'entraînement",
    sub: "Les zones indiquent l'intensité de votre entraînement et vous aident à progresser en sécurité.",
    z1Titulo: "🟢 Zone 1 — Très légère",
    z1Texto: "Rythme confortable. Idéal pour l'échauffement, la récupération et la base aérobie.",
    z2Titulo: "🟢 Zone 2 — Légère",
    z2Texto: "Respiration contrôlée, vous pouvez encore parler. Améliore l'endurance et la combustion des graisses.",
    z3Titulo: "🟡 Zone 3 — Modérée",
    z3Texto: "Respiration plus intense, conversation difficile. Développe la capacité aérobie.",
    z4Titulo: "🟠 Zone 4 — Forte",
    z4Texto: "Rythme exigeant, quelques mots à la fois. Augmente la vitesse et le seuil lactique.",
    z5Titulo: "🔴 Zone 5 — Très forte",
    z5Texto: "Effort maximal ou quasi maximal. Travaille la puissance et l'explosivité."
  }
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
   🧍 BODY INSIGHT (strings específicas da página)
============================================================ */
FEMFLOW.langs.pt.bodyInsight = {
  helpTrigger: "i",
  waistHelpText: "Meça a parte mais fina do abdômen, após soltar o ar.",
  hipHelpText: "Meça na parte mais larga do quadril/glúteos, fita reta.",
  waistHelpAria: "Como medir a cintura",
  hipHelpAria: "Como medir o quadril"
};

FEMFLOW.langs.en.bodyInsight = {
  helpTrigger: "info",
  waistHelpText: "Measure the narrowest point of your waist after exhaling.",
  hipHelpText: "Measure around the widest part of your hips/glutes with the tape level.",
  waistHelpAria: "How to measure the waist",
  hipHelpAria: "How to measure the hips"
};

FEMFLOW.langs.fr.bodyInsight = {
  helpTrigger: "info",
  waistHelpText: "Mesurez la partie la plus fine de la taille après avoir expiré.",
  hipHelpText: "Mesurez la partie la plus large des hanches/fessiers avec le ruban bien droit.",
  waistHelpAria: "Comment mesurer la taille",
  hipHelpAria: "Comment mesurer les hanches"
};

/* ============================================================
   🔔 SINALIZAR QUE OS IDIOMAS ESTÃO PRONTOS
============================================================ */
// Disparar após garantir carregamento completo
window.addEventListener("DOMContentLoaded", () => {
    document.dispatchEvent(new CustomEvent("femflow:langReady"));
});
